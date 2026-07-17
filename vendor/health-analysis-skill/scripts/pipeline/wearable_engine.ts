import type {
  CrossModalAction,
  SignalStatus,
  WearableAnalysisSummary,
  WearableDomainScore,
  WearableFinding,
} from '../../shared/dashboard-types.js';

export type WearableDomainId = 'sleep_recovery' | 'cardiovascular_recovery' | 'activity_training' | 'rhythm_consistency';

export interface WearableReading {
  id: string;
  value: number;
  unit?: string;
  window_days?: number;
}

interface WearableDefinition {
  id: string;
  aliases: string[];
  name: string;
  domain: WearableDomainId;
  unit: string;
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
  action_low?: string;
  action_high?: string;
}

const DOMAIN_NAMES: Record<WearableDomainId, string> = {
  sleep_recovery: 'Sleep and recovery',
  cardiovascular_recovery: 'Cardiovascular recovery',
  activity_training: 'Activity and training load',
  rhythm_consistency: 'Rhythm and consistency',
};

const DOMAIN_ACTIONS: Record<WearableDomainId, string> = {
  sleep_recovery: 'Protect sleep opportunity, consistent wake time, evening light hygiene, and recovery days before increasing training load.',
  cardiovascular_recovery: 'Track HRV and resting heart rate trends together; review illness, alcohol, sleep debt, heat, and overreaching when both worsen.',
  activity_training: 'Build a repeatable weekly movement floor before adding intensity; pair zone 2, resistance training, and step consistency.',
  rhythm_consistency: 'Stabilize bedtime, wake time, meals, caffeine, and alcohol timing so biomarker retests are easier to interpret.',
};

