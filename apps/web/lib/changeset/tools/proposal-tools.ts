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

// ============================================================================
// Session Tools (preset_session)
// ============================================================================

/**
 * Schema for createSessionChangeRequest.
 * Creates a new session template.
 */
export const createSessionChangeRequestSchema = z.object({
  name: z.string().describe("Name for the session (e.g., 'Upper Body A')"),
  description: z.string().optional().describe('Description or notes'),
  microcycleId: z.string().optional().describe('Parent microcycle (week) ID'),
  reasoning: z.string().describe('Why this session is being created'),
})

export type CreateSessionInput = z.infer<typeof createSessionChangeRequestSchema>

export const createSessionChangeRequestTool = tool({
  description: 'Create a new session template for a training plan.',
  inputSchema: createSessionChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for updateSessionChangeRequest.
 * Updates session-level properties.
 */
export const updateSessionChangeRequestSchema = z.object({
  presetGroupId: z.string().describe('ID of the session to update'),
  name: z.string().optional(),
  description: z.string().optional(),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateSessionInput = z.infer<typeof updateSessionChangeRequestSchema>

export const updateSessionChangeRequestTool = tool({
  description: "Update a session template's name, description, or notes.",
  inputSchema: updateSessionChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Exercise Tools (preset_exercise)
// ============================================================================

/**
 * Schema for createExerciseChangeRequest.
 * Adds an exercise to the session.
 */
export const createExerciseChangeRequestSchema = z.object({
  exerciseId: z.string().describe('ID from exercise library'),
  exerciseName: z.string().describe('Name for display'),
  presetOrder: z
    .number()
    .int()
    .optional()
    .describe('Position in session (0-based)'),
  insertAfterExerciseId: z
    .string()
    .optional()
    .describe('Insert after this exercise. Omit for end.'),
  supersetId: z
    .string()
    .optional()
    .describe('Superset group ID if joining a superset'),
  notes: z.string().optional(),
  reasoning: z.string().describe('Why this exercise is being added'),
})

export type CreateExerciseInput = z.infer<typeof createExerciseChangeRequestSchema>

export const createExerciseChangeRequestTool = tool({
  description: 'Add a new exercise to the session template.',
  inputSchema: createExerciseChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for updateExerciseChangeRequest.
 * Updates exercise settings. Also used for swapping exercises by providing a new exerciseId.
 */
export const updateExerciseChangeRequestSchema = z.object({
  presetExerciseId: z.string().describe('ID of the exercise preset to update'),
  exerciseId: z
    .string()
    .optional()
    .describe('New exercise ID from library (for swapping)'),
  exerciseName: z
    .string()
    .optional()
    .describe('New exercise name (required when swapping)'),
  presetOrder: z.number().int().optional(),
  supersetId: z.string().optional(),
  notes: z.string().optional(),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateExerciseInput = z.infer<typeof updateExerciseChangeRequestSchema>

export const updateExerciseChangeRequestTool = tool({
  description:
    "Update an exercise's settings in the session template. To swap exercises, provide a new exerciseId.",
  inputSchema: updateExerciseChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for deleteExerciseChangeRequest.
 * Removes an exercise from the session.
 */
export const deleteExerciseChangeRequestSchema = z.object({
  presetExerciseId: z.string().describe('ID of the exercise to remove'),
  reasoning: z.string().describe('Why this exercise is being removed'),
})

export type DeleteExerciseInput = z.infer<typeof deleteExerciseChangeRequestSchema>

export const deleteExerciseChangeRequestTool = tool({
  description: 'Remove an exercise from the session template.',
  inputSchema: deleteExerciseChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Set Tools (preset_set)
// ============================================================================

/**
 * Schema for createSetChangeRequest.
 * Adds sets to an exercise.
 */
export const createSetChangeRequestSchema = z.object({
  presetExerciseId: z.string().describe('Parent exercise ID'),
  setCount: z.number().int().min(1).default(1).describe('Number of sets to add'),
  reps: z.number().int().optional(),
  weight: z.number().optional().describe('Weight in kg'),
  distance: z.number().optional().describe('Distance in meters'),
  performingTime: z.number().int().optional().describe('Duration in seconds'),
  restTime: z.number().int().optional().describe('Rest in seconds'),
  rpe: z.number().int().min(1).max(10).optional(),
  tempo: z.string().optional().describe("Tempo string (e.g., '3-0-2-0')"),
  reasoning: z.string().describe('Why these sets are being added'),
})

export type CreateSetInput = z.infer<typeof createSetChangeRequestSchema>

export const createSetChangeRequestTool = tool({
  description: 'Add one or more sets to an exercise in the template.',
  inputSchema: createSetChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for updateSetChangeRequest.
 * Updates set parameters.
 */
export const updateSetChangeRequestSchema = z.object({
  presetExerciseId: z.string().describe('Parent exercise ID'),
  setIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Which set (1-based). Omit for all sets.'),
  applyToAllSets: z
    .boolean()
    .optional()
    .describe('Apply to all sets of this exercise'),
  reps: z.number().int().optional(),
  weight: z.number().optional(),
  distance: z.number().optional(),
  performingTime: z.number().int().optional(),
  restTime: z.number().int().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  tempo: z.string().optional(),
  reasoning: z.string().describe('Why this change is being made'),
})

export type UpdateSetInput = z.infer<typeof updateSetChangeRequestSchema>

export const updateSetChangeRequestTool = tool({
  description:
    'Update parameters for a specific set or all sets of an exercise.',
  inputSchema: updateSetChangeRequestSchema,
  // No execute - handled client-side
})

/**
 * Schema for deleteSetChangeRequest.
 * Removes sets from an exercise.
 */
export const deleteSetChangeRequestSchema = z.object({
  presetExerciseId: z.string().describe('Parent exercise ID'),
  setIndex: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Which set to remove (1-based). Omit to remove last set.'),
  removeCount: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Number of sets to remove from end'),
  reasoning: z.string().describe('Why these sets are being removed'),
})

export type DeleteSetInput = z.infer<typeof deleteSetChangeRequestSchema>

export const deleteSetChangeRequestTool = tool({
  description: 'Remove sets from an exercise in the template.',
  inputSchema: deleteSetChangeRequestSchema,
  // No execute - handled client-side
})

// ============================================================================
// Export All Proposal Tools
// ============================================================================

/**
 * All proposal tools for the Coach domain (V1).
 */
export const proposalTools = {
  // Session tools
  createSessionChangeRequest: createSessionChangeRequestTool,
  updateSessionChangeRequest: updateSessionChangeRequestTool,
  // Note: No deleteSessionChangeRequest - too destructive for AI

  // Exercise tools
  createExerciseChangeRequest: createExerciseChangeRequestTool,
  updateExerciseChangeRequest: updateExerciseChangeRequestTool,
  deleteExerciseChangeRequest: deleteExerciseChangeRequestTool,

  // Set tools
  createSetChangeRequest: createSetChangeRequestTool,
  updateSetChangeRequest: updateSetChangeRequestTool,
  deleteSetChangeRequest: deleteSetChangeRequestTool,
}

/**
 * Type-safe tool names for proposal tools.
 */
export type ProposalToolName = keyof typeof proposalTools
