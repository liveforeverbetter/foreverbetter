#!/usr/bin/env npx tsx
/**
 * Quantitative pipeline audit.
 *
 * evaluate-report.ts is the release gate. This script is the diagnostic view:
 * it scores each processing, rendering, and skill-hygiene step and writes
 * targeted JSON + Markdown artifacts for debugging regressions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

import type { DashboardOutput } from './index.js';
import { BIOMARKER_DEFINITIONS } from './biomarker_engine.js';
import { hallmarkNames } from './hallmark_engine.js';
import { WEARABLE_DEFINITIONS } from './wearable_engine.js';
import { parseBiomarkerFile } from './health_data_import.js';
import type { BiomarkerAnalysisSummary, LocalVcfCoverageSummary, MultiModalPlan, WearableAnalysisSummary } from '../../shared/dashboard-types.js';

type Status = 'pass' | 'warn' | 'fail';

interface CoverageBenchmark {
  website_claim_requirements: {
    biomarker_domains: string[];
    wearable_domains: string[];
  };
  tellmegen_wgs_baseline: {
    required_sections: string[];
    variant_classes: string[];
  };
  open_source_pass_thresholds: {
    wgs_variant_min: number;
    curated_marker_min: number;
    trait_min: number;
    insight_min: number;
    protocol_min: number;
    variant_card_min: number;
    prs_supported_min: number;
    hallmark_supported_min: number;
    wgs_variant_class_min: number;
    wgs_reportable_class_min: number;
    wgs_validation_truthset_min: number;
    wgs_external_validation_min: number;
    wgs_caller_available_min: number;
    genetics_benchmark_score_min: number;
    genetics_total_report_min: number;
    genetics_category_recall_min: number;
    genetics_report_catalog_quality_min: number;
    genetics_report_catalog_source_type_min: number;
    biomarker_supported_min: number;
    biomarker_measured_min: number;
    biomarker_validation_truthset_min: number;
    biomarker_status_recall_min: number;
    biomarker_derived_recall_min: number;
    biomarker_benchmark_score_min: number;
    biomarker_system_score_min: number;
    biomarker_biological_age_model_min: number;
    wearable_supported_min: number;
    wearable_measured_min: number;
    local_vcf_record_min: number;
    local_vcf_rsid_min: number;
    local_vcf_class_min: number;
    local_vcf_curated_overlap_min: number;
    local_vcf_prs_overlap_min: number;
    compact_catalog_entry_min: number;
    compact_catalog_wellness_min: number;
    compact_catalog_max_bytes: number;
    interpretation_depth_score_min: number;
    interpretation_source_family_min: number;
    interpretation_clinvar_gene_target_min: number;
    interpretation_cpic_gene_drug_rule_min: number;
    interpretation_pgs_variant_min: number;
  };
  internal_quality_targets: {
    genetics: {
      gene_catalog_min: number;
      tellmegen_section_min: number;
      tellmegen_variant_class_min: number;
      prs_supported_min: number;
      wgs_normalized_class_min: number;
      wgs_reportable_call_min: number;
      caller_manifest_min: number;
      caller_available_min: number;
      validation_truthset_min: number;
      external_validation_min: number;
      benchmark_score_min: number;
      total_report_min: number;
      category_recall_min: number;
      report_catalog_quality_min: number;
      report_catalog_source_type_min: number;
      compact_catalog_entry_min: number;
      compact_catalog_wellness_min: number;
      compact_catalog_max_bytes: number;
      interpretation_depth_score_min: number;
      interpretation_source_family_min: number;
      interpretation_clinvar_gene_target_min: number;
      interpretation_cpic_gene_drug_rule_min: number;
      interpretation_pgs_variant_min: number;
    };
    biomarkers: {
      superpower_marker_min: number;
      domain_min: number;
      domain_depth_min: number;
      derived_metric_min: number;
      validation_truthset_min: number;
      status_recall_min: number;
      derived_recall_min: number;
      action_completeness_min: number;
      trend_point_min: number;
      trend_overlap_min: number;
      benchmark_score_min: number;
      system_score_min: number;
      biological_age_model_min: number;
      action_coverage_min: number;
      unit_coverage_min: number;
    };
    wearables: {
      whoop_signal_min: number;
      domain_min: number;
      api_sync_min: number;
    };
    dashboard_ux: {
      core_section_min: number;
      embedded_payload_min: number;
      visual_baseline_min: number;
    };
  };
}

interface AuditCheck {
  stage: string;
  id: string;
  label: string;
  status: Status;
  score: number;
  actual: string | number | boolean;
  target: string | number | boolean;
  recommendation?: string;
}

interface StageSummary {
  stage: string;
  status: Status;
  score: number;
  checks: number;
}

interface AuditReport {
  status: Status;
  score: number;
  generated_at: string;
  json_path: string;
  html_path: string;
  internal_quality: InternalQualityReport;
  stage_summary: StageSummary[];
  checks: AuditCheck[];
  recommendations: string[];
}

interface QualityMetric {
  id: string;
  label: string;
  score: number;
  actual: string | number | boolean;
  target: string | number | boolean;
  weight: number;
  evidence: string;
  gap?: string;
  next_action?: string;
}

interface QualityCategory {
  id: 'genetics' | 'biomarkers' | 'wearables' | 'dashboard_ux';
  label: string;
  benchmark: string;
  score: number;
  status: Status;
  metrics: QualityMetric[];
  gaps: string[];
  next_actions: string[];
}

interface InternalQualityReport {
  score: number;
  status: Status;
  purpose: string;
  categories: QualityCategory[];
  lowest_category: string;
}

interface WgsVariantClassSummary {
  class_counts?: Record<string, number>;
  reportable_count?: number;
  calls?: Array<{ class?: string; reportability?: string; evidence?: string[]; genes?: string[] }>;
}

interface WgsCallerManifest {
  caller_steps?: Array<{ id?: string; variant_class?: string; tool?: string; command_template?: string; available?: boolean }>;
}

interface WgsValidationReport {
  passed?: boolean;
  results?: Array<{ recall?: number; precision?: number; reportable_classes?: number; missing_call_ids?: string[]; missing_classes?: string[]; passed?: boolean }>;
  external_validation?: Array<{ passed?: boolean; status?: string; runnable?: boolean; evaluated?: boolean; recall?: number; precision?: number }>;
  external_validation_summary?: {
    required_truthsets?: number;
    configured_truthsets?: number;
    runnable_truthsets?: number;
    evaluated_truthsets?: number;
    passing_truthsets?: number;
  };
  required_future_truthsets?: Array<{ id?: string; status?: string; reason?: string }>;
}

interface WgsExternalValidationReport {
  summary?: {
    required_truthsets?: number;
    configured_truthsets?: number;
    runnable_truthsets?: number;
    evaluated_truthsets?: number;
    passing_truthsets?: number;
    missing_inputs?: number;
    missing_tools?: number;
    missing_metrics?: number;
  };
}

interface WgsTruthsetSetupReport {
  summary?: {
    truthsets?: number;
    artifacts?: number;
    present_artifacts?: number;
    missing_truth_artifacts?: number;
    missing_truth_indexes?: number;
    missing_query_vcfs?: number;
    missing_query_indexes?: number;
    missing_metrics?: number;
    downloadable_missing_artifacts?: number;
    tools_available?: number;
    tools_required?: number;
  };
  next_actions?: string[];
  ready_for_external_validation?: boolean;
}

interface WgsQueryReadinessReport {
  setup_script_path?: string;
  local_run_assessment?: {
    difficulty?: string;
    runnable_now?: boolean;
    blocker_count?: number;
    blockers?: string[];
  };
  summary?: {
    truthsets?: number;
    ready_to_validate?: number;
    ready_to_generate?: number;
    query_vcfs_present?: number;
    query_indexes_present?: number;
    missing_inputs?: number;
    missing_caller_tools?: number;
    caller_container_plans?: number;
    caller_container_images_present?: number;
    caller_container_image_timeouts?: number;
    postprocess_tools_available?: number;
    postprocess_tools_required?: number;
    benchmark_tools_available?: number;
    benchmark_tools_required?: number;
    benchmark_container_plans?: number;
    benchmark_container_images_present?: number;
    benchmark_container_image_timeouts?: number;
    container_runtime_available?: boolean;
    hard_local_steps?: number;
    run_plans?: number;
    setup_plan_steps?: number;
  };
  next_actions?: string[];
  ready_for_query_generation?: boolean;
}

interface GeneticsBenchmarkReport {
  passed?: boolean;
  summary?: {
    score?: number;
    total_reports?: number;
    total_report_target?: number;
    category_recall?: number;
    rendered_sections?: number;
    raw_download_types?: number;
    variant_classes?: number;
    external_validation_sources?: number;
    caller_available?: number;
    prs_supported?: number;
    gene_catalog?: number;
    report_catalog_quality?: number;
    report_catalog_source_types?: number;
    report_catalog_duplicates?: number;
    interpretation_depth_score?: number;
    interpretation_source_families?: number;
    interpretation_clinvar_gene_targets?: number;
    interpretation_cpic_gene_drug_rules?: number;
    interpretation_pgs_variants?: number;
    interpretation_requires_large_database?: boolean;
  };
  missing_categories?: string[];
}

interface LocalVcfCoverageReport {
  summary?: LocalVcfCoverageSummary;
}

interface CompactInterpretationCatalog {
  summary?: {
    total_entries?: number;
    consumer_ready_entries?: number;
    wellness_optimization_entries?: number;
    requires_deeper_caller_entries?: number;
    compiled_json_bytes?: number;
    within_repo_size_budget?: boolean;
    raw_read_callers_required_for_default?: boolean;
  };
}

interface CompactCatalogSummary {
  total_entries: number;
  consumer_ready_entries: number;
  wellness_optimization_entries: number;
  requires_deeper_caller_entries: number;
  compiled_json_bytes: number;
  within_repo_size_budget: boolean;
  raw_read_callers_required_for_default: boolean;
}

interface BiomarkerValidationReport {
  passed?: boolean;
  summary?: {
    truthsets?: number;
    passing_truthsets?: number;
    minimum_status_recall?: number;
    minimum_derived_recall?: number;
    action_completeness?: number;
  };
}

interface BiomarkerBenchmarkReport {
  passed?: boolean;
  summary?: {
    score?: number;
    status?: string;
    system_scores?: number;
    biological_age_model?: boolean;
    priority_marker_recall?: number;
    trend_overlap?: number;
  };
  missing_system_scores?: string[];
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

function readBenchmark(scriptDir: string): CoverageBenchmark {
  return readJson<CoverageBenchmark>(path.resolve(scriptDir, '../../references/coverage-benchmark.json'));
}

function scriptJson<T>(html: string, id: string): T | undefined {
  const re = new RegExp(`<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(re);
  if (!match) return undefined;
  const raw = match[1].trim();
  if (!raw || raw === 'null') return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function statusFromScore(score: number): Status {
  if (score >= 0.9) return 'pass';
  if (score >= 0.6) return 'warn';
  return 'fail';
}

function addCheck(
  checks: AuditCheck[],
  stage: string,
  id: string,
  label: string,
  score: number,
  actual: AuditCheck['actual'],
  target: AuditCheck['target'],
  recommendation?: string,
): void {
  const normalized = Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0));
  checks.push({
    stage,
    id,
    label,
    status: statusFromScore(normalized),
    score: Number(normalized.toFixed(3)),
    actual,
    target,
    recommendation,
  });
}

function minScore(actual: number, target: number): number {
  if (target <= 0) return actual >= target ? 1 : 0;
  return Math.min(actual / target, 1);
}

function percentScore(actual: number, target: number): number {
  return Math.round(minScore(actual, target) * 100);
}

function boolScore(value: boolean): number {
  return value ? 1 : 0;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function duplicateCount(values: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const value of values.map(v => v.trim().toLowerCase()).filter(Boolean)) {
    if (seen.has(value)) duplicates++;
    seen.add(value);
  }
  return duplicates;
}

function countVariantCards(output: DashboardOutput): number {
  const cards = output.metadata.variant_cards;
  if (!cards) return output.metadata.variant_tab_count ?? 0;
  return Object.values(cards).reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
}

function uniqueVariantGenes(output: DashboardOutput): number {
  const genes = new Set<string>();
  const cards = output.metadata.variant_cards;
  if (!cards) return 0;
  for (const group of Object.values(cards)) {
    if (!Array.isArray(group)) continue;
    for (const card of group) {
      const gene = typeof card.gene === 'string' ? card.gene.trim() : '';
      if (gene) genes.add(gene);
    }
  }
  return genes.size;
}

function supportedPrsDefinitions(scriptDir: string): number {
  const weightsPath = path.resolve(scriptDir, '../../shared/prs_weights.json');
  if (!fs.existsSync(weightsPath)) return 0;
  const raw = readJson<{ variants?: Array<{ disease?: string }> }>(weightsPath);
  return new Set((raw.variants ?? []).map(v => v.disease).filter(Boolean)).size;
}

function appearsInOrder(html: string, labels: string[]): boolean {
  let offset = -1;
  for (const label of labels) {
    const next = html.indexOf(label, offset + 1);
    if (next < 0) return false;
    offset = next;
  }
  return true;
}

function hasBlankGeneratedCards(html: string): boolean {
  return [
    /class="protocol-title">\s*<\/div>/,
    /class="analysis-domain-name">\s*<\/div>/,
    /class="insight-title">\s*<\/h3>/,
    /class="actionable-title">\s*<\/h3>/,
    /class="cat-detail-title">\s*<\/div>/,
  ].some(pattern => pattern.test(html));
}

function scriptIds(html: string): string[] {
  return Array.from(html.matchAll(/<script[^>]+id=["']([^"']+)["'][^>]*>/gi)).map(match => match[1]);
}

function htmlIncludesAll(html: string, labels: string[]): number {
  const normalized = html.toLowerCase();
  return labels.filter(label => normalized.includes(label.toLowerCase())).length;
}

function weightedScore(metrics: QualityMetric[]): number {
  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
  if (totalWeight <= 0) return 0;
  return Math.round(metrics.reduce((sum, metric) => sum + metric.score * metric.weight, 0) / totalWeight);
}

function metric(
  id: string,
  label: string,
  score: number,
  actual: QualityMetric['actual'],
  target: QualityMetric['target'],
  weight: number,
  evidence: string,
  gap?: string,
  nextAction?: string,
): QualityMetric {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  return {
    id,
    label,
    score: Math.round(bounded),
    actual,
    target,
    weight,
    evidence,
    gap: bounded >= 90 ? undefined : gap,
    next_action: bounded >= 90 ? undefined : nextAction,
  };
}

function category(
  id: QualityCategory['id'],
  label: string,
  benchmark: string,
  metrics: QualityMetric[],
): QualityCategory {
  const score = weightedScore(metrics);
  const status = metrics.some(item => item.score < 60)
    ? 'fail'
    : metrics.some(item => item.score < 90)
      ? 'warn'
      : statusFromScore(score / 100);
  return {
    id,
    label,
    benchmark,
    score,
    status,
    metrics,
    gaps: metrics.map(item => item.gap).filter((item): item is string => Boolean(item)),
    next_actions: metrics.map(item => item.next_action).filter((item): item is string => Boolean(item)),
  };
}

function normalizedId(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function biomarkerTrendReadiness(repoDir: string): { dates: number; overlap: number; points: number } {
  const currentPath = path.join(repoDir, 'example-data/sample-biomarkers.csv');
  const previousPath = path.join(repoDir, 'example-data/sample-biomarkers-previous.csv');
  if (!fs.existsSync(currentPath) || !fs.existsSync(previousPath)) return { dates: 0, overlap: 0, points: 0 };

  const current = parseBiomarkerFile(currentPath);
  const previous = parseBiomarkerFile(previousPath);
  const dates = new Set([...current, ...previous].map(reading => reading.collected_at).filter(Boolean));
  const currentIds = new Set(current.map(reading => normalizedId(reading.id)));
  const previousIds = new Set(previous.map(reading => normalizedId(reading.id)));
  const overlap = Array.from(currentIds).filter(id => previousIds.has(id)).length;
  const points = (dates.size >= 2 ? 1 : 0) + (overlap >= 25 ? 1 : 0);
  return { dates: dates.size, overlap, points };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function writeVisualBaseline(packageDir: string, html: string, embeddedScriptIds: string[]): number {
  const styleBlocks = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)).map(match => match[1]).join('\n');
  const sectionMarkers = ['Standout variants', 'Strengths across your data', 'Healthspan index', 'Action plan', 'Genome register', 'Bloodwork register', 'Behavioral register']
    .map(label => ({ label, present: html.toLowerCase().includes(label.toLowerCase()) }));
  const baseline = {
    generated_at: new Date().toISOString(),
    html_sha256: sha256(html),
    css_sha256: sha256(styleBlocks),
    html_bytes: Buffer.byteLength(html, 'utf8'),
    css_bytes: Buffer.byteLength(styleBlocks, 'utf8'),
    embedded_script_ids: embeddedScriptIds,
    section_markers: sectionMarkers,
  };
  const outputPath = path.join(packageDir, 'output/pipeline-visual-baseline.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  return baseline.html_sha256 && baseline.css_sha256 && sectionMarkers.every(item => item.present) ? 1 : 0;
}

function whoopApiSyncReadiness(packageDir: string): { score: number; evidence: string } {
  const clientPath = path.join(packageDir, 'scripts/pipeline/whoop_api_client.ts');
  if (!fs.existsSync(clientPath)) return { score: 0, evidence: 'missing client module' };
  const client = fs.readFileSync(clientPath, 'utf8');
  const required = [
    'WHOOP_ACCESS_TOKEN',
    '/cycle',
    '/recovery',
    '/activity/sleep',
    '/activity/workout',
    'Authorization',
  ];
  const present = required.filter(token => client.includes(token)).length;
  return {
    score: percentScore(present, required.length),
    evidence: `${present}/${required.length} required sync primitives present`,
  };
}

function readOptionalJson<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return readJson<T>(filePath);
  } catch {
    return undefined;
  }
}

function wgsVariantClassReadiness(packageDir: string): {
  normalizedClasses: number;
  reportableCalls: number;
  reportableClasses: number;
  callerSteps: number;
  callerAvailable: number;
  validationTruthsets: number;
  externalValidationSources: number;
  externalValidationConfigured: number;
  externalValidationRunnable: number;
  truthsetSetupArtifacts: number;
  truthsetSetupTruthsets: number;
  truthsetSetupActions: number;
  truthsetSetupToolsRequired: number;
  queryReadinessTruthsets: number;
  queryReadinessReady: number;
  queryReadinessHardSteps: number;
  queryReadinessRunPlans: number;
  querySetupPlanSteps: number;
  querySetupScriptPresent: boolean;
  queryLocalRunDifficulty: string;
  queryLocalRunBlockers: number;
  queryLocalRunRunnableNow: boolean;
  queryCallerContainerPlans: number;
  queryCallerContainerImagesPresent: number;
  queryCallerContainerImageTimeouts: number;
  queryPostprocessToolsAvailable: number;
  queryPostprocessToolsRequired: number;
  queryBenchmarkToolsAvailable: number;
  queryBenchmarkToolsRequired: number;
  queryBenchmarkContainerPlans: number;
  queryBenchmarkContainerImagesPresent: number;
  queryBenchmarkContainerImageTimeouts: number;
  queryContainerRuntimeAvailable: boolean;
  evidenceAnnotated: number;
  validationRecall: number;
  validationPrecision: number;
} {
  const summary = readOptionalJson<WgsVariantClassSummary>(path.join(packageDir, 'output/wgs-variant-class-summary.json'));
  const manifest = readOptionalJson<WgsCallerManifest>(path.join(packageDir, 'output/wgs-caller-manifest.json'));
  const validation = readOptionalJson<WgsValidationReport>(path.join(packageDir, 'output/wgs-validation-report.json'));
  const externalValidation = readOptionalJson<WgsExternalValidationReport>(path.join(packageDir, 'output/wgs-external-validation-report.json'));
  const truthsetSetup = readOptionalJson<WgsTruthsetSetupReport>(path.join(packageDir, 'output/wgs-external-truthset-setup.json'));
  const queryReadiness = readOptionalJson<WgsQueryReadinessReport>(path.join(packageDir, 'output/wgs-query-readiness.json'));
  const calls = summary?.calls ?? [];
  const normalizedClasses = Object.values(summary?.class_counts ?? {}).filter(value => Number(value) > 0).length;
  const reportableCalls = Number(summary?.reportable_count ?? 0);
  const reportableClasses = new Set(calls.filter(call => call.reportability && call.reportability !== 'research_only').map(call => call.class).filter(Boolean)).size;
  const callerSteps = manifest?.caller_steps?.filter(step => step.tool && step.command_template && step.variant_class).length ?? 0;
  const callerAvailable = manifest?.caller_steps?.filter(step => step.available && step.tool && step.command_template && step.variant_class).length ?? 0;
  const evidenceAnnotated = calls.filter(call => (call.evidence?.length ?? 0) > 0 && (call.genes?.length ?? 0) > 0).length;
  const validationResults = validation?.results ?? [];
  const validationTruthsets = validationResults.filter(result => result.passed).length;
  const externalSummary = externalValidation?.summary ?? validation?.external_validation_summary;
  const externalValidationSources = externalSummary?.passing_truthsets ?? 0;
  const externalValidationConfigured = externalSummary?.configured_truthsets ?? 0;
  const externalValidationRunnable = externalSummary?.runnable_truthsets ?? 0;
  const validationRecall = Math.round(Math.min(...validationResults.map(result => result.recall ?? 0)) * 100);
  const validationPrecision = Math.round(Math.min(...validationResults.map(result => result.precision ?? 0)) * 100);
  return {
    normalizedClasses,
    reportableCalls,
    reportableClasses,
    callerSteps,
    callerAvailable,
    validationTruthsets,
    externalValidationSources,
    externalValidationConfigured,
    externalValidationRunnable,
    truthsetSetupArtifacts: truthsetSetup?.summary?.artifacts ?? 0,
    truthsetSetupTruthsets: truthsetSetup?.summary?.truthsets ?? 0,
    truthsetSetupActions: truthsetSetup?.next_actions?.length ?? 0,
    truthsetSetupToolsRequired: truthsetSetup?.summary?.tools_required ?? 0,
    queryReadinessTruthsets: queryReadiness?.summary?.truthsets ?? 0,
    queryReadinessReady: (queryReadiness?.summary?.ready_to_generate ?? 0) + (queryReadiness?.summary?.ready_to_validate ?? 0),
    queryReadinessHardSteps: queryReadiness?.summary?.hard_local_steps ?? 0,
    queryReadinessRunPlans: queryReadiness?.summary?.run_plans ?? 0,
    querySetupPlanSteps: queryReadiness?.summary?.setup_plan_steps ?? 0,
    querySetupScriptPresent: Boolean(queryReadiness?.setup_script_path && fs.existsSync(queryReadiness.setup_script_path)),
    queryLocalRunDifficulty: queryReadiness?.local_run_assessment?.difficulty ?? 'unknown',
    queryLocalRunBlockers: queryReadiness?.local_run_assessment?.blocker_count ?? 0,
    queryLocalRunRunnableNow: Boolean(queryReadiness?.local_run_assessment?.runnable_now),
    queryCallerContainerPlans: queryReadiness?.summary?.caller_container_plans ?? 0,
    queryCallerContainerImagesPresent: queryReadiness?.summary?.caller_container_images_present ?? 0,
    queryCallerContainerImageTimeouts: queryReadiness?.summary?.caller_container_image_timeouts ?? 0,
    queryPostprocessToolsAvailable: queryReadiness?.summary?.postprocess_tools_available ?? 0,
    queryPostprocessToolsRequired: queryReadiness?.summary?.postprocess_tools_required ?? 0,
    queryBenchmarkToolsAvailable: queryReadiness?.summary?.benchmark_tools_available ?? 0,
    queryBenchmarkToolsRequired: queryReadiness?.summary?.benchmark_tools_required ?? 0,
    queryBenchmarkContainerPlans: queryReadiness?.summary?.benchmark_container_plans ?? 0,
    queryBenchmarkContainerImagesPresent: queryReadiness?.summary?.benchmark_container_images_present ?? 0,
    queryBenchmarkContainerImageTimeouts: queryReadiness?.summary?.benchmark_container_image_timeouts ?? 0,
    queryContainerRuntimeAvailable: Boolean(queryReadiness?.summary?.container_runtime_available),
    evidenceAnnotated,
    validationRecall: Number.isFinite(validationRecall) ? validationRecall : 0,
    validationPrecision: Number.isFinite(validationPrecision) ? validationPrecision : 0,
  };
}

function geneticsBenchmarkReadiness(packageDir: string): {
  score: number;
  totalReports: number;
  totalReportTarget: number;
  categoryRecall: number;
  missingCategories: number;
  reportCatalogQuality: number;
  reportCatalogSourceTypes: number;
  reportCatalogDuplicates: number;
  interpretationDepthScore: number;
  interpretationSourceFamilies: number;
  interpretationClinvarGeneTargets: number;
  interpretationCpicGeneDrugRules: number;
  interpretationPgsVariants: number;
  interpretationRequiresLargeDatabase: boolean;
} {
  const benchmark = readOptionalJson<GeneticsBenchmarkReport>(path.join(packageDir, 'output/genetics-benchmark-report.json'));
  return {
    score: benchmark?.summary?.score ?? 0,
    totalReports: benchmark?.summary?.total_reports ?? 0,
    totalReportTarget: benchmark?.summary?.total_report_target ?? 0,
    categoryRecall: Math.round((benchmark?.summary?.category_recall ?? 0) * 100),
    missingCategories: benchmark?.missing_categories?.length ?? 0,
    reportCatalogQuality: Math.round((benchmark?.summary?.report_catalog_quality ?? 0) * 100),
    reportCatalogSourceTypes: benchmark?.summary?.report_catalog_source_types ?? 0,
    reportCatalogDuplicates: benchmark?.summary?.report_catalog_duplicates ?? 0,
    interpretationDepthScore: benchmark?.summary?.interpretation_depth_score ?? 0,
    interpretationSourceFamilies: benchmark?.summary?.interpretation_source_families ?? 0,
    interpretationClinvarGeneTargets: benchmark?.summary?.interpretation_clinvar_gene_targets ?? 0,
    interpretationCpicGeneDrugRules: benchmark?.summary?.interpretation_cpic_gene_drug_rules ?? 0,
    interpretationPgsVariants: benchmark?.summary?.interpretation_pgs_variants ?? 0,
    interpretationRequiresLargeDatabase: Boolean(benchmark?.summary?.interpretation_requires_large_database),
  };
}

function localVcfCoverageReadiness(packageDir: string, output?: DashboardOutput): LocalVcfCoverageSummary | undefined {
  return readOptionalJson<LocalVcfCoverageReport>(path.join(packageDir, 'output/local-vcf-coverage.json'))?.summary
    ?? output?.metadata.local_vcf_coverage;
}

function compactCatalogReadiness(packageDir: string): CompactCatalogSummary {
  const summary = readOptionalJson<CompactInterpretationCatalog>(path.join(packageDir, 'output/compact-interpretation-catalog.json'))?.summary;
  return {
    total_entries: summary?.total_entries ?? 0,
    consumer_ready_entries: summary?.consumer_ready_entries ?? 0,
    wellness_optimization_entries: summary?.wellness_optimization_entries ?? 0,
    requires_deeper_caller_entries: summary?.requires_deeper_caller_entries ?? 0,
    compiled_json_bytes: summary?.compiled_json_bytes ?? 0,
    within_repo_size_budget: Boolean(summary?.within_repo_size_budget),
    raw_read_callers_required_for_default: summary?.raw_read_callers_required_for_default ?? true,
  };
}

function biomarkerAnalyticReadiness(repoDir: string, biomarker?: BiomarkerAnalysisSummary): {
  derivedMetrics: number;
  domainDepth: number;
  actionCoverage: number;
  unitCoverage: number;
  trendOverlap: number;
  benchmarkScore: number;
  benchmarkSystemScores: number;
  benchmarkBiologicalAgeModel: number;
  benchmarkPriorityRecall: number;
  benchmarkMissingSystemScores: number;
  validationTruthsets: number;
  validationStatusRecall: number;
  validationDerivedRecall: number;
  validationActionCompleteness: number;
} {
  const derivedIds = new Set(['homa_ir', 'non_hdl_c', 'remnant_cholesterol', 'apob_apoa1_ratio', 'transferrin_saturation', 'vldl_c']);
  const derivedMetrics = (biomarker?.findings ?? []).filter(finding => derivedIds.has(finding.id)).length;
  const domainDepth = Math.min(...(biomarker?.domains ?? []).filter(domain => domain.measured > 0).map(domain => domain.measured));
  const actionCoverage = (biomarker?.action_items ?? []).filter(action => action.rationale && action.next_step && action.retest_window).length;
  const unitCoverage = (biomarker?.findings ?? []).length === 0
    ? 0
    : Math.round(((biomarker?.findings ?? []).filter(finding => finding.unit && finding.unit !== 'unknown').length / (biomarker?.findings ?? []).length) * 100);
  const currentPath = path.join(repoDir, 'example-data/sample-biomarkers.csv');
  const previousPath = path.join(repoDir, 'example-data/sample-biomarkers-previous.csv');
  let trendOverlap = 0;
  if (fs.existsSync(currentPath) && fs.existsSync(previousPath)) {
    const current = new Set(parseBiomarkerFile(currentPath).map(reading => normalizedId(reading.id)));
    const previous = new Set(parseBiomarkerFile(previousPath).map(reading => normalizedId(reading.id)));
    trendOverlap = Array.from(current).filter(id => previous.has(id)).length;
  }
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const validation = readOptionalJson<BiomarkerValidationReport>(path.join(packageDir, 'output/biomarker-validation-report.json'));
  const benchmark = readOptionalJson<BiomarkerBenchmarkReport>(path.join(packageDir, 'output/biomarker-benchmark-report.json'));
  return {
    derivedMetrics,
    domainDepth: Number.isFinite(domainDepth) ? domainDepth : 0,
    actionCoverage,
    unitCoverage,
    trendOverlap,
    benchmarkScore: benchmark?.summary?.score ?? 0,
    benchmarkSystemScores: benchmark?.summary?.system_scores ?? 0,
    benchmarkBiologicalAgeModel: benchmark?.summary?.biological_age_model ? 1 : 0,
    benchmarkPriorityRecall: Math.round((benchmark?.summary?.priority_marker_recall ?? 0) * 100),
    benchmarkMissingSystemScores: benchmark?.missing_system_scores?.length ?? 0,
    validationTruthsets: validation?.summary?.passing_truthsets ?? 0,
    validationStatusRecall: Math.round((validation?.summary?.minimum_status_recall ?? 0) * 100),
    validationDerivedRecall: Math.round((validation?.summary?.minimum_derived_recall ?? 0) * 100),
    validationActionCompleteness: Math.round((validation?.summary?.action_completeness ?? 0) * 100),
  };
}

function markdown(report: AuditReport): string {
  const lines: string[] = [
    '# Genomic Pipeline Audit',
    '',
    `Status: **${report.status}**`,
    `Score: **${report.score}/100**`,
    `Generated: ${report.generated_at}`,
    '',
    '## Internal Quality Benchmarks',
    '',
    'These scores are internal iteration targets only. They are not consumer-facing dashboard content.',
    '',
    `Overall internal quality: **${report.internal_quality.score}/100** (${report.internal_quality.status})`,
    `Lowest category: **${report.internal_quality.lowest_category}**`,
    '',
    '| Category | Benchmark | Status | Score | Top Gaps |',
    '|---|---|---:|---:|---|',
    ...report.internal_quality.categories.map(item => `| ${item.label} | ${item.benchmark} | ${item.status} | ${item.score}/100 | ${item.gaps.slice(0, 2).join('; ') || 'None'} |`),
    '',
    '### Internal Metric Detail',
    '',
    '| Category | Metric | Score | Actual | Target | Gap |',
    '|---|---|---:|---:|---:|---|',
    ...report.internal_quality.categories.flatMap(item => item.metrics.map(metric => `| ${item.id} | ${metric.label} | ${metric.score} | ${String(metric.actual)} | ${String(metric.target)} | ${metric.gap ?? 'None'} |`)),
    '',
    '## Stage Summary',
    '',
    '| Stage | Status | Score | Checks |',
    '|---|---:|---:|---:|',
    ...report.stage_summary.map(stage => `| ${stage.stage} | ${stage.status} | ${stage.score}/100 | ${stage.checks} |`),
    '',
    '## Checks',
    '',
    '| Stage | Check | Status | Score | Actual | Target |',
    '|---|---|---:|---:|---:|---:|',
    ...report.checks.map(check => `| ${check.stage} | ${check.label} | ${check.status} | ${Math.round(check.score * 100)} | ${String(check.actual)} | ${String(check.target)} |`),
  ];

  if (report.recommendations.length > 0) {
    lines.push('', '## Recommendations', '');
    for (const recommendation of report.recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function summarize(checks: AuditCheck[]): StageSummary[] {
  const byStage = new Map<string, AuditCheck[]>();
  for (const check of checks) {
    const group = byStage.get(check.stage) ?? [];
    group.push(check);
    byStage.set(check.stage, group);
  }

  return Array.from(byStage.entries()).map(([stage, group]) => {
    const score = group.reduce((sum, check) => sum + check.score, 0) / group.length;
    return {
      stage,
      status: group.some(check => check.status === 'fail') ? 'fail' : group.some(check => check.status === 'warn') ? 'warn' : 'pass',
      score: Math.round(score * 100),
      checks: group.length,
    };
  });
}

function buildInternalQuality(params: {
  benchmark: CoverageBenchmark;
  output: DashboardOutput;
  html: string;
  biomarker?: BiomarkerAnalysisSummary;
  wearable?: WearableAnalysisSummary;
  multimodal?: MultiModalPlan;
  variantCards: number;
  supportedPrs: number;
  prsScored: number;
  vepStatus?: string;
  embeddedScriptIds: string[];
  repoDir: string;
  packageDir: string;
}): InternalQualityReport {
  const { benchmark, output, html, biomarker, wearable, multimodal, variantCards, supportedPrs, prsScored, vepStatus, embeddedScriptIds, repoDir, packageDir } = params;
  const targets = benchmark.internal_quality_targets;
  const localVcfCoverage = localVcfCoverageReadiness(packageDir, output);
  const variantCount = Math.max(
    output.metadata.variant_count ?? 0,
    output.metadata.annotated_count ?? 0,
    localVcfCoverage?.total_records ?? 0,
  );
  const uniqueGenes = uniqueVariantGenes(output);
  const tellmegenSectionLabels = ['Genome register', 'Genome analysis summary', 'Polygenic risk', 'Hereditary', 'medication findings', 'Aging hallmark'];
  const tellmegenSections = htmlIncludesAll(html, tellmegenSectionLabels);
  const wgsClasses = wgsVariantClassReadiness(packageDir);
  const geneticsBenchmark = geneticsBenchmarkReadiness(packageDir);
  const compactCatalog = compactCatalogReadiness(packageDir);
  const genetics = category('genetics', 'Genetics analysis coverage', 'TellmeGen-style WGS breadth', [
    metric('wgs_scale', 'WGS-scale variant input', percentScore(variantCount, benchmark.open_source_pass_thresholds.wgs_variant_min), variantCount, benchmark.open_source_pass_thresholds.wgs_variant_min, 0.07, 'Total variant count in DashboardOutput metadata.', 'Sample input is below WGS scale.', 'Use full WGS fixture or explicit reduced-coverage mode.'),
    metric('local_vcf_coverage', 'Local VCF fixture coverage', localVcfCoverage
      && localVcfCoverage.total_records >= benchmark.open_source_pass_thresholds.local_vcf_record_min
      && localVcfCoverage.unique_rsids >= benchmark.open_source_pass_thresholds.local_vcf_rsid_min
      && localVcfCoverage.classes_present >= benchmark.open_source_pass_thresholds.local_vcf_class_min
      && localVcfCoverage.curated_rsids_observed >= benchmark.open_source_pass_thresholds.local_vcf_curated_overlap_min
      && localVcfCoverage.prs_rsids_observed >= benchmark.open_source_pass_thresholds.local_vcf_prs_overlap_min ? 100 : 0,
      `${localVcfCoverage?.total_records ?? 0} records, ${localVcfCoverage?.unique_rsids ?? 0} rsIDs, ${localVcfCoverage?.classes_present ?? 0} classes, ${localVcfCoverage?.curated_rsids_observed ?? 0} curated, ${localVcfCoverage?.prs_rsids_observed ?? 0} PRS`,
      `${benchmark.open_source_pass_thresholds.local_vcf_record_min}+ records / ${benchmark.open_source_pass_thresholds.local_vcf_class_min}+ classes`,
      0.05,
      'output/local-vcf-coverage.json measures bundled SNP, indel, CNV, SV, repeat, curated-marker, and PRS fixture overlap.',
      'Local VCF fixtures do not cover enough records, classes, rsIDs, curated markers, or PRS variants.',
      'Regenerate npm run vcf:coverage and expand local VCF fixtures before trusting local coverage.'),
    metric('compact_vcf_catalog', 'Compact VCF-first interpretation catalog', compactCatalog.total_entries >= targets.genetics.compact_catalog_entry_min
      && compactCatalog.consumer_ready_entries >= targets.genetics.compact_catalog_entry_min
      && compactCatalog.wellness_optimization_entries >= targets.genetics.compact_catalog_wellness_min
      && compactCatalog.compiled_json_bytes <= targets.genetics.compact_catalog_max_bytes
      && compactCatalog.raw_read_callers_required_for_default === false ? 100 : 0,
      `${compactCatalog.total_entries} entries, ${compactCatalog.consumer_ready_entries} consumer-ready, ${compactCatalog.wellness_optimization_entries} wellness/optimization, ${compactCatalog.compiled_json_bytes} bytes, raw-callers-required=${compactCatalog.raw_read_callers_required_for_default}`,
      `${targets.genetics.compact_catalog_entry_min}+ entries / ${targets.genetics.compact_catalog_wellness_min}+ wellness / <=${targets.genetics.compact_catalog_max_bytes} bytes`,
      0.05,
      'output/compact-interpretation-catalog.json measures repo-contained VCF-first interpretation breadth and size.',
      'Compact VCF catalog is too small, too large, missing wellness/optimization entries, or requires raw-read callers by default.',
      'Run npm run catalog:build and keep raw source databases out of git while compiling stronger source-backed slices.'),
    metric('interpretation_depth', 'Compact interpretation depth', Math.min(
      percentScore(geneticsBenchmark.interpretationDepthScore, targets.genetics.interpretation_depth_score_min),
      percentScore(geneticsBenchmark.interpretationSourceFamilies, targets.genetics.interpretation_source_family_min),
      percentScore(geneticsBenchmark.interpretationClinvarGeneTargets, targets.genetics.interpretation_clinvar_gene_target_min),
      percentScore(geneticsBenchmark.interpretationCpicGeneDrugRules, targets.genetics.interpretation_cpic_gene_drug_rule_min),
      percentScore(geneticsBenchmark.interpretationPgsVariants, targets.genetics.interpretation_pgs_variant_min),
      geneticsBenchmark.interpretationRequiresLargeDatabase ? 0 : 100,
    ),
      `${geneticsBenchmark.interpretationDepthScore} score, ${geneticsBenchmark.interpretationSourceFamilies} sources, ${geneticsBenchmark.interpretationClinvarGeneTargets} ClinVar genes, ${geneticsBenchmark.interpretationCpicGeneDrugRules} CPIC rules, ${geneticsBenchmark.interpretationPgsVariants} PGS variants, large-db=${geneticsBenchmark.interpretationRequiresLargeDatabase}`,
      `${targets.genetics.interpretation_depth_score_min}+ score / ${targets.genetics.interpretation_source_family_min}+ sources / no large DB`,
      0.08,
      'output/interpretation-depth-report.json measures compact ClinVar, CPIC, PGS, curated marker, and WGS class coverage.',
      'Interpretation depth is below the local-first WGS benchmark.',
      'Run npm run interpretation:depth and expand compact ClinVar/CPIC/PGS slices without vendoring raw databases.'),
    metric('tellmegen_sections', 'TellmeGen report-section parity', percentScore(tellmegenSections, targets.genetics.tellmegen_section_min), `${tellmegenSections}/${targets.genetics.tellmegen_section_min}`, targets.genetics.tellmegen_section_min, 0.08, 'Rendered dashboard contains the core genetics report sections.', 'One or more core genetics report sections are missing.', 'Keep genetic vulnerability, pharmacogenetics, hereditary, traits, wellness, and ancestry represented.'),
    metric('gene_catalog', 'Unique gene coverage proxy', percentScore(uniqueGenes, targets.genetics.gene_catalog_min), uniqueGenes, targets.genetics.gene_catalog_min, 0.08, 'Unique genes observed across variant cards.', 'Variant-card gene breadth is below the internal WGS benchmark.', 'Expand ClinVar/interpretation coverage or improve full-genome annotation.'),
    metric('prs_catalog', 'PRS catalog support', percentScore(supportedPrs, targets.genetics.prs_supported_min), `${prsScored} scored / ${supportedPrs} supported`, targets.genetics.prs_supported_min, 0.05, 'PRS weights and scored sample outputs.', 'PRS support or sample scoring is sparse.', 'Expand PRS weights and verify genotype normalization.'),
    metric('wgs_variant_class_normalization', 'WGS variant-class normalization', percentScore(wgsClasses.normalizedClasses, targets.genetics.wgs_normalized_class_min), `${wgsClasses.normalizedClasses}/${targets.genetics.wgs_normalized_class_min}`, targets.genetics.wgs_normalized_class_min, 0.20, 'Normalized caller-output classes in output/wgs-variant-class-summary.json.', 'The pipeline is not normalizing the full WGS variant-class surface.', 'Normalize CNV, large indel, repeat, rearrangement, and rare-small-variant caller outputs.'),
    metric('wgs_reportable_interpretation', 'WGS reportable class interpretation', percentScore(Math.min(wgsClasses.reportableCalls, wgsClasses.reportableClasses), targets.genetics.wgs_reportable_call_min), `${wgsClasses.reportableCalls} calls / ${wgsClasses.reportableClasses} classes`, targets.genetics.wgs_reportable_call_min, 0.18, 'Reportable calls with evidence annotations in the WGS variant-class summary.', 'WGS variant-class calls are not being interpreted into reportable categories.', 'Map CNVs/SVs/repeats to ClinGen/ClinVar/repeat catalogs and reportability tiers.'),
    metric('wgs_caller_manifest', 'Raw-read caller orchestration readiness', percentScore(wgsClasses.callerSteps, targets.genetics.caller_manifest_min), wgsClasses.callerSteps, targets.genetics.caller_manifest_min, 0.08, 'Caller manifest covers Manta, GATK-gCNV/GATK-SV, ExpansionHunter, and VEP expected outputs.', 'Raw-read caller orchestration is missing.', 'Add runnable FASTQ/BAM/CRAM caller orchestration and environment checks.'),
    metric('wgs_caller_availability', 'Runnable WGS caller availability', percentScore(wgsClasses.callerAvailable, targets.genetics.caller_available_min), wgsClasses.callerAvailable, targets.genetics.caller_available_min, 0.08, 'Caller manifest environment checks for locally available WGS tools.', 'Configured caller steps are not runnable in this environment.', 'Install or containerize Manta, GATK-gCNV/GATK-SV, ExpansionHunter, and VEP.'),
    metric('wgs_caller_container_plan', 'Raw-read caller container fallback plans', percentScore(wgsClasses.queryCallerContainerPlans, targets.genetics.caller_available_min), `${wgsClasses.queryCallerContainerPlans} plans, ${wgsClasses.queryCallerContainerImagesPresent} images, ${wgsClasses.queryCallerContainerImageTimeouts} timed out`, targets.genetics.caller_available_min, 0.04, 'Container fallback availability for raw-read caller tools in output/wgs-query-readiness.json.', 'Raw-read caller tools do not have enough containerized fallback plans.', 'Add pinned caller containers or explicit non-container runtime plans for every required WGS caller.'),
    metric('wgs_query_generation_readiness', 'External query-generation readiness', percentScore(wgsClasses.queryReadinessReady, targets.genetics.external_validation_min), `${wgsClasses.queryReadinessReady}/${wgsClasses.queryReadinessTruthsets} ready, ${wgsClasses.queryReadinessHardSteps} hard setup steps`, targets.genetics.external_validation_min, 0.08, 'Checks output/wgs-query-readiness.json for HG002 input, reference, caller, and query VCF readiness.', 'No external validation truthset can generate or validate query VCFs locally yet.', 'Provide HG002 BAM/CRAM, matching reference, caller-specific inputs, and required caller tools.'),
    metric('wgs_query_run_plan', 'External query-generation run plans', percentScore(wgsClasses.queryReadinessRunPlans, targets.genetics.external_validation_min), `${wgsClasses.queryReadinessRunPlans}/${wgsClasses.queryReadinessTruthsets} run plans`, targets.genetics.external_validation_min, 0.04, 'Each external validation truthset has concrete setup, caller, postprocess, and validation commands.', 'External validation has readiness status but not a complete local execution plan.', 'Generate per-truthset command plans before attempting local WGS validation.'),
    metric('wgs_local_setup_plan', 'External WGS local setup plan', percentScore(wgsClasses.querySetupPlanSteps, targets.genetics.external_validation_min), `${wgsClasses.querySetupPlanSteps} setup steps`, targets.genetics.external_validation_min, 0.03, 'Machine-readable setup_plan in output/wgs-query-readiness.json for goal-loop iteration.', 'External validation readiness lacks a concrete local setup sequence.', 'Emit missing inputs, container pulls, caller commands, postprocess commands, and validation commands.'),
    metric('wgs_local_setup_script', 'External WGS local setup script', wgsClasses.querySetupScriptPresent && wgsClasses.queryLocalRunDifficulty !== 'unknown' ? 100 : 0, `script=${wgsClasses.querySetupScriptPresent}, difficulty=${wgsClasses.queryLocalRunDifficulty}, blockers=${wgsClasses.queryLocalRunBlockers}`, 'script plus difficulty', 0.03, 'Executable output/wgs-local-setup-plan.sh with summary, input checks, container pulls, and printed run plan.', 'External validation readiness lacks a runnable local setup script.', 'Regenerate npm run wgs:query-readiness and keep setup_script_path current.'),
    metric('wgs_query_postprocess_tools', 'External query postprocess tools', wgsClasses.queryPostprocessToolsRequired > 0 ? percentScore(wgsClasses.queryPostprocessToolsAvailable, wgsClasses.queryPostprocessToolsRequired) : 0, `${wgsClasses.queryPostprocessToolsAvailable}/${wgsClasses.queryPostprocessToolsRequired} tools`, 'all required', 0.03, 'bcftools/bgzip/tabix availability for query VCF sorting and indexing.', 'Postprocess tools are missing.', 'Install htslib/bcftools before running query generation.'),
    metric('wgs_benchmark_tools', 'External benchmark tool availability', targets.genetics.external_validation_min <= 0 ? 100 : (wgsClasses.queryBenchmarkToolsRequired > 0 ? percentScore(wgsClasses.queryBenchmarkToolsAvailable, wgsClasses.queryBenchmarkToolsRequired) : 0), `${wgsClasses.queryBenchmarkToolsAvailable}/${wgsClasses.queryBenchmarkToolsRequired} tools`, targets.genetics.external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 0.04, 'Truvari/hap.py availability for optional external precision/recall scoring.', 'Benchmark tools are not runnable in this environment.', 'Install Truvari and hap.py only when external validation is the active goal.'),
    metric('wgs_benchmark_container_plan', 'External benchmark container plans', targets.genetics.external_validation_min <= 0 ? 100 : (wgsClasses.queryContainerRuntimeAvailable && wgsClasses.queryBenchmarkToolsRequired > 0 ? percentScore(wgsClasses.queryBenchmarkContainerPlans, wgsClasses.queryBenchmarkToolsRequired) : 0), `${wgsClasses.queryBenchmarkContainerPlans}/${wgsClasses.queryBenchmarkToolsRequired} plans, docker=${wgsClasses.queryContainerRuntimeAvailable}`, targets.genetics.external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 0.03, 'Pinned Docker commands for optional Truvari/hap.py benchmark execution.', 'Benchmark containers are not planned or Docker is unavailable.', 'Add pinned benchmark containers only when external validation is the active goal.'),
    metric('wgs_benchmark_container_images', 'External benchmark container images present', targets.genetics.external_validation_min <= 0 ? 100 : (wgsClasses.queryBenchmarkToolsRequired > 0 ? percentScore(wgsClasses.queryBenchmarkContainerImagesPresent, wgsClasses.queryBenchmarkToolsRequired) : 0), `${wgsClasses.queryBenchmarkContainerImagesPresent}/${wgsClasses.queryBenchmarkToolsRequired} images, ${wgsClasses.queryBenchmarkContainerImageTimeouts} timed out`, targets.genetics.external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 0.03, 'Local Docker image availability for optional benchmark execution without another pull.', 'Benchmark container images are not present locally or Docker image inspection timed out.', 'Pull pinned Truvari and hap.py images only when external validation is the active goal.'),
    metric('wgs_validation_truthset', 'WGS variant-class validation truthset', percentScore(wgsClasses.validationTruthsets, targets.genetics.validation_truthset_min), `${wgsClasses.validationTruthsets} truthsets / ${wgsClasses.validationRecall}% recall / ${wgsClasses.validationPrecision}% precision`, targets.genetics.validation_truthset_min, 0.16, 'Checks output/wgs-validation-report.json for class-specific expected-call precision and recall.', 'No truthset-backed precision/recall benchmark exists for CNV/SV/repeat classes.', 'Add GIAB-style or curated truthset fixtures and class-specific precision/recall thresholds.'),
    metric('wgs_external_truthsets', 'External WGS validation source coverage', percentScore(wgsClasses.externalValidationSources, targets.genetics.external_validation_min), `${wgsClasses.externalValidationSources} passing / ${wgsClasses.externalValidationRunnable} runnable / ${wgsClasses.externalValidationConfigured} configured`, targets.genetics.external_validation_min, 0.12, 'Checks whether GIAB/curated CNV/SV/repeat validation sources have runnable inputs and passing metrics beyond synthetic fixtures.', 'No external WGS benchmark has passing precision/recall metrics.', 'Add GIAB/curated validation inputs, run Truvari/hap.py, and record metrics before treating WGS interpretation as production-ready.'),
    metric('tellmegen_benchmark', 'TellmeGen-style report benchmark', percentScore(geneticsBenchmark.score, targets.genetics.benchmark_score_min), `${geneticsBenchmark.score}/${targets.genetics.benchmark_score_min}`, targets.genetics.benchmark_score_min, 0.12, 'Checks output/genetics-benchmark-report.json for category counts, raw-data surface, WGS classes, external validation, PRS, and gene breadth.', 'The genetics benchmark is missing or below target.', 'Run genetics:benchmark and close catalog, caller, and external validation gaps.'),
    metric('report_category_breadth', 'Report category-count breadth', Math.min(percentScore(geneticsBenchmark.totalReports, targets.genetics.total_report_min), percentScore(geneticsBenchmark.categoryRecall, targets.genetics.category_recall_min)), `${geneticsBenchmark.totalReports}/${targets.genetics.total_report_min} reports, ${geneticsBenchmark.categoryRecall}% recall, ${geneticsBenchmark.missingCategories} weak categories`, `${targets.genetics.total_report_min} reports + ${targets.genetics.category_recall_min}% min recall`, 0.10, 'TellmeGen-style category-count parity across vulnerability, pharmacogenetics, hereditary, traits, wellness, and ancestry.', 'One or more genetics report categories are too shallow.', 'Expand hereditary, pharmacogenetics, vulnerability, traits, wellness, and ancestry interpretation catalogs.'),
    metric('report_catalog_quality', 'Report-catalog quality metadata', Math.min(percentScore(geneticsBenchmark.reportCatalogQuality, targets.genetics.report_catalog_quality_min), percentScore(geneticsBenchmark.reportCatalogSourceTypes, targets.genetics.report_catalog_source_type_min)), `${geneticsBenchmark.reportCatalogQuality}% valid, ${geneticsBenchmark.reportCatalogSourceTypes}/${targets.genetics.report_catalog_source_type_min} source types, ${geneticsBenchmark.reportCatalogDuplicates} duplicate ids`, `${targets.genetics.report_catalog_quality_min}% valid + ${targets.genetics.report_catalog_source_type_min} source types`, 0.06, 'Internal report catalog requires category, source type, evidence source, evidence tier, and capability metadata.', 'Internal genetics catalog entries are under-specified.', 'Regenerate genetics:catalog and ensure every entry carries source/evidence metadata.'),
    metric('limitations', 'Rare-variant and clinical-limit disclosure', (vepStatus === 'included' || vepStatus === 'skipped') && (/not a diagnosis|not a medical device/i.test(html) || /Polygenic scores are directional/i.test(html)) && /deeper interpretation pending|specialist review needed|purpose-built callers/i.test(html) ? 100 : 0, (vepStatus === 'included' || vepStatus === 'skipped') && (/not a diagnosis|not a medical device/i.test(html) || /Polygenic scores are directional/i.test(html)) && /deeper interpretation pending|specialist review needed|purpose-built callers/i.test(html), true, 0.02, 'Pipeline records VEP status and rendered report includes wellness/PRS/WGS limitation copy.', 'Genetic limitations are not visible enough.', 'Keep VEP status in the data contract and PRS/WGS/clinical limits in every report.'),
  ]);

  const trend = biomarkerTrendReadiness(repoDir);
  const biomarkerAnalytics = biomarkerAnalyticReadiness(repoDir, biomarker);
  const biomarkerActionDepth = (biomarker?.action_items ?? []).length > 0
    && (biomarker?.action_items ?? []).every(item => item.next_step && item.retest_window)
    ? 100
    : 0;
  const biomarkerDomainsCovered = benchmark.website_claim_requirements.biomarker_domains.filter(domain => biomarker?.domains.some(item => item.id === domain)).length;
  const biomarkers = category('biomarkers', 'Biomarker coverage and analysis', 'Superpower-style annual biomarker panel', [
    metric('supported_markers', 'Supported biomarker catalog breadth', percentScore(BIOMARKER_DEFINITIONS.length, targets.biomarkers.superpower_marker_min), BIOMARKER_DEFINITIONS.length, targets.biomarkers.superpower_marker_min, 0.11, 'Internal biomarker definition catalog.', 'Supported marker catalog is below a 100+ biomarker annual-panel benchmark.', 'Add missing lab markers before claiming parity with 100+ marker panels.'),
    metric('sample_markers', 'Sample measured marker breadth', percentScore(biomarker?.measured_count ?? 0, targets.biomarkers.superpower_marker_min), biomarker?.measured_count ?? 0, targets.biomarkers.superpower_marker_min, 0.09, 'Generated sample dashboard biomarker payload.', 'Sample fixture does not exercise 100+ biomarkers.', 'Expand the synthetic fixture to cover the supported catalog as it grows.'),
    metric('domain_coverage', 'Health-system domain coverage', percentScore(biomarkerDomainsCovered, targets.biomarkers.domain_min), `${biomarkerDomainsCovered}/${targets.biomarkers.domain_min}`, targets.biomarkers.domain_min, 0.10, 'Domain IDs in biomarker_analysis.', 'One or more biomarker domains are missing.', 'Keep cardiometabolic, glucose/insulin, immune, nutrient, hormone, organ, and hematology domains populated.'),
    metric('domain_depth', 'Per-domain marker depth', percentScore(biomarkerAnalytics.domainDepth, targets.biomarkers.domain_depth_min), biomarkerAnalytics.domainDepth, targets.biomarkers.domain_depth_min, 0.10, 'Minimum measured markers across populated biomarker domains.', 'One or more biomarker domains are too shallow for TellmeGen-style consistent coverage.', 'Balance the panel so every domain has enough markers for a stable domain score.'),
    metric('derived_metrics', 'Derived biomarker metrics', percentScore(biomarkerAnalytics.derivedMetrics, targets.biomarkers.derived_metric_min), biomarkerAnalytics.derivedMetrics, targets.biomarkers.derived_metric_min, 0.12, 'Checks HOMA-IR, non-HDL-C, remnant cholesterol, ApoB/ApoA1, transferrin saturation, and VLDL-C derivations.', 'Derived biomarker metrics are sparse.', 'Add derived lipids/ratios, eGFR handling, and longitudinal deltas.'),
    metric('truthset_status_recall', 'Biomarker truthset status recall', Math.min(percentScore(biomarkerAnalytics.validationTruthsets, targets.biomarkers.validation_truthset_min), percentScore(biomarkerAnalytics.validationStatusRecall, targets.biomarkers.status_recall_min)), `${biomarkerAnalytics.validationTruthsets} truthsets / ${biomarkerAnalytics.validationStatusRecall}%`, `${targets.biomarkers.validation_truthset_min} truthsets + ${targets.biomarkers.status_recall_min}% recall`, 0.14, 'Biomarker validation report checks expected output status by fixture.', 'Biomarker status classification is not independently validated.', 'Run biomarkers:validate and keep expected finding statuses aligned to scoring thresholds.'),
    metric('truthset_derived_recall', 'Biomarker truthset derived-metric recall', Math.min(percentScore(biomarkerAnalytics.validationTruthsets, targets.biomarkers.validation_truthset_min), percentScore(biomarkerAnalytics.validationDerivedRecall, targets.biomarkers.derived_recall_min)), `${biomarkerAnalytics.validationTruthsets} truthsets / ${biomarkerAnalytics.validationDerivedRecall}%`, `${targets.biomarkers.validation_truthset_min} truthsets + ${targets.biomarkers.derived_recall_min}% recall`, 0.10, 'Biomarker validation report checks expected derived values.', 'Derived biomarker metrics are not validated against expected outputs.', 'Keep derived metric truthsets for lipid, glucose, iron, and organ-function composites.'),
    metric('unit_normalization', 'Biomarker unit normalization coverage', percentScore(biomarkerAnalytics.unitCoverage, targets.biomarkers.unit_coverage_min), `${biomarkerAnalytics.unitCoverage}%`, `${targets.biomarkers.unit_coverage_min}%`, 0.08, 'All scored biomarker findings should carry units for quantitative comparison.', 'Some biomarker findings lack units.', 'Normalize aliases and units before scoring or trending.'),
    metric('action_depth', 'Biomarker action and retest depth', Math.min(biomarkerActionDepth, percentScore(biomarkerAnalytics.actionCoverage, targets.biomarkers.action_coverage_min), percentScore(biomarkerAnalytics.validationActionCompleteness, targets.biomarkers.action_completeness_min)), `${biomarkerAnalytics.actionCoverage} actions / ${biomarkerAnalytics.validationActionCompleteness}% validation completeness`, `>=${targets.biomarkers.action_coverage_min} concrete actions + ${targets.biomarkers.action_completeness_min}% validated`, 0.10, 'Biomarker action_items include concrete next steps and retest windows.', 'Biomarker actions are not concrete enough.', 'Require rationale, next step, source modality, and retest window for each biomarker action.'),
    metric('trend_readiness', 'Annual trend readiness', Math.min(percentScore(trend.points, targets.biomarkers.trend_point_min), percentScore(biomarkerAnalytics.trendOverlap, targets.biomarkers.trend_overlap_min)), `${trend.dates} dates / ${biomarkerAnalytics.trendOverlap} overlapping markers`, `${targets.biomarkers.trend_point_min} points + ${targets.biomarkers.trend_overlap_min} overlaps`, 0.06, 'Checks local current/prior biomarker fixtures for multi-date overlap plus retest language.', 'Longitudinal biomarker trend fixtures are not ready.', 'Add multi-date biomarker fixtures and year-over-year delta scoring.'),
    metric('coverage_benchmark', 'Superpower-style benchmark score', percentScore(biomarkerAnalytics.benchmarkScore, targets.biomarkers.benchmark_score_min), biomarkerAnalytics.benchmarkScore, targets.biomarkers.benchmark_score_min, 0.12, 'Checks output/biomarker-benchmark-report.json for catalog breadth, priority-marker overlap, trend readiness, system scores, and biological age.', 'The biomarker benchmark report is missing or below target.', 'Run biomarkers:benchmark and close its highest-impact missing coverage items.'),
    metric('system_scores', 'Named biomarker health-score layer', percentScore(biomarkerAnalytics.benchmarkSystemScores, targets.biomarkers.system_score_min), `${biomarkerAnalytics.benchmarkSystemScores}/${targets.biomarkers.system_score_min} scores, ${biomarkerAnalytics.benchmarkMissingSystemScores} missing`, targets.biomarkers.system_score_min, 0.08, 'Superpower-style coverage expects enough named health scores to benchmark across major systems.', 'The biomarker pipeline mostly emits broad domains rather than a full internal health-score layer.', 'Add deterministic biomarker system-score outputs for cardiovascular, metabolic, immune, thyroid, organ, hematology, and biological-age dimensions.'),
    metric('biological_age_model', 'Biomarker biological-age model', percentScore(biomarkerAnalytics.benchmarkBiologicalAgeModel, targets.biomarkers.biological_age_model_min), Boolean(biomarkerAnalytics.benchmarkBiologicalAgeModel), true, 0.05, 'Checks whether the benchmark can find a biomarker-derived biological-age model.', 'No biomarker biological-age model is available.', 'Add an internal biological-age model or explicitly score this as unsupported.'),
  ]);

  const wearableDomainsCovered = benchmark.website_claim_requirements.wearable_domains.filter(domain => wearable?.domains.some(item => item.id === domain)).length;
  const wearableActionDepth = (wearable?.action_items ?? []).length > 0
    && (wearable?.action_items ?? []).every(item => item.next_step && item.retest_window)
    ? 100
    : 0;
  const fusionScore = Boolean(multimodal?.action_priorities?.some(item => item.source_modalities.length >= 2)) ? 100 : 0;
  const apiSync = whoopApiSyncReadiness(packageDir);
  const wearables = category('wearables', 'Wearables coverage and analysis', 'WHOOP recovery/sleep/cycle/workout data', [
    metric('supported_signals', 'WHOOP-style signal catalog breadth', percentScore(WEARABLE_DEFINITIONS.length, targets.wearables.whoop_signal_min), WEARABLE_DEFINITIONS.length, targets.wearables.whoop_signal_min, 0.22, 'Internal wearable signal definition catalog.', 'Supported wearable signal catalog is below the useful WHOOP field benchmark.', 'Add missing WHOOP fields such as skin temperature, sleep debt, nap handling, and workout context.'),
    metric('sample_signals', 'Sample measured wearable breadth', percentScore(wearable?.measured_count ?? 0, targets.wearables.whoop_signal_min), wearable?.measured_count ?? 0, targets.wearables.whoop_signal_min, 0.16, 'Generated sample dashboard wearable payload.', 'Sample WHOOP fixture does not exercise the target signal count.', 'Expand the WHOOP fixture as supported fields grow.'),
    metric('domain_coverage', 'Wearable domain coverage', percentScore(wearableDomainsCovered, targets.wearables.domain_min), `${wearableDomainsCovered}/${targets.wearables.domain_min}`, targets.wearables.domain_min, 0.18, 'Domain IDs in wearable_analysis.', 'One or more wearable domains are missing.', 'Keep sleep/recovery, cardiovascular recovery, training, and rhythm populated.'),
    metric('aggregation_quality', 'Daily-to-window aggregation quality', wearable?.findings.every(item => finiteNumber(item.value)) ? 100 : 0, wearable?.findings.length ?? 0, 'finite aggregated findings', 0.14, 'Wearable findings parse to finite values after aggregation.', 'Wearable aggregation produced missing or invalid values.', 'Validate average vs weekly-sum behavior for each wearable metric.'),
    metric('fusion_usefulness', 'Cross-modal fusion usefulness', fusionScore, multimodal?.action_priorities?.length ?? 0, '>=1 cross-modal action', 0.18, 'Multi-modal plan includes actions sourced from more than one modality.', 'Wearables are not influencing cross-modal recommendations.', 'Only fuse wearable signals when they change the practical next action.'),
    metric('api_sync', 'Authenticated API sync readiness', apiSync.score, apiSync.evidence, targets.wearables.api_sync_min, 0.12, 'Optional WHOOP API v2 importer supports bearer-token collection fetches for cycle, recovery, sleep, and workout data.', 'WHOOP authenticated sync is not implemented.', 'Add an optional OAuth/API ingestion path after upload parsing is stable.'),
  ]);

  const coreLabels = ['Standout variants', 'Strengths across your data', 'Healthspan index', 'Action plan', 'Genome register', 'Bloodwork register', 'Behavioral register'];
  const coreSections = htmlIncludesAll(html, coreLabels);
  const embeddedPayloads = [multimodal, biomarker, wearable].filter(Boolean).length;
  const noRenderDefects = !/\{\{[^}]+\}\}/.test(html) && !hasBlankGeneratedCards(html) && Boolean(biomarker) && Boolean(wearable) && Boolean(multimodal);
  const accessible = /@media\s*\(max-width:\s*(920|767|720|640)px\)/.test(html)
    && html.includes('prefers-reduced-motion')
    && /:focus/.test(html)
    && html.includes('Skip to content')
    && (/min-height:\s*44px/.test(html) || /height:\s*44px/.test(html));
  const actionClear = output.priorities.length >= 4 && /retest window|8-12 weeks|3.6 months/i.test(html);
  const visualBaselineArtifacts = writeVisualBaseline(packageDir, html, embeddedScriptIds);
  const dashboardUx = category('dashboard_ux', 'Consumer dashboard UX quality', 'Internal wellness-dashboard presentation rubric', [
    metric('core_sections', 'Core section completeness', percentScore(coreSections, targets.dashboard_ux.core_section_min), `${coreSections}/${targets.dashboard_ux.core_section_min}`, targets.dashboard_ux.core_section_min, 0.20, 'Rendered HTML contains the expected consumer dashboard sections.', 'Dashboard section hierarchy is incomplete.', 'Keep hero, summary, insights, action plan, and protocols visible.'),
    metric('embedded_payloads', 'Parseable internal payloads', percentScore(embeddedPayloads, targets.dashboard_ux.embedded_payload_min), embeddedPayloads, targets.dashboard_ux.embedded_payload_min, 0.15, 'Dashboard embeds multimodal, biomarker, and wearable JSON for deterministic checks.', 'One or more internal dashboard payloads are missing.', 'Keep embedded JSON payloads parseable for audit scripts.'),
    metric('render_robustness', 'Render robustness', noRenderDefects ? 100 : 0, noRenderDefects, true, 0.18, 'Checks unreplaced tokens, blank generated cards, and parseable payloads.', 'Rendered HTML has template or card defects.', 'Fix renderer token replacement and optional-section stripping.'),
    metric('accessibility_responsive', 'Accessibility and responsive readiness', accessible ? 100 : 0, accessible, true, 0.16, 'Checks responsive CSS, reduced-motion, focus states, skip link, and hit targets.', 'Dashboard misses accessibility/responsive primitives.', 'Add mobile, motion, focus, and hit-target safeguards.'),
    metric('action_clarity', 'Consumer action clarity', actionClear ? 100 : 0, actionClear, true, 0.16, 'Checks enough priorities and visible retest/action language.', 'Action plan is not concrete enough for a consumer wellness dashboard.', 'Ensure every top action has why, next step, source, and retest window.'),
    metric('visual_regression', 'Visual regression baseline coverage', percentScore(visualBaselineArtifacts, targets.dashboard_ux.visual_baseline_min), visualBaselineArtifacts, targets.dashboard_ux.visual_baseline_min, 0.15, 'Audit writes a deterministic HTML/CSS/payload baseline for local regression comparison.', 'Visual regression is not quantified yet.', 'Add browser screenshot checks later if pixel diffs become necessary.'),
  ]);

  const categories = [genetics, biomarkers, wearables, dashboardUx];
  const weights: Record<QualityCategory['id'], number> = {
    genetics: 0.30,
    biomarkers: 0.25,
    wearables: 0.20,
    dashboard_ux: 0.25,
  };
  const score = Math.round(categories.reduce((sum, item) => sum + item.score * weights[item.id], 0));
  const lowest = [...categories].sort((a, b) => a.score - b.score)[0];

  return {
    score,
    status: categories.some(item => item.status === 'fail') ? 'fail' : categories.some(item => item.status === 'warn') ? 'warn' : statusFromScore(score / 100),
    purpose: 'Internal-only benchmark for goal-driven pipeline iteration. Do not render these scores in the consumer dashboard.',
    categories,
    lowest_category: lowest.id,
  };
}

function buildReport(jsonPath: string, htmlPath: string): AuditReport {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const repoDir = path.resolve(packageDir, '../..');
  const output = readJson<DashboardOutput>(jsonPath);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const benchmark = readBenchmark(scriptDir);
  const thresholds = benchmark.open_source_pass_thresholds;
  const dashboardData = scriptJson<{
    biomarker_analysis?: BiomarkerAnalysisSummary;
    wearable_analysis?: WearableAnalysisSummary;
    multimodal_plan?: MultiModalPlan;
    geneticStats?: Array<{ value?: string; label?: string }>;
    genomicCoverage?: { classes?: Array<{ label?: string; count?: number; status?: string; meaning?: string }> };
    quality?: { vep_status?: string };
  }>(html, 'dashboard-data');
  const biomarker = scriptJson<BiomarkerAnalysisSummary>(html, 'biomarker-analysis-data') ?? dashboardData?.biomarker_analysis;
  const wearable = scriptJson<WearableAnalysisSummary>(html, 'wearable-analysis-data') ?? dashboardData?.wearable_analysis;
  const multimodal = scriptJson<MultiModalPlan>(html, 'multimodal-plan-data') ?? dashboardData?.multimodal_plan;
  const checks: AuditCheck[] = [];

  const localVcfCoverage = localVcfCoverageReadiness(packageDir, output);
  const compactCatalog = compactCatalogReadiness(packageDir);
  const geneticsBenchmarkForChecks = geneticsBenchmarkReadiness(packageDir);
  const geneticStatLabels = (dashboardData?.geneticStats ?? []).map(stat => stat.label ?? '');
  const variantCount = Math.max(
    output.metadata.variant_count ?? 0,
    output.metadata.annotated_count ?? 0,
    localVcfCoverage?.total_records ?? 0,
  );
  const traitIds = output.traits.map(trait => trait.trait_id);
  const priorityIds = output.priorities.map(priority => priority.trait_id);
  const protocolTitles = output.protocols.map(protocol => protocol.title);
  const insightTitles = output.insights.map(insight => insight.title);
  const variantCards = countVariantCards(output);
  const supportedPrs = supportedPrsDefinitions(scriptDir);
  const prsScored = output.metadata.prs_scores?.length ?? 0;
  const skillPath = path.join(packageDir, 'SKILL.md');
  const skillText = fs.readFileSync(skillPath, 'utf8');
  const skillLines = skillText.split(/\r?\n/);
  const pipelineDocPath = path.join(packageDir, 'PIPELINE.md');
  const pipelineDoc = fs.existsSync(pipelineDocPath) ? fs.readFileSync(pipelineDocPath, 'utf8') : '';

  addCheck(checks, 'processing.input', 'variant_scale', 'WGS-scale variant count', minScore(variantCount, thresholds.wgs_variant_min), variantCount, thresholds.wgs_variant_min, 'Use a full WGS VCF or mark the report as reduced-coverage mode.');
  addCheck(checks, 'processing.input', 'local_vcf_coverage', 'Local VCF fixture corpus covers broad variant classes', boolScore(Boolean(localVcfCoverage)
    && (localVcfCoverage?.total_records ?? 0) >= thresholds.local_vcf_record_min
    && (localVcfCoverage?.unique_rsids ?? 0) >= thresholds.local_vcf_rsid_min
    && (localVcfCoverage?.classes_present ?? 0) >= thresholds.local_vcf_class_min
    && (localVcfCoverage?.curated_rsids_observed ?? 0) >= thresholds.local_vcf_curated_overlap_min
    && (localVcfCoverage?.prs_rsids_observed ?? 0) >= thresholds.local_vcf_prs_overlap_min),
    `${localVcfCoverage?.total_records ?? 0} records / ${localVcfCoverage?.unique_rsids ?? 0} rsIDs / ${localVcfCoverage?.classes_present ?? 0} classes / ${localVcfCoverage?.curated_rsids_observed ?? 0} curated / ${localVcfCoverage?.prs_rsids_observed ?? 0} PRS`,
    `${thresholds.local_vcf_record_min}+ records / ${thresholds.local_vcf_class_min}+ classes`,
    'Run npm run vcf:coverage and expand local SNP/indel/CNV/SV/repeat fixtures if this falls.');
  addCheck(checks, 'processing.input', 'compact_vcf_catalog', 'Compact repo-contained VCF interpretation catalog is available', boolScore(
    compactCatalog.total_entries >= thresholds.compact_catalog_entry_min
      && compactCatalog.consumer_ready_entries >= thresholds.compact_catalog_entry_min
      && compactCatalog.wellness_optimization_entries >= thresholds.compact_catalog_wellness_min
      && compactCatalog.compiled_json_bytes <= thresholds.compact_catalog_max_bytes
      && compactCatalog.raw_read_callers_required_for_default === false),
    `${compactCatalog.total_entries} entries / ${compactCatalog.consumer_ready_entries} consumer-ready / ${compactCatalog.wellness_optimization_entries} wellness / ${compactCatalog.compiled_json_bytes} bytes / raw-callers-required=${compactCatalog.raw_read_callers_required_for_default}`,
    `${thresholds.compact_catalog_entry_min}+ entries / ${thresholds.compact_catalog_wellness_min}+ wellness / <=${thresholds.compact_catalog_max_bytes} bytes / no raw callers by default`,
    'Run npm run catalog:build and keep large external source dumps out of git.');
  addCheck(checks, 'processing.input', 'interpretation_depth', 'Compact interpretation source depth is available', boolScore(
    geneticsBenchmarkForChecks.interpretationDepthScore >= thresholds.interpretation_depth_score_min
      && geneticsBenchmarkForChecks.interpretationSourceFamilies >= thresholds.interpretation_source_family_min
      && geneticsBenchmarkForChecks.interpretationClinvarGeneTargets >= thresholds.interpretation_clinvar_gene_target_min
      && geneticsBenchmarkForChecks.interpretationCpicGeneDrugRules >= thresholds.interpretation_cpic_gene_drug_rule_min
      && geneticsBenchmarkForChecks.interpretationPgsVariants >= thresholds.interpretation_pgs_variant_min
      && geneticsBenchmarkForChecks.interpretationRequiresLargeDatabase === false),
    `${geneticsBenchmarkForChecks.interpretationDepthScore} score / ${geneticsBenchmarkForChecks.interpretationSourceFamilies} sources / ${geneticsBenchmarkForChecks.interpretationClinvarGeneTargets} ClinVar genes / ${geneticsBenchmarkForChecks.interpretationCpicGeneDrugRules} CPIC rules / ${geneticsBenchmarkForChecks.interpretationPgsVariants} PGS variants / large-db=${geneticsBenchmarkForChecks.interpretationRequiresLargeDatabase}`,
    `${thresholds.interpretation_depth_score_min}+ score / ${thresholds.interpretation_source_family_min}+ sources / no large DB`,
    'Run npm run interpretation:depth after catalog changes and expand compact source slices if this falls.');
  addCheck(checks, 'processing.input', 'curated_catalog', 'Curated marker catalog loaded', minScore(output.metadata.curated_markers, thresholds.curated_marker_min), output.metadata.curated_markers, thresholds.curated_marker_min, 'Check interpretation JSON loading if this drops.');
  const vepStatus = output.metadata.vep_status
    ?? dashboardData?.quality?.vep_status
    ?? (/Functional annotation not included|VEP functional annotation was not run/i.test(html) ? 'skipped' : undefined);
  addCheck(checks, 'processing.input', 'vep_disclosure', 'VEP status is explicit', boolScore(vepStatus === 'included' || vepStatus === 'skipped'), vepStatus ?? 'missing', 'included|skipped', 'Always disclose whether rare functional annotation ran.');

  addCheck(checks, 'processing.traits', 'trait_count', 'Trait mapping breadth', minScore(output.metadata.trait_count, thresholds.trait_min), output.metadata.trait_count, thresholds.trait_min, 'Check mapProtocolToTraits/mapClinVarToTraits/mapCPICToTraits if sparse.');
  addCheck(checks, 'processing.traits', 'duplicate_traits', 'Merged trait IDs are unique', boolScore(duplicateCount(traitIds) === 0), duplicateCount(traitIds), 0, 'Keep mergeTraitScores as the single dedupe boundary.');
  addCheck(checks, 'processing.traits', 'trait_enrichment', 'Traits carry mechanism/action context', minScore(output.traits.filter(trait => trait.mechanism && trait.actions?.length).length, Math.max(1, output.traits.length)), `${output.traits.filter(trait => trait.mechanism && trait.actions?.length).length}/${output.traits.length}`, '100%', 'Fallback graph nodes should still emit useful action context.');

  addCheck(checks, 'processing.enrichment', 'variant_cards', 'ClinVar variant cards rendered from enrichment', minScore(variantCards, thresholds.variant_card_min), variantCards, thresholds.variant_card_min, 'Check ClinVar index lookup and variant-card category mapping.');
  addCheck(checks, 'processing.enrichment', 'prs_supported', 'PRS catalog breadth', minScore(supportedPrs, thresholds.prs_supported_min), supportedPrs, thresholds.prs_supported_min, 'Expand shared/prs_weights.json if supported traits regress.');
  addCheck(checks, 'processing.enrichment', 'prs_scored', 'PRS scores produced for sample output', minScore(prsScored, 18), prsScored, 18, 'Inspect genotype normalization if PRS scores disappear.');
  addCheck(checks, 'processing.enrichment', 'hallmarks', 'Aging hallmark support and sample findings', boolScore(Object.keys(hallmarkNames).length >= thresholds.hallmark_supported_min && output.metadata.hallmark_count > 0), `${Object.keys(hallmarkNames).length} supported / ${output.metadata.hallmark_count} found`, `${thresholds.hallmark_supported_min}+ supported and >0 found`, 'Keep hallmark mappings aligned with trait IDs.');
  const wgsClassesForChecks = wgsVariantClassReadiness(packageDir);
  addCheck(checks, 'processing.wgs_classes', 'normalized_classes', 'WGS CNV/SV/repeat class outputs are normalized', minScore(wgsClassesForChecks.normalizedClasses, thresholds.wgs_variant_class_min), wgsClassesForChecks.normalizedClasses, thresholds.wgs_variant_class_min, 'Run npm run wgs:variant-classes after caller VCFs are available.');
  addCheck(checks, 'processing.wgs_classes', 'reportable_classes', 'WGS class outputs have reportable interpretations', minScore(wgsClassesForChecks.reportableClasses, thresholds.wgs_reportable_class_min), `${wgsClassesForChecks.reportableCalls} calls / ${wgsClassesForChecks.reportableClasses} classes`, thresholds.wgs_reportable_class_min, 'Map normalized WGS calls to dosage, repeat, and clinical evidence catalogs.');
  addCheck(checks, 'processing.wgs_classes', 'caller_manifest', 'Raw-read WGS caller manifest exists', minScore(wgsClassesForChecks.callerSteps, thresholds.wgs_variant_class_min), wgsClassesForChecks.callerSteps, thresholds.wgs_variant_class_min, 'Keep Manta, GATK-gCNV/GATK-SV, ExpansionHunter, and VEP orchestration visible.');
  addCheck(checks, 'processing.wgs_classes', 'caller_availability', 'Raw-read WGS caller tools are available', minScore(wgsClassesForChecks.callerAvailable, thresholds.wgs_caller_available_min), wgsClassesForChecks.callerAvailable, thresholds.wgs_caller_available_min, 'Configured caller steps need runnable tools or containers.');
  addCheck(checks, 'processing.wgs_classes', 'caller_container_plan', 'Raw-read WGS caller tools have container fallback plans', minScore(wgsClassesForChecks.queryCallerContainerPlans, thresholds.wgs_caller_available_min), `${wgsClassesForChecks.queryCallerContainerPlans} plans, ${wgsClassesForChecks.queryCallerContainerImagesPresent} images, ${wgsClassesForChecks.queryCallerContainerImageTimeouts} timed out`, thresholds.wgs_caller_available_min, 'Keep pinned caller containers or explicit non-container runtime plans current.');
  addCheck(checks, 'processing.wgs_classes', 'external_preflight', 'External WGS setup preflight has quantitative next actions', boolScore(wgsClassesForChecks.truthsetSetupTruthsets >= thresholds.wgs_external_validation_min && wgsClassesForChecks.truthsetSetupArtifacts >= 4 && wgsClassesForChecks.truthsetSetupActions > 0 && wgsClassesForChecks.truthsetSetupToolsRequired > 0), `${wgsClassesForChecks.truthsetSetupTruthsets} truthsets / ${wgsClassesForChecks.truthsetSetupArtifacts} artifacts / ${wgsClassesForChecks.truthsetSetupActions} actions`, 'truthsets + artifacts + next actions', 'Run npm run wgs:truthsets or regenerate the dashboard so setup readiness is current.');
  addCheck(checks, 'processing.wgs_classes', 'query_generation_readiness', 'External WGS query generation readiness is quantified', minScore(wgsClassesForChecks.queryReadinessReady, thresholds.wgs_external_validation_min), `${wgsClassesForChecks.queryReadinessReady}/${wgsClassesForChecks.queryReadinessTruthsets} ready, ${wgsClassesForChecks.queryReadinessHardSteps} hard setup steps`, thresholds.wgs_external_validation_min, 'Provide HG002 BAM/CRAM, matching reference FASTA, caller-specific inputs, and caller runtimes.');
  addCheck(checks, 'processing.wgs_classes', 'query_run_plan', 'External WGS query generation has executable run plans', minScore(wgsClassesForChecks.queryReadinessRunPlans, thresholds.wgs_external_validation_min), `${wgsClassesForChecks.queryReadinessRunPlans}/${wgsClassesForChecks.queryReadinessTruthsets} run plans`, thresholds.wgs_external_validation_min, 'Keep per-truthset setup, caller, postprocess, and validation commands current.');
  addCheck(checks, 'processing.wgs_classes', 'local_setup_plan', 'External WGS readiness has a machine-readable local setup plan', minScore(wgsClassesForChecks.querySetupPlanSteps, thresholds.wgs_external_validation_min), `${wgsClassesForChecks.querySetupPlanSteps} setup steps`, thresholds.wgs_external_validation_min, 'Keep setup_plan current with missing inputs, container pulls, caller commands, postprocess commands, and validation commands.');
  addCheck(checks, 'processing.wgs_classes', 'local_setup_script', 'External WGS readiness has a runnable setup script', boolScore(wgsClassesForChecks.querySetupScriptPresent && wgsClassesForChecks.queryLocalRunDifficulty !== 'unknown'), `script=${wgsClassesForChecks.querySetupScriptPresent}, difficulty=${wgsClassesForChecks.queryLocalRunDifficulty}, blockers=${wgsClassesForChecks.queryLocalRunBlockers}`, 'script plus difficulty', 'Regenerate npm run wgs:query-readiness so output/wgs-local-setup-plan.sh is current.');
  addCheck(checks, 'processing.wgs_classes', 'query_postprocess_tools', 'External WGS query postprocess tools are available', boolScore(wgsClassesForChecks.queryPostprocessToolsRequired > 0 && wgsClassesForChecks.queryPostprocessToolsAvailable >= wgsClassesForChecks.queryPostprocessToolsRequired), `${wgsClassesForChecks.queryPostprocessToolsAvailable}/${wgsClassesForChecks.queryPostprocessToolsRequired} tools`, 'all required', 'Install htslib/bcftools if bcftools, bgzip, or tabix are missing.');
  addCheck(checks, 'processing.wgs_classes', 'benchmark_tools', 'External WGS benchmark tools are available', boolScore(thresholds.wgs_external_validation_min <= 0 || (wgsClassesForChecks.queryBenchmarkToolsRequired > 0 && wgsClassesForChecks.queryBenchmarkToolsAvailable >= wgsClassesForChecks.queryBenchmarkToolsRequired)), `${wgsClassesForChecks.queryBenchmarkToolsAvailable}/${wgsClassesForChecks.queryBenchmarkToolsRequired} tools`, thresholds.wgs_external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 'Install Truvari and hap.py only when external validation is the active goal.');
  addCheck(checks, 'processing.wgs_classes', 'benchmark_container_plan', 'External WGS benchmark containers have executable plans', boolScore(thresholds.wgs_external_validation_min <= 0 || (wgsClassesForChecks.queryContainerRuntimeAvailable && wgsClassesForChecks.queryBenchmarkContainerPlans >= wgsClassesForChecks.queryBenchmarkToolsRequired && wgsClassesForChecks.queryBenchmarkToolsRequired > 0)), `${wgsClassesForChecks.queryBenchmarkContainerPlans}/${wgsClassesForChecks.queryBenchmarkToolsRequired} plans, docker=${wgsClassesForChecks.queryContainerRuntimeAvailable}`, thresholds.wgs_external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 'Keep pinned Docker commands only when external validation is the active goal.');
  addCheck(checks, 'processing.wgs_classes', 'benchmark_container_images', 'External WGS benchmark container images are present locally', boolScore(thresholds.wgs_external_validation_min <= 0 || (wgsClassesForChecks.queryBenchmarkToolsRequired > 0 && wgsClassesForChecks.queryBenchmarkContainerImagesPresent >= wgsClassesForChecks.queryBenchmarkToolsRequired)), `${wgsClassesForChecks.queryBenchmarkContainerImagesPresent}/${wgsClassesForChecks.queryBenchmarkToolsRequired} images, ${wgsClassesForChecks.queryBenchmarkContainerImageTimeouts} timed out`, thresholds.wgs_external_validation_min <= 0 ? 'optional for VCF-first default' : 'all required', 'Pull benchmark containers only when external validation is the active goal.');
  addCheck(checks, 'processing.wgs_classes', 'truthset_validation', 'WGS class validation truthsets pass expected-call precision/recall', minScore(wgsClassesForChecks.validationTruthsets, thresholds.wgs_validation_truthset_min), `${wgsClassesForChecks.validationTruthsets} truthsets / ${wgsClassesForChecks.validationRecall}% recall / ${wgsClassesForChecks.validationPrecision}% precision`, thresholds.wgs_validation_truthset_min, 'Add GIAB/curated truthset fixtures and class-specific precision/recall targets.');
  addCheck(checks, 'processing.wgs_classes', 'external_truthsets', 'External WGS truthset precision/recall benchmark passes', minScore(wgsClassesForChecks.externalValidationSources, thresholds.wgs_external_validation_min), `${wgsClassesForChecks.externalValidationSources} passing / ${wgsClassesForChecks.externalValidationRunnable} runnable / ${wgsClassesForChecks.externalValidationConfigured} configured`, thresholds.wgs_external_validation_min, 'Synthetic fixtures are regression tests; add GIAB/curated validation inputs and run Truvari/hap.py for real WGS readiness.');
  addCheck(checks, 'processing.wgs_classes', 'dashboard_analysis_coverage', 'Dashboard exposes analyzed WGS coverage without internal validation setup leakage', boolScore((dashboardData?.genomicCoverage?.classes?.length ?? 0) >= thresholds.wgs_variant_class_min && html.includes('Genome analysis summary') && !/HG002|GIAB|Genome in a Bottle|query VCF|local setup hard|missing inputs and tools/i.test(html)), `${dashboardData?.genomicCoverage?.classes?.length ?? 0}/${thresholds.wgs_variant_class_min} classes`, thresholds.wgs_variant_class_min, 'Keep user-facing analyzed variant-class coverage visible; keep HG002/GIAB readiness in audit JSON only.');
  addCheck(checks, 'processing.wgs_classes', 'dashboard_wgs_scale_stats', 'Dashboard genetics stats lead with WGS-scale counts', boolScore(
    geneticStatLabels[0] === 'DNA positions read'
      && geneticStatLabels.includes('Annotated rsIDs available')
      && geneticStatLabels.includes('Curated marker rules applied')
      && !html.includes('Longevity markers curated and assessed')),
    geneticStatLabels.join(' | '),
    'DNA positions read first, annotated rsIDs visible, curated rules clearly labeled',
    'Do not lead the genome dashboard with the smaller curated interpretation subset.');
  addCheck(checks, 'processing.genetics_benchmark', 'benchmark_score', 'TellmeGen-style genetics benchmark passes', minScore(geneticsBenchmarkForChecks.score, thresholds.genetics_benchmark_score_min), geneticsBenchmarkForChecks.score, thresholds.genetics_benchmark_score_min, 'Run genetics:benchmark and close catalog/external-validation gaps.');
  addCheck(checks, 'processing.genetics_benchmark', 'category_breadth', 'Genetics category report counts are broad enough', Math.min(minScore(geneticsBenchmarkForChecks.totalReports, thresholds.genetics_total_report_min), minScore(geneticsBenchmarkForChecks.categoryRecall, thresholds.genetics_category_recall_min)), `${geneticsBenchmarkForChecks.totalReports}/${thresholds.genetics_total_report_min} reports, ${geneticsBenchmarkForChecks.categoryRecall}% recall`, `${thresholds.genetics_total_report_min} reports + ${thresholds.genetics_category_recall_min}% recall`, 'Expand the interpretation catalogs by category instead of relying on variant-card volume.');
  addCheck(checks, 'processing.genetics_benchmark', 'report_catalog_quality', 'Genetics report catalog entries carry source and evidence metadata', Math.min(minScore(geneticsBenchmarkForChecks.reportCatalogQuality, thresholds.genetics_report_catalog_quality_min), minScore(geneticsBenchmarkForChecks.reportCatalogSourceTypes, thresholds.genetics_report_catalog_source_type_min)), `${geneticsBenchmarkForChecks.reportCatalogQuality}% valid, ${geneticsBenchmarkForChecks.reportCatalogSourceTypes}/${thresholds.genetics_report_catalog_source_type_min} source types`, `${thresholds.genetics_report_catalog_quality_min}% valid + ${thresholds.genetics_report_catalog_source_type_min} source types`, 'Run genetics:catalog and fix under-specified internal report entries.');

  addCheck(checks, 'processing.scoring', 'gli_range', 'GLI is finite and in range', boolScore(finiteNumber(output.gli) && output.gli >= 0 && output.gli <= 1000), output.gli, '0..1000', 'Clamp or validate GLI engine inputs.');
  addCheck(checks, 'processing.scoring', 'category_gli', 'Category GLI values are finite', boolScore(Object.values(output.category_gli).every(value => finiteNumber(value) && value >= 0 && value <= 1000)), Object.keys(output.category_gli).length, 'finite 0..1000', 'Check category grouping if a category becomes NaN.');
  addCheck(checks, 'processing.actions', 'priority_count', 'Priorities produced', minScore(output.priorities.length, 4), output.priorities.length, 4, 'Priority engine should produce enough ranked next steps.');
  addCheck(checks, 'processing.actions', 'duplicate_priorities', 'Priority trait IDs are not duplicated', boolScore(duplicateCount(priorityIds) === 0), duplicateCount(priorityIds), 0, 'Dedupe before priority rendering.');
  addCheck(checks, 'processing.actions', 'insight_count', 'Insights produced', minScore(output.insights.length, thresholds.insight_min), output.insights.length, thresholds.insight_min, 'Insight generation should track trait breadth.');
  addCheck(checks, 'processing.actions', 'duplicate_insights', 'Insight titles are not duplicated', boolScore(duplicateCount(insightTitles) === 0), duplicateCount(insightTitles), 0, 'Merge repeated insight copy at the source.');
  addCheck(checks, 'processing.protocols', 'protocol_count', 'Protocols produced', minScore(output.protocols.length, thresholds.protocol_min), output.protocols.length, thresholds.protocol_min, 'Protocol generation should emit core and maintenance flows.');
  addCheck(checks, 'processing.protocols', 'duplicate_protocols', 'Protocol titles are not duplicated', boolScore(duplicateCount(protocolTitles) === 0), duplicateCount(protocolTitles), 0, 'Keep protocol templates distinct.');

  addCheck(checks, 'processing.multimodal', 'biomarker_measured', 'Biomarker sample readings are present', minScore(biomarker?.measured_count ?? 0, thresholds.biomarker_measured_min), biomarker?.measured_count ?? 0, thresholds.biomarker_measured_min, 'Check sample-biomarkers.csv/text parser path.');
  addCheck(checks, 'processing.multimodal', 'wearable_measured', 'WHOOP-style wearable readings are present', minScore(wearable?.measured_count ?? 0, thresholds.wearable_measured_min), wearable?.measured_count ?? 0, thresholds.wearable_measured_min, 'Check WHOOP JSON/CSV parser path.');
  addCheck(checks, 'processing.multimodal', 'biomarker_domains', 'Website biomarker domains covered', minScore(benchmark.website_claim_requirements.biomarker_domains.filter(domain => biomarker?.domains.some(item => item.id === domain)).length, benchmark.website_claim_requirements.biomarker_domains.length), `${biomarker?.domains.length ?? 0}/${benchmark.website_claim_requirements.biomarker_domains.length}`, 'all website domains', 'Add domain definitions before adding more marker fixtures.');
  addCheck(checks, 'processing.multimodal', 'wearable_domains', 'Website wearable domains covered', minScore(benchmark.website_claim_requirements.wearable_domains.filter(domain => wearable?.domains.some(item => item.id === domain)).length, benchmark.website_claim_requirements.wearable_domains.length), `${wearable?.domains.length ?? 0}/${benchmark.website_claim_requirements.wearable_domains.length}`, 'all website domains', 'Keep wearable definitions aligned to dashboard upload claims.');
  addCheck(checks, 'processing.multimodal', 'fusion_provenance', 'Fusion actions preserve modality provenance', boolScore(Boolean(multimodal?.action_priorities?.length) && (multimodal?.action_priorities ?? []).every(action => action.source_modalities.length > 0)), multimodal?.action_priorities?.length ?? 0, 'all actions sourced', 'Every cross-modal action needs source_modalities.');
  addCheck(checks, 'processing.multimodal', 'supported_catalog', 'Supported biomarker/wearable catalogs meet open-source floor', boolScore(BIOMARKER_DEFINITIONS.length >= thresholds.biomarker_supported_min && WEARABLE_DEFINITIONS.length >= thresholds.wearable_supported_min), `${BIOMARKER_DEFINITIONS.length}/${WEARABLE_DEFINITIONS.length}`, `${thresholds.biomarker_supported_min}/${thresholds.wearable_supported_min}`, 'Do not confuse fixture row count with supported catalog size.');
  const biomarkerAnalyticsForChecks = biomarkerAnalyticReadiness(repoDir, biomarker);
  addCheck(checks, 'processing.multimodal', 'biomarker_domain_depth', 'Biomarker domains have consistent marker depth', minScore(biomarkerAnalyticsForChecks.domainDepth, benchmark.internal_quality_targets.biomarkers.domain_depth_min), biomarkerAnalyticsForChecks.domainDepth, benchmark.internal_quality_targets.biomarkers.domain_depth_min, 'Do not let a domain pass with token marker coverage only.');
  addCheck(checks, 'processing.multimodal', 'biomarker_derived_metrics', 'Biomarker engine derives quantitative composite metrics', minScore(biomarkerAnalyticsForChecks.derivedMetrics, benchmark.internal_quality_targets.biomarkers.derived_metric_min), biomarkerAnalyticsForChecks.derivedMetrics, benchmark.internal_quality_targets.biomarkers.derived_metric_min, 'Derive cardiometabolic, iron, kidney, and metabolic ratios from raw lab values.');
  addCheck(checks, 'processing.multimodal', 'biomarker_validation_truthsets', 'Biomarker validation truthsets pass expected output checks', minScore(biomarkerAnalyticsForChecks.validationTruthsets, benchmark.internal_quality_targets.biomarkers.validation_truthset_min), `${biomarkerAnalyticsForChecks.validationTruthsets} truthsets / ${biomarkerAnalyticsForChecks.validationStatusRecall}% status / ${biomarkerAnalyticsForChecks.validationDerivedRecall}% derived`, `${benchmark.internal_quality_targets.biomarkers.validation_truthset_min} truthsets + 100% recall`, 'Run biomarkers:validate before evaluating dashboard quality.');
  addCheck(checks, 'processing.multimodal', 'biomarker_trend_overlap', 'Biomarker trend fixture has enough overlapping markers', minScore(biomarkerAnalyticsForChecks.trendOverlap, benchmark.internal_quality_targets.biomarkers.trend_overlap_min), biomarkerAnalyticsForChecks.trendOverlap, benchmark.internal_quality_targets.biomarkers.trend_overlap_min, 'Trend analysis needs overlapping markers, not just two dates.');
  addCheck(checks, 'processing.multimodal', 'biomarker_benchmark', 'Biomarker benchmark report meets Superpower-style internal target', minScore(biomarkerAnalyticsForChecks.benchmarkScore, benchmark.internal_quality_targets.biomarkers.benchmark_score_min), biomarkerAnalyticsForChecks.benchmarkScore, benchmark.internal_quality_targets.biomarkers.benchmark_score_min, 'Run biomarkers:benchmark and use the report to close coverage gaps.');
  addCheck(checks, 'processing.multimodal', 'biomarker_system_scores', 'Biomarker system-score layer is deep enough', minScore(biomarkerAnalyticsForChecks.benchmarkSystemScores, benchmark.internal_quality_targets.biomarkers.system_score_min), `${biomarkerAnalyticsForChecks.benchmarkSystemScores} scores / ${biomarkerAnalyticsForChecks.benchmarkMissingSystemScores} missing`, benchmark.internal_quality_targets.biomarkers.system_score_min, 'Add named system scores beyond broad domains.');
  addCheck(checks, 'processing.multimodal', 'biomarker_biological_age_model', 'Biomarker biological-age model is available', minScore(biomarkerAnalyticsForChecks.benchmarkBiologicalAgeModel, benchmark.internal_quality_targets.biomarkers.biological_age_model_min), Boolean(biomarkerAnalyticsForChecks.benchmarkBiologicalAgeModel), true, 'Add or explicitly benchmark a biomarker-derived biological-age model.');

  const embeddedScriptIds = scriptIds(html);
  addCheck(checks, 'visualization.render', 'html_size', 'Rendered HTML is bounded and non-trivial', boolScore(html.length > 80_000 && html.length < 8_000_000), html.length, '80k..8M bytes', 'Large jumps usually mean duplicated embedded payloads; tiny output means failed rendering.');
  addCheck(checks, 'visualization.render', 'template_tokens', 'No unreplaced template tokens remain', boolScore(!/\{\{[^}]+\}\}/.test(html)), /\{\{[^}]+\}\}/.test(html), false, 'Renderer must replace or strip every token.');
  addCheck(checks, 'visualization.render', 'embedded_json', 'Embedded JSON payloads parse', boolScore(Boolean(biomarker) && Boolean(wearable) && Boolean(multimodal)), embeddedScriptIds.filter(id => id.endsWith('-data')).join(', '), 'biomarker/wearable/multimodal', 'Validate script tags and JSON escaping in renderer.');
  addCheck(checks, 'visualization.render', 'blank_cards', 'Generated card shells are not blank', boolScore(!hasBlankGeneratedCards(html)), hasBlankGeneratedCards(html), false, 'Strip optional sections and indexed cards when data is missing.');
  const sectionOrder = appearsInOrder(html, ['Standout variants', 'Strengths across your data', 'Healthspan index', 'Action plan', 'Genome register', 'Bloodwork register', 'Behavioral register']);
  const responsiveCss = /@media\s*\(max-width:\s*(920|767|720|640)px\)/.test(html) && html.includes('prefers-reduced-motion');
  const focusAndTargets = /:focus/.test(html) && html.includes('Skip to content') && (/min-height:\s*44px/.test(html) || /height:\s*44px/.test(html));
  const wellnessBoundary = /not a diagnosis|not a medical device|not medical advice/i.test(html) && /clinician|physician|healthcare provider/i.test(html);
  addCheck(checks, 'visualization.ux', 'section_order', 'Core sections appear in reading order', boolScore(sectionOrder), sectionOrder, true, 'Keep hero, summary, insights, action plan, and protocols in order.');
  addCheck(checks, 'visualization.ux', 'responsive_css', 'Responsive and reduced-motion CSS gates exist', boolScore(responsiveCss), responsiveCss, true, 'Dashboard must remain usable on mobile and for reduced-motion users.');
  addCheck(checks, 'visualization.ux', 'focus_and_hit_targets', 'Keyboard focus and mobile hit targets exist', boolScore(focusAndTargets), focusAndTargets, true, 'Interactive controls need focus visibility and 44px touch targets.');
  addCheck(checks, 'visualization.ux', 'wellness_boundary', 'Wellness/clinician boundary visible', boolScore(wellnessBoundary), wellnessBoundary, true, 'Medical boundary copy should remain visible in every generated report.');

  const frontmatterMatch = skillText.match(/^---\n([\s\S]*?)\n---/);
  const frontmatterKeys = frontmatterMatch ? Array.from(frontmatterMatch[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)).map(match => match[1]) : [];
  const engineRows = Array.from(skillText.matchAll(/^\| `([^`]+\.ts)` \|/gm)).map(match => match[1]);
  addCheck(checks, 'skill.hygiene', 'frontmatter_keys', 'Skill frontmatter only exposes name and description', boolScore(frontmatterKeys.every(key => ['name', 'description'].includes(key))), frontmatterKeys.join(', '), 'name, description', 'Move non-trigger metadata into the body or references.');
  addCheck(checks, 'skill.hygiene', 'skill_length', 'SKILL.md stays below 500 lines', minScore(500, skillLines.length), skillLines.length, '<=500 lines', 'Move detailed reference content out of SKILL.md.');
  addCheck(checks, 'skill.hygiene', 'duplicate_engine_rows', 'Engine table has no duplicate module rows', boolScore(duplicateCount(engineRows) === 0), duplicateCount(engineRows), 0, 'Merge duplicate engine descriptions.');
  addCheck(checks, 'skill.hygiene', 'stale_pipeline_doc', 'Pipeline docs do not point at removed scripts', boolScore(!/generate-dashboard\.ts|scripts\/analyze-vcf\.ts/.test(pipelineDoc)), /generate-dashboard\.ts|scripts\/analyze-vcf\.ts/.test(pipelineDoc), false, 'Update PIPELINE.md when entrypoints change.');
  addCheck(checks, 'skill.samples', 'sample_fixtures', 'All sample health-data fixtures exist', boolScore([
    'example-data/sample-biomarkers.csv',
    'example-data/sample-biomarkers-previous.csv',
    'example-data/sample-lab-report.txt',
    'example-data/sample-whoop-daily.csv',
    'example-data/sample-whoop-api.json',
  ].every(relative => fs.existsSync(path.join(repoDir, relative)))), 'fixtures checked', '5 fixtures', 'Keep runnable local examples in example-data.');
  addCheck(checks, 'skill.samples', 'reference_extracts', 'External benchmark extracts exist locally', boolScore(fs.existsSync(path.join(packageDir, 'references/external-benchmark-extracts.json'))), 'local extract checked', 'TellmeGen/Superpower/WHOOP extracts', 'Keep local benchmark extracts updated when source claims change.');

  const stageSummary = summarize(checks);
  const rawScore = Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length * 100);
  const internalQuality = buildInternalQuality({
    benchmark,
    output,
    html,
    biomarker,
    wearable,
    multimodal,
    variantCards,
    supportedPrs,
    prsScored,
    vepStatus,
    embeddedScriptIds,
    repoDir,
    packageDir,
  });
  const recommendations = checks
    .filter(check => check.status !== 'pass' && check.recommendation)
    .map(check => `${check.stage}.${check.id}: ${check.recommendation}`);
  const checkStatus = checks.some(check => check.status === 'fail') ? 'fail' : checks.some(check => check.status === 'warn') ? 'warn' : 'pass';
  const reportStatus = checkStatus === 'fail' || internalQuality.status === 'fail'
    ? 'fail'
    : checkStatus === 'warn' || internalQuality.status === 'warn'
      ? 'warn'
      : 'pass';
  const score = reportStatus === 'fail'
    ? Math.min(rawScore, internalQuality.score, 89)
    : reportStatus === 'warn'
      ? Math.min(rawScore, internalQuality.score, 94)
      : Math.min(rawScore, internalQuality.score);

  return {
    status: reportStatus,
    score,
    generated_at: new Date().toISOString(),
    json_path: jsonPath,
    html_path: htmlPath,
    internal_quality: internalQuality,
    stage_summary: stageSummary,
    checks,
    recommendations,
  };
}

function main(): void {
  const defaultJson = path.resolve(process.cwd(), '../../output/test_user_dashboard.json');
  const defaultHtml = path.resolve(process.cwd(), 'output/sample/index.html');
  const defaultOut = path.resolve(process.cwd(), 'output/pipeline-audit.json');
  const defaultMarkdown = path.resolve(process.cwd(), 'output/pipeline-audit.md');
  const jsonPath = path.resolve(argValue('--json') ?? process.argv[2] ?? defaultJson);
  const htmlPath = path.resolve(argValue('--html') ?? process.argv[3] ?? defaultHtml);
  const outPath = path.resolve(argValue('--out') ?? defaultOut);
  const markdownPath = path.resolve(argValue('--markdown') ?? defaultMarkdown);
  const minScore = Number(argValue('--min-score') ?? '85');

  if (!fs.existsSync(jsonPath)) throw new Error(`Dashboard JSON not found: ${jsonPath}`);
  if (!fs.existsSync(htmlPath)) throw new Error(`Dashboard HTML not found: ${htmlPath}`);

  const report = buildReport(jsonPath, htmlPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, markdown(report), 'utf8');

  console.log(JSON.stringify({
    status: report.status,
    score: report.score,
    internal_quality: {
      score: report.internal_quality.score,
      status: report.internal_quality.status,
      lowest_category: report.internal_quality.lowest_category,
      categories: report.internal_quality.categories.map(item => ({
        id: item.id,
        score: item.score,
        status: item.status,
        gaps: item.gaps.slice(0, 3),
      })),
    },
    min_score: minScore,
    json: outPath,
    markdown: markdownPath,
    failed_or_warn: report.checks.filter(check => check.status !== 'pass').map(check => ({
      id: `${check.stage}.${check.id}`,
      status: check.status,
      actual: check.actual,
      target: check.target,
    })),
  }, null, 2));

  if (report.score < minScore || report.status === 'fail' || report.internal_quality.status !== 'pass') process.exit(1);
}

main();
