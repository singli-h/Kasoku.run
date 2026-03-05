'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

interface Step2PhaseReviewProps {
  planningContext: string
  onComplete: (phases: Phase[]) => void
  onBack: () => void
}

export function Step2PhaseReview({ planningContext, onComplete, onBack }: Step2PhaseReviewProps) {
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES)

  function updatePhase(i: number, field: keyof Phase, value: string | number) {
    setPhases(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Season structure</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edit these phases to match your plan. You can also adjust later in the workspace.
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <Input
                value={phase.name}
                onChange={e => updatePhase(i, 'name', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Input
                type="number"
                value={phase.weeks}
                onChange={e => updatePhase(i, 'weeks', parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-sm text-center"
                min={1} max={20}
              />
              <span className="whitespace-nowrap">wk</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Total: {totalWeeks} weeks</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={() => onComplete(phases)} className="flex-1">Continue</Button>
      </div>
    </div>
  )
}
