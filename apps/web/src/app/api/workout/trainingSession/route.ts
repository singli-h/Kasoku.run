import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

/**
 * POST /api/workout/trainingSession
 * Creates exercise_training_details from presets and marks session as 'ongoing'
 */
export async function POST(req: NextRequest) {
  // Enforce authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult

  // Resolve athlete ID
  let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { athleteId } = roleData

  const supabase = createServerSupabaseClient()
  const { exercise_training_session_id: sessionId } = await req.json()

  // Validate session belongs to athlete and get preset group
  const { data: sessionRow, error: sessionError } = await supabase
    .from('exercise_training_sessions')
    .select('athlete_id, exercise_preset_group_id')
    .eq('id', sessionId)
    .single()
  if (sessionError || !sessionRow || sessionRow.athlete_id !== athleteId) {
    return NextResponse.json({ success: false, message: sessionError?.message || 'Session not found or forbidden' }, { status: 404 })
  }

  // Fetch associated presets
  const { data: presets, error: presetsError } = await supabase
    .from('exercise_presets')
    .select('id')
    .eq('exercise_preset_group_id', sessionRow.exercise_preset_group_id)
  if (presetsError) {
    return NextResponse.json({ success: false, message: presetsError.message }, { status: 500 })
  }
  const presetIds = presets.map(p => p.id)

  // Fetch preset details
  const { data: presetDetails, error: detailsError } = await supabase
    .from('exercise_preset_details')
    .select('*')
    .in('exercise_preset_id', presetIds)
  if (detailsError) {
    return NextResponse.json({ success: false, message: detailsError.message }, { status: 500 })
  }

  // Map to training details rows
  const trainingDetails = presetDetails.map(d => ({
    exercise_training_session_id: sessionId,
    exercise_preset_id: d.exercise_preset_id,
    set_number: d.set_index ?? d.set_number,
    reps: d.reps,
    resistance: d.resistance,
    resistance_unit_id: d.resistance_unit_id,
    distance: d.distance,
    duration: d.performing_time ?? d.duration,
    tempo: d.tempo,
    power: d.power,
    velocity: d.velocity,
    completed: false
  }))

  const { error: insertError } = await supabase
    .from('exercise_training_details')
    .insert(trainingDetails)
  if (insertError) {
    return NextResponse.json({ success: false, message: insertError.message }, { status: 500 })
  }

  // Update session status to ongoing
  const { error: updateError } = await supabase
    .from('exercise_training_sessions')
    .update({ status: 'ongoing' })
    .eq('id', sessionId)
  if (updateError) {
    return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * PUT /api/workout/trainingSession
 * Updates existing training details and optionally session status
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult

  const supabase = createServerSupabaseClient()
  const { exercise_training_session_id: sessionId, exercisesDetail, status } = await req.json()

  // Prepare detail updates
  const updates = exercisesDetail.map(detail => ({
    id: detail.id,
    reps: detail.reps,
    resistance: detail.weight ?? detail.resistance_value,
    power: detail.power,
    velocity: detail.velocity,
    completed: detail.completed
  }))

  // Upsert training detail updates
  const { error: upsertError } = await supabase
    .from('exercise_training_details')
    .upsert(updates, { onConflict: 'id' })
  if (upsertError) {
    return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })
  }

  // Update session status if provided
  if (status) {
    const { error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .update({ status })
      .eq('id', sessionId)
    if (sessionError) {
      return NextResponse.json({ success: false, message: sessionError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
} 