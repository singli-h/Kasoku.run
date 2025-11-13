"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlanPageHeader } from "@/components/features/plans/components/PlanPageHeader"
import { Toolbar } from "@/components/features/plans/session-planner/components/Toolbar"
import { ExerciseList } from "@/components/features/plans/session-planner/components/ExerciseList"
import { ExerciseLibraryPanel } from "@/components/features/plans/session-planner/components/ExerciseLibraryPanel"
import { BatchEditDialog } from "@/components/features/plans/session-planner/components/BatchEditDialog"
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
import { ValidationToast } from "@/components/features/plans/session-planner/components/ValidationToast"
import { SuccessToast } from "@/components/features/plans/session-planner/components/SuccessToast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  Session,
  SessionState,
  SessionExercise,
  ExerciseLibraryItem,
  SetParameter,
} from "@/components/features/plans/session-planner/types"
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

interface SessionPlannerClientProps {
  planId: string
  sessionId: number
  initialSession: Session
  initialExercises: SessionExercise[]
  exerciseLibrary: ExerciseLibraryItem[]
  exerciseTypes: any[]
}

export function SessionPlannerClient({
  planId,
  sessionId,
  initialSession,
  initialExercises,
  exerciseLibrary,
  exerciseTypes,
}: SessionPlannerClientProps) {
  const router = useRouter()

  // Page mode state (simple vs detail view)
  const [pageMode, setPageMode] = useState<"simple" | "detail">("simple")

  // Initialize session state with server data
  const [state, setState] = useState<SessionState>({
    session: initialSession,
    exercises: initialExercises,
    selection: new Set(),
    expandedRows: new Set(),
    libraryOpen: false,
    batchEditOpen: false,
    pageMode: pageMode,
  })

  // Undo/Redo history
  const [history, setHistory] = useState<SessionExercise[][]>([initialExercises])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Toast states
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Confirm dialog states
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  // Sync pageMode state changes to session state
  useEffect(() => {
    setState((prev) => ({ ...prev, pageMode }))
  }, [pageMode])

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
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setState((prev) => ({
        ...prev,
        exercises: history[newIndex],
      }))
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setState((prev) => ({
        ...prev,
        exercises: history[newIndex],
      }))
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  const handleSave = useCallback(async () => {
    const validation = validateSession(state.exercises)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    try {
      const result = await saveSessionWithExercisesAction(
        sessionId,
        {
          name: state.session.name,
          description: state.session.description,
          date: state.session.date,
          week: state.session.week,
          day: state.session.day,
          session_mode: state.session.session_mode,
        },
        state.exercises
      )

      if (!result.isSuccess) {
        setValidationErrors([result.message])
        return
      }

      setHasUnsavedChanges(false)
      setSuccessMessage("Session saved successfully!")

      // Reset history after successful save
      const currentExercises = state.exercises
      setHistory([currentExercises])
      setHistoryIndex(0)
    } catch (error) {
      console.error("Error saving session:", error)
      setValidationErrors([error instanceof Error ? error.message : "Failed to save session"])
    }
  }, [sessionId, state])

  const handleDiscard = useCallback(() => {
    if (hasUnsavedChanges) {
      setDiscardConfirmOpen(true)
      return
    }
    router.push(`/plans/${planId}`)
  }, [hasUnsavedChanges, router, planId])

  const confirmDiscard = useCallback(() => {
    setDiscardConfirmOpen(false)
    router.push(`/plans/${planId}`)
  }, [router, planId])

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
          id: `${Date.now()}_${Math.random()}`, // Generate unique ID
          superset_id: null, // Remove superset association for duplicates
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

  const handleReorderExercises = useCallback(
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

  const handleUngroupSuperset = useCallback(() => {
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
        id: `${Date.now()}_${Math.random()}`,
        superset_id: null, // Remove superset association
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
    (params: { field: keyof SetParameter; operation: "set" | "add" | "multiply"; value: number | string }) => {
      setState((prev) => {
        const { field, operation, value } = params

        const updated = prev.exercises.map((ex) => {
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

        saveToHistory(updated)
        return { ...prev, exercises: updated, batchEditOpen: false }
      })
      setHasUnsavedChanges(true)
      setSuccessMessage(`Batch edit applied to ${state.selection.size} exercise(s)`)
    },
    [saveToHistory, state.selection.size],
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
  const estimatedDuration = useMemo(() => {
    return estimateDuration(state.exercises)
  }, [state.exercises])

  const hasSelection = state.selection.size > 0
  const canCreateSupersetFromSelection = canCreateSuperset(state.exercises, state.selection)
  const canUngroupFromSelection = canUngroupSuperset(state.exercises, state.selection)

  // Create validation error map for exercises (currently unused, but required by ExerciseList)
  const validationErrorMap = new Map<string, string[]>()

  return (
    <div className="min-w-0">
      {/* Page Header with Undo/Redo */}
      <PlanPageHeader
        title={state.session.name || "Session Planner"}
        subtitle={`Plan: ${planId} • Session: ${sessionId}`}
        showUndoRedo={true}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        backPath={`/plans/${planId}`}
        pageMode={pageMode}
        onPageModeChange={setPageMode}
      />

      {/* Toolbar - Apple Minimalist Style */}
      <Toolbar
        selectionCount={state.selection.size}
        totalCount={state.exercises.length}
        canCreateSuperset={canCreateSupersetFromSelection}
        canUngroup={canUngroupFromSelection}
        onAddExercise={() => setState((prev) => ({ ...prev, libraryOpen: true }))}
        onCreateSuperset={handleCreateSuperset}
        onUngroup={handleUngroupSuperset}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onBatchEdit={() => setState((prev) => ({ ...prev, batchEditOpen: true }))}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* Exercise List - Simple container, allow horizontal overflow */}
      <div className="space-y-2 sm:space-y-3 min-w-0">
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
            onReorder={handleReorderExercises}
            validationErrors={validationErrorMap}
          />
        )}
      </div>

      {/* Exercise Library Panel - Overlay */}
      <ExerciseLibraryPanel
        isOpen={state.libraryOpen}
        exercises={exerciseLibrary}
        onAddExercises={handleAddExercises}
        onClose={() => setState((prev) => ({ ...prev, libraryOpen: false }))}
      />

      {/* Batch Edit Dialog */}
      {state.batchEditOpen && (
        <BatchEditDialog
          isOpen={state.batchEditOpen}
          selectionCount={state.selection.size}
          onApply={(field, operation, value) => {
            handleBatchEdit({ field, operation: operation as "set" | "add" | "multiply", value })
          }}
          onClose={() => setState((prev) => ({ ...prev, batchEditOpen: false }))}
        />
      )}

      {/* Validation Toast */}
      {validationErrors.length > 0 && (
        <ValidationToast
          errors={validationErrors}
          onClose={() => setValidationErrors([])}
        />
      )}

      {/* Success Toast */}
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Discard Confirmation */}
      <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them and return to the plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
