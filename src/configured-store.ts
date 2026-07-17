import { PostgresHealthStore } from './connectors/postgres-store.js';
import { HealthApiStore, type HealthStore } from './store.js';

// STORE_MODE selects the backing store. `postgres` is the durable self-hosted
// default; `memory` is an ephemeral in-process store for tests and quick trials.
export function configuredStore(): HealthStore {
  const mode = (process.env.STORE_MODE ?? 'postgres').toLowerCase();
  if (mode === 'memory') return new HealthApiStore();
  if (mode === 'postgres') return new PostgresHealthStore();
  throw new Error(`Unsupported STORE_MODE "${mode}". Use "postgres" or "memory".`);
}
