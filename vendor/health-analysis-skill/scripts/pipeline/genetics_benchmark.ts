#!/usr/bin/env npx tsx
/**
 * Internal genetics coverage benchmark.
 *
 * This complements WGS parser truthsets by checking the report-category breadth
 * expected from a TellmeGen-style WGS experience. Large variant-card volume alone
 * should not make the genetics pipeline look complete.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { DashboardOutput } from './index.js';
import { buildGeneticsReportCatalog, type GeneticsReportCatalog } from './genetics_report_catalog.js';
import { buildInterpretationDepthReport } from './interpretation_depth_metrics.js';

interface ReportCategoryRequirement {
  target: number;
  source_files: string[];
}

interface GeneticsBenchmarkRequirements {
  version: string;
  purpose: string;
  source_notes: string[];
  target_total_reports: number;
  target_category_recall: number;
  target_rendered_sections: number;
  target_raw_download_types: number;
  target_variant_classes: number;
  target_external_validation_sources: number;
  target_caller_available: number;
  target_prs_supported: number;
  target_gene_catalog: number;
  target_report_catalog_quality: number;
  target_report_catalog_source_types: number;
  target_interpretation_depth_score: number;
  target_interpretation_source_families: number;
  target_interpretation_clinvar_gene_targets: number;
  target_interpretation_cpic_gene_drug_rules: number;
  target_interpretation_pgs_variants: number;
  report_categories: Record<string, ReportCategoryRequirement>;
  required_sections: string[];
  raw_download_types: string[];
  variant_classes: string[];
}

interface WgsVariantClassSummary {
  class_counts?: Record<string, number>;
  calls?: Array<{ class?: string; genes?: string[] }>;
}

interface WgsCallerManifest {
  caller_steps?: Array<{ available?: boolean; tool?: string; command_template?: string; variant_class?: string }>;
}

interface WgsExternalValidationReport {
  summary?: {
    configured_truthsets?: number;
    runnable_truthsets?: number;
    passing_truthsets?: number;
  };
}

interface WgsValidationReport {
  external_validation_summary?: {
    configured_truthsets?: number;
    runnable_truthsets?: number;
    passing_truthsets?: number;
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

export interface GeneticsBenchmarkReport {
  generated_at: string;
  requirements_path: string;
  dashboard_json_path: string;
  dashboard_html_path?: string;
  source_notes: string[];
  category_counts: Record<string, { actual: number; target: number; recall: number; passed: boolean }>;
  summary: {
    score: number;
    status: 'pass' | 'warn' | 'fail';
    total_reports: number;
    total_report_target: number;
    category_recall: number;
    rendered_sections: number;
    raw_download_types: number;
    variant_classes: number;
    external_validation_sources: number;
    external_validation_runnable: number;
    external_validation_configured: number;
    caller_available: number;
    prs_supported: number;
    gene_catalog: number;
    report_catalog_entries: number;
    report_catalog_quality: number;
    report_catalog_source_types: number;
    report_catalog_duplicates: number;
    interpretation_depth_score: number;
    interpretation_source_families: number;
    interpretation_clinvar_gene_targets: number;
    interpretation_cpic_gene_drug_rules: number;
    interpretation_pgs_variants: number;
    interpretation_requires_large_database: boolean;
  };
  missing_categories: string[];
  missing_sections: string[];
  missing_raw_download_types: string[];
  missing_variant_classes: string[];
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

function uniqueVariantGenes(output: DashboardOutput, summary?: WgsVariantClassSummary): number {
  const genes = new Set<string>();
  const cards = output.metadata.variant_cards;
  for (const group of Object.values(cards ?? {})) {
    if (!Array.isArray(group)) continue;
    for (const card of group) {
      if (typeof card.gene === 'string' && card.gene.trim()) genes.add(card.gene.trim());
    }
  }
  for (const call of summary?.calls ?? []) {
    for (const gene of call.genes ?? []) {
      if (gene.trim()) genes.add(gene.trim());
    }
  }
  return genes.size;
}

function supportedPrsDefinitions(packageDir: string): number {
  const weightsPath = path.join(packageDir, 'shared/prs_weights.json');
  if (!fs.existsSync(weightsPath)) return 0;
  const data = readJson<{ variants?: Array<{ disease?: string }> }>(weightsPath);
  return new Set((data.variants ?? []).map(item => item.disease).filter(Boolean)).size;
}

function htmlIncludesAll(html: string | undefined, labels: string[]): { present: number; missing: string[] } {
  if (!html) return { present: 0, missing: labels };
  const normalized = html.toLowerCase();
  const missing = labels.filter(label => !normalized.includes(label.toLowerCase()));
  return { present: labels.length - missing.length, missing };
}

export function buildGeneticsBenchmarkReport(params: {
  requirements: GeneticsBenchmarkRequirements;
  requirementsPath: string;
  dashboardJsonPath: string;
  dashboardHtmlPath?: string;
  packageDir: string;
  reportCatalogPath?: string;
}): GeneticsBenchmarkReport {
  const { requirements, requirementsPath, dashboardJsonPath, dashboardHtmlPath, packageDir, reportCatalogPath } = params;
  const output = readJson<DashboardOutput>(dashboardJsonPath);
  const html = dashboardHtmlPath && fs.existsSync(dashboardHtmlPath) ? fs.readFileSync(dashboardHtmlPath, 'utf8') : undefined;
  const reportCatalog = buildGeneticsReportCatalog(packageDir);
  if (reportCatalogPath) {
    fs.mkdirSync(path.dirname(reportCatalogPath), { recursive: true });
    fs.writeFileSync(reportCatalogPath, `${JSON.stringify(reportCatalog, null, 2)}\n`, 'utf8');
  }
  const categoryCounts: GeneticsBenchmarkReport['category_counts'] = {};

  for (const [category, requirement] of Object.entries(requirements.report_categories)) {
    const actual = reportCatalog.summary.category_counts[category as keyof GeneticsReportCatalog['summary']['category_counts']] ?? 0;
    const recall = requirement.target <= 0 ? 1 : actual / requirement.target;
    categoryCounts[category] = {
      actual,
      target: requirement.target,
      recall: Math.round(recall * 1000) / 1000,
      passed: recall >= requirements.target_category_recall,
    };
  }

  const totalReports = Object.values(categoryCounts).reduce((sum, item) => sum + item.actual, 0);
  const minimumCategoryRecall = Math.min(...Object.values(categoryCounts).map(item => item.recall));
  const sectionCoverage = htmlIncludesAll(html, requirements.required_sections);
  const wgsSummary = readOptionalJson<WgsVariantClassSummary>(path.join(packageDir, 'output/wgs-variant-class-summary.json'));
  const wgsManifest = readOptionalJson<WgsCallerManifest>(path.join(packageDir, 'output/wgs-caller-manifest.json'));
  const externalValidation = readOptionalJson<WgsExternalValidationReport>(path.join(packageDir, 'output/wgs-external-validation-report.json'));
  const validation = readOptionalJson<WgsValidationReport>(path.join(packageDir, 'output/wgs-validation-report.json'));
  const callerAvailable = wgsManifest?.caller_steps?.filter(step => step.available && step.tool && step.command_template && step.variant_class).length ?? 0;
  const rawSurface = [
    output.metadata.variant_count && output.metadata.variant_count > 0 ? 'VCF' : undefined,
    callerAvailable >= requirements.target_caller_available ? 'FASTQ' : undefined,
  ].filter((item): item is string => Boolean(item));
  const missingRawDownloadTypes = requirements.raw_download_types.filter(item => !rawSurface.includes(item));
  const classesWithCalls = Object.entries(wgsSummary?.class_counts ?? {})
    .filter(([, count]) => Number(count) > 0)
    .map(([variantClass]) => variantClass);
  const missingVariantClasses = requirements.variant_classes.filter(item => !classesWithCalls.includes(item));
  const externalSummary = externalValidation?.summary ?? validation?.external_validation_summary;
  const prsSupported = supportedPrsDefinitions(packageDir);
  const geneCatalog = uniqueVariantGenes(output, wgsSummary);
  const reportCatalogQuality = reportCatalog.summary.total_entries > 0
    ? reportCatalog.summary.valid_entries / reportCatalog.summary.total_entries
    : 0;
  const interpretationDepth = buildInterpretationDepthReport(packageDir);

  const metrics = [
    metric('total_reports', 'TellmeGen-style total report catalog breadth', totalReports, requirements.target_total_reports, percentScore(totalReports, requirements.target_total_reports), 'Interpretation catalog does not approach the 600+ report benchmark.'),
    metric('category_recall', 'Minimum TellmeGen category-count recall', Math.round(minimumCategoryRecall * 100), `${Math.round(requirements.target_category_recall * 100)}%`, ratioScore(minimumCategoryRecall, requirements.target_category_recall), 'At least one genetics report category is far below TellmeGen-style breadth.'),
    metric('rendered_sections', 'Rendered genetics section coverage', sectionCoverage.present, requirements.target_rendered_sections, percentScore(sectionCoverage.present, requirements.target_rendered_sections), 'One or more core genetics sections are missing from the dashboard.'),
    metric('raw_download_surface', 'Raw-data surface parity', rawSurface.length, requirements.target_raw_download_types, percentScore(rawSurface.length, requirements.target_raw_download_types), 'FASTQ/VCF-style raw-data readiness is not represented.'),
    metric('variant_classes', 'WGS variant-class interpretation surface', classesWithCalls.length, requirements.target_variant_classes, percentScore(classesWithCalls.length, requirements.target_variant_classes), 'Not all rare, CNV, indel, repeat, and rearrangement classes are normalized.'),
    metric('external_validation', 'External WGS precision/recall validation', externalSummary?.passing_truthsets ?? 0, requirements.target_external_validation_sources, percentScore(externalSummary?.passing_truthsets ?? 0, requirements.target_external_validation_sources), 'No external WGS benchmark has passing precision/recall metrics.'),
    metric('caller_availability', 'Runnable raw-read caller availability', callerAvailable, requirements.target_caller_available, percentScore(callerAvailable, requirements.target_caller_available), 'Configured WGS callers are not runnable in this environment.'),
    metric('prs_supported', 'PRS supported trait breadth', prsSupported, requirements.target_prs_supported, percentScore(prsSupported, requirements.target_prs_supported), 'PRS catalog is below the internal disease/wellness benchmark.'),
    metric('gene_catalog', 'Unique gene evidence breadth', geneCatalog, requirements.target_gene_catalog, percentScore(geneCatalog, requirements.target_gene_catalog), 'Generated evidence does not cover enough unique genes for broad WGS interpretation.'),
    metric('report_catalog_quality', 'Internal report-catalog entry quality', Math.round(reportCatalogQuality * 100), `${Math.round(requirements.target_report_catalog_quality * 100)}%`, ratioScore(reportCatalogQuality, requirements.target_report_catalog_quality), 'Report-catalog entries are missing required evidence metadata.'),
    metric('report_catalog_sources', 'Internal report-catalog source diversity', reportCatalog.summary.source_types.length, requirements.target_report_catalog_source_types, percentScore(reportCatalog.summary.source_types.length, requirements.target_report_catalog_source_types), 'Report catalog is not drawing from enough independent pipeline source layers.'),
    metric('interpretation_depth_score', 'Compact local interpretation-depth score', interpretationDepth.summary.score, requirements.target_interpretation_depth_score, percentScore(interpretationDepth.summary.score, requirements.target_interpretation_depth_score), 'Compact local interpretation slices are too shallow for WGS-provider-style depth.'),
    metric('interpretation_source_families', 'Compact interpretation source-family breadth', interpretationDepth.summary.source_families_supported, requirements.target_interpretation_source_families, percentScore(interpretationDepth.summary.source_families_supported, requirements.target_interpretation_source_families), 'Interpretation catalog does not combine enough independent source families.'),
    metric('interpretation_clinvar_targets', 'ClinVar target-gene template coverage', interpretationDepth.summary.clinvar_gene_targets, requirements.target_interpretation_clinvar_gene_targets, percentScore(interpretationDepth.summary.clinvar_gene_targets, requirements.target_interpretation_clinvar_gene_targets), 'ClinVar target-gene coverage is below the compact hereditary/carrier benchmark.'),
    metric('interpretation_cpic_rules', 'CPIC gene-drug rule coverage', interpretationDepth.summary.cpic_gene_drug_rules, requirements.target_interpretation_cpic_gene_drug_rules, percentScore(interpretationDepth.summary.cpic_gene_drug_rules, requirements.target_interpretation_cpic_gene_drug_rules), 'CPIC pharmacogenetic rule coverage is too sparse.'),
    metric('interpretation_pgs_variants', 'Selected PGS variant coverage', interpretationDepth.summary.pgs_variants, requirements.target_interpretation_pgs_variants, percentScore(interpretationDepth.summary.pgs_variants, requirements.target_interpretation_pgs_variants), 'Selected PGS weights are below the compact PRS benchmark.'),
    metric('interpretation_large_db_policy', 'Default interpretation path avoids large local databases', interpretationDepth.summary.default_requires_large_database, false, interpretationDepth.summary.default_requires_large_database ? 0 : 100, 'Default local interpretation requires large external caches.'),
  ];

  const passed = metrics.every(item => item.passed);
  const rawScore = Math.round(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length);
  const score = passed ? rawScore : Math.min(rawScore, 89);
  const status = metrics.some(item => item.score < 60) ? 'fail' : passed && score >= 90 ? 'pass' : 'warn';

  return {
    generated_at: new Date().toISOString(),
    requirements_path: requirementsPath,
    dashboard_json_path: dashboardJsonPath,
    dashboard_html_path: dashboardHtmlPath,
    source_notes: requirements.source_notes,
    category_counts: categoryCounts,
    summary: {
      score,
      status,
      total_reports: totalReports,
      total_report_target: requirements.target_total_reports,
      category_recall: Math.round(minimumCategoryRecall * 1000) / 1000,
      rendered_sections: sectionCoverage.present,
      raw_download_types: rawSurface.length,
      variant_classes: classesWithCalls.length,
      external_validation_sources: externalSummary?.passing_truthsets ?? 0,
      external_validation_runnable: externalSummary?.runnable_truthsets ?? 0,
      external_validation_configured: externalSummary?.configured_truthsets ?? 0,
      caller_available: callerAvailable,
      prs_supported: prsSupported,
      gene_catalog: geneCatalog,
      report_catalog_entries: reportCatalog.summary.total_entries,
      report_catalog_quality: Math.round(reportCatalogQuality * 1000) / 1000,
      report_catalog_source_types: reportCatalog.summary.source_types.length,
      report_catalog_duplicates: reportCatalog.summary.duplicate_ids_dropped,
      interpretation_depth_score: interpretationDepth.summary.score,
      interpretation_source_families: interpretationDepth.summary.source_families_supported,
      interpretation_clinvar_gene_targets: interpretationDepth.summary.clinvar_gene_targets,
      interpretation_cpic_gene_drug_rules: interpretationDepth.summary.cpic_gene_drug_rules,
      interpretation_pgs_variants: interpretationDepth.summary.pgs_variants,
      interpretation_requires_large_database: interpretationDepth.summary.default_requires_large_database,
    },
    missing_categories: Object.entries(categoryCounts).filter(([, item]) => !item.passed).map(([category]) => category),
    missing_sections: sectionCoverage.missing,
    missing_raw_download_types: missingRawDownloadTypes,
    missing_variant_classes: missingVariantClasses,
    metrics,
    passed,
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const requirementsPath = path.resolve(argValue('--requirements') ?? path.join(packageDir, 'references/genetics-benchmark-requirements.json'));
  const dashboardJsonPath = path.resolve(argValue('--json') ?? path.join(packageDir, '../../output/test_user_dashboard.json'));
  const dashboardHtmlPath = path.resolve(argValue('--html') ?? path.join(packageDir, 'output/sample/index.html'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/genetics-benchmark-report.json'));
  const reportCatalogPath = path.resolve(argValue('--catalog-out') ?? path.join(packageDir, 'output/genetics-report-catalog.json'));
  const report = buildGeneticsBenchmarkReport({
    requirements: readJson<GeneticsBenchmarkRequirements>(requirementsPath),
    requirementsPath,
    dashboardJsonPath,
    dashboardHtmlPath,
    packageDir,
    reportCatalogPath,
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

if (process.argv[1]?.endsWith('genetics_benchmark.ts')) {
  main();
}
