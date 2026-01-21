/**
 * ChangeSet Pattern: Read Tool Schemas
 *
 * Read-only tools that provide context to the AI.
 * These do NOT modify the changeset buffer.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-tool-definitions.md
 */

import { z } from 'zod'
import { tool } from 'ai'

/**
 * Schema for getSessionContext tool parameters.
 *
 * Gets the current session structure for AI understanding.
 * Use before proposing changes to understand what exists.
 */
export const getSessionContextSchema = z.object({
  sessionId: z
    .string()
    .describe('ID of the session (preset_group or training_session)'),
  includeHistory: z
    .boolean()
    .default(false)
    .describe('Include previous performance data (athlete only)'),
})

export type GetSessionContextInput = z.infer<typeof getSessionContextSchema>

/**
 * Vercel AI SDK tool definition for getSessionContext.
 */
export const getSessionContextTool = tool({
  description:
    'Get the current session with all exercises and sets. Use before proposing changes.',
  inputSchema: getSessionContextSchema,
  // No execute - handled client-side
})

/**
 * Schema for searchExercises tool parameters.
 *
 * Searches the exercise library for matching exercises.
 * Read-only - does not add to changeset.
 */
export const searchExercisesSchema = z.object({
  query: z.string().describe('Natural language search query (e.g., "squat", "chest press")'),
  equipment: z
    .array(z.string())
    .optional()
    .describe('Filter by required equipment (e.g., ["barbell", "dumbbell"])'),
  excludeEquipment: z
    .array(z.string())
    .optional()
    .describe('Exclude exercises requiring this equipment (e.g., ["cable machine"])'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe('Maximum number of results'),
})

export type SearchExercisesInput = z.infer<typeof searchExercisesSchema>

/**
 * Vercel AI SDK tool definition for searchExercises.
 */
export const searchExercisesTool = tool({
  description:
    'Search the exercise library. Returns matches but does not add to changeset.',
  inputSchema: searchExercisesSchema,
  // No execute - handled client-side
})

/**
 * All read tools for the Coach domain (V1).
 */
export const readTools = {
  getSessionContext: getSessionContextTool,
  searchExercises: searchExercisesTool,
}

/**
 * Type-safe tool names for read tools.
 */
export type ReadToolName = keyof typeof readTools

// ============================================================================
// Athlete Read Tools
// ============================================================================

/**
 * Schema for getWorkoutContext tool parameters.
 *
 * Gets the current workout session with prescribed and actual data.
 * Use before proposing changes to understand the athlete's workout.
 */
export const getWorkoutContextSchema = z.object({
  workoutLogId: z
    .string()
    .describe('ID of the workout log to retrieve'),
  includeHistory: z
    .boolean()
    .default(false)
    .describe('Include previous performance data for comparison'),
})

export type GetWorkoutContextInput = z.infer<typeof getWorkoutContextSchema>

/**
 * Vercel AI SDK tool definition for getWorkoutContext.
 */
export const getWorkoutContextTool = tool({
  description:
    'Get the current workout session with all exercises and sets, including prescribed values and actual performance. Use before proposing changes.',
  inputSchema: getWorkoutContextSchema,
  // No execute - handled client-side
})

/**
 * All read tools for the Athlete domain (workout logging).
 *
 * Key differences from coach domain:
 * - Uses getWorkoutContext instead of getSessionContext
 * - Provides both prescribed and actual performance data
 */
export const athleteReadTools = {
  getWorkoutContext: getWorkoutContextTool,
  searchExercises: searchExercisesTool,
}

/**
 * Type-safe tool names for athlete read tools.
 */
export type AthleteReadToolName = keyof typeof athleteReadTools
