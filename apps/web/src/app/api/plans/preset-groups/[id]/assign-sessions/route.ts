import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/plans/preset-groups/:id/assign-sessions
 * Assigns (upserts) training sessions for a preset group:
 * - Coaches: all athletes in the group
 * - Athletes: themselves only
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  // Role data
  let roleData = getRoleDataFromHeader(req);
  if (!roleData) roleData = await getUserRoleData(clerkId);
  const { role, userId } = roleData;
  if (role !== 'coach' && role !== 'athlete') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const groupId = params.id;

  // Fetch preset group
  const { data: group, error: groupErr } = await supabase
    .from('exercise_preset_groups')
    .select('id, athlete_group_id, date, session_mode, user_id')
    .eq('id', groupId)
    .single();
  if (groupErr || !group) {
    return NextResponse.json({ status: 'error', message: 'Preset group not found' }, { status: 404 });
  }

  // Authorization for coach
  if (role === 'coach' && group.user_id !== userId) {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const dateTime = group.date ? new Date(group.date).toISOString() : new Date().toISOString();
  let rows: any[] = [];

  if (role === 'coach') {
    // Assign to all athletes in group
    const { data: athletes, error: athErr } = await supabase
      .from('athletes')
      .select('id')
      .eq('athlete_group_id', group.athlete_group_id);
    if (athErr) {
      return NextResponse.json({ status: 'error', message: athErr.message }, { status: 500 });
    }
    rows = athletes.map((a: any) => ({
      athlete_id: a.id,
      athlete_group_id: group.athlete_group_id,
      exercise_preset_group_id: group.id,
      session_mode: group.session_mode,
      date_time: dateTime,
      status: 'pending'
    }));
  } else {
    // Assign to the athlete themselves
    const { data: athlete, error: athErr } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .eq('user_id', userId)
      .single();
    if (athErr || !athlete) {
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

  // Upsert sessions
  const { error: upsertErr } = await supabase
    .from('exercise_training_sessions')
    .upsert(rows, { onConflict: 'athlete_id,exercise_preset_group_id' });
  if (upsertErr) {
    return NextResponse.json({ status: 'error', message: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
} 