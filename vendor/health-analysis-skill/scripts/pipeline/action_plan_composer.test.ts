/**
 * Tests for the personalized action plan composer.
 *
 * Run: npx tsx --test scripts/pipeline/action_plan_composer.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { analyzeBiomarkers } from './biomarker_engine.js';
import { analyzeWearables } from './wearable_engine.js';
import {
  biomarkerObservationsFromAnalysis,
  wearableObservationsFromAnalysis,
  geneticObservationsFromGenomicOutput,
} from './observation_adapters.js';
import { composePersonalizedActionPlan } from './action_plan_composer.js';
import type { InterventionRule } from './intervention_rules.js';
import type { NormalizedObservation } from './observation_types.js';

const FIXED_NOW = '2026-06-21T12:00:00.000Z';

function bioObs(args: { id: string; name: string; value: number; status: 'optimal' | 'watch' | 'needs_attention'; direction?: 'low' | 'high' | 'ok'; unit?: string; target?: string; collected_at?: string }): NormalizedObservation {
  return {
    id: `biomarkers:${args.id}`,
    signal_id: args.id,
    signal_name: args.name,
    modality: 'biomarkers',
    value: args.value,
    unit: args.unit,
    display_value: args.unit ? `${args.value} ${args.unit}` : String(args.value),
    status: args.status,
    direction: args.direction,
    target_label: args.target,
    provenance: { modality: 'biomarkers', source_kind: 'measured', source_label: 'Blood test', collected_at: args.collected_at, reference_basis: 'population_threshold' },
    quality: { confidence: 0.85 },
  };
}

function wearObs(args: { id: string; name: string; value: number; status: 'optimal' | 'watch' | 'needs_attention'; direction?: 'low' | 'high'; unit?: string; target?: string; collected_at?: string }): NormalizedObservation {
  return {
    id: `wearables:${args.id}`,
    signal_id: args.id,
    signal_name: args.name,
    modality: 'wearables',
    value: args.value,
    unit: args.unit,
    display_value: args.unit ? `${args.value} ${args.unit}` : String(args.value),
    status: args.status,
    direction: args.direction,
    target_label: args.target,
    provenance: { modality: 'wearables', source_kind: 'behavioral_aggregate', source_label: 'WHOOP', collected_at: args.collected_at, window_days: 14, reference_basis: 'population_threshold' },
    quality: { confidence: 0.8 },
  };
}

function genoObs(signal_id: string, value: string): NormalizedObservation {
  return {
    id: `genetics:${signal_id}`,
    signal_id,
    signal_name: signal_id,
    modality: 'genetics',
    value,
    display_value: value,
    provenance: { modality: 'genetics', source_kind: 'genotype', source_label: 'Genetics', reference_basis: 'genotype_known' },
    quality: { confidence: 0.9 },
  };
}

describe('Composer — modality coverage', () => {
  it('reports zero connected modalities for empty input', () => {
    const plan = composePersonalizedActionPlan([], { generated_at: FIXED_NOW });
    assert.strictEqual(plan.priorities.length, 0);
    assert.strictEqual(plan.coverage.filter(c => c.status === 'connected').length, 0);
    assert.ok(plan.next_context, 'expected next-context suggestion when no data is present');
  });

  it('connects only the modalities that supplied observations', () => {
    const observations = wearableObservationsFromAnalysis(analyzeWearables([{ id: 'sleep_duration', value: 5.5 }]));
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const wear = plan.coverage.find(c => c.modality === 'wearables');
    const bio = plan.coverage.find(c => c.modality === 'biomarkers');
    assert.strictEqual(wear?.status, 'connected');
    assert.strictEqual(bio?.status, 'not_provided');
  });

  it('honours an explicit connected_modalities hint even when no observations qualify', () => {
    const plan = composePersonalizedActionPlan([], {
      connected_modalities: ['biomarkers'],
      generated_at: FIXED_NOW,
    });
    assert.strictEqual(plan.coverage.find(c => c.modality === 'biomarkers')?.status, 'connected');
  });
});

describe('Composer — single-modality plans', () => {
  it('B-only: qualifies the ApoB action and does not invent wearable evidence', () => {
    const observations = biomarkerObservationsFromAnalysis(analyzeBiomarkers([
      { id: 'ApoB', value: 125, unit: 'mg/dL', collected_at: '2026-05-01' },
    ]));
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    assert.ok(plan.priorities.length >= 1);
    const apob = plan.priorities.find(p => p.intervention_id === 'cardio.review_apob_with_clinician');
    assert.ok(apob);
    assert.deepStrictEqual(apob.source_modalities, ['biomarkers']);
    assert.ok(apob.evidence_chips.some(chip => chip.source_label === 'Blood test'));
  });

  it('W-only: qualifies wearable actions and labels the source as Wearable', () => {
    const observations = wearableObservationsFromAnalysis(analyzeWearables([
      { id: 'sleep_duration', value: 5.5 },
      { id: 'steps', value: 3500 },
    ]));
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const ids = plan.priorities.map(p => p.intervention_id);
    assert.ok(ids.includes('sleep.add_opportunity'));
    assert.ok(plan.priorities.every(p => p.source_modalities.every(m => m === 'wearables')));
  });

  it('G-only: only genetics rules can qualify; never asserts current physiology', () => {
    const plan = composePersonalizedActionPlan([
      genoObs('cyp2c19_metabolizer', 'intermediate_metabolizer'),
      genoObs('mthfr_c677t', 'homozygous'),
    ], { generated_at: FIXED_NOW });
    const ids = plan.priorities.map(p => p.intervention_id);
    assert.ok(ids.includes('pharmacology.cyp2c19_prescribing_note'));
    assert.ok(ids.includes('nutrition.methylation_b_vitamin_support'));
    for (const action of plan.priorities) {
      assert.deepStrictEqual(action.source_modalities, ['genetics']);
    }
  });
});

describe('Composer — cross-modal fusion', () => {
  it('fuses hs-CRP + poor sleep into a single inflammation-recovery loop action', () => {
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'hs_crp', name: 'hs-CRP', value: 4.2, unit: 'mg/L', status: 'needs_attention', direction: 'high', target: '<=1 mg/L', collected_at: '2026-05-01' }),
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5.5, unit: 'hours', status: 'needs_attention', direction: 'low', target: '7-9 hours', collected_at: '2026-05-01' }),
      wearObs({ id: 'hrv', name: 'HRV', value: 22, unit: 'ms', status: 'needs_attention', direction: 'low', target: '>=45 ms', collected_at: '2026-05-01' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const fusion = plan.priorities.find(p => p.intervention_id === 'fusion.inflammation_recovery_loop');
    assert.ok(fusion, 'expected the cross-modal fusion action');
    assert.ok(fusion.source_modalities.includes('biomarkers'));
    assert.ok(fusion.source_modalities.includes('wearables'));
    assert.ok(fusion.ranking.corroboration > 0, 'fusion should receive a corroboration bonus');
  });

  it('does not fuse when biomarker and wearable signals are outside the fusion window', () => {
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'hs_crp', name: 'hs-CRP', value: 4.2, unit: 'mg/L', status: 'needs_attention', direction: 'high', target: '<=1 mg/L', collected_at: '2025-01-01' }),
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5.5, unit: 'hours', status: 'needs_attention', direction: 'low', target: '7-9 hours', collected_at: '2026-05-01' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const review = plan.review_items.find(item => item.id.endsWith('temporal_mismatch'));
    assert.ok(review, 'expected a temporal_mismatch review item when signals are too far apart');
  });
});

describe('Composer — safety + ranking', () => {
  it('puts medication-safety and prompt_review actions ahead of self_directed', () => {
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'ldl_c', name: 'LDL-C', value: 210, unit: 'mg/dL', status: 'needs_attention', direction: 'high', target: '<=100 mg/dL', collected_at: '2026-05-01' }),
      genoObs('cyp2c19_metabolizer', 'poor_metabolizer'),
      wearObs({ id: 'steps', name: 'Daily steps', value: 3500, unit: 'steps', status: 'needs_attention', direction: 'low', target: '>=8000 steps', collected_at: '2026-05-01' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const tiers = plan.priorities.map(p => p.safety.tier);
    // medication_safety > prompt_review > self_directed
    assert.deepStrictEqual(tiers, ['medication_safety', 'prompt_review', 'self_directed']);
  });

  it('never returns more than max_priorities cards', () => {
    const observations: NormalizedObservation[] = [
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5.5, status: 'needs_attention', direction: 'low' }),
      wearObs({ id: 'hrv', name: 'HRV', value: 22, status: 'needs_attention', direction: 'low' }),
      wearObs({ id: 'steps', name: 'Daily steps', value: 3500, status: 'needs_attention', direction: 'low' }),
      wearObs({ id: 'strength_sessions', name: 'Strength sessions', value: 0, status: 'needs_attention', direction: 'low' }),
      wearObs({ id: 'zone2_minutes', name: 'Zone 2 minutes', value: 30, status: 'needs_attention', direction: 'low' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    assert.ok(plan.priorities.length <= 3);
  });

  it('returns deterministic order for identical input', () => {
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'hba1c', name: 'HbA1c', value: 5.9, unit: '%', status: 'needs_attention', direction: 'high', target: '<=5.3 %' }),
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5.5, status: 'needs_attention', direction: 'low' }),
    ];
    const first = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    const second = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    assert.deepStrictEqual(first.priorities.map(p => p.id), second.priorities.map(p => p.id));
  });
});

describe('Composer — qualification gates', () => {
  it('withholds a rule when a conflict requirement matches', () => {
    const conflictRule: InterventionRule = {
      id: 'test.sleep_with_conflict.v1',
      version: '1.0.0',
      intervention_id: 'test.sleep_with_conflict',
      domain: 'sleep_recovery',
      title: 'Sleep action with conflict',
      why_personal: 'test',
      steps: ['step 1'],
      required: [{ signal_id: 'sleep_duration', status_in: ['needs_attention'] }],
      conflicts: [{ signal_id: 'sleep_consistency', status_in: ['optimal'] }],
      safety: { tier: 'self_directed', message: 'OK' },
      expected_result: { metric: 'sleep_duration', direction: 'up', label: 'better' },
      review_window: '2 weeks',
      ranking: { urgency: 0.5, evidence_quality: 0.5, modifiability: 0.5, retestability: 0.5 },
    };
    const observations: NormalizedObservation[] = [
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5, status: 'needs_attention', direction: 'low' }),
      wearObs({ id: 'sleep_consistency', name: 'Sleep consistency', value: 90, status: 'optimal' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { rules: [conflictRule], generated_at: FIXED_NOW });
    assert.strictEqual(plan.priorities.length, 0);
    assert.strictEqual(plan.review_items.length, 1);
    assert.strictEqual(plan.review_items[0]?.reason, 'conflict');
  });

  it('withholds a rule when required_context is missing', () => {
    const contextRule: InterventionRule = {
      id: 'test.requires_age.v1',
      version: '1.0.0',
      intervention_id: 'test.requires_age',
      domain: 'cardiometabolic',
      title: 'Age-dependent guidance',
      why_personal: 'test',
      steps: ['step 1'],
      required: [{ signal_id: 'apob', direction_in: ['high'] }],
      required_context: ['age'],
      safety: { tier: 'self_directed', message: 'OK' },
      expected_result: { metric: 'apob', direction: 'down', label: 'lower' },
      review_window: '8 weeks',
      ranking: { urgency: 0.5, evidence_quality: 0.5, modifiability: 0.5, retestability: 0.5 },
    };
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'apob', name: 'ApoB', value: 120, status: 'needs_attention', direction: 'high' }),
    ];
    const planNoProfile = composePersonalizedActionPlan(observations, { rules: [contextRule], generated_at: FIXED_NOW });
    assert.strictEqual(planNoProfile.priorities.length, 0);
    assert.strictEqual(planNoProfile.review_items[0]?.reason, 'missing_context');
    assert.deepStrictEqual(planNoProfile.review_items[0]?.needed_context, ['age']);

    const planWithProfile = composePersonalizedActionPlan(observations, { rules: [contextRule], user_profile: { age: 45 }, generated_at: FIXED_NOW });
    assert.strictEqual(planWithProfile.priorities.length, 1);
  });

  it('drops a rule entirely when a contraindication observation is present', () => {
    const contraRule: InterventionRule = {
      id: 'test.vitamin_d_with_contra.v1',
      version: '1.0.0',
      intervention_id: 'test.vitamin_d_with_contra',
      domain: 'micronutrient',
      title: 'Vitamin D supplementation',
      why_personal: 'test',
      steps: ['supplement vitamin D'],
      required: [{ signal_id: 'vitamin_d', direction_in: ['low'] }],
      contraindications: [{ signal_id: 'kidney_disease_flag', value_equals: 'present' }],
      safety: { tier: 'self_directed', message: 'OK' },
      expected_result: { metric: 'vitamin_d', direction: 'up', label: 'higher' },
      review_window: '12 weeks',
      ranking: { urgency: 0.3, evidence_quality: 0.7, modifiability: 0.9, retestability: 0.7 },
    };
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'vitamin_d', name: 'Vitamin D', value: 18, status: 'needs_attention', direction: 'low' }),
      bioObs({ id: 'kidney_disease_flag', name: 'Kidney disease flag', value: 1, status: 'needs_attention' }),
    ];
    // contraindication uses value_equals on a string, so the numeric value must equal 'present' to trigger.
    // Switch to a string-equal observation.
    observations[1] = { ...observations[1]!, value: 'present' };
    const plan = composePersonalizedActionPlan(observations, { rules: [contraRule], generated_at: FIXED_NOW });
    assert.strictEqual(plan.priorities.length, 0);
    assert.strictEqual(plan.review_items.length, 0, 'contraindicated rules are dropped silently');
  });

  it('deduplicates by intervention_id when two rule versions match', () => {
    const baseRule: InterventionRule = {
      id: 'test.dup.v1',
      version: '1.0.0',
      intervention_id: 'test.dup',
      domain: 'sleep_recovery',
      title: 'Dup',
      why_personal: 'test',
      steps: ['step 1'],
      required: [{ signal_id: 'sleep_duration', direction_in: ['low'] }],
      safety: { tier: 'self_directed', message: 'OK' },
      expected_result: { metric: 'sleep_duration', direction: 'up', label: 'better' },
      review_window: '2 weeks',
      ranking: { urgency: 0.4, evidence_quality: 0.5, modifiability: 0.5, retestability: 0.5 },
    };
    const newerRule: InterventionRule = {
      ...baseRule,
      id: 'test.dup.v2',
      version: '2.0.0',
      ranking: { urgency: 0.7, evidence_quality: 0.5, modifiability: 0.5, retestability: 0.5 },
    };
    const observations: NormalizedObservation[] = [
      wearObs({ id: 'sleep_duration', name: 'Sleep duration', value: 5.5, status: 'needs_attention', direction: 'low' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { rules: [baseRule, newerRule], generated_at: FIXED_NOW });
    assert.strictEqual(plan.priorities.length, 1);
    assert.strictEqual(plan.priorities[0]?.rule_id, 'test.dup.v2', 'should prefer the higher-ranked rule version');
  });
});

describe('Composer — maintenance + next context', () => {
  it('surfaces maintenance for modalities with in-target observations', () => {
    const observations: NormalizedObservation[] = [
      bioObs({ id: 'apob', name: 'ApoB', value: 70, status: 'optimal' }),
      bioObs({ id: 'hba1c', name: 'HbA1c', value: 5.1, status: 'optimal' }),
    ];
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    assert.ok(plan.maintenance.some(m => m.source_modalities[0] === 'biomarkers'));
  });

  it('suggests next context for the most-impactful missing modality', () => {
    const observations = biomarkerObservationsFromAnalysis(analyzeBiomarkers([{ id: 'ApoB', value: 125, unit: 'mg/dL' }]));
    const plan = composePersonalizedActionPlan(observations, { generated_at: FIXED_NOW });
    assert.ok(plan.next_context, 'expected a next-context prompt');
    assert.ok(['genetics', 'wearables'].includes(plan.next_context.missing_modality));
  });
});

describe('Composer — end-to-end via adapters', () => {
  it('produces a usable plan for all 7 non-empty modality combinations', () => {
    const combos: Array<{ label: string; observations: NormalizedObservation[] }> = [];
    const biomarkers = analyzeBiomarkers([{ id: 'ApoB', value: 125, unit: 'mg/dL', collected_at: '2026-05-01' }]);
    const wearables = analyzeWearables([{ id: 'sleep_duration', value: 5.5 }, { id: 'steps', value: 3500 }]);
    const genetics = geneticObservationsFromGenomicOutput({
      variant_cards: {
        other_risks: [{ gene: 'MTHFR', rsid: 'rs1801133', disease: 'Folate metabolism', clinicalSignificance: 'risk factor', significanceColor: 'orange', category: 'other_risks', zygosity: 'Homozygous', frequency: 'common', annotation: 'C677T', reviewStatus: 'reviewed' }],
        drug_response: [{ gene: 'CYP2C19', rsid: 'rs4244285', disease: 'Drug metabolism', clinicalSignificance: 'drug response', significanceColor: 'purple', category: 'drug_response', zygosity: 'Heterozygous', frequency: 'common', annotation: '*2 LoF', reviewStatus: 'reviewed' }],
      },
    });
    const bioOnly = biomarkerObservationsFromAnalysis(biomarkers);
    const wearOnly = wearableObservationsFromAnalysis(wearables);
    combos.push({ label: 'G', observations: genetics });
    combos.push({ label: 'B', observations: bioOnly });
    combos.push({ label: 'W', observations: wearOnly });
    combos.push({ label: 'GB', observations: [...genetics, ...bioOnly] });
    combos.push({ label: 'GW', observations: [...genetics, ...wearOnly] });
    combos.push({ label: 'BW', observations: [...bioOnly, ...wearOnly] });
    combos.push({ label: 'GBW', observations: [...genetics, ...bioOnly, ...wearOnly] });

    for (const combo of combos) {
      const plan = composePersonalizedActionPlan(combo.observations, { generated_at: FIXED_NOW });
      assert.ok(plan.priorities.length >= 1, `combo ${combo.label} should produce at least one qualified priority`);
      for (const action of plan.priorities) {
        for (const modality of action.source_modalities) {
          assert.ok(combo.observations.some(obs => obs.modality === modality), `combo ${combo.label} action ${action.intervention_id} cited modality '${modality}' not in input`);
        }
      }
    }
  });

  it('handles the empty-input case with no priorities and no fabricated coverage', () => {
    const plan = composePersonalizedActionPlan([], { generated_at: FIXED_NOW });
    assert.strictEqual(plan.priorities.length, 0);
    assert.ok(plan.summary.toLowerCase().includes('no personal data'));
    assert.ok(plan.coverage.every(c => c.status === 'not_provided'));
  });
});
