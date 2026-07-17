#!/usr/bin/env npx tsx
/**
 * WGS variant-class validation.
 *
 * Compares normalized WGS calls against local truthset definitions. This is
 * intentionally class-specific so the audit can fail a pipeline that only
 * supports SNPs while claiming whole-genome interpretation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

import {
  parseWgsVariantClassVcf,
  readWgsInterpretationCatalog,
  type NormalizedWgsCall,
  type WgsReportability,
  type WgsVariantClass,
  type WgsVariantClassSummary,
} from './wgs_variant_class_engine.js';

interface ExpectedCall {
  id: string;
  class: WgsVariantClass;
  reportability: WgsReportability;
  genes?: string[];
}

interface Truthset {
  id: string;
  description: string;
  input: string;
  expected_calls?: ExpectedCall[];
  expected_call_ids?: string[];
  expected_classes: string[];
  minimum_recall: number;
  minimum_precision?: number;
  minimum_reportable_classes: number;
}

interface TruthsetConfig {
  truthsets: Truthset[];
  external_truthsets?: ExternalTruthset[];
  required_future_truthsets?: Array<{ id: string; status: string; reason: string }>;
}

interface ExternalTruthset {
  id: string;
  description: string;
  source_name: string;
  source_url: string;
  benchmark_tool: 'truvari' | 'hap.py' | 'custom';
  genome_build: string;
  variant_classes: string[];
  truth_vcf: string;
  confident_regions?: string;
  query_vcf: string;
  metrics_json?: string;
  minimum_recall: number;
  minimum_precision: number;
  required?: boolean;
}

interface ValidationResult {
  truthset_id: string;
  input_path: string;
  expected_calls: number;
  observed_calls: number;
  false_positive_call_ids: string[];
  missing_call_ids: string[];
  incorrect_classes: Array<{ id: string; expected: string; observed?: string }>;
  incorrect_reportability: Array<{ id: string; expected: string; observed?: string }>;
  incorrect_genes: Array<{ id: string; expected: string[]; observed: string[] }>;
  expected_classes: string[];
  observed_classes: string[];
  missing_classes: string[];
  recall: number;
  precision: number;
  reportable_classes: number;
  passed: boolean;
}

interface ValidationReport {
  generated_at: string;
  summary_path?: string;
  catalog_path: string;
  truthset_path: string;
  results: ValidationResult[];
  external_validation: ExternalValidationResult[];
  external_validation_summary: {
    required_truthsets: number;
    configured_truthsets: number;
    runnable_truthsets: number;
    evaluated_truthsets: number;
    passing_truthsets: number;
  };
  passed: boolean;
  required_future_truthsets: TruthsetConfig['required_future_truthsets'];
}

interface ExternalValidationResult {
  truthset_id: string;
  source_name: string;
  benchmark_tool: string;
  genome_build: string;
  variant_classes: string[];
  truth_vcf_present: boolean;
  confident_regions_present: boolean;
  query_vcf_present: boolean;
  metrics_present: boolean;
  tool_available: boolean;
  runnable: boolean;
  evaluated: boolean;
  recall?: number;
  precision?: number;
  f1?: number;
  passed: boolean;
  status: 'pass' | 'fail' | 'missing_inputs' | 'missing_tool' | 'missing_metrics';
  gap?: string;
  command_template: string;
}

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function resolveInputPath(inputPath: string, truthsetPath: string, packageDir: string): string {
  if (path.isAbsolute(inputPath)) return inputPath;
  const fromTruthset = path.resolve(path.dirname(truthsetPath), inputPath);
  if (fs.existsSync(fromTruthset)) return fromTruthset;
  return path.resolve(packageDir, inputPath);
}

function hasCommand(command: string): boolean {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function maybeResolveInputPath(inputPath: string | undefined, truthsetPath: string, packageDir: string): string | undefined {
  if (!inputPath) return undefined;
  return resolveInputPath(inputPath, truthsetPath, packageDir);
}

function metricFrom(value: unknown, keys: string[]): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
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

function readExternalMetrics(metricsPath: string | undefined): { recall?: number; precision?: number; f1?: number } {
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

function expectedCallsFor(truthset: Truthset): ExpectedCall[] {
  if (truthset.expected_calls?.length) return truthset.expected_calls;
  return (truthset.expected_call_ids ?? []).map(id => ({
    id,
    class: 'rare_small_variants' as WgsVariantClass,
    reportability: 'clinician_review' as WgsReportability,
  }));
}

function validateTruthset(truthset: Truthset, calls: NormalizedWgsCall[], inputPath: string): ValidationResult {
  const expectedCalls = expectedCallsFor(truthset);
  const observedById = new Map(calls.map(call => [call.id, call]));
  const callIds = new Set(calls.map(call => call.id));
  const expectedIds = new Set(expectedCalls.map(call => call.id));
  const observedClasses = new Set<string>(calls.map(call => call.class));
  const reportableClasses = new Set<string>(calls.filter(call => call.reportability !== 'research_only').map(call => call.class));

  const missingCallIds = expectedCalls.map(call => call.id).filter(id => !callIds.has(id));
  const falsePositiveCallIds = calls.map(call => call.id).filter(id => !expectedIds.has(id));
  const incorrectClasses: ValidationResult['incorrect_classes'] = [];
  const incorrectReportability: ValidationResult['incorrect_reportability'] = [];
  const incorrectGenes: ValidationResult['incorrect_genes'] = [];

  for (const expected of expectedCalls) {
    const observed = observedById.get(expected.id);
    if (!observed) continue;
    if (observed.class !== expected.class) {
      incorrectClasses.push({ id: expected.id, expected: expected.class, observed: observed.class });
    }
    if (observed.reportability !== expected.reportability) {
      incorrectReportability.push({ id: expected.id, expected: expected.reportability, observed: observed.reportability });
    }
    if (expected.genes?.length) {
      const observedGenes = new Set(observed.genes);
      const missingGenes = expected.genes.filter(gene => !observedGenes.has(gene));
      if (missingGenes.length > 0) incorrectGenes.push({ id: expected.id, expected: expected.genes, observed: observed.genes });
    }
  }

  const missingClasses = truthset.expected_classes.filter(id => !observedClasses.has(id));
  const recall = expectedCalls.length === 0
    ? 1
    : roundMetric((expectedCalls.length - missingCallIds.length) / expectedCalls.length);
  const precision = calls.length === 0 ? 0 : roundMetric((calls.length - falsePositiveCallIds.length) / calls.length);
  const passed = missingCallIds.length === 0
    && missingClasses.length === 0
    && falsePositiveCallIds.length === 0
    && incorrectClasses.length === 0
    && incorrectReportability.length === 0
    && incorrectGenes.length === 0
    && recall >= truthset.minimum_recall
    && precision >= (truthset.minimum_precision ?? 1)
    && reportableClasses.size >= truthset.minimum_reportable_classes;
  return {
    truthset_id: truthset.id,
    input_path: inputPath,
    expected_calls: expectedCalls.length,
    observed_calls: expectedCalls.length - missingCallIds.length,
    false_positive_call_ids: falsePositiveCallIds,
    missing_call_ids: missingCallIds,
    incorrect_classes: incorrectClasses,
    incorrect_reportability: incorrectReportability,
    incorrect_genes: incorrectGenes,
    expected_classes: truthset.expected_classes,
    observed_classes: Array.from(observedClasses),
    missing_classes: missingClasses,
    recall,
    precision,
    reportable_classes: reportableClasses.size,
    passed,
  };
}

function externalCommandTemplate(truthset: ExternalTruthset, paths: { truthVcf: string; confidentRegions?: string; queryVcf: string }): string {
  if (truthset.benchmark_tool === 'truvari') {
    const bed = paths.confidentRegions ? ` --includebed ${paths.confidentRegions}` : '';
    return `truvari bench -b ${paths.truthVcf} -c ${paths.queryVcf}${bed} -o output/truvari-${truthset.id}`;
  }
  if (truthset.benchmark_tool === 'hap.py') {
    const bed = paths.confidentRegions ? ` -f ${paths.confidentRegions}` : '';
    return `hap.py ${paths.truthVcf} ${paths.queryVcf}${bed} -o output/happy-${truthset.id}`;
  }
  return `custom benchmark for ${truthset.id}: compare ${paths.queryVcf} against ${paths.truthVcf}`;
}

function validateExternalTruthset(truthset: ExternalTruthset, truthsetPath: string, packageDir: string): ExternalValidationResult {
  const truthVcf = resolveInputPath(truthset.truth_vcf, truthsetPath, packageDir);
  const confidentRegions = maybeResolveInputPath(truthset.confident_regions, truthsetPath, packageDir);
  const queryVcf = resolveInputPath(truthset.query_vcf, truthsetPath, packageDir);
  const metricsPath = maybeResolveInputPath(truthset.metrics_json, truthsetPath, packageDir);
  const truthVcfPresent = fs.existsSync(truthVcf);
  const confidentRegionsPresent = confidentRegions ? fs.existsSync(confidentRegions) : true;
  const queryVcfPresent = fs.existsSync(queryVcf);
  const metricsPresent = metricsPath ? fs.existsSync(metricsPath) : false;
  const toolAvailable = truthset.benchmark_tool === 'custom' ? true : hasCommand(truthset.benchmark_tool);
  const runnable = truthVcfPresent && confidentRegionsPresent && queryVcfPresent && toolAvailable;
  const metrics = readExternalMetrics(metricsPath);
  const evaluated = metrics.recall != null && metrics.precision != null;
  const passed = evaluated
    && (metrics.recall ?? 0) >= truthset.minimum_recall
    && (metrics.precision ?? 0) >= truthset.minimum_precision;
  const status: ExternalValidationResult['status'] = passed
    ? 'pass'
    : evaluated
      ? 'fail'
      : !truthVcfPresent || !confidentRegionsPresent || !queryVcfPresent
        ? 'missing_inputs'
        : !toolAvailable
          ? 'missing_tool'
          : 'missing_metrics';
  const missingInputs = [
    truthVcfPresent ? undefined : 'truth VCF',
    confidentRegionsPresent ? undefined : 'confident regions BED',
    queryVcfPresent ? undefined : 'query VCF',
  ].filter(Boolean).join(', ');
  const gap = status === 'missing_inputs'
    ? `Missing external validation input(s): ${missingInputs}.`
    : status === 'missing_tool'
      ? `Missing ${truthset.benchmark_tool} benchmark tool.`
      : status === 'missing_metrics'
        ? 'External benchmark inputs are present but no metrics JSON has been recorded.'
        : status === 'fail'
          ? `External benchmark metrics are below target recall ${truthset.minimum_recall} and precision ${truthset.minimum_precision}.`
          : undefined;

  return {
    truthset_id: truthset.id,
    source_name: truthset.source_name,
    benchmark_tool: truthset.benchmark_tool,
    genome_build: truthset.genome_build,
    variant_classes: truthset.variant_classes,
    truth_vcf_present: truthVcfPresent,
    confident_regions_present: confidentRegionsPresent,
    query_vcf_present: queryVcfPresent,
    metrics_present: metricsPresent,
    tool_available: toolAvailable,
    runnable,
    evaluated,
    recall: metrics.recall,
    precision: metrics.precision,
    f1: metrics.f1,
    passed,
    status,
    gap,
    command_template: externalCommandTemplate(truthset, { truthVcf, confidentRegions, queryVcf }),
  };
}

function externalValidationSummary(results: ExternalValidationResult[], config: TruthsetConfig): ValidationReport['external_validation_summary'] {
  return {
    required_truthsets: (config.external_truthsets ?? []).filter(item => item.required !== false).length,
    configured_truthsets: config.external_truthsets?.length ?? 0,
    runnable_truthsets: results.filter(result => result.runnable).length,
    evaluated_truthsets: results.filter(result => result.evaluated).length,
    passing_truthsets: results.filter(result => result.passed).length,
  };
}

export function validateWgsVariantClassesFromTruthsets(config: TruthsetConfig, truthsetPath: string, catalogPath: string, packageDir: string): ValidationReport {
  const catalog = readWgsInterpretationCatalog(catalogPath);
  const results = config.truthsets.map((truthset): ValidationResult => {
    const inputPath = resolveInputPath(truthset.input, truthsetPath, packageDir);
    const calls = parseWgsVariantClassVcf(fs.readFileSync(inputPath, 'utf8'), catalog, path.basename(inputPath));
    return validateTruthset(truthset, calls, inputPath);
  });
  const externalValidation = (config.external_truthsets ?? []).map(truthset => validateExternalTruthset(truthset, truthsetPath, packageDir));

  return {
    generated_at: new Date().toISOString(),
    catalog_path: catalogPath,
    truthset_path: truthsetPath,
    results,
    external_validation: externalValidation,
    external_validation_summary: externalValidationSummary(externalValidation, config),
    passed: results.every(result => result.passed),
    required_future_truthsets: config.required_future_truthsets,
  };
}

export function validateWgsVariantClasses(summary: WgsVariantClassSummary, config: TruthsetConfig, summaryPath: string, truthsetPath: string, catalogPath = 'not-used'): ValidationReport {
  const results = config.truthsets.map((truthset): ValidationResult => validateTruthset(truthset, summary.calls, summaryPath));
  const packageDir = path.resolve(path.dirname(truthsetPath), '..');
  const externalValidation = (config.external_truthsets ?? []).map(truthset => validateExternalTruthset(truthset, truthsetPath, packageDir));
  return {
    generated_at: new Date().toISOString(),
    summary_path: summaryPath,
    catalog_path: catalogPath,
    truthset_path: truthsetPath,
    results,
    external_validation: externalValidation,
    external_validation_summary: externalValidationSummary(externalValidation, config),
    passed: results.every(result => result.passed),
    required_future_truthsets: config.required_future_truthsets,
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const truthsetPath = path.resolve(argValue('--truthsets') ?? path.join(packageDir, 'references/wgs-validation-truthsets.json'));
  const catalogPath = path.resolve(argValue('--catalog') ?? path.join(packageDir, 'references/wgs-interpretation-catalog.json'));
  const summaryArg = argValue('--summary');
  const summaryPath = summaryArg ? path.resolve(summaryArg) : undefined;
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/wgs-validation-report.json'));
  const config = readJson<TruthsetConfig>(truthsetPath);
  const report = summaryPath
    ? validateWgsVariantClasses(readJson<WgsVariantClassSummary>(summaryPath), config, summaryPath, truthsetPath, catalogPath)
    : validateWgsVariantClassesFromTruthsets(config, truthsetPath, catalogPath, packageDir);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.passed ? 'pass' : 'fail',
    output: outPath,
    results: report.results.map(result => ({
      truthset_id: result.truthset_id,
      recall: result.recall,
      precision: result.precision,
      reportable_classes: result.reportable_classes,
      missing_calls: result.missing_call_ids.length,
      false_positives: result.false_positive_call_ids.length,
      missing_classes: result.missing_classes.length,
      incorrect_classes: result.incorrect_classes.length,
      incorrect_reportability: result.incorrect_reportability.length,
    })),
    external_validation: report.external_validation_summary,
    external_gaps: report.external_validation.filter(result => !result.passed).map(result => ({
      truthset_id: result.truthset_id,
      status: result.status,
      gap: result.gap,
    })),
  }, null, 2));
  if (!report.passed) process.exit(1);
}

if (process.argv[1]?.endsWith('wgs_validation.ts')) {
  main();
}
