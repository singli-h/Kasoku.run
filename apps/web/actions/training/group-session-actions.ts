"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// Define types from database
type ExerciseTrainingSession = Database['public']['Tables']['exercise_training_sessions']['Row']
type ExerciseTrainingSessionInsert = Database['public']['Tables']['exercise_training_sessions']['Insert']
type ExerciseTrainingDetail = Database['public']['Tables']['exercise_training_details']['Row']
type AthleteGroup = Database['public']['Tables']['athlete_groups']['Row']
type ExercisePresetGroup = Database['public']['Tables']['exercise_preset_groups']['Row']
type Athlete = Database['public']['Tables']['athletes']['Row']

// ============================================================================
// GROUP SESSION TYPES
// ============================================================================

export interface GroupSessionPreset {
  id: number
  name: string | null
  description?: string | null
  exercise_presets: {
    exercise: {
      id: number
      name: string | null
      exercise_type: {
        type: string | null
      } | null
    } | null
    exercise_preset_details: {
      set_index: number | null
      distance?: number | null
      reps?: number | null
      performing_time?: number | null
    }[]
  }[]
}

export interface GroupSessionAthlete {
  id: number
  name: string
  user: {
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

export interface PerformanceLogEntry {
  athleteId: number
  roundNumber: number
  time: number // in milliseconds
  distance: number // in meters
  exerciseId?: number
  notes?: string
}

export interface LiveSession {
  id: number
  presetGroupId: number
  athleteGroupId: number
  status: 'active' | 'completed' | 'paused'
  startTime: string
  endTime?: string
  metadata?: any
}

// ============================================================================
// SESSION FETCHING ACTIONS
// ============================================================================

/**
 * Get available athlete groups for the current coach
 */
export async function getCoachAthleteGroupsForSessionAction(): Promise<ActionState<AthleteGroup[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get current user's database ID
    const dbUserId = await getDbUserId(userId)

    // Get current user's coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (coachError || !coach) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    // Get athlete groups for this coach
    const { data: groups, error } = await supabase
      .from('athlete_groups')
      .select(`
        *,
        athletes(
          *,
          user:users(
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('coach_id', coach.id)
      .order('group_name', { ascending: true })

    if (error) {
      console.error('Error fetching athlete groups:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch athlete groups: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete groups retrieved successfully",
      data: groups || []
    }
  } catch (error) {
    console.error('Error in getCoachAthleteGroupsForSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get available sprint session presets for group training
 */
export async function getSprintSessionPresetsAction(): Promise<ActionState<GroupSessionPreset[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get exercise preset groups that contain sprint exercises
    const { data: presets, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        exercise_presets(
          *,
          exercise:exercises(
            id,
            name,
            exercise_type:exercise_types(
              type
            )
          ),
          exercise_preset_details(
            set_index,
            distance,
            reps,
            performing_time
          )
        )
      `)
      .eq('user_id', dbUserId)
      .eq('session_mode', 'group')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching sprint session presets:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch session presets: ${error.message}`
      }
    }

    // Filter for sprint-type exercises
    const sprintPresets = (presets || []).filter(preset => 
      preset.exercise_presets?.some(ep => 
        ep.exercise?.exercise_type?.type === 'sprint' || 
        (ep.exercise?.name && ep.exercise.name.toLowerCase().includes('sprint'))
      )
    )

    return {
      isSuccess: true,
      message: "Sprint session presets retrieved successfully",
      data: sprintPresets
    }
  } catch (error) {
    console.error('Error in getSprintSessionPresetsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get athletes in a specific group for session logging
 */
export async function getGroupAthletesForSessionAction(
  groupId: number
): Promise<ActionState<GroupSessionAthlete[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const { data: athletes, error } = await supabase
      .from('athletes')
      .select(`
        id,
        user:users(
          first_name,
          last_name,
          email
        )
      `)
      .eq('athlete_group_id', groupId)
      .order('user.first_name', { ascending: true })

    if (error) {
      console.error('Error fetching group athletes:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch athletes: ${error.message}`
      }
    }

