'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { saveMacroPlanningContextAction } from '@/actions/plans/plan-actions'
import { useToast } from '@/hooks/use-toast'

interface SeasonContextPanelProps {
  macrocycleId: number
  planningContext: string | null
  onContextUpdate?: (context: string) => void
}

export function SeasonContextPanel({ macrocycleId, planningContext, onContextUpdate }: SeasonContextPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(planningContext ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const result = await saveMacroPlanningContextAction(macrocycleId, { text: value })
    setSaving(false)
    if (result.isSuccess) {
      setEditing(false)
      onContextUpdate?.(value)
      toast({ title: 'Season context saved' })
    } else {
      toast({ title: 'Save failed', description: result.message, variant: 'destructive' })
    }
  }

  const preview = value
    ? value.slice(0, 120) + (value.length > 120 ? '...' : '')
    : 'Add your season goals and coaching philosophy'

  return (
    <div className="border rounded-lg bg-muted/30 mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium shrink-0">Season Context</span>
          {!expanded && (
            <span className="text-muted-foreground text-xs truncate">{preview}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {editing ? (
            <>
              <Textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                className="min-h-[120px] text-sm font-mono"
                placeholder="Season goals, training philosophy, competition calendar, group schedules..."
                maxLength={10000}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setValue(planningContext ?? ''); setEditing(false) }}>
                    Cancel
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {value.length.toLocaleString()} / 10,000
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {value || 'No planning context yet.'}
              </p>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
