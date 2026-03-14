"use client"

/**
 * PasteProgramDialog
 *
 * Dialog for pasting free-form training program text and parsing it
 * via AI into structured exercises. Includes an exercise resolution step
 * that matches parsed names against the exercise library and auto-creates
 * new exercises when no match is found.
 */

import { useState, useCallback, useMemo, useEffect } from "react"
import { Loader2, CheckCircle2, PlusCircle, ChevronDown, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { aiParseSessionAction, type ParsedExercise, type ExerciseTypeName } from "@/actions/plans/ai-parse-session-action"

/** Map AI exercise type name → database exercise_type_id */
const EXERCISE_TYPE_NAME_TO_ID: Record<ExerciseTypeName, number | null> = {
  isometric: 1,
  plyometric: 2,
  gym: 3,
  warmup: 4,
  circuit: 5,
  sprint: 6,
  drill: 7,
  mobility: 8,
  recovery: 9,
  other: null,
}
import { searchExercisesAction } from "@/actions/library/exercise-actions"
import { createExerciseAction } from "@/actions/library/exercise-actions"
import { createTemplateAction } from "@/actions/plans/session-plan-actions"
import { useToast } from "@/hooks/use-toast"
import { PasteProgramPreview } from "./PasteProgramPreview"

/** Section names that are commonly reused across sessions, checked by default */
const DEFAULT_TEMPLATE_SECTIONS = new Set([
  "warm up",
  "warmup",
  "warm-up",
  "cool down",
  "cooldown",
  "cool-down",
  "drills",
  "recovery",
  "mobility",
  "stretching",
  "activation",
])

/** Resolved exercise info attached after library matching */
export interface ResolvedExercise extends ParsedExercise {
  /** Matched or newly created exercise library ID */
  resolvedExerciseId: number
  /** Matched or newly created exercise name from the library */
  resolvedExerciseName: string
  /** Whether this was matched from existing library or newly created */
  resolutionType: "matched" | "created"
  /** Exercise type ID from library (for dynamic field visibility) */
  resolvedExerciseTypeId?: number | null
  /** Exercise type name from library */
  resolvedExerciseType?: string | null
}

interface PasteProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with resolved exercises ready for insertion into the session */
  onExercisesResolved: (exercises: ResolvedExercise[]) => void
}

type DialogStep = "input" | "preview" | "resolving" | "resolved"

