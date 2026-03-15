/**
 * Shared training utilities for session metrics computation and exercise formatting.
 * Used by workspace cards (#22), dashboard calendar (#31), template cards (#33).
 */

// --- Types ---

export interface ExerciseWithSets {
  exercise_type_id?: number | null
  sets: Array<{
    reps?: number | null
    weight?: number | null
    distance?: number | null
    performing_time?: number | null
    rest_time?: number | null
  }>
}

export interface SessionMetrics {
  volume: number
  volumeUnit: string // 'kg' | 'm' | 's' | 'reps'
  duration: number // seconds
  exerciseCount: number
}

// --- Session Metrics ---

/**
 * Compute aggregate volume and duration from exercises with sets.
 *
 * Volume formula per exercise_type_id:
 *   1-3 (strength): Σ(reps × weight) → 'kg'
 *   4-5 (sprint/endurance): Σ(distance) → 'm'
 *   6 (timed/plyometric): Σ(performing_time) → 's'
 *   default (bodyweight): Σ(reps) → 'reps'
 *
 * Duration: Σ(performing_time + rest_time) across all sets of all exercises.
 */
export function computeSessionMetrics(
  exercises: ExerciseWithSets[]
): SessionMetrics {
  let volume = 0
  let duration = 0
  let volumeUnit = 'reps'
  let hasSetVolumeUnit = false

  for (const exercise of exercises) {
    const typeId = exercise.exercise_type_id
    for (const set of exercise.sets) {
      // Duration accumulation (all types)
      duration += (set.performing_time ?? 0) + (set.rest_time ?? 0)

      // Volume accumulation by type
      if (typeId != null && typeId >= 1 && typeId <= 3) {
        // Strength
        volume += (set.reps ?? 0) * (set.weight ?? 0)
        if (!hasSetVolumeUnit) { volumeUnit = 'kg'; hasSetVolumeUnit = true }
      } else if (typeId != null && (typeId === 4 || typeId === 5)) {
        // Sprint / Endurance
        volume += set.distance ?? 0
        if (!hasSetVolumeUnit) { volumeUnit = 'm'; hasSetVolumeUnit = true }
      } else if (typeId === 6) {
        // Timed / Plyometric
        volume += set.performing_time ?? 0
        if (!hasSetVolumeUnit) { volumeUnit = 's'; hasSetVolumeUnit = true }
      } else {
        // Bodyweight / default
        volume += set.reps ?? 0
      }
    }
  }

  return {
    volume: Math.round(volume * 10) / 10,
    volumeUnit,
    duration: Math.round(duration),
    exerciseCount: exercises.length,
  }
}

// --- Exercise Summary Formatting ---

/**
 * Format a one-line summary for an exercise:
 *   Strength: "3×10 80kg"
 *   Sprint: "4×60m 7.2s"
 *   Timed: "3×30s"
 *   Bodyweight: "3×12"
 *
 * Uses first set as representative for uniform sets.
 * Falls back to "N sets" for varied sets.
 */
export function formatExerciseSummary(exercise: ExerciseWithSets): string {
  const { sets } = exercise
  if (sets.length === 0) return 'No sets'

  const first = sets[0]
  const isUniform = sets.every(
    (s) =>
      s.reps === first.reps &&
      s.weight === first.weight &&
      s.distance === first.distance &&
      s.performing_time === first.performing_time
  )

  if (!isUniform) return `${sets.length} sets`

  const typeId = exercise.exercise_type_id
  const count = sets.length

  if (typeId != null && typeId >= 1 && typeId <= 3) {
    // Strength
    const parts: string[] = []
    if (first.reps) parts.push(`${count}×${first.reps}`)
    if (first.weight) parts.push(`${first.weight}kg`)
    return parts.join(' ') || `${count} sets`
  }

  if (typeId != null && (typeId === 4 || typeId === 5)) {
    // Sprint / Endurance
    const parts: string[] = []
    if (first.distance) parts.push(`${count}×${first.distance}m`)
    if (first.performing_time) parts.push(`${first.performing_time}s`)
    return parts.join(' ') || `${count} sets`
  }

  if (typeId === 6) {
    // Timed / Plyometric
    if (first.performing_time) return `${count}×${first.performing_time}s`
    return `${count} sets`
  }

  // Bodyweight / default
  if (first.reps) return `${count}×${first.reps}`
  return `${count} sets`
}

// --- Subgroup Abbreviations ---

const SUBGROUP_ABBREVIATIONS: Record<string, string> = {
  SS: 'SS',
  MS: 'MS',
  LS: 'LS',
  Hurdles: 'HRD',
  Jumps: 'JMP',
  Throws: 'THR',
  Distance: 'DST',
  'Multi-events': 'MUL',
}

/**
 * Map a full subgroup string to a 3-char display code.
 * Returns the input unchanged if no abbreviation exists.
 */
export function abbreviateSubgroup(subgroup: string): string {
  return SUBGROUP_ABBREVIATIONS[subgroup] ?? subgroup.slice(0, 3).toUpperCase()
}

/** @deprecated Use abbreviateSubgroup instead */
export const abbreviateEventGroup = abbreviateSubgroup

/**
 * Format target_subgroups for chip display.
 * Returns null if groups is null/empty (= ALL athletes).
 * Returns "SS" for single, "SS·MS" for multiple.
 */
export function formatSubgroupChip(groups: string[] | null): string | null {
  if (!groups || groups.length === 0) return null
  return groups.map(abbreviateSubgroup).join('·')
}
