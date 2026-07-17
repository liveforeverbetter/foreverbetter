#!/usr/bin/env npx tsx
/**
 * Compact CNV/SV/repeat evidence validation.
 *
 * This intentionally validates only the small provenance fixture. It does not
 * validate production-depth CNV/SV/repeat evidence coverage.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type VariantClass = 'copy_number_variant' | 'structural_variant' | 'tandem_repeat';

interface Source {
  id: string;
  name: string;
  source_type: string;
  url: string;
  use_in_fixture: string;
  repo_policy: string;
}

interface EvidenceItem {
  id: string;
  variant_class: VariantClass;
  gene_or_region: string;
  genome_build: string;
  event: {
    type: string;
    display: string;
    minimum_call_fields: string[];
  };
  interpretation_boundary: string;
  provenance: Array<{
    source_id: string;
    external_id: string;
    evidence_role: string;
    assertion: string;
    strength: string;
  }>;
  validation_expectation: {
    expected_class: string;
    expected_reportability: string;
    must_preserve_provenance: boolean;
  };
}

interface CompactEvidenceCatalog {
  version: string;
  catalog_type: string;
  purpose: string;
  completeness: {
    status: string;
    statement: string;
    not_intended_for: string[];
  };
  scope: {
    genome_builds: string[];
    variant_classes: VariantClass[];
    max_evidence_items: number;
    local_fixture_only: boolean;
  };
  sources: Source[];
  evidence_items: EvidenceItem[];
  validation_expectations: {
    requires_all_variant_classes: boolean;
    requires_source_urls: boolean;
    requires_compact_catalog_disclaimer: boolean;
    forbids_production_completeness_claim: boolean;
  };
}

interface Check {
  id: string;
  passed: boolean;
  evidence: string;
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

function add(checks: Check[], id: string, passed: boolean, evidence: string): void {
  checks.push({ id, passed, evidence });
}

function hasUri(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function includesAny(text: string, phrases: string[]): boolean {
  const normalized = text.toLowerCase();
  return phrases.some(phrase => normalized.includes(phrase.toLowerCase()));
}

function validateCatalog(catalog: CompactEvidenceCatalog, schema: unknown, catalogPath: string, schemaPath: string): { status: 'pass' | 'fail'; checks: Check[] } {
  const checks: Check[] = [];
  const expectedClasses: VariantClass[] = ['copy_number_variant', 'structural_variant', 'tandem_repeat'];
  const sourceIds = new Set(catalog.sources.map(source => source.id));
  const itemClasses = new Set(catalog.evidence_items.map(item => item.variant_class));
  const ids = catalog.evidence_items.map(item => item.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const text = fs.readFileSync(catalogPath, 'utf8');

  add(checks, 'schema.present', fs.existsSync(schemaPath), schemaPath);
  add(checks, 'schema.parseable', typeof schema === 'object' && schema != null, 'schema JSON parsed');
  add(checks, 'catalog.type', catalog.catalog_type === 'compact_validation_catalog', catalog.catalog_type);
  add(checks, 'catalog.compact_status', catalog.completeness.status === 'compact_not_complete', catalog.completeness.status);
  add(
    checks,
    'catalog.disclaimer',
    includesAny(catalog.completeness.statement, ['compact validation catalog', 'not complete']),
    catalog.completeness.statement,
  );
  add(
    checks,
    'catalog.no_complete_claim',
    !includesAny(text, ['complete evidence catalog', 'comprehensive evidence catalog', 'production-depth catalog']),
    'forbidden completeness phrases absent',
  );
  add(checks, 'scope.local_fixture_only', catalog.scope.local_fixture_only === true, String(catalog.scope.local_fixture_only));
  add(checks, 'scope.max_items_small', catalog.scope.max_evidence_items <= 12 && catalog.evidence_items.length <= catalog.scope.max_evidence_items, `${catalog.evidence_items.length}/${catalog.scope.max_evidence_items}`);
  add(checks, 'scope.classes', expectedClasses.every(item => catalog.scope.variant_classes.includes(item)), catalog.scope.variant_classes.join(','));
  add(checks, 'sources.minimum', catalog.sources.length >= 3, `${catalog.sources.length} sources`);
  add(checks, 'sources.urls', catalog.sources.every(source => hasUri(source.url)), catalog.sources.map(source => `${source.id}:${source.url}`).join(', '));
  add(checks, 'sources.repo_policy', catalog.sources.every(source => source.repo_policy.length >= 20), 'repo policies present');
  add(checks, 'items.unique_ids', duplicateIds.length === 0, duplicateIds.length ? duplicateIds.join(', ') : 'unique');
  add(checks, 'items.class_coverage', expectedClasses.every(item => itemClasses.has(item)), Array.from(itemClasses).join(','));
  add(checks, 'items.minimum_fields', catalog.evidence_items.every(item => item.event.minimum_call_fields.length >= 2), 'minimum call fields present');
  add(checks, 'items.boundaries', catalog.evidence_items.every(item => item.interpretation_boundary.length >= 20), 'interpretation boundaries present');
  add(checks, 'items.provenance', catalog.evidence_items.every(item => item.provenance.length > 0), 'every item has provenance');
  add(
    checks,
    'items.source_refs',
    catalog.evidence_items.every(item => item.provenance.every(entry => sourceIds.has(entry.source_id))),
    'all provenance source_id values resolve',
  );
  add(
    checks,
    'items.preserve_provenance',
    catalog.evidence_items.every(item => item.validation_expectation.must_preserve_provenance === true),
    'must_preserve_provenance true for all items',
  );
  add(
    checks,
    'expectations.flags',
    catalog.validation_expectations.requires_all_variant_classes === true
      && catalog.validation_expectations.requires_source_urls === true
      && catalog.validation_expectations.requires_compact_catalog_disclaimer === true
      && catalog.validation_expectations.forbids_production_completeness_claim === true,
    JSON.stringify(catalog.validation_expectations),
  );

  return {
    status: checks.every(check => check.passed) ? 'pass' : 'fail',
    checks,
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const catalogPath = path.resolve(argValue('--catalog') ?? path.join(packageDir, 'references/cnv-sv-repeat-evidence.compact.json'));
  const schemaPath = path.resolve(argValue('--schema') ?? path.join(packageDir, 'references/cnv-sv-repeat-evidence.schema.json'));
  const catalog = readJson<CompactEvidenceCatalog>(catalogPath);
  const schema = readJson<unknown>(schemaPath);
  const result = validateCatalog(catalog, schema, catalogPath, schemaPath);

  console.log(JSON.stringify({
    status: result.status,
    catalog: catalogPath,
    schema: schemaPath,
    checks: result.checks,
    failed: result.checks.filter(check => !check.passed),
  }, null, 2));

  if (result.status !== 'pass') process.exit(1);
}

if (process.argv[1]?.endsWith('cnv_sv_repeat_evidence_validation.ts')) {
  main();
}
