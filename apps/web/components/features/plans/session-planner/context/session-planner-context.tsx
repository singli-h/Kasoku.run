/**
 * Session Planner Context Provider
 * Manages state for coach session planning with support for:
 * - Exercise and set management
 * - Undo/redo history
 * - Auto-save with debounce
 * - AI changeset integration (pending changes approval)
 * - React Query cache integration
 *
 * ID Format Convention:
 * - Existing database records: Numeric ID as string (e.g., "123")
 * - New client-side items: "new_" prefix (e.g., "new_1735123456789")
 */

"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  useMemo,
} from "react"
import type { SessionExercise, Session, SetParameter } from "../types"
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

// Save status for UI indicators
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// AI Changeset types for pending modifications
export interface ChangesetItem {
  id: string
  type: 'add_exercise' | 'remove_exercise' | 'update_exercise' | 'add_set' | 'remove_set' | 'update_set'
  description: string
  targetId?: string | number
  data?: Partial<SessionExercise> | Partial<SetParameter>
}

export interface AIChangeset {
  id: string
  timestamp: number
  description: string
  items: ChangesetItem[]
  status: 'pending' | 'approved' | 'rejected'
}

// Context value interface
interface SessionPlannerContextValue {
  // Session data
  session: Session | null
  exercises: SessionExercise[]

  // State indicators
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
  isLoading: boolean

  // Undo/redo
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Exercise operations
  addExercise: (exercise: SessionExercise) => void
  updateExercise: (exerciseId: string | number, updates: Partial<SessionExercise>) => void
  removeExercise: (exerciseId: string | number) => void
  reorderExercises: (fromIndex: number, toIndex: number) => void

  // Set operations
  addSet: (exerciseId: string | number) => void
  updateSet: (exerciseId: string | number, setId: number | string, updates: Partial<SetParameter>) => void
  removeSet: (exerciseId: string | number, setId: number | string) => void
  reorderSets: (exerciseId: string | number, fromIndex: number, toIndex: number) => void

  // UI state
  toggleExerciseExpand: (exerciseId: string | number) => void

  // Save operations
  save: () => Promise<boolean>
  forceSave: () => Promise<boolean>

  // AI Changeset operations
  pendingChangesets: AIChangeset[]
  addChangeset: (changeset: AIChangeset) => void
  approveChangeset: (changesetId: string) => void
  rejectChangeset: (changesetId: string) => void
  clearApprovedChangesets: () => void

  // Initialization
  setSession: (session: Session) => void
  setExercises: (exercises: SessionExercise[]) => void
  resetToInitial: () => void
}

// Create context
const SessionPlannerContext = createContext<SessionPlannerContextValue | null>(null)

/**
 * Hook to access session planner context
 * @throws Error if used outside of SessionPlannerProvider
 */
export function useSessionPlannerContext(): SessionPlannerContextValue {
  const context = useContext(SessionPlannerContext)
  if (!context) {
    throw new Error("useSessionPlannerContext must be used within a SessionPlannerProvider")
  }
  return context
}

/**
 * Provider props
 */
interface SessionPlannerProviderProps {
  children: ReactNode
  sessionId: number
  initialSession?: Session
  initialExercises?: SessionExercise[]
  /** Auto-save delay in ms (default: 2000) */
  autoSaveDelay?: number
  /** Enable auto-save (default: true) */
  enableAutoSave?: boolean
}

/**
 * Session Planner Provider Component
 */
