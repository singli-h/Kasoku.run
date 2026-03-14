/*
<ai_context>
Bottom sheet (Drawer) for entering personal records during a workout.
Supports three modes:
1. Gym: single 1RM weight input
2. Sprint direct: multi-distance PB inputs (starts, flying, timing test)
3. Sprint reference: single race PB input (speed/special endurance)
</ai_context>
*/

"use client"

import { useState, useCallback, useMemo } from "react"
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
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

// --- Sprint PR Configuration ---

/** Exercises with direct, per-distance PRs */
export const SPRINT_DIRECT_DISTANCES: Record<string, number[]> = {
  "Block Start Sprint": [20, 30, 40, 60],
  "Standing Start Sprint": [20, 30, 40, 60],
  "3-Point Start Sprint": [20, 30, 40, 60],
  "Flying Sprint": [10, 20, 30],
}

/** Exercises that use a race PB as reference for effort calculation */
export const SPRINT_REFERENCE_PB: Record<string, { raceDistance: number; label: string }> = {
  "Speed Endurance Run": { raceDistance: 100, label: "100m Race PB" },       // 80-150m range
  "Special Endurance Run": { raceDistance: 200, label: "200m Race PB" },     // 150m+ range
}

/** Exercises that support auto-PR updates on set completion */
export const SPRINT_AUTO_PR_NAMES = new Set([
  "Block Start Sprint",
  "Standing Start Sprint",
  "3-Point Start Sprint",
  "Flying Sprint",
  "Timing Test Run",
])

export type SprintPRMode =
  | { type: "direct"; distances: number[] }
  | { type: "reference"; raceDistance: number; label: string }
  | { type: "dynamic" }
  | null

/** Determine how a sprint exercise handles PRs */
export function getSprintPRMode(exerciseName: string): SprintPRMode {
  if (SPRINT_DIRECT_DISTANCES[exerciseName]) {
    return { type: "direct", distances: SPRINT_DIRECT_DISTANCES[exerciseName] }
  }
  if (SPRINT_REFERENCE_PB[exerciseName]) {
    const config = SPRINT_REFERENCE_PB[exerciseName]
    return { type: "reference", raceDistance: config.raceDistance, label: config.label }
  }
  if (exerciseName === "Timing Test Run") {
    return { type: "dynamic" }
  }
  return null
}

// --- Component ---

interface PRInputSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName: string
  exerciseTypeId: number
  exerciseId: number
  /** All existing PRs for this exercise */
  existingPRs: PersonalBest[]
  /** Effort + distance from each session plan set, for preview */
  setEfforts: Array<{ effort: number | null; distance: number | null; setIndex: number }>
  onSave: (exerciseId: number, value: number, unitId: number, distance?: number | null) => Promise<boolean>
}

