/**
 * ChangeSet Pattern: Transformation Functions
 *
 * Converts AI tool inputs to standard ChangeRequest format.
 * Handles entity ID extraction, case conversion, and data filtering.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-transformation-layer.md
 */

import type { ChangeRequest, OperationType, SessionEntityType } from './types'
import {
  generateChangeRequestId,
  generateTempId,
} from './buffer-utils'
import {
  convertKeysToSnakeCase,
  ENTITY_ID_FIELDS,
  ID_FIELDS,
  isValidEntityType,
  METADATA_FIELDS,
  PARENT_FK_FROM_TOOL_INPUT,
} from './entity-mappings'

/**
 * Input from an AI tool call. Loosely typed to accommodate various tool schemas.
 */
export interface ToolInput {
  /** AI's reasoning for this change */
  reasoning?: string
  /** Any other fields from the tool schema */
  [key: string]: unknown
}

/**
 * Options for transformation.
 */
export interface TransformOptions {
  /** Parent session ID (for creates that need it) */
  sessionId?: number
  /** Execution order for this change (optional, auto-incremented if not provided) */
  executionOrder?: number
  /** Current data for update/delete operations */
  currentData?: Record<string, unknown> | null
  /** Changeset ID (optional, will be set by context if not provided) */
  changesetId?: string
}

/** Counter for auto-incrementing execution order */
let executionOrderCounter = 0

/**
 * Resets the execution order counter.
 * Should be called when starting a new changeset.
 */
export function resetExecutionOrderCounter(): void {
  executionOrderCounter = 0
}

/**
 * Gets the next execution order value.
 */
export function getNextExecutionOrder(): number {
  return ++executionOrderCounter
}

/**
 * Transforms an AI tool input into a standard ChangeRequest.
 *
 * This is the core transformation function that:
 * 1. Extracts the entity ID based on operation type
 * 2. Builds proposedData (excluding metadata and ID fields)
 * 3. Converts camelCase to snake_case for database columns
 *
 * @param entityType - The type of entity being modified
 * @param operationType - The operation: create, update, or delete
 * @param toolInput - The raw input from the AI tool call
 * @param options - Additional options (currentData, executionOrder)
 * @returns A ChangeRequest ready for the buffer
 *
 * @example
 * // Create a new exercise
 * transformToolInput('preset_exercise', 'create', {
 *   exerciseId: 456,
 *   exerciseOrder: 1,
 *   reasoning: "Adding bench press as requested"
 * }, { sessionId: 123 })
 *
 * @example
 * // Update an exercise
 * transformToolInput('preset_exercise', 'update', {
 *   sessionPlanExerciseId: 789,
 *   exerciseOrder: 2,
 *   reasoning: "Moving exercise to second position"
 * }, { currentData: { exercise_order: 1 } })
 */
export function transformToolInput(
  entityType: string,
  operationType: OperationType,
  toolInput: ToolInput,
  options: TransformOptions = {}
): ChangeRequest {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    throw new Error(`Unsupported entity type: ${entityType}`)
  }

  // Extract entity ID
  const entityId = extractEntityId(entityType, operationType, toolInput)

  // Build proposed data
  const proposedData =
    operationType !== 'delete'
      ? buildProposedData(entityType, toolInput, options.sessionId)
      : null

  // Extract reasoning
  const aiReasoning = toolInput.reasoning as string | undefined

  return {
    id: generateChangeRequestId(),
    changesetId: options.changesetId ?? '', // Set by context if not provided
    operationType,
    entityType,
    entityId,
    currentData: options.currentData ?? null,
    proposedData,
    executionOrder: options.executionOrder ?? getNextExecutionOrder(),
    aiReasoning,
    createdAt: new Date(),
  }
}

/**
 * Extracts the entity ID from tool input based on operation type.
 *
 * - For creates: Returns a temporary ID (will be replaced after DB insert)
 * - For updates/deletes: Returns the entity ID from the appropriate field
 *
 * Special handling for sets (preset_set):
 * - Sets can be identified by direct ID (sessionPlanSetId) OR
 * - By composite key (sessionPlanExerciseId + setIndex)
 * - When using composite identification, generates a composite ID string
 *
 * @param entityType - The entity type
 * @param operationType - The operation type
 * @param toolInput - The tool input
 * @returns The entity ID (real, temporary, or composite for sets)
 */
