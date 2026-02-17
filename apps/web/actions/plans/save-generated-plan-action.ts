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
  let mesocycleId: number | null = null
  // Track created session plan IDs for rollback (session_plans.microcycle_id is SET NULL, not CASCADE)
  const createdSessionPlanIds: string[] = []
  // Track created workout log IDs for reliable rollback
  const createdWorkoutLogIds: string[] = []

  // Authenticate early — before try block so db client is available in catch for rollback
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: 'Unauthorized' }
  }

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) {
    return { isSuccess: false, message: 'User not found' }
  }

  // Use service role client for DB writes. The save operation involves 200+
  // sequential inserts that can take 30-60s total. Clerk JWTs expire in 60s,
  // making the RLS-authenticated client unreliable for this long-running write.
  // Auth is already validated above via auth() + getDbUserId().
  const db = supabaseService

  try {

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
    const { data: mesocycle, error: mesoError } = await db
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

    mesocycleId = mesocycle.id
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
    const { data: athlete } = await db
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    // ========================================
    // Insert all child entities
    // ========================================
    const totalWeeks = input.plan.microcycles.length

    for (const microcycle of input.plan.microcycles) {
      // ----------------------------------------
      // Insert Microcycle (Week)
      // ----------------------------------------

      // Calculate week start/end dates
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (microcycle.week_number - 1) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Progressive volume/intensity ramp (deload week gets lower values)
      const isDeload = microcycle.is_deload || microcycle.week_number === totalWeeks
      const volume = isDeload ? 3 : Math.min(5 + microcycle.week_number - 1, 8)
      const intensity = isDeload ? 4 : Math.min(5 + microcycle.week_number - 1, 8)

      const { data: mcData, error: mcError } = await db
        .from('microcycles')
        .insert({
          mesocycle_id: mesocycleId,
          name: microcycle.name,
          user_id: dbUserId,
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0],
          volume,
          intensity,
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

        const { data: spData, error: spError } = await db
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
        createdSessionPlanIds.push(sessionPlanId)

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
          const { data: exData, error: exError } = await db
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
            set_index: set.set_number,
            reps: set.reps != null ? Math.round(set.reps) : null,
            rpe: set.rpe != null ? Math.round(set.rpe) : null,
            rest_time: set.rest_seconds != null ? Math.round(set.rest_seconds) : null,
          }))

          const { error: setsError } = await db
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

      // Sort by date to ensure first entry is chronologically earliest
      workoutLogInserts.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      if (workoutLogInserts.length > 0) {
        const { data: workoutLogs, error: wlError } = await db
          .from('workout_logs')
          .insert(workoutLogInserts)
          .select('id')

        if (wlError) {
          console.error('[saveGeneratedPlanAction] workout_logs insert error:', wlError)
          // Don't fail the whole operation, just log it
        } else {
          console.log(`[saveGeneratedPlanAction] Created ${workoutLogs?.length || 0} workout_logs`)
          // Track IDs for rollback and get first workout log for redirect
          if (workoutLogs && workoutLogs.length > 0) {
            createdWorkoutLogIds.push(...workoutLogs.map(wl => String(wl.id)))
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

    // Rollback: delete all created entities in reverse order
    // Note: session_plans.microcycle_id FK is ON DELETE SET NULL (not CASCADE),
    // so we must delete session_plans explicitly to avoid orphans.
    if (mesocycleId) {
      console.warn('[saveGeneratedPlanAction] Rolling back mesocycle:', mesocycleId)
      try {
        // 1. Delete workout_logs by tracked IDs (more reliable than session_plan_id filter)
        if (createdWorkoutLogIds.length > 0) {
          await db.from('workout_logs').delete().in('id', createdWorkoutLogIds)
        } else if (createdSessionPlanIds.length > 0) {
          // Fallback: delete by session_plan_id if we didn't get to track workout_log IDs
          await db.from('workout_logs').delete().in('session_plan_id', createdSessionPlanIds)
        }
        // 2. Delete session_plans (cascades to exercises/sets via FK)
        if (createdSessionPlanIds.length > 0) {
          await db.from('session_plans').delete().in('id', createdSessionPlanIds)
        }
        // 3. Delete microcycles
        await db.from('microcycles').delete().eq('mesocycle_id', mesocycleId)
        // 4. Delete mesocycle
        await db.from('mesocycles').delete().eq('id', mesocycleId)
        console.log('[saveGeneratedPlanAction] Rollback complete')
      } catch (rollbackError) {
        console.error('[saveGeneratedPlanAction] Rollback failed:', rollbackError)
      }
    }

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
