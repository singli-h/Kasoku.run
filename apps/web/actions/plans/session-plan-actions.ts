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
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

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
  duration?: number // seconds
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

    const savedSessions: SessionPlan[] = []
    const errors: string[] = []

    // Save each session as an session_plan
    for (const session of planData.sessions) {
      // Validate session data
      if (!session.exercises || session.exercises.length === 0) {
        errors.push(`Session "${session.name}" has no exercises`)
        continue
      }

      // Create the session (session_plan)
      const sessionData: SessionPlanInsert = {
        name: session.name,
        description: session.description,
        date: new Date().toISOString().split('T')[0], // Current date, can be updated later
        day: session.day,
        week: session.week,
        session_mode: planData.isTemplate ? 'template' : (planData.athleteGroupId ? 'group' : 'individual'),
        microcycle_id: planData.microcycleId || null,
        athlete_group_id: planData.isTemplate ? null : (planData.athleteGroupId || null),
        user_id: planData.isTemplate ? null : dbUserId,
        is_template: planData.isTemplate || false
      }

      const { data: savedSession, error: sessionError } = await supabase
        .from('session_plans')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError || !savedSession) {
        console.error('Error saving session:', sessionError)
        errors.push(`Failed to save session "${session.name}": ${sessionError?.message}`)
        continue
      }

      // Save exercises for this session
      for (const exercise of session.exercises) {
        // Validate exercise data
        if (!exercise.exerciseId) {
          errors.push(`Exercise in session "${session.name}" is missing exerciseId`)
          continue
        }

        if (!exercise.sets || exercise.sets.length === 0) {
          errors.push(`Exercise ${exercise.exerciseId} in session "${session.name}" has no sets`)
          continue
        }

        // Parse superset_id correctly - handle the string format properly
        let supersetId: number | null = null
        if (exercise.supersetId && exercise.supersetId !== 'superset-0') {
          const parsed = parseInt(exercise.supersetId.replace('superset-', ''))
          // Only set if it's a valid positive integer
          if (!isNaN(parsed) && parsed > 0) {
            supersetId = parsed
          }
        }

        // Create the exercise preset
        const exercisePresetData: ExercisePresetInsert = {
          session_plan_id: savedSession.id,
          exercise_id: exercise.exerciseId,
          exercise_order: exercise.order,
          notes: exercise.notes,
          superset_id: supersetId
        }

        const { data: savedExercisePreset, error: exerciseError } = await supabase
          .from('session_plan_exercises')
          .insert(exercisePresetData)
          .select()
          .single()

        if (exerciseError || !savedExercisePreset) {
          console.error('Error saving exercise preset:', exerciseError)
          errors.push(`Failed to save exercise ${exercise.exerciseId} in session "${session.name}": ${exerciseError?.message}`)
          continue
        }

        // Save exercise preset details (sets) - ensure set_index is properly set
        for (let i = 0; i < exercise.sets.length; i++) {
          const set = exercise.sets[i]
          
          // Ensure set_index is properly set (1-based indexing)
          const setIndex = set.setIndex || (i + 1)
          
          const setDetailData = {
            session_plan_exercise_id: savedExercisePreset.id,
            set_index: setIndex,
            reps: set.reps || null,
            weight: set.weight || null,
            distance: set.distance || null,
            performing_time: set.duration || null, // Use correct database field name
            power: set.power || null,
            velocity: set.velocity || null,
            resistance: set.resistance || null,
            resistance_unit_id: set.resistance_unit_id || null,
            tempo: set.tempo || null,
            effort: set.rpe || null, // Map RPE to effort field
            height: set.height || null,
            metadata: set.metadata ? JSON.stringify(set.metadata) : null
          }

          const { error: detailError } = await supabase
            .from('session_plan_sets')
            .insert(setDetailData)

          if (detailError) {
            console.error('Error saving exercise preset detail:', detailError)
            errors.push(`Failed to save set ${setIndex} for exercise ${exercise.exerciseId} in session "${session.name}": ${detailError.message}`)
            // Continue with other sets but track the error
          }
        }
      }

      savedSessions.push(savedSession)
    }

    // If we have errors, return them
    if (errors.length > 0) {
      return {
        isSuccess: false,
        message: `Failed to save some data: ${errors.join('; ')}`
      }
    }

    // Create workout_logs for individual assignments
    if (planData.athleteIds && planData.athleteIds.length > 0 && !planData.isTemplate) {
      for (const athleteId of planData.athleteIds) {
        for (const savedSession of savedSessions) {
          const trainingSessionData = {
            session_plan_id: savedSession.id,
            athlete_id: athleteId,
            date_time: new Date().toISOString(),
            notes: null,
            session_status: 'assigned' as const
          }

          const { error: trainingSessionError } = await supabase
            .from('workout_logs')
            .insert(trainingSessionData)

          if (trainingSessionError) {
            console.error('Error creating training session:', trainingSessionError)
            // Continue with other assignments instead of failing completely
          }
        }
      }
    }

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
      id: `session-${group.week}-${group.day}`,
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
           rpe: detail.effort, // Map effort back to RPE
           restTime: 90, // Default rest time
           distance: detail.distance,
           duration: detail.performing_time, // Use correct database field name
           power: detail.power,
           velocity: detail.velocity,
           effort: detail.effort,
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
  sessionId: number,
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
 */
