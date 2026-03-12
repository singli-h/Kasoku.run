"use client"

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import type { Database } from '@/types/database'

/**
 * User role types — derived from the Supabase DB enum (single source of truth)
 */
export type UserRole = Database["public"]["Enums"]["role"]

/**
 * User role context value
 */
interface UserRoleContextValue {
  role: UserRole | null
  isLoading: boolean
  error: string | null
  isCoach: boolean
  isAthlete: boolean
  isIndividual: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined)

const ROLE_CACHE_KEY = 'user-role-cache'
const ROLE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedRole(userId: string): UserRole | null {
  try {
    const cached = sessionStorage.getItem(ROLE_CACHE_KEY)
    if (cached) {
      const { role, userId: cachedUserId, timestamp } = JSON.parse(cached)
      if (cachedUserId === userId && Date.now() - timestamp < ROLE_CACHE_TTL) return role
    }
  } catch {}
  return null
}

function setCachedRole(role: string, userId: string) {
  try {
    sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ role, userId, timestamp: Date.now() }))
  } catch {}
}

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
  const [error, setError] = useState<string | null>(null)
  const retryCount = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RETRIES = 2

  useEffect(() => {
    // Reset retry count on user change
    retryCount.current = 0

    async function fetchUserRole() {
      if (!isLoaded) return

      if (!user) {
        setRole(null)
        setIsLoading(false)
        setError(null)
        return
      }

      try {
        const VALID_ROLES: UserRole[] = ['coach', 'athlete', 'individual']

        // Check sessionStorage cache before fetching
        const cachedRole = getCachedRole(user.id)
        if (cachedRole && VALID_ROLES.includes(cachedRole)) {
          setRole(cachedRole)
          setError(null)
          retryCount.current = 0
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          if (VALID_ROLES.includes(data.role)) {
            setCachedRole(data.role, user.id)
            setRole(data.role as UserRole)
            setError(null)
            retryCount.current = 0
            setIsLoading(false)
          } else {
            setError('Invalid role received from server')
            setRole(null)
            setIsLoading(false)
          }
        } else if (retryCount.current < MAX_RETRIES) {
          retryCount.current++
          const delay = 1000 * Math.pow(2, retryCount.current - 1)
          timeoutRef.current = setTimeout(fetchUserRole, delay)
        } else {
          setError('Failed to load user role')
          setRole(null)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err)
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++
          const delay = 1000 * Math.pow(2, retryCount.current - 1)
          timeoutRef.current = setTimeout(fetchUserRole, delay)
        } else {
          setError('Failed to load user role')
          setRole(null)
          setIsLoading(false)
        }
      }
    }

    fetchUserRole()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [user?.id, isLoaded])

  // Memoize hasRole function to prevent recreation on every render
  const hasRole = useCallback((requiredRole: UserRole | UserRole[]) => {
    if (!role) return false
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role)
    }
    return role === requiredRole
  }, [role])

  // Memoize the entire context value to prevent unnecessary re-renders in consumers
  const value = useMemo<UserRoleContextValue>(() => ({
    role,
    isLoading,
    error,
    isCoach: role === 'coach',
    isAthlete: role === 'athlete',
    isIndividual: role === 'individual',
    hasRole
  }), [role, isLoading, error, hasRole])

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
