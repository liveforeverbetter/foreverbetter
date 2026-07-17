/**
 * Protocol Generator
 * Combines insights and actions into prioritized protocols.
 */

import type { Insight } from './insight_engine.js';
import type { EnrichedTrait } from './graph_resolver.js';

export interface Action {
  id: string;
  title: string;
  impact: number;
  difficulty: 'low' | 'medium' | 'high';
  description?: string;
}

export interface Protocol {
  title: string;
  description: string;
  actions: Action[];
  trait_count: number;
}

interface ActionTrack {
  title: string;
  description: string;
  matches: RegExp[];
}

const ACTION_TRACKS: ActionTrack[] = [
  {
    title: 'Cardiometabolic Action Plan',
    description: 'Focused on the lipid, glucose, circulation, and body-composition signals that stand out in this profile.',
    matches: [/cardio/i, /lipid/i, /cholesterol/i, /endothelial/i, /blood_pressure/i, /glucose/i, /insulin/i, /body_weight/i, /triglyceride/i],
  },
  {
    title: 'Inflammation & Recovery Action Plan',
    description: 'Focused on inflammatory tone, oxidative stress, immune response, tissue recovery, and repair pathways in this profile.',
    matches: [/inflamm/i, /immune/i, /oxidative/i, /recovery/i, /dna_repair/i, /cell_cycle/i, /health_profile/i],
  },
  {
    title: 'Nutrition & Methylation Action Plan',
    description: 'Focused on methylation, vitamin handling, nutrient metabolism, and diet-response signals found in this profile.',
    matches: [/methyl/i, /folate/i, /b12/i, /vitamin/i, /homocysteine/i, /choline/i, /caffeine/i, /histamine/i, /nutrition/i],
  },
  {
    title: 'Medication Metabolism Review',
    description: 'Focused on pharmacogenomic and transporter findings that may be useful context for clinician or pharmacist review.',
    matches: [/drug/i, /pharmac/i, /cyp/i, /warfarin/i, /statin/i, /metabolism/i, /transport/i],
  },
  {
    title: 'Strength & Performance Action Plan',
    description: 'Focused on muscle, endurance, recovery, and training-response signals found in this profile.',
    matches: [/muscle/i, /performance/i, /fitness/i, /endurance/i, /vo2/i, /strength/i],
  },
];

function traitMatchesTrack(trait: EnrichedTrait, track: ActionTrack): boolean {
  const haystack = `${trait.trait_id} ${trait.mechanism || ''} ${(trait.outcomes || []).map(o => o.id).join(' ')}`;
  return track.matches.some(pattern => pattern.test(haystack));
}

function uniqueSortedActions(traits: EnrichedTrait[], usedActionIds: Set<string>, limit: number): Action[] {
  const actions = traits
    .flatMap(t => t.actions || [])
    .filter(a => !usedActionIds.has(a.id))
    .sort((a, b) => b.impact - a.impact || a.difficulty.localeCompare(b.difficulty))
    .slice(0, limit);

  for (const action of actions) {
    usedActionIds.add(action.id);
  }

  return actions;
}

/**
 * Generate protocols from traits and insights.
 * Deduplicates actions and creates prioritized protocol bundles.
 */
export function generateProtocols(traits: EnrichedTrait[]): Protocol[] {
  const risks = traits.filter(t => t.score < 40);
  const protocols: Protocol[] = [];
  const usedActionIds = new Set<string>();

  // Priority track: only the user's lowest-scoring traits, not a generic global action list.
  if (risks.length > 0) {
    const priorityTraits = risks
      .slice()
      .sort((a, b) => a.score - b.score || b.confidence - a.confidence)
      .slice(0, 8);
    protocols.push({
      title: 'Priority Wellness Action Plan',
      description: `Highest-priority steps from the ${priorityTraits.length} strongest wellness signals in this profile.`,
      actions: uniqueSortedActions(priorityTraits, usedActionIds, 5),
      trait_count: priorityTraits.length
    });
  }

  const candidateTracks = ACTION_TRACKS
    .map(track => {
      const matchedTraits = traits
        .filter(t => t.score < 70 && traitMatchesTrack(t, track))
        .sort((a, b) => a.score - b.score || b.confidence - a.confidence);
      const avgScore = matchedTraits.length
        ? matchedTraits.reduce((sum, t) => sum + t.score, 0) / matchedTraits.length
        : 100;
      return { track, matchedTraits, avgScore };
    })
    .filter(entry => entry.matchedTraits.length > 0)
    .sort((a, b) => a.avgScore - b.avgScore);

  for (const { track, matchedTraits } of candidateTracks) {
    if (protocols.length >= 4) break;
    const actions = uniqueSortedActions(matchedTraits, usedActionIds, 4);
    if (actions.length === 0) continue;
    protocols.push({
      title: track.title,
      description: `${track.description} Built from ${matchedTraits.length} matched trait${matchedTraits.length > 1 ? 's' : ''}.`,
      actions,
      trait_count: matchedTraits.length
    });
  }

  if (protocols.length === 0) {
    const actions = uniqueSortedActions(traits, usedActionIds, 5);
    protocols.push({
      title: 'Baseline Wellness Action Plan',
      description: traits.length > 0
        ? 'Foundational wellness steps selected from the strongest available signals in this profile.'
        : 'No profile-specific action signals were available, so this report only includes baseline wellness guidance.',
      actions,
      trait_count: traits.length
    });
  }

  return protocols;
}

/**
 * Generate a single protocol from insights only
 */
export function generateProtocolFromInsights(insights: Insight[]): Protocol {
  const allActions = insights.flatMap(i => i.actions.map(title => ({ id: title.toLowerCase().replace(/ /g, '_'), title, impact: 0.6, difficulty: 'low' as const })));

  const uniqueActions = Array.from(
    new Map(allActions.map(a => [a.id, a])).values()
  );

  return {
    title: 'Action Protocol',
    description: `Generated from ${insights.length} insight${insights.length > 1 ? 's' : ''}`,
    actions: uniqueActions.slice(0, 5),
    trait_count: insights.length
  };
}
