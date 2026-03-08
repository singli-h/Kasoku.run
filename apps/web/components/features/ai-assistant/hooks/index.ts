/**
 * AI Assistant Hooks
 *
 * Hooks that bridge ChangeSet context with UI components.
 * These provide easy access to AI change state for rendering.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

// Entity-level change detection
export {
  useAIChangeForEntity,
  useHasPendingChangeForEntity,
} from './useAIChangeForEntity'

// Set-level change detection (for exercise cards)
export { useAISetChanges, useAIExerciseChange } from './useAISetChanges'

// Batch change detection (for WorkoutView)
export {
  useAIExerciseChanges,
  UNGROUPED_SET_CHANGES_KEY,
  type AIExerciseChangeInfo,
  type AISetChangeInfo,
} from './useAIExerciseChanges'

// Responsive layout detection
export {
  useAILayoutMode,
  useIsMobile,
  useIsTabletOrLarger,
  useIsDesktop,
  useDrawerHeight,
  type AILayoutMode,
} from './useAILayoutMode'
