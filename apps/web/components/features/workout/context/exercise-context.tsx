/**
 * Exercise Context Provider
 * Manages global state for exercise data and video display preferences
 * Provides a centralized way to manage and update exercise states across components
 *
 * Based on the successful pattern from the original Kasoku workout system
 * Enhanced with auto-save functionality for workout performance data
 */

"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react"
import type { SessionPlanExerciseWithDetails, WorkoutLogSet } from "@/types/training"
import { useWorkoutApi } from "@/components/features/workout/hooks/use-workout-api"

// Extended exercise type with training details for workout execution
export interface WorkoutExercise extends SessionPlanExerciseWithDetails {
  workout_log_sets: WorkoutLogSet[]
  completed?: boolean
  // Explicit fields from session_plan_exercises table
  id: number
  exercise_order: number | null
  superset_id: number | null
}

// Save status for auto-save indicator
export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'

// Context value interface
interface ExerciseContextValue {
  exercises: WorkoutExercise[]
  showVideo: boolean
  saveStatus: SaveStatus
  updateExercise: (id: number, updates: Partial<WorkoutExercise>) => void
  toggleSetComplete: (exerciseId: number, detailId: number) => void
  toggleVideo: () => void
  setExercises: (exercises: WorkoutExercise[]) => void
  /** Force immediate save of all pending changes - MUST call before completing session */
  forceSave: () => Promise<boolean>
  /** Check if there are pending unsaved changes */
  hasPendingChanges: () => boolean
}

// Create context with null initial value
const ExerciseContext = createContext<ExerciseContextValue | null>(null)

/**
 * Custom hook to access exercise context
 * Ensures the hook is used within the provider and provides type-safe access
 * @returns {ExerciseContextValue} Context object containing exercises state and update functions
 * @throws {Error} If used outside of ExerciseProvider
 */
export const useExerciseContext = (): ExerciseContextValue => {
  const context = useContext(ExerciseContext)
  if (!context) {
    throw new Error("useExerciseContext must be used within an ExerciseProvider")
  }
  return context
}

/**
 * Exercise Provider Component
 * Wraps the application with exercise context and provides state management
 * Enhanced with auto-save functionality
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped
 * @param {WorkoutExercise[]} [props.initialData=[]] - Initial exercise data
 * @param {number} [props.sessionId] - Current workout session ID for auto-save
 */
interface ExerciseProviderProps {
  children: ReactNode
  initialData?: WorkoutExercise[]
  sessionId?: number
}

