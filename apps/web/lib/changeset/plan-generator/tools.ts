/**
 * Plan Generator: Tool Schemas
 *
 * Defines all 17 tools for AI-powered plan generation:
 * - 3 Read tools (context, search, current state)
 * - 12 Proposal tools (CRUD for 4 entity types)
 * - 2 Coordination tools (confirm, reset)
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { tool } from 'ai'
import { z } from 'zod'

// ============================================================================
// Read Tools (3 tools)
// ============================================================================

/**
 * Schema for getPlanGenerationContext tool.
 * Returns user profile and preferences from wizard.
 */
export const getPlanGenerationContextSchema = z.object({})

export type GetPlanGenerationContextInput = z.infer<typeof getPlanGenerationContextSchema>

export const getPlanGenerationContextTool = tool({
  description:
    'Get user profile and preferences for plan generation. Call this first to understand the user context before creating a plan.',
  inputSchema: getPlanGenerationContextSchema,
})

/**
 * Schema for searchExercisesForPlan tool.
 * Searches exercise library with equipment filtering.
 */
export const searchExercisesForPlanSchema = z.object({
  query: z.string().describe('Natural language search query (e.g., "chest press", "squat variation")'),
  equipment: z
    .array(z.string())
    .optional()
    .describe('Filter by available equipment (e.g., ["barbell", "dumbbell"])'),
  exclude_equipment: z
    .array(z.string())
    .optional()
    .describe('Exclude exercises requiring this equipment (e.g., ["cable machine"])'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of results (default: 10)'),
})

export type SearchExercisesForPlanInput = z.infer<typeof searchExercisesForPlanSchema>

export const searchExercisesForPlanTool = tool({
  description:
    'Search the exercise library for exercises matching criteria. Returns contraindication tags when available.',
  inputSchema: searchExercisesForPlanSchema,
})

/**
 * Schema for getCurrentPlanState tool.
 * Returns the merged view of current plan state.
 */
export const getCurrentPlanStateSchema = z.object({})

export type GetCurrentPlanStateInput = z.infer<typeof getCurrentPlanStateSchema>

export const getCurrentPlanStateTool = tool({
  description:
    'Get the current state of the plan being built, including all microcycles, sessions, exercises, and sets. Use to review what has been created so far.',
  inputSchema: getCurrentPlanStateSchema,
})

// ============================================================================
// Microcycle Tools (create, update, delete)
// ============================================================================

/**
 * Schema for createMicrocycleChangeRequest tool.
 */
export const createMicrocycleSchema = z.object({
  mesocycle_id: z.string().describe('ID of the parent mesocycle'),
  week_number: z.number().int().min(1).describe('Week number within the mesocycle (1-based)'),
  name: z.string().describe('Display name for this week (e.g., "Week 1 - Foundation")'),
  focus: z.string().optional().describe('Training focus for this week (e.g., "Hypertrophy", "Strength")'),
  is_deload: z.boolean().default(false).describe('Whether this is a deload/recovery week'),
  reasoning: z.string().optional().describe('AI reasoning for this microcycle'),
})

export type CreateMicrocycleInput = z.infer<typeof createMicrocycleSchema>

export const createMicrocycleTool = tool({
  description:
    'Create a new microcycle (training week). Must create Week 1 first before any other weeks.',
  inputSchema: createMicrocycleSchema,
})

/**
 * Schema for updateMicrocycleChangeRequest tool.
 */
export const updateMicrocycleSchema = z.object({
  entity_id: z.string().describe('ID of the microcycle to update'),
  name: z.string().optional().describe('Updated display name'),
  focus: z.string().optional().describe('Updated training focus'),
  is_deload: z.boolean().optional().describe('Updated deload flag'),
  reasoning: z.string().optional().describe('AI reasoning for this update'),
})

export type UpdateMicrocycleInput = z.infer<typeof updateMicrocycleSchema>

export const updateMicrocycleTool = tool({
  description: 'Update an existing microcycle (training week).',
  inputSchema: updateMicrocycleSchema,
})

/**
 * Schema for deleteMicrocycleChangeRequest tool.
 */
export const deleteMicrocycleSchema = z.object({
  entity_id: z.string().describe('ID of the microcycle to delete'),
  reasoning: z.string().optional().describe('AI reasoning for this deletion'),
})

export type DeleteMicrocycleInput = z.infer<typeof deleteMicrocycleSchema>

export const deleteMicrocycleTool = tool({
  description: 'Delete a microcycle and all its sessions, exercises, and sets.',
  inputSchema: deleteMicrocycleSchema,
})

// ============================================================================
// Session Plan Tools (create, update, delete)
// ============================================================================

/**
 * Schema for createSessionPlanChangeRequest tool.
 */
export const createSessionPlanSchema = z.object({
  microcycle_id: z.string().describe('ID of the parent microcycle'),
  name: z.string().describe('Session name (e.g., "Upper Body A", "Leg Day")'),
  day_of_week: z
    .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .describe('Day of the week for this session'),
  session_type: z
    .enum(['strength', 'hypertrophy', 'power', 'endurance', 'mobility', 'recovery', 'speed'])
    .describe('Type of training session'),
  estimated_duration: z.number().int().min(15).max(180).describe('Estimated duration in minutes'),
  notes: z.string().optional().describe('Session notes or instructions'),
  reasoning: z.string().optional().describe('AI reasoning for this session'),
})

export type CreateSessionPlanInput = z.infer<typeof createSessionPlanSchema>

export const createSessionPlanTool = tool({
  description: 'Create a new training session within a microcycle.',
  inputSchema: createSessionPlanSchema,
})

/**
 * Schema for updateSessionPlanChangeRequest tool.
 */
export const updateSessionPlanSchema = z.object({
  entity_id: z.string().describe('ID of the session plan to update'),
  name: z.string().optional().describe('Updated session name'),
  day_of_week: z
    .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .optional()
    .describe('Updated day of the week'),
  session_type: z
    .enum(['strength', 'hypertrophy', 'power', 'endurance', 'mobility', 'recovery', 'speed'])
    .optional()
    .describe('Updated session type'),
  estimated_duration: z.number().int().min(15).max(180).optional().describe('Updated duration'),
  notes: z.string().optional().describe('Updated notes'),
  reasoning: z.string().optional().describe('AI reasoning for this update'),
})

export type UpdateSessionPlanInput = z.infer<typeof updateSessionPlanSchema>

export const updateSessionPlanTool = tool({
  description: 'Update an existing training session.',
  inputSchema: updateSessionPlanSchema,
})

/**
 * Schema for deleteSessionPlanChangeRequest tool.
 */
export const deleteSessionPlanSchema = z.object({
  entity_id: z.string().describe('ID of the session plan to delete'),
  reasoning: z.string().optional().describe('AI reasoning for this deletion'),
})

export type DeleteSessionPlanInput = z.infer<typeof deleteSessionPlanSchema>

export const deleteSessionPlanTool = tool({
  description: 'Delete a session plan and all its exercises and sets.',
  inputSchema: deleteSessionPlanSchema,
})

// ============================================================================
// Session Plan Exercise Tools (create, update, delete)
// ============================================================================

/**
 * Schema for createSessionPlanExerciseChangeRequest tool.
 */
export const createSessionPlanExerciseSchema = z.object({
  session_plan_id: z.string().describe('ID of the parent session plan'),
  exercise_id: z.string().describe('ID of the exercise from the library'),
  exercise_name: z.string().describe('Name of the exercise (for display)'),
  exercise_order: z.number().int().min(1).describe('Order in the session (1-based)'),
  superset_group: z
    .string()
    .optional()
    .describe('Superset group identifier (e.g., "A", "B") - exercises with same group are supersets'),
  notes: z.string().optional().describe('Exercise-specific notes or cues'),
  reasoning: z.string().optional().describe('AI reasoning for this exercise selection'),
})

export type CreateSessionPlanExerciseInput = z.infer<typeof createSessionPlanExerciseSchema>

export const createSessionPlanExerciseTool = tool({
  description: 'Add an exercise to a session plan. Use searchExercisesForPlan first to find valid exercise IDs.',
  inputSchema: createSessionPlanExerciseSchema,
})

/**
 * Schema for updateSessionPlanExerciseChangeRequest tool.
 */
export const updateSessionPlanExerciseSchema = z.object({
  entity_id: z.string().describe('ID of the session plan exercise to update'),
  exercise_id: z.string().optional().describe('Updated exercise ID'),
  exercise_name: z.string().optional().describe('Updated exercise name'),
  exercise_order: z.number().int().min(1).optional().describe('Updated order'),
  superset_group: z.string().optional().describe('Updated superset group'),
  notes: z.string().optional().describe('Updated notes'),
  reasoning: z.string().optional().describe('AI reasoning for this update'),
})

export type UpdateSessionPlanExerciseInput = z.infer<typeof updateSessionPlanExerciseSchema>

export const updateSessionPlanExerciseTool = tool({
  description: 'Update an exercise in a session plan.',
  inputSchema: updateSessionPlanExerciseSchema,
})

/**
 * Schema for deleteSessionPlanExerciseChangeRequest tool.
 */
export const deleteSessionPlanExerciseSchema = z.object({
  entity_id: z.string().describe('ID of the session plan exercise to delete'),
  reasoning: z.string().optional().describe('AI reasoning for this deletion'),
})

export type DeleteSessionPlanExerciseInput = z.infer<typeof deleteSessionPlanExerciseSchema>

export const deleteSessionPlanExerciseTool = tool({
  description: 'Remove an exercise from a session plan. Also removes all its sets.',
  inputSchema: deleteSessionPlanExerciseSchema,
})

// ============================================================================
// Session Plan Set Tools (create, update, delete)
// ============================================================================

/**
 * Schema for createSessionPlanSetChangeRequest tool.
 */
export const createSessionPlanSetSchema = z.object({
  session_plan_exercise_id: z.string().describe('ID of the parent session plan exercise'),
  set_number: z.number().int().min(1).describe('Set number (1-based)'),
  reps: z.number().int().min(1).optional().describe('Target repetitions'),
  rpe: z.number().min(1).max(10).optional().describe('Target RPE (1-10 scale)'),
  rest_seconds: z.number().int().min(0).optional().describe('Rest time in seconds after this set'),
  tempo: z.string().optional().describe('Tempo notation (e.g., "3-1-2-0" for eccentric-pause-concentric-pause)'),
  notes: z.string().optional().describe('Set-specific notes'),
  reasoning: z.string().optional().describe('AI reasoning for this set prescription'),
})

export type CreateSessionPlanSetInput = z.infer<typeof createSessionPlanSetSchema>

export const createSessionPlanSetTool = tool({
  description: 'Add a set to an exercise in the session plan.',
  inputSchema: createSessionPlanSetSchema,
})

/**
 * Schema for updateSessionPlanSetChangeRequest tool.
 */
export const updateSessionPlanSetSchema = z.object({
  entity_id: z.string().describe('ID of the session plan set to update'),
  set_number: z.number().int().min(1).optional().describe('Updated set number'),
  reps: z.number().int().min(1).optional().describe('Updated target reps'),
  rpe: z.number().min(1).max(10).optional().describe('Updated target RPE'),
  rest_seconds: z.number().int().min(0).optional().describe('Updated rest time'),
  tempo: z.string().optional().describe('Updated tempo'),
  notes: z.string().optional().describe('Updated notes'),
  reasoning: z.string().optional().describe('AI reasoning for this update'),
})

export type UpdateSessionPlanSetInput = z.infer<typeof updateSessionPlanSetSchema>

export const updateSessionPlanSetTool = tool({
  description: 'Update a set in a session plan exercise.',
  inputSchema: updateSessionPlanSetSchema,
})

/**
 * Schema for deleteSessionPlanSetChangeRequest tool.
 */
export const deleteSessionPlanSetSchema = z.object({
  entity_id: z.string().describe('ID of the session plan set to delete'),
  reasoning: z.string().optional().describe('AI reasoning for this deletion'),
})

export type DeleteSessionPlanSetInput = z.infer<typeof deleteSessionPlanSetSchema>

export const deleteSessionPlanSetTool = tool({
  description: 'Remove a set from a session plan exercise.',
  inputSchema: deleteSessionPlanSetSchema,
})

// ============================================================================
// Coordination Tools (2 tools)
// ============================================================================

/**
 * Schema for confirmPlanChangeSet tool.
 */
export const confirmPlanChangeSetSchema = z.object({
  title: z.string().describe('Title for the plan changeset (e.g., "4-Week Strength Program")'),
  description: z.string().describe('Description of what this plan includes'),
})

export type ConfirmPlanChangeSetInput = z.infer<typeof confirmPlanChangeSetSchema>

export const confirmPlanChangeSetTool = tool({
  description:
    'Submit the current plan for user approval. Call this when you have finished building the plan and are ready for the user to review.',
  inputSchema: confirmPlanChangeSetSchema,
})

/**
 * Schema for resetPlanChangeSet tool.
 */
export const resetPlanChangeSetSchema = z.object({
  reason: z.string().optional().describe('Reason for resetting (for logging)'),
})

export type ResetPlanChangeSetInput = z.infer<typeof resetPlanChangeSetSchema>

export const resetPlanChangeSetTool = tool({
  description: 'Clear all pending changes and start over. Use when the user wants a completely different plan.',
  inputSchema: resetPlanChangeSetSchema,
})

// ============================================================================
// Tool Collections
// ============================================================================

/**
 * Read tools for plan generation.
 */
export const planGeneratorReadTools = {
  getPlanGenerationContext: getPlanGenerationContextTool,
  searchExercisesForPlan: searchExercisesForPlanTool,
  getCurrentPlanState: getCurrentPlanStateTool,
}

/**
 * Proposal tools for microcycle operations.
 */
export const microcycleTools = {
  createMicrocycleChangeRequest: createMicrocycleTool,
  updateMicrocycleChangeRequest: updateMicrocycleTool,
  deleteMicrocycleChangeRequest: deleteMicrocycleTool,
}

/**
 * Proposal tools for session plan operations.
 */
export const sessionPlanTools = {
  createSessionPlanChangeRequest: createSessionPlanTool,
  updateSessionPlanChangeRequest: updateSessionPlanTool,
  deleteSessionPlanChangeRequest: deleteSessionPlanTool,
}

/**
 * Proposal tools for session plan exercise operations.
 */
export const sessionPlanExerciseTools = {
  createSessionPlanExerciseChangeRequest: createSessionPlanExerciseTool,
  updateSessionPlanExerciseChangeRequest: updateSessionPlanExerciseTool,
  deleteSessionPlanExerciseChangeRequest: deleteSessionPlanExerciseTool,
}

/**
 * Proposal tools for session plan set operations.
 */
export const sessionPlanSetTools = {
  createSessionPlanSetChangeRequest: createSessionPlanSetTool,
  updateSessionPlanSetChangeRequest: updateSessionPlanSetTool,
  deleteSessionPlanSetChangeRequest: deleteSessionPlanSetTool,
}

/**
 * Coordination tools for plan generation flow.
 */
export const planGeneratorCoordinationTools = {
  confirmPlanChangeSet: confirmPlanChangeSetTool,
  resetPlanChangeSet: resetPlanChangeSetTool,
}

/**
 * All plan generator tools combined.
 */
export const planGeneratorTools = {
  // Read (3)
  ...planGeneratorReadTools,
  // Proposal - Microcycle (3)
  ...microcycleTools,
  // Proposal - Session Plan (3)
  ...sessionPlanTools,
  // Proposal - Exercise (3)
  ...sessionPlanExerciseTools,
  // Proposal - Set (3)
  ...sessionPlanSetTools,
  // Coordination (2)
  ...planGeneratorCoordinationTools,
}

export type PlanGeneratorToolName = keyof typeof planGeneratorTools
