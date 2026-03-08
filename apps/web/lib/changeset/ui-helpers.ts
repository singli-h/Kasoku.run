/**
 * ChangeSet Pattern: UI Display Type Derivation
 *
 * Converts internal operation types to user-friendly display types.
 * The UI shows 4 types: add, swap, update, remove
 * The internal operations are: create, update, delete
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-v1-vision.md section "UI Display Types"
 */

import type { ChangeRequest, OperationType, UIDisplayType } from './types'

/**
 * Derives the UI display type from a ChangeRequest.
 *
 * Mapping:
 * - create → 'add'
 * - delete → 'remove'
 * - update (exercise_id changed) → 'swap'
 * - update (other fields) → 'update'
 *
 * @param request - The change request
 * @returns The UI display type
 *
 * @example
 * // Add a new exercise
 * deriveUIDisplayType({ operationType: 'create', ... }) // 'add'
 *
 * @example
 * // Swap an exercise (exercise_id changed)
 * deriveUIDisplayType({
 *   operationType: 'update',
 *   entityType: 'session_plan_exercise',
 *   currentData: { exercise_id: 1 },
 *   proposedData: { exercise_id: 2 },
 * }) // 'swap'
 *
 * @example
 * // Update set parameters
 * deriveUIDisplayType({
 *   operationType: 'update',
 *   entityType: 'session_plan_set',
 *   proposedData: { reps: 10 },
 * }) // 'update'
 */
export function deriveUIDisplayType(request: ChangeRequest): UIDisplayType {
  switch (request.operationType) {
    case 'create':
      return 'add'

    case 'delete':
      return 'remove'

    case 'update':
      // Check if this is a swap (exercise_id changed)
      if (isExerciseSwap(request)) {
        return 'swap'
      }
      return 'update'

    default:
      // Exhaustive check - should never happen
      const _exhaustive: never = request.operationType
      throw new Error(`Unknown operation type: ${_exhaustive}`)
  }
}

/**
 * Checks if an update operation is actually a swap (changing the exercise).
 *
 * A swap is detected when:
 * 1. Entity type is 'session_plan_exercise'
 * 2. proposedData contains 'exercise_id'
 * 3. exercise_id is different from currentData.exercise_id
 *
 * @param request - The change request
 * @returns true if this is a swap operation
 */
export function isExerciseSwap(request: ChangeRequest): boolean {
  if (request.operationType !== 'update') return false
  if (request.entityType !== 'session_plan_exercise') return false
  if (!request.proposedData) return false

  const newExerciseId = request.proposedData['exercise_id']
  if (newExerciseId === undefined) return false

  // If we have currentData, check if exercise_id actually changed
  if (request.currentData) {
    const currentExerciseId = request.currentData['exercise_id']
    return newExerciseId !== currentExerciseId
  }

  // If no currentData, assume it's a swap if exercise_id is in proposedData
  return true
}

/**
 * Gets the display label for a UI display type.
 *
 * @param type - The UI display type
 * @returns Human-readable label
 */
export function getDisplayTypeLabel(type: UIDisplayType): string {
  const labels: Record<UIDisplayType, string> = {
    add: 'New',
    swap: 'Swap',
    update: 'Update',
    remove: 'Remove',
  }
  return labels[type]
}

/**
 * Gets the CSS classes for a UI display type.
 *
 * @param type - The UI display type
 * @returns Tailwind CSS classes for styling
 */
export function getDisplayTypeClasses(type: UIDisplayType): {
  badge: string
  background: string
  border: string
  text: string
} {
  const classes: Record<
    UIDisplayType,
    { badge: string; background: string; border: string; text: string }
  > = {
    add: {
      badge: 'bg-green-100 text-green-800',
      background: 'bg-green-50',
      border: 'border-green-200 border-dashed',
      text: 'text-green-700',
    },
    swap: {
      badge: 'bg-blue-100 text-blue-800',
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
    },
    update: {
      badge: 'bg-amber-100 text-amber-800',
      background: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
    },
    remove: {
      badge: 'bg-red-100 text-red-800',
      background: 'bg-red-50 opacity-75',
      border: 'border-red-200',
      text: 'text-red-700',
    },
  }
  return classes[type]
}

