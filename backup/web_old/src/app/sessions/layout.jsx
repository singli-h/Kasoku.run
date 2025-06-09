import { requireAuth } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SessionsLayout({ children }) {
  // Enforce authentication
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult
  const clerkId = authResult

  // Check user role
  const { role } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    // Redirect non-coach users
    redirect('/')
  }

  return <>{children}</>
} 