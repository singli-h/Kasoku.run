"use client"

import { useState, useCallback, useMemo } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { SessionHeader } from "@/components/features/plans/session-planner/components/SessionHeader"
import { Toolbar } from "@/components/features/plans/session-planner/components/Toolbar"
import { ExerciseList } from "@/components/features/plans/session-planner/components/ExerciseList"
import { ExerciseLibraryPanel } from "@/components/features/plans/session-planner/components/ExerciseLibraryPanel"
import { BatchEditDialog } from "@/components/features/plans/session-planner/components/BatchEditDialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
  createExerciseInSession,
  estimateDuration,
  createSuperset,
  ungroupSuperset,
  canCreateSuperset,
  canUngroupSuperset,
  reorderExercises,
  validateSession,
} from "@/components/features/plans/session-planner/utils"
import { DEMO_EXERCISES } from "@/components/features/plans/session-planner/data/exercises"
import { SESSION_DATA } from "@/components/features/plans/session-planner/data/sessionData"
import { ValidationToast } from "@/components/features/plans/session-planner/components/ValidationToast"
import { SuccessToast } from "@/components/features/plans/session-planner/components/SuccessToast"
import type {
  Session,
  SessionState,
  SessionExercise,
  ExerciseLibraryItem,
  SetParameter,
} from "@/components/features/plans/session-planner/types"

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>
}

