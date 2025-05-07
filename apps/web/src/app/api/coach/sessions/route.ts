import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

export async function GET(req: NextRequest) {
  // Authenticate coach
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('exercise_preset_groups')
    .select(
      `
      id,
      athlete_group_id,
      group_name:athlete_groups(group_name),
      name,
      week,
      day,
      date,
      session_mode,
      exercise_presets (
        id,
        exercise_id,
        exercises!inner ( exercise_type_id, name ),
        exercise_preset_details ( id, set_index, distance )
      ),
      exercise_training_sessions (
        id,
        athlete_id,
        status,
        session_mode,
        exercise_training_details (
          id,
          exercise_preset_id,
          set_index,
          distance,
          duration
        )
      )
      `
    )
    .eq('coach_id', coachId)
    .eq('session_mode', 'group')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ sessions: data || [] })
}

export async function POST(req: NextRequest) {
  // Authenticate coach
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  try {
    const { name, description, week, day, date, athleteGroupId, sessionMode } = await req.json()
    // Validate required fields
    if (!name || !date || !sessionMode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert new session as exercise_preset_group
    const { data: session, error } = await supabase
      .from('exercise_preset_groups')
      .insert({
        name,
        description: description || null,
        week: week ?? null,
        day: day ?? null,
        date,
        coach_id: coachId,
        athlete_group_id: athleteGroupId || null,
        session_mode: sessionMode
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 