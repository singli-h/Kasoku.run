import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/plans/mesocycle/:id
 * Retrieves a complete mesocycle with its weeks and sessions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and get coachId
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const mesocycleId = params.id;
  const supabase = createServerSupabaseClient();

  try {
    // 1) Fetch mesocycle owned by this coach
    const { data: mesocycle, error: mcErr } = await supabase
      .from('mesocycles')
      .select('*')
      .eq('id', mesocycleId)
      .eq('coach_id', coachId)
      .single();
    if (mcErr || !mesocycle) {
      return NextResponse.json({ status: 'error', message: 'Mesocycle not found' }, { status: 404 });
    }

    // 2) Get microcycles
    const { data: microcycles, error: mErr } = await supabase
      .from('microcycles')
      .select('*')
      .eq('mesocycle_id', mesocycleId)
      .order('start_date');
    if (mErr) throw mErr;

    const microIds = microcycles.map(mc => mc.id);

    // 3) Fetch preset groups
    const { data: presetGroups } = await supabase
      .from('exercise_preset_groups')
      .select('*')
      .in('microcycle_id', microIds)
      .order('week')
      .order('day');
    const groupsList = presetGroups ?? [];

    // 4) Fetch presets
    const groupIds = groupsList.map(pg => pg.id);
    const { data: presets } = await supabase
      .from('exercise_presets')
      .select(`*
        , exercises (
            id, name, description, exercise_types (type)
          )`
      )
      .in('exercise_preset_group_id', groupIds)
      .order('preset_order')
      .order('order');
    const presetsList = presets ?? [];

    // 5) Fetch preset details
    const presetIds = presetsList.map(p => p.id);
    const { data: details } = await supabase
      .from('exercise_preset_details')
      .select('*')
      .in('exercise_preset_id', presetIds)
      .order('set_number');

    // 6) Assemble response
    const detailsByPreset: Record<number, any[]> = {};
    (details || []).forEach(d => {
      detailsByPreset[d.exercise_preset_id] ||= [];
      detailsByPreset[d.exercise_preset_id].push(d);
    });

    const presetsByGroup: Record<number, any[]> = {};
    presetsList.forEach(p => {
      presetsByGroup[p.exercise_preset_group_id] ||= [];
      presetsByGroup[p.exercise_preset_group_id].push({
        ...p,
        presetDetails: detailsByPreset[p.id] || []
      });
    });

    const groupsByMicro: Record<number, any[]> = {};
    groupsList.forEach(g => {
      groupsByMicro[g.microcycle_id] ||= [];
      groupsByMicro[g.microcycle_id].push({
        ...g,
        exercises: presetsByGroup[g.id] || []
      });
    });

    const weeks = microcycles.map(mc => ({
      ...mc,
      sessions: groupsByMicro[mc.id] || []
    }));

    return NextResponse.json({ status: 'success', data: { mesocycle, weeks } });
  } catch (err: any) {
    console.error('Error fetching mesocycle:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 