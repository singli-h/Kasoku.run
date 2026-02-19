"use client"

import { useState, useMemo, useCallback } from "react"
import { Check, Loader2, Plus, Calendar, SlidersHorizontal, XCircle } from "lucide-react"
import { format, isToday, isYesterday, isTomorrow } from "date-fns"
import { cn } from "@/lib/utils"
import type { TrainingExercise, TrainingSet, ExerciseLibraryItem } from "../types"
import type { AIExerciseChangeInfo } from "@/components/features/ai-assistant/hooks"
import { UNGROUPED_SET_CHANGES_KEY } from "@/components/features/ai-assistant/hooks"

// Save status type (matches ExerciseContext)
export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'
import { groupBySupersets, getCompletedCount } from "../types"
import { ExerciseCard } from "../components/ExerciseCard"
import { SectionDivider } from "../components/SectionDivider"
import { ExercisePickerSheet } from "../components/ExercisePickerSheet"
import { SessionCompletionModal } from "../components/SessionCompletionModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BackToTopButton } from "@/components/ui/back-to-top-button"

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
  onAbandonSession?: () => void
  /** Create a superset from selected exercise IDs */
  onCreateSuperset?: (exerciseIds: (string | number)[]) => void
  /** Unlink a superset (dissolve all exercises in it) */
  onUnlinkSuperset?: (supersetId: string) => void

  /** AI change info per exercise (keyed by exercise ID as string) */
  aiChangesByExercise?: Map<string, AIExerciseChangeInfo>

  /**
   * T054: Whether to show advanced fields (RPE, tempo, velocity, effort)
   * Passed down to ExerciseCard -> SetRow. When false, these fields are hidden.
   * @default true
   */
  showAdvancedFields?: boolean

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
  onAbandonSession,
  onCreateSuperset,
  onUnlinkSuperset,
  aiChangesByExercise,
  showAdvancedFields = true,
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
  // Toggle for showing all optional fields vs. only required + filled fields
  const [showAllFields, setShowAllFields] = useState(false)
  // Track which section to pre-select when opening exercise picker
  const [preSelectedSection, setPreSelectedSection] = useState<string | null>(null)
  // Selection mode for superset creation (coach mode only)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string | number>>(new Set())

  // Open exercise picker with a pre-selected section (for section [+ Add] buttons)
  const handleAddToSection = useCallback((section: string) => {
    setPreSelectedSection(section)
    setShowExercisePicker(true)
  }, [])

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev)
    if (isSelectionMode) {
      setSelectedExerciseIds(new Set())
    }
  }, [isSelectionMode])

  // Toggle exercise selection
  const handleToggleSelection = useCallback((exerciseId: string | number) => {
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }, [])

  // Create superset from selected exercises
  const handleCreateSuperset = useCallback(() => {
    if (selectedExerciseIds.size >= 2 && onCreateSuperset) {
      onCreateSuperset(Array.from(selectedExerciseIds))
      setSelectedExerciseIds(new Set())
      setIsSelectionMode(false)
    }
  }, [selectedExerciseIds, onCreateSuperset])

  // Cancel selection mode
  const handleCancelSelection = useCallback(() => {
    setSelectedExerciseIds(new Set())
    setIsSelectionMode(false)
  }, [])

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
  // For superset exercises, use "Superset" as the section label instead of individual exercise types
  const exerciseGroups = useMemo(() => {
    if (exercises.length === 0) return []

    // Sort by exerciseOrder to ensure correct sequence
    const sortedExercises = [...exercises].sort((a, b) => a.exerciseOrder - b.exerciseOrder)

    // Group consecutive exercises by section
    // Superset exercises use "Superset" as their effective section
    const groups: { section: string; exercises: TrainingExercise[]; isSuperset?: boolean; supersetId?: string }[] = []
    let currentGroup: { section: string; exercises: TrainingExercise[]; isSuperset?: boolean; supersetId?: string } | null = null
    let currentSupersetId: string | null = null

    sortedExercises.forEach((exercise) => {
      // Determine effective section: "Superset" for superset exercises, otherwise the actual section
      const isInSuperset = !!exercise.supersetId
      const effectiveSection = isInSuperset ? 'Superset' : exercise.section

      // Check if we should continue in the same group
      const isSameSuperset = isInSuperset && exercise.supersetId === currentSupersetId
      const isSameSection = !isInSuperset && currentGroup?.section === exercise.section && !currentGroup?.isSuperset

      if (isSameSuperset || isSameSection) {
        // Add to current group
        currentGroup!.exercises.push(exercise)
      } else {
        // Start a new group
        currentGroup = {
          section: effectiveSection,
          exercises: [exercise],
          isSuperset: isInSuperset,
          supersetId: isInSuperset && exercise.supersetId ? exercise.supersetId : undefined
        }
        groups.push(currentGroup)
        currentSupersetId = isInSuperset && exercise.supersetId ? exercise.supersetId : null
      }
    })

    return groups
  }, [exercises])

  // Extract pending add exercises from aiChangesByExercise (CREATE operations for new exercises)
  const pendingAddExercises = useMemo((): TrainingExercise[] => {
    if (!aiChangesByExercise) return []

    const existingIds = new Set(exercises.map(ex => String(ex.id)))
    const ghostExercises: TrainingExercise[] = []

    aiChangesByExercise.forEach((info, exerciseId) => {
      // Only include if:
      // 1. It's an 'add' change type
      // 2. The exercise doesn't exist in the current exercises array
      // 3. It has proposed data
      if (info.changeType === 'add' && !existingIds.has(exerciseId) && info.proposedData) {
        const proposed = info.proposedData
        // Convert proposed data to TrainingExercise format
        ghostExercises.push({
          id: exerciseId,
          exerciseId: (proposed.exercise_id as number) || 0, // Exercise library reference
          name: (proposed.exercise_name as string) || (proposed.name as string) || 'New Exercise',
          section: (proposed.section as string) || 'Main',
          exerciseOrder: (proposed.exercise_order as number) || exercises.length + 1,
          exerciseTypeId: proposed.exercise_type_id as number | undefined,
          expanded: true, // Always expanded so sets are visible
          sets: info.pendingNewSets.map((setInfo, index) => ({
            id: `ghost-set-${index}`,
            setIndex: index + 1,
            completed: false,
            reps: (setInfo.proposedData?.reps as number | null) ?? null,
            weight: (setInfo.proposedData?.weight as number | null) ?? null,
            distance: (setInfo.proposedData?.distance as number | null) ?? null,
            performingTime: (setInfo.proposedData?.performing_time as number | null) ?? null,
            height: (setInfo.proposedData?.height as number | null) ?? null,
            power: (setInfo.proposedData?.power as number | null) ?? null,
            velocity: (setInfo.proposedData?.velocity as number | null) ?? null,
            rpe: (setInfo.proposedData?.rpe as number | null) ?? null,
            restTime: (setInfo.proposedData?.rest_time as number | null) ?? null,
            tempo: (setInfo.proposedData?.tempo as string | null) ?? null,
            effort: (setInfo.proposedData?.effort as number | null) ?? null,
            resistance: (setInfo.proposedData?.resistance as number | null) ?? null,
          })),
        })
      }
    })

    return ghostExercises.sort((a, b) => a.exerciseOrder - b.exerciseOrder)
  }, [aiChangesByExercise, exercises])

  // Extract ungrouped set changes (for delete operations without exercise ID)
  const ungroupedSetChanges = useMemo(() => {
    return aiChangesByExercise?.get(UNGROUPED_SET_CHANGES_KEY)?.setChanges
  }, [aiChangesByExercise])

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
    <div className={cn("bg-background min-h-full relative min-w-0 w-full", className)}>
      {/* Header - only show if title is provided */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3">
          {/* Title Row with Date - only show if title exists */}
          {title && (
            <>
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
            </>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Field visibility toggle */}
              <button
                onClick={() => setShowAllFields(prev => !prev)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                  showAllFields
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                title={showAllFields ? "Hide optional fields" : "Show all fields"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{showAllFields ? "All" : "Min"}</span>
              </button>
              {isAthlete ? (
                <span>{stats.progress}% complete</span>
              ) : (
                <>
                  <span>{stats.totalSets} sets · {stats.totalExercises} exercises</span>
                  {/* Superset creation button (coach mode only) */}
                  {onCreateSuperset && !isSelectionMode && exercises.length >= 2 && (
                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      title="Create superset"
                    >
                      <span className="text-[10px] font-medium">🔗 Superset</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Abandon/Save/Finish Buttons */}
            <div className="flex items-center gap-2">
              {/* Abandon button - only shown for ongoing sessions */}
              {!isCompleted && isAthlete && onAbandonSession && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                      title="Abandon session"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Abandon this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your logged sets will be saved, but the session will be marked as cancelled. You can start a new session later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Going</AlertDialogCancel>
                      <AlertDialogAction onClick={onAbandonSession}>
                        Abandon Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Save button - shown for both ongoing and completed sessions */}
              {isAthlete && onSaveSession && (
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

              {/* Finish button - only shown for ongoing sessions */}
              {!isCompleted && isAthlete && (
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

      {/* Content - edge-to-edge on mobile */}
      <div className="px-0 sm:px-2 py-2 space-y-0 pb-24">
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
                  <SectionDivider
                    label={group.section}
                    showAddButton={!isAthlete && !group.isSuperset && !isCompleted}
                    onAddClick={() => handleAddToSection(group.section)}
                    supersetId={group.supersetId}
                    onUnlinkSuperset={!isAthlete && !isCompleted ? onUnlinkSuperset : undefined}
                  />
                  <div className="space-y-0 pl-0">
                    {grouped.map((item, idx) => {
                      if (Array.isArray(item)) {
                        // Superset group
                        return (
                          <div key={`superset-${idx}`} className="space-y-3">
                            {item.map((ex, exIdx) => {
                              // Use String(ex.id) for Map lookup - entityId is always stored as string
                              const aiInfo = aiChangesByExercise?.get(String(ex.id))
                              return (
                                <ExerciseCard
                                  key={ex.id}
                                  exercise={ex}
                                  isAthlete={isAthlete}
                                  showAllFields={showAllFields}
                                  showAdvancedFields={showAdvancedFields}
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
                                  // Selection mode props
                                  isSelectionMode={isSelectionMode}
                                  isSelected={selectedExerciseIds.has(ex.id)}
                                  onToggleSelection={handleToggleSelection}
                                  // AI indicator props
                                  hasPendingChange={aiInfo?.hasPendingChange}
                                  aiChangeType={aiInfo?.changeType}
                                  setAIChanges={aiInfo?.setChanges}
                                  ungroupedSetChanges={ungroupedSetChanges}
                                  pendingNewSets={aiInfo?.pendingNewSets}
                                  pendingSetCount={aiInfo?.pendingSetCount}
                                  aiProposedData={aiInfo?.proposedData}
                                  aiCurrentData={aiInfo?.currentData}
                                />
                              )
                            })}
                          </div>
                        )
                      }
                      // Single exercise - use String(item.id) for Map lookup
                      const aiInfo = aiChangesByExercise?.get(String(item.id))
                      return (
                        <ExerciseCard
                          key={item.id}
                          exercise={item}
                          isAthlete={isAthlete}
                          showAllFields={showAllFields}
                          showAdvancedFields={showAdvancedFields}
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
                          // Selection mode props
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedExerciseIds.has(item.id)}
                          onToggleSelection={handleToggleSelection}
                          // AI indicator props
                          hasPendingChange={aiInfo?.hasPendingChange}
                          aiChangeType={aiInfo?.changeType}
                          setAIChanges={aiInfo?.setChanges}
                          ungroupedSetChanges={ungroupedSetChanges}
                          pendingNewSets={aiInfo?.pendingNewSets}
                          pendingSetCount={aiInfo?.pendingSetCount}
                          aiProposedData={aiInfo?.proposedData}
                          aiCurrentData={aiInfo?.currentData}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Ghost exercises (pending CREATE operations) */}
            {pendingAddExercises.length > 0 && (
              <div>
                <SectionDivider label="Pending" />
                <div className="space-y-0 pl-0">
                  {pendingAddExercises.map((ghostEx) => (
                    <ExerciseCard
                      key={`ghost-ex-${ghostEx.id}`}
                      exercise={ghostEx}
                      isAthlete={isAthlete}
                      showAllFields={showAllFields}
                      showAdvancedFields={showAdvancedFields}
                      isGhostExercise={true}
                      onToggleExpand={() => {}}
                      onCompleteSet={() => {}}
                      // Ghost exercises are read-only
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Buttons - positioned above AI button */}
      {exercises.length > 0 && !isSelectionMode && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col-reverse items-end gap-3">
          {/* Add Exercise Button - hidden when completed */}
          {!isCompleted && (
            <button
              onClick={() => setShowExercisePicker(true)}
              className="flex items-center justify-center h-14 w-14 bg-secondary text-secondary-foreground rounded-full shadow-md hover:bg-secondary/90 transition-all hover:scale-105 active:scale-95 border border-border"
              title="Add Exercise"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {/* Back to Top Button - shows when scrolled, appears above Add Exercise */}
          <BackToTopButton relative threshold={300} />
        </div>
      )}

      {/* Selection Mode Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelSelection}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <span className="text-sm text-muted-foreground">
              {selectedExerciseIds.size} selected
            </span>
          </div>
          <button
            onClick={handleCreateSuperset}
            disabled={selectedExerciseIds.size < 2}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedExerciseIds.size >= 2
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            🔗 Create Superset
          </button>
        </div>
      )}

      {/* Exercise Picker Sheet - Always render, uses server-side search when exercises empty */}
      <ExercisePickerSheet
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false)
          setPreSelectedSection(null)
        }}
        onSelectExercise={(exercise, section) => {
          onAddExercise?.(exercise, section)
        }}
        exercises={exerciseLibrary}
        recentExerciseIds={recentExerciseIds}
        defaultSection={preSelectedSection}
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
