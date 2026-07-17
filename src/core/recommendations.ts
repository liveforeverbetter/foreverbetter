import type { AnalysisResult, DerivedInterpretation } from '../types.js';

// Lower rank sorts first: the most actionable findings lead.
const STATUS_RANK: Record<string, number> = {
  needs_attention: 0,
  watch: 1,
  setup_required: 2,
};

export type RecommendationPriority = 'high' | 'medium' | 'low' | 'info';

export interface Recommendation {
  title: string;
  category: string;
  priority: RecommendationPriority;
  status?: string;
  score?: number;
  rationale?: string;
  action: string;
  provenance: { analysis_id: string; source_ids: string[]; engine: string };
}

export interface ProtocolRoutine {
  id: 'core' | 'optimize' | 'maintain';
  name: string;
  focus: string;
  domains: string[];
  items: Recommendation[];
}

export interface RecommendationsResult {
  analysis_id: string;
  user_id: string;
  organization_id?: string;
  generated_at: string;
  healthspan_score?: number;
  count: number;
  recommendations: Recommendation[];
  protocols: ProtocolRoutine[];
}

// Turn a stored analysis into a prioritized, de-duplicated action list. Findings
// already inside their optimal range are "maintain" and carry no action item, so
// they are excluded; everything else is ranked by severity then by score.
export function buildRecommendations(analysis: AnalysisResult): RecommendationsResult {
  const seen = new Set<string>();
  const recommendations = analysis.derived_interpretations
    .filter(item => item.status !== 'optimal')
    .filter(item => typeof item.action === 'string' && item.action.trim().length > 0)
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || (a.score ?? 100) - (b.score ?? 100))
    .map(item => toRecommendation(item, analysis.id))
    .filter(recommendation => {
      const key = `${recommendation.category}:${recommendation.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return {
    analysis_id: analysis.id,
    user_id: analysis.user_id,
    organization_id: analysis.organization_id,
    generated_at: new Date().toISOString(),
    healthspan_score: analysis.healthspan_score,
    count: recommendations.length,
    recommendations,
    protocols: buildProtocols(recommendations),
  };
}

// Group the flat action list into tiered routines so apps can render a
// protocol/plan view instead of a raw list: Core (fix now) > Optimize (improve)
// > Maintain (info). Domains are surfaced per routine for section headers.
function buildProtocols(recommendations: Recommendation[]): ProtocolRoutine[] {
  const tiers: Array<{ id: ProtocolRoutine['id']; name: string; focus: string; priorities: RecommendationPriority[] }> = [
    { id: 'core', name: 'Core priorities', focus: 'Address these first - they are the most out-of-range signals.', priorities: ['high'] },
    { id: 'optimize', name: 'Optimize', focus: 'Improve these to move from acceptable toward optimal.', priorities: ['medium'] },
    { id: 'maintain', name: 'Maintain & review', focus: 'Lower-urgency items, informational findings, and setup steps.', priorities: ['low', 'info'] },
  ];
  return tiers
    .map(tier => {
      const items = recommendations.filter(recommendation => tier.priorities.includes(recommendation.priority));
      return {
        id: tier.id,
        name: tier.name,
        focus: tier.focus,
        domains: Array.from(new Set(items.map(item => item.category))).sort(),
        items,
      };
    })
    .filter(routine => routine.items.length > 0);
}

function toRecommendation(item: DerivedInterpretation, analysisId: string): Recommendation {
  return {
    title: item.title,
    category: String(item.category),
    priority: priorityForStatus(item.status),
    status: item.status,
    score: item.score,
    rationale: item.summary,
    action: (item.action as string).trim(),
    provenance: {
      analysis_id: analysisId,
      source_ids: item.provenance?.source_ids ?? [],
      engine: item.provenance?.engine ?? 'health-api',
    },
  };
}

function statusRank(status?: string): number {
  return status != null && status in STATUS_RANK ? STATUS_RANK[status]! : 5;
}

function priorityForStatus(status?: string): RecommendationPriority {
  if (status === 'needs_attention') return 'high';
  if (status === 'watch') return 'medium';
  if (status === 'setup_required') return 'info';
  return 'low';
}
