"use client"

import { useState, useMemo, useCallback } from "react"
import { Check, Loader2, Plus, Timer, Calendar } from "lucide-react"
import { format, isToday, isYesterday, isTomorrow } from "date-fns"
import { cn } from "@/lib/utils"
import type { TrainingExercise, TrainingSet, ExerciseLibraryItem } from "../types"
import type { UIDisplayType } from "@/lib/changeset/types"

// Save status type (matches ExerciseContext)
export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'
import { groupBySupersets, getCompletedCount } from "../types"
import { ExerciseCard } from "../components/ExerciseCard"

// AI change info type
export interface AIExerciseChangeInfo {
  hasPendingChange: boolean
  changeType: UIDisplayType | null
  setChanges: Map<string | number, { changeType: UIDisplayType }>
  pendingSetCount: number
}
import { SectionDivider } from "../components/SectionDivider"
import { ExercisePickerSheet } from "../components/ExercisePickerSheet"
import { SessionCompletionModal } from "../components/SessionCompletionModal"
import { TimerDisplay } from "../components/TimerDisplay"

export interface WorkoutViewProps {
  /** Session title */
  title: string
  /** Session description */
  description?: string
  /** Session date for display */
  sessionDate?: Date | string | null
  /** List of exercises with sets */
  exercises: TrainingExercise[]
  /** Is this for an athlete (true) or coach (false) */
  isAthlete: boolean
  /** Elapsed seconds for timer */
  elapsedSeconds?: number
  /** Is timer running */
  isTimerRunning?: boolean
  /** Session status */
  sessionStatus?: 'assigned' | 'ongoing' | 'completed'
  /** Save status for showing on buttons */
  saveStatus?: SaveStatus

  // Exercise library for picker
  exerciseLibrary?: ExerciseLibraryItem[]
  recentExerciseIds?: string[]

  // Callbacks
  onToggleTimer?: () => void
  onToggleExpand?: (exerciseId: number | string) => void
  onCompleteSet?: (exerciseId: number | string, setId: number | string) => void
  onCompleteAllSets?: (exerciseId: number | string) => void
  onUpdateSet?: (exerciseId: number | string, setId: number | string, field: keyof TrainingSet, value: number | string | null) => void
  onAddSet?: (exerciseId: number | string) => void
  onRemoveSet?: (exerciseId: number | string, setId: number | string) => void
  onAddExercise?: (exercise: ExerciseLibraryItem, section: string) => void
  onRemoveExercise?: (exerciseId: number | string) => void
  onReorderSets?: (exerciseId: number | string, fromIndex: number, toIndex: number) => void
  onReorderExercises?: (fromId: number | string, toId: number | string) => void
  onFinishSession?: () => void
  onSaveSession?: () => void

  /** AI change info per exercise (keyed by exercise ID) */
  aiChangesByExercise?: Map<string | number, AIExerciseChangeInfo>

  className?: string
}

/**
 * WorkoutView - Main workout session view using unified training components
 *
 * Designed for both athlete workout execution and coach session planning.
 * Uses a clean, mobile-first design with section-based organization.
 */
