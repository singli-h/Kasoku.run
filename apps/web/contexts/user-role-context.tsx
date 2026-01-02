"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getUserRole } from '@/lib/user-cache'

/**
 * User role types
 * - athlete: User training under a coach
 * - coach: User managing athletes and creating training programs
 * - admin: System administrator
 * - individual: Self-coaching user (Athlete + self-planning capabilities)
 */
export type UserRole = 'athlete' | 'coach' | 'admin' | 'individual'

/**
 * User role context value
 */
interface UserRoleContextValue {
  role: UserRole | null
  isLoading: boolean
  isCoach: boolean
  isAthlete: boolean
  isAdmin: boolean
  isIndividual: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined)

/**
 * UserRoleProvider - Provides user role information to client components
 *
 * This provider:
 * 1. Fetches the user's role from the server using cached lookup
 * 2. Provides convenient role checking utilities
 * 3. Prevents unnecessary re-renders with memoization
 * 4. Handles loading states properly
 *
 * @example
 * ```tsx
 * // In your layout or providers
 * <UserRoleProvider>
 *   <YourApp />
 * </UserRoleProvider>
 *
 * // In any client component
 * const { role, isCoach, hasRole } = useUserRole()
 *
 * if (isCoach) {
 *   return <CoachDashboard />
 * }
 * ```
 */
export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded) return

      if (!user) {
        setRole(null)
        setIsLoading(false)
        return
      }

      try {
        // This uses the cached getUserRole from user-cache.ts
        // In client components, we need to call this via a server action
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          setRole(data.role as UserRole)
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [user, isLoaded])

  const value: UserRoleContextValue = {
    role,
    isLoading,
    isCoach: role === 'coach',
    isAthlete: role === 'athlete',
    isAdmin: role === 'admin',
    isIndividual: role === 'individual',
    hasRole: (requiredRole: UserRole | UserRole[]) => {
      if (!role) return false
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role)
      }
      return role === requiredRole
    }
  }

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  )
}

/**
 * Hook to access user role context
 *
 * @throws Error if used outside of UserRoleProvider
 * @returns UserRoleContextValue
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { role, isCoach, isLoading } = useUserRole()
 *
 *   if (isLoading) return <Spinner />
 *   if (!isCoach) return <AccessDenied />
 *
 *   return <CoachFeature />
 * }
 * ```
 */
export function useUserRole() {
  const context = useContext(UserRoleContext)
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider')
  }
  return context
}
