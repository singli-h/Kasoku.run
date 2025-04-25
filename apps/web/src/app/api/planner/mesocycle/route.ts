import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

// Normalize camelCase to snake_case for DB
function normalizeParameters(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (params.clerkId !== undefined) result.clerk_id = params.clerkId;
  if (params.coachId !== undefined) result.coach_id = params.coachId;
  if (params.startDate !== undefined) result.start_date = params.startDate;
  if (params.endDate !== undefined) result.end_date = params.endDate;
  if (params.athleteGroupId !== undefined) result.athlete_group_id = params.athleteGroupId;
  if (params.macrocycleId !== undefined) result.macrocycle_id = params.macrocycleId;
  if (params.mesocycleId !== undefined) result.mesocycle_id = params.mesocycleId;
  for (const key in params) {
    if (result[key] === undefined && !key.includes('Id') && !key.includes('Date')) {
      result[key] = params[key];
    }
  }
  return result;
}

/**
 * GET /api/planner/mesocycle
 * Lists all mesocycles belonging to the authenticated coach.
 */
export async function GET(req: NextRequest) {
  // Authenticate and get coachId
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('mesocycles')
    .select('*')
    .eq('coach_id', coachId)
    .order('start_date', { ascending: false });
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success', data });
}

/**
 * POST /api/planner/mesocycle
 * Creates a full mesocycle with nested groups, presets, and details.
 */
export async function POST(req: NextRequest) {
  // Auth + RBAC: only coaches
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  try {
    // Parse & normalize request body
    let planData = await req.json();
    planData = normalizeParameters(planData);

    const {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      athlete_group_id: athleteGroupId,
      weeks = []
    } = planData;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create mesocycle
    const { data: mesocycle, error: mesoErr } = await supabase
      .from('mesocycles')
      .insert({ name, description, start_date: startDate, end_date: endDate, ...(planData.macrocycle_id && { macrocycle_id: planData.macrocycle_id }), athlete_group_id: athleteGroupId })
      .select()
      .single();
    if (mesoErr || !mesocycle) throw mesoErr;

    const groups: any[] = [];
    const presets: any[] = [];
    const detailsAcc: any[] = [];

    // 2. Iterate weeks & sessions
    for (const [wIdx, week] of weeks.entries()) {
      for (const [dIdx, session] of (week.sessions || []).entries()) {
        // create group
        const { data: group, error: gErr } = await supabase
          .from('exercise_preset_groups')
          .insert({
            name: session.name,
            description: session.description,
            week: wIdx + 1,
            day: dIdx + 1,
            date: session.date,
            coach_id: coachId,
            athlete_group_id: athleteGroupId
          })
          .select()
          .single();
        if (gErr || !group) throw gErr;
        groups.push(group);

        // create presets
        for (const [eIdx, ex] of (session.exercises || []).entries()) {
          const { data: preset, error: pErr } = await supabase
            .from('exercise_presets')
            .insert({
              exercise_preset_group_id: group.id,
              exercise_id: ex.exerciseId || ex.exercise_id,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              set_rest_time: ex.setRestTime || ex.set_rest_time,
              rep_rest_time: ex.repRestTime || ex.rep_rest_time,
              order: ex.order || eIdx + 1,
              superset_id: ex.supersetId || ex.superset_id,
              preset_order: ex.position !== undefined ? ex.position : (ex.presetOrder || ex.preset_order || eIdx + 1),
              notes: ex.notes
            })
            .select()
            .single();
          if (pErr || !preset) throw pErr;
          presets.push(preset);

          // create details
          for (const det of ex.presetDetails || []) {
            const detailObj = {
              exercise_preset_id: preset.id,
              set_number: det.setNumber || det.set_number,
              resistance: det.resistance,
              resistance_unit_id: det.resistanceUnitId || det.resistance_unit_id,
              reps: det.reps,
              distance: det.distance,
              duration: det.duration,
              tempo: det.tempo,
              height: det.height,
              metadata: det.metadata
            };
            const { data: detData, error: dErr } = await supabase
              .from('exercise_preset_details')
              .insert(detailObj)
              .select();
            if (dErr) throw dErr;
            detailsAcc.push(...detData);
          }
        }
      }
    }

    return NextResponse.json({ status: 'success', data: { mesocycle, groups, presets, details: detailsAcc } }, { status: 201 });
  } catch (error: any) {
    console.error('Error in postMesocycle:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
} 