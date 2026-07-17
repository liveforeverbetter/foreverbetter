import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { analyzeBiomarkers, convertMarkerToCanonical, parseBiomarkerCsv, parseBiomarkerJson, parseBiomarkerText, parseDecimal } from '../src/core/engines.js';
import { looksLikeFhir, parseBiomarkerFhir } from '../src/core/fhir.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(here, 'fixtures', name);

test('parses the full lab panel CSV into normalized reading IDs', async () => {
  const text = await readFile(fixture('biomarkers-full-panel.csv'), 'utf8');
  const readings = parseBiomarkerCsv(text);
  const ids = readings.map(reading => reading.id).sort();
  assert.deepEqual(ids, [
    'apob',
    'fasting_glucose',
    'fasting_insulin',
    'ferritin',
    'hba1c',
    'hdl_c',
    'hs_crp',
    'ldl_c',
    'triglycerides',
  ]);
});

test('parses JSON biomarker payloads from the {readings: [...]} envelope', () => {
  const text = JSON.stringify({
    readings: [
      { marker: 'ApoB', value: 95, unit: 'mg/dL' },
      { marker: 'HbA1c', value: 5.4, unit: '%' },
    ],
  });
  const readings = parseBiomarkerJson(text);
  assert.deepEqual(readings.map(r => r.id).sort(), ['apob', 'hba1c']);
});

test('parses free-form text labs by alias matching', () => {
  const readings = parseBiomarkerText('Apolipoprotein B: 102 mg/dL\nCRP 1.8 mg/L');
  const idsByValue = Object.fromEntries(readings.map(r => [r.id, r.value]));
  assert.equal(idsByValue.apob, 102);
  assert.equal(idsByValue.hs_crp, 1.8);
});

test('flags out-of-range biomarkers + computes derived metabolic biomarkers', () => {
  const readings = [
    { id: 'apob', value: 130, unit: 'mg/dL' },
    { id: 'hba1c', value: 6.8, unit: '%' },
    { id: 'fasting_glucose', value: 110, unit: 'mg/dL' },
    { id: 'fasting_insulin', value: 14, unit: 'uIU/mL' },
    { id: 'hdl_c', value: 42, unit: 'mg/dL' },
    { id: 'ldl_c', value: 135, unit: 'mg/dL' },
    { id: 'total_cholesterol', value: 220, unit: 'mg/dL' },
    { id: 'triglycerides', value: 168, unit: 'mg/dL' },
    { id: 'apoa1', value: 120, unit: 'mg/dL' },
    { id: 'creatinine', value: 1.1, unit: 'mg/dL' },
  ];
  const { findings } = analyzeBiomarkers(readings, { age: 42, sex: 'male' });
  const byId = Object.fromEntries(findings.map(f => [f.id, f]));

  assert.equal(byId.apob.status, 'needs_attention');
  assert.equal(byId.hba1c.status, 'needs_attention');
  assert.equal(byId.hdl_c.status, 'watch');
  assert.equal(byId.homa_ir.source_type, 'derived');
  // HOMA-IR = glucose * insulin / 405 = 110 * 14 / 405 ≈ 3.8 -> needs_attention
  assert.equal(byId.homa_ir.status, 'needs_attention');
  assert.ok(byId.homa_ir.score < 50);
  assert.equal(byId.tg_hdl_ratio.source_type, 'derived');
  assert.equal(byId.tg_hdl_ratio.status, 'needs_attention');
  assert.equal(byId.tyg_index.source_type, 'derived');
  assert.equal(byId.tyg_index.status, 'needs_attention');
  assert.equal(byId.metabolic_signal_count.source_type, 'derived');
  assert.equal(byId.metabolic_signal_count.status, 'needs_attention');
  assert.equal(byId.non_hdl_c.source_type, 'derived');
  assert.equal(byId.non_hdl_c.domain, 'cardiometabolic');
  assert.deepEqual(byId.non_hdl_c.inputs, ['total_cholesterol', 'hdl_c']);
  assert.equal(byId.chol_hdl_ratio.source_type, 'derived');
  assert.equal(byId.ldl_hdl_ratio.source_type, 'derived');
  assert.equal(byId.remnant_cholesterol.source_type, 'derived');
  assert.equal(byId.apob_apoa1_ratio.source_type, 'derived');
  assert.equal(byId.egfr.source_type, 'derived');
  assert.equal(byId.egfr.domain, 'organ_function');
});

