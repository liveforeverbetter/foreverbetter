/**
 * Versioned intervention rule catalog.
 *
 * Each rule maps explicit observation requirements to a single consumer
 * action. Rules are typed and curated in source — never loaded from
 * user-controlled paths — so they remain reviewable and cannot become an
 * input boundary.
 *
 * Rule ids are stable across versions (`intervention_id`) so the composer
 * can deduplicate by intervention even when rule versions advance.
 */

import type {
  NormalizedObservation,
  ObservationModality,
  ObservationDirection,
  ObservationStatus,
} from './observation_types.js';

export type SafetyTier =
  | 'self_directed'
  | 'routine_review'
  | 'prompt_review'
  | 'medication_safety';

export type RuleDomain =
  | 'sleep_recovery'
  | 'cardiometabolic'
  | 'glucose_metabolism'
  | 'inflammation'
  | 'activity_training'
  | 'pharmacology'
  | 'methylation_nutrition'
  | 'micronutrient';

export interface SignalRequirement {
  signal_id: string;
  modality?: ObservationModality;
  status_in?: ObservationStatus[];
  direction_in?: ObservationDirection[];
  min_value?: number;
  max_value?: number;
  value_equals?: string | number;
  /** Maximum age (in days) for this signal to count toward the rule. */
  max_age_days?: number;
}

export interface RuleEvidenceChip {
  observation_signal_id: string;
  label_override?: string;
  hide_when_optimal?: boolean;
}

export interface InterventionRule {
  id: string;
  version: string;
  /** Stable deduplication key; multiple rule versions share one intervention_id. */
  intervention_id: string;
  domain: RuleDomain;
  /**
   * Friendly title. Use `{signal_name}` placeholders to inject signal copy when
   * needed; the composer fills them from the matched observations.
   */
  title: string;
  /** Plain-English personal reason. May use `{signal_name}` / `{display_value}` placeholders. */
  why_personal: string;
  steps: string[];
  /** Every requirement must match at least one observation. */
  required: SignalRequirement[];
  optional_modifiers?: SignalRequirement[];
  /** If any of these match, the rule is withheld and a review item is emitted. */
  conflicts?: SignalRequirement[];
  /** Required user profile context (e.g. age, sex). Missing context withholds the rule. */
  required_context?: Array<'age' | 'sex' | 'pregnancy_status' | 'condition_history' | 'current_medications'>;
  /** Drop the rule if any contraindication observation matches. */
  contraindications?: SignalRequirement[];
  temporal_compatibility?: {
    /** Window (days) within which fused signals must be co-located. */
    fusion_window_days?: number;
    /** Maximum staleness allowed for any signal feeding this rule. */
    max_signal_age_days?: number;
  };
  safety: { tier: SafetyTier; message: string };
  expected_result: { metric: string; direction: 'down' | 'up' | 'stable'; label: string };
  review_window: string;
  comparability_requirements?: string[];
  /**
   * Evidence chips to surface, referenced by observation signal_id. The
   * composer resolves these against matched observations and falls back to
   * sensible defaults when a chip is missing.
   */
  evidence_chips?: RuleEvidenceChip[];
  ranking: {
    /** Safety urgency 0-1. Composer maps this into the urgency tier ordering. */
    urgency: number;
    evidence_quality: number;
    modifiability: number;
    retestability: number;
    /** Bonus when at least one optional modifier matched. */
    corroboration_bonus?: number;
  };
}

