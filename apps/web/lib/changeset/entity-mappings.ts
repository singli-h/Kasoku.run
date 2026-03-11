/**
 * ChangeSet Pattern: Entity ID Field Mappings
 *
 * Maps entity types to their ID field names and provides case conversion utilities.
 * V1 Scope: Coach domain (Training Plans) only.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-entity-model.md
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-transformation-layer.md
 */

import type { SessionEntityType, WorkoutEntityType, AllEntityType } from './types'

/**
 * Maps entity types to the field name used for entity ID in tool inputs (camelCase).
 *
 * Tool inputs use camelCase field names for AI-friendliness.
 * These map to snake_case database columns during transformation.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const ENTITY_ID_FIELDS: Record<SessionEntityType, string> = {
  session_plan: 'sessionPlanId', // session_plans.id
  session_plan_exercise: 'sessionPlanExerciseId', // session_plan_exercises.id
  session_plan_set: 'sessionPlanSetId', // session_plan_sets.id
}

/**
 * Maps workout entity types to the field name used for entity ID in tool inputs (camelCase).
 * Used for workout/training domain (athlete side).
 */
export const WORKOUT_ENTITY_ID_FIELDS: Record<WorkoutEntityType, string> = {
  workout_log: 'workoutLogId', // workout_logs.id
  workout_log_exercise: 'workoutLogExerciseId', // workout_log_exercises.id
  workout_log_set: 'workoutLogSetId', // workout_log_sets.id
}

/**
 * Combined entity ID fields for all entity types.
 */
export const ALL_ENTITY_ID_FIELDS: Record<AllEntityType, string> = {
  ...ENTITY_ID_FIELDS,
  ...WORKOUT_ENTITY_ID_FIELDS,
}

/**
 * Maps entity types to their database table names.
 */
export const ENTITY_TABLE_NAMES: Record<SessionEntityType, string> = {
  session_plan: 'session_plans',
  session_plan_exercise: 'session_plan_exercises',
  session_plan_set: 'session_plan_sets',
}

/**
 * Maps workout entity types to their database table names.
 */
export const WORKOUT_ENTITY_TABLE_NAMES: Record<WorkoutEntityType, string> = {
  workout_log: 'workout_logs',
  workout_log_exercise: 'workout_log_exercises',
  workout_log_set: 'workout_log_sets',
}

/**
 * Combined table names for all entity types.
 */
export const ALL_ENTITY_TABLE_NAMES: Record<AllEntityType, string> = {
  ...ENTITY_TABLE_NAMES,
  ...WORKOUT_ENTITY_TABLE_NAMES,
}

/**
 * Maps entity types to their parent foreign key field (in database snake_case).
 */
export const ENTITY_PARENT_FIELDS: Record<SessionEntityType, string | null> = {
  session_plan: 'microcycle_id', // Parent is microcycle
  session_plan_exercise: 'session_plan_id', // Parent is session
  session_plan_set: 'session_plan_exercise_id', // Parent is exercise
}

/**
 * Maps workout entity types to their parent foreign key field (in database snake_case).
 */
export const WORKOUT_ENTITY_PARENT_FIELDS: Record<WorkoutEntityType, string | null> = {
  workout_log: 'athlete_id', // Parent is athlete (via athlete_id)
  workout_log_exercise: 'workout_log_id', // Parent is workout log
  workout_log_set: 'workout_log_exercise_id', // Parent is exercise
}

/**
 * Combined parent fields for all entity types.
 */
export const ALL_ENTITY_PARENT_FIELDS: Record<AllEntityType, string | null> = {
  ...ENTITY_PARENT_FIELDS,
  ...WORKOUT_ENTITY_PARENT_FIELDS,
}

/**
 * Maps entity types to fields that contain entity references (foreign keys).
 * These fields may contain temporary IDs that need resolution during execution.
 * Keys are in snake_case (database column names).
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const ENTITY_REFERENCE_FIELDS: Record<SessionEntityType, string[]> = {
  session_plan: ['microcycle_id'],
  session_plan_exercise: ['session_plan_id'],
  session_plan_set: ['session_plan_exercise_id'],
}

/**
 * Maps workout entity types to fields that contain entity references (foreign keys).
 */
export const WORKOUT_ENTITY_REFERENCE_FIELDS: Record<WorkoutEntityType, string[]> = {
  workout_log: ['athlete_id', 'session_plan_id'],
  workout_log_exercise: ['workout_log_id', 'exercise_id', 'session_plan_exercise_id'],
  workout_log_set: ['workout_log_exercise_id', 'workout_log_id'],
}

