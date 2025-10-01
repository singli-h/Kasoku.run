/**
 * Session Planner Type Definitions
 * Maps to database schema while adding UI-specific fields for state management
 */

import type { Tables } from "@/types/database"

// Database types
export type ExercisePreset = Tables<"exercise_presets">
export type ExercisePresetDetail = Tables<"exercise_preset_details">
export type Exercise = Tables<"exercises">
export type ExercisePresetGroup = Tables<"exercise_preset_groups">

/**
 * Set parameters for an exercise
 * Maps to exercise_preset_details table
 */
export interface SetParameter {
  id?: number // exercise_preset_detail id
  exercise_preset_id?: number
  set_index: number // Which set (1, 2, 3, etc.)
  reps: number | null
  weight: number | null // In kg or lbs
  rest_time: number | null // Rest in seconds
  tempo: string | null // e.g., "2-0-2-0" (eccentric-bottom-concentric-top)
  rpe: number | null // Rate of Perceived Exertion (1-10)
  distance: number | null // For running/cardio
  performing_time: number | null // Duration in seconds
  resistance_unit_id: number | null
  // UI-only fields (not in database)
  isEditing?: boolean
}

/**
 * Exercise in session with full details
 * Extends exercise_presets table with UI state
 */
export interface SessionExercise {
  // Database fields from exercise_presets
  id: string // Using string for client-side generation
  exercise_preset_group_id?: number
  exercise_id: number
  preset_order: number
  superset_id: number | null
  notes: string | null

  // Joined data from exercises table
  exercise: {
    id: number
    name: string
    description: string | null
    exercise_type_id: number | null
    video_url: string | null
  } | null

  // Set parameters (from exercise_preset_details)
  sets: SetParameter[]

  // UI-only fields (for state management)
  isCollapsed?: boolean
  validationErrors?: string[]
  isEditing?: boolean
}

/**
 * Superset group for visual grouping of exercises
 */
export interface SupersetGroup {
  id: string // superset_id (as string)
  exercises: SessionExercise[]
}

/**
 * Exercise library item (for adding exercises to session)
 */
export interface ExerciseLibraryItem {
  id: number
  name: string
  description: string | null
  exercise_type_id: number | null
  type: "warmup" | "gym" | "circuit" | "isometric" | "plyometric" | "sprint" | "drill" | "other"
  category?: string
  isFavorite?: boolean
}

/**
 * Session metadata
 * Maps to exercise_preset_groups table
 */
export interface Session {
  id?: number
  name: string | null
  description: string | null
  date: string | null // ISO date string
  microcycle_id?: number | null
  user_id?: number | null
  athlete_group_id?: number | null
  session_mode?: string | null
  week?: number | null
  day?: number | null
  is_template?: boolean | null
  // UI-only fields
  estimatedDuration?: number | null // Calculated from exercises
  notes?: string | null
}

/**
 * Session state with undo/redo support
 */
export interface SessionState {
  session: Session
  exercises: SessionExercise[]
  selection: Set<string> // Selected exercise IDs
  expandedRows: Set<string> // Expanded exercise IDs
  libraryOpen: boolean
  batchEditOpen: boolean
  pageMode: "simple" | "detail" // Simple = basic view, Detail = all parameters
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  exerciseErrors: Map<string, string[]>
}

/**
 * Batch edit operation
 */
export interface BatchEditOperation {
  field: keyof SetParameter
  operation: "set" | "add" | "multiply"
  value: number | string
}

/**
 * Exercise type mapping
 */
export const EXERCISE_TYPE_MAP: Record<number, ExerciseLibraryItem["type"]> = {
  1: "warmup",
  2: "gym",
  3: "circuit",
  4: "isometric",
  5: "plyometric",
  6: "sprint",
  7: "drill",
}

/**
 * Default set parameters
 */
export const DEFAULT_SET: Omit<SetParameter, "set_index"> = {
  reps: 10,
  weight: null,
  rest_time: 90,
  tempo: "2-0-2-0",
  rpe: 7,
  distance: null,
  performing_time: null,
  resistance_unit_id: null,
}

/**
 * Field configuration for dynamic form rendering
 */
export interface FieldConfig {
  key: keyof SetParameter
  label: string
  unit?: string
  type: "number" | "text"
  placeholder?: string
  min?: number
  max?: number
  step?: number
  always?: boolean // Always show this field
}

/**
 * Exercise type-specific field configurations
 * Determines which fields to show for each exercise type
 */
export const EXERCISE_TYPE_DEFAULTS: Record<ExerciseLibraryItem["type"], FieldConfig[]> = {
  gym: [
    { key: "reps", label: "Reps", type: "number", placeholder: "8" },
    { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "100", step: 2.5 },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "120" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
    { key: "tempo", label: "Tempo", type: "text", placeholder: "2-0-2-0" },
  ],
  plyometric: [
    { key: "reps", label: "Reps", type: "number", placeholder: "5" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "90" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "30" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "8", min: 1, max: 10 },
  ],
  sprint: [
    { key: "reps", label: "Reps", type: "number", placeholder: "6" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "100" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "180" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "12" },
  ],
  circuit: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "30" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "15" },
    { key: "reps", label: "Reps", type: "number", placeholder: "15" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
  ],
  isometric: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "45" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
  ],
  warmup: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "30" },
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "30" },
  ],
  drill: [
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "20" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
  ],
  other: [
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "60" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
  ],
}

/**
 * Get field configuration for an exercise type
 */
export function getFieldsForExercise(exercise: SessionExercise | null, mode: "simple" | "detail"): FieldConfig[] {
  if (!exercise?.exercise?.exercise_type_id) {
    return EXERCISE_TYPE_DEFAULTS.gym.slice(0, mode === "simple" ? 4 : undefined)
  }

  const exerciseType = EXERCISE_TYPE_MAP[exercise.exercise.exercise_type_id] || "gym"
  const fields = EXERCISE_TYPE_DEFAULTS[exerciseType] || EXERCISE_TYPE_DEFAULTS.gym

  return mode === "simple" ? fields.slice(0, 4) : fields
}
