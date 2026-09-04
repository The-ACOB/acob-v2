import "server-only";

type Bucket = { count: number; resetAt: number };

/**
 * Minimal in-memory, fixed-window rate limiter for auth endpoints
 * (login, register, forgot-password, resend-verification). Sufficient
 * for a single-instance deployment; a multi-instance production
 * deployment should swap this for a shared store (e.g. Upstash Redis)
 * without changing the call sites below.
 */
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}
