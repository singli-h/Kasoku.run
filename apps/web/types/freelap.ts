/**
 * Freelap Timing Data Types
 * Type definitions for Freelap sprint timing data stored in workout_log_sets.metadata
 *
 * Field naming aligned with official Freelap CSV export:
 * - time: Time in seconds
 * - speed: Speed in m/s
 * - frequency: Step frequency in Hz (steps/second) - CSV: "FQ (s/s)"
 * - stride_length: Stride length in meters - CSV: "LENGTH (m)"
 * - steps: Total step count - CSV: "NUMBER"
 * - reaction_time: Reaction time in seconds - CSV: "REACTION TIME"
 */

/**
 * Core Freelap metrics captured per split or for single-distance sprints
 * Field names match official Freelap terminology
 */
export interface FreeelapMetrics {
  /** Time in seconds */
  time?: number
  /** Speed in meters per second */
  speed?: number
  /** Step frequency in Hz (steps/second) - Freelap: "FQ" */
  frequency?: number
  /** Stride length in meters - Freelap: "LENGTH" */
  stride_length?: number
  /** Total step count - Freelap: "NUMBER" */
  steps?: number
}

/**
 * A single split segment within a sprint
 * Each split has its own distance (flexible - supports any split distance)
 */
export interface FreeelapSplit extends FreeelapMetrics {
  /** Distance of this split segment in meters (e.g., 10, 20, 30) */
  distance: number
  /** Time for this split segment in seconds (required) */
  time: number
  /** Cumulative time up to this split - Freelap: "TOTAL 1", "TOTAL 2" */
  cumulative_time?: number
}

/**
 * Complete Freelap metadata for a sprint rep
 * Stored in workout_log_sets.metadata JSON field
 */
export interface FreeelapMetadata extends FreeelapMetrics {
  /** Optional note/annotation */
  note?: string
  /** Total distance in meters */
  distance?: number
  /** Reaction time in seconds - Freelap: "REACTION TIME" */
  reaction_time?: number
  /** Gap to best time - Freelap: "GAP" */
  gap?: string
  /** Array of split segments (for multi-split sprints like 40m, 60m) */
  splits?: FreeelapSplit[]
}

/**
 * Type guard to check if metadata contains Freelap data
 */
export function isFreeelapMetadata(data: unknown): data is FreeelapMetadata {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  // Check for Freelap-specific fields
  const hasFreeelapField =
    typeof obj.frequency === 'number' ||
    typeof obj.stride_length === 'number' ||
    typeof obj.steps === 'number' ||
    typeof obj.speed === 'number' ||
    typeof obj.reaction_time === 'number' ||
    Array.isArray(obj.splits)

  return hasFreeelapField
}

/**
 * Check if metadata has multiple splits (multi-segment sprint)
 */
export function hasSplits(metadata: FreeelapMetadata | null | undefined): boolean {
  if (!metadata) return false
  return !!(metadata.splits && metadata.splits.length > 0)
}

/**
 * Calculate delta between two consecutive splits
 */
export interface SplitDelta {
  /** Change in time (negative = faster) */
  timeDelta: number
  /** Percentage change in time */
  timePercent: number
  /** Change in frequency (positive = higher cadence) */
  frequencyDelta?: number
  /** Percentage change in frequency */
  frequencyPercent?: number
  /** Change in stride length (positive = longer strides) */
  strideDelta?: number
  /** Percentage change in stride length */
  stridePercent?: number
}

/**
 * Calculate the delta between two consecutive splits
 */
export function calculateSplitDelta(
  current: FreeelapSplit,
  previous: FreeelapSplit
): SplitDelta {
  const timeDelta = current.time - previous.time
  const timePercent = (timeDelta / previous.time) * 100

  const result: SplitDelta = {
    timeDelta,
    timePercent
  }

  if (current.frequency !== undefined && previous.frequency !== undefined) {
    result.frequencyDelta = current.frequency - previous.frequency
    result.frequencyPercent = (result.frequencyDelta / previous.frequency) * 100
  }

  if (current.stride_length !== undefined && previous.stride_length !== undefined) {
    result.strideDelta = current.stride_length - previous.stride_length
    result.stridePercent = (result.strideDelta / previous.stride_length) * 100
  }

  return result
}

/**
 * Format a split label based on cumulative distance
 * e.g., "0-20m", "20-40m", "40-60m"
 */
export function formatSplitLabel(splitIndex: number, splits: FreeelapSplit[]): string {
  let startDistance = 0
  for (let i = 0; i < splitIndex; i++) {
    startDistance += splits[i].distance
  }
  const endDistance = startDistance + splits[splitIndex].distance
  return `${startDistance}-${endDistance}m`
}

/**
 * Parse Freelap CSV row data into FreeelapMetadata
 * Handles the official MyFreelap export format
 */
export function parseFreeelapCsvRow(row: Record<string, string>): FreeelapMetadata {
  const metadata: FreeelapMetadata = {}

  // Parse overall metrics
  if (row['REACTION TIME']) {
    metadata.reaction_time = parseFloat(row['REACTION TIME'].replace('s', ''))
  }
  if (row['TOTAL']) {
    metadata.time = parseFloat(row['TOTAL'])
  }
  if (row['DIST. (m)']) {
    metadata.distance = parseFloat(row['DIST. (m)'])
  }
  if (row['SPEED (m/s)']) {
    metadata.speed = parseFloat(row['SPEED (m/s)'])
  }
  if (row['FQ (s/s)']) {
    metadata.frequency = parseFloat(row['FQ (s/s)'])
  }
  if (row['LENGTH (m)']) {
    metadata.stride_length = parseFloat(row['LENGTH (m)'])
  }
  if (row['NUMBER']) {
    metadata.steps = parseFloat(row['NUMBER'])
  }
  if (row['GAP']) {
    metadata.gap = row['GAP']
  }

  // Parse splits (L1 - 20.0, L2 - 20.0, etc.)
  const splits: FreeelapSplit[] = []
  let splitIndex = 1

  while (true) {
    const splitTimeKey = Object.keys(row).find(k => k.startsWith(`L${splitIndex} -`))
    if (!splitTimeKey) break

    // Extract distance from key like "L1 - 20.0"
    const distanceMatch = splitTimeKey.match(/L\d+ - ([\d.]+)/)
    const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 20

    const split: FreeelapSplit = {
      distance,
      time: parseFloat(row[splitTimeKey]) || 0,
    }

    // Get cumulative time
    const totalKey = `TOTAL ${splitIndex}`
    if (row[totalKey]) {
      split.cumulative_time = parseFloat(row[totalKey])
    }

    // Get speed for this split
    const speedKey = `SPD ${splitIndex}`
    if (row[speedKey]) {
      split.speed = parseFloat(row[speedKey])
    }

    // Get frequency, stride length, steps (they repeat in pattern)
    // The CSV structure repeats FQ, LENGTH, NUMBER after each split
    // This requires knowing the column positions or pattern

    splits.push(split)
    splitIndex++
  }

  if (splits.length > 0) {
    metadata.splits = splits
  }

  return metadata
}
