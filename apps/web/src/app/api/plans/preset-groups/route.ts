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

  // Retrieve role data: prefer header, but ensure we have user id
  let roleData = getRoleDataFromHeader(req) ?? await getUserRoleData(clerkId);
  // If header-only data lacked user id (e.g. athlete), fetch full role data
  if (roleData.userId === undefined) {
    roleData = await getUserRoleData(clerkId);
  }
  const { role, userId } = roleData;
  // Only coaches or athletes can access preset groups
  if (role !== 'coach' && role !== 'athlete') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  // Fetch all non-deleted groups for the user. Filtering will be done client-side.
  const { data: groups, error } = await supabase
    .from('exercise_preset_groups')
    // Ensure all necessary fields for display and potential client-side grouping are selected
    .select('id, name, description, date, session_mode, athlete_group_id, microcycle_id') 
    .eq('user_id', userId)
    .eq('deleted', false)
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
  const { role, userId } = roleData;
  if (role !== 'coach' && role !== 'athlete') {
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
        user_id: userId
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