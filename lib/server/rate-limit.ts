interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (buckets.size < 2000) return;
  for (const [k, b] of buckets.entries()) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number; remaining: number } {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    return { allowed: true, retryAfterSec: 0, remaining: limit };
  }
  if (cur.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
      remaining: 0,
    };
  }
  return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, limit - cur.count) };
}

export function recordRateLimitHit(key: string, windowMs: number): number {
  const now = Date.now();
  pruneExpired(now);
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  cur.count += 1;
  return cur.count;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "local";
}
