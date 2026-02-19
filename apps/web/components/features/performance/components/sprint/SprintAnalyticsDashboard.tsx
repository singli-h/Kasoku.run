"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { SprintQuickStats, type SprintStat, defaultSprintStats } from "./SprintQuickStats"
import { SplitTimeChart, type SprintSession } from "./SplitTimeChart"
import { PhaseAnalysisCards, type PhaseData } from "./PhaseAnalysisCards"
import { SprintSessionsTable, type SprintSessionData } from "./SprintSessionsTable"
import { BenchmarkReferenceCard, type AthleteMetrics } from "./BenchmarkReferenceCard"
import { useSprintAnalytics, useSprintPreferences } from "../../hooks"
import type { SprintTimeRange } from "../../config/query-config"

interface SprintAnalyticsDashboardProps {
  className?: string
}

/**
 * Transform server data to chart sessions format
 */
function transformToChartSessions(
  sessions: Array<{
    id: string
    date: string
    distance: number
    totalTime: number
    isPB?: boolean
    splits?: Array<{ distance: number; time: number; cumulativeTime: number }>
  }>
): SprintSession[] {
  return sessions.map(session => ({
    id: session.id,
    date: session.date,
    totalDistance: session.distance,
    totalTime: session.totalTime,
    isPB: session.isPB,
    splits: session.splits || [],
  }))
}

/**
 * Transform server data to table format
 */
function transformToTableData(
  sessions: Array<{
    id: string
    date: string
    distance: number
    totalTime: number
    reactionTime?: number
    topSpeed?: number
    frequency?: number
    strideLength?: number
    isPB?: boolean
    delta?: number
  }>
): SprintSessionData[] {
  return sessions.map(session => ({
    id: session.id,
    date: new Date(session.date),
    distance: session.distance,
    totalTime: session.totalTime,
    reactionTime: session.reactionTime,
    topSpeed: session.topSpeed,
    frequency: session.frequency,
    strideLength: session.strideLength,
    isPB: session.isPB,
    delta: session.delta,
  }))
}

/**
 * Build quick stats from sprint analytics data
 */
function buildQuickStats(data: {
  sessions: Array<{ distance: number; totalTime: number; topSpeed?: number; reactionTime?: number }>
  quickStats: {
    bestTime40m: number | null
    bestTimeChange: number | null
    topSpeed: number | null
    topSpeedChange: number | null
    avgReactionTime: number | null
    reactionTimeChange: number | null
    sessionsThisMonth: number
  }
  competitionPBs?: Array<{ distance: number; value: number }>
}): SprintStat[] {
  const { quickStats, sessions, competitionPBs = [] } = data

  // Find the best session for any distance
  const bestSession = sessions.length > 0
    ? sessions.reduce((best, curr) =>
        curr.totalTime < best.totalTime ? curr : best
      , sessions[0])
    : null

  // Find matching competition PB for comparison
  const matchingCompetitionPB = bestSession
    ? competitionPBs.find(pb => pb.distance === bestSession.distance)
    : null

  // Calculate training vs competition comparison
  let comparisonSubtitle: string | undefined
  if (matchingCompetitionPB && quickStats.bestTime40m !== null) {
    const diff = quickStats.bestTime40m - matchingCompetitionPB.value
    if (Math.abs(diff) < 0.01) {
      comparisonSubtitle = `= Race PB`
    } else if (diff > 0) {
      comparisonSubtitle = `+${diff.toFixed(2)}s vs Race PB`
    } else {
      comparisonSubtitle = `${diff.toFixed(2)}s vs Race PB`
    }
  }

  return [
    {
      id: 'best-time',
      label: bestSession ? `Best ${bestSession.distance}m` : 'Best Time',
      value: quickStats.bestTime40m !== null ? quickStats.bestTime40m.toFixed(2) : 'N/A',
      unit: quickStats.bestTime40m !== null ? 's' : '',
      change: quickStats.bestTimeChange !== null
        ? {
            value: `${quickStats.bestTimeChange > 0 ? '+' : ''}${quickStats.bestTimeChange.toFixed(2)}s`,
            direction: quickStats.bestTimeChange > 0 ? 'up' : 'down',
            isPositive: quickStats.bestTimeChange < 0, // Lower time is better
          }
        : undefined,
      subtitle: comparisonSubtitle,
    },
    {
      id: 'top-speed',
      label: 'Top Speed',
      value: quickStats.topSpeed !== null ? quickStats.topSpeed.toFixed(2) : 'N/A',
      unit: quickStats.topSpeed !== null ? 'm/s' : '',
      change: quickStats.topSpeedChange !== null
        ? {
            value: `${quickStats.topSpeedChange > 0 ? '+' : ''}${quickStats.topSpeedChange.toFixed(1)}%`,
            direction: quickStats.topSpeedChange > 0 ? 'up' : 'down',
            isPositive: quickStats.topSpeedChange > 0,
          }
        : undefined,
    },
    {
      id: 'reaction',
      label: 'Avg Reaction',
      value: quickStats.avgReactionTime !== null ? quickStats.avgReactionTime.toFixed(3) : 'N/A',
      unit: quickStats.avgReactionTime !== null ? 's' : '',
      change: quickStats.reactionTimeChange !== null
        ? {
            value: `${quickStats.reactionTimeChange > 0 ? '+' : ''}${quickStats.reactionTimeChange.toFixed(3)}s`,
            direction: quickStats.reactionTimeChange > 0 ? 'up' : 'down',
            isPositive: quickStats.reactionTimeChange < 0, // Lower reaction is better
          }
        : undefined,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: String(quickStats.sessionsThisMonth),
      subtitle: 'this month',
    },
  ]
}

