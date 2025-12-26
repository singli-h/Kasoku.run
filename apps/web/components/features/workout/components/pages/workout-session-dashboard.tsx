/**
 * Workout Session Dashboard
 * Complete exercise execution interface with session management,
 * real-time performance tracking, and progress visualization
 */

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Save,
  CheckCircle,
  RotateCcw,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BackToTopButton } from "@/components/ui/back-to-top-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getDraft, getDraftAge, clearDraft, type WorkoutDraft } from "@/lib/workout-persistence"
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges"

// Import workout feature components
import {
  ExerciseProvider,
  useExerciseContext,
  useWorkoutSession,
  type WorkoutExercise
} from "../../index"
import { EnhancedExerciseOrganization } from "../exercise/enhanced-exercise-organization"
import { SaveStatusIndicator } from "../SaveStatusIndicator"

// Import training actions (removing unused imports)

// Import types
import type { 
  WorkoutLogWithDetails,
  SessionPlanWithDetails,
  WorkoutLogSet 
} from "@/types/training"

interface WorkoutSessionDashboardProps {
  presetGroup: SessionPlanWithDetails
  existingSession?: WorkoutLogWithDetails
  className?: string
}

export function WorkoutSessionDashboard({
  presetGroup,
  existingSession,
  className
}: WorkoutSessionDashboardProps) {
  return (
    <ExerciseProvider sessionId={(existingSession as any)?.id}>
      <WorkoutSessionContent
        presetGroup={presetGroup}
        existingSession={existingSession}
        className={className}
      />
    </ExerciseProvider>
  )
}

