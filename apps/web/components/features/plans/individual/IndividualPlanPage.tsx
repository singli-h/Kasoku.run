"use client"

/**
 * IndividualPlanPage
 *
 * Mobile-first, today-focused layout for individual users.
 * Responsive: single column on mobile, 2-column on desktop.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5
 */

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Sparkles } from "lucide-react"
import { useIsDesktop } from "@/components/features/ai-assistant/hooks/useAILayoutMode"
import type { MesocycleWithDetails, MicrocycleWithDetails, SessionPlanWithDetails } from "@/types/training"
import { TodayWorkoutCard } from "./TodayWorkoutCard"
import { WeekWorkoutList } from "./WeekWorkoutList"
import { WeekSelectorSheet } from "./WeekSelectorSheet"

interface IndividualPlanPageProps {
  trainingBlock: MesocycleWithDetails
}

/**
 * Find the current week based on today's date
 */
function findCurrentWeek(microcycles?: MicrocycleWithDetails[]): MicrocycleWithDetails | null {
  if (!microcycles?.length) return null
  const today = new Date()
  return microcycles.find(week => {
    if (!week.start_date || !week.end_date) return false
    const start = new Date(week.start_date)
    const end = new Date(week.end_date)
    return today >= start && today <= end
  }) || microcycles[0] // Default to first week if none match
}

/**
 * Find today's workout from the current week
 */
function findTodayWorkout(workouts?: SessionPlanWithDetails[]): SessionPlanWithDetails | null {
  if (!workouts?.length) return null
  const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.

  // Find workout scheduled for today
  const todayWorkout = workouts.find(w => w.day === today)
  if (todayWorkout) return todayWorkout

  // If no workout today, find next upcoming one
  const sortedWorkouts = [...workouts].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
  return sortedWorkouts.find(w => (w.day ?? 0) >= today) || sortedWorkouts[0]
}

/**
 * Get week number in the block
 */
function getWeekNumber(microcycles: MicrocycleWithDetails[] | undefined, weekId: number): number {
  if (!microcycles) return 1
  const index = microcycles.findIndex(m => m.id === weekId)
  return index >= 0 ? index + 1 : 1
}

export function IndividualPlanPage({ trainingBlock }: IndividualPlanPageProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()

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

  // Today's workout from selected week
  const todayWorkout = useMemo(() =>
    findTodayWorkout(selectedWeek?.session_plans),
    [selectedWeek]
  )

  // Week info for display
  const weekNumber = getWeekNumber(trainingBlock.microcycles, selectedWeekId ?? 0)
  const totalWeeks = trainingBlock.microcycles?.length ?? 0
  const workouts = selectedWeek?.session_plans ?? []

  // Handler for week selection
  const handleWeekSelect = (weekId: number) => {
    setSelectedWeekId(weekId)
    setWeekSelectorOpen(false)
  }

  // Handler for selecting a different workout from the week list
  // Note: session_plan IDs are strings, microcycle IDs are numbers
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const displayedWorkout = useMemo(() => {
    if (selectedWorkoutId !== null) {
      return workouts.find(w => w.id === selectedWorkoutId) ?? todayWorkout
    }
    return todayWorkout
  }, [selectedWorkoutId, workouts, todayWorkout])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/plans')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">
                  {trainingBlock.name || "Training Block"}
                </h1>
                {/* Week selector trigger */}
                <button
                  onClick={() => setWeekSelectorOpen(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Week {weekNumber} of {totalWeeks}</span>
                  <span className="text-xs">▼</span>
                </button>
              </div>
            </div>

            {/* Actions - visible on desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {/* Responsive layout: single column on mobile, 2-column on desktop */}
        <div className="flex flex-col lg:flex-row lg:gap-6 max-w-6xl mx-auto">
          {/* Left column: Today's workout */}
          <div className="flex-1 min-w-0">
            {displayedWorkout ? (
              <TodayWorkoutCard
                workout={displayedWorkout}
                blockId={trainingBlock.id}
                isToday={displayedWorkout.id === todayWorkout?.id && !selectedWorkoutId}
                defaultExpanded={isDesktop}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No workouts scheduled for this week</p>
              </div>
            )}
          </div>

          {/* Right column: This week's workouts (desktop: sidebar, mobile: below) */}
          <div className="mt-6 lg:mt-0 lg:w-80 lg:shrink-0">
            <WeekWorkoutList
              workouts={workouts}
              selectedWorkoutId={displayedWorkout?.id ?? null}
              todayWorkoutId={todayWorkout?.id ?? null}
              onSelectWorkout={(workoutId: string) => {
                // If selecting today's workout, clear selection (show default today view)
                if (todayWorkout && workoutId === todayWorkout.id) {
                  setSelectedWorkoutId(null)
                } else {
                  setSelectedWorkoutId(workoutId)
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* Week Selector Sheet/Dropdown */}
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
