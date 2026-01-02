/**
 * Workout API Integration Hook
 * Connects workout interface with training session actions for session management
 * 
 * Provides auto-save functionality, optimistic updates, and error handling
 * for seamless workout execution experience
 */

"use client"

import { useState, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  createTrainingSessionAction,
  getTrainingSessionByIdAction,
  updateTrainingSessionAction,
  addExercisePerformanceByExerciseIdAction,
  updateExercisePerformanceAction,
  completeTrainingSessionAction
} from "@/actions/sessions/training-session-actions"
import { startTrainingSessionAction as startExistingSessionAction } from "@/actions/workout/workout-session-actions"
import { 
  type WorkoutLogWithDetails,
  type ExerciseTrainingDetail
} from "@/types/training"
import { Database } from "@/types/database"

// Hook configuration interface
interface WorkoutApiConfig {
  autoSaveDelay?: number // Delay in ms for auto-save debouncing (default: 2000)
  retryAttempts?: number // Number of retry attempts for failed saves (default: 3)
  enableOptimisticUpdates?: boolean // Enable optimistic UI updates (default: true)
}

// Auto-save queue item interface
interface AutoSaveItem {
  id: string
  type: 'session' | 'exercise_detail'
  data: any
  retryCount: number
}

/**
 * Main workout API integration hook
 */