export function PRInputSheet({
  open,
  onOpenChange,
  exerciseName,
  exerciseTypeId,
  exerciseId,
  existingPRs,
  setEfforts,
  onSave,
}: PRInputSheetProps) {
  const isGym = exerciseTypeId === ExerciseTypeId.Gym
  const isSprint = exerciseTypeId === ExerciseTypeId.Sprint
  const sprintMode = isSprint ? getSprintPRMode(exerciseName) : null

  // --- State for different modes ---

  // Gym: single value
  const existingGymPR = isGym ? existingPRs.find(pr => pr.distance == null) : null
  const [gymValue, setGymValue] = useState("")

  // Sprint direct/dynamic: value per distance
  const [distanceValues, setDistanceValues] = useState<Record<number, string>>({})

  // Sprint reference: single reference PB
  const [referenceValue, setReferenceValue] = useState("")

  const [isSaving, setIsSaving] = useState(false)

  // Determine distances for direct/dynamic mode
  const sprintDistances = useMemo(() => {
    if (!sprintMode) return []
    if (sprintMode.type === "direct") return sprintMode.distances
    if (sprintMode.type === "dynamic") {
      // Collect distances from session sets + existing PRs
      const fromSets = setEfforts
        .map(s => s.distance)
        .filter((d): d is number => d != null && d > 0)
      const fromPRs = existingPRs
        .map(pr => pr.distance)
        .filter((d): d is number => d != null && d > 0)
      return [...new Set([...fromSets, ...fromPRs])].sort((a, b) => a - b)
    }
    return []
  }, [sprintMode, setEfforts, existingPRs])

  // Reset values when sheet opens
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      if (isGym) {
        setGymValue(existingGymPR?.value?.toString() ?? "")
      } else if (sprintMode?.type === "reference") {
        const existing = existingPRs.find(pr => pr.distance === sprintMode.raceDistance)
        setReferenceValue(existing?.value?.toString() ?? "")
      } else {
        // Direct/dynamic: populate existing values per distance
        const vals: Record<number, string> = {}
        for (const pr of existingPRs) {
          if (pr.distance != null) {
            vals[pr.distance] = pr.value?.toString() ?? ""
          }
        }
        setDistanceValues(vals)
      }
    }
    onOpenChange(nextOpen)
  }, [isGym, existingGymPR, existingPRs, sprintMode, onOpenChange])

  // --- Preview calculations ---

  const gymPreviews = useMemo(() => {
    const v = parseFloat(gymValue)
    if (!isGym || isNaN(v) || v <= 0) return []
    return setEfforts
      .filter(s => s.effort != null && s.effort > 0)
      .map(s => ({
        setIndex: s.setIndex,
        effort: Math.round(s.effort! * 100),
        target: (v * s.effort!).toFixed(1),
        unit: "kg",
      }))
  }, [isGym, gymValue, setEfforts])

  const sprintPreviews = useMemo(() => {
    if (!isSprint) return []

    if (sprintMode?.type === "reference") {
      const v = parseFloat(referenceValue)
      if (isNaN(v) || v <= 0) return []
      return setEfforts
        .filter(s => s.effort != null && s.effort > 0 && s.distance != null && s.distance > 0)
        .map(s => {
          const target = v * (s.distance! / sprintMode.raceDistance) / s.effort!
          return {
            setIndex: s.setIndex,
            distance: s.distance!,
            effort: Math.round(s.effort! * 100),
            target: target.toFixed(2),
            unit: "s",
          }
        })
    }

    // Direct/dynamic mode
    return setEfforts
      .filter(s => s.effort != null && s.effort > 0 && s.distance != null)
      .map(s => {
        const distPR = parseFloat(distanceValues[s.distance!] || "")
        if (isNaN(distPR) || distPR <= 0) return null
        const target = distPR / s.effort!
        return {
          setIndex: s.setIndex,
          distance: s.distance!,
          effort: Math.round(s.effort! * 100),
          target: target.toFixed(2),
          unit: "s",
        }
      })
      .filter(Boolean) as Array<{ setIndex: number; distance: number; effort: number; target: string; unit: string }>
  }, [isSprint, sprintMode, referenceValue, distanceValues, setEfforts])

  // --- Save ---

  const handleSave = async () => {
    setIsSaving(true)
    let allOk = true

    if (isGym) {
      const v = parseFloat(gymValue)
      if (!isNaN(v) && v > 0) {
        const ok = await onSave(exerciseId, v, 3) // unit_id 3 = kg
        if (!ok) allOk = false
      }
    } else if (sprintMode?.type === "reference") {
      const v = parseFloat(referenceValue)
      if (!isNaN(v) && v > 0) {
        const ok = await onSave(exerciseId, v, 5, sprintMode.raceDistance) // unit_id 5 = seconds
        if (!ok) allOk = false
      }
    } else {
      // Direct/dynamic: save each distance that has a value
      const saves = Object.entries(distanceValues)
        .filter(([, val]) => {
          const v = parseFloat(val)
          return !isNaN(v) && v > 0
        })
        .map(([dist, val]) => onSave(exerciseId, parseFloat(val), 5, parseInt(dist, 10)))
      const results = await Promise.all(saves)
      if (results.some(ok => !ok)) allOk = false
    }

    setIsSaving(false)
    if (allOk) onOpenChange(false)
  }

  const hasValidInput = isGym
    ? !isNaN(parseFloat(gymValue)) && parseFloat(gymValue) > 0
    : sprintMode?.type === "reference"
      ? !isNaN(parseFloat(referenceValue)) && parseFloat(referenceValue) > 0
      : Object.values(distanceValues).some(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0)

  // --- Render ---

  const previews = isGym ? gymPreviews : sprintPreviews

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{exerciseName}</DrawerTitle>
          <DrawerDescription>
            {isGym
              ? "Enter your 1RM (one-rep max)"
              : sprintMode?.type === "reference"
                ? `Enter your ${(sprintMode as Extract<SprintPRMode, { type: "reference" }>).label}`
                : "Enter your personal best times"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          {/* Gym: single input */}
          {isGym && (
            <div className="space-y-2">
              <Label htmlFor="pr-value">1RM Weight</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pr-value"
                  type="number"
                  inputMode="decimal"
                  value={gymValue}
                  onChange={(e) => setGymValue(e.target.value)}
                  placeholder={existingGymPR?.value?.toString() ?? "100"}
                  min={0}
                  step={0.5}
                  className="text-lg h-12 font-mono"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground font-medium shrink-0 w-8">kg</span>
              </div>
              {existingGymPR?.value != null && (
                <p className="text-xs text-muted-foreground">Current PR: {existingGymPR.value}kg</p>
              )}
            </div>
          )}

          {/* Sprint reference: single PB input */}
          {isSprint && sprintMode?.type === "reference" && (
            <div className="space-y-2">
              <Label htmlFor="pr-ref">{(sprintMode as Extract<SprintPRMode, { type: "reference" }>).label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pr-ref"
                  type="number"
                  inputMode="decimal"
                  value={referenceValue}
                  onChange={(e) => setReferenceValue(e.target.value)}
                  placeholder={
                    existingPRs.find(pr => pr.distance === sprintMode.raceDistance)?.value?.toString() ?? "24.00"
                  }
                  min={0}
                  step={0.01}
                  className="text-lg h-12 font-mono"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground font-medium shrink-0 w-8">sec</span>
              </div>
              {(() => {
                const existing = existingPRs.find(pr => pr.distance === sprintMode.raceDistance)
                return existing?.value != null ? (
                  <p className="text-xs text-muted-foreground">
                    Current {sprintMode.raceDistance}m PB: {existing.value}s
                  </p>
                ) : null
              })()}
            </div>
          )}

          {/* Sprint direct/dynamic: multi-distance grid */}
          {isSprint && (sprintMode?.type === "direct" || sprintMode?.type === "dynamic") && sprintDistances.length > 0 && (
            <div className="space-y-2">
              <Label>Personal Best Times</Label>
              <div className="grid grid-cols-2 gap-2">
                {sprintDistances.map((dist) => {
                  const existingPR = existingPRs.find(pr => pr.distance === dist)
                  return (
                    <div key={dist} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-medium w-10 shrink-0 text-right">
                        {dist}m
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={distanceValues[dist] ?? ""}
                        onChange={(e) => setDistanceValues(prev => ({ ...prev, [dist]: e.target.value }))}
                        placeholder={existingPR?.value?.toString() ?? "-"}
                        min={0}
                        step={0.01}
                        className="h-10 font-mono text-sm"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">s</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Target Preview */}
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
                      Set {p.setIndex}
                      {"distance" in p ? ` ${(p as any).distance}m` : ""}
                      {" "}({p.effort}%)
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
            disabled={!hasValidInput || isSaving}
            className="h-12 text-base"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              existingPRs.length > 0 ? "Update" : "Save"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-12 text-base">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
