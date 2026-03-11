import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TrainingPlanWorkspace } from "@/components/features/plans/workspace/TrainingPlanWorkspace"
import { CoachPlanPageWithAI } from "@/components/features/plans/coach-workspace/CoachPlanPageWithAI"
import { IndividualPlanPageWithAI } from "@/components/features/plans/individual"
import { PageLayout } from "@/components/layout"
import { getMacrocycleByIdAction, getMesocycleByIdAction, getUserMesocyclesAction } from "@/actions/plans/plan-actions"
import { getRacesByMacrocycleAction } from "@/actions/plans/race-actions"
import { getExercisesAction } from "@/actions/library/exercise-actions"
import { getCoachAthleteGroupsAction } from "@/actions/athletes/athlete-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { FeatureErrorBoundary } from "@/components/error-boundary"
import type { MesocycleWithDetails } from "@/types/training"
import type { SessionPlanExerciseWithDetails } from "@/types/training"
import { computeSessionMetrics, formatExerciseSummary, abbreviateEventGroup } from "@/lib/training-utils"
import type { ExerciseWithSets } from "@/lib/training-utils"

// Type definitions for the coach plan data (fed into TrainingPlanWorkspace)
interface SessionPlan {
  id: string
  day: number | null
  name: string | null
  session_mode: string | null
  session_plan_exercises?: SessionPlanExerciseWithDetails[]
}

interface MicrocycleData {
  id: number
  name: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  volume?: number | null
  intensity?: number | null
  session_plans?: SessionPlan[]
}

/** Metadata shape expected by TrainingPlanWorkspace */
interface WorkspaceMetadata {
  phase?: "GPP" | "SPP" | "Taper" | "Competition"
  color?: string
  deload?: boolean
}

interface MesocycleData {
  id: number
  macrocycle_id?: number | null
  user_id?: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  planning_context?: unknown | null
  metadata: WorkspaceMetadata | null
  microcycles?: MicrocycleData[]
}

interface MacrocycleData {
  id: number
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  planning_context?: unknown | null
  mesocycles?: MesocycleData[]
}

