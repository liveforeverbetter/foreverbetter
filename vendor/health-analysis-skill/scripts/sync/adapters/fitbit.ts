/**
 * Fitbit Platform Adapter
 *
 * OAuth2 authorization + data fetch for Fitbit Web API.
 * Docs: https://dev.fitbit.com/build/reference/web-api/
 *
 * To create credentials:
 *   1. Go to https://dev.fitbit.com/apps/new
 *   2. Set OAuth 2.0 Application Type to "Personal"
 *   3. Set Callback URL to: http://localhost:8788/callback
 *   4. Save client_id and client_secret (OAuth 2.0 Client Secret)
 */

import * as https from 'https';
import * as querystring from 'querystring';
import { CALLBACK_URL } from '../oauth-server.js';
import type { TokenSet, PlatformCredentials } from '../token-store.js';
import type { NormalizedDay } from '../types.js';

const AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const SCOPES = 'activity heartrate sleep weight profile';

export function buildAuthUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: SCOPES,
    state,
    code_challenge_method: 'none',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string, creds: PlatformCredentials): Promise<TokenSet> {
  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CALLBACK_URL,
    client_id: creds.client_id,
  });
  const data = await postWithBasicAuth(TOKEN_URL, body, creds);
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string | undefined,
    expires_at: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope as string | undefined,
  };
}

export async function refreshToken(token: TokenSet, creds: PlatformCredentials): Promise<TokenSet> {
  if (!token.refresh_token) throw new Error('Fitbit: no refresh token available');
  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
  });
  const data = await postWithBasicAuth(TOKEN_URL, body, creds);
  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string | undefined) ?? token.refresh_token,
    expires_at: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope as string | undefined,
  };
}

export async function fetchDays(token: TokenSet, startDate: string, endDate: string): Promise<NormalizedDay[]> {
  // Fitbit requires per-day requests for most endpoints — batch dates first
  const dates = getDateRange(startDate, endDate);
  const days: NormalizedDay[] = [];

  for (const date of dates) {
    const day: NormalizedDay = { date, platform: 'fitbit', metrics: {} };

    const [activityResult, sleepResult, heartResult] = await Promise.allSettled([
      apiGet<FitbitActivity>(`/1/user/-/activities/date/${date}.json`, token.access_token),
      apiGet<FitbitSleep>(`/1.2/user/-/sleep/date/${date}.json`, token.access_token),
      apiGet<FitbitHeartRate>(`/1/user/-/activities/heart/date/${date}/1d.json`, token.access_token),
    ]);

    if (activityResult.status === 'fulfilled') {
      const a = activityResult.value.summary;
      if (a?.steps != null) day.metrics.steps = a.steps;
      if (a?.activeScore != null) day.metrics.activity_score = a.activeScore;
      if (a?.activityCalories != null) day.metrics.active_calories = a.activityCalories;
      if (a?.distances) {
        const total = a.distances.find(d => d.activity === 'total');
        if (total?.distance != null) day.metrics.walking_distance_m = total.distance * 1000;
      }
      if (a?.veryActiveMinutes != null) day.metrics.very_active_min = a.veryActiveMinutes;
    }

    if (sleepResult.status === 'fulfilled') {
      const s = sleepResult.value.summary;
      if (s?.totalMinutesAsleep != null) day.metrics.time_in_bed_min = s.totalTimeInBed;
      if (s?.totalMinutesAsleep != null) day.metrics.total_sleep_min = s.totalMinutesAsleep;
      if (s?.stages?.deep != null) day.metrics.deep_sleep_min = s.stages.deep;
      if (s?.stages?.rem != null) day.metrics.rem_sleep_min = s.stages.rem;
      if (s?.totalMinutesAsleep && s?.totalTimeInBed) {
        day.metrics.sleep_efficiency_pct = Math.round((s.totalMinutesAsleep / s.totalTimeInBed) * 100);
      }
    }

    if (heartResult.status === 'fulfilled') {
      const hr = heartResult.value['activities-heart']?.[0]?.value;
      if (hr?.restingHeartRate != null) day.metrics.resting_heart_rate = hr.restingHeartRate;
      // Heart rate zones
      const cardio = hr?.heartRateZones?.find(z => z.name === 'Cardio');
      const peak = hr?.heartRateZones?.find(z => z.name === 'Peak');
      if (cardio?.minutes != null) day.metrics.cardio_zone_min = cardio.minutes;
      if (peak?.minutes != null) day.metrics.peak_zone_min = peak.minutes;
    }

    if (Object.keys(day.metrics).length > 0) days.push(day);
  }

  return days;
}

// ── Fitbit API types (subset) ─────────────────────────────────────────────────

interface FitbitActivity {
  summary?: {
    steps?: number;
    activeScore?: number;
    activityCalories?: number;
    veryActiveMinutes?: number;
    distances?: Array<{ activity: string; distance: number }>;
  };
}

interface FitbitSleep {
  summary?: {
    totalMinutesAsleep?: number;
    totalTimeInBed?: number;
    stages?: { deep?: number; light?: number; rem?: number; wake?: number };
  };
}

interface FitbitHeartRate {
  'activities-heart'?: Array<{
    value?: {
      restingHeartRate?: number;
      heartRateZones?: Array<{ name: string; minutes?: number; caloriesOut?: number }>;
    };
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function apiGet<T>(path: string, accessToken: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`https://api.fitbit.com${path}`);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Fitbit API ${res.statusCode}: ${body}`)); return;
        }
        try { resolve(JSON.parse(body) as T); } catch { reject(new Error(`Fitbit JSON parse error: ${body}`)); }
      });
    }).on('error', reject);
  });
}

function postWithBasicAuth(urlStr: string, body: string, creds: PlatformCredentials): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const basicAuth = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64');
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
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
          reject(new Error(`Fitbit token exchange ${res.statusCode}: ${data}`)); return;
        }
        try { resolve(JSON.parse(data) as Record<string, unknown>); } catch { reject(new Error(`Fitbit token JSON error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
