/**
 * Exercise Card Component
 * Individual exercise cards with dynamic table layouts, set-by-set tracking, 
 * video integration, and completion states
 * 
 * Based on the sophisticated exercise card from the original Kasoku workout system
 */

"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Check, Clock, AlertCircle, Video, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useExerciseContext } from "../index"
import type { WorkoutExercise } from "../index"
import type { ExerciseTrainingDetail } from "@/types/training"
import { SetTable, getDisplayColumns, DEFAULT_FIELD_CONFIG } from "./set-row"

interface ExerciseCardProps {
  exercise: WorkoutExercise
  className?: string
  isSuperset?: boolean
}

// Exercise field configuration for dynamic table layout
interface ExerciseField {
  key: keyof ExerciseTrainingDetail
  label: string
  type: 'number' | 'time' | 'text'
  required?: boolean
  unit?: string
  placeholder?: string
}

// Dynamic field detection based on exercise data
const EXERCISE_FIELDS: ExerciseField[] = [
  { key: 'reps', label: 'Reps', type: 'number', placeholder: '12' },
  { key: 'weight', label: 'Weight', type: 'number', unit: 'lbs', placeholder: '135' },
  { key: 'duration', label: 'Duration', type: 'time', unit: 'sec', placeholder: '30' },
  { key: 'distance', label: 'Distance', type: 'number', unit: 'yards', placeholder: '100' },
  { key: 'rest_period', label: 'Rest', type: 'time', unit: 'sec', placeholder: '60' },
  { key: 'pace', label: 'Pace', type: 'text', placeholder: '7:30/mi' },
  { key: 'heart_rate', label: 'HR', type: 'number', unit: 'bpm', placeholder: '150' },
  { key: 'rir', label: 'RIR', type: 'number', placeholder: '2' },
  { key: 'rpe', label: 'RPE', type: 'number', placeholder: '7' }
]

