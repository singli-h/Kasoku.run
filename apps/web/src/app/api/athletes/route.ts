import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

export async function GET(req: NextRequest) {
  // Ensure the request is from an authenticated coach
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  // Get this coach's group IDs
  const { data: groups, error: groupErr } = await supabase
    .from('athlete_groups')
    .select('id')
    .eq('coach_id', coachId)
  if (groupErr) {
    return NextResponse.json({ status: 'error', message: groupErr.message }, { status: 500 })
  }
  const groupIds = groups.map(g => g.id)

  // Fetch athletes with nested user and group data
  const { data: rawData, error } = await supabase
    .from('athletes')
    .select(
      `
      id,
      height,
      weight,
      training_goals,
      experience,
      events,
      athlete_group_id,
      user:users!athletes_user_id_fkey(id, first_name, last_name, avatar_url, email, created_at),
      group:athlete_groups!athletes_athlete_group_id_fkey(id, group_name)
    `
    )
    .in('athlete_group_id', groupIds)

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }

  // Normalize data array and add default status
  const athletesData = (rawData ?? []).map((a) => ({
    ...a,
    status: 'active',
  }))

  return NextResponse.json({ status: 'success', data: athletesData }, { status: 200 })
}

// POST /api/athletes: invite existing athlete by email to a group
export async function POST(req: NextRequest) {
  // Ensure the request is from an authenticated coach
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const { email, athleteGroupId, message } = await req.json()
  if (!email || !athleteGroupId) {
    return NextResponse.json({ status: 'error', message: 'Missing email or group ID' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Verify the group belongs to this coach
  const { data: grp, error: grpErr } = await supabase
    .from('athlete_groups')
    .select('id')
    .eq('coach_id', coachId)
    .eq('id', Number(athleteGroupId))
    .single()
  if (grpErr || !grp) {
    return NextResponse.json({ status: 'error', message: 'Invalid group' }, { status: 404 })
  }

  // Find the user record by email
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  if (userErr) {
    return NextResponse.json({ status: 'error', message: userErr.message }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Athlete not registered' }, { status: 404 })
  }

  // Find existing athlete record
  const { data: athleteRec, error: athleteErr } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (athleteErr || !athleteRec) {
    return NextResponse.json({ status: 'error', message: 'Athlete record not found' }, { status: 404 })
  }

  // Update athlete's group assignment
  const { error: updErr } = await supabase
    .from('athletes')
    .update({ athlete_group_id: Number(athleteGroupId) })
    .eq('id', athleteRec.id)
  if (updErr) {
    return NextResponse.json({ status: 'error', message: updErr.message }, { status: 500 })
  }

  // Record assignment history
  const { error: historyErr } = await supabase
    .from('athlete_group_histories')
    .insert({
      athlete_id: athleteRec.id,
      group_id: Number(athleteGroupId),
      created_by: coachId,
      notes: message || 'Added via coach invitation'
    })
  if (historyErr) {
    console.error('History record error:', historyErr)
  }

  return NextResponse.json({ status: 'success', data: athleteRec }, { status: 200 })
} 