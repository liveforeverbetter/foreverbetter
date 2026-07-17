/**
 * Knowledge Graph
 *
 * Contains trait definitions, mechanisms, outcomes, and recommended actions.
 *
 * The trait data lives in shared/knowledge_graph_data.json (single source of
 * truth). This TypeScript file provides type definitions and helpers. To add
 * a new trait, edit the JSON file — no code changes needed.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Type definitions ──

export interface KnowledgeGraphNode {
  trait_id: string;
  mechanism: string;
  outcomes: Outcome[];
  actions: Action[];
}

export interface Outcome {
  id: string;
  severity: number; // 0-1
  description?: string;
}

export interface Action {
  id: string;
  title: string;
  impact: number; // 0-1
  difficulty: 'low' | 'medium' | 'high';
  description?: string;
}

export interface KnowledgeGraph {
  traits: Record<string, KnowledgeGraphNode>;
}

// ── Load trait data from JSON ──

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '..', '..', 'shared', 'knowledge_graph_data.json');

let _raw: Record<string, any>;
try {
  _raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch (err) {
  // Fallback: if JSON doesn't exist, this is a development environment run
  // without data generation. Return empty graph rather than crashing.
  console.warn(`Knowledge graph data not found at ${dataPath}. Running with empty trait graph.`);
  _raw = {};
}

/**
 * The knowledge graph, loaded from shared/knowledge_graph_data.json.
 */
export const knowledgeGraph: KnowledgeGraph = {
  traits: _raw as Record<string, KnowledgeGraphNode>,
};

// ── Helpers ──

/**
 * Get all trait IDs in the knowledge graph.
 */
export function getAllTraitIds(): string[] {
  return Object.keys(knowledgeGraph.traits);
}
