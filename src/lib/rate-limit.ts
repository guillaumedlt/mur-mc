/**
 * Simple in-memory rate limiter for API routes.
 * Tracks calls per user per endpoint with a sliding window.
 *
 * Limits:
 * - Free users: 3 AI calls / day
 * - Pro users: 30 AI calls / day
 * - Recruiter: 50 AI calls / day
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const LIMITS: Record<string, number> = {
  free: 3,
  pro: 30,
  recruiter: 50,
};

/**
 * Check if a user can make an AI call.
 * Returns { allowed, remaining, resetAt } or { allowed: false, ... }
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  tier: "free" | "pro" | "recruiter" = "free",
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const limit = LIMITS[tier] ?? LIMITS.free;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now };
}

// Cleanup stale entries every hour
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60 * 60 * 1000);
}
