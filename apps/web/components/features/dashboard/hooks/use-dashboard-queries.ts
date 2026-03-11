"use client"

import { useQuery } from '@tanstack/react-query'
import { getWeekSessionsAction } from '@/actions/dashboard/dashboard-actions'
import type { WeekCalendarSession } from '@/actions/dashboard/dashboard-actions'

const DASHBOARD_QUERY_KEYS = {
  WEEK_SESSIONS: (weekStart: string) => ['dashboard-week-sessions', weekStart] as const,
}

/**
 * Fetch sessions for a given week (7-day window from Monday).
 * Stale after 1 minute, garbage collected after 5 minutes.
 */
export function useWeekSessions(weekStart: string) {
  return useQuery<WeekCalendarSession[]>({
    queryKey: DASHBOARD_QUERY_KEYS.WEEK_SESSIONS(weekStart),
    queryFn: async () => {
      const result = await getWeekSessionsAction(weekStart)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: 60_000,
    gcTime: 300_000,
  })
}
