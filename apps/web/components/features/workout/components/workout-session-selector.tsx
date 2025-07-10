/**
 * Workout Session Selector
 * Component for selecting and starting workout sessions from available exercise preset groups
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Calendar, 
  Clock, 
  Target,
  Plus,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Import training actions
import { 
  getExercisePresetGroupsByMicrocycleAction,
  startTrainingSessionAction 
} from "@/actions/training"

// Import types
import type { 
  ExercisePresetGroupWithDetails,
  ExerciseTrainingSessionWithDetails 
} from "@/types/training"

interface WorkoutSessionSelectorProps {
  onSessionSelected: (
    presetGroup: ExercisePresetGroupWithDetails, 
    session?: ExerciseTrainingSessionWithDetails
  ) => void
  className?: string
}

interface WorkoutOption {
  presetGroup: ExercisePresetGroupWithDetails
  existingSession?: ExerciseTrainingSessionWithDetails
  exerciseCount: number
  estimatedDuration: number
}

export function WorkoutSessionSelector({ 
  onSessionSelected, 
  className 
}: WorkoutSessionSelectorProps) {
  const { toast } = useToast()
  const [workoutOptions, setWorkoutOptions] = useState<WorkoutOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startingSessionId, setStartingSessionId] = useState<number | null>(null)

  const calculateEstimatedDuration = (
    presetGroup: ExercisePresetGroupWithDetails
  ): number => {
    let totalSeconds = 0
    if (presetGroup.exercise_presets) {
      for (const preset of presetGroup.exercise_presets) {
        if (preset.exercise_preset_details) {
          for (const detail of preset.exercise_preset_details) {
            const reps = detail.reps || 8
            const sets = detail.set_index || 3
            const rest = detail.rest_time || 60
            // Simple estimation: 3 seconds per rep, plus rest time
            totalSeconds += sets * (reps * 3 + rest)
          }
        }
      }
    }
    return Math.round(totalSeconds / 60)
  }

  // Load available workout options
  const loadWorkoutOptions = async () => {
    try {
      setIsLoading(true)
      // In a real app, you would dynamically determine the microcycle ID
      const microcycleId = 1
      const result = await getExercisePresetGroupsByMicrocycleAction({
        microcycleId
      })

      if (!result.isSuccess || !result.data) {
        throw new Error(result.message || "Failed to fetch workout presets.")
      }

      const options: WorkoutOption[] = result.data.map(presetGroup => ({
        presetGroup,
        exerciseCount: presetGroup.exercise_presets?.length || 0,
        estimatedDuration: calculateEstimatedDuration(presetGroup)
      }))

      setWorkoutOptions(options)
    } catch (error) {
      console.error("Error loading workout options:", error)
      toast({
        title: "Error",
        description: "Failed to load available workouts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkoutOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle starting a new session
  const handleStartSession = async (presetGroup: ExercisePresetGroupWithDetails) => {
    try {
      setStartingSessionId(presetGroup.id)
      
      // Start a new training session
      const result = await startTrainingSessionAction(presetGroup.id)
      
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      
      // Call the parent callback with the selected workout
      onSessionSelected(presetGroup, result.data)
      
      toast({
        title: "Session Started",
        description: `Started ${presetGroup.name} workout session`
      })
    } catch (error) {
      console.error('Error starting session:', error)
      toast({
        title: "Error",
        description: "Failed to start workout session",
        variant: "destructive"
      })
    } finally {
      setStartingSessionId(null)
    }
  }

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Choose Your Workout
        </h2>
        <p className="text-muted-foreground">
          Select a workout session to start training
        </p>
      </div>

      {/* Workout Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workoutOptions.map((option, index) => (
          <motion.div
            key={option.presetGroup.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {option.presetGroup.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {option.presetGroup.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    W{option.presetGroup.week}D{option.presetGroup.day}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Workout Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{option.exerciseCount} exercises</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(option.estimatedDuration)}</span>
                  </div>
                </div>

                {/* Session Notes */}
                {option.presetGroup.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    {option.presetGroup.notes}
                  </p>
                )}

                {/* Action Button */}
                <Button 
                  onClick={() => handleStartSession(option.presetGroup)}
                  disabled={startingSessionId === option.presetGroup.id}
                  className="w-full"
                >
                  {startingSessionId === option.presetGroup.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {workoutOptions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workouts Available</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any workout sessions assigned yet.
            </p>
            <Button variant="outline" onClick={loadWorkoutOptions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 