/**
 * Session Planner Query Hooks
 * Custom hooks for session planning data fetching with optimized caching
 *
 * @see docs/patterns/react-query-pattern.md for usage guidelines
 */

"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  SESSION_PLANNER_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  PERFORMANCE_METRICS
} from '../config/query-config'
import { getSessionPlanByIdAction } from '@/actions/library/exercise-actions'
import { saveSessionWithExercisesAction } from '@/actions/plans/session-planner-actions'
import { getSessionPlansByMicrocycleAction } from '@/actions/plans/session-plan-actions'
import type { SessionExercise, Session } from '../types'
import type { SessionPlanWithDetails } from '@/types/training'

// Types
interface UseSessionPlanOptions {
  sessionId: number
  enabled?: boolean
}

interface UseSessionPlansByMicrocycleOptions {
  microcycleId: number
  enabled?: boolean
}

interface SaveSessionData {
  sessionId: number
  sessionUpdates: Partial<Session>
  exercises: SessionExercise[]
}

/**
 * Hook for fetching a single session plan with full details
 * Used in the session planner page for editing
 */
export function useSessionPlan({ sessionId, enabled = true }: UseSessionPlanOptions) {
  const queryClient = useQueryClient()

  const query = useQuery<SessionPlanWithDetails>({
    queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getSessionPlanByIdAction(sessionId)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.SESSION_PLAN,
    gcTime: CACHE_TIMES.SESSION_PLAN,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: enabled && sessionId > 0,
  })

  // Invalidate and refetch session
  const refetchSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
    })
  }, [queryClient, sessionId])

  return {
    ...query,
    refetchSession,
  }
}

/**
 * Hook for fetching all session plans in a microcycle
 * Used in plan workspace for displaying week view
 */
export function useSessionPlansByMicrocycle({
  microcycleId,
  enabled = true
}: UseSessionPlansByMicrocycleOptions) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getSessionPlansByMicrocycleAction(microcycleId)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId),
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.SESSION_PLANS_BY_MICROCYCLE,
    gcTime: CACHE_TIMES.SESSION_PLANS_BY_MICROCYCLE,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled: enabled && microcycleId > 0,
  })

  const refetchSessions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId)
    })
  }, [queryClient, microcycleId])

  return {
    ...query,
    refetchSessions,
  }
}

/**
 * Hook for session plan mutations (save, update, delete)
 */
export function useSessionPlanMutations() {
  const queryClient = useQueryClient()

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: async ({ sessionId, sessionUpdates, exercises }: SaveSessionData) => {
      const result = await saveSessionWithExercisesAction(sessionId, sessionUpdates, exercises)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, { sessionId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
      })

      // If we have microcycle_id, invalidate that too
      if (data?.microcycle_id) {
        queryClient.invalidateQueries({
          queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(data.microcycle_id)
        })
      }

      // Invalidate plan hierarchy
      queryClient.invalidateQueries({
        queryKey: SESSION_PLANNER_QUERY_KEYS.MACROCYCLES
      })
    },
    onError: (error) => {
      console.error('[useSessionPlanMutations] Save failed:', error)
    },
  })

  return {
    saveSession: saveSessionMutation,
    isSaving: saveSessionMutation.isPending,
    saveError: saveSessionMutation.error,
  }
}

/**
 * Hook for prefetching session plan data
 */
export function useSessionPlannerPrefetch() {
  const queryClient = useQueryClient()

  const prefetchSessionPlan = useCallback((sessionId: number) => {
    queryClient.prefetchQuery({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
      queryFn: async () => {
        const result = await getSessionPlanByIdAction(sessionId)
        if (!result.isSuccess) throw new Error(result.message)
        return result.data
      },
      staleTime: STALE_TIMES.SESSION_PLAN,
    })
  }, [queryClient])

  const prefetchMicrocycleSessions = useCallback((microcycleId: number) => {
    queryClient.prefetchQuery({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId),
      queryFn: async () => {
        const result = await getSessionPlansByMicrocycleAction(microcycleId)
        if (!result.isSuccess) throw new Error(result.message)
        return result.data
      },
      staleTime: STALE_TIMES.SESSION_PLANS_BY_MICROCYCLE,
    })
  }, [queryClient])

  return {
    prefetchSessionPlan,
    prefetchMicrocycleSessions,
  }
}

/**
 * Hook for cache management
 */
export function useSessionPlannerCache() {
  const queryClient = useQueryClient()

  const invalidateSession = useCallback((sessionId: number) => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
    })
  }, [queryClient])

  const invalidateMicrocycle = useCallback((microcycleId: number) => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId)
    })
  }, [queryClient])

  const invalidateAllPlans = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.MACROCYCLES
    })
  }, [queryClient])

  const getSessionFromCache = useCallback((sessionId: number) => {
    return queryClient.getQueryData<SessionPlanWithDetails>(
      SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
    )
  }, [queryClient])

  return {
    invalidateSession,
    invalidateMicrocycle,
    invalidateAllPlans,
    getSessionFromCache,
  }
}

export default {
  useSessionPlan,
  useSessionPlansByMicrocycle,
  useSessionPlanMutations,
  useSessionPlannerPrefetch,
  useSessionPlannerCache,
}
