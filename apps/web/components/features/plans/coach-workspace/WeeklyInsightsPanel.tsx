'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Loader2,
  Pencil,
  Save,
  RefreshCw,
  Eye,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import {
  getMicrocycleWorkoutSummaryAction,
  saveWeeklyInsightsAction,
  type WeeklyInsightsDraft,
} from '@/actions/plans/weekly-insights-action'
import { useToast } from '@/hooks/use-toast'

interface WeeklyInsightsPanelProps {
  microcycleId: number
  existingInsights?: Record<string, unknown> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PanelState = 'idle' | 'loading-summary' | 'generating' | 'editing' | 'saving' | 'saved'

export function WeeklyInsightsPanel({
  microcycleId,
  existingInsights,
  open,
  onOpenChange,
}: WeeklyInsightsPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>(
    existingInsights ? 'saved' : 'idle'
  )
  const [workoutSummaryText, setWorkoutSummaryText] = useState<string | null>(null)
  const [microcycleName, setMicrocycleName] = useState<string | null>(null)
  const [draft, setDraft] = useState<WeeklyInsightsDraft | null>(
    existingInsights ? (existingInsights as unknown as WeeklyInsightsDraft) : null
  )
  const [editableSummary, setEditableSummary] = useState('')
  const [editableObservations, setEditableObservations] = useState('')
  const [editableAdjustments, setEditableAdjustments] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Abort streaming on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Reset state when microcycleId changes or sheet reopens with different insights
  useEffect(() => {
    if (open) {
      if (existingInsights) {
        const parsed = existingInsights as unknown as WeeklyInsightsDraft
        setDraft(parsed)
        setPanelState('saved')
      } else {
        setDraft(null)
        setPanelState('idle')
      }
      setError(null)
    }
  }, [open, microcycleId, existingInsights])

  const loadSummaryAndGenerate = useCallback(async () => {
    setError(null)
    setPanelState('loading-summary')

    const result = await getMicrocycleWorkoutSummaryAction(microcycleId)
    if (!result.isSuccess || !result.data) {
      setError(result.message)
      setPanelState('idle')
      return
    }

    setWorkoutSummaryText(result.data.workoutSummaryText)
    setMicrocycleName(result.data.microcycleName)

    // Now stream AI insights
    setPanelState('generating')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/planning-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user' as const,
              content: `Review this completed training week and provide insights:\n\n${result.data.workoutSummaryText}`,
            },
          ],
          mode: 'insights',
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value)
      }

      // Parse AI response into structured draft
      const parsed = parseAiInsights(accumulated)
      setDraft(parsed)
      populateEditFields(parsed)
      setPanelState('editing')
    } catch (e) {
      if (controller.signal.aborted) return
      setError(String(e))
      setPanelState('idle')
    }
  }, [microcycleId])

  function populateEditFields(d: WeeklyInsightsDraft) {
    setEditableSummary(d.summary)
    setEditableObservations(d.keyObservations.join('\n'))
    setEditableAdjustments(d.suggestedAdjustments.join('\n'))
  }

  function handleEditExisting() {
    if (draft) {
      populateEditFields(draft)
      setPanelState('editing')
    }
  }

  async function handleSave() {
    if (!draft) return
    setPanelState('saving')

    const finalDraft: WeeklyInsightsDraft = {
      ...draft,
      summary: editableSummary,
      keyObservations: editableObservations.split('\n').map(l => l.trim()).filter(Boolean),
      suggestedAdjustments: editableAdjustments.split('\n').map(l => l.trim()).filter(Boolean),
      generatedAt: new Date().toISOString(),
    }

    const result = await saveWeeklyInsightsAction(microcycleId, finalDraft)
    if (result.isSuccess) {
      setDraft(finalDraft)
      setPanelState('saved')
      toast({ title: 'Insights saved', description: 'Weekly insights have been recorded.' })
    } else {
      setPanelState('editing')
      toast({ title: 'Save failed', description: result.message, variant: 'destructive' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Weekly Insights
          </SheetTitle>
          <SheetDescription className="text-xs">
            Review AI-drafted observations for the completed week
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Error state */}
          {error && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Idle state: prompt to generate */}
          {panelState === 'idle' && !error && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate AI insights from completed workout logs for this microcycle.
              </p>
              <Button onClick={loadSummaryAndGenerate} className="w-full gap-2">
                <Lightbulb className="h-4 w-4" />
                Generate Weekly Insights
              </Button>
            </div>
          )}

          {/* Loading summary */}
          {panelState === 'loading-summary' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading workout data...
            </div>
          )}

          {/* Generating AI insights */}
          {panelState === 'generating' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Drafting insights...
            </div>
          )}

          {/* Editing state */}
          {panelState === 'editing' && draft && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(draft.completionRate * 100)}% completion
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Summary
                </label>
                <Textarea
                  value={editableSummary}
                  onChange={(e) => setEditableSummary(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Key Observations (one per line)
                </label>
                <Textarea
                  value={editableObservations}
                  onChange={(e) => setEditableObservations(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggested Adjustments (one per line)
                </label>
                <Textarea
                  value={editableAdjustments}
                  onChange={(e) => setEditableAdjustments(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Saved / read-only state */}
          {panelState === 'saved' && draft && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(draft.completionRate * 100)}% completion
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
                <p className="text-sm leading-relaxed">{draft.summary}</p>
              </div>

              {draft.keyObservations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Key Observations
                  </p>
                  <ul className="space-y-1">
                    {draft.keyObservations.map((obs, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.suggestedAdjustments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Suggested Adjustments
                  </p>
                  <ul className="space-y-1">
                    {draft.suggestedAdjustments.map((adj, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-amber-500/30">
                        {adj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Saving state */}
          {panelState === 'saving' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving insights...
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(panelState === 'editing' || panelState === 'saved') && (
          <div className="border-t px-6 py-3 flex items-center gap-2">
            {panelState === 'editing' && (
              <>
                <Button onClick={handleSave} className="gap-1 flex-1">
                  <Save className="h-3.5 w-3.5" />
                  Confirm & Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSummaryAndGenerate}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
              </>
            )}
            {panelState === 'saved' && (
              <>
                <Button variant="outline" onClick={handleEditExisting} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  Update
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSummaryAndGenerate}
                  className="gap-1 text-muted-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-generate
                </Button>
              </>
            )}
          </div>
        )}

        {/* Error retry in footer */}
        {error && panelState === 'idle' && (
          <div className="border-t px-6 py-3">
            <Button variant="outline" onClick={loadSummaryAndGenerate} className="w-full gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/**
 * Parse free-form AI text into the WeeklyInsightsDraft structure.
 * The AI is prompted to return insights mode content -- we extract
 * structured sections via simple heuristics. Falls back gracefully
 * if the AI output is unstructured.
 */
function parseAiInsights(raw: string): WeeklyInsightsDraft {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  let summary = ''
  const observations: string[] = []
  const adjustments: string[] = []
  let completionRate = 0

  // Try to extract completion rate from text (e.g. "80%" or "4/5")
  const pctMatch = raw.match(/(\d{1,3})%/)
  if (pctMatch) {
    completionRate = parseInt(pctMatch[1], 10) / 100
  }
  const fractionMatch = raw.match(/(\d+)\s*\/\s*(\d+)\s*sessions?/i)
  if (fractionMatch && !pctMatch) {
    completionRate = parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10)
  }

  // Simple section parsing
  let currentSection: 'summary' | 'observations' | 'adjustments' = 'summary'
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('observation') || lower.includes('key finding') || lower.includes('key insight')) {
      currentSection = 'observations'
      continue
    }
    if (lower.includes('adjustment') || lower.includes('suggestion') || lower.includes('recommendation')) {
      currentSection = 'adjustments'
      continue
    }

    const cleaned = line.replace(/^[-*\d.)\s]+/, '').trim()
    if (!cleaned) continue

    if (currentSection === 'summary') {
      summary += (summary ? ' ' : '') + cleaned
    } else if (currentSection === 'observations') {
      observations.push(cleaned)
    } else {
      adjustments.push(cleaned)
    }
  }

  // If no sections were detected, treat everything as summary
  if (observations.length === 0 && adjustments.length === 0) {
    // Split the summary into parts as a fallback
    const sentences = summary.split(/\.\s+/)
    if (sentences.length > 2) {
      summary = sentences.slice(0, 2).join('. ') + '.'
      observations.push(...sentences.slice(2, 5).filter(Boolean))
    }
  }

  return {
    summary: summary || raw.slice(0, 300),
    completionRate: Math.min(1, Math.max(0, completionRate)),
    keyObservations: observations.slice(0, 8),
    suggestedAdjustments: adjustments.slice(0, 6),
    generatedAt: new Date().toISOString(),
  }
}
