import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/users/onboard
 * Upserts a user record and related athlete/coach entries on the server.
 */
export async function POST(req: NextRequest) {
  // Ensure the user is authenticated via Clerk
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth

  // Parse the request body
  const data = await req.json()

  const supabase = createServerSupabaseClient()

  try {
    // Upsert the users row
    const { data: users, error: userError } = await supabase
      .from('users')
      .upsert(
        [{ clerk_id: clerkId, ...data }],
        { onConflict: 'clerk_id' }
      )
      .select('id')

    if (userError) {
      console.error('[API] Error upserting user:', userError)
      return NextResponse.json({ status: 'error', message: userError.message }, { status: 400 })
    }

    const newUserId = users?.[0]?.id
    if (!newUserId) {
      throw new Error('Failed to retrieve user ID')
    }

    // Create athlete record if missing
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', newUserId)
    if (!athletes || athletes.length === 0) {
      await supabase.from('athletes').insert({
        user_id: newUserId,
        height: data.athlete_height || 0,
        weight: data.athlete_weight || 0,
        training_goals: data.athlete_training_goals || '',
        experience: data.athlete_training_history || '',
        events: data.athlete_events || []
      })
    }

    // Create coach record if role is coach
    if (data.role === 'coach') {
      await supabase.from('coaches').insert({
        user_id: newUserId,
        speciality: data.coach_specialization,
        experience: data.coach_experience,
        philosophy: data.coach_philosophy,
        sport_focus: data.coach_sport_focus
      })
    }

    return NextResponse.json({ status: 'success', data: { id: newUserId } }, { status: 200 })

  } catch (error: any) {
    console.error('[API] Unexpected error in onboard:', error)
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }
} 