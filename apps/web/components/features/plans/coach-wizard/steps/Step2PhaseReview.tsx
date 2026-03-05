'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface Phase {
  name: string
  phase: 'GPP' | 'SPP' | 'Taper' | 'Competition'
  weeks: number
}

const DEFAULT_PHASES: Phase[] = [
  { name: 'General Preparation', phase: 'GPP', weeks: 8 },
  { name: 'Specific Preparation', phase: 'SPP', weeks: 6 },
  { name: 'Competition', phase: 'Competition', weeks: 6 },
  { name: 'Taper', phase: 'Taper', weeks: 2 },
]

/**
 * Try to extract phase-like structure from the coach's freeform text.
 * This is best-effort pattern matching, NOT AI extraction.
 * Falls back to DEFAULT_PHASES if nothing is detected.
 */
function inferPhasesFromContext(text: string): Phase[] {
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean)
  const phaseKeywords: Record<string, Phase['phase']> = {
    'gpp': 'GPP', 'general': 'GPP', 'base': 'GPP',
    'spp': 'SPP', 'specific': 'SPP', 'pre-comp': 'SPP',
    'comp': 'Competition', 'competition': 'Competition', 'race': 'Competition',
    'taper': 'Taper', 'peak': 'Taper', 'unloading': 'Taper',
  }

  const found: Phase[] = []
  for (const line of lines) {
    const lower = line.toLowerCase()
    for (const [keyword, phaseType] of Object.entries(phaseKeywords)) {
      if (lower.includes(keyword)) {
        // Try to extract weeks: "GPP 8 weeks", "GPP Jan-Mar" etc
        const weeksMatch = line.match(/(\d+)\s*(?:wk|week|weeks)/i)
        const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 6
        // Use the original line text as the name (cleaned up)
        const name = line.replace(/[-–]\s*\d+\s*(?:wk|week|weeks)/i, '').trim()
        found.push({ name: name || phaseType, phase: phaseType, weeks })
        break
      }
    }
  }

  return found.length >= 2 ? found : DEFAULT_PHASES
}

interface Step2PhaseReviewProps {
  planningContext: string
  onComplete: (phases: Phase[]) => void
  onBack: () => void
}

export function Step2PhaseReview({ planningContext, onComplete, onBack }: Step2PhaseReviewProps) {
  const [detectedFromContext] = useState(() => {
    const inferred = inferPhasesFromContext(planningContext)
    return inferred !== DEFAULT_PHASES
  })
  const [phases, setPhases] = useState<Phase[]>(() => inferPhasesFromContext(planningContext))

  function updatePhase(i: number, field: keyof Phase, value: string | number) {
    setPhases(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  function removePhase(i: number) {
    setPhases(ps => ps.filter((_, idx) => idx !== i))
  }

  function addPhase() {
    setPhases(ps => [...ps, { name: '', phase: 'GPP', weeks: 4 }])
  }

  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Season structure</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {detectedFromContext
            ? 'We detected these phases from your description. Edit, add, or remove as needed.'
            : 'Edit these default phases to match your plan. You can also adjust later in the workspace.'}
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border rounded-lg">
            <div className="flex-1 min-w-0">
              <Input
                value={phase.name}
                onChange={e => updatePhase(i, 'name', e.target.value)}
                placeholder="Phase name"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Input
                  type="number"
                  value={phase.weeks}
                  onChange={e => updatePhase(i, 'weeks', parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-sm text-center"
                  min={1} max={52}
                />
                <span className="whitespace-nowrap">wk</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removePhase(i)}
                disabled={phases.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={addPhase} className="gap-1 text-muted-foreground">
          <Plus className="h-4 w-4" /> Add phase
        </Button>
        <p className="text-xs text-muted-foreground">Total: {totalWeeks} weeks</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={() => onComplete(phases)} disabled={phases.length === 0} className="flex-1">Continue</Button>
      </div>
    </div>
  )
}