/**
 * Combined reference fields for all entity types.
 */
export const ALL_ENTITY_REFERENCE_FIELDS: Record<AllEntityType, string[]> = {
  ...ENTITY_REFERENCE_FIELDS,
  ...WORKOUT_ENTITY_REFERENCE_FIELDS,
}

/**
 * Maps tool input field names (camelCase) to their corresponding
 * entity reference fields (snake_case) for parent FK resolution.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const PARENT_FK_FROM_TOOL_INPUT: Record<SessionEntityType, { inputField: string; dbField: string } | null> = {
  session_plan: null, // Session's parent (microcycle) comes from context
  session_plan_exercise: null, // Exercise's parent (session) comes from sessionId context
  session_plan_set: { inputField: 'sessionPlanExerciseId', dbField: 'session_plan_exercise_id' },
}

/**
 * Maps workout tool input field names to their corresponding
 * entity reference fields for parent FK resolution.
 */
export const WORKOUT_PARENT_FK_FROM_TOOL_INPUT: Record<WorkoutEntityType, { inputField: string; dbField: string } | null> = {
  workout_log: null, // Session's parent (athlete) comes from context
  workout_log_exercise: { inputField: 'workoutLogId', dbField: 'workout_log_id' }, // Exercise's parent workout log
  workout_log_set: { inputField: 'workoutLogExerciseId', dbField: 'workout_log_exercise_id' },
}

/**
 * Combined parent FK mappings for all entity types.
 */
export const ALL_PARENT_FK_FROM_TOOL_INPUT: Record<AllEntityType, { inputField: string; dbField: string } | null> = {
  ...PARENT_FK_FROM_TOOL_INPUT,
  ...WORKOUT_PARENT_FK_FROM_TOOL_INPUT,
}

/**
 * Maps camelCase tool input field names to snake_case database column names.
 * Only includes fields that need conversion (same-case fields omitted).
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const CAMEL_TO_SNAKE_MAP: Record<string, string> = {
  // Session (session_plans) fields
  sessionPlanId: 'id',
  userId: 'user_id',
  microcycleId: 'microcycle_id',
  sessionMode: 'session_mode',
  isTemplate: 'is_template',
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // Exercise (session_plan_exercises) fields
  sessionPlanExerciseId: 'id',
  exerciseId: 'exercise_id',
  exerciseName: 'exercise_name', // For UI display (not a DB column, but kept for ghost cards/swap)
  exerciseOrder: 'exercise_order',
  supersetId: 'superset_id',
  targetEventGroups: 'target_event_groups',

  // Set (session_plan_sets) fields
  sessionPlanSetId: 'id',
  setIndex: 'set_index',
  setCount: 'set_count',
  performingTime: 'performing_time',
  restTime: 'rest_time',
  resistanceUnitId: 'resistance_unit_id',

  // ===================================================================
  // Workout (training) domain fields
  // ===================================================================

  // Workout log (workout_logs) fields
  workoutLogId: 'id',
  athleteId: 'athlete_id',
  dateTime: 'date_time',
  sessionStatus: 'session_status',

  // Workout exercise (workout_log_exercises) fields
  workoutLogExerciseId: 'id',
  workoutLogId_fk: 'workout_log_id', // Foreign key to workout_logs
  sessionPlanExerciseId_fk: 'session_plan_exercise_id', // Optional link to session plan

  // Workout set (workout_log_sets) fields
  workoutLogSetId: 'id',
  workoutLogExerciseId_fk: 'workout_log_exercise_id', // Foreign key to workout_log_exercises
}

/**
 * Maps snake_case database column names back to camelCase tool field names.
 * Generated from CAMEL_TO_SNAKE_MAP.
 */
export const SNAKE_TO_CAMEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE_MAP).map(([camel, snake]) => [snake, camel])
)

/**
 * Fields that should be excluded from proposedData during transformation.
 * These are metadata fields, not data fields.
 */
export const METADATA_FIELDS = new Set([
  'reasoning', // AI reasoning - stored separately
  'aiReasoning', // Alternative casing
  // Note: exerciseName is kept in proposedData for UI display (ghost cards, swap)
  'insertAfterExerciseId', // Ordering helper, not a DB column
  // Note: setCount is NOT excluded - it's needed in proposedData for execution
])

