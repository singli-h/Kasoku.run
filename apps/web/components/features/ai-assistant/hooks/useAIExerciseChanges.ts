'use client'

/**
 * useAIExerciseChanges Hook
 *
 * Computes AI change info for all exercises in a session.
 * Returns a Map that can be passed to WorkoutView.
 *
 * Safe to use outside of ChangeSetProvider - returns empty map.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import { useMemo } from 'react'
import { useChangeSetOptional } from '@/lib/changeset/useChangeSet'
import type { UIDisplayType } from '@/lib/changeset/types'
import { deriveUIDisplayType } from '../indicators/ChangeTypeBadge'

export interface AISetChangeInfo {
  changeType: UIDisplayType
  /** For CREATE: the proposed set data to render as ghost row */
  proposedData?: Record<string, unknown> | null
  /** For UPDATE: current data for diff display */
  currentData?: Record<string, unknown> | null
}

export interface AIExerciseChangeInfo {
  hasPendingChange: boolean
  changeType: UIDisplayType | null
  /** For CREATE: the proposed exercise data */
  proposedData?: Record<string, unknown> | null
  /** For DELETE/UPDATE: current data */
  currentData?: Record<string, unknown> | null
  /** Map of set ID to change info (keyed by real ID for UPDATE/DELETE, temp ID for CREATE) */
  setChanges: Map<string | number, AISetChangeInfo>
  /** Pending CREATE sets (for rendering ghost rows) */
  pendingNewSets: AISetChangeInfo[]
  pendingSetCount: number
}

interface UseAIExerciseChangesOptions {
  /** Entity type for exercises (default: 'preset_exercise') */
  exerciseEntityType?: 'preset_exercise' | 'training_exercise'
  /** Entity type for sets (default: 'preset_set') */
  setEntityType?: 'preset_set' | 'training_set'
}

/**
 * Get AI change info for all exercises in the current changeset.
 *
 * @returns Map of exercise ID to change info
 *
 * @example
 * ```tsx
 * const aiChanges = useAIExerciseChanges()
 *
 * return (
 *   <WorkoutView
 *     exercises={exercises}
 *     aiChangesByExercise={aiChanges}
 *   />
 * )
 * ```
 */
export function useAIExerciseChanges(
  options: UseAIExerciseChangesOptions = {}
): Map<string | number, AIExerciseChangeInfo> {
  const {
    exerciseEntityType = 'preset_exercise',
    setEntityType = 'preset_set',
  } = options

  const context = useChangeSetOptional()

  return useMemo(() => {
    const result = new Map<string | number, AIExerciseChangeInfo>()

    // Return empty map if outside AI context
    if (!context || !context.changeset) {
      return result
    }

    const { changeset } = context

    // Group changes by exercise
    // First, collect all exercise-level changes
    changeset.changeRequests
      .filter(req => req.entityType === exerciseEntityType)
      .forEach(req => {
        const exerciseId = req.entityId
        if (exerciseId == null) return

        const changeType = deriveUIDisplayType(
          req.operationType,
          req.currentData,
          req.proposedData
        )

        result.set(exerciseId, {
          hasPendingChange: true,
          changeType,
          proposedData: req.proposedData,
          currentData: req.currentData,
          setChanges: new Map(),
          pendingNewSets: [],
          pendingSetCount: 0,
        })
      })

    // Then, collect all set-level changes and group by exercise
    changeset.changeRequests
      .filter(req => req.entityType === setEntityType)
      .forEach(req => {
        // Get exercise ID from the set's data
        const rawExerciseId =
          req.currentData?.session_plan_exercise_id ??
          req.currentData?.exercise_id ??
          req.currentData?.preset_exercise_id ??
          req.proposedData?.session_plan_exercise_id ??
          req.proposedData?.exercise_id ??
          req.proposedData?.preset_exercise_id

        // Validate exerciseId is a valid type
        if (rawExerciseId == null) return
        if (typeof rawExerciseId !== 'string' && typeof rawExerciseId !== 'number') return
        const exerciseId: string | number = rawExerciseId

        const changeType = deriveUIDisplayType(
          req.operationType,
          req.currentData,
          req.proposedData
        )

        // Get or create exercise entry
        let exerciseInfo = result.get(exerciseId)
        if (!exerciseInfo) {
          exerciseInfo = {
            hasPendingChange: false,
            changeType: null,
            setChanges: new Map(),
            pendingNewSets: [],
            pendingSetCount: 0,
          }
          result.set(exerciseId, exerciseInfo)
        }

        const setChangeInfo: AISetChangeInfo = {
          changeType,
          proposedData: req.proposedData,
          currentData: req.currentData,
        }

        // For CREATE operations: add to pendingNewSets array (for ghost row rendering)
        if (req.operationType === 'create') {
          exerciseInfo.pendingNewSets.push(setChangeInfo)
          exerciseInfo.pendingSetCount = exerciseInfo.pendingNewSets.length + exerciseInfo.setChanges.size
          return // Don't add to setChanges map for creates
        }

        // For UPDATE/DELETE: use the real set ID from currentData if available
        let setId: string | number | null = null

        // Prefer the real database ID from currentData
        const realId = req.currentData?.id ?? req.currentData?.session_plan_set_id
        if (realId != null && (typeof realId === 'string' || typeof realId === 'number')) {
          setId = realId
        }

        // Fall back to entityId if no real ID found
        if (setId == null && req.entityId != null) {
          setId = req.entityId
        }

        if (setId != null && (typeof setId === 'string' || typeof setId === 'number')) {
          exerciseInfo.setChanges.set(setId, setChangeInfo)
          exerciseInfo.pendingSetCount = exerciseInfo.pendingNewSets.length + exerciseInfo.setChanges.size
        }
      })

    return result
  }, [context, exerciseEntityType, setEntityType])
}
