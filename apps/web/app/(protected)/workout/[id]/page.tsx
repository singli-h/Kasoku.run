/**
 * Dynamic Workout Session Page
 * Displays a specific workout session by ID
 * URL: /workout/[id]
 *
 * Uses React Query for seamless data refresh:
 * - Server-side fetch for fast initial load (SSR)
 * - Client-side React Query for auto-refresh on tab focus
 * - No loading flash thanks to initialData pattern
 */

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getWorkoutSessionByIdAction } from "@/actions/workout/workout-session-actions"
import { UnifiedPageSkeleton } from "@/components/layout"
import { WorkoutSessionClient } from "./WorkoutSessionClient"

interface WorkoutSessionPageProps {
  params: Promise<{ id: string }>
}

async function WorkoutSessionContent({ sessionId }: { sessionId: number }) {
  // Server-side fetch for fast initial render
  const result = await getWorkoutSessionByIdAction(sessionId)

  if (!result.isSuccess || !result.data) {
    notFound()
  }

  const session = result.data
  const sessionPlan = session.session_plan

  if (!sessionPlan) {
    notFound()
  }

  // Pass to client component for React Query hydration
  // This enables seamless background refresh without loading states
  return (
    <WorkoutSessionClient
      initialSession={session}
      sessionId={sessionId}
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
    <div className="w-full">
      <Suspense fallback={<UnifiedPageSkeleton title="" variant="grid" />}>
        <WorkoutSessionContent sessionId={sessionId} />
      </Suspense>
    </div>
  )
}
