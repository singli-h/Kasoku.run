'use client'

/**
 * useAISetChanges Hook
 *
 * Hook to get all pending set changes for an exercise.
 * Useful for exercise cards that need to show AI indicators on multiple sets.
 *
 * Safe to use outside of ChangeSetProvider - returns empty results.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import { useMemo } from 'react'
import { useChangeSetOptional } from '@/lib/changeset/useChangeSet'
import type { ChangeRequest, UIDisplayType } from '@/lib/changeset/types'
import { deriveUIDisplayType } from '../indicators/ChangeTypeBadge'

interface SetChangeInfo {
  /** The change request */
  change: ChangeRequest
  /** UI display type */
  changeType: UIDisplayType
  /** Proposed data */
  proposedData: Record<string, unknown> | null
  /** Current data */
  currentData: Record<string, unknown> | null
}

interface UseAISetChangesResult {
  /** Map of set ID to change info */
  setChanges: Map<string | number, SetChangeInfo>
  /** Whether any sets have pending changes */
  hasChanges: boolean
  /** Count of sets with pending changes */
  pendingCount: number
  /** Get change info for a specific set */
  getSetChange: (setId: string | number) => SetChangeInfo | undefined
}

const EMPTY_RESULT: UseAISetChangesResult = {
  setChanges: new Map(),
  hasChanges: false,
  pendingCount: 0,
  getSetChange: () => undefined,
}

/**
 * Get all pending AI changes for sets in an exercise.
 *
 * @param exerciseId - The exercise ID to get set changes for
 * @param entityType - The set entity type (default: 'preset_set')
 *
 * @example
 * ```tsx
 * const { setChanges, hasChanges, pendingCount } = useAISetChanges(exercise.id)
 *
 * return (
 *   <ExerciseCard>
 *     {hasChanges && <AIBadgeWithCount count={pendingCount} />}
 *     {exercise.sets.map(set => {
 *       const changeInfo = setChanges.get(set.id)
 *       return (
 *         <PendingRowHighlight
 *           isPending={!!changeInfo}
 *           changeType={changeInfo?.changeType}
 *         >
 *           <SetRow set={set} />
 *         </PendingRowHighlight>
 *       )
 *     })}
 *   </ExerciseCard>
 * )
 * ```
 */
export function useAISetChanges(
  exerciseId: number | string,
  entityType: 'session_plan_set' | 'workout_log_set' = 'session_plan_set'
): UseAISetChangesResult {
  const context = useChangeSetOptional()

  return useMemo(() => {
    // Return empty result if outside AI context
    if (!context) {
      return EMPTY_RESULT
    }

    const { changeset } = context
    const setChanges = new Map<string | number, SetChangeInfo>()

    if (!changeset) {
      return EMPTY_RESULT
    }

    // Filter to set changes for this exercise
    changeset.changeRequests
      .filter((req) => {
        // Match entity type
        if (req.entityType !== entityType) return false

        // Match exercise ID from current or proposed data
        // Support both session_plan_exercise_id (snake_case DB) and sessionPlanExerciseId (camelCase)
        const currentExerciseId =
          req.currentData?.session_plan_exercise_id ??
          req.currentData?.sessionPlanExerciseId ??
          req.currentData?.workout_log_exercise_id ??
          req.currentData?.workoutLogExerciseId
        const proposedExerciseId =
          req.proposedData?.session_plan_exercise_id ??
          req.proposedData?.sessionPlanExerciseId ??
          req.proposedData?.workout_log_exercise_id ??
          req.proposedData?.workoutLogExerciseId

        return (
          currentExerciseId === exerciseId ||
          proposedExerciseId === exerciseId ||
          String(currentExerciseId) === String(exerciseId) ||
          String(proposedExerciseId) === String(exerciseId)
        )
      })
      .forEach((req) => {
        const changeType = deriveUIDisplayType(
          req.operationType,
          req.currentData,
          req.proposedData
        )

        setChanges.set(req.entityId ?? '', {
          change: req,
          changeType,
          proposedData: req.proposedData,
          currentData: req.currentData,
        })
      })

    return {
      setChanges,
      hasChanges: setChanges.size > 0,
      pendingCount: setChanges.size,
      getSetChange: (setId) => setChanges.get(setId),
    }
  }, [context, exerciseId, entityType])
}

/**
 * Get pending AI change for the exercise itself (not sets).
 * Useful for detecting exercise-level changes like swap or remove.
 *
 * Safe to use outside of ChangeSetProvider - returns empty results.
 */
export function useAIExerciseChange(
  exerciseId: number | string,
  entityType: 'session_plan_exercise' | 'workout_log_exercise' = 'session_plan_exercise'
) {
  const context = useChangeSetOptional()

  return useMemo(() => {
    // Return empty result if outside AI context
    if (!context) {
      return {
        hasChange: false,
        change: null,
        changeType: null as UIDisplayType | null,
      }
    }

    const { changeset } = context

    if (!changeset) {
      return {
        hasChange: false,
        change: null,
        changeType: null as UIDisplayType | null,
      }
    }

    const change = changeset.changeRequests.find(
      (req) =>
        req.entityType === entityType &&
        (req.entityId === exerciseId || String(req.entityId) === String(exerciseId))
    )

    if (!change) {
      return {
        hasChange: false,
        change: null,
        changeType: null as UIDisplayType | null,
      }
    }

    return {
      hasChange: true,
      change,
      changeType: deriveUIDisplayType(
        change.operationType,
        change.currentData,
        change.proposedData
      ),
    }
  }, [context, exerciseId, entityType])
}
