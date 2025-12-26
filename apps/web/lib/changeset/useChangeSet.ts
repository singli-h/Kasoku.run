'use client'

/**
 * ChangeSet Pattern: useChangeSet Hook
 *
 * Custom hook for accessing and manipulating the ChangeSet context.
 * Provides type-safe access to buffer operations and status management.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md
 */

import { useContext } from 'react'

import { ChangeSetContext } from './ChangeSetContext'
import type { ChangeSetContextValue } from './types'

/**
 * Hook to access the ChangeSet context.
 *
 * @throws Error if used outside of ChangeSetProvider
 * @returns The ChangeSet context value with all buffer operations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     changeset,
 *     status,
 *     upsert,
 *     clear,
 *     getPendingCount,
 *   } = useChangeSet()
 *
 *   // Add a change to the buffer
 *   upsert({
 *     id: 'cr_123',
 *     operationType: 'create',
 *     entityType: 'preset_exercise',
 *     entityId: 'temp_001',
 *     currentData: null,
 *     proposedData: { exercise_id: 456 },
 *     executionOrder: 1,
 *     createdAt: new Date(),
 *   })
 *
 *   // Check pending count
 *   console.log(`${getPendingCount()} changes pending`)
 * }
 * ```
 */
export function useChangeSet(): ChangeSetContextValue {
  const context = useContext(ChangeSetContext)

  if (!context) {
    throw new Error('useChangeSet must be used within a ChangeSetProvider')
  }

  return context
}

/**
 * Optional hook to access the ChangeSet context.
 * Returns null if used outside of ChangeSetProvider (no throw).
 *
 * Use this for components that may or may not be inside the AI context.
 *
 * @returns The ChangeSet context value or null if outside provider
 */
export function useChangeSetOptional(): ChangeSetContextValue | null {
  return useContext(ChangeSetContext)
}

/**
 * Hook to check if the changeset is in a specific status.
 *
 * @param targetStatus - The status to check for
 * @returns true if the changeset is in the specified status
 *
 * @example
 * ```tsx
 * const isPending = useChangeSetStatus('pending_approval')
 * if (isPending) {
 *   return <ApprovalBanner />
 * }
 * ```
 */
export function useChangeSetStatus(
  targetStatus: ChangeSetContextValue['status']
): boolean {
  const { status } = useChangeSet()
  return status === targetStatus
}

/**
 * Hook to check if there are pending changes in the buffer.
 *
 * @returns true if there are changes in the buffer
 *
 * @example
 * ```tsx
 * const hasChanges = useHasPendingChanges()
 * ```
 */
export function useHasPendingChanges(): boolean {
  const { hasPendingChanges } = useChangeSet()
  return hasPendingChanges()
}

/**
 * Hook to get the count of pending changes.
 *
 * @returns The number of changes in the buffer
 *
 * @example
 * ```tsx
 * const count = usePendingChangeCount()
 * return <Badge>{count} changes</Badge>
 * ```
 */
export function usePendingChangeCount(): number {
  const { getPendingCount } = useChangeSet()
  return getPendingCount()
}

/**
 * Hook to check if the changeset is being built (AI is accumulating changes).
 *
 * @returns true if in building state
 */
export function useIsBuilding(): boolean {
  return useChangeSetStatus('building')
}

/**
 * Hook to check if the changeset is pending user approval.
 *
 * @returns true if pending approval
 */
export function useIsPendingApproval(): boolean {
  return useChangeSetStatus('pending_approval')
}

/**
 * Hook to check if the changeset is being executed.
 *
 * @returns true if executing
 */
export function useIsExecuting(): boolean {
  return useChangeSetStatus('executing')
}
