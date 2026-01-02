/**
 * ChangeSet Pattern: Tool Registry
 *
 * Central export point for all AI tools.
 * Provides filtered tool sets by domain for the API route.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-tool-definitions.md
 */

// Re-export individual tool definitions
export {
  readTools,
  getSessionContextTool,
  getSessionContextSchema,
  searchExercisesTool,
  searchExercisesSchema,
  type GetSessionContextInput,
  type SearchExercisesInput,
  type ReadToolName,
  // Athlete read tools
  athleteReadTools,
  getWorkoutContextTool,
  getWorkoutContextSchema,
  type GetWorkoutContextInput,
  type AthleteReadToolName,
} from './read-tools'

export {
  proposalTools,
  createSessionChangeRequestTool,
  createSessionChangeRequestSchema,
  updateSessionChangeRequestTool,
  updateSessionChangeRequestSchema,
  createExerciseChangeRequestTool,
  createExerciseChangeRequestSchema,
  updateExerciseChangeRequestTool,
  updateExerciseChangeRequestSchema,
  deleteExerciseChangeRequestTool,
  deleteExerciseChangeRequestSchema,
  createSetChangeRequestTool,
  createSetChangeRequestSchema,
  updateSetChangeRequestTool,
  updateSetChangeRequestSchema,
  deleteSetChangeRequestTool,
  deleteSetChangeRequestSchema,
  type CreateSessionInput,
  type UpdateSessionInput,
  type CreateExerciseInput,
  type UpdateExerciseInput,
  type DeleteExerciseInput,
  type CreateSetInput,
  type UpdateSetInput,
  type DeleteSetInput,
  type ProposalToolName,
} from './proposal-tools'

export {
  coordinationTools,
  confirmChangeSetTool,
  confirmChangeSetSchema,
  resetChangeSetTool,
  resetChangeSetSchema,
  type ConfirmChangeSetInput,
  type ResetChangeSetInput,
  type CoordinationToolName,
} from './coordination-tools'

export {
  athleteProposalTools,
  createTrainingSetChangeRequestTool,
  createTrainingSetChangeRequestSchema,
  updateTrainingSetChangeRequestTool,
  updateTrainingSetChangeRequestSchema,
  createTrainingExerciseChangeRequestTool,
  createTrainingExerciseChangeRequestSchema,
  updateTrainingExerciseChangeRequestTool,
  updateTrainingExerciseChangeRequestSchema,
  updateTrainingSessionChangeRequestTool,
  updateTrainingSessionChangeRequestSchema,
  athleteProposalToolNames,
  type CreateTrainingSetInput,
  type UpdateTrainingSetInput,
  type CreateTrainingExerciseInput,
  type UpdateTrainingExerciseInput,
  type UpdateTrainingSessionInput,
  type AthleteProposalToolName,
} from './athlete-proposal-tools'

// Import for re-assembly
import { readTools, athleteReadTools } from './read-tools'
import { proposalTools } from './proposal-tools'
import { coordinationTools } from './coordination-tools'
import { athleteProposalTools } from './athlete-proposal-tools'

/**
 * All tools combined for the Coach domain (V1).
 *
 * This is the tool set passed to the Vercel AI SDK `streamText` function.
 *
 * @example
 * ```ts
 * import { streamText } from 'ai'
 * import { coachDomainTools } from '@/lib/changeset/tools'
 *
 * const result = await streamText({
 *   model: openai('gpt-4'),
 *   tools: coachDomainTools,
 *   // ...
 * })
 * ```
 */
export const coachDomainTools = {
  ...readTools,
  ...proposalTools,
  ...coordinationTools,
}

/**
 * Type-safe tool name union for the Coach domain.
 */
export type CoachToolName = keyof typeof coachDomainTools

/**
 * List of proposal tool names (tools that modify the buffer).
 */
export const proposalToolNames = Object.keys(proposalTools) as Array<
  keyof typeof proposalTools
>

/**
 * List of read tool names (read-only tools).
 */
export const readToolNames = Object.keys(readTools) as Array<
  keyof typeof readTools
>

/**
 * List of coordination tool names.
 */
export const coordinationToolNames = Object.keys(coordinationTools) as Array<
  keyof typeof coordinationTools
>

/**
 * Checks if a tool name is a proposal tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool creates/modifies ChangeRequests
 */
export function isProposalTool(toolName: string): boolean {
  return toolName in proposalTools
}

/**
 * Checks if a tool name is a read tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool is read-only
 */
export function isReadTool(toolName: string): boolean {
  return toolName in readTools
}

/**
 * Checks if a tool name is a coordination tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool controls workflow
 */
export function isCoordinationTool(toolName: string): boolean {
  return toolName in coordinationTools
}

/**
 * Gets the category of a tool.
 *
 * @param toolName - The tool name
 * @returns The tool category
 */
export function getToolCategory(
  toolName: string
): 'read' | 'proposal' | 'coordination' | 'unknown' {
  if (isReadTool(toolName)) return 'read'
  if (isProposalTool(toolName)) return 'proposal'
  if (isCoordinationTool(toolName)) return 'coordination'
  return 'unknown'
}

// ============================================================================
// Athlete Domain Tools (V1)
// ============================================================================

/**
 * All tools combined for the Athlete domain.
 *
 * This is the tool set passed to the Vercel AI SDK `streamText` function
 * for the athlete workout assistant.
 *
 * Key differences from coach domain:
 * - Uses athleteReadTools (getWorkoutContext) instead of readTools (getSessionContext)
 * - Uses athlete proposal tools instead of coach proposal tools
 * - No delete operations (athletes swap or skip instead)
 * - Operates on workout_log_* entities instead of session_plan_*
 *
 * @example
 * ```ts
 * import { streamText } from 'ai'
 * import { athleteDomainTools } from '@/lib/changeset/tools'
 *
 * const result = await streamText({
 *   model: openai('gpt-4'),
 *   tools: athleteDomainTools,
 *   // ...
 * })
 * ```
 */
export const athleteDomainTools = {
  ...athleteReadTools,
  ...athleteProposalTools,
  ...coordinationTools,
}

/**
 * Type-safe tool name union for the Athlete domain.
 */
export type AthleteToolName = keyof typeof athleteDomainTools

/**
 * Checks if a tool name is an athlete proposal tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool creates/modifies athlete ChangeRequests
 */
export function isAthleteProposalTool(toolName: string): boolean {
  return toolName in athleteProposalTools
}

/**
 * Checks if a tool name is an athlete read tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool is an athlete read-only tool
 */
export function isAthleteReadTool(toolName: string): boolean {
  return toolName in athleteReadTools
}

/**
 * Gets the category of an athlete tool.
 *
 * @param toolName - The tool name
 * @returns The tool category
 */
export function getAthleteToolCategory(
  toolName: string
): 'read' | 'proposal' | 'coordination' | 'unknown' {
  if (isAthleteReadTool(toolName)) return 'read'
  if (isAthleteProposalTool(toolName)) return 'proposal'
  if (isCoordinationTool(toolName)) return 'coordination'
  return 'unknown'
}