test('falls back to definition unit when caller omits unit and value is out of range', () => {
  const readings = parseBiomarkerCsv('marker,value\napob,140\n');
  assert.equal(readings[0]?.id, 'apob');
  assert.equal(readings[0]?.unit, undefined);
  const findings = analyzeBiomarkers(readings).findings;
  assert.equal(findings[0]?.status, 'needs_attention');
  assert.equal(findings[0]?.interpretation.includes('mg/dL'), true);
});

test('rejects non-numeric biomarker values', () => {
  const readings = parseBiomarkerCsv('marker,value,unit\nApoB,n/a,mg/dL\nHbA1c,5.4,%\n');
  assert.equal(readings.length, 1);
  assert.equal(readings[0]?.id, 'hba1c');
});

test('converts EU/SI units to canonical before scoring (mmol/L, µmol/L, mmol/mol)', () => {
  // A normal EU panel: glucose 4.8 mmol/L (~86 mg/dL), cholesterol 5.0 mmol/L,
  // creatinine 80 µmol/L (~0.9 mg/dL), HbA1c 34 mmol/mol (~5.26%).
  const readings = [
    { id: 'fasting_glucose', value: 4.8, unit: 'mmol/L' },
    { id: 'total_cholesterol', value: 5.0, unit: 'mmol/L' },
    { id: 'creatinine', value: 80, unit: 'µmol/L' },
    { id: 'hba1c', value: 34, unit: 'mmol/mol' },
    { id: 'vitamin_d', value: 100, unit: 'nmol/L' },
  ];
  const { findings } = analyzeBiomarkers(readings, { age: 40, sex: 'female' });
  const byId = Object.fromEntries(findings.map(f => [f.id, f]));

  // Glucose must NOT be flagged critically low (the pre-conversion bug).
  assert.equal(byId.fasting_glucose.status, 'optimal');
  assert.equal(byId.fasting_glucose.converted_from, 'mmol/L');
  assert.equal(byId.fasting_glucose.unit, 'mg/dL');
  // Total cholesterol 5.0 mmol/L ≈ 193 mg/dL -> optimal (<200).
  assert.equal(byId.total_cholesterol.status, 'optimal');
  // Creatinine 80 µmol/L ≈ 0.90 mg/dL -> in range.
  assert.equal(byId.creatinine.status, 'optimal');
  // HbA1c 34 mmol/mol ≈ 5.26% -> optimal (<5.3).
  assert.equal(byId.hba1c.status, 'optimal');
  // Vitamin D 100 nmol/L ≈ 40 ng/mL -> optimal.
  assert.equal(byId.vitamin_d.status, 'optimal');
});

test('reads European decimal commas without corrupting values', () => {
  // parseDecimal: decimal comma vs thousands grouping.
  assert.equal(parseDecimal('5,1'), 5.1);
  assert.equal(parseDecimal('0,45'), 0.45);
  assert.equal(parseDecimal('5.1'), 5.1);
  assert.equal(parseDecimal('250,000'), 250000);
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('1,234.56'), 1234.56);
  assert.equal(parseDecimal('118'), 118);

  // A ';'-delimited EU CSV with comma decimals must score correctly, not as 51.
  const csv = 'marker;value;unit\nGlucose;5,1;mmol/L\nTotal cholesterol;5,0;mmol/L';
  const readings = parseBiomarkerCsv(csv);
  const glucose = readings.find(r => r.id === 'fasting_glucose');
  assert.ok(glucose && Math.abs(glucose.value - 5.1) < 1e-9);
  const { findings } = analyzeBiomarkers(readings, { age: 40, sex: 'male' });
  // 5.1 mmol/L glucose ≈ 92 mg/dL -> not critically low (the corruption bug).
  assert.notEqual(findings.find(f => f.id === 'fasting_glucose')?.status, 'critical');

  // Free text with a comma decimal.
  const textReadings = parseBiomarkerText('Fasting glucose 5,1 mmol/L');
  assert.ok(textReadings.some(r => r.id === 'fasting_glucose' && Math.abs(r.value - 5.1) < 1e-9));
});

