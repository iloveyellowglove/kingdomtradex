/**
 * In-memory rate limiter for authenticated API routes.
 * Rate limits by user ID (from session), not IP.
 * Uses globalThis Map to persist across hot reloads in development.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Check if a user is rate-limited for a given action.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const g = globalThis as Record<string, unknown>;
  const mapName = `__rateLimit_${key}`;
  const rateMap =
    (g[mapName] as Map<string, RateLimitEntry>) ??
    ((g[mapName] = new Map<string, RateLimitEntry>()) as Map<string, RateLimitEntry>);

  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now >= entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0,
  };
}

/**
 * Convenience: assert rate limit, return 429 response if exceeded.
 * Returns null if allowed, or a NextResponse if rate limited.
 */
export function applyRateLimit(
  userId: number,
  action: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const key = `${action}:${userId}`;
  const result = checkRateLimit(key, maxRequests, windowMs);
  return { allowed: result.allowed, remaining: result.remaining };
}
