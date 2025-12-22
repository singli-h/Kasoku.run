'use client'

/**
 * SessionAssistantWrapper
 *
 * Client-side wrapper that provides the ChangeSetProvider context
 * and integrates the AI assistant into the session planner page.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { ChangeSetProvider } from '@/lib/changeset/ChangeSetContext'
import { SessionAssistant } from '@/components/features/ai-assistant'
import type {
  SessionExercise,
  ExerciseLibraryItem,
} from '@/components/features/plans/session-planner/types'

interface SessionAssistantWrapperProps {
  /** The session ID */
  sessionId: number

  /** The plan ID */
  planId: string

  /** Current exercises in the session */
  exercises: SessionExercise[]

  /** Available exercises from the library */
  exerciseLibrary: ExerciseLibraryItem[]

  /** Callback when exercises are modified by AI */
  onExercisesChange?: (exercises: SessionExercise[]) => void
}

export function SessionAssistantWrapper({
  sessionId,
  planId,
  exercises,
  exerciseLibrary,
  onExercisesChange,
}: SessionAssistantWrapperProps) {
  return (
    <ChangeSetProvider>
      <SessionAssistant
        sessionId={sessionId}
        planId={planId}
        exercises={exercises}
        exerciseLibrary={exerciseLibrary}
        onExercisesChange={onExercisesChange}
      />
    </ChangeSetProvider>
  )
}
