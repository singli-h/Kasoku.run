import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

// Normalize camelCase keys to snake_case
function normalizeParameters(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (params.clerkId) result.clerk_id = params.clerkId;
  if (params.coachId) result.coach_id = params.coachId;
  if (params.startDate) result.start_date = params.startDate;
  if (params.endDate) result.end_date = params.endDate;
  if (params.athleteGroupId) result.athlete_group_id = params.athleteGroupId;
  if (params.mesocycleId) result.mesocycle_id = params.mesocycleId;
  for (const key in params) {
    if (!key.endsWith('Id') && !key.endsWith('Date')) {
      result[key] = params[key];
    }
  }
  return result;
}

/**
 * POST /api/planner/microcycle
 * Create a microcycle with nested sessions, presets, and details.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  try {
    let data = await req.json();
    data = normalizeParameters(data);
    const { name, description, start_date: startDate, end_date: endDate, mesocycle_id: mesoId, athlete_group_id: athleteGroupId, sessions = [] } = data;
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // 1) Insert microcycle
    const { data: microcycle, error: mcErr } = await supabase
      .from('microcycles')
      .insert({ name, description, start_date: startDate, end_date: endDate, mesocycle_id: mesoId, coach_id: coachId })
      .select()
      .single();
    if (mcErr || !microcycle) throw mcErr;

    const groups: any[] = [];
    const presets: any[] = [];
    const details: any[] = [];

    // 2) Sessions loop
    for (const [idx, session] of sessions.entries()) {
      const { name: sName, description: sDesc, date, exercises = [] } = session;
      // group
      const { data: grp, error: gErr } = await supabase
        .from('exercise_preset_groups')
        .insert({ name: sName, description: sDesc, week: 1, day: idx + 1, date, coach_id: coachId, athlete_group_id: athleteGroupId, microcycle_id: microcycle.id })
        .select()
        .single();
      if (gErr || !grp) throw gErr;
      groups.push(grp);

      // presets
      for (const [i, ex] of exercises.entries()) {
        const { data: pre, error: pErr } = await supabase
          .from('exercise_presets')
          .insert({ exercise_preset_group_id: grp.id, exercise_id: ex.exerciseId || ex.exercise_id, sets: ex.sets, reps: ex.reps, weight: ex.weight, set_rest_time: ex.setRestTime, rep_rest_time: ex.repRestTime, order: ex.order || i+1, superset_id: ex.supersetId, preset_order: ex.presetOrder, notes: ex.notes })
          .select()
          .single();
        if (pErr || !pre) throw pErr;
        presets.push(pre);

        // details
        for (const det of ex.presetDetails || []) {
          const detailObj = { exercise_preset_id: pre.id, set_number: det.setNumber, resistance: det.resistance, resistance_unit_id: det.resistanceUnitId, reps: det.reps, distance: det.distance, duration: det.duration, tempo: det.tempo, height: det.height, metadata: det.metadata };
          const { data: dData, error: dErr } = await supabase.from('exercise_preset_details').insert(detailObj).select();
          if (dErr) throw dErr;
          details.push(...dData);
        }
      }
    }

    return NextResponse.json({ status: 'success', data: { microcycle, groups, presets, details } }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating microcycle:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 