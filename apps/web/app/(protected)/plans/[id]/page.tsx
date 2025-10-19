import { Suspense } from "react"
import { notFound } from "next/navigation"
import { TrainingPlanWorkspace } from "@/components/features/plans/workspace/TrainingPlanWorkspace"
import { UnifiedPageSkeleton } from "@/components/layout"
import { getMacrocycleByIdAction } from "@/actions/plans/plan-actions"
import { getRacesByMacrocycleAction } from "@/actions/plans/race-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

// Helper function to calculate average from sessions
function calculateAverage(sessions: any[], field: 'volume' | 'intensity'): number {
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

  const rawPlanData = macrocycleResult.data
  const races = racesResult.isSuccess ? racesResult.data : []

  // Enrich data with computed metrics
  const planData = {
    macrocycle: {
      id: (rawPlanData as any).id,
      name: (rawPlanData as any).name,
      description: (rawPlanData as any).description,
      start_date: (rawPlanData as any).start_date,
      end_date: (rawPlanData as any).end_date
    },
    events: races.map(race => ({
      id: race.id,
      name: race.name,
      category: null,
      type: race.type,
      date: race.date
    })),
    mesocycles: (rawPlanData.mesocycles || []).map((meso: any) => {
      const enrichedMicrocycles = (meso.microcycles || []).map((micro: any) => {
        const sessions = micro.exercise_preset_groups || []
        return {
          ...micro,
          sessions, // Use exercise_preset_groups as sessions
          volume: calculateAverage(sessions, 'volume'),
          intensity: calculateAverage(sessions, 'intensity'),
          isDeload: micro.name?.toLowerCase().includes('deload') || meso.metadata?.deload,
          weekNumber: parseInt(micro.name?.match(/\d+/)?.[0] || '0'),
        }
      })

      const allSessions = enrichedMicrocycles.flatMap((m: any) => m.sessions)

      return {
        ...meso,
        microcycles: enrichedMicrocycles,
        totalSessions: allSessions.length,
        avgVolume: calculateAverage(allSessions, 'volume'),
        avgIntensity: calculateAverage(allSessions, 'intensity'),
      }
    }),
  }

  return (
    <Suspense fallback={<UnifiedPageSkeleton title="Training Plan" variant="grid" />}>
      <TrainingPlanWorkspace initialPlan={planData} />
    </Suspense>
  )
}
