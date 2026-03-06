'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Plus, X } from 'lucide-react'
import { createMacrocycleAction, saveMacroPlanningContextAction, createMesocycleAction } from '@/actions/plans/plan-actions'
import { useToast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────────

interface Phase {
  name: string
  weeks: number
}

interface WizardState {
  macrocycleName: string
  startDate: string
  endDate: string
  planningContext: string
  phases: Phase[]
  selectedGroupIds: number[]
}

interface CoachSeasonWizardProps {
  coachGroups: Array<{ id: number; name: string }>
}

// ── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kasoku:coach-wizard-draft'

function loadDraft(): Partial<WizardState> | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDraft(state: WizardState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* noop */ }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
}

// ── Phase inference ──────────────────────────────────────────────────────────

const DEFAULT_PHASES: Phase[] = [
  { name: 'General Preparation (GPP)', weeks: 8 },
  { name: 'Specific Preparation (SPP)', weeks: 6 },
  { name: 'Competition', weeks: 6 },
  { name: 'Taper', weeks: 2 },
]

function buildDurationPhases(totalWeeks: number): Phase[] {
  if (totalWeeks <= 12) {
    const gpp = Math.max(1, Math.round(totalWeeks * 0.6))
    const comp = Math.max(1, totalWeeks - gpp)
    return [
      { name: 'General Preparation (GPP)', weeks: gpp },
      { name: 'Competition', weeks: comp },
    ]
  }
  if (totalWeeks <= 20) {
    const gpp = Math.max(1, Math.round(totalWeeks * 0.35))
    const spp = Math.max(1, Math.round(totalWeeks * 0.35))
    const taper = Math.max(1, Math.round(totalWeeks * 0.10))
    const comp = Math.max(1, totalWeeks - gpp - spp - taper)
    return [
      { name: 'General Preparation (GPP)', weeks: gpp },
      { name: 'Specific Preparation (SPP)', weeks: spp },
      { name: 'Competition', weeks: comp },
      { name: 'Taper', weeks: taper },
    ]
  }
  // 21+ weeks
  const gpp = Math.max(1, Math.round(totalWeeks * 0.30))
  const spp = Math.max(1, Math.round(totalWeeks * 0.25))
  const comp = Math.max(1, Math.round(totalWeeks * 0.25))
  const taper = Math.max(1, Math.round(totalWeeks * 0.10))
  const transition = Math.max(1, totalWeeks - gpp - spp - comp - taper)
  return [
    { name: 'General Preparation (GPP)', weeks: gpp },
    { name: 'Specific Preparation (SPP)', weeks: spp },
    { name: 'Competition', weeks: comp },
    { name: 'Taper', weeks: taper },
    { name: 'Transition', weeks: transition },
  ]
}

function inferPhasesFromContext(
  text: string,
  startDate?: string,
  endDate?: string,
): { phases: Phase[]; detected: boolean } {
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean)
  const phaseKeywords = [
    'gpp', 'general', 'base', 'spp', 'specific', 'pre-comp',
    'comp', 'competition', 'race', 'taper', 'peak', 'unloading',
    'indoor', 'outdoor', 'transition', 'recovery',
  ]

  const found: Phase[] = []
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (phaseKeywords.some(kw => lower.includes(kw))) {
      const weeksMatch = line.match(/(\d+)\s*(?:wk|week|weeks)/i)
      const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 6
      const name = line.replace(/[-–]\s*\d+\s*(?:wk|week|weeks)/i, '').trim()
      found.push({ name: name || line, weeks })
    }
  }

  if (found.length >= 2) {
    return { phases: found, detected: true }
  }

  // Duration-based fallback when dates are available
  if (startDate && endDate && endDate > startDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalWeeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)))
    return { phases: buildDurationPhases(totalWeeks), detected: false }
  }

  return { phases: DEFAULT_PHASES, detected: false }
}

// ── Component ────────────────────────────────────────────────────────────────

