"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { TimelineScrubber } from "./components/TimelineScrubber"
import { MesocycleEditor } from "./components/MesocycleEditor"
import { MicrocycleEditor } from "./components/MicrocycleEditor"
import { ExercisePlanningPanel } from "./components/ExercisePlanningPanel"
import { RaceDayManager } from "./components/RaceDayManager"
import { AssignmentPanel } from "./components/AssignmentPanel"
import { PlanContextProvider } from "./context/PlanContext"
export function PlanWorkspace({ planId }: { planId?: number }) {
  const [activeMesocycleId, setActiveMesocycleId] = useState<number | null>(null)
  const [activeMicrocycleId, setActiveMicrocycleId] = useState<number | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'meso' | 'micro' | 'macro'>('meso')

  // TODO: Replace with actual data fetching from Supabase
  const plan = useMemo(() => {
    if (!planId) return null
    // This will be replaced with actual data fetching
    return null
  }, [planId])

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">Plan not found</h3>
          <p className="text-sm text-muted-foreground">Plan ID: {planId}</p>
          <p className="text-xs text-muted-foreground mt-2">This component needs to be connected to actual data fetching</p>
        </div>
      </div>
    )
  }

  // TODO: These will be replaced with actual data structure
  const macrocycle: { name?: string } | null = null
  const mesocycles: any[] = []
  const events: any[] = []
  const activeMesocycle: { name?: string; metadata?: { color?: string } } | null = null
  const activeMicrocycle: { name?: string } | null = null

  return (
    <PlanContextProvider
      plan={plan}
      activeMesocycleId={activeMesocycleId}
      activeMicrocycleId={activeMicrocycleId}
      selectedSessionId={selectedSessionId}
      onMesocycleChange={setActiveMesocycleId}
      onMicrocycleChange={setActiveMicrocycleId}
      onSessionChange={setSelectedSessionId}
    >
      <div className="space-y-4">
        {/* Lean Header - Context Bar */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Plans</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{(macrocycle as any)?.name || 'Untitled Plan'}</span>
            </div>
            
            {/* Current Phase Indicator */}
            {activeMesocycle && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{ backgroundColor: (activeMesocycle as any).metadata?.color + '20' }}
                  className="text-xs"
                >
                  {(activeMesocycle as any).name}
                </Badge>
                {activeMicrocycle && (
                  <>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {(activeMicrocycle as any).name}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {mesocycles.length} Phases
            </Badge>
            <Badge variant="outline" className="text-xs">
              {events.length} Races
            </Badge>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="bg-muted/30 rounded-lg p-4">
          <TimelineScrubber
            mesocycles={mesocycles}
            events={events}
            activeMesocycleId={activeMesocycleId}
            activeMicrocycleId={activeMicrocycleId}
            onMesocycleSelect={setActiveMesocycleId}
            onMicrocycleSelect={setActiveMicrocycleId}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-300px)]">
          {/* Left Panel - Phase Selector */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Training Phases</h3>
                  {mesocycles.map((meso: any) => (
                    <div
                      key={meso.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeMesocycleId === meso.id 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveMesocycleId(meso.id)}
                      style={{ borderLeftColor: meso.metadata?.color as string, borderLeftWidth: '4px' }}
                    >
                      <div className="font-medium text-sm">{meso.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {meso.microcycles.length} weeks
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Active Editor */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-y-auto">
                {viewMode === 'meso' && activeMesocycleId && (
                  <MesocycleEditor
                    mesocycleId={activeMesocycleId}
                    onMicrocycleSelect={setActiveMicrocycleId}
                    onViewModeChange={setViewMode}
                  />
                )}
                {viewMode === 'micro' && activeMicrocycleId && (
                  <MicrocycleEditor
                    microcycleId={activeMicrocycleId}
                    onSessionSelect={setSelectedSessionId}
                    onViewModeChange={setViewMode}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Details */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-y-auto">
                {selectedSessionId ? (
                  <ExercisePlanningPanel sessionId={selectedSessionId} />
                ) : (
                  <div className="space-y-4">
                    <RaceDayManager events={events} />
                    <AssignmentPanel planId={planId} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlanContextProvider>
  )
}