export const WEARABLE_DEFINITIONS: WearableDefinition[] = [
  { id: 'sleep_duration', aliases: ['total sleep', 'sleep hours', 'asleep duration'], name: 'Sleep duration', domain: 'sleep_recovery', unit: 'hours', optimal_min: 7, optimal_max: 9, critical_low: 6, critical_high: 10, action_low: 'Increase sleep opportunity by 30-60 minutes and protect a fixed wake time for two weeks.' },
  { id: 'sleep_efficiency', aliases: ['sleep efficiency'], name: 'Sleep efficiency', domain: 'sleep_recovery', unit: '%', optimal_min: 85, critical_low: 75, action_low: 'Review caffeine timing, alcohol, late meals, bedroom temperature, and wake-after-sleep-onset patterns.' },
  { id: 'sleep_performance', aliases: ['sleep performance', 'whoop sleep performance'], name: 'Sleep performance', domain: 'sleep_recovery', unit: '%', optimal_min: 85, critical_low: 70, action_low: 'Increase sleep need coverage before interpreting low recovery as a training-only problem.' },
  { id: 'deep_sleep', aliases: ['deep sleep duration', 'slow wave sleep'], name: 'Deep sleep', domain: 'sleep_recovery', unit: 'hours', optimal_min: 1.2, critical_low: 0.7, action_low: 'Prioritize total sleep, resistance training, cooler room temperature, and alcohol reduction.' },
  { id: 'light_sleep', aliases: ['light sleep duration'], name: 'Light sleep', domain: 'sleep_recovery', unit: 'hours', optimal_min: 2, optimal_max: 5.5, critical_low: 1, critical_high: 6.5 },
  { id: 'rem_sleep', aliases: ['rem sleep duration'], name: 'REM sleep', domain: 'sleep_recovery', unit: 'hours', optimal_min: 1.4, critical_low: 0.8, action_low: 'Review sleep duration, alcohol, stress, and early-morning awakenings before optimizing further.' },
  { id: 'recovery_score', aliases: ['whoop recovery', 'oura readiness', 'readiness'], name: 'Recovery/readiness score', domain: 'sleep_recovery', unit: '%', optimal_min: 70, critical_low: 45, action_low: 'Use low-recovery days for lower-intensity training, more daylight, hydration, and earlier bedtime.' },
  { id: 'sleep_debt_minutes', aliases: ['sleep debt', 'sleep debt minutes'], name: 'Sleep debt', domain: 'sleep_recovery', unit: 'minutes', optimal_max: 30, critical_high: 90, action_high: 'Repay sleep debt before adding training intensity or interpreting hormonal and glucose signals.' },
  { id: 'nap_minutes', aliases: ['nap duration', 'napping minutes'], name: 'Nap duration', domain: 'sleep_recovery', unit: 'minutes', optimal_max: 45, critical_high: 90, action_high: 'Keep naps earlier and shorter so they do not erode night sleep consistency.' },

  { id: 'hrv', aliases: ['heart rate variability', 'rmssd'], name: 'HRV', domain: 'cardiovascular_recovery', unit: 'ms', optimal_min: 45, critical_low: 25, action_low: 'Interpret against your own baseline; review sleep debt, alcohol, illness, stress, and training load.' },
  { id: 'resting_heart_rate', aliases: ['rhr', 'resting hr'], name: 'Resting heart rate', domain: 'cardiovascular_recovery', unit: 'bpm', optimal_max: 60, critical_high: 75, action_high: 'If elevated versus baseline, review illness, alcohol, heat, dehydration, sleep debt, and overtraining.' },
  { id: 'average_heart_rate', aliases: ['avg heart rate', 'average hr'], name: 'Average heart rate', domain: 'cardiovascular_recovery', unit: 'bpm', optimal_max: 75, critical_high: 90, action_high: 'Review heat, illness, caffeine, stress, and training load if average heart rate is elevated.' },
  { id: 'max_heart_rate', aliases: ['maximum heart rate', 'max hr'], name: 'Max heart rate', domain: 'activity_training', unit: 'bpm', optimal_max: 190, critical_high: 205, action_high: 'Use max heart rate alongside workout context; investigate unexplained spikes or device artifacts.' },
  { id: 'respiratory_rate', aliases: ['respiration rate'], name: 'Respiratory rate', domain: 'cardiovascular_recovery', unit: 'rpm', optimal_min: 12, optimal_max: 18, critical_high: 22, action_high: 'Watch for illness, altitude, asthma/allergy, or acute stress if this rises above baseline.' },
  { id: 'spo2', aliases: ['oxygen saturation', 'blood oxygen'], name: 'Oxygen saturation', domain: 'cardiovascular_recovery', unit: '%', optimal_min: 95, critical_low: 92, action_low: 'Review device fit, sleep-disordered breathing risk, altitude, and clinician follow-up for persistent lows.' },
  { id: 'skin_temperature', aliases: ['skin temp', 'skin temperature celsius'], name: 'Skin temperature', domain: 'cardiovascular_recovery', unit: 'C', optimal_min: 32, optimal_max: 35, critical_low: 30, critical_high: 37, action_high: 'Treat temperature elevation as illness, heat, alcohol, or cycle-context signal before pushing training.' },

  { id: 'steps', aliases: ['daily steps'], name: 'Daily steps', domain: 'activity_training', unit: 'steps', optimal_min: 8000, critical_low: 4000, action_low: 'Raise baseline by 1000-2000 steps/day before adding harder conditioning.' },
  { id: 'daily_heart_minutes', aliases: ['heart minutes daily', 'google heart minutes'], name: 'Daily heart minutes', domain: 'activity_training', unit: 'min/day', optimal_min: 22, critical_low: 10, action_low: 'Reach 150+ heart minutes/week (≥22/day) through walking, cycling, or swimming at a pace where conversation is difficult.' },
  { id: 'daily_active_minutes', aliases: ['move minutes', 'active minutes daily'], name: 'Daily active minutes', domain: 'activity_training', unit: 'min/day', optimal_min: 30, critical_low: 15, action_low: 'Add 10-15 minutes of light movement (walking, stretching) to reach 30 active minutes daily.' },
  { id: 'zone2_minutes', aliases: ['zone 2', 'moderate cardio minutes'], name: 'Zone 2 minutes', domain: 'activity_training', unit: 'min/week', optimal_min: 120, critical_low: 60, action_low: 'Build toward 120-180 weekly minutes of conversational aerobic work.' },
  { id: 'vigorous_minutes', aliases: ['vigorous activity', 'zone 4 minutes', 'zone 5 minutes'], name: 'Vigorous minutes', domain: 'activity_training', unit: 'min/week', optimal_min: 30, optimal_max: 120, critical_low: 10, critical_high: 180, action_low: 'Add one short interval or hill session after sleep and injury risk are stable.', action_high: 'Check recovery, injury risk, and HRV/RHR before adding more intensity.' },
  { id: 'workout_count', aliases: ['workouts', 'workout sessions'], name: 'Workout count', domain: 'activity_training', unit: 'sessions/week', optimal_min: 2, optimal_max: 6, critical_low: 1, action_low: 'Add one planned training session once sleep and recovery are stable.' },
  { id: 'strength_sessions', aliases: ['lifting sessions', 'resistance sessions'], name: 'Strength sessions', domain: 'activity_training', unit: 'sessions/week', optimal_min: 2, optimal_max: 5, critical_low: 1, action_low: 'Add two full-body resistance sessions weekly before optimizing supplements.' },
  { id: 'vo2max_estimate', aliases: ['vo2 max', 'cardio fitness'], name: 'VO2max estimate', domain: 'activity_training', unit: 'mL/kg/min', optimal_min: 40, critical_low: 30, action_low: 'Use aerobic base plus one weekly intensity session and retest after 8-12 weeks.' },
  { id: 'strain', aliases: ['whoop strain', 'training strain'], name: 'Training strain', domain: 'activity_training', unit: 'score', optimal_min: 8, optimal_max: 16, critical_high: 19, action_high: 'Pair high strain with recovery trends; deload if HRV drops and RHR rises.' },

  { id: 'sleep_consistency', aliases: ['sleep regularity', 'bedtime consistency'], name: 'Sleep consistency', domain: 'rhythm_consistency', unit: '%', optimal_min: 80, critical_low: 60, action_low: 'Anchor wake time and keep bedtime within a 60-minute window most nights.' },
  { id: 'bedtime_variability', aliases: ['bedtime variation'], name: 'Bedtime variability', domain: 'rhythm_consistency', unit: 'minutes', optimal_max: 60, critical_high: 120, action_high: 'Stabilize bedtime before interpreting HRV, glucose, or cortisol trends.' },
  { id: 'wake_variability', aliases: ['wake time variation'], name: 'Wake-time variability', domain: 'rhythm_consistency', unit: 'minutes', optimal_max: 60, critical_high: 120, action_high: 'Anchor wake time first; it is the easiest rhythm lever to standardize.' },
  { id: 'alcohol_days', aliases: ['alcohol nights', 'drinking days'], name: 'Alcohol days', domain: 'rhythm_consistency', unit: 'days/week', optimal_max: 1, critical_high: 4, action_high: 'Run a 2-week alcohol-free recovery experiment and compare HRV, RHR, sleep, and glucose.' },
];

