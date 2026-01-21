/**
 * Exercise Search API
 *
 * Provides batch exercise library fetch for AI plan generation.
 * Returns exercises with basic info for embedding in prompts.
 *
 * Uses unified search module from lib/exercises for consistent behavior
 * across all search consumers (UI picker, API routes, AI tools).
 */

import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { searchExercises } from '@/lib/exercises'

export async function POST(req: Request) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const dbUserId = await getDbUserId(userId)

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { limit = 100, exercise_type_id, equipment_tags, equipment_tag_ids } = body as {
      limit?: number
      exercise_type_id?: number
      equipment_tags?: string[]
      equipment_tag_ids?: number[]
    }

    // Execute unified search with 'ai' field set for equipment context
    const result = await searchExercises(supabase, {
      exerciseTypeId: exercise_type_id,
      equipmentTagIds: equipment_tag_ids,
      equipmentTags: equipment_tags,
      userId: dbUserId ? String(dbUserId) : undefined,
      limit: Math.min(limit, 200), // Cap at 200 to prevent token overflow
      fields: 'ai', // Include equipment info for AI context
    })

    // Transform to expected format for init pipeline
    const formattedExercises = result.exercises.map((exercise) => ({
      id: String(exercise.id),
      name: exercise.name || 'Unknown',
      description: exercise.description || '',
      // Map exercise type to a simple category for AI context
      exercise_type: exercise.exerciseType?.type ?? null,
      equipment: exercise.equipment ?? [],
      contraindications: exercise.contraindications ?? [],
    }))

    return Response.json({
      exercises: formattedExercises,
      total: result.total,
      filteredByTags: result.debug?.equipmentFilterApplied ?? false,
    })
  } catch (error) {
    console.error('[exercises/search] Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
