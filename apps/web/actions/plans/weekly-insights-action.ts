'use server'

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import supabase from '@/lib/supabase-server'
import type { ActionState } from '@/types'
import type { Json } from '@/types/database'

interface WorkoutSummary {
  microcycleName: string | null
  workoutSummaryText: string
}

export interface WeeklyInsightsDraft {
  summary: string
  completionRate: number
  keyObservations: string[]
  suggestedAdjustments: string[]
  generatedAt: string
}

/**
 * Read completed workout_logs for a microcycle and format a summary
 * for use in the AI prompt. Client then calls planning-context-chat,
 * then calls saveWeeklyInsightsAction with the confirmed draft.
 */
export async function getMicrocycleWorkoutSummaryAction(
  microcycleId: number
): Promise<ActionState<WorkoutSummary>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)

    const { data: micro } = await supabase
      .from('microcycles')
      .select('name, start_date, end_date')
      .eq('id', microcycleId)
      .eq('user_id', dbUserId)
      .single()

    if (!micro) {
      return { isSuccess: false, message: 'Microcycle not found or access denied' }
    }

    const { data: logs } = await supabase
      .from('workout_logs')
      .select(`
        session_status, notes,
        session_plans!inner ( name, microcycle_id )
      `)
      .eq('session_plans.microcycle_id', microcycleId)

    if (!logs?.length) {
      return { isSuccess: false, message: 'No workout data for this microcycle' }
    }

    const completed = logs.filter(l => l.session_status === 'completed').length
    const athleteNotes = logs.filter(l => l.notes).map(l => `- ${l.notes}`).join('\n')

    const lines = [
      `Week: ${micro?.name ?? microcycleId}`,
      `Dates: ${micro?.start_date} to ${micro?.end_date}`,
      `Completion: ${completed}/${logs.length} sessions`,
      athleteNotes ? `Athlete notes:\n${athleteNotes}` : null,
    ].filter(Boolean) as string[]

    return {
      isSuccess: true,
      message: 'Summary ready',
      data: { microcycleName: micro?.name ?? null, workoutSummaryText: lines.join('\n') },
    }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}

/**
 * Save confirmed weekly_insights to a microcycle.
 */
export async function saveWeeklyInsightsAction(
  microcycleId: number,
  insights: WeeklyInsightsDraft
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)

    const { error } = await supabase
      .from('microcycles')
      .update({ weekly_insights: insights as unknown as Json })
      .eq('id', microcycleId)
      .eq('user_id', dbUserId)

    if (error) return { isSuccess: false, message: error.message }
    return { isSuccess: true, message: 'Weekly insights saved', data: undefined }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
