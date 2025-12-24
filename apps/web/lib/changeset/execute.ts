/**
 * ChangeSet Pattern: Execution Adapter
 *
 * Converts ChangeRequests to the format expected by existing server actions
 * and handles the execution of approved changesets.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-execution-flow.md
 */

import { saveSessionWithExercisesAction } from '@/actions/plans/session-planner-actions'
import type {
  SessionExercise,
  Session,
  SetParameter,
} from '@/components/features/plans/session-planner/types'
import type { ChangeRequest, ChangeSet, ExecutionResult, ExecutionError } from './types'
import { classifyError } from './errors'
import { isTempId } from './buffer-utils'
import { convertKeysToCamelCase } from './entity-mappings'

/**
 * Executes an approved ChangeSet by calling the existing server action.
 *
 * Flow:
 * 1. Convert ChangeRequests to SessionExercise[] format
 * 2. Call saveSessionWithExercisesAction
 * 3. Handle temp ID → real ID mapping
 * 4. Return execution result
 *
 * @param changeset - The approved changeset to execute
 * @param currentExercises - Current exercises in the session (for merging)
 * @param sessionId - The session ID
 * @returns Execution result with success/failure status
 */
export async function executeChangeSet(
  changeset: ChangeSet,
  currentExercises: SessionExercise[],
  sessionId: number
): Promise<ExecutionResult> {
  try {
    // Build updated exercises list by applying changes
    const updatedExercises = applyChangesToExercises(
      changeset.changeRequests,
      currentExercises
    )

    // Extract session updates if any
    const sessionUpdates = extractSessionUpdates(changeset.changeRequests)

    // Call existing server action
    const result = await saveSessionWithExercisesAction(
      sessionId,
      sessionUpdates,
      updatedExercises
    )

    if (result.isSuccess) {
      return {
        status: 'approved',
        // Could extract ID mappings from result if needed
      }
    }

    // Server action returned an error
    return {
      status: 'execution_failed',
      error: {
        type: 'LOGIC_DATA',
        code: 'SAVE_FAILED',
        message: result.message,
        failedRequestIndex: 0,
      },
    }
  } catch (error) {
    console.error('[executeChangeSet] Error:', error)

    return {
      status: 'execution_failed',
      error: classifyError(error),
    }
  }
}

/**
 * Applies ChangeRequests to the current exercises list.
 * Returns a new list with all changes applied.
 */
function applyChangesToExercises(
  changeRequests: ChangeRequest[],
  currentExercises: SessionExercise[]
): SessionExercise[] {
  // Create a mutable copy
  let exercises = [...currentExercises]

  // Sort by execution order
  const sortedRequests = [...changeRequests].sort(
    (a, b) => a.executionOrder - b.executionOrder
  )

  for (const request of sortedRequests) {
    switch (request.entityType) {
      case 'preset_exercise':
        exercises = applyExerciseChange(request, exercises)
        break

      case 'preset_set':
        exercises = applySetChange(request, exercises)
        break

      // preset_session changes are handled separately
    }
  }

  return exercises
}

/**
 * Applies a single exercise change to the exercises list.
 */
function applyExerciseChange(
  request: ChangeRequest,
  exercises: SessionExercise[]
): SessionExercise[] {
  const proposedData = request.proposedData
    ? convertKeysToCamelCase(request.proposedData)
    : null

  switch (request.operationType) {
    case 'create': {
      // Add new exercise
      const newExercise: SessionExercise = {
        id: request.entityId ?? `temp_${Date.now()}`,
        exercise_id: Number(proposedData?.exerciseId ?? 0),
        exercise_order: Number(proposedData?.presetOrder ?? exercises.length),
        superset_id: proposedData?.supersetId as number | null ?? null,
        notes: (proposedData?.notes as string) ?? null,
        exercise: proposedData?.exerciseName
          ? {
              id: Number(proposedData?.exerciseId ?? 0),
              name: proposedData.exerciseName as string,
              description: null,
              exercise_type_id: null,
              video_url: null,
            }
          : null,
        sets: [],
      }

      return [...exercises, newExercise]
    }

    case 'update': {
      // Update existing exercise
      return exercises.map((ex) => {
        if (String(ex.id) === request.entityId) {
          return {
            ...ex,
            exercise_id: proposedData?.exerciseId
              ? Number(proposedData.exerciseId)
              : ex.exercise_id,
            exercise_order:
              proposedData?.presetOrder !== undefined
                ? Number(proposedData.presetOrder)
                : ex.exercise_order,
            superset_id:
              proposedData?.supersetId !== undefined
                ? (proposedData.supersetId as number | null)
                : ex.superset_id,
            notes:
              proposedData?.notes !== undefined
                ? (proposedData.notes as string | null)
                : ex.notes,
            // Update exercise reference if exerciseId changed (swap)
            exercise:
              proposedData?.exerciseId && proposedData?.exerciseName
                ? {
                    id: Number(proposedData.exerciseId),
                    name: proposedData.exerciseName as string,
                    description: null,
                    exercise_type_id: null,
                    video_url: null,
                  }
                : ex.exercise,
          }
        }
        return ex
      })
    }

    case 'delete': {
      // Remove exercise
      return exercises.filter((ex) => String(ex.id) !== request.entityId)
    }

    default:
      return exercises
  }
}

