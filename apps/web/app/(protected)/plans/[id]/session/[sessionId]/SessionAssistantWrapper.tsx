'use client'

/**
 * SessionAssistantWrapper
 *
 * Client-side wrapper that provides shared context for the session page:
 * - SessionExercisesProvider: Single source of truth for exercises state
 * - SessionAssistant: AI integration with ChangeSetProvider
 *
 * Architecture:
 * ```
 * SessionExercisesProvider  ← Shared exercises state
 *   └── SessionAssistant (includes ChangeSetProvider)
 *         └── SessionPlannerV2 (uses context)
 * ```
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { SessionExercisesProvider } from '@/components/features/training/context'
import { SessionAssistant, ConnectedInlineProposalSection } from '@/components/features/ai-assistant'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'

interface SessionAssistantWrapperProps {
  /** The session ID */
  sessionId: string

  /** The plan ID */
  planId: string

  /** Initial exercises to populate the context */
  initialExercises: SessionPlannerExercise[]

  /** Database user ID for exercise search visibility filtering */
  dbUserId?: string

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
  initialExercises,
  dbUserId,
  useInlineMode = true,
  children,
}: SessionAssistantWrapperProps) {
  return (
    <SessionExercisesProvider initialExercises={initialExercises}>
      <SessionAssistant
        sessionId={sessionId}
        planId={planId}
        dbUserId={dbUserId}
        useInlineMode={useInlineMode}
        autoCollapseChat={useInlineMode}
      >
        {children}
      </SessionAssistant>
    </SessionExercisesProvider>
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
