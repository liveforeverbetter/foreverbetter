/**
 * Personalized action plan composer.
 *
 * Takes normalized observations + curated intervention rules and emits one
 * canonical `PersonalizedActionPlan` (zero to three qualified priorities
 * plus review items, maintenance, and an optional next-context prompt).
 *
 * The composer is pure: given the same inputs it produces the same output.
 * Ranking is deterministic and lexicographic so the order is auditable.
 */

import type {
  NormalizedObservation,
  ObservationModality,
} from './observation_types.js';
import type {
  InterventionRule,
  RuleEvidenceChip,
  SignalRequirement,
} from './intervention_rules.js';
import { INTERVENTION_RULES, requirementMatches } from './intervention_rules.js';
import type {
  NextContextSuggestion,
  PersonalizedAction,
  PersonalizedActionEvidenceChip,
  PersonalizedActionPlan,
  PersonalizedActionRanking,
  PlanMaintenanceAction,
  PlanModality,
  PlanModalityCoverage,
  PlanReviewItem,
  PlanReviewItemReason,
  PlanSafetyTier,
} from '../../shared/dashboard-types.js';

export interface UserProfileContext {
  age?: number;
  sex?: 'male' | 'female';
  pregnancy_status?: 'pregnant' | 'not_pregnant' | 'unknown';
  condition_history?: string[];
  current_medications?: string[];
}

export interface ComposerOptions {
  /** Override the default rule catalog for tests. */
  rules?: InterventionRule[];
  /** Connected modalities, even when no observations were emitted (e.g. empty wearable file). */
  connected_modalities?: ObservationModality[];
  /** Maximum number of qualified priorities to return (1-3). */
  max_priorities?: 1 | 2 | 3;
  user_profile?: UserProfileContext;
  /** Deterministic timestamp for tests; defaults to new Date().toISOString(). */
  generated_at?: string;
}

const MODALITY_LABELS: Record<ObservationModality, string> = {
  genetics: 'Genetics',
  biomarkers: 'Blood test',
  wearables: 'Wearable',
};

const URGENCY_TIER: Record<PlanSafetyTier, number> = {
  medication_safety: 4,
  prompt_review: 3,
  routine_review: 2,
  self_directed: 1,
};

interface RuleMatch {
  rule: InterventionRule;
  matchedRequired: NormalizedObservation[];
  matchedOptional: NormalizedObservation[];
  conflictedObservations: NormalizedObservation[];
  contraindicated: boolean;
  missingContext: Array<'age' | 'sex' | 'pregnancy_status' | 'condition_history' | 'current_medications'>;
  temporalIncompatible: boolean;
}

function modalityCoverage(
  observations: NormalizedObservation[],
  connected: ObservationModality[],
): PlanModalityCoverage[] {
  const connectedSet = new Set<ObservationModality>(connected);
  for (const obs of observations) connectedSet.add(obs.modality);
  return (['genetics', 'biomarkers', 'wearables'] as ObservationModality[]).map(modality => {
    const present = connectedSet.has(modality);
    const signal_count = observations.filter(obs => obs.modality === modality).length;
    return {
      modality,
      status: present ? 'connected' : 'not_provided',
      label: MODALITY_LABELS[modality],
      signal_count,
    };
  });
}

