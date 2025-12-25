"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Undo2, Redo2, CheckCircle, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
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

// Import training types and views
import type { TrainingExercise, TrainingSet } from "../types"
import { WorkoutView } from "./WorkoutView"
import {
  sessionExercisesToTraining,
  type SessionPlannerExercise
} from "../adapters/session-adapter"

// Import session planner types
import type { ExerciseLibraryItem } from "@/components/features/plans/session-planner/types"

// Import save action
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

interface SessionPlannerV2Props {
  planId: string
  sessionId: number
  initialSession: {
    id: number
    name: string
    description?: string | null
    date?: string | null
    week?: number | null
    day?: number | null
    session_mode?: string | null
  }
  initialExercises: SessionPlannerExercise[]
  exerciseLibrary: ExerciseLibraryItem[]
  className?: string
}

export function SessionPlannerV2({
  planId,
  sessionId,
  initialSession,
  initialExercises,
  exerciseLibrary,
  className
}: SessionPlannerV2Props) {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [exercises, setExercises] = useState<SessionPlannerExercise[]>(initialExercises)
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  // Undo/Redo history
  const [history, setHistory] = useState<SessionPlannerExercise[][]>([initialExercises])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Convert to training exercises for rendering
  const trainingExercises = useMemo(() => {
    return sessionExercisesToTraining(exercises, expandedIds)
  }, [exercises, expandedIds])

  // Transform exercise library to the format WorkoutView expects
  const exerciseLibraryItems = useMemo(() => {
    return exerciseLibrary.map(ex => ({
      id: String(ex.id),
      name: ex.name,
      category: (ex as any).category || 'Other',
      equipment: '',
      muscleGroups: []
    }))
  }, [exerciseLibrary])

  // Save to history
  const saveToHistory = useCallback((newExercises: SessionPlannerExercise[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newExercises)))
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
    setHasUnsavedChanges(true)
  }, [historyIndex])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setExercises(history[newIndex])
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setExercises(history[newIndex])
      setHasUnsavedChanges(true)
    }
  }, [historyIndex, history])

  // Handle toggle expand
  const handleToggleExpand = useCallback((exerciseId: number | string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })

    // Also update isCollapsed in exercises
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, isCollapsed: !ex.isCollapsed } : ex
    ))
  }, [])

  // Handle update set (coach mode - update planned values)
  const handleUpdateSet = useCallback((
    exerciseId: number | string,
    setId: number | string,
    field: keyof TrainingSet,
    value: number | string | null
  ) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const dbField = field === 'performingTime' ? 'performing_time'
          : field === 'restTime' ? 'rest_time'
            : field

        const newSets = ex.sets.map(set =>
          set.id === setId ? { ...set, [dbField]: value } : set
        )

        return { ...ex, sets: newSets }
      })

      saveToHistory(newExercises)
      return newExercises
    })
  }, [saveToHistory])

  // Handle add set
  const handleAddSet = useCallback((exerciseId: number | string) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const lastSet = ex.sets[ex.sets.length - 1]
        const newSetIndex = ex.sets.length + 1
        const newSet = {
          id: `new-${Date.now()}`,
          session_plan_exercise_id: typeof ex.id === 'number' ? ex.id : 0,
          set_index: newSetIndex,
          reps: lastSet?.reps ?? null,
          weight: lastSet?.weight ?? null,
          distance: lastSet?.distance ?? null,
          performing_time: lastSet?.performing_time ?? null,
          rest_time: lastSet?.rest_time ?? null,
          tempo: lastSet?.tempo ?? null,
          rpe: lastSet?.rpe ?? null,
          power: lastSet?.power ?? null,
          velocity: lastSet?.velocity ?? null,
          height: lastSet?.height ?? null,
          resistance: lastSet?.resistance ?? null,
          effort: lastSet?.effort ?? null,
          resistance_unit_id: lastSet?.resistance_unit_id ?? null,
          completed: false,
          isEditing: false,
        }

        return { ...ex, sets: [...ex.sets, newSet] }
      })

      saveToHistory(newExercises)
      return newExercises
    })
  }, [saveToHistory])

  // Handle remove set
  const handleRemoveSet = useCallback((exerciseId: number | string, setId: number | string) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const newSets = ex.sets
          .filter(s => s.id !== setId)
          .map((s, i) => ({ ...s, set_index: i + 1 }))

        return { ...ex, sets: newSets }
      })

      saveToHistory(newExercises)
      return newExercises
    })
  }, [saveToHistory])

  // Handle add exercise from library
  const handleAddExercise = useCallback((exercise: { id: string; name: string; category: string }, section: string) => {
    const libraryExercise = exerciseLibrary.find(e => String(e.id) === exercise.id)
    if (!libraryExercise) return

    const maxOrder = Math.max(0, ...exercises.map(e => e.exercise_order))
    const newExercise: SessionPlannerExercise = {
      id: `new-${Date.now()}`,
      session_plan_id: sessionId,
      exercise_id: libraryExercise.id,
      exercise_order: maxOrder + 1,
      notes: null,
      isCollapsed: false,
      isEditing: false,
      validationErrors: [],
      exercise: {
        id: libraryExercise.id,
        name: libraryExercise.name,
        description: libraryExercise.description ?? undefined,
        exercise_type_id: libraryExercise.exercise_type_id ?? undefined,
        exercise_type: {
          type: libraryExercise.category || 'other'
        }
      },
      sets: [{
        id: `new-set-${Date.now()}`,
        session_plan_exercise_id: 0,
        set_index: 1,
        reps: null,
        weight: null,
        distance: null,
        performing_time: null,
        rest_time: null,
        tempo: null,
        rpe: null,
        completed: false,
        isEditing: false,
      }]
    }

    const newExercises = [...exercises, newExercise]
    setExercises(newExercises)
    saveToHistory(newExercises)

    // Expand the new exercise
    setExpandedIds(prev => new Set([...prev, newExercise.id]))
  }, [exercises, exerciseLibrary, sessionId, saveToHistory])

  // Handle remove exercise
  const handleRemoveExercise = useCallback((exerciseId: number | string) => {
    const newExercises = exercises.filter(e => e.id !== exerciseId)
    setExercises(newExercises)
    saveToHistory(newExercises)
  }, [exercises, saveToHistory])

  // Handle update exercise name
  const handleUpdateExerciseName = useCallback((exerciseId: number | string, name: string) => {
    setExercises(prev => {
      const newExercises = prev.map(ex =>
        ex.id === exerciseId && ex.exercise
          ? { ...ex, exercise: { ...ex.exercise, name } }
          : ex
      )
      // Don't save to history for name changes (too granular)
      return newExercises
    })
    setHasUnsavedChanges(true)
  }, [])

  // Handle reorder sets
  const handleReorderSets = useCallback((exerciseId: number | string, fromIndex: number, toIndex: number) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const newSets = [...ex.sets]
        const [moved] = newSets.splice(fromIndex, 1)
        newSets.splice(toIndex, 0, moved)

        return {
          ...ex,
          sets: newSets.map((s, i) => ({ ...s, set_index: i + 1 }))
        }
      })

      saveToHistory(newExercises)
      return newExercises
    })
  }, [saveToHistory])

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      // Convert exercises to format expected by save action
      const exercisesToSave = exercises.map(ex => ({
        ...ex,
        id: String(ex.id), // Ensure id is string for save action
      }))

      const result = await saveSessionWithExercisesAction(
        sessionId,
        {
          name: initialSession.name,
          description: initialSession.description,
          date: initialSession.date,
          week: initialSession.week,
          day: initialSession.day,
          session_mode: initialSession.session_mode,
        },
        exercisesToSave as any // Cast to satisfy type - runtime compatible
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      setHasUnsavedChanges(false)
      toast({
        title: "Session Saved",
        description: "Your session plan has been saved successfully."
      })
    } catch (error) {
      console.error('[SessionPlannerV2] Save failed:', error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save session",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, initialSession, exercises, toast])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setDiscardConfirmOpen(true)
    } else {
      router.push(`/plans/${planId}`)
    }
  }, [hasUnsavedChanges, router, planId])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with back, undo/redo, save */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main workout view (coach mode) */}
      <div className="flex-1 overflow-auto">
        <WorkoutView
          title={initialSession.name}
          description={initialSession.description || undefined}
          exercises={trainingExercises}
          isAthlete={false}
          sessionStatus="ongoing"
          exerciseLibrary={exerciseLibraryItems}
          onToggleExpand={handleToggleExpand}
          onCompleteSet={() => {}} // No completion in coach mode
          onUpdateSet={handleUpdateSet}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onUpdateExerciseName={handleUpdateExerciseName}
          onReorderSets={handleReorderSets}
          onFinishSession={handleSave}
          onSaveSession={handleSave}
        />
      </div>

      {/* Discard confirmation dialog */}
      <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/plans/${planId}`)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
