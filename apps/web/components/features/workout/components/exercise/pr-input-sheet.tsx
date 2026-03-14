/*
<ai_context>
Bottom sheet (Drawer) for entering a personal record (PR/1RM) during a workout.
Supports gym exercises (weight in kg) and sprint exercises (time in seconds).
Shows a live calculation preview based on the effort % from the plan.
</ai_context>
*/

"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ExerciseTypeId } from "../../utils/exercise-grouping"

interface PRInputSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName: string
  exerciseTypeId: number
  exerciseId: number
  /** Current PR value if one exists (kg for gym, seconds for sprint) */
  currentPR: number | null
  /** Effort values from session_plan_sets (decimal 0-1) for preview calculation */
  effortValues: (number | null)[]
  /** Callback to save the PR */
  onSave: (exerciseId: number, value: number, unitId: number) => Promise<boolean>
}

export function PRInputSheet({
  open,
  onOpenChange,
  exerciseName,
  exerciseTypeId,
  exerciseId,
  currentPR,
  effortValues,
  onSave,
}: PRInputSheetProps) {
  const [value, setValue] = useState(currentPR?.toString() ?? "")
  const [isSaving, setIsSaving] = useState(false)

  const isGym = exerciseTypeId === ExerciseTypeId.Gym
  const isSprint = exerciseTypeId === ExerciseTypeId.Sprint
  const unitLabel = isGym ? "kg" : "sec"
  const unitId = isGym ? 3 : 5 // 3=kg, 5=seconds

  // Reset value when sheet opens with new data
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setValue(currentPR?.toString() ?? "")
    }
    onOpenChange(nextOpen)
  }, [currentPR, onOpenChange])

  const numericValue = parseFloat(value)
  const isValid = !isNaN(numericValue) && numericValue > 0

  // Calculate preview targets for each set that has an effort value
  const previews = effortValues
    .map((effort, i) => {
      if (effort == null || !isValid) return null
      if (isGym) {
        // targetWeight = PR * effort
        const target = numericValue * effort
        return { setIndex: i + 1, effort: Math.round(effort * 100), target: target.toFixed(1), unit: "kg" }
      }
      if (isSprint) {
        // targetTime = PB / effort
        const target = numericValue / effort
        return { setIndex: i + 1, effort: Math.round(effort * 100), target: target.toFixed(2), unit: "s" }
      }
      return null
    })
    .filter(Boolean) as Array<{ setIndex: number; effort: number; target: string; unit: string }>

  const handleSave = async () => {
    if (!isValid) return
    setIsSaving(true)
    const success = await onSave(exerciseId, numericValue, unitId)
    setIsSaving(false)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{exerciseName}</DrawerTitle>
          <DrawerDescription>
            {isGym ? "Enter your 1RM (one-rep max)" : "Enter your personal best time"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          {/* PR Input */}
          <div className="space-y-2">
            <Label htmlFor="pr-value">
              {isGym ? "1RM Weight" : "PB Time"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="pr-value"
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isGym ? "100" : "12.50"}
                min={0}
                step={isGym ? 0.5 : 0.01}
                className="text-lg h-12 font-mono"
                autoFocus
              />
              <span className="text-sm text-muted-foreground font-medium shrink-0 w-8">
                {unitLabel}
              </span>
            </div>
            {currentPR != null && (
              <p className="text-xs text-muted-foreground">
                Current PR: {currentPR}{unitLabel}
              </p>
            )}
          </div>

          {/* Effort Preview */}
          {previews.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target Preview
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {previews.map((p) => (
                  <div
                    key={p.setIndex}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-muted text-sm"
                  >
                    <span className="text-muted-foreground">
                      Set {p.setIndex} ({p.effort}%)
                    </span>
                    <span className="font-mono font-medium">
                      {p.target}{p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="h-12 text-base"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              currentPR != null ? "Update PR" : "Save PR"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-12 text-base">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
