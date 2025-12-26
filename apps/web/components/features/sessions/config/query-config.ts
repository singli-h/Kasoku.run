/**
 * Sessions Query Configuration
 * Centralized configuration for TanStack Query with optimized caching strategies
 * for group training sessions and athlete performance tracking
 *
 * @see docs/patterns/react-query-caching-pattern.md for usage guidelines
 */

// Query keys for sessions-related data
export const SESSIONS_QUERY_KEYS = {
  // Session queries
  SESSION: (sessionId: number) => ['session', sessionId] as const,
  SESSIONS_TODAY: ['sessions-today'] as const,
  SESSIONS_BY_GROUP: (groupId: number) => ['sessions', 'group', groupId] as const,
  SESSIONS_BY_DATE: (date: string) => ['sessions', 'date', date] as const,
  SESSIONS_HISTORY: (page: number, filters: Record<string, unknown>) =>
    ['sessions', 'history', page, filters] as const,

  // Group session data (athletes, exercises, performance)
  GROUP_SESSION_DATA: (sessionId: number) => ['group-session-data', sessionId] as const,

  // Performance queries
  ATHLETE_PERFORMANCE: (sessionId: number, athleteId: number) =>
    ['athlete-performance', sessionId, athleteId] as const,
  EXERCISE_PERFORMANCE: (sessionId: number, exerciseId: number) =>
    ['exercise-performance', sessionId, exerciseId] as const,

  // Personal bests
  PERSONAL_BESTS: (athleteId: number) => ['personal-bests', athleteId] as const,
} as const

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data - active session needs fresh data
  SESSION: 60 * 1000, // 1 minute
  SESSIONS_TODAY: 30 * 1000, // 30 seconds
  GROUP_SESSION_DATA: 60 * 1000, // 1 minute

  // Medium-lived data
  SESSIONS_BY_GROUP: 5 * 60 * 1000, // 5 minutes
  SESSIONS_BY_DATE: 5 * 60 * 1000, // 5 minutes
  SESSIONS_HISTORY: 10 * 60 * 1000, // 10 minutes

  // Performance data - frequently updated during session
  ATHLETE_PERFORMANCE: 30 * 1000, // 30 seconds
  EXERCISE_PERFORMANCE: 30 * 1000, // 30 seconds

  // Longer-lived reference data
  PERSONAL_BESTS: 15 * 60 * 1000, // 15 minutes
} as const

// Stale time configurations (in milliseconds)
export const STALE_TIMES = {
  // Fresh data - coach needs real-time view
  SESSION: 15 * 1000, // 15 seconds
  SESSIONS_TODAY: 15 * 1000, // 15 seconds
  GROUP_SESSION_DATA: 30 * 1000, // 30 seconds

  // Moderately fresh
  SESSIONS_BY_GROUP: 2 * 60 * 1000, // 2 minutes
  SESSIONS_BY_DATE: 2 * 60 * 1000, // 2 minutes
  SESSIONS_HISTORY: 5 * 60 * 1000, // 5 minutes

  // Performance during active session
  ATHLETE_PERFORMANCE: 10 * 1000, // 10 seconds
  EXERCISE_PERFORMANCE: 10 * 1000, // 10 seconds

  // Reference data
  PERSONAL_BESTS: 10 * 60 * 1000, // 10 minutes
} as const

// Retry configurations
export const RETRY_CONFIG = {
  // Critical data - session operations
  CRITICAL: {
    retries: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Standard data
  STANDARD: {
    retries: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  },

  // Background/historical data
  BACKGROUND: {
    retries: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },
} as const

// Query invalidation helpers
export const INVALIDATION_PATTERNS = {
  // Invalidate single session
  SESSION: (sessionId: number) => [
    SESSIONS_QUERY_KEYS.SESSION(sessionId),
    SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
  ],

  // Invalidate all sessions for today
  TODAY: () => [
    SESSIONS_QUERY_KEYS.SESSIONS_TODAY,
  ],

  // Invalidate performance data for a session
  PERFORMANCE: (sessionId: number) => [
    SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
  ],

  // Invalidate athlete's personal bests
  PERSONAL_BESTS: (athleteId: number) => [
    SESSIONS_QUERY_KEYS.PERSONAL_BESTS(athleteId),
  ],
} as const

// Prefetch strategies
export const PREFETCH_STRATEGIES = {
  // Prefetch session details when hovering over session card
  SESSION: (sessionId: number) => ({
    queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId),
    staleTime: STALE_TIMES.SESSION,
  }),

  // Prefetch group session data when session is about to start
  GROUP_SESSION_DATA: (sessionId: number) => ({
    queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
    staleTime: STALE_TIMES.GROUP_SESSION_DATA,
  }),
} as const

// Performance monitoring
export const PERFORMANCE_METRICS = {
  trackQueryPerformance: (queryKey: readonly unknown[], duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[Sessions] Query ${keyStr} took ${duration.toFixed(2)}ms`)
    }
  },

  trackCacheHit: (queryKey: readonly unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[Sessions] Cache hit for ${keyStr}`)
    }
  },
} as const

export default {
  SESSIONS_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  INVALIDATION_PATTERNS,
  PREFETCH_STRATEGIES,
  PERFORMANCE_METRICS,
}
