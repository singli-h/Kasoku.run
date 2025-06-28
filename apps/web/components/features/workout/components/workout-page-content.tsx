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

  // Handle session selection
  const handleSessionSelected = (
    presetGroup: ExercisePresetGroupWithDetails, 
    session?: ExerciseTrainingSessionWithDetails
  ) => {
    setActiveSession({ presetGroup, session })
    setPageState('active-session')
  }

  // Handle back to selection
  const handleBackToSelection = () => {
    setActiveSession(null)
    setPageState('selection')
  }

  // Render based on current state
  if (pageState === 'selection') {
    return (
      <div className="max-w-6xl mx-auto">
        <WorkoutSessionSelector onSessionSelected={handleSessionSelected} />
      </div>
    )
  }

  if (pageState === 'active-session' && activeSession) {
    return (
      <div className="max-w-6xl mx-auto">
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
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Something went wrong. Please refresh the page.</p>
    </div>
  )
} 