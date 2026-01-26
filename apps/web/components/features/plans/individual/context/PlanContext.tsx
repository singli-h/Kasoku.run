'use client'

/**
 * PlanContext
 *
 * Provides plan-level state management for the unified Individual Plan Page.
 * Tracks selection state (week, session, exercise) and computes AI context level.
 *
 * Architecture:
 * ```
 * PlanContextProvider
 *   ├── selectedWeekId, selectedSessionId, selectedExerciseId
 *   ├── aiContextLevel (computed: 'block' | 'week' | 'session' | 'exercise')
 *   └── trainingBlock data
 * ```
 *
 * Performance optimizations (T073):
 * - All derived values use useMemo with minimal dependencies
 * - Actions use useCallback to prevent unnecessary re-renders
 * - Week/session lookups are memoized to avoid O(n) searches on every render
 * - Context value is memoized to prevent provider re-renders
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { MesocycleWithDetails, MicrocycleWithDetails, SessionPlanWithDetails } from '@/types/training'
import { findCurrentWeek } from './utils'

// ============================================================================
// Types
// ============================================================================

/**
 * AI context level based on user's current selection.
 * - 'block': No specific selection, AI operates at full training block level
 * - 'week': Week selected, AI operates at week level
 * - 'session': Session selected, AI operates at session level
 * - 'exercise': Exercise expanded, AI operates at exercise level
 */
export type AIContextLevel = 'block' | 'week' | 'session' | 'exercise'

interface PlanContextState {
  /** Currently selected week ID */
  selectedWeekId: number | null

  /** Currently selected session ID */
  selectedSessionId: string | null

  /** Currently expanded exercise ID (for exercise-level AI context) */
  selectedExerciseId: string | null

  /** Computed AI context level based on selection */
  aiContextLevel: AIContextLevel

  /** The full training block data */
  trainingBlock: MesocycleWithDetails

  /** Currently selected week (derived from selectedWeekId) */
  selectedWeek: MicrocycleWithDetails | null

  /** Currently selected session (derived from selectedSessionId) */
  selectedSession: SessionPlanWithDetails | null
}

interface PlanContextActions {
  /** Select a week by ID */
  selectWeek: (weekId: number) => void

  /** Select a session by ID */
  selectSession: (sessionId: string | null) => void

  /** Select an exercise by ID (for expanded state) */
  selectExercise: (exerciseId: string | null) => void

  /** Clear all selections (return to block level) */
  clearSelection: () => void
}

type PlanContextValue = PlanContextState & PlanContextActions

// ============================================================================
// Context
// ============================================================================

const PlanContext = createContext<PlanContextValue | null>(null)

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the plan context.
 * Must be used within PlanContextProvider.
 */
export function usePlanContext(): PlanContextValue {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanContextProvider')
  }
  return context
}

/**
 * Optionally access the plan context.
 * Returns null if outside provider (safe for optional integrations).
 */
export function usePlanContextOptional(): PlanContextValue | null {
  return useContext(PlanContext)
}

// ============================================================================
// Provider
// ============================================================================

interface PlanContextProviderProps {
  /** The training block data */
  trainingBlock: MesocycleWithDetails

  /** Initial selected week ID (defaults to current week or first week) */
  initialWeekId?: number | null

  /** Initial selected session ID */
  initialSessionId?: string | null

  children: ReactNode
}

export function PlanContextProvider({
  trainingBlock,
  initialWeekId,
  initialSessionId,
  children,
}: PlanContextProviderProps) {
  // Determine initial week (only computed once)
  const defaultWeekId = initialWeekId ?? findCurrentWeek(trainingBlock.microcycles)?.id ?? trainingBlock.microcycles?.[0]?.id ?? null

  // Selection state
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(defaultWeekId)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId ?? null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

  // T073: Memoized week lookup map for O(1) access instead of O(n) find
  const weekMap = useMemo(() => {
    const map = new Map<number, MicrocycleWithDetails>()
    trainingBlock.microcycles?.forEach(week => {
      map.set(week.id, week)
    })
    return map
  }, [trainingBlock.microcycles])

  // Derived: selected week (O(1) lookup using map)
  const selectedWeek = useMemo(() =>
    selectedWeekId !== null ? weekMap.get(selectedWeekId) ?? null : null,
    [weekMap, selectedWeekId]
  )

  // T073: Memoized session lookup map for the selected week
  const sessionMap = useMemo(() => {
    const map = new Map<string, SessionPlanWithDetails>()
    selectedWeek?.session_plans?.forEach(session => {
      map.set(session.id, session)
    })
    return map
  }, [selectedWeek?.session_plans])

  // Derived: selected session (O(1) lookup using map)
  const selectedSession = useMemo(() =>
    selectedSessionId !== null ? sessionMap.get(selectedSessionId) ?? null : null,
    [sessionMap, selectedSessionId]
  )

  // Derived: AI context level (simple conditional, but memoized for stability)
  const aiContextLevel = useMemo((): AIContextLevel => {
    if (selectedExerciseId) return 'exercise'
    if (selectedSessionId) return 'session'
    if (selectedWeekId) return 'week'
    return 'block'
  }, [selectedWeekId, selectedSessionId, selectedExerciseId])

  // Actions
  const selectWeek = useCallback((weekId: number) => {
    setSelectedWeekId(weekId)
    // Clear session and exercise selection when changing weeks
    setSelectedSessionId(null)
    setSelectedExerciseId(null)
  }, [])

  const selectSession = useCallback((sessionId: string | null) => {
    setSelectedSessionId(sessionId)
    // Clear exercise selection when changing sessions
    setSelectedExerciseId(null)
  }, [])

  const selectExercise = useCallback((exerciseId: string | null) => {
    setSelectedExerciseId(exerciseId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedWeekId(null)
    setSelectedSessionId(null)
    setSelectedExerciseId(null)
  }, [])

  // Memoized context value
  const value = useMemo<PlanContextValue>(() => ({
    // State
    selectedWeekId,
    selectedSessionId,
    selectedExerciseId,
    aiContextLevel,
    trainingBlock,
    selectedWeek,
    selectedSession,
    // Actions
    selectWeek,
    selectSession,
    selectExercise,
    clearSelection,
  }), [
    selectedWeekId,
    selectedSessionId,
    selectedExerciseId,
    aiContextLevel,
    trainingBlock,
    selectedWeek,
    selectedSession,
    selectWeek,
    selectSession,
    selectExercise,
    clearSelection,
  ])

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  )
}

export { PlanContext }
export type { PlanContextValue, PlanContextState, PlanContextActions }
