#!/usr/bin/env npx tsx
/**
 * External WGS truthset setup/preflight.
 *
 * This intentionally separates downloadable truth artifacts from query VCFs.
 * Query VCFs must come from running the matching HG002 caller pipeline; they
 * should never be fabricated just to make an external benchmark look complete.
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

type BenchmarkTool = 'truvari' | 'hap.py' | 'custom';
type ArtifactKind = 'truth_vcf' | 'truth_vcf_index' | 'confident_regions' | 'query_vcf' | 'query_vcf_index' | 'metrics_json';

interface ExternalTruthset {
  id: string;
  description: string;
  source_name: string;
  source_url: string;
  benchmark_tool: BenchmarkTool;
  genome_build: string;
  variant_classes: string[];
  truth_vcf: string;
  truth_vcf_url?: string;
  truth_vcf_index?: string;
  truth_vcf_index_url?: string;
  confident_regions?: string;
  confident_regions_url?: string;
  query_vcf: string;
  query_vcf_index?: string;
  metrics_json?: string;
  minimum_recall: number;
  minimum_precision: number;
  required?: boolean;
}

interface TruthsetConfig {
  external_truthsets?: ExternalTruthset[];
}

interface TruthsetArtifact {
  id: string;
  truthset_id: string;
  source_name: string;
  kind: ArtifactKind;
  path: string;
  present: boolean;
  source_url: string;
  download_url?: string;
  downloadable: boolean;
  remote_status?: number;
  remote_size_bytes?: number;
  remote_size_mb?: number;
  remote_checked_at?: string;
  download_allowed?: boolean;
  download_reason?: string;
  action: string;
}

interface ToolStatus {
  tool: BenchmarkTool;
  available: boolean;
  install_hint: string;
}

export interface WgsTruthsetSetupReport {
  generated_at: string;
  truthset_path: string;
  mode: 'preflight' | 'download';
  artifacts: TruthsetArtifact[];
  tools: ToolStatus[];
  summary: {
    truthsets: number;
    artifacts: number;
    present_artifacts: number;
    missing_truth_artifacts: number;
    missing_truth_indexes: number;
    missing_query_vcfs: number;
    missing_query_indexes: number;
    missing_metrics: number;
    downloadable_missing_artifacts: number;
    remote_checked_artifacts?: number;
    remote_total_download_bytes?: number;
    download_allowed_artifacts?: number;
    download_blocked_artifacts?: number;
    tools_available: number;
    tools_required: number;
  };
  next_actions: string[];
  ready_for_external_validation: boolean;
}

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function numericArg(flag: string, fallback: number): number {
  const value = argValue(flag);
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function hasCommand(command: string): boolean {
  if (command === 'custom') return true;
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resolveInputPath(inputPath: string, truthsetPath: string, packageDir: string): string {
  if (path.isAbsolute(inputPath)) return inputPath;
  const fromTruthset = path.resolve(path.dirname(truthsetPath), inputPath);
  if (fs.existsSync(fromTruthset)) return fromTruthset;
  return path.resolve(packageDir, inputPath);
}

function explicitDownloadUrl(truthset: ExternalTruthset, kind: ArtifactKind): string | undefined {
  if (kind === 'truth_vcf') return truthset.truth_vcf_url;
  if (kind === 'truth_vcf_index') return truthset.truth_vcf_index_url ?? (truthset.truth_vcf_url ? `${truthset.truth_vcf_url}.tbi` : undefined);
  if (kind === 'confident_regions') return truthset.confident_regions_url;
  return undefined;
}

function deriveDownloadUrl(truthset: ExternalTruthset, artifactPath: string, kind: ArtifactKind): string | undefined {
  const explicit = explicitDownloadUrl(truthset, kind);
  if (explicit) return explicit;
  if (kind === 'query_vcf' || kind === 'query_vcf_index' || kind === 'metrics_json') return undefined;
  const sourceUrl = truthset.source_url;
  if (!/^https?:\/\//i.test(sourceUrl) || !sourceUrl.endsWith('/')) return undefined;
  return `${sourceUrl}${path.basename(artifactPath)}`;
}

function actionFor(kind: ArtifactKind, present: boolean, downloadUrl: string | undefined, truthset: ExternalTruthset): string {
  if (present) return 'Ready locally.';
  if (kind === 'truth_vcf' || kind === 'truth_vcf_index' || kind === 'confident_regions') {
    return downloadUrl
      ? 'Download the external truth artifact with `npm run wgs:truthsets -- --download`.'
      : `Download the external truth artifact from ${truthset.source_name}; exact URL is not encoded in this repo yet.`;
  }
  if (kind === 'query_vcf') {
    return `Generate this by running the HG002 ${truthset.variant_classes.join('/')} caller pipeline; do not synthesize this file.`;
  }
  if (kind === 'query_vcf_index') {
    return 'Generated by indexing the HG002 query VCF after the matching caller pipeline has produced it.';
  }
  return 'Generated after running `npm run wgs:external-validation -- --run` once truth/query inputs and tools are ready.';
}

function artifactFor(truthset: ExternalTruthset, truthsetPath: string, packageDir: string, kind: ArtifactKind, configuredPath: string): TruthsetArtifact {
  const resolvedPath = resolveInputPath(configuredPath, truthsetPath, packageDir);
  const present = fs.existsSync(resolvedPath);
  const downloadUrl = deriveDownloadUrl(truthset, resolvedPath, kind);
  return {
    id: `${truthset.id}:${kind}`,
    truthset_id: truthset.id,
    source_name: truthset.source_name,
    kind,
    path: resolvedPath,
    present,
    source_url: truthset.source_url,
    download_url: downloadUrl,
    downloadable: Boolean(downloadUrl) && (kind === 'truth_vcf' || kind === 'truth_vcf_index' || kind === 'confident_regions'),
    action: actionFor(kind, present, downloadUrl, truthset),
  };
}

function artifactsFor(truthset: ExternalTruthset, truthsetPath: string, packageDir: string): TruthsetArtifact[] {
  const truthIndexPath = truthset.truth_vcf_index ?? `${truthset.truth_vcf}.tbi`;
  const queryIndexPath = truthset.query_vcf_index ?? `${truthset.query_vcf}.tbi`;
  return [
    artifactFor(truthset, truthsetPath, packageDir, 'truth_vcf', truthset.truth_vcf),
    artifactFor(truthset, truthsetPath, packageDir, 'truth_vcf_index', truthIndexPath),
    ...(truthset.confident_regions
      ? [artifactFor(truthset, truthsetPath, packageDir, 'confident_regions', truthset.confident_regions)]
      : []),
    artifactFor(truthset, truthsetPath, packageDir, 'query_vcf', truthset.query_vcf),
    artifactFor(truthset, truthsetPath, packageDir, 'query_vcf_index', queryIndexPath),
    ...(truthset.metrics_json
      ? [artifactFor(truthset, truthsetPath, packageDir, 'metrics_json', truthset.metrics_json)]
      : []),
  ];
}

function toolInstallHint(tool: BenchmarkTool): string {
  if (tool === 'truvari') return 'Install Truvari in the local environment, for example with conda/bioconda or pipx depending on the workstation.';
  if (tool === 'hap.py') return 'Install hap.py, commonly through a GIAB/RTG/hap.py container or conda environment.';
  return 'Custom benchmark handler is configured in the pipeline.';
}

function requestHead(url: string, redirects = 0): Promise<{ status?: number; sizeBytes?: number }> {
  const client = url.startsWith('https://') ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.request(url, { method: 'HEAD' }, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 5) {
        response.resume();
        requestHead(response.headers.location, redirects + 1).then(resolve, reject);
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
    request.on('error', reject);
    request.end();
  });
}

async function attachRemoteMetadata(report: WgsTruthsetSetupReport): Promise<WgsTruthsetSetupReport> {
  const checkedAt = new Date().toISOString();
  const artifacts = await Promise.all(report.artifacts.map(async artifact => {
    if (!artifact.download_url || artifact.present) return artifact;
    try {
      const remote = await requestHead(artifact.download_url);
      return {
        ...artifact,
        remote_status: remote.status,
        remote_size_bytes: remote.sizeBytes,
        remote_size_mb: remote.sizeBytes == null ? undefined : Math.round((remote.sizeBytes / 1024 / 1024) * 10) / 10,
        remote_checked_at: checkedAt,
      };
    } catch (error) {
      return {
        ...artifact,
        remote_checked_at: checkedAt,
        download_reason: `Remote size check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }));
  return summarizeDownloadPolicy({ ...report, artifacts });
}

function summarizeDownloadPolicy(report: WgsTruthsetSetupReport, maxBytes?: number, force = false): WgsTruthsetSetupReport {
  const artifacts = report.artifacts.map(artifact => {
    if (!artifact.download_url || artifact.present) return artifact;
    if (force) {
      return { ...artifact, download_allowed: true, download_reason: 'Forced download requested.' };
    }
    if (maxBytes == null) return artifact;
    if (artifact.remote_size_bytes == null) {
      return { ...artifact, download_allowed: false, download_reason: 'Remote size unknown; rerun with --check-remote or use --force.' };
    }
    if (artifact.remote_size_bytes > maxBytes) {
      return {
        ...artifact,
        download_allowed: false,
        download_reason: `Remote artifact is ${artifact.remote_size_mb} MB, above max ${Math.round((maxBytes / 1024 / 1024) * 10) / 10} MB.`,
      };
    }
    return { ...artifact, download_allowed: true, download_reason: 'Remote artifact is within the configured download size limit.' };
  });
  const remoteChecked = artifacts.filter(artifact => artifact.remote_checked_at).length;
  const remoteTotal = artifacts
    .filter(artifact => artifact.download_url && !artifact.present && artifact.remote_size_bytes != null)
    .reduce((sum, artifact) => sum + (artifact.remote_size_bytes ?? 0), 0);
  const downloadPolicyArtifacts = artifacts.filter(artifact => artifact.download_url && !artifact.present && artifact.download_allowed != null);
  return {
    ...report,
    artifacts,
    summary: {
      ...report.summary,
      remote_checked_artifacts: remoteChecked || undefined,
      remote_total_download_bytes: remoteTotal || undefined,
      download_allowed_artifacts: downloadPolicyArtifacts.filter(artifact => artifact.download_allowed).length || undefined,
      download_blocked_artifacts: downloadPolicyArtifacts.filter(artifact => artifact.download_allowed === false).length || undefined,
    },
  };
}

function downloadFile(url: string, outPath: string): Promise<void> {
  const client = url.startsWith('https://') ? https : http;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const request = client.get(url, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        downloadFile(response.headers.location, outPath).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed ${response.statusCode}: ${url}`));
        return;
      }
      const file = fs.createWriteStream(outPath);
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    });
    request.on('error', reject);
  });
}

export function buildWgsTruthsetSetupReport(config: TruthsetConfig, truthsetPath: string, packageDir: string, mode: 'preflight' | 'download' = 'preflight'): WgsTruthsetSetupReport {
  const truthsets = config.external_truthsets ?? [];
  const artifacts = truthsets.flatMap(truthset => artifactsFor(truthset, truthsetPath, packageDir));
  const uniqueTools = [...new Set(truthsets.map(truthset => truthset.benchmark_tool))];
  const tools = uniqueTools.map(tool => ({
    tool,
    available: hasCommand(tool),
    install_hint: toolInstallHint(tool),
  }));
  const truthArtifacts = artifacts.filter(artifact => artifact.kind === 'truth_vcf' || artifact.kind === 'confident_regions');
  const truthIndexes = artifacts.filter(artifact => artifact.kind === 'truth_vcf_index');
  const queryVcfs = artifacts.filter(artifact => artifact.kind === 'query_vcf');
  const queryIndexes = artifacts.filter(artifact => artifact.kind === 'query_vcf_index');
  const metrics = artifacts.filter(artifact => artifact.kind === 'metrics_json');
  const nextActions = [
    ...artifacts.filter(artifact => !artifact.present).map(artifact => `${artifact.truthset_id}/${artifact.kind}: ${artifact.action}`),
    ...tools.filter(tool => !tool.available).map(tool => `${tool.tool}: ${tool.install_hint}`),
  ];
  const summary = {
    truthsets: truthsets.length,
    artifacts: artifacts.length,
    present_artifacts: artifacts.filter(artifact => artifact.present).length,
    missing_truth_artifacts: truthArtifacts.filter(artifact => !artifact.present).length,
    missing_truth_indexes: truthIndexes.filter(artifact => !artifact.present).length,
    missing_query_vcfs: queryVcfs.filter(artifact => !artifact.present).length,
    missing_query_indexes: queryIndexes.filter(artifact => !artifact.present).length,
    missing_metrics: metrics.filter(artifact => !artifact.present).length,
    downloadable_missing_artifacts: artifacts.filter(artifact => !artifact.present && artifact.downloadable).length,
    tools_available: tools.filter(tool => tool.available).length,
    tools_required: tools.length,
  };
  return {
    generated_at: new Date().toISOString(),
    truthset_path: truthsetPath,
    mode,
    artifacts,
    tools,
    summary,
    next_actions: nextActions,
    ready_for_external_validation: summary.missing_truth_artifacts === 0
      && summary.missing_truth_indexes === 0
      && summary.missing_query_vcfs === 0
      && summary.missing_query_indexes === 0
      && summary.tools_available === summary.tools_required,
  };
}

async function main(): Promise<void> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const truthsetPath = path.resolve(argValue('--truthsets') ?? path.join(packageDir, 'references/wgs-validation-truthsets.json'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/wgs-external-truthset-setup.json'));
  const download = hasFlag('--download');
  const checkRemote = hasFlag('--check-remote') || download;
  const force = hasFlag('--force');
  const maxDownloadMb = numericArg('--max-mb', 500);
  const maxDownloadBytes = maxDownloadMb * 1024 * 1024;
  let report = buildWgsTruthsetSetupReport(readJson<TruthsetConfig>(truthsetPath), truthsetPath, packageDir, download ? 'download' : 'preflight');
  if (checkRemote) {
    report = await attachRemoteMetadata(report);
    report = summarizeDownloadPolicy(report, maxDownloadBytes, force);
  }

  if (download) {
    const candidates = report.artifacts.filter(artifact => !artifact.present && artifact.downloadable && artifact.download_url && artifact.download_allowed);
    for (const artifact of candidates) {
      await downloadFile(artifact.download_url as string, artifact.path);
    }
    report = buildWgsTruthsetSetupReport(readJson<TruthsetConfig>(truthsetPath), truthsetPath, packageDir, 'download');
    if (checkRemote) {
      report = await attachRemoteMetadata(report);
      report = summarizeDownloadPolicy(report, maxDownloadBytes, force);
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.ready_for_external_validation ? 'ready' : 'setup_required',
    mode: report.mode,
    output: outPath,
    summary: report.summary,
    download_policy: checkRemote ? { max_mb: maxDownloadMb, force } : undefined,
    next_actions: report.next_actions.slice(0, 8),
  }, null, 2));
  if (hasFlag('--strict') && !report.ready_for_external_validation) process.exit(1);
}

if (process.argv[1]?.endsWith('wgs_external_truthset_setup.ts')) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
