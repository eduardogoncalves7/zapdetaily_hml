export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Entry = { count: number; resetAt: number };

export class AttemptRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly maxAttempts: number, private readonly windowMs: number) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    if (current.count >= this.maxAttempts) {
      return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
    }
    current.count += 1;
    return { allowed: true };
  }

  reset(key: string): void { this.entries.delete(key); }
}
