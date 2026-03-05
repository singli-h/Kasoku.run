'use client'

import { useState, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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
  const { toast } = useToast()

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

  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen && !context) {
      loadContext()
    }
  }, [onOpenChange, context, loadContext])

  async function handleGenerate() {
    if (!context) return
    setGenerating(true)
    setAiResponse('')

    const messages = [{
      role: 'user' as const,
      content: `Generate a training week for ${context.groupName ?? 'this group'} — ${microcycleName ?? 'upcoming week'}.`,
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
    }

    try {
      const res = await fetch('/api/ai/planning-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        // Parse Vercel AI SDK data stream format (0:"text" lines)
        const lines = chunk.split('\n').filter(l => l.startsWith('0:'))
        for (const line of lines) {
          try {
            const text = JSON.parse(line.slice(2)) as string
            accumulated += text
            setAiResponse(accumulated)
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (e) {
      toast({ title: 'Generation failed', description: String(e), variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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

          {athleteGroupId && loadingContext && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading context...
            </div>
          )}

          {context && (
            <>
              <div className="border rounded-lg">
                <button
                  onClick={() => setContextExpanded(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left"
                >
                  <span className="font-medium text-muted-foreground">AI knows:</span>
                  {contextExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {contextExpanded && (
                  <div className="px-3 pb-3 space-y-1 text-xs text-muted-foreground">
                    {context.macroContext && <p>Season: {context.macroContext.slice(0, 100)}...</p>}
                    {context.mesoContext && <p>Phase: {context.mesoContext.slice(0, 80)}</p>}
                    {context.athleteEventGroups.length > 0 && <p>Groups: {context.athleteEventGroups.join(', ')}</p>}
                    {context.upcomingRaces.length > 0 && <p>Races: {context.upcomingRaces.join(', ')}</p>}
                    {context.recentInsights.length > 0 && <p>Last {context.recentInsights.length} weeks loaded</p>}
                    {!context.macroContext && !context.mesoContext && (
                      <p className="text-amber-600">No planning context yet — add it in Season Context panel for better results.</p>
                    )}
                  </div>
                )}
              </div>

              {!aiResponse && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full gap-2"
                >
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    : <><Sparkles className="h-4 w-4" />Generate week sessions</>
                  }
                </Button>
              )}

              {aiResponse && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">AI Suggestion</p>
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{aiResponse}</pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Review the suggestion above, then add sessions manually using the + button in the workspace.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Regenerate
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