function WorkoutSessionContent({
  presetGroup,
  existingSession,
  className
}: WorkoutSessionDashboardProps) {
  const { toast } = useToast()
  const { exercises, setExercises, forceSave, hasPendingChanges } = useExerciseContext()

  // T018: Warn users when leaving with unsaved changes (FR-029)
  useUnsavedChanges({
    hasUnsavedChanges: hasPendingChanges(),
    onBeforeUnload: () => {
      // Attempt to save draft before leaving
      // Note: forceSave() is async but beforeunload can't wait for it
      // The draft persistence (T014) already saves on every change
    }
  })

  // Session management hook
  const {
    sessionStatus,
    startSession,
    completeSession,
    saveSession,
    isLoading
  } = useWorkoutSession(existingSession)

  // T015: Draft recovery state
  const [draftRecovery, setDraftRecovery] = useState<{
    show: boolean
    draft: WorkoutDraft | null
    age: string | null
  }>({ show: false, draft: null, age: null })

  // Confirmation dialog for incomplete session completion
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [completionSummary, setCompletionSummary] = useState<{
    completedExercises: number
    totalExercises: number
    completedSets: number
    totalSets: number
    isPartial: boolean
  } | null>(null)

  // Get session ID for draft operations
  const sessionId = (existingSession as any)?.id as number | undefined

  // T015: Check for draft on mount
  useEffect(() => {
    if (!sessionId) return

    const draft = getDraft(sessionId)
    if (draft) {
      const age = getDraftAge(sessionId)
      setDraftRecovery({ show: true, draft, age })
    }
  }, [sessionId])

  // T015: Handle draft restore
  const handleRestoreDraft = useCallback(() => {
    if (!draftRecovery.draft) return

    try {
      // Merge draft data into current exercises
      const restoredExercises: WorkoutExercise[] = exercises.map(exercise => {
        const draftExercise = draftRecovery.draft!.exercises[exercise.id]
        if (!draftExercise) return exercise

        // Merge draft sets with existing exercise structure
        const mergedSets = exercise.workout_log_sets.map((set, index) => {
          const draftSet = draftExercise.sets.find(s => s.setIndex === index + 1)
          if (!draftSet) return set

          return {
            ...set,
            reps: draftSet.reps ?? set.reps,
            weight: draftSet.weight ?? set.weight,
            rpe: draftSet.rpe ?? set.rpe,
            completed: draftSet.completed ?? set.completed
          }
        })

        return {
          ...exercise,
          workout_log_sets: mergedSets
        }
      })

      setExercises(restoredExercises)

      toast({
        title: "Draft Restored",
        description: "Your unsaved workout data has been recovered."
      })
    } catch (error) {
      console.error('[WorkoutSessionDashboard] Failed to restore draft:', error)
      toast({
        title: "Restore Failed",
        description: "Could not restore your draft data.",
        variant: "destructive"
      })
    } finally {
      setDraftRecovery({ show: false, draft: null, age: null })
      if (sessionId) clearDraft(sessionId)
    }
  }, [draftRecovery.draft, exercises, setExercises, toast, sessionId])

  // T015: Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    if (sessionId) clearDraft(sessionId)
    setDraftRecovery({ show: false, draft: null, age: null })
    toast({
      title: "Draft Discarded",
      description: "Starting fresh with saved data."
    })
  }, [sessionId, toast])

  // Populate exercises from preset group/session on mount or when inputs change
  // This ensures the exercise list renders instead of staying empty
  useEffect(() => {
    try {
      // Prefer exercises from the provided preset group; fallback to session's group
      const basePresets = (presetGroup?.session_plan_exercises
        || existingSession?.session_plan?.session_plan_exercises
        || [])
        .slice()
        .sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))

      // Map training details by session_plan_exercise_id when an existing session is present
      const details: WorkoutLogSet[] = existingSession?.workout_log_sets || []
      const detailsByPresetId = new Map<number, WorkoutLogSet[]>()
      for (const d of details) {
        // Use session_plan_exercise_id (new schema) or workout_log_exercise_id
        const pid = (d as any).session_plan_exercise_id as number | undefined
        if (!pid) continue
        const list = detailsByPresetId.get(pid) || []
        list.push(d)
        detailsByPresetId.set(pid, list)
      }

      const mapped: WorkoutExercise[] = basePresets.map((preset: any) => ({
        ...preset,
        // Attach any recorded training details for this preset if present
        workout_log_sets: detailsByPresetId.get(preset.id) || [],
        completed: false,
      }))

      setExercises(mapped)
    } catch (err) {
      console.error("Failed to initialize workout exercises", err)
    }
  }, [presetGroup?.session_plan_exercises, existingSession?.session_plan?.session_plan_exercises, existingSession?.workout_log_sets, setExercises])

  // Local state for session notes  
  const [sessionNotes, setSessionNotes] = useState((existingSession as any)?.notes || "")

  // Session statistics
  const sessionStats = useMemo(() => {
    const totalExercises = exercises.length
    const completedExercises = exercises.filter(ex => ex.completed).length
    // Calculate total sets from exercise preset details instead of non-existent 'sets' property
    const totalSets = exercises.reduce((sum, ex) => 
      sum + (ex.session_plan_sets?.length || 0), 0
    )
    const completedSets = exercises.reduce((sum, ex) => 
      sum + (ex.workout_log_sets?.filter(d => d.completed).length || 0), 0
    )
    
    return {
      totalExercises,
      completedExercises,
      totalSets,
      completedSets,
      exerciseProgress: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
      setProgress: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
    }
  }, [exercises])

  // Remove session timer functionality per user feedback

  // Handle session actions
  const handleStartSession = async () => {
    try {
      const result = await startSession()
      if (result.success) {
        toast({
          title: "Session Started",
          description: "Your workout session has begun!"
        })
      } else {
        throw result.error || new Error("Failed to start session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      })
    }
  }

  /**
   * Calculate session completion summary
   * Returns stats about completed vs total exercises and sets
   */
  const getCompletionSummary = useCallback(() => {
    const totalExercises = exercises.length
    const totalSets = exercises.reduce((sum, ex) =>
      sum + (ex.session_plan_sets?.length || ex.workout_log_sets?.length || 0), 0
    )

    // Count exercises with at least one completed set
    const completedExercises = exercises.filter(ex => {
      const sets = ex.workout_log_sets || []
      return sets.some(s => s.completed)
    }).length

    // Count total completed sets
    const completedSets = exercises.reduce((sum, ex) => {
      const sets = ex.workout_log_sets || []
      return sum + sets.filter(s => s.completed).length
    }, 0)

    const isPartial = completedSets > 0 && (completedExercises < totalExercises || completedSets < totalSets)

    return {
      completedExercises,
      totalExercises,
      completedSets,
      totalSets,
      isPartial
    }
  }, [exercises])

  /**
   * Handle Finish button click
   * Shows confirmation for incomplete sessions, proceeds immediately for complete ones
   */
  const handleCompleteSession = async () => {
    const summary = getCompletionSummary()

    // If session is incomplete (no sets or partial), show confirmation dialog
    if (summary.completedSets === 0 || summary.isPartial) {
      setCompletionSummary(summary)
      setShowFinishConfirm(true)
      return
    }

    // All complete - proceed directly
    await executeCompleteSession()
  }

  /**
   * Execute the actual session completion
   * Called directly for complete sessions or after user confirms for incomplete ones
   */
  const executeCompleteSession = async () => {
    try {
      // T012: Force flush all pending exercise data FIRST before completing session
      // This ensures no data is lost when user clicks Finish
      const saveSuccess = await forceSave()
      if (!saveSuccess) {
        toast({
          title: "Save Failed",
          description: "Failed to save exercise data before completing. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Now complete the session
      const result = await completeSession()
      if (result.success) {
        // Close dialog if open
        setShowFinishConfirm(false)
        setCompletionSummary(null)

        toast({
          title: "Session Completed!",
          description: "Great work! Your session has been saved."
        })
      } else {
        throw result.error || new Error("Failed to complete session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive"
      })
    }
  }

  const handleSaveSession = async () => {
    try {
      // T011: Force flush all pending exercise data FIRST before updating session status
      const saveSuccess = await forceSave()
      if (!saveSuccess) {
        toast({
          title: "Save Failed",
          description: "Failed to save exercise data. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Now update session status
      const result = await saveSession()
      if (result.success) {
        toast({
          title: "Session Saved",
          description: "Your progress has been saved"
        })
      } else {
        throw result.error || new Error("Failed to save session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive"
      })
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* T015: Draft Recovery Banner */}
      <AnimatePresence>
        {draftRecovery.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Unsaved Workout Found</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You have unsaved workout data from {draftRecovery.age || 'a previous session'}.
                    Would you like to restore it?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRestoreDraft}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Restore
                </Button>
                <Button
                  onClick={handleDiscardDraft}
                  size="sm"
                  variant="ghost"
                  className="text-amber-700 hover:text-amber-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Session Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-high-contrast">
            {(presetGroup as any).name || "Workout Session"}
          </h1>
          {(presetGroup as any).description && (
            <p className="text-sm text-medium-contrast mt-1">
              {(presetGroup as any).description}
            </p>
          )}
        </div>
        
        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-3">
          {sessionStatus === 'assigned' && (
            <Button 
              onClick={handleStartSession} 
              disabled={isLoading}
              className="btn-primary-enhanced"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
          )}
          
          {sessionStatus === 'ongoing' && (
            <>
              <Button 
                onClick={handleSaveSession} 
                disabled={isLoading}
                variant="outline"
                className="btn-outline-enhanced"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={handleCompleteSession} 
                disabled={isLoading}
                className="btn-primary-enhanced"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finish
              </Button>
            </>
          )}
          
          {sessionStatus === 'completed' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Simple Progress Stats */}
      {sessionStatus !== 'completed' && (
        <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-medium-contrast">Exercises:</span>
            <span className="font-medium text-high-contrast">
              {sessionStats.completedExercises} / {sessionStats.totalExercises}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-medium-contrast">Sets:</span>
            <span className="font-medium text-high-contrast">
              {sessionStats.completedSets} / {sessionStats.totalSets}
            </span>
          </div>
        </div>
      )}

      {/* Enhanced Exercise Organization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EnhancedExerciseOrganization exercises={exercises} />
      </motion.div>

      {/* Session Notes */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-high-contrast">Notes</h3>
        <Textarea
          placeholder="Add notes about your workout session..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          className="input-enhanced min-h-20"
          disabled={sessionStatus === 'completed'}
        />
      </div>

      {/* Session Summary (if completed) */}
      <AnimatePresence>
        {sessionStatus === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 bg-muted rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-high-contrast">Workout Complete</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-semibold text-high-contrast">
                    {sessionStats.completedExercises}
                  </div>
                  <p className="text-sm text-medium-contrast">Exercises</p>
                </div>
                <div>
                  <div className="text-xl font-semibold text-high-contrast">
                    {sessionStats.completedSets}
                  </div>
                  <p className="text-sm text-medium-contrast">Sets</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Status Indicator */}
      <SaveStatusIndicator />

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Finish Session Confirmation Dialog */}
      <AlertDialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {completionSummary?.completedSets === 0
                ? "Finish Without Completing Any Sets?"
                : "Finish With Incomplete Session?"
              }
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {completionSummary?.completedSets === 0 ? (
                  <p>
                    You haven&apos;t marked any sets as complete. Are you sure you want to finish this session?
                  </p>
                ) : (
                  <p>
                    You&apos;ve completed {completionSummary?.completedSets} of {completionSummary?.totalSets} sets
                    across {completionSummary?.completedExercises} of {completionSummary?.totalExercises} exercises.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Your progress will be saved as-is. You can always review this session later.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Workout</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCompleteSession}
              className="bg-primary hover:bg-primary/90"
            >
              Finish Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 