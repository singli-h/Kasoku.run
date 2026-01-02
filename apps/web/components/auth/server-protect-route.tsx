import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/user-cache'
import { redirect } from 'next/navigation'
import { UserRole } from '@/contexts/user-role-context'

interface ServerProtectRouteProps {
  allowedRoles: UserRole[]
  redirectTo?: string
}

/**
 * Server-side route protection based on user role
 *
 * This function:
 * 1. Runs on the server (async server component)
 * 2. Checks user role before rendering
 * 3. Redirects immediately if unauthorized (no client-side flash)
 * 4. Returns null if authorized (acts as a guard)
 *
 * @example
 * ```tsx
 * // In a server component or page
 * export default async function AthletesPage() {
 *   await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
 *
 *   // Rest of your page code - only executes if authorized
 *   return <AthletesList />
 * }
 * ```
 */
export async function serverProtectRoute({
  allowedRoles,
  redirectTo = '/dashboard'
}: ServerProtectRouteProps): Promise<void> {
  const { userId } = await auth()

  // If not authenticated, this shouldn't happen as middleware should catch it
  // But just in case, redirect to sign-in
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    const role = await getUserRole(userId)

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(role as UserRole)) {
      console.log(`[ServerProtectRoute] User role "${role}" not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to ${redirectTo}`)
      redirect(redirectTo)
    }

    // User is authorized, function returns normally
  } catch (error) {
    console.error('[ServerProtectRoute] Error checking user role:', error)
    // On error, redirect to dashboard for safety
    redirect(redirectTo)
  }
}

/**
 * Get current user role (server-side utility)
 *
 * @returns The current user's role or null if not authenticated
 *
 * @example
 * ```tsx
 * export default async function MyPage() {
 *   const role = await getCurrentUserRole()
 *
 *   if (role === 'coach') {
 *     return <CoachView />
 *   }
 *
 *   return <AthleteView />
 * }
 * ```
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const role = await getUserRole(userId)
    return role as UserRole
  } catch (error) {
    console.error('[getCurrentUserRole] Error fetching user role:', error)
    return null
  }
}

/**
 * Check if current user has a specific role (server-side utility)
 *
 * @param requiredRole - Single role or array of roles to check
 * @returns true if user has one of the required roles
 *
 * @example
 * ```tsx
 * export default async function MyPage() {
 *   const isCoach = await hasRole(['coach', 'individual'])
 *
 *   return (
 *     <div>
 *       {isCoach && <AdminPanel />}
 *       <UserContent />
 *     </div>
 *   )
 * }
 * ```
 */
export async function hasRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
  const role = await getCurrentUserRole()

  if (!role) return false

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role)
  }

  return role === requiredRole
}
