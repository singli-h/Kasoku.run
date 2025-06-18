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
  ExerciseTrainingSession, 
  ExerciseTrainingSessionWithDetails,
  ExerciseTrainingDetail 
} from "@/types/training"
import type { WorkoutExercise } from "../context/exercise-context"

// Session status types
export type SessionStatus = 'assigned' | 'ongoing' | 'completed' | 'unknown'

// Hook state interface
interface WorkoutSessionState {
  isLoading: boolean
  error: Error | null
  session: ExerciseTrainingSessionWithDetails | null
  sessionStatus: SessionStatus
}

// Hook return interface
interface UseWorkoutSessionReturn extends WorkoutSessionState {
  startSession: () => Promise<{ success: boolean; error?: Error }>
  saveSession: () => Promise<{ success: boolean; error?: Error }>
  completeSession: () => Promise<{ success: boolean; error?: Error }>
  updateTrainingDetail: (detailId: number, updates: Partial<ExerciseTrainingDetail>) => void
  updateExerciseTrainingDetails: (exerciseId: number, updatedDetails: ExerciseTrainingDetail[]) => void
  refreshSessionData: () => Promise<void>
}

export const useWorkoutSession = (initialSession?: ExerciseTrainingSessionWithDetails): UseWorkoutSessionReturn => {
  // Add a ref to keep track of the latest state
  const stateRef = useRef<WorkoutSessionState | null>(null)
  
  // Initialize workout API integration
  const workoutApi = useWorkoutApi({
    autoSaveDelay: 2000,
    retryAttempts: 3,
    enableOptimisticUpdates: true
  })
  
  // Add a dedicated state for exercise training details
  const [trainingDetails, setTrainingDetails] = useState<ExerciseTrainingDetail[]>([])
  // Add a ref to track latest training details
  const trainingDetailsRef = useRef<ExerciseTrainingDetail[]>([])
  
  const [state, setState] = useState<WorkoutSessionState>({
    isLoading: !!initialSession, // Only loading if we have an initial session to process
    error: null,
    session: initialSession || null,
    sessionStatus: initialSession?.status as SessionStatus || 'unknown'
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
          const allTrainingDetails = initialSession.exercise_training_details || []
          
          setTrainingDetails(allTrainingDetails)
          
          setState(prev => ({
            ...prev,
            session: initialSession,
            sessionStatus: (initialSession.status as SessionStatus) || 'unknown',
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
    if (!state.session?.id) return

    try {
      // Use workout API to get session data
      const sessionData = await workoutApi.getSession(state.session.id)
      
      if (!sessionData) {
        throw new Error('Failed to refresh session data')
      }
      
      // Extract all training details
      const allTrainingDetails = sessionData.exercise_training_details || []
      
      setTrainingDetails(allTrainingDetails)
      
      setState(prev => ({
        ...prev,
        session: sessionData,
        sessionStatus: (sessionData.status as SessionStatus) || 'unknown'
      }))
    } catch (error) {
      console.error('Error refreshing session data:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to refresh session data')
      }))
    }
  }, [state.session?.id, workoutApi])

  // Start a training session
  const startSession = useCallback(async () => {
    if (!state.session?.exercise_preset_group?.id) {
      console.error('No preset group ID available')
      return { success: false, error: new Error('No session available') }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Use the workout API to start session
      const sessionData = await workoutApi.startSession(state.session.exercise_preset_group.id)
      
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
  }, [state.session?.exercise_preset_group?.id, workoutApi])

  // Save session progress
  const saveSession = useCallback(async () => {
    if (!state.session?.id) {
      return { success: false, error: new Error('No session available') }
    }

    try {
      const token = await getAuthToken()
      
      // TODO: Replace with actual API endpoint when training actions are complete
      const response = await fetch(`/api/training/sessions/${state.session.id}/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: state.session.id,
          training_details: trainingDetailsRef.current,
          status: 'ongoing'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save session')
      }
      
      return { success: true }
    } catch (error) {
      console.error("Error saving session:", error)
      const err = error instanceof Error ? error : new Error('Failed to save session')
      return { success: false, error: err }
    }
  }, [state.session?.id, getAuthToken])

  // Complete session
  const completeSession = useCallback(async () => {
    try {
      // First save the current state
      const saveResult = await saveSession()
      if (!saveResult.success) {
        return saveResult
      }

      if (!state.session?.id) {
        return { success: false, error: new Error('No session available') }
      }

      const token = await getAuthToken()
      
      // TODO: Replace with actual API endpoint when training actions are complete
      const response = await fetch(`/api/training/sessions/${state.session.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: state.session.id,
          training_details: trainingDetailsRef.current,
          status: 'completed'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to complete session')
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
  }, [saveSession, state.session?.id, getAuthToken, refreshSessionData])

  // Update a single training detail
  const updateTrainingDetail = useCallback((detailId: number, updates: Partial<ExerciseTrainingDetail>) => {
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
  const updateExerciseTrainingDetails = useCallback((exerciseId: number, updatedDetails: ExerciseTrainingDetail[]) => {
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
    updateExerciseTrainingDetails,
    refreshSessionData
  }
} 