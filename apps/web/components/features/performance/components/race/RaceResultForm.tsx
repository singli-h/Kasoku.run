"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getEventsAction } from "@/actions/performance/race-result-actions"
import type { Database } from "@/types/database"

type Event = Database["public"]["Tables"]["events"]["Row"]

export interface RaceResultFormData {
  eventId: number | null
  value: number | null
  date: string
  indoor: boolean
  wind: number | null
}

interface RaceResultFormProps {
  data: RaceResultFormData
  onChange: (data: RaceResultFormData) => void
  compact?: boolean
  disabled?: boolean
}

/**
 * Unified form component for race results
 * Used by AddRaceResultDialog, EditRaceResultDialog, and ImportResultsDialog
 */
export function RaceResultForm({
  data,
  onChange,
  compact = false,
  disabled = false,
}: RaceResultFormProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoadingEvents(true)
    const response = await getEventsAction()
    if (response.isSuccess) {
      setEvents(response.data)
    }
    setLoadingEvents(false)
  }

  const selectedEvent = events.find((e) => e.id === data.eventId)
  const isFieldEvent = selectedEvent?.type === "field"
  const unitLabel = isFieldEvent ? "meters" : "seconds"

  // Check if wind applies to selected event
  // 100m (1), 200m (2), 60m (24), 60mH (25), 100mH (26), 110mH (9), LJ (16), TJ (17), 150m (27)
  // Note: 300m (28) is NOT wind-affected as it's run on a curve
  const windAffectedEvents = [1, 2, 24, 25, 26, 9, 16, 17, 27]
  const showWind = data.eventId && windAffectedEvents.includes(data.eventId) && !data.indoor

  if (compact) {
    // Compact inline form for import preview editing
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={data.eventId?.toString() ?? ""}
          onValueChange={(v) => onChange({ ...data, eventId: parseInt(v) })}
          disabled={disabled || loadingEvents}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Track</SelectLabel>
              {events
                .filter((e) => e.type === "track")
                .map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Field</SelectLabel>
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

        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder={isFieldEvent ? "7.85" : "10.52"}
          value={data.value ?? ""}
          onChange={(e) =>
            onChange({ ...data, value: e.target.value ? parseFloat(e.target.value) : null })
          }
          className="w-[80px] h-8 text-xs font-mono"
          disabled={disabled}
        />

        <Input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          className="w-[130px] h-8 text-xs"
          disabled={disabled}
        />

        {showWind && (
          <Input
            type="number"
            step="0.1"
            placeholder="Wind"
            value={data.wind ?? ""}
            onChange={(e) =>
              onChange({ ...data, wind: e.target.value ? parseFloat(e.target.value) : null })
            }
            className="w-[70px] h-8 text-xs font-mono"
            disabled={disabled}
          />
        )}

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Switch
            checked={data.indoor}
            onCheckedChange={(checked) => onChange({ ...data, indoor: checked, wind: checked ? null : data.wind })}
            disabled={disabled}
            className="scale-75"
          />
          Indoor
        </label>
      </div>
    )
  }

  // Full form for add/edit dialogs
  return (
    <div className="space-y-4">
      {/* Event Selection */}
      <div className="space-y-2">
        <Label htmlFor="event">Event *</Label>
        <Select
          value={data.eventId?.toString() ?? ""}
          onValueChange={(v) => onChange({ ...data, eventId: parseInt(v) })}
          disabled={disabled || loadingEvents}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingEvents ? "Loading..." : "Select event"} />
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

      {/* Result + Indoor toggle row */}
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="result">Result ({unitLabel}) *</Label>
          <Input
            id="result"
            type="number"
            step="0.01"
            min="0"
            placeholder={isFieldEvent ? "e.g., 7.85" : "e.g., 10.52"}
            value={data.value ?? ""}
            onChange={(e) =>
              onChange({ ...data, value: e.target.value ? parseFloat(e.target.value) : null })
            }
            disabled={disabled}
          />
        </div>
        <label className="flex items-center gap-2 pb-2">
          <Switch
            checked={data.indoor}
            onCheckedChange={(checked) => onChange({ ...data, indoor: checked, wind: checked ? null : data.wind })}
            disabled={disabled}
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
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          disabled={disabled}
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
            value={data.wind ?? ""}
            onChange={(e) =>
              onChange({ ...data, wind: e.target.value ? parseFloat(e.target.value) : null })
            }
            disabled={disabled}
          />
          {data.wind !== null && data.wind > 2.0 && (
            <p className="text-xs text-amber-600">Wind-assisted ({">"} +2.0 m/s)</p>
          )}
        </div>
      )}
    </div>
  )
}
