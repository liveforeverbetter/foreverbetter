import type {
  BiomarkerAnalysisSummary,
  CrossModalAction,
  HealthDataModality,
  ModalityCard,
  MultiModalPlan,
  WearableAnalysisSummary,
} from '../../shared/dashboard-types.js';

export interface GenomicModalitySummary {
  connected: boolean;
  isWGS: boolean;
  trait_count: number;
  top_focus_areas: string[];
  action_count: number;
}

export interface MultiModalInput {
  genomics?: GenomicModalitySummary;
  biomarkers?: BiomarkerAnalysisSummary;
  wearables?: WearableAnalysisSummary;
}

function modalityStatus(connected: boolean, recommended: boolean): ModalityCard['status'] {
  if (connected) return 'connected';
  if (recommended) return 'recommended_next';
  return 'optional';
}

function modalityStatusLabel(status: ModalityCard['status']): string {
  if (status === 'connected') return 'Connected';
  if (status === 'recommended_next') return 'Next';
  if (status === 'optional') return 'Optional';
  return 'Not started';
}

function chooseNextUpload(input: MultiModalInput): HealthDataModality {
  if (!input.genomics?.connected) return 'genomics';
  if (!input.biomarkers || input.biomarkers.measured_count === 0) return 'biomarkers';
  if (!input.wearables || input.wearables.measured_count === 0) return 'wearables';
  const weakest = [
    { id: 'biomarkers' as const, score: input.biomarkers.score },
    { id: 'wearables' as const, score: input.wearables.score },
  ].sort((a, b) => a.score - b.score)[0];
  return weakest?.id ?? 'biomarkers';
}

function connectedState(input: MultiModalInput): string {
  const connected: string[] = [];
  if (input.genomics?.connected) connected.push(input.genomics.isWGS ? 'whole genome sequencing' : 'genetic file');
  if (input.biomarkers && input.biomarkers.measured_count > 0) connected.push(`${input.biomarkers.measured_count} biomarkers`);
  if (input.wearables && input.wearables.measured_count > 0) connected.push(`${input.wearables.measured_count} wearable signals`);
  if (connected.length === 0) return 'No health data is connected yet. Start with whichever file is easiest to access.';
  return `Connected data: ${connected.join(', ')}. The action plan should prioritize signals that are measured, modifiable, and retestable.`;
}

function genomicsActions(input: MultiModalInput): CrossModalAction[] {
  const genomics = input.genomics;
  if (!genomics?.connected) return [];
  const focus = genomics.top_focus_areas.slice(0, 3).join(', ') || 'top genetic focus areas';
  return [{
    title: 'Ground genetic findings in current biomarkers',
    priority: input.biomarkers && input.biomarkers.measured_count > 0 ? 'medium' : 'high',
    source_modalities: ['genomics'],
    rationale: `Genomics identifies stable predisposition and response patterns (${focus}), but biomarkers show whether those pathways are currently active.`,
    next_step: 'Upload a fasting biomarker panel before treating DNA-only findings as the main action driver.',
    retest_window: 'Annual full panel; targeted retest 8-12 weeks after intervention',
  }];
}

function fusionActions(input: MultiModalInput): CrossModalAction[] {
  const actions: CrossModalAction[] = [];
  const biomarkerFindings = input.biomarkers?.findings ?? [];
  const wearableFindings = input.wearables?.findings ?? [];
  const hasInflammation = biomarkerFindings.some(f => f.domain === 'inflammation_immune' && f.status !== 'optimal');
  const poorRecovery = wearableFindings.some(f => ['sleep_recovery', 'cardiovascular_recovery'].includes(f.domain) && f.status !== 'optimal');
  if (hasInflammation && poorRecovery) {
    actions.push({
      title: 'Treat inflammation and recovery as one loop',
      priority: 'high',
      source_modalities: ['biomarkers', 'wearables'],
      rationale: 'Inflammation markers and recovery signals are both off-target, so the first pass should look for sleep debt, overreaching, illness, alcohol, and visceral-fat drivers before niche supplements.',
      next_step: 'Run a 2-week recovery block: fixed wake time, lower alcohol, deload intense sessions, keep steps, then recheck wearable trends.',
      retest_window: '2-4 weeks for wearables; 8-12 weeks for hs-CRP/ferritin/homocysteine if elevated',
    });
  }

  const metabolic = biomarkerFindings.some(f => ['glucose_insulin', 'cardiometabolic'].includes(f.domain) && f.status !== 'optimal');
  const lowActivity = wearableFindings.some(f => f.domain === 'activity_training' && f.status !== 'optimal');
  if (metabolic && lowActivity) {
    actions.push({
      title: 'Make metabolic actions measurable with activity data',
      priority: 'high',
      source_modalities: ['biomarkers', 'wearables'],
      rationale: 'Cardiometabolic or glucose markers are off-target and activity/training signals are not yet strong enough to support the protocol.',
      next_step: 'Set a weekly floor: 8000 steps/day average, 2 strength sessions, and 120 minutes zone 2 before adding more complex interventions.',
      retest_window: '4 weeks for activity adherence; 8-12 weeks for glucose/lipid retest',
    });
  }

  if (input.genomics?.connected && input.biomarkers && input.biomarkers.measured_count > 0) {
    actions.push({
      title: 'Use biomarkers to validate genetic hypotheses',
      priority: 'medium',
      source_modalities: ['genomics', 'biomarkers'],
      rationale: 'The dashboard now has stable genetic context plus current blood chemistry, which is the minimum useful pair for a retestable wellness plan.',
      next_step: 'For each top genetic focus area, tag the matching biomarker endpoint before changing supplements or training.',
      retest_window: 'Annual full panel plus targeted 8-12 week retests',
    });
  }

  return actions;
}

