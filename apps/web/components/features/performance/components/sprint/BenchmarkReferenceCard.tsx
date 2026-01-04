"use client"

import { motion } from "framer-motion"
import { Info, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  SPRINT_LEVELS,
  PERFORMANCE_PARAMETERS,
  DISTANCE_STANDARDS,
  getSprintLevel,
  getComparisonStatus,
  getDistanceStandard,
  formatSprintTime,
  formatSpeed,
  type SprintLevel,
} from "../../data/sprint-benchmarks"
import type { CompetitionPB } from "@/actions/performance/performance-actions"

export interface AthleteMetrics {
  time60m?: number               // 60m time
  time100m?: number              // 100m time
  reactionTime?: number
  topSpeed?: number
  // Phase-specific stride metrics (should not be averaged across phases)
  strideLengthMaxV?: number      // At max velocity phase (30-60m)
  strideFrequencyMaxV?: number   // At max velocity phase (30-60m)
  strideLengthAccel?: number     // During acceleration (0-30m)
  strideFrequencyAccel?: number  // During acceleration (0-30m)
  // Legacy fields (if only one value provided, assume max velocity phase)
  strideLength?: number
  strideFrequency?: number
  // Dynamic distance support
  bestTime?: number              // Best time for any distance
  bestDistance?: number          // Distance of the best time
}

interface BenchmarkReferenceCardProps {
  athleteMetrics: AthleteMetrics
  competitionPBs?: CompetitionPB[]
  gender?: 'male' | 'female'
  targetStandard?: '10.00' | '11.00'
  className?: string
}

interface MetricRow {
  key: string
  label: string
  athleteValue: string
  standard11: string
  standard10: string
  status: 'ahead' | 'on-track' | 'behind' | 'none'
}

