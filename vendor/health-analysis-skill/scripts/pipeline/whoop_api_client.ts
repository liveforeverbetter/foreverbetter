#!/usr/bin/env npx tsx
/**
 * Optional WHOOP API importer.
 *
 * This is not used by the default sample report. It provides an authenticated
 * ingestion path for users who have already completed WHOOP OAuth and can pass
 * an access token through WHOOP_ACCESS_TOKEN.
 */

import { parseWearableJson } from './health_data_import.js';
import type { WearableReading } from './wearable_engine.js';

type JsonObject = Record<string, unknown>;

export interface WhoopApiOptions {
  accessToken?: string;
  baseUrl?: string;
  start?: string;
  end?: string;
  limit?: number;
}

export interface WhoopApiExport {
  source: 'WHOOP API v2';
  window_days?: number;
  cycles: JsonObject[];
  recoveries: JsonObject[];
  sleeps: JsonObject[];
  workouts: JsonObject[];
}

const DEFAULT_BASE_URL = 'https://api.prod.whoop.com/developer/v2';

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function recordsFrom(payload: unknown): { records: JsonObject[]; nextToken?: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { records: [] };
  const item = payload as JsonObject;
  const records = Array.isArray(item.records)
    ? item.records.filter((record): record is JsonObject => record != null && typeof record === 'object' && !Array.isArray(record))
    : [];
  const nextToken = typeof item.next_token === 'string'
    ? item.next_token
    : typeof item.nextToken === 'string'
      ? item.nextToken
      : undefined;
  return { records, nextToken };
}

function queryString(options: WhoopApiOptions, nextToken?: string): string {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(Math.max(options.limit ?? 25, 1), 25)));
  if (options.start) params.set('start', options.start);
  if (options.end) params.set('end', options.end);
  if (nextToken) params.set('nextToken', nextToken);
  return params.toString();
}

async function fetchCollection(pathname: string, options: Required<Pick<WhoopApiOptions, 'accessToken' | 'baseUrl'>> & WhoopApiOptions): Promise<JsonObject[]> {
  const records: JsonObject[] = [];
  let nextToken: string | undefined;

  do {
    const url = `${options.baseUrl}${pathname}?${queryString(options, nextToken)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`WHOOP API ${response.status} for ${pathname}: ${body.slice(0, 300)}`);
    }
    const page = recordsFrom(await response.json());
    records.push(...page.records);
    nextToken = page.nextToken;
  } while (nextToken);

  return records;
}

export async function fetchWhoopApiExport(options: WhoopApiOptions = {}): Promise<WhoopApiExport> {
  const accessToken = options.accessToken ?? process.env.WHOOP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('WHOOP_ACCESS_TOKEN is required for authenticated WHOOP API import.');
  const baseUrl = options.baseUrl ?? process.env.WHOOP_API_BASE_URL ?? DEFAULT_BASE_URL;
  const requestOptions = { ...options, accessToken, baseUrl };

  const [cycles, recoveries, sleeps, workouts] = await Promise.all([
    fetchCollection('/cycle', requestOptions),
    fetchCollection('/recovery', requestOptions),
    fetchCollection('/activity/sleep', requestOptions),
    fetchCollection('/activity/workout', requestOptions),
  ]);

  return {
    source: 'WHOOP API v2',
    cycles,
    recoveries,
    sleeps,
    workouts,
  };
}

export async function fetchWhoopReadings(options: WhoopApiOptions = {}): Promise<WearableReading[]> {
  const exported = await fetchWhoopApiExport(options);
  return parseWearableJson(JSON.stringify(exported));
}

async function main(): Promise<void> {
  const exported = await fetchWhoopApiExport({
    start: argValue('--start'),
    end: argValue('--end'),
    limit: Number(argValue('--limit') ?? '25'),
  });
  const readings = parseWearableJson(JSON.stringify(exported));
  console.log(JSON.stringify({
    source: exported.source,
    cycles: exported.cycles.length,
    recoveries: exported.recoveries.length,
    sleeps: exported.sleeps.length,
    workouts: exported.workouts.length,
    wearable_readings: readings.length,
    signals: readings.map(reading => reading.id),
  }, null, 2));
}

if (process.argv[1]?.endsWith('whoop_api_client.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
