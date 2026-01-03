/**
 * Performance Analytics Query Configuration
 *
 * Centralized query keys, cache times, and retry configuration
 * for TanStack Query integration.
 */

/**
 * Query Keys
 * Hierarchical structure for efficient cache management
 */
export const PERFORMANCE_QUERY_KEYS = {
  // Sprint Analytics
  SPRINT_ANALYTICS: (timeRange: string) =>
    ['performance', 'sprint', 'analytics', timeRange] as const,
  SPRINT_SESSIONS: (timeRange: string) =>
    ['performance', 'sprint', 'sessions', timeRange] as const,

  // Gym Analytics
  GYM_ANALYTICS: (timeRange: string) =>
    ['performance', 'gym', 'analytics', timeRange] as const,
  GYM_EXERCISE_PROGRESS: (exerciseId?: string) =>
    ['performance', 'gym', 'exercise-progress', exerciseId] as const,
  GYM_WORKOUT_HISTORY: () =>
    ['performance', 'gym', 'workout-history'] as const,

  // Comparative Analytics
  COMPARATIVE_ANALYTICS: () =>
    ['performance', 'comparative'] as const,

  // Race Results
  RACE_RESULTS: () => ['performance', 'race', 'results'] as const,

  // Base keys for invalidation
  ALL: ['performance'] as const,
  SPRINT: ['performance', 'sprint'] as const,
  GYM: ['performance', 'gym'] as const,
  RACE: ['performance', 'race'] as const,
} as const

/**
 * Cache Times (gcTime)
 * How long data is kept in cache after becoming inactive
 */
export const CACHE_TIMES = {
  // Sprint analytics - moderately cached
  SPRINT_ANALYTICS: 10 * 60 * 1000, // 10 minutes

  // Gym analytics - longer cache (less frequent updates)
  GYM_ANALYTICS: 15 * 60 * 1000, // 15 minutes

  // Workout history - longer cache
  WORKOUT_HISTORY: 30 * 60 * 1000, // 30 minutes

  // Exercise progress - moderate
  EXERCISE_PROGRESS: 10 * 60 * 1000, // 10 minutes

  // Race results - moderate cache
  RACE_RESULTS: 15 * 60 * 1000, // 15 minutes
} as const

/**
 * Stale Times
 * How long data is considered fresh (no background refetch)
 */
export const STALE_TIMES = {
  // Sprint analytics - fresher data preferred
  SPRINT_ANALYTICS: 2 * 60 * 1000, // 2 minutes

  // Gym analytics - moderately stale-tolerant
  GYM_ANALYTICS: 5 * 60 * 1000, // 5 minutes

  // Workout history - very stale-tolerant
  WORKOUT_HISTORY: 15 * 60 * 1000, // 15 minutes

  // Exercise progress - moderate
  EXERCISE_PROGRESS: 5 * 60 * 1000, // 5 minutes

  // Race results - moderate
  RACE_RESULTS: 5 * 60 * 1000, // 5 minutes
} as const

/**
 * Retry Configuration
 * Retry strategies based on data criticality
 */
export const RETRY_CONFIG = {
  // Standard analytics queries
  ANALYTICS: {
    retries: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  },

  // Background/optional data
  BACKGROUND: {
    retries: 1,
    retryDelay: () => 5000,
  },
} as const

/**
 * Time Range Options
 */
export const TIME_RANGE_OPTIONS = {
  SPRINT: ['7d', '30d', '90d', 'all'] as const,
  GYM: ['4weeks', '3months', '6months', '1year'] as const,
} as const

export type SprintTimeRange = (typeof TIME_RANGE_OPTIONS.SPRINT)[number]
export type GymTimeRange = (typeof TIME_RANGE_OPTIONS.GYM)[number]
