/**
 * ChangeSet Pattern: Coordination Tool Schemas
 *
 * Tools that control the changeset workflow.
 * - confirmChangeSet: Submit for user approval (pauses AI stream)
 * - resetChangeSet: Clear buffer and start fresh
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-tool-definitions.md
 */

import { z } from 'zod'
import { tool } from 'ai'

/**
 * Schema for confirmChangeSet.
 * Submits pending changes for user review.
 *
 * This tool PAUSES the AI stream until the user makes a decision:
 * - Approve: Execute changes
 * - Regenerate: Clear and try again with feedback
 * - Dismiss: Clear without executing
 */
export const confirmChangeSetSchema = z.object({
  title: z
    .string()
    .max(100)
    .describe("Short summary of changes (e.g., 'Add 2 exercises')"),
  description: z
    .string()
    .describe('Detailed explanation of what changes are proposed'),
})

export type ConfirmChangeSetInput = z.infer<typeof confirmChangeSetSchema>

export const confirmChangeSetTool = tool({
  description:
    'Submit all pending changes for user review. Pauses AI stream until user decides.',
  inputSchema: confirmChangeSetSchema,
  // No execute - handled client-side
})

/**
 * Schema for resetChangeSet.
 * Clears all pending changes.
 *
 * Use when:
 * - User wants to start over
 * - AI realizes proposed changes are wrong
 * - Conversation takes a different direction
 */
export const resetChangeSetSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe('Why the changeset is being cleared (for logging)'),
})

export type ResetChangeSetInput = z.infer<typeof resetChangeSetSchema>

export const resetChangeSetTool = tool({
  description: 'Clear all pending changes and start fresh.',
  inputSchema: resetChangeSetSchema,
  // No execute - handled client-side
})

/**
 * All coordination tools.
 */
export const coordinationTools = {
  confirmChangeSet: confirmChangeSetTool,
  resetChangeSet: resetChangeSetTool,
}

/**
 * Type-safe tool names for coordination tools.
 */
export type CoordinationToolName = keyof typeof coordinationTools
