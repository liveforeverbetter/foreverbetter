#!/usr/bin/env npx tsx
/**
 * Internal biomarker coverage benchmark.
 *
 * biomarker_validation.ts verifies expected outputs for synthetic fixtures.
 * This module scores whether the biomarker pipeline is broad and quantitative
 * enough to avoid inflated internal scores from shallow Superpower-style checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { BiomarkerAnalysisSummary } from '../../shared/dashboard-types.js';
import { BIOMARKER_DEFINITIONS, analyzeBiomarkers } from './biomarker_engine.js';
import { parseBiomarkerFile } from './health_data_import.js';

interface BiomarkerBenchmarkRequirements {
  version: string;
  purpose: string;
  source_notes: string[];
  target_supported_markers: number;
  target_domains: number;
  target_min_domain_depth: number;
  target_priority_marker_recall: number;
  target_derived_metrics: number;
  target_truthsets: number;
  target_status_recall: number;
  target_derived_recall: number;
  target_action_completeness: number;
  target_trend_overlap: number;
  target_system_scores: number;
  requires_biological_age_model: boolean;
  priority_markers: string[];
  derived_metrics: string[];
  expected_system_scores: string[];
}

interface BiomarkerValidationReport {
  summary?: {
    truthsets?: number;
    passing_truthsets?: number;
    minimum_status_recall?: number;
    minimum_derived_recall?: number;
    action_completeness?: number;
  };
}

interface BenchmarkMetric {
  id: string;
  label: string;
  actual: number | string | boolean;
  target: number | string | boolean;
  score: number;
  passed: boolean;
  gap?: string;
}

export interface BiomarkerBenchmarkReport {
  generated_at: string;
  requirements_path: string;
  source_notes: string[];
  summary: {
    score: number;
    status: 'pass' | 'warn' | 'fail';
    supported_markers: number;
    domains: number;
    min_domain_depth: number;
    priority_marker_recall: number;
    derived_metrics: number;
    trend_overlap: number;
    system_scores: number;
    biological_age_model: boolean;
    passing_truthsets: number;
    status_recall: number;
    derived_recall: number;
    action_completeness: number;
  };
  missing_priority_markers: string[];
  missing_system_scores: string[];
  metrics: BenchmarkMetric[];
  passed: boolean;
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

function readOptionalJson<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return readJson<T>(filePath);
  } catch {
    return undefined;
  }
}

function normalizeId(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function percentScore(actual: number, target: number): number {
  if (target <= 0) return actual >= target ? 100 : 0;
  return Math.round(Math.max(0, Math.min(1, actual / target)) * 100);
}

function ratioScore(actual: number, target: number): number {
  if (target <= 0) return actual >= target ? 100 : 0;
  return Math.round(Math.max(0, Math.min(1, actual / target)) * 100);
}

function metric(
  id: string,
  label: string,
  actual: number | string | boolean,
  target: number | string | boolean,
  score: number,
  gap?: string,
): BenchmarkMetric {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  return {
    id,
    label,
    actual,
    target,
    score: Math.round(bounded),
    passed: bounded >= 100,
    gap: bounded >= 100 ? undefined : gap,
  };
}

function availableSystemScores(summary: BiomarkerAnalysisSummary): Set<string> {
  const scores = new Set<string>();
  const candidate = summary as BiomarkerAnalysisSummary & {
    system_scores?: Array<{ id?: string; score_id?: string } | string>;
    health_scores?: Array<{ id?: string; score_id?: string } | string>;
    biological_age?: unknown;
  };
  for (const item of [...(candidate.system_scores ?? []), ...(candidate.health_scores ?? [])]) {
    if (typeof item === 'string') {
      scores.add(normalizeId(item));
    } else {
      const id = item.id ?? item.score_id;
      if (id) scores.add(normalizeId(id));
    }
  }
  if (candidate.biological_age != null) scores.add('biological_age');
  return scores;
}

function trendOverlap(repoDir: string): number {
  const currentPath = path.join(repoDir, 'example-data/sample-biomarkers.csv');
  const previousPath = path.join(repoDir, 'example-data/sample-biomarkers-previous.csv');
  if (!fs.existsSync(currentPath) || !fs.existsSync(previousPath)) return 0;
  const current = new Set(parseBiomarkerFile(currentPath).map(reading => normalizeId(reading.id)));
  const previous = new Set(parseBiomarkerFile(previousPath).map(reading => normalizeId(reading.id)));
  return Array.from(current).filter(id => previous.has(id)).length;
}

export function buildBiomarkerBenchmarkReport(params: {
  requirements: BiomarkerBenchmarkRequirements;
  requirementsPath: string;
  packageDir: string;
  repoDir: string;
}): BiomarkerBenchmarkReport {
  const { requirements, requirementsPath, packageDir, repoDir } = params;
  const definitionIds = new Set(BIOMARKER_DEFINITIONS.map(def => def.id));
  const definitionsByDomain = new Map<string, number>();
  for (const def of BIOMARKER_DEFINITIONS) {
    definitionsByDomain.set(def.domain, (definitionsByDomain.get(def.domain) ?? 0) + 1);
  }
  const domainDepths = Array.from(definitionsByDomain.values());
  const minDomainDepth = domainDepths.length > 0 ? Math.min(...domainDepths) : 0;
  const supportedPriority = requirements.priority_markers.filter(id => definitionIds.has(id));
  const missingPriorityMarkers = requirements.priority_markers.filter(id => !definitionIds.has(id));
  const priorityMarkerRecall = requirements.priority_markers.length === 0
    ? 1
    : supportedPriority.length / requirements.priority_markers.length;
  const supportedDerived = requirements.derived_metrics.filter(id => definitionIds.has(id)).length;

  const samplePath = path.join(repoDir, 'example-data/sample-biomarkers.csv');
  const sampleSummary = analyzeBiomarkers(fs.existsSync(samplePath) ? parseBiomarkerFile(samplePath) : []);
  const systemScores = availableSystemScores(sampleSummary);
  const systemScoreCount = systemScores.size;
  const biologicalAgeModel = systemScores.has('biological_age');
  const missingSystemScores = requirements.expected_system_scores.filter(id => !systemScores.has(id));
  const validation = readOptionalJson<BiomarkerValidationReport>(path.join(packageDir, 'output/biomarker-validation-report.json'));
  const validationSummary = validation?.summary ?? {};
  const overlap = trendOverlap(repoDir);

  const metrics = [
    metric('supported_markers', 'Supported biomarker catalog breadth', BIOMARKER_DEFINITIONS.length, requirements.target_supported_markers, percentScore(BIOMARKER_DEFINITIONS.length, requirements.target_supported_markers), 'Supported marker catalog is below the annual 100+ biomarker benchmark.'),
    metric('domain_count', 'Health-system domain count', definitionsByDomain.size, requirements.target_domains, percentScore(definitionsByDomain.size, requirements.target_domains), 'Biomarker definitions do not cover every expected health-system domain.'),
    metric('domain_depth', 'Minimum per-domain definition depth', minDomainDepth, requirements.target_min_domain_depth, percentScore(minDomainDepth, requirements.target_min_domain_depth), 'At least one biomarker domain is too shallow for stable scoring.'),
    metric('priority_marker_recall', 'Priority marker benchmark overlap', `${supportedPriority.length}/${requirements.priority_markers.length}`, `${Math.round(requirements.target_priority_marker_recall * 100)}%`, ratioScore(priorityMarkerRecall, requirements.target_priority_marker_recall), 'High-priority annual-panel markers are missing from the supported catalog.'),
    metric('derived_metrics', 'Derived quantitative metric support', supportedDerived, requirements.target_derived_metrics, percentScore(supportedDerived, requirements.target_derived_metrics), 'Derived biomarker metrics are below the quantitative benchmark.'),
    metric('truthsets', 'Biomarker validation truthset count', validationSummary.passing_truthsets ?? 0, requirements.target_truthsets, percentScore(validationSummary.passing_truthsets ?? 0, requirements.target_truthsets), 'Truthset count is too low to trust biomarker scoring changes.'),
    metric('status_recall', 'Truthset status recall', validationSummary.minimum_status_recall ?? 0, requirements.target_status_recall, ratioScore(validationSummary.minimum_status_recall ?? 0, requirements.target_status_recall), 'Truthsets do not show full status-classification recall.'),
    metric('derived_recall', 'Truthset derived-metric recall', validationSummary.minimum_derived_recall ?? 0, requirements.target_derived_recall, ratioScore(validationSummary.minimum_derived_recall ?? 0, requirements.target_derived_recall), 'Truthsets do not show full derived-metric recall.'),
    metric('action_completeness', 'Truthset action completeness', validationSummary.action_completeness ?? 0, requirements.target_action_completeness, ratioScore(validationSummary.action_completeness ?? 0, requirements.target_action_completeness), 'Biomarker actions lack complete rationale, next-step, or retest fields.'),
    metric('trend_overlap', 'Longitudinal trend overlap', overlap, requirements.target_trend_overlap, percentScore(overlap, requirements.target_trend_overlap), 'Past/current lab fixtures do not overlap enough markers for annual trend scoring.'),
    metric('system_scores', 'Superpower-style health score layer', systemScoreCount, requirements.target_system_scores, percentScore(systemScoreCount, requirements.target_system_scores), 'The pipeline does not yet emit enough named biomarker system scores.'),
    metric('biological_age_model', 'Biomarker biological-age model', biologicalAgeModel, requirements.requires_biological_age_model, biologicalAgeModel || !requirements.requires_biological_age_model ? 100 : 0, 'No biomarker-derived biological-age model is available.'),
  ];

  const rawScore = Math.round(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length);
  const passed = metrics.every(item => item.passed);
  const score = passed ? rawScore : Math.min(rawScore, 89);
  const status = metrics.some(item => item.score < 60) ? 'fail' : passed && score >= 90 ? 'pass' : 'warn';

  return {
    generated_at: new Date().toISOString(),
    requirements_path: requirementsPath,
    source_notes: requirements.source_notes,
    summary: {
      score,
      status,
      supported_markers: BIOMARKER_DEFINITIONS.length,
      domains: definitionsByDomain.size,
      min_domain_depth: minDomainDepth,
      priority_marker_recall: Math.round(priorityMarkerRecall * 1000) / 1000,
      derived_metrics: supportedDerived,
      trend_overlap: overlap,
      system_scores: systemScoreCount,
      biological_age_model: biologicalAgeModel,
      passing_truthsets: validationSummary.passing_truthsets ?? 0,
      status_recall: validationSummary.minimum_status_recall ?? 0,
      derived_recall: validationSummary.minimum_derived_recall ?? 0,
      action_completeness: validationSummary.action_completeness ?? 0,
    },
    missing_priority_markers: missingPriorityMarkers,
    missing_system_scores: missingSystemScores,
    metrics,
    passed,
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const repoDir = path.resolve(packageDir, '../..');
  const requirementsPath = path.resolve(argValue('--requirements') ?? path.join(packageDir, 'references/biomarker-benchmark-requirements.json'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/biomarker-benchmark-report.json'));
  const report = buildBiomarkerBenchmarkReport({
    requirements: readJson<BiomarkerBenchmarkRequirements>(requirementsPath),
    requirementsPath,
    packageDir,
    repoDir,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.passed ? 'pass' : 'fail',
    score: report.summary.score,
    output: outPath,
    gaps: report.metrics.filter(item => !item.passed).map(item => ({ id: item.id, actual: item.actual, target: item.target })),
  }, null, 2));
  if (!report.passed) process.exit(1);
}

if (process.argv[1]?.endsWith('biomarker_benchmark.ts')) {
  main();
}
