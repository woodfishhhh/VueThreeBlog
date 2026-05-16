interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  windowMs: number;
  max: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  public check(key: string, rule: RateLimitRule) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + rule.windowMs,
      });
      return { allowed: true as const, remaining: Math.max(rule.max - 1, 0), resetAt: now + rule.windowMs };
    }

    if (existing.count >= rule.max) {
      return {
        allowed: false as const,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    existing.count += 1;
    this.buckets.set(key, existing);
    return { allowed: true as const, remaining: Math.max(rule.max - existing.count, 0), resetAt: existing.resetAt };
  }
}
