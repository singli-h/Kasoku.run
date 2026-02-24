"use client"

import { Timer, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SessionCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  completedSets: number
  totalSets: number
  completedExercises: number
  totalExercises: number
  elapsedSeconds: number
}

/**
 * SessionCompletionModal - Modal for finishing a workout session
 *
 * Shows:
 * - Completion status (full or partial)
 * - Session stats (duration, sets, exercises)
 * - Confirmation buttons
 */
export function SessionCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  completedSets,
  totalSets,
  completedExercises,
  totalExercises,
  elapsedSeconds
}: SessionCompletionModalProps) {
  if (!isOpen) return null

  const isPartial = completedSets < totalSets
  const completionPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          isPartial ? "bg-yellow-500/10" : "bg-green-500/10"
        )}>
          {isPartial ? (
            <Timer className="w-8 h-8 text-yellow-500" />
          ) : (
            <Trophy className="w-8 h-8 text-green-500" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-2">
          {isPartial ? "Finish Early?" : "Great Workout!"}
        </h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isPartial
            ? `You've completed ${completionPercent}% of your planned workout. Save what you've done?`
            : "You crushed it! All sets completed."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatTime(elapsedSeconds)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{completedExercises}/{totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors"
          >
            {isPartial ? "Keep Going" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
              isPartial
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {isPartial ? "Save & Finish" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  )
}
