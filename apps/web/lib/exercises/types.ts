/**
 * Unified Exercise Search Types
 *
 * Type definitions for the exercise search module.
 * Used by all consumers: API routes, server actions, AI tools.
 */

/**
 * Input options for exercise search
 */
export interface ExerciseSearchOptions {
  // === Text Search ===
  /** Search query for name/description (ilike) */
  query?: string

  // === Filters ===
  /** Filter by exercise type ID */
  exerciseTypeId?: number

  /** Filter by equipment tag IDs (OR logic - matches any) */
  equipmentTagIds?: number[]

  /** Filter by equipment tag names (resolved to IDs internally) */
  equipmentTags?: string[]

  /** Exclude exercises with these equipment tag IDs */
  excludeEquipmentTagIds?: number[]

  /** Exclude exercises with these equipment tag names (resolved to IDs internally) */
  excludeEquipmentTags?: string[]

  // === Visibility ===
  /**
   * User ID for visibility rules.
   * - If provided: returns global + user's private exercises
   * - If omitted: returns only global exercises
   */
  userId?: string

  // === Pagination ===
  /** Max results to return (default: 20, max: 200) */
  limit?: number

  /** Offset for pagination (default: 0) */
  offset?: number

  // === Output Control ===
  /** Include total count for pagination (default: true) */
  includeCount?: boolean

  /** Fields to include in response (for performance) */
  fields?: ExerciseFieldSet
}

/**
 * Field sets for different use cases
 *
 * - minimal: id, name only (for dropdowns, autocomplete)
 * - picker: id, name, description, exercise_type (for UI picker)
 * - ai: id, name, description, exercise_type, equipment tags (for AI context)
 * - full: All fields including all tags, video URL, etc.
 */
export type ExerciseFieldSet = 'minimal' | 'picker' | 'ai' | 'full'

/**
 * Exercise type information
 */
export interface ExerciseTypeInfo {
  id: number
  type: string
  description: string | null
}

/**
 * Exercise unit information
 */
export interface ExerciseUnitInfo {
  id: number
  name: string
}

/**
 * Exercise tag information
 */
export interface ExerciseTagInfo {
  id: number
  name: string
  category: string | null
}

/**
 * Single exercise result
 */
export interface ExerciseSearchItem {
  id: number
  name: string
  description: string | null

  // Optional based on field set
  exerciseType?: ExerciseTypeInfo
  /** Equipment tag names */
  equipment?: string[]
  /** Equipment tag IDs */
  equipmentTagIds?: number[]
  videoUrl?: string
  visibility?: 'global' | 'private'
  /** Exercise type ID for quick access */
  exerciseTypeId?: number
  /** Unit ID for quick access */
  unitId?: number
  /** Unit metadata (full field set only) */
  unit?: ExerciseUnitInfo
  /** Owner user ID (full field set only) */
  ownerUserId?: number
  /** Full tag list (full field set only) */
  tags?: ExerciseTagInfo[]
  /** Created timestamp (full field set only) */
  createdAt?: string | null
  /** Updated timestamp (full field set only) */
  updatedAt?: string | null
  /** Archive flag (full field set only) */
  isArchived?: boolean | null
}

/**
 * Paginated search result
 */
export interface ExerciseSearchResult {
  exercises: ExerciseSearchItem[]

  // Pagination metadata
  total: number
  limit: number
  offset: number
  hasMore: boolean

  // Debug info (only in development)
  debug?: ExerciseSearchDebug
}

/**
 * Debug information for search queries
 */
export interface ExerciseSearchDebug {
  queryTimeMs: number
  equipmentFilterApplied: boolean
  resolvedEquipmentTagIds?: number[]
}

/**
 * Error codes for exercise search
 */
export type ExerciseSearchErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'DATABASE_ERROR'
  | 'TAG_RESOLUTION_FAILED'

/**
 * Error result
 */
export interface ExerciseSearchError {
  code: ExerciseSearchErrorCode
  message: string
  details?: unknown
}

/**
 * Equipment tag for filter dropdowns
 */
export interface EquipmentTag {
  id: number
  name: string
}

/**
 * Exercise type for filter dropdowns
 */
export interface ExerciseType {
  id: number
  type: string
  description: string | null
}
