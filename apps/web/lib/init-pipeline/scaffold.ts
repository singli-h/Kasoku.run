/**
 * Init Pipeline: Scaffolding Step
 *
 * Transforms simple AI-generated plan into full in-memory state.
 * This is Step 3 of the Init Pipeline.
 *
 * AI outputs simple flat structure → Code expands to full nested structure
 */

// Use crypto.randomUUID which works in both Node.js and modern browsers
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
import type { SimpleGeneratedPlan } from './schemas'
import type {
  MicrocycleData,
  SessionPlanData,
  SessionPlanExerciseData,
  SessionPlanSetData,
} from '@/lib/changeset/plan-generator/types'

// ============================================================================
// Types
// ============================================================================

export interface ScaffoldContext {
  /** Mesocycle ID (can be temp ID before save) */
  mesocycleId: string
  /** Exercise library for looking up names */
  exerciseLibrary: Map<number, string>
}

export interface ScaffoldedPlan {
  microcycles: MicrocycleData[]
}

// ============================================================================
// Day Mapping
// ============================================================================

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

// ============================================================================
// Scaffold Function
// ============================================================================

/**
 * Transform simple AI output into full in-memory plan state.
 *
 * What this does:
 * - Generate UUIDs for all entities
 * - Expand `sets: 4` into array of 4 set objects
 * - Add `exercise_order` from array index
 * - Add `week_number` from array index
 * - Map `day` number to `day_of_week` string
 * - Detect deload weeks from name
 * - Look up exercise names from library
 */
export function scaffoldPlan(
  simplePlan: SimpleGeneratedPlan,
  context: ScaffoldContext
): ScaffoldedPlan {
  console.log('[scaffold] Starting scaffolding...')
  console.log('[scaffold] Microcycles to process:', simplePlan.microcycles.length)

  const microcycles: MicrocycleData[] = simplePlan.microcycles.map(
    (mc, mcIndex) => {
      const weekNumber = mcIndex + 1
      const isDeload = mc.name.toLowerCase().includes('deload')

      console.log(`[scaffold] Processing Week ${weekNumber}: ${mc.name}`)

      const sessionPlans: SessionPlanData[] = mc.sessions.map((session) => {
        const sessionId = generateId()

        console.log(`[scaffold]   Session: ${session.name} (day ${session.day})`)

        const exercises: (SessionPlanExerciseData | null)[] = session.exercises.map(
          (ex, exIndex) => {
            const exerciseName = context.exerciseLibrary.get(ex.exercise_id)

            // Skip exercises with invalid IDs (AI hallucinated an ID not in library)
            if (!exerciseName) {
              console.warn(`[scaffold] Skipping invalid exercise_id ${ex.exercise_id} - not in library`)
              return null
            }

            const exerciseId = generateId()
            console.log(`[scaffold]     Exercise ${exIndex}: ${exerciseName} (${ex.sets}x${ex.reps})`)

            // EXPAND sets count into individual set objects
            const sets: SessionPlanSetData[] = Array.from(
              { length: ex.sets },
              (_, setIndex) => ({
                id: generateId(),
                set_number: setIndex + 1,
                reps: ex.reps,
                rpe: ex.rpe,
                rest_seconds: ex.rest_time,
                tempo: undefined,
                notes: undefined,
              })
            )

            return {
              id: exerciseId,
              exercise_id: String(ex.exercise_id),
              exercise_name: exerciseName,
              exercise_order: exIndex,
              superset_group: undefined,
              notes: undefined,
              session_plan_sets: sets,
            }
          }
        )

        return {
          id: sessionId,
          name: session.name,
          day_of_week: DAY_NUMBER_TO_NAME[session.day] || 'monday',
          session_type: 'strength', // Default - could be inferred from description
          estimated_duration: 45, // Default
          notes: session.description,
          session_plan_exercises: exercises
            .filter((e): e is SessionPlanExerciseData => e !== null)
            .map((e, i) => ({ ...e, exercise_order: i })),
        }
      })

      return {
        id: generateId(),
        mesocycle_id: context.mesocycleId,
        week_number: weekNumber,
        name: mc.name,
        focus: undefined,
        is_deload: isDeload,
        session_plans: sessionPlans,
      }
    }
  )

  console.log('[scaffold] Scaffolding complete')
  console.log('[scaffold] Total microcycles:', microcycles.length)
  console.log(
    '[scaffold] Total sessions:',
    microcycles.reduce((acc, mc) => acc + mc.session_plans.length, 0)
  )
  console.log(
    '[scaffold] Total exercises:',
    microcycles.reduce(
      (acc, mc) =>
        acc +
        mc.session_plans.reduce(
          (acc2, sp) => acc2 + sp.session_plan_exercises.length,
          0
        ),
      0
    )
  )

  return { microcycles }
}

// ============================================================================
// Helper: Build Exercise Library Map
// ============================================================================

export interface ExerciseLibraryItem {
  id: number
  name: string
}

/**
 * Convert exercise library array to Map for fast lookup.
 */
export function buildExerciseLibraryMap(
  exercises: ExerciseLibraryItem[]
): Map<number, string> {
  const map = new Map<number, string>()
  for (const ex of exercises) {
    map.set(ex.id, ex.name)
  }
  return map
}
