/**
 * Exercise Type Section Component
 * Collapsible exercise sections with Framer Motion animations, mark all functionality, 
 * and smart completion tracking
 * 
 * Based on the excellent sectioning system from the original Kasoku workout system
 */

"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight, CheckSquare, Square, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  useExerciseContext, 
  groupContainsSupersets,
  separateGymAndSupersets,
  type WorkoutExercise,
  type ExerciseGroup,
  type ExerciseGroupType 
} from "../index"

interface ExerciseTypeSectionProps {
  group: ExerciseGroup
  className?: string
  defaultCollapsed?: boolean
}

// Animation variants for smooth collapsing
const collapseVariants = {
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98]
      },
      opacity: {
        duration: 0.25,
        delay: 0.1
      }
    }
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98]
      },
      opacity: {
        duration: 0.15
      }
    }
  }
}

// Section type configuration for styling and behavior
const SECTION_CONFIG: Record<ExerciseGroupType, {
  label: string
  bgColor: string
  borderColor: string
  textColor: string
  badgeVariant: "default" | "secondary" | "outline"
}> = {
  "warm up": {
    label: "Warm Up",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    badgeVariant: "secondary"
  },
  "gym": {
    label: "Gym", 
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeVariant: "default"
  },
  "gymMerged": {
    label: "Gym",
    bgColor: "bg-blue-50", 
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeVariant: "default"
  },
  "circuit": {
    label: "Circuit",
    bgColor: "bg-green-50",
    borderColor: "border-green-200", 
    textColor: "text-green-700",
    badgeVariant: "secondary"
  },
  "isometric": {
    label: "Isometric",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700", 
    badgeVariant: "secondary"
  },
  "plyometric": {
    label: "Plyometric",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeVariant: "secondary"
  },
  "sprint": {
    label: "Sprint",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    badgeVariant: "secondary"
  },
  "drill": {
    label: "Drill",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    badgeVariant: "secondary"
  },
  "superset": {
    label: "Superset",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    badgeVariant: "outline"
  },
  "other": {
    label: "Other",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
    badgeVariant: "outline"
  }
}

export function ExerciseTypeSection({ group, className, defaultCollapsed = false }: ExerciseTypeSectionProps) {
  const { updateExercise } = useExerciseContext()
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Get section configuration
  const config = SECTION_CONFIG[group.type] || SECTION_CONFIG.other

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const total = group.exercises.length
    const completed = group.exercises.filter(ex => ex.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      total,
      completed,
      percentage,
      allCompleted: completed === total && total > 0,
      noneCompleted: completed === 0
    }
  }, [group.exercises])

  // Handle mark all functionality
  const handleMarkAll = () => {
    const shouldComplete = !completionStats.allCompleted
    group.exercises.forEach(exercise => {
      updateExercise(exercise.id, { completed: shouldComplete })
    })
  }

  // Handle individual exercise toggle
  const handleExerciseToggle = (exerciseId: number) => {
    const exercise = group.exercises.find(ex => ex.id === exerciseId)
    if (exercise) {
      updateExercise(exerciseId, { completed: !exercise.completed })
    }
  }

  // Render exercise items for display
  const renderExerciseItems = () => {
    if (group.type === 'gymMerged' && groupContainsSupersets(group)) {
      // Handle merged gym groups with supersets
      const { gymExercises, supersets } = separateGymAndSupersets(group)
      
      return (
        <div className="space-y-3">
          {/* Regular gym exercises */}
          {gymExercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onToggle={handleExerciseToggle}
            />
          ))}
          
          {/* Supersets */}
          {supersets.map((superset) => (
            <div key={superset.id} className="space-y-2">
              <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Superset {superset.id}
                </Badge>
              </div>
              <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                {superset.exercises.map((exercise) => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onToggle={handleExerciseToggle}
                    isSuperset
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      // Regular exercise group
      return (
        <div className="space-y-2">
          {group.exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onToggle={handleExerciseToggle}
              isSuperset={group.type === 'superset'}
            />
          ))}
        </div>
      )
    }
  }

  return (
    <Card className={cn("transition-colors", config.bgColor, config.borderColor, className)}>
      <CardHeader 
        className="pb-3 cursor-pointer select-none" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Collapse/Expand Icon */}
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </motion.div>

            {/* Section Title */}
            <h3 className={cn("text-lg font-semibold", config.textColor)}>
              {config.label}
            </h3>

            {/* Exercise Count Badge */}
            <Badge variant={config.badgeVariant} className="text-xs">
              {group.exercises.length} exercise{group.exercises.length !== 1 ? 's' : ''}
            </Badge>

            {/* Completion Progress Badge */}
            {completionStats.total > 0 && (
              <Badge 
                variant={completionStats.allCompleted ? "default" : "outline"}
                className={cn("text-xs", {
                  "bg-green-100 text-green-700 border-green-300": completionStats.allCompleted,
                  "bg-yellow-100 text-yellow-700 border-yellow-300": completionStats.completed > 0 && !completionStats.allCompleted
                })}
              >
                {completionStats.completed}/{completionStats.total} complete
              </Badge>
            )}
          </div>

          {/* Mark All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleMarkAll()
            }}
            className="flex items-center gap-2 hover:bg-white/50"
          >
            {completionStats.allCompleted ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Unmark All
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Mark All
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {completionStats.total > 0 && (
          <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
            <motion.div 
              className="bg-blue-600 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionStats.percentage}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}
      </CardHeader>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={collapseVariants}
            style={{ overflow: "hidden" }}
          >
            <CardContent className="pt-0">
              {group.exercises.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">No exercises in this section.</p>
                </div>
              ) : (
                renderExerciseItems()
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// Exercise Item Component for consistent rendering
interface ExerciseItemProps {
  exercise: WorkoutExercise
  onToggle: (id: number) => void
  isSuperset?: boolean
}

function ExerciseItem({ exercise, onToggle, isSuperset = false }: ExerciseItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
        exercise.completed 
          ? "bg-green-50 border-green-200" 
          : "bg-white border-gray-200 hover:border-gray-300",
        isSuperset && "border-l-4 border-l-pink-400"
      )}
      onClick={() => onToggle(exercise.id)}
    >
      <div className="flex items-center gap-3">
        {/* Completion Checkbox */}
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
          exercise.completed 
            ? "bg-green-500 border-green-500" 
            : "border-gray-300 hover:border-gray-400"
        )}>
          {exercise.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CheckSquare className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Exercise Details */}
        <div>
          <p className={cn(
            "font-medium transition-colors",
            exercise.completed ? "text-green-700 line-through" : "text-gray-900"
          )}>
            {exercise.exercise?.name || "Unknown Exercise"}
          </p>
          {exercise.notes && (
            <p className="text-sm text-gray-600 mt-1">{exercise.notes}</p>
          )}
        </div>
      </div>

      {/* Exercise Order Badge */}
      <Badge variant="outline" className="text-xs">
        #{exercise.preset_order}
      </Badge>
    </div>
  )
}

 