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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, AlertTriangle, Loader2 } from "lucide-react"

interface Microcycle {
  id: number
  name: string | null
  sessions: { id: string }[]
}

interface Mesocycle {
  id: number
  name: string | null
  microcycles: Microcycle[]
}

interface DuplicateWeekDialogProps {
  sourceMicrocycle: Microcycle | null
  mesocycle: Mesocycle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDuplicate: (sourceMicrocycleId: number, targetMicrocycleIds: number[]) => Promise<void>
}

export function DuplicateWeekDialog({
  sourceMicrocycle,
  mesocycle,
  open,
  onOpenChange,
  onDuplicate,
}: DuplicateWeekDialogProps) {
  const [selectedTargets, setSelectedTargets] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Other microcycles in the same mesocycle (exclude the source)
  const otherMicrocycles = useMemo(() => {
    if (!mesocycle || !sourceMicrocycle) return []
    return mesocycle.microcycles.filter(m => m.id !== sourceMicrocycle.id)
  }, [mesocycle, sourceMicrocycle])

  const sessionCount = sourceMicrocycle?.sessions.length ?? 0

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedTargets(new Set())
    }
    onOpenChange(newOpen)
  }

  const toggleTarget = (id: number) => {
    setSelectedTargets(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedTargets.size === otherMicrocycles.length) {
      setSelectedTargets(new Set())
    } else {
      setSelectedTargets(new Set(otherMicrocycles.map(m => m.id)))
    }
  }

  const handleDuplicate = async () => {
    if (!sourceMicrocycle || selectedTargets.size === 0) return

    setIsSubmitting(true)
    try {
      await onDuplicate(sourceMicrocycle.id, Array.from(selectedTargets))
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!sourceMicrocycle || !mesocycle) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Week
          </DialogTitle>
          <DialogDescription>
            Copy all {sessionCount} session{sessionCount !== 1 ? 's' : ''} from{' '}
            <span className="font-medium text-foreground">{sourceMicrocycle.name || 'this week'}</span>{' '}
            to other weeks. Day assignments will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {otherMicrocycles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other weeks in this phase to copy to. Add more weeks first.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Copy to:</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAll}
                >
                  {selectedTargets.size === otherMicrocycles.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {otherMicrocycles.map((micro) => {
                  const hasExistingSessions = micro.sessions.length > 0
                  return (
                    <label
                      key={micro.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedTargets.has(micro.id)}
                        onCheckedChange={() => toggleTarget(micro.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {micro.name || `Week ${micro.id}`}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {micro.sessions.length} session{micro.sessions.length !== 1 ? 's' : ''}
                          </Badge>
                          {hasExistingSessions && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              Has sessions
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={selectedTargets.size === 0 || isSubmitting || otherMicrocycles.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                Duplicate to {selectedTargets.size} week{selectedTargets.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
