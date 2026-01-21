"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Edit, Trash2, Move } from "lucide-react"
import { usePlanContext } from "../context/PlanContext"
import { useTerminology } from "@/lib/terminology"

interface MicrocycleEditorProps {
  microcycleId: number
  onSessionSelect: (id: string) => void
  onViewModeChange: (mode: 'meso' | 'micro' | 'macro') => void
}

export function MicrocycleEditor({
  microcycleId,
  onSessionSelect,
  onViewModeChange
}: MicrocycleEditorProps) {
  const { plan } = usePlanContext()
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')
  const terms = useTerminology()

  // Find the microcycle
  const microcycle = plan?.mesocycles
    .flatMap(meso => meso.microcycles)
    .find(micro => micro.id === microcycleId)

  if (!microcycle) {
    return <div>{terms.microcycle} not found</div>
  }

  const totalSessions = microcycle.sessions.length
  const totalVolume = microcycle.sessions.reduce((acc, session) => acc + session.volume, 0)
  const avgIntensity = microcycle.sessions.reduce((acc, session) => acc + session.intensity, 0) / totalSessions
  const totalDuration = microcycle.sessions.reduce((acc, session) => acc + session.duration, 0)

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'speed': return 'bg-red-500'
      case 'strength': return 'bg-blue-500'
      case 'power': return 'bg-orange-500'
      case 'hypertrophy': return 'bg-purple-500'
      case 'endurance': return 'bg-green-500'
      case 'mobility': return 'bg-cyan-500'
      case 'recovery': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'speed': return 'S'
      case 'strength': return 'ST'
      case 'power': return 'P'
      case 'hypertrophy': return 'H'
      case 'endurance': return 'E'
      case 'mobility': return 'M'
      case 'recovery': return 'R'
      default: return '?'
    }
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('meso')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Mesocycle
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{microcycle.name}</h2>
            <p className="text-sm text-muted-foreground">{microcycle.description}</p>
          </div>
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
            <div className="text-sm text-muted-foreground">Intensity</div>
            <div className="text-lg font-semibold">{avgIntensity.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="text-lg font-semibold">{totalDuration}min</div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Weekly Schedule</h3>
          {editingMode === 'edit' && (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Session
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, dayIndex) => {
            const daySessions = microcycle.sessions.filter(session => session.day === dayIndex + 1)
            
            return (
              <Card key={day} className="min-h-[120px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">{day}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {daySessions.length === 0 ? (
                      <div className="text-center">
                        {editingMode === 'edit' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              // TODO: Add session creation logic
                              console.log(`Add session for ${day}`)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground">Rest</div>
                        )}
                      </div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-2 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                            getSessionTypeColor(session.type)
                          } text-white text-xs`}
                          onClick={() => onSessionSelect(session.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{getSessionTypeIcon(session.type)}</span>
                            {editingMode === 'edit' && (
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                  <Move className="h-2 w-2" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="font-medium">{session.name}</div>
                          <div className="text-xs opacity-80">
                            {session.duration}min
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                              Vol: {session.volume}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                              Int: {session.intensity}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {microcycle.sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getSessionTypeColor(session.type)}`} />
                  <span className="font-medium text-sm">{session.name}</span>
                  <span className="text-xs text-muted-foreground">Day {session.day}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{session.duration}min</span>
                  <span>Vol: {session.volume}</span>
                  <span>Int: {session.intensity}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
