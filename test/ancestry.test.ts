import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSourceReference } from '../src/core/normalization.js';
import { runAncestryAnalysis } from '../src/core/ancestry-analysis.js';

// A tiny VCF containing real ancestry-informative markers with EUR-leaning
// homozygous-alt genotypes (e.g. rs1426654 A/A, rs12913832 T/T).
const AIM_VCF = [
  '##fileformat=VCFv4.2',
  '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE',
  '1\t159174683\trs2814778\tT\tC\t.\tPASS\t.\tGT\t0/0',
  '15\t48426484\trs1426654\tG\tA\t.\tPASS\t.\tGT\t1/1',
  '5\t33951693\trs16891982\tC\tG\t.\tPASS\t.\tGT\t0/0',
  '2\t109513601\trs3827760\tG\tA\t.\tPASS\t.\tGT\t0/0',
  '15\t28365618\trs12913832\tC\tT\t.\tPASS\t.\tGT\t1/1',
].join('\n');

test('ancestry endpoint computes proportions from ancestry-informative markers', () => {
  const payload = Buffer.from(AIM_VCF, 'utf8');
  const source = buildSourceReference({ user_id: 'u1', organization_id: 'o1', category: 'genetics', filename: 'ancestry.vcf', content_type: 'text/vcard', text: AIM_VCF }, payload);
  const result = runAncestryAnalysis({ user_id: 'u1', organization_id: 'o1', source_id: source.id }, source, payload);

  assert.ok(result.quality.marker_count >= 60);
  assert.ok(result.quality.matched_markers >= 3, `expected >=3 matched markers, got ${result.quality.matched_markers}`);
  assert.notEqual(result.status, 'setup_required');
  assert.ok(result.ancestry.length > 0);
  assert.equal(result.schema_version, '1.0');
  assert.equal(result.proportion_unit, 'percent');
  assert.equal(result.method.id, 'curated_aim_maximum_likelihood');
  assert.ok(result.ancestry.every(item => item.sub_region == null), 'continental output contains top-level regions only');
  assert.ok(result.methodology.reference_panel.includes('1000 Genomes'));
  // Every proportion is a sane percentage.
  assert.ok(result.ancestry.every(a => a.proportion >= 0 && a.proportion <= 100));
});

test('regional ancestry includes finer rows without changing percentage units', () => {
  const payload = Buffer.from(AIM_VCF, 'utf8');
  const source = buildSourceReference({ user_id: 'u1', organization_id: 'o1', category: 'genetics', filename: 'ancestry.vcf', text: AIM_VCF }, payload);
  const result = runAncestryAnalysis({ user_id: 'u1', organization_id: 'o1', source_id: source.id, resolution: 'regional' }, source, payload);
  assert.equal(result.resolution, 'regional');
  assert.equal(result.proportion_unit, 'percent');
  assert.ok(result.ancestry.some(item => item.sub_region != null));
});

test('ancestry returns a structured setup note when no payload is available', () => {
  const source = buildSourceReference({ user_id: 'u1', organization_id: 'o1', category: 'genetics', filename: 'empty.vcf', text: '' }, Buffer.from('', 'utf8'));
  const result = runAncestryAnalysis({ user_id: 'u1', organization_id: 'o1', source_id: source.id }, source, undefined);
  assert.equal(result.status, 'setup_required');
  assert.ok(result.quality.notes.length > 0);
});
