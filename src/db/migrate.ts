import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type pg from 'pg';
import { getPool } from './pool.js';

// A fixed advisory-lock key so concurrent api/worker containers serialize
// migration application on first boot instead of racing. Any constant works;
// this one is derived from "health_api migrate".
const MIGRATION_LOCK_KEY = 4820251371n;

export function migrationsDir(): string {
  return process.env.MIGRATIONS_DIR ?? resolve(process.cwd(), 'migrations');
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

export async function runMigrations(pool: pg.Pool = getPool(), dir: string = migrationsDir()): Promise<MigrationResult> {
  const files = (await readdir(dir)).filter(name => name.endsWith('.sql')).sort();
  const client = await pool.connect();
  const applied: string[] = [];
  const skipped: string[] = [];
  try {
    await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
    await client.query('create schema if not exists health_api');
    await client.query(`
      create table if not exists health_api.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const { rows } = await client.query<{ filename: string }>('select filename from health_api.schema_migrations');
    const done = new Set(rows.map(row => row.filename));

    for (const file of files) {
      if (done.has(file)) {
        skipped.push(file);
        continue;
      }
      const sql = await readFile(resolve(dir, file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into health_api.schema_migrations (filename) values ($1)', [file]);
        await client.query('commit');
        applied.push(file);
        console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'migration_applied', file }));
      } catch (error) {
        await client.query('rollback');
        throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => undefined);
    client.release();
  }
  return { applied, skipped };
}

// Allow `node dist/db/migrate.js` / `tsx src/db/migrate.ts` as a standalone
// entrypoint so operators can apply migrations without booting the API.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(result => {
      console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'migrations_complete', ...result }));
      return closePoolQuietly();
    })
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}

async function closePoolQuietly(): Promise<void> {
  const { closePool } = await import('./pool.js');
  await closePool();
}
