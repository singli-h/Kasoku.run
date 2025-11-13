/**
 * Session Planner Utilities
 * Core functions for session exercise manipulation, validation, and calculations
 */

import type { SessionExercise, SetParameter, ValidationResult, DEFAULT_SET, SupersetGroup } from "./types"
import { DEFAULT_SET as DEFAULT_SET_VALUES } from "./types"

/**
 * Generate a unique ID for client-side exercises
 */
export function generateId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a new exercise in session with default values
 */
export function createExerciseInSession(
  exerciseId: number,
  exerciseName: string,
  exerciseTypeId: number | null,
  order: number,
): SessionExercise {
  return {
    id: generateId(),
    exercise_id: exerciseId,
    preset_order: order,
    superset_id: null,
    notes: null,
    exercise: {
      id: exerciseId,
      name: exerciseName,
      description: null,
      exercise_type_id: exerciseTypeId,
      video_url: null,
    },
    sets: [
      {
        set_index: 1,
        ...DEFAULT_SET_VALUES,
      },
    ],
    isCollapsed: false,
    isEditing: false,
  }
}

/**
 * Create a superset from selected exercises
 * Groups exercises by assigning them the same superset_id
 */
export function createSuperset(
  exercises: SessionExercise[],
  selectedIds: Set<string>,
): SessionExercise[] {
  const selectedExercises = exercises.filter((ex) => selectedIds.has(ex.id))

  if (selectedExercises.length < 2) {
    return exercises // Need at least 2 exercises for superset
  }

  // Check if exercises are consecutive
  const selectedIndices = selectedExercises.map((ex) => exercises.indexOf(ex)).sort((a, b) => a - b)
  const isConsecutive = selectedIndices.every((idx, i) => {
    if (i === 0) return true
    return idx === selectedIndices[i - 1] + 1
  })

  if (!isConsecutive) {
    return exercises // Exercises must be consecutive
  }

  // Generate new superset ID
  const supersetId = Date.now()

  return exercises.map((ex) => {
    if (selectedIds.has(ex.id)) {
      return { ...ex, superset_id: supersetId }
    }
    return ex
  })
}

/**
 * Remove superset grouping from exercises
 */
export function ungroupSuperset(exercises: SessionExercise[], supersetId: number): SessionExercise[] {
  return exercises.map((ex) => {
    if (ex.superset_id === supersetId) {
      return { ...ex, superset_id: null }
    }
    return ex
  })
}

/**
 * Group exercises into supersets for visual rendering
 * Returns array of either individual exercises or superset groups
 */
export function groupIntoSupersets(exercises: SessionExercise[]): (SessionExercise | SupersetGroup)[] {
  const result: (SessionExercise | SupersetGroup)[] = []
  const supersetMap = new Map<number, SessionExercise[]>()
  const processedIds = new Set<string>()

  // First pass: collect all exercises by superset_id
  exercises.forEach((ex) => {
    if (ex.superset_id !== null) {
      if (!supersetMap.has(ex.superset_id)) {
        supersetMap.set(ex.superset_id, [])
      }
      supersetMap.get(ex.superset_id)!.push(ex)
      processedIds.add(ex.id)
    }
  })

  // Second pass: build result array
  exercises.forEach((ex) => {
    if (processedIds.has(ex.id)) {
      // This exercise is part of a superset
      if (ex.superset_id !== null) {
        const supersetExercises = supersetMap.get(ex.superset_id)!
        const isFirst = supersetExercises[0].id === ex.id

        // Only add the superset group once (on first exercise)
        if (isFirst) {
          const superset: SupersetGroup = {
            id: ex.superset_id.toString(),
            exercises: supersetExercises.sort((a, b) => a.preset_order - b.preset_order),
          }
          result.push(superset)
        }
      }
    } else {
      // Regular exercise (not in superset)
      result.push(ex)
    }
  })

  return result
}

/**
 * Check if selected exercises can form a superset
 */
export function canCreateSuperset(exercises: SessionExercise[], selectedIds: Set<string>): boolean {
  if (selectedIds.size < 2) return false

  const selectedExercises = exercises.filter((ex) => selectedIds.has(ex.id))
  const selectedIndices = selectedExercises.map((ex) => exercises.indexOf(ex)).sort((a, b) => a - b)

  // Check if consecutive
  return selectedIndices.every((idx, i) => {
    if (i === 0) return true
    return idx === selectedIndices[i - 1] + 1
  })
}

/**
 * Check if selected exercises can be ungrouped
 */
export function canUngroupSuperset(exercises: SessionExercise[], selectedIds: Set<string>): boolean {
  if (selectedIds.size === 0) return false

  const selectedExercises = exercises.filter((ex) => selectedIds.has(ex.id))
  const firstSupersetId = selectedExercises[0]?.superset_id

  if (!firstSupersetId) return false

  // All selected exercises must have the same superset_id
  return selectedExercises.every((ex) => ex.superset_id === firstSupersetId)
}

/**
 * Reorder exercises after drag & drop or deletion
 * Updates preset_order to be sequential
 */
