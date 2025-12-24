import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TrainingPlanWorkspace } from "@/components/features/plans/workspace/TrainingPlanWorkspace"
import { UnifiedPageSkeleton } from "@/components/layout"
import { getMacrocycleByIdAction } from "@/actions/plans/plan-actions"
import { getRacesByMacrocycleAction } from "@/actions/plans/race-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { FeatureErrorBoundary } from "@/components/error-boundary"

// Type definitions for better type safety
interface SessionData {
  volume: number
  intensity: number
  [key: string]: any
}

interface SessionPlan {
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
  session_plans?: SessionPlan[]
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
function calculateAverage(sessions: Array<{ volume: number; intensity: number }>, field: 'volume' | 'intensity'): number {
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
      name: race.name as string | null,
      category: null as string | null,
      type: race.type as string | null,
      date: race.date
    })),
    mesocycles: (rawPlanData.mesocycles || []).map((meso: MesocycleData) => {
      const enrichedMicrocycles = (meso.microcycles || []).map((micro: MicrocycleData) => {
        // Transform session_plans into sessions with proper structure
        const sessions = (micro.session_plans || []).map((group: SessionPlan) => {
          // Extract only needed fields to avoid property conflicts
          return {
            id: group.id,
            day: group.day ?? 0,
            name: group.name ?? 'Unnamed Session',
            type: (group.session_mode ?? 'endurance') as 'speed' | 'strength' | 'recovery' | 'endurance' | 'power',
            duration: 60, // Default duration
            volume: 0, // Default volume
            intensity: 0, // Default intensity
            exercises: group.session_plan_exercises ?? [], // Include the nested exercise_presets
          }
        })

        return {
          id: micro.id,
          mesocycle_id: meso.id,
          name: micro.name,
          description: null,
          start_date: null,
          end_date: null,
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
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plan" variant="grid" />}>
        <TrainingPlanWorkspace initialPlan={planData} />
      </Suspense>
    </FeatureErrorBoundary>
  )
}
