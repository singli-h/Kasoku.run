/**
 * ChangeSet Pattern: Athlete Domain Proposal Tools
 *
 * Tools that create ChangeRequests for workout modifications.
 * Athletes can log set performance, swap exercises, and add session notes.
 *
 * Uses WorkoutLog prefix to align with database entity names:
 * - workout_logs → WorkoutLog*
 * - workout_log_exercises → WorkoutLogExercise*
 * - workout_log_sets → WorkoutLogSet*
 *
 * Key differences from Coach domain:
 * - No delete operations (athletes swap or skip instead)
 * - Uses workout_log_* entities instead of session_plan_*
 * - Focuses on logging actual performance vs planned values
 *
 * @see specs/005-ai-athlete-workout/contracts/athlete-tools.yaml
 * @see specs/002-ai-session-assistant/reference/20251221-session-tool-definitions.md
 */

import { z } from 'zod'
import { tool } from 'ai'

/**
 * Transform that converts empty strings to undefined.
 * AI sometimes sends "" instead of omitting optional fields.
 */
const emptyToUndefined = (v: string | undefined) => (v === '' ? undefined : v)
const emptyNumToUndefined = (v: number | undefined) =>
  v === undefined || (typeof v === 'string' && v === '') ? undefined : v

// ============================================================================
// Set Tools (workout_log_set) - T001, T002
// ============================================================================

/**
 * Schema for createWorkoutLogSetChangeRequest.
 * Logs the athlete's actual performance for a set.
 *
 * Updated to use workout_log naming (post schema migration 2025-Q4).
 */
export const createWorkoutLogSetChangeRequestSchema = z.object({
  workoutLogExerciseId: z
    .string()
    .describe('ID of the workout log exercise this set belongs to'),
  setIndex: z
    .number()
    .int()
    .min(1)
    .describe('Which set to log (1-based)'),
  reps: z
    .number()
    .int()
    .min(0)
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Actual reps performed (0 = skipped)'),
  weight: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Actual weight used (kg)'),
  rpe: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Rate of Perceived Exertion (1-10)'),
  completed: z
    .boolean()
    .default(true)
    .describe('Whether the set was completed (false for skipped)'),
  distance: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Distance in meters (for sprints, cardio, throws, jumps)'),
  performingTime: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Time in seconds with decimals (e.g., 7.23 for a freelap split, 45 for a timed hold)'),
  power: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Power output'),
  velocity: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Velocity measurement'),
  height: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Jump height'),
  resistance: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Resistance level'),
  reasoning: z.string().describe('Why this performance is being logged'),
}).refine(
  (data) => data.reps !== undefined || data.weight !== undefined ||
            data.distance !== undefined || data.performingTime !== undefined,
  { message: 'At least one of reps, weight, distance, or performingTime is required when creating a set.' }
)

export type CreateWorkoutLogSetInput = z.infer<typeof createWorkoutLogSetChangeRequestSchema>

// DEPRECATED: Legacy type alias
export type CreateTrainingSetInput = CreateWorkoutLogSetInput

