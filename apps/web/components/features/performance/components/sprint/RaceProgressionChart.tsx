"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CompetitionPB } from "@/actions/performance/performance-actions"

// Distance options for the selector
const DISTANCE_OPTIONS = [
  { value: 60, label: "60m" },
  { value: 100, label: "100m" },
  { value: 150, label: "150m" },
  { value: 200, label: "200m" },
  { value: 300, label: "300m" },
  { value: 400, label: "400m" },
]

export interface RaceResult {
  id: number | string
  eventId: number
  eventName: string
  distance: number
  value: number
  date: string
  isWindLegal: boolean
  isIndoor: boolean
  wind?: number
  isPB?: boolean
}

interface RaceProgressionChartProps {
  results: RaceResult[]
  competitionPBs?: CompetitionPB[]
  className?: string
}

interface ChartDataPoint {
  date: string
  dateFormatted: string
  time: number
  isWindLegal: boolean
  isIndoor: boolean
  wind?: number
  isPB?: boolean
}

export function RaceProgressionChart({
  results,
  competitionPBs = [],
  className,
}: RaceProgressionChartProps) {
  // Find available distances from results
  const availableDistances = useMemo(() => {
    const distances = new Set(results.map(r => r.distance))
    return DISTANCE_OPTIONS.filter(d => distances.has(d.value))
  }, [results])

  // Default to first available distance or 100m
  const [selectedDistance, setSelectedDistance] = useState<number>(() => {
    if (availableDistances.length > 0) {
      // Prefer 100m if available, otherwise first available
      return availableDistances.find(d => d.value === 100)?.value || availableDistances[0].value
    }
    return 100
  })

  // Filter results by selected distance
  const filteredResults = useMemo(() => {
    return results
      .filter(r => r.distance === selectedDistance)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [results, selectedDistance])

  // Find best time (PB) for this distance
  const bestResult = useMemo(() => {
    const windLegalResults = filteredResults.filter(r => r.isWindLegal)
    if (windLegalResults.length === 0) return null
    return windLegalResults.reduce((best, curr) =>
      curr.value < best.value ? curr : best
    , windLegalResults[0])
  }, [filteredResults])

  // Transform to chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    return filteredResults.map(result => ({
      date: result.date,
      dateFormatted: new Date(result.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      }),
      time: result.value,
      isWindLegal: result.isWindLegal,
      isIndoor: result.isIndoor,
      wind: result.wind,
      isPB: result.isPB ?? (bestResult && result.value === bestResult.value && result.isWindLegal) ?? false,
    }))
  }, [filteredResults, bestResult])

  // Get competition PB for selected distance (from competitionPBs prop or results)
  const competitionPB = useMemo(() => {
    const fromPBs = competitionPBs.find(pb => pb.distance === selectedDistance)
    if (fromPBs) return fromPBs.value
    return bestResult?.value
  }, [competitionPBs, selectedDistance, bestResult])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null

    const data = payload[0].payload as ChartDataPoint

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="font-semibold text-sm mb-2">{data.dateFormatted}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Time</span>
            <span className="text-sm font-medium tabular-nums">{data.time.toFixed(2)}s</span>
          </div>
          {data.isIndoor ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Venue</span>
              <Badge variant="secondary" className="text-xs h-5">Indoor</Badge>
            </div>
          ) : data.wind !== undefined ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Wind</span>
              <Badge
                variant={data.isWindLegal ? "secondary" : "destructive"}
                className="text-xs h-5"
              >
                {data.wind > 0 ? '+' : ''}{data.wind}m/s
              </Badge>
            </div>
          ) : null}
          {data.isPB && (
            <div className="flex items-center justify-center mt-1">
              <Badge className="text-xs bg-amber-500 hover:bg-amber-600">PB</Badge>
            </div>
          )}
        </div>
      </div>
    )
  }

  const hasData = chartData.length > 0
  const selectedDistanceLabel = DISTANCE_OPTIONS.find(d => d.value === selectedDistance)?.label || `${selectedDistance}m`

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Race Progression</CardTitle>
          <Select
            value={selectedDistance.toString()}
            onValueChange={(v) => setSelectedDistance(parseInt(v))}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableDistances.length > 0 ? (
                availableDistances.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))
              ) : (
                DISTANCE_OPTIONS.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Stats row */}
        {bestResult && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">PB:</span>
              <span className="font-semibold text-amber-500">{bestResult.value.toFixed(2)}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Races:</span>
              <span className="font-medium">{filteredResults.length}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Wind-legal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-muted-foreground">Wind-assisted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rotate-45 bg-amber-500" />
            <span className="text-muted-foreground">PB</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <p>No race results for {selectedDistanceLabel}</p>
            <p className="text-xs">Add race results in the Race tab to see progression</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                  vertical={false}
                />

                <XAxis
                  dataKey="dateFormatted"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value.toFixed(1)}s`}
                  domain={[
                    (dataMin: number) => Math.floor(dataMin * 10) / 10 - 0.1,
                    (dataMax: number) => Math.ceil(dataMax * 10) / 10 + 0.1
                  ]}
                  width={50}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* PB Reference Line */}
                {competitionPB && (
                  <ReferenceLine
                    y={competitionPB}
                    stroke="#eab308"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `PB: ${competitionPB.toFixed(2)}s`,
                      position: 'right',
                      fill: '#eab308',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Race times line */}
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const isWindLegal = payload?.isWindLegal
                    const isPB = payload?.isPB

                    if (isPB) {
                      // Diamond for PB
                      return (
                        <g key={`dot-${props.index}`}>
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
                    }

                    return (
                      <circle
                        key={`dot-${props.index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={isWindLegal ? 'hsl(var(--primary))' : '#fb7185'}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    )
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
