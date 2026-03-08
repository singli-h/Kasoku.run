/**
 * Unified Exercise Search Module
 *
 * Single source of truth for exercise search logic.
 * Used by all consumers:
 * - API routes (init pipeline)
 * - Server actions (UI picker)
 * - AI tool handlers (plan generator, session assistant)
 *
 * @example
 * // Basic search
 * const result = await searchExercises(supabase, { query: 'squat' })
 *
 * @example
 * // With equipment filter
 * const result = await searchExercises(supabase, {
 *   equipmentTagIds: [10, 11],  // barbell, dumbbell
 *   userId: 'user_123',
 *   limit: 50
 * })
 *
 * @example
 * // For AI tools (minimal fields, equipment context)
 * const result = await searchExercises(supabase, {
 *   query: 'chest press',
 *   fields: 'ai',
 *   limit: 10
 * })
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ExerciseSearchOptions,
  ExerciseSearchResult,
  ExerciseSearchItem,
  ExerciseFieldSet,
  EquipmentTag,
  ExerciseType,
} from './types'
import {
  EQUIPMENT_TAG_ALIASES,
  MAX_LIMIT,
  DEFAULT_LIMIT,
  SELECT_FIELDS,
} from './constants'

/**
 * Unified exercise search function.
 *
 * Features:
 * - Equipment tag filtering (via exercise_tags junction table)
 * - Text search (ilike on name/description)
 * - Exercise type filtering
 * - Visibility rules (global + user private)
 * - Pagination with total count
 */
