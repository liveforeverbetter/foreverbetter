#!/usr/bin/env npx tsx
/**
 * Wearable Sync — Automatic platform connection and daily data fetch
 *
 * Usage:
 *   npx tsx scripts/sync/wearable-sync.ts --connect <platform>
 *   npx tsx scripts/sync/wearable-sync.ts --sync [--days 7] [--out ~/.foreverbetter/wearables.csv]
 *   npx tsx scripts/sync/wearable-sync.ts --status
 *   npx tsx scripts/sync/wearable-sync.ts --disconnect <platform>
 *   npx tsx scripts/sync/wearable-sync.ts --set-credentials <platform> <client_id> <client_secret>
 *   npx tsx scripts/sync/wearable-sync.ts --install-cron  (macOS/Linux only)
 *
 * Supported platforms: whoop, oura, fitbit
 *
 * Each platform requires a free developer app registration (5 min setup):
 *   WHOOP:  https://developer.whoop.com
 *   Oura:   https://cloud.ouraring.com/oauth/applications
 *   Fitbit: https://dev.fitbit.com/apps/new  (set type = "Personal")
 *
 * All tokens are stored in ~/.foreverbetter/ (mode 0600, never uploaded).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import {
  getToken, saveToken, clearToken, getCredentials, saveCredentials,
  isTokenExpired, printConfigPath,
} from './token-store.js';
import type { PlatformId, TokenSet } from './token-store.js';
import { waitForCallback, generateState } from './oauth-server.js';
import * as whoop from './adapters/whoop.js';
import * as oura from './adapters/oura.js';
import * as fitbit from './adapters/fitbit.js';
import { parseGoogleExport } from './adapters/google-health.js';
import { METRIC_TO_CSV_COLUMN } from './types.js';
import type { NormalizedDay } from './types.js';

const DEFAULT_OUT = path.join(os.homedir(), '.foreverbetter', 'wearables.csv');
const PLATFORMS: PlatformId[] = ['whoop', 'oura', 'fitbit'];

const PLATFORM_DOCS: Record<PlatformId, string> = {
  whoop:  'https://developer.whoop.com  (set redirect URI → http://localhost:8788/callback)',
  oura:   'https://cloud.ouraring.com/oauth/applications  (set redirect URI → http://localhost:8788/callback)',
  fitbit: 'https://dev.fitbit.com/apps/new  (type = Personal, callback → http://localhost:8788/callback)',
};

// ── CLI argument parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): string | null {
  const idx = args.indexOf(name);
  return idx !== -1 ? (args[idx + 1] ?? '') : null;
}
function hasFlag(name: string): boolean { return args.includes(name); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (hasFlag('--status')) {
    return printStatus();
  }

  if (flag('--set-credentials') !== null) {
    const platform = flag('--set-credentials') as PlatformId;
    const clientId = args[args.indexOf('--set-credentials') + 2];
    const clientSecret = args[args.indexOf('--set-credentials') + 3];
    if (!PLATFORMS.includes(platform) || !clientId || !clientSecret) {
      console.error('Usage: --set-credentials <platform> <client_id> <client_secret>');
      process.exit(1);
    }
    saveCredentials(platform, { client_id: clientId, client_secret: clientSecret });
    console.log(`✅ Credentials saved for ${platform}. Run --connect ${platform} to authorize.`);
    return;
  }

  if (flag('--connect') !== null) {
    const platform = flag('--connect') as PlatformId;
    if (!PLATFORMS.includes(platform)) {
      console.error(`Unknown platform "${platform}". Supported: ${PLATFORMS.join(', ')}`);
      process.exit(1);
    }
    return connectPlatform(platform);
  }

  if (flag('--disconnect') !== null) {
    const platform = flag('--disconnect') as PlatformId;
    clearToken(platform as PlatformId);
    console.log(`✅ Disconnected ${platform} — token removed.`);
    return;
  }

  if (hasFlag('--sync') || hasFlag('--sync-all') || args.length === 0) {
    const daysBack = parseInt(flag('--days') ?? '7', 10);
    const outPath = flag('--out') ?? DEFAULT_OUT;
    return syncAll(daysBack, outPath);
  }

  if (flag('--import-google') !== null) {
    const exportDir = flag('--import-google') as string;
    const outPath = flag('--out') ?? DEFAULT_OUT;
    return importGoogle(exportDir, outPath);
  }

  if (hasFlag('--install-cron')) {
    return installCron();
  }

  printHelp();
}

// ── Connect (OAuth2 flow) ─────────────────────────────────────────────────────

async function connectPlatform(platform: PlatformId) {
  const creds = getCredentials(platform);
  if (!creds) {
    console.error(`\n❌ No credentials found for ${platform}.`);
    console.error(`   First, create a developer app at:`);
    console.error(`   ${PLATFORM_DOCS[platform]}`);
    console.error(`\n   Then run:`);
    console.error(`   npx tsx scripts/sync/wearable-sync.ts --set-credentials ${platform} <client_id> <client_secret>`);
    process.exit(1);
  }

  const state = generateState();
  let authUrl: string;
  if (platform === 'whoop') authUrl = whoop.buildAuthUrl(creds.client_id, state);
  else if (platform === 'oura') authUrl = oura.buildAuthUrl(creds.client_id, state);
  else authUrl = fitbit.buildAuthUrl(creds.client_id, state);

  console.log(`\n🔐 Connecting to ${platform}...`);
  console.log(`   Opening browser. If it doesn't open, visit:\n   ${authUrl}\n`);
  openBrowser(authUrl);

  console.log('   Waiting for authorization (5 min timeout)...');
  try {
    const { code } = await waitForCallback(state);
    console.log('   Authorization code received. Exchanging for token...');

    let token: TokenSet;
    if (platform === 'whoop') token = await whoop.exchangeCode(code, creds);
    else if (platform === 'oura') token = await oura.exchangeCode(code, creds);
    else token = await fitbit.exchangeCode(code, creds);

    saveToken(platform, token);
    console.log(`✅ ${platform} connected successfully!`);
    console.log(`   Token expires: ${token.expires_at ? new Date(token.expires_at).toLocaleString() : 'unknown'}`);
    console.log(`\n   Run 'npm run sync' to fetch your data.`);
  } catch (err) {
    console.error(`\n❌ Authorization failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

// ── Sync all connected platforms ──────────────────────────────────────────────

async function syncAll(daysBack: number, outPath: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack + 1);
  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

  console.log(`\n🔄 Syncing wearable data (${start} → ${end})`);

  const connected = PLATFORMS.filter(p => getToken(p) !== null);
  if (connected.length === 0) {
    console.log('   No platforms connected. Run --connect <platform> to set one up.');
    process.exit(0);
  }

  const allDays: NormalizedDay[] = [];

  for (const platform of connected) {
    let token = getToken(platform)!;
    const creds = getCredentials(platform);
    if (!creds) {
      console.warn(`   ⚠️  ${platform}: credentials missing — skipping`);
      continue;
    }

    // Refresh token if expired
    if (isTokenExpired(token)) {
      try {
        process.stdout.write(`   ${platform}: refreshing token... `);
        if (platform === 'whoop') token = await whoop.refreshToken(token, creds);
        else if (platform === 'oura') token = await oura.refreshToken(token, creds);
        else token = await fitbit.refreshToken(token, creds);
        saveToken(platform, token);
        console.log('done');
      } catch (err) {
        console.log(`failed — ${(err as Error).message}`);
        console.log(`   Run --connect ${platform} to re-authorize.`);
        continue;
      }
    }

    try {
      process.stdout.write(`   ${platform}: fetching ${start} → ${end}... `);
      let days: NormalizedDay[];
      if (platform === 'whoop') days = await whoop.fetchDays(token, start, end);
      else if (platform === 'oura') days = await oura.fetchDays(token, start, end);
      else days = await fitbit.fetchDays(token, start, end);
      console.log(`${days.length} days`);
      allDays.push(...days);
    } catch (err) {
      console.log(`error — ${(err as Error).message}`);
    }
  }

  if (allDays.length === 0) {
    console.log('\n   No data retrieved. Check platform connections.');
    return;
  }

  writeCSV(allDays, outPath);
  console.log(`\n✅ Written: ${outPath} (${allDays.length} rows)`);
  console.log(`   Pass to pipeline: --wearable "${outPath}"`);
}

// ── Google Health CSV import ──────────────────────────────────────────────────

async function importGoogle(exportDir: string, outPath: string) {
  if (!fs.existsSync(exportDir)) {
    console.error(`\n❌ Directory not found: ${exportDir}`);
    process.exit(1);
  }
  console.log(`\n📂 Importing Google Health export from: ${exportDir}`);
  const days = parseGoogleExport(exportDir);
  if (days.length === 0) {
    console.log('   No data found. Ensure Activity.csv, Sleep.csv, and Vitals.csv are present.');
    return;
  }
  console.log(`   Parsed ${days.length} days`);
  mergeIntoCSV(days, outPath);
  console.log(`✅ Merged into: ${outPath} — pass to pipeline: --wearable "${outPath}"`);
}

/** Merges new days into an existing CSV file without duplicating dates+platforms. */
function mergeIntoCSV(newDays: NormalizedDay[], outPath: string) {
  const metricKeys = Object.keys(METRIC_TO_CSV_COLUMN) as Array<keyof typeof METRIC_TO_CSV_COLUMN>;
  const columns = ['date', 'platform', ...metricKeys.map(k => METRIC_TO_CSV_COLUMN[k]!)];

  // Load existing rows keyed by "date|platform"
  const existing = new Map<string, string[]>();
  if (fs.existsSync(outPath)) {
    const lines = fs.readFileSync(outPath, 'utf8').split('\n').filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(',');
      const key = `${parts[0]}|${parts[1]}`;
      existing.set(key, parts);
    }
  }

  // Upsert new days
  for (const day of newDays) {
    const key = `${day.date}|${day.platform}`;
    const row = [
      day.date,
      day.platform,
      ...metricKeys.map(k => day.metrics[k] != null ? String((day.metrics as Record<string, unknown>)[k]) : ''),
    ];
    existing.set(key, row);
  }

  const sortedRows = [...existing.values()].sort((a, b) => {
    const d = (a[0] ?? '').localeCompare(b[0] ?? '');
    return d !== 0 ? d : (a[1] ?? '').localeCompare(b[1] ?? '');
  });

  const csv = [columns.join(','), ...sortedRows.map(r => r.join(','))].join('\n');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv + '\n', 'utf8');
}

