/**
 * Priority Scoring
 * Computes action priority based on score, risk, outcome severity, action impact,
 * and evidence tier weighting.
 */

import type { EnrichedTrait } from './graph_resolver.js';

export interface PriorityResult {
  trait_id: string;
  priority: number;
  reasoning: string;
}

/**
 * Get evidence weight multiplier based on evidence tier.
 * Tier 1 (established): 1.0 — well-replicated drug-gene pairs
 * Tier 2 (emerging): 0.7 — GWAS-replicated associations
 * Tier 3 (investigational): 0.4 — exploratory/single-study
 * Unset: 0.5 — conservative default
 */
export function getEvidenceWeight(tier?: number): number {
  switch (tier) {
    case 1: return 1.0;
    case 2: return 0.7;
    case 3: return 0.4;
    default: return 0.5;
  }
}

/**
 * Compute priority score for a single trait.
 * Higher priority = more urgent action needed.
 *
 * Formula: riskWeight * outcomeSeverity * actionImpact * confidence * evidenceWeight
 *
 * - riskWeight: 1.0 if score < 40 (below optimal), 0.5 otherwise
 * - outcomeSeverity: average severity of all outcomes (0-1)
 * - actionImpact: maximum impact across all actions (0-1)
 * - confidence: trait confidence score (0-1)
 * - evidenceWeight: tier-based multiplier (1.0 / 0.7 / 0.4 / 0.5 default)
 */
export function computePriority(trait: EnrichedTrait): PriorityResult {
  const riskWeight = trait.score < 40 ? 1.0 : 0.5;

  const outcomeSeverity = trait.outcomes && trait.outcomes.length > 0
    ? trait.outcomes.reduce((sum, o) => sum + o.severity, 0) / trait.outcomes.length
    : 0.5;

  const actionImpact = trait.actions && trait.actions.length > 0
    ? Math.max(...trait.actions.map(a => a.impact))
    : 0.5;

  const evidenceWeight = getEvidenceWeight(trait.evidenceTier);

  const priority = riskWeight * outcomeSeverity * actionImpact * (trait.confidence || 1) * evidenceWeight;

  let reasoning: string;
  if (trait.score < 40) {
    reasoning = `Score ${trait.score} is below optimal threshold (40)`;
  } else {
    reasoning = `Score ${trait.score} is within acceptable range`;
  }

  return {
    trait_id: trait.trait_id,
    priority: Math.round(priority * 100) / 100,
    reasoning
  };
}

/**
 * Compute priorities for all traits and sort by priority (highest first)
 */
export function computeAllPriorities(traits: EnrichedTrait[]): PriorityResult[] {
  return traits
    .map(trait => computePriority(trait))
    .sort((a, b) => b.priority - a.priority);
}