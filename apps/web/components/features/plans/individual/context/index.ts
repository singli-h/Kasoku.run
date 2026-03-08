/**
 * Plan Context Exports
 *
 * Context and utilities for the unified Individual Plan Page.
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

// Context and Provider
export {
  PlanContext,
  PlanContextProvider,
  usePlanContext,
  usePlanContextOptional,
} from './PlanContext'

export type {
  AIContextLevel,
  PlanContextValue,
  PlanContextState,
  PlanContextActions,
} from './PlanContext'

// Utility functions
export {
  // AI Context
  getAIContextLevel,
  buildAIContextInfo,
  // Week utilities
  findCurrentWeek,
  isWeekCurrent,
  isWeekPast,
  isWeekFuture,
  // Session utilities
  findTodayWorkout,
  sortByDay,
  getDayAbbrev,
  getDayName,
  // Date formatting
  formatDateShort,
  formatDateRange,
} from './utils'
