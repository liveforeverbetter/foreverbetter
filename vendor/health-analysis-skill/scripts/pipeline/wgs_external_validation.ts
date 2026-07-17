#!/usr/bin/env npx tsx
/**
 * External WGS benchmark preflight/runner.
 *
 * Synthetic fixtures catch parser and interpretation regressions. This module
 * tracks real benchmark readiness against GIAB/curated truthsets and can run
 * Truvari/hap.py once truth/query inputs and tools are present.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

type BenchmarkTool = 'truvari' | 'hap.py' | 'custom';

interface ExternalTruthset {
  id: string;
  description: string;
  source_name: string;
  source_url: string;
  benchmark_tool: BenchmarkTool;
  genome_build: string;
  variant_classes: string[];
  truth_vcf: string;
  truth_vcf_index?: string;
  confident_regions?: string;
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

interface ExternalBenchmarkResult {
  truthset_id: string;
  source_name: string;
  source_url: string;
  benchmark_tool: BenchmarkTool;
  genome_build: string;
  variant_classes: string[];
  truth_vcf_path: string;
  truth_vcf_index_path: string;
  confident_regions_path?: string;
  query_vcf_path: string;
  query_vcf_index_path: string;
  metrics_json_path?: string;
  truth_vcf_present: boolean;
  truth_vcf_index_present: boolean;
  confident_regions_present: boolean;
  query_vcf_present: boolean;
  query_vcf_index_present: boolean;
  metrics_present: boolean;
  tool_available: boolean;
  runnable: boolean;
  run_attempted: boolean;
  run_succeeded: boolean;
  evaluated: boolean;
  recall?: number;
  precision?: number;
  f1?: number;
  minimum_recall: number;
  minimum_precision: number;
  passed: boolean;
  status: 'pass' | 'fail' | 'missing_inputs' | 'missing_tool' | 'missing_metrics' | 'run_failed';
  gap?: string;
  command: string;
  expected_artifacts: string[];
}

export interface ExternalBenchmarkReport {
  generated_at: string;
  truthset_path: string;
  mode: 'preflight' | 'run';
  results: ExternalBenchmarkResult[];
  summary: {
    configured_truthsets: number;
    required_truthsets: number;
    runnable_truthsets: number;
    evaluated_truthsets: number;
    passing_truthsets: number;
    missing_inputs: number;
    missing_tools: number;
    missing_indexes: number;
    missing_metrics: number;
  };
  next_actions: string[];
  passed: boolean;
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

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function hasCommand(command: string): boolean {
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

function optionalPath(inputPath: string | undefined, truthsetPath: string, packageDir: string): string | undefined {
  return inputPath ? resolveInputPath(inputPath, truthsetPath, packageDir) : undefined;
}

function metricFrom(value: unknown, keys: string[]): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1 ? value / 100 : value;
  if (typeof value !== 'object' || value == null) return undefined;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = object[key];
    if (typeof direct === 'number' && Number.isFinite(direct)) return direct > 1 ? direct / 100 : direct;
  }
  for (const child of Object.values(object)) {
    const found = metricFrom(child, keys);
    if (found != null) return found;
  }
  return undefined;
}

function readMetrics(metricsPath: string | undefined): { recall?: number; precision?: number; f1?: number } {
  if (!metricsPath || !fs.existsSync(metricsPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as unknown;
    return {
      recall: metricFrom(parsed, ['recall', 'Recall', 'METRIC.Recall']),
      precision: metricFrom(parsed, ['precision', 'Precision', 'METRIC.Precision']),
      f1: metricFrom(parsed, ['f1', 'F1', 'METRIC.F1_Score', 'f1_score']),
    };
  } catch {
    return {};
  }
}

function commandFor(truthset: ExternalTruthset, paths: { truthVcf: string; confidentRegions?: string; queryVcf: string; metricsPath?: string }): string {
  if (truthset.benchmark_tool === 'truvari') {
    const outDir = paths.metricsPath ? path.dirname(paths.metricsPath) : `output/truvari-${truthset.id}`;
    const bed = paths.confidentRegions ? ` --includebed ${paths.confidentRegions}` : '';
    return `truvari bench -b ${paths.truthVcf} -c ${paths.queryVcf}${bed} -o ${outDir}`;
  }
  if (truthset.benchmark_tool === 'hap.py') {
    const outPrefix = paths.metricsPath ? paths.metricsPath.replace(/\.json$/i, '') : `output/happy-${truthset.id}`;
    const bed = paths.confidentRegions ? ` -f ${paths.confidentRegions}` : '';
    return `hap.py ${paths.truthVcf} ${paths.queryVcf}${bed} -o ${outPrefix}`;
  }
  return `custom benchmark for ${truthset.id}: compare ${paths.queryVcf} against ${paths.truthVcf}`;
}

function runCommand(command: string): boolean {
  try {
    execFileSync('sh', ['-lc', command], { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function evaluateTruthset(truthset: ExternalTruthset, truthsetPath: string, packageDir: string, run: boolean): ExternalBenchmarkResult {
  const truthVcfPath = resolveInputPath(truthset.truth_vcf, truthsetPath, packageDir);
  const truthVcfIndexPath = resolveInputPath(truthset.truth_vcf_index ?? `${truthset.truth_vcf}.tbi`, truthsetPath, packageDir);
  const confidentRegionsPath = optionalPath(truthset.confident_regions, truthsetPath, packageDir);
  const queryVcfPath = resolveInputPath(truthset.query_vcf, truthsetPath, packageDir);
  const queryVcfIndexPath = resolveInputPath(truthset.query_vcf_index ?? `${truthset.query_vcf}.tbi`, truthsetPath, packageDir);
  const metricsJsonPath = optionalPath(truthset.metrics_json, truthsetPath, packageDir);
  const truthVcfPresent = fs.existsSync(truthVcfPath);
  const truthVcfIndexPresent = fs.existsSync(truthVcfIndexPath);
  const confidentRegionsPresent = confidentRegionsPath ? fs.existsSync(confidentRegionsPath) : true;
  const queryVcfPresent = fs.existsSync(queryVcfPath);
  const queryVcfIndexPresent = fs.existsSync(queryVcfIndexPath);
  const toolAvailable = truthset.benchmark_tool === 'custom' || hasCommand(truthset.benchmark_tool);
  const runnable = truthVcfPresent && truthVcfIndexPresent && confidentRegionsPresent && queryVcfPresent && queryVcfIndexPresent && toolAvailable;
  const command = commandFor(truthset, { truthVcf: truthVcfPath, confidentRegions: confidentRegionsPath, queryVcf: queryVcfPath, metricsPath: metricsJsonPath });
  const runAttempted = run && runnable;
  const runSucceeded = runAttempted ? runCommand(command) : false;
  const metricsPresent = metricsJsonPath ? fs.existsSync(metricsJsonPath) : false;
  const metrics = readMetrics(metricsJsonPath);
  const evaluated = metrics.recall != null && metrics.precision != null;
  const passed = evaluated
    && (metrics.recall ?? 0) >= truthset.minimum_recall
    && (metrics.precision ?? 0) >= truthset.minimum_precision;
  const missingInputs = [
    truthVcfPresent ? undefined : 'truth VCF',
    truthVcfIndexPresent ? undefined : 'truth VCF index',
    confidentRegionsPresent ? undefined : 'confident regions BED',
    queryVcfPresent ? undefined : 'query VCF',
    queryVcfIndexPresent ? undefined : 'query VCF index',
  ].filter((item): item is string => Boolean(item));
  const status: ExternalBenchmarkResult['status'] = passed
    ? 'pass'
    : runAttempted && !runSucceeded
      ? 'run_failed'
      : missingInputs.length > 0
        ? 'missing_inputs'
        : !toolAvailable
          ? 'missing_tool'
          : !evaluated
            ? 'missing_metrics'
            : 'fail';
  const gap = status === 'missing_inputs'
    ? `Missing external validation input(s): ${missingInputs.join(', ')}.`
    : status === 'missing_tool'
      ? `Missing benchmark tool: ${truthset.benchmark_tool}.`
      : status === 'missing_metrics'
        ? 'Benchmark can run, but no metrics JSON has been recorded yet.'
        : status === 'run_failed'
          ? 'Benchmark command failed before metrics were recorded.'
          : status === 'fail'
            ? `Metrics below target recall ${truthset.minimum_recall} and precision ${truthset.minimum_precision}.`
            : undefined;

  return {
    truthset_id: truthset.id,
    source_name: truthset.source_name,
    source_url: truthset.source_url,
    benchmark_tool: truthset.benchmark_tool,
    genome_build: truthset.genome_build,
    variant_classes: truthset.variant_classes,
    truth_vcf_path: truthVcfPath,
    truth_vcf_index_path: truthVcfIndexPath,
    confident_regions_path: confidentRegionsPath,
    query_vcf_path: queryVcfPath,
    query_vcf_index_path: queryVcfIndexPath,
    metrics_json_path: metricsJsonPath,
    truth_vcf_present: truthVcfPresent,
    truth_vcf_index_present: truthVcfIndexPresent,
    confident_regions_present: confidentRegionsPresent,
    query_vcf_present: queryVcfPresent,
    query_vcf_index_present: queryVcfIndexPresent,
    metrics_present: metricsPresent,
    tool_available: toolAvailable,
    runnable,
    run_attempted: runAttempted,
    run_succeeded: runSucceeded,
    evaluated,
    recall: metrics.recall,
    precision: metrics.precision,
    f1: metrics.f1,
    minimum_recall: truthset.minimum_recall,
    minimum_precision: truthset.minimum_precision,
    passed,
    status,
    gap,
    command,
    expected_artifacts: [
      truthVcfPath,
      truthVcfIndexPath,
      confidentRegionsPath,
      queryVcfPath,
      queryVcfIndexPath,
      metricsJsonPath,
    ].filter((item): item is string => Boolean(item)),
  };
}

export function buildExternalBenchmarkReport(config: TruthsetConfig, truthsetPath: string, packageDir: string, run = false): ExternalBenchmarkReport {
  const truthsets = config.external_truthsets ?? [];
  const results = truthsets.map(truthset => evaluateTruthset(truthset, truthsetPath, packageDir, run));
  const summary = {
    configured_truthsets: truthsets.length,
    required_truthsets: truthsets.filter(truthset => truthset.required !== false).length,
    runnable_truthsets: results.filter(result => result.runnable).length,
    evaluated_truthsets: results.filter(result => result.evaluated).length,
    passing_truthsets: results.filter(result => result.passed).length,
    missing_inputs: results.filter(result => !result.truth_vcf_present || !result.confident_regions_present || !result.query_vcf_present).length,
    missing_tools: results.filter(result => !result.tool_available).length,
    missing_indexes: results.filter(result => !result.truth_vcf_index_present || !result.query_vcf_index_present).length,
    missing_metrics: results.filter(result => !result.evaluated).length,
  };
  const nextActions = results
    .filter(result => !result.passed)
    .map(result => `${result.truthset_id}: ${result.gap ?? 'Run benchmark and record metrics.'}`);

  return {
    generated_at: new Date().toISOString(),
    truthset_path: truthsetPath,
    mode: run ? 'run' : 'preflight',
    results,
    summary,
    next_actions: nextActions,
    passed: summary.required_truthsets > 0 && summary.passing_truthsets >= summary.required_truthsets,
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const truthsetPath = path.resolve(argValue('--truthsets') ?? path.join(packageDir, 'references/wgs-validation-truthsets.json'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/wgs-external-validation-report.json'));
  const run = hasFlag('--run');
  const report = buildExternalBenchmarkReport(readJson<TruthsetConfig>(truthsetPath), truthsetPath, packageDir, run);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.passed ? 'pass' : 'fail',
    mode: report.mode,
    output: outPath,
    summary: report.summary,
    next_actions: report.next_actions.slice(0, 5),
  }, null, 2));
  if (!report.passed) process.exit(1);
}

if (process.argv[1]?.endsWith('wgs_external_validation.ts')) {
  main();
}
