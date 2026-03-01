/**
 * ChangeSet Pattern: Proposal Tool Schemas
 *
 * Tools that create ChangeRequests in the buffer.
 * V1 Scope: Coach domain (Training Plans) only.
 *
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
// Session Tools (preset_session)
// ============================================================================

/**
 * Schema for createSessionChangeRequest.
 * Creates a new session template.
 */
export const createSessionChangeRequestSchema = z.object({
  name: z.string().describe("Name for the session (e.g., 'Upper Body A')"),
  description: z.string().optional().transform(emptyToUndefined).describe('Description or notes'),
  microcycleId: z.string().optional().transform(emptyToUndefined).describe('Parent microcycle (week) ID'),
  reasoning: z.string().describe('Why this session is being created'),
})

export type CreateSessionInput = z.infer<typeof createSessionChangeRequestSchema>

export const createSessionPlanChangeRequestTool = tool({
  description: 'Create a new session template for a training plan.',
  inputSchema: createSessionChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const createSessionChangeRequestTool = createSessionPlanChangeRequestTool

/**
 * Schema for updateSessionChangeRequest.
 * Updates session-level properties.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const updateSessionChangeRequestSchema = z.object({
  sessionPlanId: z.string().describe('ID of the session to update'),
  name: z.string().optional().transform(emptyToUndefined),
  description: z.string().optional().transform(emptyToUndefined),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateSessionInput = z.infer<typeof updateSessionChangeRequestSchema>

export const updateSessionPlanChangeRequestTool = tool({
  description: "Update a session template's name, description, or notes.",
  inputSchema: updateSessionChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateSessionChangeRequestTool = updateSessionPlanChangeRequestTool

// ============================================================================
// Exercise Tools (preset_exercise)
// ============================================================================

/**
 * Schema for createExerciseChangeRequest.
 * Adds an exercise to the session.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const createExerciseChangeRequestSchema = z.object({
  exerciseId: z.string().describe('ID from exercise library'),
  exerciseName: z.string().describe('Name for display'),
  exerciseOrder: z
    .number()
    .int()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Position in session (0-based)'),
  insertAfterExerciseId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Insert after this exercise. Omit for end.'),
  supersetId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Superset group ID if joining a superset'),
  notes: z.string().optional().transform(emptyToUndefined),
  reasoning: z.string().describe('Why this exercise is being added'),
})

export type CreateExerciseInput = z.infer<typeof createExerciseChangeRequestSchema>

export const createSessionPlanExerciseChangeRequestTool = tool({
  description: 'Add a new exercise to the session template.',
  inputSchema: createExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const createExerciseChangeRequestTool = createSessionPlanExerciseChangeRequestTool

/**
 * Schema for updateExerciseChangeRequest.
 * Updates exercise settings. Also used for swapping exercises by providing a new exerciseId.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const updateExerciseChangeRequestSchema = z.object({
  sessionPlanExerciseId: z.string().describe('ID of the session plan exercise to update'),
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
  exerciseOrder: z.number().int().optional().transform(emptyNumToUndefined),
  supersetId: z.string().optional().transform(emptyToUndefined),
  notes: z.string().optional().transform(emptyToUndefined),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateExerciseInput = z.infer<typeof updateExerciseChangeRequestSchema>

export const updateSessionPlanExerciseChangeRequestTool = tool({
  description:
    "Update an exercise's settings in the session template. To swap exercises, provide a new exerciseId.",
  inputSchema: updateExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateExerciseChangeRequestTool = updateSessionPlanExerciseChangeRequestTool

/**
 * Schema for deleteExerciseChangeRequest.
 * Removes an exercise from the session.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const deleteExerciseChangeRequestSchema = z.object({
  sessionPlanExerciseId: z.string().describe('ID of the exercise to remove'),
  reasoning: z.string().describe('Why this exercise is being removed'),
})

export type DeleteExerciseInput = z.infer<typeof deleteExerciseChangeRequestSchema>

export const deleteSessionPlanExerciseChangeRequestTool = tool({
  description: 'Remove an exercise from the session template.',
  inputSchema: deleteExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const deleteExerciseChangeRequestTool = deleteSessionPlanExerciseChangeRequestTool

// ============================================================================
// Set Tools (preset_set)
// ============================================================================

/**
 * Schema for createSetChangeRequest.
 * Adds sets to an exercise.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const createSetChangeRequestSchema = z.object({
  sessionPlanExerciseId: z
    .string()
    .describe(
      'Parent exercise ID. For NEW exercises created in this changeset, use the entityId returned from createExerciseChangeRequest (e.g., "temp-550e8400-..."). For EXISTING exercises, use their id from the session data.'
    ),
  setCount: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Number of sets to add. Each set will have the same parameters.'),
  reps: z.number().int().optional().transform(emptyNumToUndefined).describe('Repetitions per set'),
  weight: z.number().optional().transform(emptyNumToUndefined).describe('Weight in kg'),
  distance: z.number().optional().transform(emptyNumToUndefined).describe('Distance in meters (for sprints, cardio, throws, jumps)'),
  performingTime: z
    .number()
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Time in seconds with decimals (e.g., 7.23 for a 60m sprint split, 45 for a timed hold)'),
  restTime: z.number().int().optional().transform(emptyNumToUndefined).describe('Rest between sets in seconds'),
  rpe: z.number().int().min(1).max(10).optional().transform(emptyNumToUndefined).describe('Rate of Perceived Exertion (1-10)'),
  tempo: z.string().optional().transform(emptyToUndefined).describe("Tempo string format: 'eccentric-pause-concentric-pause' (e.g., '3-0-2-0')"),
  reasoning: z.string().describe('Why these sets are being added'),
})

export type CreateSetInput = z.infer<typeof createSetChangeRequestSchema>

export const createSessionPlanSetChangeRequestTool = tool({
  description:
    'Add one or more sets to an exercise in the template. Use setCount to add multiple sets with the same parameters. For newly created exercises, use the entityId returned from createSessionPlanExerciseChangeRequest.',
  inputSchema: createSetChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const createSetChangeRequestTool = createSessionPlanSetChangeRequestTool

/**
 * Schema for updateSetChangeRequest.
 * Updates set parameters.
 *
 * Sets can be identified either by:
 * 1. sessionPlanSetId (direct set ID) - preferred for existing sets
 * 2. sessionPlanExerciseId + setIndex (composite) - for sets in newly created exercises
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const updateSetChangeRequestSchema = z.object({
  sessionPlanSetId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Direct ID of the set to update. Preferred for existing sets.'),
  sessionPlanExerciseId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe(
      'Parent exercise ID. Required when using setIndex to identify the set. For NEW exercises, use the entityId from createExerciseChangeRequest.'
    ),
  setIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .transform(emptyNumToUndefined)
    .describe('Which set to update (1-based). Used with sessionPlanExerciseId. Omit to update all sets.'),
  applyToAllSets: z
    .boolean()
    .optional()
    .describe('Set to true to apply changes to ALL sets of this exercise'),
  reps: z.number().int().optional().transform(emptyNumToUndefined).describe('New repetitions value'),
  weight: z.number().optional().transform(emptyNumToUndefined).describe('New weight in kg'),
  distance: z.number().optional().transform(emptyNumToUndefined).describe('New distance in meters'),
  performingTime: z.number().optional().transform(emptyNumToUndefined).describe('New time in seconds with decimals (e.g., 7.23 for a sprint split)'),
  restTime: z.number().int().optional().transform(emptyNumToUndefined).describe('New rest time in seconds'),
  rpe: z.number().int().min(1).max(10).optional().transform(emptyNumToUndefined).describe('New RPE (1-10)'),
  tempo: z.string().optional().transform(emptyToUndefined).describe('New tempo string'),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateSetInput = z.infer<typeof updateSetChangeRequestSchema>

export const updateSessionPlanSetChangeRequestTool = tool({
  description:
    'Update parameters for a specific set or all sets of an exercise. Use setIndex for a specific set, or applyToAllSets=true for all sets.',
  inputSchema: updateSetChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const updateSetChangeRequestTool = updateSessionPlanSetChangeRequestTool

/**
 * Schema for deleteSetChangeRequest.
 * Removes sets from an exercise.
 *
 * Sets can be identified either by:
 * 1. sessionPlanSetId (direct set ID) - preferred for existing sets
 * 2. sessionPlanExerciseId + setIndex (composite) - for sets in newly created exercises
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const deleteSetChangeRequestSchema = z.object({
  sessionPlanSetId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe('Direct ID of the set to delete. Preferred for existing sets.'),
  sessionPlanExerciseId: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .describe(
      'Parent exercise ID. Required when using setIndex to identify the set. For NEW exercises, use the entityId from createExerciseChangeRequest.'
    ),
  setIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Which set to remove (1-based). Omit to remove from the end.'),
  removeCount: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Number of sets to remove from end (when setIndex is omitted)'),
  reasoning: z.string().describe('Why these sets are being removed'),
})

export type DeleteSetInput = z.infer<typeof deleteSetChangeRequestSchema>

export const deleteSessionPlanSetChangeRequestTool = tool({
  description: 'Remove sets from an exercise in the template. Use setIndex to remove a specific set, or removeCount to remove from the end.',
  inputSchema: deleteSetChangeRequestSchema,
  // No execute - handled client-side
})

// DEPRECATED: Legacy alias for backwards compatibility
export const deleteSetChangeRequestTool = deleteSessionPlanSetChangeRequestTool

// ============================================================================
// Export All Proposal Tools
// ============================================================================

/**
 * All proposal tools for the Coach domain (V1).
 *
 * Uses SessionPlan prefix to align with database entity names:
 * - session_plans → SessionPlan*
 * - session_plan_exercises → SessionPlanExercise*
 * - session_plan_sets → SessionPlanSet*
 */
export const proposalTools = {
  // Session tools (session_plan)
  createSessionPlanChangeRequest: createSessionPlanChangeRequestTool,
  updateSessionPlanChangeRequest: updateSessionPlanChangeRequestTool,
  // Note: No deleteSessionPlanChangeRequest - too destructive for AI

  // Exercise tools (session_plan_exercise)
  createSessionPlanExerciseChangeRequest: createSessionPlanExerciseChangeRequestTool,
  updateSessionPlanExerciseChangeRequest: updateSessionPlanExerciseChangeRequestTool,
  deleteSessionPlanExerciseChangeRequest: deleteSessionPlanExerciseChangeRequestTool,

  // Set tools (session_plan_set)
  createSessionPlanSetChangeRequest: createSessionPlanSetChangeRequestTool,
  updateSessionPlanSetChangeRequest: updateSessionPlanSetChangeRequestTool,
  deleteSessionPlanSetChangeRequest: deleteSessionPlanSetChangeRequestTool,
}

/**
 * Type-safe tool names for proposal tools.
 */
export type ProposalToolName = keyof typeof proposalTools
