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

/**
 * Session context returned to the AI.
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
    presetOrder: number
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
  supabase: SupabaseClient
): Promise<SessionContext> {
  const { sessionId } = input

  // Fetch session (preset_group)
  const { data: session, error: sessionError } = await supabase
    .from('session_plans')
    .select('id, name, description')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error(`Session not found: ${sessionId}`)
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
        id: number
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
        presetOrder: preset.exercise_order ?? 0,
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
 * Searches the exercise library by name.
 *
 * @param input - Tool input parameters
 * @param supabase - Supabase client
 * @returns Array of matching exercises
 */
export async function executeSearchExercises(
  input: SearchExercisesInput,
  supabase: SupabaseClient
): Promise<ExerciseSearchResult[]> {
  const { query, muscleGroups, equipment, limit = 5 } = input

  // Start building query - simple select without complex joins
  let queryBuilder = supabase
    .from('exercises')
    .select('id, name, description, exercise_type_id')
    .eq('is_archived', false)
    .limit(limit)

  // Full-text search on name
  if (query) {
    // Use ilike for simple search (could be enhanced with tsquery)
    queryBuilder = queryBuilder.ilike('name', `%${query}%`)
  }

  // Execute query
  const { data, error } = await queryBuilder

  if (error) {
    console.error('[executeSearchExercises] Error:', error)
    throw new Error('Failed to search exercises')
  }

  // Format results
  return (
    data?.map((exercise) => ({
      id: String(exercise.id),
      name: exercise.name ?? 'Unknown Exercise',
      description: exercise.description,
      exerciseTypeName: null, // Simplified - skip type lookup for now
    })) ?? []
  )
}

/**
 * Execute a read tool by name.
 *
 * @param toolName - The name of the read tool
 * @param args - Tool arguments
 * @param supabase - Supabase client
 * @returns Tool result
 */
export async function executeReadTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (toolName) {
    case 'getSessionContext':
      return executeGetSessionContext(args as GetSessionContextInput, supabase)

    case 'searchExercises':
      return executeSearchExercises(args as SearchExercisesInput, supabase)

    default:
      throw new Error(`Unknown read tool: ${toolName}`)
  }
}
