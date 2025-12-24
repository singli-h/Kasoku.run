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
  saveSession: () => Promise<{ success: boolean; error?: Error }>
  completeSession: () => Promise<{ success: boolean; error?: Error }>
  updateTrainingDetail: (detailId: number, updates: Partial<WorkoutLogSet>) => void
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
    if (!state.session?.session_plan?.id) {
      console.error('No preset group ID available')
      return { success: false, error: new Error('No session available') }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Use the workout API to start session
      const sessionData = await workoutApi.startSession(state.session.session_plan.id)
      
      if (!sessionData) {
        throw new Error('Failed to start training session')
      }
      
      // Update session status
      setState(prev => ({
        ...prev,
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
  }, [state.session?.session_plan?.id, workoutApi])

  // Save session progress
  const saveSession = useCallback(async () => {
    if (!(state.session as any)?.id) {
      return { success: false, error: new Error('No session available') }
    }

    try {
      // Use the workout API to update session status
      const success = await workoutApi.updateSession((state.session as any).id, {
        session_status: 'ongoing'
      }, true) // immediate save
      
      if (!success) {
        throw new Error('Failed to save session')
      }
      
      return { success: true }
    } catch (error) {
      console.error("Error saving session:", error)
      const err = error instanceof Error ? error : new Error('Failed to save session')
      return { success: false, error: err }
    }
  }, [(state.session as any)?.id, workoutApi])

  // Complete session
  const completeSession = useCallback(async () => {
    try {
      // First save the current state
      const saveResult = await saveSession()
      if (!saveResult.success) {
        return saveResult
      }

      if (!(state.session as any)?.id) {
        return { success: false, error: new Error('No session available') }
      }

      // Use the workout API to complete the session
      const success = await workoutApi.completeSession((state.session as any).id)
      
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

  // Update a single training detail
  const updateTrainingDetail = useCallback((detailId: number, updates: Partial<WorkoutLogSet>) => {
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
    updateTrainingDetail,
    updateWorkoutLogSets,
    refreshSessionData
  }
} 