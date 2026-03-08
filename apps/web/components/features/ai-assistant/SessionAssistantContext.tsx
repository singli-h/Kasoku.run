'use client'

/**
 * SessionAssistantContext
 *
 * Provides shared state between SessionAssistant and inline proposal components.
 * This allows the InlineProposalSection to access proposal state and callbacks
 * without duplicating the AI communication logic.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { createContext, useContext } from 'react'
import type { ChangeSet, ExecutionError } from '@/lib/changeset/types'

interface SessionAssistantState {
  /** Whether there are pending proposals */
  hasPendingProposals: boolean

  /** The current changeset (if any) */
  changeset: ChangeSet | null

  /** Whether execution is in progress */
  isExecuting: boolean

  /** Execution error (if any) */
  executionError?: ExecutionError

  /** Whether the chat drawer is open */
  isChatOpen: boolean

  /** Open the chat drawer */
  openChat: () => void

  /** Close the chat drawer */
  closeChat: () => void

  /** Approve all pending changes */
  approve: () => Promise<void>

  /** Request regeneration with optional feedback */
  regenerate: (feedback?: string) => void

  /** Dismiss all pending changes */
  dismiss: () => void
}

const SessionAssistantContext = createContext<SessionAssistantState | null>(null)

export function useSessionAssistantContext(): SessionAssistantState {
  const context = useContext(SessionAssistantContext)
  if (!context) {
    throw new Error(
      'useSessionAssistantContext must be used within a SessionAssistantProvider'
    )
  }
  return context
}

/**
 * Hook that returns null if not in context (for optional usage)
 */
export function useSessionAssistantContextOptional(): SessionAssistantState | null {
  return useContext(SessionAssistantContext)
}

export { SessionAssistantContext }
export type { SessionAssistantState }
