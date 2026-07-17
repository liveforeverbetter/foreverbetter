/**
 * Oura Ring Platform Adapter
 *
 * OAuth2 authorization + data fetch for Oura API v2.
 * Docs: https://cloud.ouraring.com/v2/docs
 *
 * To create credentials:
 *   1. Go to https://cloud.ouraring.com/oauth/applications
 *   2. Create an application, set redirect URI to: http://localhost:8788/callback
 *   3. Save client_id and client_secret
 */

import * as https from 'https';
import * as querystring from 'querystring';
import { CALLBACK_URL } from '../oauth-server.js';
import type { TokenSet, PlatformCredentials } from '../token-store.js';
import type { NormalizedDay } from '../types.js';

const AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
const TOKEN_URL = 'https://api.ouraring.com/oauth/token';
const API_BASE = 'https://api.ouraring.com/v2';
const SCOPES = 'daily heartrate workout tag session spo2 stress';

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
  if (!token.refresh_token) throw new Error('Oura: no refresh token available');
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
  const [readiness, sleep, activity, spo2] = await Promise.allSettled([
    apiGet<{ data: OuraDailyReadiness[] }>(`/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`, token.access_token),
    apiGet<{ data: OuraDailySleep[] }>(`/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`, token.access_token),
    apiGet<{ data: OuraDailyActivity[] }>(`/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`, token.access_token),
    apiGet<{ data: OuraDailySpo2[] }>(`/usercollection/daily_spo2?start_date=${startDate}&end_date=${endDate}`, token.access_token),
  ]);

  // Collect all dates across all endpoints
  const dateSet = new Set<string>();
  if (readiness.status === 'fulfilled') readiness.value.data.forEach(d => dateSet.add(d.day));
  if (sleep.status === 'fulfilled') sleep.value.data.forEach(d => dateSet.add(d.day));
  if (activity.status === 'fulfilled') activity.value.data.forEach(d => dateSet.add(d.day));

  // Build lookup maps
  const readinessByDay = new Map<string, OuraDailyReadiness>();
  if (readiness.status === 'fulfilled') readiness.value.data.forEach(d => readinessByDay.set(d.day, d));
  const sleepByDay = new Map<string, OuraDailySleep>();
  if (sleep.status === 'fulfilled') sleep.value.data.forEach(d => sleepByDay.set(d.day, d));
  const activityByDay = new Map<string, OuraDailyActivity>();
  if (activity.status === 'fulfilled') activity.value.data.forEach(d => activityByDay.set(d.day, d));
  const spo2ByDay = new Map<string, OuraDailySpo2>();
  if (spo2.status === 'fulfilled') spo2.value.data.forEach(d => spo2ByDay.set(d.day, d));

  const days: NormalizedDay[] = [];
  for (const date of [...dateSet].sort()) {
    const day: NormalizedDay = { date, platform: 'oura', metrics: {} };
    const r = readinessByDay.get(date);
    const s = sleepByDay.get(date);
    const a = activityByDay.get(date);
    const sp = spo2ByDay.get(date);

    if (r) {
      if (r.score != null) day.metrics.recovery_score = r.score;
      if (r.contributors?.hrv_balance != null) day.metrics.hrv_balance = r.contributors.hrv_balance;
      if (r.contributors?.resting_heart_rate != null) day.metrics.resting_hr_contributors = r.contributors.resting_heart_rate;
    }

    if (s) {
      if (s.score != null) day.metrics.sleep_score = s.score;
      if (s.contributors?.total_sleep != null) day.metrics.total_sleep_contributors = s.contributors.total_sleep;
      if (s.contributors?.rem_sleep != null) day.metrics.rem_sleep_contributors = s.contributors.rem_sleep;
      if (s.contributors?.deep_sleep != null) day.metrics.deep_sleep_contributors = s.contributors.deep_sleep;
      if (s.contributors?.efficiency != null) day.metrics.sleep_efficiency_contributors = s.contributors.efficiency;
    }

    if (a) {
      if (a.score != null) day.metrics.activity_score = a.score;
      if (a.active_calories != null) day.metrics.active_calories = a.active_calories;
      if (a.steps != null) day.metrics.steps = a.steps;
      if (a.equivalent_walking_distance != null) day.metrics.walking_distance_m = a.equivalent_walking_distance;
      if (a.met?.average != null) day.metrics.avg_met = a.met.average;
    }

    if (sp?.spo2_percentage?.average != null) day.metrics.spo2_pct = sp.spo2_percentage.average;

    days.push(day);
  }
  return days;
}

// ── Oura API types (subset) ───────────────────────────────────────────────────

interface OuraDailyReadiness {
  day: string;
  score?: number;
  contributors?: {
    hrv_balance?: number;
    resting_heart_rate?: number;
    sleep_balance?: number;
    body_temperature?: number;
    activity_balance?: number;
  };
}

interface OuraDailySleep {
  day: string;
  score?: number;
  contributors?: {
    total_sleep?: number;
    rem_sleep?: number;
    deep_sleep?: number;
    efficiency?: number;
    latency?: number;
    restfulness?: number;
    timing?: number;
  };
}

interface OuraDailyActivity {
  day: string;
  score?: number;
  active_calories?: number;
  steps?: number;
  equivalent_walking_distance?: number;
  met?: { average?: number };
}

interface OuraDailySpo2 {
  day: string;
  spo2_percentage?: { average?: number; minimum?: number };
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function apiGet<T>(path: string, accessToken: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ouraring.com',
      path: `/v2${path}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Oura API ${res.statusCode}: ${body}`)); return;
        }
        try { resolve(JSON.parse(body) as T); } catch { reject(new Error(`Oura JSON parse error: ${body}`)); }
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
          reject(new Error(`Oura token exchange ${res.statusCode}: ${data}`)); return;
        }
        try { resolve(JSON.parse(data) as Record<string, unknown>); } catch { reject(new Error(`Oura token JSON error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
