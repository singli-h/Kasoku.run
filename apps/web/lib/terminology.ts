'use client'

import { useMemo } from 'react'
import { useUserRole, type UserRole } from '@/contexts/user-role-context'

/**
 * Terminology configuration for periodization concepts
 * Maps technical terms to user-friendly terms based on role
 */
export interface Terminology {
  /** Mesocycle display name (e.g., "Training Block" or "Mesocycle") */
  mesocycle: string
  /** Microcycle display name (e.g., "Week" or "Microcycle") */
  microcycle: string
  /** Session plan display name (e.g., "Workout" or "Session Plan") */
  sessionPlan: string
  /** Macrocycle display name (null = hidden from UI) */
  macrocycle: string | null
}

/**
 * Plural forms for list contexts
 */
export interface TerminologyPlural {
  mesocycles: string
  microcycles: string
  sessionPlans: string
  macrocycles: string | null
}

/**
 * Get terminology mapping based on user role
 *
 * @param role - The user's role (or null if not authenticated)
 * @returns Terminology object with role-appropriate display names
 *
 * @example
 * const { role } = useUserRole()
 * const terms = getTerminology(role)
 * return <h2>Create {terms.mesocycle}</h2>
 * // Individual: "Create Training Block"
 * // Coach: "Create Mesocycle"
 */
export function getTerminology(role: UserRole | null): Terminology {
  if (role === 'individual') {
    return {
      mesocycle: 'Training Block',
      microcycle: 'Week',
      sessionPlan: 'Workout',
      macrocycle: null, // Hidden for individuals
    }
  }

  // Default for coach, admin, athlete
  return {
    mesocycle: 'Mesocycle',
    microcycle: 'Microcycle',
    sessionPlan: 'Session Plan',
    macrocycle: 'Macrocycle',
  }
}

/**
 * Get plural terminology for list contexts
 *
 * @param role - The user's role
 * @returns Plural terminology object
 *
 * @example
 * const terms = getTerminologyPlural(role)
 * return <h2>Your {terms.mesocycles}</h2>
 * // Individual: "Your Training Blocks"
 */
export function getTerminologyPlural(role: UserRole | null): TerminologyPlural {
  if (role === 'individual') {
    return {
      mesocycles: 'Training Blocks',
      microcycles: 'Weeks',
      sessionPlans: 'Workouts',
      macrocycles: null,
    }
  }

  return {
    mesocycles: 'Mesocycles',
    microcycles: 'Microcycles',
    sessionPlans: 'Session Plans',
    macrocycles: 'Macrocycles',
  }
}

/**
 * React hook for accessing terminology in components
 *
 * @returns Memoized terminology object
 *
 * @example
 * function CreateBlockButton() {
 *   const terms = useTerminology()
 *   return <Button>Create {terms.mesocycle}</Button>
 * }
 */
export function useTerminology(): Terminology {
  const { role } = useUserRole()
  return useMemo(() => getTerminology(role), [role])
}

/**
 * React hook for plural terminology
 */
export function useTerminologyPlural(): TerminologyPlural {
  const { role } = useUserRole()
  return useMemo(() => getTerminologyPlural(role), [role])
}
