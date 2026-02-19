/**
 * Workout Session Management Hook
 * Handles session initialization, status transitions, auto-save, and API integration
 * 
 * Based on the successful useExerciseData pattern from the original Kasoku workout system
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useWorkoutApi } from "./use-workout-api"
import type { 
  WorkoutLogWithDetails,
  WorkoutLogSet 
} from "@/types/training"
import type { WorkoutExercise } from "../context/exercise-context"

// Session status types
import { Database } from '@/types/database'

export type SessionStatus = Database["public"]["Enums"]["session_status"]

// Hook state interface
interface WorkoutSessionState {
  isLoading: boolean
  error: Error | null
  session: WorkoutLogWithDetails | null
  sessionStatus: SessionStatus
}

// Hook return interface
interface UseWorkoutSessionReturn extends WorkoutSessionState {
  startSession: () => Promise<{ success: boolean; error?: Error }>
  saveSession: (notes?: string) => Promise<{ success: boolean; error?: Error }>
  completeSession: (notes?: string) => Promise<{ success: boolean; error?: Error }>
  abandonSession: () => Promise<{ success: boolean; error?: Error }>
  updateTrainingDetail: (detailId: string, updates: Partial<WorkoutLogSet>) => void
  updateWorkoutLogSets: (exerciseId: number, updatedDetails: WorkoutLogSet[]) => void
  refreshSessionData: () => Promise<void>
}

export const useWorkoutSession = (initialSession?: WorkoutLogWithDetails): UseWorkoutSessionReturn => {
  // Add a ref to keep track of the latest state
  const stateRef = useRef<WorkoutSessionState | null>(null)
  
  // Initialize workout API integration
  const workoutApi = useWorkoutApi({
    autoSaveDelay: 2000,
    retryAttempts: 3,
    enableOptimisticUpdates: true
  })
  
  // Add a dedicated state for exercise training details
  const [trainingDetails, setTrainingDetails] = useState<WorkoutLogSet[]>([])
  // Add a ref to track latest training details
  const trainingDetailsRef = useRef<WorkoutLogSet[]>([])
  
  const [state, setState] = useState<WorkoutSessionState>({
    isLoading: !!initialSession, // Only loading if we have an initial session to process
    error: null,
    session: initialSession || null,
    sessionStatus: (initialSession as any)?.session_status as SessionStatus || 'assigned'
  })

  // Update the refs whenever state changes
  useEffect(() => {
    stateRef.current = state
    trainingDetailsRef.current = trainingDetails
  }, [state, trainingDetails])

  // Initialize workout data if we have an initial session
  useEffect(() => {
    if (initialSession) {
      const initializeSessionData = () => {
        try {
          // Extract all training details from the session
          const allTrainingDetails = initialSession.workout_log_sets || []
          
          setTrainingDetails(allTrainingDetails)
          
          setState(prev => ({
            ...prev,
            session: initialSession,
            sessionStatus: ((initialSession as any).session_status as SessionStatus) || 'assigned',
            isLoading: false
          }))
        } catch (err) {
          console.error('Session initialization error:', err)
          setState(prev => ({ 
            ...prev, 
            error: err instanceof Error ? err : new Error('Session initialization failed'),
            isLoading: false 
          }))
        }
      }

      initializeSessionData()
    }
  }, [initialSession])

  // Refresh session data from API
  const refreshSessionData = useCallback(async () => {
    if (!(state.session as any)?.id) return

    try {
      // Use workout API to get session data
      const sessionData = await workoutApi.getSession((state.session as any).id)
      
      if (!sessionData) {
        throw new Error('Failed to refresh session data')
      }
      
      // Extract all training details
      const allTrainingDetails = sessionData.workout_log_sets || []
      
      setTrainingDetails(allTrainingDetails)
      
      setState(prev => ({
        ...prev,
        session: sessionData,
        sessionStatus: ((sessionData as any).session_status as SessionStatus) || 'assigned'
      }))
    } catch (error) {
      console.error('Error refreshing session data:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to refresh session data')
      }))
    }
  }, [(state.session as any)?.id, workoutApi])

  // Start a training session
  const startSession = useCallback(async () => {
    // Logic:
    // 1. If we have an existing session ID (e.g. Assigned/Ongoing), use startSession (update status)
    // 2. If we only have a plan ID (New session), use createSession
    
    const existingSessionId = (state.session as any)?.id
    const planId = state.session?.session_plan?.id

    if (!existingSessionId && !planId) {
      console.error('No session or plan available')
      return { success: false, error: new Error('No session available') }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      let sessionData
      
      if (existingSessionId) {
        // Start/Resume existing session
        sessionData = await workoutApi.startSession(existingSessionId)
      } else if (planId) {
        // Create new session from plan
        sessionData = await workoutApi.createSession(planId)
      }
      
      if (!sessionData) {
        throw new Error('Failed to start training session')
      }
      
      // Update session status
      setState(prev => ({
        ...prev,
        session: { ...prev.session, ...sessionData } as WorkoutLogWithDetails,
        sessionStatus: 'ongoing',
        isLoading: false
      }))
      
      return { success: true }
    } catch (error) {
      console.error("Error starting session:", error)
      const err = error instanceof Error ? error : new Error('Failed to start session')
      setState(prev => ({ 
        ...prev, 
        error: err,
        isLoading: false 
      }))
      return { success: false, error: err }
    }
  }, [(state.session as any)?.id, state.session?.session_plan?.id, workoutApi])

  // Save session progress
  const saveSession = useCallback(async (notes?: string) => {
    if (!(state.session as any)?.id) {
      return { success: false, error: new Error('No session available') }
    }

    try {
      // CRITICAL FIX: Only update status if session is not already completed
      // This prevents completed sessions from reverting to ongoing when saving data
      const currentStatus = state.session?.session_status || (state.session as any)?.session_status
      const updates: { session_status?: SessionStatus; notes?: string } = {}

      // Only set to 'ongoing' if not already completed or cancelled (prevents status regression)
      if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
        updates.session_status = 'ongoing'
      }

      if (notes !== undefined) {
        updates.notes = notes
      }

      // Only call update if we have something to update
      if (Object.keys(updates).length === 0) {
        return { success: true }
      }

      const success = await workoutApi.updateSession((state.session as any).id, updates, true) // immediate save

      if (!success) {
        throw new Error('Failed to save session')
      }

      return { success: true }
    } catch (error) {
      console.error("Error saving session:", error)
      const err = error instanceof Error ? error : new Error('Failed to save session')
      return { success: false, error: err }
    }
  }, [(state.session as any)?.id, state.session?.session_status, workoutApi])

  // Complete session
  const completeSession = useCallback(async (notes?: string) => {
    try {
      // First save the current state with notes
      const saveResult = await saveSession(notes)
      if (!saveResult.success) {
        return saveResult
      }

      if (!(state.session as any)?.id) {
        return { success: false, error: new Error('No session available') }
      }

      // Use the workout API to complete the session (notes already saved above)
      const success = await workoutApi.completeSession((state.session as any).id, notes)

      if (!success) {
        throw new Error('Failed to complete session')
      }

      await refreshSessionData()
      return { success: true }
    } catch (error) {
      console.error("Error completing session:", error)
      const err = error instanceof Error ? error : new Error('Failed to complete session')
      setState(prev => ({
        ...prev,
        error: err,
        isLoading: false
      }))
      return { success: false, error: err }
    }
  }, [saveSession, (state.session as any)?.id, workoutApi, refreshSessionData])

  // Abandon/cancel an ongoing session
  const abandonSession = useCallback(async () => {
    if (!(state.session as any)?.id) {
      return { success: false, error: new Error('No session available') }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Update session status to cancelled
      const success = await workoutApi.updateSession(
        (state.session as any).id,
        { session_status: 'cancelled' },
        true
      )

      if (!success) {
        throw new Error('Failed to abandon session')
      }

      setState(prev => ({
        ...prev,
        sessionStatus: 'cancelled',
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      console.error("Error abandoning session:", error)
      const err = error instanceof Error ? error : new Error('Failed to abandon session')
      setState(prev => ({
        ...prev,
        error: err,
        isLoading: false
      }))
      return { success: false, error: err }
    }
  }, [(state.session as any)?.id, workoutApi])

  // Update a single training detail
  const updateTrainingDetail = useCallback((detailId: string, updates: Partial<WorkoutLogSet>) => {
    setTrainingDetails(prev => {
      const updated = prev.map(detail =>
        detail.id === detailId
          ? { ...detail, ...updates }
          : detail
      )
      return updated
    })
  }, [])
  
  // Update multiple training details for an exercise
  const updateWorkoutLogSets = useCallback((exerciseId: number, updatedDetails: WorkoutLogSet[]) => {
    setTrainingDetails(prev => {
      return prev.map(detail => {
        const matchingUpdate = updatedDetails.find(ud => ud.id === detail.id)
        return matchingUpdate 
          ? { ...detail, ...matchingUpdate } 
          : detail
      })
    })
  }, [])

  return {
    ...state,
    startSession,
    saveSession,
    completeSession,
    abandonSession,
    updateTrainingDetail,
    updateWorkoutLogSets,
    refreshSessionData
  }
}