    // Transform data to match expected format
    const formattedAthletes: GroupSessionAthlete[] = (athletes || []).map(athlete => ({
      id: athlete.id,
      name: `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim(),
      user: athlete.user
    }))

    return {
      isSuccess: true,
      message: "Group athletes retrieved successfully",
      data: formattedAthletes
    }
  } catch (error) {
    console.error('Error in getGroupAthletesForSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// SESSION MANAGEMENT ACTIONS
// ============================================================================

/**
 * Creates a new live session record for group training
 */
export async function createLiveSessionAction(
  presetGroupId: number, 
  athleteGroupId: number,
  sessionName?: string
): Promise<ActionState<LiveSession>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Create a training session record for the group
    const sessionData: ExerciseTrainingSessionInsert = {
      exercise_preset_group_id: presetGroupId,
      athlete_group_id: athleteGroupId,
      date_time: new Date().toISOString(),
      session_mode: 'group',
      status: 'active',
      description: sessionName || 'Live Group Sprint Session',
      notes: null
    }

    const { data: session, error } = await supabase
      .from('exercise_training_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating live session:', error)
      return {
        isSuccess: false,
        message: `Failed to create live session: ${error.message}`
      }
    }

    const liveSession: LiveSession = {
      id: session.id,
      presetGroupId: presetGroupId,
      athleteGroupId: athleteGroupId,
      status: 'active',
      startTime: session.date_time || new Date().toISOString(),
      endTime: undefined,
      metadata: session.notes ? JSON.parse(session.notes) : null
    }

    return {
      isSuccess: true,
      message: "Live session created successfully",
      data: liveSession
    }
  } catch (error) {
    console.error('Error in createLiveSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Logs performance data for a group session
 */
export async function logGroupPerformanceAction(
  sessionId: number,
  performanceData: PerformanceLogEntry[]
): Promise<ActionState<number>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    if (!performanceData || performanceData.length === 0) {
      return {
        isSuccess: true,
        message: "No performance data to log",
        data: 0
      }
    }

    // Get the session to verify it exists and get the preset group
    const { data: session, error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        exercise_preset_group:exercise_preset_groups(
          *,
          exercise_presets(
            *,
            exercise:exercises(*)
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    // Get the first sprint exercise from the preset (for sprint sessions)
    const sprintExercise = session.exercise_preset_group?.exercise_presets?.find(ep => 
      ep.exercise?.exercise_type_id === 1 || // Assuming sprint exercise type ID is 1
      (ep.exercise?.name && ep.exercise.name.toLowerCase().includes('sprint'))
    )

    if (!sprintExercise) {
      return {
        isSuccess: false,
        message: "No sprint exercise found in session preset"
      }
    }

    // Prepare training details for insertion
    const trainingDetails = performanceData.map(entry => ({
      exercise_training_session_id: sessionId,
      exercise_preset_id: sprintExercise.id,
      set_index: entry.roundNumber,
      distance: entry.distance,
      duration: entry.time, // Store time in milliseconds
      reps: 1, // Sprint is typically 1 rep per set
      completed: true,
      metadata: entry.notes ? JSON.stringify({ notes: entry.notes, athlete_id: entry.athleteId }) : JSON.stringify({ athlete_id: entry.athleteId })
    }))

    // Insert or update training details
    const { data: insertedDetails, error: insertError } = await supabase
      .from('exercise_training_details')
      .upsert(trainingDetails, {
        onConflict: 'exercise_training_session_id,exercise_preset_id,set_index'
      })
      .select()

    if (insertError) {
      console.error('Error logging performance data:', insertError)
      return {
        isSuccess: false,
        message: `Failed to log performance data: ${insertError.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Performance data logged successfully",
      data: insertedDetails?.length || 0
    }
  } catch (error) {
    console.error('Error in logGroupPerformanceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Finalize a group session and mark it as completed
 */
export async function finalizeGroupSessionAction(
  sessionId: number,
  finalPerformanceData: PerformanceLogEntry[]
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // First, log all final performance data
    const logResult = await logGroupPerformanceAction(sessionId, finalPerformanceData)
    
    if (!logResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Failed to log final performance data: ${logResult.message}`
      }
    }

    // Update the session status to completed
    const { error } = await supabase
      .from('exercise_training_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error finalizing session:', error)
      return {
        isSuccess: false,
        message: `Failed to finalize session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Session finalized successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in finalizeGroupSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get existing session data for resuming
 */
export async function getExistingSessionDataAction(
  sessionId: number
): Promise<ActionState<{
  session: ExerciseTrainingSession;
  performanceData: PerformanceLogEntry[];
}>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get session with training details
    const { data: session, error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        exercise_training_details(
          *,
          exercise_preset:exercise_presets(
            exercise:exercises(*)
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    // Transform training details back to performance data format
    const performanceData: PerformanceLogEntry[] = (session.exercise_training_details || []).map(detail => {
      const metadata = detail.metadata ? JSON.parse(detail.metadata as string) : {}
      return {
        athleteId: metadata.athlete_id,
        roundNumber: detail.set_index || 1, // Default to 1 if null
        time: detail.duration as number,
        distance: detail.distance || 0,
        notes: metadata.notes
      }
    })

    return {
      isSuccess: true,
      message: "Session data retrieved successfully",
      data: {
        session,
        performanceData
      }
    }
  } catch (error) {
    console.error('Error in getExistingSessionDataAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 