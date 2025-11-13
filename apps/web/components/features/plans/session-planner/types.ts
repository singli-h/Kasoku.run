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
  id?: number // exercise_preset_detail id or exercise_training_detail id
  exercise_preset_id?: number
  set_index: number // Which set (1, 2, 3, etc.)
  
  // Core fields that exist in BOTH tables (exercise_preset_details & exercise_training_details)
  reps: number | null
  weight: number | null // In kg or lbs
  distance: number | null // For running/cardio
  performing_time: number | null // Duration in seconds (sprint time/results)
  rest_time: number | null // Rest in seconds
  tempo: string | null // e.g., "2-0-2-0" (eccentric-bottom-concentric-top)
  rpe: number | null // Rate of Perceived Exertion (1-10)
  resistance_unit_id: number | null
  power: number | null
  velocity: number | null
  effort: number | null
  height: number | null
  resistance: number | null
  
  // Training execution runtime flags (app-level)
  completed?: boolean // Whether this set was completed (training-time only)
  
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
  power: null,
  velocity: null,
  effort: null,
  height: null,
  resistance: null,
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
    { key: "power", label: "Power", unit: "W", type: "number", placeholder: "500" },
    { key: "velocity", label: "Velocity", unit: "m/s", type: "number", placeholder: "1.0", step: 0.1 },
    { key: "effort", label: "Effort", type: "number", placeholder: "80", min: 0, max: 100 },
  ],
  plyometric: [
    { key: "reps", label: "Reps", type: "number", placeholder: "5" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "90" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "30" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "8", min: 1, max: 10 },
    { key: "height", label: "Height", unit: "m", type: "number", placeholder: "0.6", step: 0.01 },
    { key: "resistance", label: "Resistance", unit: "kg", type: "number", placeholder: "0", step: 2.5 },
    { key: "power", label: "Power", unit: "W", type: "number", placeholder: "500" },
  ],
  sprint: [
    { key: "reps", label: "Reps", type: "number", placeholder: "6" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "100" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "180" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "12" },
    { key: "velocity", label: "Velocity", unit: "m/s", type: "number", placeholder: "9.5", step: 0.1 },
    { key: "power", label: "Power", unit: "W", type: "number", placeholder: "800" },
  ],
  circuit: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "30" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "15" },
    { key: "reps", label: "Reps", type: "number", placeholder: "15" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
    { key: "effort", label: "Effort", type: "number", placeholder: "70", min: 0, max: 100 },
  ],
  isometric: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "45" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
    { key: "effort", label: "Effort", type: "number", placeholder: "80", min: 0, max: 100 },
  ],
  warmup: [
    { key: "performing_time", label: "Duration", unit: "s", type: "number", placeholder: "30" },
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "30" },
    { key: "effort", label: "Effort", type: "number", placeholder: "50", min: 0, max: 100 },
  ],
  drill: [
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "20" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
    { key: "effort", label: "Effort", type: "number", placeholder: "80", min: 0, max: 100 },
  ],
  other: [
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "performing_time", label: "Time", unit: "s", type: "number", placeholder: "60" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
    { key: "effort", label: "Effort", type: "number", placeholder: "70", min: 0, max: 100 },
  ],
}

/**
 * Fixed standard order for all fields in detail mode
 * Always shows all 12 available fields with reps always first
 */
const DETAIL_MODE_FIELDS: FieldConfig[] = [
    { key: "reps", label: "Reps", type: "number", placeholder: "10" },
    { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "50", step: 2.5 },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "100" },
    { key: "performing_time", label: "Time(s)", unit: "s", type: "number", placeholder: "30" },
    { key: "rest_time", label: "Rest Time", unit: "s", type: "number", placeholder: "60" },
    { key: "tempo", label: "Tempo", type: "text", placeholder: "2-0-2-0" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
    { key: "power", label: "Power", unit: "W", type: "number", placeholder: "500" },
    { key: "velocity", label: "Velocity", unit: "m/s", type: "number", placeholder: "1.0", step: 0.1 },
    { key: "effort", label: "Effort", type: "number", placeholder: "80", min: 0, max: 100 },
    { key: "height", label: "Height", unit: "m", type: "number", placeholder: "0.6", step: 0.01 },
    { key: "resistance", label: "Resistance", unit: "kg", type: "number", placeholder: "0", step: 2.5 },
  ]

/**
 * Get field configuration for an exercise type
 * Simple mode: Shows first 4 fields from exercise type defaults, always includes reps if missing
 * Detail mode: Shows ALL 12 fields in fixed standard order with reps always first
 */
export function getFieldsForExercise(exercise: SessionExercise | null, mode: "simple" | "detail"): FieldConfig[] {
  // Detail mode: Always return fixed order with all 12 fields
  if (mode === "detail") {
    return DETAIL_MODE_FIELDS
  }

  // Simple mode: use exercise type defaults, but ensure reps is included
  if (!exercise?.exercise?.exercise_type_id) {
    const gymFields = EXERCISE_TYPE_DEFAULTS.gym.slice(0, 4)
    // Ensure reps is included
    const hasReps = gymFields.some(f => f.key === "reps")
    if (!hasReps && gymFields.length > 0) {
      const repsField: FieldConfig = { key: "reps", label: "Reps", type: "number", placeholder: "10" }
      return [repsField, ...gymFields].slice(0, 4)
    }
    return gymFields
  }

  const exerciseType = EXERCISE_TYPE_MAP[exercise.exercise.exercise_type_id] || "gym"
  let fields = EXERCISE_TYPE_DEFAULTS[exerciseType] || EXERCISE_TYPE_DEFAULTS.gym

  // Ensure reps is included in simple mode (prepend if missing)
  const hasReps = fields.some(f => f.key === "reps")
  if (!hasReps && fields.length > 0) {
    const repsField: FieldConfig = { key: "reps", label: "Reps", type: "number", placeholder: "10" }
    fields = [repsField, ...fields]
  }

  return fields.slice(0, 4)
}
