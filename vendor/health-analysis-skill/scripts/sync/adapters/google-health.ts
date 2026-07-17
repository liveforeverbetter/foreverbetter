/**
 * Google Health Export Adapter
 *
 * Parses the three-CSV export from Google Takeout / Google Fit:
 *   Activity.csv  — steps, distance, calories, walking sessions
 *   Sleep.csv     — sleep sessions with stage breakdown
 *   Vitals.csv    — heart rate, HRV, SpO2, respiratory rate, resting HR
 *
 * Usage:
 *   import { parseGoogleHealthExport } from './adapters/google-health.js';
 *   const days = parseGoogleHealthExport('/path/to/export/dir');
 *
 * The export directory should contain the three CSV files directly.
 * Files can also be passed individually via options.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { NormalizedDay, WearableMetrics } from '../types.js';

// ── Public API ────────────────────────────────────────────────────────────────

export interface GoogleHealthExportOptions {
  activityFile?: string;
  sleepFile?: string;
  vitalsFile?: string;
}

/**
 * Auto-detects whether `dir` is a Google Fit Takeout export (contains
 * Takeout/Fit/Daily activity metrics/) or a Google Health three-CSV export
 * (contains Activity.csv / Sleep.csv / Vitals.csv) and dispatches accordingly.
 */
export function parseGoogleExport(dir: string): NormalizedDay[] {
  const fitMetricsPath = path.join(dir, 'Takeout', 'Fit', 'Daily activity metrics', 'Daily activity metrics.csv');
  if (fs.existsSync(fitMetricsPath)) return parseGoogleFitTakeout(dir);
  return parseGoogleHealthExport(dir);
}

/** Parse a Google Fit Takeout export directory (Takeout/Fit/ structure). */
export function parseGoogleFitTakeout(dir: string): NormalizedDay[] {
  const fitRoot = path.join(dir, 'Takeout', 'Fit');
  const dailyPath = path.join(fitRoot, 'Daily activity metrics', 'Daily activity metrics.csv');
  const sessionsDir = path.join(fitRoot, 'All Sessions');

  const activityMap = fs.existsSync(dailyPath) ? parseFitDailyMetrics(dailyPath) : new Map<string, Partial<WearableMetrics>>();
  const sleepMap = fs.existsSync(sessionsDir) ? parseFitSleepSessions(sessionsDir) : new Map<string, Partial<WearableMetrics>>();

  const allDates = new Set([...activityMap.keys(), ...sleepMap.keys()]);
  const days: NormalizedDay[] = [];

  for (const date of [...allDates].sort()) {
    const metrics: Partial<WearableMetrics> = {
      ...activityMap.get(date),
      ...sleepMap.get(date),
    };
    if (Object.keys(metrics).length > 0) {
      days.push({ date, platform: 'google-health', metrics });
    }
  }

  return days;
}

export function parseGoogleHealthExport(
  dir: string,
  opts?: GoogleHealthExportOptions,
): NormalizedDay[] {
  const activityPath = opts?.activityFile ?? path.join(dir, 'Activity.csv');
  const sleepPath = opts?.sleepFile ?? path.join(dir, 'Sleep.csv');
  const vitalsPath = opts?.vitalsFile ?? path.join(dir, 'Vitals.csv');

  const activityMap = fs.existsSync(activityPath) ? parseActivity(activityPath) : new Map<string, Partial<WearableMetrics>>();
  const sleepMap = fs.existsSync(sleepPath) ? parseSleep(sleepPath) : new Map<string, Partial<WearableMetrics>>();
  const vitalsMap = fs.existsSync(vitalsPath) ? parseVitals(vitalsPath) : new Map<string, Partial<WearableMetrics>>();

  const allDates = new Set([...activityMap.keys(), ...sleepMap.keys(), ...vitalsMap.keys()]);
  const days: NormalizedDay[] = [];

  for (const date of [...allDates].sort()) {
    const metrics: Partial<WearableMetrics> = {
      ...activityMap.get(date),
      ...sleepMap.get(date),
      ...vitalsMap.get(date),
    };
    if (Object.keys(metrics).length > 0) {
      days.push({ date, platform: 'google-health', metrics });
    }
  }

  return days;
}

