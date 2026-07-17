import { InMemoryRateLimiter } from './rate-limit.js';

export interface UserQuota {
  windowMs: number;
  max: number;
}

export type UserQuotaId = 'imports.file' | 'analyses.create' | 'connections.sync';

export type UserQuotaConfig = Map<UserQuotaId, UserQuota>;

const QUOTA_IDS: UserQuotaId[] = ['imports.file', 'analyses.create', 'connections.sync'];

export function loadUserQuotaConfig(env: NodeJS.ProcessEnv = process.env): UserQuotaConfig {
  const config = new Map<UserQuotaId, UserQuota>();
  const raw = env.HEALTH_API_USER_QUOTAS;
  if (!raw) return config;

  const parsed = JSON.parse(raw) as Record<string, { window_ms?: number; windowMs?: number; max?: number }>;
  for (const id of QUOTA_IDS) {
    const item = parsed[id];
    if (!item) continue;
    const max = Number(item.max ?? 0);
    const windowMs = Number(item.window_ms ?? item.windowMs ?? 24 * 60 * 60 * 1000);
    if (Number.isFinite(max) && Number.isFinite(windowMs) && max > 0 && windowMs > 0) {
      config.set(id, { max, windowMs });
    }
  }
  return config;
}

export function assertUserQuota(
  limiter: InMemoryRateLimiter,
  config: UserQuotaConfig,
  id: UserQuotaId,
  userId: string,
  organizationId?: string,
): void {
  const quota = config.get(id);
  if (!quota) return;
  limiter.assertAllowed(`quota:${id}:${organizationId ?? 'no-org'}:${userId}`, quota);
}