export function extractEntityId(
  entityType: SessionEntityType,
  operationType: OperationType,
  toolInput: ToolInput
): string {
  if (operationType === 'create') {
    // Generate a temporary ID for new entities
    return generateTempId()
  }

  // For update/delete, get the ID from the entity-specific field
  const idField = ENTITY_ID_FIELDS[entityType]
  const entityId = toolInput[idField]

  // For sets, support composite identification (parent exercise + set index)
  if (entityType === 'preset_set' && (entityId === undefined || entityId === null)) {
    const parentExerciseId = toolInput['sessionPlanExerciseId']
    const setIndex = toolInput['setIndex']
    const applyToAllSets = toolInput['applyToAllSets']

    // If we have parent exercise ID, create a composite identifier
    if (parentExerciseId !== undefined && parentExerciseId !== null) {
      // Format: "exercise:{parentId}:set:{setIndex}" or "exercise:{parentId}:all"
      if (applyToAllSets) {
        return `exercise:${parentExerciseId}:all`
      }
      if (setIndex !== undefined && setIndex !== null) {
        return `exercise:${parentExerciseId}:set:${setIndex}`
      }
      // No specific set index - operation may apply to all sets
      return `exercise:${parentExerciseId}:all`
    }
  }

  if (entityId === undefined || entityId === null) {
    throw new Error(
      `Missing ${idField} for ${operationType} operation on ${entityType}. ` +
      `For sets, you can also use sessionPlanExerciseId + setIndex.`
    )
  }

  return String(entityId)
}

/**
 * Builds the proposedData object from tool input.
 *
 * - Excludes metadata fields (reasoning)
 * - Excludes ID fields (stored in entityId)
 * - Converts camelCase keys to snake_case for database
 * - Adds parent foreign key for creates if needed
 *
 * @param entityType - The entity type
 * @param toolInput - The tool input
 * @param sessionId - Optional session ID for parent FK
 * @returns The proposedData object with snake_case keys
 */
export function buildProposedData(
  entityType: SessionEntityType,
  toolInput: ToolInput,
  sessionId?: number
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // Copy fields, excluding metadata and ID fields
  for (const [key, value] of Object.entries(toolInput)) {
    if (METADATA_FIELDS.has(key)) continue
    if (ID_FIELDS.has(key)) continue
    if (value === undefined) continue

    data[key] = value
  }

  // Add parent foreign key for exercises if not present
  // Updated to use session_plan naming (post schema migration 2025-Q4)
  if (
    entityType === 'preset_exercise' &&
    !data['sessionPlanId'] &&
    sessionId
  ) {
    data['sessionPlanId'] = sessionId
  }

  // Add parent foreign key from tool input for entities that specify it
  // (e.g., sets specify their parent exercise via sessionPlanExerciseId)
  const parentFkMapping = PARENT_FK_FROM_TOOL_INPUT[entityType]
  if (parentFkMapping) {
    const parentRef = toolInput[parentFkMapping.inputField]
    if (parentRef !== undefined && parentRef !== null) {
      // Store the reference (may be temp ID, will be resolved during execution)
      data[parentFkMapping.inputField] = parentRef
    }
  }

  // Convert to snake_case for database
  return convertKeysToSnakeCase(data)
}

/**
 * Validates that a ChangeRequest has all required fields.
 *
 * @param request - The change request to validate
 * @returns true if valid, throws error if invalid
 */
export function validateChangeRequest(request: ChangeRequest): boolean {
  if (!request.entityType) {
    throw new Error('ChangeRequest missing entityType')
  }

  if (!isValidEntityType(request.entityType)) {
    throw new Error(`Invalid entityType: ${request.entityType}`)
  }

  if (request.operationType !== 'create' && !request.entityId) {
    throw new Error(
      `ChangeRequest missing entityId for ${request.operationType} operation`
    )
  }

  if (request.operationType !== 'delete' && !request.proposedData) {
    throw new Error(
      `ChangeRequest missing proposedData for ${request.operationType} operation`
    )
  }

  return true
}

/**
 * Merges current data with proposed data for display purposes.
 * Used to show the complete "after" state in the UI.
 *
 * @param currentData - The entity's current state
 * @param proposedData - The proposed changes
 * @returns Merged data showing the final state
 */
export function mergeProposedWithCurrent(
  currentData: Record<string, unknown> | null,
  proposedData: Record<string, unknown> | null
): Record<string, unknown> {
  if (!currentData) {
    return proposedData ?? {}
  }

  if (!proposedData) {
    return currentData
  }

  return {
    ...currentData,
    ...proposedData,
  }
}
