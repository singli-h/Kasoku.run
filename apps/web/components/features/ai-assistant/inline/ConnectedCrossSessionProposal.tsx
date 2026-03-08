'use client'

/**
 * ConnectedCrossSessionProposal
 *
 * A smart wrapper that connects proposal components to SessionAssistantContext
 * and PlanContext. Automatically chooses the right UI based on the type of changes:
 * - Single session: InlineProposalSection (standard blue)
 * - Cross-session (different session): CrossSessionProposal (amber)
 * - Multi-session (week-wide): GroupedProposalSection (purple)
 * - Deload/volume changes: TextDiffSummary (teal)
 * - Block-wide (multi-week): BlockSummarySection (indigo)
 *
 * @see docs/features/plans/individual/tasks.md T030, T035, T039
 */

import { useMemo, useState, useEffect } from 'react'
import { useSessionAssistantContextOptional } from '../SessionAssistantContext'
import { usePlanContextOptional } from '@/components/features/plans/individual/context'
import { InlineProposalSection } from './InlineProposalSection'
import { CrossSessionProposal, hasCrossSessionChanges, type TargetSessionInfo } from './CrossSessionProposal'
import { GroupedProposalSection, hasMultiSessionChanges, type SessionInfo } from './GroupedProposalSection'
import { TextDiffSummary, isDeloadChangeSet } from './TextDiffSummary'
import { BlockSummarySection, isBlockWideChangeSet, hasBlockWideIndicators, type WeekInfo } from './BlockSummarySection'
import { getDayAbbrev } from '@/components/features/plans/individual/context/utils'

interface ConnectedCrossSessionProposalProps {
  /** Additional className for styling */
  className?: string

  /** Callback when block-wide proposal is detected (for auto-expand) */
  onBlockWideDetected?: (isBlockWide: boolean) => void
}


