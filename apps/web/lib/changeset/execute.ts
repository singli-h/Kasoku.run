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
import type { ChangeRequest, ChangeSet, ExecutionResult } from './types'
import { classifyError } from './errors'
import { isTempId } from './buffer-utils'
import { convertKeysToCamelCase, ENTITY_REFERENCE_FIELDS } from './entity-mappings'
import type { SessionEntityType } from './types'

/**
 * Resolves temporary IDs in proposedData to their actual values.
 * During execution, parent entities are processed first (by executionOrder),
 * so their temp IDs can be mapped to real IDs for child entities.
 *
 * For in-memory building (current approach), temp IDs are used directly
 * since the matching happens in-memory before DB operations.
 */
function resolveTemporaryIds(
  data: Record<string, unknown>,
  entityType: SessionEntityType,
  idMap: Map<string, string | number>
): Record<string, unknown> {
  const refFields = ENTITY_REFERENCE_FIELDS[entityType]
  if (!refFields || refFields.length === 0) return data

  const resolved = { ...data }

  for (const field of refFields) {
    const value = resolved[field]
    if (typeof value === 'string' && isTempId(value)) {
      const realId = idMap.get(value)
      if (realId !== undefined) {
        console.log(`[resolveTemporaryIds] Resolved ${field}: ${value} → ${realId}`)
        resolved[field] = realId
      }
    }
  }

  return resolved
}

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
    console.log('[executeChangeSet] Starting execution')
    console.log('[executeChangeSet] ChangeRequests:', JSON.stringify(changeset.changeRequests, null, 2))
    console.log('[executeChangeSet] Current exercises count:', currentExercises.length)

    // Build updated exercises list by applying changes
    const updatedExercises = applyChangesToExercises(
      changeset.changeRequests,
      currentExercises
    )

    console.log('[executeChangeSet] Updated exercises:', JSON.stringify(updatedExercises, null, 2))

    // Extract session updates if any
    const sessionUpdates = extractSessionUpdates(changeset.changeRequests)

    console.log('[executeChangeSet] Session updates:', sessionUpdates)
    console.log('[executeChangeSet] Calling saveSessionWithExercisesAction...')

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
 *
 * Uses an ID map to track temp ID → exercise ID mappings for
 * resolving parent references (e.g., sets referencing new exercises).
 */
function applyChangesToExercises(
  changeRequests: ChangeRequest[],
  currentExercises: SessionExercise[]
): SessionExercise[] {
  // Create a mutable copy
  let exercises = [...currentExercises]

  // Map to track temp IDs → exercise IDs (for parent FK resolution)
  // In the in-memory model, we use temp IDs directly, so this maps temp → temp
  const idMap = new Map<string, string>()

  // Sort by execution order (parents before children)
  const sortedRequests = [...changeRequests].sort(
    (a, b) => a.executionOrder - b.executionOrder
  )

  for (const request of sortedRequests) {
    console.log(`[applyChangesToExercises] Processing: ${request.operationType} ${request.entityType} (entityId: ${request.entityId})`)

    switch (request.entityType) {
      case 'preset_exercise':
        exercises = applyExerciseChange(request, exercises)
        // Track the temp ID for this exercise so sets can reference it
        if (request.operationType === 'create' && request.entityId) {
          idMap.set(request.entityId, request.entityId)
          console.log(`[applyChangesToExercises] Registered exercise ID: ${request.entityId}`)
        }
        break

      case 'preset_set':
        exercises = applySetChange(request, exercises, idMap)
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
        exercise_order: Number(proposedData?.exerciseOrder ?? exercises.length),
        superset_id: (proposedData?.supersetId as number | null) ?? null,
        notes: (proposedData?.notes as string | null) ?? null,
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
              proposedData?.exerciseOrder !== undefined
                ? Number(proposedData.exerciseOrder)
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
 *
 * @param request - The change request
 * @param exercises - Current exercises list
 * @param idMap - Map of temp IDs to resolved IDs (for parent FK resolution)
 */
function applySetChange(
  request: ChangeRequest,
  exercises: SessionExercise[],
  idMap: Map<string, string>
): SessionExercise[] {
  const proposedData = request.proposedData
    ? convertKeysToCamelCase(request.proposedData)
    : null

  // Set changes need the parent exercise ID
  // This may be a temp ID that needs to be resolved
  // Updated to use session_plan naming (post schema migration 2025-Q4)
  let parentExerciseId = proposedData?.sessionPlanExerciseId as string | undefined

  // Try to resolve temp ID if we have a mapping
  if (parentExerciseId && idMap.has(parentExerciseId)) {
    const resolved = idMap.get(parentExerciseId)!
    console.log(`[applySetChange] Resolved parent exercise ID: ${parentExerciseId} → ${resolved}`)
    parentExerciseId = resolved
  }

  console.log(`[applySetChange] Looking for parent exercise: ${parentExerciseId}`)

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
