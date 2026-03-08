"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Flag } from "lucide-react"

interface Mesocycle {
  id: number
  name: string | null
  start_date: string | null
  end_date: string | null
  metadata: Record<string, unknown> | null
  microcycles: Array<{
    id: number
    name: string | null
    start_date: string | null
    end_date: string | null
  }>
}

interface Event {
  id: number
  name: string | null
  category: string | null
  created_at: string | null
}

interface TimelineScrubberProps {
  mesocycles: Mesocycle[]
  events: Event[]
  activeMesocycleId: number | null
  activeMicrocycleId: number | null
  onMesocycleSelect: (id: number) => void
  onMicrocycleSelect: (id: number) => void
}

export function TimelineScrubber({
  mesocycles,
  events,
  activeMesocycleId,
  activeMicrocycleId,
  onMesocycleSelect,
  onMicrocycleSelect,
}: TimelineScrubberProps) {
  const [zoomLevel, setZoomLevel] = useState<'macro' | 'meso' | 'micro'>('meso')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  const getEventIcon = (category: string | null) => {
    switch (category) {
      case "competition":
        return "🏆"
      default:
        return "🏃"
    }
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Timeline</h3>
          <div className="flex items-center gap-1">
            <Button
              variant={zoomLevel === 'macro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoomLevel('macro')}
              className="text-xs"
            >
              Macro
            </Button>
            <Button
              variant={zoomLevel === 'meso' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoomLevel('meso')}
              className="text-xs"
            >
              Meso
            </Button>
            <Button
              variant={zoomLevel === 'micro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoomLevel('micro')}
              className="text-xs"
            >
              Micro
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Race Events */}
        <div className="flex gap-2 mb-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs"
            >
              <span>{getEventIcon(event.category)}</span>
              <span className="font-medium">{event.name}</span>
              <span className="text-muted-foreground">
                {formatDate(event.created_at)}
              </span>
            </div>
          ))}
        </div>

        {/* Phase Timeline */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {mesocycles.map((meso) => (
            <div key={meso.id} className="flex-shrink-0">
              <div
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  activeMesocycleId === meso.id 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onMesocycleSelect(meso.id)}
                style={{ backgroundColor: (meso.metadata?.color as string) + '20' }}
              >
                <div className="text-xs font-medium">{meso.name}</div>
                <div className="text-xs text-muted-foreground">
                  {meso.microcycles.length}w
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(meso.start_date)} - {formatDate(meso.end_date)}
                </div>
              </div>
              
              {/* Microcycle Sub-timeline */}
              {zoomLevel === 'micro' && activeMesocycleId === meso.id && (
                <div className="mt-2 flex gap-1">
                  {meso.microcycles.map((micro) => (
                    <div
                      key={micro.id}
                      className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                        activeMicrocycleId === micro.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => onMicrocycleSelect(micro.id)}
                    >
                      {micro.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Position Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Current:</span>
        {activeMesocycleId && (
          <Badge variant="outline" className="text-xs">
            {mesocycles.find(m => m.id === activeMesocycleId)?.name}
          </Badge>
        )}
        {activeMicrocycleId && (
          <>
            <span>→</span>
            <Badge variant="secondary" className="text-xs">
              {mesocycles
                .find(m => m.id === activeMesocycleId)
                ?.microcycles.find(m => m.id === activeMicrocycleId)?.name}
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}