export async function searchExercises(
  supabase: SupabaseClient,
  options: ExerciseSearchOptions = {}
): Promise<ExerciseSearchResult> {
  const startTime = Date.now()

  // === Normalize Options ===
  const {
    query,
    exerciseTypeId,
    equipmentTagIds: inputTagIds,
    equipmentTags,
    excludeEquipmentTagIds: inputExcludeTagIds,
    excludeEquipmentTags,
    userId,
    limit = DEFAULT_LIMIT,
    offset = 0,
    includeCount = true,
    fields = 'picker',
  } = options

  const effectiveLimit = Math.min(limit, MAX_LIMIT)

  // === Resolve Equipment Tags (Include) ===
  let resolvedEquipmentTagIds: number[] | null = null

  if (inputTagIds?.length) {
    resolvedEquipmentTagIds = inputTagIds
  } else if (equipmentTags?.length) {
    try {
      resolvedEquipmentTagIds = await resolveEquipmentTagNames(supabase, equipmentTags)
    } catch (err) {
      console.warn('[searchExercises] Tag resolution failed, continuing without filter:', err)
      resolvedEquipmentTagIds = null
    }
  }

  // === Resolve Equipment Tags (Exclude) ===
  let resolvedExcludeTagIds: number[] | undefined = inputExcludeTagIds

  if (excludeEquipmentTags?.length) {
    try {
      const excludeIds = await resolveEquipmentTagNames(supabase, excludeEquipmentTags)
      // Merge with any existing exclude IDs
      resolvedExcludeTagIds = resolvedExcludeTagIds?.length
        ? [...new Set([...resolvedExcludeTagIds, ...excludeIds])]
        : excludeIds
    } catch (err) {
      console.warn('[searchExercises] Exclude tag resolution failed, continuing without:', err)
    }
  }

  // === Get Filtered Exercise IDs (if equipment filter active) ===
  let equipmentFilteredIds: number[] | null = null

  if (resolvedEquipmentTagIds?.length) {
    try {
      equipmentFilteredIds = await getExerciseIdsByEquipmentTags(
        supabase,
        resolvedEquipmentTagIds,
        resolvedExcludeTagIds
      )

      // No matches - return empty result early
      if (equipmentFilteredIds.length === 0) {
        return {
          exercises: [],
          total: 0,
          limit: effectiveLimit,
          offset,
          hasMore: false,
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  queryTimeMs: Date.now() - startTime,
                  equipmentFilterApplied: true,
                  resolvedEquipmentTagIds: resolvedEquipmentTagIds ?? undefined,
                }
              : undefined,
        }
      }
    } catch (err) {
      console.warn('[searchExercises] Equipment filter failed, continuing without:', err)
      equipmentFilteredIds = null
    }
  }

  // === Build Select Fields ===
  const selectFields = SELECT_FIELDS[fields] || SELECT_FIELDS.picker

  // === Build Main Query ===
  let queryBuilder = supabase
    .from('exercises')
    .select(selectFields, { count: includeCount ? 'exact' : undefined })
    .eq('is_archived', false)

  // === Apply Visibility Filter ===
  if (userId) {
    queryBuilder = queryBuilder.or(
      `visibility.eq.global,and(visibility.eq.private,owner_user_id.eq.${userId})`
    )
  } else {
    queryBuilder = queryBuilder.eq('visibility', 'global')
  }

  // === Apply Equipment Filter (pre-computed IDs) ===
  if (equipmentFilteredIds) {
    queryBuilder = queryBuilder.in('id', equipmentFilteredIds)
  }

  // === Apply Text Search ===
  if (query?.trim()) {
    const safeQuery = sanitizeSearchQuery(query)
    if (safeQuery) {
      const searchTerm = `%${safeQuery}%`
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm}`
      )
    }
  }

  // === Apply Exercise Type Filter ===
  if (exerciseTypeId) {
    queryBuilder = queryBuilder.eq('exercise_type_id', exerciseTypeId)
  }

  // === Execute Query ===
  const { data, error, count } = await queryBuilder
    .order('name', { ascending: true })
    .range(offset, offset + effectiveLimit - 1)

  if (error) {
    console.error('[searchExercises] Database error:', error)
    throw new Error(`Exercise search failed: ${error.message}`)
  }

  // === Transform Results ===
  const exercises = transformExercises(data || [], fields)
  const total = count ?? exercises.length

  return {
    exercises,
    total,
    limit: effectiveLimit,
    offset,
    hasMore: offset + effectiveLimit < total,
    debug:
      process.env.NODE_ENV === 'development'
        ? {
            queryTimeMs: Date.now() - startTime,
            equipmentFilterApplied: !!resolvedEquipmentTagIds?.length,
            resolvedEquipmentTagIds: resolvedEquipmentTagIds ?? undefined,
          }
        : undefined,
  }
}

/**
 * Get all equipment tags for filter dropdowns.
 * Cached at the React Query level with 1 hour stale time.
 */
export async function getEquipmentTags(
  supabase: SupabaseClient
): Promise<EquipmentTag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name')
    .eq('category', 'equipment')
    .order('name', { ascending: true })

  if (error) {
    console.error('[getEquipmentTags] Database error:', error)
    throw new Error('Failed to fetch equipment tags')
  }

  // Filter out null names and return typed result
  return (data || [])
    .filter((tag): tag is { id: number; name: string } => tag.name !== null)
    .map((tag) => ({ id: tag.id, name: tag.name }))
}

/**
 * Get all exercise types for filter dropdowns.
 * Cached at the React Query level with 1 hour stale time.
 */
export async function getExerciseTypes(
  supabase: SupabaseClient
): Promise<ExerciseType[]> {
  const { data, error } = await supabase
    .from('exercise_types')
    .select('id, type, description')
    .order('type', { ascending: true })

  if (error) {
    console.error('[getExerciseTypes] Database error:', error)
    throw new Error('Failed to fetch exercise types')
  }

  return (data || []).map((et) => ({
    id: et.id,
    type: et.type,
    description: et.description,
  }))
}

// === Helper Functions ===

/**
 * Resolve equipment tag names to IDs, with alias support.
 * Expands aliases like "dumbbells" to match "dumbbell" tag.
 */
async function resolveEquipmentTagNames(
  supabase: SupabaseClient,
  tagNames: string[]
): Promise<number[]> {
  // Expand aliases (e.g., "dumbbells" → ["dumbbell", "dumbbells"])
  const expandedNames = tagNames.flatMap((name) => {
    const normalized = name.trim().toLowerCase()
    return EQUIPMENT_TAG_ALIASES[normalized] ?? [normalized]
  })

  const uniqueNames = [...new Set(expandedNames)]

  const { data, error } = await supabase
    .from('tags')
    .select('id')
    .eq('category', 'equipment')
    .in('name', uniqueNames)

  if (error) {
    console.error('[searchExercises] Tag resolution error:', error)
    throw new Error('Failed to resolve equipment tags')
  }

  return (data || []).map((t) => t.id)
}

/**
 * Get exercise IDs that have specific equipment tags.
 * Two-phase query: get matching exercise IDs, then filter out exclusions.
 */
async function getExerciseIdsByEquipmentTags(
  supabase: SupabaseClient,
  includeTagIds: number[],
  excludeTagIds?: number[]
): Promise<number[]> {
  // Get exercises that have ANY of the included tags
  const { data: includeData, error: includeError } = await supabase
    .from('exercise_tags')
    .select('exercise_id')
    .in('tag_id', includeTagIds)

  if (includeError) {
    console.error('[searchExercises] Include tag lookup error:', includeError)
    throw new Error('Failed to filter by equipment tags')
  }

  let exerciseIds = new Set(
    (includeData || [])
      .map((row) => row.exercise_id)
      .filter((id): id is number => id !== null)
  )

  // Exclude exercises that have ANY of the excluded tags
  if (excludeTagIds?.length && exerciseIds.size > 0) {
    const { data: excludeData, error: excludeError } = await supabase
      .from('exercise_tags')
      .select('exercise_id')
      .in('tag_id', excludeTagIds)
      .in('exercise_id', [...exerciseIds])

    if (excludeError) {
      console.error('[searchExercises] Exclude tag lookup error:', excludeError)
      // Non-fatal - continue without exclusion
    } else {
      const excludeIds = new Set((excludeData || []).map((row) => row.exercise_id))
      exerciseIds = new Set([...exerciseIds].filter((id) => !excludeIds.has(id)))
    }
  }

  return [...exerciseIds]
}

/**
 * Sanitize search query to prevent PostgREST injection.
 * Removes characters that break or(...) filters.
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[(),]/g, ' ') // Remove characters that break or(...) filters
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Transform raw database results to typed ExerciseSearchItem.
 * Handles different field sets and normalizes the output.
 */
function transformExercises(
  data: any[],
  fields: ExerciseFieldSet
): ExerciseSearchItem[] {
  return data.map((row) => {
    const item: ExerciseSearchItem = {
      id: row.id,
      name: row.name ?? 'Unknown Exercise',
      description: row.description ?? null,
    }

    if (fields !== 'minimal') {
      if (row.exercise_type) {
        item.exerciseType = {
          id: row.exercise_type.id,
          type: row.exercise_type.type,
          description: row.exercise_type.description ?? null,
        }
      }

      if (row.exercise_type_id) {
        item.exerciseTypeId = row.exercise_type_id
      }

      if (row.video_url) {
        item.videoUrl = row.video_url
      }

      if (row.visibility) {
        item.visibility = row.visibility
      }
    }

    const tagRows = row.tags || []
    const tags: Array<{ id: number; name?: string | null; category?: string | null }> = tagRows
      .map((t: any) => t.tag)
      .filter(
        (tag: any): tag is { id: number; name?: string | null; category?: string | null } =>
          Boolean(tag && typeof tag.id === 'number')
      )

    if (fields === 'full') {
      if (row.unit) {
        item.unit = {
          id: row.unit.id,
          name: row.unit.name ?? 'Unknown',
        }
      }
      if (typeof row.unit_id === 'number') {
        item.unitId = row.unit_id
      }
      if (typeof row.owner_user_id === 'number') {
        item.ownerUserId = row.owner_user_id
      }
      item.tags = tags.map((tag) => ({
        id: tag.id,
        name: tag.name ?? 'Unknown',
        category: tag.category ?? null,
      }))
      item.createdAt = row.created_at ?? null
      item.updatedAt = row.updated_at ?? null
      item.isArchived = row.is_archived ?? null
    }

    // Extract equipment tags for 'ai' and 'full' field sets
    if ((fields === 'ai' || fields === 'full') && tags.length > 0) {
      const equipmentTags = tags.filter((tag) => tag.category === 'equipment')
      const contraindicationTags = tags.filter((tag) => tag.category === 'contraindication')

      item.equipment = equipmentTags
        .map((t) => t.name)
        .filter((name): name is string => Boolean(name))
      item.equipmentTagIds = equipmentTags
        .map((t) => t.id)
        .filter((id): id is number => typeof id === 'number')

      item.contraindications = contraindicationTags
        .map((t) => t.name)
        .filter((name): name is string => Boolean(name))
      item.contraindicationTagIds = contraindicationTags
        .map((t) => t.id)
        .filter((id): id is number => typeof id === 'number')
    }

    return item
  })
}
