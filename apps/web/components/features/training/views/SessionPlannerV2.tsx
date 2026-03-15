"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Undo2, Redo2, Save, Edit2, Calendar, Check, X, Copy, FolderOpen, Loader2, Search, MoreHorizontal, ClipboardPaste } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Import subgroup filtering hook
import { useSubgroupsForGroup } from "../hooks/use-session-planner-queries"

// Import shadcn Select for preview dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Import save action
import { saveSessionWithExercisesAction } from "@/actions/plans/session-planner-actions"

// Import AI change detection hook
import { useAIExerciseChanges } from "@/components/features/ai-assistant/hooks"

// Import shared exercises context
import { useSessionExercises } from "../context"

// Import template actions
import {
  saveAsTemplateAction,
  getTemplatesAction,
  insertTemplateExercisesAction,
} from "@/actions/plans/session-plan-actions"

// Import session fetch for refreshing after template insert
import { getSessionPlanByIdAction } from "@/actions/library/exercise-actions"
import type { CreateSessionPlanForm } from "@/actions/plans/session-plan-actions"

// Import Dialog and Sheet for template features
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// Import subgroup formatting utilities
import { formatSubgroupChip } from "@/lib/training-utils"
import { SubgroupBadge } from "@/components/features/athletes/components/subgroup-badge"

// Import Paste Program dialog and types
import { PasteProgramDialog, type ResolvedExercise } from "../components/PasteProgramDialog"

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
    target_subgroups?: string[] | null
  }
  exerciseLibrary: ExerciseLibraryItem[]
  /** Athlete group ID for subgroup filtering (from microcycle) */
  groupId?: number | null
  /**
   * T054: Whether to show advanced fields (RPE, tempo, velocity, effort)
   * Passed down to WorkoutView -> ExerciseCard -> SetRow.
   * @default true
   */
  showAdvancedFields?: boolean
  className?: string
}

