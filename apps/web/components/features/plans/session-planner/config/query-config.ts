/**
 * Session Planner Query Configuration
 * Centralized configuration for TanStack Query with optimized caching strategies
 * for session planning and plan management data
 *
 * @see docs/patterns/react-query-pattern.md for usage guidelines
 */

// Query keys for session planner data
export const SESSION_PLANNER_QUERY_KEYS = {
  // Session plan queries
  SESSION_PLAN: (sessionId: number) => ['session-plan', sessionId] as const,
  SESSION_PLANS_BY_MICROCYCLE: (microcycleId: number) => ['session-plans', 'microcycle', microcycleId] as const,

  // Plan hierarchy queries
  MACROCYCLE: (macrocycleId: number) => ['macrocycle', macrocycleId] as const,
  MACROCYCLES: ['macrocycles'] as const,
  MESOCYCLES: (macrocycleId: number) => ['mesocycles', macrocycleId] as const,
  MICROCYCLES: (mesocycleId: number) => ['microcycles', mesocycleId] as const,

  // Exercise library queries
  EXERCISES: ['exercises'] as const,
  EXERCISE_SEARCH: (filters: any) => ['exercises', 'search', filters] as const,
  EXERCISE_TYPES: ['exercise-types'] as const,

  // Template queries
  TEMPLATES: ['session-templates'] as const,
  TEMPLATE_DETAILS: (templateId: number) => ['session-template', templateId] as const,
} as const

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data (1-5 minutes) - actively edited data
  SESSION_PLAN: 60 * 1000, // 1 minute - coach may edit frequently
  SESSION_PLANS_BY_MICROCYCLE: 2 * 60 * 1000, // 2 minutes

  // Medium-lived data (10-30 minutes) - plan structure
  MACROCYCLE: 10 * 60 * 1000, // 10 minutes
  MACROCYCLES: 15 * 60 * 1000, // 15 minutes
  MESOCYCLES: 10 * 60 * 1000, // 10 minutes
  MICROCYCLES: 10 * 60 * 1000, // 10 minutes

  // Long-lived data (30+ minutes) - reference data
  EXERCISES: 30 * 60 * 1000, // 30 minutes - rarely changes
  EXERCISE_SEARCH: 5 * 60 * 1000, // 5 minutes - search results
  EXERCISE_TYPES: 60 * 60 * 1000, // 1 hour - static reference data
  TEMPLATES: 30 * 60 * 1000, // 30 minutes
} as const

// Stale time configurations (in milliseconds)
export const STALE_TIMES = {
  // Fresh data - coach needs latest
  SESSION_PLAN: 30 * 1000, // 30 seconds
  SESSION_PLANS_BY_MICROCYCLE: 60 * 1000, // 1 minute

  // Moderately fresh (2-10 minutes)
  MACROCYCLE: 5 * 60 * 1000, // 5 minutes
  MACROCYCLES: 5 * 60 * 1000, // 5 minutes
  MESOCYCLES: 5 * 60 * 1000, // 5 minutes
  MICROCYCLES: 5 * 60 * 1000, // 5 minutes

  // Stale-tolerant (15+ minutes)
  EXERCISES: 15 * 60 * 1000, // 15 minutes
  EXERCISE_SEARCH: 2 * 60 * 1000, // 2 minutes
  EXERCISE_TYPES: 30 * 60 * 1000, // 30 minutes
  TEMPLATES: 15 * 60 * 1000, // 15 minutes
} as const

// Retry configurations
export const RETRY_CONFIG = {
  // Critical data - retry aggressively
  CRITICAL: {
    retries: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Standard data - moderate retries
  STANDARD: {
    retries: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  },

  // Background data - minimal retries
  BACKGROUND: {
    retries: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },
} as const

// Query invalidation helpers
export const INVALIDATION_PATTERNS = {
  // Invalidate single session plan
  SESSION_PLAN: (sessionId: number) => [
    SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
  ],

  // Invalidate all sessions in a microcycle
  MICROCYCLE_SESSIONS: (microcycleId: number) => [
    SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId),
  ],

  // Invalidate entire plan hierarchy
  PLAN_HIERARCHY: (macrocycleId: number) => [
    SESSION_PLANNER_QUERY_KEYS.MACROCYCLE(macrocycleId),
    SESSION_PLANNER_QUERY_KEYS.MACROCYCLES,
  ],

  // Invalidate all session-related data
  ALL_SESSIONS: () => [
    SESSION_PLANNER_QUERY_KEYS.MACROCYCLES,
  ],

  // Invalidate templates
  TEMPLATES: () => [
    SESSION_PLANNER_QUERY_KEYS.TEMPLATES,
  ],
} as const

// Prefetching strategies
export const PREFETCH_STRATEGIES = {
  // Prefetch session plan when hovering over session in plan workspace
  SESSION_PLAN: (sessionId: number) => ({
    queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
    staleTime: STALE_TIMES.SESSION_PLAN,
  }),

  // Prefetch microcycle sessions when expanding week
  MICROCYCLE_SESSIONS: (microcycleId: number) => ({
    queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId),
    staleTime: STALE_TIMES.SESSION_PLANS_BY_MICROCYCLE,
  }),
} as const

// Performance monitoring
export const PERFORMANCE_METRICS = {
  trackQueryPerformance: (queryKey: readonly unknown[], duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[SessionPlanner] Query ${keyStr} took ${duration.toFixed(2)}ms`)
    }
  },

  trackCacheHit: (queryKey: readonly unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const keyStr = Array.isArray(queryKey) ? queryKey.join('.') : String(queryKey)
      console.log(`[SessionPlanner] Cache hit for ${keyStr}`)
    }
  },
} as const

export default {
  SESSION_PLANNER_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  INVALIDATION_PATTERNS,
  PREFETCH_STRATEGIES,
  PERFORMANCE_METRICS,
}
