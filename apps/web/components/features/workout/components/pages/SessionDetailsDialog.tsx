/**
 * Session Details Dialog Component
 * Shows detailed view of completed workout session with all exercises and sets
 */

"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Target, CheckCircle, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkoutLogWithDetails } from "@/types/training"
import { format } from "date-fns"

interface SessionDetailsDialogProps {
  session: WorkoutLogWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Define all possible columns with their display info
const ALL_COLUMNS = [
  { key: 'reps', label: 'Reps', unit: '' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'distance', label: 'Distance', unit: 'm' },
  { key: 'performing_time', label: 'Time', unit: 's' },
  { key: 'velocity', label: 'Velocity', unit: 'm/s' },
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'power', label: 'Power', unit: 'W' },
  { key: 'rest_time', label: 'Rest', unit: 's' },
  { key: 'rpe', label: 'RPE', unit: '' },
  { key: 'effort', label: 'Effort', unit: '%' },
  { key: 'resistance', label: 'Resistance', unit: '' },
  { key: 'tempo', label: 'Tempo', unit: '' },
] as const

// Helper to determine which columns have data for a set of details
function getActiveColumns(details: any[]) {
  return ALL_COLUMNS.filter(col =>
    details.some(d => d[col.key] !== null && d[col.key] !== undefined && d[col.key] !== '')
  )
}

export function SessionDetailsDialog({ session, open, onOpenChange }: SessionDetailsDialogProps) {
  if (!session) return null

  const sessionData = session as any
  const sessionDate = sessionData.date_time ? new Date(sessionData.date_time) : new Date()

  // Use workout_log_exercises (actual completed data) if available,
  // fallback to session_plan_exercises (planned data) for older sessions
  const exercises = sessionData.workout_log_exercises?.length > 0
    ? sessionData.workout_log_exercises
    : sessionData.session_plan?.session_plan_exercises || []

  // Determine if we're showing actual workout data or planned data
  const isActualWorkoutData = sessionData.workout_log_exercises?.length > 0

  // Calculate session stats using the appropriate sets field
  const totalSets = exercises.reduce((sum: number, ex: any) => {
    const sets = isActualWorkoutData ? ex.workout_log_sets : ex.session_plan_sets
    return sum + (sets?.length || 0)
  }, 0)

  const completedSets = exercises.reduce((sum: number, ex: any) => {
    const sets = isActualWorkoutData ? ex.workout_log_sets : ex.session_plan_sets
    return sum + (sets || []).filter((d: any) => d.completed).length
  }, 0)

  const sessionDuration = sessionData.duration || 0 // in minutes
  const totalVolume = exercises.reduce((sum: number, ex: any) => {
    const sets = isActualWorkoutData ? ex.workout_log_sets : ex.session_plan_sets
    return sum + (sets || []).reduce((exSum: number, d: any) => {
      const weight = d.weight || 0
      const reps = d.reps || 0
      return exSum + (weight * reps)
    }, 0)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Session Details</DialogTitle>
          <DialogDescription>
            Completed on {format(sessionDate, "MMMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Target className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{exercises.length}</div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{completedSets}/{totalSets}</div>
                  <div className="text-xs text-muted-foreground">Sets Done</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Clock className="h-8 w-8 text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">{sessionDuration}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                  <div className="text-2xl font-bold">{Math.round(totalVolume)}</div>
                  <div className="text-xs text-muted-foreground">Total Volume (kg)</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises</h3>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground">No exercises recorded for this session.</p>
            ) : (
              exercises.map((exercise: any, index: number) => {
                // Use workout_log_sets for actual data, session_plan_sets for planned
                const details = isActualWorkoutData
                  ? exercise.workout_log_sets || []
                  : exercise.session_plan_sets || []
                const exerciseName = exercise.exercise?.name || `Exercise ${index + 1}`

                return (
                  <Card key={exercise.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{exerciseName}</CardTitle>
                        <Badge variant="outline">
                          {details.filter((d: any) => d.completed).length}/{details.length} sets
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {details.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sets recorded</p>
                      ) : (
                        <div className="overflow-x-auto">
                          {(() => {
                            // Determine which columns have data for this exercise
                            const activeColumns = getActiveColumns(details)
                            return (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 px-2">Set</th>
                                    {activeColumns.map(col => (
                                      <th key={col.key} className="text-center py-2 px-2">
                                        {col.label}{col.unit ? ` (${col.unit})` : ''}
                                      </th>
                                    ))}
                                    <th className="text-center py-2 px-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.map((detail: any, setIndex: number) => (
                                    <tr
                                      key={detail.id}
                                      className="border-b"
                                    >
                                      <td className="py-2 px-2 font-medium">{setIndex + 1}</td>
                                      {activeColumns.map(col => (
                                        <td key={col.key} className="py-2 px-2 text-center">
                                          {detail[col.key] !== null && detail[col.key] !== undefined
                                            ? (typeof detail[col.key] === 'number'
                                                ? Number(detail[col.key]).toFixed(col.key === 'velocity' ? 2 : 0)
                                                : detail[col.key])
                                            : "-"}
                                        </td>
                                      ))}
                                      <td className="py-2 px-2 text-center">
                                        {detail.completed ? (
                                          <Badge variant="default" className="bg-green-500 text-white">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Done
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline">Skipped</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Session Notes */}
          {sessionData.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {sessionData.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
