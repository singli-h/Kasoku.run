"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { usePlanContext } from "../context/PlanContext"
import { useTerminology } from "@/lib/terminology"
import { abbreviateEventGroup } from "@/lib/training-utils"

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
                        <div className="text-xs text-muted-foreground">Rest</div>
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
                          </div>
                          <div className="font-medium">{session.name}</div>
                          {/* Exercise preview (T012) */}
                          {session.exerciseNames && session.exerciseNames.length > 0 ? (
                            <div className="text-xs opacity-80 truncate">
                              {session.exerciseNames.slice(0, 2).join(', ')}
                              {session.exerciseNames.length > 2 ? '...' : ''}
                            </div>
                          ) : (
                            <div className="text-xs opacity-60">No exercises</div>
                          )}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {session.volume > 0 ? (
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                                {session.volume} {session.volumeUnit ?? 'kg'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                                {'Vol: \u2014'}
                              </Badge>
                            )}
                            {/* Subgroup dots (T021) */}
                            {session.targetEventGroups && session.targetEventGroups.length > 0 && (() => {
                              const unique = [...new Set(session.targetEventGroups!.flat())]
                              if (unique.length === 0) return null
                              return (
                                <div className="flex items-center gap-0.5">
                                  {unique.slice(0, 3).map(g => (
                                    <span key={g} className="w-2 h-2 rounded-full bg-white/50" title={abbreviateEventGroup(g)} />
                                  ))}
                                </div>
                              )
                            })()}
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
                  {/* Subgroup dots alongside type dot (T021) */}
                  {session.targetEventGroups && session.targetEventGroups.length > 0 && (() => {
                    const unique = [...new Set(session.targetEventGroups!.flat())]
                    return unique.slice(0, 3).map(g => (
                      <div key={g} className="w-2 h-2 rounded-full bg-muted-foreground/40" title={abbreviateEventGroup(g)} />
                    ))
                  })()}
                  <span className="font-medium text-sm">{session.name}</span>
                  <span className="text-xs text-muted-foreground">Day {session.day}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {session.duration > 0 && <span>{Math.round(session.duration / 60)}min</span>}
                  {session.volume > 0 ? (
                    <span>{session.volume} {session.volumeUnit ?? 'kg'}</span>
                  ) : (
                    <span>{'Vol: \u2014'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
