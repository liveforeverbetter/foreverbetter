#!/usr/bin/env npx tsx
/**
 * Biomarker validation truthsets.
 *
 * This is an internal benchmark, not a user-facing score. It checks whether
 * biomarker analysis produces expected derived metrics, status classifications,
 * domain coverage, deduped findings, and concrete retest-ready actions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { BiomarkerAnalysisSummary, SignalStatus } from '../../shared/dashboard-types.js';
import { analyzeBiomarkers, type BiomarkerReading } from './biomarker_engine.js';

interface ExpectedFinding {
  id: string;
  status: SignalStatus;
  value?: number;
  tolerance?: number;
  unit?: string;
  derived?: boolean;
}

interface ExpectedDomain {
  id: string;
  minimum_measured: number;
}

interface BiomarkerTruthset {
  id: string;
  description: string;
  minimum_status_recall: number;
  minimum_derived_recall: number;
  minimum_action_count: number;
  minimum_domains_covered: number;
  expected_measured_count?: number;
  readings: BiomarkerReading[];
  expected_findings: ExpectedFinding[];
  expected_domains: ExpectedDomain[];
}

interface BiomarkerTruthsetConfig {
  version: string;
  purpose: string;
  truthsets: BiomarkerTruthset[];
}

interface BiomarkerValidationResult {
  truthset_id: string;
  expected_findings: number;
  observed_findings: number;
  missing_findings: string[];
  incorrect_statuses: Array<{ id: string; expected: SignalStatus; observed?: SignalStatus }>;
  incorrect_values: Array<{ id: string; expected: number; observed?: number; tolerance: number }>;
  incorrect_units: Array<{ id: string; expected: string; observed?: string }>;
  expected_derived: number;
  observed_derived: number;
  missing_derived: string[];
  status_recall: number;
  derived_recall: number;
  expected_domains: number;
  observed_domains: number;
  missing_domains: string[];
  shallow_domains: Array<{ id: string; expected_minimum: number; observed: number }>;
  expected_measured_count?: number;
  observed_measured_count: number;
  action_count: number;
  incomplete_actions: number;
  passed: boolean;
}

interface BiomarkerValidationReport {
  generated_at: string;
  truthset_path: string;
  results: BiomarkerValidationResult[];
  passed: boolean;
  summary: {
    truthsets: number;
    passing_truthsets: number;
    minimum_status_recall: number;
    minimum_derived_recall: number;
    action_completeness: number;
  };
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

function validateTruthset(truthset: BiomarkerTruthset): BiomarkerValidationResult {
  const summary: BiomarkerAnalysisSummary = analyzeBiomarkers(truthset.readings);
  const findings = new Map(summary.findings.map(finding => [finding.id, finding]));
  const domains = new Map(summary.domains.map(domain => [domain.id, domain]));
  const expectedDerived = truthset.expected_findings.filter(finding => finding.derived);

  const missingFindings: string[] = [];
  const incorrectStatuses: BiomarkerValidationResult['incorrect_statuses'] = [];
  const incorrectValues: BiomarkerValidationResult['incorrect_values'] = [];
  const incorrectUnits: BiomarkerValidationResult['incorrect_units'] = [];
  const missingDerived: string[] = [];

  for (const expected of truthset.expected_findings) {
    const observed = findings.get(expected.id);
    if (!observed) {
      missingFindings.push(expected.id);
      if (expected.derived) missingDerived.push(expected.id);
      continue;
    }
    if (observed.status !== expected.status) {
      incorrectStatuses.push({ id: expected.id, expected: expected.status, observed: observed.status });
    }
    if (expected.value != null) {
      const tolerance = expected.tolerance ?? 0;
      if (observed.value == null || Math.abs(observed.value - expected.value) > tolerance) {
        incorrectValues.push({ id: expected.id, expected: expected.value, observed: observed.value, tolerance });
      }
    }
    if (expected.unit && observed.unit !== expected.unit) {
      incorrectUnits.push({ id: expected.id, expected: expected.unit, observed: observed.unit });
    }
  }

  for (const expected of expectedDerived) {
    if (!findings.has(expected.id) && !missingDerived.includes(expected.id)) missingDerived.push(expected.id);
  }

  const missingDomains: string[] = [];
  const shallowDomains: BiomarkerValidationResult['shallow_domains'] = [];
  for (const expected of truthset.expected_domains) {
    const observed = domains.get(expected.id);
    if (!observed) {
      missingDomains.push(expected.id);
    } else if (observed.measured < expected.minimum_measured) {
      shallowDomains.push({ id: expected.id, expected_minimum: expected.minimum_measured, observed: observed.measured });
    }
  }

  const observedFindings = truthset.expected_findings.length - missingFindings.length;
  const observedDerived = expectedDerived.length - missingDerived.length;
  const statusCorrect = truthset.expected_findings.length - missingFindings.length - incorrectStatuses.length;
  const statusRecall = truthset.expected_findings.length === 0 ? 1 : roundMetric(statusCorrect / truthset.expected_findings.length);
  const derivedRecall = expectedDerived.length === 0 ? 1 : roundMetric(observedDerived / expectedDerived.length);
  const observedDomains = truthset.expected_domains.length - missingDomains.length - shallowDomains.length;
  const incompleteActions = summary.action_items.filter(action => !action.rationale || !action.next_step || !action.retest_window || action.source_modalities.length === 0).length;
  const measuredCountMatches = truthset.expected_measured_count == null || summary.measured_count === truthset.expected_measured_count;

  const passed = missingFindings.length === 0
    && incorrectStatuses.length === 0
    && incorrectValues.length === 0
    && incorrectUnits.length === 0
    && missingDerived.length === 0
    && missingDomains.length === 0
    && shallowDomains.length === 0
    && measuredCountMatches
    && statusRecall >= truthset.minimum_status_recall
    && derivedRecall >= truthset.minimum_derived_recall
    && observedDomains >= truthset.minimum_domains_covered
    && summary.action_items.length >= truthset.minimum_action_count
    && incompleteActions === 0;

  return {
    truthset_id: truthset.id,
    expected_findings: truthset.expected_findings.length,
    observed_findings: observedFindings,
    missing_findings: missingFindings,
    incorrect_statuses: incorrectStatuses,
    incorrect_values: incorrectValues,
    incorrect_units: incorrectUnits,
    expected_derived: expectedDerived.length,
    observed_derived: observedDerived,
    missing_derived: missingDerived,
    status_recall: statusRecall,
    derived_recall: derivedRecall,
    expected_domains: truthset.expected_domains.length,
    observed_domains: observedDomains,
    missing_domains: missingDomains,
    shallow_domains: shallowDomains,
    expected_measured_count: truthset.expected_measured_count,
    observed_measured_count: summary.measured_count,
    action_count: summary.action_items.length,
    incomplete_actions: incompleteActions,
    passed,
  };
}

export function validateBiomarkerTruthsets(config: BiomarkerTruthsetConfig, truthsetPath: string): BiomarkerValidationReport {
  const results = config.truthsets.map(validateTruthset);
  const minimumStatusRecall = Math.min(...results.map(result => result.status_recall));
  const minimumDerivedRecall = Math.min(...results.map(result => result.derived_recall));
  const actionCompleteness = results.length === 0
    ? 0
    : roundMetric(results.filter(result => result.incomplete_actions === 0 && result.action_count > 0).length / results.length);

  return {
    generated_at: new Date().toISOString(),
    truthset_path: truthsetPath,
    results,
    passed: results.every(result => result.passed),
    summary: {
      truthsets: results.length,
      passing_truthsets: results.filter(result => result.passed).length,
      minimum_status_recall: Number.isFinite(minimumStatusRecall) ? minimumStatusRecall : 0,
      minimum_derived_recall: Number.isFinite(minimumDerivedRecall) ? minimumDerivedRecall : 0,
      action_completeness: actionCompleteness,
    },
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const truthsetPath = path.resolve(argValue('--truthsets') ?? path.join(packageDir, 'references/biomarker-validation-truthsets.json'));
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/biomarker-validation-report.json'));
  const report = validateBiomarkerTruthsets(readJson<BiomarkerTruthsetConfig>(truthsetPath), truthsetPath);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.passed ? 'pass' : 'fail',
    output: outPath,
    summary: report.summary,
    results: report.results.map(result => ({
      truthset_id: result.truthset_id,
      status_recall: result.status_recall,
      derived_recall: result.derived_recall,
      missing_findings: result.missing_findings.length,
      incorrect_statuses: result.incorrect_statuses.length,
      incorrect_values: result.incorrect_values.length,
      action_count: result.action_count,
      incomplete_actions: result.incomplete_actions,
      passed: result.passed,
    })),
  }, null, 2));
  if (!report.passed) process.exit(1);
}

if (process.argv[1]?.endsWith('biomarker_validation.ts')) {
  main();
}