/**
 * Fields that identify an entity and should be excluded from proposedData.
 * The ID is stored in entityId, not proposedData.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export const ID_FIELDS = new Set([
  // Session planning domain
  'sessionPlanId',
  'sessionPlanExerciseId',
  'sessionPlanSetId',
  // Workout domain
  'workoutLogId',
  'workoutLogExerciseId',
  'workoutLogSetId',
  // Generic
  'id',
])

/**
 * Converts a camelCase field name to snake_case.
 *
 * @param fieldName - The field name in camelCase
 * @returns The field name in snake_case
 *
 * @example
 * toSnakeCase('exerciseId') // 'exercise_id'
 * toSnakeCase('exerciseOrder') // 'exercise_order'
 * toSnakeCase('reps') // 'reps' (no change for single-word fields)
 */
export function toSnakeCase(fieldName: string): string {
  // Check explicit mapping first
  if (CAMEL_TO_SNAKE_MAP[fieldName]) {
    return CAMEL_TO_SNAKE_MAP[fieldName]
  }

  // Fall back to algorithmic conversion
  return fieldName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Converts a snake_case field name to camelCase.
 *
 * @param fieldName - The field name in snake_case
 * @returns The field name in camelCase
 *
 * @example
 * toCamelCase('exercise_id') // 'exerciseId'
 * toCamelCase('exercise_order') // 'exerciseOrder'
 * toCamelCase('reps') // 'reps' (no change for single-word fields)
 */
export function toCamelCase(fieldName: string): string {
  // Check explicit mapping first
  if (SNAKE_TO_CAMEL_MAP[fieldName]) {
    return SNAKE_TO_CAMEL_MAP[fieldName]
  }

  // Fall back to algorithmic conversion
  return fieldName.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  )
}

/**
 * Converts an object's keys from camelCase to snake_case.
 *
 * @param obj - Object with camelCase keys
 * @returns New object with snake_case keys
 *
 * @example
 * convertKeysToSnakeCase({ exerciseId: 1, exerciseOrder: 2 })
 * // { exercise_id: 1, exercise_order: 2 }
 */
export function convertKeysToSnakeCase(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value
  }

  return result
}

/**
 * Converts an object's keys from snake_case to camelCase.
 *
 * @param obj - Object with snake_case keys
 * @returns New object with camelCase keys
 *
 * @example
 * convertKeysToCamelCase({ exercise_id: 1, exercise_order: 2 })
 * // { exerciseId: 1, exerciseOrder: 2 }
 */
export function convertKeysToCamelCase(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value
  }

  return result
}

/**
 * Gets the ID field name for an entity type.
 *
 * @param entityType - The entity type
 * @returns The ID field name in camelCase
 */
export function getEntityIdField(entityType: SessionEntityType): string {
  return ENTITY_ID_FIELDS[entityType]
}

/**
 * Gets the ID field name for any entity type (session or workout).
 *
 * @param entityType - The entity type
 * @returns The ID field name in camelCase
 */
export function getAllEntityIdField(entityType: AllEntityType): string {
  return ALL_ENTITY_ID_FIELDS[entityType]
}

/**
 * Gets the database table name for an entity type.
 *
 * @param entityType - The entity type
 * @returns The database table name
 */
export function getEntityTableName(entityType: SessionEntityType): string {
  return ENTITY_TABLE_NAMES[entityType]
}

/**
 * Gets the database table name for any entity type (session or workout).
 *
 * @param entityType - The entity type
 * @returns The database table name
 */
export function getAllEntityTableName(entityType: AllEntityType): string {
  return ALL_ENTITY_TABLE_NAMES[entityType]
}

/**
 * Checks if an entity type is supported (session planning domain).
 *
 * @param entityType - The entity type to check
 * @returns true if the entity type is supported
 */
export function isValidEntityType(entityType: string): entityType is SessionEntityType {
  return entityType in ENTITY_ID_FIELDS
}

/**
 * Checks if an entity type is a workout entity type.
 *
 * @param entityType - The entity type to check
 * @returns true if the entity type is a workout entity type
 */
export function isWorkoutEntityType(entityType: string): entityType is WorkoutEntityType {
  return entityType in WORKOUT_ENTITY_ID_FIELDS
}

/**
 * Checks if an entity type is valid (either session or workout domain).
 *
 * @param entityType - The entity type to check
 * @returns true if the entity type is valid
 */
export function isAnyValidEntityType(entityType: string): entityType is AllEntityType {
  return entityType in ALL_ENTITY_ID_FIELDS
}
