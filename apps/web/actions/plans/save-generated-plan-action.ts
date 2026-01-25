'use server'

/**
 * Save Generated Plan Action
 *
 * Saves an AI-generated training plan directly to the database.
 * Creates the mesocycle and all child entities in one flow.
 * Used by the Init Pipeline after user approves the plan.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import supabase from '@/lib/supabase-server'
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
  /** IDs of created microcycles */
  microcycleIds: number[]
  /** ID of first session plan (for reference) */
  firstSessionId: string | null
  /** ID of first workout log (for redirect to workout logger) */
  firstWorkoutLogId: string | null
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

    console.log('[saveGeneratedPlanAction] Creating mesocycle and plan...')
    console.log('[saveGeneratedPlanAction] Block name:', input.mesocycle.name)
    console.log('[saveGeneratedPlanAction] Weeks to create:', input.plan.microcycles.length)

    // ========================================
    // Calculate end date
    // ========================================
    const startDate = new Date(input.mesocycle.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + (input.mesocycle.durationWeeks * 7) - 1)

    // ========================================
    // Create Mesocycle (Training Block)
    // ========================================
    const { data: mesocycle, error: mesoError } = await supabase
      .from('mesocycles')
      .insert({
        name: input.mesocycle.name,
        description: input.mesocycle.description || `${input.mesocycle.focus} focused training block`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        macrocycle_id: null, // Individual users don't use macrocycles
        user_id: dbUserId,
        metadata: {
          focus: input.mesocycle.focus,
          equipment: input.mesocycle.equipment,
          createdVia: 'init-pipeline',
        },
      })
      .select('id')
      .single()

    if (mesoError || !mesocycle) {
      console.error('[saveGeneratedPlanAction] Mesocycle insert error:', mesoError)
      return { isSuccess: false, message: 'Failed to create training block' }
    }

    const mesocycleId = mesocycle.id
    console.log('[saveGeneratedPlanAction] Created mesocycle:', mesocycleId)

    const microcycleIds: number[] = []
    let firstSessionId: string | null = null

    // Track session plans for workout_log creation
    const sessionPlanRecords: Array<{
      sessionPlanId: string
      weekNumber: number
      dayOfWeek: number
    }> = []

    // ========================================
    // Get athlete ID for workout_log assignment
    // ========================================
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    // ========================================
    // Insert all child entities
    // ========================================
    for (const microcycle of input.plan.microcycles) {
      // ----------------------------------------
      // Insert Microcycle (Week)
      // ----------------------------------------
      const { data: mcData, error: mcError } = await supabase
        .from('microcycles')
        .insert({
          mesocycle_id: mesocycleId,
          name: microcycle.name,
          user_id: dbUserId,
        })
        .select('id')
        .single()

      if (mcError) {
        console.error('[saveGeneratedPlanAction] Microcycle insert error:', mcError)
        throw new Error(`Failed to create week ${microcycle.week_number}: ${mcError.message}`)
      }

      const dbMicrocycleId = mcData.id
      microcycleIds.push(dbMicrocycleId)

      console.log(`[saveGeneratedPlanAction] Created microcycle: ${dbMicrocycleId} (Week ${microcycle.week_number})`)

      // ----------------------------------------
      // Insert Sessions
      // ----------------------------------------
      for (const session of microcycle.session_plans) {
        // Convert day_of_week string to number for database
        const dayNumber = dayNameToNumber(session.day_of_week)

        const { data: spData, error: spError } = await supabase
          .from('session_plans')
          .insert({
            microcycle_id: dbMicrocycleId,
            user_id: dbUserId,
            name: session.name,
            day: dayNumber,
            description: session.notes, // session.notes contains the AI's description
          })
          .select('id')
          .single()

        if (spError) {
          console.error('[saveGeneratedPlanAction] Session insert error:', spError)
          throw new Error(`Failed to create session ${session.name}: ${spError.message}`)
        }

        const sessionPlanId = spData.id

        // Track session for workout_log creation
        sessionPlanRecords.push({
          sessionPlanId,
          weekNumber: microcycle.week_number,
          dayOfWeek: dayNumber,
        })

        // Track first session for redirect
        if (!firstSessionId && microcycle.week_number === 1) {
          firstSessionId = sessionPlanId
        }

        console.log(`[saveGeneratedPlanAction] Created session: ${sessionPlanId} (${session.name})`)

        // ----------------------------------------
        // Insert Exercises
        // ----------------------------------------
        for (const exercise of session.session_plan_exercises) {
          const { data: exData, error: exError } = await supabase
            .from('session_plan_exercises')
            .insert({
              session_plan_id: sessionPlanId,
              exercise_id: exercise.exercise_id === 'custom' ? null : parseInt(exercise.exercise_id),
              exercise_order: exercise.exercise_order,
              notes: exercise.notes,
            })
            .select('id')
            .single()

          if (exError) {
            console.error('[saveGeneratedPlanAction] Exercise insert error:', exError)
            throw new Error(`Failed to create exercise ${exercise.exercise_name}: ${exError.message}`)
          }

          const exerciseId = exData.id

          // ----------------------------------------
          // Insert Sets
          // ----------------------------------------
          const setsToInsert = exercise.session_plan_sets.map((set) => ({
            session_plan_exercise_id: exerciseId,
            set_number: set.set_number,
            reps: set.reps,
            rpe: set.rpe,
            rest_seconds: set.rest_seconds,
          }))

          const { error: setsError } = await supabase
            .from('session_plan_sets')
            .insert(setsToInsert)

          if (setsError) {
            console.error('[saveGeneratedPlanAction] Sets insert error:', setsError)
            throw new Error(`Failed to create sets for ${exercise.exercise_name}: ${setsError.message}`)
          }
        }
      }
    }

    // ========================================
    // Create workout_logs for all sessions
    // ========================================
    let firstWorkoutLogId: string | null = null

    if (athlete) {
      console.log('[saveGeneratedPlanAction] Creating workout_logs for athlete:', athlete.id)

      const workoutLogInserts = sessionPlanRecords.map((record) => {
        // Calculate scheduled date: startDate + (weekNumber - 1) * 7 + dayOffset
        const scheduledDate = new Date(startDate)
        const weekOffset = (record.weekNumber - 1) * 7

        // Calculate days from Monday (day 1) to the target day
        // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, etc.
        // We want Monday (1) to be offset 0, Tuesday (2) to be offset 1, etc.
        // Sunday (0) should be offset 6 (end of week)
        const dayOffset = record.dayOfWeek === 0 ? 6 : record.dayOfWeek - 1

        scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset)

        return {
          session_plan_id: record.sessionPlanId,
          athlete_id: athlete.id,
          date_time: scheduledDate.toISOString(),
          session_status: 'assigned' as const,
        }
      })

      if (workoutLogInserts.length > 0) {
        const { data: workoutLogs, error: wlError } = await supabase
          .from('workout_logs')
          .insert(workoutLogInserts)
          .select('id')

        if (wlError) {
          console.error('[saveGeneratedPlanAction] workout_logs insert error:', wlError)
          // Don't fail the whole operation, just log it
        } else {
          console.log(`[saveGeneratedPlanAction] Created ${workoutLogs?.length || 0} workout_logs`)
          // Get the first workout log ID for redirect
          if (workoutLogs && workoutLogs.length > 0) {
            firstWorkoutLogId = String(workoutLogs[0].id)
          }
        }
      }
    } else {
      console.warn('[saveGeneratedPlanAction] No athlete found for user, skipping workout_log creation')
    }

    console.log('[saveGeneratedPlanAction] Plan saved successfully')
    console.log('[saveGeneratedPlanAction] Mesocycle ID:', mesocycleId)
    console.log('[saveGeneratedPlanAction] Microcycles created:', microcycleIds.length)
    console.log('[saveGeneratedPlanAction] First session ID:', firstSessionId)
    console.log('[saveGeneratedPlanAction] First workout log ID:', firstWorkoutLogId)

    // Revalidate relevant paths
    revalidatePath('/workout')
    revalidatePath('/plans')
    revalidatePath(`/plans/${mesocycleId}`)
    revalidatePath('/dashboard')

    return {
      isSuccess: true,
      message: 'Plan saved successfully',
      data: {
        mesocycleId,
        microcycleIds,
        firstSessionId,
        firstWorkoutLogId,
      },
    }
  } catch (error) {
    console.error('[saveGeneratedPlanAction] Error:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Failed to save plan',
    }
  }
}

// ============================================================================
// Helper
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

function dayNameToNumber(dayName: string): number {
  return DAY_NAME_TO_NUMBER[dayName.toLowerCase()] ?? 1
}
