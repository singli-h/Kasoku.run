"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  Check, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X,
  Monitor, Tablet, Smartphone, Search, Dumbbell, Timer, Trophy,
  ChevronLeft, Heart, Clock, Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

type DeviceView = "phone" | "tablet" | "desktop"
type UserMode = "athlete" | "coach"

interface SetData {
  id: string
  setIndex: number
  reps?: number
  weight?: number
  distance?: number
  time?: number
  power?: number
  velocity?: number
  height?: number
  rpe?: number
  completed: boolean
}

interface ExerciseData {
  id: string
  name: string
  section: string
  supersetId?: string
  sets: SetData[]
  notes?: string
  expanded: boolean
}

// Exercise library item (for picker)
interface ExerciseLibraryItem {
  id: string
  name: string
  category: string
  equipment: string
  muscleGroups: string[]
}

// =============================================================================
// Exercise Library (Demo Data)
// =============================================================================

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  // Speed
  { id: "lib-1", name: "Flying 10m", category: "Speed", equipment: "None", muscleGroups: ["Legs", "Core"] },
  { id: "lib-2", name: "Flying 20m", category: "Speed", equipment: "None", muscleGroups: ["Legs", "Core"] },
  { id: "lib-3", name: "Block Start 30m", category: "Speed", equipment: "Blocks", muscleGroups: ["Legs", "Core"] },
  { id: "lib-4", name: "Standing Start 20m", category: "Speed", equipment: "None", muscleGroups: ["Legs", "Core"] },
  { id: "lib-5", name: "A-Skips", category: "Speed", equipment: "None", muscleGroups: ["Legs", "Hip Flexors"] },
  { id: "lib-6", name: "B-Skips", category: "Speed", equipment: "None", muscleGroups: ["Legs", "Hamstrings"] },
  // Strength
  { id: "lib-10", name: "Half Squat", category: "Strength", equipment: "Barbell", muscleGroups: ["Quads", "Glutes"] },
  { id: "lib-11", name: "Power Clean", category: "Strength", equipment: "Barbell", muscleGroups: ["Full Body"] },
  { id: "lib-12", name: "Deadlift", category: "Strength", equipment: "Barbell", muscleGroups: ["Back", "Hamstrings", "Glutes"] },
  { id: "lib-13", name: "Bench Press", category: "Strength", equipment: "Barbell", muscleGroups: ["Chest", "Shoulders", "Triceps"] },
  { id: "lib-14", name: "Romanian Deadlift", category: "Strength", equipment: "Barbell", muscleGroups: ["Hamstrings", "Glutes"] },
  { id: "lib-15", name: "Hip Thrust", category: "Strength", equipment: "Barbell", muscleGroups: ["Glutes", "Hamstrings"] },
  // Plyometric
  { id: "lib-20", name: "Drop Jumps", category: "Plyometric", equipment: "Box", muscleGroups: ["Legs"] },
  { id: "lib-21", name: "Box Jumps", category: "Plyometric", equipment: "Box", muscleGroups: ["Legs"] },
  { id: "lib-22", name: "Depth Jumps", category: "Plyometric", equipment: "Box", muscleGroups: ["Legs"] },
  { id: "lib-23", name: "Hurdle Hops", category: "Plyometric", equipment: "Hurdles", muscleGroups: ["Legs"] },
  { id: "lib-24", name: "Bounding", category: "Plyometric", equipment: "None", muscleGroups: ["Legs", "Core"] },
  // Warmup
  { id: "lib-30", name: "Dynamic Stretches", category: "Warmup", equipment: "None", muscleGroups: ["Full Body"] },
  { id: "lib-31", name: "Foam Rolling", category: "Warmup", equipment: "Foam Roller", muscleGroups: ["Full Body"] },
  { id: "lib-32", name: "Leg Swings", category: "Warmup", equipment: "None", muscleGroups: ["Hip Flexors", "Hamstrings"] },
  { id: "lib-33", name: "Arm Circles", category: "Warmup", equipment: "None", muscleGroups: ["Shoulders"] },
  // Conditioning
  { id: "lib-40", name: "Tempo Runs", category: "Conditioning", equipment: "None", muscleGroups: ["Legs", "Cardio"] },
  { id: "lib-41", name: "Shuttle Runs", category: "Conditioning", equipment: "None", muscleGroups: ["Legs", "Cardio"] },
  { id: "lib-42", name: "Sled Push", category: "Conditioning", equipment: "Sled", muscleGroups: ["Legs", "Core"] },
]

const CATEGORIES = ["All", "Speed", "Strength", "Plyometric", "Warmup", "Conditioning"]

// =============================================================================
// Demo Data
// =============================================================================

