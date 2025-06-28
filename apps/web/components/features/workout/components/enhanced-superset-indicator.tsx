/**
 * Enhanced Superset Indicator Component
 * Advanced superset visualization with connectivity lines, progress indicators,
 * and interactive controls for better workout flow
 */

"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Link, 
  Unlink, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  CheckCircle2, 
  Circle, 
  MoreHorizontal,
  ArrowRight,
  Timer,
  Target,
  Zap
} from "lucide-react"

// UI Components
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Workout components
import { useExerciseContext, type WorkoutExercise } from "../index"
import { ExerciseCard } from "./exercise-card"

interface EnhancedSupersetIndicatorProps {
  exercises: WorkoutExercise[]
  supersetId: number | string
  className?: string
  showConnectivityLines?: boolean
  allowReordering?: boolean
}

interface SupersetStats {
  totalExercises: number
  completedExercises: number
  totalSets: number
  completedSets: number
  estimatedDuration: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export function EnhancedSupersetIndicator({
  exercises,
  supersetId,
  className,
  showConnectivityLines = true,
  allowReordering = false
}: EnhancedSupersetIndicatorProps) {
  const { updateExercise } = useExerciseContext()
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeExercise, setActiveExercise] = useState<number | null>(null)

  // Sort exercises by their position in superset
  const sortedExercises = useMemo(() => {
    return [...exercises].sort((a, b) => a.preset_order - b.preset_order)
  }, [exercises])

  // Calculate superset statistics
  const supersetStats: SupersetStats = useMemo(() => {
    const totalExercises = sortedExercises.length
    const completedExercises = sortedExercises.filter(ex => ex.completed).length
    
    // Calculate total sets from exercise preset details
    const totalSets = sortedExercises.reduce((sum, ex) => 
      sum + (ex.exercise_preset_details?.length || 0), 0
    )
    const completedSets = sortedExercises.reduce((sum, ex) => 
      sum + (ex.exercise_training_details?.filter(d => d.completed).length || 0), 0
    )
    
    // Estimate duration (rough calculation)
    const estimatedDuration = totalSets * 2 + (totalExercises - 1) * 0.5 // 2 min per set + 30s rest
    
    // Calculate difficulty based on total sets and exercise complexity
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy'
    if (totalSets > 12) difficulty = 'Hard'
    else if (totalSets > 6) difficulty = 'Medium'
    
    return {
      totalExercises,
      completedExercises,
      totalSets,
      completedSets,
      estimatedDuration,
      difficulty
    }
  }, [sortedExercises])

  // Handle superset actions
  const handleMarkAllComplete = () => {
    const shouldComplete = supersetStats.completedExercises < supersetStats.totalExercises
    sortedExercises.forEach(exercise => {
      updateExercise(exercise.id, { completed: shouldComplete })
    })
  }

  const handleStartSuperset = () => {
    if (sortedExercises.length > 0) {
      setActiveExercise(sortedExercises[0].id)
    }
  }

  const handleNextExercise = () => {
    if (activeExercise) {
      const currentIndex = sortedExercises.findIndex(ex => ex.id === activeExercise)
      if (currentIndex < sortedExercises.length - 1) {
        setActiveExercise(sortedExercises[currentIndex + 1].id)
      } else {
        setActiveExercise(null) // Completed superset
      }
    }
  }

  // Generate exercise labels (A, B, C, etc.)
  const getExerciseLabel = (index: number) => {
    return String.fromCharCode(65 + index)
  }

  // Render connectivity lines between exercises
  const renderConnectivityLines = () => {
    if (!showConnectivityLines || sortedExercises.length < 2) return null

    return (
      <div className="absolute left-8 top-16 bottom-4 w-0.5 bg-gradient-to-b from-purple-300 via-blue-300 to-pink-300 opacity-60" />
    )
  }

  // Render superset header
  const renderSupersetHeader = () => (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 rounded-t-lg" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Superset icon with animation */}
            <motion.div 
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="h-6 w-6 text-white" />
            </motion.div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-800">
                Superset {supersetId}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="text-xs">
                  {supersetStats.totalExercises} exercises
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {supersetStats.totalSets} sets
                </Badge>
                <Badge 
                  variant={supersetStats.difficulty === 'Hard' ? 'destructive' : 
                          supersetStats.difficulty === 'Medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {supersetStats.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-lg font-bold">
                {supersetStats.completedExercises}/{supersetStats.totalExercises}
              </div>
              <div className="text-xs text-gray-600">completed</div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkAllComplete}>
                    {supersetStats.completedExercises === supersetStats.totalExercises ? (
                      <>
                        <Circle className="h-4 w-4 mr-2" />
                        Mark All Incomplete
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark All Complete
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStartSuperset}>
                    <Timer className="h-4 w-4 mr-2" />
                    Start Superset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Superset Progress</span>
            <span>{Math.round((supersetStats.completedExercises / supersetStats.totalExercises) * 100)}%</span>
          </div>
          <Progress 
            value={(supersetStats.completedExercises / supersetStats.totalExercises) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>
    </div>
  )

  // Render exercise list with enhanced indicators
  const renderExerciseList = () => (
    <CardContent className="relative pt-0">
      {/* Connectivity lines */}
      {renderConnectivityLines()}

      <div className="space-y-4">
        {sortedExercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
          >
            {/* Exercise position indicator */}
            <div className="absolute -left-6 top-4 z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                exercise.completed 
                  ? "bg-green-500 text-white border-green-500" 
                  : activeExercise === exercise.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-300"
              )}>
                {exercise.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  getExerciseLabel(index)
                )}
              </div>
            </div>

            {/* Exercise card with enhanced styling */}
            <div className={cn(
              "ml-6 transition-all duration-200",
              activeExercise === exercise.id && "ring-2 ring-blue-500 ring-offset-2",
              exercise.completed && "opacity-75"
            )}>
              <ExerciseCard 
                exercise={exercise}
                compact={false}
                showSuperset={false}
              />
            </div>

            {/* Connection arrow to next exercise */}
            {index < sortedExercises.length - 1 && showConnectivityLines && (
              <div className="flex justify-center my-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>then</span>
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Superset completion indicator */}
      {supersetStats.completedExercises === supersetStats.totalExercises && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center"
        >
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-semibold">Superset Complete!</p>
          <p className="text-green-600 text-sm">
            Great job completing all {supersetStats.totalExercises} exercises
          </p>
        </motion.div>
      )}
    </CardContent>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("relative", className)}
    >
      <Card className="overflow-hidden border-2 border-purple-200 shadow-lg">
        {renderSupersetHeader()}
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderExerciseList()}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
} 