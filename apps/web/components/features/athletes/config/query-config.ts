/**
 * Athletes Query Configuration
 * Centralized configuration for TanStack Query with optimized caching strategies
 * for athlete management, groups, and personal bests
 *
 * @see docs/patterns/react-query-caching-pattern.md for usage guidelines
 */

// Query keys for athletes-related data
export const ATHLETES_QUERY_KEYS = {
  // Athlete queries
  ATHLETE: (athleteId: number) => ['athlete', athleteId] as const,
  ATHLETES_BY_GROUP: (groupId: number) => ['athletes', 'group', groupId] as const,
  CURRENT_ATHLETE: ['current-athlete'] as const,

  // Athlete group queries
  GROUPS: ['athlete-groups'] as const,
  GROUP: (groupId: number) => ['athlete-group', groupId] as const,
  ROSTER: ['roster-with-counts'] as const,

  // Coach queries
  CURRENT_COACH: ['current-coach'] as const,
  COACH_PROFILE: (userId: number) => ['coach-profile', userId] as const,

  // Personal bests
  ATHLETE_PBS: (athleteId: number) => ['personal-bests', athleteId] as const,
  MY_PBS: ['my-personal-bests'] as const,

  // History
  ATHLETE_HISTORY: (athleteId: number) => ['athlete-history', athleteId] as const,
  GROUP_HISTORY: (groupId: number) => ['group-history', groupId] as const,
} as const

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived - actively managed data
  CURRENT_ATHLETE: 5 * 60 * 1000, // 5 minutes
  CURRENT_COACH: 5 * 60 * 1000, // 5 minutes

  // Medium-lived - group and roster data
  ATHLETE: 10 * 60 * 1000, // 10 minutes
  ATHLETES_BY_GROUP: 10 * 60 * 1000, // 10 minutes
  GROUPS: 10 * 60 * 1000, // 10 minutes
  GROUP: 10 * 60 * 1000, // 10 minutes
  ROSTER: 10 * 60 * 1000, // 10 minutes
  COACH_PROFILE: 15 * 60 * 1000, // 15 minutes

  // Longer-lived - reference data
  ATHLETE_PBS: 30 * 60 * 1000, // 30 minutes
  MY_PBS: 30 * 60 * 1000, // 30 minutes
  ATHLETE_HISTORY: 30 * 60 * 1000, // 30 minutes
  GROUP_HISTORY: 30 * 60 * 1000, // 30 minutes
} as const

// Stale time configurations (in milliseconds)
export const STALE_TIMES = {
  // Fresh data - coach needs current info
  CURRENT_ATHLETE: 2 * 60 * 1000, // 2 minutes
  CURRENT_COACH: 2 * 60 * 1000, // 2 minutes

  // Moderately fresh
  ATHLETE: 5 * 60 * 1000, // 5 minutes
  ATHLETES_BY_GROUP: 5 * 60 * 1000, // 5 minutes
  GROUPS: 5 * 60 * 1000, // 5 minutes
  GROUP: 5 * 60 * 1000, // 5 minutes
  ROSTER: 5 * 60 * 1000, // 5 minutes
  COACH_PROFILE: 10 * 60 * 1000, // 10 minutes

  // Stale-tolerant
  ATHLETE_PBS: 15 * 60 * 1000, // 15 minutes
  MY_PBS: 15 * 60 * 1000, // 15 minutes
  ATHLETE_HISTORY: 15 * 60 * 1000, // 15 minutes
  GROUP_HISTORY: 15 * 60 * 1000, // 15 minutes
} as const

// Retry configurations
export const RETRY_CONFIG = {
  // Critical data
  CRITICAL: {
    retries: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Standard data
  STANDARD: {
    retries: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  },

  // Background data
  BACKGROUND: {
    retries: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },
} as const

// Query invalidation helpers
export const INVALIDATION_PATTERNS = {
  // Invalidate single athlete
  ATHLETE: (athleteId: number) => [
    ATHLETES_QUERY_KEYS.ATHLETE(athleteId),
    ATHLETES_QUERY_KEYS.ATHLETE_PBS(athleteId),
  ],

  // Invalidate group and its athletes
  GROUP: (groupId: number) => [
    ATHLETES_QUERY_KEYS.GROUP(groupId),
    ATHLETES_QUERY_KEYS.ATHLETES_BY_GROUP(groupId),
    ATHLETES_QUERY_KEYS.GROUPS,
    ATHLETES_QUERY_KEYS.ROSTER,
  ],

  // Invalidate all groups
  ALL_GROUPS: () => [
    ATHLETES_QUERY_KEYS.GROUPS,
    ATHLETES_QUERY_KEYS.ROSTER,
  ],

  // Invalidate personal bests
  PERSONAL_BESTS: (athleteId: number) => [
    ATHLETES_QUERY_KEYS.ATHLETE_PBS(athleteId),
    ATHLETES_QUERY_KEYS.MY_PBS,
  ],
} as const

// Prefetch strategies
export const PREFETCH_STRATEGIES = {
  // Prefetch athlete details when hovering
  ATHLETE: (athleteId: number) => ({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETE(athleteId),
    staleTime: STALE_TIMES.ATHLETE,
  }),

  // Prefetch group when expanding
  GROUP: (groupId: number) => ({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETES_BY_GROUP(groupId),
    staleTime: STALE_TIMES.ATHLETES_BY_GROUP,
  }),
} as const

// Performance monitoring
export const PERFORMANCE_METRICS = {
  trackQueryPerformance: (queryKey: readonly unknown[], duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[Athletes] Query ${keyStr} took ${duration.toFixed(2)}ms`)
    }
  },

  trackCacheHit: (queryKey: readonly unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[Athletes] Cache hit for ${keyStr}`)
    }
  },
} as const

export default {
  ATHLETES_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  INVALIDATION_PATTERNS,
  PREFETCH_STRATEGIES,
  PERFORMANCE_METRICS,
}
