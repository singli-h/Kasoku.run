/**
 * Workout Page Content
 * Main component that manages the workout flow with focus on "doing" rather than "finding"
 * Prioritizes ongoing sessions, then next scheduled session, with history in a separate view
 *
 * Updated: Now uses URL-based routing (/workout/[id]) for session views
 */

"use client"

import { useEffect } from "react"
import { WorkoutSessionSelector } from "./workout-session-selector"
import { NextSessionCard } from "./next-session-card"
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { useSessionsToday } from '../../hooks/use-workout-queries'
import { useRouter } from "next/navigation"

// Import types
import type {
  WorkoutLogWithDetails
} from "@/types/training"

export function WorkoutPageContent() {
  const router = useRouter()

  // Fetch today's and ongoing sessions
  const { data: sessions, isLoading: sessionsLoading } = useSessionsToday()

  // Find ongoing session (highest priority)
  const ongoingSession = sessions?.find((s: any) => s.session_status === 'ongoing')

  // Find next assigned session (if no ongoing)
  const nextSession = !ongoingSession
    ? sessions?.find((s: any) => s.session_status === 'assigned')
    : null

  // Navigate to session page when selected
  const handleSessionSelected = (session: WorkoutLogWithDetails) => {
    if (session?.id) {
      router.push(`/workout/${session.id}`)
    }
  }

  // Auto-redirect to ongoing session if it exists
  useEffect(() => {
    if (ongoingSession?.id) {
      router.push(`/workout/${ongoingSession.id}`)
    }
  }, [ongoingSession?.id, router])

  // Render session selection view
  return (
    <FeatureErrorBoundary featureName="Workout" customMessage="Something went wrong with your workout. Please try again.">
      <div className="max-w-6xl mx-auto">
        {sessionsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading workouts...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold">My Workouts</h1>
              <p className="text-muted-foreground">Continue your workout or start a new session</p>
            </div>

            {/* Next Session Card (if no ongoing session) */}
            {nextSession && !ongoingSession && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Next Workout</h2>
                <NextSessionCard
                  session={nextSession}
                  onStart={handleSessionSelected}
                />
              </div>
            )}

            {/* All Available Sessions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {ongoingSession ? "Other Sessions" : "Available Sessions"}
              </h2>
              <WorkoutSessionSelector
                onSessionSelected={(_presetGroup, session) => {
                  if (session) handleSessionSelected(session)
                }}
                hideOngoing={!!ongoingSession}
              />
            </div>
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  )
} 