/**
 * Trait Engine
 * Matches user variants against variant effects and aggregates scores per trait.
 */

interface Variant {
  rsid: string;
  genotype: string;
  quality: number;
}

interface VariantEffect {
  rsid: string;
  trait_id: string;
  effect_size: number;
  weight: number;
  confidence: number;
}

interface TraitScore {
  trait_id: string;
  score: number;
  confidence: number;
}

/**
 * Numeric sentinel guards: clamp any value to a safe finite number.
 */
function safeNum(val: number, fallback: number = 0): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return fallback;
  return val;
}

/**
 * Compute trait scores from user variants and variant effects.
 * Uses sigmoid normalization to produce 0-100 scores.
 *
 * Sigmoid formula: score = 1/(1 + e^(-raw)) * 100
 * This maps unbounded raw scores onto a 0-100 scale where:
 *   raw=0    → score=50  (neutral)
 *   raw=2    → score=88  (strong positive)
 *   raw=-2   → score=12  (strong negative)
 *   raw=4    → score=98  (ceiling)
 *   raw=-4   → score=2   (floor)
 *
 * The coefficient choice (1.0 in the exponent) balances responsiveness
 * near the neutral zone against saturation at the extremes. A smaller
 * coefficient would compress all scores toward 50; a larger one would
 * saturate almost all inputs to 0 or 100.
 */
export function computeTraitScore(variants: Variant[], effects: VariantEffect[]): TraitScore[] {
  const traitMap: Record<string, { total: number; weight: number; confidence: number }> = {};

  effects.forEach(effect => {
    const userVariant = variants.find(v => v.rsid === effect.rsid);
    if (!userVariant) return;

    if (!traitMap[effect.trait_id]) {
      traitMap[effect.trait_id] = { total: 0, weight: 0, confidence: 0 };
    }

    // Sanitize inputs: guard against NaN/Infinity in effect data
    const es = safeNum(effect.effect_size, 0);
    const w = safeNum(effect.weight, 0);
    const c = safeNum(effect.confidence, 0);

    traitMap[effect.trait_id].total += es * w * c;
    traitMap[effect.trait_id].weight += w;
    traitMap[effect.trait_id].confidence += c;
  });

  return Object.entries(traitMap).map(([trait_id, data]) => {
    // Guard against zero weight (would produce NaN/Infinity)
    if (data.weight <= 0) {
      return { trait_id, score: 50, confidence: 0 };
    }

    const raw = data.total / data.weight;
    const safeRaw = safeNum(raw, 0);

    // Sigmoid: 1/(1 + e^(-x)) maps R → (0, 1), scaled to (0, 100)
    const score = 1 / (1 + Math.exp(-safeRaw)) * 100;

    // Clamp and round to 0-100
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    const rawConfidence = data.confidence / data.weight;
    const confidence = Math.max(0, Math.min(1,
      Math.round(safeNum(rawConfidence, 0) * 100) / 100
    ));

    return { trait_id, score: clampedScore, confidence };
  });
}

/**
 * Score interpretation thresholds:
 * < 40: Below optimal - action recommended
 * 40-70: Moderate - optimization possible
 * > 70: Optimal - maintenance mode
 */
export function getScoreCategory(score: number): 'low' | 'medium' | 'high' {
  const s = safeNum(score, 50); // default to neutral on NaN
  if (s < 40) return 'low';
  if (s < 70) return 'medium';
  return 'high';
}