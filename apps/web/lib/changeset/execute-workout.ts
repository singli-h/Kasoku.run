/**
 * ChangeSet Pattern: Workout Execution Adapter
 *
 * Converts ChangeRequests to the format expected by workout server actions
 * and handles the execution of approved changesets for the athlete workout domain.
 *
 * Unlike session planning which uses bulk save, workout execution uses
 * individual set/exercise mutations.
 *
 * IMPORTANT: proposedData is stored in snake_case format (matching database columns).
 * We use snake_case directly in execution to avoid conversion bugs between
 * camelCase field names (e.g., workoutLogExerciseId vs workoutLogExerciseId_fk).
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-execution-flow.md
 */

import {
  addExercisePerformanceAction,
  updateExercisePerformanceAction,
} from '@/actions/sessions/training-session-actions'
import {
  addWorkoutExerciseAction,
  updateWorkoutExerciseAction,
  updateWorkoutNotesAction,
} from '@/actions/workout/workout-exercise-actions'
import type { ChangeRequest, ChangeSet, ExecutionResult } from './types'
import { classifyError } from './errors'

/**
 * Workout update fields for extractWorkoutUpdates
 * Matches the fields that can be updated on workout_logs
 */
interface WorkoutUpdate {
  notes?: string | null
  session_status?: string | null
}

/**
 * Executes an approved ChangeSet for workout domain.
 *
 * Unlike session planning which does a bulk save, workout changes are
 * applied individually using existing workout actions.
 *
 * Flow:
 * 1. Sort changes by execution order (exercises before sets)
 * 2. Apply each change using appropriate action
 * 3. Track ID mappings for new entities
 * 4. Return execution result
 *
 * @param changeset - The approved changeset to execute
 * @param workoutLogId - The workout log ID
 * @returns Execution result with success/failure status
 */
export async function executeWorkoutChangeSet(
  changeset: ChangeSet,
  workoutLogId: string
): Promise<ExecutionResult> {
  try {
    console.log('[executeWorkoutChangeSet] Starting execution')
    console.log('[executeWorkoutChangeSet] ChangeRequests:', JSON.stringify(changeset.changeRequests, null, 2))

    // Map to track temp IDs → real IDs for new entities
    const idMappings: Record<string, string> = {}

    // Sort by execution order (exercises before sets)
    const sortedRequests = [...changeset.changeRequests].sort(
      (a, b) => a.executionOrder - b.executionOrder
    )

    // Process each change request
    // NOTE: proposedData is already in snake_case format from transformations
    // We use it directly to avoid conversion bugs with field name mappings
    for (const request of sortedRequests) {
      console.log(`[executeWorkoutChangeSet] Processing: ${request.operationType} ${request.entityType} (entityId: ${request.entityId})`)

      // Use snake_case data directly - no conversion needed
      const proposedData = request.proposedData

      switch (request.entityType) {
        case 'workout_log_exercise':
          await applyWorkoutExerciseChange(request, proposedData, idMappings, workoutLogId)
          break

        case 'workout_log_set':
          await applyWorkoutSetChange(request, proposedData, idMappings)
          break

        case 'workout_log':
          await applyWorkoutLogChange(request, proposedData, workoutLogId)
          break
      }
    }

    // Note: Revalidation is handled by:
    // 1. Server action mutations (addExercisePerformanceAction has revalidatePath)
    // 2. React Query refetchOnWindowFocus in WorkoutSessionClient
    console.log('[executeWorkoutChangeSet] Execution complete')

    return {
      status: 'approved',
      idMappings,
    }
  } catch (error) {
    console.error('[executeWorkoutChangeSet] Error:', error)

    return {
      status: 'execution_failed',
      error: classifyError(error),
    }
  }
}

/**
 * Applies a single workout set change.
 *
 * NOTE: proposedData uses snake_case field names (e.g., workout_log_exercise_id, set_index)
 * to match the database column names and avoid conversion bugs.
 */
async function applyWorkoutSetChange(
  request: ChangeRequest,
  proposedData: Record<string, unknown> | null,
  idMappings: Record<string, string>
): Promise<void> {
  // Use snake_case field name directly (workout_log_exercise_id)
  const workoutLogExerciseId = proposedData?.workout_log_exercise_id as string | undefined

  if (!workoutLogExerciseId) {
    console.warn('[applyWorkoutSetChange] Missing workout_log_exercise_id, skipping. proposedData:', proposedData)
    return
  }

  switch (request.operationType) {
    case 'create': {
      // Add new set to exercise - use snake_case field names
      const setData = {
        set_index: (proposedData?.set_index as number) ?? 1,
        reps: proposedData?.reps as number | undefined,
        weight: proposedData?.weight as number | undefined,
        distance: proposedData?.distance as number | undefined,
        performing_time: proposedData?.performing_time as number | undefined,
        rest_time: proposedData?.rest_time as number | undefined,
        rpe: proposedData?.rpe as number | undefined,
        tempo: proposedData?.tempo as string | undefined,
        resistance: proposedData?.resistance as number | undefined,
      }

      const result = await addExercisePerformanceAction(workoutLogExerciseId, setData)

      if (!result.isSuccess) {
        throw new Error(`Failed to add set: ${result.message}`)
      }

      // Track ID mapping if we have a temp ID
      if (request.entityId && result.data?.id) {
        idMappings[request.entityId] = String(result.data.id)
      }

      console.log('[applyWorkoutSetChange] Created set:', result.data)
      break
    }

    case 'update': {
      // Update existing set
      const setId = request.currentData?.id as string | undefined

      if (!setId) {
        console.warn('[applyWorkoutSetChange] Missing set ID for update, skipping')
        return
      }

      // Use snake_case field names
      const updates = {
        reps: proposedData?.reps as number | undefined,
        weight: proposedData?.weight as number | undefined,
        distance: proposedData?.distance as number | undefined,
        performing_time: proposedData?.performing_time as number | undefined,
        rest_time: proposedData?.rest_time as number | undefined,
        rpe: proposedData?.rpe as number | undefined,
        tempo: proposedData?.tempo as string | undefined,
        resistance: proposedData?.resistance as number | undefined,
        completed: proposedData?.completed as boolean | undefined,
      }

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      )

      const result = await updateExercisePerformanceAction(setId, filteredUpdates)

      if (!result.isSuccess) {
        throw new Error(`Failed to update set: ${result.message}`)
      }

      console.log('[applyWorkoutSetChange] Updated set:', result.data)
      break
    }

    case 'delete': {
      // Delete set - for MVP, we'll just mark it as skipped or handle it differently
      // Actual deletion would require a new action
      console.log('[applyWorkoutSetChange] Delete set not implemented in MVP')
      break
    }
  }
}

