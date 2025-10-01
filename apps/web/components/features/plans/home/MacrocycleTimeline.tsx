"use client"

//
import { Trophy, Flag } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface MacrocyclePhase {
  id: string
  name: string
  color: string
  startWeek: number
  endWeek: number
  volume: number[]
  intensity: number[]
}

export interface RaceAnchor {
  id: string
  name: string
  date: string
  week: number
  isPrimary: boolean
}

interface MacrocycleTimelineProps {
  phases: MacrocyclePhase[]
  raceAnchors: RaceAnchor[]
  selectedPhaseId?: string
  onPhaseClick: (phaseId: string | undefined) => void
  className?: string
}

export function MacrocycleTimeline({
  phases,
  raceAnchors,
  selectedPhaseId,
  onPhaseClick,
  className
}: MacrocycleTimelineProps) {
  const totalWeeks = Math.max(...phases.map(p => p.endWeek))

  return (
    <div className={cn("space-y-4", className)}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Training Timeline</h3>
        <span className="text-xs text-muted-foreground">{totalWeeks} weeks</span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Bar */}
        <div className="relative h-8 rounded-lg overflow-hidden">
          {phases.map((phase) => {
            const startPercent = ((phase.startWeek - 1) / totalWeeks) * 100
            const endPercent = (phase.endWeek / totalWeeks) * 100
            const width = endPercent - startPercent

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseClick(selectedPhaseId === phase.id ? undefined : phase.id)}
                className={cn(
                  "absolute top-0 h-full transition-all duration-200",
                  "focus:outline-none",
                  selectedPhaseId === phase.id
                    ? "brightness-110 saturate-150 shadow-md z-10"
                    : "hover:brightness-105"
                )}
                style={{
                  left: `${startPercent}%`,
                  width: `${width}%`,
                  backgroundColor: phase.color,
                  zIndex: selectedPhaseId === phase.id ? 10 : 1
                }}
                aria-label={`${phase.name} phase (weeks ${phase.startWeek}-${phase.endWeek})`}
              >
                <span className="sr-only">{phase.name}</span>
              </button>
            )
          })}

          {/* Race Anchors */}
          <TooltipProvider>
            {raceAnchors.map((anchor) => {
              const position = ((anchor.week - 1) / totalWeeks) * 100
              
              return (
                <Tooltip key={anchor.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer z-20 hover:scale-110 transition-transform"
                      style={{ left: `${position}%` }}
                    >
                      <div className="relative">
                        {/* Filled circle background */}
                        <div className="absolute inset-0 bg-white rounded-full shadow-md"></div>
                        {/* Icon */}
                        <div className="relative flex items-center justify-center w-6 h-6">
                          {anchor.isPrimary ? (
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Flag className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900 text-white text-xs p-2">
                    <div className="space-y-1">
                      <div className="font-medium">{anchor.name}</div>
                      <div className="text-gray-300">{anchor.date}</div>
                      {anchor.isPrimary && (
                        <div className="text-yellow-300 text-xs">Primary Race</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </div>

        {/* Phase Labels */}
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {phases.map((phase) => {
            const startPercent = ((phase.startWeek - 1) / totalWeeks) * 100
            const endPercent = ((phase.endWeek - 1) / totalWeeks) * 100
            const centerPercent = (startPercent + endPercent) / 2

            return (
              <span
                key={phase.id}
                className="font-medium"
                style={{ left: `${centerPercent}%`, transform: 'translateX(-50%)' }}
              >
                {phase.name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
