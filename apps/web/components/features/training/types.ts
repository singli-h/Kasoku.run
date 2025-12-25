/**
 * Unified Training Types
 *
 * These types provide a common interface for BOTH:
 * - Coach Domain: Session planning (session_plan_exercises, session_plan_sets)
 * - Athlete Domain: Workout execution (workout_log_exercises, workout_log_sets)
 *
 * The UI components use these unified types, and mappers convert to/from database types.
 */

// =============================================================================
// Core Types (shared between coach and athlete)
// =============================================================================

/**
 * Unified set data - all possible fields for any training modality
 * Coach: Uses for planning (no completed field)
 * Athlete: Uses for execution (has completed field)
 */
export interface TrainingSet {
  /** ID - string for new unsaved items, number for database records */
  id: number | string
  /** Set order within the exercise (1-based) */
  setIndex: number

  // Primary metrics
  reps?: number | null
  weight?: number | null         // kg
  distance?: number | null       // meters
  performingTime?: number | null // seconds (maps to performing_time in DB)
  restTime?: number | null       // seconds (maps to rest_time in DB)

  // Advanced metrics
  tempo?: string | null          // e.g., "3-1-2-0"
  rpe?: number | null            // Rate of Perceived Exertion (1-10)

  // VBT (Velocity Based Training) metrics
  power?: number | null          // watts
  velocity?: number | null       // m/s

  // Additional metrics
  height?: number | null         // cm (for jumps)
  resistance?: number | null     // kg (for machines)
  effort?: number | null         // percentage

  // Unit reference
  resistanceUnitId?: number | null

  // Extensible metadata
  metadata?: Record<string, unknown> | null

  // Athlete-only: completion status
  completed?: boolean
}

/**
 * Unified exercise data - works for both coach planning and athlete execution
 */
export interface TrainingExercise {
  /** ID - string for new unsaved items, number for database records */
  id: number | string
  /** Foreign key to exercises table */
  exerciseId: number
  /** Display name of the exercise */
  name: string
  /** Training section (Warmup, Gym, Isometric, Plyometric, Sprint, Drill, Circuit) */
  section: string
  /** Order within the session */
  exerciseOrder: number
  /** Superset group identifier */
  supersetId?: string | null
  /** Exercise notes */
  notes?: string | null
  /** Sets for this exercise */
  sets: TrainingSet[]
  /** Exercise type ID for field visibility logic */
  exerciseTypeId?: number

  // UI state
  /** Whether card is expanded */
  expanded: boolean
}

// =============================================================================
// Domain-Specific Extensions
// =============================================================================

/**
 * Workout exercise - athlete executing a session
 * Maps to: workout_log_exercises + workout_log_sets
 */
export interface WorkoutExercise extends TrainingExercise {
  /** Foreign key to workout_logs */
  workoutLogId: number
  /** Reference to the template exercise (if from a session plan) */
  sessionPlanExerciseId?: number | null
}

/**
 * Session plan exercise - coach creating a template
 * Maps to: session_plan_exercises + session_plan_sets
 */
export interface SessionPlanExercise extends TrainingExercise {
  /** Foreign key to session_plans */
  sessionPlanId: number
}

// =============================================================================
// Exercise Library (for picker)
// =============================================================================

export interface ExerciseLibraryItem {
  id: string
  name: string
  category: string
  equipment: string
  muscleGroups: string[]
}

// =============================================================================
// Field Configuration (for dynamic form generation)
// =============================================================================

export interface FieldConfig {
  key: keyof TrainingSet
  label: string
  unit?: string
  always?: boolean
  type?: "number" | "text"
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
  { key: 'reps', label: 'Reps', always: true, type: 'number', min: 0, placeholder: '0' },
  { key: 'weight', label: 'Weight', unit: 'kg', type: 'number', min: 0, step: 0.5, placeholder: '0' },
  { key: 'restTime', label: 'Rest', unit: 's', always: true, type: 'number', min: 0, placeholder: '60' },
  { key: 'distance', label: 'Distance', unit: 'm', type: 'number', min: 0, placeholder: '0' },
  { key: 'performingTime', label: 'Duration', unit: 's', type: 'number', min: 0, placeholder: '0' },
  { key: 'resistance', label: 'Resistance', unit: 'kg', type: 'number', min: 0, step: 0.5, placeholder: '0' },
  { key: 'power', label: 'Power', unit: 'W', type: 'number', min: 0, placeholder: '0' },
  { key: 'velocity', label: 'Velocity', unit: 'm/s', type: 'number', min: 0, step: 0.1, placeholder: '0.0' },
  { key: 'height', label: 'Height', unit: 'cm', type: 'number', min: 0, placeholder: '0' },
  { key: 'tempo', label: 'Tempo', type: 'text', placeholder: '3-1-2-0' },
  { key: 'rpe', label: 'RPE', type: 'number', min: 1, max: 10, placeholder: '8' },
  { key: 'effort', label: 'Effort', unit: '%', type: 'number', min: 0, max: 100, placeholder: '80' },
]

