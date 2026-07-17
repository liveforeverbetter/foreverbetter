import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeBehavioral, parseBehavioralJson, parseBehavioralText } from '../src/core/behavioral.js';
import { buildSourceReference, normalizeImportedFile } from '../src/core/normalization.js';
import { runHealthAnalysis } from '../src/core/analysis.js';

test('parses structured behavioral JSON into typed entries', () => {
  const entries = parseBehavioralJson(JSON.stringify({
    entries: [
      { kind: 'supplement', name: 'Vitamin D3', dose: '4000 IU', timing: 'morning' },
      { kind: 'medication', name: 'clopidogrel', dose: '75 mg' },
      { kind: 'nutrition', name: 'fiber', value: 12 },
      { kind: 'symptom', name: 'stress', value: 8 },
    ],
  }));
  const kinds = entries.map(e => e.kind).sort();
  assert.deepEqual(kinds, ['medication', 'nutrition', 'supplement', 'symptom']);
});

test('scores nutrition + subjective signals and flags pharmacogenomic medications', () => {
  const { findings, inventory } = analyzeBehavioral([
    { kind: 'nutrition', id: 'fiber_g', name: 'Fiber', value: 12 },
    { kind: 'symptom', id: 'stress_level', name: 'Stress', value: 8 },
    { kind: 'supplement', id: 'vitamin_d3', name: 'Vitamin D3', dose: '4000 IU' },
    { kind: 'medication', id: 'clopidogrel', name: 'clopidogrel', dose: '75 mg' },
  ]);
  const byId = Object.fromEntries(findings.map(f => [f.id, f]));

  // Fiber 12 g/day is below the critical floor (15) -> needs_attention.
  assert.equal(byId.fiber_g.status, 'needs_attention');
  // Stress 8/10 is above the critical high (7) -> needs_attention.
  assert.equal(byId.stress_level.status, 'needs_attention');
  // Inventories are present.
  assert.equal(inventory.supplements.length, 1);
  assert.equal(inventory.medications.length, 1);
  // Clopidogrel carries CYP2C19 pharmacogenomic relevance.
  assert.deepEqual(inventory.medications[0]?.pharmacogenes, ['CYP2C19']);
  assert.match(byId.medication_inventory.action, /CPIC|pharmacogenomic|clinician/i);
});

test('parses free-form behavioral text (supplements + subjective scales)', () => {
  const entries = parseBehavioralText('Supplement: Magnesium Glycinate 400 mg evening\nstress 8\nenergy 3');
  const supp = entries.find(e => e.kind === 'supplement');
  assert.equal(supp?.name, 'Magnesium Glycinate');
  assert.equal(supp?.dose, '400 mg');
  assert.equal(supp?.timing, 'evening');
  const stress = entries.find(e => e.id === 'stress_level');
  assert.equal(stress?.value, 8);
});

test('behavioral uploads flow through import + analysis into derived findings', async () => {
  const payload = JSON.stringify({
    entries: [
      { kind: 'nutrition', name: 'fiber', value: 10 },
      { kind: 'medication', name: 'atorvastatin', dose: '20 mg' },
    ],
  });
  const source = buildSourceReference({ user_id: 'u1', organization_id: 'o1', category: 'behavioral', content_type: 'application/json', text: payload }, Buffer.from(payload));
  const observations = normalizeImportedFile(source, payload);
  assert.ok(observations.some(o => o.type === 'medication'));
  assert.ok(observations.some(o => o.type === 'nutrition_metric'));

  const analysis = runHealthAnalysis('u1', [source], observations, undefined, 'o1');
  const behavioral = analysis.derived_interpretations.filter(d => d.category === 'behavioral');
  assert.ok(behavioral.length > 0);
  assert.ok(behavioral.some(d => d.type === 'medication_inventory'));
});
