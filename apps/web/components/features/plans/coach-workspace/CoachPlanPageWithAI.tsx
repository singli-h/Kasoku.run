'use client'

import { useState, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { PlanFilterBar } from './PlanFilterBar'

interface CoachPlanPageWithAIProps {
  initialPlan: TrainingPlan
  coachSubgroups?: string[]
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

export function CoachPlanPageWithAI({ initialPlan, coachSubgroups: propSubgroups }: CoachPlanPageWithAIProps) {
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([])

  // Use coach's defined subgroups from the subgroups table
  const subgroups = propSubgroups ?? []

  const handleSubgroupToggle = useCallback((subgroup: string) => {
    setSelectedSubgroups(prev =>
      prev.includes(subgroup)
        ? prev.filter(g => g !== subgroup)
        : [...prev, subgroup]
    )
  }, [])

  const handleSubgroupClear = useCallback(() => {
    setSelectedSubgroups([])
  }, [])

  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <CoachPlanFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}>
      <div className="flex flex-col">
        <TrainingPlanWorkspace
          initialPlan={initialPlan}
          selectedSubgroups={selectedSubgroups}
          filterBar={
            <PlanFilterBar
              subgroups={subgroups}
              selectedSubgroups={selectedSubgroups}
              onSubgroupToggle={handleSubgroupToggle}
              onSubgroupClear={handleSubgroupClear}
            />
          }
        />
      </div>
    </ErrorBoundary>
  )
}
