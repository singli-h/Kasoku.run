/*
<ai_context>
Server actions for workout session discovery and management.
Handles session prioritization (ongoing first, then today assigned), 
history pagination, and status updates following 2025 best practices.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { 
  ExerciseTrainingSessionWithDetails,
  ExercisePresetGroupWithDetails
} from "@/types/training"
import { Database } from "@/types/database"

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
): Promise<ActionState<ExerciseTrainingSessionWithDetails[]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get athlete ID if not provided
    let targetAthleteId = athleteId
    if (!targetAthleteId) {
      // Get athlete ID from user
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()
      
      if (!athlete) {
        return { isSuccess: false, message: "Athlete profile not found" }
      }
      targetAthleteId = athlete.id
    }

    // 4. Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // 5. Query sessions with proper prioritization
    // Optimized: Select only required fields instead of *
    const { data: sessions, error } = await supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        athlete_id,
        exercise_preset_group_id,
        exercise_preset_group:exercise_preset_groups(
          id,
          name,
          description,
          date,
          exercise_presets(
            id,
            preset_order,
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
            exercise_preset_details(
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
        exercise_training_details(
          id,
          set_index,
          reps,
          weight,
          distance,
          performing_time,
          completed,
          exercise_preset_id
        )
      `)
      .eq('athlete_id', targetAthleteId)
      .or(`session_status.eq.ongoing,and(date_time.gte.${startOfDay.toISOString()},date_time.lt.${endOfDay.toISOString()},session_status.eq.assigned)`)
      .order('session_status', { ascending: false }) // ongoing first
      .order('date_time', { ascending: true })

    if (error) {
      console.error('Error fetching sessions:', error)
      return { isSuccess: false, message: "Failed to fetch sessions" }
    }

    // 6. Transform and return data
    const transformedSessions: ExerciseTrainingSessionWithDetails[] = (sessions || []).map((session: any) => ({
      ...session,
      exercise_preset_group: session.exercise_preset_group as ExercisePresetGroupWithDetails,
      athlete: session.athlete,
      exercise_training_details: session.exercise_training_details || []
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
 * Get past completed sessions with pagination
 */
export async function getPastSessionsAction(
  athleteId?: number,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<ActionState<{
  sessions: ExerciseTrainingSessionWithDetails[]
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

    // 3. Get athlete ID if not provided
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
    }

    // 4. Build date filter
    // Optimized: Select only required fields instead of *
    let dateFilter = supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        athlete_id,
        exercise_preset_group_id,
        exercise_preset_group:exercise_preset_groups(
          id,
          name,
          description,
          date,
          exercise_presets(
            id,
            preset_order,
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
            exercise_preset_details(
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
        exercise_training_details(
          id,
          set_index,
          reps,
          weight,
          distance,
          performing_time,
          completed,
          exercise_preset_id
        )
      `)
      .eq('athlete_id', targetAthleteId)
      .eq('session_status', 'completed')

    if (startDate) {
      dateFilter = dateFilter.gte('date_time', startDate)
    }
    if (endDate) {
      dateFilter = dateFilter.lte('date_time', endDate)
    }

    // 5. Get total count
    const { count, error: countError } = await supabase
      .from('exercise_training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', targetAthleteId)
      .eq('session_status', 'completed')

    if (countError) {
      console.error('Error counting sessions:', countError)
      return { isSuccess: false, message: "Failed to count sessions" }
    }

    // 6. Get paginated sessions
    const { data: sessions, error } = await dateFilter
      .order('date_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Error fetching past sessions:', error)
      return { isSuccess: false, message: "Failed to fetch past sessions" }
    }

    // 7. Transform and return data
    const transformedSessions: ExerciseTrainingSessionWithDetails[] = (sessions || []).map((session: any) => ({
      ...session,
      exercise_preset_group: session.exercise_preset_group as ExercisePresetGroupWithDetails,
      athlete: session.athlete,
      exercise_training_details: session.exercise_training_details || []
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
  sessionId: number,
  status: SessionStatus
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Update session status
    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
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
 */
export async function startTrainingSessionAction(
  sessionId: number
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Update session to ongoing
    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
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
 * Complete a training session (transition from ongoing to completed)
 */
export async function completeTrainingSessionAction(
  sessionId: number
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Update session to completed
    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .update({ 
        session_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error completing session:', error)
      return { isSuccess: false, message: "Failed to complete session" }
    }

    return {
      isSuccess: true,
      message: "Session completed successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in completeTrainingSessionAction:', error)
    return { isSuccess: false, message: "Failed to complete session" }
  }
}
