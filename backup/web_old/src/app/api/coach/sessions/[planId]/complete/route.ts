import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserRoleData } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }) {
  const { planId } = params

  // Authenticate coach
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult
  let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role } = roleData
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('exercise_training_sessions')
    .update({ status: 'completed' })
    .eq('exercise_preset_group_id', planId)

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }
  return NextResponse.json({ status: 'success' }, { status: 200 })
} 