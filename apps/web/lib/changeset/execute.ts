/**
 * ChangeSet Pattern: Execution Adapter
 *
 * Converts ChangeRequests to the format expected by existing server actions
 * and handles the execution of approved changesets.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-execution-flow.md
 */

import { saveSessionWithExercisesAction } from '@/actions/plans/session-planner-actions'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'
import type { ChangeRequest, ChangeSet, ExecutionResult } from './types'

import { classifyError } from './errors'
import { convertKeysToCamelCase } from './entity-mappings'

// Debug logging - set to false in production
const DEBUG_EXEC = process.env.NODE_ENV === 'development'

/**
 * Session update fields for extractSessionUpdates
 * Matches the fields that can be updated on session_plans
 */
interface SessionUpdate {
  name?: string | null
  description?: string | null
  date?: string | null
  notes?: string | null
  week?: number | null
  day?: number | null
  session_mode?: string | null
}

/**
 * Executes an approved ChangeSet by calling the existing server action.
 *
 * Flow:
 * 1. Convert ChangeRequests to SessionPlannerExercise[] format
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
  currentExercises: SessionPlannerExercise[],
  sessionId: string
): Promise<ExecutionResult> {
  try {
    if (DEBUG_EXEC) {
      console.log(`[executeChangeSet] ${changeset.changeRequests.length} changes, ${currentExercises.length} existing exercises`)
    }

    // SAFETY GUARD: Abort if exercises context is empty but changeset references existing entities.
    // This prevents the destructive path where saveSessionWithExercisesAction deletes all DB data
    // because the passed exercises list is empty (stale closure / missing context provider).
    const hasExistingEntityChanges = changeset.changeRequests.some(
      r => (r.operationType === 'update' || r.operationType === 'delete') && r.entityType === 'session_plan_exercise'
    )
    if (currentExercises.length === 0 && hasExistingEntityChanges) {
      console.error('[executeChangeSet] SAFETY ABORT: exercises context is empty but changeset modifies existing exercises. This would delete all DB data.')
      return {
        status: 'execution_failed',
        error: {
          type: 'LOGIC_DATA',
          code: 'EMPTY_EXERCISES_GUARD',
          message: 'Cannot apply changes: exercise data not loaded. Please refresh the page and try again.',
          failedRequestIndex: 0,
        },
      }
    }

    // SAFETY GUARD: Reject cross-session changes (execution only supports single session)
    const crossSessionChanges = changeset.changeRequests.filter(r => {
      if (r.entityType !== 'session_plan_exercise') return false
      const targetId = (r.proposedData as Record<string, unknown> | null)?.session_plan_id as string | undefined
      return targetId && targetId !== sessionId
    })
    if (crossSessionChanges.length > 0) {
      console.error('[executeChangeSet] SAFETY ABORT: Cross-session changes detected.',
        [...new Set(crossSessionChanges.map(r => (r.proposedData as Record<string, unknown>)?.session_plan_id))])
      return {
        status: 'execution_failed',
        error: {
          type: 'LOGIC_DATA',
          code: 'CROSS_SESSION_NOT_SUPPORTED',
          message: 'Changes targeting multiple sessions cannot be applied at once. Please modify one session at a time.',
          failedRequestIndex: changeset.changeRequests.indexOf(crossSessionChanges[0]),
        },
      }
    }

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
        updatedExercises,
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
 * NEW APPROACH (simpler and more reliable):
 * 1. Group all set change requests by their parent exercise ID
 * 2. When creating an exercise, look up its sets from the grouped map
 * 3. This avoids the fragile temp ID matching that was causing sets to be lost
 */
