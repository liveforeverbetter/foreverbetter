import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildHealthContext } from '../src/core/health-context.js';
import type { AnalysisResult, NormalizedObservation } from '../src/types.js';

function geneticsAnalysis(traitId: string, heritability: number): AnalysisResult {
  return {
    id: 'a1', user_id: 'u', modality: 'genetics', operation: 'analyze', created_at: '2026-07-20',
    source_ids: ['s'], raw_source_references: [], normalized_observations: [],
    derived_interpretations: [{
      id: 'd1', category: 'genetics', type: 'genetic_consumer_insight', title: 'Resting heart rate',
      status: 'informational', provenance: { source_ids: ['s'], source_categories: ['genetics'], source_type: 'derived', engine: 't', generated_at: '2026-07-20' },
      raw: { trait_id: traitId, heritability_pct: heritability },
    }],
  } as unknown as AnalysisResult;
}

function wearable(name: string, value: number, unit: string): NormalizedObservation {
  return { id: 'o1', user_id: 'u', source_id: 's', category: 'wearables', type: 'wearable_metric', name, value, unit, observed_at: '2026-07-20T07:00:00Z', raw: {} } as unknown as NormalizedObservation;
}

test('cross-modality links a genetic tendency to the measured value, keeping measured primary', () => {
  const ctx = buildHealthContext({
    userId: 'u',
    observations: [wearable('resting_heart_rate', 58, 'bpm')],
    analyses: [geneticsAnalysis('resting_heart_rate', 32)],
  });
  const rhr = (ctx.cross_modality as Array<Record<string, unknown>>).find(entry => entry.signal === 'resting_heart_rate');
  assert.ok(rhr, 'resting_heart_rate cross-modality entry present');
  assert.deepEqual(rhr!.measured, { value: 58, unit: 'bpm', modality: 'wearables' });
  assert.equal((rhr!.inherited as Record<string, unknown>).heritability_pct, 32);
  assert.match(String(rhr!.reading), /measured resting heart rate .*is the number to act on/i);
  assert.match(String(rhr!.reading), /32% of the baseline/);
});

test('cross-modality prompts a measurement when only the genetic tendency exists', () => {
  const ctx = buildHealthContext({ userId: 'u', observations: [], analyses: [geneticsAnalysis('resting_heart_rate', 32)] });
  const rhr = (ctx.cross_modality as Array<Record<string, unknown>>).find(entry => entry.signal === 'resting_heart_rate');
  assert.ok(rhr);
  assert.equal(rhr!.measured, null);
  assert.match(String(rhr!.reading), /no measured value yet|see where you actually stand/i);
});
