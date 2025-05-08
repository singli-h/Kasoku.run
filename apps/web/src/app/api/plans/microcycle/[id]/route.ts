import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/plans/microcycle/:id
 * Retrieves a complete microcycle with its sessions and details.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  // Get user role and verify coach access
  try {
    let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData;
    
    if (role !== 'coach') {
      return NextResponse.json(
        { status: 'error', message: 'Access forbidden: Coach role required' },
        { status: 403 }
      );
    }

    const microcycleId = params.id;
    const supabase = createServerSupabaseClient();

    // 1) Fetch microcycle and verify ownership
    const { data: microcycle, error: mcErr } = await supabase
      .from('microcycles')
      .select('*')
      .eq('id', microcycleId)
      .eq('coach_id', coachId)
      .single();
    if (mcErr || !microcycle) {
      return NextResponse.json({ status: 'error', message: 'Microcycle not found' }, { status: 404 });
    }

    // 2) Fetch preset groups
    const { data: presetGroups, error: pgErr } = await supabase
      .from('exercise_preset_groups')
      .select('*')
      .eq('microcycle_id', microcycleId)
      .order('day');
    if (pgErr) throw pgErr;

    const groupIds = presetGroups.map((g) => g.id);

    // 3) Fetch presets with exercises
    const { data: presets, error: pErr } = await supabase
      .from('exercise_presets')
      .select(
        `*, exercises ( id, name, description, exercise_types ( type ) )`
      )
      .in('exercise_preset_group_id', groupIds)
      .order('preset_order')
      .order('order');
    if (pErr) throw pErr;

    const presetIds = presets.map((p) => p.id);

    // 4) Fetch details
    const { data: presetDetails, error: dErr } = await supabase
      .from('exercise_preset_details')
      .select('*')
      .in('exercise_preset_id', presetIds)
      .order('set_number');
    if (dErr) throw dErr;

    // 5) Assemble response
    const detailsByPreset: Record<number, any[]> = {};
    (presetDetails || []).forEach((d) => {
      detailsByPreset[d.exercise_preset_id] ||= [];
      detailsByPreset[d.exercise_preset_id].push(d);
    });

    const presetsByGroup: Record<number, any[]> = {};
    (presets || []).forEach((p) => {
      presetsByGroup[p.exercise_preset_group_id] ||= [];
      presetsByGroup[p.exercise_preset_group_id].push({
        ...p,
        presetDetails: detailsByPreset[p.id] || [],
      });
    });

    const sessions = (presetGroups || []).map((g) => ({
      ...g,
      exercises: presetsByGroup[g.id] || [],
    }));

    return NextResponse.json({ status: 'success', data: { microcycle, sessions } });
  } catch (err: any) {
    console.error('Error fetching microcycle:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 