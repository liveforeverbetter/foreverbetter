import { normalizeHealthConnectPayload, type HealthConnectSdkPayload } from '../core/health-connect.js';
import { configuredPayloadStore } from '../connectors/payload-store.js';
import { closePool, getPool } from '../db/pool.js';
import type { RawSourceReference } from '../types.js';

interface Args {
  userId: string;
  organizationId?: string;
}

function args(): Args {
  const values = process.argv.slice(2);
  const valueFor = (name: string) => values[values.indexOf(name) + 1];
  const userId = valueFor('--user-id');
  if (!userId) throw new Error('Usage: node dist/scripts/backfill-health-connect.js --user-id <id> [--organization-id <id>]');
  return { userId, organizationId: valueFor('--organization-id') };
}

function healthConnectPayload(value: Buffer): HealthConnectSdkPayload | undefined {
  try {
    const payload = JSON.parse(value.toString('utf8')) as HealthConnectSdkPayload;
    const provider = payload.provider?.toLowerCase();
    return (provider === 'google' || provider === 'health_connect') && payload.data ? payload : undefined;
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  const { userId, organizationId } = args();
  const pool = getPool();
  const payloads = configuredPayloadStore();
  const client = await pool.connect();
  const filter = organizationId ? 'and organization_id=$2' : '';
  const params = organizationId ? [userId, organizationId] : [userId];

  try {
    const result = await client.query<{
      id: string; user_id: string; organization_id: string; category: 'wearables'; provider: string;
      filename: string | null; content_type: string | null; byte_length: number | string;
      received_at: string | null; created_at: string; payload_object_key: string | null;
    }>(
      `select id, user_id, organization_id, category, provider, filename, content_type, byte_length,
              provenance->>'received_at' as received_at, created_at, payload_object_key
       from health_api.sources
       where user_id=$1 and category='wearables' and provider='health_connect' and deleted_at is null ${filter}
       order by created_at asc`,
      params,
    );

    let backfilledSources = 0;
    let observations = 0;
    let latestSyncedAt: string | undefined;
    let activeOrganizationId = organizationId;
    for (const row of result.rows) {
      if (!row.payload_object_key) continue;
      const payload = await payloads.download(row.payload_object_key);
      if (!payload) continue;
      const healthConnect = healthConnectPayload(payload);
      if (!healthConnect?.data) continue;
      const source: RawSourceReference = {
        id: row.id,
        user_id: row.user_id,
        organization_id: row.organization_id,
        category: 'wearables',
        provider: 'health_connect',
        filename: row.filename ?? undefined,
        content_type: row.content_type ?? undefined,
        received_at: row.received_at ?? row.created_at,
        byte_length: Number(row.byte_length),
        storage_mode: 'durable',
      };
      const normalized = normalizeHealthConnectPayload(source, healthConnect.data);
      await client.query('begin');
      await client.query('delete from health_api.observations where source_id=$1', [source.id]);
      // Insert the complete source in one statement. The original implementation
      // used one round trip per observation, which is needlessly disruptive for a
      // year of high-frequency Health Connect records.
      await client.query(
        `insert into health_api.observations (id, source_id, user_id, organization_id, type, marker, value, unit, observed_at, raw)
         select
           entry->>'id', entry->>'source_id', entry->>'user_id', entry->>'organization_id',
           entry->>'type', entry->>'name', coalesce(entry->'value', 'null'::jsonb), entry->>'unit',
           nullif(entry->>'observed_at', '')::timestamptz, entry
         from jsonb_array_elements($1::jsonb) as entry`,
        [JSON.stringify(normalized)],
      );
      await client.query('commit');
      backfilledSources += 1;
      observations += normalized.length;
      activeOrganizationId ??= source.organization_id;
      if (!latestSyncedAt || source.received_at > latestSyncedAt) latestSyncedAt = source.received_at;
    }

    if (activeOrganizationId && backfilledSources > 0) {
      await client.query(
        `insert into health_api.external_accounts (id, user_id, organization_id, provider, external_user_id, status, last_synced_at, metadata)
         values ($1,$2,$3,'wearables',$2,'active',$4,$5::jsonb)
         on conflict (user_id, organization_id, provider, external_user_id) do update set
           status='active', last_synced_at=coalesce(excluded.last_synced_at, health_api.external_accounts.last_synced_at),
           metadata=health_api.external_accounts.metadata || excluded.metadata, updated_at=now()`,
        [
          `acct_health_connect_${userId}`, userId, activeOrganizationId, latestSyncedAt ?? null, JSON.stringify({
        source_provider: 'health_connect',
        connection_type: 'mobile_bridge',
        mobile_sync_enabled: true,
        historical_backfill: true,
          }),
        ],
      );
    }

    console.log(JSON.stringify({ user_id: userId, sources: result.rowCount ?? 0, backfilled_sources: backfilledSources, observations, last_synced_at: latestSyncedAt }));
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => closePool());