export function PasteProgramDialog({
  open,
  onOpenChange,
  onExercisesResolved,
}: PasteProgramDialogProps) {
  const { toast } = useToast()
  const [rawText, setRawText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[] | null>(null)
  const [resolvedExercises, setResolvedExercises] = useState<ResolvedExercise[] | null>(null)
  const [step, setStep] = useState<DialogStep>("input")
  const [sectionsToSave, setSectionsToSave] = useState<Set<string>>(new Set())
  const [templateSectionOpen, setTemplateSectionOpen] = useState(false)

  // Compute unique sections with exercise counts from resolved exercises
  const resolvedSections = useMemo(() => {
    if (!resolvedExercises) return []
    const map = new Map<string, number>()
    for (const ex of resolvedExercises) {
      if (ex.sectionName) {
        map.set(ex.sectionName, (map.get(ex.sectionName) ?? 0) + 1)
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  }, [resolvedExercises])

  const showTemplateSaver = resolvedSections.length >= 2

  // Initialize default-checked sections when entering resolved step
  useEffect(() => {
    if (step === "resolved" && resolvedSections.length >= 2) {
      const defaults = new Set<string>()
      for (const section of resolvedSections) {
        if (DEFAULT_TEMPLATE_SECTIONS.has(section.name.toLowerCase())) {
          defaults.add(section.name)
        }
      }
      setSectionsToSave(defaults)
      setTemplateSectionOpen(false)
    }
  }, [step, resolvedSections])

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return

    setIsParsing(true)
    setError(null)

    const result = await aiParseSessionAction(rawText)

    if (result.isSuccess) {
      setParsedExercises(result.data)
      setStep("preview")
    } else {
      setError(result.message)
    }

    setIsParsing(false)
  }, [rawText])

  // After preview editing, resolve exercise names against library
  const handlePreviewInsert = useCallback(async (exercises: ParsedExercise[]) => {
    setStep("resolving")
    setError(null)

    try {
      const resolved: ResolvedExercise[] = []

      // Build a cache to avoid duplicate searches/creates for the same name
      const nameCache = new Map<string, { id: number; name: string; type: "matched" | "created"; exerciseTypeId?: number | null; exerciseType?: string | null }>()
      const failedNames: string[] = []

      for (const exercise of exercises) {
        const normalizedName = exercise.exerciseName.trim().toLowerCase()

        // Check cache first
        if (nameCache.has(normalizedName)) {
          const cached = nameCache.get(normalizedName)!
          resolved.push({
            ...exercise,
            resolvedExerciseId: cached.id,
            resolvedExerciseName: cached.name,
            resolutionType: cached.type,
            resolvedExerciseTypeId: cached.exerciseTypeId,
            resolvedExerciseType: cached.exerciseType,
          })
          continue
        }

        // Search existing library
        const searchResult = await searchExercisesAction({
          search: exercise.exerciseName,
          limit: 5,
          offset: 0,
        })

        const inferredTypeId = EXERCISE_TYPE_NAME_TO_ID[exercise.exerciseType] ?? null
        const isSprint = exercise.exerciseType === 'sprint'

        let matchedExercise: { id: number; name: string; exerciseTypeId?: number | null; exerciseType?: string | null } | null = null

        if (searchResult.isSuccess && searchResult.data) {
          const results = searchResult.data.exercises ?? []

          // First try exact match (case-insensitive)
          const exactMatch = results.find(
            (r) => r.name?.toLowerCase() === normalizedName
          )

          if (exactMatch) {
            const et = exactMatch.exercise_type as { type?: string } | null
            matchedExercise = {
              id: exactMatch.id,
              name: exactMatch.name || exercise.exerciseName,
              exerciseTypeId: exactMatch.exercise_type_id ?? null,
              exerciseType: et?.type ?? null,
            }
          } else if (isSprint && results.length > 0) {
            // Sprint exercises: use best search result instead of creating new
            // Global sprint library (24 exercises) covers all standard sprint types
            const bestMatch = results[0]
            const et = bestMatch.exercise_type as { type?: string } | null
            matchedExercise = {
              id: bestMatch.id,
              name: bestMatch.name || exercise.exerciseName,
              exerciseTypeId: bestMatch.exercise_type_id ?? null,
              exerciseType: et?.type ?? null,
            }
          }
        }

        // If sprint and still no match, try harder with multiple search strategies
        if (!matchedExercise && isSprint) {
          // Try: original name, singular form (strip trailing 's'), each significant word
          const searchTerms = [
            exercise.exerciseName,
            exercise.exerciseName.replace(/s$/i, ''), // "Block Starts" → "Block Start"
            ...exercise.exerciseName.split(/\s+/).filter(w => w.length > 3), // individual words
          ]
          // Deduplicate
          const uniqueTerms = [...new Set(searchTerms.map(t => t.toLowerCase()))].map(
            t => searchTerms.find(st => st.toLowerCase() === t) || t
          )

          for (const term of uniqueTerms) {
            if (matchedExercise) break
            const sprintSearch = await searchExercisesAction({
              search: term,
              exercise_type_id: 6,
              limit: 3,
              offset: 0,
            })
            if (sprintSearch.isSuccess && sprintSearch.data) {
              const sprintResults = sprintSearch.data.exercises ?? []
              if (sprintResults.length > 0) {
                const best = sprintResults[0]
                const et = best.exercise_type as { type?: string } | null
                matchedExercise = {
                  id: best.id,
                  name: best.name || exercise.exerciseName,
                  exerciseTypeId: best.exercise_type_id ?? null,
                  exerciseType: et?.type ?? null,
                }
              }
            }
          }
        }

        if (matchedExercise) {
          const entry = { id: matchedExercise.id, name: matchedExercise.name, type: "matched" as const, exerciseTypeId: matchedExercise.exerciseTypeId, exerciseType: matchedExercise.exerciseType }
          nameCache.set(normalizedName, entry)
          resolved.push({
            ...exercise,
            resolvedExerciseId: entry.id,
            resolvedExerciseName: entry.name,
            resolutionType: "matched",
            resolvedExerciseTypeId: entry.exerciseTypeId,
            resolvedExerciseType: entry.exerciseType,
          })
        } else if (isSprint) {
          // Sprint: never auto-create — skip with warning
          failedNames.push(`${exercise.exerciseName} (no matching sprint exercise)`)
        } else {
          // Non-sprint: auto-create new exercise with AI-inferred type and description
          const createResult = await createExerciseAction({
            name: exercise.exerciseName,
            description: exercise.description ?? undefined,
            exercise_type_id: inferredTypeId,
          })

          if (createResult.isSuccess && createResult.data) {
            const entry = {
              id: createResult.data.id,
              name: createResult.data.name || exercise.exerciseName,
              type: "created" as const,
              exerciseTypeId: createResult.data.exercise_type_id ?? inferredTypeId,
              exerciseType: exercise.exerciseType !== 'other' ? exercise.exerciseType : null,
            }
            nameCache.set(normalizedName, entry)
            resolved.push({
              ...exercise,
              resolvedExerciseId: entry.id,
              resolvedExerciseName: entry.name,
              resolutionType: "created",
              resolvedExerciseTypeId: entry.exerciseTypeId,
              resolvedExerciseType: entry.exerciseType,
            })
          } else {
            // Creation failed — collect error but don't silently drop
            failedNames.push(exercise.exerciseName)
          }
        }
      }

      setResolvedExercises(resolved)
      if (failedNames.length > 0) {
        setError(`Failed to create ${failedNames.length} exercise(s): ${failedNames.join(", ")}`)
      }
      setStep("resolved")
    } catch (err) {
      setError(
        `Resolution failed: ${err instanceof Error ? err.message : "Unknown error"}`
      )
      setStep("preview")
    }
  }, [])

  const handleFinalInsert = useCallback(() => {
    if (!resolvedExercises) return
    onExercisesResolved(resolvedExercises)

    // Fire-and-forget: create templates for checked sections
    if (sectionsToSave.size > 0) {
      for (const sectionName of sectionsToSave) {
        const sectionExercises = resolvedExercises.filter(
          (ex) => ex.sectionName === sectionName
        )
        if (sectionExercises.length === 0) continue

        createTemplateAction({
          name: sectionName,
          description: "Created from pasted program",
          exercises: sectionExercises.map((ex) => ({
            exerciseId: ex.resolvedExerciseId,
            exerciseName: ex.resolvedExerciseName,
            sets: ex.sets,
          })),
        }).then((result) => {
          if (result.isSuccess) {
            toast({
              title: `Template saved: ${sectionName}`,
              description: `${sectionExercises.length} exercise${sectionExercises.length !== 1 ? "s" : ""} saved as a reusable template.`,
            })
          } else {
            toast({
              title: `Failed to save template: ${sectionName}`,
              description: result.message,
              variant: "destructive",
            })
          }
        })
      }
    }

    // Reset state
    setRawText("")
    setParsedExercises(null)
    setResolvedExercises(null)
    setSectionsToSave(new Set())
    setError(null)
    setStep("input")
    onOpenChange(false)
  }, [resolvedExercises, onExercisesResolved, onOpenChange, sectionsToSave, toast])

  const handleCancelPreview = useCallback(() => {
    setParsedExercises(null)
    setStep("input")
  }, [])

  const handleBackToPreview = useCallback(() => {
    setResolvedExercises(null)
    setStep("preview")
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset state on close
        setRawText("")
        setParsedExercises(null)
        setResolvedExercises(null)
        setSectionsToSave(new Set())
        setError(null)
        setIsParsing(false)
        setStep("input")
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const matchedCount = resolvedExercises?.filter((e) => e.resolutionType === "matched").length ?? 0
  const createdCount = resolvedExercises?.filter((e) => e.resolutionType === "created").length ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste Program</DialogTitle>
          <DialogDescription>
            {step === "input" &&
              "Paste training program text and AI will parse it into structured exercises."}
            {step === "preview" && "Review parsed exercises before resolving against your library."}
            {step === "resolving" && "Matching exercises against your library..."}
            {step === "resolved" && "Exercises resolved. Review matches and new exercises below."}
          </DialogDescription>
        </DialogHeader>

        {step === "preview" && parsedExercises ? (
          <PasteProgramPreview
            exercises={parsedExercises}
            onInsert={handlePreviewInsert}
            onCancel={handleCancelPreview}
          />
        ) : step === "resolving" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Resolving exercise names against library...
            </p>
          </div>
        ) : step === "resolved" && resolvedExercises ? (
          <div className="space-y-3">
            {/* Resolution summary */}
            <div className="flex items-center gap-3 text-sm">
              {matchedCount > 0 && (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{matchedCount} matched</span>
                </div>
              )}
              {createdCount > 0 && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{createdCount} created</span>
                </div>
              )}
            </div>

            {/* Resolved exercise list */}
            <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
              {resolvedExercises.map((exercise, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {exercise.resolvedExerciseName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant={exercise.resolutionType === "matched" ? "secondary" : "outline"}
                        className="text-[10px] h-4"
                      >
                        {exercise.resolutionType === "matched" ? "Library" : "New"}
                      </Badge>
                      {exercise.sectionName && (
                        <span className="text-[10px] text-muted-foreground">
                          {exercise.sectionName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Save sections as templates */}
            {showTemplateSaver && (
              <Collapsible
                open={templateSectionOpen}
                onOpenChange={setTemplateSectionOpen}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Save sections as templates</span>
                    {sectionsToSave.size > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {sectionsToSave.size}
                      </Badge>
                    )}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        templateSectionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-card p-3">
                    {resolvedSections.map((section) => {
                      const isChecked = sectionsToSave.has(section.name)
                      return (
                        <label
                          key={section.name}
                          className="flex items-center gap-2.5 py-1 cursor-pointer"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setSectionsToSave((prev) => {
                                const next = new Set(prev)
                                if (checked) {
                                  next.add(section.name)
                                } else {
                                  next.delete(section.name)
                                }
                                return next
                              })
                            }}
                          />
                          <span className="text-sm flex-1">{section.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {section.count} exercise{section.count !== 1 ? "s" : ""}
                          </span>
                        </label>
                      )
                    })}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Templates will be saved to your library for reuse in future sessions.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleBackToPreview}>
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleFinalInsert}
                disabled={resolvedExercises.length === 0}
              >
                Insert {resolvedExercises.length} Exercise
                {resolvedExercises.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste your program text here...\n\nExamples:\nWarm Up:\nJogging 5min\nDynamic Stretches\n\nMain Set:\nSquat 3x10 @ 80kg\n4x60m sprints rest 3min\nBench Press 5x5 @RPE 8`}
              className="min-h-[200px] text-sm"
              rows={8}
              disabled={isParsing}
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleParse}
                disabled={isParsing || !rawText.trim()}
                size="sm"
              >
                {isParsing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isParsing ? "Parsing..." : "Parse"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