// ── CSV writer ────────────────────────────────────────────────────────────────

function writeCSV(days: NormalizedDay[], outPath: string) {
  const metricKeys = Object.keys(METRIC_TO_CSV_COLUMN) as Array<keyof typeof METRIC_TO_CSV_COLUMN>;
  const columns = ['date', 'platform', ...metricKeys.map(k => METRIC_TO_CSV_COLUMN[k]!)];

  const rows = days
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(day => [
      day.date,
      day.platform,
      ...metricKeys.map(k => day.metrics[k] != null ? String((day.metrics as Record<string, unknown>)[k]) : ''),
    ]);

  const csv = [columns.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv + '\n', 'utf8');
}

// ── Status ────────────────────────────────────────────────────────────────────

function printStatus() {
  console.log('\n📊 Wearable Sync Status\n');
  printConfigPath();
  console.log('');
  for (const platform of PLATFORMS) {
    const creds = getCredentials(platform);
    const token = getToken(platform);
    const credStatus = creds ? '✅ credentials set' : '❌ no credentials';
    const tokenStatus = token
      ? isTokenExpired(token) ? '⚠️  token expired (run --connect to refresh)' : '✅ connected'
      : '— not connected';
    console.log(`  ${platform.padEnd(8)} ${credStatus}   ${tokenStatus}`);
    if (token?.expires_at) {
      console.log(`           expires: ${new Date(token.expires_at).toLocaleString()}`);
    }
  }

  const csvPath = DEFAULT_OUT;
  if (fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
    const stat = fs.statSync(csvPath);
    console.log(`\n  Data file: ${csvPath}`);
    console.log(`    ${lines.length - 1} rows, last modified: ${stat.mtime.toLocaleString()}`);
  } else {
    console.log(`\n  Data file: ${csvPath} (not yet created)`);
  }
  console.log('');
}