export function CoachSeasonWizard({ coachGroups }: CoachSeasonWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)

  const [state, setState] = useState<WizardState>(() => {
    const draft = loadDraft()
    return {
      macrocycleName: draft?.macrocycleName ?? '',
      startDate: draft?.startDate ?? '',
      endDate: draft?.endDate ?? '',
      planningContext: draft?.planningContext ?? '',
      phases: draft?.phases ?? DEFAULT_PHASES,
      selectedGroupIds: draft?.selectedGroupIds ?? coachGroups.map(g => g.id),
    }
  })

  // Persist draft to localStorage (debounced to avoid thrashing on every keystroke)
  useEffect(() => {
    const timer = setTimeout(() => saveDraft(state), 500)
    return () => clearTimeout(timer)
  }, [state])

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState(s => ({ ...s, [key]: value }))
  }, [])

  // Re-infer phases when context or dates change substantially
  const [lastInferredContext, setLastInferredContext] = useState(state.planningContext)
  const [lastInferredDates, setLastInferredDates] = useState(`${state.startDate}|${state.endDate}`)
  useEffect(() => {
    const currentDates = `${state.startDate}|${state.endDate}`
    const datesChanged = currentDates !== lastInferredDates
    const contextChanged = state.planningContext !== lastInferredContext
    const hasValidDates = state.startDate && state.endDate && state.endDate > state.startDate

    if ((state.planningContext.length > 30 && contextChanged) || (datesChanged && hasValidDates)) {
      const timer = setTimeout(() => {
        const { phases, detected } = inferPhasesFromContext(
          state.planningContext,
          state.startDate,
          state.endDate,
        )
        if (detected) {
          update('phases', phases)
          setStructureOpen(true)
        } else if (datesChanged && hasValidDates) {
          update('phases', phases)
        }
        setLastInferredContext(state.planningContext)
        setLastInferredDates(currentDates)
      }, 1000) // debounce 1s
      return () => clearTimeout(timer)
    }
  }, [state.planningContext, state.startDate, state.endDate, lastInferredContext, lastInferredDates, update])

  const canCreate = state.macrocycleName.trim() && state.startDate && state.endDate
    && state.endDate > state.startDate && state.planningContext.trim()

  async function handleCreate() {
    setIsCreating(true)
    try {
      const result = await createMacrocycleAction({
        name: state.macrocycleName,
        start_date: state.startDate,
        end_date: state.endDate,
      })
      if (!result.isSuccess || !result.data) throw new Error(result.message)
      const macrocycleId = result.data.id

      // Save planning context
      await saveMacroPlanningContextAction(macrocycleId, {
        text: state.planningContext,
      })

      // Auto-create mesocycles from phases (distribute dates proportionally, in parallel)
      if (state.phases.length > 0) {
        const macroStart = new Date(state.startDate)
        const macroEnd = new Date(state.endDate)
        const totalDays = Math.max(1, (macroEnd.getTime() - macroStart.getTime()) / (1000 * 60 * 60 * 24))
        const totalPhaseWeeks = state.phases.reduce((s, p) => s + p.weeks, 0) || 1

        // Pre-compute all phase date ranges
        const phaseSpecs: Array<{ name: string; start_date: string; end_date: string }> = []
        let cursor = new Date(macroStart)
        for (const phase of state.phases) {
          if (!phase.name.trim()) continue
          const phaseDays = Math.round((phase.weeks / totalPhaseWeeks) * totalDays)
          const phaseStart = new Date(cursor)
          const phaseEnd = new Date(cursor.getTime() + phaseDays * 24 * 60 * 60 * 1000)
          if (phaseEnd > macroEnd) phaseEnd.setTime(macroEnd.getTime())
          phaseSpecs.push({
            name: phase.name,
            start_date: phaseStart.toISOString().split('T')[0],
            end_date: phaseEnd.toISOString().split('T')[0],
          })
          cursor = new Date(phaseEnd)
        }

        const results = await Promise.all(
          phaseSpecs.map(spec => createMesocycleAction({ ...spec, macrocycle_id: macrocycleId }))
        )
        const failed = results.filter(r => !r.isSuccess)
        if (failed.length > 0) {
          toast({ title: 'Some phases failed to create', description: `${failed.length} of ${phaseSpecs.length} phases failed. You can add them manually.`, variant: 'destructive' })
        }
      }

      clearDraft()
      router.push(`/plans/${macrocycleId}`)
    } catch (e) {
      toast({ title: 'Failed to create season', description: String(e), variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  // ── Phase helpers ────────────────────────────────────────────────────────

  function updatePhase(i: number, field: keyof Phase, value: string | number) {
    update('phases', state.phases.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  function removePhase(i: number) {
    update('phases', state.phases.filter((_, idx) => idx !== i))
  }

  function addPhase() {
    update('phases', [...state.phases, { name: '', weeks: 4 }])
  }

  // ── Group helpers ────────────────────────────────────────────────────────

  function toggleGroup(id: number) {
    const ids = state.selectedGroupIds
    update('selectedGroupIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const totalWeeks = state.phases.reduce((s, p) => s + p.weeks, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* ── Season basics ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Describe your season</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste your existing training plan or describe your coaching philosophy.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Season name</Label>
          <Input
            placeholder="e.g. 2026 Track Season"
            value={state.macrocycleName}
            onChange={e => update('macrocycleName', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={state.startDate} onChange={e => update('startDate', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={state.endDate} onChange={e => update('endDate', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Training plan / philosophy</Label>
          <Textarea
            placeholder={"Paste CSV, spreadsheet data, or describe:\n- Season goals and key competitions\n- Training philosophy (e.g. GPP Jan–Mar, high volume...)\n- Event focus (sprints, distance, jumps...)\n- Group schedules (GHS: 3x/wk Mon/Wed/Fri)"}
            className="min-h-[200px] font-mono text-sm"
            value={state.planningContext}
            onChange={e => update('planningContext', e.target.value)}
            maxLength={10000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              You can edit and refine this after creation in the Season Context panel.
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {state.planningContext.length.toLocaleString()} / 10,000
            </p>
          </div>
        </div>
      </section>

      {/* ── Season structure (collapsible) ────────────────────────────── */}
      <Collapsible open={structureOpen} onOpenChange={setStructureOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full py-2 text-left group">
            <div>
              <h2 className="text-lg font-semibold">Season structure</h2>
              <p className="text-xs text-muted-foreground">
                {state.phases.length} phases · {totalWeeks} weeks total
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Starting phases (you can add more anytime from the plan page)
          </p>

          {state.phases.map((phase, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <Input
                  value={phase.name}
                  onChange={e => updatePhase(i, 'name', e.target.value)}
                  placeholder="Phase name (e.g. Indoor Comp, Recovery)"
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
                  disabled={state.phases.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addPhase} className="gap-1 text-muted-foreground">
            <Plus className="h-4 w-4" /> Add phase
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Groups ────────────────────────────────────────────────────── */}
      {coachGroups.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Groups</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All your groups appear as tabs in the workspace for filtering.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {coachGroups.map(group => (
              <label
                key={group.id}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={state.selectedGroupIds.includes(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* ── Create button ─────────────────────────────────────────────── */}
      <div className="pt-2">
        <Button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? 'Creating season...' : 'Create Season Plan'}
        </Button>
        {!canCreate && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Fill in name, dates, and training context to continue.
          </p>
        )}
      </div>
    </div>
  )
}
