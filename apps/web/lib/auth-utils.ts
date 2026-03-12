/*
<ai_context>
Authorization utilities for server actions.
Provides consistent ownership and access verification patterns for athletes,
sessions, and coach-managed resources.

These utilities centralize authorization logic that was previously scattered
across multiple server action files, ensuring consistent security checks.

USAGE:
```typescript
import { verifyAthleteAccess, verifySessionOwnership } from "@/lib/auth-utils"

export async function someAction(athleteId: number) {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Not authenticated" }

  const dbUserId = await getDbUserId(userId)
  const { authorized } = await verifyAthleteAccess(dbUserId, athleteId)

  if (!authorized) {
    return { isSuccess: false, message: "Not authorized" }
  }
  // ... proceed with action
}
```
</ai_context>
*/

import supabase from "./supabase-server"

/**
 * Custom error class for authorization failures
 * Useful for distinguishing auth errors from other errors in error handling
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Result of athlete access verification
 */
export interface AthleteAccessResult {
  /** Whether the user has access to this athlete's data */
  authorized: boolean
  /** Whether the user is the direct owner of this athlete record */
  isOwner: boolean
  /** Whether the user is a coach of this athlete's group */
  isCoach: boolean
}

/**
 * Verify user owns the athlete record OR is coach of athlete's group
 *
 * This function handles the two valid access patterns:
 * 1. Direct ownership: user_id on athlete record matches current user
 * 2. Coach access: user is coach of the athlete's athlete_group
 *
 * @param dbUserId - The database user ID (from getDbUserId())
 * @param athleteId - The athlete ID to check access for
 * @returns Promise<AthleteAccessResult> - Authorization result with details
 *
 * @example
 * ```typescript
 * const { authorized, isOwner, isCoach } = await verifyAthleteAccess(dbUserId, athleteId)
 * if (!authorized) {
 *   return { isSuccess: false, message: "Not authorized" }
 * }
 * ```
 */
export async function verifyAthleteAccess(
  dbUserId: number,
  athleteId: number
): Promise<AthleteAccessResult> {
  // Fetch athlete with their group info
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('user_id, athlete_group_id')
    .eq('id', athleteId)
    .single()

  if (error || !athlete) {
    return { authorized: false, isOwner: false, isCoach: false }
  }

  // Check direct ownership (user owns this athlete record)
  const isOwner = athlete.user_id === dbUserId
  if (isOwner) {
    return { authorized: true, isOwner: true, isCoach: false }
  }

  // Check coach access (user is coach of athlete's group)
  if (athlete.athlete_group_id) {
    // Get the group's coach_id
    const { data: group } = await supabase
      .from('athlete_groups')
      .select('coach_id')
      .eq('id', athlete.athlete_group_id)
      .single()

    if (group) {
      // Check if current user is a coach with this coach_id
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (coach && group.coach_id === coach.id) {
        return { authorized: true, isOwner: false, isCoach: true }
      }
    }
  }

  return { authorized: false, isOwner: false, isCoach: false }
}

/**
 * Verify user owns the workout session (via athlete ownership)
 *
 * Workout sessions (workout_logs) are linked to athletes. This function
 * verifies that the current user owns the athlete that the session belongs to.
 *
 * @param dbUserId - The database user ID (from getDbUserId())
 * @param sessionId - The workout_log ID (session ID) to check
 * @returns Promise<boolean> - True if user owns this session
 *
 * @example
 * ```typescript
 * const isOwner = await verifySessionOwnership(dbUserId, sessionId)
 * if (!isOwner) {
 *   return { isSuccess: false, message: "Not authorized to modify this session" }
 * }
 * ```
 */
export async function verifySessionOwnership(
  dbUserId: number,
  sessionId: string
): Promise<boolean> {
  const { data: session, error } = await supabase
    .from('workout_logs')
    .select('athlete:athletes(user_id)')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return false
  }

  // TypeScript type narrowing for the joined data
  const athlete = session.athlete as { user_id: number } | null
  return athlete?.user_id === dbUserId
}

/**
 * Verify user has access to a workout session (owner OR coach)
 *
 * Similar to verifyAthleteAccess but starts from a session ID.
 * Handles both individual users accessing their own sessions
 * and coaches accessing their athletes' sessions.
 *
 * @param dbUserId - The database user ID (from getDbUserId())
 * @param sessionId - The workout_log ID (session ID) to check
 * @returns Promise<AthleteAccessResult> - Authorization result with details
 */
export async function verifySessionAccess(
  dbUserId: number,
  sessionId: string
): Promise<AthleteAccessResult> {
  // Get the session's athlete_id
  const { data: session, error } = await supabase
    .from('workout_logs')
    .select('athlete_id')
    .eq('id', sessionId)
    .single()

  if (error || !session || !session.athlete_id) {
    return { authorized: false, isOwner: false, isCoach: false }
  }

  // Delegate to athlete access check
  return verifyAthleteAccess(dbUserId, session.athlete_id)
}

/**
 * Verify user owns the session plan (created by user OR coach of assigned group)
 *
 * Session plans can be owned directly by a user (via user_id) or
 * assigned to an athlete group that the user coaches.
 *
 * @param dbUserId - The database user ID (from getDbUserId())
 * @param sessionPlanId - The session_plan ID to check
 * @returns Promise<AthleteAccessResult> - Authorization result with details
 */
export async function verifySessionPlanAccess(
  dbUserId: number,
  sessionPlanId: string
): Promise<AthleteAccessResult> {
  // Get the session plan with user_id and microcycle relationship for group access
  const { data: plan, error } = await supabase
    .from('session_plans')
    .select('user_id, microcycle_id')
    .eq('id', sessionPlanId)
    .single()

  if (error || !plan) {
    return { authorized: false, isOwner: false, isCoach: false }
  }

  // Check direct ownership (user created this plan)
  const isOwner = plan.user_id === dbUserId
  if (isOwner) {
    return { authorized: true, isOwner: true, isCoach: false }
  }

  // Check coach access via microcycle → athlete_group
  if (plan.microcycle_id) {
    const { data: microcycle } = await supabase
      .from('microcycles')
      .select('athlete_group_id')
      .eq('id', plan.microcycle_id)
      .single()

    if (microcycle?.athlete_group_id) {
      const { data: group } = await supabase
        .from('athlete_groups')
        .select('coach_id')
        .eq('id', microcycle.athlete_group_id)
        .single()

      if (group) {
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', dbUserId)
          .single()

        if (coach && group.coach_id === coach.id) {
          return { authorized: true, isOwner: false, isCoach: true }
        }
      }
    }
  }

  return { authorized: false, isOwner: false, isCoach: false }
}

/**
 * Log authorization failure for monitoring and debugging
 *
 * @param action - The action that was attempted
 * @param context - Additional context about the failure
 */
export function logAuthFailure(
  action: string,
  context: {
    userId?: string | number
    resourceType?: string
    resourceId?: string | number
    reason: string
  }
): void {
  console.warn(`[AUTH_FAILURE] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...context
  })
}