export default function SessionPlannerPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const planId = resolvedParams.id
  const sessionId = resolvedParams.sessionId

  // Load sample data for demo
  const initialExercises = SESSION_DATA[parseInt(sessionId)] || []

  // Initialize session state
  const [state, setState] = useState<SessionState>({
    session: {
      id: parseInt(sessionId),
      name: `Session ${sessionId}`,
      description: null,
      date: new Date().toISOString().split("T")[0],
      microcycle_id: null,
      estimatedDuration: null,
      notes: null,
    },
    exercises: initialExercises,
    selection: new Set(),
    expandedRows: new Set(),
    libraryOpen: false,
    batchEditOpen: false,
    pageMode: "simple",
  })

  // Undo/Redo history
  const [history, setHistory] = useState<SessionExercise[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Toast states
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Save state to history
  const saveToHistory = useCallback(
    (exercises: SessionExercise[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(exercises)))
        return newHistory.slice(-50) // Keep last 50 states
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 49))
    },
    [historyIndex],
  )

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setState((prev) => ({
        ...prev,
        exercises: JSON.parse(JSON.stringify(history[historyIndex - 1])),
      }))
      setHasUnsavedChanges(true)
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setState((prev) => ({
        ...prev,
        exercises: JSON.parse(JSON.stringify(history[historyIndex + 1])),
      }))
      setHasUnsavedChanges(true)
    }
  }, [history, historyIndex])

  // Calculate estimated duration
  const sessionEstimatedDuration = useMemo(() => {
    return estimateDuration(state.exercises)
  }, [state.exercises])

  // Validation
  const exerciseValidationErrors = useMemo(() => {
    const errors = new Map<string, string[]>()
    state.exercises.forEach((ex) => {
      const exErrors: string[] = []
      if (!ex.exercise?.name || ex.exercise.name.trim() === "") {
        exErrors.push("Exercise name is required")
      }
      if (ex.sets.length === 0) {
        exErrors.push("Must have at least one set")
      }
      if (exErrors.length > 0) {
        errors.set(ex.id, exErrors)
      }
    })
    return errors
  }, [state.exercises])

  // Session handlers
  const handleSessionChange = useCallback((updates: Partial<Session>) => {
    setState((prev) => ({
      ...prev,
      session: { ...prev.session, ...updates },
    }))
    setHasUnsavedChanges(true)
  }, [])

  const handlePageModeChange = useCallback((mode: "simple" | "detail") => {
    setState((prev) => ({ ...prev, pageMode: mode }))
  }, [])

  const handleSave = useCallback(() => {
    const validation = validateSession(state.exercises)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    console.log("Saving session:", state.session, state.exercises)
    // TODO: API call to save session
    setHasUnsavedChanges(false)
    setSuccessMessage("Session saved successfully!")
  }, [state])

  const handleDiscard = useCallback(() => {
    if (hasUnsavedChanges && !confirm("Discard unsaved changes?")) {
      return
    }
    router.push(`/plans/${planId}`)
  }, [hasUnsavedChanges, router, planId])

  // Exercise handlers
  const handleAddExercises = useCallback(
    (exercises: ExerciseLibraryItem[]) => {
      setState((prev) => {
        const maxOrder = prev.exercises.length > 0 ? Math.max(...prev.exercises.map((e) => e.preset_order)) : 0

        const newExercises = exercises.map((ex, index) =>
          createExerciseInSession(ex.id, ex.name, ex.exercise_type_id, maxOrder + index + 1),
        )

        const updated = [...prev.exercises, ...newExercises]
        saveToHistory(updated)
        return {
          ...prev,
          exercises: updated,
          libraryOpen: false,
        }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleToggleSelect = useCallback((id: string) => {
    setState((prev) => {
      const newSelection = new Set(prev.selection)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { ...prev, selection: newSelection }
    })
  }, [])

  const handleToggleExpand = useCallback((id: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedRows)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return { ...prev, expandedRows: newExpanded }
    })
  }, [])

  const handleUpdateExercise = useCallback(
    (id: string, updates: Partial<SessionExercise>) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
        saveToHistory(updated)
        return {
          ...prev,
          exercises: updated,
        }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleDuplicateExercise = useCallback(
    (id: string) => {
      setState((prev) => {
        const exercise = prev.exercises.find((ex) => ex.id === id)
        if (!exercise) return prev

        const insertIndex = prev.exercises.findIndex((ex) => ex.id === id) + 1
        const duplicate = {
          ...exercise,
          id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          superset_id: null,
        }

        const newExercises = [...prev.exercises]
        newExercises.splice(insertIndex, 0, duplicate)
        const reordered = reorderExercises(newExercises)

        saveToHistory(reordered)
        return {
          ...prev,
          exercises: reordered,
        }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleRemoveExercise = useCallback(
    (id: string) => {
      setState((prev) => {
        const filtered = prev.exercises.filter((ex) => ex.id !== id)
        const reordered = reorderExercises(filtered)

        saveToHistory(reordered)
        return {
          ...prev,
          exercises: reordered,
          selection: new Set([...prev.selection].filter((selId) => selId !== id)),
          expandedRows: new Set([...prev.expandedRows].filter((expId) => expId !== id)),
        }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleReorder = useCallback(
    (exercises: SessionExercise[]) => {
      saveToHistory(exercises)
      setState((prev) => ({
        ...prev,
        exercises,
      }))
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  // Bulk operations
  const handleCreateSuperset = useCallback(() => {
    setState((prev) => {
      const updatedExercises = createSuperset(prev.exercises, prev.selection)
      saveToHistory(updatedExercises)

      return {
        ...prev,
        exercises: updatedExercises,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  const handleUngroup = useCallback(() => {
    setState((prev) => {
      const selectedExercises = prev.exercises.filter((ex) => prev.selection.has(ex.id))
      const supersetId = selectedExercises[0]?.superset_id
      if (!supersetId) return prev

      const updated = ungroupSuperset(prev.exercises, supersetId)
      saveToHistory(updated)

      return {
        ...prev,
        exercises: updated,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  const handleDuplicateSelected = useCallback(() => {
    setState((prev) => {
      const selectedExercises = prev.exercises.filter((ex) => prev.selection.has(ex.id))

      const duplicates = selectedExercises.map((ex) => ({
        ...ex,
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        superset_id: null,
      }))

      const newExercises = [...prev.exercises, ...duplicates]
      const reordered = reorderExercises(newExercises)

      saveToHistory(reordered)
      return {
        ...prev,
        exercises: reordered,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  const handleDeleteSelected = useCallback(() => {
    if (!confirm(`Delete ${state.selection.size} exercise(s)?`)) return

    setState((prev) => {
      const filtered = prev.exercises.filter((ex) => !prev.selection.has(ex.id))
      const reordered = reorderExercises(filtered)

      saveToHistory(reordered)
      return {
        ...prev,
        exercises: reordered,
        selection: new Set(),
        expandedRows: new Set([...prev.expandedRows].filter((id) => !prev.selection.has(id))),
      }
    })
    setHasUnsavedChanges(true)
  }, [state.selection, saveToHistory])

  const handleBatchEdit = useCallback(
    (field: keyof SetParameter, operation: string, value: number | string) => {
      setState((prev) => {
        const updatedExercises = prev.exercises.map((ex) => {
          if (!prev.selection.has(ex.id)) return ex

          const updatedSets = ex.sets.map((set) => {
            const currentValue = set[field]
            let newValue: any = value

            if (operation === "add" && typeof currentValue === "number") {
              newValue = currentValue + Number(value)
            } else if (operation === "multiply" && typeof currentValue === "number") {
              newValue = currentValue * Number(value)
            }

            return { ...set, [field]: newValue }
          })

          return { ...ex, sets: updatedSets }
        })

        saveToHistory(updatedExercises)
        return {
          ...prev,
          exercises: updatedExercises,
          selection: new Set(),
          batchEditOpen: false,
        }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleSelectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selection: new Set(prev.exercises.map((ex) => ex.id)),
    }))
  }, [])

  const handleDeselectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selection: new Set(),
    }))
  }, [])

  // Computed values
  const canCreateSupersetNow = useMemo(() => {
    return canCreateSuperset(state.exercises, state.selection)
  }, [state.exercises, state.selection])

  const canUngroupNow = useMemo(() => {
    return canUngroupSuperset(state.exercises, state.selection)
  }, [state.exercises, state.selection])

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b bg-background">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Button variant="ghost" onClick={() => router.push(`/plans/${planId}`)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Session Header */}
      <SessionHeader
        session={state.session}
        estimatedDuration={sessionEstimatedDuration}
        pageMode={state.pageMode}
        onSessionChange={handleSessionChange}
        onPageModeChange={handlePageModeChange}
        onSave={handleSave}
        onDiscard={handleDiscard}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Toolbar */}
          <Toolbar
            selectionCount={state.selection.size}
            totalCount={state.exercises.length}
            canCreateSuperset={canCreateSupersetNow}
            canUngroup={canUngroupNow}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onAddExercise={() => setState((prev) => ({ ...prev, libraryOpen: true }))}
            onCreateSuperset={handleCreateSuperset}
            onUngroup={handleUngroup}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
            onBatchEdit={() => setState((prev) => ({ ...prev, batchEditOpen: true }))}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {/* Exercise List */}
          {state.exercises.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <p className="text-lg mb-2">No exercises yet</p>
              <p className="text-sm">Click "Add Exercise" to get started</p>
            </div>
          ) : (
            <ExerciseList
              exercises={state.exercises}
              selection={state.selection}
              expandedRows={state.expandedRows}
              pageMode={state.pageMode}
              onToggleSelect={handleToggleSelect}
              onToggleExpand={handleToggleExpand}
              onUpdateExercise={handleUpdateExercise}
              onDuplicateExercise={handleDuplicateExercise}
              onRemoveExercise={handleRemoveExercise}
              onReorder={handleReorder}
              validationErrors={exerciseValidationErrors}
            />
          )}
        </div>
      </div>

      {/* Exercise Library Panel */}
      <ExerciseLibraryPanel
        isOpen={state.libraryOpen}
        onClose={() => setState((prev) => ({ ...prev, libraryOpen: false }))}
        onAddExercises={handleAddExercises}
        exercises={DEMO_EXERCISES}
      />

      {/* Batch Edit Dialog */}
      <BatchEditDialog
        isOpen={state.batchEditOpen}
        onClose={() => setState((prev) => ({ ...prev, batchEditOpen: false }))}
        onApply={handleBatchEdit}
        selectionCount={state.selection.size}
      />

      {/* Toast Notifications */}
      <ValidationToast errors={validationErrors} onClose={() => setValidationErrors([])} />
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage("")} />
    </div>
  )
}
