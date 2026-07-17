/**
 * Insight Engine
 * Generates human-readable insights from enriched traits.
 */

import type { EnrichedTrait } from './graph_resolver.js';

export interface Insight {
  title: string;
  summary: string;
  impact: string;
  actions: string[];
  score: number;
  confidence: number;
  evidenceTier?: number;
}

/**
 * Generate insights from enriched traits.
 * Returns actionable insights with trait context.
 */
export function generateInsights(traits: EnrichedTrait[]): Insight[] {
  return traits.map(trait => {
    const formattedName = trait.trait_id.replace(/_/g, ' ');

    let summary: string;
    if (trait.score < 40) {
      summary = `Your ${formattedName} is below optimal. Consider the actions below to improve.`;
    } else if (trait.score < 70) {
      summary = `Your ${formattedName} is moderate. There is room for optimization.`;
    } else {
      summary = `Your ${formattedName} is optimal. Maintain current habits.`;
    }

    return {
      title: formattedName.charAt(0).toUpperCase() + formattedName.slice(1),
      summary,
      impact: trait.outcomes?.[0]?.id || 'unknown',
      actions: trait.actions?.map(a => a.title) || [],
      score: trait.score,
      confidence: trait.confidence,
      evidenceTier: trait.evidenceTier,
    };
  });
}

/**
 * Generate a single insight for a specific trait
 */
export function generateInsight(trait: EnrichedTrait): Insight {
  const insights = generateInsights([trait]);
  return insights[0];
}