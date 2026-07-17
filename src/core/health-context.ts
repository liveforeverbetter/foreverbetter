import type { AnalysisResult, DerivedInterpretation, NormalizedObservation, SourceCategory } from '../types.js';

const MODALITIES: SourceCategory[] = ['wearables', 'biomarkers', 'genetics', 'behavioral'];

export interface HealthContextOptions {
  userId: string;
  organizationId?: string;
  observations: NormalizedObservation[];
  analyses: AnalysisResult[];
  maxFindings?: number;
}

export function buildHealthContext(input: HealthContextOptions) {
  const latestAnalysis = [...input.analyses].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const derived = input.analyses
    .flatMap(analysis => analysis.derived_interpretations)
    .sort((a, b) => severityRank(a) - severityRank(b));
  const observedModalities = new Set<SourceCategory>([
    ...input.observations.map(observation => observation.category),
    ...input.analyses.flatMap(analysis => analysis.raw_source_references.map(source => source.category)),
  ]);
  const sourceIds = new Set<string>([
    ...input.observations.map(observation => observation.source_id),
    ...input.analyses.flatMap(analysis => analysis.source_ids),
  ]);

  return {
    user_id: input.userId,
    organization_id: input.organizationId,
    generated_at: new Date().toISOString(),
    latest_analysis_id: latestAnalysis?.id,
    coverage: MODALITIES.map(modality => ({
      modality,
      present: observedModalities.has(modality),
      observations: input.observations.filter(observation => observation.category === modality).length,
      findings: derived.filter(item => item.category === modality).length,
    })),
    counts: {
      sources: sourceIds.size,
      observations: input.observations.length,
      analyses: input.analyses.length,
      derived_interpretations: derived.length,
    },
    priority_findings: derived.slice(0, Math.min(Math.max(input.maxFindings ?? 12, 1), 50)).map(findingSummary),
    modality_contexts: buildModalityContexts(input.observations, derived),
    data_gaps: MODALITIES
      .filter(modality => !observedModalities.has(modality))
      .map(modality => ({
        modality,
        impact: gapImpact(modality),
      })),
    provenance: {
      source_ids: Array.from(sourceIds),
      analysis_ids: input.analyses.map(analysis => analysis.id),
      clinical_boundary: 'Wellness, performance, longevity, and educational context only. Not diagnosis, treatment, or clinical decision support.',
    },
  };
}

function findingSummary(finding: DerivedInterpretation) {
  return {
    id: finding.id,
    category: finding.category,
    type: finding.type,
    title: finding.title,
    status: finding.status,
    score: finding.score,
    summary: finding.summary,
    action: finding.action,
    domain: rawString(finding.raw, 'domain'),
    inputs: rawStringArray(finding.raw, 'inputs'),
    provenance: finding.provenance,
  };
}

function buildModalityContexts(observations: NormalizedObservation[], derived: DerivedInterpretation[]) {
  const biomarkerFindings = derived.filter(finding => finding.category === 'biomarkers');
  const wearableFindings = derived.filter(finding => finding.category === 'wearables');
  const geneticFindings = derived.filter(finding => finding.category === 'genetics');
  const behavioralFindings = derived.filter(finding => finding.category === 'behavioral');
  const biomarkerIds = observedIds(observations, 'biomarkers');
  const wearableIds = observedIds(observations, 'wearables');

  return {
    biomarkers: {
      present: observations.some(observation => observation.category === 'biomarkers') || biomarkerFindings.length > 0,
      observed_markers: biomarkerIds,
      domains: domainSummaries(biomarkerFindings),
      derived_metrics: biomarkerFindings
        .filter(finding => finding.type === 'derived_biomarker')
        .map(finding => ({
          id: rawString(finding.raw, 'id') ?? finding.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          title: finding.title,
          status: finding.status,
          domain: rawString(finding.raw, 'domain'),
          inputs: rawStringArray(finding.raw, 'inputs'),
        })),
      missing_priority_markers: missingPriority(biomarkerIds, [
        'apob',
        'lp_a',
        'hba1c',
        'fasting_glucose',
        'fasting_insulin',
        'hs_crp',
        'vitamin_d',
        'tsh',
        'creatinine',
        'hemoglobin',
      ]),
    },
    wearables: {
      present: observations.some(observation => observation.category === 'wearables') || wearableFindings.length > 0,
      observed_signals: wearableIds,
      domains: domainSummaries(wearableFindings),
      missing_priority_signals: missingPriority(wearableIds, [
        'sleep_duration',
        'sleep_efficiency',
        'hrv',
        'resting_heart_rate',
        'steps',
        'zone2_minutes',
        'strength_sessions',
        'sleep_consistency',
      ]),
    },
    genetics: {
      present: observations.some(observation => observation.category === 'genetics') || geneticFindings.length > 0,
      source_count: observations.filter(observation => observation.category === 'genetics').length,
      worker_status: geneticsWorkerStatus(geneticFindings),
      reference_mode: geneticsReferenceMode(geneticFindings),
      setup_requirements: geneticFindings.some(finding => finding.status === 'setup_required')
        ? ['Configure a private WGS worker before returning variant interpretation.', 'Enable full dbSNP only after persistent reference storage is provisioned.']
        : [],
    },
    behavioral: {
      present: observations.some(observation => observation.category === 'behavioral') || behavioralFindings.length > 0,
      supplements: countBehavioral(observations, 'supplement'),
      medications: countBehavioral(observations, 'medication'),
      nutrition_metrics: countBehavioral(observations, 'nutrition_metric'),
      symptoms: countBehavioral(observations, 'symptom'),
      notes: countBehavioral(observations, 'behavioral_note'),
      domains: domainSummaries(behavioralFindings),
    },
  };
}

