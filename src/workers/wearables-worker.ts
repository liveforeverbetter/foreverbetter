import { randomUUID } from 'node:crypto';
import { configuredStore } from '../configured-store.js';
import { runOuraWebhookSync, runWhoopWebhookSync } from '../core/wearable-sync.js';
import { emitWebhookEvent } from '../core/webhook-emit.js';
import type { ConnectorSyncRequest } from '../types.js';

const workerId = process.env.WEARABLE_SYNC_WORKER_ID ?? `wearables-worker-${randomUUID()}`;
const pollMs = Number(process.env.WEARABLE_SYNC_WORKER_POLL_MS ?? '10000');
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
  const job = await store.claimNextConnectorSyncJob(workerId);
  if (!job) return false;

  try {
    const request = job.request as unknown as ConnectorSyncRequest;
    const webhookProvider = job.provider === 'whoop' || request.source_provider === 'whoop'
      ? 'whoop'
      : job.provider === 'oura' || request.source_provider === 'oura'
        ? 'oura'
        : undefined;
    if (webhookProvider) {
      const result = webhookProvider === 'whoop'
        ? await runWhoopWebhookSync(request, store)
        : await runOuraWebhookSync(request, store);
      await store.completeConnectorSyncJob(job.id, {
        provider: result.provider,
        resource_type: result.resource_type,
        source_id: result.source?.id,
        normalized_observation_count: result.normalized_observations?.length ?? 0,
        readings_count: result.readings_count,
      });
      await emitWebhookEvent(store, 'wearables.data.updated', {
        userId: job.user_id,
        organizationId: job.organization_id,
        subjectId: result.source?.id ?? job.id,
        data: {
          provider: webhookProvider,
          resource_type: result.resource_type,
          readings_count: result.readings_count,
          source_id: result.source?.id,
          trace_id: request.webhook_trace_id,
        },
      });
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        worker_id: workerId,
        job_id: job.id,
        status: 'complete',
        provider: webhookProvider,
        resource_type: result.resource_type,
        source_id: result.source?.id,
        readings_count: result.readings_count,
      }));
      return true;
    }

    throw new Error(`Unsupported wearable sync job provider: ${job.provider}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await store.failConnectorSyncJob(job.id, message);
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
