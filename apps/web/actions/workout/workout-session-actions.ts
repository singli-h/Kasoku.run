/*
<ai_context>
Server actions for workout session discovery and management.
Handles session prioritization (ongoing first, then today assigned), 
history pagination, and status updates following 2025 best practices.
</ai_context>
*/

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { verifySessionOwnership, verifyAthleteAccess, logAuthFailure } from "@/lib/auth-utils"
import { ActionState } from "@/types"
import {
  WorkoutLogWithDetails,
  SessionPlanWithDetails
} from "@/types/training"
import { Database } from "@/types/database"
import { processSessionForPBsAction } from "@/actions/athletes/personal-best-actions"

type SessionStatus = Database["public"]["Enums"]["session_status"]

// ============================================================================
// SESSION DISCOVERY ACTIONS
// ============================================================================

/**
 * Get today's and ongoing sessions for an athlete
 * Prioritizes ongoing sessions first, then today's assigned sessions
 */
export async function getTodayAndOngoingSessionsAction(
  athleteId?: number
): Promise<ActionState<WorkoutLogWithDetails[]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get athlete ID if not provided, verify access if provided externally
    let targetAthleteId = athleteId
    if (!targetAthleteId) {
      // Get athlete ID from user (self-access)
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (!athlete) {
        return { isSuccess: false, message: "Athlete profile not found" }
      }
      targetAthleteId = athlete.id
    } else {
      // Phase 3: Verify user has access to this athlete when ID is provided externally
      const { authorized } = await verifyAthleteAccess(dbUserId, targetAthleteId)
      if (!authorized) {
        logAuthFailure("getTodayAndOngoingSessionsAction", {
          userId: dbUserId,
          resourceType: "athlete",
          resourceId: targetAthleteId,
          reason: "User does not have access to this athlete's sessions"
        })
        return { isSuccess: false, message: "Not authorized to view this athlete's sessions" }
      }
    }

    // 4. Query sessions with proper prioritization
    // Shows ongoing sessions (regardless of date) and assigned sessions within ±7 days
    // Priority: ongoing first, then assigned (sorted by date)
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: sessions, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        athlete_id,
        session_plan_id,
        session_plan:session_plans(
          id,
          name,
          description,
          date,
          session_plan_exercises(
            id,
            exercise_order,
            notes,
            exercise_id,
            superset_id,
            exercise:exercises(
              id,
              name,
              description,
              video_url,
              exercise_type:exercise_types(id, type),
              unit:units(id, name)
            ),
            session_plan_sets(
              id,
              set_index,
              reps,
              weight,
              distance,
              performing_time,
              rest_time,
              rpe
            )
          )
        ),
        athlete:athletes(
          id,
          user_id,
          athlete_group_id
        ),
        workout_log_exercises(
          id,
          exercise_id,
          exercise_order,
          superset_id,
          notes,
          session_plan_exercise_id,
          exercise:exercises(
            id,
            name,
            description,
            video_url,
            exercise_type:exercise_types(id, type),
            unit:units(id, name)
          ),
          workout_log_sets(
            id,
            set_index,
            reps,
            weight,
            distance,
            performing_time,
            rest_time,
            velocity,
            power,
            height,
            effort,
            resistance,
            tempo,
            rpe,
            completed,
            metadata,
            workout_log_exercise_id
          )
        )
      `)
      .eq('athlete_id', targetAthleteId)
      .or(`session_status.eq.ongoing,and(session_status.eq.assigned,date_time.gte.${sevenDaysAgo.toISOString()},date_time.lte.${sevenDaysFromNow.toISOString()})`)
      .order('session_status', { ascending: false }) // ongoing first
      .order('date_time', { ascending: true }) // then by scheduled date (oldest first for overdue)

    if (error) {
      console.error('[getTodayAndOngoingSessionsAction] Error:', error)
      return { isSuccess: false, message: "Failed to fetch sessions" }
    }

    // 6. Transform and return data
    // Note: workout_log_sets are accessed via workout_log_exercises relationship (not duplicated at top level)
    const transformedSessions: WorkoutLogWithDetails[] = (sessions || []).map((session: any) => ({
      ...session,
      session_plan: session.session_plan as SessionPlanWithDetails,
      athlete: session.athlete,
      workout_log_exercises: session.workout_log_exercises || []
    }))

    return {
      isSuccess: true,
      message: "Sessions retrieved successfully",
      data: transformedSessions
    }
  } catch (error) {
    console.error('Error in getTodayAndOngoingSessionsAction:', error)
    return { isSuccess: false, message: "Failed to fetch sessions" }
  }
}

/**
 * Get past sessions with pagination (includes completed and cancelled/skipped)
 * @param statusFilter - Optional array of statuses to filter by. Defaults to ['completed', 'cancelled']
 */
export async function getPastSessionsAction(
  athleteId?: number,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  statusFilter?: SessionStatus[]
): Promise<ActionState<{
  sessions: WorkoutLogWithDetails[]
  totalCount: number
  hasMore: boolean
}>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get athlete ID if not provided, verify access if provided externally
    let targetAthleteId = athleteId
    if (!targetAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (!athlete) {
        return { isSuccess: false, message: "Athlete profile not found" }
      }
      targetAthleteId = athlete.id
    } else {
      // Phase 3: Verify user has access to this athlete when ID is provided externally
      const { authorized } = await verifyAthleteAccess(dbUserId, targetAthleteId)
      if (!authorized) {
        logAuthFailure("getPastSessionsAction", {
          userId: dbUserId,
          resourceType: "athlete",
          resourceId: targetAthleteId,
          reason: "User does not have access to this athlete's sessions"
        })
        return { isSuccess: false, message: "Not authorized to view this athlete's sessions" }
      }
    }

    // 4. Build date filter
    // Optimized: Select only required fields instead of *
    // Now includes workout_log_exercises with nested workout_log_sets
    let dateFilter = supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        athlete_id,
        session_plan_id,
        session_plan:session_plans(
          id,
          name,
          description,
          date,
          session_plan_exercises(
            id,
            exercise_order,
            notes,
            exercise_id,
            superset_id,
            exercise:exercises(
              id,
              name,
              description,
              video_url,
              exercise_type:exercise_types(id, type),
              unit:units(id, name)
            ),
            session_plan_sets(
              id,
              set_index,
              reps,
              weight,
              distance,
              performing_time,
              rest_time,
              rpe
            )
          )
        ),
        athlete:athletes(
          id,
          user_id,
          athlete_group_id
        ),
        workout_log_exercises(
          id,
          exercise_id,
          exercise_order,
          superset_id,
          notes,
          session_plan_exercise_id,
          exercise:exercises(
            id,
            name,
            description,
            video_url,
            exercise_type:exercise_types(id, type),
            unit:units(id, name)
          ),
          workout_log_sets(
            id,
            set_index,
            reps,
            weight,
            distance,
            performing_time,
            rest_time,
            velocity,
            power,
            height,
            effort,
            resistance,
            tempo,
            rpe,
            completed,
            metadata,
            workout_log_exercise_id
          )
        )
      `)
      .eq('athlete_id', targetAthleteId)

    // Apply status filter - default to completed and cancelled (skipped)
    const statuses = statusFilter || ['completed', 'cancelled']
    if (statuses.length === 1) {
      dateFilter = dateFilter.eq('session_status', statuses[0])
    } else {
      dateFilter = dateFilter.in('session_status', statuses)
    }

    if (startDate) {
      dateFilter = dateFilter.gte('date_time', startDate)
    }
    if (endDate) {
      dateFilter = dateFilter.lte('date_time', endDate)
    }

    // 5. Build count query with same status filter
    let countQuery = supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', targetAthleteId)

    if (statuses.length === 1) {
      countQuery = countQuery.eq('session_status', statuses[0])
    } else {
      countQuery = countQuery.in('session_status', statuses)
    }

    // 6. Run count and data queries in parallel (independent)
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dateFilter
        .order('date_time', { ascending: false })
        .range((page - 1) * limit, page * limit - 1),
    ])

    const { count, error: countError } = countResult
    const { data: sessions, error } = dataResult

    if (countError) {
      console.error('Error counting sessions:', countError)
      return { isSuccess: false, message: "Failed to count sessions" }
    }

    if (error) {
      console.error('Error fetching past sessions:', error)
      return { isSuccess: false, message: "Failed to fetch past sessions" }
    }

    // 7. Transform and return data
    // Note: workout_log_sets are accessed via workout_log_exercises relationship (not duplicated at top level)
    const transformedSessions: WorkoutLogWithDetails[] = (sessions || []).map((session: any) => ({
      ...session,
      session_plan: session.session_plan as SessionPlanWithDetails,
      athlete: session.athlete,
      workout_log_exercises: session.workout_log_exercises || []
    }))

    const totalCount = count || 0
    const hasMore = page * limit < totalCount

    return {
      isSuccess: true,
      message: "Past sessions retrieved successfully",
      data: {
        sessions: transformedSessions,
        totalCount,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error in getPastSessionsAction:', error)
    return { isSuccess: false, message: "Failed to fetch past sessions" }
  }
}

