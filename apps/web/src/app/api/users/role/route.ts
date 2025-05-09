import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'

// Force Node.js runtime for this API route
export const runtime = 'nodejs'
// Force dynamic server runtime to allow headers and prevent static prerendering errors
export const dynamic = 'force-dynamic'

/**
 * GET /api/users/role
 * Returns the authenticated user's role and related IDs.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const clerkId = authResult
    const roleData = await getUserRoleData(clerkId)
    return NextResponse.json({ status: 'success', data: roleData }, { status: 200 })
  } catch (err: any) {
    console.error('[API] Unexpected error in GET /api/users/role:', err)
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 })
  }
} 