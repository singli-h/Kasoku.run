'use client'

import { useState, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { PlanFilterBar } from './PlanFilterBar'

interface CoachPlanPageWithAIProps {
  initialPlan: TrainingPlan
  coachEventGroups?: string[]
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

export function CoachPlanPageWithAI({ initialPlan, coachEventGroups: propEventGroups }: CoachPlanPageWithAIProps) {
  const [selectedEventGroups, setSelectedEventGroups] = useState<string[]>([])

  // Use coach's defined event groups from the event_groups table
  const eventGroups = propEventGroups ?? []

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
          selectedEventGroups={selectedEventGroups}
          filterBar={
            <PlanFilterBar
              eventGroups={eventGroups}
              selectedEventGroups={selectedEventGroups}
              onEventGroupToggle={handleEventGroupToggle}
              onEventGroupClear={handleEventGroupClear}
            />
          }
        />
      </div>
    </ErrorBoundary>
  )
}
