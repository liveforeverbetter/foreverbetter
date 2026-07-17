/**
 * GLI Engine Unit Tests
 *
 * Run: npx tsx --test scripts/pipeline/gli_engine.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeGLI, computeWeightedGLI, computeEvidenceWeightedGLI, computeCategoryGLI, computeWeightedCategoryGLI, getGLIRating } from './gli_engine.js';
import type { EnrichedTrait } from './graph_resolver.js';

function makeTrait(overrides: Partial<EnrichedTrait> = {}): EnrichedTrait {
  return {
    trait_id: 'test_trait',
    score: 50,
    confidence: 0.8,
    evidenceTier: 2,
    mechanism: '',
    outcomes: [],
    actions: [],
    ...overrides,
  };
}

describe('GLI Engine Edge Cases', () => {
  describe('computeGLI', () => {
    it('should return 0 for empty traits', () => {
      assert.strictEqual(computeGLI([]), 0);
    });

    it('should filter NaN scores and still compute', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: 80 }),
        makeTrait({ trait_id: 'b', score: NaN }),
        makeTrait({ trait_id: 'c', score: 60 }),
      ];
      const result = computeGLI(traits);
      // valid: 80, 60 → avg=70, *10 = 700
      assert.strictEqual(result, 700);
    });

    it('should return 0 when ALL scores are NaN', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: NaN }),
        makeTrait({ trait_id: 'b', score: NaN }),
      ];
      assert.strictEqual(computeGLI(traits), 0);
    });

    it('should return 0 when ALL scores are Infinity', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: Infinity }),
      ];
      assert.strictEqual(computeGLI(traits), 0);
    });

    it('should handle mixed NaN and valid scores', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: Infinity }),
        makeTrait({ trait_id: 'b', score: 50 }),
        makeTrait({ trait_id: 'c', score: NaN }),
        makeTrait({ trait_id: 'd', score: -Infinity }),
      ];
      // only score=50 is valid
      assert.strictEqual(computeGLI(traits), 500);
    });

    it('should clamp result to non-negative', () => {
      const traits = [makeTrait({ trait_id: 'a', score: -500 })];
      // avg = -500, *10 = -5000, clamped to 0
      assert.ok(computeGLI(traits) >= 0);
    });

    it('should handle single trait correctly', () => {
      const traits = [makeTrait({ trait_id: 'a', score: 75 })];
      assert.strictEqual(computeGLI(traits), 750);
    });
  });

  describe('computeWeightedGLI', () => {
    it('should return 0 for empty traits', () => {
      assert.strictEqual(computeWeightedGLI([]), 0);
    });

    it('should weight high-severity traits more', () => {
      const traits = [
        makeTrait({ trait_id: 'severe', score: 30, outcomes: [{ label: '', severity: 0.9 }] }),
        makeTrait({ trait_id: 'mild', score: 80, outcomes: [{ label: '', severity: 0.1 }] }),
      ];
      // weighted: (30*0.9 + 80*0.1) / (0.9+0.1) = 35, *10 = 350
      const result = computeWeightedGLI(traits);
      assert.strictEqual(result, 350);
    });

    it('should skip traits with NaN scores', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: 80 }),
        makeTrait({ trait_id: 'b', score: NaN }),
      ];
      const result = computeWeightedGLI(traits);
      assert.strictEqual(result, 800);
    });

    it('should guard against NaN weight from bad outcome data', () => {
      const traits = [
        makeTrait({ trait_id: 'bad_outcome', score: 50, outcomes: [{ label: '', severity: NaN }] }),
      ];
      // severity NaN → weight falls back to 0.5
      const result = computeWeightedGLI(traits);
      assert.strictEqual(result, 500);
    });

    it('should default to 0.5 weight for traits without outcomes', () => {
      const traits = [makeTrait({ trait_id: 'a', score: 60 })];
      assert.strictEqual(computeWeightedGLI(traits), 600);
    });

    it('should return 0 when all traits skipped (NaN scores)', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: NaN }),
        makeTrait({ trait_id: 'b', score: NaN }),
      ];
      assert.strictEqual(computeWeightedGLI(traits), 0);
    });
  });

  describe('computeEvidenceWeightedGLI', () => {
    it('should weight evidence tier 1 higher than tier 3', () => {
      const traits = [
        makeTrait({ trait_id: 't1', score: 50, evidenceTier: 1 }), // weight 1.0
        makeTrait({ trait_id: 't3', score: 50, evidenceTier: 3 }), // weight 0.4
      ];
      // (50*1.0 + 50*0.4) / (1.0+0.4) = 70/1.4 = 50, *10 = 500
      const result = computeEvidenceWeightedGLI(traits);
      assert.strictEqual(result, 500);
    });

    it('should return 0 for empty traits', () => {
      assert.strictEqual(computeEvidenceWeightedGLI([]), 0);
    });

    it('should skip NaN scores', () => {
      const traits = [
        makeTrait({ trait_id: 'a', score: 80, evidenceTier: 1 }),
        makeTrait({ trait_id: 'b', score: NaN, evidenceTier: 1 }),
      ];
      assert.strictEqual(computeEvidenceWeightedGLI(traits), 800);
    });
  });

  describe('computeCategoryGLI', () => {
    it('should group traits by category prefix', () => {
      const traits = [
        makeTrait({ trait_id: 'meth_score', score: 60 }),
        makeTrait({ trait_id: 'meth_efficiency', score: 80 }),
        makeTrait({ trait_id: 'lipid_level', score: 40 }),
      ];
      const result = computeCategoryGLI(traits);
      // meth category: avg(60,80)=70, *10=700
      // lipid category: avg(40)=40, *10=400
      assert.ok('meth' in result);
      assert.ok('lipid' in result);
      assert.strictEqual(result['meth'], 700);
    });
  });

  describe('computeWeightedCategoryGLI', () => {
    it('should produce severity-weighted category scores', () => {
      const traits = [
        makeTrait({ trait_id: 'meth_1', score: 30, outcomes: [{ label: '', severity: 0.8 }] }),
        makeTrait({ trait_id: 'meth_2', score: 70, outcomes: [{ label: '', severity: 0.2 }] }),
      ];
      const result = computeWeightedCategoryGLI(traits);
      // meth: (30*0.8 + 70*0.2) / (0.8+0.2) = 38, *10 = 380
      assert.ok('meth' in result);
      assert.strictEqual(result['meth'], 380);
    });
  });

  describe('getGLIRating', () => {
    it('rates 800+ as Excellent', () => {
      assert.strictEqual(getGLIRating(800).rating, 'Excellent');
    });
    it('rates 600-799 as Good', () => {
      assert.strictEqual(getGLIRating(600).rating, 'Good');
      assert.strictEqual(getGLIRating(799).rating, 'Good');
    });
    it('rates 400-599 as Moderate', () => {
      assert.strictEqual(getGLIRating(400).rating, 'Moderate');
      assert.strictEqual(getGLIRating(599).rating, 'Moderate');
    });
    it('rates below 400 as Needs Work', () => {
      assert.strictEqual(getGLIRating(399).rating, 'Needs Work');
      assert.strictEqual(getGLIRating(0).rating, 'Needs Work');
    });
  });
});
