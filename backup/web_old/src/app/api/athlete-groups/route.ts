import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { createServerAdminClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

// GET returns groups for the authenticated coach; POST creates a new group
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  // Try header-injected role data
  let roleData = getRoleDataFromHeader(req as any)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from('athlete_groups')
    .select('id, group_name')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 'success', data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;
  // Try header-injected role data
  let roleData = getRoleDataFromHeader(req as any)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }
  const { group_name } = await req.json();
  if (!group_name) {
    return NextResponse.json({ status: 'error', message: 'Missing group_name' }, { status: 400 });
  }
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from('athlete_groups')
    .insert({ group_name, coach_id: coachId })
    .select('id, group_name')
    .single();
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 'success', data }, { status: 201 });
} 