/*
<ai_context>
SprintSessionDashboard – Fully-featured dashboard for managing multi-group sprint sessions.
Integrates SessionSetup (configuration step), useSprintSession hook for session lifecycle,
and live MultiGroupSprintTable for recording athlete performances.
</ai_context>
*/

"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react"
// import {
//   type AthleteGroupWithAthletes,
//   type SprintSessionPreset,
//   type SprintDistance,
//   type SprintRound,
// } from "@/types/training"

// Temporary type definitions
type AthleteGroupWithAthletes = any
type SprintSessionPreset = any
type SprintDistance = any
type SprintRound = any

import {
  getCoachAthleteGroupsWithAthletesAction,
  getPredefinedSprintDistancesAction,
  getSprintSessionPresetsAction,
} from "@/actions/training/sprint-session-actions"

import { useSprintSession } from "../hooks/use-sprint-session"
import SessionSetup from "./session-setup"
import MultiGroupSprintTable from "./multi-group-sprint-table"
import SprintDistanceManager from "./sprint-distance-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, AlertCircle, Pause, Play, Flag } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// --------------------------------------------------------------------------------------------------------------------
//  Types & Helpers
// --------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------
//  Component
// --------------------------------------------------------------------------------------------------------------------
interface InitialDataState {
  athleteGroups: AthleteGroupWithAthletes[]
  sessionPresets: SprintSessionPreset[]
  predefinedDistances: SprintDistance[]
}

const INITIAL_DATA: InitialDataState = {
  athleteGroups: [],
  sessionPresets: [],
  predefinedDistances: [],
}

export function SprintSessionDashboard() {
  const [initialData, setInitialData] = useState<InitialDataState>(INITIAL_DATA)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  // --------------------------------------------------
  // Sprint Session Hook
  // --------------------------------------------------
  const {
    session,
    performances,
    startSession,
    updatePerformance,
    pauseSession,
    resumeSession,
    endSession,
    isLoading: sessionLoading,
  } = useSprintSession({ onError: (e) => console.error(e) })

  // --------------------------------------------------
  // Load initial data via React Query (supports Suspense)
  // --------------------------------------------------
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true)
        const [groupsRes, presetRes, distRes] = await Promise.all([
          getCoachAthleteGroupsWithAthletesAction(),
          getSprintSessionPresetsAction(),
          getPredefinedSprintDistancesAction(),
        ])

        if (!groupsRes.isSuccess) throw new Error(groupsRes.message)
        if (!presetRes.isSuccess) throw new Error(presetRes.message)
        if (!distRes.isSuccess) throw new Error(distRes.message)

        setInitialData({
          athleteGroups: groupsRes.data || [],
          sessionPresets: presetRes.data || [],
          predefinedDistances: distRes.data || [],
        })
        setInitialError(null)
      } catch (error) {
        console.error("Failed to load sprint session data:", error)
        setInitialError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setLoadingInitial(false)
      }
    }

    loadInitialData()
  }, [])

  // --------------------------------------------------
  // Derived helpers
  // --------------------------------------------------
  const performanceMap = useMemo(() => {
    const map: Record<string, number | null> = {}
    performances.forEach((p) => {
      map[`${p.athleteId}-${p.roundNumber}`] = p.timeMs
    })
    return map
  }, [performances])

  const handleStartSession = useCallback(
    async (
      name: string,
      groupIds: number[],
      _presetId: number | null, // not yet used
      rounds: SprintRound[],
    ) => {
      // Convert group IDs to full group objects expected by hook.
      const groups = initialData.athleteGroups.filter((g) => groupIds.includes(g.id))
      await startSession(name, groups, rounds)
    },
    [initialData.athleteGroups, startSession],
  )

  // --------------------------------------------------
  //  Render helpers
  // --------------------------------------------------
  if (loadingInitial) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (initialError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{initialError}</AlertDescription>
      </Alert>
    )
  }

  // No active session – show Setup wizard.
  if (!session) {
    return (
      <SessionSetup
        athleteGroups={initialData.athleteGroups}
        sessionPresets={initialData.sessionPresets}
        predefinedDistances={initialData.predefinedDistances}
        onStartSession={handleStartSession}
        isLoading={sessionLoading}
      />
    )
  }

  // Active / paused / completed session UI -------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Sprint Session – {session.name}
            <Badge variant="secondary" className="capitalize">
              {session.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {session.status === "active" && (
            <Button size="sm" variant="outline" onClick={pauseSession} disabled={sessionLoading}>
              <Pause className="h-4 w-4 mr-1" /> Pause
            </Button>
          )}
          {session.status === "paused" && (
            <Button size="sm" variant="outline" onClick={resumeSession} disabled={sessionLoading}>
              <Play className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
          {session.status !== "completed" && (
            <Button size="sm" variant="destructive" onClick={endSession} disabled={sessionLoading}>
              <Flag className="h-4 w-4 mr-1" /> End Session
            </Button>
          )}
          {session.status === "completed" && (
            <Badge variant="outline" className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
        <MultiGroupSprintTable
          athleteGroups={initialData.athleteGroups.filter((g) => session.athleteGroups.includes(g.id))}
          rounds={session.rounds}
          performanceData={performanceMap}
          onUpdatePerformance={updatePerformance}
          disabled={session.status !== "active"}
        />
      </Suspense>

      {/* Distance Manager (read-only for now) */}
      <Separator />
      <SprintDistanceManager
        rounds={session.rounds}
        onAddRound={() => {}}
        onRemoveRound={() => {}}
        disabled
      />
    </div>
  )
}

// --------------------------------------------------------------------------------------------------------------------
//  Placeholder Export (default) for lazy imports elsewhere
// --------------------------------------------------------------------------------------------------------------------
export default SprintSessionDashboard 