// =============================================================================
// Type Mappers - Convert between unified types and database types
// =============================================================================

import type { Database } from '@/types/database'

type DBWorkoutLogExercise = Database['public']['Tables']['workout_log_exercises']['Row']
type DBWorkoutLogSet = Database['public']['Tables']['workout_log_sets']['Row']
type DBSessionPlanExercise = Database['public']['Tables']['session_plan_exercises']['Row']
type DBSessionPlanSet = Database['public']['Tables']['session_plan_sets']['Row']

/**
 * Convert database workout_log_sets to TrainingSet
 */
export function dbSetToTrainingSet(dbSet: DBWorkoutLogSet): TrainingSet {
  return {
    id: dbSet.id,
    setIndex: dbSet.set_index ?? 1,
    reps: dbSet.reps,
    weight: dbSet.weight,
    distance: dbSet.distance,
    performingTime: dbSet.performing_time,
    restTime: dbSet.rest_time,
    tempo: dbSet.tempo,
    rpe: dbSet.rpe,
    power: dbSet.power,
    velocity: dbSet.velocity,
    height: dbSet.height,
    resistance: dbSet.resistance,
    effort: dbSet.effort,
    resistanceUnitId: dbSet.resistance_unit_id,
    metadata: dbSet.metadata as Record<string, unknown> | null,
    completed: dbSet.completed ?? false,
  }
}

/**
 * Convert database session_plan_sets to TrainingSet (coach planning)
 */
export function dbPlanSetToTrainingSet(dbSet: DBSessionPlanSet): TrainingSet {
  return {
    id: dbSet.id,
    setIndex: dbSet.set_index ?? 1,
    reps: dbSet.reps,
    weight: dbSet.weight,
    distance: dbSet.distance,
    performingTime: dbSet.performing_time,
    restTime: dbSet.rest_time,
    tempo: dbSet.tempo,
    rpe: dbSet.rpe,
    power: dbSet.power,
    velocity: dbSet.velocity,
    height: dbSet.height,
    resistance: dbSet.resistance,
    effort: dbSet.effort,
    resistanceUnitId: dbSet.resistance_unit_id,
    metadata: dbSet.metadata as Record<string, unknown> | null,
    completed: false, // Plans don't have completion
  }
}

/**
 * Convert TrainingSet to database format for saving workout_log_sets
 */
export function trainingSetToDbSet(
  set: TrainingSet,
  workoutLogId: number,
  workoutLogExerciseId: number,
  sessionPlanExerciseId?: number | null
): Omit<DBWorkoutLogSet, 'id' | 'created_at' | 'updated_at'> & { id?: number } {
  return {
    id: typeof set.id === 'number' ? set.id : undefined,
    workout_log_id: workoutLogId,
    workout_log_exercise_id: workoutLogExerciseId,
    session_plan_exercise_id: sessionPlanExerciseId ?? null,
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
    resistance_unit_id: set.resistanceUnitId ?? null,
    metadata: (set.metadata ?? null) as DBWorkoutLogSet['metadata'],
    completed: set.completed ?? false,
  }
}

/**
 * Convert TrainingSet to database format for saving session_plan_sets
 */
