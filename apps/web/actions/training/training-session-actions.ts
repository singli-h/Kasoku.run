/*
<ai_context>
Server actions for training session tracking and performance data.
Handles actual workout execution, performance recording, and progress tracking.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  ExerciseTrainingSession, ExerciseTrainingSessionInsert, ExerciseTrainingSessionUpdate,
  ExerciseTrainingDetail,
  ExerciseTrainingSessionWithDetails,
  PerformanceMetrics,
  ExerciseProgress
} from "@/types/training"

// ============================================================================
// TRAINING SESSION ACTIONS
// ============================================================================

/**
 * Start a new training session
 */
export async function startTrainingSessionAction(
  exercisePresetGroupId: number,
  athleteId?: number
): Promise<ActionState<ExerciseTrainingSession>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Determine the athlete ID - either provided (for coaches) or current user's athlete profile
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
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

    const sessionData: ExerciseTrainingSessionInsert = {
      exercise_preset_group_id: exercisePresetGroupId,
      athlete_id: finalAthleteId,
      date_time: new Date().toISOString(),
      notes: null,
      status: 'planned'
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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Determine the athlete ID - either provided (for coaches) or current user's athlete profile
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
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

    const supabase = createServerSupabaseClient()

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
  updates: Partial<ExerciseTrainingSessionUpdate>
): Promise<ActionState<ExerciseTrainingSession>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

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
 * Complete a training session
 */
export async function completeTrainingSessionAction(
  sessionId: number,
  notes?: string
): Promise<ActionState<ExerciseTrainingSession>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const updates: Partial<ExerciseTrainingSessionUpdate> = {
      status: 'completed',
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

    const supabase = createServerSupabaseClient()

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

    const supabase = createServerSupabaseClient()

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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Determine the athlete ID
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
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
        date,
        completion_status,
        exercise_training_details(
          reps,
          weight,
          rpe
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
      if (session.completion_status === 'completed') {
        completedSessions++
      }
      
      session.exercise_training_details?.forEach(detail => {
        totalSets++
        if (detail.reps) totalReps += detail.reps
        if (detail.weight) totalWeight += detail.weight
        if (detail.rpe) {
          rpeSum += detail.rpe
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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Determine the athlete ID
    let finalAthleteId = athleteId
    
    if (!finalAthleteId) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
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
        exercise_id,
        reps,
        weight,
        rpe,
        exercise_training_session:exercise_training_sessions!inner(
          athlete_id,
          date,
          completion_status
        ),
        exercise:exercises(
          name
        )
      `)
      .eq('exercise_training_session.athlete_id', finalAthleteId)
      .eq('exercise_training_session.completion_status', 'completed')
      .order('exercise_training_session.date', { ascending: false })

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
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
      if (!exerciseMap.has(detail.exercise_id)) {
        exerciseMap.set(detail.exercise_id, {
          exercise_id: detail.exercise_id,
          exercise_name: detail.exercise?.name || 'Unknown Exercise',
          sessions_completed: 0,
          pr_weight: 0,
          pr_reps: 0,
          pr_date: null,
          rpe_sum: 0,
          rpe_count: 0,
          weights: []
        })
      }
      
      const exerciseData = exerciseMap.get(detail.exercise_id)
      exerciseData.sessions_completed++
      
      if (detail.weight && detail.weight > exerciseData.pr_weight) {
        exerciseData.pr_weight = detail.weight
        exerciseData.pr_date = detail.exercise_training_session?.date
      }
      
      if (detail.reps && detail.reps > exerciseData.pr_reps) {
        exerciseData.pr_reps = detail.reps
      }
      
      if (detail.rpe) {
        exerciseData.rpe_sum += detail.rpe
        exerciseData.rpe_count++
      }
      
      if (detail.weight) {
        exerciseData.weights.push(detail.weight)
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