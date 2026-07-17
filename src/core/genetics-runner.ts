import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { GeneticsAnnotationDepth, RawSourceReference } from '../types.js';

export interface GeneticsPipelineResult {
  status: 'complete' | 'setup_required' | 'failed';
  summary: string;
  dashboard?: unknown;
  dashboard_json_path?: string;
  dashboard_html_path?: string;
  raw?: {
    gli?: number;
    gli_rating?: string;
    trait_count?: number;
    insight_count?: number;
    protocol_count?: number;
    variant_count?: number;
    annotated_count?: number;
    matched_marker_count?: number;
    prs_count?: number;
    cpic_actionable?: number;
    clinvar_pathogenic?: number;
  };
}

export interface GeneticsPipelineOptions {
  annotation_depth?: GeneticsAnnotationDepth;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_BUNDLED_SKILL_DIR = 'vendor/health-analysis-skill';
const LEGACY_SKILL_DIR = '../open-source/skills/genomic-analysis';

export async function runGeneticsPipeline(
  userId: string,
  source: RawSourceReference,
  payload: Buffer | undefined,
  env: NodeJS.ProcessEnv = process.env,
  options: GeneticsPipelineOptions = {},
): Promise<GeneticsPipelineResult> {
  if (!payload) {
    return {
      status: 'setup_required',
      summary: 'Genetic source payload is not available in the backend store. Configure durable object storage before asynchronous genetic analysis.',
    };
  }

  const uploadedPayload = payload;
  return runGeneticsPipelineWithWriter(userId, source, inputPath => fs.writeFile(inputPath, uploadedPayload), env, options);
}

export async function runGeneticsPipelineWithWriter(
  userId: string,
  source: RawSourceReference,
  writePayload: (inputPath: string) => Promise<boolean | void>,
  env: NodeJS.ProcessEnv = process.env,
  options: GeneticsPipelineOptions = {},
): Promise<GeneticsPipelineResult> {

  const skillDir = await resolveHealthAnalysisSkillDir(env);
  if (!await exists(path.join(skillDir, 'scripts/pipeline/index.ts'))) {
    return {
      status: 'setup_required',
      summary: `HEALTH_ANALYSIS_SKILL_DIR does not point to the bundled analyze-health skill: ${skillDir}`,
    };
  }

  const timeoutMs = Number(env.HEALTH_ANALYSIS_TIMEOUT_MS ?? env.GENOMIC_ANALYSIS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'health-api-genetics-'));
  const safeName = safeFilename(source.filename ?? `${source.id}.vcf`);
  const inputPath = path.join(tempDir, safeName);
  const outputDir = path.join(tempDir, 'output');
  await fs.mkdir(outputDir, { recursive: true });
  const wrotePayload = await writePayload(inputPath);
  if (wrotePayload === false) {
    return {
      status: 'setup_required',
      summary: 'Genetic source payload is not available in the backend store. Configure durable object storage before asynchronous genetic analysis.',
    };
  }

  const commandArgs = [
    'scripts/pipeline/index.ts',
    `--genetics=${inputPath}`,
    `--user=${userId}`,
    `--out=${outputDir}`,
  ];
  if (options.annotation_depth) commandArgs.push(`--annotation-depth=${options.annotation_depth}`);
  const dbsnpPath = env.HEALTH_ANALYSIS_DBSNP_GRCH37_PATH;
  if (options.annotation_depth === 'full_dbsnp' && dbsnpPath) commandArgs.push(`--dbsnp-path=${dbsnpPath}`);
  const tsxCommand = env.TSX_BIN ?? path.resolve(process.cwd(), 'node_modules/.bin/tsx');
  const result = await runCommand(tsxCommand, commandArgs, skillDir, timeoutMs);
  if (result.exitCode !== 0) {
    return {
      status: 'failed',
      summary: `Genomic analysis pipeline failed with exit code ${result.exitCode}: ${lastLines(result.stderr || result.stdout)}`,
      raw: {},
    };
  }

  const dashboardJsonPath = path.join(outputDir, `${userId}_dashboard.json`);
  const dashboard = await readJson(dashboardJsonPath);
  return {
    status: 'complete',
    summary: 'Health analysis completed using the bundled analyze-health pipeline.',
    dashboard,
    dashboard_json_path: dashboardJsonPath,
    dashboard_html_path: path.join(outputDir, 'index.html'),
    raw: summarizeDashboard(dashboard),
  };
}

async function resolveHealthAnalysisSkillDir(env: NodeJS.ProcessEnv): Promise<string> {
  if (env.HEALTH_ANALYSIS_SKILL_DIR) return path.resolve(env.HEALTH_ANALYSIS_SKILL_DIR);
  if (env.GENOMIC_ANALYSIS_SKILL_DIR) return path.resolve(env.GENOMIC_ANALYSIS_SKILL_DIR);

  const bundled = path.resolve(DEFAULT_BUNDLED_SKILL_DIR);
  if (await exists(path.join(bundled, 'scripts/pipeline/index.ts'))) return bundled;

  return path.resolve(LEGACY_SKILL_DIR);
}

function runCommand(command: string, args: string[], cwd: string, timeoutMs: number): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      stderr += `\nTimed out after ${timeoutMs}ms.`;
    }, timeoutMs);
    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    child.on('close', exitCode => {
      clearTimeout(timeout);
      resolve({ exitCode, stdout, stderr });
    });
    child.on('error', error => {
      clearTimeout(timeout);
      resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${error.message}` });
    });
  });
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
}

function summarizeDashboard(dashboard: unknown): GeneticsPipelineResult['raw'] {
  if (!dashboard || typeof dashboard !== 'object') return {};
  const record = dashboard as Record<string, unknown>;
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata as Record<string, unknown> : {};
  return {
    gli: numberValue(record.gli),
    gli_rating: stringValue(record.gli_rating),
    trait_count: numberValue(metadata.trait_count),
    insight_count: numberValue(metadata.insight_count),
    protocol_count: numberValue(metadata.protocol_count),
    variant_count: numberValue(metadata.variant_count),
    annotated_count: numberValue(metadata.annotated_count),
    matched_marker_count: numberValue(metadata.matched_marker_count),
    prs_count: Array.isArray(metadata.prs_scores) ? metadata.prs_scores.length : undefined,
    cpic_actionable: numberValue(metadata.cpic_actionable),
    clinvar_pathogenic: numberValue(metadata.clinvar_pathogenic),
  };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160) || 'genetic-upload.vcf';
}

function lastLines(text: string, lineCount = 8): string {
  return text.split(/\r?\n/).filter(Boolean).slice(-lineCount).join('\n');
}
