/**
 * Superset Container Component
 * Beautiful superset visualization with gradient styling and grouped exercise management
 * 
 * Based on the sophisticated superset system from the original Kasoku workout system
 * Handles workout execution context with proper visual hierarchy and state management
 */

"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, ChevronRight, CheckCircle, Circle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useExerciseContext } from "../../index"
import { ExerciseCard } from "./exercise-card"
import type { WorkoutExercise } from "../../index"

interface SupersetContainerProps {
  /** Array of exercises that form this superset */
  exercises: WorkoutExercise[]
  /** Optional superset identifier - if not provided, inferred from exercises */
  supersetId?: number | string
  /** Optional custom title for the superset */
  title?: string
  /** Additional CSS classes */
  className?: string
  /** Whether this is a collapsed view */
  defaultCollapsed?: boolean
}

// Animation variants for smooth entrance
const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 }
  }
}

const exerciseVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
}

export function SupersetContainer({
  exercises,
  supersetId,
  title,
  className,
  defaultCollapsed = false
}: SupersetContainerProps) {
  const { updateExercise } = useExerciseContext()

  // Sort exercises by their position in the superset
  const sortedExercises = useMemo(() => {
    return [...exercises].sort((a, b) => {
      // First sort by exercise_order, then by position_in_superset if available
      const orderA = a.exercise_order || 0
      const orderB = b.exercise_order || 0
      return orderA - orderB
    })
  }, [exercises])

  // Calculate superset completion statistics
  const completionStats = useMemo(() => {
    const total = sortedExercises.length
    const completed = sortedExercises.filter(ex => ex.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      total,
      completed,
      percentage,
      allCompleted: completed === total && total > 0,
      noneCompleted: completed === 0
    }
  }, [sortedExercises])

  // Infer superset ID from exercises if not provided
  const inferredSupersetId = supersetId || 
    sortedExercises[0]?.superset_id || 
    `superset-${sortedExercises.map(e => e.id).join('-')}`

  // Generate superset title
  const supersetTitle = title || 
    `Superset ${typeof inferredSupersetId === 'string' ? inferredSupersetId.replace('superset-', '') : inferredSupersetId}`

  // Handle mark all functionality for the entire superset
  const handleMarkAllSuperset = () => {
    const shouldComplete = !completionStats.allCompleted
    sortedExercises.forEach(exercise => {
      updateExercise(exercise.id, { completed: shouldComplete })
    })
  }

  // Generate exercise labels (A, B, C, etc.)
  const getExerciseLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, ...
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("relative", className)}
    >
      {/* Beautiful Gradient Container */}
      <Card className="relative overflow-hidden border-2 border-blue-200 shadow-lg dark:border-blue-600">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20" />
        
        {/* Content */}
        <div className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Superset Icon */}
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full border-2 border-blue-300 dark:border-blue-600">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>

                {/* Title and Info */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">
                    {supersetTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-600 bg-background/50">
                      {sortedExercises.length} exercise{sortedExercises.length !== 1 ? 's' : ''}
                    </Badge>
                    
                    {/* Exercise Names Preview */}
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-600 bg-background/50 max-w-xs truncate">
                      {sortedExercises.map(ex => ex.exercise?.name || 'Unknown').join(' + ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Completion Status and Actions */}
              <div className="flex items-center gap-3">
                {/* Completion Badge */}
                {completionStats.total > 0 && (
                  <Badge 
                    variant={completionStats.allCompleted ? "default" : "outline"}
                    className={cn("text-sm", {
                      "bg-green-500 text-white border-green-500 dark:bg-green-600": completionStats.allCompleted,
                      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600": completionStats.completed > 0 && !completionStats.allCompleted,
                      "bg-background/50 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-600": completionStats.noneCompleted
                    })}
                  >
                    {completionStats.allCompleted ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </>
                    ) : (
                      <>
                        <Circle className="h-3 w-3 mr-1" />
                        {completionStats.completed}/{completionStats.total}
                      </>
                    )}
                  </Badge>
                )}

                {/* Mark All Button - Unified Style */}
                <Button
                  variant={completionStats.allCompleted ? "outline" : "default"}
                  size="sm"
                  onClick={handleMarkAllSuperset}
                  className={completionStats.allCompleted ? "btn-outline-enhanced" : "btn-primary-enhanced"}
                >
                  {completionStats.allCompleted ? "Unmark All" : "Mark All"}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {completionStats.total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-blue-700 dark:text-blue-400 mb-1">
                  <span>Superset Progress</span>
                  <span className="font-medium">{completionStats.percentage}%</span>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionStats.percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            {/* Exercise List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {sortedExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    variants={exerciseVariants}
                    className="relative"
                  >
                    {/* Exercise Label */}
                    <div className="absolute -left-3 top-4 z-10">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold shadow-sm">
                        {getExerciseLabel(index)}
                      </div>
                    </div>

                    {/* Exercise Card with Special Styling */}
                    <div className="ml-4">
                      <ExerciseCard
                        exercise={exercise}
                        isSuperset={true}
                        className="border-blue-200 bg-background/70 hover:bg-background/90 transition-colors"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Superset Instructions */}
            {sortedExercises.length > 1 && (
              <div className="mt-4 p-3 bg-muted/60 rounded-lg border border-blue-200 dark:border-blue-600">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Superset Instructions:</strong> Perform all exercises in sequence with minimal rest between exercises. 
                  Rest only after completing the full superset cycle.
                </p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
} 