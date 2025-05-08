import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

/**
 * PUT /api/athlete-groups/[id] - Update a group name
 * DELETE /api/athlete-groups/[id] - Delete a group
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const { group_name } = await req.json()
  if (!group_name || !group_name.trim()) {
    return NextResponse.json({ status: 'error', message: 'Missing group_name' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('athlete_groups')
    .update({ group_name: group_name.trim() })
    .eq('id', Number(params.id))
    .eq('coach_id', coachId)
    .select('id, group_name')
    .single()

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'success', data }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const clerkId = auth
  const { role, coachId } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('athlete_groups')
    .delete()
    .eq('id', Number(params.id))
    .eq('coach_id', coachId)

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'success' }, { status: 204 })
} 