import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'

/**
 * GET /api/users/role
 * Returns the authenticated user's role and related IDs.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const clerkId = authResult
  try {
    const roleData = await getUserRoleData(clerkId)
    return NextResponse.json({ status: 'success', data: roleData }, { status: 200 })
  } catch (err: any) {
    console.error('[API] Error fetching user role:', err)
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 })
  }
} 