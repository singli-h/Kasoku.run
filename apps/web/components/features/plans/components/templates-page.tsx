/*
<ai_context>
Template management page component for coaches and individual users.
Displays saved session templates in a searchable grid with name, description,
exercise count, creation date, and actions (view, edit, delete).
Includes a "New Template" flow with exercise picker and reorder.
Template detail sheet for viewing/editing exercises and sets.
</ai_context>
*/

"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search,
  Trash2,
  Dumbbell,
  Calendar,
  MoreHorizontal,
  Copy,
  Plus,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  Eye,
  Save,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/components/ui/use-toast"

import { deleteTemplateAction, createTemplateAction, updateTemplateAction, duplicateTemplateAction, getTemplatesAction } from "@/actions/plans/session-plan-actions"
import { useExerciseSearch } from "@/components/features/training/hooks/useExerciseSearch"
import type { ExerciseWithDetails, SessionPlanWithDetails } from "@/types/training"

// ============================================================================
// Shared Types
// ============================================================================

interface SelectedExercise {
  exerciseId: number
  exerciseName: string
  sets: Array<{
    reps: number | null
    weight: number | null
    distance: number | null
    performing_time: number | null
    rest_time: number | null
    rpe: number | null
  }>
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
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view")

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
    try {
      const result = await duplicateTemplateAction(templateId)
      if (result.isSuccess) {
        // Refetch all templates to get the duplicated one with correct exercise/set IDs
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
    }
  }

  const handleTemplateCreated = useCallback((newTemplate: SessionPlanWithDetails) => {
    setTemplates(prev => [newTemplate, ...prev])
    setShowNewDialog(false)
  }, [])