function profileHas(
  context: UserProfileContext | undefined,
  field: 'age' | 'sex' | 'pregnancy_status' | 'condition_history' | 'current_medications',
): boolean {
  if (!context) return false;
  const value = context[field];
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function temporalCompatible(rule: InterventionRule, matched: NormalizedObservation[]): boolean {
  const window = rule.temporal_compatibility?.fusion_window_days;
  if (!window || matched.length <= 1) return true;
  const dated = matched
    .map(obs => obs.provenance.collected_at)
    .filter((value): value is string => Boolean(value))
    .map(value => Date.parse(value))
    .filter(value => Number.isFinite(value));
  if (dated.length <= 1) return true;
  const max = Math.max(...dated);
  const min = Math.min(...dated);
  const spanDays = (max - min) / (1000 * 60 * 60 * 24);
  return spanDays <= window;
}

function evaluateRule(rule: InterventionRule, observations: NormalizedObservation[], profile?: UserProfileContext): RuleMatch {
  const matchedRequired: NormalizedObservation[] = [];
  for (const requirement of rule.required) {
    const match = observations.find(obs => requirementMatches(requirement, obs));
    if (match) matchedRequired.push(match);
  }
  const matchedOptional: NormalizedObservation[] = [];
  for (const requirement of rule.optional_modifiers ?? []) {
    const match = observations.find(obs => requirementMatches(requirement, obs));
    if (match) matchedOptional.push(match);
  }
  const conflictedObservations: NormalizedObservation[] = [];
  for (const requirement of rule.conflicts ?? []) {
    const match = observations.find(obs => requirementMatches(requirement, obs));
    if (match) conflictedObservations.push(match);
  }
  const contraindicated = (rule.contraindications ?? []).some(requirement =>
    observations.some(obs => requirementMatches(requirement, obs)),
  );
  const missingContext = (rule.required_context ?? []).filter(field => !profileHas(profile, field));
  const temporalIncompatible = !temporalCompatible(rule, [...matchedRequired, ...matchedOptional]);
  return { rule, matchedRequired, matchedOptional, conflictedObservations, contraindicated, missingContext, temporalIncompatible };
}

function fillTemplate(template: string, obs: NormalizedObservation | undefined): string {
  if (!obs) return template;
  return template
    .replace(/\{signal_name\}/g, obs.signal_name)
    .replace(/\{display_value\}/g, obs.display_value ?? (obs.unit ? `${obs.value} ${obs.unit}` : `${obs.value}`))
    .replace(/\{target_label\}/g, obs.target_label ?? 'wellness band');
}

function severityFor(obs: NormalizedObservation): PersonalizedActionEvidenceChip['severity'] {
  if (obs.status === 'needs_attention') return 'bad';
  if (obs.status === 'watch') return 'warn';
  return 'good';
}

function buildEvidenceChip(chipSpec: RuleEvidenceChip, obs: NormalizedObservation): PersonalizedActionEvidenceChip | undefined {
  if (chipSpec.hide_when_optimal && obs.status === 'optimal') return undefined;
  return {
    observation_id: obs.id,
    source_label: obs.provenance.source_label,
    label: chipSpec.label_override ?? obs.signal_name,
    value: obs.display_value ?? (obs.unit ? `${obs.value} ${obs.unit}` : `${obs.value}`),
    target: obs.target_label,
    collected_at: obs.provenance.collected_at,
    severity: severityFor(obs),
  };
}

function buildEvidenceChips(rule: InterventionRule, matched: NormalizedObservation[]): PersonalizedActionEvidenceChip[] {
  const chips: PersonalizedActionEvidenceChip[] = [];
  const used = new Set<string>();
  for (const chipSpec of rule.evidence_chips ?? []) {
    const obs = matched.find(o => o.signal_id === chipSpec.observation_signal_id);
    if (!obs) continue;
    const chip = buildEvidenceChip(chipSpec, obs);
    if (chip) {
      chips.push(chip);
      used.add(obs.id);
    }
  }
  // Add any matched required observations the rule didn't explicitly chip,
  // so the user can see the personal evidence even if the rule author forgot.
  for (const obs of matched) {
    if (used.has(obs.id)) continue;
    chips.push({
      observation_id: obs.id,
      source_label: obs.provenance.source_label,
      label: obs.signal_name,
      value: obs.display_value ?? (obs.unit ? `${obs.value} ${obs.unit}` : `${obs.value}`),
      target: obs.target_label,
      collected_at: obs.provenance.collected_at,
      severity: severityFor(obs),
    });
  }
  return chips;
}

function rankingFor(rule: InterventionRule, hasCorroboration: boolean): PersonalizedActionRanking {
  const corroboration = hasCorroboration && rule.ranking.corroboration_bonus ? rule.ranking.corroboration_bonus : 0;
  return {
    urgency: rule.ranking.urgency,
    evidence_quality: rule.ranking.evidence_quality,
    relevance: rule.ranking.modifiability * 0.5 + rule.ranking.retestability * 0.5,
    modifiability: rule.ranking.modifiability,
    retestability: rule.ranking.retestability,
    corroboration,
    explanation: buildRankingExplanation(rule, hasCorroboration),
  };
}

function buildRankingExplanation(rule: InterventionRule, hasCorroboration: boolean): string {
  const reasons: string[] = [];
  if (rule.safety.tier === 'medication_safety') reasons.push('medication-safety priority');
  else if (rule.safety.tier === 'prompt_review') reasons.push('clinically urgent review');
  if (rule.ranking.urgency >= 0.7) reasons.push('high-urgency wellness signal');
  if (rule.ranking.evidence_quality >= 0.8) reasons.push('strong evidence quality');
  if (rule.ranking.modifiability >= 0.8) reasons.push('high modifiability');
  if (hasCorroboration) reasons.push('corroborated across modalities');
  if (reasons.length === 0) reasons.push('qualifies on personal evidence');
  return reasons.slice(0, 3).join(' · ');
}

function modalitiesOf(matched: NormalizedObservation[]): PlanModality[] {
  const set = new Set<PlanModality>();
  for (const obs of matched) set.add(obs.modality);
  return Array.from(set);
}

function buildAction(match: RuleMatch): PersonalizedAction {
  const { rule, matchedRequired, matchedOptional } = match;
  const allMatched = [...matchedRequired, ...matchedOptional];
  const primary = matchedRequired[0];
  const why = fillTemplate(rule.why_personal, primary);
  const title = fillTemplate(rule.title, primary);
  const evidence_chips = buildEvidenceChips(rule, allMatched);
  const ranking = rankingFor(rule, matchedOptional.length > 0);
  return {
    id: `${rule.intervention_id}.${rule.version}`,
    intervention_id: rule.intervention_id,
    rule_id: rule.id,
    rule_version: rule.version,
    title,
    why_personal: why,
    source_modalities: modalitiesOf(allMatched),
    supporting_observation_ids: allMatched.map(obs => obs.id),
    evidence_chips,
    steps: rule.steps,
    expected_result: rule.expected_result,
    review_window: rule.review_window,
    comparability_requirements: rule.comparability_requirements,
    safety: rule.safety,
    ranking,
  };
}

function compareActions(a: PersonalizedAction, b: PersonalizedAction): number {
  // Lexicographic ranking: safety tier first, then explicit factors, then stable rule id.
  const tierDelta = URGENCY_TIER[b.safety.tier] - URGENCY_TIER[a.safety.tier];
  if (tierDelta !== 0) return tierDelta;
  if (b.ranking.urgency !== a.ranking.urgency) return b.ranking.urgency - a.ranking.urgency;
  if (b.ranking.evidence_quality !== a.ranking.evidence_quality)
    return b.ranking.evidence_quality - a.ranking.evidence_quality;
  if (b.ranking.relevance !== a.ranking.relevance) return b.ranking.relevance - a.ranking.relevance;
  if (b.ranking.modifiability !== a.ranking.modifiability)
    return b.ranking.modifiability - a.ranking.modifiability;
  if (b.ranking.retestability !== a.ranking.retestability)
    return b.ranking.retestability - a.ranking.retestability;
  if (b.ranking.corroboration !== a.ranking.corroboration)
    return b.ranking.corroboration - a.ranking.corroboration;
  return a.rule_id.localeCompare(b.rule_id);
}

function buildReviewItem(
  match: RuleMatch,
  reason: PlanReviewItemReason,
  observationIds: string[],
  needed_context?: string[],
): PlanReviewItem {
  return {
    id: `review.${match.rule.intervention_id}.${reason}`,
    reason,
    title: `${match.rule.title} — needs review`,
    explanation: reviewExplanation(reason, match),
    needed_context,
    affected_observation_ids: observationIds,
  };
}

function reviewExplanation(reason: PlanReviewItemReason, match: RuleMatch): string {
  switch (reason) {
    case 'conflict':
      return `Conflicting signals for ${match.rule.title.toLowerCase()}. Withhold this action until the conflict is resolved.`;
    case 'missing_context':
      return `${match.rule.title} requires personal context that was not supplied. Add the missing detail to unlock the personalized version.`;
    case 'temporal_mismatch':
      return `Supporting signals were not collected within the same window (${match.rule.temporal_compatibility?.fusion_window_days ?? '?'} days). Schedule a fresh measurement so the trend remains comparable.`;
    default:
      return `${match.rule.title} requires review.`;
  }
}

function dedupeByIntervention(actions: PersonalizedAction[]): PersonalizedAction[] {
  const byIntervention = new Map<string, PersonalizedAction>();
  for (const action of actions) {
    const existing = byIntervention.get(action.intervention_id);
    if (!existing) {
      byIntervention.set(action.intervention_id, action);
      continue;
    }
    // Prefer the higher-ranked of two candidates with the same intervention_id.
    if (compareActions(action, existing) < 0) {
      byIntervention.set(action.intervention_id, action);
    }
  }
  return Array.from(byIntervention.values());
}

function buildMaintenance(observations: NormalizedObservation[]): PlanMaintenanceAction[] {
  // Maintenance surfaces only when there is at least one in-target observation
  // per connected modality. It never claims personalization beyond "things that
  // are currently working" so we keep the copy generic but evidence-linked.
  const maintenance: PlanMaintenanceAction[] = [];
  const modalitiesWithOptimal = new Set<PlanModality>();
  for (const obs of observations) if (obs.status === 'optimal') modalitiesWithOptimal.add(obs.modality);
  for (const modality of modalitiesWithOptimal) {
    const inTarget = observations.filter(o => o.modality === modality && o.status === 'optimal').slice(0, 3);
    if (inTarget.length === 0) continue;
    maintenance.push({
      id: `maintain.${modality}`,
      title: `Keep ${MODALITY_LABELS[modality].toLowerCase()} signals on track`,
      description: `These signals are currently in target: ${inTarget.map(obs => obs.signal_name).join(', ')}. Maintain current routine and recheck on your usual cadence.`,
      source_modalities: [modality],
    });
  }
  return maintenance;
}

function nextContextSuggestion(
  observations: NormalizedObservation[],
  coverage: PlanModalityCoverage[],
): NextContextSuggestion | undefined {
  const missing = coverage.find(c => c.status === 'not_provided');
  if (!missing) return undefined;
  const labels: Record<PlanModality, string> = {
    genetics: 'genetic results',
    biomarkers: 'blood test',
    wearables: 'wearable export',
  };
  const why: Record<PlanModality, string> = {
    biomarkers: 'A blood panel adds current physiology and makes your plan retestable in 8-12 weeks.',
    wearables: 'A wearable export adds 7-14 day behavior trends so corroboration and review windows become precise.',
    genetics: 'Genetic results add medication-safety and methylation modifiers, while never blocking your current plan.',
  };
  const unlocks: Record<PlanModality, string[]> = {
    biomarkers: ['Specific ApoB / HbA1c / hs-CRP retest plans', 'Better evidence chips for inflammation and metabolic actions'],
    wearables: ['Sleep / HRV / steps / training-load actions with weekly review windows'],
    genetics: ['Pharmacology safety notes (CYP2C19) and methylation modifiers (MTHFR)'],
  };
  return {
    missing_modality: missing.modality,
    why: `Adding your ${labels[missing.modality]} is optional. ${why[missing.modality]}`,
    suggested_actions_unlocked: unlocks[missing.modality],
  };
}

function buildSummary(coverage: PlanModalityCoverage[], priorityCount: number, reviewCount: number): string {
  const connected = coverage.filter(c => c.status === 'connected').map(c => c.label.toLowerCase());
  const coverageText = connected.length === 0
    ? 'No personal data is connected yet, so the plan only shows accepted-input guidance.'
    : `Built from your ${connected.join(' + ')}.`;
  const planText = priorityCount === 0
    ? reviewCount > 0
      ? 'No qualified priorities right now; review items below explain what to resolve.'
      : 'No qualified priorities right now. Maintenance and optional next-data guidance follow.'
    : `${priorityCount} priorit${priorityCount === 1 ? 'y is' : 'ies are'} backed by your personal evidence.`;
  return `${coverageText} ${planText}`.trim();
}

export function composePersonalizedActionPlan(
  observations: NormalizedObservation[],
  options: ComposerOptions = {},
): PersonalizedActionPlan {
  const rules = options.rules ?? INTERVENTION_RULES;
  const max = options.max_priorities ?? 3;
  const profile = options.user_profile;
  const connected = options.connected_modalities ?? [];

  const evaluations = rules.map(rule => evaluateRule(rule, observations, profile));

  const qualifiedActions: PersonalizedAction[] = [];
  const reviewItems: PlanReviewItem[] = [];

  for (const match of evaluations) {
    const allRequiredMatched = match.matchedRequired.length === match.rule.required.length;
    if (!allRequiredMatched) continue;
    if (match.contraindicated) continue; // silently drop — the rule does not apply

    if (match.conflictedObservations.length > 0) {
      reviewItems.push(buildReviewItem(
        match,
        'conflict',
        [...match.matchedRequired, ...match.conflictedObservations].map(o => o.id),
      ));
      continue;
    }
    if (match.missingContext.length > 0) {
      reviewItems.push(buildReviewItem(
        match,
        'missing_context',
        match.matchedRequired.map(o => o.id),
        match.missingContext,
      ));
      continue;
    }
    if (match.temporalIncompatible) {
      reviewItems.push(buildReviewItem(
        match,
        'temporal_mismatch',
        [...match.matchedRequired, ...match.matchedOptional].map(o => o.id),
      ));
      continue;
    }
    qualifiedActions.push(buildAction(match));
  }

  const deduped = dedupeByIntervention(qualifiedActions);
  const ranked = deduped.slice().sort(compareActions);
  const priorities = ranked.slice(0, max);

  const coverage = modalityCoverage(observations, connected);
  const maintenance = buildMaintenance(observations);
  const next_context = nextContextSuggestion(observations, coverage);
  const summary = buildSummary(coverage, priorities.length, reviewItems.length);

  return {
    generated_at: options.generated_at ?? new Date().toISOString(),
    coverage,
    summary,
    priorities,
    review_items: reviewItems,
    maintenance,
    next_context,
  };
}

export type { PersonalizedActionPlan, PersonalizedAction };
