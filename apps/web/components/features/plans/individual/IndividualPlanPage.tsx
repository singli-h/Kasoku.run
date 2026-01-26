"use client"

/**
 * IndividualPlanPage
 *
 * Streamlined training view for individual users.
 *
 * Desktop: 2-column layout with week timeline sidebar + workout details
 * Mobile: Single column with progress header + day selector
 *
 * Supports two modes:
 * - Standalone: Original behavior with navigation to session page
 * - Unified: Integrated with PlanContext for single-page experience with AI
 *
 * Design inspired by: TrainingPeaks week timeline, Apple Fitness+ progress,
 * and Strong app's clean workout presentation.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import { useState, useMemo, useCallback, useEffect, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  Calendar,
  Edit,
  ExternalLink,
  CheckCircle2,
  Circle,
  Layers,
  Clock,
  Check,
  Plus,
  Sparkles,
  Loader2,
  Settings2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/components/features/ai-assistant/hooks/useAILayoutMode"
import type { MesocycleWithDetails, MicrocycleWithDetails, SessionPlanWithDetails } from "@/types/training"
import { WeekSelectorSheet } from "./WeekSelectorSheet"
import { EditTrainingBlockDialog, type TrainingBlockFormData, type ExistingBlockDateRange } from "@/components/features/plans/workspace/components/EditTrainingBlockDialog"
import { updateMesocycleAction } from "@/actions/plans/plan-actions"
import { useToast } from "@/hooks/use-toast"
import {
  usePlanContextOptional,
  findCurrentWeek,
  findTodayWorkout,
  getDayAbbrev,
  getDayName,
  sortByDay,
  isWeekPast,
  isWeekCurrent,
  formatDateShort,
} from "./context"
import { InlineProposalSlot } from "./PlanAssistantWrapper"
import { AdvancedFieldsToggle } from "./AdvancedFieldsToggle"
import { MobileSettingsSheet } from "./MobileSettingsSheet"
import { useAdvancedFieldsToggle } from "@/lib/hooks/useAdvancedFieldsToggle"

// Lazy load SessionPlannerV2 for inline editing (T015)
const SessionPlannerV2 = lazy(() =>
  import("@/components/features/training/views/SessionPlannerV2").then(mod => ({ default: mod.SessionPlannerV2 }))
)

interface IndividualPlanPageProps {
  trainingBlock: MesocycleWithDetails
  /** Other blocks to show in the block switcher */
  otherBlocks?: {
    upcoming: MesocycleWithDetails[]
    completed: MesocycleWithDetails[]
  }
  /**
   * Enable unified mode with inline session editing and AI integration.
   * When true, workouts expand inline instead of navigating away.
   * @default false
   */
  unifiedMode?: boolean
  /**
   * Exercise library for inline editing (required when unifiedMode is true).
   */
  exerciseLibrary?: Array<{
    id: string
    name: string
    description?: string | null
    type?: string | null
    equipment?: string[] | null
  }>
}

// ============================================================================
// Main Component
// ============================================================================

