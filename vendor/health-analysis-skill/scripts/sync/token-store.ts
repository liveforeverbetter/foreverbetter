/**
 * Token Store
 *
 * Reads and writes OAuth2 tokens + platform config from ~/.foreverbetter/
 * Tokens are stored as plaintext JSON — advise users not to share this directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.foreverbetter');
const TOKENS_FILE = path.join(CONFIG_DIR, 'tokens.json');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export type PlatformId = 'whoop' | 'oura' | 'fitbit';

export interface PlatformCredentials {
  client_id: string;
  client_secret: string;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // Unix ms
  scope?: string;
}

export interface TokenStore {
  [platform: string]: TokenSet;
}

export interface CredentialStore {
  [platform: string]: PlatformCredentials;
}

function ensureDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function readTokens(): TokenStore {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')) as TokenStore;
  } catch {
    return {};
  }
}

export function writeTokens(store: TokenStore): void {
  ensureDir();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function saveToken(platform: PlatformId, token: TokenSet): void {
  const store = readTokens();
  store[platform] = token;
  writeTokens(store);
}

export function getToken(platform: PlatformId): TokenSet | null {
  const store = readTokens();
  return store[platform] ?? null;
}

export function clearToken(platform: PlatformId): void {
  const store = readTokens();
  delete store[platform];
  writeTokens(store);
}

export function readCredentials(): CredentialStore {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as CredentialStore;
  } catch {
    return {};
  }
}

export function getCredentials(platform: PlatformId): PlatformCredentials | null {
  const store = readCredentials();
  return (store[platform] as PlatformCredentials) ?? null;
}

export function saveCredentials(platform: PlatformId, creds: PlatformCredentials): void {
  ensureDir();
  const store = readCredentials();
  store[platform] = creds;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function isTokenExpired(token: TokenSet): boolean {
  if (!token.expires_at) return false;
  // Refresh 5 minutes before expiry
  return Date.now() > token.expires_at - 5 * 60 * 1000;
}

export function printConfigPath(): void {
  console.log(`Config directory: ${CONFIG_DIR}`);
  console.log(`  ${CONFIG_FILE}  — client credentials`);
  console.log(`  ${TOKENS_FILE}  — OAuth tokens`);
}
