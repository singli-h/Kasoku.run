/*
<ai_context>
Server actions for training session tracking and performance data.
Handles actual workout execution, performance recording, and progress tracking.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import {
  ExerciseTrainingDetail,
  ExerciseTrainingSessionWithDetails,
  PerformanceMetrics,
  ExerciseProgress
} from "@/types/training"
import { Database } from "@/types/database"
import { autoDetectPBAction } from "@/actions/athletes/personal-best-actions"

// ============================================================================
// TRAINING SESSION ACTIONS
// ============================================================================

/**
 * Start a new training session
 */
export async function startTrainingSessionAction(
  exercisePresetGroupId: number,
  athleteId?: number
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Determine the athlete ID - either provided (for coaches) or current user's athlete profile
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()
      
      if (athlete) {
        finalAthleteId = athlete.id
      }
    }

    if (!finalAthleteId) {
      return {
        isSuccess: false,
        message: "No athlete profile found"
      }
    }

    const sessionData: Database["public"]["Tables"]["exercise_training_sessions"]["Insert"] = {
      exercise_preset_group_id: exercisePresetGroupId,
      athlete_id: finalAthleteId,
      date_time: new Date().toISOString(),
      notes: null,
      session_status: 'assigned'
    }

    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Error starting training session:', error)
      return {
        isSuccess: false,
        message: `Failed to start training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session started successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in startTrainingSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get training sessions for an athlete
 */
export async function getTrainingSessionsAction(
  athleteId?: number,
  limit?: number
): Promise<ActionState<ExerciseTrainingSessionWithDetails[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID using the cache utility
    const dbUserId = await getDbUserId(userId)

    // Determine the athlete ID - either provided (for coaches) or current user's athlete profile
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()
      
      if (athlete) {
        finalAthleteId = athlete.id
      }
    }

    if (!finalAthleteId) {
      return {
        isSuccess: false,
        message: "No athlete profile found"
      }
    }

    let query = supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        athlete:athletes(
          *,
          user:users(
            first_name,
            last_name,
            email
          )
        ),
        exercise_preset_group:exercise_preset_groups(
          *,
          exercise_presets(
            *,
            exercise:exercises(
              *,
              exercise_type:exercise_types(*)
            )
          )
        ),
        exercise_training_details(*)
      `)
      .eq('athlete_id', finalAthleteId)
      .order('date_time', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching training sessions:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch training sessions: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training sessions retrieved successfully",
      data: sessions || []
    }
  } catch (error) {
    console.error('Error in getTrainingSessionsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific training session by ID
 */
export async function getTrainingSessionByIdAction(
  sessionId: number
): Promise<ActionState<ExerciseTrainingSessionWithDetails>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        athlete:athletes(
          *,
          user:users(
            first_name,
            last_name,
            email
          )
        ),
        exercise_preset_group:exercise_preset_groups(
          *,
          exercise_presets(
            *,
            exercise:exercises(
              *,
              exercise_type:exercise_types(*),
              unit:units(*)
            ),
            exercise_preset_details(*)
          )
        ),
        exercise_training_details(*)
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching training session:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Training session not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session retrieved successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in getTrainingSessionByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update training session (e.g., add notes, update completion status)
 */
export async function updateTrainingSessionAction(
  sessionId: number,
  updates: Partial<Database["public"]["Tables"]["exercise_training_sessions"]["Update"]>
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating training session:', error)
      return {
        isSuccess: false,
        message: `Failed to update training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session updated successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in updateTrainingSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Complete a training session with auto-PB detection for sprint exercises
 */
export async function completeTrainingSessionAction(
  sessionId: number,
  notes?: string
): Promise<ActionState<Database["public"]["Tables"]["exercise_training_sessions"]["Row"]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    // First, get the session with athlete_id and exercise details for PB detection
    const { data: sessionData, error: fetchError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        athlete_id,
        exercise_training_details(
          id,
          exercise_id,
          distance,
          performing_time,
          completed
        )
      `)
      .eq('id', sessionId)
      .single()

    if (fetchError) {
      console.error('Error fetching session for completion:', fetchError)
      return {
        isSuccess: false,
        message: `Failed to fetch session: ${fetchError.message}`
      }
    }

    // Auto-detect personal bests from completed sprint exercises
    // Only check exercises with distance and performing_time (sprint exercises)
    const pbDetectionPromises: Promise<any>[] = []

    if (sessionData.athlete_id && sessionData.exercise_training_details && Array.isArray(sessionData.exercise_training_details)) {
      const athleteId = sessionData.athlete_id // Extract to const for type narrowing
      sessionData.exercise_training_details.forEach((detail: any) => {
        // Only process completed sets with time (sprint exercises - distance is implicit in exercise_id)
        if (detail.completed && detail.distance && detail.performing_time) {
          pbDetectionPromises.push(
            autoDetectPBAction(
              sessionId,
              athleteId,
              detail.exercise_id,
              detail.performing_time
            ).catch(err => {
              // Log but don't fail session completion if PB detection fails
              console.error('[completeTrainingSessionAction] PB detection failed:', err)
              return null
            })
          )
        }
      })
    }

    // Run PB detection in parallel (don't block session completion)
    if (pbDetectionPromises.length > 0) {
      await Promise.allSettled(pbDetectionPromises)
    }

    // Now complete the session
    const updates: Partial<Database["public"]["Tables"]["exercise_training_sessions"]["Update"]> = {
      session_status: 'completed',
      notes: notes || null
    }

    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error completing training session:', error)
      return {
        isSuccess: false,
        message: `Failed to complete training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session completed successfully",
      data: session
    }
  } catch (error) {
    console.error('Error in completeTrainingSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EXERCISE TRAINING DETAIL ACTIONS (Set-by-set performance)
// ============================================================================

/**
 * Add performance data for a specific exercise in a training session
 */
export async function addExercisePerformanceAction(
  sessionId: number,
  exerciseId: number,
  setData: {
    set_index: number
    reps?: number
    weight?: number
    rest_time?: number
    rpe?: number
    tempo?: string
    resistance?: number
    distance?: number
    performing_time?: number
    notes?: string
  }
): Promise<ActionState<ExerciseTrainingDetail>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const detailData = {
      exercise_training_session_id: sessionId,
      exercise_id: exerciseId,
      set_index: setData.set_index,
      reps: setData.reps || null,
      weight: setData.weight || null,
      rest_time: setData.rest_time || null,
      rpe: setData.rpe || null,
      tempo: setData.tempo || null,
      resistance: setData.resistance || null,
      distance: setData.distance || null,
      performing_time: setData.performing_time || null,
      notes: setData.notes || null
    }

    const { data: detail, error } = await supabase
      .from('exercise_training_details')
      .insert(detailData)
      .select()
      .single()

    if (error) {
      console.error('Error adding exercise performance:', error)
      return {
        isSuccess: false,
        message: `Failed to add exercise performance: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise performance added successfully",
      data: detail
    }
  } catch (error) {
    console.error('Error in addExercisePerformanceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update exercise performance data
 */
export async function updateExercisePerformanceAction(
  detailId: number,
  updates: Partial<ExerciseTrainingDetail>
): Promise<ActionState<ExerciseTrainingDetail>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const { data: detail, error } = await supabase
      .from('exercise_training_details')
      .update(updates)
      .eq('id', detailId)
      .select()
      .single()

    if (error) {
      console.error('Error updating exercise performance:', error)
      return {
        isSuccess: false,
        message: `Failed to update exercise performance: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise performance updated successfully",
      data: detail
    }
  } catch (error) {
    console.error('Error in updateExercisePerformanceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// PERFORMANCE ANALYTICS ACTIONS
// ============================================================================

/**
 * Get performance metrics for an athlete
 */
export async function getPerformanceMetricsAction(
  athleteId?: number,
  startDate?: string,
  endDate?: string
): Promise<ActionState<PerformanceMetrics>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Determine the athlete ID
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()
      
      if (athlete) {
        finalAthleteId = athlete.id
      }
    }

    if (!finalAthleteId) {
      return {
        isSuccess: false,
        message: "No athlete profile found"
      }
    }

    // Build query for training sessions in date range
    let sessionQuery = supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        date_time,
        session_status,
        exercise_training_details(
          reps,
          resistance_unit_id,
          power
        )
      `)
      .eq('athlete_id', finalAthleteId)

    if (startDate) {
      sessionQuery = sessionQuery.gte('date', startDate)
    }
    if (endDate) {
      sessionQuery = sessionQuery.lte('date', endDate)
    }

    const { data: sessions, error } = await sessionQuery

    if (error) {
      console.error('Error fetching performance metrics:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch performance metrics: ${error.message}`
      }
    }

    // Calculate metrics
    let totalSets = 0
    let totalReps = 0
    let totalWeight = 0
    let rpeSum = 0
    let rpeCount = 0
    let completedSessions = 0

    sessions?.forEach(session => {
      if (session.session_status === 'completed') {
        completedSessions++
      }
      
      session.exercise_training_details?.forEach(detail => {
        totalSets++
        if (detail.reps) totalReps += detail.reps
        if (detail.resistance_unit_id) totalWeight += detail.resistance_unit_id
        if (detail.power) {
          rpeSum += detail.power
          rpeCount++
        }
      })
    })

    const metrics: PerformanceMetrics = {
      total_sets: totalSets,
      total_reps: totalReps,
      total_weight: totalWeight,
      average_rpe: rpeCount > 0 ? rpeSum / rpeCount : 0,
      completion_rate: sessions && sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0,
      streak_days: 0 // Would need more complex query to calculate properly
    }

    return {
      isSuccess: true,
      message: "Performance metrics calculated successfully",
      data: metrics
    }
  } catch (error) {
    console.error('Error in getPerformanceMetricsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get exercise progress for an athlete
 */
export async function getExerciseProgressAction(
  athleteId?: number,
  exerciseId?: number
): Promise<ActionState<ExerciseProgress[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Determine the athlete ID
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()
      
      if (athlete) {
        finalAthleteId = athlete.id
      }
    }

    if (!finalAthleteId) {
      return {
        isSuccess: false,
        message: "No athlete profile found"
      }
    }

    // Query exercise training details with exercise information
    let query = supabase
      .from('exercise_training_details')
      .select(`
        exercise_preset_id,
        reps,
        resistance_unit_id,
        power,
        exercise_training_session:exercise_training_sessions!inner(
          athlete_id,
          date_time,
          session_status
        ),
        exercise_preset:exercise_presets(
          exercise:exercises(
            id,
            name
          )
        )
      `)
      .eq('exercise_training_session.athlete_id', finalAthleteId)
      .eq('exercise_training_session.session_status', 'completed')
      .order('exercise_training_session.date_time', { ascending: false })

    if (exerciseId) {
      query = query.eq('exercise_preset.exercise_id', exerciseId)
    }

    const { data: details, error } = await query

    if (error) {
      console.error('Error fetching exercise progress:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch exercise progress: ${error.message}`
      }
    }

    // Group by exercise and calculate progress
    const exerciseMap = new Map<number, any>()
    
    details?.forEach(detail => {
      const exerciseId = detail.exercise_preset?.exercise?.id
      if (!exerciseId) return // Skip if no exercise ID
      
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, {
          exercise_id: exerciseId,
          exercise_name: detail.exercise_preset?.exercise?.name || 'Unknown Exercise',
          sessions_completed: 0,
          pr_weight: 0,
          pr_reps: 0,
          pr_date: null,
          rpe_sum: 0,
          rpe_count: 0,
          weights: []
        })
      }
      
      const exerciseData = exerciseMap.get(exerciseId)
      if (exerciseData) {
        exerciseData.sessions_completed++
        
        if (detail.resistance_unit_id && detail.resistance_unit_id > exerciseData.pr_weight) {
          exerciseData.pr_weight = detail.resistance_unit_id
          exerciseData.pr_date = detail.exercise_training_session?.date_time || null
        }
        
        if (detail.reps && detail.reps > exerciseData.pr_reps) {
          exerciseData.pr_reps = detail.reps
        }
        
        if (detail.power) {
          exerciseData.rpe_sum += detail.power
          exerciseData.rpe_count++
        }
        
        if (detail.resistance_unit_id) {
          exerciseData.weights.push(detail.resistance_unit_id)
        }
      }
    })

    // Convert to final format
    const progress: ExerciseProgress[] = Array.from(exerciseMap.values()).map(data => ({
      exercise_id: data.exercise_id,
      exercise_name: data.exercise_name,
      sessions_completed: data.sessions_completed,
      pr_weight: data.pr_weight || undefined,
      pr_reps: data.pr_reps || undefined,
      pr_date: data.pr_date || undefined,
      average_rpe: data.rpe_count > 0 ? data.rpe_sum / data.rpe_count : 0,
      volume_trend: data.weights.length > 1 ? 
        (data.weights[0] > data.weights[data.weights.length - 1] ? 'increasing' : 
         data.weights[0] < data.weights[data.weights.length - 1] ? 'decreasing' : 'stable') 
        : 'stable'
    }))

    return {
      isSuccess: true,
      message: "Exercise progress retrieved successfully",
      data: progress
    }
  } catch (error) {
    console.error('Error in getExerciseProgressAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 
// ============================================================================
// COACH GROUP SESSION ACTIONS (Phase 2)
// ============================================================================

/**
 * Get all active group sessions for the coach
 * Used in SessionsListView to show all sessions the coach can manage
 */
export async function getGroupSessionsAction(): Promise<ActionState<{
  id: number
  name: string
  date: string
  athleteGroupName: string
  athleteCount: number
  status: string
}[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get coach ID
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!coach) {
      return {
        isSuccess: false,
        message: "No coach profile found"
      }
    }

    // First, get coach's athlete group IDs
    const { data: athleteGroups } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('coach_id', coach.id)

    if (!athleteGroups || athleteGroups.length === 0) {
      return {
        isSuccess: true,
        message: "No athlete groups found",
        data: []
      }
    }

    const groupIds = athleteGroups.map(g => g.id)

    // Get all exercise_training_sessions linked to coach's athlete groups
    const { data: sessions, error } = await supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        date_time,
        session_status,
        athlete_group_id,
        exercise_preset_group_id,
        exercise_preset_groups (
          name
        ),
        athlete_groups!exercise_training_sessions_athlete_group_id_fkey (
          id,
          group_name,
          athletes (count)
        )
      `)
      .not('athlete_group_id', 'is', null)
      .in('athlete_group_id', groupIds)
      .in('session_status', ['assigned', 'ongoing'])
      .order('date_time', { ascending: false })

    if (error) {
      console.error('[getGroupSessionsAction] DB error:', error)
      return {
        isSuccess: false,
        message: 'Failed to fetch group sessions'
      }
    }

    // Transform to response format
    const formattedSessions = sessions.map((session: any) => ({
      id: session.id,
      name: session.exercise_preset_groups?.name || 'Untitled Session',
      date: session.date_time || new Date().toISOString(),
      athleteGroupName: session.athlete_groups?.group_name || 'Unknown Group',
      athleteCount: session.athlete_groups?.athletes?.[0]?.count || 0,
      status: session.session_status
    }))

    return {
      isSuccess: true,
      message: "Group sessions retrieved successfully",
      data: formattedSessions
    }
  } catch (error) {
    console.error('[getGroupSessionsAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get detailed session data for coach's spreadsheet view
 * Includes athletes, exercises, performance data, and PBs
 */
export async function getGroupSessionDataAction(sessionId: number): Promise<ActionState<{
  session: {
    id: number
    name: string
    date: string
    status: string
    athleteGroupId: number
  }
  athletes: {
    id: number
    name: string
    userId: number
  }[]
  exercises: {
    id: number
    name: string
    sets: number
    reps: number
    distance: number | null
    unit: string
  }[]
  performanceData: {
    [athleteId: number]: {
      [exerciseId: number]: {
        [setIndex: number]: {
          performingTime: number | null
          completed: boolean
        }
      }
    }
  }
  personalBests: {
    [athleteId: number]: {
      [exerciseId: number]: {
        value: number
        unitId: number
        achievedDate: string
      }
    }
  }
}>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get coach ID and verify ownership
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!coach) {
      return {
        isSuccess: false,
        message: "No coach profile found"
      }
    }

    // Get session with related data
    const { data: session, error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        date_time,
        session_status,
        athlete_group_id,
        exercise_preset_group_id,
        exercise_preset_groups (
          id,
          name,
          exercise_presets (
            id,
            order_index,
            exercise:exercises (
              id,
              name
            ),
            exercise_preset_details (
              id,
              set_index,
              reps,
              distance,
              unit:units (
                id,
                name
              )
            )
          )
        ),
        athlete_groups!exercise_training_sessions_athlete_group_id_fkey (
          id,
          group_name,
          coach_id,
          athletes (
            id,
            user:users (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('[getGroupSessionDataAction] Session error:', sessionError)
      return {
        isSuccess: false,
        message: 'Failed to fetch session data'
      }
    }

    // Verify coach owns this session's athlete group
    const athleteGroup: any = session.athlete_groups
    if (!athleteGroup || athleteGroup.coach_id !== coach.id) {
      return {
        isSuccess: false,
        message: 'Unauthorized: You do not own this athlete group'
      }
    }

    // Get athletes in the group
    const athletes = athleteGroup.athletes.map((athlete: any) => ({
      id: athlete.id,
      name: `${athlete.user.first_name} ${athlete.user.last_name}`,
      userId: athlete.user.id
    }))

    const athleteIds = athletes.map((a: { id: number }) => a.id)

    // Get exercises from preset group
    const presetGroup: any = session.exercise_preset_groups
    const exercises = presetGroup?.exercise_presets?.map((preset: any) => {
      const firstDetail = preset.exercise_preset_details?.[0]
      return {
        id: preset.exercise.id,
        name: preset.exercise.name,
        sets: preset.exercise_preset_details?.length || 0,
        reps: firstDetail?.reps || 0,
        distance: firstDetail?.distance || null,
        unit: firstDetail?.unit?.name || 'reps'
      }
    }) || []

    const exerciseIds = exercises.map((e: any) => e.id)

    // Get existing performance data (exercise_training_details)
    const { data: existingPerformance } = await supabase
      .from('exercise_training_details')
      .select('*')
      .eq('exercise_training_session_id', sessionId)

    // Build performance data map
    const performanceData: any = {}
    athletes.forEach((athlete: any) => {
      performanceData[athlete.id] = {}
    })

    existingPerformance?.forEach((detail: any) => {
      const athleteId = detail.athlete_id
      const exerciseId = detail.exercise_id
      const setIndex = detail.set_index || 1

      if (!performanceData[athleteId]) {
        performanceData[athleteId] = {}
      }
      if (!performanceData[athleteId][exerciseId]) {
        performanceData[athleteId][exerciseId] = {}
      }

      performanceData[athleteId][exerciseId][setIndex] = {
        performingTime: detail.performing_time,
        completed: detail.completed || false
      }
    })

    // Get personal bests for athletes + exercises
    const { data: pbs } = await supabase
      .from('athlete_personal_bests')
      .select('athlete_id, exercise_id, value, unit_id, achieved_date')
      .in('athlete_id', athleteIds)
      .in('exercise_id', exerciseIds)

    // Build PB map
    const personalBests: any = {}
    athletes.forEach((athlete: any) => {
      personalBests[athlete.id] = {}
    })

    pbs?.forEach((pb: any) => {
      if (!personalBests[pb.athlete_id]) {
        personalBests[pb.athlete_id] = {}
      }
      personalBests[pb.athlete_id][pb.exercise_id] = {
        value: pb.value,
        unitId: pb.unit_id,
        achievedDate: pb.achieved_date
      }
    })

    return {
      isSuccess: true,
      message: "Session data retrieved successfully",
      data: {
        session: {
          id: session.id,
          name: presetGroup?.name || 'Untitled Session',
          date: session.date_time || new Date().toISOString(),
          status: session.session_status,
          athleteGroupId: athleteGroup.id
        },
        athletes,
        exercises,
        performanceData,
        personalBests
      }
    }
  } catch (error) {
    console.error('[getGroupSessionDataAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update a single set's performance data (for auto-save)
 * Called when coach enters time in spreadsheet cell
 */
export async function updateSessionDetailAction(
  sessionId: number,
  athleteId: number,
  exerciseId: number,
  setIndex: number,
  performingTime: number | null
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify coach owns this session
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!coach) {
      return {
        isSuccess: false,
        message: "No coach profile found"
      }
    }

    // Verify coach owns the session's athlete group
    const { data: session, error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        id,
        athlete_group_id,
        athlete_groups!exercise_training_sessions_athlete_group_id_fkey(coach_id)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('[updateSessionDetailAction] Session not found:', sessionError)
      return {
        isSuccess: false,
        message: 'Session not found'
      }
    }

    const athleteGroup: any = session.athlete_groups
    if (!athleteGroup || athleteGroup.coach_id !== coach.id) {
      return {
        isSuccess: false,
        message: 'Unauthorized: You do not own this session'
      }
    }

    // Check if detail already exists
    const { data: existing } = await supabase
      .from('exercise_training_details')
      .select('id')
      .eq('exercise_training_session_id', sessionId)
      .eq('athlete_id', athleteId)
      .eq('exercise_id', exerciseId)
      .eq('set_index', setIndex)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('exercise_training_details')
        .update({
          performing_time: performingTime,
          completed: performingTime !== null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('[updateSessionDetailAction] Update error:', updateError)
        return {
          isSuccess: false,
          message: 'Failed to update performance data'
        }
      }
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('exercise_training_details')
        .insert({
          exercise_training_session_id: sessionId,
          athlete_id: athleteId,
          exercise_id: exerciseId,
          set_index: setIndex,
          performing_time: performingTime,
          completed: performingTime !== null,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('[updateSessionDetailAction] Insert error:', insertError)
        return {
          isSuccess: false,
          message: 'Failed to create performance data'
        }
      }
    }

    // Revalidate session pages to reflect new data
    revalidatePath(`/sessions/${sessionId}`)
    revalidatePath('/sessions')

    return {
      isSuccess: true,
      message: "Performance data saved",
      data: undefined
    }
  } catch (error) {
    console.error('[updateSessionDetailAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