export const createWorkoutLogSetChangeRequestTool = tool({
  description:
    "Log or ADD a set for an exercise. Use this to: (1) Log actual performance for a set, (2) ADD additional sets to an exercise by using the next setIndex. For example, if an exercise has 3 sets, add a 4th by using setIndex: 4. Requires workoutLogExerciseId from getWorkoutContext.",
  inputSchema: createWorkoutLogSetChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const createTrainingSetChangeRequestTool = createWorkoutLogSetChangeRequestTool
// DEPRECATED: Legacy schema alias
export const createTrainingSetChangeRequestSchema = createWorkoutLogSetChangeRequestSchema

/**
 * Schema for updateWorkoutLogSetChangeRequest.
 * Updates performance data that was already logged.
 *
 * Updated to use workout_log naming (post schema migration 2025-Q4).
 */
export const updateWorkoutLogSetChangeRequestSchema = z.object({
  workoutLogSetId: z
    .string()
    .describe('ID of the workout log set to update'),
  reps: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Corrected reps'),
  weight: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Corrected weight'),
  rpe: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Corrected RPE'),
  completed: z
    .boolean()
    .optional()
    .describe('Update completion status'),
  distance: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Distance in meters'),
  performingTime: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Time in seconds with decimals (e.g., 7.23 for a sprint split)'),
  power: z
    .number()
    .optional()
    .transform(emptyNumToUndefined),
  velocity: z
    .number()
    .optional()
    .transform(emptyNumToUndefined),
  height: z
    .number()
    .optional()
    .transform(emptyNumToUndefined),
  resistance: z
    .number()
    .optional()
    .transform(emptyNumToUndefined),
  reasoning: z.string().describe('Why this correction is being made'),
})

export type UpdateWorkoutLogSetInput = z.infer<typeof updateWorkoutLogSetChangeRequestSchema>

// DEPRECATED: Legacy type alias
export type UpdateTrainingSetInput = UpdateWorkoutLogSetInput

export const updateWorkoutLogSetChangeRequestTool = tool({
  description:
    'Update performance data that was already logged. Use this when the athlete wants to correct a mistake.',
  inputSchema: updateWorkoutLogSetChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateTrainingSetChangeRequestTool = updateWorkoutLogSetChangeRequestTool
// DEPRECATED: Legacy schema alias
export const updateTrainingSetChangeRequestSchema = updateWorkoutLogSetChangeRequestSchema

// ============================================================================
// Exercise Tools (workout_log_exercise) - T003, T019
// ============================================================================

/**
 * Schema for createWorkoutLogExerciseChangeRequest.
 * Adds a new exercise to the workout.
 *
 * Updated to use workout_log naming (post schema migration 2025-Q4).
 */
export const createWorkoutLogExerciseChangeRequestSchema = z.object({
  workoutLogId: z
    .string()
    .describe('Parent workout log ID'),
  exerciseId: z
    .string()
    .describe('ID from exercise library'),
  exerciseName: z
    .string()
    .describe('Name for display'),
  exerciseOrder: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Position in workout (defaults to end)'),
  notes: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Exercise-specific notes'),
  reasoning: z.string().describe('Why this exercise is being added'),
})

export type CreateWorkoutLogExerciseInput = z.infer<typeof createWorkoutLogExerciseChangeRequestSchema>

// DEPRECATED: Legacy type alias
export type CreateTrainingExerciseInput = CreateWorkoutLogExerciseInput

export const createWorkoutLogExerciseChangeRequestTool = tool({
  description:
    'Add a COMPLETELY NEW exercise to the workout (not in the original plan). Do NOT use this to add sets - use createWorkoutLogSetChangeRequest instead to add sets to an existing exercise.',
  inputSchema: createWorkoutLogExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const createTrainingExerciseChangeRequestTool = createWorkoutLogExerciseChangeRequestTool
// DEPRECATED: Legacy schema alias
export const createTrainingExerciseChangeRequestSchema = createWorkoutLogExerciseChangeRequestSchema

/**
 * Schema for updateWorkoutLogExerciseChangeRequest.
 * Updates an exercise in the workout (swap, reorder, notes).
 * To swap an exercise, provide a new exerciseId and exerciseName.
 *
 * Updated to use workout_log naming (post schema migration 2025-Q4).
 */
export const updateWorkoutLogExerciseChangeRequestSchema = z.object({
  workoutLogExerciseId: z
    .string()
    .describe('ID of the workout log exercise to update'),
  exerciseId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('New exercise ID from library (for swapping)'),
  exerciseName: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('New exercise name (required when swapping)'),
  exerciseOrder: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('New position in workout'),
  notes: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Updated notes'),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateWorkoutLogExerciseInput = z.infer<typeof updateWorkoutLogExerciseChangeRequestSchema>

// DEPRECATED: Legacy type alias
export type UpdateTrainingExerciseInput = UpdateWorkoutLogExerciseInput

export const updateWorkoutLogExerciseChangeRequestTool = tool({
  description:
    'Update an exercise in the workout. To swap exercises, provide a new exerciseId. To reorder, provide exerciseOrder.',
  inputSchema: updateWorkoutLogExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateTrainingExerciseChangeRequestTool = updateWorkoutLogExerciseChangeRequestTool
// DEPRECATED: Legacy schema alias
export const updateTrainingExerciseChangeRequestSchema = updateWorkoutLogExerciseChangeRequestSchema

// ============================================================================
// Session Tools (workout_log) - T004
// ============================================================================

/**
 * Schema for updateWorkoutLogChangeRequest.
 * Updates the athlete's workout session notes.
 * Athletes cannot change session status or other properties.
 *
 * Updated to use workout_log naming (post schema migration 2025-Q4).
 */
export const updateWorkoutLogChangeRequestSchema = z.object({
  workoutLogId: z
    .string()
    .describe('ID of the workout log'),
  notes: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Session notes to add or update'),
  reasoning: z.string().describe('Why this note is being added'),
})

export type UpdateWorkoutLogInput = z.infer<typeof updateWorkoutLogChangeRequestSchema>

// DEPRECATED: Legacy type alias
export type UpdateTrainingSessionInput = UpdateWorkoutLogInput

export const updateWorkoutLogChangeRequestTool = tool({
  description:
    "Update the athlete's workout session notes. Use this to capture feedback about the session.",
  inputSchema: updateWorkoutLogChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateTrainingSessionChangeRequestTool = updateWorkoutLogChangeRequestTool
// DEPRECATED: Legacy schema alias
export const updateTrainingSessionChangeRequestSchema = updateWorkoutLogChangeRequestSchema

// ============================================================================
// Delete Tools (for removing proposals from buffer)
// ============================================================================

/**
 * Schema for deleteWorkoutLogExerciseChangeRequest.
 * Removes an exercise proposal from the changeset buffer.
 *
 * IMPORTANT: Only temp-ID proposals can be deleted (e.g., "temp-550e8400-...").
 * Attempts to delete real workout data (numeric IDs) will be rejected.
 * Athletes should use updateWorkoutLogSetChangeRequest with completed: false instead.
 */
export const deleteWorkoutLogExerciseChangeRequestSchema = z.object({
  workoutLogExerciseId: z
    .string()
    .describe(
      'ID of the exercise to remove from the proposal. Only temp-IDs (e.g., "temp-550e8400-...") can be deleted. Real workout data cannot be deleted - mark sets as skipped instead.'
    ),
  reasoning: z.string().describe('Why this exercise proposal is being removed'),
})

export type DeleteWorkoutLogExerciseInput = z.infer<typeof deleteWorkoutLogExerciseChangeRequestSchema>

export const deleteWorkoutLogExerciseChangeRequestTool = tool({
  description:
    'Remove an exercise proposal from the changeset buffer. Only works for proposals (temp-IDs), not saved workout data. To undo saved data, use updateWorkoutLogSetChangeRequest with completed: false.',
  inputSchema: deleteWorkoutLogExerciseChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for deleteWorkoutLogSetChangeRequest.
 * Removes a set proposal from the changeset buffer.
 *
 * IMPORTANT: Only temp-ID proposals can be deleted (e.g., "temp-550e8400-...").
 * Attempts to delete real workout data (numeric IDs) will be rejected.
 * Athletes should use updateWorkoutLogSetChangeRequest with completed: false instead.
 */
export const deleteWorkoutLogSetChangeRequestSchema = z.object({
  workoutLogSetId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe(
      'Direct ID of the set to remove. Only temp-IDs can be deleted. Real workout data cannot be deleted - mark as skipped instead.'
    ),
  workoutLogExerciseId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe(
      'Parent exercise ID. Required when using setIndex to identify the set.'
    ),
  setIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Which set to remove (1-based). Used with workoutLogExerciseId.'),
  reasoning: z.string().describe('Why this set proposal is being removed'),
})

export type DeleteWorkoutLogSetInput = z.infer<typeof deleteWorkoutLogSetChangeRequestSchema>

export const deleteWorkoutLogSetChangeRequestTool = tool({
  description:
    'Remove a set proposal from the changeset buffer. Only works for proposals (temp-IDs), not saved workout data. To undo saved data, use updateWorkoutLogSetChangeRequest with completed: false.',
  inputSchema: deleteWorkoutLogSetChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Export All Athlete Proposal Tools - T005
// ============================================================================

/**
 * All proposal tools for the Athlete domain.
 *
 * Uses WorkoutLog prefix to align with database entity names:
 * - workout_logs → WorkoutLog*
 * - workout_log_exercises → WorkoutLogExercise*
 * - workout_log_sets → WorkoutLogSet*
 *
 * Delete tools allow removing proposals from the buffer (temp-IDs only).
 * Real workout data cannot be deleted - athletes should mark sets as skipped instead.
 */
export const athleteProposalTools = {
  // Set tools (workout_log_set)
  createWorkoutLogSetChangeRequest: createWorkoutLogSetChangeRequestTool,
  updateWorkoutLogSetChangeRequest: updateWorkoutLogSetChangeRequestTool,
  deleteWorkoutLogSetChangeRequest: deleteWorkoutLogSetChangeRequestTool,

  // Exercise tools (workout_log_exercise)
  createWorkoutLogExerciseChangeRequest: createWorkoutLogExerciseChangeRequestTool,
  updateWorkoutLogExerciseChangeRequest: updateWorkoutLogExerciseChangeRequestTool,
  deleteWorkoutLogExerciseChangeRequest: deleteWorkoutLogExerciseChangeRequestTool,

  // Session tools (workout_log)
  updateWorkoutLogChangeRequest: updateWorkoutLogChangeRequestTool,
}

/**
 * Type-safe tool names for athlete proposal tools.
 */
export type AthleteProposalToolName = keyof typeof athleteProposalTools

/**
 * List of athlete proposal tool names.
 */
export const athleteProposalToolNames = Object.keys(athleteProposalTools) as Array<
  keyof typeof athleteProposalTools
>
