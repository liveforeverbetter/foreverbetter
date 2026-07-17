/**
 * Tests for the M1 canonical contracts: observation adapters and rule schema.
 *
 * Run: npx tsx --test scripts/pipeline/observation_pipeline.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { analyzeBiomarkers } from './biomarker_engine.js';
import { analyzeWearables } from './wearable_engine.js';
import {
  biomarkerObservationsFromAnalysis,
  wearableObservationsFromAnalysis,
  geneticObservationsFromGenomicOutput,
  buildNormalizedObservations,
} from './observation_adapters.js';
import { INTERVENTION_RULES, requirementMatches } from './intervention_rules.js';
import type { NormalizedObservation } from './observation_types.js';
import type { ClinVarVariantCard } from '../../shared/dashboard-types.js';

describe('Biomarker observation adapter', () => {
  it('produces one observation per biomarker finding with provenance and target', () => {
    const analysis = analyzeBiomarkers([
      { id: 'ApoB', value: 125, unit: 'mg/dL', collected_at: '2026-05-01' },
      { id: 'HbA1c', value: 5.8, unit: '%', collected_at: '2026-05-01' },
    ]);
    const observations = biomarkerObservationsFromAnalysis(analysis);
    const apob = observations.find(o => o.signal_id === 'apob');
    assert.ok(apob, 'expected apob observation');
    assert.strictEqual(apob.modality, 'biomarkers');
    assert.strictEqual(apob.provenance.source_kind, 'measured');
    assert.strictEqual(apob.provenance.source_label, 'Blood test');
    assert.strictEqual(apob.status, 'needs_attention');
    assert.strictEqual(apob.direction, 'high');
    assert.strictEqual(apob.target_label, '<=80 mg/dL');
    assert.strictEqual(apob.value, 125);
  });

  it('preserves derived biomarker provenance (formula + inputs)', () => {
    const analysis = analyzeBiomarkers([
      { id: 'fasting_glucose', value: 97 },
      { id: 'fasting_insulin', value: 13.4 },
    ]);
    const observations = biomarkerObservationsFromAnalysis(analysis);
    const homa = observations.find(o => o.signal_id === 'homa_ir');
    assert.ok(homa, 'expected homa_ir observation from derivation');
    assert.strictEqual(homa.provenance.source_kind, 'derived');
    assert.ok(homa.provenance.derivation, 'expected derivation formula text');
    assert.ok(homa.provenance.derived_from && homa.provenance.derived_from.includes('fasting_glucose'));
  });

  it('returns empty array when no biomarker analysis is provided', () => {
    assert.strictEqual(biomarkerObservationsFromAnalysis(undefined).length, 0);
  });
});

describe('Wearable observation adapter', () => {
  it('emits one observation per wearable finding with behavioral provenance', () => {
    const analysis = analyzeWearables([
      { id: 'sleep_duration', value: 5.7, unit: 'hours' },
      { id: 'hrv', value: 22, unit: 'ms' },
    ]);
    const observations = wearableObservationsFromAnalysis(analysis, { defaultWindowDays: 7 });
    const sleep = observations.find(o => o.signal_id === 'sleep_duration');
    const hrv = observations.find(o => o.signal_id === 'hrv');
    assert.ok(sleep && hrv);
    assert.strictEqual(sleep.modality, 'wearables');
    assert.strictEqual(sleep.provenance.source_kind, 'behavioral_aggregate');
    assert.strictEqual(sleep.provenance.window_days, 7);
    assert.strictEqual(sleep.direction, 'low');
    assert.strictEqual(sleep.status, 'needs_attention');
    assert.strictEqual(hrv.status, 'needs_attention');
  });

  it('flags moderate uncertainty when the averaging window is short', () => {
    const analysis = analyzeWearables([{ id: 'sleep_duration', value: 5.5 }]);
    const observations = wearableObservationsFromAnalysis(analysis, { defaultWindowDays: 3 });
    assert.strictEqual(observations[0]?.quality.uncertainty, 'moderate');
  });
});

describe('Genetic observation adapter', () => {
  function mthfr(zygosity: 'Homozygous' | 'Heterozygous'): ClinVarVariantCard {
    return {
      gene: 'MTHFR', rsid: 'rs1801133', disease: 'Folate metabolism',
      clinicalSignificance: 'risk factor', significanceColor: 'orange',
      category: 'other_risks', zygosity, frequency: 'common',
      annotation: 'C677T variant reduces enzyme activity', reviewStatus: 'reviewed',
    };
  }

  function cyp2c19(rsid: string, zygosity: 'Homozygous' | 'Heterozygous' = 'Heterozygous'): ClinVarVariantCard {
    return {
      gene: 'CYP2C19', rsid, disease: 'Drug metabolism',
      clinicalSignificance: 'drug response', significanceColor: 'purple',
      category: 'drug_response', zygosity, frequency: 'common',
      annotation: 'CYP2C19 loss-of-function allele', reviewStatus: 'reviewed',
    };
  }

  it('detects MTHFR C677T homozygous as a personalised genetics observation', () => {
    const observations = geneticObservationsFromGenomicOutput({
      variant_cards: { other_risks: [mthfr('Homozygous')] },
    });
    const obs = observations.find(o => o.signal_id === 'mthfr_c677t');
    assert.ok(obs);
    assert.strictEqual(obs.value, 'homozygous');
    assert.strictEqual(obs.modality, 'genetics');
    assert.strictEqual(obs.provenance.source_kind, 'genotype');
  });

  it('treats single CYP2C19 LoF allele as intermediate metabolizer', () => {
    const observations = geneticObservationsFromGenomicOutput({
      variant_cards: { drug_response: [cyp2c19('rs4244285', 'Heterozygous')] },
    });
    const obs = observations.find(o => o.signal_id === 'cyp2c19_metabolizer');
    assert.ok(obs);
    assert.strictEqual(obs.value, 'intermediate_metabolizer');
  });

  it('reports poor metabolizer when CYP2C19 LoF is homozygous', () => {
    const observations = geneticObservationsFromGenomicOutput({
      variant_cards: { drug_response: [cyp2c19('rs4244285', 'Homozygous')] },
    });
    const obs = observations.find(o => o.signal_id === 'cyp2c19_metabolizer');
    assert.ok(obs);
    assert.strictEqual(obs.value, 'poor_metabolizer');
  });

  it('skips genetic observations for non-catalogued rsIDs', () => {
    const random: ClinVarVariantCard = {
      gene: 'APOE', rsid: 'rs429358', disease: 'Cardiovascular',
      clinicalSignificance: 'risk factor', significanceColor: 'orange',
      category: 'other_risks', zygosity: 'Heterozygous', frequency: 'common',
      annotation: 'APOE e4 risk allele', reviewStatus: 'reviewed',
    };
    const observations = geneticObservationsFromGenomicOutput({
      variant_cards: { other_risks: [random] },
    });
    assert.strictEqual(observations.length, 0);
  });

  it('returns empty array when no genetic input is provided', () => {
    assert.strictEqual(geneticObservationsFromGenomicOutput(undefined).length, 0);
  });
});

describe('Combined observation builder', () => {
  it('concatenates biomarker, wearable, and genetic observations', () => {
    const biomarkers = analyzeBiomarkers([{ id: 'ApoB', value: 125 }]);
    const wearables = analyzeWearables([{ id: 'sleep_duration', value: 5.5 }]);
    const observations = buildNormalizedObservations({
      biomarkers,
      wearables,
      genetics: { variant_cards: { other_risks: [{
        gene: 'MTHFR', rsid: 'rs1801133', disease: 'Folate metabolism',
        clinicalSignificance: 'risk factor', significanceColor: 'orange',
        category: 'other_risks', zygosity: 'Homozygous', frequency: 'common',
        annotation: 'C677T', reviewStatus: 'reviewed',
      }] } },
    });
    const modalities = new Set(observations.map(o => o.modality));
    assert.ok(modalities.has('biomarkers'));
    assert.ok(modalities.has('wearables'));
    assert.ok(modalities.has('genetics'));
  });
});

describe('Intervention rule catalog', () => {
  it('every rule has a unique id and a stable intervention_id', () => {
    const ids = INTERVENTION_RULES.map(r => r.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'rule ids must be unique');
    for (const rule of INTERVENTION_RULES) {
      assert.ok(rule.intervention_id, `${rule.id} missing intervention_id`);
      assert.ok(rule.required.length > 0, `${rule.id} has no required signals`);
      assert.ok(rule.steps.length > 0, `${rule.id} has no steps`);
      assert.ok(rule.safety && rule.safety.tier, `${rule.id} missing safety tier`);
      assert.ok(rule.expected_result, `${rule.id} missing expected_result`);
      assert.ok(rule.review_window, `${rule.id} missing review_window`);
      assert.ok(rule.ranking.urgency >= 0 && rule.ranking.urgency <= 1, `${rule.id} urgency out of range`);
    }
  });

  it('includes at least one rule per supported domain (genetics, biomarkers, wearables, cross-modal)', () => {
    const requiredSignalsByModality = (mod: 'genetics' | 'biomarkers' | 'wearables') =>
      INTERVENTION_RULES.filter(rule => rule.required.some(req => req.modality === mod));
    assert.ok(requiredSignalsByModality('biomarkers').length >= 3, 'expected >=3 biomarker-driven rules');
    assert.ok(requiredSignalsByModality('wearables').length >= 3, 'expected >=3 wearable-driven rules');
    assert.ok(requiredSignalsByModality('genetics').length >= 2, 'expected >=2 genetics-driven rules');
    const crossModal = INTERVENTION_RULES.filter(rule => {
      const modalities = new Set<string>();
      for (const req of rule.required) if (req.modality) modalities.add(req.modality);
      for (const mod of rule.optional_modifiers ?? []) if (mod.modality) modalities.add(mod.modality);
      return modalities.size >= 2;
    });
    assert.ok(crossModal.length >= 2, 'expected >=2 cross-modal rules');
  });
});

describe('requirementMatches', () => {
  const sleepObs: NormalizedObservation = {
    id: 'wearables:sleep_duration',
    signal_id: 'sleep_duration',
    signal_name: 'Sleep duration',
    modality: 'wearables',
    value: 5.5,
    unit: 'hours',
    status: 'needs_attention',
    direction: 'low',
    provenance: { modality: 'wearables', source_kind: 'behavioral_aggregate', source_label: 'WHOOP' },
    quality: { confidence: 0.8 },
  };

  it('matches when signal id, modality, status, and direction line up', () => {
    assert.strictEqual(
      requirementMatches(
        { signal_id: 'sleep_duration', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
        sleepObs,
      ),
      true,
    );
  });

  it('fails when modality differs', () => {
    assert.strictEqual(
      requirementMatches({ signal_id: 'sleep_duration', modality: 'biomarkers' }, sleepObs),
      false,
    );
  });

  it('fails when status is outside the allowed set', () => {
    assert.strictEqual(
      requirementMatches({ signal_id: 'sleep_duration', status_in: ['optimal'] }, sleepObs),
      false,
    );
  });

  it('respects min_value / max_value bounds on numeric observations', () => {
    assert.strictEqual(requirementMatches({ signal_id: 'sleep_duration', min_value: 6 }, sleepObs), false);
    assert.strictEqual(requirementMatches({ signal_id: 'sleep_duration', max_value: 6 }, sleepObs), true);
  });

  it('matches value_equals against categorical observations', () => {
    const genoObs: NormalizedObservation = {
      id: 'genetics:mthfr_c677t',
      signal_id: 'mthfr_c677t',
      signal_name: 'MTHFR C677T',
      modality: 'genetics',
      value: 'homozygous',
      provenance: { modality: 'genetics', source_kind: 'genotype', source_label: 'Genetics' },
      quality: { confidence: 0.9 },
    };
    assert.strictEqual(requirementMatches({ signal_id: 'mthfr_c677t', value_equals: 'homozygous' }, genoObs), true);
    assert.strictEqual(requirementMatches({ signal_id: 'mthfr_c677t', value_equals: 'heterozygous' }, genoObs), false);
  });
});