const initialAthleteExercises: ExerciseData[] = [
  // Warmup Section
  {
    id: "w1",
    name: "Dynamic Stretches",
    section: "Warmup",
    sets: [
      { id: "w1s1", setIndex: 1, reps: 10, completed: true },
      { id: "w1s2", setIndex: 2, reps: 10, completed: true },
    ],
    expanded: false,
  },
  {
    id: "w2",
    name: "A-Skips",
    section: "Warmup",
    sets: [
      { id: "w2s1", setIndex: 1, distance: 20, completed: true },
      { id: "w2s2", setIndex: 2, distance: 20, completed: false },
    ],
    expanded: false,
  },
  // Speed Section - Superset
  {
    id: "s1",
    name: "Flying 10m",
    section: "Speed",
    supersetId: "A",
    sets: [
      { id: "s1s1", setIndex: 1, distance: 10, time: 1.02, completed: true },
      { id: "s1s2", setIndex: 2, distance: 10, time: 0.98, completed: true },
      { id: "s1s3", setIndex: 3, distance: 10, time: 0.95, completed: false },
    ],
    expanded: true,
  },
  {
    id: "s2",
    name: "Standing Start 20m",
    section: "Speed",
    supersetId: "A",
    sets: [
      { id: "s2s1", setIndex: 1, distance: 20, time: 2.85, completed: true },
      { id: "s2s2", setIndex: 2, distance: 20, completed: false },
    ],
    expanded: false,
  },
  // Strength Section with VBT
  {
    id: "str1",
    name: "Half Squat",
    section: "Strength",
    sets: [
      { id: "str1s1", setIndex: 1, reps: 3, weight: 80, power: 1000, velocity: 1.8, completed: true },
      { id: "str1s2", setIndex: 2, reps: 2, weight: 85, power: 1200, velocity: 1.6, completed: false },
      { id: "str1s3", setIndex: 3, reps: 1, weight: 90, power: 1500, velocity: 1.4, completed: false },
    ],
    expanded: true,
  },
  // Plyometric Section
  {
    id: "p1",
    name: "Drop Jumps",
    section: "Plyometric",
    sets: [
      { id: "p1s1", setIndex: 1, reps: 5, height: 45, completed: false },
      { id: "p1s2", setIndex: 2, reps: 5, height: 45, completed: false },
      { id: "p1s3", setIndex: 3, reps: 5, height: 50, completed: false },
    ],
    expanded: false,
  },
  // Conditioning
  {
    id: "c1",
    name: "Tempo Runs",
    section: "Conditioning",
    sets: [
      { id: "c1s1", setIndex: 1, distance: 200, time: 28, rpe: 7, completed: false },
      { id: "c1s2", setIndex: 2, distance: 200, time: 28, rpe: 8, completed: false },
    ],
    expanded: false,
  },
]