test('convertMarkerToCanonical exposes the conversion for connectors/tests', () => {
  const glucose = convertMarkerToCanonical('fasting_glucose', 5.0, 'mmol/L');
  assert.equal(glucose?.unit, 'mg/dL');
  assert.ok(glucose && Math.abs(glucose.value - 90.1) < 0.5);
  const identity = convertMarkerToCanonical('apob', 95, 'mg/dL');
  assert.equal(identity?.converted_from, undefined);
});

test('flags an unrecognized unit instead of silently scoring it', () => {
  const { findings } = analyzeBiomarkers([{ id: 'fasting_glucose', value: 5.0, unit: 'bananas' }]);
  const glucose = findings.find(f => f.id === 'fasting_glucose');
  assert.equal(glucose?.unit_unrecognized, true);
  assert.match(glucose?.interpretation ?? '', /not recognized/i);
});

test('an unrecognized-unit value does not feed derived metrics', () => {
  // Glucose has an unrecognized unit; insulin is fine. HOMA-IR must NOT be
  // computed from the uninterpretable glucose value.
  const { findings } = analyzeBiomarkers([
    { id: 'fasting_glucose', value: 5.0, unit: 'bananas' },
    { id: 'fasting_insulin', value: 8, unit: 'uIU/mL' },
  ]);
  assert.ok(findings.some(f => f.id === 'fasting_glucose' && f.unit_unrecognized));
  assert.equal(findings.find(f => f.id === 'homa_ir'), undefined);
});

test('ingests a FHIR R4 Bundle of lab Observations (LOINC + display fallback)', () => {
  const bundle = JSON.stringify({
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { resource: { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '2089-1', display: 'LDL Cholesterol' }] }, valueQuantity: { value: 3.6, unit: 'mmol/L' } } },
      { resource: { resourceType: 'Observation', code: { coding: [{ system: 'http://loinc.org', code: '4548-4' }], text: 'HbA1c' }, valueQuantity: { value: 38, unit: 'mmol/mol' } } },
      { resource: { resourceType: 'Observation', code: { text: 'ApoB' }, valueQuantity: { value: 105, unit: 'mg/dL' } } },
    ],
  });
  assert.equal(looksLikeFhir(bundle), true);
  const readings = parseBiomarkerFhir(bundle);
  const byId = Object.fromEntries(readings.map(r => [r.id, r]));
  assert.equal(byId.ldl_c.value, 3.6);
  assert.equal(byId.ldl_c.unit, 'mmol/L');
  assert.equal(byId.hba1c.value, 38);
  assert.equal(byId.apob.value, 105);

  // And the readings flow through unit conversion when analyzed.
  const findings = analyzeBiomarkers(readings).findings;
  const ldl = findings.find(f => f.id === 'ldl_c');
  assert.equal(ldl?.converted_from, 'mmol/L'); // 3.6 mmol/L ~ 139 mg/dL
  assert.equal(ldl?.status, 'watch');
});

test('applies sex-specific reference ranges (hemoglobin, ferritin)', () => {
  const female = analyzeBiomarkers([{ id: 'hemoglobin', value: 13, unit: 'g/dL' }], { sex: 'female' }).findings[0];
  const male = analyzeBiomarkers([{ id: 'hemoglobin', value: 13, unit: 'g/dL' }], { sex: 'male' }).findings[0];
  // 13 g/dL is in-range for a woman but below the male target.
  assert.equal(female?.status, 'optimal');
  assert.equal(male?.status, 'watch');
});

test('scores the expanded panel (hormones, homocysteine, uric acid, PSA)', () => {
  const readings = [
    { id: 'total_testosterone', value: 12, unit: 'nmol/L' }, // ~346 ng/dL -> low for a male target
    { id: 'homocysteine', value: 16, unit: 'umol/L' },
    { id: 'uric_acid', value: 9.0, unit: 'mg/dL' },
    { id: 'psa', value: 5, unit: 'ng/mL' },
    { id: 'albumin', value: 45, unit: 'g/L' }, // 4.5 g/dL -> optimal
  ];
  const byId = Object.fromEntries(analyzeBiomarkers(readings, { sex: 'male' }).findings.map(f => [f.id, f]));
  assert.equal(byId.total_testosterone.status, 'watch');
  assert.equal(byId.homocysteine.status, 'needs_attention');
  assert.equal(byId.uric_acid.status, 'needs_attention');
  assert.equal(byId.psa.status, 'needs_attention');
  assert.equal(byId.albumin.status, 'optimal');
  assert.equal(byId.albumin.converted_from, 'g/L');
});
