/**
 * Workout Mutations Hook
 * Standardized React Query mutations with optimistic updates and rollback
 *
 * Pattern: useMutation + onMutate (optimistic) + onError (rollback) + onSettled (invalidate)
 * See: docs/patterns/actionstate-pattern.md
 */

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  addExercisePerformanceByExerciseIdAction,
  updateExercisePerformanceAction,
  updateTrainingSessionAction,
  completeTrainingSessionAction
} from "@/actions/sessions/training-session-actions"
import { startTrainingSessionAction } from "@/actions/workout/workout-session-actions"
import { WORKOUT_QUERY_KEYS } from "../config/query-config"
import type { WorkoutLogWithDetails, WorkoutLogSet } from "@/types/training"

/**
 * Set data for saving workout performance
 */
export interface SetData {
  set_index: number
  reps?: number
  weight?: number
  distance?: number
  performing_time?: number
  power?: number
  resistance?: number
  velocity?: number
  tempo?: string
  completed?: boolean
}

/**
 * Hook for workout set mutations with optimistic updates
 */
export function useSaveWorkoutSet() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ['workout', 'saveSet'],

    mutationFn: async ({
      sessionId,
      exerciseId,
      setData
    }: {
      sessionId: number
      exerciseId: number
      setData: SetData
    }) => {
      const result = await addExercisePerformanceByExerciseIdAction(sessionId, exerciseId, setData)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },

    // T024: Optimistic update - cache snapshot before mutation
    onMutate: async ({ sessionId, exerciseId, setData }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      })

      // Snapshot previous value for rollback
      const previousSession = queryClient.getQueryData<WorkoutLogWithDetails>(
        WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      )

      // Optimistically update the cache
      if (previousSession) {
        queryClient.setQueryData<WorkoutLogWithDetails>(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString()),
          (old) => {
            if (!old) return old

            return {
              ...old,
              workout_log_exercises: old.workout_log_exercises?.map(exercise => {
                if (exercise.exercise?.id !== exerciseId) return exercise

                const updatedSets = [...(exercise.workout_log_sets || [])]
                const setIndex = setData.set_index - 1

                if (updatedSets[setIndex]) {
                  updatedSets[setIndex] = {
                    ...updatedSets[setIndex],
                    ...setData
                  }
                }

                return {
                  ...exercise,
                  workout_log_sets: updatedSets
                }
              })
            }
          }
        )
      }

      // Return context for rollback
      return { previousSession }
    },

    // T025: Rollback on error
    onError: (err, variables, context) => {
      // Restore previous state from snapshot
      if (context?.previousSession) {
        queryClient.setQueryData(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString()),
          context.previousSession
        )
      }

      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Could not save set data",
        variant: "destructive"
      })
    },

    // T026: Cache invalidation on success
    onSettled: (_data, _error, variables) => {
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString())
      })
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY
      })
    }
  })
}

/**
 * Hook for updating existing workout set
 */
export function useUpdateWorkoutSet() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ['workout', 'updateSet'],

    mutationFn: async ({
      setId,
      updates
    }: {
      setId: number
      updates: Partial<WorkoutLogSet>
      sessionId?: number
    }) => {
      const result = await updateExercisePerformanceAction(setId, updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },

    onError: (err) => {
      toast({
        title: "Failed to update",
        description: err instanceof Error ? err.message : "Could not update set",
        variant: "destructive"
      })
    },

    onSettled: (_data, _error, variables) => {
      if (variables.sessionId) {
        queryClient.invalidateQueries({
          queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString())
        })
      }
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY
      })
    }
  })
}

/**
 * Hook for starting a workout session
 */
export function useStartSession() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ['workout', 'startSession'],

    mutationFn: async (sessionId: number) => {
      const result = await startTrainingSessionAction(sessionId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },

    onSuccess: () => {
      toast({
        title: "Session started",
        description: "Your workout session is now in progress"
      })
    },

    onError: (err) => {
      toast({
        title: "Failed to start",
        description: err instanceof Error ? err.message : "Could not start session",
        variant: "destructive"
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY
      })
    }
  })
}

/**
 * Hook for completing a workout session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ['workout', 'completeSession'],

    mutationFn: async ({
      sessionId,
      notes
    }: {
      sessionId: number
      notes?: string
    }) => {
      const result = await completeTrainingSessionAction(sessionId, notes)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },

    // Optimistic update for session status
    onMutate: async ({ sessionId }) => {
      await queryClient.cancelQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      })

      const previousSession = queryClient.getQueryData<WorkoutLogWithDetails>(
        WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      )

      // Optimistically mark as complete
      if (previousSession) {
        queryClient.setQueryData<WorkoutLogWithDetails>(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString()),
          (old) => old ? { ...old, session_status: 'completed' } : old
        )
      }

      return { previousSession }
    },

    onError: (err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString()),
          context.previousSession
        )
      }

      toast({
        title: "Failed to complete",
        description: err instanceof Error ? err.message : "Could not complete session",
        variant: "destructive"
      })
    },

    onSuccess: () => {
      toast({
        title: "Workout Complete!",
        description: "Your session has been saved successfully"
      })
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString())
      })
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY
      })
    }
  })
}

/**
 * Hook for updating session notes
 */
export function useUpdateSessionNotes() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ['workout', 'updateNotes'],

    mutationFn: async ({
      sessionId,
      notes
    }: {
      sessionId: number
      notes: string
    }) => {
      const result = await updateTrainingSessionAction(sessionId, { notes })
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },

    onMutate: async ({ sessionId, notes }) => {
      await queryClient.cancelQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      })

      const previousSession = queryClient.getQueryData<WorkoutLogWithDetails>(
        WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString())
      )

      if (previousSession) {
        queryClient.setQueryData<WorkoutLogWithDetails>(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(sessionId.toString()),
          (old) => old ? { ...old, notes } : old
        )
      }

      return { previousSession }
    },

    onError: (err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString()),
          context.previousSession
        )
      }

      toast({
        title: "Failed to save notes",
        description: err instanceof Error ? err.message : "Could not update notes",
        variant: "destructive"
      })
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId.toString())
      })
    }
  })
}

/**
 * Combined hook for common workout mutations
 * Convenience wrapper for all mutation hooks
 */
export function useWorkoutMutations() {
  const saveSet = useSaveWorkoutSet()
  const updateSet = useUpdateWorkoutSet()
  const startSession = useStartSession()
  const completeSession = useCompleteSession()
  const updateNotes = useUpdateSessionNotes()

  return {
    saveSet,
    updateSet,
    startSession,
    completeSession,
    updateNotes,

    // Aggregate pending state
    isPending:
      saveSet.isPending ||
      updateSet.isPending ||
      startSession.isPending ||
      completeSession.isPending ||
      updateNotes.isPending
  }
}
