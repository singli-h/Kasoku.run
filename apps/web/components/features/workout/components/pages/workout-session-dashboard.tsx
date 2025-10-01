/**
 * Workout Session Dashboard
 * Complete exercise execution interface with session management,
 * real-time performance tracking, and progress visualization
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Save,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BackToTopButton } from "@/components/ui/back-to-top-button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Import workout feature components
import { 
  ExerciseProvider, 
  useExerciseContext, 
  useWorkoutSession,
  type WorkoutExercise
} from "../../index"
import { EnhancedExerciseOrganization } from "../exercise/enhanced-exercise-organization"

// Import training actions (removing unused imports)

// Import types
import type { 
  ExerciseTrainingSessionWithDetails,
  ExercisePresetGroupWithDetails,
  ExerciseTrainingDetail 
} from "@/types/training"

interface WorkoutSessionDashboardProps {
  presetGroup: ExercisePresetGroupWithDetails
  existingSession?: ExerciseTrainingSessionWithDetails
  className?: string
}

export function WorkoutSessionDashboard({ 
  presetGroup, 
  existingSession,
  className 
}: WorkoutSessionDashboardProps) {
  return (
    <ExerciseProvider>
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
  const { exercises, setExercises } = useExerciseContext()
  
  // Session management hook
  const {
    sessionStatus,
    startSession,
    completeSession,
    saveSession,
    isLoading
  } = useWorkoutSession(existingSession)
  
  // Populate exercises from preset group/session on mount or when inputs change
  // This ensures the exercise list renders instead of staying empty
  useEffect(() => {
    try {
      // Prefer exercises from the provided preset group; fallback to session's group
      const basePresets = (presetGroup?.exercise_presets
        || existingSession?.exercise_preset_group?.exercise_presets
        || [])
        .slice()
        .sort((a: any, b: any) => (a.preset_order || 0) - (b.preset_order || 0))

      // Map training details by preset_id when an existing session is present
      const details: ExerciseTrainingDetail[] = existingSession?.exercise_training_details || []
      const detailsByPresetId = new Map<number, ExerciseTrainingDetail[]>()
      for (const d of details) {
        const pid = (d as any).exercise_preset_id as number | undefined
        if (!pid) continue
        const list = detailsByPresetId.get(pid) || []
        list.push(d)
        detailsByPresetId.set(pid, list)
      }

      const mapped: WorkoutExercise[] = basePresets.map((preset: any) => ({
        ...preset,
        // Attach any recorded training details for this preset if present
        exercise_training_details: detailsByPresetId.get(preset.id) || [],
        completed: false,
      }))

      setExercises(mapped)
    } catch (err) {
      console.error("Failed to initialize workout exercises", err)
    }
  }, [presetGroup?.exercise_presets, existingSession?.exercise_preset_group?.exercise_presets, existingSession?.exercise_training_details, setExercises])

  // Local state for session notes  
  const [sessionNotes, setSessionNotes] = useState((existingSession as any)?.notes || "")

  // Session statistics
  const sessionStats = useMemo(() => {
    const totalExercises = exercises.length
    const completedExercises = exercises.filter(ex => ex.completed).length
    // Calculate total sets from exercise preset details instead of non-existent 'sets' property
    const totalSets = exercises.reduce((sum, ex) => 
      sum + (ex.exercise_preset_details?.length || 0), 0
    )
    const completedSets = exercises.reduce((sum, ex) => 
      sum + (ex.exercise_training_details?.filter(d => d.completed).length || 0), 0
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

  const handleCompleteSession = async () => {
    try {
      const result = await completeSession()
      if (result.success) {
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
          {(sessionStatus === 'assigned' || sessionStatus === 'unknown') && (
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

      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  )
} 