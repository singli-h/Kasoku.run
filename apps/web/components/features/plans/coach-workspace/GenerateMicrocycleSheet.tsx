'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { getMicrocycleGenerationContextAction } from '@/actions/plans/generate-microcycle-action'
import type { MicrocycleGenerationContext } from '@/actions/plans/generate-microcycle-action'
import { useToast } from '@/hooks/use-toast'

interface GenerateMicrocycleSheetProps {
  microcycleId: number
  athleteGroupId: number | null
  microcycleName?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateMicrocycleSheet({
  microcycleId,
  athleteGroupId,
  microcycleName,
  open,
  onOpenChange,
}: GenerateMicrocycleSheetProps) {
  const [context, setContext] = useState<MicrocycleGenerationContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [contextExpanded, setContextExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [weekNotes, setWeekNotes] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Abort streaming on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const loadContext = useCallback(async () => {
    if (!athleteGroupId) return
    setLoadingContext(true)
    const result = await getMicrocycleGenerationContextAction(microcycleId, athleteGroupId)
    setLoadingContext(false)
    if (result.isSuccess && result.data) {
      setContext(result.data)
    } else {
      toast({ title: 'Could not load context', description: result.message, variant: 'destructive' })
    }
  }, [microcycleId, athleteGroupId, toast])

  // Load context when sheet opens — onOpenChange does NOT fire when parent sets open=true
  useEffect(() => {
    if (open && !context && !loadingContext) {
      loadContext()
    }
  }, [open, context, loadingContext, loadContext])

  async function handleCopy() {
    await navigator.clipboard.writeText(aiResponse)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleGenerate() {
    if (!context) return
    setGenerating(true)
    setAiResponse('')
    setCopied(false)

    const messages = [{
      role: 'user' as const,
      content: `Generate a training week for ${context.groupName ?? 'this group'} — ${microcycleName ?? 'upcoming week'}.${weekNotes.trim() ? `\n\nCoach notes for this week:\n${weekNotes.trim()}` : ''}`,
    }]

    const body = {
      messages,
      mode: 'generate',
      macroContext: context.macroContext ?? undefined,
      mesoContext: context.mesoContext ?? undefined,
      recentInsights: context.recentInsights.length ? context.recentInsights : undefined,
      athleteEventGroups: context.athleteEventGroups.length ? context.athleteEventGroups : undefined,
      upcomingRaces: context.upcomingRaces.length ? context.upcomingRaces : undefined,
      scheduleNotes: context.scheduleNotes ?? undefined,
      otherGroupSessions: context.otherGroupSessions.length ? context.otherGroupSessions : undefined,
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/planning-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        const chunk = decoder.decode(value)
        accumulated += chunk
        setAiResponse(accumulated)
      }
    } catch (e) {
      if (controller.signal.aborted) return
      toast({ title: 'Generation failed', description: String(e), variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Week — {microcycleName ?? 'Week'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!athleteGroupId && (
            <p className="text-sm text-muted-foreground p-3 border rounded-lg">
              Select a group from the tabs above to generate sessions for that group.
            </p>
          )}

          {athleteGroupId && (
            <>
              {/* AI context (collapsed by default, shows loading indicator while fetching) */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setContextExpanded(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left"
                >
                  <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                    AI context
                    {loadingContext && <Loader2 className="h-3 w-3 animate-spin" />}
                  </span>
                  {contextExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {contextExpanded && (
                  <div className="px-3 pb-3 space-y-1 text-xs text-muted-foreground">
                    {loadingContext ? (
                      <p>Loading planning context...</p>
                    ) : context ? (
                      <>
                        {context.macroContext && <p>Season: {context.macroContext.slice(0, 100)}...</p>}
                        {context.mesoContext && <p>Phase: {context.mesoContext.slice(0, 80)}</p>}
                        {context.athleteEventGroups.length > 0 && <p>Events: {context.athleteEventGroups.join(', ')}</p>}
                        {context.upcomingRaces.length > 0 && <p>Races: {context.upcomingRaces.join(', ')}</p>}
                        {context.recentInsights.length > 0 && <p>Last {context.recentInsights.length} weeks loaded</p>}
                        {context.otherGroupSessions.length > 0 && (
                          <p>Other groups: {context.otherGroupSessions.map(s => s.split(':')[0]).join(', ')}</p>
                        )}
                        {!context.macroContext && !context.mesoContext && (
                          <p className="text-amber-600">No planning context yet — add it in Season Context panel for better results.</p>
                        )}
                      </>
                    ) : (
                      <p>No context available</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes textarea — always visible so user can start typing while context loads */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Week-specific notes (optional)</label>
                <Textarea
                  value={weekNotes}
                  onChange={(e) => setWeekNotes(e.target.value)}
                  placeholder="e.g. Focus on acceleration, reduce volume — 3 athletes racing Saturday..."
                  rows={3}
                  className="text-sm resize-none"
                  maxLength={2000}
                  autoFocus
                />
              </div>

              {!aiResponse && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating || loadingContext || !context}
                  className="w-full gap-2"
                >
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    : loadingContext
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Loading context...</>
                      : <><Sparkles className="h-4 w-4" />Generate week sessions</>
                  }
                </Button>
              )}

              {aiResponse && (
                <div className="space-y-3">
                  <div className="border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <p className="text-xs text-muted-foreground font-medium">AI Suggestion</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 gap-1 text-xs text-muted-foreground"
                      >
                        {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                      </Button>
                    </div>
                    <div className="px-4 pb-4">
                      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{aiResponse}</pre>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">Next steps:</p>
                    <p>Use the <span className="font-mono bg-muted px-1 rounded">+</span> button in the workspace to create each session from this suggestion.</p>
                    <p className="text-muted-foreground/70">Auto-create from AI output is coming soon.</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="gap-1"
                  >
                    {generating
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Regenerating...</>
                      : <><Sparkles className="h-3 w-3" />Regenerate</>
                    }
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