// ── Cron installer (macOS/Linux) ──────────────────────────────────────────────

function installCron() {
  const scriptPath = path.resolve(process.argv[1] ?? 'scripts/sync/wearable-sync.ts');
  const nodePath = process.execPath;
  const cronLine = `0 7 * * * cd "${path.dirname(path.dirname(path.dirname(scriptPath)))}" && "${nodePath}" --import=tsx/esm "${scriptPath}" --sync >> ~/.foreverbetter/sync.log 2>&1`;

  console.log('\n📅 Cron setup for automatic daily sync\n');
  console.log('Add this line to your crontab (runs at 7am daily):');
  console.log(`\n  ${cronLine}\n`);
  console.log('To edit crontab:  crontab -e');
  console.log('To verify:        crontab -l');
  console.log('\nOr run once now:  npm run sync');
}

// ── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Wearable Sync — connect health platforms and auto-fetch daily data

Commands:
  --status                           Show connected platforms and data file
  --set-credentials <p> <id> <sec>   Save OAuth app credentials for a platform
  --connect <platform>               Authorize via browser (one-time per platform)
  --disconnect <platform>            Remove stored token
  --sync [--days N] [--out PATH]     Fetch latest data from all connected platforms
  --import-google <dir> [--out PATH] Import Google Health/Fit CSV export directory
  --install-cron                     Print cron line for automatic daily sync

Platforms:  whoop | oura | fitbit | google-health (import only)

Setup for each platform (5 min, free):
  WHOOP   ${PLATFORM_DOCS.whoop}
  Oura    ${PLATFORM_DOCS.oura}
  Fitbit  ${PLATFORM_DOCS.fitbit}
`);
}

// ── Browser opener ────────────────────────────────────────────────────────────

function openBrowser(url: string) {
  const cmd = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (err) => { if (err) console.log(`   (could not open browser automatically)`); });
}

main().catch(err => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
