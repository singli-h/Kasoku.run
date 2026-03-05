'use client'

import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { SeasonContextPanel } from './SeasonContextPanel'
import { GroupTabsBar } from './GroupTabsBar'
import { GenerateMicrocycleSheet } from './GenerateMicrocycleSheet'

interface CoachPlanPageWithAIProps {
  initialPlan: TrainingPlan
  coachGroups?: Array<{ id: number; name: string }>
}

function CoachPlanFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
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
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false)
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<number | null>(null)

  // Extract planning_context text from the JSONB field
  const planningContextText = (() => {
    const ctx = initialPlan.macrocycle.planning_context
    if (!ctx) return null
    if (typeof ctx === 'string') return ctx
    return (ctx as Record<string, unknown>)?.text as string ?? null
  })()

  // Extract group IDs stored in planning_context by wizard
  const storedGroupIds = (() => {
    const ctx = initialPlan.macrocycle.planning_context as Record<string, unknown> | null
    const groups = ctx?.groups
    return Array.isArray(groups) ? groups as number[] : []
  })()

  // Prefer real group objects passed from the page server component
  const coachGroups = propGroups && propGroups.length > 0
    ? propGroups.filter(g => storedGroupIds.length === 0 || storedGroupIds.includes(g.id))
    : storedGroupIds.map(id => ({ id, name: `Group ${id}` }))

  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <CoachPlanFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}>
      <div className="flex flex-col">
        <div className="px-4 pt-4">
          <SeasonContextPanel
            macrocycleId={initialPlan.macrocycle.id}
            planningContext={planningContextText}
          />
          <GroupTabsBar
            groups={coachGroups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
          />
        </div>

        <TrainingPlanWorkspace
          initialPlan={initialPlan}
          onGenerateWeek={(microcycleId) => {
            if (selectedGroupId === null) {
              alert('Select a group tab before generating a week.')
              return
            }
            setSelectedMicrocycleId(microcycleId)
            setGenerateSheetOpen(true)
          }}
        />

        {selectedMicrocycleId !== null && selectedGroupId !== null && (
          <GenerateMicrocycleSheet
            microcycleId={selectedMicrocycleId}
            athleteGroupId={selectedGroupId}
            open={generateSheetOpen}
            onOpenChange={setGenerateSheetOpen}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