function normalizeId(id: string): string {
  return id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildDefinitionMap(): Map<string, WearableDefinition> {
  const map = new Map<string, WearableDefinition>();
  for (const def of WEARABLE_DEFINITIONS) {
    map.set(normalizeId(def.id), def);
    map.set(normalizeId(def.name), def);
    for (const alias of def.aliases) map.set(normalizeId(alias), def);
  }
  return map;
}

const DEF_BY_ID = buildDefinitionMap();

function scoreReading(value: number, def: WearableDefinition): { status: SignalStatus; score: number; direction: 'low' | 'high' | 'ok' } {
  if (def.critical_low != null && value < def.critical_low) return { status: 'needs_attention', score: 25, direction: 'low' };
  if (def.critical_high != null && value > def.critical_high) return { status: 'needs_attention', score: 25, direction: 'high' };
  if (def.optimal_min != null && value < def.optimal_min) {
    const floor = def.critical_low ?? 0;
    const span = Math.max(0.001, def.optimal_min - floor);
    return { status: 'watch', score: Math.max(35, Math.round(70 - ((def.optimal_min - value) / span) * 35)), direction: 'low' };
  }
  if (def.optimal_max != null && value > def.optimal_max) {
    const ceiling = def.critical_high ?? def.optimal_max * 1.5;
    const span = Math.max(0.001, ceiling - def.optimal_max);
    return { status: 'watch', score: Math.max(35, Math.round(70 - ((value - def.optimal_max) / span) * 35)), direction: 'high' };
  }
  return { status: 'optimal', score: 90, direction: 'ok' };
}

function statusFromScore(score: number): SignalStatus {
  if (score >= 80) return 'optimal';
  if (score >= 55) return 'watch';
  return 'needs_attention';
}

function targetLabelFor(def: WearableDefinition): string {
  const suffix = def.unit ? ` ${def.unit}` : '';
  if (def.optimal_min != null && def.optimal_max != null) return `${def.optimal_min}-${def.optimal_max}${suffix}`;
  if (def.optimal_min != null) return `>=${def.optimal_min}${suffix}`;
  if (def.optimal_max != null) return `<=${def.optimal_max}${suffix}`;
  return 'Expected pattern';
}

function statusLabelFor(status: SignalStatus): string {
  if (status === 'optimal') return 'In target';
  if (status === 'watch') return 'Monitor';
  if (status === 'needs_attention') return 'Act on this';
  return 'Not measured';
}

function interpretationFor(def: WearableDefinition, value: number, status: SignalStatus, direction: 'low' | 'high' | 'ok'): string {
  if (status === 'optimal') return `${def.name} is in the target range for the selected averaging window.`;
  return `${def.name} is ${direction} versus the current wellness target: ${value} ${def.unit}.`;
}

function actionFor(def: WearableDefinition, status: SignalStatus, direction: 'low' | 'high' | 'ok'): string {
  if (status === 'optimal') return `Maintain current behavior and compare ${def.name} against biomarker changes over time.`;
  if (direction === 'low' && def.action_low) return def.action_low;
  if (direction === 'high' && def.action_high) return def.action_high;
  return DOMAIN_ACTIONS[def.domain];
}

function domainScores(findings: WearableFinding[]): WearableDomainScore[] {
  return (Object.keys(DOMAIN_NAMES) as WearableDomainId[]).map((domain) => {
    const defs = WEARABLE_DEFINITIONS.filter(d => d.domain === domain);
    const domainFindings = findings.filter(f => f.domain === domain);
    const measuredIds = new Set(domainFindings.map(f => f.id));
    const missing = defs.filter(d => !measuredIds.has(d.id)).slice(0, 5).map(d => d.name);
    const score = domainFindings.length
      ? Math.round(domainFindings.reduce((sum, f) => sum + f.score, 0) / domainFindings.length)
      : 0;
    const top = domainFindings.slice().sort((a, b) => a.score - b.score).slice(0, 3);
    return {
      id: domain,
      name: DOMAIN_NAMES[domain],
      score,
      status: domainFindings.length ? statusFromScore(score) : 'missing',
      measured: domainFindings.length,
      missing,
      top_findings: top.map(f => `${f.name}: ${f.status}`),
      actions: top.length ? Array.from(new Set(top.map(f => f.action))).slice(0, 3) : [DOMAIN_ACTIONS[domain]],
    };
  });
}

function buildActions(findings: WearableFinding[], domains: WearableDomainScore[]): CrossModalAction[] {
  const actions = findings
    .filter(f => f.status !== 'optimal')
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((f): CrossModalAction => ({
      title: `Improve ${f.name}`,
      priority: f.status === 'needs_attention' ? 'high' : 'medium',
      source_modalities: ['wearables'],
      rationale: f.interpretation,
      next_step: f.action,
      retest_window: '2-4 weeks for behavior trend; compare against next biomarker cycle',
    }));
  if (actions.length > 0) return actions;
  const strongestDomain = domains.slice().sort((a, b) => b.measured - a.measured)[0];
  return [{
    title: 'Preserve behavior baseline',
    priority: 'low',
    source_modalities: ['wearables'],
    rationale: strongestDomain ? `${strongestDomain.name} has a usable behavior baseline.` : 'No concerning wearable signals were detected in the provided values.',
    next_step: 'Keep the same wearable source and averaging window so trend comparisons stay clean.',
    retest_window: 'Monthly behavior review and annual biomarker comparison',
  }];
}

export function analyzeWearables(inputReadings: WearableReading[]): WearableAnalysisSummary {
  const findings: WearableFinding[] = [];
  for (const reading of inputReadings) {
    const def = DEF_BY_ID.get(normalizeId(reading.id));
    if (!def || !Number.isFinite(reading.value)) continue;
    const scored = scoreReading(reading.value, def);
    findings.push({
      id: def.id,
      name: def.name,
      domain: def.domain,
      value: reading.value,
      unit: reading.unit || def.unit,
      status: scored.status,
      status_label: statusLabelFor(scored.status),
      target_label: targetLabelFor(def),
      direction: scored.direction,
      score: scored.score,
      interpretation: interpretationFor(def, reading.value, scored.status, scored.direction),
      action: actionFor(def, scored.status, scored.direction),
    });
  }

  const deduped = Array.from(new Map(findings.map(f => [f.id, f])).values());
  const domains = domainScores(deduped);
  const measuredDomains = domains.filter(d => d.measured > 0);
  const score = measuredDomains.length
    ? Math.round(measuredDomains.reduce((sum, d) => sum + d.score, 0) / measuredDomains.length)
    : 0;
  const measuredIds = new Set(deduped.map(f => f.id));
  const missingPriority = ['sleep_duration', 'hrv', 'resting_heart_rate', 'steps', 'zone2_minutes', 'strength_sessions', 'sleep_consistency']
    .filter(id => !measuredIds.has(id))
    .map(id => WEARABLE_DEFINITIONS.find(d => d.id === id)?.name || id);

  return {
    score,
    status: measuredDomains.length ? statusFromScore(score) : 'missing',
    measured_count: deduped.length,
    total_supported: WEARABLE_DEFINITIONS.length,
    domains,
    findings: deduped
      .sort((a, b) => a.score - b.score)
      .map((finding) => {
        if (finding.status === 'optimal') return finding;
        const previousRanks = deduped.filter(item => item.status !== 'optimal' && item.score < finding.score).length;
        return { ...finding, priority_rank: previousRanks + 1 };
      }),
    missing_priority: missingPriority,
    action_items: buildActions(deduped, domains),
  };
}
