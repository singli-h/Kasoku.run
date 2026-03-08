'use client'

/**
 * SessionExercisesContext
 *
 * Provides shared exercises state between SessionPlannerV2 and SessionAssistant.
 * This is the single source of truth for exercises in a session editing context.
 *
 * Architecture:
 * ```
 * SessionExercisesProvider  ← Single source of truth
 *   └── ChangeSetProvider
 *         ├── SessionAssistant  ← calls setExercises after AI approve
 *         └── SessionPlannerV2  ← reads/writes exercises via context
 * ```
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { SessionPlannerExercise } from '../adapters/session-adapter'

// ============================================================================
// Types
// ============================================================================

interface SessionExercisesState {
  /** Current exercises in the session */
  exercises: SessionPlannerExercise[]

  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean

  /** Undo/redo history */
  history: SessionPlannerExercise[][]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
}

interface SessionExercisesActions {
  /** Replace all exercises */
  setExercises: (
    exercises: SessionPlannerExercise[] | ((prev: SessionPlannerExercise[]) => SessionPlannerExercise[])
  ) => void

  /** Update a single exercise by ID */
  updateExercise: (id: string | number, updates: Partial<SessionPlannerExercise>) => void

  /** Add a new exercise */
  addExercise: (exercise: SessionPlannerExercise, index?: number) => void

  /** Remove an exercise by ID */
  removeExercise: (id: string | number) => void

  /** Reorder exercises */
  reorderExercises: (fromIndex: number, toIndex: number) => void

  /** Mark changes as saved (resets hasUnsavedChanges) */
  markAsSaved: () => void

  /** Mark as having unsaved changes */
  markAsUnsaved: () => void

  /** Undo last change */
  undo: () => void

  /** Redo last undone change */
  redo: () => void

  /** Reset to initial exercises (clears history) */
  reset: (exercises: SessionPlannerExercise[]) => void
}

type SessionExercisesContextValue = SessionExercisesState & SessionExercisesActions

// ============================================================================
// Context
// ============================================================================

const SessionExercisesContext = createContext<SessionExercisesContextValue | null>(null)

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the session exercises context.
 * Must be used within SessionExercisesProvider.
 */
export function useSessionExercises(): SessionExercisesContextValue {
  const context = useContext(SessionExercisesContext)
  if (!context) {
    throw new Error(
      'useSessionExercises must be used within a SessionExercisesProvider'
    )
  }
  return context
}

/**
 * Optionally access the session exercises context.
 * Returns null if outside provider (safe for optional integrations).
 */
export function useSessionExercisesOptional(): SessionExercisesContextValue | null {
  return useContext(SessionExercisesContext)
}

// ============================================================================
// Provider
// ============================================================================

interface SessionExercisesProviderProps {
  /** Initial exercises to populate the context */
  initialExercises: SessionPlannerExercise[]
  children: ReactNode
}

const MAX_HISTORY_SIZE = 50

export function SessionExercisesProvider({
  initialExercises,
  children,
}: SessionExercisesProviderProps) {
  // Core state
  const [exercises, setExercisesInternal] = useState<SessionPlannerExercise[]>(initialExercises)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Undo/redo history
  const [history, setHistory] = useState<SessionPlannerExercise[][]>([initialExercises])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Derived state
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Helper to save to history
  const saveToHistory = useCallback((newExercises: SessionPlannerExercise[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newExercises)))
      return newHistory.slice(-MAX_HISTORY_SIZE)
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1))
  }, [historyIndex])

  // Actions
  const setExercises = useCallback((
    exercisesOrUpdater: SessionPlannerExercise[] | ((prev: SessionPlannerExercise[]) => SessionPlannerExercise[])
  ) => {
    setExercisesInternal(prev => {
      const newExercises = typeof exercisesOrUpdater === 'function'
        ? exercisesOrUpdater(prev)
        : exercisesOrUpdater
      saveToHistory(newExercises)
      setHasUnsavedChanges(true)
      return newExercises
    })
  }, [saveToHistory])

  const updateExercise = useCallback((id: string | number, updates: Partial<SessionPlannerExercise>) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, ...updates } : ex))
    )
  }, [setExercises])

  const addExercise = useCallback((exercise: SessionPlannerExercise, index?: number) => {
    setExercises(prev => {
      if (index !== undefined && index >= 0 && index <= prev.length) {
        const newExercises = [...prev]
        newExercises.splice(index, 0, exercise)
        return newExercises
      }
      return [...prev, exercise]
    })
  }, [setExercises])

  const removeExercise = useCallback((id: string | number) => {
    setExercises(prev => prev.filter(ex => ex.id !== id))
  }, [setExercises])

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev]
      const [removed] = newExercises.splice(fromIndex, 1)
      newExercises.splice(toIndex, 0, removed)
      return newExercises
    })
  }, [setExercises])

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setExercisesInternal(JSON.parse(JSON.stringify(history[newIndex])))
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setExercisesInternal(JSON.parse(JSON.stringify(history[newIndex])))
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  const reset = useCallback((newExercises: SessionPlannerExercise[]) => {
    setExercisesInternal(newExercises)
    setHistory([newExercises])
    setHistoryIndex(0)
    setHasUnsavedChanges(false)
  }, [])

  // Memoized context value
  const value = useMemo<SessionExercisesContextValue>(() => ({
    // State
    exercises,
    hasUnsavedChanges,
    history,
    historyIndex,
    canUndo,
    canRedo,
    // Actions
    setExercises,
    updateExercise,
    addExercise,
    removeExercise,
    reorderExercises,
    markAsSaved,
    markAsUnsaved,
    undo,
    redo,
    reset,
  }), [
    exercises,
    hasUnsavedChanges,
    history,
    historyIndex,
    canUndo,
    canRedo,
    setExercises,
    updateExercise,
    addExercise,
    removeExercise,
    reorderExercises,
    markAsSaved,
    markAsUnsaved,
    undo,
    redo,
    reset,
  ])

  return (
    <SessionExercisesContext.Provider value={value}>
      {children}
    </SessionExercisesContext.Provider>
  )
}

export { SessionExercisesContext }
export type { SessionExercisesContextValue, SessionExercisesState, SessionExercisesActions }
