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
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"

interface Microcycle {
  id: number
  name: string | null
  mesocycle_id: number | null
}

interface Mesocycle {
  id: number
  name: string | null
  microcycles: Microcycle[]
}

interface Session {
  id: string
  name: string
  day: number
}

interface CopySessionDialogProps {
  session: Session | null
  mesocycles: Mesocycle[]
  currentMicrocycleId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopy: (sessionId: string, targetMicrocycleId: number, targetDay: number) => void
}

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

export function CopySessionDialog({
  session,
  mesocycles,
  currentMicrocycleId,
  open,
  onOpenChange,
  onCopy,
}: CopySessionDialogProps) {
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<string>("")
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find the current mesocycle based on currentMicrocycleId
  const currentMesocycle = useMemo(() => {
    for (const meso of mesocycles) {
      if (meso.microcycles.some(m => m.id === currentMicrocycleId)) {
        return meso
      }
    }
    return mesocycles[0] || null
  }, [mesocycles, currentMicrocycleId])

  // Get microcycles for selected mesocycle
  const availableMicrocycles = useMemo(() => {
    const meso = mesocycles.find(m => m.id.toString() === selectedMesocycleId)
    return meso?.microcycles || []
  }, [mesocycles, selectedMesocycleId])

  // Reset selections when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && session) {
      // Pre-select current mesocycle and microcycle
      if (currentMesocycle) {
        setSelectedMesocycleId(currentMesocycle.id.toString())
      }
      if (currentMicrocycleId) {
        setSelectedMicrocycleId(currentMicrocycleId.toString())
      }
      setSelectedDay(session.day.toString())
    }
    onOpenChange(newOpen)
  }

  const handleCopy = async () => {
    if (!session || !selectedMicrocycleId || !selectedDay) return

    setIsSubmitting(true)
    try {
      await onCopy(session.id, parseInt(selectedMicrocycleId), parseInt(selectedDay))
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Session
          </DialogTitle>
          <DialogDescription>
            Copy &quot;{session.name}&quot; to another week or day.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Target Mesocycle */}
          <div className="grid gap-2">
            <Label htmlFor="mesocycle">Target Phase</Label>
            <Select
              value={selectedMesocycleId}
              onValueChange={(value) => {
                setSelectedMesocycleId(value)
                setSelectedMicrocycleId("") // Reset microcycle when mesocycle changes
              }}
            >
              <SelectTrigger id="mesocycle">
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

          {/* Target Microcycle */}
          <div className="grid gap-2">
            <Label htmlFor="microcycle">Target Week</Label>
            <Select
              value={selectedMicrocycleId}
              onValueChange={setSelectedMicrocycleId}
              disabled={!selectedMesocycleId}
            >
              <SelectTrigger id="microcycle">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {availableMicrocycles.map((micro) => (
                  <SelectItem key={micro.id} value={micro.id.toString()}>
                    {micro.name || `Week ${micro.id}`}
                    {micro.id === currentMicrocycleId && " (current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Day */}
          <div className="grid gap-2">
            <Label htmlFor="day">Target Day</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger id="day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                    {day.value === session.day && " (original)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!selectedMicrocycleId || !selectedDay || isSubmitting}
          >
            {isSubmitting ? "Copying..." : "Copy Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