/**
 * Gets the icon name for a UI display type (for use with lucide-react).
 *
 * @param type - The UI display type
 * @returns The lucide-react icon name
 */
export function getDisplayTypeIcon(type: UIDisplayType): string {
  const icons: Record<UIDisplayType, string> = {
    add: 'Plus',
    swap: 'RefreshCw',
    update: 'Edit2',
    remove: 'Minus',
  }
  return icons[type]
}

/**
 * Groups change requests by their display type.
 *
 * @param requests - Array of change requests
 * @returns Object with arrays of requests grouped by display type
 */
export function groupByDisplayType(
  requests: ChangeRequest[]
): Record<UIDisplayType, ChangeRequest[]> {
  const groups: Record<UIDisplayType, ChangeRequest[]> = {
    add: [],
    swap: [],
    update: [],
    remove: [],
  }

  for (const request of requests) {
    const displayType = deriveUIDisplayType(request)
    groups[displayType].push(request)
  }

  return groups
}

/**
 * Gets a summary string for a list of changes.
 *
 * @param requests - Array of change requests
 * @returns Summary string (e.g., "2 additions, 1 swap, 3 updates")
 *
 * @example
 * getChangeSummary(requests)
 * // "2 additions, 1 swap"
 */
export function getChangeSummary(requests: ChangeRequest[]): string {
  const groups = groupByDisplayType(requests)
  const parts: string[] = []

  if (groups.add.length > 0) {
    parts.push(`${groups.add.length} addition${groups.add.length > 1 ? 's' : ''}`)
  }
  if (groups.swap.length > 0) {
    parts.push(`${groups.swap.length} swap${groups.swap.length > 1 ? 's' : ''}`)
  }
  if (groups.update.length > 0) {
    parts.push(`${groups.update.length} update${groups.update.length > 1 ? 's' : ''}`)
  }
  if (groups.remove.length > 0) {
    parts.push(`${groups.remove.length} removal${groups.remove.length > 1 ? 's' : ''}`)
  }

  return parts.join(', ') || 'No changes'
}

/**
 * Formats a field change for display (showing old → new value).
 *
 * @param fieldName - Name of the field that changed
 * @param oldValue - Previous value
 * @param newValue - New value
 * @returns Formatted string (e.g., "reps: 8 → 10")
 */
export function formatFieldChange(
  fieldName: string,
  oldValue: unknown,
  newValue: unknown
): string {
  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number') return v.toString()
    if (typeof v === 'string') return v
    return JSON.stringify(v)
  }

  return `${fieldName}: ${formatValue(oldValue)} → ${formatValue(newValue)}`
}

/**
 * Gets the fields that changed between current and proposed data.
 *
 * @param currentData - The entity's current state
 * @param proposedData - The proposed changes
 * @returns Array of field names that changed
 */
export function getChangedFields(
  currentData: Record<string, unknown> | null,
  proposedData: Record<string, unknown> | null
): string[] {
  if (!proposedData) return []

  const changedFields: string[] = []

  for (const [key, newValue] of Object.entries(proposedData)) {
    const oldValue = currentData?.[key]
    if (oldValue !== newValue) {
      changedFields.push(key)
    }
  }

  return changedFields
}

/**
 * Maps operation type to display type for simple cases.
 *
 * @param operationType - The internal operation type
 * @returns The default UI display type (without swap detection)
 */
export function operationToDisplayType(
  operationType: OperationType
): UIDisplayType {
  const map: Record<OperationType, UIDisplayType> = {
    create: 'add',
    update: 'update',
    delete: 'remove',
  }
  return map[operationType]
}
