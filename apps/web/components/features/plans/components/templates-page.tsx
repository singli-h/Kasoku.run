/*
<ai_context>
Template management page component for coaches and individual users.
Displays saved session templates in a searchable grid with name, description,
exercise count, creation date, and actions (view, edit, delete, duplicate).
Includes a "New Template" flow with exercise picker from the library.
Template detail sheet for viewing/editing exercises and sets.
Uses unified ExerciseCard component (same as plan/workout views).
</ai_context>
*/

"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  Search,
  Trash2,
  Dumbbell,
  Calendar,
  MoreHorizontal,
  Copy,
  Plus,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ExerciseCard } from "@/components/features/training/components/ExerciseCard"
import type { TrainingExercise, TrainingSet } from "@/components/features/training/types"
import { dbPlanSetToTrainingSet } from "@/components/features/training/types"
import { PasteProgramDialog, type ResolvedExercise } from "@/components/features/training/components/PasteProgramDialog"
import AnimatedGradientText from "@/components/composed/animated-gradient-text"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import { useToast } from "@/hooks/use-toast"

import { deleteTemplateAction, createTemplateAction, updateTemplateAction, duplicateTemplateAction, getTemplatesAction } from "@/actions/plans/session-plan-actions"
import { useExerciseSearch } from "@/components/features/training/hooks/useExerciseSearch"
import type { ExerciseWithDetails, SessionPlanWithDetails } from "@/types/training"

// ============================================================================
// Helpers
// ============================================================================

const EXERCISE_TYPE_SECTION: Record<number, string> = {
  1: 'Isometric',
  2: 'Plyometric',
  3: 'Gym',
  4: 'Warmup',
  5: 'Circuit',
  6: 'Sprint',
  7: 'Drill',
  8: 'Mobility',
  9: 'Recovery',
}

function sectionFromTypeId(typeId?: number): string {
  return typeId ? (EXERCISE_TYPE_SECTION[typeId] ?? 'Gym') : 'Gym'
}

/** Convert DB session_plan_exercises to TrainingExercise[] */
function dbExercisesToTraining(exercises: SessionPlanWithDetails['session_plan_exercises']): TrainingExercise[] {
  return (exercises || [])
    .filter(e => e.exercise_id != null)
    .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
    .map((e, idx) => {
      const typeId = (e.exercise as any)?.exercise_type?.id ?? (e.exercise as any)?.exercise_type_id ?? undefined
      const sets = (e.session_plan_sets || []).map(s => dbPlanSetToTrainingSet(s as any))
      return {
        id: `template-${e.exercise_id}-${e.id ?? idx}`,
        exerciseId: e.exercise_id!,
        name: e.exercise?.name || 'Unnamed',
        section: sectionFromTypeId(typeId),
        exerciseOrder: e.exercise_order ?? idx,
        exerciseTypeId: typeId,
        expanded: true,
        sets: sets.length > 0 ? sets : [{
          id: crypto.randomUUID(),
          setIndex: 1,
          completed: false,
        }],
      }
    })
}

/** Convert an ExerciseWithDetails (from search) to a TrainingExercise */
function libraryExerciseToTraining(exercise: ExerciseWithDetails, order: number): TrainingExercise {
  return {
    id: crypto.randomUUID(),
    exerciseId: exercise.id,
    name: exercise.name ?? 'Unnamed',
    section: sectionFromTypeId(exercise.exercise_type?.id ?? undefined),
    exerciseOrder: order,
    exerciseTypeId: exercise.exercise_type?.id ?? undefined,
    expanded: true,
    sets: [{
      id: crypto.randomUUID(),
      setIndex: 1,
      completed: false,
    }],
  }
}

/** Convert ResolvedExercise (from AI parser) to TrainingExercise */
function resolvedToTrainingExercise(resolved: ResolvedExercise, order: number): TrainingExercise {
  return {
    id: crypto.randomUUID(),
    exerciseId: resolved.resolvedExerciseId,
    name: resolved.resolvedExerciseName,
    section: resolved.resolvedExerciseType || 'Gym',
    exerciseOrder: order,
    exerciseTypeId: resolved.resolvedExerciseTypeId ?? undefined,
    expanded: true,
    sets: resolved.sets.map((s, idx) => ({
      id: crypto.randomUUID(),
      setIndex: idx + 1,
      reps: s.reps ?? null,
      weight: s.weight ?? null,
      distance: s.distance ?? null,
      performingTime: s.performing_time ?? null,
      restTime: s.rest_time ?? null,
      rpe: s.rpe ?? null,
      completed: false,
    })),
  }
}

