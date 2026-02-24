/**
 * ChangeSet Pattern: Read Tool Implementations
 *
 * Server-side implementations for read tools.
 * These fetch data from Supabase and format it for AI consumption.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-tool-definitions.md
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { GetSessionContextInput, SearchExercisesInput } from '../tools'
import { searchExercises } from '@/lib/exercises'

/**
 * Pre-fetched session plan data that can be passed to avoid redundant queries.
 * The route already fetches session_plans for ownership check — pass that here.
 */
export interface PrefetchedSession {
  id: number | string
  name: string | null
  description: string | null
}

/**
 * Session context returned to the AI.
 *
 * Updated to use session_plan naming (post schema migration 2025-Q4).
 */
export interface SessionContext {
  session: {
    id: string
    name: string
    description: string | null
  }
  exercises: Array<{
    id: string
    exerciseId: string
    exerciseName: string
    exerciseOrder: number
    supersetId: string | null
    notes: string | null
    sets: Array<{
      id: string
      setIndex: number
      reps: number | null
      weight: number | null
      rpe: number | null
      restTime: number | null
      tempo: string | null
    }>
  }>
}

/**
 * Exercise search result returned to the AI.
 */
export interface ExerciseSearchResult {
  id: string
  name: string
  description: string | null
  exerciseTypeName: string | null
  contraindications?: string[]
}

/**
 * Executes the getSessionContext read tool.
 *
 * Fetches the session with all exercises and sets.
 *
 * @param input - Tool input parameters
 * @param supabase - Supabase client
 * @returns Session context for AI
 */
export async function executeGetSessionContext(
  input: GetSessionContextInput,
  supabase: SupabaseClient,
  prefetchedSession?: PrefetchedSession
): Promise<SessionContext> {
  const { sessionId } = input

  // Use prefetched session data if available, otherwise fetch from DB
  let session: PrefetchedSession
  if (prefetchedSession) {
    session = prefetchedSession
  } else {
    const { data, error: sessionError } = await supabase
      .from('session_plans')
      .select('id, name, description')
      .eq('id', sessionId)
      .single()

    if (sessionError || !data) {
      throw new Error(`Session not found: ${sessionId}`)
    }
    session = data
  }

  // Fetch exercises with their sets
  const { data: presets, error: presetsError } = await supabase
    .from('session_plan_exercises')
    .select(
      `
      id,
      exercise_id,
      exercise_order,
      superset_id,
      notes,
      exercises!inner (
        id,
        name
      ),
      session_plan_sets (
        id,
        set_index,
        reps,
        weight,
        rpe,
        rest_time,
        tempo
      )
    `
    )
    .eq('session_plan_id', sessionId)
    .order('exercise_order', { ascending: true })

  if (presetsError) {
    console.error('[executeGetSessionContext] Error fetching presets:', presetsError)
    throw new Error('Failed to fetch exercises')
  }

  // Format for AI
  const exercises =
    presets?.map((preset) => {
      // Type assertion for nested data
      const exercise = preset.exercises as unknown as { id: number; name: string }
      const details = preset.session_plan_sets as Array<{
        id: string
        set_index: number
        reps: number | null
        weight: number | null
        rpe: number | null
        rest_time: number | null
        tempo: string | null
      }>

      return {
        id: String(preset.id),
        exerciseId: String(preset.exercise_id),
        exerciseName: exercise?.name ?? 'Unknown',
        exerciseOrder: preset.exercise_order ?? 0,
        supersetId: preset.superset_id,
        notes: preset.notes,
        sets:
          details
            ?.sort((a, b) => a.set_index - b.set_index)
            .map((detail) => ({
              id: String(detail.id),
              setIndex: detail.set_index,
              reps: detail.reps,
              weight: detail.weight,
              rpe: detail.rpe,
              restTime: detail.rest_time,
              tempo: detail.tempo,
            })) ?? [],
      }
    }) ?? []

  return {
    session: {
      id: String(session.id),
      name: session.name ?? '',
      description: session.description,
    },
    exercises,
  }
}

/**
 * Executes the searchExercises read tool.
 *
 * Uses unified search module from lib/exercises for consistent behavior
 * across all search consumers (UI picker, API routes, AI tools).
 *
 * Supports:
 * - Partial text search on name/description
 * - Equipment tag filtering
 * - User's custom exercises (visibility = 'private')
 * - Global exercises (visibility = 'global')
 * - Exercise type info for AI context
 *
 * @param input - Tool input parameters
 * @param supabase - Supabase client
 * @param userId - Optional user ID for visibility filtering
 * @returns Array of matching exercises
 */
export async function executeSearchExercises(
  input: SearchExercisesInput,
  supabase: SupabaseClient,
  userId?: string
): Promise<ExerciseSearchResult[]> {
  const { query, equipment, excludeEquipment, limit = 5 } = input

  // Execute unified search with 'ai' field set for exercise type context
  const result = await searchExercises(supabase, {
    query: query?.trim() || undefined,
    equipmentTags: equipment,
    excludeEquipmentTags: excludeEquipment,
    userId,
    limit,
    fields: 'ai', // Include exercise type for AI context
  })

  // Format results for session assistant
  return result.exercises.map((exercise) => ({
    id: String(exercise.id),
    name: exercise.name ?? 'Unknown Exercise',
    description: exercise.description,
    exerciseTypeName: exercise.exerciseType?.type ?? null,
    contraindications: exercise.contraindications ?? [],
  }))
}

/**
 * Execute a read tool by name.
 *
 * @param toolName - The name of the read tool
 * @param args - Tool arguments
 * @param supabase - Supabase client
 * @param userId - Optional user ID for visibility filtering
 * @returns Tool result
 */
export async function executeReadTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId?: string
): Promise<unknown> {
  switch (toolName) {
    case 'getSessionContext':
      return executeGetSessionContext(args as GetSessionContextInput, supabase)

    case 'searchExercises':
      return executeSearchExercises(args as SearchExercisesInput, supabase, userId)

    default:
      throw new Error(`Unknown read tool: ${toolName}`)
  }
}
