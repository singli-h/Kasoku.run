/*
<ai_context>
Server actions for session plan CRUD operations in MesoWizard.
Uses the existing session_plans table structure to store session plans
with their associated session_plan_exercises and session_plan_sets.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { revalidatePath } from "next/cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"
import { addDays, startOfWeek, parseISO } from "date-fns"

// Define types from database
type SessionPlan = Database['public']['Tables']['session_plans']['Row']
type SessionPlanInsert = Database['public']['Tables']['session_plans']['Insert']
type SessionPlanUpdate = Database['public']['Tables']['session_plans']['Update']
type ExercisePreset = Database['public']['Tables']['session_plan_exercises']['Row']
type ExercisePresetInsert = Database['public']['Tables']['session_plan_exercises']['Insert']
type SessionPlanSet = Database['public']['Tables']['session_plan_sets']['Row']

// Types for MesoWizard session plans
export interface SessionPlanData {
  id: string
  name: string
  description: string
  day: number // 1-7 (Monday to Sunday)
  week: number // Week number in the plan
  exercises: SessionExerciseData[]
  estimatedDuration: number // minutes
  focus: string[]
  notes: string
}

export interface SessionExerciseData {
  id: string
  exerciseId: number
  order: number
  supersetId?: string
  sets: SessionSetData[]
  notes: string
  restTime: number // seconds
}

export interface SessionSetData {
  setIndex: number
  // Basic parameters
  reps?: number
  weight?: number
  rpe?: number
  restTime?: number

  // Advanced parameters from database
  distance?: number
  performing_time?: number // seconds
  power?: number
  velocity?: number
  effort?: number
  height?: number
  resistance?: number
  resistance_unit_id?: number
  tempo?: string
  metadata?: any
  notes?: string

  // UI-specific fields
  completed?: boolean
}

export interface CreateSessionPlanForm {
  name: string
  description?: string
  microcycleId?: number
  athleteGroupId?: number
  athleteIds?: number[]
  isTemplate?: boolean
  sessions: SessionPlanData[]
}

// ============================================================================
// SESSION PLAN CRUD ACTIONS
// ============================================================================

/**
 * Save a complete session plan (multiple sessions) to the database
 */