export function IndividualPlanPage({
  trainingBlock,
  otherBlocks,
  unifiedMode = false,
  exerciseLibrary = [],
}: IndividualPlanPageProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const { toast } = useToast()

  // Get PlanContext if available (for unified mode integration)
  const planContext = usePlanContextOptional()

  // Combine other blocks for the switcher
  const hasOtherBlocks = (otherBlocks?.upcoming?.length ?? 0) > 0 || (otherBlocks?.completed?.length ?? 0) > 0

  // Existing blocks for date overlap validation (excluding current block)
  const existingBlocks: ExistingBlockDateRange[] = useMemo(() => {
    const allBlocks = [
      ...(otherBlocks?.upcoming ?? []),
      ...(otherBlocks?.completed ?? [])
    ]
    return allBlocks.map(b => ({
      id: b.id,
      start_date: b.start_date,
      end_date: b.end_date
    }))
  }, [otherBlocks])

  // Edit block dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Mobile settings sheet state (T052)
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)

  // Advanced fields toggle (T050, T053)
  const {
    showAdvancedFields,
    toggleAdvancedFields,
    setShowAdvancedFields,
    isLoaded: advancedFieldsLoaded,
  } = useAdvancedFieldsToggle()

  // Local week selection state (used when not in PlanContext)
  const [localSelectedWeekId, setLocalSelectedWeekId] = useState<number | null>(() =>
    findCurrentWeek(trainingBlock.microcycles)?.id ?? trainingBlock.microcycles?.[0]?.id ?? null
  )
  const [weekSelectorOpen, setWeekSelectorOpen] = useState(false)

  // Use PlanContext selection if available, otherwise use local state (T009)
  const selectedWeekId = planContext?.selectedWeekId ?? localSelectedWeekId
  const setSelectedWeekId = planContext?.selectWeek ?? setLocalSelectedWeekId

  // Currently selected week
  const selectedWeek = useMemo(() =>
    trainingBlock.microcycles?.find(m => m.id === selectedWeekId) ?? null,
    [trainingBlock.microcycles, selectedWeekId]
  )

  // Workouts and today detection
  const workouts = useMemo(() => sortByDay(selectedWeek?.session_plans ?? []), [selectedWeek])
  const todayWorkout = useMemo(() => findTodayWorkout(selectedWeek?.session_plans), [selectedWeek])
  const today = new Date().getDay()

  // Local selected workout state (used when not in PlanContext)
  const [localSelectedWorkoutId, setLocalSelectedWorkoutId] = useState<string | null>(null)

  // Use PlanContext session selection if available (T009)
  const selectedWorkoutId = planContext?.selectedSessionId ?? localSelectedWorkoutId
  const setSelectedWorkoutId = useCallback((id: string | null) => {
    if (planContext?.selectSession) {
      planContext.selectSession(id)
    } else {
      setLocalSelectedWorkoutId(id)
    }
  }, [planContext])

  const displayedWorkout = useMemo(() => {
    if (selectedWorkoutId !== null) {
      return workouts.find(w => w.id === selectedWorkoutId) ?? todayWorkout
    }
    return todayWorkout
  }, [selectedWorkoutId, workouts, todayWorkout])

  // Expanded workout state for inline editing (T014)
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null)

  // Week info
  const weekNumber = (trainingBlock.microcycles?.findIndex(m => m.id === selectedWeekId) ?? 0) + 1
  const totalWeeks = trainingBlock.microcycles?.length ?? 0

  // Auto-select current week on mount (T010)
  useEffect(() => {
    if (!trainingBlock?.microcycles) return

    const currentWeek = findCurrentWeek(trainingBlock.microcycles)
    if (currentWeek && !selectedWeekId) {
      setSelectedWeekId(currentWeek.id)
    }
  }, [trainingBlock?.microcycles, selectedWeekId, setSelectedWeekId])

  // Auto-select today's workout on mount (T011)
  useEffect(() => {
    if (!selectedWeek?.session_plans) return

    if (selectedWeek && !selectedWorkoutId) {
      const todaysWorkout = findTodayWorkout(selectedWeek.session_plans)
      if (todaysWorkout) {
        setSelectedWorkoutId(todaysWorkout.id)
      }
    }
  }, [selectedWeek, selectedWorkoutId, setSelectedWorkoutId])

  const handleWeekSelect = useCallback((weekId: number) => {
    setSelectedWeekId(weekId)
    setSelectedWorkoutId(null)
    setExpandedWorkoutId(null)
    setWeekSelectorOpen(false)
  }, [setSelectedWeekId, setSelectedWorkoutId])

  // Handle workout selection (T013 - no navigation in unified mode)
  const handleWorkoutSelect = useCallback((workoutId: string) => {
    if (workoutId === todayWorkout?.id && selectedWorkoutId === null) {
      // Clicking the already-displayed today's workout - no change
      return
    }
    setSelectedWorkoutId(workoutId === todayWorkout?.id ? null : workoutId)
    // In unified mode, also expand the workout for inline editing
    if (unifiedMode) {
      setExpandedWorkoutId(prev => prev === workoutId ? null : workoutId)
    }
  }, [todayWorkout, selectedWorkoutId, setSelectedWorkoutId, unifiedMode])

  // Handle edit button click (T013 - inline expansion in unified mode)
  const handleEditWorkout = useCallback((workoutId: string) => {
    if (unifiedMode) {
      // Toggle inline expansion
      setExpandedWorkoutId(prev => prev === workoutId ? null : workoutId)
      setSelectedWorkoutId(workoutId)
    } else {
      // Navigate to session page (original behavior)
      router.push(`/plans/${trainingBlock.id}/session/${workoutId}`)
    }
  }, [unifiedMode, router, trainingBlock.id, setSelectedWorkoutId])

  // Handler for saving edited block
  const handleSaveBlock = async (data: TrainingBlockFormData) => {
    const result = await updateMesocycleAction(data.id, {
      name: data.name,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
    })

    if (result.isSuccess) {
      toast({
        title: "Block updated",
        description: "Your training block has been updated successfully.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to update training block.",
        variant: "destructive",
      })
    }
  }

  // Desktop: 2-column layout with week sidebar
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Left Sidebar: Week Timeline */}
          <aside className="w-80 shrink-0 border-r border-border/40 bg-muted/20" role="navigation" aria-label="Week selector">
            <div className="sticky top-0 h-screen overflow-y-auto">
              {/* Block Header with Switcher */}
              <div className="p-4 border-b border-border/40">
                {hasOtherBlocks ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full text-left group hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <h1 className="font-semibold text-sm line-clamp-2 leading-tight">
                                {trainingBlock.name || "Training Block"}
                              </h1>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              {totalWeeks} weeks · Active
                            </p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors mt-0.5" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Switch Training Block
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* Current block */}
                      <DropdownMenuItem disabled className="opacity-100">
                        <Check className="h-4 w-4 mr-2 text-primary" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{trainingBlock.name}</p>
                          <p className="text-xs text-muted-foreground">Active now</p>
                        </div>
                      </DropdownMenuItem>
                      {/* Upcoming blocks */}
                      {(otherBlocks?.upcoming?.length ?? 0) > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Upcoming
                          </DropdownMenuLabel>
                          {otherBlocks?.upcoming?.map(block => (
                            <DropdownMenuItem key={block.id} asChild>
                              <Link href={`/plans/${block.id}`} className="cursor-pointer">
                                <Circle className="h-4 w-4 mr-2 text-muted-foreground/40" />
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{block.name || 'Training Block'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDateShort(block.start_date)} - {formatDateShort(block.end_date)}
                                  </p>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      {/* Completed blocks */}
                      {(otherBlocks?.completed?.length ?? 0) > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </DropdownMenuLabel>
                          {otherBlocks?.completed?.slice(0, 3).map(block => (
                            <DropdownMenuItem key={block.id} asChild>
                              <Link href={`/plans/${block.id}`} className="cursor-pointer">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{block.name || 'Training Block'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDateShort(block.start_date)} - {formatDateShort(block.end_date)}
                                  </p>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                          {(otherBlocks?.completed?.length ?? 0) > 3 && (
                            <DropdownMenuItem asChild>
                              <Link href="/plans?filter=completed" className="cursor-pointer text-muted-foreground">
                                View all {otherBlocks?.completed.length} completed...
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {/* Add New Block */}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/plans/new" className="cursor-pointer">
                          <Plus className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm font-medium">New Training Block</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div>
                    <h1 className="font-semibold text-sm line-clamp-2 leading-tight">
                      {trainingBlock.name || "Training Block"}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalWeeks} weeks
                    </p>
                  </div>
                )}

                {/* Edit Actions */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit Block
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => router.push(`/plans/${trainingBlock.id}/edit`)}
                  >
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <linearGradient id="rainbow-gradient-desktop" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="25%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#8b5cf6" />
                          <stop offset="75%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" style={{ stroke: 'url(#rainbow-gradient-desktop)' }} />
                    Edit with AI
                  </Button>
                </div>
              </div>

              {/* Week List */}
              <nav className="p-2" aria-label="Training weeks">
                <div className="space-y-1">
                  {trainingBlock.microcycles?.map((week, index) => {
                    const isSelected = week.id === selectedWeekId
                    const isCurrent = isWeekCurrent(week)
                    const isPast = isWeekPast(week)
                    const workoutCount = week.session_plans?.length ?? 0

                    return (
                      <button
                        key={week.id}
                        onClick={() => handleWeekSelect(week.id)}
                        aria-pressed={isSelected}
                        aria-label={`Week ${index + 1}${isCurrent ? ', current week' : ''}${isPast ? ', completed' : ''}${isSelected ? ', currently selected' : ''}`}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                          isSelected
                            ? "bg-foreground text-background"
                            : "hover:bg-muted/60"
                        )}
                      >
                        {/* Status indicator */}
                        <div className="shrink-0 mt-0.5">
                          {isPast ? (
                            <CheckCircle2 className={cn(
                              "h-4 w-4",
                              isSelected ? "text-background/70" : "text-green-500"
                            )} />
                          ) : isCurrent ? (
                            <div className={cn(
                              "h-4 w-4 rounded-full border-2",
                              isSelected
                                ? "border-background bg-background/30"
                                : "border-primary bg-primary/20"
                            )} />
                          ) : (
                            <Circle className={cn(
                              "h-4 w-4",
                              isSelected ? "text-background/50" : "text-muted-foreground/40"
                            )} />
                          )}
                        </div>

                        {/* Week info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected ? "" : ""
                            )}>
                              Week {index + 1}
                            </span>
                            {isCurrent && !isSelected && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded font-medium">
                                NOW
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            "text-xs mt-0.5",
                            isSelected ? "text-background/70" : "text-muted-foreground"
                          )}>
                            {formatDateShort(week.start_date)} - {formatDateShort(week.end_date)}
                          </div>
                          <div className={cn(
                            "text-xs mt-1",
                            isSelected ? "text-background/60" : "text-muted-foreground/70"
                          )}>
                            {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0" role="main" aria-label="Workout details">
            {/* Week Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Week {weekNumber}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDateShort(selectedWeek?.start_date)} - {formatDateShort(selectedWeek?.end_date)}
                    </p>
                  </div>
                  {/* T051: Advanced fields toggle for desktop */}
                  <AdvancedFieldsToggle
                    checked={showAdvancedFields}
                    onCheckedChange={setShowAdvancedFields}
                    variant="inline"
                    isLoading={!advancedFieldsLoaded}
                  />
                </div>
              </div>

              {/* Horizontal Day Selector */}
              <nav className="px-6 pb-4" role="navigation" aria-label="Workout day selector">
                <div className="flex items-center gap-2">
                  {workouts.map((workout) => {
                    const isSelected = workout.id === displayedWorkout?.id
                    const isToday = workout.day === today
                    const dayNum = workout.day ?? 7
                    const isPast = dayNum < today || (dayNum === 0 && today !== 0)

                    return (
                      <button
                        key={workout.id}
                        onClick={() => handleWorkoutSelect(workout.id)}
                        aria-pressed={isSelected}
                        aria-label={`${getDayName(workout.day)} workout${workout.name ? `: ${workout.name}` : ''}${isToday ? ', today' : ''}${isSelected ? ', currently selected' : ''}`}
                        className={cn(
                          "shrink-0 flex flex-col items-center px-4 py-2 rounded-lg transition-all",
                          "min-w-[80px] border",
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : isToday
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted/30 border-transparent hover:bg-muted/50",
                          isPast && !isSelected && "opacity-50"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          isSelected ? "text-background/70" : "text-muted-foreground"
                        )}>
                          {getDayAbbrev(workout.day ?? 0)}
                        </span>
                        <span className={cn(
                          "text-xs font-medium mt-0.5 truncate max-w-[72px]",
                          isSelected ? "text-background" : ""
                        )}>
                          {workout.name?.split(' ')[0] || 'Workout'}
                        </span>
                        {isToday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}

                  {workouts.length === 0 && (
                    <div className="text-sm text-muted-foreground py-2">
                      No workouts scheduled this week
                    </div>
                  )}
                </div>
              </nav>
            </header>

            {/* Workout Details */}
            <div className="p-6">
              {/* Inline proposal slot for AI changes (T020) */}
              {unifiedMode && (
                <InlineProposalSlot className="mb-6" />
              )}

              {displayedWorkout ? (
                <>
                  <WorkoutDetails
                    workout={displayedWorkout}
                    blockId={trainingBlock.id}
                    isToday={displayedWorkout.day === today}
                    onEdit={() => handleEditWorkout(displayedWorkout.id)}
                    isExpanded={unifiedMode && expandedWorkoutId === displayedWorkout.id}
                    unifiedMode={unifiedMode}
                  />
                  {/* Inline SessionPlannerV2 when expanded (T014, T015) */}
                  {unifiedMode && expandedWorkoutId === displayedWorkout.id && (
                    <div className="mt-6 border-t border-border/40 pt-6">
                      <Suspense fallback={<WorkoutEditorSkeleton />}>
                        <SessionPlannerV2
                          planId={String(trainingBlock.id)}
                          sessionId={displayedWorkout.id}
                          initialSession={{
                            id: displayedWorkout.id,
                            name: displayedWorkout.name || 'Workout',
                            description: displayedWorkout.description,
                            day: displayedWorkout.day,
                          }}
                          exerciseLibrary={exerciseLibrary}
                          showAdvancedFields={showAdvancedFields}
                        />
                      </Suspense>
                    </div>
                  )}
                </>
              ) : (
                <EmptyWorkoutState />
              )}
            </div>
          </main>
        </div>

        {/* Edit Block Dialog */}
        <EditTrainingBlockDialog
          block={{
            id: trainingBlock.id,
            name: trainingBlock.name || '',
            description: trainingBlock.description,
            start_date: trainingBlock.start_date,
            end_date: trainingBlock.end_date,
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveBlock}
          existingBlocks={existingBlocks}
        />
      </div>
    )
  }

  // Mobile: Single column with compact header
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-20 bg-background border-b border-border/40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              {/* Block name with optional switcher */}
              {hasOtherBlocks ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-left max-w-full group">
                      <h1 className="text-base font-semibold line-clamp-2 leading-tight">
                        {trainingBlock.name || "Training Block"}
                      </h1>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Switch Training Block
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Current block */}
                    <DropdownMenuItem disabled className="opacity-100">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{trainingBlock.name}</p>
                        <p className="text-xs text-muted-foreground">Active now</p>
                      </div>
                    </DropdownMenuItem>
                    {/* Upcoming blocks */}
                    {(otherBlocks?.upcoming?.length ?? 0) > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Upcoming
                        </DropdownMenuLabel>
                        {otherBlocks?.upcoming?.map(block => (
                          <DropdownMenuItem key={block.id} asChild>
                            <Link href={`/plans/${block.id}`} className="cursor-pointer">
                              <Circle className="h-4 w-4 mr-2 text-muted-foreground/40" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{block.name || 'Training Block'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateShort(block.start_date)} - {formatDateShort(block.end_date)}
                                </p>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    {/* Completed blocks */}
                    {(otherBlocks?.completed?.length ?? 0) > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </DropdownMenuLabel>
                        {otherBlocks?.completed?.slice(0, 2).map(block => (
                          <DropdownMenuItem key={block.id} asChild>
                            <Link href={`/plans/${block.id}`} className="cursor-pointer">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{block.name || 'Training Block'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateShort(block.start_date)} - {formatDateShort(block.end_date)}
                                </p>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        {(otherBlocks?.completed?.length ?? 0) > 2 && (
                          <DropdownMenuItem asChild>
                            <Link href="/plans?filter=completed" className="cursor-pointer text-muted-foreground">
                              View all {otherBlocks?.completed.length} completed...
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    {/* Add New Block */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/plans/new" className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm font-medium">New Training Block</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <h1 className="text-base font-semibold line-clamp-2 leading-tight">
                  {trainingBlock.name || "Training Block"}
                </h1>
              )}
            </div>

            {/* Action buttons - icons only on mobile */}
            <div className="flex items-center gap-1.5">
              {/* T052: Settings button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setMobileSettingsOpen(true)}
              >
                <Settings2 className="h-5 w-5" />
                <span className="sr-only">View Settings</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit Block</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 relative overflow-hidden"
                onClick={() => router.push(`/plans/${trainingBlock.id}/edit`)}
              >
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="25%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="75%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <Sparkles className="h-5 w-5" style={{ stroke: 'url(#rainbow-gradient)' }} />
                <span className="sr-only">Edit with AI</span>
              </Button>
            </div>
          </div>

          {/* Week Selector - Prominent card style */}
          <button
            onClick={() => setWeekSelectorOpen(true)}
            aria-label={`Select week. Currently on ${selectedWeek?.name || `Week ${weekNumber}`}, week ${weekNumber} of ${totalWeeks}`}
            aria-haspopup="dialog"
            className="w-full mt-3 p-3 bg-muted/50 hover:bg-muted/70 rounded-xl border border-border/50 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {selectedWeek?.name || `Week ${weekNumber}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedWeek?.start_date && selectedWeek?.end_date
                      ? `${formatDateShort(selectedWeek.start_date)} - ${formatDateShort(selectedWeek.end_date)}`
                      : `Week ${weekNumber} of ${totalWeeks}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <WeekProgressDots
                  totalWeeks={totalWeeks}
                  currentWeek={weekNumber}
                  microcycles={trainingBlock.microcycles ?? []}
                />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        </div>

        {/* Horizontal Day Selector */}
        <nav className="px-4 pb-3" role="navigation" aria-label="Workout day selector">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {workouts.map((workout) => {
              const isSelected = workout.id === displayedWorkout?.id
              const isToday = workout.day === today
              const dayNum = workout.day ?? 7
              const isPast = dayNum < today || (dayNum === 0 && today !== 0)

              return (
                <button
                  key={workout.id}
                  onClick={() => handleWorkoutSelect(workout.id)}
                  aria-pressed={isSelected}
                  aria-label={`${getDayName(workout.day)} workout${workout.name ? `: ${workout.name}` : ''}${isToday ? ', today' : ''}${isSelected ? ', currently selected' : ''}`}
                  className={cn(
                    "shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all",
                    "min-w-[64px] border",
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : isToday
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-transparent hover:bg-muted/50",
                    isPast && !isSelected && "opacity-50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    isSelected ? "text-background/70" : "text-muted-foreground"
                  )}>
                    {getDayAbbrev(workout.day ?? 0)}
                  </span>
                  <span className={cn(
                    "text-[11px] font-medium mt-0.5 truncate max-w-[56px]",
                    isSelected ? "text-background" : ""
                  )}>
                    {workout.name?.split(' ')[0] || 'Workout'}
                  </span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-primary mt-1" aria-hidden="true" />
                  )}
                </button>
              )
            })}

            {workouts.length === 0 && (
              <div className="text-sm text-muted-foreground py-2">
                No workouts this week
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Content */}
      <main className="p-4" role="main" aria-label="Workout details">
        {/* Inline proposal slot for AI changes (T020) */}
        {unifiedMode && (
          <InlineProposalSlot className="mb-4" />
        )}

        {displayedWorkout ? (
          <>
            <WorkoutDetails
              workout={displayedWorkout}
              blockId={trainingBlock.id}
              isToday={displayedWorkout.day === today}
              onEdit={() => handleEditWorkout(displayedWorkout.id)}
              isExpanded={unifiedMode && expandedWorkoutId === displayedWorkout.id}
              unifiedMode={unifiedMode}
            />
            {/* Inline SessionPlannerV2 when expanded (T014, T015) */}
            {unifiedMode && expandedWorkoutId === displayedWorkout.id && (
              <div className="mt-4 border-t border-border/40 pt-4">
                <Suspense fallback={<WorkoutEditorSkeleton />}>
                  <SessionPlannerV2
                    planId={String(trainingBlock.id)}
                    sessionId={displayedWorkout.id}
                    initialSession={{
                      id: displayedWorkout.id,
                      name: displayedWorkout.name || 'Workout',
                      description: displayedWorkout.description,
                      day: displayedWorkout.day,
                    }}
                    exerciseLibrary={exerciseLibrary}
                    showAdvancedFields={showAdvancedFields}
                  />
                </Suspense>
              </div>
            )}
          </>
        ) : (
          <EmptyWorkoutState />
        )}
      </main>

      {/* Week Selector Sheet */}
      <WeekSelectorSheet
        open={weekSelectorOpen}
        onOpenChange={setWeekSelectorOpen}
        weeks={trainingBlock.microcycles ?? []}
        selectedWeekId={selectedWeekId}
        onSelectWeek={handleWeekSelect}
      />

      {/* Edit Block Dialog */}
      <EditTrainingBlockDialog
        block={{
          id: trainingBlock.id,
          name: trainingBlock.name || '',
          description: trainingBlock.description,
          start_date: trainingBlock.start_date,
          end_date: trainingBlock.end_date,
        }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveBlock}
        existingBlocks={existingBlocks}
      />

      {/* Mobile Settings Sheet (T052) */}
      <MobileSettingsSheet
        open={mobileSettingsOpen}
        onOpenChange={setMobileSettingsOpen}
        showAdvancedFields={showAdvancedFields}
        onAdvancedFieldsChange={setShowAdvancedFields}
        isLoading={!advancedFieldsLoaded}
      />
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Visual progress dots showing week position
 */
function WeekProgressDots({
  totalWeeks,
  currentWeek,
  microcycles,
}: {
  totalWeeks: number
  currentWeek: number
  microcycles: MicrocycleWithDetails[]
}) {
  // Limit dots shown for very long programs
  const maxDots = 8
  const showDots = totalWeeks <= maxDots

  if (!showDots) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(currentWeek / totalWeeks) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {microcycles.map((week, index) => {
        const isPast = isWeekPast(week)
        const isCurrent = isWeekCurrent(week)
        const isSelected = index + 1 === currentWeek

        return (
          <div
            key={week.id}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              isPast
                ? "bg-green-500"
                : isCurrent
                  ? "bg-primary"
                  : "bg-muted-foreground/30",
              isSelected && "ring-2 ring-offset-1 ring-foreground/20"
            )}
          />
        )
      })}
    </div>
  )
}

/**
 * Workout details with exercises
 * Supports unified mode with inline expansion for editing
 */
function WorkoutDetails({
  workout,
  blockId,
  isToday,
  onEdit,
  isExpanded = false,
  unifiedMode = false,
}: {
  workout: SessionPlanWithDetails
  blockId: number
  isToday: boolean
  onEdit: () => void
  /** Whether the workout editor is currently expanded inline (unified mode only) */
  isExpanded?: boolean
  /** Whether unified mode is enabled (changes edit button behavior) */
  unifiedMode?: boolean
}) {
  const exerciseCount = workout.session_plan_exercises?.length ?? 0

  return (
    <div>
      {/* Workout Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {workout.name || "Workout"}
            </h2>
            {isToday && (
              <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                Today
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getDayName(workout.day)} · {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-1.5"
          aria-expanded={unifiedMode ? isExpanded : undefined}
          aria-label={unifiedMode
            ? (isExpanded ? `Collapse workout editor for ${workout.name || 'workout'}` : `Expand workout editor for ${workout.name || 'workout'}`)
            : `Edit ${workout.name || 'workout'} session in new page`
          }
        >
          {unifiedMode ? (
            isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                Collapse
              </>
            ) : (
              <>
                <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </>
            )
          ) : (
            <>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Edit Session
            </>
          )}
        </Button>
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        {exerciseCount > 0 ? (
          workout.session_plan_exercises?.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              index={index + 1}
              name={exercise.exercise?.name || "Exercise"}
              sets={exercise.session_plan_sets ?? []}
              onClick={onEdit}
            />
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-xl">
            <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No exercises added yet</p>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Add Exercises
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Exercise row with set details
 */
function ExerciseRow({
  index,
  name,
  sets,
  onClick,
}: {
  index: number
  name: string
  sets: Array<{
    id: number | string
    set_index: number | null
    reps?: number | null
    weight?: number | null
    distance?: number | null
    performing_time?: number | null
  }>
  onClick: () => void
}) {
  const formatSet = (set: typeof sets[0]) => {
    const parts: string[] = []
    if (set.reps) parts.push(`${set.reps}`)
    if (set.weight) parts.push(`${set.weight}kg`)
    if (set.distance) parts.push(`${set.distance}m`)
    if (set.performing_time) parts.push(`${set.performing_time}s`)
    return parts.join(' × ') || '—'
  }

  return (
    <button
      onClick={onClick}
      aria-label={`Exercise ${index}: ${name}${sets.length > 0 ? `, ${sets.length} set${sets.length !== 1 ? 's' : ''}` : ', no sets defined'}. Click to edit.`}
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all",
        "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/40",
        "group"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium" aria-hidden="true">
            {index}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium text-sm">{name}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" aria-hidden="true">
              {sets.slice(0, 4).map((set, i) => (
                <span
                  key={set.id}
                  className="text-xs text-muted-foreground font-mono"
                >
                  <span className="text-muted-foreground/60">S{i + 1}</span> {formatSet(set)}
                </span>
              ))}
              {sets.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{sets.length - 4} more
                </span>
              )}
              {sets.length === 0 && (
                <span className="text-xs text-muted-foreground/60 italic">No sets defined</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" aria-hidden="true" />
      </div>
    </button>
  )
}

/**
 * Empty state when no workout selected
 */
function EmptyWorkoutState() {
  return (
    <div className="text-center py-16">
      <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground">Select a workout to view details</p>
    </div>
  )
}

/**
 * Loading skeleton for SessionPlannerV2 during lazy load (T015)
 */
function WorkoutEditorSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
      </div>
    </div>
  )
}