const SLEEP_DURATION_LOW: InterventionRule = {
  id: 'wear.sleep_duration.low.v1',
  version: '1.0.0',
  intervention_id: 'sleep.add_opportunity',
  domain: 'sleep_recovery',
  title: 'Add 30-60 minutes of sleep opportunity',
  why_personal: 'Your typical {signal_name} is {display_value}; the wellness target is {target_label}.',
  steps: [
    'Set a fixed wake time and protect a 60-minute earlier bedtime for two weeks.',
    'Track 7-night average sleep duration weekly.',
    'Reassess after the two-week block; lengthen the window only if you stay below target.',
  ],
  required: [
    { signal_id: 'sleep_duration', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  optional_modifiers: [
    { signal_id: 'sleep_debt_minutes', modality: 'wearables', direction_in: ['high'] },
    { signal_id: 'recovery_score', modality: 'wearables', direction_in: ['low'] },
  ],
  temporal_compatibility: { fusion_window_days: 14, max_signal_age_days: 30 },
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'sleep_duration', direction: 'up', label: '7-night average sleep duration trends up by 20-40 minutes.' },
  review_window: '2 weeks',
  comparability_requirements: ['Use the same wearable source and averaging window when retesting.'],
  evidence_chips: [
    { observation_signal_id: 'sleep_duration' },
    { observation_signal_id: 'recovery_score', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.6, evidence_quality: 0.8, modifiability: 0.85, retestability: 0.9, corroboration_bonus: 0.1 },
};

const HRV_LOW: InterventionRule = {
  id: 'wear.hrv.low.v1',
  version: '1.0.0',
  intervention_id: 'recovery.two_week_block',
  domain: 'sleep_recovery',
  title: 'Run a two-week recovery reset',
  why_personal: 'Your {signal_name} averaged {display_value}, below the {target_label} target. HRV responds quickly to sleep, alcohol, and training load.',
  steps: [
    'Keep wake time fixed and shift bedtime 30-45 minutes earlier.',
    'Drop alcohol and deload intense training; keep daily steps.',
    'Reassess HRV trend at the end of the two weeks; compare against your own baseline.',
  ],
  required: [
    { signal_id: 'hrv', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  optional_modifiers: [
    { signal_id: 'resting_heart_rate', modality: 'wearables', direction_in: ['high'] },
    { signal_id: 'alcohol_days', modality: 'wearables', direction_in: ['high'] },
  ],
  temporal_compatibility: { fusion_window_days: 14, max_signal_age_days: 30 },
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'hrv', direction: 'up', label: 'HRV trends up versus your two-week baseline.' },
  review_window: '2 weeks',
  comparability_requirements: ['Same wearable and morning measurement window.'],
  evidence_chips: [
    { observation_signal_id: 'hrv' },
    { observation_signal_id: 'resting_heart_rate', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.6, evidence_quality: 0.75, modifiability: 0.8, retestability: 0.9, corroboration_bonus: 0.1 },
};

const STEPS_LOW: InterventionRule = {
  id: 'wear.steps.low.v1',
  version: '1.0.0',
  intervention_id: 'activity.raise_step_baseline',
  domain: 'activity_training',
  title: 'Raise your daily step baseline by 1,000-2,000 steps',
  why_personal: 'Your daily {signal_name} averaged {display_value}, below the {target_label} wellness floor.',
  steps: [
    'Add a 15-20 minute walk after one meal each day.',
    'Use a daily step target 1,000-2,000 above your current average; keep it consistent for two weeks.',
    'Reassess weekly average steps in two weeks.',
  ],
  required: [
    { signal_id: 'steps', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  temporal_compatibility: { max_signal_age_days: 30 },
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'steps', direction: 'up', label: 'Average steps/day rise by 1,000+.' },
  review_window: '2 weeks',
  evidence_chips: [{ observation_signal_id: 'steps' }],
  ranking: { urgency: 0.5, evidence_quality: 0.8, modifiability: 0.9, retestability: 0.95 },
};

const STRENGTH_SESSIONS_LOW: InterventionRule = {
  id: 'wear.strength.low.v1',
  version: '1.0.0',
  intervention_id: 'activity.add_resistance_training',
  domain: 'activity_training',
  title: 'Add two full-body resistance sessions per week',
  why_personal: 'You logged {display_value} this week — the wellness floor is {target_label}.',
  steps: [
    'Plan two 30-45 minute sessions targeting legs, push, pull each week.',
    'Track session count for four weeks.',
    'Reassess after four weeks; add a third session only after two-session consistency.',
  ],
  required: [
    { signal_id: 'strength_sessions', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  temporal_compatibility: { max_signal_age_days: 30 },
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'strength_sessions', direction: 'up', label: 'Two or more sessions per week sustained.' },
  review_window: '4 weeks',
  evidence_chips: [{ observation_signal_id: 'strength_sessions' }],
  ranking: { urgency: 0.45, evidence_quality: 0.8, modifiability: 0.85, retestability: 0.9 },
};

const ZONE2_LOW: InterventionRule = {
  id: 'wear.zone2.low.v1',
  version: '1.0.0',
  intervention_id: 'activity.build_zone2',
  domain: 'activity_training',
  title: 'Build toward 120 minutes of zone 2 cardio per week',
  why_personal: 'Your weekly {signal_name} averaged {display_value}, below the {target_label} target.',
  steps: [
    'Schedule three 30-40 minute conversational-pace sessions weekly.',
    'Track weekly minutes for four weeks.',
    'Reassess after four weeks before adding intensity.',
  ],
  required: [
    { signal_id: 'zone2_minutes', modality: 'wearables', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  temporal_compatibility: { max_signal_age_days: 30 },
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'zone2_minutes', direction: 'up', label: 'Weekly zone 2 minutes trend up to 120+.' },
  review_window: '4 weeks',
  evidence_chips: [{ observation_signal_id: 'zone2_minutes' }],
  ranking: { urgency: 0.45, evidence_quality: 0.75, modifiability: 0.85, retestability: 0.9 },
};

const APOB_ELEVATED: InterventionRule = {
  id: 'bio.apob.elevated.v1',
  version: '1.0.0',
  intervention_id: 'cardio.review_apob_with_clinician',
  domain: 'cardiometabolic',
  title: 'Review ApoB-lowering options with a clinician',
  why_personal: 'Your ApoB was {display_value}; the wellness target is {target_label}. ApoB counts every atherogenic particle and is one of the strongest cardiovascular risk markers.',
  steps: [
    'Book a primary-care or lipid-clinic appointment to review ApoB in context with LDL-C, Lp(a), and family history.',
    'Bring your current panel; ask whether intensified lifestyle or pharmacotherapy is appropriate.',
    'Plan a retest in 8-12 weeks after any intervention.',
  ],
  required: [
    { signal_id: 'apob', modality: 'biomarkers', status_in: ['watch', 'needs_attention'], direction_in: ['high'] },
  ],
  optional_modifiers: [
    { signal_id: 'ldl_c', modality: 'biomarkers', direction_in: ['high'] },
    { signal_id: 'lp_a', modality: 'biomarkers', direction_in: ['high'] },
  ],
  temporal_compatibility: { fusion_window_days: 60, max_signal_age_days: 365 },
  safety: { tier: 'prompt_review', message: 'Discuss with a clinician before changing medication.' },
  expected_result: { metric: 'apob', direction: 'down', label: 'ApoB trends toward target on the next panel.' },
  review_window: '8-12 weeks after intervention',
  comparability_requirements: ['Fasting state and same lab when retesting.'],
  evidence_chips: [
    { observation_signal_id: 'apob' },
    { observation_signal_id: 'ldl_c', hide_when_optimal: true },
    { observation_signal_id: 'lp_a', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.8, evidence_quality: 0.9, modifiability: 0.55, retestability: 0.85, corroboration_bonus: 0.1 },
};

const LDL_VERY_HIGH: InterventionRule = {
  id: 'bio.ldl_c.very_high.v1',
  version: '1.0.0',
  intervention_id: 'cardio.review_ldl_severe_with_clinician',
  domain: 'cardiometabolic',
  title: 'Discuss severely elevated LDL-C with a clinician promptly',
  why_personal: 'Your LDL-C was {display_value}; values above 190 mg/dL warrant clinician review for familial hypercholesterolaemia and treatment options.',
  steps: [
    'Book a clinician appointment in the next 2-4 weeks.',
    'Bring this panel and any family history of early cardiovascular disease.',
    'Discuss whether ApoB / Lp(a) follow-up testing and pharmacotherapy are indicated.',
  ],
  required: [
    { signal_id: 'ldl_c', modality: 'biomarkers', min_value: 190 },
  ],
  temporal_compatibility: { max_signal_age_days: 365 },
  safety: { tier: 'prompt_review', message: 'Discuss promptly with a clinician.' },
  expected_result: { metric: 'ldl_c', direction: 'down', label: 'LDL-C trends down with treatment plan.' },
  review_window: '8-12 weeks after intervention',
  evidence_chips: [{ observation_signal_id: 'ldl_c' }],
  ranking: { urgency: 0.95, evidence_quality: 0.95, modifiability: 0.55, retestability: 0.85 },
};

const HBA1C_ELEVATED: InterventionRule = {
  id: 'bio.hba1c.elevated.v1',
  version: '1.0.0',
  intervention_id: 'metabolic.glucose_retest_and_lifestyle',
  domain: 'glucose_metabolism',
  title: 'Retest glucose markers together and tighten metabolic routine',
  why_personal: 'Your HbA1c was {display_value}, above the {target_label} target. Pair retesting with concrete weekly habits.',
  steps: [
    'Plan a fasting glucose + insulin + HbA1c retest in 8-12 weeks.',
    'Add post-meal walks, two resistance sessions weekly, and consistent meal timing.',
    'Track weekly adherence and reassess at retest.',
  ],
  required: [
    { signal_id: 'hba1c', modality: 'biomarkers', status_in: ['watch', 'needs_attention'], direction_in: ['high'] },
  ],
  optional_modifiers: [
    { signal_id: 'fasting_glucose', modality: 'biomarkers', direction_in: ['high'] },
    { signal_id: 'fasting_insulin', modality: 'biomarkers', direction_in: ['high'] },
  ],
  temporal_compatibility: { fusion_window_days: 60, max_signal_age_days: 365 },
  safety: { tier: 'routine_review', message: 'Discuss persistent elevations with a clinician at your next visit.' },
  expected_result: { metric: 'hba1c', direction: 'down', label: 'HbA1c trends back toward 5.3% on retest.' },
  review_window: '8-12 weeks',
  comparability_requirements: ['Fasting state and same lab when retesting.'],
  evidence_chips: [
    { observation_signal_id: 'hba1c' },
    { observation_signal_id: 'fasting_glucose', hide_when_optimal: true },
    { observation_signal_id: 'fasting_insulin', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.75, evidence_quality: 0.85, modifiability: 0.7, retestability: 0.85, corroboration_bonus: 0.1 },
};

const HSCRP_ELEVATED: InterventionRule = {
  id: 'bio.hscrp.elevated.v1',
  version: '1.0.0',
  intervention_id: 'inflammation.investigate_drivers',
  domain: 'inflammation',
  title: 'Investigate inflammation drivers before changing supplements',
  why_personal: 'Your hs-CRP was {display_value}; the wellness band is {target_label}. Common drivers include sleep debt, training overreach, infection, oral health, and visceral fat.',
  steps: [
    'Audit recent infection, dental issues, alcohol intake, sleep debt, and training load.',
    'Address the most likely driver for 4-6 weeks before adding supplements.',
    'Plan a retest at 8-12 weeks.',
  ],
  required: [
    { signal_id: 'hs_crp', modality: 'biomarkers', status_in: ['watch', 'needs_attention'], direction_in: ['high'] },
  ],
  temporal_compatibility: { max_signal_age_days: 365 },
  safety: { tier: 'routine_review', message: 'If hs-CRP stays elevated, review causes with a clinician.' },
  expected_result: { metric: 'hs_crp', direction: 'down', label: 'hs-CRP trends back below 1 mg/L on retest.' },
  review_window: '8-12 weeks',
  comparability_requirements: ['Avoid retesting during acute illness or within 1 week of intense training.'],
  evidence_chips: [{ observation_signal_id: 'hs_crp' }],
  ranking: { urgency: 0.7, evidence_quality: 0.8, modifiability: 0.7, retestability: 0.8 },
};

const VITAMIN_D_LOW: InterventionRule = {
  id: 'bio.vitamin_d.low.v1',
  version: '1.0.0',
  intervention_id: 'micronutrient.vitamin_d_supplement',
  domain: 'micronutrient',
  title: 'Correct low vitamin D and retest in 8-12 weeks',
  why_personal: 'Your vitamin D was {display_value}; the wellness target is {target_label}.',
  steps: [
    'Start vitamin D3 1,000-2,000 IU/day with a fat-containing meal.',
    'Pair with weekly outdoor daylight where feasible.',
    'Retest 25-OH vitamin D in 8-12 weeks before adjusting dose.',
  ],
  required: [
    { signal_id: 'vitamin_d', modality: 'biomarkers', status_in: ['watch', 'needs_attention'], direction_in: ['low'] },
  ],
  temporal_compatibility: { max_signal_age_days: 365 },
  safety: { tier: 'self_directed', message: 'Self-directed; review dose with a clinician if you have kidney disease or take calcium-affecting medication.' },
  expected_result: { metric: 'vitamin_d', direction: 'up', label: '25-OH vitamin D rises into the wellness target band.' },
  review_window: '8-12 weeks',
  evidence_chips: [{ observation_signal_id: 'vitamin_d' }],
  ranking: { urgency: 0.4, evidence_quality: 0.85, modifiability: 0.9, retestability: 0.85 },
};

const FUSE_INFLAMMATION_RECOVERY: InterventionRule = {
  id: 'fuse.inflammation_recovery.v1',
  version: '1.0.0',
  intervention_id: 'fusion.inflammation_recovery_loop',
  domain: 'inflammation',
  title: 'Treat inflammation and recovery as one loop',
  why_personal: 'Your hs-CRP and recovery signals are both off-target. Sleep debt, alcohol, training overreach, and visceral fat are the strongest shared drivers.',
  steps: [
    'For two weeks: protect a 60-minute earlier bedtime, lower alcohol to zero, deload intense sessions, keep steps.',
    'Track sleep duration and HRV trend weekly.',
    'Reassess hs-CRP and wearable trends together at 8-12 weeks.',
  ],
  required: [
    { signal_id: 'hs_crp', modality: 'biomarkers', direction_in: ['high'] },
  ],
  optional_modifiers: [
    { signal_id: 'sleep_duration', modality: 'wearables', direction_in: ['low'] },
    { signal_id: 'hrv', modality: 'wearables', direction_in: ['low'] },
    { signal_id: 'recovery_score', modality: 'wearables', direction_in: ['low'] },
  ],
  temporal_compatibility: { fusion_window_days: 60, max_signal_age_days: 60 },
  safety: { tier: 'routine_review', message: 'If hs-CRP stays elevated, review causes with a clinician.' },
  expected_result: { metric: 'hs_crp', direction: 'down', label: 'hs-CRP trends down and recovery signals improve together.' },
  review_window: '8-12 weeks',
  comparability_requirements: ['Same wearable source and similar measurement window when retesting.'],
  evidence_chips: [
    { observation_signal_id: 'hs_crp' },
    { observation_signal_id: 'sleep_duration', hide_when_optimal: true },
    { observation_signal_id: 'hrv', hide_when_optimal: true },
    { observation_signal_id: 'recovery_score', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.75, evidence_quality: 0.8, modifiability: 0.7, retestability: 0.85, corroboration_bonus: 0.15 },
};

const FUSE_METABOLIC_ACTIVITY: InterventionRule = {
  id: 'fuse.metabolic_activity.v1',
  version: '1.0.0',
  intervention_id: 'fusion.metabolic_activity_floor',
  domain: 'glucose_metabolism',
  title: 'Make metabolic actions measurable with an activity floor',
  why_personal: 'Your glucose markers are off-target and your activity signal is below the wellness floor. Pair the retest plan with a weekly movement floor.',
  steps: [
    'Hit 8,000+ steps/day average and two resistance sessions/week.',
    'Plan a 30-40 minute zone 2 session twice weekly.',
    'Retest glucose markers in 8-12 weeks.',
  ],
  required: [
    { signal_id: 'hba1c', modality: 'biomarkers', direction_in: ['high'] },
  ],
  optional_modifiers: [
    { signal_id: 'fasting_glucose', modality: 'biomarkers', direction_in: ['high'] },
    { signal_id: 'steps', modality: 'wearables', direction_in: ['low'] },
    { signal_id: 'strength_sessions', modality: 'wearables', direction_in: ['low'] },
    { signal_id: 'zone2_minutes', modality: 'wearables', direction_in: ['low'] },
  ],
  temporal_compatibility: { fusion_window_days: 60, max_signal_age_days: 60 },
  safety: { tier: 'routine_review', message: 'Discuss persistent elevations with a clinician at your next visit.' },
  expected_result: { metric: 'hba1c', direction: 'down', label: 'HbA1c trends down with adherence to the activity floor.' },
  review_window: '8-12 weeks',
  comparability_requirements: ['Fasting state and same lab for biomarker retest.'],
  evidence_chips: [
    { observation_signal_id: 'hba1c' },
    { observation_signal_id: 'steps', hide_when_optimal: true },
    { observation_signal_id: 'strength_sessions', hide_when_optimal: true },
  ],
  ranking: { urgency: 0.75, evidence_quality: 0.8, modifiability: 0.75, retestability: 0.85, corroboration_bonus: 0.15 },
};

const CYP2C19_MEDICATION_SAFETY: InterventionRule = {
  id: 'gen.cyp2c19.medication_safety.v1',
  version: '1.0.0',
  intervention_id: 'pharmacology.cyp2c19_prescribing_note',
  domain: 'pharmacology',
  title: 'Carry your CYP2C19 result into prescribing conversations',
  why_personal: 'Your genotype includes a CYP2C19 variant that changes how your liver processes several common medications (e.g. clopidogrel, certain SSRIs, PPIs).',
  steps: [
    'Save a one-line summary of your CYP2C19 result alongside your medication list.',
    'Show it to a clinician or pharmacist before starting any new prescription.',
    'Do not start, stop, or change current medication on the basis of this genotype alone.',
  ],
  required: [
    { signal_id: 'cyp2c19_metabolizer', modality: 'genetics' },
  ],
  safety: { tier: 'medication_safety', message: 'Before changing medication, discuss with a clinician or pharmacist.' },
  expected_result: { metric: 'medication_safety_log', direction: 'stable', label: 'Pharmacogenomic note is available at your next prescribing conversation.' },
  review_window: 'Before any new prescription',
  evidence_chips: [
    { observation_signal_id: 'cyp2c19_metabolizer' },
  ],
  ranking: { urgency: 0.7, evidence_quality: 0.9, modifiability: 0.3, retestability: 0.1 },
};

const MTHFR_B_VITAMIN_SUPPORT: InterventionRule = {
  id: 'gen.mthfr.b_vitamin_support.v1',
  version: '1.0.0',
  intervention_id: 'nutrition.methylation_b_vitamin_support',
  domain: 'methylation_nutrition',
  title: 'Include B12 and folate-rich foods in your weekly routine',
  why_personal: 'You carry an MTHFR variant that reduces folate processing efficiency. A regular dietary supply supports methylation without supplements.',
  steps: [
    'Aim for leafy greens daily and one B12-rich food (eggs, fish, fortified products) on most days.',
    'If you take a multivitamin, prefer methylated folate (5-MTHF) over folic acid.',
    'If homocysteine is available, prefer that as the tracking metric over presuming pathway status from genotype alone.',
  ],
  required: [
    { signal_id: 'mthfr_c677t', modality: 'genetics', value_equals: 'homozygous' },
  ],
  safety: { tier: 'self_directed', message: 'You can start this on your own.' },
  expected_result: { metric: 'homocysteine', direction: 'stable', label: 'When homocysteine is tested, it remains within wellness band.' },
  review_window: 'Annual',
  evidence_chips: [{ observation_signal_id: 'mthfr_c677t' }],
  ranking: { urgency: 0.3, evidence_quality: 0.65, modifiability: 0.7, retestability: 0.5 },
};

export const INTERVENTION_RULES: InterventionRule[] = [
  SLEEP_DURATION_LOW,
  HRV_LOW,
  STEPS_LOW,
  STRENGTH_SESSIONS_LOW,
  ZONE2_LOW,
  APOB_ELEVATED,
  LDL_VERY_HIGH,
  HBA1C_ELEVATED,
  HSCRP_ELEVATED,
  VITAMIN_D_LOW,
  FUSE_INFLAMMATION_RECOVERY,
  FUSE_METABOLIC_ACTIVITY,
  CYP2C19_MEDICATION_SAFETY,
  MTHFR_B_VITAMIN_SUPPORT,
];

export interface SignalRequirementMatch {
  requirement: SignalRequirement;
  observation: NormalizedObservation;
}

/** Returns true if an observation satisfies a requirement. Pure / side-effect free. */
export function requirementMatches(req: SignalRequirement, obs: NormalizedObservation): boolean {
  if (req.signal_id !== obs.signal_id) return false;
  if (req.modality && obs.modality !== req.modality) return false;
  if (req.status_in) {
    if (!obs.status || !req.status_in.includes(obs.status)) return false;
  }
  if (req.direction_in) {
    if (!obs.direction || !req.direction_in.includes(obs.direction)) return false;
  }
  if (typeof obs.value === 'number') {
    if (req.min_value !== undefined && obs.value < req.min_value) return false;
    if (req.max_value !== undefined && obs.value > req.max_value) return false;
  }
  if (req.value_equals !== undefined && obs.value !== req.value_equals) return false;
  if (req.max_age_days !== undefined && obs.provenance.collected_at) {
    const collected = Date.parse(obs.provenance.collected_at);
    if (Number.isFinite(collected)) {
      const ageMs = Date.now() - collected;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays > req.max_age_days) return false;
    }
  }
  return true;
}
