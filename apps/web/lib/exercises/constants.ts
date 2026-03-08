/**
 * Unified Exercise Search Constants
 *
 * Constants for the exercise search module.
 * Includes equipment tag aliases, pagination limits, and cache configuration.
 */

/**
 * Equipment tag name aliases for fuzzy matching.
 *
 * Allows users to search with variations like "dumbbells" and match "dumbbell" tag.
 * Based on the canonical equipment categories from types/training.ts:
 * - bodyweight, dumbbells, barbell, kettlebells, cables, machines, bench
 */
export const EQUIPMENT_TAG_ALIASES: Record<string, string[]> = {
  // Primary categories (match wizard)
  bodyweight: ['bodyweight'],
  dumbbells: ['dumbbell', 'dumbbells'],
  dumbbell: ['dumbbell', 'dumbbells'],
  barbell: ['barbell', 'barbells'],
  barbells: ['barbell', 'barbells'],
  kettlebells: ['kettlebell', 'kettlebells'],
  kettlebell: ['kettlebell', 'kettlebells'],
  cables: ['cable', 'cables'],
  cable: ['cable', 'cables'],
  machines: ['machine', 'machines'],
  machine: ['machine', 'machines'],
  bench: ['bench'],

  // Additional equipment (not in wizard but in DB)
  'resistance band': ['resistance band'],
  'resistance bands': ['resistance band'],
  'pull-up bar': ['pull-up bar', 'bodyweight'], // Map to bodyweight as accessory
  'pullup bar': ['pull-up bar', 'bodyweight'],
  'medicine ball': ['medicine ball'],

  // Track & Field specific equipment
  hurdles: ['hurdles'],
  hurdle: ['hurdles'],
  cones: ['cones'],
  cone: ['cones'],
  markers: ['cones'], // Alias for cones
  'agility ladder': ['agility ladder'],
  ladder: ['agility ladder'],
  'plyo box': ['plyo box'],
  'plyometric box': ['plyo box'],
  box: ['plyo box'],
  sled: ['sled'],
  'sprint sled': ['sled'],
  'prowler': ['sled'],
  'starting blocks': ['starting blocks'],
  blocks: ['starting blocks'],
}

/**
 * Maps wizard equipment category IDs to database tag names.
 * Used when converting user equipment preferences to search filters.
 */
export const EQUIPMENT_CATEGORY_TO_TAG: Record<string, string> = {
  bodyweight: 'bodyweight',
  dumbbells: 'dumbbell',
  barbell: 'barbell',
  kettlebells: 'kettlebell',
  cables: 'cable',
  machines: 'machine',
  bench: 'bench',
}

/**
 * Default pagination limit
 */
export const DEFAULT_LIMIT = 20

/**
 * Maximum pagination limit (to prevent excessive queries)
 */
export const MAX_LIMIT = 200

/**
 * Cache TTLs for React Query or similar caching layers
 */
export const CACHE_TTL = {
  /** Equipment tags rarely change - 1 hour */
  EQUIPMENT_TAGS: 60 * 60 * 1000,
  /** Exercise types rarely change - 1 hour */
  EXERCISE_TYPES: 60 * 60 * 1000,
  /** Search results - 5 minutes */
  SEARCH_RESULTS: 5 * 60 * 1000,
} as const

/**
 * Select field configurations for different use cases.
 * Optimizes database queries by only fetching needed fields.
 */
export const SELECT_FIELDS = {
  minimal: 'id, name',

  picker: `
    id,
    name,
    description,
    video_url,
    exercise_type_id,
    visibility,
    exercise_type:exercise_types(id, type, description)
  `.trim(),

  ai: `
    id,
    name,
    description,
    exercise_type_id,
    exercise_type:exercise_types(id, type),
    tags:exercise_tags(
      tag:tags(id, name, category)
    )
  `.trim(),

  full: `
    id,
    name,
    description,
    video_url,
    exercise_type_id,
    unit_id,
    created_at,
    updated_at,
    is_archived,
    visibility,
    owner_user_id,
    exercise_type:exercise_types(id, type, description),
    unit:units(id, name),
    tags:exercise_tags(
      tag:tags(id, name, category)
    )
  `.trim(),
} as const