export function WorkoutView({
  title,
  description,
  sessionDate,
  exercises,
  isAthlete,
  elapsedSeconds = 0,
  isTimerRunning = false,
  sessionStatus = 'ongoing',
  saveStatus = 'idle',
  exerciseLibrary = [],
  recentExerciseIds = [],
  onToggleTimer,
  onToggleExpand,
  onCompleteSet,
  onCompleteAllSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onAddExercise,
  onRemoveExercise,
  onReorderSets,
  onReorderExercises,
  onFinishSession,
  onSaveSession,
  aiChangesByExercise,
  className,
}: WorkoutViewProps) {
  // Format session date for display
  const formattedDate = useMemo(() => {
    if (!sessionDate) return null
    const date = typeof sessionDate === 'string' ? new Date(sessionDate) : sessionDate
    if (isNaN(date.getTime())) return null

    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }, [sessionDate])

  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [draggingExerciseId, setDraggingExerciseId] = useState<string | number | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const completedSets = exercises.reduce((sum, ex) => sum + getCompletedCount(ex), 0)
    const completedExercises = exercises.filter(
      ex => ex.sets.length > 0 && ex.sets.every(s => s.completed)
    ).length

    return {
      totalExercises: exercises.length,
      totalSets,
      completedExercises,
      completedSets,
      progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    }
  }, [exercises])

  // Group consecutive exercises by section (preserves order, detects section changes)
  const exerciseGroups = useMemo(() => {
    if (exercises.length === 0) return []

    // Sort by exerciseOrder to ensure correct sequence
    const sortedExercises = [...exercises].sort((a, b) => a.exerciseOrder - b.exerciseOrder)

    // Group consecutive exercises by section
    const groups: { section: string; exercises: TrainingExercise[] }[] = []
    let currentGroup: { section: string; exercises: TrainingExercise[] } | null = null

    sortedExercises.forEach((exercise) => {
      if (!currentGroup || currentGroup.section !== exercise.section) {
        // Start a new group
        currentGroup = { section: exercise.section, exercises: [exercise] }
        groups.push(currentGroup)
      } else {
        // Add to current group
        currentGroup.exercises.push(exercise)
      }
    })

    return groups
  }, [exercises])

  // Exercise drag handlers
  const handleExerciseDragStart = useCallback((e: React.DragEvent, exerciseId: string | number) => {
    setDraggingExerciseId(exerciseId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(exerciseId))
  }, [])

  const handleExerciseDragEnd = useCallback(() => {
    setDraggingExerciseId(null)
  }, [])

  const handleExerciseDrop = useCallback((e: React.DragEvent, targetExerciseId: string | number) => {
    e.preventDefault()
    if (draggingExerciseId && draggingExerciseId !== targetExerciseId && onReorderExercises) {
      onReorderExercises(draggingExerciseId, targetExerciseId)
    }
    setDraggingExerciseId(null)
  }, [draggingExerciseId, onReorderExercises])

  const handleFinishClick = useCallback(() => {
    setShowCompletionModal(true)
  }, [])

  const handleConfirmFinish = useCallback(() => {
    setShowCompletionModal(false)
    onFinishSession?.()
  }, [onFinishSession])

  const isCompleted = sessionStatus === 'completed'

  return (
    <div className={cn("bg-background min-h-full relative", className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3">
          {/* Title Row with Date */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-base font-semibold">{title}</h1>
            {formattedDate && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-[10px] text-muted-foreground font-medium">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mb-2">{description}</p>
          )}

          {/* Actions Row - Timer LEFT of % complete per FR-052 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Timer positioned LEFT of % complete (FR-052) */}
              {isAthlete && !isCompleted && (
                <button
                  onClick={onToggleTimer}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-mono transition-colors min-w-[80px]",
                    isTimerRunning
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <TimerDisplay seconds={elapsedSeconds} size="sm" />
                </button>
              )}
              {isAthlete ? (
                <span>{stats.progress}% complete</span>
              ) : (
                <span>{stats.totalSets} sets · {stats.totalExercises} exercises</span>
              )}
            </div>

            {/* Save/Finish Buttons */}
            <div className="flex items-center gap-2">
              {!isCompleted && isAthlete && (
                <>
                  {onSaveSession && (
                    <button
                      onClick={onSaveSession}
                      disabled={saveStatus === 'saving'}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5",
                        saveStatus === 'saving' && "opacity-70 cursor-not-allowed",
                        saveStatus === 'saved' ? "bg-green-100 text-green-700" : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      {saveStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {saveStatus === 'saved' && <Check className="w-3.5 h-3.5" />}
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                    </button>
                  )}
                  <button
                    onClick={handleFinishClick}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      stats.progress === 100
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    Finish
                  </button>
                </>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  Completed
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isAthlete && !isCompleted && (
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-2 pb-24">
        {exercises.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No exercises yet</p>
            {!isCompleted && (
              <button
                onClick={() => setShowExercisePicker(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Add Your First Exercise
              </button>
            )}
          </div>
        ) : (
          <>
            {exerciseGroups.map((group, groupIdx) => {
              const grouped = groupBySupersets(group.exercises)

              return (
                <div key={`${group.section}-${groupIdx}`}>
                  {/* Minimal section separator - only show between different sections */}
                  <SectionDivider label={group.section} />
                  <div className="space-y-3 pl-2">
                    {grouped.map((item, idx) => {
                      if (Array.isArray(item)) {
                        // Superset group
                        return (
                          <div key={`superset-${idx}`} className="space-y-3">
                            {item.map((ex, exIdx) => {
                              const aiInfo = aiChangesByExercise?.get(ex.id)
                              return (
                                <ExerciseCard
                                  key={ex.id}
                                  exercise={ex}
                                  isAthlete={isAthlete}
                                  showSupersetBar
                                  supersetLabel={exIdx === 0 ? ex.supersetId || undefined : undefined}
                                  onToggleExpand={() => onToggleExpand?.(ex.id)}
                                  onCompleteSet={(setId) => onCompleteSet?.(ex.id, setId)}
                                  onCompleteAllSets={() => onCompleteAllSets?.(ex.id)}
                                  onUpdateSet={(setId, field, value) => onUpdateSet?.(ex.id, setId, field, value)}
                                  onAddSet={() => onAddSet?.(ex.id)}
                                  onRemoveSet={(setId) => onRemoveSet?.(ex.id, setId)}
                                  onRemoveExercise={() => onRemoveExercise?.(ex.id)}
                                  onReorderSets={(from, to) => onReorderSets?.(ex.id, from, to)}
                                  isDragging={draggingExerciseId === ex.id}
                                  onDragStart={handleExerciseDragStart}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnd={handleExerciseDragEnd}
                                  onDrop={handleExerciseDrop}
                                  // AI indicator props
                                  hasPendingChange={aiInfo?.hasPendingChange}
                                  aiChangeType={aiInfo?.changeType}
                                  setAIChanges={aiInfo?.setChanges}
                                  pendingSetCount={aiInfo?.pendingSetCount}
                                />
                              )
                            })}
                          </div>
                        )
                      }
                      // Single exercise
                      const aiInfo = aiChangesByExercise?.get(item.id)
                      return (
                        <ExerciseCard
                          key={item.id}
                          exercise={item}
                          isAthlete={isAthlete}
                          onToggleExpand={() => onToggleExpand?.(item.id)}
                          onCompleteSet={(setId) => onCompleteSet?.(item.id, setId)}
                          onCompleteAllSets={() => onCompleteAllSets?.(item.id)}
                          onUpdateSet={(setId, field, value) => onUpdateSet?.(item.id, setId, field, value)}
                          onAddSet={() => onAddSet?.(item.id)}
                          onRemoveSet={(setId) => onRemoveSet?.(item.id, setId)}
                          onRemoveExercise={() => onRemoveExercise?.(item.id)}
                          onReorderSets={(from, to) => onReorderSets?.(item.id, from, to)}
                          isDragging={draggingExerciseId === item.id}
                          onDragStart={handleExerciseDragStart}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnd={handleExerciseDragEnd}
                          onDrop={handleExerciseDrop}
                          // AI indicator props
                          hasPendingChange={aiInfo?.hasPendingChange}
                          aiChangeType={aiInfo?.changeType}
                          setAIChanges={aiInfo?.setChanges}
                          pendingSetCount={aiInfo?.pendingSetCount}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Floating Action Button - Add Exercise (positioned above AI button) */}
      {exercises.length > 0 && !isCompleted && (
        <button
          onClick={() => setShowExercisePicker(true)}
          className="fixed bottom-24 right-6 z-40 flex items-center justify-center h-12 w-12 bg-secondary text-secondary-foreground rounded-full shadow-md hover:bg-secondary/90 transition-all hover:scale-105 active:scale-95 border border-border"
          title="Add Exercise"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Exercise Picker Sheet - Always render, uses server-side search when exercises empty */}
      <ExercisePickerSheet
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={(exercise, section) => {
          onAddExercise?.(exercise, section)
        }}
        exercises={exerciseLibrary}
        recentExerciseIds={recentExerciseIds}
      />

      {/* Session Completion Modal */}
      <SessionCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleConfirmFinish}
        completedSets={stats.completedSets}
        totalSets={stats.totalSets}
        completedExercises={stats.completedExercises}
        totalExercises={stats.totalExercises}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  )
}
