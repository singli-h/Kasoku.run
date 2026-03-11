/*
<ai_context>
Template management page component for coaches and individual users.
Displays saved session templates in a searchable grid with name, description,
exercise count, creation date, and delete action.
Includes a "New Template" flow with exercise picker from the library.
Template insertion into sessions is handled by the session planner (separate component).
</ai_context>
*/

"use client"

import { useState, useMemo, useCallback, useRef } from "react"
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
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

import { deleteTemplateAction, createTemplateAction } from "@/actions/plans/session-plan-actions"
import { useExerciseSearch } from "@/components/features/training/hooks/useExerciseSearch"
import type { ExerciseWithDetails, SessionPlanWithDetails } from "@/types/training"

interface TemplatesPageProps {
  initialTemplates: SessionPlanWithDetails[]
}

export function TemplatesPage({ initialTemplates }: TemplatesPageProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<SessionPlanWithDetails[]>(initialTemplates)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)

  // Filter templates by name and description
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates

    const term = searchTerm.toLowerCase()
    return templates.filter(template => {
      const nameMatch = template.name?.toLowerCase().includes(term)
      const descMatch = template.description?.toLowerCase().includes(term)
      return nameMatch || descMatch
    })
  }, [templates, searchTerm])

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const result = await deleteTemplateAction(templateId)

      if (result.isSuccess) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
        toast({
          title: "Template deleted",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setDeleteTemplateId(null)
    }
  }

  const handleTemplateCreated = useCallback((newTemplate: SessionPlanWithDetails) => {
    setTemplates(prev => [newTemplate, ...prev])
    setShowNewDialog(false)
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewDialog(true)}
          className="shrink-0"
        >
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
// New Template Dialog (exercise picker flow)
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
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Exercise search
  const {
    searchQuery,
    setSearchQuery,
    exercises: searchResults,
    isLoading: isSearching,
    resetSearch,
  } = useExerciseSearch({ enabled: open && showSearchResults, pageSize: 15 })

  const resetState = useCallback(() => {
    setName("")
    setDescription("")
    setIsSaving(false)
    setSelectedExercises([])
    setShowSearchResults(false)
    resetSearch()
  }, [resetSearch])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetState]
  )

  const handleAddExercise = useCallback((exercise: ExerciseWithDetails) => {
    setSelectedExercises((prev) => {
      // Prevent duplicates
      if (prev.some((e) => e.exerciseId === exercise.id)) return prev
      return [
        ...prev,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name ?? "Unnamed",
          sets: [{ reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null }],
        },
      ]
    })
    setSearchQuery("")
    setShowSearchResults(false)
  }, [setSearchQuery])

  const handleRemoveExercise = useCallback((index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        // Copy last set values for convenience
        const lastSet = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            lastSet
              ? { ...lastSet }
              : { reps: null, weight: null, distance: null, performing_time: null, rest_time: null, rpe: null },
          ],
        }
      })
    )
  }, [])

  const handleRemoveSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        if (ex.sets.length <= 1) return ex // Keep at least 1 set
        return { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
      })
    )
  }, [])

  const handleUpdateSet = useCallback(
    (exerciseIndex: number, setIndex: number, field: string, value: string) => {
      const numValue = value === "" ? null : Number(value)
      setSelectedExercises((prev) =>
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
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!name.trim() || selectedExercises.length === 0) return

    setIsSaving(true)

    const result = await createTemplateAction({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: selectedExercises.map((ex) => ({
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
          session_plan_sets: [],
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
            <Label>Exercises</Label>
            <div className="relative" ref={searchContainerRef}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises to add..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
              )}

              {/* Search results dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute z-50 top-full mt-1 w-full border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.length === 0 && !isSearching ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">No exercises found</p>
                  ) : (
                    searchResults.map((exercise) => {
                      const isAlreadyAdded = selectedExercises.some((e) => e.exerciseId === exercise.id)
                      return (
                        <button
                          key={exercise.id}
                          onClick={() => !isAlreadyAdded && handleAddExercise(exercise)}
                          disabled={isAlreadyAdded}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{exercise.name}</span>
                          {exercise.exercise_type && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {exercise.exercise_type.type}
                            </span>
                          )}
                          {isAlreadyAdded ? (
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
          </div>

          {/* Selected exercises list */}
          {selectedExercises.length > 0 && (
            <div className="space-y-2">
              {selectedExercises.map((ex, exIdx) => (
                <div key={`${ex.exerciseId}-${exIdx}`} className="border rounded-lg p-3 space-y-2 bg-card">
                  {/* Exercise header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground tabular-nums">{exIdx + 1}.</span>
                      <span className="text-sm font-medium truncate">{ex.exerciseName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => handleRemoveExercise(exIdx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
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
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "reps", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                        <Input
                          type="number"
                          placeholder="kg"
                          value={set.weight ?? ""}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "weight", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                        <Input
                          type="number"
                          placeholder="m"
                          value={set.distance ?? ""}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "distance", e.target.value)}
                          className="h-7 text-xs w-14"
                        />
                        <Input
                          type="number"
                          placeholder="Rest(s)"
                          value={set.rest_time ?? ""}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "rest_time", e.target.value)}
                          className="h-7 text-xs w-16"
                        />
                        {ex.sets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => handleAddSet(exIdx)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Set
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedExercises.length === 0 && (
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
  onDelete: () => void
}

function TemplateCard({ template, onDelete }: TemplateCardProps) {
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

  // Truncate description to ~100 chars
  const truncatedDescription = template.description
    ? template.description.length > 100
      ? template.description.slice(0, 100) + "..."
      : template.description
    : null

  return (
    <Card className="hover:shadow-md transition-shadow">
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
              <Button variant="ghost" size="sm" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Template actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
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
