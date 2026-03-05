'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Step3GroupsProps {
  coachGroups: Array<{ id: number; name: string }>
  onComplete: (groupIds: number[]) => void
  onBack: () => void
  isCreating: boolean
}

export function Step3Groups({ coachGroups, onComplete, onBack, isCreating }: Step3GroupsProps) {
  const [selected, setSelected] = useState<number[]>(coachGroups.map(g => g.id))

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Which groups follow this plan?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selected groups will appear as tabs in the workspace.
          You can change this later via the Season Context panel.
        </p>
      </div>

      {coachGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 border rounded-lg">
          No groups found. You can create groups in the Athletes section, then return here.
        </p>
      ) : (
        <div className="space-y-3">
          {coachGroups.map(group => (
            <div key={group.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                id={`group-${group.id}`}
                checked={selected.includes(group.id)}
                onCheckedChange={() => toggle(group.id)}
              />
              <Label htmlFor={`group-${group.id}`} className="cursor-pointer flex-1">{group.name}</Label>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isCreating} className="flex-1">Back</Button>
        <Button
          onClick={() => onComplete(selected)}
          disabled={isCreating || selected.length === 0}
          className="flex-1"
        >
          {isCreating ? 'Creating season...' : 'Create Season Plan'}
        </Button>
      </div>
    </div>
  )
}
