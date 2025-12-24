/*
<ai_context>
Training plan related TypeScript interfaces and types.
Follows the database schema for accurate type definitions and includes
hierarchical training periodization (macrocycles → mesocycles → microcycles).
</ai_context>
*/

import {
  Macrocycle, MacrocycleInsert, MacrocycleUpdate,
  Mesocycle, MesocycleInsert, MesocycleUpdate,
  Microcycle, MicrocycleInsert, MicrocycleUpdate,
  Exercise, ExerciseInsert, ExerciseUpdate,
  ExerciseType,
  Unit,
  // New type names
  SessionPlan, SessionPlanInsert, SessionPlanUpdate,
  SessionPlanExercise, SessionPlanExerciseInsert, SessionPlanExerciseUpdate,
  SessionPlanSet, SessionPlanSetInsert, SessionPlanSetUpdate,
  WorkoutLog, WorkoutLogInsert, WorkoutLogUpdate,
  WorkoutLogExercise, WorkoutLogExerciseInsert, WorkoutLogExerciseUpdate,
  WorkoutLogSet, WorkoutLogSetInsert, WorkoutLogSetUpdate,
  // Legacy aliases (deprecated)
  ExercisePresetGroup, ExercisePresetGroupInsert, ExercisePresetGroupUpdate,
  ExercisePreset, ExercisePresetInsert, ExercisePresetUpdate,
  ExercisePresetDetail,
  ExerciseTrainingDetail,
  ExerciseTrainingSession, ExerciseTrainingSessionInsert, ExerciseTrainingSessionUpdate,
  Athlete, AthleteInsert, AthleteUpdate,
  AthleteGroup, AthleteGroupInsert, AthleteGroupUpdate,
  Database
} from './database'

// Re-export database types for convenience
export type {
  Macrocycle, MacrocycleInsert, MacrocycleUpdate,
  Mesocycle, MesocycleInsert, MesocycleUpdate,
  Microcycle, MicrocycleInsert, MicrocycleUpdate,
  Exercise, ExerciseInsert, ExerciseUpdate,
  ExerciseType,
  Unit,
  // New type names
  SessionPlan, SessionPlanInsert, SessionPlanUpdate,
  SessionPlanExercise, SessionPlanExerciseInsert, SessionPlanExerciseUpdate,
  SessionPlanSet, SessionPlanSetInsert, SessionPlanSetUpdate,
  WorkoutLog, WorkoutLogInsert, WorkoutLogUpdate,
  WorkoutLogExercise, WorkoutLogExerciseInsert, WorkoutLogExerciseUpdate,
  WorkoutLogSet, WorkoutLogSetInsert, WorkoutLogSetUpdate,
  // Legacy aliases (deprecated)
  ExercisePresetGroup, ExercisePresetGroupInsert, ExercisePresetGroupUpdate,
  ExercisePreset, ExercisePresetInsert, ExercisePresetUpdate,
  ExercisePresetDetail,
  ExerciseTrainingDetail,
  ExerciseTrainingSession, ExerciseTrainingSessionInsert, ExerciseTrainingSessionUpdate,
  Athlete, AthleteInsert, AthleteUpdate,
  AthleteGroup, AthleteGroupInsert, AthleteGroupUpdate
}

// ============================================================================
// Extended Types with Relationships
// ============================================================================

export interface MacrocycleWithDetails extends Macrocycle {
  mesocycles?: MesocycleWithDetails[]
  athlete_group?: AthleteGroup | null
  user?: any // User type from other modules
}

export interface MesocycleWithDetails extends Mesocycle {
  macrocycle?: Macrocycle | null
  microcycles?: MicrocycleWithDetails[]
  user?: any
}

export interface MicrocycleWithDetails extends Microcycle {
  mesocycle?: Mesocycle | null
  session_plans?: SessionPlanWithDetails[]
  user?: any
}

// New extended types
export interface SessionPlanWithDetails extends SessionPlan {
  microcycle?: Microcycle | null
  session_plan_exercises?: SessionPlanExerciseWithDetails[]
  athlete_group?: AthleteGroup | null
}

