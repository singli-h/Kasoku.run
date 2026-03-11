/*
<ai_context>
Template management page component for coaches and individual users.
Displays saved session templates in a searchable grid with name, description,
exercise count, creation date, and delete action.
Includes a "New Template" flow: name/description + paste text -> AI parse -> preview -> save.
Template insertion into sessions is handled by the session planner (separate component).
</ai_context>
*/

"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Search,
  Trash2,
  Dumbbell,
  Calendar,
  MoreHorizontal,
  Copy,
  Plus,
  Loader2,
  ArrowLeft,
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
import { aiParseSessionAction, type ParsedExercise } from "@/actions/plans/ai-parse-session-action"
import { PasteProgramPreview } from "@/components/features/training/components/PasteProgramPreview"
import type { SessionPlanWithDetails } from "@/types/training"

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
// New Template Dialog (multi-step: name/paste -> preview -> save)
// ============================================================================

interface NewTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (template: SessionPlanWithDetails) => void
}

type DialogStep = "input" | "preview"

function NewTemplateDialog({ open, onOpenChange, onCreated }: NewTemplateDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<DialogStep>("input")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rawText, setRawText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([])

  const resetState = useCallback(() => {
    setStep("input")
    setName("")
    setDescription("")
    setRawText("")
    setIsParsing(false)
    setIsSaving(false)
    setParseError(null)
    setParsedExercises([])
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetState]
  )

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return

    setIsParsing(true)
    setParseError(null)

    const result = await aiParseSessionAction(rawText)

    if (result.isSuccess && result.data) {
      setParsedExercises(result.data)
      setStep("preview")
    } else {
      setParseError(result.message)
    }

    setIsParsing(false)
  }, [rawText])

  const handleCreateEmpty = useCallback(async () => {
    if (!name.trim()) return

    setIsSaving(true)

    const result = await createTemplateAction({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: [],
    })

    if (result.isSuccess && result.data) {
      const newTemplate = {
        ...result.data,
        session_plan_exercises: [],
      } as SessionPlanWithDetails
      onCreated(newTemplate)
      toast({ title: "Template created", description: "Empty template created successfully" })
      resetState()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }

    setIsSaving(false)
  }, [name, description, onCreated, toast, resetState])

  const handleSaveWithExercises = useCallback(
    async (exercises: ParsedExercise[]) => {
      if (!name.trim()) return

      setIsSaving(true)

      const result = await createTemplateAction({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets,
        })),
      })

      if (result.isSuccess && result.data) {
        // Build optimistic template for display. The card only reads name,
        // exercise count, exercise names, and created_at so a partial shape suffices.
        const newTemplate = {
          ...result.data,
          session_plan_exercises: exercises.map((ex, i) => ({
            id: `temp-${i}`,
            session_plan_id: result.data.id,
            exercise_id: 0,
            exercise_order: i + 1,
            notes: null,
            superset_id: null,
            created_at: new Date().toISOString(),
            updated_at: null,
            target_event_groups: null,
            exercise: { id: 0, name: ex.exerciseName } as any,
            session_plan_sets: [],
          })),
        } as SessionPlanWithDetails
        onCreated(newTemplate)
        toast({
          title: "Template created",
          description: `Template saved with ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}`,
        })
        resetState()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }

      setIsSaving(false)
    },
    [name, description, onCreated, toast, resetState]
  )

  const handleBackToInput = useCallback(() => {
    setStep("input")
    setParsedExercises([])
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "New Template" : "Preview Exercises"}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Create a reusable exercise block template."
              : "Review parsed exercises before saving."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Sprint Warm-Up, Strength Block A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="template-paste">
                Paste Program <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="template-paste"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste training text to auto-parse exercises...\n\nExamples:\nSquat 3x10 @ 80kg\n4x60m sprints rest 3min\nBench Press 5x5 @RPE 8`}
                className="min-h-[140px] text-sm"
                rows={6}
                disabled={isParsing}
              />
            </div>

            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateEmpty}
                disabled={!name.trim() || isSaving || isParsing}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create Empty
              </Button>
              <Button
                size="sm"
                onClick={handleParse}
                disabled={isParsing || !name.trim() || !rawText.trim()}
              >
                {isParsing && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isParsing ? "Parsing..." : "Parse & Preview"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToInput}
                className="h-7 px-2"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
              <span className="text-sm text-muted-foreground truncate">
                {name}
              </span>
            </div>

            <PasteProgramPreview
              exercises={parsedExercises}
              onInsert={(exercises) => handleSaveWithExercises(exercises)}
              onCancel={handleBackToInput}
            />

            {isSaving && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving template...
              </div>
            )}
          </div>
        )}
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
