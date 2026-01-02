/**
 * ChangeSet Pattern: Tool Name Parser
 *
 * Parses tool names following the convention: {operation}{EntityType}ChangeRequest
 * Examples: createExerciseChangeRequest, updateSessionChangeRequest, deleteSetChangeRequest
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-transformation-layer.md
 */

import type { OperationType } from './types'

/**
 * Result of parsing a ChangeRequest tool name.
 */
export interface ParsedToolName {
  /** The operation: create, update, or delete */
  operation: OperationType

  /** The entity type in PascalCase (e.g., "Exercise", "Session", "Set") */
  entityPascalCase: string

  /** The entity type in snake_case for database use (e.g., "preset_exercise") */
  entitySnakeCase: string
}

/**
 * Regex pattern for matching ChangeRequest tool names.
 * Captures: (operation)(EntityType)ChangeRequest
 * Supports both coach domain (Exercise, Set, Session) and athlete domain (TrainingSet, TrainingExercise, TrainingSession)
 */
const CHANGE_REQUEST_TOOL_PATTERN = /^(create|update|delete)(\w+)ChangeRequest$/

/**
 * Maps PascalCase entity names to their snake_case database equivalents.
 * Session Planning domain (Coach): session_plan, session_plan_exercise, session_plan_set
 * Workout Logging domain (Athlete): workout_log, workout_log_exercise, workout_log_set
 */
const ENTITY_NAME_MAP: Record<string, string> = {
  // Coach domain (Session Planning)
  Session: 'session_plan',
  Exercise: 'session_plan_exercise',
  Set: 'session_plan_set',

  // Athlete domain (Workout Logging)
  TrainingSession: 'workout_log',
  TrainingExercise: 'workout_log_exercise',
  TrainingSet: 'workout_log_set',
}

/**
 * Parses a ChangeRequest tool name into its components.
 *
 * @param toolName - The tool name to parse (e.g., "createExerciseChangeRequest")
 * @returns Parsed components or null if the name doesn't match the pattern
 *
 * @example
 * parseChangeRequestToolName("createExerciseChangeRequest")
 * // Returns: { operation: 'create', entityPascalCase: 'Exercise', entitySnakeCase: 'session_plan_exercise' }
 *
 * @example
 * parseChangeRequestToolName("updateSessionChangeRequest")
 * // Returns: { operation: 'update', entityPascalCase: 'Session', entitySnakeCase: 'session_plan' }
 *
 * @example
 * parseChangeRequestToolName("searchExercises")
 * // Returns: null (not a ChangeRequest tool)
 */
export function parseChangeRequestToolName(
  toolName: string
): ParsedToolName | null {
  const match = toolName.match(CHANGE_REQUEST_TOOL_PATTERN)

  if (!match) {
    return null
  }

  const [, operation, entityPascalCase] = match
  const entitySnakeCase = ENTITY_NAME_MAP[entityPascalCase]

  if (!entitySnakeCase) {
    // Unknown entity type - could log a warning in development
    console.warn(
      `[parseChangeRequestToolName] Unknown entity type: ${entityPascalCase}`
    )
    return null
  }

  return {
    operation: operation as OperationType,
    entityPascalCase,
    entitySnakeCase,
  }
}

/**
 * Checks if a tool name is a ChangeRequest tool.
 *
 * @param toolName - The tool name to check
 * @returns true if the tool name follows the ChangeRequest naming convention
 */
export function isChangeRequestTool(toolName: string): boolean {
  return CHANGE_REQUEST_TOOL_PATTERN.test(toolName)
}

/**
 * Checks if a tool name is a coordination tool (confirmChangeSet, resetChangeSet).
 *
 * @param toolName - The tool name to check
 * @returns true if the tool is a coordination tool
 */
export function isCoordinationTool(toolName: string): boolean {
  return toolName === 'confirmChangeSet' || toolName === 'resetChangeSet'
}

/**
 * Checks if a tool name is a read tool.
 * Coach domain: getSessionContext, searchExercises
 * Athlete domain: getWorkoutContext, searchExercises
 *
 * @param toolName - The tool name to check
 * @returns true if the tool is a read-only tool
 */
export function isReadTool(toolName: string): boolean {
  return (
    toolName === 'getSessionContext' ||
    toolName === 'getWorkoutContext' ||
    toolName === 'searchExercises'
  )
}

/**
 * Gets all supported entity types for the V1 Coach domain.
 *
 * @returns Array of supported entity type names in snake_case
 */
export function getSupportedEntityTypes(): string[] {
  return Object.values(ENTITY_NAME_MAP)
}