export function ConnectedCrossSessionProposal({
  className,
  onBlockWideDetected,
}: ConnectedCrossSessionProposalProps) {
  const sessionContext = useSessionAssistantContextOptional()
  const planContext = usePlanContextOptional()

  // Build session lookup map from plan context (current week)
  const sessionLookup = useMemo(() => {
    const lookup = new Map<string, TargetSessionInfo & SessionInfo>()

    if (!planContext?.selectedWeek?.session_plans) {
      return lookup
    }

    for (const session of planContext.selectedWeek.session_plans) {
      const dayName = session.day !== null ? getDayAbbrev(session.day) : ''
      lookup.set(session.id, {
        id: session.id,
        name: session.name ?? 'Unnamed Session',
        dayName: dayName || undefined,
      })
    }

    return lookup
  }, [planContext?.selectedWeek?.session_plans])

  // Build session-to-week mapping for block-wide detection
  const { weeks, sessionToWeekMap } = useMemo(() => {
    const weeksArray: WeekInfo[] = []
    const mapping = new Map<string, number>()

    if (!planContext?.trainingBlock?.microcycles) {
      return { weeks: weeksArray, sessionToWeekMap: mapping }
    }

    for (const week of planContext.trainingBlock.microcycles) {
      const sessions = (week.session_plans || []).map(s => ({
        id: s.id,
        name: s.name,
        day: s.day,
      }))

      weeksArray.push({
        id: week.id,
        name: week.name,
        sessions,
      })

      for (const session of sessions) {
        mapping.set(session.id, week.id)
      }
    }

    return { weeks: weeksArray, sessionToWeekMap: mapping }
  }, [planContext?.trainingBlock?.microcycles])

  // Determine which UI to show
  const proposalType = useMemo(() => {
    if (!sessionContext?.changeset || !planContext?.selectedSessionId) {
      return 'standard'
    }

    // Check for block-wide changes first (highest priority - affects multiple weeks)
    if (
      isBlockWideChangeSet(sessionContext.changeset, sessionToWeekMap) ||
      hasBlockWideIndicators(sessionContext.changeset)
    ) {
      return 'block-wide'
    }

    // Check for deload/volume changes (priority over multi-session)
    if (isDeloadChangeSet(sessionContext.changeset)) {
      return 'deload'
    }

    // Check for multi-session (week-wide) changes
    if (hasMultiSessionChanges(sessionContext.changeset, planContext.selectedSessionId)) {
      return 'multi-session'
    }

    // Check for cross-session (single other session) changes
    if (hasCrossSessionChanges(sessionContext.changeset, planContext.selectedSessionId)) {
      return 'cross-session'
    }

    return 'standard'
  }, [sessionContext?.changeset, planContext?.selectedSessionId, sessionToWeekMap])

  // Notify parent when block-wide proposal is detected (for auto-expand)
  useEffect(() => {
    if (onBlockWideDetected) {
      onBlockWideDetected(proposalType === 'block-wide')
    }
  }, [proposalType, onBlockWideDetected])

  // If no context or no pending proposals, render nothing
  if (!sessionContext || !sessionContext.hasPendingProposals || !sessionContext.changeset) {
    return null
  }

  // Handle jump to session
  const handleJumpToSession = (sessionId: string) => {
    if (planContext?.selectSession) {
      planContext.selectSession(sessionId)
    }
  }

  // Block-wide (multi-week) changes - use BlockSummarySection
  if (proposalType === 'block-wide') {
    return (
      <BlockSummarySection
        changeset={sessionContext.changeset}
        weeks={weeks}
        sessionToWeekMap={sessionToWeekMap}
        onApprove={sessionContext.approve}
        onModify={(feedback) => sessionContext.regenerate(feedback)}
        onDismiss={sessionContext.dismiss}
        isExecuting={sessionContext.isExecuting}
        executionError={sessionContext.executionError}
        className={className}
      />
    )
  }

  // Deload/volume changes - use TextDiffSummary
  if (proposalType === 'deload') {
    return (
      <TextDiffSummary
        changeset={sessionContext.changeset}
        sessionLookup={sessionLookup}
        onApprove={sessionContext.approve}
        onRegenerate={sessionContext.regenerate}
        onDismiss={sessionContext.dismiss}
        isExecuting={sessionContext.isExecuting}
        executionError={sessionContext.executionError}
        className={className}
      />
    )
  }

  // Multi-session (week-wide) changes - use GroupedProposalSection
  if (proposalType === 'multi-session') {
    return (
      <GroupedProposalSection
        changeset={sessionContext.changeset}
        currentSessionId={planContext?.selectedSessionId ?? null}
        sessionLookup={sessionLookup}
        onApprove={sessionContext.approve}
        onRegenerate={sessionContext.regenerate}
        onDismiss={sessionContext.dismiss}
        isExecuting={sessionContext.isExecuting}
        executionError={sessionContext.executionError}
        className={className}
      />
    )
  }

  // Cross-session (single other session) changes - use CrossSessionProposal
  if (proposalType === 'cross-session') {
    return (
      <CrossSessionProposal
        changeset={sessionContext.changeset}
        currentSessionId={planContext?.selectedSessionId ?? null}
        sessionLookup={sessionLookup}
        onApprove={sessionContext.approve}
        onRegenerate={sessionContext.regenerate}
        onDismiss={sessionContext.dismiss}
        onJumpToSession={handleJumpToSession}
        isExecuting={sessionContext.isExecuting}
        executionError={sessionContext.executionError}
        className={className}
      />
    )
  }

  // Standard single-session changes - use InlineProposalSection
  return (
    <InlineProposalSection
      changeset={sessionContext.changeset}
      onApprove={sessionContext.approve}
      onRegenerate={sessionContext.regenerate}
      onDismiss={sessionContext.dismiss}
      isExecuting={sessionContext.isExecuting}
      executionError={sessionContext.executionError}
      className={className}
    />
  )
}
