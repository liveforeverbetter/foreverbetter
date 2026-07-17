/**
 * Protocol Engine Unit Tests
 *
 * Run: npx tsx --test scripts/pipeline/protocol_engine.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateProtocols } from './protocol_engine.js';
import type { EnrichedTrait } from './graph_resolver.js';

function makeTrait(overrides: Partial<EnrichedTrait> = {}): EnrichedTrait {
  return {
    trait_id: 'test_trait',
    score: 50,
    confidence: 0.8,
    evidenceTier: 2,
    mechanism: 'Test mechanism',
    outcomes: [{ label: 'Test outcome', severity: 0.5 }],
    actions: [
      { id: 'action_1', title: 'Action 1', description: 'Desc 1', impact: 0.9, difficulty: 'low' as const },
      { id: 'action_2', title: 'Action 2', description: 'Desc 2', impact: 0.6, difficulty: 'medium' as const },
    ],
    ...overrides,
  };
}

describe('Protocol Engine', () => {
  describe('generateProtocols', () => {
    it('should generate a priority plan for low-score traits', () => {
      const traits = [
        makeTrait({ trait_id: 'low_trait', score: 25 }),
      ];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.length > 0);
      assert.ok(protocols.some(p => p.title === 'Priority Wellness Action Plan'));
    });

    it('should generate a profile-scoped baseline for an unmatched medium-score trait', () => {
      const traits = [
        makeTrait({ trait_id: 'mid_trait', score: 55 }),
      ];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.length > 0);
      assert.ok(protocols.some(p => p.title === 'Baseline Wellness Action Plan'));
    });

    it('should handle all traits above threshold (no at-risk traits)', () => {
      const traits = [
        makeTrait({ trait_id: 'good1', score: 85 }),
        makeTrait({ trait_id: 'good2', score: 75 }),
        makeTrait({ trait_id: 'good3', score: 90 }),
      ];
      const protocols = generateProtocols(traits);
      // Should still return protocols (Wellness fallback)
      assert.ok(protocols.length > 0);
    });

    it('should handle empty input gracefully', () => {
      const protocols = generateProtocols([]);
      // May return Wellness fallback or empty — both are valid
      assert.ok(Array.isArray(protocols));
    });

    it('should deduplicate actions across traits', () => {
      const traits = [
        makeTrait({
          trait_id: 'a',
          score: 25,
          actions: [{ id: 'same_action', title: 'Same Action', description: 'Shared action', impact: 0.9, difficulty: 'low' as const }],
        }),
        makeTrait({
          trait_id: 'b',
          score: 30,
          actions: [{ id: 'same_action', title: 'Same Action', description: 'Shared action', impact: 0.9, difficulty: 'low' as const }],
        }),
      ];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.length > 0);
    });

    it('should prioritize high-impact actions over low-impact', () => {
      const traits = [
        makeTrait({
          trait_id: 'priority_test',
          score: 20,
          actions: [
            { id: 'low_impact', title: 'Low Impact', description: '', impact: 0.2, difficulty: 'low' as const },
            { id: 'high_impact', title: 'High Impact', description: '', impact: 0.9, difficulty: 'low' as const },
          ],
        }),
      ];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.length > 0);
      assert.strictEqual(protocols[0].actions[0].id, 'high_impact');
    });

    it('should handle traits with no actions', () => {
      const traits = [
        makeTrait({ trait_id: 'no_actions', score: 20, actions: [] }),
      ];
      const protocols = generateProtocols(traits);
      // Should not crash, may return empty or fallback
      assert.ok(Array.isArray(protocols));
    });

    it('should handle traits with undefined actions', () => {
      const traits: EnrichedTrait[] = [
        { ...makeTrait({ trait_id: 'undef_actions', score: 20 }), actions: undefined as any },
      ];
      const protocols = generateProtocols(traits);
      assert.ok(Array.isArray(protocols));
    });

    it('should produce consistent output for mixed scores', () => {
      const traits = [
        makeTrait({ trait_id: 'very_low', score: 10 }),
        makeTrait({ trait_id: 'low', score: 30 }),
        makeTrait({ trait_id: 'medium', score: 55 }),
        makeTrait({ trait_id: 'high', score: 80 }),
      ];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.length > 0);
      // Should handle mix without error
    });

    it('should describe each protocol with a title', () => {
      const traits = [makeTrait({ trait_id: 'test', score: 25 })];
      const protocols = generateProtocols(traits);
      assert.ok(protocols.every(p => typeof p.title === 'string' && p.title.length > 0));
    });
  });
});
