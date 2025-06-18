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
  startTrainingSessionAction,
  getTrainingSessionByIdAction,
  updateTrainingSessionAction,
  completeTrainingSessionAction,
  addExercisePerformanceAction,
  updateExercisePerformanceAction,
  type ExerciseTrainingSession,
  type ExerciseTrainingSessionWithDetails,
  type ExerciseTrainingDetail
} from "@/actions/training"

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
   * Start a new training session
   */
  const startSession = useCallback(async (
    exercisePresetGroupId: number,
    athleteId?: number
  ): Promise<ExerciseTrainingSession | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await startTrainingSessionAction(exercisePresetGroupId, athleteId)
      
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
    sessionId: number
  ): Promise<ExerciseTrainingSessionWithDetails | null> => {
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
    sessionId: number,
    updates: Partial<ExerciseTrainingSession>,
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
    sessionId: number,
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
   */
  const saveExercisePerformance = useCallback(async (
    sessionId: number,
    exerciseId: number,
    setData: {
      set_index: number
      reps?: number
      weight?: number
      distance?: number
      duration?: number
      power?: number
      resistance?: number
      velocity?: number
      tempo?: string
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
    detailId: number,
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
   */
  const performExerciseUpdate = useCallback(async (item: AutoSaveItem): Promise<boolean> => {
    try {
      const { sessionId, exerciseId, setData } = item.data
      
      // Convert our workout field names to database field names
      const dbSetData = {
        set_index: setData.set_index,
        reps: setData.reps,
        weight: setData.weight,
        distance: setData.distance,
        performing_time: setData.duration, // duration -> performing_time
        power: setData.power,
        resistance: setData.resistance,
        velocity: setData.velocity,
        tempo: setData.tempo,
        completed: setData.completed
      }
      
      const result = await addExercisePerformanceAction(sessionId, exerciseId, dbSetData)
      
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