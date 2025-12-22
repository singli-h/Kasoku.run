/**
 * ChangeSet Pattern: Entity ID Field Mappings
 *
 * Maps entity types to their ID field names and provides case conversion utilities.
 * V1 Scope: Coach domain (Training Plans) only.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-entity-model.md
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-transformation-layer.md
 */

import type { SessionEntityType } from './types'

/**
 * Maps entity types to the field name used for entity ID in tool inputs (camelCase).
 *
 * Tool inputs use camelCase field names for AI-friendliness.
 * These map to snake_case database columns during transformation.
 */
export const ENTITY_ID_FIELDS: Record<SessionEntityType, string> = {
  preset_session: 'presetGroupId', // exercise_preset_groups.id
  preset_exercise: 'presetExerciseId', // exercise_presets.id
  preset_set: 'presetDetailId', // exercise_preset_details.id
}

/**
 * Maps entity types to their database table names.
 */
export const ENTITY_TABLE_NAMES: Record<SessionEntityType, string> = {
  preset_session: 'exercise_preset_groups',
  preset_exercise: 'exercise_presets',
  preset_set: 'exercise_preset_details',
}

/**
 * Maps entity types to their parent foreign key field (in database snake_case).
 */
export const ENTITY_PARENT_FIELDS: Record<SessionEntityType, string | null> = {
  preset_session: 'microcycle_id', // Parent is microcycle
  preset_exercise: 'exercise_preset_group_id', // Parent is session
  preset_set: 'exercise_preset_id', // Parent is exercise
}

/**
 * Maps camelCase tool input field names to snake_case database column names.
 * Only includes fields that need conversion (same-case fields omitted).
 */
export const CAMEL_TO_SNAKE_MAP: Record<string, string> = {
  // Session (preset_session) fields
  presetGroupId: 'id',
  userId: 'user_id',
  athleteGroupId: 'athlete_group_id',
  microcycleId: 'microcycle_id',
  sessionMode: 'session_mode',
  isTemplate: 'is_template',
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // Exercise (preset_exercise) fields
  presetExerciseId: 'id',
  exercisePresetGroupId: 'exercise_preset_group_id',
  exerciseId: 'exercise_id',
  presetOrder: 'preset_order',
  supersetId: 'superset_id',

  // Set (preset_set) fields
  presetDetailId: 'id',
  exercisePresetId: 'exercise_preset_id',
  setIndex: 'set_index',
  performingTime: 'performing_time',
  restTime: 'rest_time',
  resistanceUnitId: 'resistance_unit_id',
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
])

/**
 * Fields that identify an entity and should be excluded from proposedData.
 * The ID is stored in entityId, not proposedData.
 */
export const ID_FIELDS = new Set([
  'presetGroupId',
  'presetExerciseId',
  'presetDetailId',
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
 * toSnakeCase('presetOrder') // 'preset_order'
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
 * toCamelCase('preset_order') // 'presetOrder'
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
 * convertKeysToSnakeCase({ exerciseId: 1, presetOrder: 2 })
 * // { exercise_id: 1, preset_order: 2 }
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
 * convertKeysToCamelCase({ exercise_id: 1, preset_order: 2 })
 * // { exerciseId: 1, presetOrder: 2 }
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
 * Gets the database table name for an entity type.
 *
 * @param entityType - The entity type
 * @returns The database table name
 */
export function getEntityTableName(entityType: SessionEntityType): string {
  return ENTITY_TABLE_NAMES[entityType]
}

/**
 * Checks if an entity type is supported.
 *
 * @param entityType - The entity type to check
 * @returns true if the entity type is supported
 */
export function isValidEntityType(entityType: string): entityType is SessionEntityType {
  return entityType in ENTITY_ID_FIELDS
}
