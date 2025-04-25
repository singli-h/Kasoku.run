import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/athletes/[id]
 * Fetch a single athlete by ID with user and group join for authenticated coach
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure the request is from an authenticated coach
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  // Fetch coach's group IDs
  const { data: groupObjs, error: groupErr } = await supabase
    .from('athlete_groups')
    .select('id')
    .eq('coach_id', coachId)
  if (groupErr) {
    return NextResponse.json({ status: 'error', message: groupErr.message }, { status: 500 })
  }
  const groupIds = (groupObjs ?? []).map((g) => g.id)

  // Fetch the athlete by ID with nested user and group info
  const { data: rawAthlete, error } = await supabase
    .from('athletes')
    .select(
      `
      id,
      height,
      weight,
      training_goals,
      experience,
      events,
      athlete_group_id,
      user:users!athletes_user_id_fkey(id, first_name, last_name, avatar_url),
      group:athlete_groups!athletes_athlete_group_id_fkey(id, group_name)
    `
    )
    .eq('id', Number(params.id))
    .single()
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }
  if (!rawAthlete || !groupIds.includes(rawAthlete.athlete_group_id)) {
    return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 })
  }
  const athlete = { ...rawAthlete, status: 'active' }
  return NextResponse.json({ status: 'success', data: athlete }, { status: 200 })
}

/**
 * PATCH /api/athletes/[id]
 * Update athlete_group_id for a given athlete.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const { athlete_group_id } = await req.json();
  if (athlete_group_id === undefined) {
    return NextResponse.json({ status: 'error', message: 'Missing athlete_group_id' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('athletes')
    .update({ athlete_group_id })
    .eq('id', Number(params.id))
    .select('id, athlete_group_id');

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success', data }, { status: 200 });
} 