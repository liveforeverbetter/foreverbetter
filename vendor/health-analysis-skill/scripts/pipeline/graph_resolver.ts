/**
 * Graph Resolver
 * Enriches trait scores with knowledge graph data (mechanism, outcomes, actions).
 */

import { knowledgeGraph, KnowledgeGraphNode } from './knowledge_graph.js';

export interface EnrichedTrait {
  trait_id: string;
  score: number;
  confidence: number;
  mechanism?: string;
  outcomes?: KnowledgeGraphNode['outcomes'];
  actions?: KnowledgeGraphNode['actions'];
  evidenceTier?: 1 | 2 | 3;
}

/**
 * Build a generic default node for traits not found in the knowledge graph.
 * Returns a minimal enrichment with a default outcome so the trait still
 * flows through priority, insight, protocol, and GLI engines.
 */
function buildFallbackNode(traitId: string): {
  mechanism: string;
  outcomes: Array<{ id: string; severity: number; description: string }>;
  actions: Array<{ id: string; title: string; impact: number; difficulty: "low" | "medium" | "high"; description: string }>;
} {
  const label = traitId.replace(/_/g, " ");
  return {
    mechanism: `Genetic variation affecting ${label}`,
    outcomes: [
      {
        id: `generic_${traitId}_risk`,
        severity: 0.5,
        description: `Moderate risk associated with ${label}`,
      },
    ],
    actions: [
      {
        id: `monitor_${traitId}`,
        title: `Discuss ${label} findings with healthcare provider`,
        impact: 0.4,
        difficulty: "low",
        description: "Review findings and determine if further evaluation is warranted",
      },
      {
        id: `optimize_${traitId}`,
        title: `Follow evidence-based guidelines for ${label}`,
        impact: 0.5,
        difficulty: "medium",
        description: "Implement standard preventive and optimization measures",
      },
    ],
  };
}

/**
 * Enrich traits with knowledge graph data.
 * Returns traits with embedded mechanism, outcomes, and actions.
 *
 * When a trait is not found in the knowledge graph, a fallback node with
 * a generic outcome (severity 0.5) and two standard actions is generated
 * so the trait still flows through the priority, insight, protocol, and
 * GLI engines rather than being silently discarded.
 */
export function enrichTraits(traits: Array<{ trait_id: string; score: number; confidence: number; evidenceTier?: 1 | 2 | 3 }>): EnrichedTrait[] {
  return traits.map(trait => {
    const graphNode = knowledgeGraph.traits[trait.trait_id];

    if (!graphNode) {
      const fallback = buildFallbackNode(trait.trait_id);
      return { ...trait, mechanism: fallback.mechanism, outcomes: fallback.outcomes, actions: fallback.actions };
    }

    return {
      ...trait,
      mechanism: graphNode.mechanism,
      outcomes: graphNode.outcomes,
      actions: graphNode.actions
    };
  });
}

/**
 * Get a single enriched trait by ID
 */
export function getEnrichedTrait(traitId: string, score: number, confidence: number, evidenceTier?: 1 | 2 | 3): EnrichedTrait | null {
  const graphNode = knowledgeGraph.traits[traitId];
  if (!graphNode) return null;

  return {
    trait_id: traitId,
    score,
    confidence,
    evidenceTier,
    mechanism: graphNode.mechanism,
    outcomes: graphNode.outcomes,
    actions: graphNode.actions
  };
}