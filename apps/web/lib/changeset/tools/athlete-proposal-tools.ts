/**
 * ChangeSet Pattern: Athlete Domain Proposal Tools
 *
 * Tools that create ChangeRequests for workout modifications.
 * Athletes can log set performance, swap exercises, and add session notes.
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
 * Schema for createTrainingSetChangeRequest.
 * Logs the athlete's actual performance for a set.
 */
export const createTrainingSetChangeRequestSchema = z.object({
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
    .describe('Distance in meters (for cardio exercises)'),
  performingTime: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Duration in seconds (for timed exercises)'),
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
})

export type CreateTrainingSetInput = z.infer<typeof createTrainingSetChangeRequestSchema>

export const createTrainingSetChangeRequestTool = tool({
  description:
    "Log or ADD a set for an exercise. Use this to: (1) Log actual performance for a set, (2) ADD additional sets to an exercise by using the next setIndex. For example, if an exercise has 3 sets, add a 4th by using setIndex: 4. Requires workoutLogExerciseId from getWorkoutContext.",
  inputSchema: createTrainingSetChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for updateTrainingSetChangeRequest.
 * Updates performance data that was already logged.
 */
export const updateTrainingSetChangeRequestSchema = z.object({
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
    .transform(emptyNumToUndefined),
  performingTime: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined),
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

export type UpdateTrainingSetInput = z.infer<typeof updateTrainingSetChangeRequestSchema>

export const updateTrainingSetChangeRequestTool = tool({
  description:
    'Update performance data that was already logged. Use this when the athlete wants to correct a mistake.',
  inputSchema: updateTrainingSetChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Exercise Tools (workout_log_exercise) - T003, T019
// ============================================================================

/**
 * Schema for createTrainingExerciseChangeRequest.
 * Adds a new exercise to the workout.
 */
export const createTrainingExerciseChangeRequestSchema = z.object({
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

export type CreateTrainingExerciseInput = z.infer<typeof createTrainingExerciseChangeRequestSchema>

export const createTrainingExerciseChangeRequestTool = tool({
  description:
    'Add a COMPLETELY NEW exercise to the workout (not in the original plan). Do NOT use this to add sets - use createTrainingSetChangeRequest instead to add sets to an existing exercise.',
  inputSchema: createTrainingExerciseChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for updateTrainingExerciseChangeRequest.
 * Updates an exercise in the workout (swap, reorder, notes).
 * To swap an exercise, provide a new exerciseId and exerciseName.
 */
export const updateTrainingExerciseChangeRequestSchema = z.object({
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

export type UpdateTrainingExerciseInput = z.infer<typeof updateTrainingExerciseChangeRequestSchema>

export const updateTrainingExerciseChangeRequestTool = tool({
  description:
    'Update an exercise in the workout. To swap exercises, provide a new exerciseId. To reorder, provide exerciseOrder.',
  inputSchema: updateTrainingExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Session Tools (workout_log) - T004
// ============================================================================

/**
 * Schema for updateTrainingSessionChangeRequest.
 * Updates the athlete's workout session notes.
 * Athletes cannot change session status or other properties.
 */
export const updateTrainingSessionChangeRequestSchema = z.object({
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

export type UpdateTrainingSessionInput = z.infer<typeof updateTrainingSessionChangeRequestSchema>

export const updateTrainingSessionChangeRequestTool = tool({
  description:
    "Update the athlete's workout session notes. Use this to capture feedback about the session.",
  inputSchema: updateTrainingSessionChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Export All Athlete Proposal Tools - T005
// ============================================================================

/**
 * All proposal tools for the Athlete domain.
 *
 * Note: No delete tools - athletes swap exercises or mark sets as skipped.
 */
export const athleteProposalTools = {
  // Set tools
  createTrainingSetChangeRequest: createTrainingSetChangeRequestTool,
  updateTrainingSetChangeRequest: updateTrainingSetChangeRequestTool,

  // Exercise tools
  createTrainingExerciseChangeRequest: createTrainingExerciseChangeRequestTool,
  updateTrainingExerciseChangeRequest: updateTrainingExerciseChangeRequestTool,

  // Session tools
  updateTrainingSessionChangeRequest: updateTrainingSessionChangeRequestTool,
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
