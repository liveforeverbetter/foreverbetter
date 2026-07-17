import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import { queryClinVarForRSIDs } from './clinvar_enrichment.js';
import { parseWgsVariantClassVcf, readWgsInterpretationCatalog } from './wgs_variant_class_engine.js';
import { validateWgsVariantClassesFromTruthsets } from './wgs_validation.js';

const fixtureDir = path.resolve('examples/fixtures/reference-validation');

function rsidsFromVcf(vcfPath: string): string[] {
  return fs.readFileSync(vcfPath, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('\t')[2])
    .filter(id => /^rs\d+$/i.test(id));
}

describe('reference-validation fixtures', () => {
  it('parses tiny rsID and ClinVar index fixtures', () => {
    const rsids = rsidsFromVcf(path.join(fixtureDir, 'clinvar-rsid.vcf'));
    const result = queryClinVarForRSIDs(rsids, path.join(fixtureDir, 'clinvar-index.txt'));

    assert.deepEqual(rsids, ['rs80357906', 'rs1065852']);
    assert.equal(result.totalQueried, 2);
    assert.equal(result.totalFound, 2);
    assert.equal(result.pathogenicCount, 1);
    assert.equal(result.drugResponseCount, 1);
    assert.ok(result.annotations.some(annotation => annotation.rsid === 'rs80357906' && annotation.isACMG));
  });

  it('classifies tiny WGS reference records and validates GIAB-style metric shape', () => {
    const catalogPath = path.join(fixtureDir, 'wgs-catalog.json');
    const truthsetPath = path.join(fixtureDir, 'truthsets.json');
    const vcfPath = path.join(fixtureDir, 'wgs-classes.vcf');
    const catalog = readWgsInterpretationCatalog(catalogPath);
    const calls = parseWgsVariantClassVcf(fs.readFileSync(vcfPath, 'utf8'), catalog, 'reference-validation');
    const classes = new Set(calls.map(call => call.class));

    assert.equal(calls.length, 5);
    assert.deepEqual(classes, new Set([
      'copy_number_variants',
      'tandem_repeats',
      'rearrangements',
      'large_indels',
      'rare_small_variants',
    ]));
    assert.ok(calls.every(call => call.reportability === 'clinician_review'));

    const config = JSON.parse(fs.readFileSync(truthsetPath, 'utf8'));
    const report = validateWgsVariantClassesFromTruthsets(config, truthsetPath, catalogPath, fixtureDir);

    assert.equal(report.passed, true);
    assert.equal(report.results[0].recall, 1);
    assert.equal(report.results[0].precision, 1);
    assert.equal(report.external_validation_summary.evaluated_truthsets, 1);
    assert.equal(report.external_validation[0].passed, true);
    assert.equal(report.external_validation[0].recall, 0.992);
    assert.equal(report.external_validation[0].precision, 0.987);
  });
});
