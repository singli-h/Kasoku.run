'use server'

/**
 * Save Generated Plan Action
 *
 * Saves an AI-generated training plan via a single atomic Postgres RPC call.
 * Replaces ~89 sequential DB round-trips with 1 call to save_generated_plan().
 * Used by the Init Pipeline after user approves the plan.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import supabaseService from '@/lib/supabase-service'
import { getDbUserId } from '@/lib/user-cache'
import type { ActionState } from '@/types'
import type { ScaffoldedPlan } from '@/lib/init-pipeline/scaffold'

// ============================================================================
// Types
// ============================================================================

interface MesocycleCreationData {
  /** Block name */
  name: string
  /** Focus/goal type */
  focus: string
  /** Duration in weeks */
  durationWeeks: number
  /** Start date (ISO string) */
  startDate: string
  /** Equipment category */
  equipment?: string
  /** Plan description */
  description?: string
}

interface SaveGeneratedPlanInput {
  /** Data to create the mesocycle */
  mesocycle: MesocycleCreationData
  /** Scaffolded plan from Init Pipeline */
  plan: ScaffoldedPlan
}

interface SaveGeneratedPlanResult {
  /** Created mesocycle ID */
  mesocycleId: number
  /** ID of first session plan (for reference) */
  firstSessionId: string | null
  /** ID of first workout log (for redirect to workout logger) */
  firstWorkoutLogId: string | null
  /** Warning message if a non-critical step failed (e.g. workout scheduling) */
  warning?: string
}

// ============================================================================
// Day name to number mapping (matches scaffold's day_of_week strings)
// ============================================================================

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

// ============================================================================
// Action
// ============================================================================

export async function saveGeneratedPlanAction(
  input: SaveGeneratedPlanInput
): Promise<ActionState<SaveGeneratedPlanResult>> {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: 'Unauthorized' }
    }

    const dbUserId = await getDbUserId(userId)
    if (!dbUserId) {
      return { isSuccess: false, message: 'User not found' }
    }

    // Validate startDate before parsing — new Date('not-a-date').toISOString() throws RangeError
    const startDateMs = Date.parse(input.mesocycle.startDate)
    if (isNaN(startDateMs)) {
      return { isSuccess: false, message: 'Invalid start date' }
    }
    const startDateStr = new Date(startDateMs).toISOString().split('T')[0]

    // Validate durationWeeks is a positive integer
    if (!Number.isInteger(input.mesocycle.durationWeeks) || input.mesocycle.durationWeeks < 1) {
      return { isSuccess: false, message: 'Invalid plan duration' }
    }

    // Look up athlete ID
    const db = supabaseService
    const { data: athlete } = await db
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete) {
      return {
        isSuccess: false,
        message: 'Unable to create workout schedule — athlete profile not found. Please contact support.',
      }
    }

    // Build the JSONB payload for the RPC
    const totalWeeks = input.plan.microcycles.length

    const payload = {
      mesocycle: {
        name: input.mesocycle.name,
        description: input.mesocycle.description || `${input.mesocycle.focus} focused training block`,
        focus: input.mesocycle.focus,
        equipment: input.mesocycle.equipment,
        startDate: startDateStr,
        durationWeeks: input.mesocycle.durationWeeks,
      },
      microcycles: input.plan.microcycles.map((mc) => {
        const isDeload = mc.is_deload || mc.week_number === totalWeeks

        return {
          weekNumber: mc.week_number,
          name: mc.name,
          isDeload,
          sessionPlans: mc.session_plans.map((sp) => {
            const dayNumber = DAY_NAME_TO_NUMBER[sp.day_of_week.toLowerCase()] ?? 1

            return {
              name: sp.name,
              day: dayNumber,
              description: sp.notes,
              exercises: sp.session_plan_exercises.map((ex) => {
                // Parse exercise ID — non-numeric IDs (other than 'custom') are treated as null
                const parsedId = ex.exercise_id === 'custom' ? null : Number(ex.exercise_id)
                const exerciseId = (parsedId !== null && !isNaN(parsedId)) ? parsedId : null

                return {
                  exerciseId,
                  exerciseOrder: ex.exercise_order,
                  notes: ex.notes ?? null,
                  sets: ex.session_plan_sets.map((set) => ({
                    setIndex: set.set_index,
                    reps: set.reps != null ? Math.round(set.reps) : null,
                    weight: set.weight != null ? set.weight : null,
                    rpe: set.rpe != null ? Math.round(set.rpe) : null,
                    restTime: set.rest_time != null ? Math.round(set.rest_time) : null,
                    tempo: set.tempo ?? null,
                  })),
                }
              }),
            }
          }),
        }
      }),
    }

    console.log('[saveGeneratedPlanAction] Calling save_generated_plan RPC...')
    console.log('[saveGeneratedPlanAction] Block:', input.mesocycle.name, `(${totalWeeks} weeks)`)

    // Call the atomic RPC — single DB round-trip
    // Type assertion needed until `supabase gen types` is re-run after applying the migration
    // TODO: remove `as any` after running: supabase db push && supabase gen types typescript --local
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (db as any)
      .rpc('save_generated_plan', {
        p_user_id: dbUserId,
        p_athlete_id: athlete.id,
        p_payload: payload,
      })
      .single()

    if (rpcError) {
      console.error('[saveGeneratedPlanAction] RPC error:', rpcError)
      return { isSuccess: false, message: 'Failed to save plan' }
    }

    // The RPC returns { success, mesocycle_id, first_session_id, first_workout_log_id, message, warning }
    const row = result as {
      success: boolean
      mesocycle_id: number | null
      first_session_id: string | null
      first_workout_log_id: string | null
      message: string | null
      warning: string | null
    }

    if (!row.success || !row.mesocycle_id) {
      console.error('[saveGeneratedPlanAction] RPC returned failure:', row.message)
      return { isSuccess: false, message: row.message || 'Failed to save plan' }
    }

    console.log('[saveGeneratedPlanAction] Plan saved. Mesocycle ID:', row.mesocycle_id)

    // Revalidate relevant paths
    revalidatePath('/workout')
    revalidatePath('/plans')
    revalidatePath(`/plans/${row.mesocycle_id}`)
    revalidatePath('/dashboard')

    return {
      isSuccess: true,
      message: row.warning ? 'Plan saved with warnings' : 'Plan saved successfully',
      data: {
        mesocycleId: row.mesocycle_id,
        firstSessionId: row.first_session_id,
        firstWorkoutLogId: row.first_workout_log_id,
        warning: row.warning ?? undefined,
      },
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[saveGeneratedPlanAction] Unexpected error:', msg)
    return { isSuccess: false, message: 'Failed to save plan' }
  }
}
