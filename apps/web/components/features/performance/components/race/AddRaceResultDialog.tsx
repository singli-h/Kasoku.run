"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getEventsAction, createRaceResultAction } from "@/actions/performance/race-result-actions"
import type { Database } from "@/types/database"

type Event = Database["public"]["Tables"]["events"]["Row"]

interface AddRaceResultDialogProps {
  onSuccess?: () => void
}

export function AddRaceResultDialog({ onSuccess }: AddRaceResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const { toast } = useToast()

  // Form state
  const [eventId, setEventId] = useState<string>("")
  const [result, setResult] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [indoor, setIndoor] = useState(false)
  const [wind, setWind] = useState("")

  // Load events when dialog opens
  useEffect(() => {
    if (open && events.length === 0) {
      loadEvents()
    }
  }, [open, events.length])

  async function loadEvents() {
    const response = await getEventsAction()
    if (response.isSuccess) {
      setEvents(response.data)
    }
  }

  function resetForm() {
    setEventId("")
    setResult("")
    setDate(new Date().toISOString().split("T")[0])
    setIndoor(false)
    setWind("")
  }

  async function handleSubmit() {
    // Validation
    if (!eventId) {
      toast({ title: "Please select an event", variant: "destructive" })
      return
    }
    if (!result || isNaN(parseFloat(result))) {
      toast({ title: "Please enter a valid result", variant: "destructive" })
      return
    }
    if (!date) {
      toast({ title: "Please select a date", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await createRaceResultAction({
        eventId: parseInt(eventId),
        value: parseFloat(result),
        date,
        indoor,
        wind: wind && !indoor ? parseFloat(wind) : undefined,
      })

      if (response.isSuccess) {
        toast({
          title: response.message,
          description: response.message.includes("personal best") ? "Congratulations!" : undefined,
        })
        resetForm()
        setOpen(false)
        onSuccess?.()
      } else {
        toast({ title: response.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to save result", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Get selected event to show appropriate unit label
  const selectedEvent = events.find((e) => e.id.toString() === eventId)
  const isFieldEvent = selectedEvent?.type === "field"
  const unitLabel = isFieldEvent ? "meters" : "seconds"

  // Wind-affected events (sprints up to 200m, 150m, hurdles, LJ, TJ)
  // Note: 300m (28) is NOT wind-affected as it's run on a curve
  const windAffectedEventIds = [1, 2, 24, 25, 26, 9, 16, 17, 27]
  const showWind = eventId && windAffectedEventIds.includes(parseInt(eventId)) && !indoor

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Result
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Race Result</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event">Event *</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Track Events</SelectLabel>
                  {events
                    .filter((e) => e.type === "track")
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Field Events</SelectLabel>
                  {events
                    .filter((e) => e.type === "field")
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Result + Indoor toggle */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="result">Result ({unitLabel}) *</Label>
              <Input
                id="result"
                type="number"
                step="0.01"
                min="0"
                placeholder={isFieldEvent ? "e.g., 7.85" : "e.g., 10.52"}
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2">
              <Switch
                checked={indoor}
                onCheckedChange={(checked) => {
                  setIndoor(checked)
                  if (checked) setWind("") // Clear wind for indoor
                }}
              />
              <span className="text-sm">Indoor</span>
            </label>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Wind (only for wind-affected outdoor events) */}
          {showWind && (
            <div className="space-y-2">
              <Label htmlFor="wind">Wind (m/s)</Label>
              <Input
                id="wind"
                type="number"
                step="0.1"
                placeholder="e.g., +1.2"
                value={wind}
                onChange={(e) => setWind(e.target.value)}
              />
              {wind && parseFloat(wind) > 2.0 && (
                <p className="text-xs text-amber-600">Wind-assisted ({">"} +2.0 m/s)</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
