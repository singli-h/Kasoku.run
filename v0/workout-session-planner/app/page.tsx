"use client"

import { useState, useCallback, useMemo } from "react"
import { SessionHeader } from "@/components/session-planner/session-header"
import { ExerciseLibraryPanel } from "@/components/session-planner/exercise-library-panel"
import { ExerciseList } from "@/components/session-planner/exercise-list"
import { Toolbar } from "@/components/session-planner/toolbar"
import { BatchEditDialog } from "@/components/session-planner/batch-edit-dialog"
import { ValidationToast } from "@/components/session-planner/validation-toast"
import { SuccessToast } from "@/components/session-planner/success-toast"
import {
  createExerciseInSession,
  estimateDuration,
  generateId,
  createSuperset,
  ungroupSuperset,
  canCreateSuperset,
  canUngroupSuperset,
  reorderExercises,
  validateSession,
} from "@/lib/session-utils"
import type { Session, SessionState, Exercise, ExerciseInSession } from "@/types/session"

// Sample exercise library data
const SAMPLE_EXERCISES: Exercise[] = [
  { id: 301, name: "Back Squat", type: "strength", category: "Lower Body", isFavorite: true },
  { id: 402, name: "Romanian Deadlift", type: "strength", category: "Lower Body" },
  { id: 510, name: "Bulgarian Split Squat", type: "strength", category: "Lower Body" },
  { id: 520, name: "Hamstring Curl", type: "strength", category: "Lower Body" },
  { id: 701, name: "Sled Push 20m", type: "sprint", category: "Speed" },
  { id: 810, name: "Assault Bike", type: "endurance", category: "Conditioning" },
  { id: 905, name: "Box Jump", type: "plyometric", category: "Power" },
  { id: 101, name: "Bench Press", type: "strength", category: "Upper Body", isFavorite: true },
  { id: 102, name: "Pull-ups", type: "strength", category: "Upper Body" },
  { id: 103, name: "Overhead Press", type: "power", category: "Upper Body" },
  { id: 201, name: "100m Sprint", type: "sprint", category: "Speed" },
  { id: 202, name: "400m Run", type: "endurance", category: "Conditioning" },
]

export default function PlanSessionPage() {
  const [state, setState] = useState<SessionState>({
    session: {
      name: "Lower Body Strength + Speed",
      date: new Date().toISOString().split("T")[0],
      estimatedDuration: null,
      notes: null,
    },
    exercises: [],
    selection: new Set(),
    pageMode: "simple",
    expandedRows: new Set(),
    libraryOpen: false,
    batchEditOpen: false,
  })

  const [history, setHistory] = useState<ExerciseInSession[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  const saveToHistory = useCallback(
    (exercises: ExerciseInSession[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(exercises)))
        return newHistory.slice(-50) // Keep last 50 states
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 49))
    },
    [historyIndex],
  )

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

  const estimatedDuration = useMemo(() => {
    return estimateDuration(state.exercises)
  }, [state.exercises])

  const exerciseValidationErrors = useMemo(() => {
    const errors = new Map<string, string[]>()
    state.exercises.forEach((ex) => {
      const exErrors: string[] = []
      if (!ex.name || ex.name.trim() === "") {
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

  const handleAddExercises = useCallback(
    (exercises: Exercise[]) => {
      setState((prev) => {
        const maxOrder = prev.exercises.length > 0 ? Math.max(...prev.exercises.map((e) => e.order)) : 0

        const newExercises = exercises.map((ex, index) =>
          createExerciseInSession(ex.id, ex.name, ex.type, maxOrder + index + 1),
        )

        const updated = [...prev.exercises, ...newExercises]
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

  const handleSave = useCallback(() => {
    const validation = validateSession(state.exercises)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    console.log("Saving session:", state.session, state.exercises)
    setHasUnsavedChanges(false)
    setSuccessMessage("Session saved successfully!")
  }, [state])

  const handleDiscard = useCallback(() => {
    if (hasUnsavedChanges && !confirm("Discard unsaved changes?")) {
      return
    }
    setState((prev) => ({
      ...prev,
      exercises: [],
      selection: new Set(),
      expandedRows: new Set(),
    }))
    setHistory([])
    setHistoryIndex(-1)
    setHasUnsavedChanges(false)
  }, [hasUnsavedChanges])

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
    (id: string, updates: Partial<ExerciseInSession>) => {
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
          id: generateId(),
          supersetId: null, // Remove superset association for duplicates
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
    (exercises: ExerciseInSession[]) => {
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

  const handleUngroup = useCallback(() => {
    setState((prev) => {
      const selectedExercises = prev.exercises.filter((ex) => prev.selection.has(ex.id))
      const supersetId = selectedExercises[0]?.supersetId
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
        id: generateId(),
        supersetId: null, // Remove superset association
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
    (field: string, operation: string, value: number | string) => {
      setState((prev) => {
        const updatedExercises = prev.exercises.map((ex) => {
          if (!prev.selection.has(ex.id)) return ex

          const updatedSets = ex.sets.map((set) => {
            const currentValue = set[field as keyof typeof set]
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

  const canCreateSupersetNow = useMemo(() => {
    return canCreateSuperset(state.exercises, state.selection)
  }, [state.exercises, state.selection])

  const canUngroupNow = useMemo(() => {
    return canUngroupSuperset(state.exercises, state.selection)
  }, [state.exercises, state.selection])

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader
        session={state.session}
        estimatedDuration={estimatedDuration}
        pageMode={state.pageMode}
        onSessionChange={handleSessionChange}
        onPageModeChange={handlePageModeChange}
        onSave={handleSave}
        onDiscard={handleDiscard}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
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

      <ExerciseLibraryPanel
        isOpen={state.libraryOpen}
        onClose={() => setState((prev) => ({ ...prev, libraryOpen: false }))}
        onAddExercises={handleAddExercises}
        exercises={SAMPLE_EXERCISES}
      />

      <BatchEditDialog
        isOpen={state.batchEditOpen}
        onClose={() => setState((prev) => ({ ...prev, batchEditOpen: false }))}
        onApply={handleBatchEdit}
        selectionCount={state.selection.size}
      />

      {validationErrors.length > 0 && (
        <ValidationToast errors={validationErrors} onClose={() => setValidationErrors([])} />
      )}

      {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage("")} />}
    </div>
  )
}