/**
 * Build athlete metrics for benchmark card
 */
function buildAthleteMetrics(data: {
  sessions: Array<{
    distance: number
    totalTime: number
    reactionTime?: number
    topSpeed?: number
    frequency?: number
    strideLength?: number
  }>
  athleteMetrics: {
    reactionTime?: number
    topSpeed?: number
    strideLength?: number
    strideFrequency?: number
    time40m?: number
    time100m?: number
  }
}): AthleteMetrics {
  const { athleteMetrics, sessions } = data

  // Find best session for dynamic distance
  const bestSession = sessions.length > 0
    ? sessions.reduce((best, curr) =>
        curr.totalTime < best.totalTime ? curr : best
      , sessions[0])
    : null

  return {
    reactionTime: athleteMetrics.reactionTime,
    topSpeed: athleteMetrics.topSpeed,
    // Use stride length/frequency at max velocity phase when available
    strideLength: athleteMetrics.strideLength,
    strideFrequency: athleteMetrics.strideFrequency,
    time100m: athleteMetrics.time100m,
    // Dynamic best time
    bestTime: bestSession?.totalTime,
    bestDistance: bestSession?.distance,
  }
}

export function SprintAnalyticsDashboard({
  className,
}: SprintAnalyticsDashboardProps) {
  // Load user preferences from localStorage
  const {
    timeRange,
    targetStandard,
    showCompetitionPBs,
    isLoaded: preferencesLoaded,
    setTimeRange,
    setTargetStandard,
  } = useSprintPreferences()

  // Fetch sprint analytics data
  const { data, isLoading, error } = useSprintAnalytics(timeRange)

  // Transform data for components
  const displaySessions = useMemo(() =>
    data ? transformToChartSessions(data.sessions) : [],
    [data]
  )

  const displayTableData = useMemo(() =>
    data ? transformToTableData(data.sessions) : [],
    [data]
  )

  const displayStats = useMemo(() =>
    data ? buildQuickStats(data) : defaultSprintStats,
    [data]
  )

  const displayMetrics = useMemo(() =>
    data ? buildAthleteMetrics(data) : {},
    [data]
  )

  // Phase analysis from data (if available)
  const displayPhases: PhaseData[] = useMemo(() =>
    data?.phaseAnalysis || [],
    [data]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading sprint analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-center">
          <p className="text-sm text-destructive">Failed to load sprint analytics</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as SprintTimeRange)}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={targetStandard} onValueChange={(v) => setTargetStandard(v as '10.00' | '11.00')}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="11.00">Target: 11.00s</SelectItem>
              <SelectItem value="10.00">Target: 10.00s</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TODO: Wire up export functionality */}
      </div>

      {/* Quick Stats */}
      <SprintQuickStats stats={displayStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Split Time Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <SplitTimeChart
            sessions={displaySessions}
            showBenchmarks={['9.58', '10.00', '11.00']}
            competitionPBs={data?.competitionPBs}
            showCompetitionPBs={showCompetitionPBs}
          />
        </div>

        {/* Benchmark Reference Card */}
        <div className="lg:col-span-1">
          <BenchmarkReferenceCard
            athleteMetrics={displayMetrics}
            competitionPBs={data?.competitionPBs}
            targetStandard={targetStandard}
          />
        </div>
      </div>

      {/* Phase Analysis - only show if data available */}
      {displayPhases.length > 0 && (
        <PhaseAnalysisCards
          phases={displayPhases}
          targetStandard={targetStandard}
        />
      )}

      {/* Sessions Table */}
      <SprintSessionsTable
        sessions={displayTableData}
      />
    </div>
  )
}
