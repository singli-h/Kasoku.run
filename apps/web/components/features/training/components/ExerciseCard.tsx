"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { ArrowRight, Bot, Check, ChevronDown, ChevronUp, GripVertical, MessageSquare, Plus, Trash2, Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatSubgroupChip } from "@/lib/training-utils"
import type { TrainingExercise, TrainingSet } from "../types"
import { getCompletedCount } from "../types"
import { SetRow, type VisibleFields } from "./SetRow"
import { getVisibleFields } from "../utils/field-visibility"
import type { UIDisplayType } from "@/lib/changeset/types"
import { AI_BG_COLORS } from "@/lib/changeset/ui-constants"
import type { AISetChangeInfo } from "@/components/features/ai-assistant/hooks"
import { isFreeelapMetadata, type FreeelapMetadata } from "@/types/freelap"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { SubgroupBadge } from "@/components/features/athletes/components/subgroup-badge"
import { useToast } from "@/hooks/use-toast"
import { findPR } from "../../workout/hooks/use-exercise-prs"
import { PRInputSheet, getSprintPRMode, SPRINT_AUTO_PR_NAMES } from "../../workout/components/exercise/pr-input-sheet"
import { ExerciseTypeId } from "../../workout/utils/exercise-grouping"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

export interface ExerciseCardProps {
  exercise: TrainingExercise
  isAthlete: boolean
  showSupersetBar?: boolean
  supersetLabel?: string
  onToggleExpand: () => void
  onCompleteSet: (setId: string | number) => void
  onCompleteAllSets?: () => void
  onUpdateSet?: (setId: string | number, field: keyof TrainingSet, value: number | string | null) => void
  /** Callback for updating Freelap metadata on a set */
  onUpdateSetMetadata?: (setId: string | number, metadata: FreeelapMetadata) => void
  onAddSet?: () => void
  onRemoveSet?: (setId: string | number) => void
  onRemoveExercise?: () => void
  // Set reordering
  onReorderSets?: (fromIndex: number, toIndex: number) => void
  // Exercise drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, exerciseId: string | number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetExerciseId: string | number) => void
  // Selection mode for superset creation
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelection?: (exerciseId: string | number) => void
  // AI pending change indicators
  /** Whether this exercise has a pending AI change */
  hasPendingChange?: boolean
  /** The type of AI change for styling */
  aiChangeType?: UIDisplayType | null
  /** Map of set ID to pending change info */
  setAIChanges?: Map<string | number, AISetChangeInfo>
  /** Fallback map for set changes without known exercise (keyed by set ID) */
  ungroupedSetChanges?: Map<string | number, AISetChangeInfo>
  /** Pending new sets (CREATE operations) for ghost row rendering */
  pendingNewSets?: AISetChangeInfo[]
  /** Count of sets with pending AI changes */
  pendingSetCount?: number
  /** For SWAP: proposed exercise data (contains new exercise name) */
  aiProposedData?: Record<string, unknown> | null
  /** For DELETE: current exercise data */
  aiCurrentData?: Record<string, unknown> | null
  /** Whether this is a ghost exercise card (pending CREATE) */
  isGhostExercise?: boolean
  /** Whether to show all optional fields (true) or only required + filled fields (false) */
  showAllFields?: boolean
  /**
   * T054: Whether to show advanced fields (RPE, tempo, velocity, effort)
   * Passed down to SetRow. When false, these fields are hidden even if visibleFields allows them.
   * @default true
   */
  showAdvancedFields?: boolean
  /** Available subgroups for subgroup filtering popover */
  availableSubgroups?: string[]
  /** Callback when target_subgroups is changed via the subgroup popover */
  onUpdateTargetSubgroups?: (groups: string[] | null) => void
  /** Preview group for dimming — when set, non-matching exercises get reduced opacity */
  previewGroup?: string | null
  /** Callback when exercise notes are updated (coach mode) */
  onUpdateNotes?: (notes: string | null) => void
  /** Personal records for this exercise (multiple for sprint distances) */
  prs?: PersonalBest[]
  /** Callback to save/update a PR */
  onSavePR?: (exerciseId: number, value: number, unitId: number, distance?: number | null) => Promise<boolean>
}

