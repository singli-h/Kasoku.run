'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Step1ImportProps {
  onComplete: (planningContext: string, name: string, startDate: string, endDate: string) => void
}

export function Step1Import({ onComplete }: Step1ImportProps) {
  const [context, setContext] = useState('')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Describe your season</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your existing training plan or describe your coaching philosophy.
          AI will help structure it into phases.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Season name</Label>
        <Input placeholder="e.g. 2026 Track Season" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Training plan / philosophy</Label>
        <Textarea
          placeholder={"Paste CSV, spreadsheet data, or describe:\n- Season goals and key competitions\n- Training philosophy (e.g. GPP Jan\u2013Mar, high volume...)\n- Event focus (sprints, distance, jumps...)\n- Group schedules (GHS: 3x/wk Mon/Wed/Fri)"}
          className="min-h-[200px] font-mono text-sm"
          value={context}
          onChange={e => setContext(e.target.value)}
          maxLength={10000}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            You can edit and refine this after creation in the Season Context panel.
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {context.length.toLocaleString()} / 10,000
          </p>
        </div>
      </div>

      <Button
        onClick={() => onComplete(context, name, startDate, endDate)}
        disabled={!context.trim() || !name.trim() || !startDate || !endDate}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  )
}