export async function saveSessionPlanAction(
  planData: CreateSessionPlanForm
): Promise<ActionState<SessionPlan[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const errors: string[] = []

    // Validate all sessions first
    const validSessions = planData.sessions.filter(session => {
      if (!session.exercises || session.exercises.length === 0) {
        errors.push(`Session "${session.name}" has no exercises`)
        return false
      }
      return true
    })

    if (validSessions.length === 0) {
      return {
        isSuccess: false,
        message: errors.length > 0 ? errors.join('; ') : "No valid sessions to save"
      }
    }

    // Step 1: Batch insert all sessions
    const sessionInserts: SessionPlanInsert[] = validSessions.map(session => ({
      name: session.name,
      description: session.description,
      date: new Date().toISOString().split('T')[0],
      day: session.day,
      week: session.week,
      session_mode: planData.isTemplate ? 'template' : (planData.athleteGroupId ? 'group' : 'individual'),
      microcycle_id: planData.microcycleId || null,
      user_id: planData.isTemplate ? null : dbUserId,
      is_template: planData.isTemplate || false
    }))

    const { data: savedSessions, error: sessionError } = await supabase
      .from('session_plans')
      .insert(sessionInserts)
      .select()

    if (sessionError || !savedSessions || savedSessions.length === 0) {
      console.error('Error batch saving sessions:', sessionError)
      return {
        isSuccess: false,
        message: `Failed to save sessions: ${sessionError?.message}`
      }
    }

    // Step 2: Prepare and batch insert all exercises
    const exerciseInserts: ExercisePresetInsert[] = []
    // Map to track which exercises belong to which session (by index)
    const exerciseToSessionMap: { sessionIdx: number; exerciseIdx: number }[] = []

    for (let sessionIdx = 0; sessionIdx < validSessions.length; sessionIdx++) {
      const session = validSessions[sessionIdx]
      const savedSession = savedSessions[sessionIdx]

      for (let exerciseIdx = 0; exerciseIdx < session.exercises.length; exerciseIdx++) {
        const exercise = session.exercises[exerciseIdx]

        if (!exercise.exerciseId) {
          errors.push(`Exercise in session "${session.name}" is missing exerciseId`)
          continue
        }

        if (!exercise.sets || exercise.sets.length === 0) {
          errors.push(`Exercise ${exercise.exerciseId} in session "${session.name}" has no sets`)
          continue
        }

        // Parse superset_id
        let supersetId: number | null = null
        if (exercise.supersetId && exercise.supersetId !== 'superset-0') {
          const parsed = parseInt(exercise.supersetId.replace('superset-', ''))
          if (!isNaN(parsed) && parsed > 0) {
            supersetId = parsed
          }
        }

        // Push to map BEFORE the insert array so indices stay aligned
        // (both arrays grow together, only after validation passes)
        exerciseToSessionMap.push({ sessionIdx, exerciseIdx })

        exerciseInserts.push({
          session_plan_id: savedSession.id,
          exercise_id: exercise.exerciseId,
          exercise_order: exercise.order,
          notes: exercise.notes,
          superset_id: supersetId
        })
      }
    }

    if (exerciseInserts.length === 0) {
      return {
        isSuccess: false,
        message: errors.length > 0 ? errors.join('; ') : "No valid exercises to save"
      }
    }

    const { data: savedExercises, error: exerciseError } = await supabase
      .from('session_plan_exercises')
      .insert(exerciseInserts)
      .select()

    if (exerciseError || !savedExercises) {
      console.error('Error batch saving exercises:', exerciseError)
      return {
        isSuccess: false,
        message: `Failed to save exercises: ${exerciseError?.message}`
      }
    }

    // Step 3: Prepare and batch insert all sets
    const setInserts: Array<{
      session_plan_exercise_id: string
      set_index: number
      reps: number | null
      weight: number | null
      distance: number | null
      performing_time: number | null
      power: number | null
      velocity: number | null
      resistance: number | null
      resistance_unit_id: number | null
      tempo: string | null
      effort: number | null
      rpe: number | null
      height: number | null
      metadata: string | null
    }> = []

    for (let i = 0; i < savedExercises.length; i++) {
      const savedExercise = savedExercises[i]
      const { sessionIdx, exerciseIdx } = exerciseToSessionMap[i]
      const exercise = validSessions[sessionIdx].exercises[exerciseIdx]

      for (let setIdx = 0; setIdx < exercise.sets.length; setIdx++) {
        const set = exercise.sets[setIdx]
        const setIndex = set.setIndex || (setIdx + 1)

        setInserts.push({
          session_plan_exercise_id: savedExercise.id,
          set_index: setIndex,
          reps: set.reps || null,
          weight: set.weight || null,
          distance: set.distance || null,
          performing_time: set.performing_time || null,
          power: set.power || null,
          velocity: set.velocity || null,
          resistance: set.resistance || null,
          resistance_unit_id: set.resistance_unit_id || null,
          tempo: set.tempo || null,
          // FIX: Use set.effort, not set.rpe (different fields)
          effort: set.effort != null ? set.effort / 100 : null,
          rpe: set.rpe || null,
          height: set.height || null,
          metadata: set.metadata ? JSON.stringify(set.metadata) : null
        })
      }
    }

    if (setInserts.length > 0) {
      const { error: setsError } = await supabase
        .from('session_plan_sets')
        .insert(setInserts)

      if (setsError) {
        console.error('Error batch saving sets:', setsError)
        errors.push(`Failed to save some sets: ${setsError.message}`)
      }
    }

    // PARTIAL SAVE WARNING: Sessions and exercises are already committed above.
    // Without DB transactions, a failure in later steps (exercises/sets) means
    // partial data exists. Retrying would create duplicates.
    if (errors.length > 0) {
      return {
        isSuccess: false,
        message: `Sessions saved but some exercises/sets failed to save. Avoid retrying to prevent duplicates. Details: ${errors.join('; ')}`
      }
    }

    // Create workout_logs for individual assignments (batch insert)
    if (planData.athleteIds && planData.athleteIds.length > 0 && !planData.isTemplate) {
      // P3: Calculate scheduled dates based on session day/week
      // Start from the beginning of current week (Monday)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday

      const workoutLogInserts = planData.athleteIds.flatMap(athleteId =>
        savedSessions.map((savedSession, sessionIndex) => {
          // Get the original session data to access day/week
          const originalSession = validSessions[sessionIndex]

          // Calculate scheduled date: weekStart + (week-1)*7 + (day-1)
          // week is 1-indexed (Week 1, Week 2...), day is 1-7 (Mon-Sun)
          const weekOffset = ((originalSession?.week || 1) - 1) * 7
          const dayOffset = (originalSession?.day || 1) - 1
          const scheduledDate = addDays(weekStart, weekOffset + dayOffset)

          return {
            session_plan_id: savedSession.id,
            athlete_id: athleteId,
            date_time: scheduledDate.toISOString(),
            notes: null,
            session_status: 'assigned' as const
          }
        })
      )

      if (workoutLogInserts.length > 0) {
        const { error: workoutLogError } = await supabase
          .from('workout_logs')
          .insert(workoutLogInserts)

        if (workoutLogError) {
          console.error('Error batch creating workout logs:', workoutLogError)
          // Don't fail the whole operation, just log it
        }
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: `Successfully saved ${savedSessions.length} sessions${planData.athleteIds ? ` and assigned to ${planData.athleteIds.length} athletes` : ''}`,
      data: savedSessions
    }
  } catch (error) {
    console.error('Error in saveSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Load session plans for a specific microcycle
 */
export async function getSessionPlansByMicrocycleAction(
  microcycleId: number
): Promise<ActionState<SessionPlanData[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID once at the top
    const dbUserId = await getDbUserId(userId)

    const { data: presetGroups, error } = await supabase
      .from('session_plans')
      .select(`
        *,
        session_plan_exercises(
          *,
          exercise:exercises(*),
          session_plan_sets(*)
        )
      `)
      .eq('microcycle_id', microcycleId)
      .eq('user_id', dbUserId)
      .eq('deleted', false)
      .order('week', { ascending: true })
      .order('day', { ascending: true })

    if (error) {
      console.error('Error fetching session plans:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch session plans: ${error.message}`
      }
    }

    // Convert database format to MesoWizard format
    const sessionPlans: SessionPlanData[] = (presetGroups || []).map(group => ({
      id: String(group.id),
      name: group.name || `Session ${group.week}-${group.day}`,
      description: group.description || '',
      day: group.day || 1,
      week: group.week || 1,
      exercises: (group.session_plan_exercises || []).map((preset: any, index: number) => ({
        id: `exercise-${preset.id}`,
        exerciseId: preset.exercise_id,
        order: preset.exercise_order || index + 1,
        supersetId: preset.superset_id ? `superset-${preset.superset_id}` : undefined,
                 sets: (preset.session_plan_sets || []).map((detail: any) => ({
           setIndex: detail.set_index,
           reps: detail.reps,
           weight: detail.weight,
           rpe: detail.rpe, // FIX: Read rpe from its own field, not from effort
           restTime: detail.rest_time || 90, // Use actual rest_time from DB
           distance: detail.distance,
           performing_time: detail.performing_time,
           power: detail.power,
           velocity: detail.velocity,
           // Convert effort from DB (0-1) to UI (0-100)
           effort: detail.effort != null ? detail.effort * 100 : null,
           height: detail.height,
           resistance: detail.resistance,
           resistance_unit_id: detail.resistance_unit_id,
           tempo: detail.tempo,
           metadata: detail.metadata ? JSON.parse(detail.metadata) : null,
           completed: false
         })),
        notes: preset.notes || '',
        restTime: 90 // Default rest time
      })),
      estimatedDuration: 60, // Default duration
      focus: [], // Could be stored in metadata
      notes: group.description || ''
    }))

    return {
      isSuccess: true,
      message: "Session plans retrieved successfully",
      data: sessionPlans
    }
  } catch (error) {
    console.error('Error in getSessionPlansByMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update a specific session plan
 */
export async function updateSessionPlanAction(
  sessionId: string,
  sessionData: Partial<SessionPlanData>
): Promise<ActionState<SessionPlan>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Update the session_plan
    const updateData: Partial<SessionPlanUpdate> = {
      name: sessionData.name,
      description: sessionData.description,
      day: sessionData.day,
      week: sessionData.week
    }

    const { data: updatedSession, error } = await supabase
      .from('session_plans')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session plan:', error)
      return {
        isSuccess: false,
        message: `Failed to update session plan: ${error.message}`
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Session plan updated successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error('Error in updateSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a session plan
 * P4: Also cancels associated workout_logs that haven't been started
 * Prevents deletion if there are ongoing workouts to avoid data loss
 */
export async function deleteSessionPlanAction(
  sessionId: string
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Check for ongoing workouts - prevent deletion if athletes are actively working out
    const { data: ongoingWorkouts, error: checkError } = await supabase
      .from('workout_logs')
      .select('id, athlete:athletes(id, user_id, user:users(first_name, last_name))')
      .eq('session_plan_id', sessionId)
      .eq('session_status', 'ongoing')

    if (checkError) {
      console.error('Error checking ongoing workouts:', checkError)
      return {
        isSuccess: false,
        message: `Failed to check ongoing workouts: ${checkError.message}`
      }
    }

    if (ongoingWorkouts && ongoingWorkouts.length > 0) {
      // Get athlete names for error message
      const athleteNames = ongoingWorkouts
        .map(w => {
          const user = (w.athlete as any)?.user
          return user ? `${user.first_name} ${user.last_name}` : 'Unknown athlete'
        })
        .join(', ')

      return {
        isSuccess: false,
        message: `Cannot delete: ${ongoingWorkouts.length} athlete(s) are currently doing this workout (${athleteNames}). Wait for them to finish or ask them to cancel.`
      }
    }

    // Soft delete by setting deleted flag — verify ownership via select
    const { data: deletedRows, error } = await supabase
      .from('session_plans')
      .update({ deleted: true })
      .eq('id', sessionId)
      .eq('user_id', dbUserId)
      .select('id')

    if (error) {
      console.error('Error deleting session plan:', error)
      return {
        isSuccess: false,
        message: `Failed to delete session plan: ${error.message}`
      }
    }

    if (!deletedRows || deletedRows.length === 0) {
      return {
        isSuccess: false,
        message: "Session plan not found or you don't have permission to delete it"
      }
    }

    // P4: Cancel associated workout_logs that are still 'assigned' (not started)
    // Don't cancel 'ongoing' or 'completed' workouts - those have athlete data
    const { error: cancelError, count: cancelledCount } = await supabase
      .from('workout_logs')
      .update({
        session_status: 'cancelled',
        notes: 'Session plan was deleted by coach'
      })
      .eq('session_plan_id', sessionId)
      .eq('session_status', 'assigned')

    if (cancelError) {
      console.warn('Failed to cancel associated workout_logs:', cancelError)
      // Don't fail the main operation - the plan is deleted, just log the warning
    } else if (cancelledCount && cancelledCount > 0) {
      console.log(`Cancelled ${cancelledCount} assigned workout_logs for deleted session plan ${sessionId}`)
    }

    const cancelledMessage = cancelledCount && cancelledCount > 0
      ? ` (${cancelledCount} pending assignments cancelled)`
      : ''

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: `Session plan deleted successfully${cancelledMessage}`,
      data: true
    }
  } catch (error) {
    console.error('Error in deleteSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Save a plan as a template (sets is_template = true, user_id = NULL)
 */
export async function saveAsTemplateAction(
  planData: CreateSessionPlanForm,
  templateName: string,
  templateDescription?: string
): Promise<ActionState<SessionPlan[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const warnings: string[] = []

    const dbUserId = await getDbUserId(userId)

    // Step 1: Batch insert all template sessions
    // Use the coach-provided templateName for the first session (or all if only one).
    // For multi-session templates, suffix subsequent sessions with their original name.
    const sessionInserts: SessionPlanInsert[] = planData.sessions.map((session) => ({
      name: planData.sessions.length === 1
        ? templateName
        : `${templateName} - ${session.name}`,
      description: templateDescription ?? session.description,
      date: new Date().toISOString().split('T')[0],
      day: session.day,
      week: session.week,
      session_mode: 'template' as const,
      microcycle_id: null,
      user_id: dbUserId, // Templates are owned by the creator
      is_template: true
    }))

    const { data: savedSessions, error: sessionError } = await supabase
      .from('session_plans')
      .insert(sessionInserts)
      .select()

    if (sessionError || !savedSessions || savedSessions.length === 0) {
      console.error('Error batch saving template sessions:', sessionError)
      return {
        isSuccess: false,
        message: `Failed to save template sessions: ${sessionError?.message}`
      }
    }

    // Step 2: Batch insert all exercises across all sessions
    const exerciseInserts: ExercisePresetInsert[] = []
    // Track which exercise belongs to which session/exercise index for set mapping
    const exerciseMapping: { sessionIdx: number; exerciseIdx: number }[] = []

    for (let sessionIdx = 0; sessionIdx < planData.sessions.length; sessionIdx++) {
      const session = planData.sessions[sessionIdx]
      const savedSession = savedSessions[sessionIdx]

      for (let exerciseIdx = 0; exerciseIdx < session.exercises.length; exerciseIdx++) {
        const exercise = session.exercises[exerciseIdx]

        if (!exercise.exerciseId) {
          warnings.push(`Exercise in "${session.name}" is missing exerciseId`)
          continue
        }

        exerciseMapping.push({ sessionIdx, exerciseIdx })
        exerciseInserts.push({
          session_plan_id: savedSession.id,
          exercise_id: exercise.exerciseId,
          exercise_order: exercise.order,
          notes: exercise.notes,
          superset_id: exercise.supersetId ? parseInt(exercise.supersetId.replace('superset-', '')) : null
        })
      }
    }

    if (exerciseInserts.length > 0) {
      const { data: savedExercises, error: exerciseError } = await supabase
        .from('session_plan_exercises')
        .insert(exerciseInserts)
        .select()

      if (exerciseError || !savedExercises) {
        console.error('Error batch saving template exercises:', exerciseError)
        warnings.push(`Failed to save exercises: ${exerciseError?.message}`)
      } else {
        // Step 3: Batch insert all sets across all exercises
        const setInserts: Array<{
          session_plan_exercise_id: string
          set_index: number
          reps: number | null
          weight: number | null
          distance: number | null
          performing_time: number | null
          power: number | null
          velocity: number | null
          resistance: number | null
          resistance_unit_id: number | null
          tempo: string | null
          effort: number | null
          rpe: number | null
          height: number | null
          metadata: string | null
        }> = []

        for (let i = 0; i < savedExercises.length; i++) {
          const savedExercise = savedExercises[i]
          const { sessionIdx, exerciseIdx } = exerciseMapping[i]
          const exercise = planData.sessions[sessionIdx].exercises[exerciseIdx]

          for (const set of exercise.sets) {
            setInserts.push({
              session_plan_exercise_id: savedExercise.id,
              set_index: set.setIndex,
              reps: set.reps || null,
              weight: set.weight || null,
              distance: set.distance || null,
              performing_time: set.performing_time || null,
              power: set.power || null,
              velocity: set.velocity || null,
              resistance: set.resistance || null,
              resistance_unit_id: set.resistance_unit_id || null,
              tempo: set.tempo || null,
              effort: set.effort != null ? set.effort / 100 : null,
              rpe: set.rpe || null,
              height: set.height || null,
              metadata: set.metadata ? JSON.stringify(set.metadata) : null
            })
          }
        }

        if (setInserts.length > 0) {
          const { error: setsError } = await supabase
            .from('session_plan_sets')
            .insert(setInserts)

          if (setsError) {
            console.error('Error batch saving template sets:', setsError)
            warnings.push(`Failed to save some sets: ${setsError.message}`)
          }
        }
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')
    revalidatePath('/templates')

    return {
      isSuccess: true,
      message: warnings.length > 0
        ? `Template saved with warnings: ${warnings.join(', ')}`
        : `Successfully saved ${savedSessions.length} template sessions`,
      data: savedSessions
    }
  } catch (error) {
    console.error('Error in saveAsTemplateAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get all templates (plans with is_template = true)
 */
export async function getTemplatesAction(): Promise<ActionState<SessionPlan[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Only return templates owned by this user
    const { data: templates, error } = await supabase
      .from('session_plans')
      .select(`
        *,
        session_plan_exercises(
          *,
          exercise:exercises(*),
          session_plan_sets(*)
        )
      `)
      .eq('is_template', true)
      .eq('deleted', false)
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch templates: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Templates retrieved successfully",
      data: templates || []
    }
  } catch (error) {
    console.error('Error in getTemplatesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new plan from a template
 */
export async function createPlanFromTemplateAction(
  templateId: string,
  newPlanData: {
    name: string
    description?: string
    athleteGroupId?: number
    microcycleId?: number
    startDate?: string
  }
): Promise<ActionState<SessionPlan[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get the template with all its details
    const { data: template, error: templateError } = await supabase
      .from('session_plans')
      .select(`
        *,
        session_plan_exercises(
          *,
          session_plan_sets(*)
        )
      `)
      .eq('id', templateId)
      .eq('is_template', true)
      .single()

    if (templateError || !template) {
      return {
        isSuccess: false,
        message: "Template not found"
      }
    }

    // Create new plan from template
    const newPlanSessionData: SessionPlanInsert = {
      name: newPlanData.name,
      description: newPlanData.description || template.description,
      date: newPlanData.startDate || new Date().toISOString().split('T')[0],
      day: template.day,
      week: template.week,
      session_mode: newPlanData.athleteGroupId ? 'group' : 'individual',
      microcycle_id: newPlanData.microcycleId || null,
      user_id: dbUserId,
      is_template: false // This is a real plan, not a template
    }

    const { data: newPlan, error: planError } = await supabase
      .from('session_plans')
      .insert(newPlanSessionData)
      .select()
      .single()

    if (planError || !newPlan) {
      return {
        isSuccess: false,
        message: `Failed to create plan from template: ${planError?.message}`
      }
    }

    // Copy exercises from template to new plan (batch insert)
    if (template.session_plan_exercises && template.session_plan_exercises.length > 0) {
      // Step 1: Batch insert all exercises
      const exerciseInserts: ExercisePresetInsert[] = template.session_plan_exercises.map(
        (templatePreset: any) => ({
          session_plan_id: newPlan.id,
          exercise_id: templatePreset.exercise_id,
          exercise_order: templatePreset.exercise_order,
          notes: templatePreset.notes,
          superset_id: templatePreset.superset_id
        })
      )

      const { data: savedExercises, error: exercisesError } = await supabase
        .from('session_plan_exercises')
        .insert(exerciseInserts)
        .select()

      if (exercisesError || !savedExercises) {
        console.error('Error batch copying exercises from template:', exercisesError)
      } else {
        // Step 2: Batch insert all sets across all exercises
        const setInserts: Array<Record<string, any>> = []

        for (let i = 0; i < savedExercises.length; i++) {
          const savedExercise = savedExercises[i]
          const templatePreset = template.session_plan_exercises[i] as any

          if (templatePreset.session_plan_sets && templatePreset.session_plan_sets.length > 0) {
            for (const detail of templatePreset.session_plan_sets) {
              setInserts.push({
                session_plan_exercise_id: savedExercise.id,
                set_index: detail.set_index,
                reps: detail.reps,
                weight: detail.weight,
                distance: detail.distance,
                performing_time: detail.performing_time,
                power: detail.power,
                velocity: detail.velocity,
                resistance: detail.resistance,
                resistance_unit_id: detail.resistance_unit_id,
                tempo: detail.tempo,
                effort: detail.effort,
                height: detail.height,
                metadata: detail.metadata
              })
            }
          }
        }

        if (setInserts.length > 0) {
          const { error: setsError } = await supabase
            .from('session_plan_sets')
            .insert(setInserts)

          if (setsError) {
            console.error('Error batch copying sets from template:', setsError)
          }
        }
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Plan created successfully from template",
      data: [newPlan]
    }
  } catch (error) {
    console.error('Error in createPlanFromTemplateAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a template
 */
export async function deleteTemplateAction(templateId: string): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Soft delete the template — require ownership via user_id
    const { data: updated, error } = await supabase
      .from('session_plans')
      .update({ deleted: true })
      .eq('id', templateId)
      .eq('is_template', true)
      .eq('user_id', dbUserId)
      .select('id')

    if (error) {
      console.error('Error deleting template:', error)
      return {
        isSuccess: false,
        message: `Failed to delete template: ${error.message}`
      }
    }

    if (!updated || updated.length === 0) {
      return {
        isSuccess: false,
        message: "Template not found or you don't have permission to delete it"
      }
    }

    return {
      isSuccess: true,
      message: "Template deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteTemplateAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Copy a session to a different microcycle and/or day
 */
export async function copySessionAction(
  sessionId: string,
  targetMicrocycleId: number,
  targetDay: number
): Promise<ActionState<SessionPlan>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get the source session with all its details
    const { data: sourceSession, error: fetchError } = await supabase
      .from('session_plans')
      .select(`
        *,
        session_plan_exercises(
          *,
          session_plan_sets(*)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (fetchError || !sourceSession) {
      console.error('Error fetching source session:', fetchError)
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    // Ownership check: if source is not a template, require ownership
    if (!sourceSession.is_template && sourceSession.user_id !== dbUserId) {
      return {
        isSuccess: false,
        message: "You don't have permission to copy this session"
      }
    }

    // Create new session copy
    const newSessionData: SessionPlanInsert = {
      name: `${sourceSession.name} (Copy)`,
      description: sourceSession.description,
      date: sourceSession.date, // Keep the same date or calculate from target microcycle
      day: targetDay,
      week: sourceSession.week,
      session_mode: sourceSession.session_mode,
      microcycle_id: targetMicrocycleId,
      user_id: dbUserId,
      is_template: false
    }

    const { data: newSession, error: insertError } = await supabase
      .from('session_plans')
      .insert(newSessionData)
      .select()
      .single()

    if (insertError || !newSession) {
      console.error('Error creating session copy:', insertError)
      return {
        isSuccess: false,
        message: `Failed to copy session: ${insertError?.message}`
      }
    }

    // Copy exercises from source to new session
    if (sourceSession.session_plan_exercises && sourceSession.session_plan_exercises.length > 0) {
      for (const sourceExercise of sourceSession.session_plan_exercises) {
        const newExerciseData: ExercisePresetInsert = {
          session_plan_id: newSession.id,
          exercise_id: sourceExercise.exercise_id,
          exercise_order: sourceExercise.exercise_order,
          notes: sourceExercise.notes,
          superset_id: sourceExercise.superset_id
        }

        const { data: newExercise, error: exerciseError } = await supabase
          .from('session_plan_exercises')
          .insert(newExerciseData)
          .select()
          .single()

        if (exerciseError || !newExercise) {
          console.error('Error copying exercise:', exerciseError)
          continue
        }

        // Copy sets from source exercise
        if (sourceExercise.session_plan_sets && sourceExercise.session_plan_sets.length > 0) {
          const setsData = sourceExercise.session_plan_sets.map((set: SessionPlanSet) => ({
            session_plan_exercise_id: newExercise.id,
            set_index: set.set_index,
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            performing_time: set.performing_time,
            power: set.power,
            velocity: set.velocity,
            resistance: set.resistance,
            resistance_unit_id: set.resistance_unit_id,
            tempo: set.tempo,
            effort: set.effort,
            height: set.height,
            rpe: set.rpe,
            rest_time: set.rest_time,
            metadata: set.metadata
          }))

          const { error: setsError } = await supabase
            .from('session_plan_sets')
            .insert(setsData)

          if (setsError) {
            console.error('Error copying sets:', setsError)
          }
        }
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Session copied successfully",
      data: newSession
    }
  } catch (error) {
    console.error('Error in copySessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// CREATE SINGLE SESSION ACTION (for Individual Workspace)
// ============================================================================

export interface CreateSingleSessionInput {
  microcycleId: number
  name: string
  day: number // 1-7 (Monday to Sunday)
  week?: number
}

/**
 * Create a single empty session for a microcycle
 * Used by Individual users to add workouts to existing training blocks
 * Returns the new session ID for navigation to session planner
 */
export async function createSingleSessionAction(
  input: CreateSingleSessionInput
): Promise<ActionState<{ id: string }>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify microcycle belongs to user
    const { data: microcycle, error: microcycleError } = await supabase
      .from('microcycles')
      .select('id, mesocycle_id, mesocycles!inner(user_id)')
      .eq('id', input.microcycleId)
      .single()

    if (microcycleError || !microcycle) {
      return {
        isSuccess: false,
        message: "Microcycle not found or access denied"
      }
    }

    // Create the session
    const sessionInsert: SessionPlanInsert = {
      name: input.name,
      description: null,
      date: new Date().toISOString().split('T')[0],
      day: input.day,
      week: input.week || 1,
      session_mode: 'individual',
      microcycle_id: input.microcycleId,
      user_id: dbUserId,
      is_template: false
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('session_plans')
      .insert(sessionInsert)
      .select('id')
      .single()

    if (sessionError || !newSession) {
      console.error('Error creating session:', sessionError)
      return {
        isSuccess: false,
        message: `Failed to create session: ${sessionError?.message}`
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Session created successfully",
      data: { id: String(newSession.id) }
    }
  } catch (error) {
    console.error('Error in createSingleSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// INSERT TEMPLATE EXERCISES INTO EXISTING SESSION
// ============================================================================

/**
 * Copy exercises (and their sets) from a template session into an existing target session.
 * Exercises are appended after the current max exercise_order in the target.
 * Returns the newly inserted exercises with their nested sets.
 */
export async function insertTemplateExercisesAction(
  templateId: string,
  targetSessionPlanId: string,
  subgroupOverride?: { type: 'keep' | 'all' | 'specific'; value?: string }
): Promise<ActionState<ExercisePreset[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify user owns the target session plan
    const { data: targetPlan } = await supabase
      .from('session_plans')
      .select('id, user_id')
      .eq('id', targetSessionPlanId)
      .single()

    if (!targetPlan || targetPlan.user_id !== dbUserId) {
      return { isSuccess: false, message: "Access denied: you don't own this session plan" }
    }

    // Verify user owns the source template
    const { data: sourcePlan } = await supabase
      .from('session_plans')
      .select('id, user_id')
      .eq('id', templateId)
      .single()

    if (!sourcePlan || sourcePlan.user_id !== dbUserId) {
      return { isSuccess: false, message: "Access denied: template not found or not owned by you" }
    }

    // 1. Fetch template exercises with their sets
    const { data: templateExercises, error: fetchError } = await supabase
      .from('session_plan_exercises')
      .select('*, session_plan_sets(*)')
      .eq('session_plan_id', templateId)
      .order('exercise_order', { ascending: true })

    if (fetchError) {
      console.error('Error fetching template exercises:', fetchError)
      return {
        isSuccess: false,
        message: `Failed to fetch template exercises: ${fetchError.message}`
      }
    }

    if (!templateExercises || templateExercises.length === 0) {
      return {
        isSuccess: false,
        message: "Template has no exercises to insert"
      }
    }

    // 2. Get current max exercise_order in the target session
    const { data: existingExercises, error: orderError } = await supabase
      .from('session_plan_exercises')
      .select('exercise_order')
      .eq('session_plan_id', targetSessionPlanId)
      .order('exercise_order', { ascending: false })
      .limit(1)

    if (orderError) {
      console.error('Error fetching existing exercise order:', orderError)
      return {
        isSuccess: false,
        message: `Failed to check existing exercises: ${orderError.message}`
      }
    }

    const maxOrder = existingExercises && existingExercises.length > 0
      ? (existingExercises[0].exercise_order ?? 0)
      : 0

    // 3. Batch insert exercises into target session with offset order
    // Apply subgroup override if provided
    const resolveTargetGroups = (original: string[] | null): string[] | null => {
      if (!subgroupOverride || subgroupOverride.type === 'keep') return original
      if (subgroupOverride.type === 'all') return null
      if (subgroupOverride.type === 'specific' && subgroupOverride.value) return [subgroupOverride.value]
      return original
    }

    const exerciseInserts: ExercisePresetInsert[] = templateExercises.map((te, idx) => ({
      session_plan_id: targetSessionPlanId,
      exercise_id: te.exercise_id,
      exercise_order: maxOrder + idx + 1,
      notes: te.notes,
      superset_id: te.superset_id,
      target_event_groups: resolveTargetGroups(te.target_event_groups),
    }))

    const { data: insertedExercises, error: insertError } = await supabase
      .from('session_plan_exercises')
      .insert(exerciseInserts)
      .select()

    if (insertError || !insertedExercises) {
      console.error('Error inserting template exercises:', insertError)
      return {
        isSuccess: false,
        message: `Failed to insert exercises: ${insertError?.message}`
      }
    }

    // 4. Copy sets for each inserted exercise
    const setInserts: Array<Record<string, unknown>> = []

    for (let i = 0; i < insertedExercises.length; i++) {
      const newExercise = insertedExercises[i]
      const templateExercise = templateExercises[i]
      const templateSets = (templateExercise as any).session_plan_sets as SessionPlanSet[] | undefined

      if (templateSets && templateSets.length > 0) {
        for (const set of templateSets) {
          setInserts.push({
            session_plan_exercise_id: newExercise.id,
            set_index: set.set_index,
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            performing_time: set.performing_time,
            power: set.power,
            velocity: set.velocity,
            resistance: set.resistance,
            resistance_unit_id: set.resistance_unit_id,
            tempo: set.tempo,
            effort: set.effort,
            rpe: set.rpe,
            rest_time: set.rest_time,
            height: set.height,
            metadata: set.metadata,
          })
        }
      }
    }

    if (setInserts.length > 0) {
      const { error: setsError } = await supabase
        .from('session_plan_sets')
        .insert(setInserts)

      if (setsError) {
        console.error('Error copying template sets:', setsError)
        // Exercises are already inserted; warn but don't fail
      }
    }

    revalidatePath('/plans', 'page')
    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: `Inserted ${insertedExercises.length} exercises from template`,
      data: insertedExercises
    }
  } catch (error) {
    console.error('Error in insertTemplateExercisesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// CREATE TEMPLATE FROM PARSED EXERCISES
// ============================================================================

export interface CreateTemplateInput {
  name: string
  description?: string
  exercises: Array<{
    exerciseName: string
    sets: Array<{
      reps: number | null
      weight: number | null
      distance: number | null
      performing_time: number | null
      rest_time: number | null
      rpe: number | null
    }>
  }>
}

/**
 * Create a template directly from parsed exercise data (e.g. from AI paste).
 * Looks up exercises by name (case-insensitive). Skips exercises not found in the library.
 */
export async function createTemplateAction(
  input: CreateTemplateInput
): Promise<ActionState<SessionPlan>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    if (!input.name.trim()) {
      return { isSuccess: false, message: "Template name is required" }
    }

    const dbUserId = await getDbUserId(userId)

    // Step 1: Create the session_plans row as a template
    const { data: sessionPlan, error: planError } = await supabase
      .from('session_plans')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        date: new Date().toISOString().split('T')[0],
        day: 1,
        week: 1,
        session_mode: 'template' as const,
        microcycle_id: null,
        user_id: dbUserId,
        is_template: true,
      })
      .select()
      .single()

    if (planError || !sessionPlan) {
      console.error('Error creating template session plan:', planError)
      return {
        isSuccess: false,
        message: `Failed to create template: ${planError?.message}`,
      }
    }

    // Step 2: Look up exercises by name and create session_plan_exercises + sets
    if (input.exercises.length > 0) {
      // Fetch all exercises and build a lookup map for case-insensitive name matching
      const { data: foundExercises, error: lookupError } = await supabase
        .from('exercises')
        .select('id, name')

      if (lookupError) {
        console.error('Error looking up exercises:', lookupError)
        // Template is created but empty — still a success
        revalidatePath('/templates')
        return {
          isSuccess: true,
          message: "Template created but could not look up exercises",
          data: sessionPlan,
        }
      }

      // Build a case-insensitive name → id map
      const nameToId = new Map<string, number>()
      for (const ex of foundExercises || []) {
        if (ex.name) nameToId.set(ex.name.toLowerCase(), ex.id)
      }

      // Build exercise inserts (skip unmatched names)
      const exerciseInserts: ExercisePresetInsert[] = []
      const exerciseSetData: Array<Array<CreateTemplateInput['exercises'][0]['sets'][0]>> = []

      for (let i = 0; i < input.exercises.length; i++) {
        const exercise = input.exercises[i]
        const exerciseId = nameToId.get(exercise.exerciseName.trim().toLowerCase())

        if (!exerciseId) continue // Skip exercises not in the library

        exerciseInserts.push({
          session_plan_id: sessionPlan.id,
          exercise_id: exerciseId,
          exercise_order: i + 1,
          notes: null,
          superset_id: null,
        })
        exerciseSetData.push(exercise.sets)
      }

      if (exerciseInserts.length > 0) {
        const { data: savedExercises, error: exerciseError } = await supabase
          .from('session_plan_exercises')
          .insert(exerciseInserts)
          .select()

        if (exerciseError || !savedExercises) {
          console.error('Error saving template exercises:', exerciseError)
        } else {
          // Step 3: Batch insert sets
          const setInserts: Array<{
            session_plan_exercise_id: string
            set_index: number
            reps: number | null
            weight: number | null
            distance: number | null
            performing_time: number | null
            rest_time: number | null
            rpe: number | null
          }> = []

          for (let i = 0; i < savedExercises.length; i++) {
            const sets = exerciseSetData[i]
            for (let j = 0; j < sets.length; j++) {
              const s = sets[j]
              setInserts.push({
                session_plan_exercise_id: savedExercises[i].id,
                set_index: j + 1,
                reps: s.reps,
                weight: s.weight,
                distance: s.distance,
                performing_time: s.performing_time,
                rest_time: s.rest_time,
                rpe: s.rpe,
              })
            }
          }

          if (setInserts.length > 0) {
            const { error: setsError } = await supabase
              .from('session_plan_sets')
              .insert(setInserts)

            if (setsError) {
              console.error('Error saving template sets:', setsError)
            }
          }
        }
      }
    }

    revalidatePath('/templates')

    return {
      isSuccess: true,
      message: "Template created successfully",
      data: sessionPlan,
    }
  } catch (error) {
    console.error('Error in createTemplateAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
