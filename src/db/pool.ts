import pg from 'pg';

const { Pool } = pg;

// pg returns bigint/numeric as strings by default, which suits this schema
// (all ids are text and counts are read via Number()). We keep timestamptz as
// the ISO string Postgres emits so store rows match the in-memory shape.

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required when STORE_MODE=postgres.');
  }
  pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? '10'),
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_MS ?? '30000'),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? '10000'),
    ssl: databaseSsl(process.env),
  });
  // A pool-level error handler prevents an idle-client disconnect from crashing
  // the process; the next query re-establishes a connection.
  pool.on('error', (error) => {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'pg_pool_error', message: error.message }));
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = undefined;
  await current.end();
}

export function databaseSsl(env: NodeJS.ProcessEnv = process.env): pg.PoolConfig['ssl'] {
  const mode = (env.DATABASE_SSL ?? '').trim().toLowerCase();
  if (!mode || mode === 'disable' || mode === 'false' || mode === '0') return undefined;
  if (mode === 'require' || mode === 'true' || mode === '1' || mode === 'verify') {
    const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
    return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
  }
  if (mode === 'no-verify') {
    if (env.NODE_ENV === 'production') {
      throw new Error('DATABASE_SSL=no-verify is not allowed in production. Use DATABASE_SSL=require and configure DATABASE_SSL_CA when the server uses a private CA.');
    }
    return { rejectUnauthorized: false };
  }
  throw new Error('DATABASE_SSL must be disable, require, verify, or no-verify.');
}
