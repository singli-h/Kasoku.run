import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/plans/preset-groups/[id]/assign
 * Assigns the specified preset-group session:
 * - Coaches: assigns to all athletes in the group.
 * - Athletes: assigns to themselves.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate the user
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const clerkId = authResult;

  // Get role data
  let roleData = getRoleDataFromHeader(req);
  if (!roleData) roleData = await getUserRoleData(clerkId);
  const { role, userId } = roleData;

  // Only coaches or athletes
  if (role !== 'coach' && role !== 'athlete') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch the preset group
  const { data: group, error: groupError } = await supabase
    .from('exercise_preset_groups')
    .select('id, athlete_group_id, date, session_mode, user_id')
    .eq('id', params.id)
    .single();
  if (groupError || !group) {
    return NextResponse.json({ status: 'error', message: 'Preset group not found' }, { status: 404 });
  }

  // Authorization for coaches
  if (role === 'coach' && group.user_id !== userId) {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  // Prepare session rows
  const dateTime = group.date ? new Date(group.date).toISOString() : new Date().toISOString();
  let rows: any[] = [];

  if (role === 'coach') {
    // Assign to all athletes in the group
    const { data: athletes, error: athError } = await supabase
      .from('athletes')
      .select('id')
      .eq('athlete_group_id', group.athlete_group_id);
    if (athError) {
      return NextResponse.json({ status: 'error', message: athError.message }, { status: 500 });
    }
    rows = athletes.map((a: { id: number }) => ({
      athlete_id: a.id,
      athlete_group_id: group.athlete_group_id,
      exercise_preset_group_id: group.id,
      session_mode: group.session_mode,
      date_time: dateTime,
      status: 'pending'
    }));
  } else {
    // Assign to the single athlete
    const { data: athlete, error: athError } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .eq('user_id', userId)
      .single();
    if (athError || !athlete) {
      return NextResponse.json({ status: 'error', message: 'Athlete profile not found' }, { status: 404 });
    }
    rows = [{
      athlete_id: athlete.id,
      athlete_group_id: athlete.athlete_group_id ?? group.athlete_group_id,
      exercise_preset_group_id: group.id,
      session_mode: group.session_mode,
      date_time: dateTime,
      status: 'pending'
    }];
  }

  // Upsert sessions to ensure one per athlete/group
  const { error: upsertError } = await supabase
    .from('exercise_training_sessions')
    .upsert(rows, { onConflict: 'athlete_id,exercise_preset_group_id' });
  if (upsertError) {
    return NextResponse.json({ status: 'error', message: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
} 