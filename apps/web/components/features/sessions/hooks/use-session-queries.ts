/**
 * Sessions Query Hooks
 * Custom hooks for session data fetching with optimized caching
 * Replaces manual useState/useEffect pattern with React Query
 *
 * @see docs/patterns/react-query-caching-pattern.md for usage guidelines
 */

"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  SESSIONS_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  PERFORMANCE_METRICS
} from '../config/query-config'
import {
  getGroupSessionDataAction,
  getGroupSessionsAction,
  getTrainingSessionByIdAction,
  getTrainingSessionsAction,
  updateExercisePerformanceAction,
  completeTrainingSessionAction,
} from '@/actions/sessions/training-session-actions'

// Types
interface UseSessionOptions {
  sessionId: number
  enabled?: boolean
}

interface UseGroupSessionDataOptions {
  sessionId: number
  enabled?: boolean
  /** Enable polling for live updates (default: false) */
  enablePolling?: boolean
  /** Polling interval in ms (default: 30000) */
  pollingInterval?: number
}

interface UseSessionsOptions {
  athleteId?: number
  limit?: number
  enabled?: boolean
}

/**
 * Hook for fetching a single training session
 */
export function useSession({ sessionId, enabled = true }: UseSessionOptions) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getTrainingSessionByIdAction(sessionId)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSIONS_QUERY_KEYS.SESSION(sessionId),
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.SESSION,
    gcTime: CACHE_TIMES.SESSION,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: enabled && sessionId > 0,
    refetchOnWindowFocus: true,
  })

  const refetchSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId)
    })
  }, [queryClient, sessionId])

  return {
    ...query,
    refetchSession,
  }
}

/**
 * Hook for fetching group session data (athletes, exercises, performance)
 * Primary hook for the group session view
 */
export function useGroupSessionData({
  sessionId,
  enabled = true,
  enablePolling = false,
  pollingInterval = 30000,
}: UseGroupSessionDataOptions) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getGroupSessionDataAction(sessionId)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.GROUP_SESSION_DATA,
    gcTime: CACHE_TIMES.GROUP_SESSION_DATA,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: enabled && sessionId > 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Enable polling for live updates during active sessions
    refetchInterval: enablePolling ? pollingInterval : false,
  })

  const refetchData = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId)
    })
  }, [queryClient, sessionId])

  return {
    ...query,
    refetchData,
  }
}

/**
 * Hook for fetching today's group sessions
 */
export function useSessionsToday(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: SESSIONS_QUERY_KEYS.SESSIONS_TODAY,
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getGroupSessionsAction()

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSIONS_QUERY_KEYS.SESSIONS_TODAY,
        duration
      )

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
  })

  const refetchSessions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.SESSIONS_TODAY
    })
  }, [queryClient])

  return {
    ...query,
    refetchSessions,
  }
}

/**
 * Hook for fetching training sessions with filters
 * Note: Uses getTrainingSessionsAction which accepts (athleteId?, limit?)
 */
export function useSessions({
  athleteId,
  limit = 20,
  enabled = true,
}: UseSessionsOptions) {
  const queryClient = useQueryClient()
  const filters = { athleteId, limit }

  const query = useQuery({
    queryKey: SESSIONS_QUERY_KEYS.SESSIONS_HISTORY(1, filters),
    queryFn: async () => {
      const startTime = performance.now()

      const result = await getTrainingSessionsAction(athleteId, limit)

      const duration = performance.now() - startTime
      PERFORMANCE_METRICS.trackQueryPerformance(
        SESSIONS_QUERY_KEYS.SESSIONS_HISTORY(1, filters),
        duration
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: STALE_TIMES.SESSIONS_HISTORY,
    gcTime: CACHE_TIMES.SESSIONS_HISTORY,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled,
    placeholderData: (previousData) => previousData,
  })

  const refetchSessions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.SESSIONS_HISTORY(1, filters)
    })
  }, [queryClient, filters])

  return {
    ...query,
    refetchSessions,
  }
}

/**
 * Hook for session mutations (update performance, complete session)
 */
export function useSessionMutations() {
  const queryClient = useQueryClient()

  // Update exercise performance mutation
  const updatePerformanceMutation = useMutation({
    mutationFn: async ({
      detailId,
      updates,
    }: {
      detailId: number
      updates: {
        reps?: number
        weight?: number
        distance?: number
        performing_time?: number
        completed?: boolean
      }
    }) => {
      const result = await updateExercisePerformanceAction(detailId, updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, { detailId }) => {
      // Optimistic update - invalidate related queries
      // Note: We could optimize this further with direct cache updates
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'group-session-data' ||
          query.queryKey[0] === 'athlete-performance'
      })
    },
    onError: (error) => {
      console.error('[useSessionMutations] Update performance failed:', error)
    },
  })

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const result = await completeTrainingSessionAction(sessionId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, sessionId) => {
      // Invalidate session and today's list
      queryClient.invalidateQueries({
        queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId)
      })
      queryClient.invalidateQueries({
        queryKey: SESSIONS_QUERY_KEYS.SESSIONS_TODAY
      })
      queryClient.invalidateQueries({
        queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId)
      })
    },
    onError: (error) => {
      console.error('[useSessionMutations] Complete session failed:', error)
    },
  })

  return {
    updatePerformance: updatePerformanceMutation,
    completeSession: completeSessionMutation,
    isUpdating: updatePerformanceMutation.isPending,
    isCompleting: completeSessionMutation.isPending,
  }
}

/**
 * Hook for prefetching session data
 */
export function useSessionPrefetch() {
  const queryClient = useQueryClient()

  const prefetchSession = useCallback((sessionId: number) => {
    queryClient.prefetchQuery({
      queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId),
      queryFn: async () => {
        const result = await getTrainingSessionByIdAction(sessionId)
        if (!result.isSuccess) throw new Error(result.message)
        return result.data
      },
      staleTime: STALE_TIMES.SESSION,
    })
  }, [queryClient])

  const prefetchGroupSessionData = useCallback((sessionId: number) => {
    queryClient.prefetchQuery({
      queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId),
      queryFn: async () => {
        const result = await getGroupSessionDataAction(sessionId)
        if (!result.isSuccess) throw new Error(result.message)
        return result.data
      },
      staleTime: STALE_TIMES.GROUP_SESSION_DATA,
    })
  }, [queryClient])

  return {
    prefetchSession,
    prefetchGroupSessionData,
  }
}

/**
 * Hook for session cache management
 */
export function useSessionCache() {
  const queryClient = useQueryClient()

  const invalidateSession = useCallback((sessionId: number) => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.SESSION(sessionId)
    })
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.GROUP_SESSION_DATA(sessionId)
    })
  }, [queryClient])

  const invalidateAllSessions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSIONS_QUERY_KEYS.SESSIONS_TODAY
    })
  }, [queryClient])

  const getSessionFromCache = useCallback((sessionId: number) => {
    return queryClient.getQueryData(
      SESSIONS_QUERY_KEYS.SESSION(sessionId)
    )
  }, [queryClient])

  const setSessionData = useCallback((sessionId: number, data: unknown) => {
    queryClient.setQueryData(
      SESSIONS_QUERY_KEYS.SESSION(sessionId),
      data
    )
  }, [queryClient])

  return {
    invalidateSession,
    invalidateAllSessions,
    getSessionFromCache,
    setSessionData,
  }
}

export default {
  useSession,
  useGroupSessionData,
  useSessionsToday,
  useSessions,
  useSessionMutations,
  useSessionPrefetch,
  useSessionCache,
}
