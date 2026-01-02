"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { usePlanContext } from "../context/PlanContext"

interface ExercisePlanningPanelProps {
  sessionId: string
}

export function ExercisePlanningPanel({ sessionId }: ExercisePlanningPanelProps) {
  const { plan } = usePlanContext()
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')

  // Find the session
  const session = plan?.mesocycles
    .flatMap(meso => meso.microcycles)
    .flatMap(micro => micro.sessions)
    .find(s => s.id === sessionId)

  if (!session) {
    return <div>Session not found</div>
  }

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'speed': return 'bg-red-500'
      case 'strength': return 'bg-blue-500'
      case 'endurance': return 'bg-green-500'
      case 'recovery': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  // TODO: Replace with actual exercise library data from Supabase
  const exerciseLibrary: Array<{ id: number; name: string; description?: string; sets?: number; reps?: number; weight?: number }> = [
    // This will be populated from getExercisesAction()
  ]

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSessionTypeColor(session.type)}`} />
              <CardTitle className="text-base">{session.name}</CardTitle>
            </div>
            <Button
              variant={editingMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditingMode(editingMode === 'edit' ? 'view' : 'edit')}
            >
              {editingMode === 'edit' ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <div className="text-sm font-medium">{session.duration} minutes</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <div className="text-sm font-medium capitalize">{session.type}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <div className="text-sm font-medium">{session.volume}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Intensity</Label>
              <div className="text-sm font-medium">{session.intensity}/10</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Library */}
      {editingMode === 'edit' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Exercise Library</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {exerciseLibrary.map((exercise, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    // TODO: Add exercise to session
                    console.log('Add exercise:', exercise)
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{exercise.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {exercise.sets}x{exercise.reps}
                      {exercise.weight && ` @ ${exercise.weight}lbs`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Exercises */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Exercises</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {session.exercises.map((exercise, idx) => (
              <div
                key={idx}
                className="p-3 border rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{exercise.name}</span>
                  </div>
                  {editingMode === 'edit' && (
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sets</Label>
                    {editingMode === 'edit' ? (
                      <Input
                        type="number"
                        value={exercise.sets}
                        className="text-xs"
                        onChange={(e) => {
                          // TODO: Update exercise sets
                          console.log('Update sets:', e.target.value)
                        }}
                      />
                    ) : (
                      <div className="text-sm">{exercise.sets}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reps</Label>
                    {editingMode === 'edit' ? (
                      <Input
                        value={exercise.reps}
                        className="text-xs"
                        onChange={(e) => {
                          // TODO: Update exercise reps
                          console.log('Update reps:', e.target.value)
                        }}
                      />
                    ) : (
                      <div className="text-sm">{exercise.reps}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Weight</Label>
                    {editingMode === 'edit' ? (
                      <Input
                        type="number"
                        value={exercise.weight || ''}
                        className="text-xs"
                        placeholder="lbs"
                        onChange={(e) => {
                          // TODO: Update exercise weight
                          console.log('Update weight:', e.target.value)
                        }}
                      />
                    ) : (
                      <div className="text-sm">{exercise.weight ? `${exercise.weight}lbs` : '-'}</div>
                    )}
                  </div>
                </div>
                
                {exercise.notes && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    {editingMode === 'edit' ? (
                      <Textarea
                        value={exercise.notes}
                        className="text-xs"
                        rows={2}
                        onChange={(e) => {
                          // TODO: Update exercise notes
                          console.log('Update notes:', e.target.value)
                        }}
                      />
                    ) : (
                      <div className="text-sm">{exercise.notes}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Session Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {editingMode === 'edit' ? (
            <Textarea
              placeholder="Add coaching notes, cues, or modifications..."
              rows={3}
              className="text-sm"
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              No notes added yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
