"use client"

import { useUserRole, UserRole } from '@/contexts/user-role-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/features/workout/components/error-loading/workout-loading-states'

interface ProtectRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

/**
 * ProtectRoute - Client-side route protection based on user role
 *
 * This component:
 * 1. Checks if the user has one of the allowed roles
 * 2. Redirects to specified route if unauthorized
 * 3. Shows loading state while checking role
 * 4. Renders children if authorized
 *
 * @example
 * ```tsx
 * // Protect a page for coaches only
 * export default function AthletesPage() {
 *   return (
 *     <ProtectRoute allowedRoles={['coach', 'admin']}>
 *       <AthletesList />
 *     </ProtectRoute>
 *   )
 * }
 *
 * // With custom redirect
 * <ProtectRoute
 *   allowedRoles={['coach']}
 *   redirectTo="/dashboard"
 *   fallback={<AccessDenied />}
 * >
 *   <CoachFeature />
 * </ProtectRoute>
 * ```
 */
export function ProtectRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
  fallback
}: ProtectRouteProps) {
  const { role, isLoading, hasRole } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return

    // If user doesn't have required role, redirect
    if (!hasRole(allowedRoles)) {
      console.log(`[ProtectRoute] User role "${role}" not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to ${redirectTo}`)
      router.push(redirectTo)
    }
  }, [role, isLoading, hasRole, allowedRoles, redirectTo, router])

  // Show loading state while checking role
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If unauthorized and fallback provided, show fallback
  if (!hasRole(allowedRoles) && fallback) {
    return <>{fallback}</>
  }

  // If unauthorized and no fallback, don't render anything (will redirect)
  if (!hasRole(allowedRoles)) {
    return null
  }

  // User is authorized, render children
  return <>{children}</>
}

/**
 * AccessDenied - Default fallback component for unauthorized access
 */
export function AccessDenied() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