export async function deleteSessionPlanAction(
  sessionId: number
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

    // Soft delete by setting deleted flag
    const { error } = await supabase
      .from('session_plans')
      .update({ deleted: true })
      .eq('id', sessionId)
      .eq('user_id', dbUserId)

    if (error) {
      console.error('Error deleting session plan:', error)
      return {
        isSuccess: false,
        message: `Failed to delete session plan: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Session plan deleted successfully",
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
 * Save a plan as a template (sets is_template = true, user_id = NULL, athlete_group_id = NULL)
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

    const savedSessions: SessionPlan[] = []

    // Save each session as a template (session_plan)
    for (const session of planData.sessions) {
      // Create the template session (session_plan)
      const sessionData: SessionPlanInsert = {
        name: session.name,
        description: session.description,
        date: new Date().toISOString().split('T')[0],
        day: session.day,
        week: session.week,
        session_mode: 'template', // Special mode for templates
        microcycle_id: null,
        athlete_group_id: null, // Templates are global
        user_id: null, // Templates are global
        is_template: true // Mark as template
      }

      const { data: savedSession, error: sessionError } = await supabase
        .from('session_plans')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError || !savedSession) {
        console.error('Error saving template session:', sessionError)
        return {
          isSuccess: false,
          message: `Failed to save template session "${session.name}": ${sessionError?.message}`
        }
      }

      // Save exercises for this template session
      for (const exercise of session.exercises) {
        // Create the exercise preset
        const exercisePresetData: ExercisePresetInsert = {
          session_plan_id: savedSession.id,
          exercise_id: exercise.exerciseId,
          exercise_order: exercise.order,
          notes: exercise.notes,
          superset_id: exercise.supersetId ? parseInt(exercise.supersetId.replace('superset-', '')) : null
        }

        const { data: savedExercisePreset, error: exerciseError } = await supabase
          .from('session_plan_exercises')
          .insert(exercisePresetData)
          .select()
          .single()

        if (exerciseError || !savedExercisePreset) {
          console.error('Error saving template exercise preset:', exerciseError)
          continue
        }

        // Save exercise preset details (sets) for template
        for (const set of exercise.sets) {
          const setDetailData = {
            session_plan_exercise_id: savedExercisePreset.id,
            set_index: set.setIndex,
            reps: set.reps || null,
            weight: set.weight || null,
            distance: set.distance || null,
            performing_time: set.duration || null,
            power: set.power || null,
            velocity: set.velocity || null,
            resistance: set.resistance || null,
            resistance_unit_id: set.resistance_unit_id || null,
            tempo: set.tempo || null,
            effort: set.rpe || null,
            height: set.height || null,
            metadata: set.metadata ? JSON.stringify(set.metadata) : null
          }

          const { error: detailError } = await supabase
            .from('session_plan_sets')
            .insert(setDetailData)

          if (detailError) {
            console.error('Error saving template exercise preset detail:', detailError)
          }
        }
      }

      savedSessions.push(savedSession)
    }

    return {
      isSuccess: true,
      message: `Successfully saved ${savedSessions.length} template sessions`,
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
  templateId: number,
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
      athlete_group_id: newPlanData.athleteGroupId || null,
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

    // Copy exercises from template to new plan
    if (template.session_plan_exercises && template.session_plan_exercises.length > 0) {
      for (const templatePreset of template.session_plan_exercises) {
        const newPresetData: ExercisePresetInsert = {
          session_plan_id: newPlan.id,
          exercise_id: templatePreset.exercise_id,
          exercise_order: templatePreset.exercise_order,
          notes: templatePreset.notes,
          superset_id: templatePreset.superset_id
        }

        const { data: newPreset, error: presetError } = await supabase
          .from('session_plan_exercises')
          .insert(newPresetData)
          .select()
          .single()

        if (presetError || !newPreset) {
          console.error('Error copying preset from template:', presetError)
          continue
        }

        // Copy preset details from template
        if (templatePreset.session_plan_sets && templatePreset.session_plan_sets.length > 0) {
          const detailsData = templatePreset.session_plan_sets.map(detail => ({
            session_plan_exercise_id: newPreset.id,
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
          }))

          const { error: detailsError } = await supabase
            .from('session_plan_sets')
            .insert(detailsData)

          if (detailsError) {
            console.error('Error copying preset details from template:', detailsError)
          }
        }
      }
    }

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
export async function deleteTemplateAction(templateId: number): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Soft delete the template
    const { error } = await supabase
      .from('session_plans')
      .update({ deleted: true })
      .eq('id', templateId)
      .eq('is_template', true)

    if (error) {
      console.error('Error deleting template:', error)
      return {
        isSuccess: false,
        message: `Failed to delete template: ${error.message}`
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