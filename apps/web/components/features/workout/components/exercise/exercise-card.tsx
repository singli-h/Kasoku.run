/**
 * Exercise Card Component
 * Individual exercise cards with dynamic table layouts, set-by-set tracking, 
 * video integration, and completion states
 * 
 * Based on the sophisticated exercise card from the original Kasoku workout system
 */

"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Video, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useExerciseContext } from "../../index"
import type { WorkoutExercise } from "../../index"
import type { WorkoutLogSet } from "@/types/training"
// Unused: import { SetTable, getDisplayColumns, DEFAULT_FIELD_CONFIG } from "./set-row"
import { FreeelapMetricsTable } from "./freelap-metrics-table"
import { isFreeelapMetadata } from "@/types/freelap"

interface ExerciseCardProps {
  exercise: WorkoutExercise
  className?: string
  isSuperset?: boolean
}

// Exercise field configuration for dynamic table layout
interface ExerciseField {
  key: keyof WorkoutLogSet
  label: string
  type: 'number' | 'time' | 'text'
  required?: boolean
  unit?: string
  placeholder?: string
}

// Dynamic field detection based on exercise data
// Only include fields that actually exist in the database schema
const EXERCISE_FIELDS: ExerciseField[] = [
  { key: 'reps', label: 'Reps', type: 'number', placeholder: '12' },
  { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', placeholder: '60' },
  { key: 'performing_time', label: 'Duration', type: 'time', unit: 'sec', placeholder: '30' },
  { key: 'distance', label: 'Distance', type: 'number', unit: 'yards', placeholder: '100' },
  { key: 'power', label: 'Power', type: 'number', unit: 'W', placeholder: '200' },
  { key: 'resistance', label: 'Resistance', type: 'number', placeholder: '5' },
  { key: 'effort', label: 'Effort', type: 'number', placeholder: '7' },
  { key: 'rpe', label: 'RPE', type: 'number', placeholder: '7' }
]

export function ExerciseCard({ exercise, className, isSuperset = false }: ExerciseCardProps) {
  const { showVideo, updateExercise, toggleSetComplete } = useExerciseContext()

  // Track which sets are expanded for Freelap details
  const [expandedSetIndices, setExpandedSetIndices] = useState<Set<number>>(new Set())

  // Toggle expansion for a set
  const toggleSetExpansion = useCallback((setIndex: number) => {
    setExpandedSetIndices(prev => {
      const next = new Set(prev)
      if (next.has(setIndex)) {
        next.delete(setIndex)
      } else {
        next.add(setIndex)
      }
      return next
    })
  }, [])


  // Determine which fields to show based on available data
  const availableFields = useMemo(() => {
    const details = exercise.workout_log_sets || []
    const hasData = (field: ExerciseField) => {
      return details.some(detail => detail[field.key] !== null && detail[field.key] !== undefined)
    }

    // Show fields that have data OR common fields for this exercise type
    const fieldsWithData = EXERCISE_FIELDS.filter(hasData)
    
    // Always show basic fields even if no data exists yet
    const basicFields = ['reps', 'weight', 'performing_time'].map(key => 
      EXERCISE_FIELDS.find(f => f.key === key)
    ).filter(Boolean) as ExerciseField[]

    // Combine and dedupe
    const allFields = [...new Set([...fieldsWithData, ...basicFields])]
    return allFields.slice(0, 6) // Limit to 6 fields for clean layout
  }, [exercise.workout_log_sets])

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const details = exercise.workout_log_sets || []
    const totalSets = (exercise as any).sets || details.length || 1
    const completedSets = details.filter(detail => detail.completed).length

    return {
      total: totalSets,
      completed: completedSets,
      percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
      isComplete: completedSets >= totalSets && totalSets > 0
    }
  }, [exercise.workout_log_sets, (exercise as any).sets])

  // Handle set data updates
  const updateSetData = (setIndex: number, field: keyof WorkoutLogSet, value: any) => {
    const updatedDetails = [...(exercise.workout_log_sets || [])]

    // Ensure we have enough detail entries
    while (updatedDetails.length <= setIndex) {
      updatedDetails.push({
        id: '', // Will be set by backend
        workout_log_id: '', // Will be set by backend
        workout_log_exercise_id: '', // Links to workout_log_exercises table
        session_plan_exercise_id: '', // Links to original session plan exercise
        set_index: updatedDetails.length + 1,
        completed: false,
        reps: null,
        weight: null,
        performing_time: null,
        distance: null,
        power: null,
        velocity: null,
        effort: null,
        height: null,
        resistance: null,
        resistance_unit_id: null,
        tempo: null,
        metadata: null,
        rpe: null,
        rest_time: null,
        created_at: null,
        updated_at: null
      })
    }

    // Update the specific field
    updatedDetails[setIndex] = {
      ...updatedDetails[setIndex],
      [field]: value
    }

    // Update exercise with new details
    updateExercise(exercise.id, {
      workout_log_sets: updatedDetails
    })
  }

  // Handle set completion toggle
  const toggleSetCompletion = (setIndex: number) => {
    const detail = exercise.workout_log_sets?.[setIndex]
    if (!detail?.id) return // Need a valid detail ID

    toggleSetComplete(exercise.id, detail.id)
  }


  // Handle overall exercise completion
  const toggleExerciseCompletion = () => {
    updateExercise(exercise.id, { completed: !exercise.completed })
  }

  // Generate sets for display - sort by set_index to ensure correct order
  const sets = useMemo(() => {
    const targetSets = (exercise as any).sets || 3
    const details = exercise.workout_log_sets || []

    // Sort by set_index to ensure correct ordering (database may return in insertion order)
    const sortedDetails = [...details].sort((a, b) => (a.set_index || 0) - (b.set_index || 0))

    return Array.from({ length: Math.max(targetSets, sortedDetails.length) }, (_, index) => ({
      index,
      detail: sortedDetails[index] || null,
      isCompleted: sortedDetails[index]?.completed || false
    }))
  }, [(exercise as any).sets, exercise.workout_log_sets])

  return (
    <div className={cn(
      "transition-all duration-200",
      exercise.completed && "bg-green-50/50 dark:bg-green-900/10",
      isSuperset && "border-l-2 border-l-primary/60 pl-3",
      className
    )}>
      {/* Thin top divider - lean design */}
      <div className="h-px bg-border/40" />

      {/* Header - edge-to-edge lean design */}
      <div className="py-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Exercise Name */}
            <h4 className={cn(
              "font-semibold text-base truncate",
              exercise.completed ? "text-green-700 dark:text-green-400 line-through" : "text-high-contrast"
            )}>
              {exercise.exercise?.name || "Unknown Exercise"}
            </h4>

            {/* Completion Badge - compact */}
            {exercise.completed && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500 text-white">
                <Check className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          {/* Action Buttons - compact */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Video Button - icon only on mobile */}
            {showVideo && ((exercise.exercise as any)?.demo_url || exercise.exercise?.video_url) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const url = exercise.exercise?.video_url || (exercise.exercise as any)?.demo_url
                  if (url) window.open(url, '_blank')
                }}
              >
                <Video className="h-4 w-4" />
              </Button>
            )}

            {/* Complete Toggle - compact circle */}
            <button
              onClick={toggleExerciseCompletion}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                exercise.completed
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {exercise.completed ? <Check className="h-4 w-4" /> : exercise.exercise_order}
            </button>
          </div>
        </div>

        {/* Progress Bar - thinner */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-muted rounded-full h-1">
            <motion.div
              className={cn(
                "h-1 rounded-full",
                exercise.completed ? "bg-green-500" : "bg-primary"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${completionStatus.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
            {completionStatus.completed}/{completionStatus.total}
          </span>
        </div>
      </div>

      {/* Sets - edge-to-edge lean design */}
      {sets.length > 0 && (
        <div className="px-0 pb-2 space-y-0">
          {sets.map((set) => {
            const hasFreeelapData = set.detail && isFreeelapMetadata(set.detail.metadata)
            const isExpanded = expandedSetIndices.has(set.index)

            return (
              <div key={set.index}>
                {/* Set Row - edge-to-edge lean design */}
                <motion.div
                  className={cn(
                    "flex items-center gap-1 py-1.5 px-1 transition-colors",
                    set.isCompleted
                      ? "bg-green-500/5"
                      : isExpanded
                        ? "bg-primary/5 dark:bg-primary/10"
                        : ""
                  )}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: set.index * 0.02 }}
                >
                  {/* Expand indicator - LEFT of set number, larger icon */}
                  <div className="w-5 flex items-center justify-center shrink-0">
                    {hasFreeelapData ? (
                      <button
                        type="button"
                        onClick={() => toggleSetExpansion(set.index)}
                        className="rounded transition-colors"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        aria-expanded={isExpanded}
                      >
                        <span className={cn(
                          "text-base font-medium leading-none",
                          isExpanded ? "text-primary" : "text-muted-foreground"
                        )}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </button>
                    ) : null}
                  </div>

                  {/* Set Number - always aligned */}
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
                    set.isCompleted
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {set.index + 1}
                  </span>

                  {/* Dynamic Fields - horizontal scroll on mobile */}
                  <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0">
                    {availableFields.map((field) => {
                      // Variable width based on field type
                      const inputWidth = field.key === 'reps' ? 'w-7'
                        : field.key === 'weight' ? 'w-9'
                        : field.key === 'distance' ? 'w-8'
                        : 'w-10' // time, power, etc.

                      return (
                        <div
                          key={String(field.key)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5",
                            set.isCompleted ? "bg-green-500/20" : "bg-muted"
                          )}
                        >
                          <Input
                            type={field.type === 'time' ? 'number' : field.type}
                            value={String(set.detail?.[field.key] ?? '')}
                            onChange={(e) => updateSetData(set.index, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className={cn("h-5 text-xs text-center bg-transparent border-0 p-0 focus:ring-0", inputWidth)}
                            disabled={set.isCompleted}
                          />
                          {field.unit && (
                            <span className="text-muted-foreground text-[9px]">{field.unit}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Completion Toggle */}
                  <button
                    onClick={() => toggleSetCompletion(set.index)}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0",
                      set.isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-background border border-border hover:border-primary"
                    )}
                  >
                    {set.isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5 opacity-20" />
                    )}
                  </button>
                </motion.div>

                {/* Freelap Details - Inline lean design */}
                <AnimatePresence mode="wait">
                  {isExpanded && hasFreeelapData && set.detail?.metadata && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      {/* Lean inline sub-row - aligned with set content (skip expand col + index col) */}
                      <div className="ml-10 pl-2 border-l border-primary/30 py-0.5">
                        <FreeelapMetricsTable
                          metadata={set.detail.metadata as Parameters<typeof FreeelapMetricsTable>[0]['metadata']}
                          onMetadataChange={(newMetadata) => {
                            updateSetData(set.index, 'metadata', newMetadata)
                          }}
                          readOnly={set.isCompleted}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Video Embed (if enabled and available) */}
      {showVideo && exercise.exercise?.video_url && (
        <div className="px-2 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const videoUrl = exercise.exercise?.video_url
              if (videoUrl) window.open(videoUrl, '_blank')
            }}
            className="w-full justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Video className="h-4 w-4" />
            <span className="text-xs">Watch Demo</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
} 