'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Dumbbell, Calendar } from "lucide-react"
import Link from "next/link"
import { TrainingBlockCard } from "./TrainingBlockCard"
import { EmptyTrainingState } from "./EmptyTrainingState"
import type { MesocycleWithDetails } from "@/types/training"

interface IndividualPlansHomeClientProps {
  activeBlock: MesocycleWithDetails | null
  completedBlocks: MesocycleWithDetails[]
  upcomingBlocks: MesocycleWithDetails[]
  todayWorkout: {
    id: string
    name: string
    exerciseCount: number
  } | null
}

/**
 * Client component for Individual user's training home page
 * Simplified layout focused on active training block and quick actions
 */
export function IndividualPlansHomeClient({
  activeBlock,
  completedBlocks,
  upcomingBlocks,
  todayWorkout
}: IndividualPlansHomeClientProps) {
  const hasAnyBlocks = activeBlock || completedBlocks.length > 0 || upcomingBlocks.length > 0

  // If no blocks at all, show empty state
  if (!hasAnyBlocks) {
    return <EmptyTrainingState />
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div />
        <Button asChild>
          <Link href="/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New Training Block
          </Link>
        </Button>
      </div>

      {/* Active Block Section */}
      {activeBlock && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Active Training
          </h2>
          <TrainingBlockCard
            block={activeBlock}
            isActive={true}
            todayWorkout={todayWorkout}
          />
        </section>
      )}

      {/* This Week Overview (if active block) */}
      {activeBlock && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week
          </h2>
          <WeekOverview block={activeBlock} />
        </section>
      )}

      {/* Upcoming Blocks */}
      {upcomingBlocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Upcoming</h2>
          <div className="space-y-3">
            {upcomingBlocks.map(block => (
              <TrainingBlockCard key={block.id} block={block} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Blocks */}
      {completedBlocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
          <div className="space-y-3">
            {completedBlocks.slice(0, 3).map(block => (
              <TrainingBlockCard key={block.id} block={block} />
            ))}
            {completedBlocks.length > 3 && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/plans?filter=completed">
                  View all {completedBlocks.length} completed blocks
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * Week overview showing days with scheduled workouts
 */
function WeekOverview({ block }: { block: MesocycleWithDetails }) {
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Find current microcycle
  const currentMicrocycle = block.microcycles?.find(micro => {
    const startDate = new Date(micro.start_date!)
    const endDate = new Date(micro.end_date!)
    return today >= startDate && today <= endDate
  })

  const workouts = currentMicrocycle?.session_plans || []

  // Days of week starting from Monday
  const days = [
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
    { day: 0, label: 'Sun' },
  ]

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ day, label }) => {
            // Match session_plans.day field (day of week: 0=Sunday, 1-6=Mon-Sat)
            const dayWorkouts = workouts.filter(w => w.day === day)
            const hasWorkout = dayWorkouts.length > 0
            const isToday = day === dayOfWeek
            // P1 Fix: Map Sunday from 0 to 7 for correct week order comparison (Mon=1 to Sun=7)
            const dayOrder = day === 0 ? 7 : day
            const todayOrder = dayOfWeek === 0 ? 7 : dayOfWeek
            const isPast = dayOrder < todayOrder

            return (
              <div
                key={day}
                className={`
                  flex flex-col items-center p-2 rounded-lg text-center
                  ${isToday ? 'bg-primary/10 ring-2 ring-primary' : ''}
                  ${!isToday && hasWorkout ? 'bg-muted/50' : ''}
                `}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                <div className="mt-1 h-6 flex items-center justify-center">
                  {hasWorkout ? (
                    isToday ? (
                      <span className="text-primary text-lg">•</span>
                    ) : isPast ? (
                      <span className="text-muted-foreground text-lg">○</span>
                    ) : (
                      <span className="text-muted-foreground text-lg">○</span>
                    )
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">Rest</span>
                  )}
                </div>
                {hasWorkout && dayWorkouts[0] && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-full mt-1">
                    {dayWorkouts[0].name?.split(' ')[0] || 'Workout'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
