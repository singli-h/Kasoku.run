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
import { startTrainingSessionAction, skipWorkoutSessionAction } from '@/actions/workout/workout-session-actions'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Import types
import type {
  WorkoutLogWithDetails
} from "@/types/training"

export function WorkoutPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  // Fetch today's and ongoing sessions
  const { data: sessions, isLoading: sessionsLoading, refetchSessions } = useSessionsToday()

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
        title: "Workout started",
        description: "Your workout session has begun",
      })
    }

    // Navigate to session page
    router.push(`/workout/${session.id}`)
  }

  // Skip a workout session
  const handleSkip = async (session: WorkoutLogWithDetails) => {
    if (!session?.id) return

    setIsSkipping(true)
    try {
      const result = await skipWorkoutSessionAction(session.id)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message || "Failed to skip workout",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Workout skipped",
        description: "The session has been marked as skipped",
      })

      // Refresh session list to reflect the change
      refetchSessions()
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred while skipping",
        variant: "destructive"
      })
    } finally {
      setIsSkipping(false)
    }
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
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
            {/* Session cards skeleton */}
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
                  onSkip={handleSkip}
                  isLoading={isStarting}
                  isSkipping={isSkipping}
                />
              </div>
            )}

            {/* All Available Sessions */}
            <WorkoutSessionSelector
              onSessionSelected={(_presetGroup, session) => {
                if (session) handleSessionSelected(session)
              }}
              hideOngoing={!!ongoingSession}
            />
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  )
} 