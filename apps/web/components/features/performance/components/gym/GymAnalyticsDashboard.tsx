"use client"

import { useState, useMemo } from "react"
import { Settings2, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GymQuickStats, type GymStat, defaultGymStats } from "./GymQuickStats"
import { OneRMProgressionChart, type ExerciseProgress } from "./OneRMProgressionChart"
import { WorkoutConsistencyHeatmap, type WorkoutDay } from "./WorkoutConsistencyHeatmap"
import { StrengthBenchmarkCard, type LiftStats } from "./StrengthBenchmarkCard"
import { useGymAnalytics } from "../../hooks"
import type { GymTimeRange } from "../../config/query-config"

interface GymAnalyticsDashboardProps {
  gender?: 'male' | 'female'
  unit?: 'kg' | 'lbs'
  className?: string
}

/**
 * Transform server data to quick stats format
 */
function buildQuickStats(data: {
  quickStats: {
    weeklyVolume: number
    volumeChange: number
    avgIntensity: number
    intensityChange: number
    prsThisMonth: number
    sessionsThisWeek: number
  }
}): GymStat[] {
  const { quickStats } = data

  return [
    {
      id: 'weekly-volume',
      label: 'Weekly Volume',
      value: quickStats.weeklyVolume > 0 ? String(quickStats.weeklyVolume) : 'N/A',
      unit: quickStats.weeklyVolume > 0 ? 'sets' : '',
      change: quickStats.volumeChange !== 0
        ? {
            value: `${quickStats.volumeChange > 0 ? '+' : ''}${quickStats.volumeChange}%`,
            direction: quickStats.volumeChange > 0 ? 'up' : 'down',
            isPositive: quickStats.volumeChange > 0,
          }
        : undefined,
      subtitle: 'vs last week',
    },
    {
      id: 'avg-intensity',
      label: 'Avg Intensity',
      value: quickStats.avgIntensity > 0 ? String(quickStats.avgIntensity) : 'N/A',
      unit: quickStats.avgIntensity > 0 ? '%' : '',
      change: quickStats.intensityChange !== 0
        ? {
            value: `${quickStats.intensityChange > 0 ? '+' : ''}${quickStats.intensityChange}%`,
            direction: quickStats.intensityChange > 0 ? 'up' : 'down',
            isPositive: quickStats.intensityChange > 0,
          }
        : undefined,
      subtitle: 'of 1RM',
    },
    {
      id: 'prs-this-month',
      label: 'PRs This Month',
      value: String(quickStats.prsThisMonth),
      change: quickStats.prsThisMonth > 0
        ? {
            value: `+${quickStats.prsThisMonth}`,
            direction: 'up',
            isPositive: true,
          }
        : undefined,
      subtitle: 'new records',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: String(quickStats.sessionsThisWeek),
      subtitle: 'this week',
    },
  ]
}

/**
 * Transform exercise progress data for charts
 */
function transformExerciseProgress(
  exerciseProgress: Array<{
    exercise: string
    currentOneRM: number
    previousOneRM?: number
    data: Array<{ date: string; value: number }>
    color: string
  }>
): ExerciseProgress[] {
  return exerciseProgress.map(ep => ({
    exercise: ep.exercise,
    currentOneRM: ep.currentOneRM,
    previousOneRM: ep.previousOneRM,
    color: ep.color,
    data: ep.data.map(d => ({
      date: new Date(d.date),
      value: d.value,
      exercise: ep.exercise,
    })),
  }))
}

/**
 * Transform workout history for heatmap
 */
function transformWorkoutHistory(
  workoutHistory: Array<{
    date: string
    intensity: number
    duration?: number
    exercises?: number
  }>
): WorkoutDay[] {
  return workoutHistory.map(w => ({
    date: new Date(w.date),
    intensity: w.intensity as 0 | 1 | 2 | 3 | 4,
    duration: w.duration,
    exercises: w.exercises,
  }))
}

/**
 * Transform lift stats for benchmark card
 */
function transformLiftStats(
  liftStats: Array<{
    exercise: string
    oneRM: number
    previousOneRM?: number
  }>
): LiftStats[] {
  return liftStats.map(l => ({
    exercise: l.exercise,
    oneRM: l.oneRM,
    previousOneRM: l.previousOneRM,
  }))
}

export function GymAnalyticsDashboard({
  gender = 'male',
  unit = 'kg',
  className,
}: GymAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<GymTimeRange>('3months')
  const [selectedExercise, setSelectedExercise] = useState<string>('all')

  // Fetch gym analytics data
  const { data, isLoading, error } = useGymAnalytics(timeRange)

  // Transform data for components
  const quickStats = useMemo(() =>
    data ? buildQuickStats(data) : defaultGymStats,
    [data]
  )

  const exercises = useMemo(() =>
    data ? transformExerciseProgress(data.exerciseProgress) : [],
    [data]
  )

  const workouts = useMemo(() =>
    data ? transformWorkoutHistory(data.workoutHistory) : [],
    [data]
  )

  const lifts = useMemo(() =>
    data ? transformLiftStats(data.liftStats) : [],
    [data]
  )

  const bodyweight = data?.bodyweight || 80

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading gym analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-center">
          <p className="text-sm text-destructive">Failed to load gym analytics</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as GymTimeRange)}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <GymQuickStats stats={quickStats} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1RM Progression - Larger */}
        <OneRMProgressionChart
          exercises={exercises}
          selectedExercise={selectedExercise}
          onExerciseChange={setSelectedExercise}
          unit={unit}
          className="lg:col-span-2"
        />

        {/* Strength Benchmarks */}
        <StrengthBenchmarkCard
          lifts={lifts}
          bodyweight={bodyweight}
          gender={gender}
          unit={unit}
        />
      </div>

      {/* Consistency Heatmap */}
      <WorkoutConsistencyHeatmap
        workouts={workouts}
        weeks={12}
      />
    </div>
  )
}