const initialCoachExercises: ExerciseData[] = [
  {
    id: "c-w1",
    name: "Foam Rolling",
    section: "Warmup",
    sets: [{ id: "cw1s1", setIndex: 1, time: 300, completed: false }],
    expanded: false,
  },
  {
    id: "c-s1",
    name: "Block Start 30m",
    section: "Speed",
    supersetId: "A",
    sets: [
      { id: "cs1s1", setIndex: 1, distance: 30, completed: false },
      { id: "cs1s2", setIndex: 2, distance: 30, completed: false },
      { id: "cs1s3", setIndex: 3, distance: 30, completed: false },
    ],
    expanded: true,
  },
  {
    id: "c-s2",
    name: "Flying 20m",
    section: "Speed",
    supersetId: "A",
    sets: [
      { id: "cs2s1", setIndex: 1, distance: 20, completed: false },
      { id: "cs2s2", setIndex: 2, distance: 20, completed: false },
    ],
    expanded: false,
  },
  {
    id: "c-str1",
    name: "Power Clean",
    section: "Strength",
    sets: [
      { id: "cstr1s1", setIndex: 1, reps: 3, weight: 60, power: 800, velocity: 1.2, completed: false },
      { id: "cstr1s2", setIndex: 2, reps: 3, weight: 70, power: 900, velocity: 1.1, completed: false },
      { id: "cstr1s3", setIndex: 3, reps: 2, weight: 80, power: 1000, velocity: 1.0, completed: false },
    ],
    expanded: false,
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

function formatShorthand(exercise: ExerciseData): string {
  const sets = exercise.sets
  if (sets.length === 0) return "No sets"

  const firstSet = sets[0]
  const isUniform = sets.every(
    (s) =>
      s.reps === firstSet.reps &&
      s.weight === firstSet.weight &&
      s.distance === firstSet.distance &&
      s.time === firstSet.time &&
      s.height === firstSet.height
  )

  if (isUniform) {
    const parts: string[] = []
    if (firstSet.reps) parts.push(`${sets.length}×${firstSet.reps}`)
    if (firstSet.distance) parts.push(`${sets.length}× ${firstSet.distance}m`)
    if (firstSet.weight) parts.push(`@ ${firstSet.weight}kg`)
    if (firstSet.time) parts.push(`${firstSet.time}s`)
    if (firstSet.height) parts.push(`@ ${firstSet.height}cm`)
    return parts.join(" ") || `${sets.length} sets`
  }

  const repsStr = sets.map((s) => s.reps).filter(Boolean)
  const weightsStr = sets.map((s) => s.weight).filter(Boolean)
  const distStr = sets.map((s) => s.distance).filter(Boolean)
  const timeStr = sets.map((s) => s.time).filter(Boolean)
  const heightStr = sets.map((s) => s.height).filter(Boolean)

  const parts: string[] = []
  if (repsStr.length > 0) parts.push(repsStr.join("+"))
  if (distStr.length > 0) parts.push(`${distStr[0]}m`)
  if (weightsStr.length > 0) {
    const validWeights = weightsStr.filter((w): w is number => w !== undefined)
    const min = Math.min(...validWeights)
    const max = Math.max(...validWeights)
    parts.push(min === max ? `@ ${min}kg` : `@ ${min}-${max}kg`)
  }
  if (timeStr.length > 0) {
    const times = timeStr.map((t) => `${t}s`).join("/")
    parts.push(times)
  }
  if (heightStr.length > 0) parts.push(`@ ${heightStr[0]}cm`)

  return parts.join(" ") || `${sets.length} sets`
}

function getCompletedCount(exercise: ExerciseData): number {
  return exercise.sets.filter((s) => s.completed).length
}

function getSectionOrder(section: string): number {
  const order: Record<string, number> = {
    Warmup: 1,
    Speed: 2,
    Plyometric: 3,
    Strength: 4,
    Conditioning: 5,
    Cooldown: 6,
  }
  return order[section] || 99
}

function groupBySupersets(exercises: ExerciseData[]): (ExerciseData | ExerciseData[])[] {
  const result: (ExerciseData | ExerciseData[])[] = []
  const supersetGroups: Record<string, ExerciseData[]> = {}

  exercises.forEach((ex) => {
    if (ex.supersetId) {
      if (!supersetGroups[ex.supersetId]) {
        supersetGroups[ex.supersetId] = []
      }
      supersetGroups[ex.supersetId].push(ex)
    }
  })

  let lastSupersetId: string | null = null
  exercises.forEach((ex) => {
    if (ex.supersetId) {
      if (ex.supersetId !== lastSupersetId) {
        result.push(supersetGroups[ex.supersetId])
        lastSupersetId = ex.supersetId
      }
    } else {
      result.push(ex)
      lastSupersetId = null
    }
  })

  return result
}

// =============================================================================
// Components
// =============================================================================

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// Timer Display Component
interface TimerDisplayProps {
  seconds: number
  size?: "sm" | "lg"
}

function TimerDisplay({ seconds, size = "lg" }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

  return (
    <div className={cn("font-mono font-bold text-primary", size === "lg" ? "text-2xl" : "text-xl")}>
      {formatted}
    </div>
  )
}

interface SetRowProps {
  set: SetData
  isAthlete: boolean
  deviceView: DeviceView
  isActive?: boolean
  hasVBTFields?: boolean
  onComplete?: () => void
  onUpdate?: (field: keyof SetData, value: number | undefined) => void
  onRemove?: () => void
  // Drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, setId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetSetId: string) => void
}

function SetRow({
  set,
  isAthlete,
  deviceView,
  isActive,
  hasVBTFields,
  onComplete,
  onUpdate,
  onRemove,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}: SetRowProps) {
  const hasVBT = set.power !== undefined || set.velocity !== undefined || hasVBTFields

  // Determine which fields to show based on exercise data (only show if plan has value)
  const showReps = set.reps !== undefined || (!set.distance && !set.time)
  const showWeight = set.weight !== undefined
  const showDistance = set.distance !== undefined
  const showTime = set.time !== undefined
  const showHeight = set.height !== undefined
  const showPower = hasVBT
  const showVelocity = hasVBT
  const showRPE = set.rpe !== undefined

  // Unified athlete view - same layout for all states, inline editable inputs
  // Larger height and font for better touch interaction
  if (isAthlete) {
    // Shared input styles - larger for better touch targets
    const inputClass = cn(
      "h-8 text-center font-mono text-sm bg-transparent border-0 rounded",
      "focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none",
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
      "transition-colors cursor-text"
    )

    return (
      <div className={cn(
        "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
        set.completed ? "bg-green-500/10" : "bg-muted/30"
      )}>
        {/* Set number / completion toggle - larger touch target */}
        <button
          onClick={onComplete}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0",
            set.completed
              ? "bg-green-500 text-white"
              : "bg-background border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {set.completed ? <Check className="w-4 h-4" /> : set.setIndex}
        </button>

        {/* Inline editable inputs - same layout always, no shift */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {showReps && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                value={set.reps ?? ""}
                onChange={(e) => onUpdate?.("reps", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-8")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">×</span>
            </div>
          )}
          {showWeight && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                step={0.5}
                value={set.weight ?? ""}
                onChange={(e) => onUpdate?.("weight", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-10")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">kg</span>
            </div>
          )}
          {showDistance && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                value={set.distance ?? ""}
                onChange={(e) => onUpdate?.("distance", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-9")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">m</span>
            </div>
          )}
          {showTime && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                step={0.01}
                value={set.time ?? ""}
                onChange={(e) => onUpdate?.("time", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-12")}
                placeholder="0.00"
              />
              <span className="text-muted-foreground text-xs">s</span>
            </div>
          )}
          {showHeight && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                value={set.height ?? ""}
                onChange={(e) => onUpdate?.("height", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-9")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">cm</span>
            </div>
          )}
          {showPower && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                value={set.power ?? ""}
                onChange={(e) => onUpdate?.("power", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-12")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">W</span>
            </div>
          )}
          {showVelocity && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                step={0.01}
                value={set.velocity ?? ""}
                onChange={(e) => onUpdate?.("velocity", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-12")}
                placeholder="0.00"
              />
              <span className="text-muted-foreground text-xs">m/s</span>
            </div>
          )}
          {showRPE && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <span className="text-muted-foreground text-xs">RPE</span>
              <input
                type="number"
                min={1}
                max={10}
                value={set.rpe ?? ""}
                onChange={(e) => onUpdate?.("rpe", e.target.value ? Number(e.target.value) : undefined)}
                className={cn(inputClass, "w-7")}
                placeholder="--"
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Coach planning view - pill notation style with units (matching athlete sizing)
  // Larger height and font for better touch interaction
  const coachInputClass = cn(
    "h-8 text-center font-mono text-sm bg-transparent border-0 rounded",
    "focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none",
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    "transition-colors cursor-text"
  )

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, set.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(e)
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop?.(e, set.id)}
      className={cn(
        "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
        isDragging ? "opacity-50 bg-primary/10 border border-dashed border-primary" : "bg-muted/30 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
          {set.setIndex}
        </span>
      </div>

      {/* Pill notation inputs - same style as athlete, units always visible */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            value={set.reps ?? ""}
            onChange={(e) => onUpdate?.("reps", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-8")}
            placeholder="--"
          />
          <span className="text-muted-foreground text-xs">×</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            step={0.5}
            value={set.weight ?? ""}
            onChange={(e) => onUpdate?.("weight", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-10")}
            placeholder="--"
          />
          <span className="text-muted-foreground text-xs">kg</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            value={set.distance ?? ""}
            onChange={(e) => onUpdate?.("distance", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-9")}
            placeholder="--"
          />
          <span className="text-muted-foreground text-xs">m</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            step={0.01}
            value={set.time ?? ""}
            onChange={(e) => onUpdate?.("time", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-12")}
            placeholder="0.00"
          />
          <span className="text-muted-foreground text-xs">s</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            value={set.power ?? ""}
            onChange={(e) => onUpdate?.("power", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-12")}
            placeholder="--"
          />
          <span className="text-muted-foreground text-xs">W</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <input
            type="number"
            step={0.01}
            value={set.velocity ?? ""}
            onChange={(e) => onUpdate?.("velocity", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-12")}
            placeholder="0.00"
          />
          <span className="text-muted-foreground text-xs">m/s</span>
        </div>
        <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
          <span className="text-muted-foreground text-xs">RPE</span>
          <input
            type="number"
            min={1}
            max={10}
            value={set.rpe ?? ""}
            onChange={(e) => onUpdate?.("rpe", e.target.value ? Number(e.target.value) : undefined)}
            className={cn(coachInputClass, "w-7")}
            placeholder="--"
          />
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ExerciseCardProps {
  exercise: ExerciseData
  isAthlete: boolean
  deviceView: DeviceView
  showSupersetBar?: boolean
  supersetLabel?: string
  onToggleExpand: () => void
  onCompleteSet: (setId: string) => void
  onCompleteAllSets?: () => void
  onUpdateSet?: (setId: string, field: keyof SetData, value: number | undefined) => void
  onAddSet?: () => void
  onRemoveSet?: (setId: string) => void
  onRemoveExercise?: () => void
  onUpdateName?: (name: string) => void
  // Set reordering
  onReorderSets?: (fromIndex: number, toIndex: number) => void
  // Exercise drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, exerciseId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetExerciseId: string) => void
}

function ExerciseCard({
  exercise,
  isAthlete,
  deviceView,
  showSupersetBar,
  supersetLabel,
  onToggleExpand,
  onCompleteSet,
  onCompleteAllSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onUpdateName,
  onReorderSets,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: ExerciseCardProps) {
  const [draggingSetId, setDraggingSetId] = useState<string | null>(null)
  const [dragOverSetId, setDragOverSetId] = useState<string | null>(null)

  const completedCount = getCompletedCount(exercise)
  const totalSets = exercise.sets.length
  const isComplete = completedCount === totalSets
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0

  const handleHeaderClick = () => {
    onToggleExpand()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggleExpand()
    }
  }

  // Set drag handlers
  const handleSetDragStart = (e: React.DragEvent, setId: string) => {
    setDraggingSetId(setId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", setId)
  }

  const handleSetDragOver = (e: React.DragEvent, setId: string) => {
    e.preventDefault()
    if (setId !== draggingSetId) {
      setDragOverSetId(setId)
    }
  }

  const handleSetDragEnd = () => {
    setDraggingSetId(null)
    setDragOverSetId(null)
  }

  const handleSetDrop = (e: React.DragEvent, targetSetId: string) => {
    e.preventDefault()
    if (draggingSetId && draggingSetId !== targetSetId && onReorderSets) {
      const fromIndex = exercise.sets.findIndex((s) => s.id === draggingSetId)
      const toIndex = exercise.sets.findIndex((s) => s.id === targetSetId)
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorderSets(fromIndex, toIndex)
      }
    }
    setDraggingSetId(null)
    setDragOverSetId(null)
  }

  return (
    <div
      className={cn(
        "flex transition-opacity",
        isDragging && "opacity-50"
      )}
      draggable={!isAthlete}
      onDragStart={(e) => !isAthlete && onDragStart?.(e, exercise.id)}
      onDragOver={(e) => {
        if (!isAthlete) {
          e.preventDefault()
          onDragOver?.(e)
        }
      }}
      onDragEnd={() => !isAthlete && onDragEnd?.()}
      onDrop={(e) => !isAthlete && onDrop?.(e, exercise.id)}
    >
      {showSupersetBar && (
        <div className="w-1 bg-primary/60 rounded-full mr-3 shrink-0 relative">
          {supersetLabel && (
            <span className="absolute -left-1 top-0 text-[10px] font-bold text-primary bg-background px-0.5">
              {supersetLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
        {/* Header - compact to give more space to sets */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleHeaderClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
            !isAthlete ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Drag grip for coach mode - integrated into header */}
            {!isAthlete && (
              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 -ml-1" />
            )}
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                isComplete
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="w-3 h-3" /> : completedCount}
            </div>

            <div className="flex-1 min-w-0">
              {isAthlete ? (
                <h3 className="text-sm font-medium truncate">{exercise.name}</h3>
              ) : (
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => onUpdateName?.(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 w-full"
                />
              )}
              <p className="text-xs text-muted-foreground truncate">
                {formatShorthand(exercise)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAthlete && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {completedCount}/{totalSets}
              </span>
            )}

            {!isAthlete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveExercise?.()
                }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {exercise.expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isAthlete && (
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {exercise.expanded && (
          <div className="p-4 pt-2 space-y-2 border-t border-border">
            {exercise.sets.map((set, index) => {
              // First incomplete set is active
              const firstIncompleteIndex = exercise.sets.findIndex((s) => !s.completed)
              const isActive = isAthlete && index === firstIncompleteIndex
              const hasVBTFields = exercise.sets.some((s) => s.power !== undefined || s.velocity !== undefined)
              const isSetDragging = draggingSetId === set.id
              const isSetDragOver = dragOverSetId === set.id

              return (
                <div
                  key={set.id}
                  className={cn(
                    "transition-all",
                    isSetDragOver && "border-t-2 border-primary pt-1"
                  )}
                >
                  <SetRow
                    set={set}
                    isAthlete={isAthlete}
                    deviceView={deviceView}
                    isActive={isActive}
                    hasVBTFields={hasVBTFields}
                    onComplete={() => onCompleteSet(set.id)}
                    onUpdate={(field, value) => onUpdateSet?.(set.id, field, value)}
                    onRemove={() => onRemoveSet?.(set.id)}
                    isDragging={isSetDragging}
                    onDragStart={handleSetDragStart}
                    onDragOver={(e) => handleSetDragOver(e, set.id)}
                    onDragEnd={handleSetDragEnd}
                    onDrop={handleSetDrop}
                  />
                </div>
              )
            })}

            {!isAthlete && (
              <button
                onClick={onAddSet}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg hover:border-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Set
              </button>
            )}

            {exercise.notes && (
              <p className="text-sm text-muted-foreground italic mt-2 px-3">
                {exercise.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Exercise Picker Sheet (Full-screen bottom sheet)
// =============================================================================

interface ExercisePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: ExerciseLibraryItem, section: string) => void
  recentExercises?: string[] // IDs of recently used exercises
}

function ExercisePickerSheet({ isOpen, onClose, onSelectExercise, recentExercises = [] }: ExercisePickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSection, setSelectedSection] = useState("Warmup")

  const filteredExercises = useMemo(() => {
    let exercises = EXERCISE_LIBRARY

    // Filter by category
    if (selectedCategory !== "All") {
      exercises = exercises.filter(e => e.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      exercises = exercises.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.muscleGroups.some(m => m.toLowerCase().includes(query)) ||
        e.equipment.toLowerCase().includes(query)
      )
    }

    return exercises
  }, [searchQuery, selectedCategory])

  const recentExercisesList = useMemo(() => {
    return EXERCISE_LIBRARY.filter(e => recentExercises.includes(e.id)).slice(0, 5)
  }, [recentExercises])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold flex-1">Add Exercise</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Section Selector */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Add to:</span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-sm font-medium bg-transparent border-0 focus:outline-none cursor-pointer"
          >
            {["Warmup", "Speed", "Plyometric", "Strength", "Conditioning", "Cooldown"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Exercises */}
        {recentExercisesList.length > 0 && !searchQuery && selectedCategory === "All" && (
          <div className="px-4 py-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Recent</h3>
            <div className="space-y-1">
              {recentExercisesList.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    onSelectExercise(exercise, selectedSection)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{exercise.muscleGroups.join(", ")}</p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Exercises */}
        <div className="px-4 py-3">
          {!searchQuery && selectedCategory === "All" && recentExercisesList.length > 0 && (
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">All Exercises</h3>
          )}
          <div className="space-y-1">
            {filteredExercises.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exercises found</p>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    onSelectExercise(exercise, selectedSection)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    exercise.category === "Speed" && "bg-blue-500/10 text-blue-500",
                    exercise.category === "Strength" && "bg-red-500/10 text-red-500",
                    exercise.category === "Plyometric" && "bg-orange-500/10 text-orange-500",
                    exercise.category === "Warmup" && "bg-green-500/10 text-green-500",
                    exercise.category === "Conditioning" && "bg-purple-500/10 text-purple-500"
                  )}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {exercise.equipment} · {exercise.muscleGroups.join(", ")}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Session Completion Modal
// =============================================================================

interface SessionCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  completedSets: number
  totalSets: number
  completedExercises: number
  totalExercises: number
  elapsedSeconds: number
}

function SessionCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  completedSets,
  totalSets,
  completedExercises,
  totalExercises,
  elapsedSeconds
}: SessionCompletionModalProps) {
  if (!isOpen) return null

  const isPartial = completedSets < totalSets
  const completionPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          isPartial ? "bg-yellow-500/10" : "bg-green-500/10"
        )}>
          {isPartial ? (
            <Timer className="w-8 h-8 text-yellow-500" />
          ) : (
            <Trophy className="w-8 h-8 text-green-500" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-2">
          {isPartial ? "Finish Early?" : "Great Workout!"}
        </h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isPartial
            ? `You've completed ${completionPercent}% of your planned workout. Save what you've done?`
            : "You crushed it! All sets completed."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatTime(elapsedSeconds)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{completedExercises}/{totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors"
          >
            {isPartial ? "Keep Going" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
              isPartial
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {isPartial ? "Save & Finish" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Floating Action Button
// =============================================================================

interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
}

function FloatingActionButton({ onClick, icon, label }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
    >
      {icon || <Plus className="w-5 h-5" />}
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

// =============================================================================
// Device Frame Components
// =============================================================================

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[375px]">
      <div className="bg-card rounded-4xl border-4 border-border overflow-hidden shadow-2xl">
        {/* Notch */}
        <div className="h-8 bg-background flex items-center justify-center">
          <div className="w-20 h-5 bg-border rounded-full" />
        </div>
        <div className="max-h-[600px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Phone View (375px)</p>
    </div>
  )
}

function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[768px]">
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-xl">
        <div className="max-h-[700px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Tablet View (768px)</p>
    </div>
  )
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1024px]">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
        <div className="max-h-[700px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Desktop View (1024px)</p>
    </div>
  )
}

// =============================================================================
// Main Workout View Component
// =============================================================================

interface WorkoutViewProps {
  deviceView: DeviceView
  userMode: UserMode
  exercises: ExerciseData[]
  elapsedSeconds: number
  isTimerRunning: boolean
  onToggleTimer: () => void
  onToggleExpand: (id: string) => void
  onCompleteSet: (exerciseId: string, setId: string) => void
  onCompleteAllSets: (exerciseId: string) => void
  onUpdateSet: (exerciseId: string, setId: string, field: keyof SetData, value: number | undefined) => void
  onAddSet: (exerciseId: string) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onAddExerciseFromLibrary: (exercise: ExerciseLibraryItem, section: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onUpdateName: (exerciseId: string, name: string) => void
  onReorderSets: (exerciseId: string, fromIndex: number, toIndex: number) => void
  onReorderExercises: (fromId: string, toId: string) => void
  onFinishSession: () => void
}

function WorkoutView({
  deviceView,
  userMode,
  exercises,
  elapsedSeconds,
  isTimerRunning,
  onToggleTimer,
  onToggleExpand,
  onCompleteSet,
  onCompleteAllSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onAddExerciseFromLibrary,
  onRemoveExercise,
  onUpdateName,
  onReorderSets,
  onReorderExercises,
  onFinishSession,
}: WorkoutViewProps) {
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  const isAthlete = userMode === "athlete"

  // Exercise drag handlers
  const handleExerciseDragStart = (e: React.DragEvent, exerciseId: string) => {
    setDraggingExerciseId(exerciseId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", exerciseId)
  }

  const handleExerciseDragEnd = () => {
    setDraggingExerciseId(null)
  }

  const handleExerciseDrop = (e: React.DragEvent, targetExerciseId: string) => {
    e.preventDefault()
    if (draggingExerciseId && draggingExerciseId !== targetExerciseId) {
      onReorderExercises(draggingExerciseId, targetExerciseId)
    }
    setDraggingExerciseId(null)
  }

  const sections = [...new Set(exercises.map((e) => e.section))].sort(
    (a, b) => getSectionOrder(a) - getSectionOrder(b)
  )

  const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0)
  const completedSets = exercises.reduce((acc, e) => acc + getCompletedCount(e), 0)
  const overallProgress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  const completedExercises = exercises.filter(e => e.sets.every(s => s.completed)).length

  return (
    <div className="bg-background min-h-full relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className={cn("px-4 py-3", deviceView === "desktop" && "px-6")}>
          {/* Title Row */}
          <h1 className={cn("font-semibold mb-2", deviceView === "phone" ? "text-base" : "text-lg")}>
            {isAthlete ? "Sprint Power Development" : "Week 3 Day 2"}
          </h1>

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isAthlete ? (
                <span>{overallProgress}% complete</span>
              ) : (
                <span>{totalSets} sets · {exercises.length} exercises</span>
              )}
            </div>

            {/* Timer & Actions */}
            <div className="flex items-center gap-2">
              {isAthlete && (
                <button
                  onClick={onToggleTimer}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors",
                    isTimerRunning
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Timer className="w-4 h-4" />
                  <TimerDisplay seconds={elapsedSeconds} size="sm" />
                </button>
              )}

              {/* Finish Button */}
              <button
                onClick={() => setShowCompletionModal(true)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  overallProgress === 100
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
              >
                {isAthlete ? "Finish" : "Save"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {isAthlete && (
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("px-4 py-4 space-y-2 pb-24", deviceView === "desktop" && "px-6")}>
        {exercises.length === 0 ? (
          <div className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">No exercises yet</p>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              Add Your First Exercise
            </button>
          </div>
        ) : (
          <>
            {/* Unified single-column layout for all devices (phone/tablet/desktop) */}
            {sections.map((section) => {
              const sectionExercises = exercises.filter((e) => e.section === section)
              const grouped = groupBySupersets(sectionExercises)

              return (
                <div key={section}>
                  <SectionDivider label={section} />
                  <div className="space-y-3 pl-2">
                    {grouped.map((item, idx) => {
                      if (Array.isArray(item)) {
                        return (
                          <div key={`superset-${idx}`} className="space-y-3">
                            {item.map((ex, exIdx) => (
                              <ExerciseCard
                                key={ex.id}
                                exercise={ex}
                                isAthlete={isAthlete}
                                deviceView={deviceView}
                                showSupersetBar
                                supersetLabel={exIdx === 0 ? ex.supersetId : undefined}
                                onToggleExpand={() => onToggleExpand(ex.id)}
                                onCompleteSet={(setId) => onCompleteSet(ex.id, setId)}
                                onCompleteAllSets={() => onCompleteAllSets(ex.id)}
                                onUpdateSet={(setId, field, value) => onUpdateSet(ex.id, setId, field, value)}
                                onAddSet={() => onAddSet(ex.id)}
                                onRemoveSet={(setId) => onRemoveSet(ex.id, setId)}
                                onRemoveExercise={() => onRemoveExercise(ex.id)}
                                onUpdateName={(name) => onUpdateName(ex.id, name)}
                                onReorderSets={(fromIndex, toIndex) => onReorderSets(ex.id, fromIndex, toIndex)}
                                isDragging={draggingExerciseId === ex.id}
                                onDragStart={handleExerciseDragStart}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnd={handleExerciseDragEnd}
                                onDrop={handleExerciseDrop}
                              />
                            ))}
                          </div>
                        )
                      }
                      return (
                        <ExerciseCard
                          key={item.id}
                          exercise={item}
                          isAthlete={isAthlete}
                          deviceView={deviceView}
                          onToggleExpand={() => onToggleExpand(item.id)}
                          onCompleteSet={(setId) => onCompleteSet(item.id, setId)}
                          onCompleteAllSets={() => onCompleteAllSets(item.id)}
                          onUpdateSet={(setId, field, value) => onUpdateSet(item.id, setId, field, value)}
                          onAddSet={() => onAddSet(item.id)}
                          onRemoveSet={(setId) => onRemoveSet(item.id, setId)}
                          onRemoveExercise={() => onRemoveExercise(item.id)}
                          onUpdateName={(name) => onUpdateName(item.id, name)}
                          onReorderSets={(fromIndex, toIndex) => onReorderSets(item.id, fromIndex, toIndex)}
                          isDragging={draggingExerciseId === item.id}
                          onDragStart={handleExerciseDragStart}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnd={handleExerciseDragEnd}
                          onDrop={handleExerciseDrop}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Floating Action Button - Add Exercise */}
      {exercises.length > 0 && (
        <button
          onClick={() => setShowExercisePicker(true)}
          className="absolute bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Add Exercise</span>
        </button>
      )}

      {/* Exercise Picker Sheet */}
      <ExercisePickerSheet
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={(exercise, section) => {
          onAddExerciseFromLibrary(exercise, section)
        }}
        recentExercises={["lib-1", "lib-10", "lib-20"]} // Demo: recent exercises
      />

      {/* Session Completion Modal */}
      <SessionCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={() => {
          setShowCompletionModal(false)
          onFinishSession()
        }}
        completedSets={completedSets}
        totalSets={totalSets}
        completedExercises={completedExercises}
        totalExercises={exercises.length}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function WorkoutUIDemo() {
  const [deviceView, setDeviceView] = useState<DeviceView>("phone")
  const [userMode, setUserMode] = useState<UserMode>("athlete")
  const [athleteExercises, setAthleteExercises] = useState<ExerciseData[]>(initialAthleteExercises)
  const [coachExercises, setCoachExercises] = useState<ExerciseData[]>(initialCoachExercises)
  const [elapsedSeconds, setElapsedSeconds] = useState(1122) // Start at 18:42 like the prototype
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || userMode !== "athlete") return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, userMode])

  const exercises = userMode === "athlete" ? athleteExercises : coachExercises
  const setExercises = userMode === "athlete" ? setAthleteExercises : setCoachExercises

  // Handlers
  const handleToggleExpand = useCallback(
    (exerciseId: string) => {
      setExercises((prev) =>
        prev.map((e) => (e.id === exerciseId ? { ...e, expanded: !e.expanded } : e))
      )
    },
    [setExercises]
  )

  const handleCompleteSet = useCallback(
    (exerciseId: string, setId: string) => {
      setExercises((prev) =>
        prev.map((e) =>
          e.id === exerciseId
            ? {
                ...e,
                sets: e.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
              }
            : e
        )
      )
    },
    [setExercises]
  )

  const handleCompleteAllSets = useCallback(
    (exerciseId: string) => {
      setExercises((prev) =>
        prev.map((e) =>
          e.id === exerciseId
            ? {
                ...e,
                sets: e.sets.map((s) => ({ ...s, completed: true })),
              }
            : e
        )
      )
    },
    [setExercises]
  )

  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, field: keyof SetData, value: number | undefined) => {
      setExercises((prev) =>
        prev.map((e) =>
          e.id === exerciseId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
            : e
        )
      )
    },
    [setExercises]
  )

  const handleAddSet = useCallback(
    (exerciseId: string) => {
      setExercises((prev) =>
        prev.map((e) => {
          if (e.id !== exerciseId) return e
          const newSetIndex = e.sets.length + 1
          return {
            ...e,
            sets: [...e.sets, { id: `${exerciseId}-s${newSetIndex}`, setIndex: newSetIndex, completed: false }],
          }
        })
      )
    },
    [setExercises]
  )

  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) => {
      setExercises((prev) =>
        prev.map((e) => {
          if (e.id !== exerciseId) return e
          const newSets = e.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, setIndex: i + 1 }))
          return { ...e, sets: newSets }
        })
      )
    },
    [setExercises]
  )

  const handleAddExerciseFromLibrary = useCallback(
    (exercise: ExerciseLibraryItem, section: string) => {
      const newId = `new-${Date.now()}`
      setExercises((prev) => [
        ...prev,
        { id: newId, name: exercise.name, section, sets: [{ id: `${newId}-s1`, setIndex: 1, completed: false }], expanded: true },
      ])
    },
    [setExercises]
  )

  const handleFinishSession = useCallback(() => {
    // In a real app, this would save to the database
    alert(`Session completed! ${exercises.reduce((acc, e) => acc + e.sets.filter(s => s.completed).length, 0)} sets saved.`)
  }, [exercises])

  const handleRemoveExercise = useCallback(
    (exerciseId: string) => {
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId))
    },
    [setExercises]
  )

  const handleUpdateName = useCallback(
    (exerciseId: string, name: string) => {
      setExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, name } : e)))
    },
    [setExercises]
  )

  const handleReorderSets = useCallback(
    (exerciseId: string, fromIndex: number, toIndex: number) => {
      setExercises((prev) =>
        prev.map((e) => {
          if (e.id !== exerciseId) return e
          const newSets = [...e.sets]
          const [movedSet] = newSets.splice(fromIndex, 1)
          newSets.splice(toIndex, 0, movedSet)
          // Update setIndex for all sets
          return {
            ...e,
            sets: newSets.map((s, i) => ({ ...s, setIndex: i + 1 })),
          }
        })
      )
    },
    [setExercises]
  )

  const handleReorderExercises = useCallback(
    (fromId: string, toId: string) => {
      setExercises((prev) => {
        const fromIndex = prev.findIndex((e) => e.id === fromId)
        const toIndex = prev.findIndex((e) => e.id === toId)
        if (fromIndex === -1 || toIndex === -1) return prev
        const newExercises = [...prev]
        const [movedExercise] = newExercises.splice(fromIndex, 1)
        newExercises.splice(toIndex, 0, movedExercise)
        return newExercises
      })
    },
    [setExercises]
  )

  const DeviceFrame = deviceView === "phone" ? PhoneFrame : deviceView === "tablet" ? TabletFrame : DesktopFrame

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Workout UI Demo</h1>

            <div className="flex items-center gap-4">
              {/* Device tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setDeviceView("phone")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "phone" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="w-4 h-4" />
                  Phone
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "tablet" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Tablet className="w-4 h-4" />
                  Tablet
                </button>
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                </button>
              </div>

              {/* User mode tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setUserMode("athlete")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    userMode === "athlete" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Athlete
                </button>
                <button
                  onClick={() => setUserMode("coach")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    userMode === "coach" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Coach
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo content */}
      <div className="py-8 px-4">
        <DeviceFrame>
          <WorkoutView
            deviceView={deviceView}
            userMode={userMode}
            exercises={exercises}
            elapsedSeconds={elapsedSeconds}
            isTimerRunning={isTimerRunning}
            onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
            onToggleExpand={handleToggleExpand}
            onCompleteSet={handleCompleteSet}
            onCompleteAllSets={handleCompleteAllSets}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onAddExerciseFromLibrary={handleAddExerciseFromLibrary}
            onRemoveExercise={handleRemoveExercise}
            onUpdateName={handleUpdateName}
            onReorderSets={handleReorderSets}
            onReorderExercises={handleReorderExercises}
            onFinishSession={handleFinishSession}
          />
        </DeviceFrame>
      </div>
    </div>
  )
}
