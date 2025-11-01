"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toolbar } from "@/components/features/plans/session-planner/components/Toolbar"
import { ExerciseList } from "@/components/features/plans/session-planner/components/ExerciseList"
import { ExerciseLibraryPanel } from "@/components/features/plans/session-planner/components/ExerciseLibraryPanel"
import { BatchEditDialog } from "@/components/features/plans/session-planner/components/BatchEditDialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Save } from "lucide-react"
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
  BatchEditOperation,
} from "@/components/features/plans/session-planner/types"
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

interface SessionPlannerClientProps {
  planId: string
  sessionId: number
  initialSession: Session
  initialExercises: SessionExercise[]
  exerciseLibrary: ExerciseLibraryItem[]
  exerciseTypes: any[]
  pageMode: "simple" | "detail"
  onPageModeChange: (mode: "simple" | "detail") => void
  onUndoRedoStateChange?: (canUndo: boolean, canRedo: boolean) => void
  undoHandlerRef?: React.MutableRefObject<(() => void) | null>
  redoHandlerRef?: React.MutableRefObject<(() => void) | null>
}

export function SessionPlannerClient({
  planId,
  sessionId,
  initialSession,
  initialExercises,
  exerciseLibrary,
  exerciseTypes,
  pageMode,
  onPageModeChange,
  onUndoRedoStateChange,
  undoHandlerRef,
  redoHandlerRef,
}: SessionPlannerClientProps) {
  const router = useRouter()

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

  // Sync pageMode prop changes to state
  useEffect(() => {
    setState((prev) => ({ ...prev, pageMode }))
  }, [pageMode])

  // Update undo/redo state in parent
  useEffect(() => {
    if (onUndoRedoStateChange) {
      onUndoRedoStateChange(historyIndex > 0, historyIndex < history.length - 1)
    }
  }, [historyIndex, history.length, onUndoRedoStateChange])

  // Toast states
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Confirm dialog states
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  // Expose handlers to parent via refs
  useEffect(() => {
    if (undoHandlerRef) {
      undoHandlerRef.current = handleUndo
    }
    if (redoHandlerRef) {
      redoHandlerRef.current = handleRedo
    }
  }, [handleUndo, handleRedo, undoHandlerRef, redoHandlerRef])

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
  }, [sessionId, state, setHistory, setHistoryIndex])

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

  const handleDeleteSelected = useCallback(() => {
    if (state.selection.size === 0) return

    setState((prev) => {
      const updated = prev.exercises.filter((ex) => !prev.selection.has(ex.id))
      saveToHistory(updated)
      return {
        ...prev,
        exercises: updated,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [state.selection, saveToHistory])

  const handleRemoveExercise = useCallback((exerciseId: string) => {
    setState((prev) => {
      const updated = prev.exercises.filter((ex) => ex.id !== exerciseId)
      saveToHistory(updated)
      return {
        ...prev,
        exercises: updated,
        selection: new Set(Array.from(prev.selection).filter(id => id !== exerciseId)),
      }
    })
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  const handleDuplicateExercise = useCallback((exerciseId: string) => {
    setState((prev) => {
      const exerciseToDuplicate = prev.exercises.find((ex) => ex.id === exerciseId)
      if (!exerciseToDuplicate) return prev

      const newExercise: SessionExercise = {
        ...exerciseToDuplicate,
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        preset_order: prev.exercises.length + 1,
        superset_id: null, // Don't copy superset grouping
      }

      const updated = [...prev.exercises, newExercise]
      saveToHistory(updated)
      return {
        ...prev,
        exercises: updated,
      }
    })
    setHasUnsavedChanges(true)
  }, [saveToHistory])

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

  const handleCreateSuperset = useCallback(() => {
    if (!canCreateSuperset(state.exercises, state.selection)) return

    setState((prev) => {
      const updated = createSuperset(prev.exercises, prev.selection)
      saveToHistory(updated)
      return {
        ...prev,
        exercises: updated,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [state.selection, state.exercises, saveToHistory])

  const handleUngroupSuperset = useCallback(() => {
    if (!canUngroupSuperset(state.exercises, state.selection)) return

    setState((prev) => {
      // Find the superset_id from the first selected exercise
      const selectedExercise = prev.exercises.find((ex) => prev.selection.has(ex.id))
      if (!selectedExercise?.superset_id) return prev

      const updated = ungroupSuperset(prev.exercises, selectedExercise.superset_id)
      saveToHistory(updated)
      return {
        ...prev,
        exercises: updated,
        selection: new Set(),
      }
    })
    setHasUnsavedChanges(true)
  }, [state.selection, state.exercises, saveToHistory])

  const handleReorderExercises = useCallback(
    (exercises: SessionExercise[]) => {
      setState((prev) => {
        const updated = reorderExercises(exercises)
        saveToHistory(updated)
        return { ...prev, exercises: updated }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleUpdateExercise = useCallback(
    (exerciseId: string, updates: Partial<SessionExercise>) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, ...updates } : ex,
        )
        saveToHistory(updated)
        return { ...prev, exercises: updated }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleUpdateSet = useCallback(
    (exerciseId: string, setIndex: number, updates: Partial<SetParameter>) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex

          const updatedSets = ex.sets.map((set) =>
            set.set_index === setIndex ? { ...set, ...updates } : set,
          )
          return { ...ex, sets: updatedSets }
        })
        saveToHistory(updated)
        return { ...prev, exercises: updated }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleAddSet = useCallback(
    (exerciseId: string) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex

          const maxSetIndex = ex.sets.length > 0 ? Math.max(...ex.sets.map((s) => s.set_index)) : 0
          const newSet: SetParameter = {
            set_index: maxSetIndex + 1,
            reps: 10,
            weight: null,
            rest_time: 90,
            tempo: "2-0-2-0",
            rpe: 7,
            distance: null,
            performing_time: null,
            resistance_unit_id: null,
            power: null,
            velocity: null,
            effort: null,
            height: null,
            resistance: null,
            completed: false,
            isEditing: false,
          }

          return { ...ex, sets: [...ex.sets, newSet] }
        })
        saveToHistory(updated)
        return { ...prev, exercises: updated }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleRemoveSet = useCallback(
    (exerciseId: string, setIndex: number) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex

          const updatedSets = ex.sets.filter((set) => set.set_index !== setIndex)
          return { ...ex, sets: updatedSets }
        })
        saveToHistory(updated)
        return { ...prev, exercises: updated }
      })
      setHasUnsavedChanges(true)
    },
    [saveToHistory],
  )

  const handleBatchEdit = useCallback(
    (operation: BatchEditOperation) => {
      setState((prev) => {
        const updated = prev.exercises.map((ex) => {
          // Only apply to selected exercises
          if (!prev.selection.has(ex.id)) return ex

          // Apply operation to all sets in the exercise
          const updatedSets = ex.sets.map((set) => {
            const field = operation.field
            const currentValue = set[field]

            // Handle different operation types
            let newValue: number | string | null = null

            switch (operation.operation) {
              case "set":
                // Set to specific value
                newValue = operation.value
                break

              case "add":
                // Add to existing value (only for numeric fields)
                if (typeof currentValue === "number" && typeof operation.value === "number") {
                  newValue = currentValue + operation.value
                } else if (currentValue === null && typeof operation.value === "number") {
                  newValue = operation.value
                }
                break

              case "multiply":
                // Multiply existing value (only for numeric fields)
                if (typeof currentValue === "number" && typeof operation.value === "number") {
                  newValue = Math.round(currentValue * operation.value * 100) / 100 // Round to 2 decimals
                }
                break
            }

            // Only update if we have a valid new value
            if (newValue !== null) {
              return { ...set, [field]: newValue }
            }
            return set
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
    <div className="flex h-full flex-col w-full">
      {/* Toolbar */}
      <Toolbar
        selectionCount={state.selection.size}
        totalCount={state.exercises.length}
        canCreateSuperset={canCreateSupersetFromSelection}
        canUngroup={canUngroupFromSelection}
        onAddExercise={() => setState((prev) => ({ ...prev, libraryOpen: true }))}
        onCreateSuperset={handleCreateSuperset}
        onUngroup={handleUngroupSuperset}
        onDuplicate={() => {}}
        onDelete={handleDeleteSelected}
        onBatchEdit={() => setState((prev) => ({ ...prev, batchEditOpen: true }))}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* Main Content - Flex container with full width */}
      <div className="flex flex-1 w-full">
        {/* Exercise List - Scrollable region (allow horizontal scroll from children) */}
        <div className="flex-1 overflow-y-auto overflow-x-visible min-w-0">
          <div className="p-4">
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
          </div>
        </div>

        {/* Exercise Library Panel */}
        <ExerciseLibraryPanel
          isOpen={state.libraryOpen}
          exercises={exerciseLibrary}
          onAddExercises={handleAddExercises}
          onClose={() => setState((prev) => ({ ...prev, libraryOpen: false }))}
        />
      </div>

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
