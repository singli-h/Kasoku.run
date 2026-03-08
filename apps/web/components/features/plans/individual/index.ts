/**
 * Individual Plan Page Components
 *
 * Streamlined, mobile-first components for individual users.
 * Single-page experience showing active training block directly.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

// Core page components
export { IndividualPlanPage } from "./IndividualPlanPage"
export { WeekSelectorSheet } from "./WeekSelectorSheet"

// AI-enabled page wrapper
export { IndividualPlanPageWithAI } from "./IndividualPlanPageWithAI"
export { PlanAssistantWrapper, InlineProposalSlot } from "./PlanAssistantWrapper"

// UI components
export { AdvancedFieldsToggle } from "./AdvancedFieldsToggle"
export { MobileSettingsSheet } from "./MobileSettingsSheet"
export { AIContextIndicator } from "./AIContextIndicator"

// Skeleton loading states
export * from "./skeletons"

// Context and utilities
export * from "./context"