/**
 * Update training session status
 */
export async function updateTrainingSessionStatusAction(
  sessionId: string,
  status: SessionStatus
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Verify user owns this session
    const isOwner = await verifySessionOwnership(dbUserId, sessionId)
    if (!isOwner) {
      logAuthFailure("updateTrainingSessionStatusAction", {
        userId: dbUserId,
        resourceType: "workout_log",
        resourceId: sessionId,
        reason: "User does not own this workout session"
      })
      return { isSuccess: false, message: "Not authorized to modify this session" }
    }

    // 4. Update session status
    const { data: session, error } = await supabase
      .from('workout_logs')
      .update({
        session_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session status:', error)
      return { isSuccess: false, message: "Failed to update session status" }
    }

    revalidatePath('/workout', 'page')

    // 5. Auto-detect PBs when session is completed
    if (status === 'completed') {
      // Process session for personal bests asynchronously
      // This runs in the background to avoid blocking the response
      processSessionForPBsAction(sessionId)
        .then((result) => {
          if (result.isSuccess) {
            console.log(`[updateTrainingSessionStatusAction] PB detection: ${result.message}`)
          }
        })
        .catch((error) => {
          console.error('[updateTrainingSessionStatusAction] PB detection error:', error)
        })
    }

    return {
      isSuccess: true,
      message: "Session status updated successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in updateTrainingSessionStatusAction:', error)
    return { isSuccess: false, message: "Failed to update session status" }
  }
}

/**
 * Start a training session (transition from assigned to ongoing)
 * Copies session_plan_exercises into workout_log_exercises, filtering
 * by the athlete's event_group vs each exercise's target_event_groups.
 */
export async function startTrainingSessionAction(
  sessionId: string
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Verify user owns this session
    const isOwner = await verifySessionOwnership(dbUserId, sessionId)
    if (!isOwner) {
      logAuthFailure("startTrainingSessionAction", {
        userId: dbUserId,
        resourceType: "workout_log",
        resourceId: sessionId,
        reason: "User does not own this workout session"
      })
      return { isSuccess: false, message: "Not authorized to start this session" }
    }

    // 4. Update session to ongoing
    const { data: session, error } = await supabase
      .from('workout_logs')
      .update({
        session_status: 'ongoing',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error starting session:', error)
      return { isSuccess: false, message: "Failed to start session" }
    }

    // 5. Copy session_plan_exercises → workout_log_exercises (with event_group filtering)
    // Only copy if workout_log_exercises don't already exist for this session
    const { count: existingCount } = await supabase
      .from('workout_log_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('workout_log_id', session.id)

    if ((existingCount ?? 0) === 0 && session.session_plan_id) {
      // Fetch athlete's event_group and session_plan_exercises in parallel
      const [athleteResult, exercisesResult] = await Promise.all([
        supabase
          .from('athletes')
          .select('event_group')
          .eq('user_id', dbUserId)
          .single(),
        supabase
          .from('session_plan_exercises')
          .select('id, exercise_id, exercise_order, superset_id, notes, target_event_groups')
          .eq('session_plan_id', session.session_plan_id)
          .order('exercise_order', { ascending: true })
      ])

      const athleteEventGroup = athleteResult.data?.event_group ?? null
      const sessionPlanExercises = exercisesResult.data ?? []

      // Filter exercises by target_event_groups:
      // Include if: target_event_groups IS NULL (all athletes),
      //             OR athlete's event_group IS NULL (no group = sees everything),
      //             OR athlete's event_group is in target_event_groups
      const filteredExercises = sessionPlanExercises.filter((spe) => {
        if (!spe.target_event_groups || spe.target_event_groups.length === 0) return true
        if (!athleteEventGroup) return true
        return spe.target_event_groups.includes(athleteEventGroup)
      })

      // Create workout_log_exercises for filtered exercises
      const workoutLogExercises = filteredExercises
        .filter((spe) => spe.exercise_id !== null && spe.exercise_order !== null)
        .map((spe) => ({
          workout_log_id: session.id,
          exercise_id: spe.exercise_id as number,
          session_plan_exercise_id: spe.id,
          exercise_order: spe.exercise_order as number,
          superset_id: spe.superset_id,
          notes: spe.notes
        }))

      if (workoutLogExercises.length > 0) {
        const { error: insertError } = await supabase
          .from('workout_log_exercises')
          .insert(workoutLogExercises)

        if (insertError) {
          console.error('[startTrainingSessionAction] Error creating workout_log_exercises:', insertError)
          // Non-fatal: session was started, exercises can be loaded from plan as fallback
        }
      }
    }

    revalidatePath('/workout', 'page')

    return {
      isSuccess: true,
      message: "Session started successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in startTrainingSessionAction:', error)
    return { isSuccess: false, message: "Failed to start session" }
  }
}

/**
 * Skip/miss a workout session
 * Allows athletes to mark an assigned workout as skipped rather than completing it
 * Only works for 'assigned' status (not ongoing or completed)
 */
export async function skipWorkoutSessionAction(
  sessionId: string,
  reason?: string
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Verify user owns this session
    const isOwner = await verifySessionOwnership(dbUserId, sessionId)
    if (!isOwner) {
      logAuthFailure("skipWorkoutSessionAction", {
        userId: dbUserId,
        resourceType: "workout_log",
        resourceId: sessionId,
        reason: "User does not own this workout session"
      })
      return { isSuccess: false, message: "Not authorized to skip this session" }
    }

    // 4. Verify session is in 'assigned' status (can only skip unstarted workouts)
    const { data: currentSession } = await supabase
      .from('workout_logs')
      .select('session_status')
      .eq('id', sessionId)
      .single()

    if (!currentSession) {
      return { isSuccess: false, message: "Session not found" }
    }

    if (currentSession.session_status !== 'assigned') {
      return {
        isSuccess: false,
        message: currentSession.session_status === 'ongoing'
          ? "Cannot skip a workout that is in progress. Complete or cancel it instead."
          : "Cannot skip a workout that is already completed or cancelled."
      }
    }

    // 5. Update session to cancelled with skip reason
    const skipNote = reason
      ? `Skipped by athlete: ${reason}`
      : 'Skipped by athlete'

    const { data: session, error } = await supabase
      .from('workout_logs')
      .update({
        session_status: 'cancelled',
        notes: skipNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error skipping session:', error)
      return { isSuccess: false, message: "Failed to skip session" }
    }

    revalidatePath('/workout', 'page')

    return {
      isSuccess: true,
      message: "Workout skipped successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in skipWorkoutSessionAction:', error)
    return { isSuccess: false, message: "Failed to skip session" }
  }
}

/**
 * Get a specific workout session by ID with all details
 */
export async function getWorkoutSessionByIdAction(
  sessionId: string
): Promise<ActionState<WorkoutLogWithDetails>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get athlete ID for authorization check
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // 4. Query session with full details
    const { data: session, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        athlete_id,
        session_plan_id,
        session_plan:session_plans(
          id,
          name,
          description,
          date,
          session_plan_exercises(
            id,
            exercise_order,
            notes,
            exercise_id,
            superset_id,
            target_event_groups,
            exercise:exercises(
              id,
              name,
              description,
              video_url,
              exercise_type:exercise_types(id, type),
              unit:units(id, name)
            ),
            session_plan_sets(
              id,
              set_index,
              reps,
              weight,
              distance,
              performing_time,
              rest_time,
              rpe
            )
          )
        ),
        athlete:athletes(
          id,
          user_id,
          athlete_group_id,
          event_group
        ),
        workout_log_exercises(
          id,
          exercise_id,
          exercise_order,
          superset_id,
          notes,
          session_plan_exercise_id,
          exercise:exercises(
            id,
            name,
            description,
            video_url,
            exercise_type:exercise_types(id, type),
            unit:units(id, name)
          ),
          workout_log_sets(
            id,
            set_index,
            reps,
            weight,
            distance,
            performing_time,
            rest_time,
            velocity,
            power,
            height,
            effort,
            resistance,
            tempo,
            rpe,
            completed,
            metadata,
            workout_log_exercise_id
          )
        )
      `)
      .eq('id', sessionId)
      .eq('athlete_id', athlete.id) // Authorization: user can only access their own sessions
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { isSuccess: false, message: "Session not found" }
      }
      console.error('[getWorkoutSessionByIdAction] Error:', error)
      return { isSuccess: false, message: "Failed to fetch session" }
    }

    // 5. Transform and return data
    // Use type assertion - the select includes all fields needed for the UI
    // Note: workout_log_sets are accessed via workout_log_exercises relationship (not duplicated at top level)
    const transformedSession = {
      ...session,
      session_plan: session.session_plan,
      athlete: session.athlete,
      workout_log_exercises: session.workout_log_exercises || []
    } as unknown as WorkoutLogWithDetails

    return {
      isSuccess: true,
      message: "Session retrieved successfully",
      data: transformedSession
    }
  } catch (error) {
    console.error('Error in getWorkoutSessionByIdAction:', error)
    return { isSuccess: false, message: "Failed to fetch session" }
  }
}
