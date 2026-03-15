'use client'

import { useState, useMemo, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { PlanFilterBar } from './PlanFilterBar'
import { GenerateMicrocycleSheet } from './GenerateMicrocycleSheet'
import { WeeklyInsightsPanel } from './WeeklyInsightsPanel'

interface CoachPlanPageWithAIProps {
  initialPlan: TrainingPlan
  coachGroups?: Array<{ id: number; name: string }>
}

function CoachPlanFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">AI features unavailable</p>
        <p className="text-xs text-muted-foreground">You can still edit your plan manually.</p>
      </div>
      <button onClick={resetErrorBoundary} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs">
        Retry
      </button>
    </div>
  )
}

export function CoachPlanPageWithAI({ initialPlan, coachGroups: propGroups }: CoachPlanPageWithAIProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedEventGroups, setSelectedEventGroups] = useState<string[]>([])
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false)
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<number | null>(null)
  const [selectedMicrocycleName, setSelectedMicrocycleName] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [insightsMicrocycleId, setInsightsMicrocycleId] = useState<number | null>(null)
  const [insightsExisting, setInsightsExisting] = useState<Record<string, unknown> | null>(null)

  // Use coach groups from server — no fallback to Group {id}
  const coachGroups = propGroups ?? []

  // Extract distinct event groups from all sessions in the plan
  const allEventGroups = useMemo(() => {
    const tagSet = new Set<string>()
    for (const meso of initialPlan.mesocycles) {
      for (const micro of meso.microcycles) {
        for (const session of micro.sessions) {
          if (session.sessionTargetEventGroups) {
            for (const g of session.sessionTargetEventGroups) {
              tagSet.add(g)
            }
          }
        }
      }
    }
    return [...tagSet].sort()
  }, [initialPlan])

  const handleEventGroupToggle = useCallback((eventGroup: string) => {
    setSelectedEventGroups(prev =>
      prev.includes(eventGroup)
        ? prev.filter(g => g !== eventGroup)
        : [...prev, eventGroup]
    )
  }, [])

  const handleEventGroupClear = useCallback(() => {
    setSelectedEventGroups([])
  }, [])

  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <CoachPlanFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}>
      <div className="flex flex-col">
        <TrainingPlanWorkspace
          initialPlan={initialPlan}
          selectedGroupId={selectedGroupId}
          selectedEventGroups={selectedEventGroups}
          filterBar={
            <PlanFilterBar
              groups={coachGroups}
              selectedGroupId={selectedGroupId}
              onGroupSelect={setSelectedGroupId}
              eventGroups={allEventGroups}
              selectedEventGroups={selectedEventGroups}
              onEventGroupToggle={handleEventGroupToggle}
              onEventGroupClear={handleEventGroupClear}
            />
          }
        />

        {selectedMicrocycleId !== null && selectedGroupId !== null && (
          <GenerateMicrocycleSheet
            key={`gen-${selectedMicrocycleId}-${selectedGroupId}`}
            microcycleId={selectedMicrocycleId}
            athleteGroupId={selectedGroupId}
            microcycleName={selectedMicrocycleName}
            open={generateSheetOpen}
            onOpenChange={setGenerateSheetOpen}
          />
        )}

        {insightsMicrocycleId !== null && (
          <WeeklyInsightsPanel
            key={`insights-${insightsMicrocycleId}`}
            microcycleId={insightsMicrocycleId}
            existingInsights={insightsExisting}
            open={insightsOpen}
            onOpenChange={setInsightsOpen}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
