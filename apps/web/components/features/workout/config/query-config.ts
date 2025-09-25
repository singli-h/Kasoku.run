/**
 * Workout Query Configuration
 * Centralized configuration for TanStack Query with optimized caching strategies
 * and performance settings for workout-related data
 */

import { QueryClient } from '@tanstack/react-query'

// Query keys for workout-related data
export const WORKOUT_QUERY_KEYS = {
  // Session queries
  SESSIONS_TODAY: ['workout-sessions-today'] as const,
  SESSIONS_HISTORY: (page: number, filters: any) => ['workout-sessions-history', page, filters] as const,
  SESSION_DETAILS: (sessionId: string) => ['workout-session-details', sessionId] as const,
  
  // Exercise queries
  EXERCISE_PRESETS: (groupId: string) => ['exercise-presets', groupId] as const,
  EXERCISE_DETAILS: (exerciseId: string) => ['exercise-details', exerciseId] as const,
  
  // Performance queries
  PERFORMANCE_HISTORY: (athleteId: string, exerciseId?: string) => 
    ['performance-history', athleteId, exerciseId] as const,
  PERFORMANCE_STATS: (athleteId: string) => ['performance-stats', athleteId] as const,
  
  // Training plan queries
  TRAINING_PLANS: (athleteId: string) => ['training-plans', athleteId] as const,
  TRAINING_PLAN_DETAILS: (planId: string) => ['training-plan-details', planId] as const,
} as const

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data (30 seconds to 1 minute)
  SESSIONS_TODAY: 30 * 1000, // 30 seconds
  SESSION_DETAILS: 60 * 1000, // 1 minute
  
  // Medium-lived data (5-15 minutes)
  SESSIONS_HISTORY: 5 * 60 * 1000, // 5 minutes
  EXERCISE_PRESETS: 10 * 60 * 1000, // 10 minutes
  EXERCISE_DETAILS: 15 * 60 * 1000, // 15 minutes
  
  // Long-lived data (30 minutes to 1 hour)
  PERFORMANCE_HISTORY: 30 * 60 * 1000, // 30 minutes
  PERFORMANCE_STATS: 30 * 60 * 1000, // 30 minutes
  TRAINING_PLANS: 60 * 60 * 1000, // 1 hour
  TRAINING_PLAN_DETAILS: 60 * 60 * 1000, // 1 hour
} as const

// Stale time configurations (in milliseconds)
export const STALE_TIMES = {
  // Very fresh data (immediate stale)
  SESSIONS_TODAY: 0, // Always refetch
  SESSION_DETAILS: 0, // Always refetch
  
  // Moderately fresh data (1-5 minutes)
  SESSIONS_HISTORY: 2 * 60 * 1000, // 2 minutes
  EXERCISE_PRESETS: 5 * 60 * 1000, // 5 minutes
  EXERCISE_DETAILS: 5 * 60 * 1000, // 5 minutes
  
  // Stale-tolerant data (15-30 minutes)
  PERFORMANCE_HISTORY: 15 * 60 * 1000, // 15 minutes
  PERFORMANCE_STATS: 15 * 60 * 1000, // 15 minutes
  TRAINING_PLANS: 30 * 60 * 1000, // 30 minutes
  TRAINING_PLAN_DETAILS: 30 * 60 * 1000, // 30 minutes
} as const

// Retry configurations
export const RETRY_CONFIG = {
  // Critical data (sessions, exercises) - retry more aggressively
  CRITICAL: {
    retries: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Non-critical data (stats, history) - retry less aggressively
  NON_CRITICAL: {
    retries: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
  
  // Background data (training plans) - minimal retries
  BACKGROUND: {
    retries: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },
} as const

// Query client configuration
export const createWorkoutQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time for workout queries
        staleTime: 2 * 60 * 1000, // 2 minutes
        
        // Default cache time for workout queries
        gcTime: 10 * 60 * 1000, // 10 minutes
        
        // Default retry configuration
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        
        // Refetch on window focus for critical data
        refetchOnWindowFocus: true,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Background refetch interval for stale data
        refetchInterval: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000,
      },
    },
  })
}

// Query invalidation helpers
export const INVALIDATION_PATTERNS = {
  // Invalidate all session-related queries
  SESSIONS: () => [
    WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
    WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(0, {}),
  ],
  
  // Invalidate specific session
  SESSION: (sessionId: string) => [
    WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId),
    WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
  ],
  
  // Invalidate all performance data
  PERFORMANCE: (athleteId: string) => [
    WORKOUT_QUERY_KEYS.PERFORMANCE_HISTORY(athleteId),
    WORKOUT_QUERY_KEYS.PERFORMANCE_STATS(athleteId),
  ],
  
  // Invalidate all training plan data
  TRAINING_PLANS: (athleteId: string) => [
    WORKOUT_QUERY_KEYS.TRAINING_PLANS(athleteId),
  ],
} as const

// Prefetching strategies
export const PREFETCH_STRATEGIES = {
  // Prefetch next page of history
  HISTORY_NEXT_PAGE: (currentPage: number, filters: any) => ({
    queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(currentPage + 1, filters),
    staleTime: STALE_TIMES.SESSIONS_HISTORY,
  }),
  
  // Prefetch session details when hovering over session card
  SESSION_DETAILS: (sessionId: string) => ({
    queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId),
    staleTime: STALE_TIMES.SESSION_DETAILS,
  }),
  
  // Prefetch exercise details for upcoming exercises
  EXERCISE_DETAILS: (exerciseId: string) => ({
    queryKey: WORKOUT_QUERY_KEYS.EXERCISE_DETAILS(exerciseId),
    staleTime: STALE_TIMES.EXERCISE_DETAILS,
  }),
} as const

// Performance monitoring
export const PERFORMANCE_METRICS = {
  // Track query performance
  trackQueryPerformance: (queryKey: string[], duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query ${queryKey.join('.')} took ${duration}ms`)
    }
  },
  
  // Track cache hit rate
  trackCacheHit: (queryKey: string[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache hit for ${queryKey.join('.')}`)
    }
  },
  
  // Track cache miss
  trackCacheMiss: (queryKey: string[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache miss for ${queryKey.join('.')}`)
    }
  },
} as const

export default {
  WORKOUT_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  createWorkoutQueryClient,
  INVALIDATION_PATTERNS,
  PREFETCH_STRATEGIES,
  PERFORMANCE_METRICS,
}
