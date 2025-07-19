/*
<ai_context>
Enhanced server actions for Sprint Session Dashboard.
Supports multiple athlete groups, dynamic sprint management, and real-time updates.
Built for the 2025 Kasoku Sprint Session Dashboard with mobile-responsive design.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { 
  ExerciseTrainingSession, 
  ExerciseTrainingSessionInsert,
  ExerciseTrainingDetail,
  AthleteGroup,
  ExercisePresetGroup,
  Athlete
} from "@/types/database"

// ============================================================================
// SPRINT SESSION TYPES
// ============================================================================

export interface SprintSessionPreset {
  id: number
  name: string
  description?: string | null
  session_mode: string
  exercise_presets: {
    id: number
    exercise: {
      id: number
      name: string
      exercise_type: {
        type: string
      }
    }
    exercise_preset_details: {
      set_index: number
      distance?: number | null
      reps?: number | null
      performing_time?: number | null
    }[]
  }[]
}

export interface SprintSessionAthlete {
  id: number
  name: string
  email?: string
  status?: 'active' | 'injured' | 'absent'
}

export interface AthleteGroupWithAthletes extends AthleteGroup {
  athletes: SprintSessionAthlete[]
}

export interface SprintDistance {
  id: string
  distance: number
  label: string
  isCustom: boolean
}

export interface SprintRound {
  roundNumber: number
  distance: number
  label: string
}

export interface SprintPerformanceEntry {
  athleteId: number
  athleteGroupId: number
  roundNumber: number
  distance: number
  timeMs: number | null
  notes?: string
  timestamp: string
}

export interface LiveSprintSession {
  id: number
  name: string
  athleteGroups: number[]
  rounds: SprintRound[]
  status: 'setup' | 'active' | 'paused' | 'completed'
  startTime: string
  endTime?: string
  metadata?: any
}

export interface SprintSessionSummary {
  sessionId: number
  totalAthletes: number
  totalRounds: number
  completedEntries: number
  averageTime?: number
  bestTime?: number
  duration: number // in seconds
}

// ============================================================================
// ENHANCED SPRINT SESSION FETCHING ACTIONS
// ============================================================================

/**
 * Get all athlete groups for a coach with their athletes for sprint sessions
 */
