/*
<ai_context>
useSprintSession - Custom hook for managing sprint session state, real-time updates,
and auto-save functionality. Provides optimistic updates and error handling
for the enhanced SprintSessionDashboard.
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { 
  SprintRound, 
  SprintPerformanceEntry,
  SprintSessionAthlete,
  AthleteGroupWithAthletes,
  LiveSprintSession
} from "@/actions/training/sprint-session-actions"
import {
  createLiveSprintSessionAction,
  logSprintPerformanceAction,
  getSprintPerformanceDataAction
} from "@/actions/training/sprint-session-actions"

interface UseSprintSessionOptions {
  autoSaveDelay?: number // Delay in ms before auto-saving
  enableRealTimeUpdates?: boolean
  onSessionUpdate?: (session: LiveSprintSession) => void
  onError?: (error: string) => void
}

interface UseSprintSessionReturn {
  // Session state
  session: LiveSprintSession | null
  isLoading: boolean
  error: string | null
  
  // Performance data
  performances: SprintPerformanceEntry[]
  
  // Actions
  startSession: (name: string, athleteGroups: AthleteGroupWithAthletes[], rounds: SprintRound[]) => Promise<void>
  updatePerformance: (athleteId: number, roundNumber: number, timeMs: number | null) => void
  togglePresence: (athleteId: number) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => Promise<void>
  
  // State helpers
  getPerformanceForAthlete: (athleteId: number, roundNumber: number) => SprintPerformanceEntry | undefined
  isAthletePresent: (athleteId: number) => boolean
  hasUnsavedChanges: boolean
}

export function useSprintSession(options: UseSprintSessionOptions = {}): UseSprintSessionReturn {
  const {
    autoSaveDelay = 2000,
    enableRealTimeUpdates = true,
    onSessionUpdate,
    onError
  } = options

  // State
  const [session, setSession] = useState<LiveSprintSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performances, setPerformances] = useState<SprintPerformanceEntry[]>([])
  const [absentAthletes, setAbsentAthletes] = useState<Set<number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Refs for managing auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Map<string, SprintPerformanceEntry>>(new Map())

  // Load existing performance data if session ID is provided
  const loadPerformanceData = useCallback(async (sessionId: number) => {
    setIsLoading(true)
    try {
      const result = await getSprintPerformanceDataAction(sessionId)
      if (result.isSuccess && result.data) {
        setPerformances(result.data || [])
      }
    } catch (err) {
      const errorMsg = "Failed to load performance data"
      setError(errorMsg)
      onError?.(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  // Auto-save pending updates
  const flushPendingUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.size === 0) return

    const updates = Array.from(pendingUpdatesRef.current.values())
    pendingUpdatesRef.current.clear()

    try {
      for (const update of updates) {
        const result = await logSprintPerformanceAction(update)
        if (!result.isSuccess) {
          throw new Error(result.message)
        }
      }
      setHasUnsavedChanges(false)
    } catch (err) {
      const errorMsg = "Failed to save performance updates"
      setError(errorMsg)
      onError?.(errorMsg)
      toast.error(errorMsg)
      
      // Re-add failed updates to pending queue
      updates.forEach(update => {
        const key = `${update.athleteId}-${update.roundNumber}`
        pendingUpdatesRef.current.set(key, update)
      })
    }
  }, [onError])

  // Setup auto-save timer
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (hasUnsavedChanges && autoSaveDelay > 0) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        flushPendingUpdates()
      }, autoSaveDelay)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges, autoSaveDelay, flushPendingUpdates])

  // Start a new sprint session
  const startSession = useCallback(async (
    name: string, 
    athleteGroups: AthleteGroupWithAthletes[], 
    rounds: SprintRound[]
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createLiveSprintSessionAction(
        name,
        athleteGroups.map(g => g.id),
        rounds,
        undefined // presetId is optional
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      setSession(result.data)
      setPerformances([])
      setAbsentAthletes(new Set())
      setHasUnsavedChanges(false)
      
      onSessionUpdate?.(result.data)
      toast.success("Sprint session started successfully")
    } catch (err) {
      const errorMsg = "Failed to start sprint session"
      setError(errorMsg)
      onError?.(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [onSessionUpdate, onError])

  // Update performance with optimistic updates
  const updatePerformance = useCallback((
    athleteId: number, 
    roundNumber: number, 
    timeMs: number | null
  ) => {
    if (!session) return

    const timestamp = new Date().toISOString()
    const performanceEntry: SprintPerformanceEntry = {
      athleteId,
      athleteGroupId: 0, // Will be set on server
      roundNumber,
      distance: session.rounds.find(r => r.roundNumber === roundNumber)?.distance || 0,
      timeMs,
      timestamp
    }

    // Optimistic update
    setPerformances(prev => {
      const filtered = prev.filter(p => 
        !(p.athleteId === athleteId && p.roundNumber === roundNumber)
      )
      return timeMs !== null ? [...filtered, performanceEntry] : filtered
    })

    // Add to pending updates queue
    const key = `${athleteId}-${roundNumber}`
    pendingUpdatesRef.current.set(key, performanceEntry)
    setHasUnsavedChanges(true)
  }, [session])

  // Toggle athlete presence
  const togglePresence = useCallback(async (athleteId: number) => {
    if (!session) return

    const wasAbsent = absentAthletes.has(athleteId)
    
    // Optimistic update
    setAbsentAthletes(prev => {
      const newSet = new Set(prev)
      if (wasAbsent) {
        newSet.delete(athleteId)
      } else {
        newSet.add(athleteId)
      }
      return newSet
    })

    try {
      const result = await toggleAthletePresenceAction(session.id, athleteId, !wasAbsent)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      
      toast.success(`Athlete marked as ${wasAbsent ? 'present' : 'absent'}`)
    } catch (err) {
      // Revert optimistic update
      setAbsentAthletes(prev => {
        const newSet = new Set(prev)
        if (wasAbsent) {
          newSet.add(athleteId)
        } else {
          newSet.delete(athleteId)
        }
        return newSet
      })
      
      const errorMsg = "Failed to update athlete presence"
      setError(errorMsg)
      onError?.(errorMsg)
      toast.error(errorMsg)
    }
  }, [session, absentAthletes, onError])

  // Session control actions
  const pauseSession = useCallback(() => {
    if (!session) return
    setSession(prev => prev ? { ...prev, status: 'paused' } : null)
    toast.info("Session paused")
  }, [session])

  const resumeSession = useCallback(() => {
    if (!session) return
    setSession(prev => prev ? { ...prev, status: 'active' } : null)
    toast.info("Session resumed")
  }, [session])

  const endSession = useCallback(async () => {
    if (!session) return

    // Flush any pending updates before ending
    await flushPendingUpdates()

    setSession(prev => prev ? { 
      ...prev, 
      status: 'completed',
      endTime: new Date().toISOString()
    } : null)
    
    toast.success("Sprint session completed")
  }, [session, flushPendingUpdates])

  // Helper functions
  const getPerformanceForAthlete = useCallback((
    athleteId: number, 
    roundNumber: number
  ) => {
    return performances.find(p => 
      p.athleteId === athleteId && p.roundNumber === roundNumber
    )
  }, [performances])

  const isAthletePresent = useCallback((athleteId: number) => {
    return !absentAthletes.has(athleteId)
  }, [absentAthletes])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      // Attempt to flush pending updates on unmount
      if (pendingUpdatesRef.current.size > 0) {
        flushPendingUpdates()
      }
    }
  }, [flushPendingUpdates])

  return {
    // State
    session,
    isLoading,
    error,
    performances,
    
    // Actions
    startSession,
    updatePerformance,
    togglePresence,
    pauseSession,
    resumeSession,
    endSession,
    
    // Helpers
    getPerformanceForAthlete,
    isAthletePresent,
    hasUnsavedChanges
  }
} 