export function BenchmarkReferenceCard({
  athleteMetrics,
  competitionPBs = [],
  gender = 'male',
  targetStandard = '11.00',
  className,
}: BenchmarkReferenceCardProps) {
  // Calculate athlete's level
  const athleteLevel = athleteMetrics.time100m
    ? getSprintLevel(athleteMetrics.time100m, gender)
    : null

  const levelConfig = athleteLevel ? SPRINT_LEVELS[athleteLevel] : null

  // Calculate position on the level scale (0-100%)
  const calculateLevelPosition = (): number => {
    if (!athleteMetrics.time100m) return 0

    const key = gender === 'male' ? 'men100m' : 'women100m'
    const time = athleteMetrics.time100m

    // Get the full range (beginner max to elite min)
    const beginnerMax = SPRINT_LEVELS.beginner[key].max
    const eliteMin = SPRINT_LEVELS.elite[key].min

    // Invert because lower time = better
    const position = ((beginnerMax - time) / (beginnerMax - eliteMin)) * 100
    return Math.max(0, Math.min(100, position))
  }

  // Build metrics comparison rows - always show all rows, use N/A for missing
  const buildMetricRows = (): MetricRow[] => {
    const rows: MetricRow[] = []
    const NA_VALUE = 'N/A'

    // Reaction Time - always show
    const reactionParam = PERFORMANCE_PARAMETERS.reactionTime
    rows.push({
      key: 'reactionTime',
      label: reactionParam.label,
      athleteValue: athleteMetrics.reactionTime !== undefined
        ? formatSprintTime(athleteMetrics.reactionTime, 3)
        : NA_VALUE,
      standard11: `${reactionParam.standards['11.00'].min.toFixed(2)}-${reactionParam.standards['11.00'].max.toFixed(2)}s`,
      standard10: `${reactionParam.standards['10.00'].min.toFixed(2)}-${reactionParam.standards['10.00'].max.toFixed(2)}s`,
      status: athleteMetrics.reactionTime !== undefined
        ? getComparisonStatus(athleteMetrics.reactionTime, 'reactionTime', targetStandard)
        : 'none',
    })

    // Top Speed - always show
    const speedParam = PERFORMANCE_PARAMETERS.topSpeed
    rows.push({
      key: 'topSpeed',
      label: speedParam.label,
      athleteValue: athleteMetrics.topSpeed !== undefined
        ? formatSpeed(athleteMetrics.topSpeed)
        : NA_VALUE,
      standard11: `${speedParam.standards['11.00'].min}-${speedParam.standards['11.00'].max} m/s`,
      standard10: `${speedParam.standards['10.00'].min}-${speedParam.standards['10.00'].max} m/s`,
      status: athleteMetrics.topSpeed !== undefined
        ? getComparisonStatus(athleteMetrics.topSpeed, 'topSpeed', targetStandard)
        : 'none',
    })

    // Stride Length at Max Velocity (30-60m phase)
    // Use phase-specific value if available, fallback to legacy strideLength
    const strideParam = PERFORMANCE_PARAMETERS.strideLength
    const strideLengthValue = athleteMetrics.strideLengthMaxV ?? athleteMetrics.strideLength
    rows.push({
      key: 'strideLength',
      label: 'Stride Length (MaxV)',
      athleteValue: strideLengthValue !== undefined
        ? `${strideLengthValue.toFixed(2)}m`
        : NA_VALUE,
      standard11: `${strideParam.standards['11.00'].min}-${strideParam.standards['11.00'].max}m`,
      standard10: `${strideParam.standards['10.00'].min}-${strideParam.standards['10.00'].max}m`,
      status: strideLengthValue !== undefined
        ? getComparisonStatus(strideLengthValue, 'strideLength', targetStandard)
        : 'none',
    })

    // Stride Frequency at Max Velocity (30-60m phase)
    const freqParam = PERFORMANCE_PARAMETERS.strideFrequency
    const strideFreqValue = athleteMetrics.strideFrequencyMaxV ?? athleteMetrics.strideFrequency
    rows.push({
      key: 'strideFrequency',
      label: 'Stride Freq (MaxV)',
      athleteValue: strideFreqValue !== undefined
        ? `${strideFreqValue.toFixed(2)} Hz`
        : NA_VALUE,
      standard11: `${freqParam.standards['11.00'].min}-${freqParam.standards['11.00'].max} Hz`,
      standard10: `${freqParam.standards['10.00'].min}-${freqParam.standards['10.00'].max} Hz`,
      status: strideFreqValue !== undefined
        ? getComparisonStatus(strideFreqValue, 'strideFrequency', targetStandard)
        : 'none',
    })

    // 60m Time - at bottom of table (prefer competition PB over training time)
    const time60mParam = PERFORMANCE_PARAMETERS.time60m
    const competition60mPB = competitionPBs.find(pb => pb.distance === 60)
    const time60mValue = competition60mPB?.value ?? athleteMetrics.time60m
    const time60mLabel = competition60mPB
      ? `60m PB${competition60mPB.isIndoor ? ' (I)' : ''}`
      : time60mParam.label
    rows.push({
      key: 'time60m',
      label: time60mLabel,
      athleteValue: time60mValue !== undefined
        ? formatSprintTime(time60mValue)
        : NA_VALUE,
      standard11: `${time60mParam.standards['11.00'].min.toFixed(2)}-${time60mParam.standards['11.00'].max.toFixed(2)}s`,
      standard10: `${time60mParam.standards['10.00'].min.toFixed(2)}-${time60mParam.standards['10.00'].max.toFixed(2)}s`,
      status: time60mValue !== undefined
        ? getComparisonStatus(time60mValue, 'time60m', targetStandard)
        : 'none',
    })

    // Best Time - dynamic distance support
    if (athleteMetrics.bestTime !== undefined && athleteMetrics.bestDistance !== undefined) {
      const distStandard = getDistanceStandard(athleteMetrics.bestDistance)
      if (distStandard) {
        const std11 = distStandard.standards['11.00']
        const std10 = distStandard.standards['10.00']
        const midpoint11 = (std11.min + std11.max) / 2
        rows.push({
          key: 'bestTime',
          label: `${distStandard.label} Time`,
          athleteValue: formatSprintTime(athleteMetrics.bestTime),
          standard11: `${std11.min.toFixed(2)}-${std11.max.toFixed(2)}s`,
          standard10: `${std10.min.toFixed(2)}-${std10.max.toFixed(2)}s`,
          status: athleteMetrics.bestTime <= std11.max ? 'ahead'
            : athleteMetrics.bestTime <= midpoint11 * 1.05 ? 'on-track'
            : 'behind',
        })
      }
    }

    return rows
  }

  const metricRows = buildMetricRows()
  const levelPosition = calculateLevelPosition()

  const StatusIcon = ({ status }: { status: MetricRow['status'] }) => {
    const iconClass = "h-3.5 w-3.5 shrink-0"
    switch (status) {
      case 'ahead':
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />
      case 'on-track':
        return <MinusCircle className={cn(iconClass, "text-blue-500")} />
      case 'behind':
        return <AlertCircle className={cn(iconClass, "text-orange-500")} />
      default:
        return <div className={iconClass} /> // Placeholder for alignment
    }
  }

  // Check if we have any actual data (not just N/A values)
  const hasActualData = metricRows.some(row => row.athleteValue !== 'N/A') || athleteLevel

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Benchmark Reference</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  Compare your metrics against professional standards.
                  10.00s and 11.00s represent elite and advanced 100m times.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasActualData ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No sprint data available. Upload a Freelap CSV to get started.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Level Indicator */}
            {athleteLevel && levelConfig && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Your Level
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      levelConfig.colorClass,
                      `border-current/30 bg-current/10`
                    )}
                    style={{ color: levelConfig.color }}
                  >
                    {levelConfig.label}
                  </Badge>
                </div>

                {/* Level Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                    <div className="flex-1 bg-orange-500/30" />
                    <div className="flex-1 bg-blue-500/30" />
                    <div className="flex-1 bg-green-500/30" />
                    <div className="flex-1 bg-purple-500/30" />
                  </div>

                  {/* Position Marker */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-md"
                    initial={{ left: '0%' }}
                    animate={{ left: `${levelPosition}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ marginLeft: '-6px' }}
                  />
                </div>

                {/* Level Labels */}
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Elite</span>
                </div>
              </div>
            )}

            {/* Metrics Comparison Table */}
            {metricRows.length > 0 && (
              <div className="-mx-2 sm:mx-0">
                {/* Header */}
                <div className="grid grid-cols-[1fr_minmax(50px,auto)_minmax(70px,auto)_minmax(70px,auto)] gap-x-2 sm:gap-x-3 px-2 sm:px-0 py-2 border-b border-border/30">
                  <div className="text-xs font-medium text-muted-foreground">Parameter</div>
                  <div className="text-xs font-medium text-muted-foreground text-right">You</div>
                  <div className="text-xs font-medium text-orange-500/80 text-right">11.00s</div>
                  <div className="text-xs font-medium text-green-500/80 text-right">10.00s</div>
                </div>

                {/* Rows */}
                {metricRows.map((row, index) => (
                  <motion.div
                    key={row.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      "grid grid-cols-[1fr_minmax(50px,auto)_minmax(70px,auto)_minmax(70px,auto)] gap-x-2 sm:gap-x-3 px-2 sm:px-0 py-2.5 items-center",
                      index < metricRows.length - 1 && "border-b border-border/20"
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <StatusIcon status={row.status} />
                      <span className="text-xs font-medium">{row.label}</span>
                    </div>
                    <div className="text-xs font-semibold tabular-nums text-right whitespace-nowrap">
                      {row.athleteValue}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap">
                      {row.standard11}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap">
                      {row.standard10}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span>Ahead</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MinusCircle className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span>On Track</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                <span>Needs Work</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
