/**
 * AI Enhancement Wrapper Components
 *
 * These components wrap existing UI components to add AI change indicators.
 * Uses composition pattern - existing components remain unchanged.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

// Set row wrapper
export { AIEnhancedSetRow, AIHighlightedRow } from './AIEnhancedSetRow'

// Exercise card wrapper
export {
  AIEnhancedExerciseCard,
  AIExerciseHeader,
} from './AIEnhancedExerciseCard'
