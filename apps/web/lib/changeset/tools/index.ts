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

// Import for re-assembly
import { readTools } from './read-tools'
import { proposalTools } from './proposal-tools'
import { coordinationTools } from './coordination-tools'

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