export default async function PlanWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })

  const resolvedParams = await params
  const planId = Number(resolvedParams.id)
  const isIndividual = role === 'individual'

  // For individual users, fetch mesocycle (Training Block) directly with AI support (T016)
  if (isIndividual) {
    // Fetch current block, all user's blocks, and exercise library in parallel
    const [mesocycleResult, allBlocksResult, exercisesResult] = await Promise.all([
      getMesocycleByIdAction(planId),
      getUserMesocyclesAction(),
      getExercisesAction() // Fetch exercise library for inline editing
    ])

    if (!mesocycleResult.isSuccess || !mesocycleResult.data) {
      console.error('Failed to fetch training block:', mesocycleResult.message)
      notFound()
    }

    // Categorize other blocks for the switcher and date validation
    const allBlocks = allBlocksResult.isSuccess ? (allBlocksResult.data || []) : []
    const today = new Date()

    const otherBlocks = {
      upcoming: allBlocks.filter(block => {
        if (block.id === planId) return false // Exclude current block
        if (!block.end_date) return true // No end date = ongoing/upcoming
        return new Date(block.end_date) >= today
      }),
      completed: allBlocks.filter(block => {
        if (block.id === planId) return false // Exclude current block
        if (!block.end_date) return false
        return new Date(block.end_date) < today
      })
    }

    // Transform exercise library for the planner
    // Map ExerciseWithDetails to the expected exerciseLibrary format
    const exerciseLibrary = exercisesResult.isSuccess && exercisesResult.data
      ? exercisesResult.data.map(ex => ({
          id: String(ex.id),
          name: ex.name ?? '',
          category: ex.exercise_type?.type ?? 'General', // Use exercise type as category
          equipment: ex.exercise_type?.type ?? 'Bodyweight', // Placeholder - equipment stored as tags
          muscleGroups: (ex.tags ?? [])
            .filter(tag => tag.category === 'region')
            .map(tag => tag.name),
          exerciseTypeId: ex.exercise_type_id ?? undefined,
        }))
      : []

    return (
      <FeatureErrorBoundary featureName="Training Block" customMessage="Something went wrong while loading your training block. Please try again.">
        <Suspense fallback={<div className="space-y-6 p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /><div className="h-[400px] bg-muted animate-pulse rounded-lg" /></div>}>
          <IndividualPlanPageWithAI
            trainingBlock={mesocycleResult.data as MesocycleWithDetails}
            otherBlocks={otherBlocks}
            exerciseLibrary={exerciseLibrary}
          />
        </Suspense>
      </FeatureErrorBoundary>
    )
  }

  // For coaches, fetch macrocycle with full hierarchy + coach groups
  const [macrocycleResult, racesResult, groupsResult] = await Promise.all([
    getMacrocycleByIdAction(planId),
    getRacesByMacrocycleAction(planId),
    getCoachAthleteGroupsAction()
  ])

  const coachGroups = (groupsResult.isSuccess ? groupsResult.data ?? [] : [])
    .map(g => ({ id: g.id, name: g.group_name ?? `Group ${g.id}` }))

  // Handle errors
  if (!macrocycleResult.isSuccess || !macrocycleResult.data) {
    console.error('Failed to fetch macrocycle:', macrocycleResult.message)
    notFound()
  }

  const rawPlanData = macrocycleResult.data as MacrocycleData
  const races = racesResult.isSuccess && racesResult.data ? racesResult.data : []

  // Log race fetching errors for debugging (non-blocking)
  if (!racesResult.isSuccess) {
    console.warn('[Plan Page] Failed to fetch races:', racesResult.message)
  }

  // Enrich data with computed metrics
  const planData = {
    macrocycle: {
      id: rawPlanData.id,
      name: rawPlanData.name,
      description: rawPlanData.description,
      start_date: rawPlanData.start_date,
      end_date: rawPlanData.end_date,
      planning_context: rawPlanData.planning_context ?? null
    },
    events: races.map(race => ({
      id: race.id,
      name: race.name as string | null,
      category: null as string | null,
      type: race.type as string | null,
      date: race.date
    })),
    mesocycles: (rawPlanData.mesocycles || []).map((meso: MesocycleData) => {
      const enrichedMicrocycles = (meso.microcycles || []).map((micro: MicrocycleData) => {
        // Transform session_plans into sessions with proper structure
        const sessions = (micro.session_plans || []).map((group: SessionPlan) => {
          const rawExercises = group.session_plan_exercises ?? []

          // Map to ExerciseWithSets for metrics computation
          const exercisesForMetrics: ExerciseWithSets[] = rawExercises.map((ex: SessionPlanExerciseWithDetails) => ({
            exercise_type_id: ex.exercise?.exercise_type_id ?? null,
            sets: ex.session_plan_sets ?? [],
          }))

          const metrics = computeSessionMetrics(exercisesForMetrics)

          // Extract exercise names for card display
          const exerciseNames = rawExercises
            .map((ex: SessionPlanExerciseWithDetails) => ex.exercise?.name)
            .filter((name): name is string => !!name)

          // Extract exercise summaries (e.g. "3x10 80kg")
          const exerciseSummaries = exercisesForMetrics.map(ex => formatExerciseSummary(ex))

          // Extract target event groups per exercise (target_event_groups from database Row type)
          const targetEventGroups = rawExercises
            .map((ex: SessionPlanExerciseWithDetails) => ex.target_event_groups ?? null)
            .filter((g): g is string[] => g !== null)

          return {
            id: group.id,
            day: group.day ?? 0,
            name: group.name ?? 'Unnamed Session',
            type: (group.session_mode ?? 'endurance') as 'speed' | 'strength' | 'recovery' | 'endurance' | 'power',
            duration: metrics.duration, // Computed from sets
            volume: metrics.volume, // Computed from sets
            volumeUnit: metrics.volumeUnit,
            intensity: 0, // No intensity formula yet
            exerciseNames,
            exerciseSummaries,
            targetEventGroups,
            exercises: rawExercises,
          }
        })

        return {
          id: micro.id,
          mesocycle_id: meso.id,
          name: micro.name,
          description: micro.description ?? null,
          start_date: micro.start_date ?? null,
          end_date: micro.end_date ?? null,
          sessions,
          // Use microcycle volume/intensity directly from database instead of calculating from sessions
          volume: micro.volume ?? 0,
          intensity: micro.intensity ?? 0,
          isDeload: micro.name?.toLowerCase().includes('deload') || meso.metadata?.deload,
          weekNumber: parseInt(micro.name?.match(/\d+/)?.[0] || '0') || 0,
        }
      })

      const allSessions = enrichedMicrocycles.flatMap(m => m.sessions)
      
      // Calculate mesocycle avgVolume/avgIntensity from microcycle values, not from sessions
      const microcycleVolumes = enrichedMicrocycles
        .map(m => m.volume)
        .filter((v): v is number => v !== null && v !== undefined && v > 0)
      const microcycleIntensities = enrichedMicrocycles
        .map(m => m.intensity)
        .filter((i): i is number => i !== null && i !== undefined && i > 0)
      
      const avgVolume = microcycleVolumes.length > 0
        ? Math.round(microcycleVolumes.reduce((sum, v) => sum + v, 0) / microcycleVolumes.length)
        : 0
      const avgIntensity = microcycleIntensities.length > 0
        ? Math.round((microcycleIntensities.reduce((sum, i) => sum + i, 0) / microcycleIntensities.length) * 10) / 10
        : 0

      return {
        ...meso,
        macrocycle_id: meso.macrocycle_id ?? rawPlanData.id,
        user_id: meso.user_id ?? null,
        metadata: meso.metadata || null, // Ensure metadata is preserved (includes color)
        microcycles: enrichedMicrocycles,
        totalSessions: allSessions.length,
        avgVolume,
        avgIntensity,
      }
    }),
  }

  return (
    <FeatureErrorBoundary featureName="Training Plan" customMessage="Something went wrong while loading your training plan. Please try again.">
      <Suspense fallback={<div className="space-y-6 p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /><div className="h-[400px] bg-muted animate-pulse rounded-lg" /></div>}>
        <CoachPlanPageWithAI initialPlan={planData} coachGroups={coachGroups} />
      </Suspense>
    </FeatureErrorBoundary>
  )
}