function collectActions(input: MultiModalInput): CrossModalAction[] {
  const raw = [
    ...fusionActions(input),
    ...(input.biomarkers?.action_items ?? []),
    ...(input.wearables?.action_items ?? []),
    ...genomicsActions(input),
  ];
  const priorityWeight: Record<CrossModalAction['priority'], number> = { high: 3, medium: 2, low: 1 };
  const deduped = Array.from(new Map(raw.map(action => [action.title, action])).values());
  return deduped.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]).slice(0, 8);
}

export function buildMultiModalPlan(input: MultiModalInput): MultiModalPlan {
  const next = chooseNextUpload(input);
  const genomicsConnected = input.genomics?.connected ?? false;
  const biomarkersConnected = (input.biomarkers?.measured_count ?? 0) > 0;
  const wearablesConnected = (input.wearables?.measured_count ?? 0) > 0;
  const actions = collectActions(input);

  const genomicsStatus = modalityStatus(genomicsConnected, next === 'genomics');
  const biomarkerStatus = modalityStatus(biomarkersConnected, next === 'biomarkers');
  const wearableStatus = modalityStatus(wearablesConnected, next === 'wearables');

  return {
    summary: 'Each modality answers a different question: genetics shows predisposition, biomarkers show current state, and wearables show daily behavior. The plan is strongest when it can connect all three, but it must still be useful from any single starting point.',
    current_state: connectedState(input),
    next_best_upload: next,
    modalities: [
      {
        id: 'genomics',
        title: 'Genomics',
        status: genomicsStatus,
        status_label: modalityStatusLabel(genomicsStatus),
        desc: 'VCF/WGS interpretation, ClinVar, CPIC, PRS, aging hallmarks, and trait-to-protocol mapping.',
        accepted_formats: ['VCF', 'VCF.GZ', '23andMe raw text', 'AncestryDNA raw text'],
        examples: ['Dante Labs WGS', 'TellmeGen/WGS export', '23andMe', 'AncestryDNA'],
        action: genomicsConnected ? 'Use as stable predisposition and response context.' : 'Upload this if DNA is your easiest starting point.',
      },
      {
        id: 'biomarkers',
        title: 'Blood biomarkers',
        status: biomarkerStatus,
        status_label: modalityStatusLabel(biomarkerStatus),
        desc: 'Lab results turn genetic hypotheses into measurable baselines and annual change tracking.',
        accepted_formats: ['Lab PDF', 'CSV', 'manual marker table'],
        examples: ['Superpower-style 100+ marker panel', 'Lucis biomarker panel', 'local lab export'],
        action: biomarkersConnected ? 'Use off-target markers to choose the next retestable action.' : 'Upload next to make the plan retestable.',
      },
      {
        id: 'wearables',
        title: 'Wearables and behavior',
        status: wearableStatus,
        status_label: modalityStatusLabel(wearableStatus),
        desc: 'Daily behavior data explains sleep, recovery, strain, activity, and adherence signals between lab tests.',
        accepted_formats: ['CSV export', 'Apple Health export', 'API sync later'],
        examples: ['WHOOP', 'Oura', 'Apple Health', 'Garmin', 'OHealth'],
        action: wearablesConnected ? 'Use trends to explain why biomarkers improve, stall, or regress.' : 'Add after biomarkers to connect protocol adherence with outcomes.',
      },
    ],
    upload_path: [
      { label: '01', title: 'Start anywhere', body: 'Begin with one modality: genomics, blood biomarkers, or wearable exports. The dashboard should not block on missing data.' },
      { label: '02', title: 'Score independently', body: 'Analyze each modality on its own first so DNA, labs, and behavior do not blur into one unsupported claim.' },
      { label: '03', title: 'Fuse cautiously', body: 'Only combine modalities when they answer the same practical question and can change the next action.' },
      { label: '04', title: 'Retest and compare', body: 'Use annual labs and continuous behavior data to see what changed, what stayed stuck, and what deserves attention next.' },
    ],
    biomarker_domains: (input.biomarkers?.domains ?? []).slice(0, 4).map(domain => ({
      name: domain.name,
      status: domain.status === 'missing' ? 'missing' : domain.measured > 0 && domain.missing.length > 0 ? 'partial' : 'available',
      markers: domain.top_findings.length > 0 ? domain.top_findings : domain.missing.slice(0, 4),
      why_it_matters: domain.actions[0] ?? 'Adds current physiology and retestable endpoints to the plan.',
    })),
    wearable_domains: (input.wearables?.domains ?? []).slice(0, 3).map(domain => ({
      name: domain.name,
      status: domain.status === 'missing' ? 'missing' : domain.measured > 0 && domain.missing.length > 0 ? 'partial' : 'available',
      signals: domain.top_findings.length > 0 ? domain.top_findings : domain.missing.slice(0, 4),
      why_it_matters: domain.actions[0] ?? 'Adds behavior context between biomarker retests.',
    })),
    action_priorities: actions,
  };
}
