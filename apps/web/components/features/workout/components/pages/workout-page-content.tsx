/**
 * Workout Page Content
 * Main component that manages the workout flow with focus on "doing" rather than "finding"
 * Prioritizes ongoing sessions, then next scheduled session, with history in a separate view
 *
 * Updated: Now uses URL-based routing (/workout/[id]) for session views
 * Fix: No longer auto-redirects when user intentionally navigates back
 */

"use client"

import { useEffect, useState } from "react"
import { WorkoutSessionSelector } from "./workout-session-selector"
import { NextSessionCard } from "./next-session-card"
import { OngoingSessionBanner } from "./ongoing-session-banner"
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { useSessionsToday } from '../../hooks/use-workout-queries'
import { useRouter } from "next/navigation"
import { startTrainingSessionAction } from '@/actions/workout/workout-session-actions'
import { useToast } from '@/hooks/use-toast'

// Import types
import type {
  WorkoutLogWithDetails
} from "@/types/training"

export function WorkoutPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  // Fetch today's and ongoing sessions
  const { data: sessions, isLoading: sessionsLoading } = useSessionsToday()

  // Find ongoing session (highest priority)
  const ongoingSession = sessions?.find((s: any) => s.session_status === 'ongoing')

  // Find next assigned session (if no ongoing)
  const nextSession = !ongoingSession
    ? sessions?.find((s: any) => s.session_status === 'assigned')
    : null

  // Navigate to session page when selected - starts session if not already started
  const handleSessionSelected = async (session: WorkoutLogWithDetails) => {
    if (!session?.id) return

    // If session is assigned (not started), start it first
    if (session.session_status === 'assigned') {
      setIsStarting(true)
      const result = await startTrainingSessionAction(session.id)
      setIsStarting(false)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message || "Failed to start workout",
          variant: "destructive"
        })
        return
      }

      // Success - navigate to the session
      toast({
        title: "Workout Started",
        description: "Your workout session has begun",
      })
    }

    // Navigate to session page
    router.push(`/workout/${session.id}`)
  }

  // Check for intentional return flag on mount
  useEffect(() => {
    const intentionalReturn = sessionStorage.getItem('workout-intentional-return')
    if (intentionalReturn) {
      sessionStorage.removeItem('workout-intentional-return')
      setSkipAutoRedirect(true)
    }
  }, [])

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

            {/* Ongoing Session Banner - shown instead of auto-redirect */}
            {ongoingSession && (
              <OngoingSessionBanner
                session={ongoingSession}
                onResume={() => router.push(`/workout/${ongoingSession.id}`)}
              />
            )}

            {/* Next Session Card (if no ongoing session) */}
            {nextSession && !ongoingSession && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Next Workout</h2>
                <NextSessionCard
                  session={nextSession}
                  onStart={handleSessionSelected}
                  isLoading={isStarting}
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