export function ExerciseCard({ exercise, className, isSuperset = false }: ExerciseCardProps) {
  const { showVideo, updateExercise } = useExerciseContext()
  const [localNotes, setLocalNotes] = useState(exercise.notes || "")

  // Determine which fields to show based on available data
  const availableFields = useMemo(() => {
    const details = exercise.exercise_training_details || []
    const hasData = (field: ExerciseField) => {
      return details.some(detail => detail[field.key] !== null && detail[field.key] !== undefined)
    }

    // Show fields that have data OR common fields for this exercise type
    const fieldsWithData = EXERCISE_FIELDS.filter(hasData)
    
    // Always show basic fields even if no data exists yet
    const basicFields = ['reps', 'weight', 'duration'].map(key => 
      EXERCISE_FIELDS.find(f => f.key === key)
    ).filter(Boolean) as ExerciseField[]

    // Combine and dedupe
    const allFields = [...new Set([...fieldsWithData, ...basicFields])]
    return allFields.slice(0, 6) // Limit to 6 fields for clean layout
  }, [exercise.exercise_training_details])

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const details = exercise.exercise_training_details || []
    const totalSets = exercise.sets || details.length || 1
    const completedSets = details.filter(detail => detail.completed).length
    
    return {
      total: totalSets,
      completed: completedSets,
      percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
      isComplete: completedSets >= totalSets && totalSets > 0
    }
  }, [exercise.exercise_training_details, exercise.sets])

  // Handle set data updates
  const updateSetData = (setIndex: number, field: keyof ExerciseTrainingDetail, value: any) => {
    const updatedDetails = [...(exercise.exercise_training_details || [])]
    
    // Ensure we have enough detail entries
    while (updatedDetails.length <= setIndex) {
      updatedDetails.push({
        id: 0, // Will be set by backend
        exercise_training_session_id: 0, // Will be set by backend
        set_number: updatedDetails.length + 1,
        completed: false,
        reps: null,
        weight: null,
        duration: null,
        distance: null,
        rest_period: null,
        pace: null,
        heart_rate: null,
        rir: null,
        rpe: null,
        notes: null
      })
    }

    // Update the specific field
    updatedDetails[setIndex] = {
      ...updatedDetails[setIndex],
      [field]: value
    }

    // Update exercise with new details
    updateExercise(exercise.id, {
      exercise_training_details: updatedDetails
    })
  }

  // Handle set completion toggle
  const toggleSetCompletion = (setIndex: number) => {
    const detail = exercise.exercise_training_details?.[setIndex]
    const isCompleted = detail?.completed || false
    updateSetData(setIndex, 'completed', !isCompleted)
  }

  // Handle exercise notes update
  const handleNotesUpdate = () => {
    if (localNotes !== exercise.notes) {
      updateExercise(exercise.id, { notes: localNotes })
    }
  }

  // Handle overall exercise completion
  const toggleExerciseCompletion = () => {
    updateExercise(exercise.id, { completed: !exercise.completed })
  }

  // Generate sets for display
  const sets = useMemo(() => {
    const targetSets = exercise.sets || 3
    const details = exercise.exercise_training_details || []
    
    return Array.from({ length: Math.max(targetSets, details.length) }, (_, index) => ({
      index,
      detail: details[index] || null,
      isCompleted: details[index]?.completed || false
    }))
  }, [exercise.sets, exercise.exercise_training_details])

  return (
    <Card className={cn(
      "transition-all duration-200",
      exercise.completed && "border-green-500 bg-green-50",
      isSuperset && "border-l-4 border-l-pink-400",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Exercise Name */}
            <h4 className={cn(
              "font-semibold text-lg",
              exercise.completed && "text-green-700 line-through"
            )}>
              {exercise.exercise?.name || "Unknown Exercise"}
            </h4>

            {/* Order Badge */}
            <Badge variant="outline" className="text-xs">
              #{exercise.preset_order}
            </Badge>

            {/* Completion Badge */}
            {exercise.completed && (
              <Badge variant="default" className="bg-green-500 text-white">
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Video Button */}
            {showVideo && (exercise.exercise?.demo_url || exercise.exercise?.video_url) && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  const url = exercise.exercise?.video_url || exercise.exercise?.demo_url
                  if (url) window.open(url, '_blank')
                }}
              >
                <Video className="h-3 w-3" />
                Video
              </Button>
            )}

            {/* Complete Toggle */}
            <Button
              variant={exercise.completed ? "outline" : "default"}
              size="sm"
              onClick={toggleExerciseCompletion}
              className={cn(
                "flex items-center gap-1",
                exercise.completed && "border-green-500 text-green-700"
              )}
            >
              {exercise.completed ? (
                <>
                  <Check className="h-3 w-3" />
                  Done
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Mark Done
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Exercise Description */}
        {exercise.exercise?.description && (
          <p className="text-sm text-gray-600 mt-2">
            {exercise.exercise.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="bg-blue-600 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionStatus.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {completionStatus.completed}/{completionStatus.total} sets
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Sets Table */}
        {sets.length > 0 && (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
              <div className="col-span-2">Set</div>
              {availableFields.map((field) => (
                <div key={field.key} className="col-span-2 text-center">
                  {field.label}
                  {field.unit && <span className="ml-1 text-gray-400">({field.unit})</span>}
                </div>
              ))}
              <div className="col-span-2 text-center">Done</div>
            </div>

            {/* Set Rows */}
            <div className="space-y-2">
              {sets.map((set) => (
                <motion.div
                  key={set.index}
                  className={cn(
                    "grid grid-cols-12 gap-2 p-2 rounded-md border transition-colors",
                    set.isCompleted 
                      ? "bg-green-50 border-green-200" 
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: set.index * 0.05 }}
                >
                  {/* Set Number */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {set.index + 1}
                    </span>
                  </div>

                  {/* Dynamic Fields */}
                  {availableFields.map((field) => (
                    <div key={field.key} className="col-span-2">
                      <Input
                        type={field.type === 'time' ? 'number' : field.type}
                        value={set.detail?.[field.key] || ''}
                        onChange={(e) => updateSetData(set.index, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="h-8 text-sm text-center"
                        disabled={set.isCompleted}
                      />
                    </div>
                  ))}

                  {/* Completion Toggle */}
                  <div className="col-span-2 flex justify-center">
                    <Button
                      variant={set.isCompleted ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSetCompletion(set.index)}
                      className={cn(
                        "h-8 w-8 p-0",
                        set.isCompleted && "bg-green-500 hover:bg-green-600"
                      )}
                    >
                      {set.isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 border rounded border-gray-400" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise Notes */}
        <div className="mt-4">
          <Textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesUpdate}
            placeholder="Add exercise notes..."
            className="min-h-[60px] text-sm"
          />
        </div>

        {/* Video Embed (if enabled and available) */}
        {showVideo && exercise.exercise?.video_url && (
          <div className="mt-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              {/* TODO: Implement proper video player component */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Video className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Video Player Component</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open(exercise.exercise?.video_url, '_blank')}
                    className="text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Video
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 