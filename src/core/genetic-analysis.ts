import { createId, type HealthStore } from '../store.js';
import type { AnalysisResult, GeneticAnalysisJob, GeneticsAnnotationDepth, RawSourceReference } from '../types.js';
import { runGeneticsPipeline, type GeneticsPipelineOptions, type GeneticsPipelineResult } from './genetics-runner.js';

export async function enrichAnalysisWithGeneticPipeline(
  analysis: AnalysisResult,
  sources: RawSourceReference[],
  store: HealthStore,
  options: GeneticsPipelineOptions = {},
): Promise<AnalysisResult> {
  const geneticSources = sources.filter(source => source.category === 'genetics');
  for (const source of geneticSources) {
    if (healthAnalysisEnv('EXECUTION_MODE') === 'queue') {
      const job = await enqueueGeneticAnalysisJob(analysis, source, store, options.annotation_depth);
      upsertGeneticQueuedInterpretation(analysis, source, job);
      continue;
    }
    const pipeline = await runGeneticsPipeline(analysis.user_id, source, await store.getSourcePayload(source.id), process.env, options);
    upsertGeneticPipelineInterpretation(analysis, source, pipeline);
  }
  return analysis;
}

export function upsertGeneticPipelineInterpretation(
  analysis: AnalysisResult,
  source: RawSourceReference,
  pipeline: GeneticsPipelineResult,
  jobId?: string,
): AnalysisResult {
  const interpretation = {
    id: createId('der'),
    user_id: analysis.user_id,
    organization_id: analysis.organization_id,
    analysis_id: analysis.id,
    category: 'genetics' as const,
    type: pipeline.status === 'complete' ? 'genetic_pipeline_analysis' : pipeline.status,
    title: pipeline.status === 'complete' ? 'Genetic analysis completed' : pipeline.status === 'failed' ? 'Genetic analysis failed' : 'Genetic analysis setup required',
    status: pipeline.status,
    score: pipeline.raw?.gli,
    summary: pipeline.summary,
    action: actionForPipelineStatus(pipeline.status),
    provenance: {
      source_ids: [source.id],
      source_categories: ['genetics' as const],
      source_type: pipeline.status === 'complete' ? 'derived' as const : pipeline.status as 'setup_required' | 'failed',
      engine: 'bundled analyze-health pipeline',
      generated_at: new Date().toISOString(),
    },
    raw: { ...pipeline, job_id: jobId },
  };
  removeGeneticCardsAndInterpretations(analysis, source.id);
  analysis.derived_interpretations.push(interpretation);
  analysis.dashboard_spec.cards.unshift({
    id: interpretation.id,
    title: interpretation.title,
    category: 'genetics',
    score: interpretation.score,
    status: interpretation.status,
    summary: pipeline.status === 'complete'
      ? geneticSummary(pipeline.raw)
      : pipeline.summary,
    action: interpretation.action,
  });
  return analysis;
}

export async function enqueueGeneticAnalysisJob(
  analysis: AnalysisResult,
  source: RawSourceReference,
  store: HealthStore,
  annotationDepth?: GeneticsAnnotationDepth,
): Promise<GeneticAnalysisJob> {
  const now = new Date().toISOString();
  const job: GeneticAnalysisJob = {
    id: createId('wgsjob'),
    user_id: analysis.user_id,
    organization_id: analysis.organization_id,
    analysis_id: analysis.id,
    source_id: source.id,
    annotation_depth: annotationDepth,
    status: 'queued',
    attempts: 0,
    max_attempts: Number(healthAnalysisEnv('MAX_ATTEMPTS') ?? '3'),
    priority: Number(healthAnalysisEnv('QUEUE_PRIORITY') ?? '0'),
    created_at: now,
    updated_at: now,
  };
  await store.createGeneticAnalysisJob(job);
  return job;
}

function upsertGeneticQueuedInterpretation(
  analysis: AnalysisResult,
  source: RawSourceReference,
  job: GeneticAnalysisJob,
): AnalysisResult {
  const interpretation = {
    id: createId('der'),
    user_id: analysis.user_id,
    organization_id: analysis.organization_id,
    analysis_id: analysis.id,
    category: 'genetics' as const,
    type: 'genetic_pipeline_queued',
    title: 'Genetic analysis queued',
    status: 'queued',
    summary: 'The genetic source was accepted and queued for WGS/SNP-array interpretation by the hosted worker.',
    action: 'Wait for the WGS worker to complete, then re-read the analysis or dashboard spec.',
    provenance: {
      source_ids: [source.id],
      source_categories: ['genetics' as const],
      source_type: 'queued' as const,
      engine: 'health-api health analysis queue',
      generated_at: new Date().toISOString(),
    },
    raw: {
      job_id: job.id,
      status: job.status,
      attempts: job.attempts,
      max_attempts: job.max_attempts,
    },
  };
  removeGeneticCardsAndInterpretations(analysis, source.id);
  analysis.derived_interpretations.push(interpretation);
  analysis.dashboard_spec.cards.unshift({
    id: interpretation.id,
    title: interpretation.title,
    category: 'genetics',
    status: interpretation.status,
    summary: interpretation.summary,
    action: interpretation.action,
  });
  return analysis;
}

function removeGeneticCardsAndInterpretations(analysis: AnalysisResult, sourceId: string): void {
  const removedIds = new Set<string>();
  analysis.derived_interpretations = analysis.derived_interpretations.filter(item => {
    const remove = item.category === 'genetics' && item.provenance.source_ids.includes(sourceId);
    if (remove) removedIds.add(item.id);
    return !remove;
  });
  analysis.dashboard_spec.cards = analysis.dashboard_spec.cards.filter(card => !removedIds.has(card.id));
}

function actionForPipelineStatus(status: 'complete' | 'setup_required' | 'failed'): string {
  if (status === 'complete') return 'Review genetic findings with biomarker and wearable context. Treat clinical or medication findings as educational until confirmed by a qualified clinician.';
  if (status === 'setup_required') return 'Configure HEALTH_ANALYSIS_SKILL_DIR and durable genetic payload storage before running backend genetic interpretation in production.';
  return 'Inspect the pipeline error and run npm run doctor:vcf from the bundled analyze-health skill directory against the uploaded file.';
}

function geneticSummary(raw: Record<string, unknown> | undefined): string {
  if (!raw) return 'The uploaded genetic file was processed by the analyze-health pipeline.';
  const parts = [
    raw.gli != null ? `GLI ${raw.gli}${raw.gli_rating ? ` (${raw.gli_rating})` : ''}` : undefined,
    raw.variant_count != null ? `${raw.variant_count} variants` : undefined,
    raw.matched_marker_count != null ? `${raw.matched_marker_count} matched markers` : undefined,
    raw.cpic_actionable != null ? `${raw.cpic_actionable} CPIC matches` : undefined,
    raw.clinvar_pathogenic != null ? `${raw.clinvar_pathogenic} ClinVar pathogenic findings` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('; ') : 'The uploaded genetic file was processed by the analyze-health pipeline.';
}

function healthAnalysisEnv(name: string): string | undefined {
  return process.env[`HEALTH_ANALYSIS_${name}`] ?? process.env[`GENOMIC_ANALYSIS_${name}`];
}
