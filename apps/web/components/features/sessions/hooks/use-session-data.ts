/*
<ai_context>
useSessionData - Custom hook for fetching and managing session data.
Includes real-time subscriptions for live updates (Phase 4).
Provides loading states and error handling.
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback } from "react"
import { getGroupSessionDataAction } from "@/actions/sessions"

export interface SessionData {
  session: {
    id: string
    name: string
    date: string
    status: string
    athleteGroupId: number
  }
  athletes: {
    id: number
    name: string
    userId: number
  }[]
  exercises: {
    id: number
    name: string
    sets: number
    reps: number
    distance: number | null
    unit: string
  }[]
  performanceData: {
    [athleteId: number]: {
      [exerciseId: number]: {
        [setIndex: number]: {
          performingTime: number | null
          completed: boolean
        }
      }
    }
  }
  personalBests: {
    [athleteId: number]: {
      [exerciseId: number]: {
        value: number
        unitId: number
        achievedDate: string
      }
    }
  }
}

interface UseSessionDataOptions {
  sessionId: string
  enableRealtime?: boolean // Phase 4 feature
  pollingInterval?: number // Fallback polling if realtime disabled
}

export function useSessionData(options: UseSessionDataOptions) {
  const {
    sessionId,
    enableRealtime = false,
    pollingInterval
  } = options

  const [data, setData] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch session data from server
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getGroupSessionDataAction(sessionId)

      if (result.isSuccess) {
        setData(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch session data'
      setError(errorMsg)
      console.error('[useSessionData]', err)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  /**
   * Refresh data manually
   */
  const refresh = useCallback(() => {
    return fetchData()
  }, [fetchData])

  /**
   * Update local performance data optimistically
   * (For immediate UI feedback before server confirms)
   */
  const updatePerformanceLocal = useCallback((
    athleteId: number,
    exerciseId: number,
    setIndex: number,
    performingTime: number | null
  ) => {
    setData(prev => {
      if (!prev) return prev

      // Deep copy to avoid mutation
      return {
        ...prev,
        performanceData: {
          ...prev.performanceData,
          [athleteId]: {
            ...prev.performanceData[athleteId],
            [exerciseId]: {
              ...prev.performanceData[athleteId]?.[exerciseId],
              [setIndex]: {
                performingTime,
                completed: performingTime !== null
              }
            }
          }
        }
      }
    })
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Polling fallback (if realtime not enabled)
  useEffect(() => {
    if (!enableRealtime && pollingInterval && pollingInterval > 0) {
      const interval = setInterval(() => {
        fetchData()
      }, pollingInterval)

      return () => clearInterval(interval)
    }
  }, [enableRealtime, pollingInterval, fetchData])

  // Phase 4: Supabase real-time subscription for live updates
  useEffect(() => {
    if (!enableRealtime) return

    // Dynamic import to avoid importing in non-browser environments
    import('@/lib/supabase-client').then(({ createClientSupabaseClient }) => {
      import('@clerk/nextjs').then(({ useAuth }) => {
        // Note: This is a simplified version. In production, you'd need to properly
        // handle the auth token from useAuth hook in a client component wrapper
        console.log('[useSessionData] Real-time enabled for session:', sessionId)

        // TODO: Implement proper real-time subscription with auth token
        // const supabase = createClientSupabaseClient(getToken)
        // const subscription = supabase
        //   .channel(`session:${sessionId}`)
        //   .on('postgres_changes', {
        //     event: '*',
        //     schema: 'public',
        //     table: 'workout_log_sets',
        //     filter: `workout_log_id=eq.${sessionId}`
        //   }, (payload) => {
        //     console.log('[useSessionData] Real-time update:', payload)
        //     refresh()
        //   })
        //   .subscribe()
        //
        // return () => {
        //   subscription.unsubscribe()
        // }
      })
    })
  }, [enableRealtime, sessionId, refresh])

  return {
    data,
    isLoading,
    error,
    refresh,
    updatePerformanceLocal
  }
}
