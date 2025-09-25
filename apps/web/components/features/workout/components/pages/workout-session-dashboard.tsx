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
  Pause, 
  Square, 
  Clock, 
  Target, 
  TrendingUp, 
  Save,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Import workout feature components
import { 
  ExerciseProvider, 
  useExerciseContext, 
  ExerciseDashboard,
  useWorkoutSession,
  type SessionStatus,
  type WorkoutExercise
} from "../../index"
import { EnhancedExerciseOrganization } from "../exercise/enhanced-exercise-organization"

// Import training actions
import { 
  updateTrainingSessionAction, 
  completeTrainingSessionAction,
  addExercisePerformanceAction 
} from "@/actions/training"

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
  const { exercises, showVideo, toggleVideo, setExercises } = useExerciseContext()
  
  // Session management hook
  const {
    session,
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
        .sort((a, b) => (a.preset_order || 0) - (b.preset_order || 0))

      // Map training details by preset_id when an existing session is present
      const details: ExerciseTrainingDetail[] = existingSession?.exercise_training_details || []
      const detailsByPresetId = new Map<number, ExerciseTrainingDetail[]>()
      for (const d of details) {
        // @ts-expect-error: exercise_preset_id exists at runtime per DB row
        const pid = d.exercise_preset_id as number | undefined
        if (!pid) continue
        const list = detailsByPresetId.get(pid) || []
        list.push(d)
        detailsByPresetId.set(pid, list)
      }

      const mapped: WorkoutExercise[] = basePresets.map((preset) => ({
        ...preset,
        // Attach any recorded training details for this preset if present
        exercise_training_details: detailsByPresetId.get(preset.id) || [],
        completed: false,
      }))

      setExercises(mapped)
    } catch (err) {
      console.error("Failed to initialize workout exercises", err)
    }
  }, [presetGroup?.id, existingSession?.id, setExercises])


  // Local state for session notes
  const [sessionNotes, setSessionNotes] = useState(existingSession?.notes || "")
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

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

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0)
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (sessionStatus === 'ongoing') {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionStatus])

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive"
      })
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && sessionStatus === 'ongoing') {
      const autoSaveInterval = setInterval(() => {
        handleSaveSession()
      }, 30000) // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval)
    }
  }, [autoSaveEnabled, sessionStatus])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Session Header */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {presetGroup.name || "Workout Session"}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {presetGroup.description || "Training session in progress"}
              </p>
            </div>
            
            {/* Session Status Badge */}
            <Badge 
              variant={
                sessionStatus === 'ongoing' ? 'default' :
                sessionStatus === 'completed' ? 'secondary' :
                sessionStatus === 'assigned' ? 'outline' : 'destructive'
              }
              className="text-sm"
            >
              {sessionStatus === 'ongoing' && <Play className="h-3 w-3 mr-1" />}
              {sessionStatus === 'assigned' && <Clock className="h-3 w-3 mr-1" />}
              {sessionStatus === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Session Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-mono font-bold">
                <Clock className="h-5 w-5" />
                {formatDuration(sessionDuration)}
              </div>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>

            {/* Exercise Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Target className="h-5 w-5" />
                {sessionStats.completedExercises}/{sessionStats.totalExercises}
              </div>
              <p className="text-sm text-muted-foreground">Exercises</p>
              <Progress value={sessionStats.exerciseProgress} className="mt-1" />
            </div>

            {/* Set Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <TrendingUp className="h-5 w-5" />
                {sessionStats.completedSets}/{sessionStats.totalSets}
              </div>
              <p className="text-sm text-muted-foreground">Sets</p>
              <Progress value={sessionStats.setProgress} className="mt-1" />
            </div>

            {/* Session Controls */}
            <div className="flex flex-col gap-2">
              {(sessionStatus === 'assigned' || sessionStatus === 'unknown') && (
                <Button 
                  onClick={handleStartSession} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              )}
              
              {sessionStatus === 'ongoing' && (
                <>
                  <Button 
                    onClick={handleSaveSession} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button 
                    onClick={handleCompleteSession} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </>
              )}
              
              {sessionStatus === 'completed' && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Session Complete
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Exercise Organization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EnhancedExerciseOrganization exercises={exercises} />
      </motion.div>

      {/* Session Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about your workout session..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className="min-h-20"
            disabled={sessionStatus === 'completed'}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSaveSession} 
                disabled={isLoading || sessionStatus === 'completed'}
                variant="outline"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
              
              <Button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                variant="ghost"
                size="sm"
                disabled={sessionStatus === 'completed'}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
              </Button>
            </div>

            <Button
              onClick={toggleVideo}
              variant="ghost"
              size="sm"
            >
              Video: {showVideo ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Summary (if completed) */}
      <AnimatePresence>
        {sessionStatus === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Session Completed!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatDuration(sessionDuration)}
                    </div>
                    <p className="text-sm text-green-600">Total Time</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {sessionStats.completedExercises}
                    </div>
                    <p className="text-sm text-green-600">Exercises</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {sessionStats.completedSets}
                    </div>
                    <p className="text-sm text-green-600">Sets</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {Math.round(sessionStats.setProgress)}%
                    </div>
                    <p className="text-sm text-green-600">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 