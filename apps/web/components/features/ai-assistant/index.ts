/**
 * AI Assistant Components Export
 *
 * Central export point for AI assistant components.
 * Organized by:
 * - indicators/ - Pure presentation components for change display
 * - hooks/ - Hooks that bridge ChangeSet context with components
 * - wrappers/ - Components that enhance existing UI with AI features
 * - inline/ - Components for inline (non-overlay) proposal display
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

// =============================================================================
// Indicator Components (Pure Presentation)
// =============================================================================
export * from './indicators'

// =============================================================================
// AI Hooks (Context Bridge)
// =============================================================================
export * from './hooks'

// =============================================================================
// Wrapper Components (Enhancement Layer)
// =============================================================================
export * from './wrappers'

// =============================================================================
// Inline Proposal Components
// =============================================================================
export * from './inline'

// =============================================================================
// Core Components
// =============================================================================
export { SessionAssistant } from './SessionAssistant'
export { ApprovalBanner } from './ApprovalBanner'
export { ChatDrawer, ChatTrigger } from './ChatDrawer'

// =============================================================================
// Context
// =============================================================================
export {
  SessionAssistantContext,
  useSessionAssistantContext,
  useSessionAssistantContextOptional,
} from './SessionAssistantContext'
export type { SessionAssistantState } from './SessionAssistantContext'
