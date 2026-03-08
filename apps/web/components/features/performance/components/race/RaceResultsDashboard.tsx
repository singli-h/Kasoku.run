"use client"

import { useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trophy } from "lucide-react"
import { AddRaceResultDialog } from "./AddRaceResultDialog"
import { ImportResultsDialog } from "./ImportResultsDialog"
import { RaceResultsTable } from "./RaceResultsTable"
import { RaceProgressionChart, type RaceResult as RaceProgressionResult } from "../sprint/RaceProgressionChart"
import { useRaceResults, useSprintAnalytics } from "../../hooks"
import type { RaceResultMetadata } from "@/actions/performance/race-result-actions"

// Sprint event ID to distance mapping
const SPRINT_EVENT_DISTANCES: Record<number, number> = {
  24: 60,   // 60m
  1: 100,   // 100m
  27: 150,  // 150m
  2: 200,   // 200m
  28: 300,  // 300m
  3: 400,   // 400m
}

interface RaceResultsDashboardProps {
  className?: string
}

export function RaceResultsDashboard({ className }: RaceResultsDashboardProps) {
  const { data, isLoading, error, invalidate } = useRaceResults()
  const { data: sprintData } = useSprintAnalytics('all')

  const handleRefresh = useCallback(() => {
    invalidate()
  }, [invalidate])

  // Transform race results for progression chart
  const progressionResults: RaceProgressionResult[] = useMemo(() => {
    if (!data?.isSuccess || !data.data) return []

    return data.data
      .filter(result => {
        // Only include sprint events
        const distance = result.event_id ? SPRINT_EVENT_DISTANCES[result.event_id] : null
        return distance !== undefined && distance !== null
      })
      .map(result => {
        const metadata = result.metadata as RaceResultMetadata | null
        const distance = result.event_id ? SPRINT_EVENT_DISTANCES[result.event_id] : 0

        // Determine wind legality
        const isIndoor = metadata?.indoor ?? false
        const wind = metadata?.wind
        const isWindLegal = isIndoor || wind === undefined || wind === null || wind <= 2.0

        return {
          id: result.id,
          eventId: result.event_id || 0,
          eventName: result.event?.name || `${distance}m`,
          distance,
          value: result.value || 0,
          date: result.achieved_date || '',
          isWindLegal,
          isIndoor,
          wind,
          isPB: metadata?.is_pb,
        }
      })
  }, [data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load race results</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
      </div>
    )
  }

  const results = data?.data || []
  const pbCount = results.filter((r) => {
    const metadata = r.metadata as { is_pb?: boolean } | null
    return metadata?.is_pb
  }).length

  return (
    <div className={className}>
      {/* Race Progression Chart - Top of Race Tab */}
      {progressionResults.length > 0 && (
        <RaceProgressionChart
          results={progressionResults}
          competitionPBs={sprintData?.competitionPBs}
          className="mb-6"
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Race Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} recorded
                {pbCount > 0 && ` (${pbCount} PB${pbCount !== 1 ? "s" : ""})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ImportResultsDialog onSuccess={handleRefresh} />
            <AddRaceResultDialog onSuccess={handleRefresh} />
          </div>
        </CardHeader>
        <CardContent>
          <RaceResultsTable results={results} onDelete={handleRefresh} onEdit={handleRefresh} />
        </CardContent>
      </Card>
    </div>
  )
}
