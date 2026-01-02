"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatWeight } from "../../data/gym-benchmarks"

export interface OneRMDataPoint {
  date: Date | string
  value: number
  exercise: string
}

export interface ExerciseProgress {
  exercise: string
  data: OneRMDataPoint[]
  currentOneRM: number
  previousOneRM?: number
  color: string
}

interface OneRMProgressionChartProps {
  exercises: ExerciseProgress[]
  selectedExercise?: string
  onExerciseChange?: (exercise: string) => void
  unit?: 'kg' | 'lbs'
  className?: string
}

const exerciseColors: Record<string, string> = {
  'Bench Press': '#3b82f6',
  'Squat': '#22c55e',
  'Deadlift': '#f97316',
  'Overhead Press': '#a855f7',
  'Barbell Row': '#eab308',
}

export function OneRMProgressionChart({
  exercises,
  selectedExercise = 'all',
  onExerciseChange,
  unit = 'kg',
  className,
}: OneRMProgressionChartProps) {
  // Merge all exercise data into single timeline for chart
  const chartData = useMemo(() => {
    if (selectedExercise === 'all') {
      // Create merged timeline with all exercises
      const allDates = new Set<string>()
      exercises.forEach(ex => {
        ex.data.forEach(d => {
          allDates.add(typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0])
        })
      })

      const sortedDates = Array.from(allDates).sort()
      return sortedDates.map(date => {
        const point: Record<string, number | string> = { date }
        exercises.forEach(ex => {
          const dataPoint = ex.data.find(d => {
            const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0]
            return dStr === date
          })
          if (dataPoint) {
            point[ex.exercise] = dataPoint.value
          }
        })
        return point
      })
    } else {
      const exercise = exercises.find(e => e.exercise === selectedExercise)
      if (!exercise) return []
      return exercise.data.map(d => ({
        date: typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0],
        [selectedExercise]: d.value,
      }))
    }
  }, [exercises, selectedExercise])

  const displayedExercises = useMemo(() => {
    if (selectedExercise === 'all') return exercises
    return exercises.filter(e => e.exercise === selectedExercise)
  }, [exercises, selectedExercise])

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ dataKey: string; value: number; color: string }>
    label?: string
  }) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className="bg-popover border border-border/50 rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="text-xs text-muted-foreground mb-2">
          {label ? format(new Date(label), 'MMM d, yyyy') : ''}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.dataKey}</span>
            </div>
            <span className="tabular-nums font-semibold">
              {formatWeight(entry.value, unit)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">1RM Progression</CardTitle>
          {exercises.length > 1 && onExerciseChange && (
            <Select value={selectedExercise} onValueChange={onExerciseChange}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises</SelectItem>
                {exercises.map(ex => (
                  <SelectItem key={ex.exercise} value={ex.exercise}>
                    {ex.exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {exercises.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No exercise data available
          </div>
        ) : (
          <>
            {/* Quick stats for displayed exercises */}
            <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-border/30">
              {displayedExercises.map(ex => {
                const change = ex.previousOneRM
                  ? ((ex.currentOneRM - ex.previousOneRM) / ex.previousOneRM * 100).toFixed(1)
                  : null

                return (
                  <div key={ex.exercise} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ex.color }}
                    />
                    <span className="text-xs text-muted-foreground">{ex.exercise}:</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatWeight(ex.currentOneRM, unit)}
                    </span>
                    {change && (
                      <span className={cn(
                        "text-xs tabular-nums",
                        parseFloat(change) >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {parseFloat(change) >= 0 ? '+' : ''}{change}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {displayedExercises.map(ex => (
                    <Line
                      key={ex.exercise}
                      type="monotone"
                      dataKey={ex.exercise}
                      stroke={ex.color || exerciseColors[ex.exercise] || '#6b7280'}
                      strokeWidth={2}
                      dot={{ r: 3, fill: ex.color }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {selectedExercise === 'all' && exercises.length > 3 && (
              <div className="mt-3 flex flex-wrap gap-3 pt-3 border-t border-border/30">
                {exercises.map(ex => (
                  <div key={ex.exercise} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-0.5 rounded-full"
                      style={{ backgroundColor: ex.color }}
                    />
                    <span className="text-xs text-muted-foreground">{ex.exercise}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
