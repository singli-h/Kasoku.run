/*
<ai_context>
Zod validation schemas for training plan data structures.
Provides type-safe validation for macrocycles, mesocycles, microcycles,
sessions, exercise presets, set details, and races.

These schemas align with the database schema and provide user-friendly
error messages for form validation.
</ai_context>
*/

import { z } from "zod"

// ============================================================================
// DATE VALIDATION HELPERS
// ============================================================================

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const dateMessage = "Invalid date format (expected YYYY-MM-DD)"

// Helper to validate end date is after start date
const validateDateRange = (data: { start_date: string; end_date: string }) => {
  return new Date(data.end_date) > new Date(data.start_date)
}

// ============================================================================
// MACROCYCLE VALIDATION
// ============================================================================

export const MacrocycleSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal('')),
  start_date: z.string()
    .regex(dateRegex, dateMessage),
  end_date: z.string()
    .regex(dateRegex, dateMessage),
}).refine(validateDateRange, {
  message: "End date must be after start date",
  path: ["end_date"]
})

export type MacrocycleFormData = z.infer<typeof MacrocycleSchema>

// ============================================================================
// MESOCYCLE VALIDATION
// ============================================================================

export const MesocycleSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal('')),
  start_date: z.string()
    .regex(dateRegex, dateMessage),
  end_date: z.string()
    .regex(dateRegex, dateMessage),
  macrocycle_id: z.number()
    .int("Macrocycle ID must be an integer")
    .positive("Macrocycle ID must be positive"),
  metadata: z.any().optional()
}).refine(validateDateRange, {
  message: "End date must be after start date",
  path: ["end_date"]
})

export type MesocycleFormData = z.infer<typeof MesocycleSchema>

// ============================================================================
// MICROCYCLE VALIDATION
// ============================================================================

export const MicrocycleSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal('')),
  start_date: z.string()
    .regex(dateRegex, dateMessage),
  end_date: z.string()
    .regex(dateRegex, dateMessage),
  mesocycle_id: z.number()
    .int("Mesocycle ID must be an integer")
    .positive("Mesocycle ID must be positive"),
  athlete_group_id: z.number()
    .int("Athlete group ID must be an integer")
    .positive("Athlete group ID must be positive")
    .optional()
    .nullable()
}).refine(validateDateRange, {
  message: "End date must be after start date",
  path: ["end_date"]
})

export type MicrocycleFormData = z.infer<typeof MicrocycleSchema>

// ============================================================================
// SESSION (EXERCISE PRESET GROUP) VALIDATION
// ============================================================================