/**
 * Applies a single set change to the exercises list.
 */
function applySetChange(
  request: ChangeRequest,
  exercises: SessionExercise[]
): SessionExercise[] {
  const proposedData = request.proposedData
    ? convertKeysToCamelCase(request.proposedData)
    : null

  // Set changes need the parent exercise ID
  const parentExerciseId = proposedData?.exercisePresetId as string | undefined

  switch (request.operationType) {
    case 'create': {
      // Add new set(s) to exercise
      return exercises.map((ex) => {
        if (String(ex.id) === parentExerciseId) {
          const setCount = Number(proposedData?.setCount ?? 1)
          const newSets: SetParameter[] = []

          for (let i = 0; i < setCount; i++) {
            const setIndex = ex.sets.length + i + 1
            newSets.push({
              set_index: setIndex,
              reps: (proposedData?.reps as number) ?? null,
              weight: (proposedData?.weight as number) ?? null,
              distance: (proposedData?.distance as number) ?? null,
              performing_time: (proposedData?.performingTime as number) ?? null,
              rest_time: (proposedData?.restTime as number) ?? null,
              tempo: (proposedData?.tempo as string) ?? null,
              rpe: (proposedData?.rpe as number) ?? null,
              resistance_unit_id: null,
              power: (proposedData?.power as number) ?? null,
              velocity: (proposedData?.velocity as number) ?? null,
              effort: (proposedData?.effort as number) ?? null,
              height: (proposedData?.height as number) ?? null,
              resistance: (proposedData?.resistance as number) ?? null,
            })
          }

          return {
            ...ex,
            sets: [...ex.sets, ...newSets],
          }
        }
        return ex
      })
    }

    case 'update': {
      // Update set(s)
      const setIndex = proposedData?.setIndex as number | undefined
      const applyToAll = proposedData?.applyToAllSets as boolean | undefined

      return exercises.map((ex) => {
        if (String(ex.id) === parentExerciseId) {
          const updatedSets = ex.sets.map((set) => {
            // Apply to specific set or all sets
            if (applyToAll || set.set_index === setIndex) {
              return {
                ...set,
                reps: proposedData?.reps !== undefined ? (proposedData.reps as number) : set.reps,
                weight: proposedData?.weight !== undefined ? (proposedData.weight as number) : set.weight,
                distance: proposedData?.distance !== undefined ? (proposedData.distance as number) : set.distance,
                performing_time: proposedData?.performingTime !== undefined ? (proposedData.performingTime as number) : set.performing_time,
                rest_time: proposedData?.restTime !== undefined ? (proposedData.restTime as number) : set.rest_time,
                tempo: proposedData?.tempo !== undefined ? (proposedData.tempo as string) : set.tempo,
                rpe: proposedData?.rpe !== undefined ? (proposedData.rpe as number) : set.rpe,
                power: proposedData?.power !== undefined ? (proposedData.power as number) : set.power,
                velocity: proposedData?.velocity !== undefined ? (proposedData.velocity as number) : set.velocity,
                effort: proposedData?.effort !== undefined ? (proposedData.effort as number) : set.effort,
                height: proposedData?.height !== undefined ? (proposedData.height as number) : set.height,
                resistance: proposedData?.resistance !== undefined ? (proposedData.resistance as number) : set.resistance,
              }
            }
            return set
          })

          return { ...ex, sets: updatedSets }
        }
        return ex
      })
    }

    case 'delete': {
      // Remove set(s)
      const setIndex = proposedData?.setIndex as number | undefined
      const removeCount = Number(proposedData?.removeCount ?? 1)

      return exercises.map((ex) => {
        if (String(ex.id) === parentExerciseId) {
          let updatedSets: SetParameter[]

          if (setIndex !== undefined) {
            // Remove specific set
            updatedSets = ex.sets.filter((set) => set.set_index !== setIndex)
          } else {
            // Remove from end
            updatedSets = ex.sets.slice(0, -removeCount)
          }

          // Renumber remaining sets
          updatedSets = updatedSets.map((set, idx) => ({
            ...set,
            set_index: idx + 1,
          }))

          return { ...ex, sets: updatedSets }
        }
        return ex
      })
    }

    default:
      return exercises
  }
}

/**
 * Extracts session-level updates from change requests.
 */
function extractSessionUpdates(
  changeRequests: ChangeRequest[]
): Partial<Session> {
  const sessionUpdates: Partial<Session> = {}

  for (const request of changeRequests) {
    if (request.entityType === 'preset_session' && request.operationType === 'update') {
      const proposedData = request.proposedData
        ? convertKeysToCamelCase(request.proposedData)
        : null

      if (proposedData?.name) sessionUpdates.name = proposedData.name as string
      if (proposedData?.description)
        sessionUpdates.description = proposedData.description as string
    }
  }

  return sessionUpdates
}
