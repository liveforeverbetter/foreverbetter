#!/usr/bin/env npx tsx
/**
 * Optional reference doctor.
 *
 * Heavy WGS references are never bundled with the repo. This script checks
 * local presence, tool availability, and optional remote metadata from the
 * lightweight manifest in references/optional-reference-manifest.json.
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

interface ReferenceFile {
  path: string;
  filename: string;
  url?: string;
  checksum_url?: string;
  expected_size: string;
  required: boolean;
}

interface ReferenceAsset {
  id: string;
  group: string;
  label: string;
  version: string;
  genome_build: string;
  source: string;
  source_page: string;
  required_for: string[];
  expected_files: ReferenceFile[];
  setup_commands?: string[];
}

interface ReferenceTool {
  id: string;
  command: string;
  version_command?: string;
  required_for: string[];
  install_hint: string;
}

interface ReferenceManifest {
  version: string;
  purpose: string;
  bloat_policy: {
    bundle_in_repo: boolean;
    local_cache_roots: string[];
    notes: string[];
  };
  assets: ReferenceAsset[];
  tools: ReferenceTool[];
}

interface FileStatus {
  asset_id: string;
  group: string;
  label: string;
  path: string;
  filename: string;
  present: boolean;
  bytes?: number;
  expected_size: string;
  required: boolean;
  url?: string;
  checksum_url?: string;
  remote_status?: number;
  remote_size_bytes?: number;
  remote_size_label?: string;
  action: string;
}

interface ToolStatus {
  id: string;
  command: string;
  available: boolean;
  version?: string;
  install_hint: string;
  required_for: string[];
}

export interface ReferenceDoctorReport {
  generated_at: string;
  manifest_path: string;
  manifest_version: string;
  mode: 'local' | 'remote';
  bloat_policy: ReferenceManifest['bloat_policy'];
  files: FileStatus[];
  tools: ToolStatus[];
  summary: {
    assets: number;
    files: number;
    present_files: number;
    missing_required_files: number;
    missing_optional_files: number;
    tools: number;
    tools_available: number;
    remote_checked_files?: number;
  };
  next_actions: string[];
  setup_commands: string[];
  ready_for_full_wgs: boolean;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '../..');

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function resolveFromPackage(inputPath: string): string {
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(packageDir, inputPath);
}

function commandAvailable(command: string): boolean {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function versionFor(commandLine: string | undefined): string | undefined {
  if (!commandLine) return undefined;
  const [command, ...args] = commandLine.split(/\s+/).filter(Boolean);
  if (!command) return undefined;
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000 })
      .split(/\r?\n/)
      .find(line => line.trim().length > 0)
      ?.trim();
  } catch {
    return undefined;
  }
}

function fileAction(file: ReferenceFile, present: boolean): string {
  if (present) return 'Ready locally.';
  if (file.url) return `Download locally from ${file.url}${file.checksum_url ? ` and verify with ${file.checksum_url}` : ''}.`;
  return 'Generate locally; this artifact should not be downloaded or committed.';
}

function humanBytes(bytes: number | undefined): string | undefined {
  if (bytes == null) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = units[0] as string;
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024;
    unit = units[i] as string;
  }
  return `${Math.round(value * 10) / 10}${unit}`;
}

function requestHead(url: string, redirects = 0): Promise<{ status?: number; sizeBytes?: number }> {
  const client = url.startsWith('https://') ? https : http;
  return new Promise(resolve => {
    const request = client.request(url, { method: 'HEAD' }, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 5) {
        response.resume();
        requestHead(response.headers.location, redirects + 1).then(resolve);
        return;
      }
      const contentLength = response.headers['content-length'];
      const sizeBytes = typeof contentLength === 'string' ? Number(contentLength) : undefined;
      response.resume();
      resolve({
        status: response.statusCode,
        sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
      });
    });
    request.on('error', () => resolve({}));
    request.setTimeout(8000, () => {
      request.destroy();
      resolve({});
    });
    request.end();
  });
}

export function buildReferenceDoctorReport(
  manifest: ReferenceManifest,
  manifestPath: string,
  checkRemote = false,
): ReferenceDoctorReport {
  const files = manifest.assets.flatMap(asset => asset.expected_files.map(file => {
    const resolvedPath = resolveFromPackage(file.path);
    const present = fs.existsSync(resolvedPath);
    const bytes = present ? fs.statSync(resolvedPath).size : undefined;
    return {
      asset_id: asset.id,
      group: asset.group,
      label: asset.label,
      path: resolvedPath,
      filename: file.filename,
      present,
      bytes,
      expected_size: file.expected_size,
      required: file.required,
      url: file.url,
      checksum_url: file.checksum_url,
      action: fileAction(file, present),
    };
  }));
  const tools = manifest.tools.map(tool => {
    const available = commandAvailable(tool.command);
    return {
      id: tool.id,
      command: tool.command,
      available,
      version: available ? versionFor(tool.version_command) : undefined,
      install_hint: tool.install_hint,
      required_for: tool.required_for,
    };
  });
  const setupCommands = manifest.assets.flatMap(asset => asset.setup_commands ?? []);
  const requiredFiles = files.filter(file => file.required);
  const missingFiles = files.filter(file => !file.present);
  const missingTools = tools.filter(tool => !tool.available);
  return {
    generated_at: new Date().toISOString(),
    manifest_path: manifestPath,
    manifest_version: manifest.version,
    mode: checkRemote ? 'remote' : 'local',
    bloat_policy: manifest.bloat_policy,
    files,
    tools,
    summary: {
      assets: manifest.assets.length,
      files: files.length,
      present_files: files.filter(file => file.present).length,
      missing_required_files: requiredFiles.filter(file => !file.present).length,
      missing_optional_files: files.filter(file => !file.required && !file.present).length,
      tools: tools.length,
      tools_available: tools.filter(tool => tool.available).length,
    },
    next_actions: [
      ...missingFiles.map(file => `${file.asset_id}/${file.filename}: ${file.action}`),
      ...missingTools.map(tool => `${tool.id}: ${tool.install_hint}`),
    ],
    setup_commands: [...new Set(setupCommands)],
    ready_for_full_wgs: requiredFiles.every(file => file.present) && tools.every(tool => tool.available),
  };
}

async function attachRemoteMetadata(report: ReferenceDoctorReport): Promise<ReferenceDoctorReport> {
  const files = await Promise.all(report.files.map(async file => {
    if (!file.url || file.present) return file;
    const remote = await requestHead(file.url);
    return {
      ...file,
      remote_status: remote.status,
      remote_size_bytes: remote.sizeBytes,
      remote_size_label: humanBytes(remote.sizeBytes),
    };
  }));
  return {
    ...report,
    files,
    summary: {
      ...report.summary,
      remote_checked_files: files.filter(file => file.remote_status != null).length,
    },
  };
}

async function main(): Promise<void> {
  const manifestPath = path.resolve(argValue('--manifest') ?? path.join(packageDir, 'references/optional-reference-manifest.json'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/reference-doctor.json'));
  const checkRemote = hasFlag('--check-remote');
  let report = buildReferenceDoctorReport(readJson<ReferenceManifest>(manifestPath), manifestPath, checkRemote);
  if (checkRemote) report = await attachRemoteMetadata(report);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.ready_for_full_wgs ? 'ready' : 'setup_required',
    mode: report.mode,
    output: outPath,
    summary: report.summary,
    next_actions: report.next_actions.slice(0, 10),
    setup_commands: report.setup_commands.slice(0, 12),
  }, null, 2));
  if (hasFlag('--strict') && !report.ready_for_full_wgs) process.exit(1);
}

if (process.argv[1]?.endsWith('reference_doctor.ts')) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
