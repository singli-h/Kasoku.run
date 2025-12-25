/**
 * Dynamic Workout Session Page
 * Displays a specific workout session by ID
 * URL: /workout/[id]
 *
 * Uses the new unified training components (WorkoutSessionDashboardV2)
 * which provides a mobile-first, section-based exercise organization.
 */

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getWorkoutSessionByIdAction } from "@/actions/workout/workout-session-actions"
import { WorkoutSessionDashboardV2 } from "@/components/features/training"
import { UnifiedPageSkeleton } from "@/components/layout"

interface WorkoutSessionPageProps {
  params: Promise<{ id: string }>
}

async function WorkoutSessionContent({ sessionId }: { sessionId: number }) {
  const result = await getWorkoutSessionByIdAction(sessionId)

  if (!result.isSuccess || !result.data) {
    notFound()
  }

  const session = result.data
  const sessionPlan = session.session_plan

  if (!sessionPlan) {
    notFound()
  }

  return (
    <WorkoutSessionDashboardV2
      presetGroup={sessionPlan}
      existingSession={session}
    />
  )
}

export default async function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { id } = await params
  const sessionId = parseInt(id, 10)

  if (isNaN(sessionId)) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<UnifiedPageSkeleton title="" variant="grid" />}>
          <WorkoutSessionContent sessionId={sessionId} />
        </Suspense>
      </div>
    </div>
  )
}
