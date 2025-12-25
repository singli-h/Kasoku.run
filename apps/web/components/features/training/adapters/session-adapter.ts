/**
 * Session Planner Adapter
 *
 * Converts between session planner data structures and unified TrainingExercise/TrainingSet types.
 * This enables using the new training components for coach session planning.
 */

import type { TrainingExercise, TrainingSet } from '../types'

/**
 * Session planner's SessionExercise type
 */
export interface SessionPlannerExercise {
  id: string | number
  session_plan_id: number
  exercise_id: number
  exercise_order: number
  superset_id?: string | null
  notes?: string | null
  isCollapsed?: boolean
  isEditing?: boolean
  validationErrors?: string[]
  exercise?: {
    id: number
    name: string
    description?: string
    exercise_type_id?: number
    video_url?: string
    exercise_type?: {
      type: string
    }
  } | null
  sets: Array<{
    id: number | string
    session_plan_exercise_id: number
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
    resistance_unit_id?: number | null
    completed?: boolean
    isEditing?: boolean
  }>
}

/**
 * Get section name from exercise type
 * Uses exercise type ID for reliable mapping (matches workout-adapter.ts)
 * Falls back to type name string matching if ID not available
 * 
 * Database exercise_types table:
 * 1 = Isometric, 2 = Plyometric, 3 = Gym, 4 = Warmup, 5 = Circuit, 6 = Sprint, 7 = Drill
 */
function getSection(exercise: SessionPlannerExercise): string {
  // Try exercise_type_id first (most reliable)
  const exerciseTypeId = exercise.exercise?.exercise_type_id

  if (exerciseTypeId) {
    switch (exerciseTypeId) {
      case 1: return 'Isometric'
      case 2: return 'Plyometric'
      case 3: return 'Gym'
      case 4: return 'Warmup'
      case 5: return 'Circuit'
      case 6: return 'Sprint'
      case 7: return 'Drill'
      default: break
    }
  }

  // Fallback to string matching if ID not available
  const typeName = exercise.exercise?.exercise_type?.type?.toLowerCase() || ''
  if (typeName.includes('warm')) return 'Warmup'
  if (typeName.includes('sprint')) return 'Sprint'
  if (typeName.includes('plyo') || typeName.includes('jump')) return 'Plyometric'
  if (typeName.includes('gym')) return 'Gym'
  if (typeName.includes('isometric')) return 'Isometric'
  if (typeName.includes('circuit')) return 'Circuit'
  if (typeName.includes('drill')) return 'Drill'
  if (typeName.includes('cool')) return 'Cooldown'

  return 'Other'
}

/**
 * Convert session planner exercise to TrainingExercise
 */
export function sessionExerciseToTraining(
  exercise: SessionPlannerExercise,
  expandedIds: Set<string | number> = new Set()
): TrainingExercise {
  const sets: TrainingSet[] = exercise.sets.map((set, idx) => ({
    id: set.id,
    setIndex: set.set_index ?? idx + 1,
    reps: set.reps,
    weight: set.weight,
    distance: set.distance,
    performingTime: set.performing_time,
    restTime: set.rest_time,
    tempo: set.tempo,
    rpe: set.rpe,
    power: set.power,
    velocity: set.velocity,
    height: set.height,
    resistance: set.resistance,
    effort: set.effort,
    resistanceUnitId: set.resistance_unit_id,
    completed: false, // Coach mode - no completion tracking
  }))

  return {
    id: exercise.id,
    exerciseId: exercise.exercise_id,
    name: exercise.exercise?.name || 'Unknown Exercise',
    section: getSection(exercise),
    exerciseOrder: exercise.exercise_order || 0,
    supersetId: exercise.superset_id,
    notes: exercise.notes,
    sets,
    expanded: expandedIds.has(exercise.id) || !exercise.isCollapsed,
    exerciseTypeId: exercise.exercise?.exercise_type_id ?? undefined,
  }
}

/**
 * Convert multiple session planner exercises to TrainingExercises
 */
export function sessionExercisesToTraining(
  exercises: SessionPlannerExercise[],
  expandedIds: Set<string | number> = new Set()
): TrainingExercise[] {
  return exercises
    .map(ex => sessionExerciseToTraining(ex, expandedIds))
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
}

/**
 * Convert TrainingExercise back to session planner format for saving
 */
export function trainingToSessionExercise(
  exercise: TrainingExercise,
  sessionPlanId: number,
  originalExercise?: SessionPlannerExercise
): SessionPlannerExercise {
  return {
    id: exercise.id,
    session_plan_id: sessionPlanId,
    exercise_id: exercise.exerciseId,
    exercise_order: exercise.exerciseOrder,
    superset_id: exercise.supersetId,
    notes: exercise.notes,
    isCollapsed: !exercise.expanded,
    isEditing: false,
    validationErrors: [],
    exercise: originalExercise?.exercise,
    sets: exercise.sets.map(set => ({
      id: set.id,
      session_plan_exercise_id: typeof exercise.id === 'number' ? exercise.id : 0,
      set_index: set.setIndex,
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      performing_time: set.performingTime,
      rest_time: set.restTime,
      tempo: set.tempo,
      rpe: set.rpe,
      power: set.power,
      velocity: set.velocity,
      height: set.height,
      resistance: set.resistance,
      effort: set.effort,
      resistance_unit_id: set.resistanceUnitId,
      completed: false,
      isEditing: false,
    })),
  }
}

/**
 * Merge training exercise updates back into session planner format
 */
export function mergeTrainingUpdate(
  original: SessionPlannerExercise,
  training: TrainingExercise
): SessionPlannerExercise {
  return {
    ...original,
    exercise_order: training.exerciseOrder,
    superset_id: training.supersetId,
    notes: training.notes,
    isCollapsed: !training.expanded,
    sets: training.sets.map((set, idx) => {
      const originalSet = original.sets[idx]
      return {
        ...(originalSet || {}),
        id: set.id,
        session_plan_exercise_id: typeof original.id === 'number' ? original.id : 0,
        set_index: set.setIndex,
        reps: set.reps,
        weight: set.weight,
        distance: set.distance,
        performing_time: set.performingTime,
        rest_time: set.restTime,
        tempo: set.tempo,
        rpe: set.rpe,
        power: set.power,
        velocity: set.velocity,
        height: set.height,
        resistance: set.resistance,
        effort: set.effort,
        resistance_unit_id: set.resistanceUnitId,
        completed: false,
        isEditing: false,
      }
    }),
  }
}
