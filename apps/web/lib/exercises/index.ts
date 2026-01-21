/**
 * Unified Exercise Search Module
 *
 * Single source of truth for exercise search across the application.
 * Replaces 4 separate implementations with one consistent module.
 *
 * @module lib/exercises
 */

// Core search function
export { searchExercises, getEquipmentTags, getExerciseTypes } from './search'

// Types
export type {
  ExerciseSearchOptions,
  ExerciseSearchResult,
  ExerciseSearchItem,
  ExerciseSearchError,
  ExerciseSearchErrorCode,
  ExerciseFieldSet,
  ExerciseSearchDebug,
  EquipmentTag,
  ExerciseType,
  ExerciseTypeInfo,
  ExerciseUnitInfo,
  ExerciseTagInfo,
} from './types'

// Constants
export {
  EQUIPMENT_TAG_ALIASES,
  EQUIPMENT_CATEGORY_TO_TAG,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  CACHE_TTL,
  SELECT_FIELDS,
} from './constants'
