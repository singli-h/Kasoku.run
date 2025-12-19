"use client"

import { Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SessionExercise, SessionChange } from "./types"
import { ExerciseCardInline } from "./ExerciseCardInline"

interface SupersetContainerProps {
  exercises: SessionExercise[]
  changes: SessionChange[]
}

export function SupersetContainer({ exercises, changes }: SupersetContainerProps) {
  // Get change for each exercise
  const getChangeForExercise = (exerciseId: string) =>
    changes.find((c) => c.targetExerciseId === exerciseId)

  // Check if any exercise in superset has changes
  const hasChanges = exercises.some((ex) => getChangeForExercise(ex.id))

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-transparent p-3",
        hasChanges && "border-blue-300"
      )}
    >
      {/* Superset Header */}
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
          Superset
        </span>
        <span className="text-xs text-muted-foreground">
          {exercises.length} exercises
        </span>
      </div>

      {/* Exercises */}
      <div className="space-y-2">
        {exercises.map((exercise) => {
          const change = getChangeForExercise(exercise.id)
          return (
            <div key={exercise.id} className="relative">
              {/* Superset Label */}
              {exercise.supersetLabel && (
                <div className="absolute -left-1 top-3 z-10">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                    {exercise.supersetLabel}
                  </span>
                </div>
              )}
              <div className="pl-5">
                <ExerciseCardInline exercise={exercise} change={change} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
