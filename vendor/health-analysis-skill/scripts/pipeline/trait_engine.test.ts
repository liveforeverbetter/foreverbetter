/**
 * Trait Engine Unit Tests
 *
 * Run: npx tsx --test scripts/pipeline/trait_engine.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeTraitScore, getScoreCategory } from './trait_engine.js';

describe('Trait Engine', () => {
  describe('computeTraitScore', () => {
    it('should compute scores for matching variants', () => {
      const variants = [{ rsid: 'rs123', genotype: 'CT', quality: 99 }];
      const effects = [{ rsid: 'rs123', trait_id: 'methylation', effect_size: 1.0, weight: 1.0, confidence: 0.9 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // raw = (1.0*1.0*0.9) / 1.0 = 0.9, sigmoid(0.9) ≈ 0.711, *100 ≈ 71
      assert.ok(scores[0].score >= 70 && scores[0].score <= 72);
    });

    it('should return 50 for neutral effect size', () => {
      const variants = [{ rsid: 'rs456', genotype: 'AA', quality: 99 }];
      const effects = [{ rsid: 'rs456', trait_id: 'neutral_trait', effect_size: 0, weight: 1.0, confidence: 0.8 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // raw=0, sigmoid(0)=0.5, *100 = 50
      assert.strictEqual(scores[0].score, 50);
    });

    it('should return empty array for empty effects', () => {
      const variants = [{ rsid: 'rs789', genotype: 'GG', quality: 99 }];
      const scores = computeTraitScore(variants, []);
      assert.strictEqual(scores.length, 0);
    });

    it('should return empty array for empty variants', () => {
      const effects = [{ rsid: 'rs789', trait_id: 'test', effect_size: 1, weight: 1, confidence: 1 }];
      const scores = computeTraitScore([], effects);
      assert.strictEqual(scores.length, 0);
    });

    it('should skip variants not in effects list', () => {
      const variants = [{ rsid: 'rs111', genotype: 'TT', quality: 99 }];
      const effects = [{ rsid: 'rs222', trait_id: 'other', effect_size: 1, weight: 1, confidence: 1 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 0);
    });

    it('should handle NaN effect_size gracefully', () => {
      const variants = [{ rsid: 'rs123', genotype: 'CT', quality: 99 }];
      const effects = [{ rsid: 'rs123', trait_id: 'meth', effect_size: NaN, weight: 1.0, confidence: 0.9 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // safeNum(NaN, 0) → 0, so raw=0, score=50
      assert.strictEqual(scores[0].score, 50);
    });

    it('should handle Infinity effect_size gracefully', () => {
      const variants = [{ rsid: 'rs123', genotype: 'CT', quality: 99 }];
      const effects = [{ rsid: 'rs123', trait_id: 'meth', effect_size: Infinity, weight: 1.0, confidence: 0.9 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // safeNum(Infinity, 0) → 0, so raw=0, score=50
      assert.strictEqual(scores[0].score, 50);
    });

    it('should handle zero weight gracefully', () => {
      const variants = [{ rsid: 'rs123', genotype: 'CT', quality: 99 }];
      const effects = [{ rsid: 'rs123', trait_id: 'meth', effect_size: 1, weight: 0, confidence: 0.9 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // data.weight <= 0 → fallback score=50, confidence=0
      assert.strictEqual(scores[0].score, 50);
      assert.strictEqual(scores[0].confidence, 0);
    });

    it('should clamp scores to 0-100 range', () => {
      const variants = [{ rsid: 'rsBig', genotype: 'GG', quality: 99 }];
      const effects = [{ rsid: 'rsBig', trait_id: 'extreme', effect_size: 10, weight: 1, confidence: 1 }];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // raw=10, sigmoid(10) ≈ 0.99995 * 100 ≈ 100, clamped
      assert.ok(scores[0].score >= 0 && scores[0].score <= 100);
    });

    it('should handle negative effect sizes appropriately', () => {
      const variants = [{ rsid: 'rsNeg', genotype: 'AA', quality: 99 }];
      const effects = [{ rsid: 'rsNeg', trait_id: 'bad', effect_size: -3, weight: 1, confidence: 1 }];
      const scores = computeTraitScore(variants, effects);
      // raw=-3, sigmoid(-3) ≈ 0.0474 * 100 ≈ 5
      assert.strictEqual(scores.length, 1);
      assert.ok(scores[0].score < 20);
    });

    it('should accumulate multiple effects for the same trait', () => {
      const variants = [
        { rsid: 'rs1', genotype: 'AA', quality: 99 },
        { rsid: 'rs2', genotype: 'GG', quality: 99 },
      ];
      const effects = [
        { rsid: 'rs1', trait_id: 'meth', effect_size: 1, weight: 1, confidence: 1 },
        { rsid: 'rs2', trait_id: 'meth', effect_size: 1, weight: 1, confidence: 1 },
      ];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // combined raw = (1+1) / 2 = 1, sigmoid(1)*100 ≈ 73
      assert.ok(scores[0].score > 50);
    });

    it('should compute confidence as average of input confidences', () => {
      const variants = [{ rsid: 'rsConf', genotype: 'TT', quality: 99 }];
      const effects = [
        { rsid: 'rsConf', trait_id: 'test', effect_size: 1, weight: 1, confidence: 0.5 },
        { rsid: 'rsConf', trait_id: 'test', effect_size: 1, weight: 1, confidence: 0.9 },
      ];
      const scores = computeTraitScore(variants, effects);
      assert.strictEqual(scores.length, 1);
      // confidence = (0.5+0.9)/(1+1) = 0.7
      assert.strictEqual(scores[0].confidence, 0.7);
    });
  });

  describe('getScoreCategory', () => {
    it('should return low for scores below 40', () => {
      assert.strictEqual(getScoreCategory(25), 'low');
      assert.strictEqual(getScoreCategory(39), 'low');
    });

    it('should return medium for scores 40-69', () => {
      assert.strictEqual(getScoreCategory(40), 'medium');
      assert.strictEqual(getScoreCategory(55), 'medium');
      assert.strictEqual(getScoreCategory(69), 'medium');
    });

    it('should return high for scores 70 and above', () => {
      assert.strictEqual(getScoreCategory(70), 'high');
      assert.strictEqual(getScoreCategory(95), 'high');
    });

    it('should return medium (default) for NaN score', () => {
      assert.strictEqual(getScoreCategory(NaN), 'medium');
    });

    it('should return low for negative scores', () => {
      assert.strictEqual(getScoreCategory(-10), 'low');
    });

    it('should return high for scores above 100', () => {
      assert.strictEqual(getScoreCategory(150), 'high');
    });
  });
});
