"use server"

import { Suspense } from "react"
import { TrainingPlanWorkspace } from "@/components/features/plans/workspace/TrainingPlanWorkspace"
import { UnifiedPageSkeleton } from "@/components/layout"
import { DEMO_PLANS } from "@/components/features/plans/workspace/data/sampleData"

// Helper function to calculate average from sessions
function calculateAverage(sessions: any[], field: 'volume' | 'intensity'): number {
  if (!sessions.length) return 0
  const sum = sessions.reduce((acc, session) => acc + (session[field] || 0), 0)
  return Math.round(sum / sessions.length)
}

export default async function PlanWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const planId = Number(resolvedParams.id)

  // Get plan data (using sample data for now)
  const rawPlanData = DEMO_PLANS[planId]

  if (!rawPlanData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Plan Not Found</h1>
          <p className="text-muted-foreground">Plan ID {planId} does not exist</p>
        </div>
      </div>
    )
  }

  // Enrich data with computed metrics
  const planData = {
    ...rawPlanData,
    mesocycles: rawPlanData.mesocycles.map((meso: any) => {
      const enrichedMicrocycles = meso.microcycles.map((micro: any) => ({
        ...micro,
        volume: calculateAverage(micro.sessions, 'volume'),
        intensity: calculateAverage(micro.sessions, 'intensity'),
        isDeload: micro.name?.toLowerCase().includes('deload') || meso.metadata?.deload,
        weekNumber: parseInt(micro.name?.match(/\d+/)?.[0] || '0'),
      }))

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