export function useWorkoutApi(config: WorkoutApiConfig = {}) {
  const {
    autoSaveDelay = 2000,
    retryAttempts = 3,
    enableOptimisticUpdates = true
  } = config

  const { toast } = useToast()
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const autoSaveQueue = useRef<Map<string, AutoSaveItem>>(new Map())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // API state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create a new training session from a plan
   */
  const createSession = useCallback(async (
    sessionPlanId: string,
    athleteId?: number
  ): Promise<Database["public"]["Tables"]["workout_logs"]["Row"] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createTrainingSessionAction(sessionPlanId, athleteId)
      
      if (!result.isSuccess) {
        setError(result.message)
        toast({
          title: "Failed to create session",
          description: result.message,
          variant: "destructive"
        })
        return null
      }

      toast({
        title: "Session created",
        description: "Your workout session has been created successfully.",
        variant: "default"
      })
      
      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /**
   * Start an existing assigned session
   */
  const startSession = useCallback(async (
    sessionId: string
  ): Promise<Database["public"]["Tables"]["workout_logs"]["Row"] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await startExistingSessionAction(sessionId)
      
      if (!result.isSuccess) {
        setError(result.message)
        toast({
          title: "Failed to start session",
          description: result.message,
          variant: "destructive"
        })
        return null
      }

      toast({
        title: "Session started",
        description: "Your workout session has been started successfully.",
        variant: "default"
      })
      
      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /**
   * Get session details with exercises and training data
   */
  const getSession = useCallback(async (
    sessionId: string
  ): Promise<WorkoutLogWithDetails | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getTrainingSessionByIdAction(sessionId)
      
      if (!result.isSuccess) {
        setError(result.message)
        return null
      }
      
      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update session (status, notes, etc.) with auto-save
   */
  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Database["public"]["Tables"]["workout_logs"]["Update"]>,
    immediate = false
  ): Promise<boolean> => {
    const saveItem: AutoSaveItem = {
      id: `session-${sessionId}`,
      type: 'session',
      data: { sessionId, updates },
      retryCount: 0
    }

    if (immediate) {
      return await performSessionUpdate(saveItem)
    } else {
      // Add to auto-save queue
      autoSaveQueue.current.set(saveItem.id, saveItem)
      scheduleAutoSave()
      return true // Optimistic response
    }
  }, [])

  /**
   * Complete session
   */
  const completeSession = useCallback(async (
    sessionId: string,
    notes?: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await completeTrainingSessionAction(sessionId, notes)
      
      if (!result.isSuccess) {
        setError(result.message)
        toast({
          title: "Failed to complete session",
          description: result.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Session completed!",
        description: "Your workout has been completed and saved.",
        variant: "default"
      })
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /**
   * Save exercise performance data (sets, reps, weight, etc.)
   * Accepts both workout_log_set field names (performing_time, rest_time) and legacy names (duration)
   */
  const saveExercisePerformance = useCallback(async (
    sessionId: string,
    exerciseId: number,
    setData: {
      set_index: number
      reps?: number
      weight?: number
      distance?: number
      duration?: number // Legacy name
      performing_time?: number // Database field name
      rest_time?: number // Database field name
      power?: number
      resistance?: number
      velocity?: number
      height?: number
      effort?: number
      tempo?: string
      rpe?: number
      completed?: boolean
    },
    immediate = false
  ): Promise<boolean> => {
    const saveItem: AutoSaveItem = {
      id: `exercise-${sessionId}-${exerciseId}-${setData.set_index}`,
      type: 'exercise_detail',
      data: { sessionId, exerciseId, setData },
      retryCount: 0
    }

    if (immediate) {
      return await performExerciseUpdate(saveItem)
    } else {
      // Add to auto-save queue
      autoSaveQueue.current.set(saveItem.id, saveItem)
      scheduleAutoSave()
      return true // Optimistic response
    }
  }, [])

  /**
   * Update existing exercise performance data
   */
  const updateExercisePerformance = useCallback(async (
    detailId: string,
    updates: Partial<ExerciseTrainingDetail>,
    immediate = false
  ): Promise<boolean> => {
    if (immediate) {
      try {
        const result = await updateExercisePerformanceAction(detailId, updates)
        
        if (!result.isSuccess) {
          setError(result.message)
          return false
        }
        
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        setError(errorMessage)
        return false
      }
    } else {
      // For now, immediate updates only for existing performance data
      return await updateExercisePerformance(detailId, updates, true)
    }
  }, [])

  /**
   * Schedule auto-save with debouncing
   */
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      processAutoSaveQueue()
    }, autoSaveDelay)
  }, [autoSaveDelay])

  /**
   * Process the auto-save queue
   */
  const processAutoSaveQueue = useCallback(async () => {
    if (autoSaveQueue.current.size === 0) return

    setIsSaving(true)
    const items = Array.from(autoSaveQueue.current.values())
    const results = await Promise.allSettled(
      items.map(item => {
        if (item.type === 'session') {
          return performSessionUpdate(item)
        } else {
          return performExerciseUpdate(item)
        }
      })
    )

    // Handle failed saves and retry logic
    const failedItems: AutoSaveItem[] = []
    results.forEach((result, index) => {
      const item = items[index]
      
      if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) {
        if (item.retryCount < retryAttempts) {
          item.retryCount++
          failedItems.push(item)
        } else {
          // Max retries reached, notify user
          toast({
            title: "Auto-save failed",
            description: `Failed to save ${item.type} data after ${retryAttempts} attempts.`,
            variant: "destructive"
          })
        }
      }
      
      // Remove from queue if successful or max retries reached
      autoSaveQueue.current.delete(item.id)
    })

    // Re-queue failed items for retry
    failedItems.forEach(item => {
      autoSaveQueue.current.set(item.id, item)
    })

    // Schedule retry if there are failed items
    if (failedItems.length > 0) {
      setTimeout(() => {
        processAutoSaveQueue()
      }, autoSaveDelay * 2) // Longer delay for retries
    } else {
      setLastSaveTime(new Date())
    }

    setIsSaving(false)
  }, [retryAttempts, autoSaveDelay, toast])

  /**
   * Perform session update
   */
  const performSessionUpdate = useCallback(async (item: AutoSaveItem): Promise<boolean> => {
    try {
      const { sessionId, updates } = item.data
      const result = await updateTrainingSessionAction(sessionId, updates)
      
      if (!result.isSuccess) {
        console.error('Session update failed:', result.message)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Session update error:', error)
      return false
    }
  }, [])

  /**
   * Perform exercise performance update
   * Handles both legacy (duration) and database (performing_time, rest_time) field names
   */
  const performExerciseUpdate = useCallback(async (item: AutoSaveItem): Promise<boolean> => {
    try {
      const { sessionId, exerciseId, setData } = item.data
      console.log('[performExerciseUpdate] Input setData:', JSON.stringify(setData, null, 2))

      // Convert our workout field names to database field names
      // Support both legacy 'duration' and database 'performing_time' field names
      const dbSetData = {
        set_index: setData.set_index,
        reps: setData.reps,
        weight: setData.weight,
        distance: setData.distance,
        performing_time: setData.performing_time ?? setData.duration, // Accept both field names
        rest_time: setData.rest_time,
        power: setData.power,
        resistance: setData.resistance,
        velocity: setData.velocity,
        height: setData.height,
        effort: setData.effort,
        tempo: setData.tempo,
        rpe: setData.rpe,
        completed: setData.completed
      }
      console.log('[performExerciseUpdate] dbSetData:', JSON.stringify(dbSetData, null, 2))

      const result = await addExercisePerformanceByExerciseIdAction(sessionId, exerciseId, dbSetData)
      console.log('[performExerciseUpdate] Result:', result.isSuccess, result.message)

      if (!result.isSuccess) {
        console.error('Exercise performance save failed:', result.message)
        return false
      }

      return true
    } catch (error) {
      console.error('Exercise performance save error:', error)
      return false
    }
  }, [])

  /**
   * Force save all pending changes immediately
   */
  const forceSave = useCallback(async (): Promise<boolean> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    if (autoSaveQueue.current.size > 0) {
      await processAutoSaveQueue()
      return autoSaveQueue.current.size === 0
    }
    
    return true
  }, [processAutoSaveQueue])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Session management
    createSession,
    startSession,
    getSession,
    updateSession,
    completeSession,
    
    // Exercise performance
    saveExercisePerformance,
    updateExercisePerformance,
    
    // Auto-save management
    forceSave,
    isSaving,
    lastSaveTime,
    pendingSaves: autoSaveQueue.current.size,
    
    // State
    isLoading,
    error,
    clearError,
    
    // Configuration
    autoSaveDelay,
    retryAttempts,
    enableOptimisticUpdates
  }
}