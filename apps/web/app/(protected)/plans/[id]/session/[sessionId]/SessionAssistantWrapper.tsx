'use client'

/**
 * SessionAssistantWrapper
 *
 * Client-side wrapper that provides the ChangeSetProvider context
 * and integrates the AI assistant into the session planner page.
 *
 * Supports two modes:
 * - Overlay mode (default): ApprovalBanner fixed at bottom
 * - Inline mode: Proposals rendered via ConnectedInlineProposalSection
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { ChangeSetProvider } from '@/lib/changeset/ChangeSetContext'
import { SessionAssistant, ConnectedInlineProposalSection } from '@/components/features/ai-assistant'
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

  /**
   * Use inline mode for proposals.
   * When true, proposals are displayed via ConnectedInlineProposalSection
   * instead of the overlay ApprovalBanner.
   * @default true
   */
  useInlineMode?: boolean

  /** Children to render (optional - for custom layouts) */
  children?: React.ReactNode
}

export function SessionAssistantWrapper({
  sessionId,
  planId,
  exercises,
  exerciseLibrary,
  onExercisesChange,
  useInlineMode = true,
  children,
}: SessionAssistantWrapperProps) {
  return (
    <ChangeSetProvider>
      <SessionAssistant
        sessionId={sessionId}
        planId={planId}
        exercises={exercises}
        exerciseLibrary={exerciseLibrary}
        onExercisesChange={onExercisesChange}
        useInlineMode={useInlineMode}
        autoCollapseChat={useInlineMode}
      >
        {children}
      </SessionAssistant>
    </ChangeSetProvider>
  )
}

/**
 * InlineProposalSlot
 *
 * A convenience component to render the inline proposal section.
 * Must be used inside SessionAssistantWrapper.
 */
export function InlineProposalSlot({ className }: { className?: string }) {
  return <ConnectedInlineProposalSection className={className} />
}
