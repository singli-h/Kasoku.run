"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import {
  PERFORMANCE_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  type SprintTimeRange,
  type GymTimeRange,
} from "../config/query-config"
import {
  getSprintAnalyticsAction,
  getGymAnalyticsAction,
  type SprintAnalyticsData,
  type GymAnalyticsData,
} from "@/actions/performance/performance-actions"

/**
 * Hook for fetching sprint analytics data
 */
export function useSprintAnalytics(
  timeRange: SprintTimeRange = '30d',
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.SPRINT_ANALYTICS(timeRange),
    queryFn: async (): Promise<SprintAnalyticsData> => {
      const result = await getSprintAnalyticsAction(timeRange)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.SPRINT_ANALYTICS,
    gcTime: CACHE_TIMES.SPRINT_ANALYTICS,
    retry: RETRY_CONFIG.ANALYTICS.retries,
    retryDelay: RETRY_CONFIG.ANALYTICS.retryDelay,
    enabled: options?.enabled ?? true,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.SPRINT_ANALYTICS(timeRange),
    })
  }, [queryClient, timeRange])

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.SPRINT,
    })
  }, [queryClient])

  return {
    ...query,
    invalidate,
    invalidateAll,
  }
}

/**
 * Hook for fetching gym analytics data
 */
export function useGymAnalytics(
  timeRange: GymTimeRange = '3months',
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.GYM_ANALYTICS(timeRange),
    queryFn: async (): Promise<GymAnalyticsData> => {
      const result = await getGymAnalyticsAction(timeRange)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.GYM_ANALYTICS,
    gcTime: CACHE_TIMES.GYM_ANALYTICS,
    retry: RETRY_CONFIG.ANALYTICS.retries,
    retryDelay: RETRY_CONFIG.ANALYTICS.retryDelay,
    enabled: options?.enabled ?? true,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.GYM_ANALYTICS(timeRange),
    })
  }, [queryClient, timeRange])

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.GYM,
    })
  }, [queryClient])

  return {
    ...query,
    invalidate,
    invalidateAll,
  }
}

/**
 * Hook for prefetching performance data
 */
export function usePerformancePrefetch() {
  const queryClient = useQueryClient()

  const prefetchSprintAnalytics = useCallback(
    (timeRange: SprintTimeRange) => {
      queryClient.prefetchQuery({
        queryKey: PERFORMANCE_QUERY_KEYS.SPRINT_ANALYTICS(timeRange),
        queryFn: async () => {
          const result = await getSprintAnalyticsAction(timeRange)
          if (!result.isSuccess) throw new Error(result.message)
          return result.data
        },
        staleTime: STALE_TIMES.SPRINT_ANALYTICS,
      })
    },
    [queryClient]
  )

  const prefetchGymAnalytics = useCallback(
    (timeRange: GymTimeRange) => {
      queryClient.prefetchQuery({
        queryKey: PERFORMANCE_QUERY_KEYS.GYM_ANALYTICS(timeRange),
        queryFn: async () => {
          const result = await getGymAnalyticsAction(timeRange)
          if (!result.isSuccess) throw new Error(result.message)
          return result.data
        },
        staleTime: STALE_TIMES.GYM_ANALYTICS,
      })
    },
    [queryClient]
  )

  return {
    prefetchSprintAnalytics,
    prefetchGymAnalytics,
  }
}

/**
 * Hook for cache management
 */
export function usePerformanceCache() {
  const queryClient = useQueryClient()

  const invalidateSprintCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.SPRINT,
    })
  }, [queryClient])

  const invalidateGymCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.GYM,
    })
  }, [queryClient])

  const invalidateAllPerformanceCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: PERFORMANCE_QUERY_KEYS.ALL,
    })
  }, [queryClient])

  return {
    invalidateSprintCache,
    invalidateGymCache,
    invalidateAllPerformanceCache,
  }
}