// ── Activity ──────────────────────────────────────────────────────────────────
// Multiple rows per date from different sources; strategy:
//   steps          — max across all sources (android aggregate is sometimes lower than Fit)
//   distance_m     — from com.google.android.apps.fitness (has actual GPS distance)
//   active_calories — from android source (total calories) minus a BMR estimate isn't available,
//                     so we use active_calories when present, else 0
//   total_calories — from android source

function parseActivity(filePath: string): Map<string, Partial<WearableMetrics>> {
  const rows = readCSV(filePath);
  // date → accumulated aggregates
  const byDate = new Map<string, {
    maxSteps: number;
    distanceM: number;
    activeCal: number;
    totalCal: number;
  }>();

  for (const row of rows) {
    const date = row['Date']?.slice(0, 10);
    if (!date) continue;

    const steps = num(row['Steps']);
    const distM = num(row['Distance (m)']);
    const activeCal = num(row['Active Calories (kcal)']);
    const totalCal = num(row['Total Calories (kcal)']);

    const cur = byDate.get(date) ?? { maxSteps: 0, distanceM: 0, activeCal: 0, totalCal: 0 };

    if (steps != null && steps > cur.maxSteps) cur.maxSteps = steps;
    if (distM != null && distM > cur.distanceM) cur.distanceM = distM;
    if (activeCal != null && activeCal > cur.activeCal) cur.activeCal = activeCal;
    if (totalCal != null && totalCal > cur.totalCal) cur.totalCal = totalCal;

    byDate.set(date, cur);
  }

  const result = new Map<string, Partial<WearableMetrics>>();
  for (const [date, agg] of byDate) {
    const metrics: Partial<WearableMetrics> = {};
    if (agg.maxSteps > 0) metrics.steps = agg.maxSteps;
    if (agg.distanceM > 0) metrics.walking_distance_m = agg.distanceM;
    if (agg.activeCal > 0) metrics.active_calories = agg.activeCal;
    result.set(date, metrics);
  }
  return result;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────
// Multiple sessions per date (night + morning nap).
// Google exports the date as the WAKE date, which is the right anchor.
// Stage data (light/deep/REM) is often zero from some sources; total duration from timestamps.

function parseSleep(filePath: string): Map<string, Partial<WearableMetrics>> {
  const rows = readCSV(filePath);
  const byDate = new Map<string, { totalMin: number; deepMin: number; remMin: number; lightMin: number; awakeMin: number }>();

  for (const row of rows) {
    const date = row['Date']?.slice(0, 10);
    if (!date) continue;

    const startStr = row['Start Time'];
    const endStr = row['End Time'];
    const lightMin = num(row['Light Sleep (min)']) ?? 0;
    const deepMin = num(row['Deep Sleep (min)']) ?? 0;
    const remMin = num(row['REM Sleep (min)']) ?? 0;
    const awakeMin = num(row['Awake (min)']) ?? 0;

    // Derive total duration from timestamps when stage data is zero
    let durationMin = lightMin + deepMin + remMin + awakeMin;
    if (durationMin === 0 && startStr && endStr) {
      const start = new Date(startStr.replace(' ', 'T') + 'Z');
      const end = new Date(endStr.replace(' ', 'T') + 'Z');
      durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const cur = byDate.get(date) ?? { totalMin: 0, deepMin: 0, remMin: 0, lightMin: 0, awakeMin: 0 };
    cur.totalMin += durationMin;
    cur.deepMin += deepMin;
    cur.remMin += remMin;
    cur.lightMin += lightMin;
    cur.awakeMin += awakeMin;
    byDate.set(date, cur);
  }

  const result = new Map<string, Partial<WearableMetrics>>();
  for (const [date, agg] of byDate) {
    const metrics: Partial<WearableMetrics> = {};
    const sleepMin = agg.totalMin - agg.awakeMin;
    if (agg.totalMin > 0) metrics.time_in_bed_min = agg.totalMin;
    if (sleepMin > 0) metrics.total_sleep_min = sleepMin;
    if (agg.deepMin > 0) metrics.deep_sleep_min = agg.deepMin;
    if (agg.remMin > 0) metrics.rem_sleep_min = agg.remMin;
    if (agg.totalMin > 0 && sleepMin > 0) {
      metrics.sleep_efficiency_pct = Math.round((sleepMin / agg.totalMin) * 100);
    }
    result.set(date, metrics);
  }
  return result;
}

// ── Vitals ────────────────────────────────────────────────────────────────────
// Multiple rows per date from different sources.
// We average the 'avg' columns across sources that have data.

function parseVitals(filePath: string): Map<string, Partial<WearableMetrics>> {
  const rows = readCSV(filePath);
  const byDate = new Map<string, {
    hrAvgs: number[]; hrMin: number | null; hrMax: number | null;
    hrvAvgs: number[];
    spo2Avgs: number[];
    rrAvgs: number[];
    restingHRAvgs: number[];
  }>();

  for (const row of rows) {
    const date = row['Date']?.slice(0, 10);
    if (!date) continue;

    const cur = byDate.get(date) ?? {
      hrAvgs: [], hrMin: null, hrMax: null,
      hrvAvgs: [], spo2Avgs: [], rrAvgs: [], restingHRAvgs: [],
    };

    const hrAvg = num(row['Heart rate avg (bpm)']);
    const hrMin = num(row['Heart rate min (bpm)']);
    const hrMax = num(row['Heart rate max (bpm)']);
    const hrvAvg = num(row['Heart rate variability avg (ms)']);
    const spo2Avg = num(row['Oxygen saturation avg (%)']);
    const rrAvg = num(row['Respiratory rate avg (breaths/min)']);
    const restingAvg = num(row['Resting heart rate avg (bpm)']);

    if (hrAvg != null) cur.hrAvgs.push(hrAvg);
    if (hrMin != null && (cur.hrMin === null || hrMin < cur.hrMin)) cur.hrMin = hrMin;
    if (hrMax != null && (cur.hrMax === null || hrMax > cur.hrMax)) cur.hrMax = hrMax;
    if (hrvAvg != null) cur.hrvAvgs.push(hrvAvg);
    if (spo2Avg != null) cur.spo2Avgs.push(spo2Avg);
    if (rrAvg != null) cur.rrAvgs.push(rrAvg);
    if (restingAvg != null) cur.restingHRAvgs.push(restingAvg);

    byDate.set(date, cur);
  }

  const result = new Map<string, Partial<WearableMetrics>>();
  for (const [date, agg] of byDate) {
    const metrics: Partial<WearableMetrics> = {};
    if (agg.hrAvgs.length > 0) metrics.avg_heart_rate = Math.round(avg(agg.hrAvgs));
    if (agg.hrMin !== null) metrics.avg_heart_rate = metrics.avg_heart_rate ?? Math.round(agg.hrMin);
    if (agg.hrMax !== null) metrics.max_heart_rate = Math.round(agg.hrMax);
    if (agg.hrvAvgs.length > 0) metrics.hrv_ms = Math.round(avg(agg.hrvAvgs));
    if (agg.spo2Avgs.length > 0) metrics.spo2_pct = parseFloat(avg(agg.spo2Avgs).toFixed(1));
    if (agg.rrAvgs.length > 0) metrics.respiratory_rate = parseFloat(avg(agg.rrAvgs).toFixed(1));
    if (agg.restingHRAvgs.length > 0) metrics.resting_heart_rate = Math.round(avg(agg.restingHRAvgs));
    result.set(date, metrics);
  }
  return result;
}

// ── Google Fit Takeout parsers ────────────────────────────────────────────────

/**
 * Parse "Daily activity metrics.csv" from Google Fit Takeout.
 * Columns: Date, Move Minutes count, Calories (kcal), Distance (m),
 *   Heart Points, Heart Minutes, Average heart rate (bpm), Max heart rate (bpm),
 *   Min heart rate (bpm), Average oxygen saturation (%), ...,
 *   Step count, Average weight (kg), ..., Walking duration (ms), Running duration (ms)
 */
function parseFitDailyMetrics(filePath: string): Map<string, Partial<WearableMetrics>> {
  const rows = readCSV(filePath);
  const result = new Map<string, Partial<WearableMetrics>>();

  for (const row of rows) {
    const date = row['Date']?.slice(0, 10);
    if (!date) continue;

    const metrics: Partial<WearableMetrics> = {};

    const steps = num(row['Step count']);
    if (steps != null && steps > 0) metrics.steps = Math.round(steps);

    const distM = num(row['Distance (m)']);
    if (distM != null && distM > 0) metrics.walking_distance_m = distM;

    // Calories in Fit Takeout is total (BMR + active). We store as active_calories
    // since there's no separate active field; it's close enough for trending.
    const calories = num(row['Calories (kcal)']);
    if (calories != null && calories > 0) metrics.active_calories = Math.round(calories);

    const avgHR = num(row['Average heart rate (bpm)']);
    if (avgHR != null && avgHR > 30) metrics.avg_heart_rate = Math.round(avgHR);

    const maxHR = num(row['Max heart rate (bpm)']);
    if (maxHR != null && maxHR > 30) metrics.max_heart_rate = Math.round(maxHR);

    const spo2 = num(row['Average oxygen saturation (%)']);
    if (spo2 != null && spo2 > 50) metrics.spo2_pct = parseFloat(spo2.toFixed(1));

    const minHR = num(row['Min heart rate (bpm)']);
    if (minHR != null && minHR > 30) metrics.min_heart_rate = Math.round(minHR);

    // Heart Minutes = Google's cardio load metric (moderate activity = 1/min, vigorous = 2/min)
    const heartMinutes = num(row['Heart Minutes']);
    if (heartMinutes != null && heartMinutes > 0) metrics.heart_minutes = Math.round(heartMinutes);

    const moveMinutes = num(row['Move Minutes count']);
    if (moveMinutes != null && moveMinutes > 0) metrics.active_minutes = Math.round(moveMinutes);

    const weightKg = num(row['Average weight (kg)']);
    if (weightKg != null && weightKg > 20 && weightKg < 300) metrics.weight_kg = parseFloat(weightKg.toFixed(1));

    if (Object.keys(metrics).length > 0) result.set(date, metrics);
  }

  return result;
}

/**
 * Parse SLEEP.json session files from Takeout/Fit/All Sessions/.
 * Each file has: startTime, endTime, duration, fitnessActivity="sleep"
 * Stage breakdown is not available in this format; we derive total duration.
 */
function parseFitSleepSessions(sessionsDir: string): Map<string, Partial<WearableMetrics>> {
  const byDate = new Map<string, { totalMin: number; sessions: number }>();

  let files: string[];
  try { files = fs.readdirSync(sessionsDir); } catch { return new Map(); }

  for (const file of files) {
    if (!file.endsWith('_SLEEP.json') && !file.includes('SLEEP')) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(sessionsDir, file), 'utf8'));
      if (raw.fitnessActivity !== 'sleep') continue;

      // startTime / endTime are ISO strings; duration is "Xs"
      let durationMin = 0;
      if (raw.duration) {
        const secs = parseFloat(String(raw.duration).replace('s', ''));
        if (!isNaN(secs)) durationMin = Math.round(secs / 60);
      } else if (raw.startTime && raw.endTime) {
        const start = new Date(raw.startTime);
        const end = new Date(raw.endTime);
        durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      if (durationMin <= 0 || durationMin > 720) continue; // sanity: 0–12 hrs

      // Anchor to the wake date (end date)
      const wakeDate = raw.endTime
        ? new Date(raw.endTime).toISOString().slice(0, 10)
        : raw.startTime
          ? new Date(new Date(raw.startTime).getTime() + durationMin * 60000).toISOString().slice(0, 10)
          : null;
      if (!wakeDate) continue;

      const cur = byDate.get(wakeDate) ?? { totalMin: 0, sessions: 0 };
      cur.totalMin += durationMin;
      cur.sessions++;
      byDate.set(wakeDate, cur);
    } catch { /* skip malformed */ }
  }

  const result = new Map<string, Partial<WearableMetrics>>();
  for (const [date, agg] of byDate) {
    const metrics: Partial<WearableMetrics> = {};
    if (agg.totalMin > 0) {
      metrics.time_in_bed_min = agg.totalMin;
      metrics.total_sleep_min = agg.totalMin; // no wake data, assume all asleep
    }
    result.set(date, metrics);
  }
  return result;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function readCSV(filePath: string): Record<string, string>[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]!);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { fields.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur.trim());
  return fields;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function num(s: string | undefined): number | null {
  if (!s || s.trim() === '') return null;
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
