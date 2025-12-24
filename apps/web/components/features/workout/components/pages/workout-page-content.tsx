/**
 * Workout Page Content
 * Main component that manages the workout flow with focus on "doing" rather than "finding"
 * Prioritizes ongoing sessions, then next scheduled session, with history in a separate view
 */

"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkoutSessionSelector } from "./workout-session-selector"
import { WorkoutSessionDashboard } from "./workout-session-dashboard"
import { NextSessionCard } from "./next-session-card"
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { useSessionsToday } from '../../hooks/use-workout-queries'
import { getPastSessionsAction } from "@/actions/workout/workout-session-actions"
import Link from "next/link"

// Import types
import type { 
  SessionPlanWithDetails,
  WorkoutLogWithDetails 
} from "@/types/training"

type WorkoutPageState = 'selection' | 'active-session'

interface ActiveSession {
  presetGroup: SessionPlanWithDetails
  session?: WorkoutLogWithDetails
}

export function WorkoutPageContent() {
  const [pageState, setPageState] = useState<WorkoutPageState>('selection')
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch today's and ongoing sessions
  const { data: sessions, isLoading: sessionsLoading } = useSessionsToday()

  // Find ongoing session (highest priority)
  const ongoingSession = sessions?.find((s: any) => s.session_status === 'ongoing')
  
  // Find next assigned session (if no ongoing)
  const nextSession = !ongoingSession 
    ? sessions?.find((s: any) => s.session_status === 'assigned')
    : null

  // Handle session selection
  const handleSessionSelected = async (
    presetGroup: SessionPlanWithDetails, 
    session?: WorkoutLogWithDetails
  ) => {
    setIsLoading(true)
    try {
      setActiveSession({ presetGroup, session })
      setPageState('active-session')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back to selection
  const handleBackToSelection = () => {
    setActiveSession(null)
    setPageState('selection')
  }

  // Auto-show ongoing session if it exists
  useEffect(() => {
    if (ongoingSession && pageState === 'selection' && !isLoading) {
      const presetGroup = ongoingSession.session_plan
      if (presetGroup) {
        handleSessionSelected(presetGroup, ongoingSession)
      }
    }
  }, [ongoingSession, pageState])

  // Render based on current state
  return (
    <FeatureErrorBoundary featureName="Workout" customMessage="Something went wrong with your workout. Please try again.">
      <div className="max-w-6xl mx-auto">
        {isLoading || sessionsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading workout...</p>
          </div>
        ) : pageState === 'active-session' && activeSession ? (
          <>
            {/* Back to Selection Button */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBackToSelection}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Workouts
              </Button>
            </div>

            {/* Workout Session Dashboard */}
            <WorkoutSessionDashboard 
              presetGroup={activeSession.presetGroup}
              existingSession={activeSession.session}
            />
          </>
        ) : (
          <div className="space-y-6">
            {/* Header with History Link */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">My Workouts</h1>
                <p className="text-muted-foreground">Continue your workout or start a new session</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/workout/history">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Link>
              </Button>
            </div>

            {/* Next Session Card (if no ongoing session) */}
            {nextSession && !ongoingSession && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Next Workout</h2>
                <NextSessionCard 
                  session={nextSession} 
                  onStart={(session) => {
                    const presetGroup = session.session_plan
                    if (presetGroup) {
                      handleSessionSelected(presetGroup, session)
                    }
                  }}
                />
              </div>
            )}

            {/* All Available Sessions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {ongoingSession ? "Other Sessions" : "Available Sessions"}
              </h2>
              <WorkoutSessionSelector 
                onSessionSelected={handleSessionSelected}
                hideOngoing={!!ongoingSession}
              />
            </div>
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  )
} 