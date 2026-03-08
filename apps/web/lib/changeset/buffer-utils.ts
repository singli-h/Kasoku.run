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
 * Format: "temp-{uuid}" where the UUID portion IS the real database ID.
 *
 * @see specs/009-changeset-prompt-alignment/references/20260107-concept-changeset-transformation-layer.md
 */
const TEMP_ID_PREFIX = 'temp-'

/**
 * Creates a buffer key for storing a ChangeRequest.
 *
 * Key format: "{entityType}:{entityId}"
 *
 * @param entityType - The type of entity (e.g., "session_plan_exercise")
 * @param entityId - The entity's ID (real or temporary)
 * @returns A composite key for the buffer Map
 *
 * @example
 * makeBufferKey('session_plan_exercise', '123')
 * // Returns: "session_plan_exercise:123"
 *
 * @example
 * makeBufferKey('session_plan_exercise', 'temp-550e8400-e29b-41d4-a716-446655440000')
 * // Returns: "session_plan_exercise:temp-550e8400-e29b-41d4-a716-446655440000"
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
 * parseBufferKey('session_plan_exercise:123')
 * // Returns: { entityType: 'session_plan_exercise', entityId: '123' }
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
 *
 * Format: "temp-{uuid}" where the UUID portion IS the real database ID.
 * During execution, strip the "temp-" prefix to get the actual ID to use.
 *
 * @returns A unique temporary ID (e.g., "temp-550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * generateTempId() // "temp-550e8400-e29b-41d4-a716-446655440000"
 *
 * @see specs/009-changeset-prompt-alignment/references/20260107-concept-changeset-transformation-layer.md
 */
export function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`
}

/**
 * Checks if an ID is a temporary ID (not yet persisted to database).
 *
 * @param id - The ID to check
 * @returns true if the ID is a temporary ID (starts with "temp-")
 *
 * @example
 * isTempId('temp-550e8400-e29b-41d4-a716-446655440000') // true
 * isTempId('550e8400-e29b-41d4-a716-446655440000') // false
 * isTempId(null) // false
 */
export function isTempId(id: string | null | undefined): boolean {
  return id !== null && id !== undefined && id.startsWith(TEMP_ID_PREFIX)
}

/**
 * Strips the temp- prefix from a temporary ID to get the real database ID.
 *
 * @param tempId - The temporary ID (e.g., "temp-550e8400-...")
 * @returns The real ID (e.g., "550e8400-...")
 *
 * @example
 * stripTempPrefix('temp-550e8400-e29b-41d4-a716-446655440000')
 * // Returns: '550e8400-e29b-41d4-a716-446655440000'
 *
 * @see specs/009-changeset-prompt-alignment/references/20260107-concept-changeset-transformation-layer.md
 */
export function stripTempPrefix(tempId: string): string {
  return tempId.replace(/^temp-/, '')
}

/**
 * @deprecated No longer needed - temp IDs are now UUID-based and don't use a counter.
 * Kept for backward compatibility.
 */
export function resetTempIdCounter(): void {
  // No-op: UUID-based temp IDs don't require counter reset
}

/**
 * @deprecated No longer needed - temp IDs are now UUID-based and don't use a counter.
 * Kept for backward compatibility.
 */
export function getTempIdCounter(): number {
  return 0 // Always returns 0 as counter is no longer used
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
 * getEntityTypeFromKey('session_plan_exercise:123')
 * // Returns: 'session_plan_exercise'
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
 * getEntityIdFromKey('session_plan_exercise:123')
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