export interface SessionPlanExerciseWithDetails extends SessionPlanExercise {
  exercise?: ExerciseWithDetails | null
  session_plan?: SessionPlan | null
  session_plan_sets?: SessionPlanSet[]
}

// Workout log exercise (links workout to exercises)
export interface WorkoutLogExerciseWithDetails extends WorkoutLogExercise {
  exercise?: ExerciseWithDetails | null
  session_plan_exercise?: SessionPlanExerciseWithDetails | null
  workout_log_sets?: WorkoutLogSet[]
}

export interface WorkoutLogWithDetails extends WorkoutLog {
  athlete?: Athlete | null
  session_plan?: SessionPlanWithDetails | null
  workout_log_exercises?: WorkoutLogExerciseWithDetails[]
  /** @deprecated Use workout_log_exercises instead - sets are now nested under exercises */
  workout_log_sets?: WorkoutLogSet[]
}

export interface ExerciseWithDetails extends Exercise {
  exercise_type?: ExerciseType | null
  unit?: Unit | null
}

// ============================================================================
// Form and UI Types
// ============================================================================

export interface CreateMacrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  athlete_group_id?: number
}

export interface CreateMesocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  macrocycle_id?: number
  metadata?: any
}

export interface CreateMicrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  mesocycle_id?: number
  sessions?: CreateSessionForm[]
}

export interface CreateSessionForm {
  name: string
  description?: string
  date: string
  session_mode: 'individual' | 'group'
  week: number
  day: number
  exercises?: CreateExercisePresetForm[]
}

export interface CreateExercisePresetForm {
  exercise_id: number
  superset_id?: number
  exercise_order: number
  notes?: string
  presetDetails?: CreateExercisePresetDetailForm[]
}

export interface CreateExercisePresetDetailForm {
  set_index: number
  reps?: number
  weight?: number
  rest_time?: number
  rpe?: number
  tempo?: string
  resistance?: number
  resistance_unit_id?: number
  distance?: number
  height?: number
  power?: number
  velocity?: number
  effort?: number
  performing_time?: number
  metadata?: any
}

// ============================================================================
// Training Plan Search and Filter Types
// ============================================================================

export interface TrainingPlanFilters {
  planType?: 'macrocycle' | 'mesocycle' | 'microcycle'
  status?: 'pending' | 'active' | 'completed' | 'archived'
  athlete_group_id?: number
  start_date_from?: string
  start_date_to?: string
  search?: string
}

export interface ExerciseFilters {
  search?: string
  exercise_type_id?: number
  tag_ids?: number[]
  unit_id?: number
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTrainingPlanRequest {
  planType: 'macrocycle' | 'mesocycle' | 'microcycle'
  data: CreateMacrocycleForm | CreateMesocycleForm | CreateMicrocycleForm
}

export interface TrainingPlanResponse {
  id: number
  type: 'macrocycle' | 'mesocycle' | 'microcycle'
  data: MacrocycleWithDetails | MesocycleWithDetails | MicrocycleWithDetails
}

// ============================================================================
// Training Progress and Analytics Types
// ============================================================================

export interface PerformanceMetrics {
  total_sets: number
  total_reps: number
  total_weight: number
  average_rpe: number
  completion_rate: number
  streak_days: number
}

export interface ExerciseProgress {
  exercise_id: number
  exercise_name: string
  sessions_completed: number
  pr_weight?: number
  pr_reps?: number
  pr_date?: string
  average_rpe: number
  volume_trend: 'increasing' | 'stable' | 'decreasing'
}

// ============================================================================
// Enums and Constants
// ============================================================================

export const TRAINING_GOALS = [
  'strength',
  'hypertrophy', 
  'endurance',
  'power',
  'sport_specific',
  'general_fitness'
] as const

export type TrainingGoal = typeof TRAINING_GOALS[number]

export const EXPERIENCE_LEVELS = [
  'beginner',
  'intermediate', 
  'advanced'
] as const

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]

export const SESSION_MODES = [
  'individual',
  'group'
] as const

export type SessionMode = typeof SESSION_MODES[number]

export const PLAN_STATUSES = [
  'pending',
  'active',
  'completed',
  'archived'
] as const

export type PlanStatus = typeof PLAN_STATUSES[number] 