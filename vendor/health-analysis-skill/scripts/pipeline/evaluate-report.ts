#!/usr/bin/env npx tsx
/**
 * Objective coverage and dashboard-quality evaluator.
 *
 * This is intentionally static and repeatable: it checks generated JSON/HTML
 * against explicit thresholds for genomic breadth, multimodal data coverage,
 * actionability, and design-system compliance. Browser screenshot review can
 * add confidence later, but this script gives the repo a non-subjective gate.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { DashboardOutput } from './index.js';
import { BIOMARKER_DEFINITIONS } from './biomarker_engine.js';
import { hallmarkNames } from './hallmark_engine.js';
import { WEARABLE_DEFINITIONS } from './wearable_engine.js';
import type { BiomarkerAnalysisSummary, MultiModalPlan, WearableAnalysisSummary } from '../../shared/dashboard-types.js';

interface Criterion {
  id: string;
  label: string;
  points: number;
  passed: boolean;
  evidence: string;
}

interface CoverageBenchmark {
  website_claim_requirements: {
    annual_biomarker_marker_min: number;
    dashboard_outputs: string[];
    accepted_uploads: string[];
    biomarker_domains: string[];
    wearable_domains: string[];
  };
  tellmegen_wgs_baseline: {
    required_sections: string[];
    reported_item_counts: Record<string, number>;
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
  };
  missing_categories?: string[];
}

interface LocalVcfCoverageReport {
  summary?: {
    total_records?: number;
    annotated_records?: number;
    unique_rsids?: number;
    classes_present?: number;
    curated_rsids_observed?: number;
    prs_rsids_observed?: number;
    coverage_score?: number;
  };
}

interface CompactInterpretationCatalog {
  summary?: {
    total_entries?: number;
    consumer_ready_entries?: number;
    wellness_optimization_entries?: number;
    compiled_json_bytes?: number;
    within_repo_size_budget?: boolean;
    raw_read_callers_required_for_default?: boolean;
  };
}

interface InterpretationDepthReport {
  passed?: boolean;
  summary?: {
    score?: number;
    source_families_supported?: number;
    default_requires_large_database?: boolean;
    clinvar_gene_targets?: number;
    cpic_gene_drug_rules?: number;
    pgs_traits?: number;
    pgs_variants?: number;
    wellness_pgs_traits?: number;
    wgs_class_entries?: number;
  };
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

function countVariantCards(output: DashboardOutput): number {
  const cards = output.metadata.variant_cards;
  if (!cards) return output.metadata.variant_tab_count ?? 0;
  return Object.values(cards).reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
}

function countPrs(output: DashboardOutput): number {
  return output.metadata.prs_scores?.length ?? 0;
}

function supportedPrsDefinitions(): number {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const weightsPath = path.resolve(scriptDir, '../../shared/prs_weights.json');
  if (!fs.existsSync(weightsPath)) return 0;
  const raw = JSON.parse(fs.readFileSync(weightsPath, 'utf8')) as { variants?: Array<{ disease?: string }> };
  return new Set((raw.variants ?? []).map(v => v.disease).filter(Boolean)).size;
}

function readBenchmark(): CoverageBenchmark {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const benchmarkPath = path.resolve(scriptDir, '../../references/coverage-benchmark.json');
  return JSON.parse(fs.readFileSync(benchmarkPath, 'utf8')) as CoverageBenchmark;
}

function readOptionalJson<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return readJson<T>(filePath);
  } catch {
    return undefined;
  }
}

function wgsVariantClassReadiness(): {
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
  validationRecall: number;
  validationPrecision: number;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
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
    validationRecall: Number.isFinite(validationRecall) ? validationRecall : 0,
    validationPrecision: Number.isFinite(validationPrecision) ? validationPrecision : 0,
  };
}

function biomarkerDerivedMetricCount(biomarker?: BiomarkerAnalysisSummary): number {
  const derivedIds = new Set(['homa_ir', 'non_hdl_c', 'remnant_cholesterol', 'apob_apoa1_ratio', 'transferrin_saturation', 'vldl_c']);
  return (biomarker?.findings ?? []).filter(finding => derivedIds.has(finding.id)).length;
}

function biomarkerMinimumDomainDepth(biomarker?: BiomarkerAnalysisSummary): number {
  const depths = (biomarker?.domains ?? []).filter(domain => domain.measured > 0).map(domain => domain.measured);
  return depths.length > 0 ? Math.min(...depths) : 0;
}

function biomarkerValidationReadiness(): {
  passingTruthsets: number;
  statusRecall: number;
  derivedRecall: number;
  actionCompleteness: number;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const validation = readOptionalJson<BiomarkerValidationReport>(path.join(packageDir, 'output/biomarker-validation-report.json'));
  return {
    passingTruthsets: validation?.summary?.passing_truthsets ?? 0,
    statusRecall: Math.round((validation?.summary?.minimum_status_recall ?? 0) * 100),
    derivedRecall: Math.round((validation?.summary?.minimum_derived_recall ?? 0) * 100),
    actionCompleteness: Math.round((validation?.summary?.action_completeness ?? 0) * 100),
  };
}

function geneticsBenchmarkReadiness(): {
  score: number;
  totalReports: number;
  categoryRecall: number;
  missingCategories: number;
  reportCatalogQuality: number;
  reportCatalogSourceTypes: number;
  reportCatalogDuplicates: number;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const benchmark = readOptionalJson<GeneticsBenchmarkReport>(path.join(packageDir, 'output/genetics-benchmark-report.json'));
  return {
    score: benchmark?.summary?.score ?? 0,
    totalReports: benchmark?.summary?.total_reports ?? 0,
    categoryRecall: Math.round((benchmark?.summary?.category_recall ?? 0) * 100),
    missingCategories: benchmark?.missing_categories?.length ?? 0,
    reportCatalogQuality: Math.round((benchmark?.summary?.report_catalog_quality ?? 0) * 100),
    reportCatalogSourceTypes: benchmark?.summary?.report_catalog_source_types ?? 0,
    reportCatalogDuplicates: benchmark?.summary?.report_catalog_duplicates ?? 0,
  };
}

function biomarkerBenchmarkReadiness(): {
  score: number;
  systemScores: number;
  biologicalAgeModel: boolean;
  priorityMarkerRecall: number;
  trendOverlap: number;
  missingSystemScores: number;
} {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const benchmark = readOptionalJson<BiomarkerBenchmarkReport>(path.join(packageDir, 'output/biomarker-benchmark-report.json'));
  return {
    score: benchmark?.summary?.score ?? 0,
    systemScores: benchmark?.summary?.system_scores ?? 0,
    biologicalAgeModel: Boolean(benchmark?.summary?.biological_age_model),
    priorityMarkerRecall: Math.round((benchmark?.summary?.priority_marker_recall ?? 0) * 100),
    trendOverlap: benchmark?.summary?.trend_overlap ?? 0,
    missingSystemScores: benchmark?.missing_system_scores?.length ?? 0,
  };
}

function add(criteria: Criterion[], id: string, label: string, points: number, passed: boolean, evidence: string): void {
  criteria.push({ id, label, points, passed, evidence });
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
  const blankPatterns = [
    /class="protocol-title">\s*<\/div>/,
    /class="analysis-domain-name">\s*<\/div>/,
    /class="insight-title">\s*<\/h3>/,
    /class="actionable-title">\s*<\/h3>/,
    /class="cat-detail-title">\s*<\/div>/,
  ];
  return blankPatterns.some(pattern => pattern.test(html));
}

function includesAll(haystack: string, needles: string[]): boolean {
  const normalized = haystack.toLowerCase();
  return needles.every(needle => normalized.includes(needle.toLowerCase()));
}

function evaluate(output: DashboardOutput, html: string): Criterion[] {
  const criteria: Criterion[] = [];
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const dashboardData = scriptJson<{
    biomarker_analysis?: BiomarkerAnalysisSummary;
    wearable_analysis?: WearableAnalysisSummary;
    multimodal_plan?: MultiModalPlan;
    geneticStats?: Array<{ value?: string; label?: string }>;
    genomicCoverage?: { classes?: Array<{ label?: string; count?: number; status?: string; meaning?: string }> };
    plan?: { priorities?: unknown[] };
    polygenic?: unknown[];
    hereditary?: unknown[];
    drugGene?: unknown[];
    quality?: { vep_status?: string };
  }>(html, 'dashboard-data');
  const biomarker = scriptJson<BiomarkerAnalysisSummary>(html, 'biomarker-analysis-data') ?? dashboardData?.biomarker_analysis;
  const wearable = scriptJson<WearableAnalysisSummary>(html, 'wearable-analysis-data') ?? dashboardData?.wearable_analysis;
  const multimodal = scriptJson<MultiModalPlan>(html, 'multimodal-plan-data') ?? dashboardData?.multimodal_plan;
  const variantCards = countVariantCards(output);
  const prsCount = countPrs(output);
  const supportedPrs = supportedPrsDefinitions();
  const benchmark = readBenchmark();
  const thresholds = benchmark.open_source_pass_thresholds;
  const wgsClasses = wgsVariantClassReadiness();
  const localVcfCoverage = readOptionalJson<LocalVcfCoverageReport>(path.join(packageDir, 'output/local-vcf-coverage.json'))?.summary
    ?? output.metadata.local_vcf_coverage;
  const compactCatalog = readOptionalJson<CompactInterpretationCatalog>(path.join(packageDir, 'output/compact-interpretation-catalog.json'))?.summary;
  const interpretationDepth = readOptionalJson<InterpretationDepthReport>(path.join(packageDir, 'output/interpretation-depth-report.json'))?.summary;
  const wgsScaleVariantCount = Math.max(
    output.metadata.variant_count ?? 0,
    output.metadata.annotated_count ?? 0,
    localVcfCoverage?.total_records ?? 0,
  );
  const geneticStatLabels = (dashboardData?.geneticStats ?? []).map(stat => stat.label ?? '');
  const geneticsBenchmark = geneticsBenchmarkReadiness();
  const biomarkerValidation = biomarkerValidationReadiness();
  const biomarkerBenchmark = biomarkerBenchmarkReadiness();
  const vepStatus = output.metadata.vep_status
    ?? dashboardData?.quality?.vep_status
    ?? (/Functional annotation not included|VEP functional annotation was not run/i.test(html) ? 'skipped' : undefined);
  const dashboardPlanPriorities = (dashboardData?.plan?.priorities ?? []) as Array<{
    evidence?: unknown[];
    steps?: unknown[];
    result?: string;
    retest?: string;
    why?: string;
  }>;

  add(criteria, 'genomic.wgs_scale', 'WGS-scale variant set or explicit reduced-coverage mode', 5,
    wgsScaleVariantCount >= thresholds.wgs_variant_min,
    `${wgsScaleVariantCount} variants`);
  add(criteria, 'genomic.local_vcf_coverage', 'Local VCF fixtures cover WGS-scale records, rsIDs, and variant classes', 5,
    (localVcfCoverage?.total_records ?? 0) >= thresholds.local_vcf_record_min
      && (localVcfCoverage?.unique_rsids ?? 0) >= thresholds.local_vcf_rsid_min
      && (localVcfCoverage?.classes_present ?? 0) >= thresholds.local_vcf_class_min
      && (localVcfCoverage?.curated_rsids_observed ?? 0) >= thresholds.local_vcf_curated_overlap_min
      && (localVcfCoverage?.prs_rsids_observed ?? 0) >= thresholds.local_vcf_prs_overlap_min,
    `${localVcfCoverage?.total_records ?? 0} records, ${localVcfCoverage?.unique_rsids ?? 0} rsIDs, ${localVcfCoverage?.classes_present ?? 0} classes, ${localVcfCoverage?.curated_rsids_observed ?? 0} curated overlaps, ${localVcfCoverage?.prs_rsids_observed ?? 0} PRS overlaps`);
  add(criteria, 'genomic.dashboard_wgs_scale_stats', 'Genome dashboard leads with WGS-scale coverage before curated interpretation counts', 3,
    geneticStatLabels[0] === 'DNA positions read'
      && geneticStatLabels.includes('Annotated rsIDs available')
      && geneticStatLabels.includes('Curated marker rules applied')
      && !html.includes('Longevity markers curated and assessed'),
    `genetic stat labels: ${geneticStatLabels.join(' | ')}`);
  add(criteria, 'genomic.compact_vcf_catalog', 'Repo-contained VCF-first interpretation catalog is broad, wellness-aware, and size-bounded', 5,
    (compactCatalog?.total_entries ?? 0) >= thresholds.compact_catalog_entry_min
      && (compactCatalog?.consumer_ready_entries ?? 0) >= thresholds.compact_catalog_entry_min
      && (compactCatalog?.wellness_optimization_entries ?? 0) >= thresholds.compact_catalog_wellness_min
      && (compactCatalog?.compiled_json_bytes ?? Number.POSITIVE_INFINITY) <= thresholds.compact_catalog_max_bytes
      && compactCatalog?.raw_read_callers_required_for_default === false,
    `${compactCatalog?.total_entries ?? 0} entries, ${compactCatalog?.consumer_ready_entries ?? 0} consumer-ready, ${compactCatalog?.wellness_optimization_entries ?? 0} wellness/optimization, ${compactCatalog?.compiled_json_bytes ?? 0} bytes, raw-callers-required=${compactCatalog?.raw_read_callers_required_for_default}`);
  add(criteria, 'genomic.interpretation_depth', 'Compact interpretation depth covers ClinVar, CPIC, PGS, curated markers, and WGS class slices without a large local DB', 6,
    (interpretationDepth?.score ?? 0) >= thresholds.interpretation_depth_score_min
      && (interpretationDepth?.source_families_supported ?? 0) >= thresholds.interpretation_source_family_min
      && (interpretationDepth?.clinvar_gene_targets ?? 0) >= thresholds.interpretation_clinvar_gene_target_min
      && (interpretationDepth?.cpic_gene_drug_rules ?? 0) >= thresholds.interpretation_cpic_gene_drug_rule_min
      && (interpretationDepth?.pgs_variants ?? 0) >= thresholds.interpretation_pgs_variant_min
      && interpretationDepth?.default_requires_large_database === false,
    `score ${interpretationDepth?.score ?? 0}, ${interpretationDepth?.source_families_supported ?? 0} source families, ${interpretationDepth?.clinvar_gene_targets ?? 0} ClinVar gene targets, ${interpretationDepth?.cpic_gene_drug_rules ?? 0} CPIC rules, ${interpretationDepth?.pgs_variants ?? 0} PGS variants, large-db=${interpretationDepth?.default_requires_large_database}`);
  add(criteria, 'genomic.curated_markers', 'Curated marker database is broad enough for consumer interpretation', 5,
    output.metadata.curated_markers >= thresholds.curated_marker_min,
    `${output.metadata.curated_markers} curated markers`);
  add(criteria, 'genomic.traits', 'Trait mapping produces broad, non-sparse output', 5,
    output.metadata.trait_count >= thresholds.trait_min,
    `${output.metadata.trait_count} traits`);
  add(criteria, 'genomic.insights', 'Insights are generated for a meaningful share of traits', 4,
    output.metadata.insight_count >= Math.min(thresholds.insight_min, output.metadata.trait_count),
    `${output.metadata.insight_count} insights`);
  add(criteria, 'genomic.protocols', 'Protocols exist after trait prioritization', 4,
    output.metadata.protocol_count >= thresholds.protocol_min,
    `${output.metadata.protocol_count} protocols`);
  add(criteria, 'genomic.hallmarks', 'Aging hallmark engine supports the full pathway set and reports affected pathways', 4,
    Object.keys(hallmarkNames).length >= thresholds.hallmark_supported_min && output.metadata.hallmark_count > 0,
    `${Object.keys(hallmarkNames).length} supported, ${output.metadata.hallmark_count} affected`);
  add(criteria, 'genomic.variants_tab', 'ClinVar/genetic variants tab has material content', 4,
    variantCards >= thresholds.variant_card_min,
    `${variantCards} variant cards`);
  add(criteria, 'genomic.prs', 'PRS coverage includes disease plus longevity/wellness traits', 4,
    supportedPrs >= thresholds.prs_supported_min && prsCount >= 18,
    `${prsCount} scored, ${supportedPrs} supported`);
  add(criteria, 'genomic.vep_status', 'VEP status is explicit so rare-coding coverage is not overstated', 2,
    vepStatus === 'included' || vepStatus === 'skipped',
    `VEP ${vepStatus ?? 'missing'}`);
  add(criteria, 'genomic.wgs_variant_classes', 'WGS CNV/SV/repeat classes are normalized from caller outputs', 8,
    wgsClasses.normalizedClasses >= thresholds.wgs_variant_class_min,
    `${wgsClasses.normalizedClasses}/${thresholds.wgs_variant_class_min} variant classes normalized`);
  add(criteria, 'genomic.wgs_reportable_classes', 'WGS variant classes have reportable evidence-tiered interpretations', 8,
    wgsClasses.reportableClasses >= thresholds.wgs_reportable_class_min && wgsClasses.reportableCalls >= thresholds.wgs_reportable_class_min,
    `${wgsClasses.reportableCalls} calls / ${wgsClasses.reportableClasses} classes reportable`);
  add(criteria, 'genomic.raw_read_caller_manifest', 'Raw-read WGS caller orchestration covers CNV, SV, repeat, and small-variant tools', 6,
    wgsClasses.callerSteps >= thresholds.wgs_variant_class_min,
    `${wgsClasses.callerSteps}/${thresholds.wgs_variant_class_min} caller steps configured`);
  add(criteria, 'genomic.raw_read_caller_availability', 'Raw-read WGS callers are available in the execution environment', 4,
    wgsClasses.callerAvailable >= thresholds.wgs_caller_available_min,
    `${wgsClasses.callerAvailable}/${thresholds.wgs_caller_available_min} caller steps available locally`);
  add(criteria, 'genomic.raw_read_caller_container_plan', 'Raw-read WGS caller tools have container fallback plans', 2,
    wgsClasses.queryCallerContainerPlans >= thresholds.wgs_caller_available_min,
    `${wgsClasses.queryCallerContainerPlans}/${thresholds.wgs_caller_available_min} caller container plans, ${wgsClasses.queryCallerContainerImagesPresent} images present, ${wgsClasses.queryCallerContainerImageTimeouts} timed out`);
  add(criteria, 'genomic.wgs_external_preflight', 'External WGS setup preflight is quantitative and current', 4,
    wgsClasses.truthsetSetupTruthsets >= thresholds.wgs_external_validation_min
      && wgsClasses.truthsetSetupArtifacts >= 4
      && wgsClasses.truthsetSetupActions > 0
      && wgsClasses.truthsetSetupToolsRequired > 0,
    `${wgsClasses.truthsetSetupTruthsets} truthsets, ${wgsClasses.truthsetSetupArtifacts} artifacts, ${wgsClasses.truthsetSetupActions} next actions`);
  add(criteria, 'genomic.wgs_query_generation_readiness', 'External WGS query generation readiness is quantified', 4,
    wgsClasses.queryReadinessTruthsets >= thresholds.wgs_external_validation_min
      && wgsClasses.queryReadinessReady >= thresholds.wgs_external_validation_min,
    `${wgsClasses.queryReadinessReady}/${wgsClasses.queryReadinessTruthsets} ready, ${wgsClasses.queryReadinessHardSteps} hard local setup steps`);
  add(criteria, 'genomic.wgs_query_run_plan', 'External WGS query generation has executable run plans', 3,
    wgsClasses.queryReadinessRunPlans >= wgsClasses.queryReadinessTruthsets
      && wgsClasses.queryReadinessTruthsets >= thresholds.wgs_external_validation_min,
    `${wgsClasses.queryReadinessRunPlans}/${wgsClasses.queryReadinessTruthsets} truthsets with run plans`);
  add(criteria, 'genomic.wgs_local_setup_plan', 'External WGS readiness emits a machine-readable local setup plan', 2,
    wgsClasses.querySetupPlanSteps >= wgsClasses.queryReadinessTruthsets
      && wgsClasses.queryReadinessTruthsets >= thresholds.wgs_external_validation_min,
    `${wgsClasses.querySetupPlanSteps} setup-plan steps`);
  add(criteria, 'genomic.wgs_local_setup_script', 'External WGS readiness emits a runnable local setup script', 2,
    wgsClasses.querySetupScriptPresent
      && wgsClasses.queryLocalRunDifficulty !== 'unknown'
      && wgsClasses.queryLocalRunBlockers >= 0,
    `script=${wgsClasses.querySetupScriptPresent}, difficulty=${wgsClasses.queryLocalRunDifficulty}, blockers=${wgsClasses.queryLocalRunBlockers}`);
  add(criteria, 'genomic.wgs_query_postprocess_tools', 'External WGS query post-processing tools are available', 2,
    wgsClasses.queryPostprocessToolsRequired > 0
      && wgsClasses.queryPostprocessToolsAvailable >= wgsClasses.queryPostprocessToolsRequired,
    `${wgsClasses.queryPostprocessToolsAvailable}/${wgsClasses.queryPostprocessToolsRequired} postprocess tools available`);
  add(criteria, 'genomic.wgs_benchmark_tool_availability', 'External WGS benchmark tools are available', 3,
    thresholds.wgs_external_validation_min <= 0
      || (wgsClasses.queryBenchmarkToolsRequired > 0
      && wgsClasses.queryBenchmarkToolsAvailable >= wgsClasses.queryBenchmarkToolsRequired),
    `${wgsClasses.queryBenchmarkToolsAvailable}/${wgsClasses.queryBenchmarkToolsRequired} benchmark tools available`);
  add(criteria, 'genomic.wgs_benchmark_container_plan', 'External WGS benchmark containers have executable plans', 2,
    thresholds.wgs_external_validation_min <= 0
      || (wgsClasses.queryContainerRuntimeAvailable
      && wgsClasses.queryBenchmarkContainerPlans >= wgsClasses.queryBenchmarkToolsRequired
      && wgsClasses.queryBenchmarkToolsRequired > 0),
    `${wgsClasses.queryBenchmarkContainerPlans}/${wgsClasses.queryBenchmarkToolsRequired} container plans, docker=${wgsClasses.queryContainerRuntimeAvailable}`);
  add(criteria, 'genomic.wgs_benchmark_container_images', 'External WGS benchmark container images are present locally', 2,
    thresholds.wgs_external_validation_min <= 0
      || (wgsClasses.queryBenchmarkContainerImagesPresent >= wgsClasses.queryBenchmarkToolsRequired
      && wgsClasses.queryBenchmarkToolsRequired > 0),
    `${wgsClasses.queryBenchmarkContainerImagesPresent}/${wgsClasses.queryBenchmarkToolsRequired} images present, ${wgsClasses.queryBenchmarkContainerImageTimeouts} timed out`);
  add(criteria, 'genomic.validation_truthsets', 'WGS class validation truthsets exist for precision/recall scoring', 8,
    wgsClasses.validationTruthsets >= thresholds.wgs_validation_truthset_min,
    `${wgsClasses.validationTruthsets}/${thresholds.wgs_validation_truthset_min} passing truthsets, ${wgsClasses.validationRecall}% recall, ${wgsClasses.validationPrecision}% precision`);
  add(criteria, 'genomic.external_validation_truthsets', 'WGS validation includes at least one external truthset source', 8,
    wgsClasses.externalValidationSources >= thresholds.wgs_external_validation_min,
    `${wgsClasses.externalValidationSources}/${thresholds.wgs_external_validation_min} external truthsets passing, ${wgsClasses.externalValidationRunnable}/${wgsClasses.externalValidationConfigured} runnable`);
  add(criteria, 'genomic.genetics_benchmark', 'TellmeGen-style genetics benchmark meets internal coverage target', 10,
    geneticsBenchmark.score >= thresholds.genetics_benchmark_score_min,
    `${geneticsBenchmark.score}/${thresholds.genetics_benchmark_score_min} benchmark score, ${geneticsBenchmark.totalReports}/${thresholds.genetics_total_report_min} reports, ${geneticsBenchmark.categoryRecall}% min category recall`);
  add(criteria, 'genomic.tellmegen_category_breadth', 'Genetics report categories meet TellmeGen-style count breadth', 8,
    geneticsBenchmark.totalReports >= thresholds.genetics_total_report_min
      && geneticsBenchmark.categoryRecall >= thresholds.genetics_category_recall_min,
    `${geneticsBenchmark.totalReports}/${thresholds.genetics_total_report_min} reports, ${geneticsBenchmark.categoryRecall}% category recall, ${geneticsBenchmark.missingCategories} categories below target`);
  add(criteria, 'genomic.report_catalog_quality', 'Internal genetics report catalog has evidence metadata and source diversity', 6,
    geneticsBenchmark.reportCatalogQuality >= thresholds.genetics_report_catalog_quality_min
      && geneticsBenchmark.reportCatalogSourceTypes >= thresholds.genetics_report_catalog_source_type_min,
    `${geneticsBenchmark.reportCatalogQuality}% valid entries, ${geneticsBenchmark.reportCatalogSourceTypes}/${thresholds.genetics_report_catalog_source_type_min} source types, ${geneticsBenchmark.reportCatalogDuplicates} duplicate ids dropped`);
  add(criteria, 'genomic.dashboard_wgs_analysis_coverage', 'Dashboard presents analyzed WGS coverage without internal validation setup leakage', 6,
    (dashboardData?.genomicCoverage?.classes?.length ?? 0) >= thresholds.wgs_variant_class_min
      && includesAll(html, ['Genome analysis summary', 'Single-letter variants', 'Copy-number changes', 'Tandem repeats'])
      && !/HG002|GIAB|Genome in a Bottle|query VCF|local setup hard|missing inputs and tools/i.test(html),
    `${dashboardData?.genomicCoverage?.classes?.length ?? 0}/${thresholds.wgs_variant_class_min} analyzed classes exposed to users`);

  add(criteria, 'multimodal.biomarkers', 'Sample dashboard uses real normalized biomarker readings', 8,
    (biomarker?.measured_count ?? 0) >= thresholds.biomarker_measured_min,
    `${biomarker?.measured_count ?? 0}/${biomarker?.total_supported ?? 0} markers measured`);
  add(criteria, 'multimodal.wearables', 'Sample dashboard uses real WHOOP-style wearable readings', 6,
    (wearable?.measured_count ?? 0) >= thresholds.wearable_measured_min,
    `${wearable?.measured_count ?? 0}/${wearable?.total_supported ?? 0} signals measured`);
  add(criteria, 'multimodal.website_biomarker_domain_coverage', 'Biomarker domains match website health-system claims', 4,
    benchmark.website_claim_requirements.biomarker_domains.every(domain => biomarker?.domains.some(d => d.id === domain)),
    `${biomarker?.domains.length ?? 0}/${benchmark.website_claim_requirements.biomarker_domains.length} domains present`);
  add(criteria, 'multimodal.website_wearable_domain_coverage', 'Wearable domains match website wearable-summary claims', 4,
    benchmark.website_claim_requirements.wearable_domains.every(domain => wearable?.domains.some(d => d.id === domain)),
    `${wearable?.domains.length ?? 0}/${benchmark.website_claim_requirements.wearable_domains.length} domains present`);
  add(criteria, 'multimodal.supported_marker_catalog', 'Supported marker catalog is large enough for website annual-panel claim', 4,
    BIOMARKER_DEFINITIONS.length >= thresholds.biomarker_supported_min && WEARABLE_DEFINITIONS.length >= thresholds.wearable_supported_min,
    `${BIOMARKER_DEFINITIONS.length} biomarkers, ${WEARABLE_DEFINITIONS.length} wearable signals supported`);
  add(criteria, 'multimodal.biomarker_domain_depth', 'Biomarker domains have consistent TellmeGen-style depth, not token coverage', 6,
    biomarkerMinimumDomainDepth(biomarker) >= 10,
    `${biomarkerMinimumDomainDepth(biomarker)} minimum markers in populated domains`);
  add(criteria, 'multimodal.biomarker_derived_metrics', 'Biomarker engine derives quantitative composite metrics', 6,
    biomarkerDerivedMetricCount(biomarker) >= 5,
    `${biomarkerDerivedMetricCount(biomarker)} derived metrics`);
  add(criteria, 'multimodal.biomarker_validation_truthsets', 'Biomarker truthsets verify classification, derivation, and action quality', 8,
    biomarkerValidation.passingTruthsets >= thresholds.biomarker_validation_truthset_min
      && biomarkerValidation.statusRecall >= thresholds.biomarker_status_recall_min
      && biomarkerValidation.derivedRecall >= thresholds.biomarker_derived_recall_min
      && biomarkerValidation.actionCompleteness >= 100,
    `${biomarkerValidation.passingTruthsets}/${thresholds.biomarker_validation_truthset_min} truthsets, ${biomarkerValidation.statusRecall}% status recall, ${biomarkerValidation.derivedRecall}% derived recall, ${biomarkerValidation.actionCompleteness}% action completeness`);
  add(criteria, 'multimodal.biomarker_benchmark', 'Biomarker benchmark report meets internal Superpower-style coverage target', 8,
    biomarkerBenchmark.score >= thresholds.biomarker_benchmark_score_min,
    `${biomarkerBenchmark.score}/${thresholds.biomarker_benchmark_score_min} benchmark score, ${biomarkerBenchmark.priorityMarkerRecall}% priority recall, ${biomarkerBenchmark.trendOverlap} trend overlap`);
  add(criteria, 'multimodal.biomarker_system_scores', 'Biomarker analysis emits enough named health-system scores for internal coverage tracking', 6,
    biomarkerBenchmark.systemScores >= thresholds.biomarker_system_score_min,
    `${biomarkerBenchmark.systemScores}/${thresholds.biomarker_system_score_min} system scores, ${biomarkerBenchmark.missingSystemScores} missing`);
  add(criteria, 'multimodal.biomarker_biological_age_model', 'Biomarker benchmark includes a biological-age model slot', 4,
    Number(biomarkerBenchmark.biologicalAgeModel) >= thresholds.biomarker_biological_age_model_min,
    biomarkerBenchmark.biologicalAgeModel ? 'biological-age model present' : 'biological-age model missing');
  add(criteria, 'multimodal.fusion', 'Fusion emits cross-modal actions only when multiple modalities affect the next step', 4,
    (multimodal?.action_priorities ?? []).some(action => action.source_modalities.length >= 2),
    `${multimodal?.action_priorities?.length ?? 0} multimodal actions`);
  add(criteria, 'multimodal.next_upload', 'Next-upload guidance remains present after data fusion', 2,
    Boolean(multimodal?.next_best_upload),
    `next=${multimodal?.next_best_upload ?? 'missing'}`);

  add(criteria, 'action.plan_cards', 'Dashboard has the required four action-plan slots populated', 5,
    (output.priorities?.length ?? 0) >= 4 && (html.includes('Action plan') || (dashboardData?.plan?.priorities?.length ?? 0) >= 4),
    `${output.priorities?.length ?? 0} priorities`);
  add(criteria, 'action.personalized_detail', 'Action-plan cards include personal evidence, concise steps, expected result, and retest timing', 5,
    dashboardPlanPriorities.slice(0, 4).length >= 4
      && dashboardPlanPriorities.slice(0, 4).every(action =>
        (action.evidence?.length ?? 0) >= 2
        && (action.steps?.length ?? 0) >= 2
        && Boolean(action.result)
        && Boolean(action.retest)
        && Boolean(action.why)
      ),
    `${dashboardPlanPriorities.slice(0, 4).filter(action => (action.evidence?.length ?? 0) >= 2 && (action.steps?.length ?? 0) >= 2 && action.result && action.retest && action.why).length}/4 detailed cards`);
  add(criteria, 'action.retest_windows', 'Retest windows are visible for biomarker/wearable actions', 5,
    /retest window/i.test(html) || /8-12 weeks/i.test(html),
    'searched HTML for retest language');
  add(criteria, 'action.boundary', 'Wellness/clinician boundary is visible', 4,
    /not a diagnosis|not a medical device|not medical advice/i.test(html) && /clinician|physician|healthcare provider/i.test(html),
    'searched HTML for safety boundary');
  add(criteria, 'action.provenance', 'Dashboard exposes data provenance and analysis scope', 3,
    /Local analysis|Processed on this machine/i.test(html) && html.includes('Polygenic scores are directional'),
    'local processing and PRS caveat present');
  add(criteria, 'action.source_modalities', 'Actions preserve modality provenance', 3,
    (multimodal?.action_priorities ?? []).every(action => action.source_modalities.length > 0),
    `${multimodal?.action_priorities?.length ?? 0} actions checked`);
  add(criteria, 'claims.website_upload_path', 'Dashboard reflects website upload claims for labs, WGS/VCF, and wearables', 4,
    Boolean(multimodal?.modalities.some(m => m.id === 'genomics' && includesAll([...m.accepted_formats, ...m.examples].join(' '), ['VCF', 'WGS']))
      && multimodal?.modalities.some(m => m.id === 'biomarkers' && includesAll(m.accepted_formats.join(' '), ['Lab PDF', 'CSV']))
      && multimodal?.modalities.some(m => m.id === 'wearables' && includesAll([...m.accepted_formats, ...m.examples].join(' '), ['CSV', 'WHOOP']))),
    'genomics, biomarker, and wearable upload cards checked');
  add(criteria, 'claims.tellmegen_sections', 'Dashboard covers TellmeGen-style core genetics report sections', 5,
    includesAll(html, ['Genome register', 'Genome analysis summary', 'Polygenic risk', 'Hereditary', 'medication findings'])
      && (dashboardData?.genomicCoverage?.classes?.length ?? 0) >= thresholds.wgs_variant_class_min
      && (dashboardData?.polygenic?.length ?? 0) > 0,
    `${benchmark.tellmegen_wgs_baseline.required_sections.length} benchmark sections expected`);
  add(criteria, 'claims.tellmegen_wgs_limit_disclosure', 'Dashboard discloses WGS/VEP limits instead of overstating rare-variant coverage', 4,
    (/not a diagnosis|not a medical device/i.test(html))
      && includesAll(html, ['Copy-number changes', 'Large indels and rearrangements', 'Tandem repeats'])
      && includesAll(html, ['deeper interpretation pending', 'specialist review needed', 'purpose-built callers']),
    `variant classes noted in benchmark: ${benchmark.tellmegen_wgs_baseline.variant_classes.length}`);

  add(criteria, 'ux.tokens', 'Generated HTML has no unreplaced template tokens', 5,
    !/\{\{[^}]+\}\}/.test(html),
    'searched for {{token}} patterns');
  add(criteria, 'ux.design_system', 'Design-system essentials are present', 5,
    html.includes('--color-surface') && html.includes('text-wrap:') && html.includes('font-variant-numeric: tabular-nums'),
    'tokens, text wrapping, tabular numerics');
  add(criteria, 'ux.responsive', 'Responsive and reduced-motion CSS gates exist', 5,
    /@media\s*\(max-width:\s*(920|767|720|640)px\)/.test(html) && html.includes('prefers-reduced-motion'),
    'mobile and motion media queries');
  add(criteria, 'ux.focus_states', 'Keyboard focus states are defined', 4,
    /:focus/.test(html) && html.includes('Skip to content'),
    'focus selectors and skip link');
  add(criteria, 'ux.required_sections', 'Core dashboard hierarchy is represented', 2,
    ['Standout variants', 'Strengths across your data', 'Healthspan index', 'Action plan', 'Genome register', 'Bloodwork register', 'Behavioral register'].every(label => html.includes(label)),
    'required section labels checked');
  add(criteria, 'ux.section_order', 'Core dashboard sections appear in the required top-to-bottom order', 4,
    appearsInOrder(html, ['Standout variants', 'Strengths across your data', 'Healthspan index', 'Action plan', 'Genome register', 'Bloodwork register', 'Behavioral register']),
    'overview, plan, genetics, biomarkers, wearables order checked');
  add(criteria, 'ux.no_blank_generated_cards', 'Renderer does not leave blank card shells behind', 4,
    !hasBlankGeneratedCards(html),
    'searched known generated card title fields');
  add(criteria, 'ux.semantic_structure', 'Artifact uses semantic dashboard structure', 3,
    html.includes('<main') && html.includes('<section') && html.includes('<nav') && html.includes('role="tab"'),
    'main, section, nav, tab roles');
  add(criteria, 'ux.hit_targets', 'Interactive controls have mobile-sized hit targets', 3,
    /min-height:\s*44px/.test(html) || /height:\s*44px/.test(html),
    '44px hit target CSS');
  add(criteria, 'ux.content_density', 'Artifact has enough rendered content without becoming unbounded', 3,
    html.length > 80_000 && html.length < 8_000_000,
    `${html.length.toLocaleString('en-US')} bytes`);
  add(criteria, 'ux.embedded_json', 'Embedded dashboard JSON payloads parse cleanly', 2,
    Boolean(multimodal) && Boolean(biomarker) && Boolean(wearable),
    'dashboard-data payload parsed');

  return criteria;
}

function main(): void {
  const defaultJson = path.resolve(process.cwd(), '../../output/test_user_dashboard.json');
  const defaultHtml = path.resolve(process.cwd(), 'output/sample/index.html');
  const jsonPath = path.resolve(argValue('--json') ?? process.argv[2] ?? defaultJson);
  const htmlPath = path.resolve(argValue('--html') ?? process.argv[3] ?? defaultHtml);
  const minScore = Number(argValue('--min-score') ?? '80');

  if (!fs.existsSync(jsonPath)) throw new Error(`Dashboard JSON not found: ${jsonPath}`);
  if (!fs.existsSync(htmlPath)) throw new Error(`Dashboard HTML not found: ${htmlPath}`);

  const output = readJson<DashboardOutput>(jsonPath);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const criteria = evaluate(output, html);
  const possible = criteria.reduce((sum, criterion) => sum + criterion.points, 0);
  const earned = criteria.reduce((sum, criterion) => sum + (criterion.passed ? criterion.points : 0), 0);
  const rawScore = Math.round((earned / possible) * 100);
  const failed = criteria.filter(criterion => !criterion.passed);
  const criticalFailures = failed.filter(criterion => [
    'genomic.wgs_variant_classes',
    'genomic.wgs_reportable_classes',
    'genomic.raw_read_caller_manifest',
    'genomic.external_validation_truthsets',
    'genomic.validation_truthsets',
    'genomic.genetics_benchmark',
    'genomic.tellmegen_category_breadth',
    'multimodal.biomarker_domain_depth',
    'multimodal.biomarker_derived_metrics',
    'multimodal.biomarker_validation_truthsets',
    'multimodal.biomarker_benchmark',
    'multimodal.biomarker_system_scores',
    'multimodal.biomarker_biological_age_model',
  ].includes(criterion.id));
  const score = criticalFailures.length > 0 ? Math.min(rawScore, 89) : rawScore;

  const result = {
    score,
    raw_score: rawScore,
    earned,
    possible,
    min_score: minScore,
    status: score >= minScore && criticalFailures.length === 0 ? 'pass' : 'fail',
    critical_failures: criticalFailures,
    failed,
    criteria,
  };

  console.log(JSON.stringify(result, null, 2));
  if (score < minScore || criticalFailures.length > 0) process.exit(1);
}

main();
