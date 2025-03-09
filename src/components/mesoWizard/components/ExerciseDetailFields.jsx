"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

/**
 * Exercise Detail Fields Component
 * 
 * Displays and manages exercise-specific detail fields based on exercise type.
 * Fields include 1RM%, power, velocity, distance, height, effort, etc.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.exercise - Exercise data
 * @param {Function} props.handleExerciseDetailChange - Function to handle detail changes
 * @param {Object} props.errors - Validation errors
 */
const ExerciseDetailFields = memo(({ exercise, handleExerciseDetailChange, errors = {} }) => {
  // Determine which fields to show based on exercise type
  const showOneRepMax = exercise.part === "gym"
  const showPlyometricFields = exercise.part === "plyometric"
  const showSprintFields = exercise.part === "sprint"
  const showIsometricFields = exercise.part === "isometric"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3">
          Edit Details
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2">
        <div className="space-y-2 p-2">
          {/* 1RM% Field - For gym exercises */}
          {showOneRepMax && (
            <div>
              <Label htmlFor={`${exercise.id}-1rm`} className="text-xs">
                1RM (%)
              </Label>
              <Input
                id={`${exercise.id}-1rm`}
                type="text"
                value={exercise.oneRepMax || ""}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numeric input
                  if (value === "" || /^\d+$/.test(value)) {
                    handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "oneRepMax", value)
                  }
                }}
                className={`mt-1 ${
                  errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-oneRepMax`] ? "border-red-500" : ""
                }`}
              />
              {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-oneRepMax`] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-oneRepMax`]}
                </p>
              )}
            </div>
          )}

          {/* Power & Velocity Fields - For gym and powerlifting exercises */}
          {(showOneRepMax || exercise.type === "powerlifting") && (
            <>
              <div>
                <Label htmlFor={`${exercise.id}-power`} className="text-xs">
                  Power (W)
                </Label>
                <Input
                  id={`${exercise.id}-power`}
                  type="text"
                  value={exercise.power || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "power", value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-velocity`} className="text-xs">
                  Velocity (m/s)
                </Label>
                <Input
                  id={`${exercise.id}-velocity`}
                  type="text"
                  value={exercise.velocity || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input with decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "velocity", value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {/* Distance & Height Fields - For plyometric and sprint exercises */}
          {(showPlyometricFields || showSprintFields) && (
            <>
              <div>
                <Label htmlFor={`${exercise.id}-distance`} className="text-xs">
                  Distance (m)
                </Label>
                <Input
                  id={`${exercise.id}-distance`}
                  type="text"
                  value={exercise.distance || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input with decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "distance", value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-height`} className="text-xs">
                  Height (cm)
                </Label>
                <Input
                  id={`${exercise.id}-height`}
                  type="text"
                  value={exercise.height || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input with decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "height", value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-performing-time`} className="text-xs">
                  Performing Time (sec)
                </Label>
                <Input
                  id={`${exercise.id}-performing-time`}
                  type="text"
                  value={exercise.performing_time || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input with decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "performing_time", value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {/* Hold Time Field - For isometric exercises */}
          {showIsometricFields && (
            <div>
              <Label htmlFor={`${exercise.id}-hold-time`} className="text-xs">
                Hold Time (sec)
              </Label>
              <Input
                id={`${exercise.id}-hold-time`}
                type="text"
                value={exercise.performing_time || ""}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numeric input with decimal point
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "performing_time", value)
                  }
                }}
                className="mt-1"
              />
            </div>
          )}

          {/* Effort Field - For all exercises */}
          <div>
            <Label htmlFor={`${exercise.id}-effort`} className="text-xs">
              Effort (%)
            </Label>
            <Input
              id={`${exercise.id}-effort`}
              type="text"
              value={exercise.effort || ""}
              onChange={(e) => {
                const value = e.target.value
                // Only allow numeric input with decimal point
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "effort", value)
                }
              }}
              className="mt-1"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

ExerciseDetailFields.displayName = "ExerciseDetailFields"

export default ExerciseDetailFields 