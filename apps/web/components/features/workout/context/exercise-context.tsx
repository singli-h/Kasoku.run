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
import { saveDraft, clearDraft } from "@/lib/workout-persistence"

// Extended exercise type with training details for workout execution
export interface WorkoutExercise extends SessionPlanExerciseWithDetails {
  workout_log_sets: WorkoutLogSet[]
  completed?: boolean
  // Explicit fields from session_plan_exercises table
  id: string
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
  updateExercise: (id: string, updates: Partial<WorkoutExercise>) => void
  toggleSetComplete: (exerciseId: string, detailId: string) => void
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
  sessionId?: string
}

export const ExerciseProvider = ({ children, initialData = [], sessionId }: ExerciseProviderProps) => {
  // State for managing exercises and video display
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialData)
  const [showVideo, setShowVideo] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Auto-save queue and timer
  const saveQueueRef = useRef<Map<string, any>>(new Map())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef<boolean>(false)
  // Track latest exercises for draft save (Phase 3)
  const exercisesRef = useRef<WorkoutExercise[]>(initialData)

  // Workout API for saving data
  const { saveExercisePerformance } = useWorkoutApi()

  /**
   * Process the auto-save queue
   * Debounced to avoid excessive database writes
   * Properly handles individual save failures
   * Uses lock to prevent concurrent saves
   */
  const processSaveQueue = useCallback(async () => {
    console.log('[ExerciseProvider] processSaveQueue called', { queueSize: saveQueueRef.current.size, sessionId, isSaving: isSavingRef.current })

    // Prevent concurrent saves - if already saving, the next scheduled save will pick up remaining items
    if (isSavingRef.current) {
      console.log('[ExerciseProvider] Save already in progress, skipping')
      return
    }

    if (saveQueueRef.current.size === 0 || !sessionId) return

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      // Snapshot the queue at start of processing - new items added during save will be processed next time
      const entries = Array.from(saveQueueRef.current.entries())
      const results = await Promise.all(
        entries.map(async ([key, data]) => {
          const { sessionPlanExerciseId, exerciseId, setIndex, updates } = data

          // Pass sessionPlanExerciseId for precise exercise instance identification
          const success = await saveExercisePerformance(
            sessionId,
            exerciseId,
            { set_index: setIndex, ...updates },
            true, // immediate save
            sessionPlanExerciseId // CRITICAL: Pass session_plan_exercise_id for unique lookup
          )

          return { key, success }
        })
      )

      // Only remove successful saves from the queue
      let hasFailures = false
      for (const { key, success } of results) {
        if (success) {
          saveQueueRef.current.delete(key)
        } else {
          hasFailures = true
          console.error('[ExerciseProvider] Save failed for key:', key)
        }
      }

      if (hasFailures) {
        setSaveStatus('error')
        // Keep failed items in queue - will retry on next save trigger
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    } catch (error) {
      console.error('[ExerciseProvider] Auto-save failed:', error)
      setSaveStatus('error')
      // Keep items in queue for retry
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      isSavingRef.current = false

      // CRITICAL FIX: If new items were added during save, schedule another save
      // This prevents data loss when user continues editing during a save operation
      if (saveQueueRef.current.size > 0) {
        console.log('[ExerciseProvider] New items added during save, scheduling follow-up save')
        // Use setTimeout to schedule follow-up save (avoids circular dependency with scheduleAutoSave)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          processSaveQueue()
        }, 2500)
      }
    }
  }, [sessionId, saveExercisePerformance])

  /**
   * Schedule draft save to localStorage (faster, more frequent)
   * Phase 3: Added as safety net - localStorage draft saved every 500ms
   */
  const scheduleDraftSave = useCallback(() => {
    if (!sessionId) return

    // Clear existing draft timeout
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current)
    }

    // Save draft to localStorage after 500ms (FR-027 recommendation)
    // Uses exercisesRef to get latest state without re-triggering effect
    draftTimeoutRef.current = setTimeout(() => {
      const currentExercises = exercisesRef.current
      if (currentExercises.length > 0) {
        // Map to expected format, converting null notes to undefined
        const draftExercises = currentExercises.map(ex => ({
          id: ex.id,
          workout_log_sets: ex.workout_log_sets,
          notes: ex.notes ?? undefined
        }))
        saveDraft(sessionId, draftExercises)
      }
    }, 500)
  }, [sessionId])

  /**
   * Schedule auto-save with debounce
   */
  const scheduleAutoSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule draft save first (faster, localStorage)
    scheduleDraftSave()

    // Schedule server save after 2500ms delay (best practice for auto-save to prevent race conditions)
    // This balances responsiveness vs server load and prevents save-during-typing data loss
    saveTimeoutRef.current = setTimeout(() => {
      processSaveQueue()
    }, 2500)
  }, [processSaveQueue, scheduleDraftSave])

  /**
   * Updates a specific exercise's data and triggers auto-save
   * OPTIMIZED: Only queues sets that actually changed (comparing with previous state)
   * @param {number} id - Exercise ID to update
   * @param {Partial<WorkoutExercise>} updates - New properties to merge with existing exercise data
   */
  const updateExercise = useCallback((id: string, updates: Partial<WorkoutExercise>) => {
    console.log('[ExerciseProvider] updateExercise called', { id, sessionId, hasWorkoutLogSets: !!updates.workout_log_sets })
    setExercises((prevExercises) => {
      const exerciseData = prevExercises.find(e => e.id === id)
      if (!exerciseData) {
        console.log('[ExerciseProvider] Exercise not found:', id)
        return prevExercises
      }

      // OPTIMIZATION: Only queue sets that actually changed
      if (updates.workout_log_sets && sessionId) {
        const prevSets = exerciseData.workout_log_sets
        const newSets = updates.workout_log_sets

        newSets.forEach((newSet, index) => {
          const prevSet = prevSets[index]
          // Only queue if set actually changed (compare all saveable fields)
          const hasChanged = !prevSet ||
            prevSet.completed !== newSet.completed ||
            prevSet.reps !== newSet.reps ||
            prevSet.weight !== newSet.weight ||
            prevSet.distance !== newSet.distance ||
            prevSet.performing_time !== newSet.performing_time ||
            prevSet.rest_time !== newSet.rest_time ||
            prevSet.velocity !== newSet.velocity ||
            prevSet.power !== newSet.power ||
            prevSet.height !== newSet.height ||
            prevSet.effort !== newSet.effort ||
            prevSet.resistance !== newSet.resistance ||
            prevSet.tempo !== newSet.tempo ||
            prevSet.rpe !== newSet.rpe

          if (hasChanged) {
            // CRITICAL FIX: Use session_plan_exercise_id (exerciseData.id) for unique identification
            // This prevents collisions when same exercise appears multiple times (e.g., Sprinting 20m, Sprinting 40m)
            const sessionPlanExerciseId = exerciseData.id // UUID from session_plan_exercises table

            // Also get template exercise ID for backward compatibility
            const rawExId = exerciseData.exercise?.id ?? (exerciseData as any).exercise_id
            const exerciseTemplateId = typeof rawExId === 'string' ? parseInt(rawExId, 10) : rawExId

            console.log('[ExerciseProvider] Change detected for set', {
              index,
              sessionPlanExerciseId,
              exerciseTemplateId,
              hasExercise: !!exerciseData.exercise
            })

            if (!sessionPlanExerciseId) {
              console.error('[ExerciseProvider] Cannot save - missing session_plan_exercise_id:', {
                exerciseData: JSON.stringify(exerciseData, null, 2).slice(0, 500)
              })
              return
            }

            // Use session_plan_exercise_id as queue key to prevent collisions
            const queueKey = `${sessionId}-${sessionPlanExerciseId}-${index}`
            console.log('[ExerciseProvider] Queueing save', { queueKey, setIndex: index + 1, sessionPlanExerciseId })
            saveQueueRef.current.set(queueKey, {
              sessionPlanExerciseId, // Primary identifier - unique per exercise instance
              exerciseId: exerciseTemplateId, // Kept for backward compatibility
              setIndex: index + 1,
              updates: newSet
            })
          }
        })

        if (saveQueueRef.current.size > 0) {
          scheduleAutoSave()
        }
      }

      return prevExercises.map((exercise) =>
        exercise.id === id ? { ...exercise, ...updates } : exercise
      )
    })
  }, [sessionId, scheduleAutoSave])

  /**
   * Toggles completion status of a specific set
   * @param {number} exerciseId - Exercise preset ID
   * @param {number} detailId - Training detail ID to toggle
   */
  const toggleSetComplete = useCallback((exerciseId: string, detailId: string) => {
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

        // CRITICAL FIX: Use session_plan_exercise_id for unique identification
        const sessionPlanExerciseId = exerciseData.id // UUID from session_plan_exercises table

        // Also get template exercise ID for backward compatibility
        const rawExId = exerciseData.exercise?.id ?? (exerciseData as any).exercise_id
        const exerciseTemplateId = typeof rawExId === 'string' ? parseInt(rawExId, 10) : rawExId

        if (!sessionPlanExerciseId) {
          console.error('[ExerciseProvider] Cannot save completion - missing session_plan_exercise_id:', {
            exerciseId
          })
          return updatedExercises
        }

        const detail = exerciseData.workout_log_sets[detailIndex]
        // Use session_plan_exercise_id as queue key to prevent collisions
        const queueKey = `${sessionId}-${sessionPlanExerciseId}-${detailIndex}-completion`

        saveQueueRef.current.set(queueKey, {
          sessionPlanExerciseId, // Primary identifier - unique per exercise instance
          exerciseId: exerciseTemplateId, // Kept for backward compatibility
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
   * Waits for any ongoing save to complete before processing
   * @returns Promise<boolean> - true if ALL saves succeeded, false if any failed
   */
  const forceSave = useCallback(async (): Promise<boolean> => {
    // Cancel any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Wait for any ongoing save to complete (poll with exponential backoff)
    // Increased from 2s to 8s max wait time to handle slow networks (Phase 3 fix)
    let waitAttempts = 0
    const maxWaitAttempts = 15 // ~8 seconds max wait with exponential backoff
    let waitMs = 100
    while (isSavingRef.current && waitAttempts < maxWaitAttempts) {
      await new Promise(resolve => setTimeout(resolve, waitMs))
      waitAttempts++
      // Exponential backoff: 100ms, 150ms, 225ms, 337ms, 506ms, 759ms, 1138ms, etc.
      waitMs = Math.min(waitMs * 1.5, 2000)
    }

    if (isSavingRef.current) {
      console.error('[ExerciseProvider] forceSave: Timeout waiting for ongoing save after ~8s')
      return false
    }

    // If nothing to save, return success
    if (saveQueueRef.current.size === 0) {
      return true
    }

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      // Process all pending saves and track results
      const entries = Array.from(saveQueueRef.current.entries())
      const results = await Promise.all(
        entries.map(async ([key, data]) => {
          const { sessionPlanExerciseId, exerciseId, setIndex, updates } = data
          // Pass sessionPlanExerciseId for precise exercise instance identification
          const success = await saveExercisePerformance(
            sessionId!,
            exerciseId,
            { set_index: setIndex, ...updates },
            true, // immediate save
            sessionPlanExerciseId // CRITICAL: Pass session_plan_exercise_id for unique lookup
          )
          return { key, success }
        })
      )

      // Check results and handle failures
      let allSucceeded = true
      for (const { key, success } of results) {
        if (success) {
          saveQueueRef.current.delete(key)
        } else {
          allSucceeded = false
          console.error('[ExerciseProvider] Force save failed for key:', key)
        }
      }

      if (allSucceeded) {
        setSaveStatus('saved')
        // Clear draft on successful save (Phase 3)
        if (sessionId) {
          clearDraft(sessionId)
        }
        return true
      } else {
        setSaveStatus('error')
        return false
      }
    } catch (error) {
      console.error('[ExerciseProvider] Force save failed:', error)
      setSaveStatus('error')
      return false
    } finally {
      isSavingRef.current = false
    }
  }, [sessionId, saveExercisePerformance])

  /**
   * Check if there are pending unsaved changes
   * @returns boolean - true if there are unsaved changes
   */
  const hasPendingChanges = useCallback((): boolean => {
    return saveQueueRef.current.size > 0 || saveStatus === 'saving'
  }, [saveStatus])

  // Keep exercisesRef in sync with state (Phase 3: for draft save)
  useEffect(() => {
    exercisesRef.current = exercises
  }, [exercises])

  // CRITICAL FIX: Cleanup timeouts and queue when sessionId changes or on unmount
  // This prevents cross-session data corruption and memory leaks
  useEffect(() => {
    // Clear any pending timeouts and queue when sessionId changes
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current)
        draftTimeoutRef.current = null
      }
      // Clear save queue to prevent old session data from being saved to new session
      saveQueueRef.current.clear()
      isSavingRef.current = false
    }
  }, [sessionId]) // Re-run cleanup when sessionId changes

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