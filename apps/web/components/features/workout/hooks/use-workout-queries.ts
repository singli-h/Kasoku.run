/**
 * Workout Queries Hook
 * Custom hooks for workout-related data fetching with optimized caching
 * and performance monitoring
 */

"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { 
  WORKOUT_QUERY_KEYS, 
  CACHE_TIMES, 
  STALE_TIMES, 
  RETRY_CONFIG,
  INVALIDATION_PATTERNS,
  PERFORMANCE_METRICS
} from '../config/query-config'
import {
  getTodayAndOngoingSessionsAction,
  getPastSessionsAction,
  getWorkoutSessionByIdAction,
  startTrainingSessionAction,
  updateTrainingSessionStatusAction
} from '@/actions/workout/workout-session-actions'
import { completeTrainingSessionAction } from '@/actions/sessions/training-session-actions'
import { WorkoutLogWithDetails } from '@/types/training'
import { Database } from '@/types/database'

type SessionStatus = Database["public"]["Enums"]["session_status"]

// Types
interface SessionFilters {
  limit: number
  startDate?: string
  endDate?: string
}

interface UseSessionsTodayOptions {
  athleteId?: string
  enabled?: boolean
}

interface UseSessionsHistoryOptions {
  athleteId?: string
  page: number
  filters: SessionFilters
  enabled?: boolean
}

// Hook for today's and ongoing sessions
export function useSessionsToday({ athleteId, enabled = true }: UseSessionsTodayOptions = {}) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
    queryFn: async () => {
      const startTime = performance.now()
      
      const result = await getTodayAndOngoingSessionsAction(athleteId ? parseInt(athleteId, 10) : undefined)
      
      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance([...WORKOUT_QUERY_KEYS.SESSIONS_TODAY], duration)
      
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      
      return result.data
    },
    staleTime: STALE_TIMES.SESSIONS_TODAY,
    gcTime: CACHE_TIMES.SESSIONS_TODAY,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // Invalidate and refetch sessions
  const refetchSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY })
  }, [queryClient])

  return {
    ...query,
    refetchSessions,
  }
}

// Hook for session history with pagination
export function useSessionsHistory({ 
  athleteId, 
  page, 
  filters, 
  enabled = true 
}: UseSessionsHistoryOptions) {
  const queryClient = useQueryClient()
  
  const query = useQuery<{
    sessions: WorkoutLogWithDetails[]
    totalCount: number
    hasMore: boolean
  }>({
    queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(page, filters),
    queryFn: async () => {
      const startTime = performance.now()
      
      const result = await getPastSessionsAction(
        athleteId ? parseInt(athleteId, 10) : undefined,
        page,
        filters.limit,
        filters.startDate,
        filters.endDate
      )
      
      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        [...WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(page, filters)], 
        duration
      )
      
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      
      return result.data
    },
    staleTime: STALE_TIMES.SESSIONS_HISTORY,
    gcTime: CACHE_TIMES.SESSIONS_HISTORY,
    retry: RETRY_CONFIG.NON_CRITICAL.retries,
    retryDelay: RETRY_CONFIG.NON_CRITICAL.retryDelay,
    enabled,
    placeholderData: (previousData) => previousData, // Keep previous page data while loading next page
  })

  // Invalidate and refetch history
  const refetchHistory = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(page, filters) })
  }, [queryClient, page, filters])

  return {
    ...query,
    refetchHistory,
  }
}

// Options for useWorkoutSessionDetails hook
interface UseWorkoutSessionDetailsOptions {
  enabled?: boolean
  initialData?: WorkoutLogWithDetails
}

// Hook for fetching individual workout session details with auto-refresh
export function useWorkoutSessionDetails(
  sessionId: number,
  options?: UseWorkoutSessionDetailsOptions
) {
  const queryClient = useQueryClient()

  const query = useQuery<WorkoutLogWithDetails>({
    queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString()),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getWorkoutSessionByIdAction(sessionId)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        [...WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())],
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.SESSION_DETAILS,
    gcTime: CACHE_TIMES.SESSION_DETAILS,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    refetchOnWindowFocus: true,  // Auto-refresh when tab regains focus
    refetchOnReconnect: true,    // Auto-refresh on network reconnect
  })

  // Invalidate and refetch session details
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
    })
  }, [queryClient, sessionId])

  return {
    ...query,
    refetch,
  }
}

// Hook for session mutations
export function useSessionMutations() {
  const queryClient = useQueryClient()

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await startTrainingSessionAction(parseInt(sessionId, 10))
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, sessionId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY })
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId) })
      
      // Update cache optimistically
      queryClient.setQueryData(
        WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.map((session: any) => 
            session.id === sessionId 
              ? { ...session, session_status: 'ongoing' }
              : session
          )
        }
      )
    },
    onError: (error) => {
      console.error('Failed to start session:', error)
    },
  })

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await completeTrainingSessionAction(parseInt(sessionId, 10))
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, sessionId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY })
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(0, {}) })
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId) })
      
      // Update cache optimistically
      queryClient.setQueryData(
        WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.filter((session: any) => session.id !== sessionId)
        }
      )
    },
    onError: (error) => {
      console.error('Failed to complete session:', error)
    },
  })

  // Update session status mutation
  const updateSessionStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const result = await updateTrainingSessionStatusAction(parseInt(sessionId, 10), status as SessionStatus)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, { sessionId, status }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY })
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(0, {}) })
      queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId) })
      
      // Update cache optimistically
      queryClient.setQueryData(
        WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.map((session: any) => 
            session.id === sessionId 
              ? { ...session, session_status: status }
              : session
          )
        }
      )
    },
    onError: (error) => {
      console.error('Failed to update session status:', error)
    },
  })

  return {
    startSession: startSessionMutation,
    completeSession: completeSessionMutation,
    updateSessionStatus: updateSessionStatusMutation,
  }
}

// Hook for prefetching strategies
export function useWorkoutPrefetch() {
  const queryClient = useQueryClient()

  const prefetchSessionDetails = useCallback((sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId),
      staleTime: STALE_TIMES.SESSION_DETAILS,
    })
  }, [queryClient])

  const prefetchNextHistoryPage = useCallback((currentPage: number, filters: SessionFilters) => {
    queryClient.prefetchQuery({
      queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(currentPage + 1, filters),
      staleTime: STALE_TIMES.SESSIONS_HISTORY,
    })
  }, [queryClient])

  const prefetchExerciseDetails = useCallback((exerciseId: string) => {
    queryClient.prefetchQuery({
      queryKey: WORKOUT_QUERY_KEYS.EXERCISE_DETAILS(exerciseId),
      staleTime: STALE_TIMES.EXERCISE_DETAILS,
    })
  }, [queryClient])

  return {
    prefetchSessionDetails,
    prefetchNextHistoryPage,
    prefetchExerciseDetails,
  }
}

// Hook for cache management
export function useWorkoutCache() {
  const queryClient = useQueryClient()

  const invalidateAllSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY })
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSIONS_HISTORY(0, {}) })
  }, [queryClient])

  const invalidateSession = useCallback((sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId) })
  }, [queryClient])

  const clearAllCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  const getCacheSize = useCallback(() => {
    return queryClient.getQueryCache().getAll().length
  }, [queryClient])

  return {
    invalidateAllSessions,
    invalidateSession,
    clearAllCache,
    getCacheSize,
  }
}

export default {
  useSessionsToday,
  useSessionsHistory,
  useWorkoutSessionDetails,
  useSessionMutations,
  useWorkoutPrefetch,
  useWorkoutCache,
}
