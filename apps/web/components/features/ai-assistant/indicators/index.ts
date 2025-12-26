/**
 * AI Change Indicator Components
 *
 * Pure presentation components for displaying AI-proposed changes.
 * These components receive state via props - no context access.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

// Value diff display
export { InlineValueDiff, InlineValueDiffCompact } from './InlineValueDiff'

// AI badge indicators
export { AIBadge, AIBadgeWithCount, AIIndicator } from './AIBadge'

// Change type badges
export {
  ChangeTypeBadge,
  deriveUIDisplayType,
  getChangeTypeColors,
} from './ChangeTypeBadge'

// Row/item highlighting
export {
  PendingRowHighlight,
  NewItemHighlight,
  RemovedItemHighlight,
  SwapItemHighlight,
} from './PendingRowHighlight'