  const handleTemplateUpdated = useCallback((updated: SessionPlanWithDetails) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
    setDetailTemplate(updated)
    setDetailMode("view")
  }, [])

  const openDetail = useCallback((template: SessionPlanWithDetails, mode: "view" | "edit" = "view") => {
    setDetailTemplate(template)
    setDetailMode(mode)
  }, [])

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Search + New Template */}
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
        <Button variant="outline" size="sm" onClick={() => setShowNewDialog(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          New Template
        </Button>
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
              onEdit={() => openDetail(template, "edit")}
              onDuplicate={() => handleDuplicateTemplate(template.id)}
              onDelete={() => setDeleteTemplateId(template.id)}
            />
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <NewTemplateDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={handleTemplateCreated}
      />

      {/* Template Detail Sheet */}
      <TemplateDetailSheet
        template={detailTemplate}
        mode={detailMode}
        onModeChange={setDetailMode}
        onClose={() => setDetailTemplate(null)}
        onUpdated={handleTemplateUpdated}
        onDelete={(id) => { setDetailTemplate(null); setDeleteTemplateId(id) }}
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
// Exercise List (shared between NewTemplateDialog and TemplateDetailSheet)
// ============================================================================

interface ExerciseEditorProps {
  exercises: SelectedExercise[]
  onMove: (index: number, direction: "up" | "down") => void
  onRemove: (index: number) => void
  onAddSet: (exerciseIndex: number) => void
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: string, value: string) => void
}

function ExerciseEditor({ exercises, onMove, onRemove, onAddSet, onRemoveSet, onUpdateSet }: ExerciseEditorProps) {
  return (
    <div className="space-y-2">
      {exercises.map((ex, exIdx) => (
        <div key={`${ex.exerciseId}-${exIdx}`} className="border rounded-lg p-3 space-y-2 bg-card">
          {/* Exercise header */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground tabular-nums w-5 text-right shrink-0">{exIdx + 1}.</span>
              <span className="text-sm font-medium truncate">{ex.exerciseName}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {ex.sets.length} set{ex.sets.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMove(exIdx, "up")}
                disabled={exIdx === 0}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMove(exIdx, "down")}
                disabled={exIdx === exercises.length - 1}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRemove(exIdx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-1.5">
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">
                  S{setIdx + 1}
                </span>
                <Input
                  type="number"
                  placeholder="Reps"
                  value={set.reps ?? ""}
                  onChange={(e) => onUpdateSet(exIdx, setIdx, "reps", e.target.value)}
                  className="h-7 text-xs w-16"
                />
                <Input
                  type="number"
                  placeholder="kg"
                  value={set.weight ?? ""}
                  onChange={(e) => onUpdateSet(exIdx, setIdx, "weight", e.target.value)}
                  className="h-7 text-xs w-16"
                />
                <Input
                  type="number"
                  placeholder="m"
                  value={set.distance ?? ""}
                  onChange={(e) => onUpdateSet(exIdx, setIdx, "distance", e.target.value)}
                  className="h-7 text-xs w-14"
                />
                <Input
                  type="number"
                  placeholder="Rest(s)"
                  value={set.rest_time ?? ""}
                  onChange={(e) => onUpdateSet(exIdx, setIdx, "rest_time", e.target.value)}
                  className="h-7 text-xs w-16"
                />
                {ex.sets.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => onRemoveSet(exIdx, setIdx)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => onAddSet(exIdx)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Set
          </Button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Exercise Search Combobox (shared)
// ============================================================================

interface ExerciseSearchComboboxProps {
  enabled: boolean
  selectedIds: number[]
  onSelect: (exercise: ExerciseWithDetails) => void
}

function ExerciseSearchCombobox({ enabled, selectedIds, onSelect }: ExerciseSearchComboboxProps) {
  const [showResults, setShowResults] = useState(false)
  const {
    searchQuery,
    setSearchQuery,
    exercises: searchResults,
    isLoading: isSearching,
  } = useExerciseSearch({ enabled: enabled && showResults, pageSize: 15 })

  const handleSelect = useCallback((exercise: ExerciseWithDetails) => {
    onSelect(exercise)
    setSearchQuery("")
    setShowResults(false)
  }, [onSelect, setSearchQuery])

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search exercises to add..."
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
        onFocus={() => setShowResults(true)}
        className="pl-9"
      />
      {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />}

      {showResults && searchQuery.trim() && (
        <div className="absolute z-50 top-full mt-1 w-full border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
          {searchResults.length === 0 && !isSearching ? (
            <p className="p-3 text-sm text-muted-foreground text-center">No exercises found</p>
          ) : (
            searchResults.map((exercise) => {
              const isAdded = selectedIds.includes(exercise.id)
              return (
                <button
                  key={exercise.id}
                  onClick={() => !isAdded && handleSelect(exercise)}
                  disabled={isAdded}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
// Shared exercise list helpers
// ============================================================================

function useMoveExercise(setExercises: React.Dispatch<React.SetStateAction<SelectedExercise[]>>) {
  return useCallback((index: number, direction: "up" | "down") => {
    setExercises(prev => {
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [setExercises])
}

function useExerciseSetHandlers(setExercises: React.Dispatch<React.SetStateAction<SelectedExercise[]>>) {
  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const lastSet = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            lastSet ? { ...lastSet } : { reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null },
          ],
        }
      })
    )
  }, [setExercises])

  const handleRemoveSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex || ex.sets.length <= 1) return ex
        return { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
      })
    )
  }, [setExercises])

  const handleUpdateSet = useCallback((exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const numValue = value === "" ? null : Number(value)
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        return {
          ...ex,
          sets: ex.sets.map((s, j) =>
            j === setIndex ? { ...s, [field]: isNaN(numValue as number) ? null : numValue } : s
          ),
        }
      })
    )
  }, [setExercises])

  return { handleAddSet, handleRemoveSet, handleUpdateSet }
}

// ============================================================================
// Template Detail Sheet (View + Edit)
// ============================================================================

interface TemplateDetailSheetProps {
  template: SessionPlanWithDetails | null
  mode: "view" | "edit"
  onModeChange: (mode: "view" | "edit") => void
  onClose: () => void
  onUpdated: (template: SessionPlanWithDetails) => void
  onDelete: (id: string) => void
}

function TemplateDetailSheet({ template, mode, onModeChange, onClose, onUpdated, onDelete }: TemplateDetailSheetProps) {
  const { toast } = useToast()
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editExercises, setEditExercises] = useState<SelectedExercise[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleMove = useMoveExercise(setEditExercises)
  const { handleAddSet, handleRemoveSet, handleUpdateSet } = useExerciseSetHandlers(setEditExercises)

  // Auto-populate edit state when opening directly in edit mode (e.g. from dropdown Edit action)
  useEffect(() => {
    if (template && mode === "edit") {
      setEditName(template.name || "")
      setEditDescription(template.description || "")
      setEditExercises(
        (template.session_plan_exercises || [])
          .filter(e => e.exercise_id != null)
          .map(e => ({
            exerciseId: e.exercise_id!,
            exerciseName: e.exercise?.name || "Unnamed",
            sets: (e.session_plan_sets || []).map(s => ({
              reps: s.reps ?? null,
              weight: s.weight ?? null,
              distance: s.distance ?? null,
              performing_time: s.performing_time ?? null,
              rest_time: s.rest_time ?? null,
              rpe: s.rpe ?? null,
            })),
          })).map(ex => ex.sets.length === 0
            ? { ...ex, sets: [{ reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null }] }
            : ex
          )
      )
    }
  }, [template, mode])

  // Populate edit state when switching to edit mode via button
  const startEditing = useCallback(() => {
    if (!template) return
    setEditName(template.name || "")
    setEditDescription(template.description || "")
    setEditExercises(
      (template.session_plan_exercises || [])
        .filter(e => e.exercise_id != null)
        .map(e => ({
          exerciseId: e.exercise_id!,
          exerciseName: e.exercise?.name || "Unnamed",
          sets: (e.session_plan_sets || []).map(s => ({
            reps: s.reps ?? null,
            weight: s.weight ?? null,
            distance: s.distance ?? null,
            performing_time: s.performing_time ?? null,
            rest_time: s.rest_time ?? null,
            rpe: s.rpe ?? null,
          })),
        })).map(ex => ex.sets.length === 0
          ? { ...ex, sets: [{ reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null }] }
          : ex
        )
    )
    onModeChange("edit")
  }, [template, onModeChange])

  const handleAddExercise = useCallback((exercise: ExerciseWithDetails) => {
    setEditExercises(prev => {
      if (prev.some(e => e.exerciseId === exercise.id)) return prev
      return [...prev, {
        exerciseId: exercise.id,
        exerciseName: exercise.name ?? "Unnamed",
        sets: [{ reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null }],
      }]
    })
  }, [])

  const handleRemoveExercise = useCallback((index: number) => {
    setEditExercises(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(async () => {
    if (!template || !editName.trim() || editExercises.length === 0) return
    setIsSaving(true)

    const result = await updateTemplateAction(template.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      exercises: editExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets,
      })),
    })

    if (result.isSuccess) {
      const updated: SessionPlanWithDetails = {
        ...template,
        name: editName.trim(),
        description: editDescription.trim() || null,
        session_plan_exercises: editExercises.map((ex, i) => ({
          id: `updated-${i}`,
          session_plan_id: template.id,
          exercise_id: ex.exerciseId,
          exercise_order: i + 1,
          notes: null,
          superset_id: null,
          created_at: template.created_at,
          updated_at: new Date().toISOString(),
          target_event_groups: null,
          exercise: { id: ex.exerciseId, name: ex.exerciseName } as any,
          session_plan_sets: ex.sets.map((s, j) => ({
            id: j,
            set_index: j + 1,
            ...s,
          })) as any,
        })),
      }
      onUpdated(updated)
      toast({ title: "Template updated", description: `${editExercises.length} exercise${editExercises.length !== 1 ? "s" : ""} saved` })
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }

    setIsSaving(false)
  }, [template, editName, editDescription, editExercises, onUpdated, toast])

  if (!template) return null

  const exercises = template.session_plan_exercises || []

  return (
    <Sheet open={!!template} onOpenChange={(open) => { if (!open) { onClose(); onModeChange("view") } }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            {mode === "edit" ? "Edit Template" : (template.name || "Untitled Template")}
          </SheetTitle>
          {mode === "view" && template.description && (
            <SheetDescription className="text-xs">{template.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "view" ? (
            /* ---- VIEW MODE ---- */
            <div className="space-y-3">
              {exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No exercises in this template</p>
              ) : (
                exercises.map((ex, idx) => {
                  const sets = ex.session_plan_sets || []
                  return (
                    <div key={ex.id ?? idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums w-5 text-right">{idx + 1}.</span>
                        <span className="text-sm font-medium truncate">{ex.exercise?.name || "Unnamed"}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {sets.length} set{sets.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {sets.length > 0 && (
                        <div className="ml-7">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left font-normal w-8">#</th>
                                <th className="text-left font-normal">Reps</th>
                                <th className="text-left font-normal">Weight</th>
                                <th className="text-left font-normal">Dist</th>
                                <th className="text-left font-normal">Rest</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sets.map((s, sIdx) => (
                                <tr key={sIdx} className="text-muted-foreground">
                                  <td className="py-0.5">{sIdx + 1}</td>
                                  <td className="py-0.5">{s.reps ?? "—"}</td>
                                  <td className="py-0.5">{s.weight != null ? `${s.weight}kg` : "—"}</td>
                                  <td className="py-0.5">{s.distance != null ? `${s.distance}m` : "—"}</td>
                                  <td className="py-0.5">{s.rest_time != null ? `${s.rest_time}s` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* ---- EDIT MODE ---- */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Template name" />
              </div>
              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Exercises</Label>
                <ExerciseSearchCombobox
                  enabled={mode === "edit"}
                  selectedIds={editExercises.map(e => e.exerciseId)}
                  onSelect={handleAddExercise}
                />
              </div>
              {editExercises.length > 0 ? (
                <ExerciseEditor
                  exercises={editExercises}
                  onMove={handleMove}
                  onRemove={handleRemoveExercise}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onUpdateSet={handleUpdateSet}
                />
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Search and add exercises above
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center gap-2">
          {mode === "view" ? (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
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
                {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving || !editName.trim() || editExercises.length === 0}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onModeChange("view")}>Cancel</Button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {editExercises.length} exercise{editExercises.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// New Template Dialog
// ============================================================================

interface NewTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (template: SessionPlanWithDetails) => void
}

function NewTemplateDialog({ open, onOpenChange, onCreated }: NewTemplateDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])

  const handleMove = useMoveExercise(setSelectedExercises)
  const { handleAddSet, handleRemoveSet, handleUpdateSet } = useExerciseSetHandlers(setSelectedExercises)

  const resetState = useCallback(() => {
    setName("")
    setDescription("")
    setIsSaving(false)
    setSelectedExercises([])
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }, [onOpenChange, resetState])

  const handleAddExercise = useCallback((exercise: ExerciseWithDetails) => {
    setSelectedExercises(prev => {
      if (prev.some(e => e.exerciseId === exercise.id)) return prev
      return [...prev, {
        exerciseId: exercise.id,
        exerciseName: exercise.name ?? "Unnamed",
        sets: [{ reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null }],
      }]
    })
  }, [])

  const handleRemoveExercise = useCallback((index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim() || selectedExercises.length === 0) return
    setIsSaving(true)

    const result = await createTemplateAction({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: selectedExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets,
      })),
    })

    if (result.isSuccess && result.data) {
      const newTemplate = {
        ...result.data,
        session_plan_exercises: selectedExercises.map((ex, i) => ({
          id: `temp-${i}`,
          session_plan_id: result.data.id,
          exercise_id: ex.exerciseId,
          exercise_order: i + 1,
          notes: null,
          superset_id: null,
          created_at: new Date().toISOString(),
          updated_at: null,
          target_event_groups: null,
          exercise: { id: ex.exerciseId, name: ex.exerciseName } as any,
          session_plan_sets: ex.sets.map((s, j) => ({
            id: j,
            set_index: j + 1,
            ...s,
          })) as any,
        })),
      } as SessionPlanWithDetails
      onCreated(newTemplate)
      toast({
        title: "Template created",
        description: `Template saved with ${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""}`,
      })
      resetState()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }

    setIsSaving(false)
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
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Sprint Warm-Up, Strength Block A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label>Exercises</Label>
            <ExerciseSearchCombobox
              enabled={open}
              selectedIds={selectedExercises.map(e => e.exerciseId)}
              onSelect={handleAddExercise}
            />
          </div>

          {selectedExercises.length > 0 ? (
            <ExerciseEditor
              exercises={selectedExercises}
              onMove={handleMove}
              onRemove={handleRemoveExercise}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onUpdateSet={handleUpdateSet}
            />
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Search and add exercises from your library above
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !name.trim() || selectedExercises.length === 0}>
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
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function TemplateCard({ template, onClick, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
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
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
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
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>
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
