export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AthletesLayout({ children }) {
  // Read injected role header for coach-only access
  const raw = headers().get('x-kasoku-userrole')
  let role = null
  if (raw) {
    try { role = JSON.parse(raw).role } catch {}
  }
  // Fallback to auth + RPC if header missing
  if (!role) {
    const authResult = await requireAuth()
    if (authResult instanceof Response) return authResult
    const { role: fetchedRole } = await getUserRoleData(authResult)
    role = fetchedRole
  }
  if (role !== 'coach') redirect('/')

  return <>{children}</>
} 