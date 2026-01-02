"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { format, startOfWeek, addDays, subWeeks, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface WorkoutDay {
  date: Date | string
  intensity: number // 0-4 scale (0 = no workout, 4 = intense)
  duration?: number // minutes
  exercises?: number
}

interface WorkoutConsistencyHeatmapProps {
  workouts: WorkoutDay[]
  weeks?: number
  className?: string
}

const intensityColors = [
  'bg-muted/30',      // 0 - no workout
  'bg-green-500/20',  // 1 - light
  'bg-green-500/40',  // 2 - moderate
  'bg-green-500/60',  // 3 - hard
  'bg-green-500/90',  // 4 - intense
]

const intensityLabels = ['Rest', 'Light', 'Moderate', 'Hard', 'Intense']

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WorkoutConsistencyHeatmap({
  workouts,
  weeks = 12,
  className,
}: WorkoutConsistencyHeatmapProps) {
  // Generate calendar grid
  const calendarData = useMemo(() => {
    const today = new Date()
    const startDate = startOfWeek(subWeeks(today, weeks - 1))
    const grid: Array<Array<{ date: Date; workout?: WorkoutDay }>> = []

    // Create weeks
    for (let week = 0; week < weeks; week++) {
      const weekData: Array<{ date: Date; workout?: WorkoutDay }> = []
      for (let day = 0; day < 7; day++) {
        const currentDate = addDays(startDate, week * 7 + day)
        const workout = workouts.find(w => {
          const workoutDate = typeof w.date === 'string' ? new Date(w.date) : w.date
          return isSameDay(workoutDate, currentDate)
        })
        weekData.push({ date: currentDate, workout })
      }
      grid.push(weekData)
    }

    return grid
  }, [workouts, weeks])

  // Calculate stats
  const stats = useMemo(() => {
    const totalDays = weeks * 7
    const workoutDays = workouts.length
    const consistency = totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0

    // Current streak
    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(today, -i)
      const hasWorkout = workouts.some(w => {
        const workoutDate = typeof w.date === 'string' ? new Date(w.date) : w.date
        return isSameDay(workoutDate, checkDate)
      })
      if (hasWorkout) {
        currentStreak++
      } else if (i > 0) {
        break
      }
    }

    // Average weekly workouts
    const avgWeekly = weeks > 0 ? Math.round((workoutDays / weeks) * 10) / 10 : 0

    return { consistency, currentStreak, avgWeekly, totalWorkouts: workoutDays }
  }, [workouts, weeks])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Workout Consistency</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{stats.avgWeekly}</span>
              <span> / week avg</span>
            </div>
            <div>
              <span className="font-medium text-foreground">{stats.currentStreak}</span>
              <span> day streak</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <TooltipProvider delayDuration={100}>
          <div className="flex flex-col gap-1.5">
            {/* Day labels */}
            <div className="flex gap-1.5">
              <div className="w-6" /> {/* Spacer for month labels */}
              {dayLabels.map((day, i) => (
                <div
                  key={day}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {i % 2 === 0 ? day[0] : ''}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1.5">
              {/* Month labels column */}
              <div className="flex flex-col gap-1">
                {calendarData.map((week, weekIndex) => {
                  const firstDayOfWeek = week[0].date
                  const showMonth = weekIndex === 0 || firstDayOfWeek.getDate() <= 7

                  return (
                    <div key={weekIndex} className="h-3 w-6 flex items-center">
                      {showMonth && (
                        <span className="text-[9px] text-muted-foreground">
                          {format(firstDayOfWeek, 'MMM')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Calendar grid */}
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <div key={dayIndex} className="flex-1 flex flex-col gap-1">
                    {calendarData.map((week, weekIndex) => {
                      const cell = week[dayIndex]
                      const intensity = cell.workout?.intensity || 0
                      const isToday = isSameDay(cell.date, new Date())
                      const isFuture = cell.date > new Date()

                      return (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: (weekIndex * 7 + dayIndex) * 0.002,
                              }}
                              className={cn(
                                "aspect-square rounded-sm transition-colors cursor-pointer",
                                isFuture ? 'bg-muted/10' : intensityColors[intensity],
                                isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {format(cell.date, 'MMM d, yyyy')}
                              </p>
                              {cell.workout ? (
                                <>
                                  <p className="text-muted-foreground">
                                    {intensityLabels[cell.workout.intensity]} workout
                                  </p>
                                  {cell.workout.duration && (
                                    <p className="text-muted-foreground">
                                      {cell.workout.duration} min
                                    </p>
                                  )}
                                  {cell.workout.exercises && (
                                    <p className="text-muted-foreground">
                                      {cell.workout.exercises} exercises
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-muted-foreground">Rest day</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                {intensityColors.map((color, i) => (
                  <div
                    key={i}
                    className={cn("w-3 h-3 rounded-sm", color)}
                    title={intensityLabels[i]}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
