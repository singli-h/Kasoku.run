import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TrainingPlanWorkspace } from "@/components/features/plans/workspace/TrainingPlanWorkspace"
import { UnifiedPageSkeleton } from "@/components/layout"
import { getMacrocycleByIdAction } from "@/actions/plans/plan-actions"
import { getRacesByMacrocycleAction } from "@/actions/plans/race-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { PlanErrorBoundary } from "@/components/error-boundary/PlanErrorBoundary"

// Type definitions for better type safety
interface SessionData {
  volume: number
  intensity: number
  [key: string]: any
}

interface ExercisePresetGroup {
  id: number
  day: number | null
  name: string | null
  session_mode: string | null
  exercise_presets?: any[]
  [key: string]: any
}

interface MicrocycleData {
  id: number
  name: string | null
  exercise_preset_groups?: ExercisePresetGroup[]
  [key: string]: any
}

interface MesocycleData {
  id: number
  macrocycle_id?: number | null
  user_id?: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  metadata: any
  microcycles?: MicrocycleData[]
  [key: string]: any
}

interface MacrocycleData {
  id: number
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  mesocycles?: MesocycleData[]
}

// Helper function to calculate average from sessions
function calculateAverage(sessions: SessionData[], field: 'volume' | 'intensity'): number {
  if (!sessions.length) return 0
  const sum = sessions.reduce((acc, session) => acc + (session[field] || 0), 0)
  return Math.round(sum / sessions.length)
}

export default async function PlanWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  // Protect this page - only coaches and admins can access
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })

  const resolvedParams = await params
  const planId = Number(resolvedParams.id)

  // Fetch plan data from Supabase
  const [macrocycleResult, racesResult] = await Promise.all([
    getMacrocycleByIdAction(planId),
    getRacesByMacrocycleAction(planId)
  ])

  // Handle errors
  if (!macrocycleResult.isSuccess || !macrocycleResult.data) {
    console.error('Failed to fetch macrocycle:', macrocycleResult.message)
    notFound()
  }

  const rawPlanData = macrocycleResult.data as MacrocycleData
  const races = racesResult.isSuccess ? racesResult.data : []

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
      end_date: rawPlanData.end_date
    },
    events: races.map(race => ({
      id: race.id,
      name: race.name,
      category: null,
      type: race.type,
      date: race.date
    })),
    mesocycles: (rawPlanData.mesocycles || []).map((meso: MesocycleData) => {
      const enrichedMicrocycles = (meso.microcycles || []).map((micro: MicrocycleData) => {
        // Transform exercise_preset_groups into sessions with proper structure
        const sessions = (micro.exercise_preset_groups || []).map((group: ExercisePresetGroup): SessionData => {
          // Extract only needed fields to avoid property conflicts
          const session: SessionData = {
            id: group.id,
            day: group.day ?? 0,
            name: group.name ?? 'Unnamed Session',
            type: group.session_mode ?? 'endurance',
            duration: 60, // Default duration
            volume: 0, // Default volume
            intensity: 0, // Default intensity
            exercises: group.exercise_presets ?? [], // Include the nested exercise_presets
          }
          return session
        })

        return {
          ...micro,
          sessions,
          volume: calculateAverage(sessions, 'volume'),
          intensity: calculateAverage(sessions, 'intensity'),
          isDeload: micro.name?.toLowerCase().includes('deload') || meso.metadata?.deload,
          weekNumber: parseInt(micro.name?.match(/\d+/)?.[0] || '0') || 0,
        }
      })

      const allSessions = enrichedMicrocycles.flatMap(m => m.sessions)

      return {
        ...meso,
        macrocycle_id: meso.macrocycle_id ?? rawPlanData.id,
        user_id: meso.user_id ?? null,
        microcycles: enrichedMicrocycles,
        totalSessions: allSessions.length,
        avgVolume: calculateAverage(allSessions, 'volume'),
        avgIntensity: calculateAverage(allSessions, 'intensity'),
      }
    }),
  }

  return (
    <PlanErrorBoundary>
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plan" variant="grid" />}>
        <TrainingPlanWorkspace initialPlan={planData} />
      </Suspense>
    </PlanErrorBoundary>
  )
}
