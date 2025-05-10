export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'
import { redirect } from 'next/navigation'

export default async function AthletesLayout({ children }) {
  // Enforce auth
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult
  const clerkId = authResult

  // Check role
  const { role } = await getUserRoleData(clerkId)
  if (role !== 'coach') {
    redirect('/')
  }

  return <>{children}</>
} 