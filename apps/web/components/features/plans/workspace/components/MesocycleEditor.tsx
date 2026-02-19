"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2 } from "lucide-react"
import { usePlanContext } from "../context/PlanContext"
import { useTerminology } from "@/lib/terminology"

interface MesocycleEditorProps {
  mesocycleId: number
  onMicrocycleSelect: (id: number) => void
  onViewModeChange: (mode: 'meso' | 'micro' | 'macro') => void
}

export function MesocycleEditor({
  mesocycleId,
  onMicrocycleSelect,
  onViewModeChange
}: MesocycleEditorProps) {
  const { plan } = usePlanContext()
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')
  const terms = useTerminology()

  const mesocycle = plan?.mesocycles.find(m => m.id === mesocycleId)

  if (!mesocycle) {
    return <div>{terms.mesocycle} not found</div>
  }

  const totalSessions = mesocycle.microcycles.reduce((acc, micro) => acc + micro.sessions.length, 0)
  const totalVolume = mesocycle.microcycles.reduce((acc, micro) => 
    acc + micro.sessions.reduce((acc2, session) => acc2 + session.volume, 0), 0)
  const avgIntensity = mesocycle.microcycles.reduce((acc, micro) => 
    acc + micro.sessions.reduce((acc2, session) => acc2 + session.intensity, 0), 0) / totalSessions

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{mesocycle.name}</h2>
          <p className="text-sm text-muted-foreground">{mesocycle.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editingMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditingMode(editingMode === 'edit' ? 'view' : 'edit')}
          >
            <Edit className="h-4 w-4 mr-1" />
            {editingMode === 'edit' ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="text-lg font-semibold">{mesocycle.microcycles.length} weeks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Sessions</div>
            <div className="text-lg font-semibold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Volume</div>
            <div className="text-lg font-semibold">{totalVolume}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Avg Intensity</div>
            <div className="text-lg font-semibold">{avgIntensity.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Microcycle Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Training Weeks</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mesocycle.microcycles.map((micro) => (
            <Card 
              key={micro.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                onMicrocycleSelect(micro.id)
                onViewModeChange('micro')
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{micro.name}</CardTitle>
                  {editingMode === 'edit' && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{micro.description}</div>
                  
                  {/* Session Summary */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {micro.sessions.length} sessions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Vol: {micro.sessions.reduce((acc, session) => acc + session.volume, 0)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Int: {(micro.sessions.reduce((acc, session) => acc + session.intensity, 0) / micro.sessions.length).toFixed(1)}
                    </Badge>
                  </div>

                  {/* Session Types */}
                  <div className="flex items-center gap-1">
                    {micro.sessions.map((session, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          session.type === 'speed' ? 'bg-red-500' :
                          session.type === 'strength' ? 'bg-blue-500' :
                          session.type === 'endurance' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}
                        title={`${session.name} (${session.type})`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  )
}
