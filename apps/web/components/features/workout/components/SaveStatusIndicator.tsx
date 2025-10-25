/**
 * Save Status Indicator
 * Shows the current auto-save status for workout performance data
 */

"use client"

import { Cloud, CloudOff, Loader2, Check } from "lucide-react"
import { useExerciseContext, type SaveStatus } from "../context/exercise-context"
import { cn } from "@/lib/utils"

export function SaveStatusIndicator() {
  const { saveStatus } = useExerciseContext()

  if (saveStatus === 'idle') return null

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
      "transition-all duration-200",
      saveStatus === 'saving' && "bg-blue-50 border border-blue-200 text-blue-700",
      saveStatus === 'saved' && "bg-green-50 border border-green-200 text-green-700",
      saveStatus === 'error' && "bg-red-50 border border-red-200 text-red-700"
    )}>
      {saveStatus === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Saving...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Saved</span>
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <CloudOff className="h-4 w-4" />
          <span className="text-sm font-medium">Save failed - retrying...</span>
        </>
      )}
    </div>
  )
}
