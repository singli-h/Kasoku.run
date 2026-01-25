"use client"

/**
 * IndividualPlanPage
 *
 * Streamlined training view for individual users.
 *
 * Desktop: 2-column layout with week timeline sidebar + workout details
 * Mobile: Single column with progress header + day selector
 *
 * Design inspired by: TrainingPeaks week timeline, Apple Fitness+ progress,
 * and Strong app's clean workout presentation.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5
 */

import { useState, useMemo } from "react"
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
  Play,
  Dumbbell,
  Sparkles,
  Calendar,
  MoreHorizontal,
  Edit,
  ExternalLink,
  CheckCircle2,
  Circle,
  Layers,
  Clock,
  Check,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/components/features/ai-assistant/hooks/useAILayoutMode"
import type { MesocycleWithDetails, MicrocycleWithDetails, SessionPlanWithDetails } from "@/types/training"
import { WeekSelectorSheet } from "./WeekSelectorSheet"

interface IndividualPlanPageProps {
  trainingBlock: MesocycleWithDetails
  /** Other blocks to show in the block switcher */
  otherBlocks?: {
    upcoming: MesocycleWithDetails[]
    completed: MesocycleWithDetails[]
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function findCurrentWeek(microcycles?: MicrocycleWithDetails[]): MicrocycleWithDetails | null {
  if (!microcycles?.length) return null
  const today = new Date()
  return microcycles.find(week => {
    if (!week.start_date || !week.end_date) return false
    const start = new Date(week.start_date)
    const end = new Date(week.end_date)
    return today >= start && today <= end
  }) || microcycles[0]
}

function findTodayWorkout(workouts?: SessionPlanWithDetails[]): SessionPlanWithDetails | null {
  if (!workouts?.length) return null
  const today = new Date().getDay()
  const todayWorkout = workouts.find(w => w.day === today)
  if (todayWorkout) return todayWorkout
  const sortedWorkouts = [...workouts].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
  return sortedWorkouts.find(w => (w.day ?? 0) >= today) || sortedWorkouts[0]
}

function getDayAbbrev(day: number): string {
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day] ?? '—'
}

function getDayName(day: number | null): string {
  if (day === null) return 'Unscheduled'
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? '—'
}

function sortByDay(workouts: SessionPlanWithDetails[]): SessionPlanWithDetails[] {
  return [...workouts].sort((a, b) => {
    const dayA = a.day === 0 ? 7 : (a.day ?? 8)
    const dayB = b.day === 0 ? 7 : (b.day ?? 8)
    return dayA - dayB
  })
}

function isWeekPast(week: MicrocycleWithDetails): boolean {
  if (!week.end_date) return false
  return new Date(week.end_date) < new Date()
}

function isWeekCurrent(week: MicrocycleWithDetails): boolean {
  if (!week.start_date || !week.end_date) return false
  const today = new Date()
  return today >= new Date(week.start_date) && today <= new Date(week.end_date)
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================================================
// Main Component
// ============================================================================

export function IndividualPlanPage({ trainingBlock, otherBlocks }: IndividualPlanPageProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()

  // Combine other blocks for the switcher
  const hasOtherBlocks = (otherBlocks?.upcoming?.length ?? 0) > 0 || (otherBlocks?.completed?.length ?? 0) > 0

  // Week selection state
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(() =>
    findCurrentWeek(trainingBlock.microcycles)?.id ?? trainingBlock.microcycles?.[0]?.id ?? null
  )
  const [weekSelectorOpen, setWeekSelectorOpen] = useState(false)

  // Currently selected week
  const selectedWeek = useMemo(() =>
    trainingBlock.microcycles?.find(m => m.id === selectedWeekId) ?? null,
    [trainingBlock.microcycles, selectedWeekId]
  )

  // Workouts and today detection
  const workouts = useMemo(() => sortByDay(selectedWeek?.session_plans ?? []), [selectedWeek])
  const todayWorkout = useMemo(() => findTodayWorkout(selectedWeek?.session_plans), [selectedWeek])
  const today = new Date().getDay()

  // Selected workout state
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const displayedWorkout = useMemo(() => {
    if (selectedWorkoutId !== null) {
      return workouts.find(w => w.id === selectedWorkoutId) ?? todayWorkout
    }
    return todayWorkout
  }, [selectedWorkoutId, workouts, todayWorkout])

  // Week info
  const weekNumber = (trainingBlock.microcycles?.findIndex(m => m.id === selectedWeekId) ?? 0) + 1
  const totalWeeks = trainingBlock.microcycles?.length ?? 0

  const handleWeekSelect = (weekId: number) => {
    setSelectedWeekId(weekId)
    setSelectedWorkoutId(null)
    setWeekSelectorOpen(false)
  }

  const handleStartWorkout = () => {
    if (displayedWorkout) {
      router.push(`/plans/${trainingBlock.id}/session/${displayedWorkout.id}`)
    }
  }

  // Desktop: 2-column layout with week sidebar
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Left Sidebar: Week Timeline */}
          <aside className="w-64 shrink-0 border-r border-border/40 bg-muted/20">
            <div className="sticky top-0 h-screen overflow-y-auto">
              {/* Block Header with Switcher */}
              <div className="p-4 border-b border-border/40">
                {hasOtherBlocks ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full text-left group hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-primary shrink-0" />
                              <h1 className="font-semibold text-sm truncate">
                                {trainingBlock.name || "Training Block"}
                              </h1>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              {totalWeeks} weeks · Active
                            </p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
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
                          {otherBlocks?.upcoming.map(block => (
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
                          {otherBlocks?.completed.slice(0, 3).map(block => (
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div>
                    <h1 className="font-semibold text-sm truncate">
                      {trainingBlock.name || "Training Block"}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalWeeks} weeks
                    </p>
                  </div>
                )}
              </div>

              {/* Week List */}
              <nav className="p-2">
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

              {/* Actions at bottom */}
              <div className="p-4 border-t border-border/40 mt-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/plans/new?regenerate=${trainingBlock.id}`)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Regenerate with AI
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
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
                </div>
              </div>

              {/* Horizontal Day Selector */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2">
                  {workouts.map((workout) => {
                    const isSelected = workout.id === displayedWorkout?.id
                    const isToday = workout.day === today
                    const dayNum = workout.day ?? 7
                    const isPast = dayNum < today || (dayNum === 0 && today !== 0)

                    return (
                      <button
                        key={workout.id}
                        onClick={() => setSelectedWorkoutId(workout.id === todayWorkout?.id ? null : workout.id)}
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
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
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
              </div>
            </header>

            {/* Workout Details */}
            <div className="p-6">
              {displayedWorkout ? (
                <WorkoutDetails
                  workout={displayedWorkout}
                  blockId={trainingBlock.id}
                  isToday={displayedWorkout.day === today}
                  onStart={handleStartWorkout}
                  onEdit={() => router.push(`/plans/${trainingBlock.id}/session/${displayedWorkout.id}`)}
                />
              ) : (
                <EmptyWorkoutState />
              )}
            </div>
          </main>
        </div>
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
                    <button className="flex items-center gap-1.5 text-left max-w-full group">
                      <h1 className="text-base font-semibold truncate">
                        {trainingBlock.name || "Training Block"}
                      </h1>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground" />
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
                        {otherBlocks?.upcoming.map(block => (
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
                        {otherBlocks?.completed.slice(0, 2).map(block => (
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
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <h1 className="text-base font-semibold truncate">
                  {trainingBlock.name || "Training Block"}
                </h1>
              )}
              {/* Week selector - more prominent on mobile */}
              <button
                onClick={() => setWeekSelectorOpen(true)}
                className="flex items-center gap-2 mt-1 px-2 py-1 -ml-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <WeekProgressDots
                  totalWeeks={totalWeeks}
                  currentWeek={weekNumber}
                  microcycles={trainingBlock.microcycles ?? []}
                />
                <span className="text-xs text-muted-foreground">
                  Week {weekNumber}/{totalWeeks}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Block
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/plans/new?regenerate=${trainingBlock.id}`)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate with AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Horizontal Day Selector */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {workouts.map((workout) => {
              const isSelected = workout.id === displayedWorkout?.id
              const isToday = workout.day === today
              const dayNum = workout.day ?? 7
              const isPast = dayNum < today || (dayNum === 0 && today !== 0)

              return (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkoutId(workout.id === todayWorkout?.id ? null : workout.id)}
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
                    <span className="w-1 h-1 rounded-full bg-primary mt-1" />
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
        </div>
      </header>

      {/* Mobile Content */}
      <main className="p-4">
        {displayedWorkout ? (
          <WorkoutDetails
            workout={displayedWorkout}
            blockId={trainingBlock.id}
            isToday={displayedWorkout.day === today}
            onStart={handleStartWorkout}
            onEdit={() => router.push(`/plans/${trainingBlock.id}/session/${displayedWorkout.id}`)}
          />
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
 */
function WorkoutDetails({
  workout,
  blockId,
  isToday,
  onStart,
  onEdit,
}: {
  workout: SessionPlanWithDetails
  blockId: number
  isToday: boolean
  onStart: () => void
  onEdit: () => void
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            size="sm"
            onClick={onStart}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        </div>
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
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all",
        "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/40",
        "group"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium">
            {index}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium text-sm">{name}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
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
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
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