export async function getCoachAthleteGroupsWithAthletesAction(): Promise<ActionState<AthleteGroupWithAthletes[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

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

    // Get athlete groups with their athletes
    const { data: groups, error } = await supabase
      .from('athlete_groups')
      .select(`
        *,
        athletes(
          id,
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

    // Transform the data to match our interface
    const transformedGroups: AthleteGroupWithAthletes[] = (groups || []).map(group => ({
      ...group,
      athletes: (group.athletes || []).map(athlete => ({
        id: athlete.id,
        name: `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown',
        email: athlete.user?.email,
        status: 'active' as const
      }))
    }))

    return {
      isSuccess: true,
      message: "Athlete groups retrieved successfully",
      data: transformedGroups
    }
  } catch (error) {
    console.error('Error in getCoachAthleteGroupsWithAthletesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get predefined sprint distances for easy selection
 */
export async function getPredefinedSprintDistancesAction(): Promise<ActionState<SprintDistance[]>> {
  try {
    // Predefined common sprint distances
    const predefinedDistances: SprintDistance[] = [
      { id: '30m', distance: 30, label: '30m', isCustom: false },
      { id: '40m', distance: 40, label: '40m', isCustom: false },
      { id: '50m', distance: 50, label: '50m', isCustom: false },
      { id: '60m', distance: 60, label: '60m', isCustom: false },
      { id: '100m', distance: 100, label: '100m', isCustom: false },
      { id: '150m', distance: 150, label: '150m', isCustom: false },
      { id: '200m', distance: 200, label: '200m', isCustom: false },
      { id: '400m', distance: 400, label: '400m', isCustom: false },
    ]

    return {
      isSuccess: true,
      message: "Predefined distances retrieved successfully",
      data: predefinedDistances
    }
  } catch (error) {
    console.error('Error in getPredefinedSprintDistancesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get available sprint session presets optimized for group training
 */
export async function getSprintSessionPresetsAction(): Promise<ActionState<SprintSessionPreset[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get exercise preset groups that contain sprint exercises for group sessions
    const { data: presets, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        exercise_presets(
          id,
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

    // Filter for sprint-type exercises and transform data
    const sprintPresets = (presets || []).filter(preset => 
      preset.exercise_presets?.some(ep => 
        ep.exercise?.exercise_type?.type === 'sprint' || 
        ep.exercise?.name.toLowerCase().includes('sprint')
      )
    ).map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      session_mode: preset.session_mode,
      exercise_presets: preset.exercise_presets || []
    }))

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

// ============================================================================
// SPRINT SESSION MANAGEMENT ACTIONS
// ============================================================================

/**
 * Create a live sprint session for multiple athlete groups
 */
export async function createLiveSprintSessionAction(
  sessionName: string,
  athleteGroupIds: number[],
  initialRounds: SprintRound[],
  presetId?: number
): Promise<ActionState<LiveSprintSession>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Create a training session record for each athlete group
    const sessionData: ExerciseTrainingSessionInsert[] = athleteGroupIds.map(groupId => ({
      exercise_preset_group_id: presetId || null,
      athlete_group_id: groupId,
      date_time: new Date().toISOString(),
      session_mode: 'group',
      status: 'in_progress',
      description: sessionName,
      notes: JSON.stringify({
        sessionType: 'sprint',
        rounds: initialRounds,
        multiGroup: true,
        groupIds: athleteGroupIds
      })
    }))

    const { data: sessions, error } = await supabase
      .from('exercise_training_sessions')
      .insert(sessionData)
      .select()

    if (error) {
      console.error('Error creating live sprint session:', error)
      return {
        isSuccess: false,
        message: `Failed to create live sprint session: ${error.message}`
      }
    }

    // Use the first session ID as the main session identifier
    const mainSessionId = sessions[0]?.id

    const liveSession: LiveSprintSession = {
      id: mainSessionId,
      name: sessionName,
      athleteGroups: athleteGroupIds,
      rounds: initialRounds,
      status: 'active',
      startTime: sessions[0]?.date_time,
      metadata: {
        sessionIds: sessions.map(s => s.id),
        presetId
      }
    }

    return {
      isSuccess: true,
      message: "Live sprint session created successfully",
      data: liveSession
    }
  } catch (error) {
    console.error('Error in createLiveSprintSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Add a new sprint round to an active session
 */
export async function addSprintRoundAction(
  sessionId: number,
  newRound: SprintRound
): Promise<ActionState<SprintRound>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get the session and update its metadata
    const { data: session, error: fetchError } = await supabase
      .from('exercise_training_sessions')
      .select('notes, status')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    if (session.status !== 'in_progress') {
      return {
        isSuccess: false,
        message: "Cannot modify completed session"
      }
    }

    // Parse existing metadata and add new round
    const metadata = session.notes ? JSON.parse(session.notes) : {}
    const currentRounds = metadata.rounds || []
    const updatedRounds = [...currentRounds, newRound]

    // Update session metadata
    const { error: updateError } = await supabase
      .from('exercise_training_sessions')
      .update({
        notes: JSON.stringify({
          ...metadata,
          rounds: updatedRounds
        })
      })
      .eq('id', sessionId)

    if (updateError) {
      return {
        isSuccess: false,
        message: `Failed to add round: ${updateError.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Round added successfully",
      data: newRound
    }
  } catch (error) {
    console.error('Error in addSprintRoundAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Remove a sprint round from an active session
 */
export async function removeSprintRoundAction(
  sessionId: number,
  roundNumber: number
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get the session and update its metadata
    const { data: session, error: fetchError } = await supabase
      .from('exercise_training_sessions')
      .select('notes, status')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    if (session.status !== 'in_progress') {
      return {
        isSuccess: false,
        message: "Cannot modify completed session"
      }
    }

    // Parse existing metadata and remove round
    const metadata = session.notes ? JSON.parse(session.notes) : {}
    const currentRounds = metadata.rounds || []
    const updatedRounds = currentRounds.filter((round: SprintRound) => round.roundNumber !== roundNumber)

    // Update session metadata
    const { error: updateError } = await supabase
      .from('exercise_training_sessions')
      .update({
        notes: JSON.stringify({
          ...metadata,
          rounds: updatedRounds
        })
      })
      .eq('id', sessionId)

    if (updateError) {
      return {
        isSuccess: false,
        message: `Failed to remove round: ${updateError.message}`
      }
    }

    // Also remove any performance data for this round
    const { error: deleteError } = await supabase
      .from('exercise_training_details')
      .delete()
      .eq('exercise_training_session_id', sessionId)
      .eq('set_index', roundNumber)

    if (deleteError) {
      console.warn('Warning: Failed to delete performance data for removed round:', deleteError)
    }

    return {
      isSuccess: true,
      message: "Round removed successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in removeSprintRoundAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Log sprint performance data with batch support
 */
export async function logSprintPerformanceAction(
  sessionId: number,
  performanceEntries: SprintPerformanceEntry[]
): Promise<ActionState<number>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    if (!performanceEntries || performanceEntries.length === 0) {
      return {
        isSuccess: true,
        message: "No performance data to log",
        data: 0
      }
    }

    // Get session information
    const { data: session, error: sessionError } = await supabase
      .from('exercise_training_sessions')
      .select('id, exercise_preset_group_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    // Prepare training details for batch insertion
    const trainingDetails = performanceEntries
      .filter(entry => entry.timeMs !== null)
      .map(entry => ({
        exercise_training_session_id: sessionId,
        exercise_preset_id: 1, // Default sprint exercise preset - could be made dynamic
        set_index: entry.roundNumber,
        distance: entry.distance,
        duration: entry.timeMs, // Store time in milliseconds
        reps: 1, // Sprint is typically 1 rep per set
        completed: entry.timeMs !== null,
        metadata: JSON.stringify({
          athlete_id: entry.athleteId,
          athlete_group_id: entry.athleteGroupId,
          timestamp: entry.timestamp,
          notes: entry.notes
        })
      }))

    if (trainingDetails.length === 0) {
      return {
        isSuccess: true,
        message: "No valid performance data to log",
        data: 0
      }
    }

    // Batch insert/update performance data
    const { data: insertedDetails, error: insertError } = await supabase
      .from('exercise_training_details')
      .upsert(trainingDetails, {
        onConflict: 'exercise_training_session_id,exercise_preset_id,set_index'
      })
      .select()

    if (insertError) {
      console.error('Error logging sprint performance:', insertError)
      return {
        isSuccess: false,
        message: `Failed to log performance data: ${insertError.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Sprint performance logged successfully",
      data: insertedDetails?.length || 0
    }
  } catch (error) {
    console.error('Error in logSprintPerformanceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Complete a sprint session and generate summary
 */
export async function completeSprintSessionAction(
  sessionId: number,
  finalPerformanceData: SprintPerformanceEntry[]
): Promise<ActionState<SprintSessionSummary>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Save final performance data
    if (finalPerformanceData.length > 0) {
      const logResult = await logSprintPerformanceAction(sessionId, finalPerformanceData)
      if (!logResult.isSuccess) {
        return {
          isSuccess: false,
          message: `Failed to save final performance data: ${logResult.message}`
        }
      }
    }

    // Update session status to completed
    const { error: updateError } = await supabase
      .from('exercise_training_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      return {
        isSuccess: false,
        message: `Failed to complete session: ${updateError.message}`
      }
    }

    // Generate session summary
    const { data: sessionData, error: summaryError } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        exercise_training_details(*)
      `)
      .eq('id', sessionId)
      .single()

    if (summaryError || !sessionData) {
      return {
        isSuccess: false,
        message: "Failed to generate session summary"
      }
    }

    // Calculate summary statistics
    const performanceData = sessionData.exercise_training_details || []
    const validTimes = performanceData
      .filter(detail => detail.duration && detail.duration > 0)
      .map(detail => detail.duration as number)

    const summary: SprintSessionSummary = {
      sessionId: sessionId,
      totalAthletes: new Set(
        performanceData
          .map(detail => JSON.parse(detail.metadata as string)?.athlete_id)
          .filter(Boolean)
      ).size,
      totalRounds: new Set(performanceData.map(detail => detail.set_index)).size,
      completedEntries: validTimes.length,
      averageTime: validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : undefined,
      bestTime: validTimes.length > 0 ? Math.min(...validTimes) : undefined,
      duration: sessionData.updated_at && sessionData.date_time 
        ? Math.floor((new Date(sessionData.updated_at).getTime() - new Date(sessionData.date_time).getTime()) / 1000)
        : 0
    }

    return {
      isSuccess: true,
      message: "Sprint session completed successfully",
      data: summary
    }
  } catch (error) {
    console.error('Error in completeSprintSessionAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get existing sprint performance data for session resumption
 */
export async function getSprintPerformanceDataAction(
  sessionId: number
): Promise<ActionState<SprintPerformanceEntry[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get performance data for the session
    const { data: performanceData, error } = await supabase
      .from('exercise_training_details')
      .select('*')
      .eq('exercise_training_session_id', sessionId)
      .order('set_index', { ascending: true })

    if (error) {
      console.error('Error fetching sprint performance data:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch performance data: ${error.message}`
      }
    }

    // Transform data to sprint performance entries
    const sprintEntries: SprintPerformanceEntry[] = (performanceData || []).map(detail => {
      const metadata = detail.metadata ? JSON.parse(detail.metadata as string) : {}
      return {
        athleteId: metadata.athlete_id,
        athleteGroupId: metadata.athlete_group_id,
        roundNumber: detail.set_index,
        distance: detail.distance || 0,
        timeMs: detail.duration as number,
        notes: metadata.notes,
        timestamp: metadata.timestamp || detail.created_at
      }
    })

    return {
      isSuccess: true,
      message: "Sprint performance data retrieved successfully",
      data: sprintEntries
    }
  } catch (error) {
    console.error('Error in getSprintPerformanceDataAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 