export function trainingSetToDbPlanSet(
  set: TrainingSet,
  sessionPlanExerciseId: number
): Omit<DBSessionPlanSet, 'id' | 'created_at' | 'updated_at'> & { id?: number } {
  return {
    id: typeof set.id === 'number' ? set.id : undefined,
    session_plan_exercise_id: sessionPlanExerciseId,
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
    resistance_unit_id: set.resistanceUnitId ?? null,
    metadata: (set.metadata ?? null) as DBSessionPlanSet['metadata'],
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determine which columns should be displayed based on available data
 */
export function getDisplayColumns(
  sets: TrainingSet[],
  fieldConfig: FieldConfig[] = DEFAULT_FIELD_CONFIG
): FieldConfig[] {
  return fieldConfig.filter(cfg =>
    cfg.always || sets.some(s => {
      const value = s[cfg.key]
      return value !== null && value !== undefined
    })
  )
}

/**
 * Get section order for sorting exercises by section
 * Uses unified exercise type names as section names
 */
export function getSectionOrder(section: string): number {
  const order: Record<string, number> = {
    Warmup: 1,
    Gym: 2,
    Isometric: 3,
    Plyometric: 4,
    Sprint: 5,
    Drill: 6,
    Circuit: 7,
    Cooldown: 8,
  }
  return order[section] ?? 99
}

/**
 * Format exercise shorthand notation (e.g., "3x10 @ 80kg")
 */
export function formatShorthand(exercise: TrainingExercise): string {
  const sets = exercise.sets
  if (sets.length === 0) return "No sets"

  const firstSet = sets[0]
  const isUniform = sets.every(
    (s) =>
      s.reps === firstSet.reps &&
      s.weight === firstSet.weight &&
      s.distance === firstSet.distance &&
      s.performingTime === firstSet.performingTime &&
      s.height === firstSet.height
  )

  if (isUniform) {
    const parts: string[] = []
    if (firstSet.reps) parts.push(`${sets.length}x${firstSet.reps}`)
    if (firstSet.distance) parts.push(`${sets.length}x ${firstSet.distance}m`)
    if (firstSet.weight) parts.push(`@ ${firstSet.weight}kg`)
    if (firstSet.performingTime) parts.push(`${firstSet.performingTime}s`)
    if (firstSet.height) parts.push(`@ ${firstSet.height}cm`)
    return parts.join(" ") || `${sets.length} sets`
  }

  const repsStr = sets.map((s) => s.reps).filter(Boolean)
  const weightsStr = sets.map((s) => s.weight).filter((w): w is number => w !== null && w !== undefined)
  const distStr = sets.map((s) => s.distance).filter(Boolean)
  const timeStr = sets.map((s) => s.performingTime).filter(Boolean)
  const heightStr = sets.map((s) => s.height).filter(Boolean)

  const parts: string[] = []
  if (repsStr.length > 0) parts.push(repsStr.join("+"))
  if (distStr.length > 0) parts.push(`${distStr[0]}m`)
  if (weightsStr.length > 0) {
    const min = Math.min(...weightsStr)
    const max = Math.max(...weightsStr)
    parts.push(min === max ? `@ ${min}kg` : `@ ${min}-${max}kg`)
  }
  if (timeStr.length > 0) {
    const times = timeStr.map((t) => `${t}s`).join("/")
    parts.push(times)
  }
  if (heightStr.length > 0) parts.push(`@ ${heightStr[0]}cm`)

  return parts.join(" ") || `${sets.length} sets`
}

/**
 * Get count of completed sets in an exercise
 */
export function getCompletedCount(exercise: TrainingExercise): number {
  return exercise.sets.filter((s) => s.completed).length
}

/**
 * Group exercises by superset
 */
export function groupBySupersets(exercises: TrainingExercise[]): (TrainingExercise | TrainingExercise[])[] {
  const result: (TrainingExercise | TrainingExercise[])[] = []
  const supersetGroups: Record<string, TrainingExercise[]> = {}

  exercises.forEach((ex) => {
    if (ex.supersetId) {
      if (!supersetGroups[ex.supersetId]) {
        supersetGroups[ex.supersetId] = []
      }
      supersetGroups[ex.supersetId].push(ex)
    }
  })

  let lastSupersetId: string | null = null
  exercises.forEach((ex) => {
    if (ex.supersetId) {
      if (ex.supersetId !== lastSupersetId) {
        result.push(supersetGroups[ex.supersetId])
        lastSupersetId = ex.supersetId
      }
    } else {
      result.push(ex)
      lastSupersetId = null
    }
  })

  return result
}