function applyChangesToExercises(
  changeRequests: ChangeRequest[],
  currentExercises: SessionPlannerExercise[]
): SessionPlannerExercise[] {
  // Create a mutable copy
  let exercises = [...currentExercises]

  // STEP 1: Pre-group all set creation requests by their parent exercise ID
  // This allows us to attach sets directly when creating exercises
  const setsByParentId = new Map<string, ChangeRequest[]>()
  const orphanedSets: ChangeRequest[] = []

  for (const request of changeRequests) {
    if (request.entityType === 'session_plan_set' && request.operationType === 'create') {
      // Get the parent exercise ID directly from raw proposedData (stored as snake_case)
      // We check both snake_case (from transformations) and camelCase (fallback)
      const rawData = request.proposedData as Record<string, unknown> | null
      const parentId = (
        rawData?.session_plan_exercise_id ??  // Primary: snake_case from transformations
        rawData?.sessionPlanExerciseId        // Fallback: camelCase
      ) as string | undefined

      if (parentId) {
        const existing = setsByParentId.get(parentId) || []
        existing.push(request)
        setsByParentId.set(parentId, existing)
      } else {
        // Track orphaned sets for error reporting instead of silently dropping
        orphanedSets.push(request)
        console.warn(`[applyChanges] Set missing session_plan_exercise_id:`, {
          entityId: request.entityId,
          proposedData: request.proposedData,
        })
      }
    }
  }

  // Report orphaned sets as warnings (but don't fail the execution)
  if (orphanedSets.length > 0) {
    console.error(`[applyChanges] ${orphanedSets.length} set(s) could not be grouped with exercises. These sets will be lost.`)
  }

  if (DEBUG_EXEC) {
    console.log(`[applyChanges] Grouped sets:`, Array.from(setsByParentId.entries()).map(([id, sets]) => `${id}:${sets.length}`).join(', '))
  }

  // STEP 2: Process exercise changes, attaching sets from the grouped map
  for (const request of changeRequests) {
    if (request.entityType === 'session_plan_exercise') {
      exercises = applyExerciseChange(request, exercises, setsByParentId)
    }
  }

  // STEP 2.5: Attach orphaned set creates to EXISTING exercises.
  // Step 2 only consumes setsByParentId for exercise CREATES. When the AI adds sets
  // to existing exercises (most common case: "add a 3rd set"), those set creates
  // are still in setsByParentId. We need to attach them now.
  for (const [parentId, setRequests] of setsByParentId) {
    // Check if any exercise in the result has this ID (existing exercise, not a new create)
    const exerciseIndex = exercises.findIndex(ex => String(ex.id) === parentId)
    if (exerciseIndex === -1) continue

    // Check if these sets were already consumed by an exercise create in Step 2
    // (exercise creates consume their sets via setsByParentId.get(request.entityId))
    // If the exercise already exists in the original list, the sets were NOT consumed.
    const wasNewlyCreated = changeRequests.some(
      r => r.entityType === 'session_plan_exercise' && r.operationType === 'create' && r.entityId === parentId
    )
    if (wasNewlyCreated) continue // Already handled in Step 2

    // Build new sets from the set requests
    const existingExercise = exercises[exerciseIndex]
    const existingSetCount = existingExercise.sets.length

    const newSets = setRequests.flatMap((setReq, reqIndex) => {
      const setData = setReq.proposedData
        ? convertKeysToCamelCase(setReq.proposedData)
        : null

      const setCount = Number(setData?.setCount ?? 1)
      const result: SessionPlannerExercise['sets'] = []

      for (let i = 0; i < setCount; i++) {
        result.push({
          id: `new_set_${Date.now()}_orphan_${reqIndex}_${i}`,
          session_plan_exercise_id: parentId,
          set_index: existingSetCount + result.length + 1,
          reps: (setData?.reps as number) ?? null,
          weight: (setData?.weight as number) ?? null,
          distance: (setData?.distance as number) ?? null,
          performing_time: (setData?.performingTime as number) ?? null,
          rest_time: (setData?.restTime as number) ?? null,
          tempo: (setData?.tempo as string) ?? null,
          rpe: (setData?.rpe as number) ?? null,
          resistance_unit_id: null,
          power: (setData?.power as number) ?? null,
          velocity: (setData?.velocity as number) ?? null,
          effort: (setData?.effort as number) ?? null,
          height: (setData?.height as number) ?? null,
          resistance: (setData?.resistance as number) ?? null,
          completed: false,
          isEditing: false,
        })
      }

      return result
    })

    if (newSets.length > 0) {
      // Re-index all sets (existing + new)
      const allSets = [...existingExercise.sets, ...newSets]
      allSets.forEach((set, idx) => { set.set_index = idx + 1 })

      exercises = exercises.map((ex, idx) =>
        idx === exerciseIndex ? { ...ex, sets: allSets } : ex
      )

      if (DEBUG_EXEC) {
        console.log(`[applyChanges] Attached ${newSets.length} new set(s) to existing exercise ${parentId}`)
      }
    }
  }

  // STEP 3: Process set updates/deletes for existing exercises
  // (Set creates were already handled inline with exercise creates or in Step 2.5)
  for (const request of changeRequests) {
    if (request.entityType === 'session_plan_set' && request.operationType !== 'create') {
      exercises = applySetChange(request, exercises)
    }
  }

  return exercises
}

/**
 * Applies a single exercise change to the exercises list.
 * For create operations, also attaches any sets from the setsByParentId map.
 */