export const ExerciseProvider = ({ children, initialData = [], sessionId }: ExerciseProviderProps) => {
  // State for managing exercises and video display
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialData)
  const [showVideo, setShowVideo] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Auto-save queue and timer
  const saveQueueRef = useRef<Map<string, any>>(new Map())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)


  // Workout API for saving data
  const { saveExercisePerformance } = useWorkoutApi()

  /**
   * Process the auto-save queue
   * Debounced to avoid excessive database writes
   */
  const processSaveQueue = useCallback(async () => {
    if (saveQueueRef.current.size === 0 || !sessionId) return

    setSaveStatus('saving')

    try {
      // Process all pending saves
      const savePromises = Array.from(saveQueueRef.current.entries()).map(
        async ([_key, data]) => {
          const { exerciseId, setIndex, updates } = data

          return await saveExercisePerformance(
            sessionId,
            exerciseId,
            { set_index: setIndex, ...updates },
            true // immediate save
          )
        }
      )

      await Promise.all(savePromises)

      // Clear the queue
      saveQueueRef.current.clear()
      setSaveStatus('saved')

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('[ExerciseProvider] Auto-save failed:', error)
      setSaveStatus('error')

      // Reset to idle after 3 seconds on error
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [sessionId, saveExercisePerformance])

  /**
   * Schedule auto-save with debounce
   */
  const scheduleAutoSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule new save after 2 second delay
    saveTimeoutRef.current = setTimeout(() => {
      processSaveQueue()
    }, 2000)
  }, [processSaveQueue])

  /**
   * Updates a specific exercise's data and triggers auto-save
   * @param {number} id - Exercise ID to update
   * @param {Partial<WorkoutExercise>} updates - New properties to merge with existing exercise data
   */
  const updateExercise = useCallback((id: number, updates: Partial<WorkoutExercise>) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) =>
        exercise.id === id ? { ...exercise, ...updates } : exercise
      )
    )

    // If updating workout_log_sets, add to save queue
    if (updates.workout_log_sets && sessionId) {
      const exerciseData = exercises.find(e => e.id === id)
      if (!exerciseData) return

      // Queue each modified detail for save
      updates.workout_log_sets.forEach((detail, index) => {
        const queueKey = `${sessionId}-${exerciseData.exercise?.id}-${index}`
        saveQueueRef.current.set(queueKey, {
          exerciseId: exerciseData.exercise?.id,
          setIndex: index + 1,
          updates: detail
        })
      })

      scheduleAutoSave()
    }
  }, [exercises, sessionId, scheduleAutoSave])

  /**
   * Toggles completion status of a specific set
   * @param {number} exerciseId - Exercise preset ID
   * @param {number} detailId - Training detail ID to toggle
   */
  const toggleSetComplete = useCallback((exerciseId: number, detailId: number) => {
    setExercises((prevExercises) => {
      // Update state and get the updated exercises
      const updatedExercises = prevExercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise

        const updatedDetails = exercise.workout_log_sets.map((detail) => {
          if (detail.id !== detailId) return detail
          return { ...detail, completed: !detail.completed }
        })

        return { ...exercise, workout_log_sets: updatedDetails }
      })

      // Queue completion status for save using UPDATED state
      if (sessionId) {
        const exerciseData = updatedExercises.find(e => e.id === exerciseId)
        if (!exerciseData) return updatedExercises

        const detailIndex = exerciseData.workout_log_sets.findIndex(d => d.id === detailId)
        if (detailIndex === -1) return updatedExercises

        const detail = exerciseData.workout_log_sets[detailIndex]
        const queueKey = `${sessionId}-${exerciseData.exercise?.id}-${detailIndex}-completion`

        saveQueueRef.current.set(queueKey, {
          exerciseId: exerciseData.exercise?.id,
          setIndex: detailIndex + 1,
          updates: { completed: detail.completed } // Now using the NEW toggled value
        })

        scheduleAutoSave()
      }

      return updatedExercises
    })
  }, [sessionId, scheduleAutoSave])

  /**
   * Toggles video display state
   * Controls whether exercise videos are shown or hidden
   */
  const toggleVideo = useCallback(() => {
    setShowVideo(prev => !prev)
  }, [])

  /**
   * Force immediate save of all pending changes
   * MUST be called before completing/finishing a workout session
   * @returns Promise<boolean> - true if save succeeded, false if failed
   */
  const forceSave = useCallback(async (): Promise<boolean> => {
    // Cancel any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // If nothing to save, return success
    if (saveQueueRef.current.size === 0) {
      return true
    }

    setSaveStatus('saving')

    try {
      // Process all pending saves immediately
      const savePromises = Array.from(saveQueueRef.current.entries()).map(
        async ([_key, data]) => {
          const { exerciseId, setIndex, updates } = data
          return await saveExercisePerformance(
            sessionId!,
            exerciseId,
            { set_index: setIndex, ...updates },
            true // immediate save
          )
        }
      )

      await Promise.all(savePromises)

      // Clear the queue
      saveQueueRef.current.clear()
      setSaveStatus('saved')

      return true
    } catch (error) {
      console.error('[ExerciseProvider] Force save failed:', error)
      setSaveStatus('error')
      return false
    }
  }, [sessionId, saveExercisePerformance])

  /**
   * Check if there are pending unsaved changes
   * @returns boolean - true if there are unsaved changes
   */
  const hasPendingChanges = useCallback((): boolean => {
    return saveQueueRef.current.size > 0 || saveStatus === 'saving'
  }, [saveStatus])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Provide context value to children
  const value: ExerciseContextValue = {
    exercises,
    showVideo,
    saveStatus,
    updateExercise,
    toggleSetComplete,
    toggleVideo,
    setExercises,
    forceSave,
    hasPendingChanges
  }

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  )
} 