export function SessionPlannerProvider({
  children,
  sessionId,
  initialSession,
  initialExercises = [],
  autoSaveDelay = 2000,
  enableAutoSave = true,
}: SessionPlannerProviderProps) {
  // Core state
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [exercises, setExercises] = useState<SessionExercise[]>(initialExercises)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // History for undo/redo
  const [history, setHistory] = useState<SessionExercise[][]>([initialExercises])
  const [historyIndex, setHistoryIndex] = useState(0)

  // AI Changesets
  const [pendingChangesets, setPendingChangesets] = useState<AIChangeset[]>([])

  // Refs for auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialExercisesRef = useRef<SessionExercise[]>(initialExercises)

  /**
   * Save to history for undo/redo support
   */
  const saveToHistory = useCallback((newExercises: SessionExercise[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newExercises)))
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
    setHasUnsavedChanges(true)
  }, [historyIndex])

  /**
   * Schedule auto-save with debounce
   */
  const scheduleAutoSave = useCallback(() => {
    if (!enableAutoSave) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!session) return

      setSaveStatus('saving')

      try {
        const result = await saveSessionWithExercisesAction(
          sessionId,
          {
            name: session.name,
            description: session.description,
            date: session.date,
            week: session.week,
            day: session.day,
            session_mode: session.session_mode,
          },
          exercises as any
        )

        if (result.isSuccess) {
          setSaveStatus('saved')
          setHasUnsavedChanges(false)
          setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          console.error('[SessionPlannerContext] Auto-save failed:', result.message)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      } catch (error) {
        console.error('[SessionPlannerContext] Auto-save error:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }, autoSaveDelay)
  }, [enableAutoSave, session, sessionId, exercises, autoSaveDelay])

  // Undo/Redo
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setExercises(history[newIndex])
      setHasUnsavedChanges(true)
      scheduleAutoSave()
    }
  }, [canUndo, historyIndex, history, scheduleAutoSave])

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setExercises(history[newIndex])
      setHasUnsavedChanges(true)
      scheduleAutoSave()
    }
  }, [canRedo, historyIndex, history, scheduleAutoSave])

  // Exercise operations
  const addExercise = useCallback((exercise: SessionExercise) => {
    // Calculate the correct exercise_order based on existing exercises
    const maxOrder = exercises.length > 0
      ? Math.max(...exercises.map(e => e.exercise_order))
      : 0

    const exerciseWithOrder: SessionExercise = {
      ...exercise,
      // Use provided order if valid, otherwise calculate next order
      exercise_order: exercise.exercise_order > 0 ? exercise.exercise_order : maxOrder + 1,
    }

    const newExercises = [...exercises, exerciseWithOrder]
    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const updateExercise = useCallback((
    exerciseId: string | number,
    updates: Partial<SessionExercise>
  ) => {
    const newExercises = exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    )
    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const removeExercise = useCallback((exerciseId: string | number) => {
    const newExercises = exercises
      .filter(ex => ex.id !== exerciseId)
      .map((ex, idx) => ({ ...ex, exercise_order: idx + 1 }))
    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    const newExercises = [...exercises]
    const [moved] = newExercises.splice(fromIndex, 1)
    newExercises.splice(toIndex, 0, moved)
    const reordered = newExercises.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1,
    }))
    setExercises(reordered)
    saveToHistory(reordered)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  // Set operations
  const addSet = useCallback((exerciseId: string | number) => {
    const newExercises = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex

      const lastSet = ex.sets[ex.sets.length - 1]
      const newSetIndex = ex.sets.length + 1
      const timestamp = Date.now()

      const newSet: SetParameter = {
        id: undefined, // Will be assigned by DB
        session_plan_exercise_id: typeof ex.id === 'number' ? ex.id : undefined,
        set_index: newSetIndex,
        reps: lastSet?.reps ?? null,
        weight: lastSet?.weight ?? null,
        distance: lastSet?.distance ?? null,
        performing_time: lastSet?.performing_time ?? null,
        rest_time: lastSet?.rest_time ?? null,
        tempo: lastSet?.tempo ?? null,
        rpe: lastSet?.rpe ?? null,
        resistance_unit_id: lastSet?.resistance_unit_id ?? null,
        power: lastSet?.power ?? null,
        velocity: lastSet?.velocity ?? null,
        effort: lastSet?.effort ?? null,
        height: lastSet?.height ?? null,
        resistance: lastSet?.resistance ?? null,
        completed: false,
        isEditing: false,
      }

      return { ...ex, sets: [...ex.sets, newSet] }
    })

    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const updateSet = useCallback((
    exerciseId: string | number,
    setId: number | string,
    updates: Partial<SetParameter>
  ) => {
    const newExercises = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex

      const newSets = ex.sets.map(set =>
        set.id === setId ? { ...set, ...updates } : set
      )

      return { ...ex, sets: newSets }
    })

    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const removeSet = useCallback((
    exerciseId: string | number,
    setId: number | string
  ) => {
    const newExercises = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex

      const newSets = ex.sets
        .filter(s => s.id !== setId)
        .map((s, i) => ({ ...s, set_index: i + 1 }))

      return { ...ex, sets: newSets }
    })

    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  const reorderSets = useCallback((
    exerciseId: string | number,
    fromIndex: number,
    toIndex: number
  ) => {
    const newExercises = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex

      const newSets = [...ex.sets]
      const [moved] = newSets.splice(fromIndex, 1)
      newSets.splice(toIndex, 0, moved)

      return {
        ...ex,
        sets: newSets.map((s, i) => ({ ...s, set_index: i + 1 })),
      }
    })

    setExercises(newExercises)
    saveToHistory(newExercises)
    scheduleAutoSave()
  }, [exercises, saveToHistory, scheduleAutoSave])

  // UI state
  const toggleExerciseExpand = useCallback((exerciseId: string | number) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, isCollapsed: !ex.isCollapsed } : ex
    ))
    // Don't save to history or trigger auto-save for UI-only changes
  }, [])

  // Save operations
  const save = useCallback(async (): Promise<boolean> => {
    if (!session) return false

    // Cancel pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }

    setSaveStatus('saving')

    try {
      const result = await saveSessionWithExercisesAction(
        sessionId,
        {
          name: session.name,
          description: session.description,
          date: session.date,
          week: session.week,
          day: session.day,
          session_mode: session.session_mode,
        },
        exercises as any
      )

      if (result.isSuccess) {
        setSaveStatus('saved')
        setHasUnsavedChanges(false)
        setTimeout(() => setSaveStatus('idle'), 2000)
        return true
      } else {
        console.error('[SessionPlannerContext] Save failed:', result.message)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
        return false
      }
    } catch (error) {
      console.error('[SessionPlannerContext] Save error:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return false
    }
  }, [session, sessionId, exercises])

  const forceSave = useCallback(async (): Promise<boolean> => {
    return save()
  }, [save])

  // AI Changeset operations
  const addChangeset = useCallback((changeset: AIChangeset) => {
    setPendingChangesets(prev => [...prev, changeset])
  }, [])

  const approveChangeset = useCallback((changesetId: string) => {
    setPendingChangesets(prev => prev.map(cs =>
      cs.id === changesetId ? { ...cs, status: 'approved' } : cs
    ))

    // Apply the changeset
    const changeset = pendingChangesets.find(cs => cs.id === changesetId)
    if (!changeset) return

    changeset.items.forEach(item => {
      switch (item.type) {
        case 'add_exercise':
          if (item.data) {
            addExercise(item.data as SessionExercise)
          }
          break
        case 'remove_exercise':
          if (item.targetId !== undefined) {
            removeExercise(item.targetId)
          }
          break
        case 'update_exercise':
          if (item.targetId !== undefined && item.data) {
            updateExercise(item.targetId, item.data as Partial<SessionExercise>)
          }
          break
        // Add more cases as needed
      }
    })
  }, [pendingChangesets, addExercise, removeExercise, updateExercise])

  const rejectChangeset = useCallback((changesetId: string) => {
    setPendingChangesets(prev => prev.map(cs =>
      cs.id === changesetId ? { ...cs, status: 'rejected' } : cs
    ))
  }, [])

  const clearApprovedChangesets = useCallback(() => {
    setPendingChangesets(prev => prev.filter(cs => cs.status === 'pending'))
  }, [])

  // Reset to initial state
  const resetToInitial = useCallback(() => {
    setExercises(initialExercisesRef.current)
    setHistory([initialExercisesRef.current])
    setHistoryIndex(0)
    setHasUnsavedChanges(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Memoized context value
  const value = useMemo<SessionPlannerContextValue>(() => ({
    session,
    exercises,
    saveStatus,
    hasUnsavedChanges,
    isLoading,
    canUndo,
    canRedo,
    undo,
    redo,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    reorderSets,
    toggleExerciseExpand,
    save,
    forceSave,
    pendingChangesets,
    addChangeset,
    approveChangeset,
    rejectChangeset,
    clearApprovedChangesets,
    setSession,
    setExercises,
    resetToInitial,
  }), [
    session,
    exercises,
    saveStatus,
    hasUnsavedChanges,
    isLoading,
    canUndo,
    canRedo,
    undo,
    redo,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    reorderSets,
    toggleExerciseExpand,
    save,
    forceSave,
    pendingChangesets,
    addChangeset,
    approveChangeset,
    rejectChangeset,
    clearApprovedChangesets,
    resetToInitial,
  ])

  return (
    <SessionPlannerContext.Provider value={value}>
      {children}
    </SessionPlannerContext.Provider>
  )
}
