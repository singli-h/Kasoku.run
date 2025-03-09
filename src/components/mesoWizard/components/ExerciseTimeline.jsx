"use client"

import { useMemo, memo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ExerciseDetailFields from "./ExerciseDetailFields"

/**
 * Exercise Timeline Component
 * 
 * Displays all exercises from all sections in chronological order.
 * Allows editing exercise details in a consolidated view.
 * 
 * @param {Object} props - Component props
 * @param {number} props.sessionId - Current session ID
 * @param {Array} props.exercises - All exercises
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.getSectionName - Function to get section name from ID
 */
const ExerciseTimeline = memo(({
  sessionId,
  exercises,
  activeSections,
  handleExerciseDetailChange,
  errors = {},
  getSectionName,
}) => {
  // Get exercises for the current session, ordered by section order
  const orderedExercises = useMemo(() => {
    // Filter exercises for this session
    const sessionExercises = exercises.filter(ex => ex.session === sessionId)
    
    // Group exercises by section
    const exercisesBySection = {}
    sessionExercises.forEach(ex => {
      if (!exercisesBySection[ex.part]) {
        exercisesBySection[ex.part] = []
      }
      exercisesBySection[ex.part].push(ex)
    })
    
    // Order exercises according to section order
    const result = []
    activeSections.forEach(sectionId => {
      if (exercisesBySection[sectionId]) {
        result.push(...exercisesBySection[sectionId])
      }
    })
    
    return result
  }, [exercises, sessionId, activeSections])
  
  // If no exercises, show a message
  if (orderedExercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercise Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">
            No exercises added yet. Add exercises to sections above to see them in the timeline.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Order</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Section</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Exercise</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Sets</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Reps</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Rest (sec)</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {orderedExercises.map((exercise, index) => (
                <tr key={exercise.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{getSectionName(exercise.part)}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{exercise.name}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={exercise.sets || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow numeric input
                        if (value === "" || /^\d+$/.test(value)) {
                          handleExerciseDetailChange(
                            exercise.id,
                            exercise.session,
                            exercise.part,
                            "sets",
                            value
                          )
                        }
                      }}
                      className={`w-16 h-8 text-sm ${
                        errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={exercise.reps || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow numeric input
                        if (value === "" || /^\d+$/.test(value)) {
                          handleExerciseDetailChange(
                            exercise.id,
                            exercise.session,
                            exercise.part,
                            "reps",
                            value
                          )
                        }
                      }}
                      className={`w-16 h-8 text-sm ${
                        errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={exercise.rest || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow numeric input
                        if (value === "" || /^\d+$/.test(value)) {
                          handleExerciseDetailChange(
                            exercise.id,
                            exercise.session,
                            exercise.part,
                            "rest",
                            value
                          )
                        }
                      }}
                      className={`w-16 h-8 text-sm ${
                        errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ExerciseDetailFields
                      exercise={exercise}
                      handleExerciseDetailChange={handleExerciseDetailChange}
                      errors={errors}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
})

ExerciseTimeline.displayName = "ExerciseTimeline"

export default ExerciseTimeline 