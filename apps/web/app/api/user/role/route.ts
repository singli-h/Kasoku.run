import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/user-cache'
import { NextResponse } from 'next/server'

/**
 * GET /api/user/role
 *
 * Returns the current user's role using cached lookup
 * Used by UserRoleProvider on the client side
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const role = await getUserRole(userId)

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user role' },
      { status: 500 }
    )
  }
}
