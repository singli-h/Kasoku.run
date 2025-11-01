"use client"

import { useState, useCallback, useRef } from "react"
import { PlanPageHeader } from "@/components/features/plans/components/PlanPageHeader"
import { SessionPlannerClient } from "./SessionPlannerClient"
import type { SessionExercise, ExerciseLibraryItem, Session } from "@/components/features/plans/session-planner/types"

interface SessionPlannerPageClientProps {
  planId: string
  sessionId: number
  session: Session
  initialExercises: SessionExercise[]
  exerciseLibrary: ExerciseLibraryItem[]
  exerciseTypes: any[]
}

export function SessionPlannerPageClient({
  planId,
  sessionId,
  session,
  initialExercises,
  exerciseLibrary,
  exerciseTypes,
}: SessionPlannerPageClientProps) {
  // Lift pageMode state to this level for header control
  const [pageMode, setPageMode] = useState<"simple" | "detail">("simple")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // Use refs to store handlers from SessionPlannerClient
  const undoHandlerRef = useRef<(() => void) | null>(null)
  const redoHandlerRef = useRef<(() => void) | null>(null)

  // Handlers for undo/redo state updates from SessionPlannerClient
  const handleUndoRedoStateChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo)
    setCanRedo(redo)
  }, [])

  // Handlers for undo/redo actions - call the handlers from SessionPlannerClient
  const handleUndo = useCallback(() => {
    if (undoHandlerRef.current) {
      undoHandlerRef.current()
    }
  }, [])

  const handleRedo = useCallback(() => {
    if (redoHandlerRef.current) {
      redoHandlerRef.current()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col w-full">
      <PlanPageHeader
        title={session.name || "Session Planner"}
        subtitle={`Plan: ${planId} • Session: ${sessionId}`}
        showUndoRedo={true}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        backPath={`/plans/${planId}`}
        pageMode={pageMode}
        onPageModeChange={setPageMode}
      />

      <div className="flex-1 w-full">
        <SessionPlannerClient
          planId={planId}
          sessionId={sessionId}
          initialSession={session}
          initialExercises={initialExercises}
          exerciseLibrary={exerciseLibrary}
          exerciseTypes={exerciseTypes}
          pageMode={pageMode}
          onPageModeChange={setPageMode}
          onUndoRedoStateChange={handleUndoRedoStateChange}
          undoHandlerRef={undoHandlerRef}
          redoHandlerRef={redoHandlerRef}
        />
      </div>
    </div>
  )
}