/**
 * ExerciseCard - Unified exercise card for both athlete and coach views
 *
 * - Athlete view: Tappable to expand, shows progress, completion toggle per set
 * - Coach view: Draggable for reordering, add/remove sets
 */
export function ExerciseCard({
  exercise,
  isAthlete,
  showSupersetBar,
  supersetLabel,
  onToggleExpand,
  onCompleteSet,
  onCompleteAllSets,
  onUpdateSet,
  onUpdateSetMetadata,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onReorderSets,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  // Selection mode props
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  // AI indicator props
  hasPendingChange = false,
  aiChangeType,
  setAIChanges,
  ungroupedSetChanges,
  pendingNewSets = [],
  pendingSetCount = 0,
  aiProposedData,
  aiCurrentData,
  isGhostExercise = false,
  showAllFields = false,
  showAdvancedFields = true,
  availableSubgroups,
  onUpdateTargetSubgroups,
  previewGroup,
  onUpdateNotes,
  prs,
  onSavePR,
}: ExerciseCardProps) {
  const { toast } = useToast()

  // Derive AI change states
  // Enhanced swap detection: also check if proposedData has a different exercise_id
  // This handles cases where currentData is null but we can compare with exercise.exerciseId
  // Check both snake_case (from transformations) and camelCase (fallback) for consistency
  const proposedExerciseId = (
    aiProposedData?.exercise_id ??     // Primary: snake_case from transformations
    aiProposedData?.exerciseId         // Fallback: camelCase
  ) as number | string | undefined
  const isSwapByExerciseId = (
    hasPendingChange &&
    aiChangeType === 'update' && // Updates that change exercise_id are swaps
    proposedExerciseId !== undefined &&
    proposedExerciseId !== exercise.exerciseId
  )
  const isSwap = aiChangeType === 'swap' || isSwapByExerciseId
  const isRemove = aiChangeType === 'remove'
  const isAdd = aiChangeType === 'add'

  // For swap: get new exercise name from proposed data (check both naming conventions)
  const swapNewName = isSwap ? (
    aiProposedData?.exercise_name ??    // Primary: snake_case from transformations
    aiProposedData?.exerciseName        // Fallback: camelCase
  ) as string | undefined : undefined
  // Subgroup chip display
  const subgroupChipText = formatSubgroupChip(exercise.targetSubgroups ?? null)

  // Preview dimming: if previewGroup is active, dim exercises that don't target it
  const isDimmedByPreview = useMemo(() => {
    if (!previewGroup) return false // no preview active
    if (!exercise.targetSubgroups || exercise.targetSubgroups.length === 0) return false // null = ALL
    return !exercise.targetSubgroups.includes(previewGroup)
  }, [previewGroup, exercise.targetSubgroups])

  const [subgroupPopoverOpen, setSubgroupPopoverOpen] = useState(false)

  const [draggingSetId, setDraggingSetId] = useState<string | number | null>(null)
  const [dragOverSetId, setDragOverSetId] = useState<string | number | null>(null)

  // Freelap expansion state - track which set IDs are expanded
  const [expandedFreeelapIds, setExpandedFreeelapIds] = useState<Set<string | number>>(new Set())

  // Toggle Freelap expansion for a set
  const toggleFreeelapExpand = useCallback((setId: string | number) => {
    setExpandedFreeelapIds(prev => {
      const next = new Set(prev)
      if (next.has(setId)) {
        next.delete(setId)
      } else {
        next.add(setId)
      }
      return next
    })
  }, [])

  // --- PR Support ---
  const [showPRSheet, setShowPRSheet] = useState(false)

  const supportsPR = useMemo(() => {
    if (!isAthlete || !onSavePR) return false
    const typeId = exercise.exerciseTypeId
    if (typeId === ExerciseTypeId.Gym) return true
    if (typeId === ExerciseTypeId.Sprint) return getSprintPRMode(exercise.name) !== null
    return false
  }, [isAthlete, onSavePR, exercise.exerciseTypeId, exercise.name])

  // Compute effort-based placeholders per set from PR data
  const setPlaceholders = useMemo(() => {
    const map = new Map<string | number, Partial<Record<keyof TrainingSet, string>>>()
    if (!prs || prs.length === 0) return map
    const typeId = exercise.exerciseTypeId
    const sprintMode = typeId === ExerciseTypeId.Sprint ? getSprintPRMode(exercise.name) : null

    for (const set of exercise.sets) {
      // set.effort is in UI format (0-200), convert to 0-1 for calculations
      const effort = set.effort != null && set.effort > 0
        ? set.effort / 100
        : null
      if (!effort) continue

      if (typeId === ExerciseTypeId.Gym) {
        const pr = findPR(prs)
        if (pr?.value) map.set(set.id, { weight: (pr.value * effort).toFixed(1) })
      } else if (sprintMode?.type === 'direct' || sprintMode?.type === 'dynamic') {
        if (set.distance) {
          const pr = findPR(prs, set.distance)
          if (pr?.value) map.set(set.id, { performingTime: (pr.value / effort).toFixed(2) })
        }
      } else if (sprintMode?.type === 'reference') {
        const pr = findPR(prs, sprintMode.raceDistance)
        if (pr?.value && set.distance) {
          const target = pr.value * (set.distance / sprintMode.raceDistance) / effort
          map.set(set.id, { performingTime: target.toFixed(2) })
        }
      }
    }
    return map
  }, [prs, exercise.sets, exercise.exerciseTypeId, exercise.name])

  // Set efforts for PRInputSheet preview
  const setEfforts = useMemo(() => {
    if (!supportsPR) return []
    return exercise.sets.map((set, idx) => ({
      effort: set.effort ?? null,
      distance: set.distance ?? null,
      setIndex: idx + 1,
    }))
  }, [supportsPR, exercise.sets])

  // Compute effective PR per set for effort badge recalculation
  const setEffectivePRs = useMemo(() => {
    const map = new Map<string | number, number>()
    if (!prs || prs.length === 0) return map
    const typeId = exercise.exerciseTypeId
    const sprintMode = typeId === ExerciseTypeId.Sprint ? getSprintPRMode(exercise.name) : null
    for (const set of exercise.sets) {
      if (typeId === ExerciseTypeId.Gym) {
        const pr = findPR(prs)
        if (pr?.value) map.set(set.id, pr.value)
      } else if (sprintMode?.type === 'direct' || sprintMode?.type === 'dynamic') {
        if (set.distance) {
          const pr = findPR(prs, set.distance)
          if (pr?.value) map.set(set.id, pr.value)
        }
      } else if (sprintMode?.type === 'reference') {
        const pr = findPR(prs, sprintMode.raceDistance)
        if (pr?.value && set.distance) {
          map.set(set.id, pr.value * (set.distance / sprintMode.raceDistance))
        }
      }
    }
    return map
  }, [prs, exercise.sets, exercise.exerciseTypeId, exercise.name])

  // Auto-PR: check completed sets against current PRs
  const processedAutoPRRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!isAthlete || !onSavePR || !prs) return
    const typeId = exercise.exerciseTypeId

    for (const set of exercise.sets) {
      if (!set.completed) continue
      const key = `${set.id}:${set.weight}:${set.performingTime}`
      if (processedAutoPRRef.current.has(key)) continue
      processedAutoPRRef.current.add(key)

      if (typeId === ExerciseTypeId.Gym) {
        if (set.reps === 1 && set.weight != null && set.weight > 0) {
          const currentPR = findPR(prs)
          if (!currentPR?.value || set.weight > currentPR.value) {
            onSavePR(exercise.exerciseId, set.weight, 3).then(ok => {
              if (ok) toast({ title: `New PR! ${exercise.name}: ${set.weight}kg` })
            })
          }
        }
      } else if (typeId === ExerciseTypeId.Sprint && SPRINT_AUTO_PR_NAMES.has(exercise.name)) {
        const time = set.performingTime
        const dist = set.distance
        if (time != null && time > 0 && dist != null && dist > 0) {
          const currentPR = findPR(prs, dist)
          if (!currentPR?.value || time < currentPR.value) {
            onSavePR(exercise.exerciseId, time, 5, dist).then(ok => {
              if (ok) toast({ title: `New PB! ${exercise.name} ${dist}m: ${time}s` })
            })
          }
        }
        // Also check Freelap metadata
        if (set.metadata && isFreeelapMetadata(set.metadata)) {
          const fm = set.metadata
          if (fm.time != null && fm.time > 0 && fm.distance != null && fm.distance > 0) {
            const currentPR = findPR(prs, fm.distance)
            if (!currentPR?.value || fm.time < currentPR.value) {
              onSavePR(exercise.exerciseId, fm.time, 5, fm.distance).then(ok => {
                if (ok) toast({ title: `New PB! ${exercise.name} ${fm.distance}m: ${fm.time}s` })
              })
            }
          }
        }
      }
    }
  }, [exercise.sets, isAthlete, onSavePR, prs, exercise.exerciseId, exercise.exerciseTypeId, exercise.name])

  const completedCount = getCompletedCount(exercise)
  const totalSets = exercise.sets.length
  const isComplete = completedCount === totalSets && totalSets > 0
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0

  // Compute visible fields based on exercise type requirements + plan data + toggle state
  // Uses field-visibility utility to ensure required fields always show
  const visibleFields = useMemo((): VisibleFields => {
    // Get plan sets from exercise (session_plan_sets or workout_log_sets with plan data)
    // For workout exercises, we need to check if sets have plan data
    // For now, we'll use the sets themselves as plan data source
    const planSets = exercise.sets.map(set => ({
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      performing_time: set.performingTime,
      rest_time: set.restTime,
      tempo: set.tempo,
      rpe: set.rpe,
      power: set.power,
      velocity: set.velocity,
      height: set.height,
      resistance: set.resistance,
      effort: set.effort,
    }))

    // Get visible field keys from utility
    // When showAllFields is true, show all configurable fields (required + optional)
    // When showAllFields is false, show only required + filled fields
    const visibleFieldKeys = getVisibleFields(exercise.exerciseTypeId, planSets, {
      forCoach: showAllFields,
      exerciseName: exercise.name,
    })

    // Convert to VisibleFields object
    return {
      reps: visibleFieldKeys.includes('reps'),
      weight: visibleFieldKeys.includes('weight'),
      distance: visibleFieldKeys.includes('distance'),
      performingTime: visibleFieldKeys.includes('performingTime'),
      height: visibleFieldKeys.includes('height'),
      power: visibleFieldKeys.includes('power'),
      velocity: visibleFieldKeys.includes('velocity'),
      rpe: visibleFieldKeys.includes('rpe'),
      restTime: visibleFieldKeys.includes('restTime'),
      tempo: visibleFieldKeys.includes('tempo'),
      effort: visibleFieldKeys.includes('effort'),
      resistance: visibleFieldKeys.includes('resistance'),
    }
  }, [exercise.sets, exercise.exerciseTypeId, isAthlete, showAllFields])

  const handleHeaderClick = useCallback(() => {
    onToggleExpand()
  }, [onToggleExpand])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggleExpand()
    }
  }, [onToggleExpand])

  // Set drag handlers
  const handleSetDragStart = useCallback((e: React.DragEvent, setId: string | number) => {
    setDraggingSetId(setId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(setId))
  }, [])

  const handleSetDragOver = useCallback((e: React.DragEvent, setId: string | number) => {
    e.preventDefault()
    if (setId !== draggingSetId) {
      setDragOverSetId(setId)
    }
  }, [draggingSetId])

  const handleSetDragEnd = useCallback(() => {
    setDraggingSetId(null)
    setDragOverSetId(null)
  }, [])

  const handleSetDrop = useCallback((e: React.DragEvent, targetSetId: string | number) => {
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
  }, [draggingSetId, exercise.sets, onReorderSets])

  return (
    <div
      className={cn(
        "flex transition-opacity min-w-0",
        isDragging && "opacity-50",
        isDimmedByPreview && "opacity-30"
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
      {/* Superset bar - lean design */}
      {showSupersetBar && (
        <div className="w-0.5 bg-primary/60 rounded-full mr-2 shrink-0 relative">
          {supersetLabel && (
            <span className="absolute -left-0.5 -top-4 text-[9px] font-bold text-primary/80 bg-background px-0.5">
              {supersetLabel}
            </span>
          )}
        </div>
      )}

      {/* Main card - lean borderless design */}
      <div className={cn(
        "flex-1 transition-colors min-w-0",
        isGhostExercise
          ? "border-l-2 border-dashed border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 pl-2"
          : hasPendingChange && aiChangeType
            ? AI_BG_COLORS[aiChangeType]
            : ""
      )}>
        {/* Header - edge-to-edge lean design */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleHeaderClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-1 py-1.5 text-left hover:bg-muted/20 transition-colors min-w-0",
            !isAthlete ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
            {/* Selection checkbox for superset creation (coach mode only) */}
            {!isAthlete && isSelectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelection?.(exercise.id)
                }}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors -ml-1",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40 hover:border-primary"
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}
            {/* Drag grip for coach mode - integrated into header */}
            {!isAthlete && !isSelectionMode && (
              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 -ml-1" />
            )}
            {/* Expand/collapse chevron - moved to left side */}
            {exercise.expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {/* Exercise name - shows swap/delete states */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isGhostExercise ? (
                  // Ghost exercise: new exercise in emerald
                  <h3 className="text-sm font-medium truncate ai-add-text">{exercise.name}</h3>
                ) : isSwap && swapNewName ? (
                  // Swap: show "Old Name → New Name"
                  <>
                    <span className="text-sm font-medium line-through text-muted-foreground">{exercise.name}</span>
                    <ArrowRight className="w-3 h-3 ai-swap-text shrink-0" />
                    <span className="text-sm font-medium ai-swap-text">{swapNewName}</span>
                  </>
                ) : isRemove ? (
                  // Delete: strikethrough with red
                  <h3 className="text-sm font-medium truncate line-through ai-remove-text opacity-70">{exercise.name}</h3>
                ) : (
                  // Normal state
                  <h3 className="text-sm font-medium truncate">{exercise.name}</h3>
                )}
                {/* PR badge — athlete mode only */}
                {supportsPR && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPRSheet(true)
                    }}
                    className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors shrink-0"
                    title="View/Edit PR"
                  >
                    <Trophy className="h-2.5 w-2.5" />
                    {(() => {
                      const pr = findPR(prs)
                      if (!pr?.value) return "Set PR"
                      return exercise.exerciseTypeId === ExerciseTypeId.Gym
                        ? `${pr.value}kg`
                        : `${pr.value}s`
                    })()}
                  </button>
                )}
                {/* Subgroup chip (T016) — shows target event groups */}
                {!isAthlete && subgroupChipText && (
                  <Popover open={subgroupPopoverOpen} onOpenChange={setSubgroupPopoverOpen}>
                    <PopoverTrigger asChild>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setSubgroupPopoverOpen(true)
                        }}
                      >
                        <SubgroupBadge
                          value={subgroupChipText}
                          interactive
                          size="xs"
                          className="cursor-pointer"
                        />
                      </span>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 p-3"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Target Groups</p>
                        {(availableSubgroups ?? []).map((group) => {
                          const isChecked = (exercise.targetSubgroups ?? []).includes(group)
                          return (
                            <label
                              key={group}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const current = exercise.targetSubgroups ?? []
                                  const next = checked
                                    ? [...current, group]
                                    : current.filter(g => g !== group)
                                  onUpdateTargetSubgroups?.(next.length > 0 ? next : null)
                                }}
                              />
                              <span className="text-sm">{group}</span>
                            </label>
                          )
                        })}
                        {(exercise.targetSubgroups ?? []).length > 0 && (
                          <button
                            onClick={() => onUpdateTargetSubgroups?.(null)}
                            className="text-xs text-muted-foreground hover:text-foreground mt-1"
                          >
                            Clear (all athletes)
                          </button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {/* Untagged subgroup — show empty chip on click for coach */}
                {!isAthlete && !subgroupChipText && availableSubgroups && availableSubgroups.length > 0 && (
                  <Popover open={subgroupPopoverOpen} onOpenChange={setSubgroupPopoverOpen}>
                    <PopoverTrigger asChild>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setSubgroupPopoverOpen(true)
                        }}
                      >
                        <SubgroupBadge
                          value={null}
                          emptyLabel="ALL"
                          interactive
                          size="xs"
                          className="cursor-pointer"
                        />
                      </span>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 p-3"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Target Groups</p>
                        {(availableSubgroups ?? []).map((group) => (
                          <label
                            key={group}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => {
                                onUpdateTargetSubgroups?.([group])
                              }}
                            />
                            <span className="text-sm">{group}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {/* AI change indicator badge */}
                {(isGhostExercise || hasPendingChange || pendingSetCount > 0) && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0",
                      isGhostExercise ? "bg-emerald-100 dark:bg-emerald-900/40 ai-add-text" :
                      isRemove ? "bg-red-100 dark:bg-red-900/40 ai-remove-text" :
                      isSwap ? "bg-blue-100 dark:bg-blue-900/40 ai-swap-text" :
                      isAdd ? "bg-emerald-100 dark:bg-emerald-900/40 ai-add-text" :
                      "bg-amber-100 dark:bg-amber-900/40 ai-update-text"
                    )}
                    title={isGhostExercise ? "New exercise" : isRemove ? "Will be removed" : isSwap ? "Will be swapped" : `${pendingSetCount > 0 ? pendingSetCount : 1} AI change${pendingSetCount !== 1 ? 's' : ''} pending`}
                  >
                    {isGhostExercise ? (
                      <>
                        <Plus className="h-2.5 w-2.5" />
                        <span>New</span>
                      </>
                    ) : isRemove ? (
                      <X className="h-2.5 w-2.5" />
                    ) : (
                      <>
                        <Bot className="h-2.5 w-2.5" />
                        {!isSwap && pendingSetCount > 0 && <span>{pendingSetCount}</span>}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Exercise completion circle - moved to far right (FR-051) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCompleteAllSets?.()
              }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isAthlete && "hover:scale-110 active:scale-95",
                isComplete
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              title={isComplete ? "Mark all incomplete" : "Mark all complete"}
            >
              {isComplete ? <Check className="w-3.5 h-3.5" /> : exercise.exerciseOrder}
            </button>
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
          <div className="px-0 pb-2 pt-0 space-y-0 min-w-0">
            {exercise.sets.map((set, index) => {
              // First incomplete set is active
              const firstIncompleteIndex = exercise.sets.findIndex((s) => !s.completed)
              const isActive = isAthlete && index === firstIncompleteIndex
              const isSetDragging = draggingSetId === set.id
              const isSetDragOver = dragOverSetId === set.id
              // Get AI change info for this set - try both string and number keys
              // Also check ungrouped changes as fallback (for deletes without exercise ID)
              const setChange =
                setAIChanges?.get(String(set.id)) ??
                setAIChanges?.get(set.id) ??
                ungroupedSetChanges?.get(String(set.id)) ??
                ungroupedSetChanges?.get(set.id)

              // Check if this set has Freelap metadata
              const hasFreeelapData = set.metadata && isFreeelapMetadata(set.metadata)
              const isFreeelapExpanded = expandedFreeelapIds.has(set.id)

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
                    isActive={isActive}
                    visibleFields={visibleFields}
                    showAdvancedFields={showAdvancedFields}
                    onComplete={() => onCompleteSet(set.id)}
                    onUpdate={(field, value) => onUpdateSet?.(set.id, field, value)}
                    onRemove={() => onRemoveSet?.(set.id)}
                    isDragging={isSetDragging}
                    onDragStart={handleSetDragStart}
                    onDragOver={(e) => handleSetDragOver(e, set.id)}
                    onDragEnd={handleSetDragEnd}
                    onDrop={handleSetDrop}
                    // AI indicator props
                    hasPendingChange={!!setChange}
                    aiChangeType={setChange?.changeType}
                    aiCurrentData={setChange?.currentData}
                    aiProposedData={setChange?.proposedData}
                    // PR-based placeholders
                    fieldPlaceholders={setPlaceholders.get(set.id)}
                    mergeEffort={isAthlete && set.effort != null}
                    effectivePR={setEffectivePRs.get(set.id) ?? null}
                    exerciseTypeId={exercise.exerciseTypeId}
                    // Freelap expansion props
                    hasFreeelapData={!!hasFreeelapData}
                    isFreeelapExpanded={isFreeelapExpanded}
                    onToggleFreeelapExpand={hasFreeelapData ? () => toggleFreeelapExpand(set.id) : undefined}
                    onMetadataChange={hasFreeelapData ? (metadata) => onUpdateSetMetadata?.(set.id, metadata) : undefined}
                  />
                </div>
              )
            })}

            {/* Ghost rows for pending new sets (AI CREATE operations) */}
            {pendingNewSets.map((pendingSet, index) => (
              <SetRow
                key={`ghost-${index}`}
                set={{
                  id: `ghost-${index}`,
                  setIndex: exercise.sets.length + index + 1,
                  completed: false,
                  reps: null,
                  weight: null,
                  distance: null,
                  performingTime: null,
                  height: null,
                  power: null,
                  velocity: null,
                  rpe: null,
                  restTime: null,
                  tempo: null,
                  effort: null,
                  resistance: null,
                }}
                isAthlete={isAthlete}
                visibleFields={visibleFields}
                showAdvancedFields={showAdvancedFields}
                isGhostRow={true}
                ghostData={pendingSet.proposedData}
              />
            ))}

            {onAddSet && (
              <button
                onClick={onAddSet}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg hover:border-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Set
              </button>
            )}

            {/* Exercise notes — editable in coach mode, read-only for athletes */}
            {!isAthlete && onUpdateNotes ? (
              exercise.notes ? (
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto'
                      el.style.height = el.scrollHeight + 'px'
                    }
                  }}
                  value={exercise.notes}
                  onChange={(e) => {
                    onUpdateNotes(e.target.value || null)
                    const target = e.target
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                  placeholder="Exercise notes..."
                  rows={1}
                  className="w-full text-sm text-muted-foreground italic mt-2 px-3 py-1 bg-transparent border-none outline-none resize-none focus:ring-0 placeholder:not-italic"
                />
              ) : (
                <button
                  onClick={() => onUpdateNotes('')}
                  className="flex items-center gap-1 mt-2 px-3 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Add note
                </button>
              )
            ) : exercise.notes ? (
              <p className="text-sm text-muted-foreground italic mt-2 px-3">
                {exercise.notes}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* PR Input Sheet */}
      {supportsPR && (
        <PRInputSheet
          open={showPRSheet}
          onOpenChange={setShowPRSheet}
          exerciseName={exercise.name}
          exerciseTypeId={exercise.exerciseTypeId!}
          exerciseId={exercise.exerciseId}
          existingPRs={prs || []}
          setEfforts={setEfforts}
          onSave={onSavePR!}
        />
      )}
    </div>
  )
}
