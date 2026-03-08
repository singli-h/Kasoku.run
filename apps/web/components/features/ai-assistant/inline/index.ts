/**
 * Inline Proposal Components
 *
 * Components for displaying AI proposals inline on the page
 * (as opposed to overlay/fixed positioning).
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

// Main components
export { InlineProposalSection } from './InlineProposalSection'
export { ConnectedInlineProposalSection } from './ConnectedInlineProposalSection'
export { CrossSessionProposal, hasCrossSessionChanges, type TargetSessionInfo } from './CrossSessionProposal'
export { ConnectedCrossSessionProposal } from './ConnectedCrossSessionProposal'
export { GroupedProposalSection, hasMultiSessionChanges, type SessionInfo, type SessionGroup } from './GroupedProposalSection'
export { TextDiffSummary, isDeloadChangeSet, type SessionSummary } from './TextDiffSummary'
export { BlockSummarySection, isBlockWideChangeSet, hasBlockWideIndicators, type WeekInfo, type WeekChangeSummary } from './BlockSummarySection'
export { DiffSummaryCard } from './DiffSummaryCard'

// Sub-components (for custom compositions)
export { ProposalHeader } from './ProposalHeader'
export { ProposalActionBar } from './ProposalActionBar'
export { ProposalFeedbackInput } from './ProposalFeedbackInput'
export { ProposalStatusBanner } from './ProposalStatusBanner'

// Utilities (T056, T062)
export {
  getDiffDisplayMode,
  analyzeChangeDensity,
  generateSetChangeSummary,
  shouldShowSummaryCard,
  getExerciseChanges,
  type DiffDisplayMode,
  type DensityThreshold,
  type ChangeDensityAnalysis,
  type SetChangeSummary,
} from './utils'
