"use client"

/**
 * PasteProgramDialog
 *
 * Dialog for pasting free-form training program text and parsing it
 * via AI into structured exercises. Shows a textarea for input,
 * then switches to a preview of parsed exercises.
 */

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { aiParseSessionAction, type ParsedExercise } from "@/actions/plans/ai-parse-session-action"
import { PasteProgramPreview } from "./PasteProgramPreview"

interface PasteProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExercisesParsed: (exercises: ParsedExercise[]) => void
}

export function PasteProgramDialog({
  open,
  onOpenChange,
  onExercisesParsed,
}: PasteProgramDialogProps) {
  const [rawText, setRawText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[] | null>(null)

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return

    setIsParsing(true)
    setError(null)

    const result = await aiParseSessionAction(rawText)

    if (result.isSuccess) {
      setParsedExercises(result.data)
    } else {
      setError(result.message)
    }

    setIsParsing(false)
  }, [rawText])

  const handleInsert = useCallback(
    (exercises: ParsedExercise[]) => {
      onExercisesParsed(exercises)
      // Reset state
      setRawText("")
      setParsedExercises(null)
      setError(null)
      onOpenChange(false)
    },
    [onExercisesParsed, onOpenChange]
  )

  const handleCancel = useCallback(() => {
    setParsedExercises(null)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset state on close
        setRawText("")
        setParsedExercises(null)
        setError(null)
        setIsParsing(false)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste Program</DialogTitle>
          <DialogDescription>
            Paste training program text and AI will parse it into structured exercises.
          </DialogDescription>
        </DialogHeader>

        {parsedExercises ? (
          <PasteProgramPreview
            exercises={parsedExercises}
            onInsert={handleInsert}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste your program text here...\n\nExamples:\nSquat 3x10 @ 80kg\n4x60m sprints rest 3min\nBench Press 5x5 @RPE 8`}
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
