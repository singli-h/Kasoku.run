'use client'

import { useState, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle, Sparkles, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { extractPlanningContextText } from '@/lib/utils'
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { SeasonContextPanel } from './SeasonContextPanel'
import { GroupTabsBar } from './GroupTabsBar'
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
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false)
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<number | null>(null)
  const [selectedMicrocycleName, setSelectedMicrocycleName] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [insightsMicrocycleId, setInsightsMicrocycleId] = useState<number | null>(null)
  const [insightsExisting, setInsightsExisting] = useState<Record<string, unknown> | null>(null)
  const [planningContext, setPlanningContext] = useState<string | null>(
    () => extractPlanningContextText(initialPlan.macrocycle.planning_context)
  )
  const [showCallout, setShowCallout] = useState(false)
  const { toast } = useToast()

  // Check localStorage for callout dismissal on mount
  useEffect(() => {
    try {
      if (!localStorage.getItem('kasoku:coach-plan-callout-dismissed')) {
        setShowCallout(true)
      }
    } catch {}
  }, [])

  // Use coach groups from server — no fallback to Group {id}
  const coachGroups = propGroups ?? []

  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <CoachPlanFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}>
      <div className="flex flex-col">
        <div className="px-4 pt-4">
          {showCallout && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3 mb-4">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Your season plan is ready</p>
                <p className="text-muted-foreground text-xs mt-1">Select a group tab, then click Generate on any week to create AI-powered sessions. Add phase focus on each phase header for better results.</p>
              </div>
              <button
                onClick={() => {
                  setShowCallout(false)
                  try { localStorage.setItem('kasoku:coach-plan-callout-dismissed', '1') } catch {}
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss callout"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <SeasonContextPanel
            macrocycleId={initialPlan.macrocycle.id}
            planningContext={planningContext}
            onContextUpdate={setPlanningContext}
          />
          <GroupTabsBar
            groups={coachGroups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
          />
        </div>

        <TrainingPlanWorkspace
          initialPlan={initialPlan}
          selectedGroupId={selectedGroupId}
          onGenerateWeek={(microcycleId, microcycleName) => {
            if (selectedGroupId === null) {
              toast({ title: 'Select a group first', description: 'Pick a group tab above to generate sessions for that group.', variant: 'destructive' })
              return
            }
            setSelectedMicrocycleId(microcycleId)
            setSelectedMicrocycleName(microcycleName)
            setGenerateSheetOpen(true)
          }}
          onReviewWeek={(microcycleId, weeklyInsights) => {
            setInsightsMicrocycleId(microcycleId)
            setInsightsExisting(weeklyInsights ?? null)
            setInsightsOpen(true)
          }}
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
