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
import { useExerciseContext } from "../index"
import { ExerciseCard } from "./exercise-card"
import type { WorkoutExercise } from "../index"

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
      ease: [0.16, 1, 0.3, 1],
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
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
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
      // First sort by preset_order, then by position_in_superset if available
      const orderA = a.preset_order || 0
      const orderB = b.preset_order || 0
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
      <Card className="relative overflow-hidden border-2 border-purple-200 shadow-lg">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
        
        {/* Content */}
        <div className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Superset Icon */}
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full border-2 border-purple-300">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>

                {/* Title and Info */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-purple-800">
                    {supersetTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-600 border-purple-300 bg-white/50">
                      {sortedExercises.length} exercise{sortedExercises.length !== 1 ? 's' : ''}
                    </Badge>
                    
                    {/* Exercise Names Preview */}
                    <Badge variant="outline" className="text-purple-600 border-purple-300 bg-white/50 max-w-xs truncate">
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
                      "bg-green-500 text-white border-green-500": completionStats.allCompleted,
                      "bg-yellow-100 text-yellow-700 border-yellow-300": completionStats.completed > 0 && !completionStats.allCompleted,
                      "bg-white/50 text-purple-600 border-purple-300": completionStats.noneCompleted
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

                {/* Mark All Button */}
                <Button
                  variant={completionStats.allCompleted ? "outline" : "default"}
                  size="sm"
                  onClick={handleMarkAllSuperset}
                  className={cn(
                    "bg-white/80 hover:bg-white border-purple-300",
                    completionStats.allCompleted 
                      ? "text-purple-600 hover:bg-purple-50" 
                      : "text-purple-700 hover:bg-purple-50"
                  )}
                >
                  {completionStats.allCompleted ? "Unmark All" : "Mark All"}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {completionStats.total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-purple-700 mb-1">
                  <span>Superset Progress</span>
                  <span className="font-medium">{completionStats.percentage}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
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
                      <div className="flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-bold shadow-sm">
                        {getExerciseLabel(index)}
                      </div>
                    </div>

                    {/* Exercise Card with Special Styling */}
                    <div className="ml-4">
                      <ExerciseCard
                        exercise={exercise}
                        isSuperset={true}
                        className="border-purple-200 bg-white/70 hover:bg-white/90 transition-colors"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Superset Instructions */}
            {sortedExercises.length > 1 && (
              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
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