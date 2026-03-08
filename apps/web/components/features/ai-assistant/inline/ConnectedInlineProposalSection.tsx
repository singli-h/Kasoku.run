'use client'

/**
 * ConnectedInlineProposalSection
 *
 * A wrapper that connects InlineProposalSection to SessionAssistantContext.
 * Use this component when you want the proposal section to automatically
 * get its state from the SessionAssistant context.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { useSessionAssistantContextOptional } from '../SessionAssistantContext'
import { InlineProposalSection } from './InlineProposalSection'

interface ConnectedInlineProposalSectionProps {
  /** Additional className for styling */
  className?: string
}

export function ConnectedInlineProposalSection({
  className,
}: ConnectedInlineProposalSectionProps) {
  const context = useSessionAssistantContextOptional()

  // If no context or no pending proposals, render nothing
  if (!context || !context.hasPendingProposals || !context.changeset) {
    return null
  }

  return (
    <InlineProposalSection
      changeset={context.changeset}
      onApprove={context.approve}
      onRegenerate={context.regenerate}
      onDismiss={context.dismiss}
      isExecuting={context.isExecuting}
      executionError={context.executionError}
      className={className}
    />
  )
}