/**
 * Applies a single workout exercise change (create or update).
 *
 * NOTE: proposedData uses snake_case field names (e.g., exercise_id, exercise_order)
 * to match the database column names and avoid conversion bugs.
 */
async function applyWorkoutExerciseChange(
  request: ChangeRequest,
  proposedData: Record<string, unknown> | null,
  idMappings: Record<string, string>,
  workoutLogId: string
): Promise<void> {
  switch (request.operationType) {
    case 'create': {
      // Add new exercise to workout - use snake_case field names
      const exerciseId = proposedData?.exercise_id as number | undefined

      if (!exerciseId) {
        console.warn('[applyWorkoutExerciseChange] Missing exercise_id, skipping. proposedData:', proposedData)
        return
      }

      const result = await addWorkoutExerciseAction(workoutLogId, {
        exercise_id: exerciseId,
        exercise_order: proposedData?.exercise_order as number | undefined,
        notes: proposedData?.notes as string | undefined,
      })

      if (!result.isSuccess) {
        throw new Error(`Failed to add exercise: ${result.message}`)
      }

      // Track ID mapping if we have a temp ID
      if (request.entityId && result.data?.id) {
        idMappings[request.entityId] = String(result.data.id)
      }

      console.log('[applyWorkoutExerciseChange] Created exercise:', result.data)
      break
    }

    case 'update': {
      // Update exercise (swap or update notes)
      const workoutLogExerciseId = (request.currentData?.id as string | undefined)
        ?? request.entityId

      if (!workoutLogExerciseId) {
        console.warn('[applyWorkoutExerciseChange] Missing workoutLogExerciseId, skipping')
        return
      }

      // Use snake_case field names
      const updates: Record<string, unknown> = {}
      if (proposedData?.exercise_id) updates.exercise_id = proposedData.exercise_id
      if (proposedData?.exercise_order) updates.exercise_order = proposedData.exercise_order
      if (proposedData?.notes !== undefined) updates.notes = proposedData.notes

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      )

      if (Object.keys(filteredUpdates).length === 0) {
        console.log('[applyWorkoutExerciseChange] No updates to apply')
        return
      }

      const result = await updateWorkoutExerciseAction(workoutLogExerciseId, filteredUpdates)

      if (!result.isSuccess) {
        throw new Error(`Failed to update exercise: ${result.message}`)
      }

      console.log('[applyWorkoutExerciseChange] Updated exercise:', result.data)
      break
    }

    case 'delete': {
      // Athletes don't delete exercises - they swap instead
      console.log('[applyWorkoutExerciseChange] Delete not supported for athletes (use swap instead)')
      break
    }
  }
}

/**
 * Applies a workout log change (notes update).
 *
 * NOTE: proposedData uses snake_case field names to match the database.
 */
async function applyWorkoutLogChange(
  request: ChangeRequest,
  proposedData: Record<string, unknown> | null,
  workoutLogId: string
): Promise<void> {
  if (request.operationType !== 'update') {
    console.log('[applyWorkoutLogChange] Only update operation supported')
    return
  }

  // Use snake_case field name directly
  const notes = proposedData?.notes as string | undefined

  if (notes === undefined) {
    console.log('[applyWorkoutLogChange] No notes to update')
    return
  }

  const result = await updateWorkoutNotesAction(workoutLogId, notes)

  if (!result.isSuccess) {
    throw new Error(`Failed to update workout notes: ${result.message}`)
  }

  console.log('[applyWorkoutLogChange] Updated notes:', notes)
}

/**
 * Extracts workout-level updates from change requests.
 *
 * NOTE: proposedData uses snake_case field names to match the database.
 */
export function extractWorkoutUpdates(
  changeRequests: ChangeRequest[]
): Partial<WorkoutUpdate> {
  const workoutUpdates: Partial<WorkoutUpdate> = {}

  for (const request of changeRequests) {
    if (request.entityType === 'workout_log' && request.operationType === 'update') {
      // Use snake_case field names directly - no conversion needed
      const proposedData = request.proposedData

      if (proposedData?.notes) workoutUpdates.notes = proposedData.notes as string
      if (proposedData?.session_status)
        workoutUpdates.session_status = proposedData.session_status as string
    }
  }

  return workoutUpdates
}
