import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/plans/preset-groups/:id
 * Retrieve a single preset group along with its presets and details.
 *
 * PUT /api/plans/preset-groups/:id
 * Update the group metadata, presets, and preset details.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  // Retrieve role data: prefer header, but ensure we have coachId
  let roleData = getRoleDataFromHeader(req) ?? await getUserRoleData(clerkId);
  // If header-only data lacked coachId (e.g. athlete), fetch full role data
  if (roleData.coachId === undefined) {
    roleData = await getUserRoleData(clerkId);
  }
  const { role, coachId } = roleData;
  // Allow coaches and athletes to access individual preset groups
  if (role !== 'coach' && role !== 'athlete') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const groupId = params.id;
  const supabase = createServerSupabaseClient();

  // 1) Fetch group metadata
  const { data: group, error: gErr } = await supabase
    .from('exercise_preset_groups')
    .select('*')
    .eq('id', groupId)
    .eq('coach_id', coachId)
    .single();
  if (gErr || !group) {
    return NextResponse.json({ status: 'error', message: 'Group not found' }, { status: 404 });
  }

  // 2) Fetch presets with nested exercise and details
  const { data: presets, error: pErr } = await supabase
    .from('exercise_presets')
    .select(
      `*, exercises ( id, name, description, exercise_types ( type ) ), exercise_preset_details (*)`
    )
    .eq('exercise_preset_group_id', group.id)
    .order('preset_order')
    .order('order');
  if (pErr) {
    console.error('Error fetching presets:', pErr);
    return NextResponse.json({ status: 'error', message: pErr?.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success', data: { group, presets } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  // Retrieve role data: prefer header, but ensure we have coachId
  let roleData = getRoleDataFromHeader(req) ?? await getUserRoleData(clerkId);
  // If header-only data lacked coachId (e.g. athlete), fetch full role data
  if (roleData.coachId === undefined) {
    roleData = await getUserRoleData(clerkId);
  }
  const { role, coachId } = roleData;
  // Allow coaches and athletes to access individual preset groups
  if (role !== 'coach' && role !== 'athlete') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const groupId = params.id;
  const supabase = createServerSupabaseClient();

  try {
    const body = await req.json();
    const { name, description, date, sessionMode, athleteGroupId, presets = [] } = body;

    // 1) Update group metadata
    const { data: updatedGroup, error: uErr } = await supabase
      .from('exercise_preset_groups')
      .update({
        name,
        description: description || null,
        date: date || null,
        session_mode: sessionMode || 'individual',
        athlete_group_id: athleteGroupId || null
      })
      .eq('id', groupId)
      .select()
      .single();
    if (uErr) {
      console.error('Error updating group:', uErr);
      return NextResponse.json({ status: 'error', message: uErr?.message }, { status: 500 });
    }

    // 2) Delete existing presets and details
    const { data: existingPresets } = await supabase
      .from('exercise_presets')
      .select('id')
      .eq('exercise_preset_group_id', groupId);
    const presetIds = existingPresets?.map(p => p.id) || [];

    if (presetIds.length) {
      await supabase
        .from('exercise_preset_details')
        .delete()
        .in('exercise_preset_id', presetIds);

      await supabase
        .from('exercise_presets')
        .delete()
        .eq('exercise_preset_group_id', groupId);
    }

    // 3) Insert new presets
    let insertedPresets: any[] = [];
    if (presets.length) {
      const presetRecords = presets.map((p: any, idx: number) => ({
        exercise_preset_group_id: groupId,
        exercise_id: p.exercise_id || p.exerciseId,
        superset_id: p.superset_id || p.supersetId || null,
        preset_order: p.preset_order !== undefined ? p.preset_order : idx,
        notes: p.notes || null
      }));

      const { data: ip, error: ipErr } = await supabase
        .from('exercise_presets')
        .insert(presetRecords)
        .select();
      if (ipErr) throw ipErr;
      insertedPresets = ip || [];
    }

    // 4) Insert new preset details
    const detailRecords: any[] = [];
    presets.forEach((p: any, idx: number) => {
      const inserted = insertedPresets[idx];
      if (inserted?.id && Array.isArray(p.presetDetails)) {
        p.presetDetails.forEach((d: any) => {
          detailRecords.push({
            exercise_preset_id: inserted.id,
            set_index: d.set_number || d.setNumber,
            reps: d.reps,
            weight: d.weight,
            resistance: d.resistance,
            resistance_unit_id: d.resistance_unit_id || d.resistanceUnitId,
            distance: d.distance,
            height: d.height,
            tempo: d.tempo,
            rest_time: d.rest_time,
            power: d.power,
            velocity: d.velocity,
            effort: d.effort,
            performing_time: d.performing_time,
            metadata: d.metadata
          });
        });
      }
    });
    if (detailRecords.length) {
      const { error: idErr } = await supabase
        .from('exercise_preset_details')
        .insert(detailRecords);
      if (idErr) throw idErr;
    }

    // 5) Return updated group
    return NextResponse.json({ status: 'success', data: { group: updatedGroup } });
  } catch (err: any) {
    console.error('Error in PUT /preset-groups/:id', err);
    return NextResponse.json({ status: 'error', message: err?.message }, { status: 500 });
  }
} 