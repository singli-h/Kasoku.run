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
import { isTempId } from './buffer-utils'
import type { ConfirmChangeSetInput, ResetChangeSetInput } from './tools'

/**
 * Context passed to the tool handler.
 * Provides access to buffer operations and current state.
 */
export interface ToolHandlerContext {
  /** ChangeSet context for buffer operations */
  changeSet: ChangeSetContextValue

  /** Current session ID for context */
  sessionId: string

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

  // Log proposal tool call with extra detail for set creation
  console.log(`[ProposalTool] ${toolName}`)
  console.log(`[ProposalTool] Operation: ${operation}, Entity: ${entitySnakeCase}`)
  console.log(`[ProposalTool] Args:`, JSON.stringify(args, null, 2))

  // Extra logging for set creation to debug parent exercise ID issues
  if (toolName === 'createSetChangeRequest') {
    console.log(`[ProposalTool] 🔍 Set creation details:`)
    console.log(`[ProposalTool]   sessionPlanExerciseId: '${args.sessionPlanExerciseId}' (type: ${typeof args.sessionPlanExerciseId})`)
    console.log(`[ProposalTool]   setCount: ${args.setCount} (type: ${typeof args.setCount})`)

    // CRITICAL: Validate sessionPlanExerciseId is provided
    if (!args.sessionPlanExerciseId || args.sessionPlanExerciseId === '') {
      console.error(`[ProposalTool] ❌ ERROR: sessionPlanExerciseId is required but was: '${args.sessionPlanExerciseId}'`)
      return {
        success: false,
        error: 'sessionPlanExerciseId is required when creating sets. For NEW exercises you just created, use the entityId returned from createExerciseChangeRequest (e.g., "temp_001"). For EXISTING exercises, use their numeric ID from the session data.',
      }
    }
  }

  // Validate exerciseId for exercise-related tools (must be numeric, not a made-up string)
  if (
    (toolName.includes('Exercise') || toolName.includes('exercise')) &&
    args.exerciseId
  ) {
    const exerciseId = String(args.exerciseId)
    // Check if it's a valid numeric ID or a temp ID (temp_XXX)
    const isNumeric = /^\d+$/.test(exerciseId)
    const isTempId = /^temp_\d+$/.test(exerciseId)

    if (!isNumeric && !isTempId) {
      console.error(`[ProposalTool] ❌ ERROR: Invalid exerciseId: '${exerciseId}' - must be a numeric database ID or temp_XXX`)
      return {
        success: false,
        error: `Invalid exerciseId: '${exerciseId}'. You must use a numeric ID from the searchExercises results (e.g., "123"), NOT a made-up string like "exercise-name-id". Please call searchExercises first to get valid exercise IDs.`,
      }
    }
  }

  // ============================================================================
  // TEMP ID DELETION PATTERN (per changeset architecture concept doc section 2.4)
  // ============================================================================
  // When deleting an entity with a temp ID, we should REMOVE it from the buffer
  // (not create a DELETE change request), because it doesn't exist in the DB yet.
  // This allows users to say "remove that exercise I just added" before confirmation.
  if (operation === 'delete') {
    const tempIdToRemove = extractTempIdForDeletion(entitySnakeCase, args)

    if (tempIdToRemove) {
      console.log(`[ProposalTool] 🗑️ Removing temp entity from buffer: ${entitySnakeCase}:${tempIdToRemove}`)

      // Remove from buffer instead of creating DELETE change request
      context.changeSet.remove(entitySnakeCase, tempIdToRemove)

      return {
        success: true,
        message: `Removed proposed ${entitySnakeCase.replace(/_/g, ' ')} from changeset (it was not yet saved to database)`,
        entityId: tempIdToRemove,
      }
    }
    // If not a temp ID, continue to create DELETE change request below
  }

  try {
    // Get or create changeset ID for consistency
    const changesetId = context.changeSet.getOrCreateChangesetId()

    // Special handling: createSetChangeRequest with setCount > 1
    // Create N separate ChangeRequests so each set appears as its own ghost row
    const setCount = typeof args.setCount === 'number' ? args.setCount : 1
    const isMultiSetCreate =
      toolName === 'createSetChangeRequest' &&
      operation === 'create' &&
      entitySnakeCase === 'session_plan_set' &&
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
 */
export function createApprovalResult(
  approved: boolean,
  changes?: ChangeRequest[]
): Record<string, unknown> {
  if (approved) {
    return {
      status: 'approved',
      changesApplied: changes?.length ?? 0,
      message: 'Changes have been saved to the database.',
    }
  }

  // User clicked "Change" button - they want to revise the proposal
  // IMPORTANT: The changeset is PRESERVED (not cleared)
  // AI should ask what they want to change, then modify via upsert, then confirmChangeSet again
  return {
    status: 'revision_requested',
    message: 'User wants to revise this proposal. Your pending changes are still preserved in the buffer. Ask them what they would like to change, then use the proposal tools to update the changes (upsert will replace existing entries), and call confirmChangeSet again when ready for review.',
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

// ============================================================================
// HELPER: Extract Temp ID for Deletion
// ============================================================================

/**
 * Extracts the entity ID from delete tool args and checks if it's a temp ID.
 * Returns the temp ID if found, or null if the entity has a real database ID.
 *
 * This supports the temp ID deletion pattern from changeset architecture concept:
 * - Temp ID (e.g., "temp_001") → remove from buffer (not a real DB delete)
 * - Real ID (e.g., "123") → create DELETE change request for DB
 *
 * @param entityType - The entity type being deleted
 * @param args - The tool arguments
 * @returns The temp ID to remove, or null if it's a real database ID
 */
function extractTempIdForDeletion(
  entityType: string,
  args: Record<string, unknown>
): string | null {
  let entityId: string | null = null

  // Extract entity ID based on entity type
  switch (entityType) {
    case 'session_plan_exercise': {
      // deleteExerciseChangeRequest uses sessionPlanExerciseId
      entityId = args.sessionPlanExerciseId as string | null
      break
    }
    case 'session_plan_set': {
      // deleteSetChangeRequest uses either:
      // 1. sessionPlanSetId (direct set ID)
      // 2. sessionPlanExerciseId + setIndex (composite)
      const directSetId = args.sessionPlanSetId as string | undefined
      const parentExerciseId = args.sessionPlanExerciseId as string | undefined
      const setIndex = args.setIndex as number | undefined

      if (directSetId) {
        entityId = directSetId
      } else if (parentExerciseId && isTempId(parentExerciseId)) {
        // If parent exercise is a temp ID, construct the composite key
        // that was used when the set was created
        if (setIndex !== undefined) {
          entityId = `exercise:${parentExerciseId}:set:${setIndex}`
        } else {
          // Removing all sets of a temp exercise
          entityId = `exercise:${parentExerciseId}:all`
        }
      }
      break
    }
    default:
      // Unknown entity type - no temp ID extraction
      return null
  }

  // Check if the extracted ID is a temp ID
  if (entityId && isTempId(entityId)) {
    return entityId
  }

  // For composite set keys, check if the parent exercise ID is temp
  // The entityId might be like "exercise:temp_001:set:1"
  if (entityId && entityId.startsWith('exercise:temp_')) {
    return entityId
  }

  return null
}
