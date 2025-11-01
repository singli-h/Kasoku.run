/*
<ai_context>
SprintSessionSpreadsheet - Main data entry table for coach group sprint sessions.
Spreadsheet-style layout with athletes as rows, sets as columns.
Integrates auto-save, PB detection, and target calculation.
Supports keyboard navigation (arrow keys) for efficient data entry.
</ai_context>
*/

"use client"

import { useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { TimeInputCell } from "./time-input-cell"
import { useSessionData, useAutoSave } from "../hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface SprintSessionSpreadsheetProps {
  sessionId: number
  effort?: number // Default effort level for target calculation (0-1)
}

export function SprintSessionSpreadsheet({
  sessionId,
  effort = 0.95
}: SprintSessionSpreadsheetProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  // Fetch session data
  const { data, isLoading, error, updatePerformanceLocal } = useSessionData({
    sessionId
  })

  // Auto-save hook
  const { queueUpdate, saveNow, hasPendingUpdates } = useAutoSave({
    debounceMs: 2000,
    onSaveSuccess: () => {
      console.log('[SprintSessionSpreadsheet] Auto-save successful')
    },
    onSaveError: (error) => {
      console.error('[SprintSessionSpreadsheet] Auto-save error:', error)
    }
  })

  const handleTimeChange = useCallback((
    athleteId: number,
    exerciseId: number,
    setIndex: number,
    value: number | null
  ) => {
    // Update local state immediately (optimistic)
    updatePerformanceLocal(athleteId, exerciseId, setIndex, value)

    // Queue for auto-save
    queueUpdate(sessionId, athleteId, exerciseId, setIndex, value)
  }, [sessionId, updatePerformanceLocal, queueUpdate])

  const handleManualSave = () => {
    saveNow()
  }

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    athleteIndex: number,
    exerciseIndex: number,
    setIndex: number
  ) => {
    if (!data) return

    const totalAthletes = data.athletes.length
    const totalExercises = data.exercises.length
    const totalSets = data.exercises[exerciseIndex]?.sets || 1

    let nextAthleteIndex = athleteIndex
    let nextExerciseIndex = exerciseIndex
    let nextSetIndex = setIndex

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault()
        nextSetIndex++
        if (nextSetIndex >= totalSets) {
          nextSetIndex = 0
          nextExerciseIndex++
          if (nextExerciseIndex >= totalExercises) {
            nextExerciseIndex = 0
            nextAthleteIndex++
            if (nextAthleteIndex >= totalAthletes) {
              nextAthleteIndex = 0
            }
          }
        }
        break

      case "ArrowLeft":
        e.preventDefault()
        nextSetIndex--
        if (nextSetIndex < 0) {
          nextExerciseIndex--
          if (nextExerciseIndex < 0) {
            nextAthleteIndex--
            if (nextAthleteIndex < 0) {
              nextAthleteIndex = totalAthletes - 1
            }
            nextExerciseIndex = totalExercises - 1
          }
          nextSetIndex = data.exercises[nextExerciseIndex]?.sets - 1 || 0
        }
        break

      case "ArrowDown":
        e.preventDefault()
        nextAthleteIndex++
        if (nextAthleteIndex >= totalAthletes) {
          nextAthleteIndex = 0
        }
        break

      case "ArrowUp":
        e.preventDefault()
        nextAthleteIndex--
        if (nextAthleteIndex < 0) {
          nextAthleteIndex = totalAthletes - 1
        }
        break

      case "Enter":
        e.preventDefault()
        // Move to next row, same column
        nextAthleteIndex++
        if (nextAthleteIndex >= totalAthletes) {
          nextAthleteIndex = 0
          nextSetIndex++
          if (nextSetIndex >= totalSets) {
            nextSetIndex = 0
            nextExerciseIndex++
            if (nextExerciseIndex >= totalExercises) {
              nextExerciseIndex = 0
            }
          }
        }
        break

      default:
        return
    }

    // Focus next input
    const nextKey = `${nextAthleteIndex}-${nextExerciseIndex}-${nextSetIndex}`
    const nextInput = inputRefs.current.get(nextKey)
    if (nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || "Failed to load session data"}
        </AlertDescription>
      </Alert>
    )
  }

  const { session, athletes, exercises, performanceData, personalBests } = data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{session.name}</CardTitle>
            <CardDescription>
              {new Date(session.date).toLocaleDateString()} • {athletes.length} athletes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingUpdates && (
              <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Auto-saving...
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={!hasPendingUpdates}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-gray-300 bg-gray-50 p-3 text-left text-sm font-semibold">
                  Athlete
                </th>
                {exercises.map((exercise, exIdx) => (
                  <th
                    key={exercise.id}
                    className="border-b-2 border-gray-300 bg-gray-50 p-3 text-center"
                    colSpan={exercise.sets}
                  >
                    <div className="text-sm font-semibold">{exercise.name}</div>
                    <div className="text-xs text-gray-500">
                      {exercise.distance ? `${exercise.distance}${exercise.unit}` : `${exercise.reps} reps`}
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border-b border-gray-200 bg-gray-50 p-2"></th>
                {exercises.map((exercise) =>
                  Array.from({ length: exercise.sets }, (_, setIdx) => (
                    <th
                      key={`${exercise.id}-set-${setIdx}`}
                      className="border-b border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-500"
                    >
                      Set {setIdx + 1}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete, athleteIdx) => (
                <tr
                  key={athlete.id}
                  className={cn(
                    "hover:bg-gray-50",
                    athleteIdx % 2 === 0 && "bg-white",
                    athleteIdx % 2 === 1 && "bg-gray-50/50"
                  )}
                >
                  <td className="border-b border-gray-200 p-3 font-medium">
                    {athlete.name}
                  </td>
                  {exercises.map((exercise, exIdx) =>
                    Array.from({ length: exercise.sets }, (_, setIdx) => {
                      const key = `${athleteIdx}-${exIdx}-${setIdx}`
                      const performanceValue =
                        performanceData[athlete.id]?.[exercise.id]?.[setIdx + 1]?.performingTime || null
                      const pb = personalBests[athlete.id]?.[exercise.id]

                      return (
                        <td
                          key={key}
                          className="border-b border-gray-200 p-2"
                        >
                          <TimeInputCell
                            ref={(el) => {
                              if (el) {
                                inputRefs.current.set(key, el)
                              } else {
                                inputRefs.current.delete(key)
                              }
                            }}
                            athleteId={athlete.id}
                            exerciseId={exercise.id}
                            setIndex={setIdx + 1}
                            value={performanceValue}
                            onChange={(value) =>
                              handleTimeChange(athlete.id, exercise.id, setIdx + 1, value)
                            }
                            personalBest={pb}
                            effort={effort}
                            onKeyDown={(e) => handleKeyDown(e, athleteIdx, exIdx, setIdx)}
                          />
                        </td>
                      )
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Tip: Use arrow keys to navigate, Enter to move to next row. Times are auto-saved after 2 seconds.</p>
        </div>
      </CardContent>
    </Card>
  )
}
