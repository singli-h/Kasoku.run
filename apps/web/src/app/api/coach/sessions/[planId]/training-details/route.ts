import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

export async function POST(req: NextRequest, { params }) {
  const { planId } = params

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
    const { athleteId, presetId, setIndex, fields } = await req.json()

    // Find the training session for this athlete and plan
    const { data: session, error: sessErr } = await supabase
      .from('exercise_training_sessions')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('exercise_preset_group_id', planId)
      .single()
    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if a detail already exists
    const { data: existingDetail, error: existErr } = await supabase
      .from('exercise_training_details')
      .select('id, distance')
      .eq('exercise_training_session_id', session.id)
      .eq('exercise_preset_id', presetId)
      .eq('set_index', setIndex)
      .maybeSingle()
    if (existErr) {
      return NextResponse.json({ error: existErr.message }, { status: 500 })
    }
    if (existingDetail) {
      // Prepare fields for update and fill default distance if missing
      const updateFields: any = { ...fields }
      if (updateFields.distance === undefined || updateFields.distance === null) {
        // fetch default preset distance
        const { data: presetDetail, error: pdErr } = await supabase
          .from('exercise_preset_details')
          .select('distance')
          .eq('exercise_preset_id', presetId)
          .eq('set_index', setIndex)
          .single()
        if (pdErr) {
          return NextResponse.json({ error: pdErr.message }, { status: 500 })
        }
        updateFields.distance = presetDetail?.distance
      }
      // Execute update
      const { error: upErr } = await supabase
        .from('exercise_training_details')
        .update(updateFields)
        .eq('id', existingDetail.id)
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 })
      }
    } else {
      // Insert a new detail row, ensuring default distance is set if not provided
      let distanceValue = fields.distance
      if (distanceValue === undefined || distanceValue === null) {
        // fetch default preset distance
        const { data: presetDetail, error: pdErr } = await supabase
          .from('exercise_preset_details')
          .select('distance')
          .eq('exercise_preset_id', presetId)
          .eq('set_index', setIndex)
          .single()
        if (pdErr) {
          return NextResponse.json({ error: pdErr.message }, { status: 500 })
        }
        distanceValue = presetDetail?.distance
      }
      const insertRow: any = {
        exercise_training_session_id: session.id,
        exercise_preset_id:           presetId,
        set_index:                    setIndex,
        distance:                     distanceValue
      }
      if (fields.duration !== undefined) insertRow.duration = fields.duration
      const { error: insErr } = await supabase
        .from('exercise_training_details')
        .insert(insertRow)
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }
    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }) {
  const { planId } = params

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
    const { athleteId, presetId, setIndex } = await req.json()

    // Find the training session
    const { data: session, error: sessErr } = await supabase
      .from('exercise_training_sessions')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('exercise_preset_group_id', planId)
      .single()
    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete the detail row
    const { error: delErr } = await supabase
      .from('exercise_training_details')
      .delete()
      .eq('exercise_training_session_id', session.id)
      .eq('exercise_preset_id', presetId)
      .eq('set_index', setIndex)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 