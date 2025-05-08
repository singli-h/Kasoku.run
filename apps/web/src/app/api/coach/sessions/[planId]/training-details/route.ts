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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  try {
    const { athleteId, presetId, setIndex, fields } = await req.json()

    // Fetch the training session(s) and pick the first one
    const { data: sessions, error: sessErr } = await supabase
      .from('exercise_training_sessions')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('exercise_preset_group_id', planId)
      .limit(1)
    if (sessErr || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const session = sessions[0]

    // Check if a detail already exists (fetch at most one)
    const { data: existingArray, error: existErr } = await supabase
      .from('exercise_training_details')
      .select('id, distance')
      .eq('exercise_training_session_id', session.id)
      .eq('exercise_preset_id', presetId)
      .eq('set_index', setIndex)
      .limit(1)
    if (existErr) {
      return NextResponse.json({ error: existErr.message }, { status: 500 })
    }
    const existingDetail = existingArray && existingArray.length > 0 ? existingArray[0] : null
    if (existingDetail) {
      // Prepare fields for update and fill default distance if missing
      const updateFields: any = { ...fields }
      if (fields.hasOwnProperty('distance') && (updateFields.distance === undefined || updateFields.distance === null)) {
        // fetch default preset distance
        const { data: presetDetails, error: pdErr } = await supabase
          .from('exercise_preset_details')
          .select('distance')
          .eq('exercise_preset_id', presetId)
          .eq('set_index', setIndex)
          .limit(1)
        if (pdErr || !presetDetails || presetDetails.length === 0) {
          return NextResponse.json({ error: pdErr?.message || 'Preset detail not found' }, { status: 500 })
        }
        updateFields.distance = presetDetails[0].distance
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
        const { data: presetDetails, error: pdErr } = await supabase
          .from('exercise_preset_details')
          .select('distance')
          .eq('exercise_preset_id', presetId)
          .eq('set_index', setIndex)
          .limit(1)
        if (pdErr || !presetDetails || presetDetails.length === 0) {
          return NextResponse.json({ error: pdErr?.message || 'Preset detail not found' }, { status: 500 })
        }
        distanceValue = presetDetails[0].distance
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
  let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  try {
    const { athleteId, presetId, setIndex } = await req.json()

    // Fetch the training session(s) and pick the first one
    const { data: sessions, error: sessErr } = await supabase
      .from('exercise_training_sessions')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('exercise_preset_group_id', planId)
      .limit(1)
    if (sessErr || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const session = sessions[0]

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