"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Copy, Loader2 } from "lucide-react"

interface Microcycle {
  id: number
  name: string | null
}

interface Mesocycle {
  id: number
  name: string | null
  microcycles: Microcycle[]
}

interface DuplicateWeekDialogProps {
  sourceMicrocycle: { id: number; name: string | null; sessionCount: number } | null
  mesocycles: Mesocycle[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDuplicate: (sourceMicrocycleId: number, targetMicrocycleIds: number[]) => void
}

export function DuplicateWeekDialog({
  sourceMicrocycle,
  mesocycles,
  open,
  onOpenChange,
  onDuplicate,
}: DuplicateWeekDialogProps) {
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<string>("")
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find the mesocycle that contains the source microcycle
  const sourceMesocycle = useMemo(() => {
    for (const meso of mesocycles) {
      if (meso.microcycles.some(m => m.id === sourceMicrocycle?.id)) {
        return meso
      }
    }
    return mesocycles[0] || null
  }, [mesocycles, sourceMicrocycle?.id])

  // Get microcycles for the selected mesocycle, excluding the source
  const availableMicrocycles = useMemo(() => {
    const meso = mesocycles.find(m => m.id.toString() === selectedMesocycleId)
    if (!meso) return []
    return meso.microcycles.filter(m => m.id !== sourceMicrocycle?.id)
  }, [mesocycles, selectedMesocycleId, sourceMicrocycle?.id])

  // Reset selections when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && sourceMicrocycle) {
      // Pre-select the mesocycle containing the source week
      if (sourceMesocycle) {
        setSelectedMesocycleId(sourceMesocycle.id.toString())
      }
      setSelectedTargetIds(new Set())
    }
    onOpenChange(newOpen)
  }

  const handleToggleTarget = (microcycleId: number) => {
    setSelectedTargetIds(prev => {
      const next = new Set(prev)
      if (next.has(microcycleId)) {
        next.delete(microcycleId)
      } else {
        next.add(microcycleId)
      }
      return next
    })
  }

  const handleSelectAllInPhase = () => {
    const allIds = availableMicrocycles.map(m => m.id)
    const allSelected = allIds.every(id => selectedTargetIds.has(id))
    if (allSelected) {
      // Deselect all in this phase
      setSelectedTargetIds(prev => {
        const next = new Set(prev)
        for (const id of allIds) {
          next.delete(id)
        }
        return next
      })
    } else {
      // Select all in this phase
      setSelectedTargetIds(prev => {
        const next = new Set(prev)
        for (const id of allIds) {
          next.add(id)
        }
        return next
      })
    }
  }

  const handleDuplicate = async () => {
    if (!sourceMicrocycle || selectedTargetIds.size === 0) return

    setIsSubmitting(true)
    try {
      await onDuplicate(sourceMicrocycle.id, Array.from(selectedTargetIds))
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!sourceMicrocycle) return null

  const allInPhaseSelected = availableMicrocycles.length > 0 &&
    availableMicrocycles.every(m => selectedTargetIds.has(m.id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Week
          </DialogTitle>
          <DialogDescription>
            Copy all {sourceMicrocycle.sessionCount} session{sourceMicrocycle.sessionCount !== 1 ? 's' : ''} from{' '}
            &quot;{sourceMicrocycle.name || 'Unnamed Week'}&quot; to selected weeks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Target Phase */}
          <div className="grid gap-2">
            <Label htmlFor="dup-mesocycle">Target Phase</Label>
            <Select
              value={selectedMesocycleId}
              onValueChange={(value) => {
                setSelectedMesocycleId(value)
                setSelectedTargetIds(new Set())
              }}
            >
              <SelectTrigger id="dup-mesocycle">
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {mesocycles.map((meso) => (
                  <SelectItem key={meso.id} value={meso.id.toString()}>
                    {meso.name || `Phase ${meso.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Weeks multi-select */}
          {selectedMesocycleId && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Target Weeks</Label>
                {availableMicrocycles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleSelectAllInPhase}
                  >
                    {allInPhaseSelected ? 'Deselect All' : 'Select All in Phase'}
                  </Button>
                )}
              </div>
              {availableMicrocycles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No other weeks in this phase to copy to.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {availableMicrocycles.map((micro) => (
                    <label
                      key={micro.id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTargetIds.has(micro.id)}
                        onCheckedChange={() => handleToggleTarget(micro.id)}
                      />
                      <span className="text-sm">
                        {micro.name || `Week ${micro.id}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={selectedTargetIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              `Copy to ${selectedTargetIds.size} week${selectedTargetIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
