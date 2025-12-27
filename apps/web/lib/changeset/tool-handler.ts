/**
 * ChangeSet Pattern: Tool Handler
 *
 * Handles tool calls from the AI on the client side.
 * Manages pause/resume for the approval flow.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 4.4
 */

import type {
  ChangeRequest,
  ChangeSetContextValue,
  ToolHandlerResult,
} from './types'
import {
  parseChangeRequestToolName,
  isChangeRequestTool,
  isCoordinationTool,
  isReadTool,
} from './parser'
import { transformToolInput, resetExecutionOrderCounter } from './transformations'
import type { ConfirmChangeSetInput, ResetChangeSetInput } from './tools'

/**
 * Context passed to the tool handler.
 * Provides access to buffer operations and current state.
 */
export interface ToolHandlerContext {
  /** ChangeSet context for buffer operations */
  changeSet: ChangeSetContextValue

  /** Current session ID for context */
  sessionId: number

  /** Callback to show the approval widget */
  showApprovalWidget: (title: string, description: string) => void

  /** Callback to execute read tools */
  executeReadTool: (
    toolName: string,
    args: Record<string, unknown>
  ) => Promise<unknown>
}

/**
 * Handles a tool call from the AI.
 *
 * This function:
 * 1. Parses the tool name to determine category
 * 2. For proposal tools: transforms input → upserts to buffer
 * 3. For confirmChangeSet: shows approval widget → returns 'PAUSE'
 * 4. For resetChangeSet: clears buffer
 * 5. For read tools: executes and returns result
 *
 * @param toolName - The name of the tool being called
 * @param args - The arguments passed to the tool
 * @param context - Handler context with buffer access
 * @returns Tool result, or 'PAUSE' for confirmChangeSet
 *
 * @example
 * ```ts
 * const result = await handleToolCall('createExerciseChangeRequest', {
 *   exerciseId: '123',
 *   exerciseName: 'Bench Press',
 *   reasoning: 'Added as primary chest exercise'
 * }, context)
 *
 * if (result === 'PAUSE') {
 *   // Don't call addToolResult yet - wait for user approval
 * } else {
 *   addToolResult(toolCallId, result)
 * }
 * ```
 */
export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<ToolHandlerResult | unknown> {
  // 1. Handle read tools (execute and return result)
  if (isReadTool(toolName)) {
    return handleReadTool(toolName, args, context)
  }

  // 2. Handle proposal tools (ChangeRequest tools)
  if (isChangeRequestTool(toolName)) {
    return handleProposalTool(toolName, args, context)
  }

  // 3. Handle coordination tools
  if (isCoordinationTool(toolName)) {
    return handleCoordinationTool(toolName, args, context)
  }

  // Unknown tool
  console.warn(`[handleToolCall] Unknown tool: ${toolName}`)
  return {
    success: false,
    error: `Unknown tool: ${toolName}`,
  }
}

/**
 * Handles a proposal tool call (creates/updates ChangeRequest in buffer).
 *
 * Special handling for createSetChangeRequest with setCount > 1:
 * Creates N separate ChangeRequests so each set appears as its own ghost row.
 */
function handleProposalTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolHandlerContext
): ToolHandlerResult {
  const parsed = parseChangeRequestToolName(toolName)

  if (!parsed) {
    return {
      success: false,
      error: `Failed to parse tool name: ${toolName}`,
    }
  }

  const { operation, entitySnakeCase } = parsed

  // Log proposal tool call
  console.log(`[ProposalTool] ${toolName}`)
  console.log(`[ProposalTool] Operation: ${operation}, Entity: ${entitySnakeCase}`)
  console.log(`[ProposalTool] Args:`, JSON.stringify(args, null, 2))

  try {
    // Get or create changeset ID for consistency
    const changesetId = context.changeSet.getOrCreateChangesetId()

    // Special handling: createSetChangeRequest with setCount > 1
    // Create N separate ChangeRequests so each set appears as its own ghost row
    const setCount = typeof args.setCount === 'number' ? args.setCount : 1
    const isMultiSetCreate =
      toolName === 'createSetChangeRequest' &&
      operation === 'create' &&
      entitySnakeCase === 'preset_set' &&
      setCount > 1

    if (isMultiSetCreate) {
      const entityIds: string[] = []
      const changeIds: string[] = []

      // Create N separate ChangeRequests (one per set)
      for (let i = 0; i < setCount; i++) {
        // Remove setCount from args - each request is for 1 set
        const singleSetArgs = { ...args, setCount: 1 }

        const changeRequest = transformToolInput(
          entitySnakeCase,
          operation,
          { ...singleSetArgs, reasoning: args.reasoning as string },
          { sessionId: context.sessionId, changesetId }
        )

        console.log(`[ProposalTool] ChangeRequest ${i + 1}/${setCount}:`, JSON.stringify(changeRequest, null, 2))
        context.changeSet.upsert(changeRequest)

        if (changeRequest.entityId) entityIds.push(changeRequest.entityId)
        changeIds.push(changeRequest.id)
      }

      console.log(`[ProposalTool] ✅ Added ${setCount} sets to changeset`)

      return {
        success: true,
        entityIds, // Array of temp IDs for the created sets
        changeIds,
        message: `${setCount} sets added to changeset`,
      }
    }

    // Standard single ChangeRequest flow
    const changeRequest = transformToolInput(
      entitySnakeCase,
      operation,
      { ...args, reasoning: args.reasoning as string },
      { sessionId: context.sessionId, changesetId }
    )

    // Log the resulting ChangeRequest
    console.log(`[ProposalTool] ChangeRequest:`, JSON.stringify(changeRequest, null, 2))

    // Upsert to buffer
    context.changeSet.upsert(changeRequest)

    console.log(`[ProposalTool] ✅ Added to changeset: ${changeRequest.id}, entityId: ${changeRequest.entityId}`)

    // Return entityId so AI can reference this entity in subsequent tool calls
    // (e.g., when creating sets for a newly created exercise)
    return {
      success: true,
      entityId: changeRequest.entityId ?? undefined, // temp_001, temp_002, etc. for creates
      changeId: changeRequest.id,
      message: `${operation} ${entitySnakeCase} added to changeset`,
    }
  } catch (error) {
    console.error(`[ProposalTool] ❌ Error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handles a coordination tool call (confirmChangeSet, resetChangeSet).
 */
function handleCoordinationTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolHandlerContext
): ToolHandlerResult | 'PAUSE' {
  if (toolName === 'confirmChangeSet') {
    return handleConfirmChangeSet(args as ConfirmChangeSetInput, context)
  }

  if (toolName === 'resetChangeSet') {
    return handleResetChangeSet(args as ResetChangeSetInput, context)
  }

  return {
    success: false,
    error: `Unknown coordination tool: ${toolName}`,
  }
}

/**
 * Handles confirmChangeSet tool call.
 *
 * 1. Validates there are changes to confirm
 * 2. Sets changeset metadata
 * 3. Transitions to pending_approval
 * 4. Shows approval widget
 * 5. Returns 'PAUSE' to pause the AI stream
 */
function handleConfirmChangeSet(
  args: ConfirmChangeSetInput,
  context: ToolHandlerContext
): ToolHandlerResult | 'PAUSE' {
  const { title, description } = args

  // Validate there are changes
  if (!context.changeSet.hasPendingChanges()) {
    return {
      success: false,
      error: 'No changes to confirm. Add changes before confirming.',
    }
  }

  // Set metadata
  context.changeSet.setMetadata(title, description)

  // Transition to pending_approval
  context.changeSet.setStatus('pending_approval')

  // Show approval widget
  context.showApprovalWidget(title, description)

  // Return PAUSE to pause the AI stream
  // The client should NOT call addToolResult until user makes a decision
  return 'PAUSE'
}

/**
 * Handles resetChangeSet tool call.
 *
 * Clears the buffer and resets state.
 */
function handleResetChangeSet(
  args: ResetChangeSetInput,
  context: ToolHandlerContext
): ToolHandlerResult {
  const reason = args.reason || 'User requested reset'

  // Clear the buffer
  context.changeSet.clear()

  // Reset execution order counter
  resetExecutionOrderCounter()

  console.log(`[handleResetChangeSet] Cleared buffer: ${reason}`)

  return {
    success: true,
    message: 'Changeset cleared',
  }
}

/**
 * Handles a read tool call.
 * Delegates to the provided executeReadTool callback.
 */
async function handleReadTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<unknown> {
  try {
    return await context.executeReadTool(toolName, args)
  } catch (error) {
    console.error(`[handleReadTool] Error executing ${toolName}:`, error)
    return {
      error: error instanceof Error ? error.message : 'Failed to execute read tool',
    }
  }
}

/**
 * Creates the tool result to return after user approval.
 *
 * @param approved - Whether the user approved
 * @param changes - The changes that were applied (if approved)
 * @param feedback - User feedback (if rejected with feedback)
 */
export function createApprovalResult(
  approved: boolean,
  changes?: ChangeRequest[],
  feedback?: string
): Record<string, unknown> {
  if (approved) {
    return {
      status: 'approved',
      changesApplied: changes?.length ?? 0,
      message: 'Changes have been saved to the database.',
    }
  }

  if (feedback) {
    return {
      status: 'rejected_with_feedback',
      feedback,
      message: 'User requested changes. Please revise based on the feedback.',
    }
  }

  return {
    status: 'rejected',
    message: 'User dismissed all changes.',
  }
}

/**
 * Creates the tool result after execution failure.
 *
 * @param error - The error that occurred
 */
export function createExecutionFailureResult(
  error: unknown
): Record<string, unknown> {
  return {
    status: 'execution_failed',
    error: error instanceof Error ? error.message : 'Unknown error',
    message: 'Failed to save changes. Please review the error and try again.',
  }
}
