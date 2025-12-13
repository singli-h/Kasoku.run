/**
 * Workout Page Content
 * Main component that manages the workout flow between session selection and execution
 */

"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkoutSessionSelector } from "./workout-session-selector"
import { WorkoutSessionDashboard } from "./workout-session-dashboard"
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { WorkoutPageLoading } from "../error-loading"

// Import types
import type { 
  ExercisePresetGroupWithDetails,
  ExerciseTrainingSessionWithDetails 
} from "@/types/training"

type WorkoutPageState = 'selection' | 'active-session'

interface ActiveSession {
  presetGroup: ExercisePresetGroupWithDetails
  session?: ExerciseTrainingSessionWithDetails
}

export function WorkoutPageContent() {
  const [pageState, setPageState] = useState<WorkoutPageState>('selection')
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle session selection
  const handleSessionSelected = async (
    presetGroup: ExercisePresetGroupWithDetails, 
    session?: ExerciseTrainingSessionWithDetails
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

  // Render based on current state
  return (
    <FeatureErrorBoundary featureName="Workout" customMessage="Something went wrong with your workout. Please try again.">
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div>Loading workout...</div>
        ) : pageState === 'selection' ? (
          <WorkoutSessionSelector onSessionSelected={handleSessionSelected} />
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">Something went wrong. Please refresh the page.</p>
          </div>
        )}
      </div>
    </FeatureErrorBoundary>
  )
} 