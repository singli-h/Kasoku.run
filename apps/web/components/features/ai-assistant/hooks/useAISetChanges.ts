'use client'

/**
 * useAISetChanges Hook
 *
 * Hook to get all pending set changes for an exercise.
 * Useful for exercise cards that need to show AI indicators on multiple sets.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import { useMemo } from 'react'
import { useChangeSet } from '@/lib/changeset/useChangeSet'
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
  entityType: 'preset_set' | 'training_set' = 'preset_set'
): UseAISetChangesResult {
  const { changeset } = useChangeSet()

  return useMemo(() => {
    const setChanges = new Map<string | number, SetChangeInfo>()

    if (!changeset) {
      return {
        setChanges,
        hasChanges: false,
        pendingCount: 0,
        getSetChange: () => undefined,
      }
    }

    // Filter to set changes for this exercise
    changeset.changeRequests
      .filter((req) => {
        // Match entity type
        if (req.entityType !== entityType) return false

        // Match exercise ID from current or proposed data
        const currentExerciseId =
          req.currentData?.exercise_id ?? req.currentData?.preset_exercise_id
        const proposedExerciseId =
          req.proposedData?.exercise_id ?? req.proposedData?.preset_exercise_id

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
  }, [changeset, exerciseId, entityType])
}

/**
 * Get pending AI change for the exercise itself (not sets).
 * Useful for detecting exercise-level changes like swap or remove.
 */
export function useAIExerciseChange(
  exerciseId: number | string,
  entityType: 'preset_exercise' | 'training_exercise' = 'preset_exercise'
) {
  const { changeset } = useChangeSet()

  return useMemo(() => {
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
  }, [changeset, exerciseId, entityType])
}
