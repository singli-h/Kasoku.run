/**
 * Workout Adapter
 *
 * Converts between legacy workout data structures and the new unified TrainingExercise/TrainingSet types.
 * This enables using the new training components with existing database-synced state.
 */

import type { TrainingExercise, TrainingSet } from '../types'
import type { WorkoutLogWithDetails, SessionPlanWithDetails } from '@/types/training'

/**
 * Legacy WorkoutExercise type from the workout feature context
 */
export interface LegacyWorkoutExercise {
  id: number
  session_plan_id: number
  exercise_id: number
  exercise_order: number
  superset_id?: string | null
  notes?: string | null
  completed?: boolean
  exercise?: {
    id: number
    name: string
    exercise_type_id?: number
    exercise_type?: {
      name: string
    }
  }
  session_plan_sets?: Array<{
    id: number
    set_index: number
    reps?: number | null
    weight?: number | null
    distance?: number | null
    performing_time?: number | null
    rest_time?: number | null
    tempo?: string | null
    rpe?: number | null
    power?: number | null
    velocity?: number | null
    height?: number | null
    resistance?: number | null
    effort?: number | null
  }>
  workout_log_sets?: Array<{
    id: number
    set_index?: number | null
    reps?: number | null
    weight?: number | null
    distance?: number | null
    performing_time?: number | null
    rest_time?: number | null
    tempo?: string | null
    rpe?: number | null
    power?: number | null
    velocity?: number | null
    height?: number | null
    resistance?: number | null
    effort?: number | null
    completed?: boolean | null
  }>
}

/**
 * Convert exercise type to section name
 */
function getSection(exercise: LegacyWorkoutExercise): string {
  const typeName = exercise.exercise?.exercise_type?.name?.toLowerCase() || ''

  // Map exercise types to sections
  if (typeName.includes('warm')) return 'Warmup'
  if (typeName.includes('sprint') || typeName.includes('speed')) return 'Speed'
  if (typeName.includes('plyo') || typeName.includes('jump')) return 'Plyometric'
  if (typeName.includes('strength') || typeName.includes('gym')) return 'Strength'
  if (typeName.includes('condition') || typeName.includes('circuit')) return 'Conditioning'
  if (typeName.includes('cool')) return 'Cooldown'

  return 'Other'
}

/**
 * Convert legacy workout exercise to TrainingExercise
 */
export function legacyToTrainingExercise(
  exercise: LegacyWorkoutExercise,
  expandedIds: Set<number | string> = new Set()
): TrainingExercise {
  // Use workout_log_sets if available (actual performance data), otherwise use session_plan_sets (template)
  const logSets = exercise.workout_log_sets || []
  const planSets = exercise.session_plan_sets || []

  // Merge: use log sets if available, fill in from plan sets for remaining
  const sets: TrainingSet[] = []

  // If we have log sets, use them
  if (logSets.length > 0) {
    logSets.forEach((logSet, idx) => {
      const planSet = planSets.find(p => p.set_index === (logSet.set_index ?? idx + 1))

      sets.push({
        id: logSet.id,
        setIndex: logSet.set_index ?? idx + 1,
        reps: logSet.reps ?? planSet?.reps ?? null,
        weight: logSet.weight ?? planSet?.weight ?? null,
        distance: logSet.distance ?? planSet?.distance ?? null,
        performingTime: logSet.performing_time ?? planSet?.performing_time ?? null,
        restTime: logSet.rest_time ?? planSet?.rest_time ?? null,
        tempo: logSet.tempo ?? planSet?.tempo ?? null,
        rpe: logSet.rpe ?? planSet?.rpe ?? null,
        power: logSet.power ?? planSet?.power ?? null,
        velocity: logSet.velocity ?? planSet?.velocity ?? null,
        height: logSet.height ?? planSet?.height ?? null,
        resistance: logSet.resistance ?? planSet?.resistance ?? null,
        effort: logSet.effort ?? planSet?.effort ?? null,
        completed: logSet.completed ?? false,
      })
    })
  } else {
    // No log sets yet - use plan sets as template
    planSets.forEach((planSet, idx) => {
      sets.push({
        id: `plan-${planSet.id}`, // String ID for non-persisted sets
        setIndex: planSet.set_index ?? idx + 1,
        reps: planSet.reps,
        weight: planSet.weight,
        distance: planSet.distance,
        performingTime: planSet.performing_time,
        restTime: planSet.rest_time,
        tempo: planSet.tempo,
        rpe: planSet.rpe,
        power: planSet.power,
        velocity: planSet.velocity,
        height: planSet.height,
        resistance: planSet.resistance,
        effort: planSet.effort,
        completed: false,
      })
    })
  }

  return {
    id: exercise.id,
    exerciseId: exercise.exercise_id,
    name: exercise.exercise?.name || 'Unknown Exercise',
    section: getSection(exercise),
    exerciseOrder: exercise.exercise_order || 0,
    supersetId: exercise.superset_id,
    notes: exercise.notes,
    sets,
    expanded: expandedIds.has(exercise.id),
  }
}

/**
 * Convert multiple legacy exercises to TrainingExercises
 */
export function legacyToTrainingExercises(
  exercises: LegacyWorkoutExercise[],
  expandedIds: Set<number | string> = new Set()
): TrainingExercise[] {
  return exercises
    .map(ex => legacyToTrainingExercise(ex, expandedIds))
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
}

/**
 * Convert TrainingSet back to database format for saving
 */
export function trainingSetToUpdate(
  set: TrainingSet,
  workoutLogId: number,
  workoutLogExerciseId: number
): {
  id?: number
  workout_log_id: number
  workout_log_exercise_id: number
  set_index: number
  reps: number | null
  weight: number | null
  distance: number | null
  performing_time: number | null
  rest_time: number | null
  tempo: string | null
  rpe: number | null
  power: number | null
  velocity: number | null
  height: number | null
  resistance: number | null
  effort: number | null
  completed: boolean
} {
  return {
    id: typeof set.id === 'number' ? set.id : undefined,
    workout_log_id: workoutLogId,
    workout_log_exercise_id: workoutLogExerciseId,
    set_index: set.setIndex,
    reps: set.reps ?? null,
    weight: set.weight ?? null,
    distance: set.distance ?? null,
    performing_time: set.performingTime ?? null,
    rest_time: set.restTime ?? null,
    tempo: set.tempo ?? null,
    rpe: set.rpe ?? null,
    power: set.power ?? null,
    velocity: set.velocity ?? null,
    height: set.height ?? null,
    resistance: set.resistance ?? null,
    effort: set.effort ?? null,
    completed: set.completed ?? false,
  }
}

/**
 * Calculate completion stats from TrainingExercises
 */
export function calculateStats(exercises: TrainingExercise[]) {
  const totalExercises = exercises.length
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  )
  const completedExercises = exercises.filter(
    ex => ex.sets.length > 0 && ex.sets.every(s => s.completed)
  ).length

  return {
    totalExercises,
    totalSets,
    completedExercises,
    completedSets,
    progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    isComplete: completedSets === totalSets && totalSets > 0,
    isPartial: completedSets > 0 && completedSets < totalSets,
  }
}
