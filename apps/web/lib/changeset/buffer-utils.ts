/**
 * ChangeSet Pattern: Buffer Key Utilities
 *
 * Utilities for managing the keyed buffer that stores ChangeRequests.
 * The buffer uses a Map with composite keys for upsert (last-write-wins) semantics.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 2
 */

import type { BufferKey } from './types'

/**
 * Prefix used for temporary IDs assigned to new entities before database insertion.
 */
const TEMP_ID_PREFIX = 'temp_'

/**
 * Counter for generating unique temporary IDs within a session.
 * Reset when the buffer is cleared.
 */
let tempIdCounter = 0

/**
 * Creates a buffer key for storing a ChangeRequest.
 *
 * Key format: "{entityType}:{entityId}"
 *
 * @param entityType - The type of entity (e.g., "preset_exercise")
 * @param entityId - The entity's ID (real or temporary)
 * @returns A composite key for the buffer Map
 *
 * @example
 * makeBufferKey('preset_exercise', '123')
 * // Returns: "preset_exercise:123"
 *
 * @example
 * makeBufferKey('preset_exercise', 'temp_001')
 * // Returns: "preset_exercise:temp_001"
 */
export function makeBufferKey(entityType: string, entityId: string): BufferKey {
  return `${entityType}:${entityId}` as BufferKey
}

/**
 * Parses a buffer key back into its components.
 *
 * @param key - The buffer key to parse
 * @returns Object with entityType and entityId
 *
 * @example
 * parseBufferKey('preset_exercise:123')
 * // Returns: { entityType: 'preset_exercise', entityId: '123' }
 */
export function parseBufferKey(key: BufferKey): {
  entityType: string
  entityId: string
} {
  const colonIndex = key.indexOf(':')
  if (colonIndex === -1) {
    throw new Error(`Invalid buffer key format: ${key}`)
  }

  return {
    entityType: key.slice(0, colonIndex),
    entityId: key.slice(colonIndex + 1),
  }
}

/**
 * Generates a temporary ID for new entities.
 * Temp IDs are used in the buffer before the entity is persisted to the database.
 *
 * @returns A unique temporary ID (e.g., "temp_001", "temp_002")
 *
 * @example
 * generateTempId() // "temp_001"
 * generateTempId() // "temp_002"
 */
export function generateTempId(): string {
  tempIdCounter += 1
  return `${TEMP_ID_PREFIX}${tempIdCounter.toString().padStart(3, '0')}`
}

/**
 * Checks if an ID is a temporary ID (not yet persisted to database).
 *
 * @param id - The ID to check
 * @returns true if the ID is a temporary ID
 *
 * @example
 * isTempId('temp_001') // true
 * isTempId('123') // false
 * isTempId(null) // false
 */
export function isTempId(id: string | null | undefined): boolean {
  return id !== null && id !== undefined && id.startsWith(TEMP_ID_PREFIX)
}

/**
 * Resets the temporary ID counter.
 * Should be called when the buffer is completely cleared.
 */
export function resetTempIdCounter(): void {
  tempIdCounter = 0
}

/**
 * Gets the current temp ID counter value (for debugging/testing).
 *
 * @returns The current counter value
 */
export function getTempIdCounter(): number {
  return tempIdCounter
}

/**
 * Generates a unique ID for a ChangeRequest.
 * Uses a combination of timestamp and random string.
 *
 * @returns A unique ChangeRequest ID
 */
export function generateChangeRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `cr_${timestamp}_${random}`
}

/**
 * Generates a unique ID for a ChangeSet.
 * Uses a combination of timestamp and random string.
 *
 * @returns A unique ChangeSet ID
 */
export function generateChangeSetId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `cs_${timestamp}_${random}`
}

/**
 * Extracts the entity type from a buffer key.
 *
 * @param key - The buffer key
 * @returns The entity type portion of the key
 *
 * @example
 * getEntityTypeFromKey('preset_exercise:123')
 * // Returns: 'preset_exercise'
 */
export function getEntityTypeFromKey(key: BufferKey): string {
  return parseBufferKey(key).entityType
}

/**
 * Extracts the entity ID from a buffer key.
 *
 * @param key - The buffer key
 * @returns The entity ID portion of the key
 *
 * @example
 * getEntityIdFromKey('preset_exercise:123')
 * // Returns: '123'
 */
export function getEntityIdFromKey(key: BufferKey): string {
  return parseBufferKey(key).entityId
}

/**
 * Sorts ChangeRequests by execution order.
 * Lower execution order values come first.
 *
 * @param requests - Array of objects with executionOrder property
 * @returns Sorted array (new array, does not mutate input)
 */
export function sortByExecutionOrder<T extends { executionOrder: number }>(
  requests: T[]
): T[] {
  return [...requests].sort((a, b) => a.executionOrder - b.executionOrder)
}
