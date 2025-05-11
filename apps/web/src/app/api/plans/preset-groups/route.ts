import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/plans/preset-groups
 * List all preset groups for the authenticated coach.
 *
 * POST /api/plans/preset-groups
 * Create a new preset group (initial metadata only).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  // Get user role and coachId
  let roleData = getRoleDataFromHeader(req);
  if (!roleData) roleData = await getUserRoleData(clerkId);
  const { role, coachId } = roleData;
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data: groups, error } = await supabase
    .from('exercise_preset_groups')
    .select('id, name, description, date, session_mode, athlete_group_id')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching preset groups:', error);
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success', data: { groups } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  let roleData = getRoleDataFromHeader(req);
  if (!roleData) roleData = await getUserRoleData(clerkId);
  const { role, coachId } = roleData;
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  try {
    const body = await req.json();
    const { name, description, date, sessionMode, athleteGroupId } = body;
    if (!name) {
      return NextResponse.json({ status: 'error', message: 'Name is required' }, { status: 400 });
    }

    const { data: group, error } = await supabase
      .from('exercise_preset_groups')
      .insert({
        name,
        description: description || null,
        date: date || null,
        session_mode: sessionMode || 'individual',
        athlete_group_id: athleteGroupId || null,
        coach_id: coachId
      })
      .select()
      .single();

    if (error || !group) {
      console.error('Error creating preset group:', error);
      return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', data: { group } }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /preset-groups:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 