export const SessionSchema = z.object({
  name: z.string()
    .min(1, "Session name is required")
    .max(100, "Session name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal('')),
  microcycle_id: z.number()
    .int("Microcycle ID must be an integer")
    .positive("Microcycle ID must be positive")
    .optional()
    .nullable(),
  athlete_group_id: z.number()
    .int("Athlete group ID must be an integer")
    .positive("Athlete group ID must be positive")
    .optional()
    .nullable(),
  day: z.number()
    .int("Day must be an integer")
    .min(1, "Day must be between 1 (Monday) and 7 (Sunday)")
    .max(7, "Day must be between 1 (Monday) and 7 (Sunday)")
    .optional()
    .nullable(),
  week: z.number()
    .int("Week must be an integer")
    .positive("Week must be a positive number")
    .optional()
    .nullable(),
  date: z.string()
    .regex(dateRegex, dateMessage)
    .optional()
    .nullable()
    .or(z.literal('')),
  is_template: z.boolean()
    .optional()
    .default(false),
  session_mode: z.enum(['individual', 'group'])
    .optional()
    .nullable()
})

export type SessionFormData = z.infer<typeof SessionSchema>

// ============================================================================
// EXERCISE PRESET VALIDATION
// ============================================================================

export const ExercisePresetSchema = z.object({
  exercise_id: z.number()
    .int("Exercise ID must be an integer")
    .positive("Exercise ID must be positive"),
  session_plan_id: z.number()
    .int("Session ID must be an integer")
    .positive("Session ID must be positive"),
  exercise_order: z.number()
    .int("Order must be an integer")
    .min(0, "Order must be 0 or greater"),
  superset_id: z.number()
    .int("Superset ID must be an integer")
    .positive("Superset ID must be positive")
    .optional()
    .nullable(),
  notes: z.string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional()
    .or(z.literal(''))
})

export type ExercisePresetFormData = z.infer<typeof ExercisePresetSchema>

// ============================================================================
// SET DETAILS VALIDATION
// ============================================================================

export const SetDetailsSchema = z.object({
  session_plan_exercise_id: z.number()
    .int("Session plan exercise ID must be an integer")
    .positive("Session plan exercise ID must be positive"),
  set_index: z.number()
    .int("Set index must be an integer")
    .min(0, "Set index must be 0 or greater"),

  // Basic parameters
  reps: z.number()
    .int("Reps must be an integer")
    .min(0, "Reps must be 0 or greater")
    .max(999, "Reps must be less than 1000")
    .optional()
    .nullable(),
  weight: z.number()
    .min(0, "Weight must be 0 or greater")
    .max(9999, "Weight must be less than 10000")
    .optional()
    .nullable(),
  rest_time: z.number()
    .int("Rest time must be an integer")
    .min(0, "Rest time must be 0 or greater")
    .max(3600, "Rest time must be 1 hour or less")
    .optional()
    .nullable(),
  rpe: z.number()
    .min(0, "RPE must be between 0 and 10")
    .max(10, "RPE must be between 0 and 10")
    .optional()
    .nullable(),

  // Advanced parameters
  tempo: z.string()
    .max(20, "Tempo must be 20 characters or less")
    .optional()
    .nullable()
    .or(z.literal('')),
  resistance: z.number()
    .min(0, "Resistance must be 0 or greater")
    .optional()
    .nullable(),
  resistance_unit_id: z.number()
    .int("Resistance unit ID must be an integer")
    .positive("Resistance unit ID must be positive")
    .optional()
    .nullable(),
  distance: z.number()
    .min(0, "Distance must be 0 or greater")
    .optional()
    .nullable(),
  height: z.number()
    .min(0, "Height must be 0 or greater")
    .optional()
    .nullable(),
  power: z.number()
    .min(0, "Power must be 0 or greater")
    .optional()
    .nullable(),
  velocity: z.number()
    .min(0, "Velocity must be 0 or greater")
    .optional()
    .nullable(),
  effort: z.number()
    .min(0, "Effort must be between 0 and 100")
    .max(100, "Effort must be between 0 and 100")
    .optional()
    .nullable(),
  performing_time: z.number()
    .min(0, "Performing time must be 0 or greater")
    .optional()
    .nullable(),

  // Metadata
  metadata: z.any()
    .optional()
    .nullable()
})

export type SetDetailsFormData = z.infer<typeof SetDetailsSchema>

// ============================================================================
// RACE VALIDATION
// ============================================================================

export const RaceSchema = z.object({
  name: z.string()
    .min(1, "Race name is required")
    .max(100, "Race name must be 100 characters or less"),
  type: z.string()
    .min(1, "Race type is required")
    .max(50, "Race type must be 50 characters or less"),
  date: z.string()
    .regex(dateRegex, dateMessage),
  location: z.string()
    .max(200, "Location must be 200 characters or less")
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional()
    .nullable()
    .or(z.literal('')),
  macrocycle_id: z.number()
    .int("Macrocycle ID must be an integer")
    .positive("Macrocycle ID must be positive")
    .optional()
    .nullable()
})

export type RaceFormData = z.infer<typeof RaceSchema>

// ============================================================================
// EXERCISE VALIDATION
// ============================================================================

export const ExerciseSchema = z.object({
  name: z.string()
    .min(1, "Exercise name is required")
    .max(100, "Exercise name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable()
    .or(z.literal('')),
  exercise_type_id: z.number()
    .int("Exercise type ID must be an integer")
    .positive("Exercise type ID must be positive")
    .optional()
    .nullable(),
  unit_id: z.number()
    .int("Unit ID must be an integer")
    .positive("Unit ID must be positive")
    .optional()
    .nullable(),
  video_url: z.string()
    .url("Video URL must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal('')),
  visibility: z.enum(['global', 'private'])
    .optional()
    .default('private')
})

export type ExerciseFormData = z.infer<typeof ExerciseSchema>

// ============================================================================
// BATCH VALIDATION HELPERS
// ============================================================================

/**
 * Validate an array of set details
 * Useful for batch operations in session planning
 */
export const SetDetailsArraySchema = z.array(SetDetailsSchema)

/**
 * Validate an array of exercise presets
 */
export const ExercisePresetArraySchema = z.array(ExercisePresetSchema)

// ============================================================================
// COMPOSITE VALIDATION SCHEMAS
// ============================================================================

/**
 * Complete session with exercises and sets
 * Used when creating/updating a full session in one operation
 */
export const CompleteSessionSchema = SessionSchema.extend({
  exercises: z.array(
    ExercisePresetSchema.extend({
      sets: z.array(SetDetailsSchema.omit({ session_plan_exercise_id: true }))
    })
  ).optional()
})

export type CompleteSessionFormData = z.infer<typeof CompleteSessionSchema>

// ============================================================================
// VALIDATION ERROR HELPERS
// ============================================================================

/**
 * Extract user-friendly error messages from Zod validation errors
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })

  return errors
}

/**
 * Format validation error for display in toast/alert
 */
export function formatValidationError(error: z.ZodError): string {
  return error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
}
