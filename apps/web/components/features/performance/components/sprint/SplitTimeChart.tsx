"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CUMULATIVE_SPLIT_STANDARDS, type RunnerStandard } from "../../data/sprint-benchmarks"

export interface AthleteSpilt {
  distance: number
  time: number
  cumulativeTime?: number
}

export interface SprintSession {
  id: string
  date: string
  totalDistance: number
  totalTime: number
  splits: AthleteSpilt[]
  isPB?: boolean
}

interface SplitTimeChartProps {
  sessions: SprintSession[]
  showBenchmarks?: ('10.00' | '11.00' | '12.00')[]
  highlightSessionId?: string
  className?: string
}

interface ChartDataPoint {
  distance: number
  distanceLabel: string
  athleteBest?: number
  athleteLatest?: number
  benchmark10?: number
  benchmark11?: number
  benchmark12?: number
}

export function SplitTimeChart({
  sessions,
  showBenchmarks = ['10.00', '11.00'],
  highlightSessionId,
  className,
}: SplitTimeChartProps) {
  const chartData = useMemo(() => {
    const distances = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const bestSession = sessions.find(s => s.isPB) || sessions[0]
    const latestSession = sessions[0]

    return distances.map(distance => {
      const point: ChartDataPoint = {
        distance,
        distanceLabel: `${distance}m`,
      }

      // Find athlete times at this distance
      if (bestSession?.splits) {
        const split = bestSession.splits.find(s => s.distance === distance)
        if (split?.cumulativeTime) {
          point.athleteBest = split.cumulativeTime
        }
      }

      if (latestSession?.splits && latestSession.id !== bestSession?.id) {
        const split = latestSession.splits.find(s => s.distance === distance)
        if (split?.cumulativeTime) {
          point.athleteLatest = split.cumulativeTime
        }
      }

      // Add benchmark lines
      if (showBenchmarks.includes('10.00')) {
        const standard = CUMULATIVE_SPLIT_STANDARDS['10.00']
        if (standard?.splits[distance]) {
          point.benchmark10 = (standard.splits[distance].min + standard.splits[distance].max) / 2
        }
      }

      if (showBenchmarks.includes('11.00')) {
        const standard = CUMULATIVE_SPLIT_STANDARDS['11.00']
        if (standard?.splits[distance]) {
          point.benchmark11 = (standard.splits[distance].min + standard.splits[distance].max) / 2
        }
      }

      if (showBenchmarks.includes('12.00')) {
        const standard = CUMULATIVE_SPLIT_STANDARDS['12.00']
        if (standard?.splits[distance]) {
          point.benchmark12 = (standard.splits[distance].min + standard.splits[distance].max) / 2
        }
      }

      return point
    })
  }, [sessions, showBenchmarks])

  // Filter to only show distances that have data
  const filteredData = useMemo(() => {
    const maxAthleteDistance = sessions.reduce((max, session) => {
      const sessionMax = Math.max(...session.splits.map(s => s.distance))
      return Math.max(max, sessionMax)
    }, 0)

    // Show at least up to athlete's max distance, or full 100m if benchmarks shown
    const maxDistance = showBenchmarks.length > 0 ? 100 : maxAthleteDistance
    return chartData.filter(d => d.distance <= maxDistance)
  }, [chartData, sessions, showBenchmarks])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const name = entry.dataKey === 'athleteBest'
              ? 'Your Best'
              : entry.dataKey === 'athleteLatest'
                ? 'Latest'
                : entry.dataKey === 'benchmark10'
                  ? '10.00s Standard'
                  : entry.dataKey === 'benchmark11'
                    ? '11.00s Standard'
                    : '12.00s Standard'

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.stroke || entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {entry.value?.toFixed(2)}s
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const hasData = sessions.length > 0 && sessions.some(s => s.splits.length > 0)

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Split Time Progression</CardTitle>
          <div className="flex items-center gap-2">
            {showBenchmarks.includes('10.00') && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                10.00s
              </Badge>
            )}
            {showBenchmarks.includes('11.00') && (
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                11.00s
              </Badge>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Your Best</span>
          </div>
          {showBenchmarks.includes('10.00') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-green-500 opacity-60" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">10.00s Ref</span>
            </div>
          )}
          {showBenchmarks.includes('11.00') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-orange-500 opacity-60" />
              <span className="text-muted-foreground">11.00s Ref</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No sprint data available. Upload a Freelap CSV to get started.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                  vertical={false}
                />

                <XAxis
                  dataKey="distanceLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                  tickMargin={8}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${Number(value).toFixed(0)}s`}
                  domain={[
                    (dataMin: number) => Math.floor(dataMin),
                    (dataMax: number) => Math.ceil(dataMax) + 1
                  ]}
                  ticks={(() => {
                    // Generate nice round tick values (every 1s for short sprints, 2s for 100m)
                    const maxTime = showBenchmarks.length > 0 ? 12 : 6
                    const interval = maxTime > 8 ? 2 : 1
                    const ticks = []
                    for (let i = 0; i <= maxTime; i += interval) {
                      ticks.push(i)
                    }
                    return ticks
                  })()}
                  width={45}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Benchmark lines - dashed, subtle */}
                {showBenchmarks.includes('10.00') && (
                  <Line
                    type="monotone"
                    dataKey="benchmark10"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    dot={false}
                    activeDot={false}
                  />
                )}

                {showBenchmarks.includes('11.00') && (
                  <Line
                    type="monotone"
                    dataKey="benchmark11"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    dot={false}
                    activeDot={false}
                  />
                )}

                {showBenchmarks.includes('12.00') && (
                  <Line
                    type="monotone"
                    dataKey="benchmark12"
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                    dot={false}
                    activeDot={false}
                  />
                )}

                {/* Athlete data - solid, prominent */}
                <Line
                  type="monotone"
                  dataKey="athleteBest"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{
                    fill: 'hsl(var(--primary))',
                    strokeWidth: 2,
                    stroke: 'hsl(var(--background))',
                    r: 4,
                  }}
                  activeDot={{
                    fill: 'hsl(var(--primary))',
                    strokeWidth: 2,
                    stroke: 'hsl(var(--background))',
                    r: 6,
                  }}
                />

                {/* Latest session if different from best */}
                {sessions.length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="athleteLatest"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                    dot={{
                      fill: 'hsl(var(--muted-foreground))',
                      strokeWidth: 0,
                      r: 3,
                    }}
                    activeDot={{
                      fill: 'hsl(var(--muted-foreground))',
                      strokeWidth: 0,
                      r: 5,
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
