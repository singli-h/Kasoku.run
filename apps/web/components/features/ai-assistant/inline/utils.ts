/**
 * Inline Proposal Display Utilities
 *
 * Provides utilities for determining how to display AI change proposals,
 * including density-based mode switching between inline diff and summary views.
 *
 * @see docs/features/plans/individual/tasks.md T056, T062
 */

import type { ChangeRequest, ChangeSet } from '@/lib/changeset/types'

/**
 * Display mode for AI change proposals.
 * - 'inline': Show field-level diff directly on the UI elements (low-density)
 * - 'summary': Show a compact summary card with optional expand (high-density)
 */
export type DiffDisplayMode = 'inline' | 'summary'

/**
 * Threshold configuration for density-based display mode switching.
 */
export interface DensityThreshold {
  /** Maximum fields changed per set before switching to summary mode */
  maxFieldsPerSet: number
  /** Maximum sets with changes before switching to summary mode */
  maxSetsWithChanges: number
  /** Maximum total field changes before switching to summary mode */
  maxTotalFieldChanges: number
}

/**
 * Default thresholds for desktop display.
 * More permissive - allows more inline diff before summary.
 */
const DESKTOP_THRESHOLD: DensityThreshold = {
  maxFieldsPerSet: 3,
  maxSetsWithChanges: 4,
  maxTotalFieldChanges: 8,
}

/**
 * Stricter thresholds for mobile display (T062).
 * Switch to summary mode earlier to prevent clutter on small screens.
 *
 * Mobile threshold: 2+ fields OR 2+ sets triggers summary mode.
 */
const MOBILE_THRESHOLD: DensityThreshold = {
  maxFieldsPerSet: 2,
  maxSetsWithChanges: 2,
  maxTotalFieldChanges: 4,
}

/**
 * Counts the number of changed fields in a set update operation.
 */
function countChangedFields(
  currentData: Record<string, unknown> | null,
  proposedData: Record<string, unknown> | null
): number {
  if (!proposedData) return 0
  if (!currentData) {
    // For creates, count all non-null fields as changes
    return Object.values(proposedData).filter(v => v != null).length
  }

  // Count fields that differ between current and proposed
  let count = 0
  const relevantFields = [
    'reps', 'weight', 'distance', 'performing_time', 'performingTime',
    'height', 'power', 'velocity', 'rpe', 'rest_time', 'restTime',
    'tempo', 'effort', 'resistance'
  ]

  for (const field of relevantFields) {
    const currentVal = currentData[field]
    const proposedVal = proposedData[field]
    if (proposedVal !== undefined && proposedVal !== currentVal) {
      count++
    }
  }

  return count
}

/**
 * Analyzes a changeset to determine its display density.
 * Returns metrics about the change density for display mode decision.
 */
export interface ChangeDensityAnalysis {
  /** Total number of sets affected by changes */
  setsAffected: number
  /** Maximum number of fields changed in any single set */
  maxFieldsInSingleSet: number
  /** Total number of field changes across all sets */
  totalFieldChanges: number
  /** Number of set-level operations (create/update/delete) */
  setOperations: number
  /** Number of exercise-level operations */
  exerciseOperations: number
}

/**
 * Analyzes the change density of a changeset.
 */
export function analyzeChangeDensity(changeset: ChangeSet): ChangeDensityAnalysis {
  let setsAffected = 0
  let maxFieldsInSingleSet = 0
  let totalFieldChanges = 0
  let setOperations = 0
  let exerciseOperations = 0

  for (const change of changeset.changeRequests) {
    if (change.entityType === 'session_plan_set') {
      setsAffected++
      setOperations++

      if (change.operationType === 'update') {
        const fieldsChanged = countChangedFields(change.currentData, change.proposedData)
        maxFieldsInSingleSet = Math.max(maxFieldsInSingleSet, fieldsChanged)
        totalFieldChanges += fieldsChanged
      } else if (change.operationType === 'create') {
        const fieldsSet = countChangedFields(null, change.proposedData)
        maxFieldsInSingleSet = Math.max(maxFieldsInSingleSet, fieldsSet)
        totalFieldChanges += fieldsSet
      } else if (change.operationType === 'delete') {
        // Delete counts as affecting the set but no field changes
        totalFieldChanges += 1 // Count as minimal change for density
      }
    } else if (change.entityType === 'session_plan_exercise') {
      exerciseOperations++
    }
  }

  return {
    setsAffected,
    maxFieldsInSingleSet,
    totalFieldChanges,
    setOperations,
    exerciseOperations,
  }
}

/**
 * Determines the display mode for a changeset based on change density.
 *
 * Low-density changes (inline mode):
 * - 1-2 fields changed per set
 * - Up to 3-4 sets affected (desktop) / 2 sets (mobile)
 * - Total field changes under threshold
 *
 * High-density changes (summary mode):
 * - Many fields per set
 * - Many sets affected
 * - Total changes exceed threshold
 *
 * @param changeset The changeset to analyze
 * @param isMobile Whether to use stricter mobile thresholds
 * @returns The recommended display mode
 */
