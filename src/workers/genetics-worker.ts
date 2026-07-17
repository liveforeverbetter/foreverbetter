import { randomUUID } from 'node:crypto';
import { configuredStore } from '../configured-store.js';
import { runGeneticsPipelineWithWriter } from '../core/genetics-runner.js';
import { upsertGeneticPipelineInterpretation } from '../core/genetic-analysis.js';

const workerId = process.env.HEALTH_ANALYSIS_WORKER_ID
  ?? process.env.GENOMIC_ANALYSIS_WORKER_ID
  ?? `health-analysis-worker-${randomUUID()}`;
const pollMs = Number(process.env.HEALTH_ANALYSIS_WORKER_POLL_MS ?? process.env.GENOMIC_ANALYSIS_WORKER_POLL_MS ?? '10000');
const once = process.argv.includes('--once');
const store = configuredStore();

async function main(): Promise<void> {
  do {
    const processed = await processNextJob();
    if (once) break;
    await sleep(processed ? 100 : pollMs);
  } while (true);
}

async function processNextJob(): Promise<boolean> {
  const job = await store.claimNextGeneticAnalysisJob(workerId);
  if (!job) return false;

  try {
    const [source, analysis] = await Promise.all([
      store.getSource(job.source_id),
      store.getAnalysis(job.analysis_id),
    ]);
    if (!source) throw new Error(`Source not found for genetic job: ${job.source_id}`);
    if (!analysis) throw new Error(`Analysis not found for genetic job: ${job.analysis_id}`);

    const pipeline = await runGeneticsPipelineWithWriter(
      job.user_id,
      source,
      inputPath => store.writeSourcePayloadToFile(source.id, inputPath),
      process.env,
      { annotation_depth: job.annotation_depth },
    );
    upsertGeneticPipelineInterpretation(analysis, source, pipeline, job.id);
    await store.saveAnalysis(analysis);

    if (pipeline.status === 'failed') {
      await store.failGeneticAnalysisJob(job.id, pipeline.summary);
    } else {
      await store.completeGeneticAnalysisJob(job.id, pipeline);
    }
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      worker_id: workerId,
      job_id: job.id,
      status: pipeline.status,
      analysis_id: job.analysis_id,
      source_id: job.source_id,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await store.failGeneticAnalysisJob(job.id, message);
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      worker_id: workerId,
      job_id: job.id,
      status: 'failed',
      error: message,
    }));
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