/** Convert TrainingExercise[] to the payload format for create/update actions */
function trainingExercisesToPayload(exercises: TrainingExercise[]) {
  return exercises.map(ex => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.name,
    sets: ex.sets.map(s => ({
      reps: s.reps ?? null,
      weight: s.weight ?? null,
      distance: s.distance ?? null,
      performing_time: s.performingTime ?? null,
      rest_time: s.restTime ?? null,
      rpe: s.rpe ?? null,
      tempo: s.tempo ?? null,
      effort: s.effort != null ? s.effort / 100 : null, // UI (0-100) → DB (0-1)
      power: s.power ?? null,
      velocity: s.velocity ?? null,
      height: s.height ?? null,
      resistance: s.resistance ?? null,
      resistance_unit_id: s.resistanceUnitId ?? null,
      metadata: (s.metadata as Record<string, unknown> | null) ?? null,
    })),
  }))
}

// ============================================================================
// Shared exercise CRUD hooks (operates on TrainingExercise[])
// ============================================================================

function useTemplateExerciseHandlers(
  setExercises: React.Dispatch<React.SetStateAction<TrainingExercise[]>>
) {
  const handleAddSet = useCallback((exerciseId: string | number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      const lastSet = ex.sets[ex.sets.length - 1]
      const newSet: TrainingSet = {
        id: crypto.randomUUID(),
        setIndex: ex.sets.length + 1,
        reps: lastSet?.reps ?? null,
        weight: lastSet?.weight ?? null,
        distance: lastSet?.distance ?? null,
        performingTime: lastSet?.performingTime ?? null,
        restTime: lastSet?.restTime ?? null,
        rpe: lastSet?.rpe ?? null,
        tempo: lastSet?.tempo ?? null,
        effort: lastSet?.effort ?? null,
        power: lastSet?.power ?? null,
        velocity: lastSet?.velocity ?? null,
        height: lastSet?.height ?? null,
        resistance: lastSet?.resistance ?? null,
        resistanceUnitId: lastSet?.resistanceUnitId ?? null,
        completed: false,
      }
      return { ...ex, sets: [...ex.sets, newSet] }
    }))
  }, [setExercises])

  const handleRemoveSet = useCallback((exerciseId: string | number, setId: string | number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId || ex.sets.length <= 1) return ex
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
    }))
  }, [setExercises])

  const handleUpdateSet = useCallback(
    (exerciseId: string | number, setId: string | number, field: keyof TrainingSet, value: number | string | null) => {
      setExercises(prev => prev.map(ex => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
        }
      }))
    },
    [setExercises]
  )

  const handleRemoveExercise = useCallback((exerciseId: string | number) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
  }, [setExercises])

  const handleReorderSets = useCallback((exerciseId: string | number, fromIndex: number, toIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      const newSets = [...ex.sets]
      const [moved] = newSets.splice(fromIndex, 1)
      newSets.splice(toIndex, 0, moved)
      return { ...ex, sets: newSets.map((s, i) => ({ ...s, setIndex: i + 1 })) }
    }))
  }, [setExercises])

  const handleToggleExpand = useCallback((exerciseId: string | number) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, expanded: !ex.expanded } : ex
    ))
  }, [setExercises])

  return {
    handleAddSet,
    handleRemoveSet,
    handleUpdateSet,
    handleRemoveExercise,
    handleReorderSets,
    handleToggleExpand,
  }
}

