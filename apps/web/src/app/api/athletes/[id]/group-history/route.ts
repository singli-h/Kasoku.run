import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/athletes/[id]/group-history
 * Fetch group assignment history for a specific athlete
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure the request is from an authenticated coach
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  // Try header-injected role data
  let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role, coachId } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  
  // Verify the athlete belongs to a group that this coach manages
  const { data: athleteData, error: athleteErr } = await supabase
    .from('athletes')
    .select('id, athlete_group_id')
    .eq('id', Number(params.id))
    .single()
    
  if (athleteErr || !athleteData) {
    return NextResponse.json({ status: 'error', message: 'Athlete not found' }, { status: 404 })
  }
  
  // Get the group and verify coach access
  const { data: groupData, error: groupErr } = await supabase
    .from('athlete_groups')
    .select('id, coach_id')
    .eq('id', athleteData.athlete_group_id)
    .single()
  
  if (groupErr || !groupData) {
    return NextResponse.json({ status: 'error', message: 'Group not found' }, { status: 404 })
  }
  
  // Check if coach has access to this group
  if (groupData.coach_id !== coachId) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized access' }, { status: 403 })
  }
  
  // Fetch the athlete's group assignment history
  const { data: historyData, error: historyErr } = await supabase
    .from('athlete_group_histories')
    .select(`
      id,
      created_at,
      notes,
      group:group_id(id, group_name),
      coach:created_by(id)
    `)
    .eq('athlete_id', Number(params.id))
    .order('created_at', { ascending: false })
    
  if (historyErr) {
    return NextResponse.json({ status: 'error', message: historyErr.message }, { status: 500 })
  }
  
  return NextResponse.json({ status: 'success', data: historyData || [] }, { status: 200 })
} 