'use client'

/**
 * useAIChangeForEntity Hook
 *
 * Hook to get pending AI change for a specific entity.
 * Bridges ChangeSet context with component props.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import { useMemo } from 'react'
import { useChangeSet } from '@/lib/changeset/useChangeSet'
import { makeBufferKey } from '@/lib/changeset/buffer-utils'
import type { ChangeRequest, UIDisplayType } from '@/lib/changeset/types'
import { deriveUIDisplayType } from '../indicators/ChangeTypeBadge'

interface UseAIChangeForEntityOptions {
  /** Entity type (e.g., 'preset_exercise', 'preset_set', 'training_set') */
  entityType: string
  /** Entity ID */
  entityId: number | string
}

interface UseAIChangeForEntityResult {
  /** Whether this entity has a pending change */
  hasPendingChange: boolean
  /** The pending change request (if any) */
  pendingChange: ChangeRequest | null
  /** The type of change for UI display */
  changeType: UIDisplayType | null
  /** The proposed data (if any) */
  proposedData: Record<string, unknown> | null
  /** The current data snapshot (if any) */
  currentData: Record<string, unknown> | null
  /** AI's reasoning for this change */
  aiReasoning: string | undefined
}

/**
 * Get pending AI change for a specific entity.
 *
 * @example
 * ```tsx
 * const { hasPendingChange, proposedData, changeType } = useAIChangeForEntity({
 *   entityType: 'preset_set',
 *   entityId: set.id,
 * })
 *
 * if (hasPendingChange) {
 *   return <PendingRowHighlight changeType={changeType}>...</PendingRowHighlight>
 * }
 * ```
 */
export function useAIChangeForEntity({
  entityType,
  entityId,
}: UseAIChangeForEntityOptions): UseAIChangeForEntityResult {
  const { changeset, hasPendingChanges } = useChangeSet()

  return useMemo(() => {
    // Early return if no pending changes
    if (!hasPendingChanges() || !changeset) {
      return {
        hasPendingChange: false,
        pendingChange: null,
        changeType: null,
        proposedData: null,
        currentData: null,
        aiReasoning: undefined,
      }
    }

    // Find matching change request
    const key = makeBufferKey(entityType, String(entityId))
    const pendingChange = changeset.changeRequests.find(
      (req) => makeBufferKey(req.entityType, String(req.entityId)) === key
    )

    if (!pendingChange) {
      return {
        hasPendingChange: false,
        pendingChange: null,
        changeType: null,
        proposedData: null,
        currentData: null,
        aiReasoning: undefined,
      }
    }

    // Derive UI display type
    const changeType = deriveUIDisplayType(
      pendingChange.operationType,
      pendingChange.currentData,
      pendingChange.proposedData
    )

    return {
      hasPendingChange: true,
      pendingChange,
      changeType,
      proposedData: pendingChange.proposedData,
      currentData: pendingChange.currentData,
      aiReasoning: pendingChange.aiReasoning,
    }
  }, [changeset, hasPendingChanges, entityType, entityId])
}

/**
 * Check if an entity has a pending change (lightweight version).
 * Use this when you only need the boolean check.
 */
export function useHasPendingChangeForEntity(
  entityType: string,
  entityId: number | string
): boolean {
  const { hasPendingChange } = useAIChangeForEntity({ entityType, entityId })
  return hasPendingChange
}
