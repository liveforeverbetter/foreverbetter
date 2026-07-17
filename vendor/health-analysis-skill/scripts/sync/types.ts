/**
 * Shared types for the wearable sync layer.
 * NormalizedDay is the common output format from all platform adapters —
 * it maps to a row in the wearables CSV that health_data_import.ts can parse.
 */

export type PlatformId = 'whoop' | 'oura' | 'fitbit' | 'google-health';

export interface NormalizedDay {
  date: string;         // YYYY-MM-DD
  platform: PlatformId;
  metrics: Partial<WearableMetrics>;
}

/** All possible metric keys across all platforms */
export interface WearableMetrics {
  // Recovery / readiness
  recovery_score: number;        // 0–100
  hrv_ms: number;                // HRV in milliseconds (RMSSD)
  hrv_balance: number;           // Oura HRV balance contributor 0–100
  resting_heart_rate: number;    // bpm
  resting_hr_contributors: number;

  // Sleep
  sleep_score: number;           // 0–100
  time_in_bed_min: number;
  total_sleep_min: number;
  deep_sleep_min: number;
  rem_sleep_min: number;
  sleep_efficiency_pct: number;  // 0–100
  sleep_efficiency_contributors: number;
  respiratory_rate: number;      // breaths/min
  total_sleep_contributors: number;
  rem_sleep_contributors: number;
  deep_sleep_contributors: number;

  // Activity / strain
  strain_score: number;          // WHOOP strain 0–21
  activity_score: number;        // Oura/Fitbit 0–100
  steps: number;
  active_calories: number;
  active_energy_kj: number;
  walking_distance_m: number;
  avg_met: number;
  very_active_min: number;
  cardio_zone_min: number;
  peak_zone_min: number;

  // Cardiovascular
  avg_heart_rate: number;
  max_heart_rate: number;
  min_heart_rate: number;        // daily minimum HR, proxy for resting HR
  spo2_pct: number;              // SpO2 %

  // Activity load
  heart_minutes: number;         // Google Heart Minutes per day (≈zone 2 minutes/day)
  active_minutes: number;        // total Move Minutes per day

  // Body
  skin_temp_c: number;           // skin temperature Celsius
  weight_kg: number;             // body weight in kg
}

/** Mapping from NormalizedDay metric key to the column name in wearables CSV */
export const METRIC_TO_CSV_COLUMN: Partial<Record<keyof WearableMetrics, string>> = {
  recovery_score: 'recovery_score',
  hrv_ms: 'hrv_ms',
  resting_heart_rate: 'resting_heart_rate',
  sleep_score: 'sleep_score',
  time_in_bed_min: 'time_in_bed_min',
  total_sleep_min: 'total_sleep_min',
  deep_sleep_min: 'deep_sleep_min',
  rem_sleep_min: 'rem_sleep_min',
  sleep_efficiency_pct: 'sleep_efficiency_pct',
  respiratory_rate: 'respiratory_rate',
  strain_score: 'strain_score',
  activity_score: 'activity_score',
  steps: 'steps',
  active_calories: 'active_calories',
  walking_distance_m: 'walking_distance_m',
  avg_heart_rate: 'avg_heart_rate',
  max_heart_rate: 'max_heart_rate',
  spo2_pct: 'spo2_pct',
  skin_temp_c: 'skin_temp_c',
  avg_met: 'avg_met',
  min_heart_rate: 'min_heart_rate',
  heart_minutes: 'heart_minutes',
  active_minutes: 'active_minutes',
  weight_kg: 'weight_kg',
};
