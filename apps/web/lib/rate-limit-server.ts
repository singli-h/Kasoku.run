/**
 * Server-side in-memory rate limiter for API routes.
 *
 * Uses a fixed window counter per user ID.
 * NOTE: Per-instance only (won't persist across Vercel cold starts).
 * For production scale, replace with Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries periodically (every 60s)
let lastCleanup = Date.now()
function cleanupStaleEntries() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Check and consume a rate limit token for a user.
 *
 * @param userId - The user identifier to rate limit
 * @param maxRequests - Maximum requests allowed in the window (default: 20)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Object with `allowed` boolean and `remaining` count
 */
export function checkServerRateLimit(
  userId: string,
  maxRequests = 20,
  windowMs = 60_000,
): { allowed: boolean; remaining: number } {
  cleanupStaleEntries()

  const now = Date.now()
  const entry = store.get(userId)

  if (!entry || now > entry.resetAt) {
    store.set(userId, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)
  return { allowed: entry.count <= maxRequests, remaining }
}