export function SessionPlannerV2({
  planId,
  sessionId,
  initialSession,
  exerciseLibrary,
  groupId,
  showAdvancedFields = true,
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
    reset,
  } = useSessionExercises()

  // Local UI state
  const [isSaving, setIsSaving] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  // Counter for generating unique IDs (prevents race condition with Date.now())
  const idCounterRef = useRef(0)

  // Subgroup preview state (T018)
  const [previewGroup, setPreviewGroup] = useState<string | null>(null)
  const { data: subgroups } = useSubgroupsForGroup(groupId)

  // Session-level subgroup tags (coach-set, independent from exercise tags)
  const [sessionSubgroups, setSessionSubgroups] = useState<string[] | null>(
    initialSession.target_subgroups ?? null
  )

  // Session metadata editing state
  const [sessionName, setSessionName] = useState(initialSession.name)
  const [sessionDescription, setSessionDescription] = useState(initialSession.description || '')
  const [sessionDate, setSessionDate] = useState(initialSession.date || '')
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingDate, setEditingDate] = useState('')

  // Save as Template state (T034)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Insert from Template state (T035)
  const [insertTemplateOpen, setInsertTemplateOpen] = useState(false)
  const [templates, setTemplates] = useState<Array<{
    id: string
    name: string
    description?: string | null
    session_plan_exercises?: Array<{
      id?: string
      exercise_id?: number
      target_subgroups?: string[] | null
      exercise?: { name?: string } | null
      [key: string]: unknown
    }>
  }>>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [isInsertingTemplate, setIsInsertingTemplate] = useState(false)
  // Per-template subgroup override selections: templateId -> override value
  const [templateSubgroupOverrides, setTemplateSubgroupOverrides] = useState<Record<string, string>>({})

  // Paste Program state
  const [pasteProgramOpen, setPasteProgramOpen] = useState(false)

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
    // Generate unique ID using counter + timestamp to prevent collisions
    const uniqueId = `new_set_${Date.now()}_${++idCounterRef.current}`

    setExercises(prev => {
      return prev.map(ex => {
        if (ex.id !== exerciseId) return ex

        const lastSet = ex.sets[ex.sets.length - 1]
        const newSetIndex = ex.sets.length + 1
        const newSet = {
          id: uniqueId,
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

    // Generate unique IDs using counter + timestamp to prevent collisions
    const counter = ++idCounterRef.current
    const timestamp = Date.now()
    const newExerciseId = `new_${timestamp}_${counter}`
    const newSetId = `new_set_${timestamp}_${counter}`

    setExercises(prev => {
      const maxOrder = Math.max(0, ...prev.map(e => e.exercise_order))
      const newExercise: SessionPlannerExercise = {
        id: newExerciseId, // Use new_ prefix for consistency with save action
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
          id: newSetId,
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
      title: "Exercise added",
      description: `${exercise.name} has been added to the session.`
    })
  }, [sessionId, setExercises, toast])

  // Handle update target subgroups (subgroup filtering)
  const handleUpdateTargetSubgroups = useCallback((exerciseId: number | string, groups: string[] | null) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, target_subgroups: groups } : ex
    ))
  }, [setExercises])

  // Handle update notes
  const handleUpdateNotes = useCallback((exerciseId: number | string, notes: string | null) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, notes } : ex
    ))
  }, [setExercises])

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
      title: "Superset created",
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
      title: "Superset unlinked",
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

      // Merge coach-set session tags with exercise-level tags for RLS
      const exerciseDerivedGroups = exercisesToSave
        .flatMap(ex => (ex as any).target_subgroups ?? [])
        .filter((g: string) => !!g)
      const mergedSessionTags = [...new Set([
        ...(sessionSubgroups ?? []),
        ...exerciseDerivedGroups,
      ])] as string[]

      const result = await saveSessionWithExercisesAction(
        sessionId,
        {
          name: sessionName,
          description: sessionDescription || null,
          date: sessionDate || null,
          week: initialSession.week,
          day: initialSession.day,
          session_mode: initialSession.session_mode,
          target_subgroups: mergedSessionTags.length > 0 ? mergedSessionTags : null,
        },
        exercisesToSave as any // Cast to satisfy type - runtime compatible
      )

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      markAsSaved()
      toast({
        title: "Session saved",
        description: "Your session plan has been saved successfully."
      })
    } catch (error) {
      console.error('[SessionPlannerV2] Save failed:', error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save session",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, initialSession, exercises, sessionSubgroups, markAsSaved, toast])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setDiscardConfirmOpen(true)
    } else {
      router.push(`/plans/${planId}`)
    }
  }, [hasUnsavedChanges, router, planId])

  // T034: Save as Template handler
  const handleOpenSaveTemplate = useCallback(() => {
    setTemplateName(sessionName)
    setTemplateDescription(sessionDescription)
    setSaveTemplateOpen(true)
  }, [sessionName, sessionDescription])

  const handleSaveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) return

    setIsSavingTemplate(true)
    try {
      const planData: CreateSessionPlanForm = {
        name: templateName,
        sessions: [{
          id: sessionId,
          name: templateName,
          description: templateDescription || '',
          day: initialSession.day ?? 1,
          week: initialSession.week ?? 1,
          exercises: exercises.map((ex) => ({
            id: String(ex.id),
            exerciseId: ex.exercise_id,
            order: ex.exercise_order,
            supersetId: ex.superset_id ?? undefined,
            sets: ex.sets.map((s) => ({
              setIndex: s.set_index,
              reps: s.reps ?? undefined,
              weight: s.weight ?? undefined,
              distance: s.distance ?? undefined,
              performing_time: s.performing_time ?? undefined,
              rest_time: s.rest_time ?? undefined,
              rpe: s.rpe ?? undefined,
              tempo: s.tempo ?? undefined,
              effort: s.effort ?? undefined,
            })),
            notes: ex.notes || '',
            restTime: 0,
          })),
          estimatedDuration: 60,
          focus: [],
          notes: '',
        }],
      }

      const result = await saveAsTemplateAction(planData, templateName, templateDescription || undefined)

      if (result.isSuccess) {
        toast({
          title: "Template saved",
          description: `"${templateName}" saved as a template.`,
        })
        setSaveTemplateOpen(false)
      } else {
        toast({
          title: "Save failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('[SessionPlannerV2] Save template failed:', error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setIsSavingTemplate(false)
    }
  }, [templateName, templateDescription, sessionId, initialSession, exercises, toast])

  // T035: Insert from Template handler
  const handleOpenInsertTemplate = useCallback(async () => {
    setInsertTemplateOpen(true)
    setIsLoadingTemplates(true)
    setTemplateSearch('')
    setTemplateSubgroupOverrides({})

    const result = await getTemplatesAction()

    if (result.isSuccess) {
      setTemplates(result.data as typeof templates)
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }

    setIsLoadingTemplates(false)
  }, [toast])

  const handleInsertTemplate = useCallback(async (templateId: string) => {
    // Close dialog immediately for instant feedback
    setInsertTemplateOpen(false)
    setIsInsertingTemplate(true)

    // Resolve subgroup override for this template
    const overrideValue = templateSubgroupOverrides[templateId]
    let subgroupOverride: { type: 'keep' | 'all' | 'specific'; value?: string } | undefined
    if (overrideValue === '__all__') {
      subgroupOverride = { type: 'all' }
    } else if (overrideValue && overrideValue !== '__keep__') {
      subgroupOverride = { type: 'specific', value: overrideValue }
    }
    // undefined or '__keep__' means keep original (no override param)

    const result = await insertTemplateExercisesAction(templateId, sessionId, subgroupOverride)

    if (result.isSuccess) {
      // Refetch session data and reset context (router.refresh doesn't sync useState)
      const sessionResult = await getSessionPlanByIdAction(sessionId)
      if (sessionResult.isSuccess && sessionResult.data) {
        const freshExercises: SessionPlannerExercise[] = (sessionResult.data.session_plan_exercises || []).map((rec: any) => ({
          id: String(rec.id),
          session_plan_id: rec.session_plan_id,
          exercise_id: rec.exercise_id,
          exercise_order: rec.exercise_order,
          superset_id: rec.superset_id,
          notes: rec.notes,
          target_subgroups: rec.target_subgroups ?? null,
          exercise: rec.exercise ? {
            id: rec.exercise.id,
            name: rec.exercise.name,
            description: rec.exercise.description,
            exercise_type_id: rec.exercise.exercise_type_id,
            video_url: rec.exercise.video_url,
          } : null,
          sets: (rec.session_plan_sets || []).map((s: any) => ({
            id: s.id,
            session_plan_exercise_id: s.session_plan_exercise_id,
            set_index: s.set_index,
            reps: s.reps,
            weight: s.weight,
            distance: s.distance,
            performing_time: s.performing_time,
            rest_time: s.rest_time,
            tempo: s.tempo,
            rpe: s.rpe,
            resistance_unit_id: s.resistance_unit_id,
            power: s.power,
            velocity: s.velocity,
            effort: s.effort != null ? s.effort * 100 : null,
            height: s.height,
            resistance: s.resistance,
            completed: false,
            isEditing: false,
          })),
          isCollapsed: false,
          validationErrors: [],
          isEditing: false,
        }))
        reset(freshExercises)
      }

      toast({
        title: "Template inserted",
        description: result.message,
      })
    } else {
      toast({
        title: "Insert failed",
        description: result.message,
        variant: "destructive",
      })
    }

    setIsInsertingTemplate(false)
  }, [sessionId, toast, reset, templateSubgroupOverrides])

  // Handle resolved exercises from Paste Program dialog
  const handlePasteExercisesResolved = useCallback((resolved: ResolvedExercise[]) => {
    setExercises(prev => {
      const maxOrder = Math.max(0, ...prev.map(e => e.exercise_order))
      const timestamp = Date.now()

      const newExercises: SessionPlannerExercise[] = resolved.map((ex, idx) => {
        const counter = ++idCounterRef.current
        const newExerciseId = `new_${timestamp}_paste_${counter}`

        const sets = ex.sets.map((s, sIdx) => ({
          id: `new_set_${timestamp}_paste_${counter}_${sIdx}`,
          session_plan_exercise_id: '',
          set_index: sIdx + 1,
          reps: s.reps ?? null,
          weight: s.weight ?? null,
          distance: s.distance ?? null,
          performing_time: s.performing_time ?? null,
          rest_time: s.rest_time ?? null,
          tempo: null as string | null,
          rpe: s.rpe ?? null,
          completed: false,
          isEditing: false,
        }))

        // Ensure at least one empty set if parsing produced none
        if (sets.length === 0) {
          sets.push({
            id: `new_set_${timestamp}_paste_${counter}_0`,
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
          })
        }

        return {
          id: newExerciseId,
          session_plan_id: sessionId,
          exercise_id: ex.resolvedExerciseId,
          exercise_order: maxOrder + idx + 1,
          notes: ex.notes || null,
          isCollapsed: false,
          isEditing: false,
          validationErrors: [],
          exercise: {
            id: ex.resolvedExerciseId,
            name: ex.resolvedExerciseName,
            description: undefined,
            exercise_type_id: ex.resolvedExerciseTypeId ?? undefined,
            exercise_type: {
              type: ex.resolvedExerciseType || 'other'
            }
          },
          target_subgroups: ex.targetSubgroups?.length ? ex.targetSubgroups : undefined,
          sets,
        } satisfies SessionPlannerExercise
      })

      return [...prev, ...newExercises]
    })

    const matchedCount = resolved.filter(e => e.resolutionType === "matched").length
    const createdCount = resolved.filter(e => e.resolutionType === "created").length

    const parts: string[] = [`${resolved.length} exercise${resolved.length !== 1 ? "s" : ""} added`]
    if (matchedCount > 0) parts.push(`${matchedCount} from library`)
    if (createdCount > 0) parts.push(`${createdCount} newly created`)

    toast({
      title: "Exercises imported",
      description: parts.join(", ") + ".",
    })
  }, [sessionId, setExercises, toast])

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return templates
    const search = templateSearch.toLowerCase()
    return templates.filter((t) =>
      t.name.toLowerCase().includes(search) ||
      (t.description && t.description.toLowerCase().includes(search))
    )
  }, [templates, templateSearch])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with back, undo/redo, save */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="px-2"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="px-2"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <MoreHorizontal className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPasteProgramOpen(true)}>
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Paste Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenInsertTemplate}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Insert from Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenSaveTemplate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Save as Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-4 w-px bg-border hidden sm:block" />

            {hasUnsavedChanges && (
              <>
                {/* Mobile: colored dot indicator */}
                <span className="sm:hidden w-2 h-2 rounded-full bg-amber-500" />
                {/* Desktop: text label */}
                <span className="hidden sm:inline text-xs text-muted-foreground">Unsaved changes</span>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
              className="px-2 sm:px-3"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
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

        {/* Session-level subgroup tags + preview dropdown */}
        {subgroups && subgroups.length > 0 && (
          <div className="px-4 pb-2 flex items-center gap-3 flex-wrap">
            {/* Session-level tags: which groups see this session */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Session</span>
              <SubgroupBadge
                value="All"
                interactive
                size="sm"
                variant="filter"
                active={!sessionSubgroups || sessionSubgroups.length === 0}
                onClick={() => { setSessionSubgroups(null); markAsUnsaved() }}
              />
              {subgroups.map(sg => (
                <SubgroupBadge
                  key={sg}
                  value={sg}
                  interactive
                  size="sm"
                  variant="filter"
                  active={sessionSubgroups?.includes(sg) ?? false}
                  onClick={() => {
                    setSessionSubgroups(prev => {
                      const current = prev ?? []
                      const next = current.includes(sg)
                        ? current.filter(g => g !== sg)
                        : [...current, sg]
                      return next.length === 0 ? null : next
                    })
                    markAsUnsaved()
                  }}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            {/* Preview dropdown: dim exercises not matching selected group */}
            <Select
              value={previewGroup ?? '__all__'}
              onValueChange={(val) => setPreviewGroup(val === '__all__' ? null : val)}
            >
              <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
                <SelectValue placeholder="Preview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Preview: All</SelectItem>
                {subgroups.map((group) => (
                  <SelectItem key={group} value={group}>Preview: {group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
          showAdvancedFields={showAdvancedFields}
          previewGroup={previewGroup}
          availableSubgroups={subgroups}
          onUpdateTargetSubgroups={handleUpdateTargetSubgroups}
          onToggleExpand={handleToggleExpand}
          onCompleteSet={() => {}} // No completion in coach mode
          onUpdateSet={handleUpdateSet}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onUpdateNotes={handleUpdateNotes}
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

      {/* T034: Save as Template dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save these exercises as a reusable template block.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              autoFocus
            />
            <Textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate || !templateName.trim()}
              size="sm"
            >
              {isSavingTemplate && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSavingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste Program dialog */}
      <PasteProgramDialog
        open={pasteProgramOpen}
        onOpenChange={setPasteProgramOpen}
        onExercisesResolved={handlePasteExercisesResolved}
      />

      {/* T035: Insert from Template sheet */}
      <Sheet open={insertTemplateOpen} onOpenChange={setInsertTemplateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Insert from Template</SheetTitle>
            <SheetDescription>
              Select a template to insert its exercises into this session.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-9"
              />
            </div>

            {/* Template list */}
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {templateSearch ? "No templates match your search." : "No templates yet. Save exercises as a template from any session."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => {
                  const exercises = template.session_plan_exercises ?? []
                  const exerciseCount = exercises.length
                  const previewExercises = exercises.slice(0, 4)
                  const remainingCount = exerciseCount - previewExercises.length
                  const overrideValue = templateSubgroupOverrides[template.id] ?? '__keep__'

                  return (
                    <div
                      key={template.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-2"
                    >
                      {/* Template header */}
                      <div>
                        <p className="text-sm font-medium truncate">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Exercise preview list */}
                      {previewExercises.length > 0 && (
                        <div className="space-y-0.5 pl-1">
                          {previewExercises.map((ex, idx) => {
                            const exName = ex.exercise && typeof ex.exercise === 'object' && 'name' in ex.exercise
                              ? (ex.exercise as { name?: string }).name
                              : undefined
                            const groups = ex.target_subgroups as string[] | null | undefined
                            const chipLabel = formatSubgroupChip(groups ?? null)

                            return (
                              <div key={ex.id ?? idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="truncate">{exName || `Exercise ${idx + 1}`}</span>
                                {chipLabel ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground/70 shrink-0">
                                    {chipLabel}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground shrink-0">
                                    ALL
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {remainingCount > 0 && (
                            <p className="text-[10px] text-muted-foreground/60 pl-0.5">
                              +{remainingCount} more
                            </p>
                          )}
                        </div>
                      )}

                      {/* Subgroup override + Insert button */}
                      <div className="flex items-center gap-2">
                        {subgroups && subgroups.length > 0 && (
                          <Select
                            value={overrideValue}
                            onValueChange={(val) =>
                              setTemplateSubgroupOverrides(prev => ({ ...prev, [template.id]: val }))
                            }
                          >
                            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                              <SelectValue placeholder="Keep original" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__keep__">Keep original</SelectItem>
                              <SelectItem value="__all__">All Athletes</SelectItem>
                              {subgroups.map((group) => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInsertTemplate(template.id)}
                          disabled={isInsertingTemplate}
                          className="shrink-0"
                        >
                          {isInsertingTemplate ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Insert"
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
