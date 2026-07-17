export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded.') {
    super(message);
  }
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
  ) {}

  assertAllowed(key: string, override?: { windowMs?: number; max?: number }): void {
    const max = override?.max ?? this.max;
    const windowMs = override?.windowMs ?? this.windowMs;
    if (max <= 0) return;
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      this.sweep(now);
      return;
    }
    bucket.count += 1;
    if (bucket.count > max) throw new RateLimitError();
  }

  private sweep(now: number): void {
    if (this.buckets.size < 1000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