/** Exercise DnD reorder hook */
function useExerciseDnD(
  setExercises: React.Dispatch<React.SetStateAction<TrainingExercise[]>>
) {
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | number | null>(null)

  const handleExerciseDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleExerciseDrop = useCallback((targetId: string | number) => {
    if (!draggingExerciseId || draggingExerciseId === targetId) return
    setExercises(prev => {
      const fromIdx = prev.findIndex(ex => ex.id === draggingExerciseId)
      const toIdx = prev.findIndex(ex => ex.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next.map((ex, i) => ({ ...ex, exerciseOrder: i }))
    })
    setDraggingExerciseId(null)
  }, [draggingExerciseId, setExercises])

  return {
    draggingExerciseId,
    setDraggingExerciseId,
    handleExerciseDragOver,
    handleExerciseDrop,
  }
}

// ============================================================================
// Exercise Search Combobox (used by TemplateDetailSheet edit mode)
// ============================================================================

interface ExerciseSearchComboboxProps {
  enabled: boolean
  selectedIds: number[]
  onSelect: (exercise: ExerciseWithDetails) => void
}

function ExerciseSearchCombobox({ enabled, selectedIds, onSelect }: ExerciseSearchComboboxProps) {
  const [showResults, setShowResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const {
    searchQuery,
    setSearchQuery,
    exercises: searchResults,
    isLoading: isSearching,
  } = useExerciseSearch({ enabled: enabled && showResults, pageSize: 15 })

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1) }, [searchResults])

  // Click-outside dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((exercise: ExerciseWithDetails) => {
    onSelect(exercise)
    setSearchQuery("")
    setShowResults(false)
    setActiveIndex(-1)
  }, [onSelect, setSearchQuery])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
      setActiveIndex(-1)
      return
    }

    if (!showResults || !searchQuery.trim()) return
    const results = searchResults

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => prev < results.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => prev > 0 ? prev - 1 : results.length - 1)
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
      e.preventDefault()
      const exercise = results[activeIndex]
      if (!selectedIds.includes(exercise.id)) {
        handleSelect(exercise)
      }
    }
  }, [showResults, searchQuery, searchResults, activeIndex, selectedIds, handleSelect])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const isOpen = showResults && !!searchQuery.trim()
  const listboxId = "exercise-search-listbox"
  const activeOptionId = activeIndex >= 0 ? `exercise-option-${activeIndex}` : undefined

  return (
    <div className="relative" ref={containerRef}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search exercises to add..."
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        className="pl-9"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
      />
      {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />}

      {isOpen && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto"
        >
          {searchResults.length === 0 && !isSearching ? (
            <p className="p-3 text-sm text-muted-foreground text-center">No exercises found</p>
          ) : (
            searchResults.map((exercise, index) => {
              const isAdded = selectedIds.includes(exercise.id)
              return (
                <button
                  key={exercise.id}
                  id={`exercise-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => !isAdded && handleSelect(exercise)}
                  disabled={isAdded}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    index === activeIndex ? "bg-accent" : "hover:bg-accent"
                  )}
                >
                  <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{exercise.name}</span>
                  {exercise.exercise_type && (
                    <span className="text-[10px] text-muted-foreground shrink-0">{exercise.exercise_type.type}</span>
                  )}
                  {isAdded ? (
                    <span className="text-[10px] text-muted-foreground shrink-0">Added</span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Exercise List (renders ExerciseCards with DnD)
// ============================================================================

interface ExerciseListProps {
  exercises: TrainingExercise[]
  setExercises: React.Dispatch<React.SetStateAction<TrainingExercise[]>>
  readOnly?: boolean
  showAdvancedFields?: boolean
}

function ExerciseList({ exercises, setExercises, readOnly = false, showAdvancedFields = true }: ExerciseListProps) {
  const {
    handleAddSet,
    handleRemoveSet,
    handleUpdateSet,
    handleRemoveExercise,
    handleReorderSets,
    handleToggleExpand,
  } = useTemplateExerciseHandlers(setExercises)

  const {
    draggingExerciseId,
    setDraggingExerciseId,
    handleExerciseDragOver,
    handleExerciseDrop,
  } = useExerciseDnD(setExercises)

  return (
    <div className="space-y-1">
      {exercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          isAthlete={false}
          showAllFields={showAdvancedFields}
          showAdvancedFields={showAdvancedFields}
          onToggleExpand={() => handleToggleExpand(ex.id)}
          onCompleteSet={() => {}}
          onUpdateSet={readOnly ? undefined : (setId, field, value) => handleUpdateSet(ex.id, setId, field, value)}
          onAddSet={readOnly ? undefined : () => handleAddSet(ex.id)}
          onRemoveSet={readOnly ? undefined : (setId) => handleRemoveSet(ex.id, setId)}
          onRemoveExercise={readOnly ? undefined : () => handleRemoveExercise(ex.id)}
          onReorderSets={readOnly ? undefined : (from, to) => handleReorderSets(ex.id, from, to)}
          isDragging={draggingExerciseId === ex.id}
          onDragStart={readOnly ? undefined : (e) => {
            setDraggingExerciseId(ex.id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={readOnly ? undefined : handleExerciseDragOver}
          onDragEnd={readOnly ? undefined : () => setDraggingExerciseId(null)}
          onDrop={readOnly ? undefined : () => handleExerciseDrop(ex.id)}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

interface TemplatesPageProps {
  initialTemplates: SessionPlanWithDetails[]
}

export function TemplatesPage({ initialTemplates }: TemplatesPageProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<SessionPlanWithDetails[]>(initialTemplates)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [detailTemplate, setDetailTemplate] = useState<SessionPlanWithDetails | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)

  // AI Parser state
  const [pasteProgramOpen, setPasteProgramOpen] = useState(false)

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates
    const term = searchTerm.toLowerCase()
    return templates.filter(t =>
      t.name?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term)
    )
  }, [templates, searchTerm])

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const result = await deleteTemplateAction(templateId)
      if (result.isSuccess) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
        if (detailTemplate?.id === templateId) setDetailTemplate(null)
        toast({ title: "Template deleted", description: result.message })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
    } finally {
      setDeleteTemplateId(null)
    }
  }

  const handleDuplicateTemplate = async (templateId: string) => {
    setIsDuplicating(templateId)
    try {
      const result = await duplicateTemplateAction(templateId)
      if (result.isSuccess) {
        const refreshed = await getTemplatesAction()
        if (refreshed.isSuccess) {
          setTemplates(refreshed.data)
        }
        toast({ title: "Template duplicated", description: result.message })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to duplicate template", variant: "destructive" })
    } finally {
      setIsDuplicating(null)
    }
  }

  const handleTemplateCreated = useCallback((newTemplate: SessionPlanWithDetails) => {
    setTemplates(prev => [newTemplate, ...prev])
    setShowNewDialog(false)
  }, [])

  const handleTemplateUpdated = useCallback((updated: SessionPlanWithDetails) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
    setDetailTemplate(updated)
  }, [])

  const openDetail = useCallback((template: SessionPlanWithDetails) => {
    setDetailTemplate(template)
  }, [])

  // AI Parser: create a new template from parsed exercises
  const handleAIParsedExercises = useCallback((resolved: ResolvedExercise[]) => {
    if (resolved.length === 0) return
    // Convert to TrainingExercise[] and open new template dialog pre-populated
    const trainingExercises = resolved.map((r, i) => resolvedToTrainingExercise(r, i))
    // Open the new template dialog with pre-populated exercises
    setAIParsedForNew(trainingExercises)
    setPasteProgramOpen(false)
    setShowNewDialog(true)
  }, [])

  // State to pass AI-parsed exercises to NewTemplateDialog
  const [aiParsedForNew, setAIParsedForNew] = useState<TrainingExercise[] | null>(null)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Search + New Template + AI Parse */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
          <button
            onClick={() => setPasteProgramOpen(true)}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <AnimatedGradientText className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Sparkles className="h-4 w-4" />
              AI Parse
            </AnimatedGradientText>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Copy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search term"
                : "Create a new template or save exercises from the session planner to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => openDetail(template)}
              onDuplicate={() => handleDuplicateTemplate(template.id)}
              onDelete={() => setDeleteTemplateId(template.id)}
              disabled={isDuplicating === template.id}
            />
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <NewTemplateDialog
        open={showNewDialog}
        onOpenChange={(open) => {
          setShowNewDialog(open)
          if (!open) setAIParsedForNew(null)
        }}
        onCreated={handleTemplateCreated}
        initialExercises={aiParsedForNew}
      />

      {/* Template Detail Sheet */}
      <TemplateDetailSheet
        template={detailTemplate}
        onClose={() => setDetailTemplate(null)}
        onUpdated={handleTemplateUpdated}
        onDelete={(id) => { setDetailTemplate(null); setDeleteTemplateId(id) }}
      />

      {/* AI Parse Dialog */}
      <PasteProgramDialog
        open={pasteProgramOpen}
        onOpenChange={setPasteProgramOpen}
        onExercisesResolved={handleAIParsedExercises}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && handleDeleteTemplate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================================
// Template Detail Sheet (always edit mode, with unsaved changes warning)
// ============================================================================

interface TemplateDetailSheetProps {
  template: SessionPlanWithDetails | null
  onClose: () => void
  onUpdated: (template: SessionPlanWithDetails) => void
  onDelete: (id: string) => void
}

function TemplateDetailSheet({ template, onClose, onUpdated, onDelete }: TemplateDetailSheetProps) {
  const { toast } = useToast()
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editExercises, setEditExercises] = useState<TrainingExercise[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [originalSnapshot, setOriginalSnapshot] = useState("")

  // Field toggle — show all fields by default in coach/template mode
  const [showAllFields, setShowAllFields] = useState(true)

  // Ref to prevent onOpenChange from closing when we want to show the dialog instead
  const blockCloseRef = useRef(false)

  // Populate edit state when template opens
  useEffect(() => {
    if (template) {
      const exercises = dbExercisesToTraining(template.session_plan_exercises)
      setEditName(template.name || "")
      setEditDescription(template.description || "")
      setEditExercises(exercises)
      setOriginalSnapshot(JSON.stringify({
        name: template.name || "",
        desc: template.description || "",
        exercises: exercises.map((e, i) => ({ id: e.exerciseId, order: i, sets: e.sets })),
      }))
    }
  }, [template])

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!template) return false
    const current = JSON.stringify({
      name: editName,
      desc: editDescription,
      exercises: editExercises.map((e, i) => ({ id: e.exerciseId, order: i, sets: e.sets })),
    })
    return current !== originalSnapshot
  }, [editName, editDescription, editExercises, originalSnapshot, template])

  const handleSheetClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedDialog(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  const handleAddExercise = useCallback((exercise: ExerciseWithDetails) => {
    setEditExercises(prev => {
      if (prev.some(e => e.exerciseId === exercise.id)) return prev
      return [...prev, libraryExerciseToTraining(exercise, prev.length)]
    })
  }, [])

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!template || !editName.trim() || editExercises.length === 0) return false
    setIsSaving(true)

    try {
      const result = await updateTemplateAction(template.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        exercises: trainingExercisesToPayload(editExercises),
      })

      if (result.isSuccess) {
        // Re-fetch to get accurate server state
        const refreshed = await getTemplatesAction()
        if (refreshed.isSuccess) {
          const updated = refreshed.data.find(t => t.id === template.id)
          if (updated) {
            const exercises = dbExercisesToTraining(updated.session_plan_exercises)
            setEditExercises(exercises)
            setOriginalSnapshot(JSON.stringify({
              name: updated.name || "",
              desc: updated.description || "",
              exercises: exercises.map((e, i) => ({ id: e.exerciseId, order: i, sets: e.sets })),
            }))
            onUpdated(updated)
          }
        }
        toast({ title: "Template updated", description: `${editExercises.length} exercise${editExercises.length !== 1 ? "s" : ""} saved` })
        return true
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        return false
      }
    } catch {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [template, editName, editDescription, editExercises, onUpdated, toast])

  if (!template) return null

  return (
    <>
      <Sheet
        open={!!template}
        onOpenChange={(open) => {
          if (!open) {
            if (blockCloseRef.current) {
              blockCloseRef.current = false
              return
            }
            handleSheetClose()
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
          onInteractOutside={(e) => {
            if (isDirty) {
              e.preventDefault()
              blockCloseRef.current = true
              setShowUnsavedDialog(true)
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault()
              blockCloseRef.current = true
              setShowUnsavedDialog(true)
            }
          }}
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              Edit Template
            </SheetTitle>
            <SheetDescription>Edit template name, description, and exercises</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-template-name">Name</Label>
                <Input id="edit-template-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Template name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-template-description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="edit-template-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Exercises</Label>
                  <button
                    onClick={() => setShowAllFields(prev => !prev)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                      showAllFields
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title={showAllFields ? "Hide optional fields" : "Show all fields"}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">{showAllFields ? "All" : "Min"}</span>
                  </button>
                </div>
                <ExerciseSearchCombobox
                  enabled={!!template}
                  selectedIds={editExercises.map(e => e.exerciseId)}
                  onSelect={handleAddExercise}
                />
              </div>
              {editExercises.length > 0 ? (
                <ExerciseList
                  exercises={editExercises}
                  setExercises={setEditExercises}
                  showAdvancedFields={showAllFields}
                />
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Search and add exercises above
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-3 flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving || !editName.trim() || editExercises.length === 0}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {editExercises.length} exercise{editExercises.length !== 1 ? "s" : ""}
            </span>
          </div>
        </SheetContent>
      </Sheet>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => { setShowUnsavedDialog(false); onClose() }}>Discard</Button>
            <Button onClick={async () => { const ok = await handleSave(); if (ok) { setShowUnsavedDialog(false); onClose() } else { setShowUnsavedDialog(false) } }}>Save</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================================
// New Template Dialog (exercise picker flow)
// ============================================================================

interface NewTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (template: SessionPlanWithDetails) => void
  initialExercises?: TrainingExercise[] | null
}

function NewTemplateDialog({ open, onOpenChange, onCreated, initialExercises }: NewTemplateDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<TrainingExercise[]>([])

  // Field toggle — show all fields by default in template mode
  const [showAllFields, setShowAllFields] = useState(true)

  const resetState = useCallback(() => {
    setName("")
    setDescription("")
    setIsSaving(false)
    setSelectedExercises([])
  }, [])

  // Populate from AI-parsed exercises when provided
  useEffect(() => {
    if (initialExercises && initialExercises.length > 0) {
      setSelectedExercises(initialExercises)
    }
  }, [initialExercises])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetState]
  )

  const handleAddExercise = useCallback((exercise: ExerciseWithDetails) => {
    setSelectedExercises(prev => {
      if (prev.some(e => e.exerciseId === exercise.id)) return prev
      return [...prev, libraryExerciseToTraining(exercise, prev.length)]
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim() || selectedExercises.length === 0) return

    setIsSaving(true)

    try {
      const result = await createTemplateAction({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: trainingExercisesToPayload(selectedExercises),
      })

      if (result.isSuccess && result.data) {
        // Re-fetch to get accurate server state with nested data
        const refreshed = await getTemplatesAction()
        if (refreshed.isSuccess) {
          const newTemplate = refreshed.data.find(t => t.id === result.data.id)
          if (newTemplate) {
            onCreated(newTemplate)
          }
        }
        toast({
          title: "Template created",
          description: `Template saved with ${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""}`,
        })
        resetState()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }, [name, description, selectedExercises, onCreated, toast, resetState])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Template</DialogTitle>
          <DialogDescription>
            Create a reusable exercise block. Search and add exercises from your library.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Sprint Warm-Up, Strength Block A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="template-description">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Exercise Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <button
                onClick={() => setShowAllFields(prev => !prev)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                  showAllFields
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                title={showAllFields ? "Hide optional fields" : "Show all fields"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{showAllFields ? "All" : "Min"}</span>
              </button>
            </div>
            <ExerciseSearchCombobox
              enabled={open}
              selectedIds={selectedExercises.map(e => e.exerciseId)}
              onSelect={handleAddExercise}
            />
          </div>

          {/* Selected exercises list */}
          {selectedExercises.length > 0 ? (
            <ExerciseList
              exercises={selectedExercises}
              setExercises={setSelectedExercises}
              showAdvancedFields={showAllFields}
            />
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Search and add exercises from your library above
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || selectedExercises.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Template Card
// ============================================================================

interface TemplateCardProps {
  template: SessionPlanWithDetails
  onClick: () => void
  onDuplicate: () => void
  onDelete: () => void
  disabled?: boolean
}

function TemplateCard({ template, onClick, onDuplicate, onDelete, disabled }: TemplateCardProps) {
  const exerciseCount = template.session_plan_exercises?.length ?? 0

  const exerciseNames = (template.session_plan_exercises || [])
    .slice(0, 3)
    .map((e) => e.exercise?.name || 'Unnamed')

  const hasMore = (template.session_plan_exercises?.length || 0) > 3

  const createdDate = template.created_at
    ? new Date(template.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  const truncatedDescription = template.description
    ? template.description.length > 100
      ? template.description.slice(0, 100) + "..."
      : template.description
    : null

  return (
    <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", disabled && "opacity-60 pointer-events-none")} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate">
              {template.name || "Untitled Template"}
            </CardTitle>
            {truncatedDescription && (
              <CardDescription className="mt-1 line-clamp-2">
                {truncatedDescription}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Template actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick() }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span>{exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}</span>
          </div>
          {createdDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{createdDate}</span>
            </div>
          )}
        </div>
        {exerciseNames.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {exerciseNames.join(', ')}{hasMore ? ` +${exerciseCount - 3} more` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
