"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Undo2, Redo2, Save, Edit2, Calendar, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import type { TrainingSet, ExerciseLibraryItem } from "../types"
import { WorkoutView } from "./WorkoutView"
import {
  sessionExercisesToTraining,
  type SessionPlannerExercise
} from "../adapters/session-adapter"

// Import save action
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

// Import AI change detection hook
import { useAIExerciseChanges } from "@/components/features/ai-assistant/hooks"

// Import shared exercises context
import { useSessionExercises } from "../context"

interface SessionPlannerV2Props {
  planId: string
  sessionId: string
  initialSession: {
    id: string
    name: string
    description?: string | null
    date?: string | null
    week?: number | null
    day?: number | null
    session_mode?: string | null
  }
  exerciseLibrary: ExerciseLibraryItem[]
  className?: string
}

export function SessionPlannerV2({
  planId,
  sessionId,
  initialSession,
  exerciseLibrary,
  className,
}: SessionPlannerV2Props) {
  const router = useRouter()
  const { toast } = useToast()

  // Use shared exercises context (single source of truth)
  const {
    exercises,
    setExercises,
    hasUnsavedChanges,
    markAsSaved,
    markAsUnsaved,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useSessionExercises()

  // Local UI state
  const [isSaving, setIsSaving] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  // Session metadata editing state
  const [sessionName, setSessionName] = useState(initialSession.name)
  const [sessionDescription, setSessionDescription] = useState(initialSession.description || '')
  const [sessionDate, setSessionDate] = useState(initialSession.date || '')
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingDate, setEditingDate] = useState('')

  // Start editing session metadata
  const startEditingMeta = useCallback(() => {
    setEditingName(sessionName)
    setEditingDescription(sessionDescription)
    setEditingDate(sessionDate)
    setIsEditingMeta(true)
  }, [sessionName, sessionDescription, sessionDate])

  // Save session metadata edits
  const saveMetaEdits = useCallback(() => {
    setSessionName(editingName)
    setSessionDescription(editingDescription)
    setSessionDate(editingDate)
    setIsEditingMeta(false)
    markAsUnsaved()
  }, [editingName, editingDescription, editingDate, markAsUnsaved])

  // Cancel session metadata edits
  const cancelMetaEdits = useCallback(() => {
    setIsEditingMeta(false)
  }, [])

  // Convert to training exercises for rendering
  const trainingExercises = useMemo(() => {
    return sessionExercisesToTraining(exercises)
  }, [exercises])

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

  // Get AI change indicators for exercises (safe outside ChangeSetProvider)
  const aiChangesByExercise = useAIExerciseChanges()

  // Handle toggle expand - updates isCollapsed on the exercise (doesn't count as unsaved change)
  const handleToggleExpand = useCallback((exerciseId: number | string) => {
    // Direct state update for UI-only change (no history)
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, isCollapsed: !ex.isCollapsed } : ex
    ))
  }, [setExercises])

  // Handle update set (coach mode - update planned values)
  const handleUpdateSet = useCallback((
    exerciseId: number | string,
    setId: number | string,
    field: keyof TrainingSet,
    value: number | string | null
  ) => {
    setExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const dbField = field === 'performingTime' ? 'performing_time'
          : field === 'restTime' ? 'rest_time'
            : field

        const newSets = ex.sets.map(set =>
          set.id === setId ? { ...set, [dbField]: value } : set
        )

        return { ...ex, sets: newSets }
      })
    })
  }, [setExercises])

  // Handle add set
  const handleAddSet = useCallback((exerciseId: number | string) => {
    setExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const lastSet = ex.sets[ex.sets.length - 1]
        const newSetIndex = ex.sets.length + 1
        const newSet = {
          id: `new_set_${Date.now()}`,
          session_plan_exercise_id: String(ex.id),
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
    })
  }, [setExercises])

  // Handle remove set
  const handleRemoveSet = useCallback((exerciseId: number | string, setId: number | string) => {
    setExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const newSets = ex.sets
          .filter(s => s.id !== setId)
          .map((s, i) => ({ ...s, set_index: i + 1 }))

        return { ...ex, sets: newSets }
      })
    })
  }, [setExercises])

  // Handle add exercise from library/picker
  // The exercise data comes directly from the picker with full details
  const handleAddExercise = useCallback((exercise: ExerciseLibraryItem, section: string) => {
    const exerciseId = parseInt(exercise.id, 10)
    if (isNaN(exerciseId)) {
      console.error('[SessionPlannerV2] Invalid exercise ID:', exercise.id)
      toast({
        title: "Error",
        description: "Invalid exercise selected. Please try again.",
        variant: "destructive"
      })
      return
    }

    setExercises(prev => {
      const maxOrder = Math.max(0, ...prev.map(e => e.exercise_order))
      const timestamp = Date.now()
      const newExercise: SessionPlannerExercise = {
        id: `new_${timestamp}`, // Use new_ prefix for consistency with save action
        session_plan_id: sessionId,
        exercise_id: exerciseId,
        exercise_order: maxOrder + 1,
        notes: null,
        isCollapsed: false,
        isEditing: false,
        validationErrors: [],
        exercise: {
          id: exerciseId,
          name: exercise.name,
          description: undefined,
          exercise_type_id: exercise.exerciseTypeId,
          exercise_type: {
            type: section || exercise.category || 'other'
          }
        },
        sets: [{
          id: `new_set_${timestamp}`,
          session_plan_exercise_id: '',
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

      return [...prev, newExercise]
    })

    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to the session.`
    })
  }, [sessionId, setExercises, toast])

  // Handle remove exercise
  const handleRemoveExercise = useCallback((exerciseId: number | string) => {
    setExercises(prev => {
      // Filter out the exercise by ID (handle both number and string IDs)
      const newExercises = prev.filter(e => String(e.id) !== String(exerciseId))

      // Update exercise_order for remaining exercises
      return newExercises.map((ex, i) => ({
        ...ex,
        exercise_order: i + 1,
      }))
    })
  }, [setExercises])

  // Handle reorder sets
  const handleReorderSets = useCallback((exerciseId: number | string, fromIndex: number, toIndex: number) => {
    setExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const newSets = [...ex.sets]
        const [moved] = newSets.splice(fromIndex, 1)
        newSets.splice(toIndex, 0, moved)

        return {
          ...ex,
          sets: newSets.map((s, i) => ({ ...s, set_index: i + 1 }))
        }
      })
    })
  }, [setExercises])

  // Handle reorder exercises (drag and drop)
  const handleReorderExercises = useCallback((fromId: number | string, toId: number | string) => {
    setExercises(prev => {
      // Find the source and target indices
      const fromIndex = prev.findIndex(e => e.id === fromId)
      const toIndex = prev.findIndex(e => e.id === toId)

      if (fromIndex === -1 || toIndex === -1) return prev

      // Create a new array and move the exercise
      const newExercises = [...prev]
      const [moved] = newExercises.splice(fromIndex, 1)
      newExercises.splice(toIndex, 0, moved)

      // Update exercise_order for all exercises
      return newExercises.map((ex, i) => ({
        ...ex,
        exercise_order: i + 1,
      }))
    })
  }, [setExercises])

  // Create superset from selected exercises with sequential ID
  const handleCreateSuperset = useCallback((exerciseIds: (string | number)[]) => {
    setExercises(prev => {
      // Get all existing superset IDs to find next sequential ID
      const existingIds = new Set(
        prev
          .filter(ex => ex.superset_id != null)
          .map(ex => parseInt(ex.superset_id as string, 10))
          .filter(id => !isNaN(id))
      )

      // Find next available sequential ID (1, 2, 3, ...)
      let nextId = 1
      while (existingIds.has(nextId)) {
        nextId++
      }

      // Assign superset_id as string to selected exercises
      const supersetIdStr = String(nextId)
      return prev.map(ex =>
        exerciseIds.includes(ex.id) ? { ...ex, superset_id: supersetIdStr } : ex
      )
    })

    toast({
      title: "Superset Created",
      description: `${exerciseIds.length} exercises linked as a superset.`
    })
  }, [setExercises, toast])

  // Reindex superset IDs to sequential integers (1, 2, 3, ...)
  const reindexSupersets = useCallback((exercises: SessionPlannerExercise[]): SessionPlannerExercise[] => {
    const supersetMapping = new Map<string, number>()
    let nextId = 1

    // First pass: create mapping from old IDs to new sequential IDs
    exercises.forEach(ex => {
      if (ex.superset_id && !supersetMapping.has(ex.superset_id)) {
        supersetMapping.set(ex.superset_id, nextId++)
      }
    })

    // Second pass: apply new IDs
    return exercises.map(ex => {
      if (!ex.superset_id) return ex
      const newId = supersetMapping.get(ex.superset_id)
      return newId ? { ...ex, superset_id: String(newId) } : ex
    })
  }, [])

  // Unlink superset (clear superset_id for all exercises in it) and reindex remaining
  const handleUnlinkSuperset = useCallback((supersetId: string) => {
    setExercises(prev => {
      // First, clear the superset_id for exercises in this superset
      const withUnlinked = prev.map(ex =>
        ex.superset_id === supersetId ? { ...ex, superset_id: null } : ex
      )
      // Then reindex remaining supersets to keep sequential IDs
      return reindexSupersets(withUnlinked)
    })

    toast({
      title: "Superset Unlinked",
      description: "Exercises are now separate."
    })
  }, [setExercises, reindexSupersets, toast])

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
          name: sessionName,
          description: sessionDescription || null,
          date: sessionDate || null,
          week: initialSession.week,
          day: initialSession.day,
          session_mode: initialSession.session_mode,
        },
        exercisesToSave as any // Cast to satisfy type - runtime compatible
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      markAsSaved()
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
  }, [sessionId, initialSession, exercises, markAsSaved, toast])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setDiscardConfirmOpen(true)
    } else {
      router.push(`/plans/${planId}`)
    }
  }, [hasUnsavedChanges, router, planId])

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
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
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

        {/* Session Metadata - Editable */}
        <div className="px-4 pb-3">
          {isEditingMeta ? (
            <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Session name"
                  className="flex-1 font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={saveMetaEdits}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelMetaEdits}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Session description (optional)"
                className="text-sm min-h-[60px]"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={editingDate}
                  onChange={(e) => setEditingDate(e.target.value)}
                  className="w-auto text-sm"
                />
              </div>
            </div>
          ) : (
            <div
              className="flex items-start justify-between gap-2 cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded-lg transition-colors"
              onClick={startEditingMeta}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold truncate">{sessionName}</h1>
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </div>
                {sessionDescription && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{sessionDescription}</p>
                )}
                {sessionDate && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(sessionDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main workout view (coach mode) - title/description handled above */}
      <div className="flex-1 overflow-auto">
        <WorkoutView
          title=""
          description=""
          sessionDate={sessionDate || undefined}
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
          onReorderSets={handleReorderSets}
          onReorderExercises={handleReorderExercises}
          onFinishSession={handleSave}
          onSaveSession={handleSave}
          onCreateSuperset={handleCreateSuperset}
          onUnlinkSuperset={handleUnlinkSuperset}
          aiChangesByExercise={aiChangesByExercise}
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