export function reorderExercises(exercises: SessionExercise[]): SessionExercise[] {
  return exercises.map((ex, index) => ({
    ...ex,
    preset_order: index + 1,
  }))
}

/**
 * Validate session exercises
 */
export function validateSession(exercises: SessionExercise[]): ValidationResult {
  const errors: string[] = []
  const exerciseErrors = new Map<string, string[]>()

  if (exercises.length === 0) {
    errors.push("Session must have at least one exercise")
  }

  exercises.forEach((ex) => {
    const exErrors: string[] = []

    if (!ex.exercise?.name || ex.exercise.name.trim() === "") {
      exErrors.push("Exercise name is required")
    }

    if (ex.sets.length === 0) {
      exErrors.push("Must have at least one set")
    }

    // Validate each set
    ex.sets.forEach((set, index) => {
      if (set.reps === null && set.distance === null && set.performing_time === null) {
        exErrors.push(`Set ${index + 1}: Must specify reps, distance, or time`)
      }
    })

    if (exErrors.length > 0) {
      exerciseErrors.set(ex.id, exErrors)
      errors.push(...exErrors.map((err) => `${ex.exercise?.name || "Exercise"}: ${err}`))
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    exerciseErrors,
  }
}

/**
 * Estimate total session duration in minutes
 * Based on sets, reps, rest times
 */
export function estimateDuration(exercises: SessionExercise[]): number {
  let totalMinutes = 0

  exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      // Time
      if (set.performing_time) {
        totalMinutes += set.performing_time / 60
      } else if (set.reps) {
        // Estimate ~3 seconds per rep for strength exercises
        totalMinutes += (set.reps * 3) / 60
      } else if (set.distance) {
        // Estimate based on distance (very rough - 200m/min pace)
        totalMinutes += set.distance / 200
      }

      // Rest time
      if (set.rest_time) {
        totalMinutes += set.rest_time / 60
      }
    })
  })

  // Round to nearest 5 minutes
  return Math.round(totalMinutes / 5) * 5
}

/**
 * Add a set to an exercise
 */
export function addSet(exercise: SessionExercise): SessionExercise {
  const lastSet = exercise.sets[exercise.sets.length - 1]
  const newSet: SetParameter = {
    set_index: exercise.sets.length + 1,
    reps: lastSet?.reps || DEFAULT_SET_VALUES.reps,
    weight: lastSet?.weight || DEFAULT_SET_VALUES.weight,
    rest_time: lastSet?.rest_time || DEFAULT_SET_VALUES.rest_time,
    tempo: lastSet?.tempo || DEFAULT_SET_VALUES.tempo,
    rpe: lastSet?.rpe || DEFAULT_SET_VALUES.rpe,
    distance: lastSet?.distance || null,
    performing_time: lastSet?.performing_time || null,
    resistance_unit_id: lastSet?.resistance_unit_id || null,
    power: lastSet?.power || null,
    velocity: lastSet?.velocity || null,
    effort: lastSet?.effort || null,
    height: lastSet?.height || null,
    resistance: lastSet?.resistance || null,
  }

  return {
    ...exercise,
    sets: [...exercise.sets, newSet],
  }
}

/**
 * Remove a set from an exercise
 */
export function removeSet(exercise: SessionExercise, setIndex: number): SessionExercise {
  if (exercise.sets.length <= 1) {
    return exercise // Must have at least one set
  }

  return {
    ...exercise,
    sets: exercise.sets
      .filter((_, idx) => idx !== setIndex)
      .map((set, idx) => ({ ...set, set_index: idx + 1 })),
  }
}

/**
 * Update a specific set parameter
 */
export function updateSet(
  exercise: SessionExercise,
  setIndex: number,
  updates: Partial<SetParameter>,
): SessionExercise {
  return {
    ...exercise,
    sets: exercise.sets.map((set, idx) => (idx === setIndex ? { ...set, ...updates } : set)),
  }
}

/**
 * Duplicate an exercise
 */
export function duplicateExercise(exercise: SessionExercise, newOrder: number): SessionExercise {
  return {
    ...exercise,
    id: generateId(),
    preset_order: newOrder,
    superset_id: null, // Remove superset association
  }
}

/**
 * Calculate volume for a session (total reps × weight)
 */
export function calculateSessionVolume(exercises: SessionExercise[]): number {
  return exercises.reduce((total, ex) => {
    const exVolume = ex.sets.reduce((setTotal, set) => {
      if (set.reps && set.weight) {
        return setTotal + set.reps * set.weight
      }
      return setTotal
    }, 0)
    return total + exVolume
  }, 0)
}

/**
 * Calculate average intensity (RPE) for a session
 */
export function calculateAverageIntensity(exercises: SessionExercise[]): number {
  const allRPEs = exercises.flatMap((ex) => ex.sets.map((set) => set.rpe).filter((rpe) => rpe !== null))

  if (allRPEs.length === 0) return 0

  const sum = allRPEs.reduce((acc, rpe) => acc + (rpe || 0), 0)
  return Math.round((sum / allRPEs.length) * 10) / 10
}
