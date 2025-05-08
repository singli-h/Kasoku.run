import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

export async function POST(req: NextRequest, { params }) {
  const { planId } = params

  // Authenticate coach
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult
  let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()

  // Fetch the plan to ensure it belongs to this coach and get group
  const { data: plan, error: planErr } = await supabase
    .from('exercise_preset_groups')
    .select('athlete_group_id')
    .eq('id', planId)
    .eq('coach_id', coachId)
    .single()
  if (planErr || !plan) {
    return NextResponse.json({ status: 'error', message: 'Plan not found or forbidden' }, { status: 404 })
  }

  // Get group athletes
  const { data: athletes, error: athErr } = await supabase
    .from('athletes')
    .select('id')
    .eq('athlete_group_id', plan.athlete_group_id)
  if (athErr) {
    return NextResponse.json({ status: 'error', message: athErr.message }, { status: 500 })
  }

  // Upsert sessions: insert new or update existing to keep one per athlete/plan
  const rows = athletes.map(a => ({
    athlete_id: a.id,
    athlete_group_id: plan.athlete_group_id,
    exercise_preset_group_id: planId,
    session_mode: 'group',
    date_time: new Date().toISOString(),
    status: 'pending'
  }))
  const { error: upsertErr } = await supabase
    .from('exercise_training_sessions')
    .upsert(rows, { onConflict: 'athlete_id,exercise_preset_group_id' })
  if (upsertErr) {
    return NextResponse.json({ status: 'error', message: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'success' }, { status: 200 })
} 