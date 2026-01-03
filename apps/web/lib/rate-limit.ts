/**
 * Simple client-side rate limiting using localStorage
 *
 * This is a minimal guardrail, not a security feature.
 * For production, implement server-side rate limiting.
 */

const STORAGE_KEY_PREFIX = "kasoku_rate_limit_"

interface RateLimitState {
  count: number
  resetAt: number // Unix timestamp
}

/**
 * Check if an action is rate limited
 * @param key - Unique identifier for the rate limit (e.g., "ai_parse_results")
 * @param limit - Maximum number of calls allowed
 * @param windowMs - Time window in milliseconds (default: 24 hours)
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): { allowed: boolean; remaining: number; resetsIn: number } {
  if (typeof window === "undefined") {
    // Server-side: always allow (rate limit is client-side only)
    return { allowed: true, remaining: limit, resetsIn: 0 }
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${key}`
  const now = Date.now()

  try {
    const stored = localStorage.getItem(storageKey)
    let state: RateLimitState

    if (stored) {
      state = JSON.parse(stored)

      // Check if window has expired
      if (now >= state.resetAt) {
        // Reset the window
        state = { count: 0, resetAt: now + windowMs }
      }
    } else {
      // First call
      state = { count: 0, resetAt: now + windowMs }
    }

    const remaining = Math.max(0, limit - state.count)
    const resetsIn = Math.max(0, state.resetAt - now)

    return {
      allowed: state.count < limit,
      remaining,
      resetsIn,
    }
  } catch {
    // If localStorage fails, allow the action
    return { allowed: true, remaining: limit, resetsIn: 0 }
  }
}

/**
 * Increment the rate limit counter after a successful action
 * @param key - Unique identifier for the rate limit
 * @param windowMs - Time window in milliseconds
 */
export function incrementRateLimit(
  key: string,
  windowMs: number = 24 * 60 * 60 * 1000
): void {
  if (typeof window === "undefined") return

  const storageKey = `${STORAGE_KEY_PREFIX}${key}`
  const now = Date.now()

  try {
    const stored = localStorage.getItem(storageKey)
    let state: RateLimitState

    if (stored) {
      state = JSON.parse(stored)

      if (now >= state.resetAt) {
        state = { count: 1, resetAt: now + windowMs }
      } else {
        state.count++
      }
    } else {
      state = { count: 1, resetAt: now + windowMs }
    }

    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Format remaining time until reset
 */
export function formatResetsIn(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
