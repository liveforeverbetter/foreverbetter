/**
 * WHOOP Platform Adapter
 *
 * OAuth2 authorization + data fetch for WHOOP Developer API v1.
 * Docs: https://developer.whoop.com/api
 *
 * Required scopes: read:recovery read:sleep read:workout read:cycles read:body_measurement
 *
 * To create credentials:
 *   1. Go to https://developer.whoop.com
 *   2. Create an application
 *   3. Set redirect URI to: http://localhost:8788/callback
 *   4. Save client_id and client_secret
 */

import * as https from 'https';
import * as http from 'http';
import * as querystring from 'querystring';
import { CALLBACK_URL } from '../oauth-server.js';
import type { TokenSet, PlatformCredentials } from '../token-store.js';
import type { NormalizedDay } from '../types.js';

const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const API_BASE = 'https://api.prod.whoop.com/developer/v1';
const SCOPES = 'read:recovery read:sleep read:workout read:cycles read:body_measurement';

export function buildAuthUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string, creds: PlatformCredentials): Promise<TokenSet> {
  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CALLBACK_URL,
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  const data = await postForm(TOKEN_URL, body);
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string | undefined,
    expires_at: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope as string | undefined,
  };
}

export async function refreshToken(token: TokenSet, creds: PlatformCredentials): Promise<TokenSet> {
  if (!token.refresh_token) throw new Error('WHOOP: no refresh token available');
  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  });
  const data = await postForm(TOKEN_URL, body);
  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string | undefined) ?? token.refresh_token,
    expires_at: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope as string | undefined,
  };
}

export async function fetchDays(token: TokenSet, startDate: string, endDate: string): Promise<NormalizedDay[]> {
  const [cycles, sleepCollection, recoveryCollection] = await Promise.all([
    apiGet<{ records: WhoopCycle[] }>(`/cycle?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z&limit=25`, token.access_token),
    apiGet<{ records: WhoopSleep[] }>(`/activity/sleep?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z&limit=25`, token.access_token),
    apiGet<{ records: WhoopRecovery[] }>(`/recovery?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z&limit=25`, token.access_token),
  ]);

  // Index sleep and recovery by cycle_id for joining
  const sleepByCycle = new Map<number, WhoopSleep>();
  for (const s of sleepCollection.records ?? []) {
    if (s.cycle_id) sleepByCycle.set(s.cycle_id, s);
  }
  const recoveryByCycle = new Map<number, WhoopRecovery>();
  for (const r of recoveryCollection.records ?? []) {
    if (r.cycle_id) recoveryByCycle.set(r.cycle_id, r);
  }

  const days: NormalizedDay[] = [];
  for (const cycle of cycles.records ?? []) {
    const date = cycle.start?.slice(0, 10) ?? '';
    if (!date) continue;
    const sleep = sleepByCycle.get(cycle.id);
    const recovery = recoveryByCycle.get(cycle.id);

    const day: NormalizedDay = { date, platform: 'whoop', metrics: {} };

    // Strain
    if (cycle.score?.strain != null) day.metrics.strain_score = cycle.score.strain;
    if (cycle.score?.kilojoule != null) day.metrics.active_energy_kj = cycle.score.kilojoule;
    if (cycle.score?.average_heart_rate != null) day.metrics.avg_heart_rate = cycle.score.average_heart_rate;
    if (cycle.score?.max_heart_rate != null) day.metrics.max_heart_rate = cycle.score.max_heart_rate;

    // Recovery
    if (recovery?.score?.recovery_score != null) day.metrics.recovery_score = recovery.score.recovery_score;
    if (recovery?.score?.resting_heart_rate != null) day.metrics.resting_heart_rate = recovery.score.resting_heart_rate;
    if (recovery?.score?.hrv_rmssd_milli != null) day.metrics.hrv_ms = recovery.score.hrv_rmssd_milli;
    if (recovery?.score?.spo2_percentage != null) day.metrics.spo2_pct = recovery.score.spo2_percentage;
    if (recovery?.score?.skin_temp_celsius != null) day.metrics.skin_temp_c = recovery.score.skin_temp_celsius;

    // Sleep
    if (sleep?.score?.sleep_performance_percentage != null) day.metrics.sleep_score = sleep.score.sleep_performance_percentage;
    if (sleep?.score?.stage_summary?.total_in_bed_time_milli != null) day.metrics.time_in_bed_min = sleep.score.stage_summary.total_in_bed_time_milli / 60000;
    if (sleep?.score?.stage_summary?.total_slow_wave_sleep_time_milli != null) day.metrics.deep_sleep_min = sleep.score.stage_summary.total_slow_wave_sleep_time_milli / 60000;
    if (sleep?.score?.stage_summary?.total_rem_sleep_time_milli != null) day.metrics.rem_sleep_min = sleep.score.stage_summary.total_rem_sleep_time_milli / 60000;
    if (sleep?.score?.sleep_efficiency_percentage != null) day.metrics.sleep_efficiency_pct = sleep.score.sleep_efficiency_percentage;
    if (sleep?.score?.respiratory_rate != null) day.metrics.respiratory_rate = sleep.score.respiratory_rate;

    days.push(day);
  }
  return days;
}

// ── WHOOP API types (subset) ──────────────────────────────────────────────────

interface WhoopCycle {
  id: number;
  start?: string;
  score?: {
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  };
}

interface WhoopSleep {
  cycle_id?: number;
  score?: {
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
    };
  };
}

interface WhoopRecovery {
  cycle_id?: number;
  score?: {
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function apiGet<T>(path: string, accessToken: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.prod.whoop.com',
      path: `/developer/v1${path}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`WHOOP API ${res.statusCode}: ${body}`)); return;
        }
        try { resolve(JSON.parse(body) as T); } catch { reject(new Error(`WHOOP JSON parse error: ${body}`)); }
      });
    }).on('error', reject);
  });
}

function postForm(urlStr: string, body: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        Accept: 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`WHOOP token exchange ${res.statusCode}: ${data}`)); return;
        }
        try { resolve(JSON.parse(data) as Record<string, unknown>); } catch { reject(new Error(`WHOOP token JSON error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