function countBehavioral(observations: NormalizedObservation[], type: string): number {
  return observations.filter(observation => observation.category === 'behavioral' && observation.type === type).length;
}

function observedIds(observations: NormalizedObservation[], category: SourceCategory): string[] {
  return Array.from(new Set(observations
    .filter(observation => observation.category === category)
    .map(observation => rawString(observation.raw, 'id') ?? observation.name)
    .filter((value): value is string => Boolean(value))
    .map(value => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')))).sort();
}

function domainSummaries(findings: DerivedInterpretation[]) {
  const groups = new Map<string, { total: number; needs_attention: number; watch: number; optimal: number; findings: string[] }>();
  for (const finding of findings) {
    const domain = rawString(finding.raw, 'domain') ?? 'general';
    const existing = groups.get(domain) ?? { total: 0, needs_attention: 0, watch: 0, optimal: 0, findings: [] };
    existing.total += 1;
    if (finding.status === 'needs_attention') existing.needs_attention += 1;
    if (finding.status === 'watch') existing.watch += 1;
    if (finding.status === 'optimal') existing.optimal += 1;
    existing.findings.push(finding.title);
    groups.set(domain, existing);
  }
  return Object.fromEntries(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function missingPriority(observed: string[], priorities: string[]): string[] {
  const observedSet = new Set(observed);
  return priorities.filter(id => !observedSet.has(id));
}

function geneticsWorkerStatus(findings: DerivedInterpretation[]): 'not_started' | 'setup_required' | 'queued' | 'running' | 'complete' | 'failed' {
  if (findings.some(finding => finding.status === 'failed')) return 'failed';
  if (findings.some(finding => finding.status === 'setup_required')) return 'setup_required';
  if (findings.some(finding => finding.status === 'queued')) return 'queued';
  if (findings.some(finding => finding.status === 'running')) return 'running';
  if (findings.some(finding => finding.status === 'complete')) return 'complete';
  return 'not_started';
}

function geneticsReferenceMode(findings: DerivedInterpretation[]): 'compact' | 'full_dbsnp' | 'not_configured' {
  const text = JSON.stringify(findings).toLowerCase();
  if (text.includes('full_dbsnp') || text.includes('full dbsnp')) return 'full_dbsnp';
  if (findings.length > 0) return 'compact';
  return 'not_configured';
}

function rawString(raw: unknown, key: string): string | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : undefined;
}

function rawStringArray(raw: unknown, key: string): string[] | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = (raw as Record<string, unknown>)[key];
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : undefined;
}

function severityRank(finding: DerivedInterpretation): number {
  if (finding.status === 'needs_attention') return 0;
  if (finding.status === 'watch') return 1;
  if (finding.status === 'failed') return 2;
  if (finding.status === 'setup_required') return 3;
  if (finding.status === 'queued') return 4;
  if (finding.status === 'complete') return 5;
  if (finding.status === 'optimal') return 6;
  return 7;
}

function gapImpact(modality: SourceCategory): string {
  if (modality === 'wearables') return 'Recovery, sleep, activity, and trend context may be missing.';
  if (modality === 'biomarkers') return 'Blood, metabolic, inflammation, nutrient, and endocrine context may be missing.';
  if (modality === 'genetics') return 'Inherited risk, pharmacology, and trait context may be missing.';
  return 'Lifestyle goals, habits, symptoms, and preference context may be missing.';
}
