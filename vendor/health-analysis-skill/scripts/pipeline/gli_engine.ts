/**
 * GLI (Genomic Longevity Index) Engine
 * Computes a composite score from all trait scores.
 */

import type { EnrichedTrait } from './graph_resolver.js';

/**
 * Compute the Genomic Longevity Index (GLI).
 * Average of all trait scores, scaled to 0-1000.
 *
 * GLI formula: avg(trait_scores) * 10
 *
 * Interpretation:
 * 800+ : Excellent genomic longevity profile
 * 600-799: Good with room for optimization
 * 400-599: Moderate, targeted interventions recommended
 * <400: Significant optimization needed
 */
export function computeGLI(traits: EnrichedTrait[]): number {
  if (traits.length === 0) return 0;

  // Filter NaN scores (trait engine now clamps, but defensive against bad data)
  const validTraits = traits.filter(t => typeof t.score === 'number' && isFinite(t.score));
  if (validTraits.length === 0) return 0;

  const sum = validTraits.reduce((acc, t) => acc + t.score, 0);
  const avg = sum / validTraits.length;

  return Math.max(0, Math.round(avg * 10));
}

/**
 * Get GLI rating category
 */
export function getGLIRating(gli: number): { rating: string; description: string } {
  if (gli >= 800) {
    return {
      rating: 'Excellent',
      description: 'Outstanding genomic longevity profile'
    };
  }
  if (gli >= 600) {
    return {
      rating: 'Good',
      description: 'Good profile with room for optimization'
    };
  }
  if (gli >= 400) {
    return {
      rating: 'Moderate',
      description: 'Targeted interventions recommended'
    };
  }
  return {
    rating: 'Needs Work',
    description: 'Significant optimization opportunities'
  };
}

/**
 * Compute the Severity-Weighted Genomic Longevity Index (GLI).
 *
 * Formula: weighted_avg(trait_scores, severity) * 10
 *
 * Each trait's contribution is weighted by the maximum outcome severity
 * from its knowledge graph node. Clinically significant traits (e.g.,
 * thrombosis risk severity 0.7) contribute more than minor traits
 * (e.g., lipid composition severity 0.3). Traits without knowledge
 * graph data default to a weight of 0.5.
 *
 * This prevents the GLI from being diluted by minor or cosmetic traits
 * when serious clinical variants are present.
 */
export function computeWeightedGLI(traits: EnrichedTrait[]): number {
  if (traits.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const trait of traits) {
    // Guard NaN scores
    if (typeof trait.score !== 'number' || !isFinite(trait.score)) continue;

    // Use maximum outcome severity as the weight, default 0.5 for unknown traits
    let weight = 0.5;
    if (trait.outcomes && trait.outcomes.length > 0) {
      weight = Math.max(...trait.outcomes.map(o => o.severity));
    }
    // Guard NaN weight from bad outcome data
    if (!isFinite(weight)) weight = 0.5;

    weightedSum += trait.score * weight;
    totalWeight += weight;
  }

  // Guard against edge case where totalWeight is 0
  if (totalWeight === 0) return 0;

  const weightedAvg = weightedSum / totalWeight;
  return Math.max(0, Math.round(weightedAvg * 10));
}

/**
 * Compute per-category GLI breakdown (severity-weighted)
 */
export function computeWeightedCategoryGLI(traits: EnrichedTrait[]): Record<string, number> {
  const categoryMap: Record<string, { scores: number[]; weights: number[] }> = {};

  traits.forEach(trait => {
    const parts = trait.trait_id.split('_');
    const category = parts.length > 1 ? parts[0] : trait.trait_id;

    if (!categoryMap[category]) {
      categoryMap[category] = { scores: [], weights: [] };
    }

    let weight = 0.5;
    if (trait.outcomes && trait.outcomes.length > 0) {
      weight = Math.max(...trait.outcomes.map(o => o.severity));
    }

    categoryMap[category].scores.push(trait.score * weight);
    categoryMap[category].weights.push(weight);
  });

  const result: Record<string, number> = {};
  Object.entries(categoryMap).forEach(([category, data]) => {
    const totalWeight = data.weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) {
      result[category] = 0;
    } else {
      result[category] = Math.round((data.scores.reduce((a, b) => a + b, 0) / totalWeight) * 10);
    }
  });

  return result;
}

/**
 * Compute the Evidence-Weighted Genomic Longevity Index (GLI).
 *
 * Formula: weighted_avg(trait_scores, evidenceWeight) * 10
 *
 * Each trait's contribution is weighted by its evidence tier:
 *   Tier 1: weight 1.0 (well-replicated drug-gene pairs)
 *   Tier 2: weight 0.7 (GWAS-replicated associations)
 *   Tier 3: weight 0.4 (exploratory/single-study)
 *   Unset:  weight 0.5 (conservative default)
 *
 * This variant is useful alongside severity-weighted GLI for a
 * different dimension of quality assessment.
 */
export function computeEvidenceWeightedGLI(traits: EnrichedTrait[]): number {
  if (traits.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const trait of traits) {
    // Guard NaN scores
    if (typeof trait.score !== 'number' || !isFinite(trait.score)) continue;

    let weight = 0.5; // default for unset
    switch (trait.evidenceTier) {
      case 1: weight = 1.0; break;
      case 2: weight = 0.7; break;
      case 3: weight = 0.4; break;
    }

    weightedSum += trait.score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  const weightedAvg = weightedSum / totalWeight;
  return Math.max(0, Math.round(weightedAvg * 10));
}

/**
 * Compute per-category GLI breakdown (unweighted, for backward compatibility)
 */
export function computeCategoryGLI(traits: EnrichedTrait[]): Record<string, number> {
  const categoryMap: Record<string, number[]> = {};

  traits.forEach(trait => {
    // Extract category from trait_id (e.g., 'methylation' stays, 'b12_metabolism' -> 'b12')
    const parts = trait.trait_id.split('_');
    const category = parts.length > 1 ? parts[0] : trait.trait_id;

    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(trait.score);
  });

  const result: Record<string, number> = {};
  Object.entries(categoryMap).forEach(([category, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    result[category] = Math.round(avg * 10);
  });

  return result;
}