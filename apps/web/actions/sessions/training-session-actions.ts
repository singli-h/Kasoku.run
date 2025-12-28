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
  WorkoutLogWithDetails,
  PerformanceMetrics,
  ExerciseProgress
} from "@/types/training"
import { Database } from "@/types/database"
import { autoDetectPBAction } from "@/actions/athletes/personal-best-actions"

// ============================================================================
// TRAINING SESSION ACTIONS
// ============================================================================

/**
 * Create a new training session
 * Creates workout_log and workout_log_exercises for each exercise in the session plan
 * Sets status to 'ongoing' immediately as this is an explicit start action
 */
export async function createTrainingSessionAction(
  sessionPlanId: number,
  athleteId?: number
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
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

    // Step 1: Create the workout_log
    const sessionData: Database["public"]["Tables"]["workout_logs"]["Insert"] = {
      session_plan_id: sessionPlanId,
      athlete_id: finalAthleteId,
      date_time: new Date().toISOString(),
      notes: null,
      session_status: 'ongoing' // Changed from 'assigned' to 'ongoing'
    }

    const { data: session, error } = await supabase
      .from('workout_logs')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('[createTrainingSessionAction] Error creating workout_log:', error)
      return {
        isSuccess: false,
        message: `Failed to start training session: ${error.message}`
      }
    }

    // Step 2: Fetch session_plan_exercises from the session plan
    const { data: sessionPlanExercises, error: fetchError } = await supabase
      .from('session_plan_exercises')
      .select('id, exercise_id, exercise_order, superset_id, notes')
      .eq('session_plan_id', sessionPlanId)
      .order('exercise_order', { ascending: true })

    if (fetchError) {
      console.error('[createTrainingSessionAction] Error fetching session_plan_exercises:', fetchError)
      // Don't fail the whole operation - workout_log was created successfully
      // The exercises can be added later
      return {
        isSuccess: true,
        message: "Training session started (exercises will be loaded from plan)",
        data: session
      }
    }

    // Step 3: Create workout_log_exercises for each session_plan_exercise
    if (sessionPlanExercises && sessionPlanExercises.length > 0) {
      // Filter out exercises with null exercise_id and map to required format
      const workoutLogExercises = sessionPlanExercises
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
          console.error('[createTrainingSessionAction] Error creating workout_log_exercises:', insertError)
          // Don't fail - the workout_log was created successfully
        }
      }
    }

    return {
      isSuccess: true,
      message: "Training session started successfully",
      data: session
    }
  } catch (error) {
    console.error('[createTrainingSessionAction]:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get training sessions for an athlete
 * Now includes workout_log_exercises with nested data
 */
export async function getTrainingSessionsAction(
  athleteId?: number,
  limit?: number
): Promise<ActionState<WorkoutLogWithDetails[]>> {
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
      .from('workout_logs')
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
        session_plan:session_plans(
          *,
          session_plan_exercises(
            *,
            exercise:exercises(
              *,
              exercise_type:exercise_types(*)
            )
          )
        ),
        workout_log_exercises(
          *,
          exercise:exercises(
            *,
            exercise_type:exercise_types(*)
          ),
          workout_log_sets(*)
        ),
        workout_log_sets(*)
      `)
      .eq('athlete_id', finalAthleteId)
      .order('date_time', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('[getTrainingSessionsAction] Error:', error)
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
    console.error('[getTrainingSessionsAction]:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific training session by ID
 * Now includes workout_log_exercises with nested workout_log_sets
 */
export async function getTrainingSessionByIdAction(
  sessionId: number
): Promise<ActionState<WorkoutLogWithDetails>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const { data: session, error } = await supabase
      .from('workout_logs')
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
        session_plan:session_plans(
          *,
          session_plan_exercises(
            *,
            exercise:exercises(
              *,
              exercise_type:exercise_types(*),
              unit:units(*)
            ),
            session_plan_sets(*)
          )
        ),
        workout_log_exercises(
          *,
          exercise:exercises(
            *,
            exercise_type:exercise_types(*),
            unit:units(*)
          ),
          session_plan_exercise:session_plan_exercises(
            *,
            session_plan_sets(*)
          ),
          workout_log_sets(*)
        ),
        workout_log_sets(*)
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('[getTrainingSessionByIdAction] Error:', error)
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
    console.error('[getTrainingSessionByIdAction]:', error)
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
  updates: Partial<Database["public"]["Tables"]["workout_logs"]["Update"]>
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
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
      .from('workout_logs')
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
 * Now uses workout_log_exercises to access exercise data
 */
export async function completeTrainingSessionAction(
  sessionId: number,
  notes?: string
): Promise<ActionState<Database["public"]["Tables"]["workout_logs"]["Row"]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // First, get the session with athlete_id and exercise details for PB detection
    // Now using workout_log_exercises which has the exercise_id directly
    const { data: sessionData, error: fetchError } = await supabase
      .from('workout_logs')
      .select(`
        id,
        athlete_id,
        workout_log_exercises(
          id,
          exercise_id,
          workout_log_sets(
            id,
            distance,
            performing_time,
            completed
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (fetchError) {
      console.error('[completeTrainingSessionAction] Error fetching session:', fetchError)
      return {
        isSuccess: false,
        message: `Failed to fetch session: ${fetchError.message}`
      }
    }

    // Auto-detect personal bests from completed sprint exercises
    // Only check exercises with distance and performing_time (sprint exercises)
    const pbDetectionPromises: Promise<any>[] = []

    if (sessionData.athlete_id && sessionData.workout_log_exercises && Array.isArray(sessionData.workout_log_exercises)) {
      const athleteId = sessionData.athlete_id

      sessionData.workout_log_exercises.forEach((wle: any) => {
        const exerciseId = wle.exercise_id
        if (!exerciseId) return

        // Check each set for PB candidates
        wle.workout_log_sets?.forEach((set: any) => {
          // Only process completed sets with time (sprint exercises)
          if (set.completed && set.distance && set.performing_time) {
            pbDetectionPromises.push(
              autoDetectPBAction(
                sessionId,
                athleteId,
                exerciseId,
                set.performing_time
              ).catch(err => {
                // Log but don't fail session completion if PB detection fails
                console.error('[completeTrainingSessionAction] PB detection failed:', err)
                return null
              })
            )
          }
        })
      })
    }

    // Run PB detection in parallel (don't block session completion)
    if (pbDetectionPromises.length > 0) {
      await Promise.allSettled(pbDetectionPromises)
    }

    // Now complete the session
    const updates: Partial<Database["public"]["Tables"]["workout_logs"]["Update"]> = {
      session_status: 'completed',
      notes: notes || null
    }

    const { data: session, error } = await supabase
      .from('workout_logs')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('[completeTrainingSessionAction] Error completing session:', error)
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
    console.error('[completeTrainingSessionAction]:', error)
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
 * Now uses workout_log_exercise_id to properly link sets to exercises in the workout
 */
export async function addExercisePerformanceAction(
  workoutLogExerciseId: number,
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
    velocity?: number
    power?: number
    height?: number
    effort?: number
    completed?: boolean
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

    // First, get the workout_log_exercise to verify it exists and get workout_log_id
    const { data: workoutLogExercise, error: fetchError } = await supabase
      .from('workout_log_exercises')
      .select('id, workout_log_id, session_plan_exercise_id')
      .eq('id', workoutLogExerciseId)
      .single()

    if (fetchError || !workoutLogExercise) {
      console.error('[addExercisePerformanceAction] Workout log exercise not found:', fetchError)
      return {
        isSuccess: false,
        message: "Workout exercise not found"
      }
    }

    // Use ?? null to preserve 0 values (|| null treats 0 as falsy)
    const detailData = {
      workout_log_id: workoutLogExercise.workout_log_id,
      workout_log_exercise_id: workoutLogExerciseId,
      session_plan_exercise_id: workoutLogExercise.session_plan_exercise_id,
      set_index: setData.set_index,
      reps: setData.reps ?? null,
      weight: setData.weight ?? null,
      rest_time: setData.rest_time ?? null,
      rpe: setData.rpe ?? null,
      tempo: setData.tempo ?? null,
      resistance: setData.resistance ?? null,
      distance: setData.distance ?? null,
      performing_time: setData.performing_time ?? null,
      velocity: setData.velocity ?? null,
      power: setData.power ?? null,
      height: setData.height ?? null,
      effort: setData.effort ?? null,
      completed: setData.completed ?? false
    }

    // Check if a set already exists for this exercise and set_index
    const { data: existingSet } = await supabase
      .from('workout_log_sets')
      .select('id')
      .eq('workout_log_exercise_id', workoutLogExerciseId)
      .eq('set_index', setData.set_index)
      .maybeSingle()

    let detail: ExerciseTrainingDetail | null = null
    let error: unknown = null

    if (existingSet) {
      // Update existing set - only update fields that are explicitly provided
      const updateData: Record<string, unknown> = {}
      if (setData.reps !== undefined) updateData.reps = setData.reps
      if (setData.weight !== undefined) updateData.weight = setData.weight
      if (setData.rest_time !== undefined) updateData.rest_time = setData.rest_time
      if (setData.rpe !== undefined) updateData.rpe = setData.rpe
      if (setData.tempo !== undefined) updateData.tempo = setData.tempo
      if (setData.resistance !== undefined) updateData.resistance = setData.resistance
      if (setData.distance !== undefined) updateData.distance = setData.distance
      if (setData.performing_time !== undefined) updateData.performing_time = setData.performing_time
      if (setData.velocity !== undefined) updateData.velocity = setData.velocity
      if (setData.power !== undefined) updateData.power = setData.power
      if (setData.height !== undefined) updateData.height = setData.height
      if (setData.effort !== undefined) updateData.effort = setData.effort
      if (setData.completed !== undefined) updateData.completed = setData.completed

      const { data, error: updateError } = await supabase
        .from('workout_log_sets')
        .update(updateData)
        .eq('id', existingSet.id)
        .select()
        .single()
      detail = data
      error = updateError
    } else {
      // Insert new set
      const { data, error: insertError } = await supabase
        .from('workout_log_sets')
        .insert(detailData)
        .select()
        .single()
      detail = data
      error = insertError
    }

    if (error) {
      console.error('[addExercisePerformanceAction] Error saving workout_log_set:', error)
      const errorMessage = error instanceof Error ? error.message : 'Database error'
      return {
        isSuccess: false,
        message: `Failed to add exercise performance: ${errorMessage}`
      }
    }

    if (!detail) {
      return {
        isSuccess: false,
        message: 'Failed to retrieve saved exercise performance'
      }
    }

    // Revalidate workout page for seamless React Query refresh
    revalidatePath(`/workout/${workoutLogExercise.workout_log_id}`, 'page')

    return {
      isSuccess: true,
      message: existingSet ? "Exercise performance updated successfully" : "Exercise performance added successfully",
      data: detail
    }
  } catch (error) {
    console.error('[addExercisePerformanceAction]:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Legacy: Add performance data by session ID and exercise ID
 * This will find or create the workout_log_exercise first
 * @deprecated Use addExercisePerformanceAction with workoutLogExerciseId instead
 */
export async function addExercisePerformanceByExerciseIdAction(
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
    velocity?: number
    power?: number
    height?: number
    effort?: number
    completed?: boolean
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

    // Find the workout_log_exercise for this session and exercise
    let { data: workoutLogExercise, error: fetchError } = await supabase
      .from('workout_log_exercises')
      .select('id')
      .eq('workout_log_id', sessionId)
      .eq('exercise_id', exerciseId)
      .maybeSingle()

    // If not found, create it (for backwards compatibility)
    if (!workoutLogExercise) {
      // Look up session_plan_id from workout_log to help find the correct session_plan_exercise
      const { data: workoutLog } = await supabase
        .from('workout_logs')
        .select('session_plan_id')
        .eq('id', sessionId)
        .single()
      
      let sessionPlanExerciseId: number | null = null
      
      if (workoutLog?.session_plan_id) {
        // Try to find matching session_plan_exercise
        const { data: spe } = await supabase
          .from('session_plan_exercises')
          .select('id')
          .eq('session_plan_id', workoutLog.session_plan_id)
          .eq('exercise_id', exerciseId)
          .maybeSingle()
          
        if (spe) {
          sessionPlanExerciseId = spe.id
        }
      }

      // Get the max exercise_order for this workout
      const { data: maxOrder } = await supabase
        .from('workout_log_exercises')
        .select('exercise_order')
        .eq('workout_log_id', sessionId)
        .order('exercise_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrder = (maxOrder?.exercise_order || 0) + 1

      const { data: newExercise, error: createError } = await supabase
        .from('workout_log_exercises')
        .insert({
          workout_log_id: sessionId,
          exercise_id: exerciseId,
          session_plan_exercise_id: sessionPlanExerciseId, // Linked correctly
          exercise_order: nextOrder
        })
        .select('id, session_plan_exercise_id')
        .single()

      if (createError || !newExercise) {
        console.error('[addExercisePerformanceByExerciseIdAction] Error creating workout_log_exercise:', createError)
        return {
          isSuccess: false,
          message: "Failed to create workout exercise entry"
        }
      }

      workoutLogExercise = newExercise
    }

    // Now call the main function
    return addExercisePerformanceAction(workoutLogExercise.id, setData)
  } catch (error) {
    console.error('[addExercisePerformanceByExerciseIdAction]:', error)
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
      .from('workout_log_sets')
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
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        workout_log_sets(
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
      
      session.workout_log_sets?.forEach(detail => {
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

    // Query exercise progress using workout_log_exercises structure
    // This gives us direct access to exercise data through workout_log_exercises
    let query = supabase
      .from('workout_log_exercises')
      .select(`
        id,
        exercise_id,
        exercise:exercises(
          id,
          name
        ),
        workout_log:workout_logs!inner(
          athlete_id,
          date_time,
          session_status
        ),
        workout_log_sets(
          reps,
          weight,
          rpe
        )
      `)
      .eq('workout_log.athlete_id', finalAthleteId)
      .eq('workout_log.session_status', 'completed')
      .order('workout_log.date_time', { ascending: false })

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
    }

    const { data: details, error } = await query

    if (error) {
      console.error('[getExerciseProgressAction] Error:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch exercise progress: ${error.message}`
      }
    }

    // Group by exercise and calculate progress
    const exerciseMap = new Map<number, any>()

    details?.forEach((wle: any) => {
      const exId = wle.exercise_id
      if (!exId) return // Skip if no exercise ID

      if (!exerciseMap.has(exId)) {
        exerciseMap.set(exId, {
          exercise_id: exId,
          exercise_name: wle.exercise?.name || 'Unknown Exercise',
          sessions_completed: 0,
          pr_weight: 0,
          pr_reps: 0,
          pr_date: null,
          rpe_sum: 0,
          rpe_count: 0,
          weights: []
        })
      }

      const exerciseData = exerciseMap.get(exId)
      if (exerciseData) {
        exerciseData.sessions_completed++

        // Process each set for this exercise
        wle.workout_log_sets?.forEach((set: any) => {
          if (set.weight && set.weight > exerciseData.pr_weight) {
            exerciseData.pr_weight = set.weight
            exerciseData.pr_date = wle.workout_log?.date_time || null
          }

          if (set.reps && set.reps > exerciseData.pr_reps) {
            exerciseData.pr_reps = set.reps
          }

          if (set.rpe) {
            exerciseData.rpe_sum += set.rpe
            exerciseData.rpe_count++
          }

          if (set.weight) {
            exerciseData.weights.push(set.weight)
          }
        })
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

    // Get all workout_logs linked to coach's athlete groups
    const { data: sessions, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        athlete_group_id,
        session_plan_id,
        session_plans (
          name
        ),
        athlete_groups!fk_ets_group (
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
      name: session.session_plans?.name || 'Untitled Session',
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
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        athlete_group_id,
        session_plan_id,
        session_plans (
          id,
          name,
          session_plan_exercises (
            id,
            exercise_order,
            exercise:exercises (
              id,
              name
            ),
            session_plan_sets (
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
        athlete_groups!fk_ets_group (
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
      // exercise_order is the real ordering column on session_plan_exercises; order_index is not in the schema
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
    const presetGroup: any = session.session_plans
    const exercises = presetGroup?.session_plan_exercises?.map((preset: any) => {
      const firstDetail = preset.session_plan_sets?.[0]
      return {
        id: preset.exercise.id,
        name: preset.exercise.name,
        sets: preset.session_plan_sets?.length || 0,
        reps: firstDetail?.reps || 0,
        distance: firstDetail?.distance || null,
        unit: firstDetail?.unit?.name || 'reps'
      }
    }) || []

    const exerciseIds = exercises.map((e: any) => e.id)

    // Get existing performance data (workout_log_sets)
    // Note: workout_log_sets joins to exercise via session_plan_exercise_id
    // For group sessions, we need to track which athlete performed each exercise
    const { data: existingPerformance } = await supabase
      .from('workout_log_sets')
      .select(`
        id,
        workout_log_id,
        session_plan_exercise_id,
        set_index,
        performing_time,
        completed,
        session_plan_exercise:session_plan_exercises(
          exercise_id
        )
      `)
      .eq('workout_log_id', sessionId)

    // Build performance data map
    // Note: For group sessions, each athlete has their own workout_log
    // This function retrieves data for a single group session (parent session)
    // The actual athlete performance is stored in individual sessions
    const performanceData: any = {}
    athletes.forEach((athlete: any) => {
      performanceData[athlete.id] = {}
      exercises.forEach((exercise: any) => {
        performanceData[athlete.id][exercise.id] = {}
      })
    })

    // For group sessions, performance data needs to be fetched from individual athlete sessions
    // Get individual sessions for this group session's preset group
    const presetGroupId = session.session_plan_id
    let athleteSessions: any[] | null = null

    if (presetGroupId) {
      const { data } = await supabase
        .from('workout_logs')
        .select(`
          id,
          athlete_id,
          workout_log_sets(
            id,
            set_index,
            performing_time,
            completed,
            session_plan_exercise:session_plan_exercises(
              exercise_id
            )
          )
        `)
        .eq('session_plan_id', presetGroupId)
        .in('athlete_id', athleteIds)
      athleteSessions = data
    }

    athleteSessions?.forEach((athleteSession: any) => {
      const athleteId = athleteSession.athlete_id
      if (!performanceData[athleteId]) {
        performanceData[athleteId] = {}
      }

      athleteSession.workout_log_sets?.forEach((detail: any) => {
        const exerciseId = detail.session_plan_exercise?.exercise_id
        const setIndex = detail.set_index || 1

        if (exerciseId) {
          if (!performanceData[athleteId][exerciseId]) {
            performanceData[athleteId][exerciseId] = {}
          }

          performanceData[athleteId][exerciseId][setIndex] = {
            performingTime: detail.performing_time,
            completed: detail.completed || false
          }
        }
      })
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
      .from('workout_logs')
      .select(`
        id,
        athlete_group_id,
        session_plan_id,
        athlete_groups!fk_ets_group(coach_id)
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

    // Ensure we have a valid session_plan_id
    const sessionPresetGroupId = session.session_plan_id
    if (!sessionPresetGroupId) {
      return {
        isSuccess: false,
        message: 'Session does not have a preset group'
      }
    }

    // First, find or create the athlete's training session for this preset group
    // For group sessions, each athlete has their own workout_log
    const { data: athleteSession } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('session_plan_id', sessionPresetGroupId)
      .eq('athlete_id', athleteId)
      .maybeSingle()

    let athleteSessionId = athleteSession?.id

    // If no session exists for this athlete, we need to create one
    if (!athleteSessionId) {
      const { data: newSession, error: createSessionError } = await supabase
        .from('workout_logs')
        .insert({
          session_plan_id: sessionPresetGroupId,
          athlete_id: athleteId,
          athlete_group_id: session.athlete_group_id,
          session_status: 'ongoing',
          date_time: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createSessionError || !newSession) {
        console.error('[updateSessionDetailAction] Create session error:', createSessionError)
        return {
          isSuccess: false,
          message: 'Failed to create athlete session'
        }
      }
      athleteSessionId = newSession.id
    }

    // Find the session_plan_exercise_id for this exercise
    const { data: presetData } = await supabase
      .from('session_plan_exercises')
      .select('id')
      .eq('session_plan_id', sessionPresetGroupId)
      .eq('exercise_id', exerciseId)
      .maybeSingle()

    if (!presetData) {
      return {
        isSuccess: false,
        message: 'Exercise preset not found'
      }
    }

    // Check if detail already exists using session_plan_exercise_id
    const { data: existing } = await supabase
      .from('workout_log_sets')
      .select('id')
      .eq('workout_log_id', athleteSessionId)
      .eq('session_plan_exercise_id', presetData.id)
      .eq('set_index', setIndex)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('workout_log_sets')
        .update({
          performing_time: performingTime,
          completed: performingTime !== null
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
      // Ensure workout_log_exercise exists
      let workoutLogExerciseId: number | null = null
      
      const { data: wle } = await supabase
        .from('workout_log_exercises')
        .select('id')
        .eq('workout_log_id', athleteSessionId)
        .eq('session_plan_exercise_id', presetData.id)
        .maybeSingle()
        
      if (wle) {
        workoutLogExerciseId = wle.id
      } else {
        // Create it if missing
        const { data: newWle, error: wleError } = await supabase
          .from('workout_log_exercises')
          .insert({
            workout_log_id: athleteSessionId,
            exercise_id: exerciseId,
            session_plan_exercise_id: presetData.id,
            exercise_order: 999 // fallback order
          })
          .select('id')
          .single()
          
        if (!wleError && newWle) {
          workoutLogExerciseId = newWle.id
        }
      }

      // Create new - use session_plan_exercise_id AND workout_log_exercise_id
      const { error: insertError } = await supabase
        .from('workout_log_sets')
        .insert({
          workout_log_id: athleteSessionId,
          session_plan_exercise_id: presetData.id,
          workout_log_exercise_id: workoutLogExerciseId, // Linked correctly
          set_index: setIndex,
          performing_time: performingTime,
          completed: performingTime !== null
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
