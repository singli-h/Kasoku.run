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
  Scatter,
  ZAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CUMULATIVE_SPLIT_STANDARDS, type RunnerStandard } from "../../data/sprint-benchmarks"
import type { CompetitionPB } from "@/actions/performance/performance-actions"

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
  showBenchmarks?: ('9.58' | '10.00' | '11.00' | '12.00')[]
  competitionPBs?: CompetitionPB[]
  showCompetitionPBs?: boolean
  highlightSessionId?: string
  className?: string
}

interface ChartDataPoint {
  distance: number
  distanceLabel: string
  athleteBest?: number
  athleteLatest?: number
  competitionPB?: number
  competitionPBLabel?: string
  // For area visualization between 10s and 11s
  benchmarkWR?: number         // 9.58 WR (Bolt)
  benchmark10Mid?: number      // 10s midpoint (for reference line)
  benchmark11Mid?: number      // 11s midpoint (for reference line)
  performanceZone?: [number, number]  // [10s, 11s] for area range
  benchmark12?: number
}

export function SplitTimeChart({
  sessions,
  showBenchmarks = ['10.00', '11.00'],
  competitionPBs = [],
  showCompetitionPBs = true,
  highlightSessionId,
  className,
}: SplitTimeChartProps) {
  // Find competition PBs that match chart distances
  const relevantCompetitionPBs = useMemo(() => {
    if (!showCompetitionPBs || competitionPBs.length === 0) return []
    // Only include PBs for distances we show on the chart (60, 100m especially)
    return competitionPBs.filter(pb => [60, 100].includes(pb.distance))
  }, [competitionPBs, showCompetitionPBs])

  const chartData = useMemo(() => {
    const distances = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    // Get ALL sessions marked as PB (one per distance)
    const pbSessions = sessions.filter(s => s.isPB)
    // Fallback to best by time if no isPB flag
    const fallbackBest = pbSessions.length === 0 ? sessions[0] : null
    const latestSession = sessions[0]

    return distances.map(distance => {
      const point: ChartDataPoint = {
        distance,
        distanceLabel: `${distance}m`,
      }

      // Find athlete best time at this distance from ALL PB sessions
      // Each PB session may have splits at different distances
      let bestTimeAtDistance: number | undefined
      for (const session of pbSessions) {
        if (session.splits) {
          const split = session.splits.find(s => s.distance === distance)
          if (split?.cumulativeTime) {
            if (bestTimeAtDistance === undefined || split.cumulativeTime < bestTimeAtDistance) {
              bestTimeAtDistance = split.cumulativeTime
            }
          }
        }
      }
      // Fallback to first session if no PBs found
      if (bestTimeAtDistance === undefined && fallbackBest?.splits) {
        const split = fallbackBest.splits.find(s => s.distance === distance)
        if (split?.cumulativeTime) {
          bestTimeAtDistance = split.cumulativeTime
        }
      }
      if (bestTimeAtDistance !== undefined) {
        point.athleteBest = bestTimeAtDistance
      }

      // Show latest session if different from best
      const latestHasBestTime = pbSessions.some(s => s.id === latestSession?.id)
      if (latestSession?.splits && !latestHasBestTime) {
        const split = latestSession.splits.find(s => s.distance === distance)
        if (split?.cumulativeTime) {
          point.athleteLatest = split.cumulativeTime
        }
      }

      // Add competition PB if exists for this distance
      const competitionPB = relevantCompetitionPBs.find(pb => pb.distance === distance)
      if (competitionPB) {
        point.competitionPB = competitionPB.value
        point.competitionPBLabel = competitionPB.isIndoor
          ? `${competitionPB.eventName} (Indoor)`
          : competitionPB.wind !== undefined
            ? `${competitionPB.eventName} (${competitionPB.wind > 0 ? '+' : ''}${competitionPB.wind}m/s)`
            : competitionPB.eventName
      }

      // Add benchmark data for area visualization
      const standardWR = CUMULATIVE_SPLIT_STANDARDS['9.58']
      const standard10 = CUMULATIVE_SPLIT_STANDARDS['10.00']
      const standard11 = CUMULATIVE_SPLIT_STANDARDS['11.00']
      const standard12 = CUMULATIVE_SPLIT_STANDARDS['12.00']

      // 9.58 World Record (Bolt)
      if (showBenchmarks.includes('9.58') && standardWR?.splits[distance]) {
        point.benchmarkWR = standardWR.splits[distance].min // Exact value, no range
      }

      if (showBenchmarks.includes('10.00') && standard10?.splits[distance]) {
        point.benchmark10Mid = (standard10.splits[distance].min + standard10.splits[distance].max) / 2
      }

      if (showBenchmarks.includes('11.00') && standard11?.splits[distance]) {
        point.benchmark11Mid = (standard11.splits[distance].min + standard11.splits[distance].max) / 2
      }

      // Create performance zone array [10s, 11s] for area rendering
      if (showBenchmarks.includes('10.00') && showBenchmarks.includes('11.00') &&
          standard10?.splits[distance] && standard11?.splits[distance]) {
        const upper = (standard10.splits[distance].min + standard10.splits[distance].max) / 2
        const lower = (standard11.splits[distance].min + standard11.splits[distance].max) / 2
        point.performanceZone = [upper, lower]
      }

      if (showBenchmarks.includes('12.00') && standard12?.splits[distance]) {
        point.benchmark12 = (standard12.splits[distance].min + standard12.splits[distance].max) / 2
      }

      return point
    })
  }, [sessions, showBenchmarks, relevantCompetitionPBs])

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

  // Calculate dynamic Y-axis range based on actual data
  const yAxisConfig = useMemo(() => {
    let maxTime = 0
    let minTime = Infinity
    let hasAthleteData = false

    filteredData.forEach(point => {
      // Check athlete data
      if (point.athleteBest) {
        maxTime = Math.max(maxTime, point.athleteBest)
        minTime = Math.min(minTime, point.athleteBest)
        hasAthleteData = true
      }
      if (point.athleteLatest) {
        maxTime = Math.max(maxTime, point.athleteLatest)
        minTime = Math.min(minTime, point.athleteLatest)
        hasAthleteData = true
      }
      // Always include 11s benchmark as potential max (slower reference line)
      if (point.benchmark11Mid) {
        maxTime = Math.max(maxTime, point.benchmark11Mid)
      }
      // Use WR or 10s benchmark for min bound (fastest visible reference)
      if (point.benchmarkWR) {
        minTime = Math.min(minTime, point.benchmarkWR)
      }
      if (point.benchmark10Mid) {
        minTime = Math.min(minTime, point.benchmark10Mid)
      }
    })

    // Fallback: if no data at all, use sensible defaults
    if (maxTime === 0) maxTime = 11
    if (minTime === Infinity) minTime = 1

    // If athlete's slowest time is faster than 11s benchmark, use 11s as max
    // This ensures the full benchmark zone is always visible
    const last11sBenchmark = filteredData[filteredData.length - 1]?.benchmark11Mid
    if (last11sBenchmark && hasAthleteData) {
      maxTime = Math.max(maxTime, last11sBenchmark)
    }

    // Tighter buffer to exaggerate time differences
    const roundedMax = Math.ceil(maxTime * 2) / 2  // Round up to nearest 0.5
    const roundedMin = Math.max(0, Math.floor(minTime * 2) / 2)  // Round down to nearest 0.5

    // Generate ticks - use 1s intervals for <8s range, 2s for larger
    const range = roundedMax - roundedMin
    const interval = range > 6 ? 2 : 1
    const ticks: number[] = []
    const tickStart = Math.ceil(roundedMin / interval) * interval
    for (let i = tickStart; i <= roundedMax; i += interval) {
      ticks.push(i)
    }

    return { min: roundedMin, max: roundedMax, ticks }
  }, [filteredData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    // Get competition PB label from the data point if available
    const dataPoint = filteredData.find(d => d.distanceLabel === label)

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            let name = ''
            let color: string = entry.stroke || entry.color

            if (entry.dataKey === 'athleteBest') {
              name = 'Training Best'
            } else if (entry.dataKey === 'athleteLatest') {
              name = 'Latest'
            } else if (entry.dataKey === 'competitionPB') {
              name = dataPoint?.competitionPBLabel || 'Competition PB'
              color = '#eab308' // amber-500
            } else if (entry.dataKey === 'benchmarkWR') {
              name = '9.58s WR (Bolt)'
              color = '#94a3b8' // slate for WR
            } else if (entry.dataKey === 'benchmark10Mid') {
              name = '10.00s Reference'
              color = '#22c55e'
            } else if (entry.dataKey === 'benchmark11Mid') {
              name = '11.00s Reference'
              color = '#f97316'
            } else if (entry.dataKey === 'benchmark12') {
              name = '12.00s Standard'
            } else {
              // Hide internal data from tooltip
              return null
            }

            if (!name) return null

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2.5 h-2.5",
                      entry.dataKey === 'competitionPB' ? "rotate-45" : "rounded-full"
                    )}
                    style={{ backgroundColor: color }}
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
            {showBenchmarks.includes('9.58') && (
              <Badge variant="outline" className="text-xs bg-slate-400/10 text-slate-400 border-slate-400/20">
                9.58s WR
              </Badge>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Training Best</span>
          </div>
          {relevantCompetitionPBs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rotate-45 bg-amber-500" />
              <span className="text-muted-foreground">Competition PB</span>
            </div>
          )}
          {showBenchmarks.includes('9.58') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-slate-400" />
              <span className="text-muted-foreground">9.58s WR</span>
            </div>
          )}
          {showBenchmarks.includes('10.00') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-green-500" />
              <span className="text-muted-foreground">10.00s</span>
            </div>
          )}
          {showBenchmarks.includes('11.00') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">11.00s</span>
            </div>
          )}
          {(showBenchmarks.includes('9.58') || showBenchmarks.includes('10.00') || showBenchmarks.includes('11.00')) && (
            <span className="text-[10px] text-muted-foreground/60 italic">incl. RT</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {!hasData ? (
          <div className="h-72 md:h-80 lg:h-96 flex items-center justify-center text-muted-foreground text-sm">
            No sprint data available. Upload a Freelap CSV to get started.
          </div>
        ) : (
          <div className="h-72 md:h-80 lg:h-96 w-full">
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
                  domain={[yAxisConfig.min, yAxisConfig.max]}
                  ticks={yAxisConfig.ticks}
                  width={45}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Gradient definition for performance zone */}
                <defs>
                  <linearGradient id="performanceZoneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="40%" stopColor="#84cc16" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.25} />
                  </linearGradient>
                </defs>

                {/* 9.58 World Record line (Bolt) */}
                {showBenchmarks.includes('9.58') && (
                  <Line
                    type="monotone"
                    dataKey="benchmarkWR"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeOpacity={0.7}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={false}
                  />
                )}

                {/* 10s reference line (upper bound - elite) */}
                {showBenchmarks.includes('10.00') && (
                  <Line
                    type="monotone"
                    dataKey="benchmark10Mid"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeOpacity={0.8}
                    dot={false}
                    activeDot={false}
                  />
                )}

                {/* 11s reference line (lower bound) */}
                {showBenchmarks.includes('11.00') && (
                  <Line
                    type="monotone"
                    dataKey="benchmark11Mid"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeOpacity={0.8}
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

                {/* Competition PB markers - diamond shaped, amber color */}
                {relevantCompetitionPBs.length > 0 && (
                  <Line
                    type="monotone"
                    dataKey="competitionPB"
                    stroke="#eab308"
                    strokeWidth={0}
                    connectNulls={false}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props
                      if (!payload?.competitionPB) return <g key={`empty-dot-${index}`} />
                      return (
                        <g key={`pb-dot-${index}`}>
                          {/* Diamond marker */}
                          <rect
                            x={cx - 5}
                            y={cy - 5}
                            width={10}
                            height={10}
                            fill="#eab308"
                            stroke="#fef3c7"
                            strokeWidth={2}
                            transform={`rotate(45, ${cx}, ${cy})`}
                          />
                        </g>
                      )
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy, payload, index } = props
                      if (!payload?.competitionPB) return <g key={`empty-active-${index}`} />
                      return (
                        <g key={`pb-active-${index}`}>
                          <rect
                            x={cx - 7}
                            y={cy - 7}
                            width={14}
                            height={14}
                            fill="#eab308"
                            stroke="#fef3c7"
                            strokeWidth={2}
                            transform={`rotate(45, ${cx}, ${cy})`}
                          />
                        </g>
                      )
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
