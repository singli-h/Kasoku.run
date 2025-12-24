/**
 * Session Details Dialog Component
 * Shows detailed view of completed workout session with all exercises and sets
 */

"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Target, CheckCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkoutLogWithDetails } from "@/types/training"
import { format } from "date-fns"

interface SessionDetailsDialogProps {
  session: WorkoutLogWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailsDialog({ session, open, onOpenChange }: SessionDetailsDialogProps) {
  if (!session) return null

  const sessionData = session as any
  const sessionDate = sessionData.date_time ? new Date(sessionData.date_time) : new Date()
  const exercises = sessionData.session_plan?.session_plan_exercises || []

  // Calculate session stats
  const totalSets = exercises.reduce((sum: number, ex: any) => {
    return sum + (ex.session_plan_sets?.length || 0)
  }, 0)

  const completedSets = exercises.reduce((sum: number, ex: any) => {
    const details = ex.session_plan_sets || []
    return sum + details.filter((d: any) => d.completed).length
  }, 0)

  const sessionDuration = sessionData.duration || 0 // in minutes
  const totalVolume = exercises.reduce((sum: number, ex: any) => {
    const details = ex.session_plan_sets || []
    return sum + details.reduce((exSum: number, d: any) => {
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
                const details = exercise.session_plan_sets || []
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
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Set</th>
                                <th className="text-center py-2 px-2">Reps</th>
                                <th className="text-center py-2 px-2">Weight (kg)</th>
                                <th className="text-center py-2 px-2">Rest (s)</th>
                                <th className="text-center py-2 px-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.map((detail: any, setIndex: number) => (
                                <tr
                                  key={detail.id}
                                  className={cn(
                                    "border-b",
                                    detail.completed && "bg-green-50"
                                  )}
                                >
                                  <td className="py-2 px-2 font-medium">{setIndex + 1}</td>
                                  <td className="py-2 px-2 text-center">{detail.reps || "-"}</td>
                                  <td className="py-2 px-2 text-center">{detail.weight || "-"}</td>
                                  <td className="py-2 px-2 text-center">{detail.rest_time || "-"}</td>
                                  <td className="py-2 px-2 text-center">
                                    {detail.completed ? (
                                      <Badge variant="default" className="bg-green-500">
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