function applyExerciseChange(
  request: ChangeRequest,
  exercises: SessionPlannerExercise[],
  setsByParentId: Map<string, ChangeRequest[]>
): SessionPlannerExercise[] {
  const proposedData = request.proposedData
    ? convertKeysToCamelCase(request.proposedData)
    : null

  switch (request.operationType) {
    case 'create': {
      // Look up sets for this exercise from the pre-grouped map
      const setRequests = setsByParentId.get(request.entityId ?? '') || []

      // Build sets array from the set requests
      const sets: SessionPlannerExercise['sets'] = setRequests.flatMap((setReq, reqIndex) => {
        const setData = setReq.proposedData
          ? convertKeysToCamelCase(setReq.proposedData)
          : null

        const setCount = Number(setData?.setCount ?? 1)
        const result: SessionPlannerExercise['sets'] = []

        for (let i = 0; i < setCount; i++) {
          result.push({
            id: `new_set_${Date.now()}_${reqIndex}_${i}`,
            session_plan_exercise_id: '', // Will be set by save action
            set_index: result.length + 1,
            reps: (setData?.reps as number) ?? null,
            weight: (setData?.weight as number) ?? null,
            distance: (setData?.distance as number) ?? null,
            performing_time: (setData?.performingTime as number) ?? null,
            rest_time: (setData?.restTime as number) ?? null,
            tempo: (setData?.tempo as string) ?? null,
            rpe: (setData?.rpe as number) ?? null,
            resistance_unit_id: null,
            power: (setData?.power as number) ?? null,
            velocity: (setData?.velocity as number) ?? null,
            effort: (setData?.effort as number) ?? null,
            height: (setData?.height as number) ?? null,
            resistance: (setData?.resistance as number) ?? null,
            completed: false,
            isEditing: false,
          })
        }

        return result
      })

      // Re-index the sets
      sets.forEach((set, idx) => {
        set.set_index = idx + 1
      })

      // Add new exercise with its sets
      const newExercise: SessionPlannerExercise = {
        id: request.entityId ?? `new_${Date.now()}`,
        session_plan_id: '', // Will be set by save action
        exercise_id: Number(proposedData?.exerciseId ?? 0),
        exercise_order: Number(proposedData?.exerciseOrder ?? exercises.length + 1),
        superset_id: (proposedData?.supersetId as string | null) ?? null,
        notes: (proposedData?.notes as string | null) ?? null,
        isCollapsed: false,
        isEditing: false,
        validationErrors: [],
        exercise: proposedData?.exerciseName
          ? {
              id: Number(proposedData?.exerciseId ?? 0),
              name: proposedData.exerciseName as string,
              description: undefined,
              exercise_type_id: undefined,
            }
          : null,
        sets,
      }

      return [...exercises, newExercise]
    }

    case 'update': {
      // Update existing exercise
      return exercises.map((ex): SessionPlannerExercise => {
        if (String(ex.id) === request.entityId) {
          const updated: SessionPlannerExercise = {
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
                ? (proposedData.supersetId as string | null) ?? null
                : ex.superset_id ?? null,
            notes:
              proposedData?.notes !== undefined
                ? (proposedData.notes as string | null) ?? null
                : ex.notes ?? null,
            // Update exercise reference if exerciseId changed (swap)
            exercise:
              proposedData?.exerciseId && proposedData?.exerciseName
                ? {
                    id: Number(proposedData.exerciseId),
                    name: proposedData.exerciseName as string,
                    description: undefined,
                    exercise_type_id: undefined,
                    video_url: undefined,
                  }
                : ex.exercise,
          }
          return updated
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
 * Applies a single set change (update/delete) to the exercises list.
 * Note: Set creation is now handled inline with exercise creation in applyExerciseChange.
 *
 * @param request - The change request (update or delete only)
 * @param exercises - Current exercises list
 */
function applySetChange(
  request: ChangeRequest,
  exercises: SessionPlannerExercise[]
): SessionPlannerExercise[] {
  const proposedData = request.proposedData
    ? convertKeysToCamelCase(request.proposedData)
    : null

  // Get the parent exercise ID - check both snake_case (from transformations) and camelCase
  const rawData = request.proposedData as Record<string, unknown> | null
  const parentExerciseId = (
    rawData?.session_plan_exercise_id ??  // Primary: snake_case from transformations
    rawData?.sessionPlanExerciseId ??     // Fallback: camelCase
    proposedData?.sessionPlanExerciseId   // Last resort: converted data
  ) as string | undefined

  switch (request.operationType) {
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
          let updatedSets: SessionPlannerExercise['sets']

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
): Partial<SessionUpdate> {
  const sessionUpdates: Partial<SessionUpdate> = {}

  for (const request of changeRequests) {
    if (request.entityType === 'session_plan' && request.operationType === 'update') {
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