export function getDiffDisplayMode(
  changeset: ChangeSet,
  isMobile: boolean = false
): DiffDisplayMode {
  const threshold = isMobile ? MOBILE_THRESHOLD : DESKTOP_THRESHOLD
  const analysis = analyzeChangeDensity(changeset)

  // Check if any threshold is exceeded
  const exceedsFieldsPerSet = analysis.maxFieldsInSingleSet > threshold.maxFieldsPerSet
  const exceedsSetsCount = analysis.setsAffected > threshold.maxSetsWithChanges
  const exceedsTotalChanges = analysis.totalFieldChanges > threshold.maxTotalFieldChanges

  // For mobile: stricter - any threshold exceeded triggers summary (T062)
  if (isMobile) {
    if (exceedsFieldsPerSet || exceedsSetsCount || exceedsTotalChanges) {
      return 'summary'
    }
  } else {
    // For desktop: need multiple thresholds exceeded or significantly over one
    const thresholdsExceeded = [exceedsFieldsPerSet, exceedsSetsCount, exceedsTotalChanges]
      .filter(Boolean).length

    if (thresholdsExceeded >= 2 || analysis.totalFieldChanges > threshold.maxTotalFieldChanges * 1.5) {
      return 'summary'
    }
  }

  return 'inline'
}

/**
 * Generates a compact summary text for a set of changes.
 * Format: "3 sets - weight +5kg, reps +2"
 *
 * @see docs/features/plans/individual/tasks.md T058
 */
export interface SetChangeSummary {
  /** Number of sets affected */
  setCount: number
  /** Field-level change descriptions */
  fieldChanges: string[]
  /** Compact one-liner summary */
  summary: string
}

/**
 * Generates a summary of field-level changes for a set of change requests.
 */
export function generateSetChangeSummary(changes: ChangeRequest[]): SetChangeSummary {
  const setChanges = changes.filter(c => c.entityType === 'session_plan_set')
  const setCount = setChanges.length

  // Track aggregate changes by field
  const fieldDeltas: Record<string, { increases: number; decreases: number; values: number[] }> = {}

  for (const change of setChanges) {
    if (change.operationType !== 'update') continue

    const current = change.currentData
    const proposed = change.proposedData
    if (!current || !proposed) continue

    // Check common numeric fields
    const numericFields = ['weight', 'reps', 'distance', 'performing_time', 'rpe', 'rest_time']
    for (const field of numericFields) {
      const currentVal = current[field] as number | undefined
      const proposedVal = proposed[field] as number | undefined

      if (proposedVal !== undefined && currentVal !== undefined && proposedVal !== currentVal) {
        if (!fieldDeltas[field]) {
          fieldDeltas[field] = { increases: 0, decreases: 0, values: [] }
        }

        const delta = proposedVal - currentVal
        fieldDeltas[field].values.push(delta)
        if (delta > 0) {
          fieldDeltas[field].increases++
        } else {
          fieldDeltas[field].decreases++
        }
      }
    }
  }

  // Generate field change descriptions
  const fieldChanges: string[] = []
  const fieldLabels: Record<string, string> = {
    weight: 'kg',
    reps: '',
    distance: 'm',
    performing_time: 's',
    rpe: 'RPE',
    rest_time: 's rest',
  }

  for (const [field, delta] of Object.entries(fieldDeltas)) {
    if (delta.values.length === 0) continue

    // Calculate average or common delta
    const avgDelta = delta.values.reduce((a, b) => a + b, 0) / delta.values.length
    const sign = avgDelta > 0 ? '+' : ''
    const unit = fieldLabels[field] || ''

    // Format the value
    const displayValue = Math.abs(avgDelta) < 1
      ? avgDelta.toFixed(1)
      : Math.round(avgDelta).toString()

    const displayField = field === 'performing_time' ? 'time' : field

    fieldChanges.push(`${displayField} ${sign}${displayValue}${unit}`)
  }

  // Handle create/delete operations
  const creates = setChanges.filter(c => c.operationType === 'create').length
  const deletes = setChanges.filter(c => c.operationType === 'delete').length

  if (creates > 0) {
    fieldChanges.unshift(`+${creates} new`)
  }
  if (deletes > 0) {
    fieldChanges.push(`-${deletes} removed`)
  }

  // Generate compact summary
  const summaryParts: string[] = []
  if (setCount > 0) {
    summaryParts.push(`${setCount} set${setCount !== 1 ? 's' : ''}`)
  }
  if (fieldChanges.length > 0) {
    summaryParts.push(fieldChanges.slice(0, 3).join(', '))
  }

  return {
    setCount,
    fieldChanges,
    summary: summaryParts.join(' - ') || 'No changes',
  }
}

/**
 * Determines if a changeset has enough changes to warrant showing a summary card
 * instead of inline diffs on individual elements.
 */
export function shouldShowSummaryCard(changeset: ChangeSet, isMobile: boolean = false): boolean {
  return getDiffDisplayMode(changeset, isMobile) === 'summary'
}

/**
 * Extracts changes for a specific exercise from a changeset.
 */
export function getExerciseChanges(
  changeset: ChangeSet,
  exerciseId: string
): ChangeRequest[] {
  return changeset.changeRequests.filter(change => {
    // Check if it's a direct exercise change
    if (change.entityType === 'session_plan_exercise' && change.entityId === exerciseId) {
      return true
    }
    // Check if it's a set change for this exercise
    if (change.entityType === 'session_plan_set') {
      const setExerciseId = (change.proposedData?.session_plan_exercise_id ?? change.currentData?.session_plan_exercise_id) as string | undefined
      return setExerciseId === exerciseId
    }
    return false
  })
}
