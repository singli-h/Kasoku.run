"use client"

import React, { useMemo, memo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers } from "lucide-react"
import ExerciseDetailFields from "./ExerciseDetailFields"

/**
 * Exercise Timeline Component
 * 
 * Displays all exercises from all sections in chronological order.
 * Allows editing exercise details in a consolidated view.
 * 
 * @param {Object} props - Component props
 * @param {number} props.sessionId - Current session ID
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.getSectionName - Function to get section name from ID
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 */
const ExerciseTimeline = memo(({
  sessionId,
  activeSections,
  handleExerciseDetailChange,
  errors = {},
  getSectionName,
  getOrderedExercises,
}) => {
  // Get ordered exercises and supersets for each section
  const getOrderedExercisesAndSupersets = useMemo(() => {
    return (sectionId) => {
      // Get exercises for this section
      const sectionExercises = getOrderedExercises(sessionId, sectionId);
      
      // Step 1: Identify all supersets and their positions
      const supersetPositions = new Map();
      sectionExercises.forEach((exercise, index) => {
        if (exercise.supersetId && !supersetPositions.has(exercise.supersetId)) {
          supersetPositions.set(exercise.supersetId, index);
        }
      });
      
      // Step 2: Group exercises by superset while preserving order
      const supersetMap = new Map();
      const orderedSupersetExercises = new Map();
      const normalExercises = [];
      
      sectionExercises.forEach(exercise => {
        if (exercise.supersetId) {
          if (!supersetMap.has(exercise.supersetId)) {
            supersetMap.set(exercise.supersetId, []);
            orderedSupersetExercises.set(exercise.supersetId, []);
          }
          supersetMap.get(exercise.supersetId).push(exercise);
          
          // Track the original order of exercises within the superset
          if (!orderedSupersetExercises.get(exercise.supersetId).some(ex => ex.id === exercise.id)) {
            orderedSupersetExercises.get(exercise.supersetId).push(exercise);
          }
        } else {
          normalExercises.push(exercise);
        }
      });
      
      // Step 3: Create a unified list of exercises and supersets
      const unifiedItems = [];
      
      // Map of already added superset IDs
      const addedSupersets = new Set();
      
      // Add items in proper order
      sectionExercises.forEach((exercise, index) => {
        if (exercise.supersetId) {
          // If this is the first occurrence of this superset and we haven't added it yet
          if (supersetPositions.get(exercise.supersetId) === index && 
              !addedSupersets.has(exercise.supersetId)) {
            // Add the superset as a group
            unifiedItems.push({
              type: 'superset',
              id: exercise.supersetId,
              exercises: orderedSupersetExercises.get(exercise.supersetId),
              position: index
            });
            addedSupersets.add(exercise.supersetId);
          }
        } else {
          // It's a normal exercise
          unifiedItems.push({
            type: 'exercise',
            exercise,
            position: index
          });
        }
      });
      
      return unifiedItems;
    };
  }, [getOrderedExercises, sessionId]);
  
  // Get all exercises for the timeline view, properly ordered
  const orderedItems = useMemo(() => {
    // Create a flat array of ordered items
    const result = [];
    
    // Process each section in order
    activeSections.forEach(sectionId => {
      // Get the ordered exercises and supersets for this section
      const sectionItems = getOrderedExercisesAndSupersets(sectionId);
      
      // Add them to the result in their correct order
      result.push(...sectionItems);
    });
    
    return result;
  }, [activeSections, getOrderedExercisesAndSupersets]);
  
  // If no exercises, show a message
  if (orderedItems.length === 0) {
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
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">#</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Section</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Exercise</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Sets</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Reps</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Effort (%)</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Rest (sec)</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Use an IIFE to maintain a global exercise counter
                let globalExerciseCount = 1;
                
                return orderedItems.map((item, itemIndex) => {
                  if (item.type === 'exercise') {
                    // Single exercise item
                    const exercise = item.exercise;
                    const currentNumber = globalExerciseCount++;
                    
                    return (
                      <tr key={exercise.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{currentNumber}</td>
                        <td className="px-1 py-3">
                          <Badge variant="outline">{getSectionName(exercise.part)}</Badge>
                        </td>
                        <td className="px-2 py-3 text-base font-medium">{exercise.name}</td>
                        <td className="px-1 py-3">
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
                            className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                              errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]}
                            </p>
                          )}
                        </td>
                        <td className="px-1 py-3">
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
                            className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                              errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]}
                            </p>
                          )}
                        </td>
                        <td className="px-1 py-3">
                          <Input
                            type="text"
                            value={exercise.effort || ""}
                            min="1"
                            max="150"
                            onChange={(e) => {
                              const value = e.target.value
                              // Only allow numeric input
                              if (value === "" || /^\d+$/.test(value)) {
                                handleExerciseDetailChange(
                                  exercise.id,
                                  exercise.session,
                                  exercise.part,
                                  "effort",
                                  value
                                )
                              }
                            }}
                            className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                              errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]}
                            </p>
                          )}
                        </td>
                        <td className="px-1 py-3">
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
                            className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                              errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <ExerciseDetailFields
                            exercise={exercise}
                            handleExerciseDetailChange={handleExerciseDetailChange}
                            errors={errors}
                          />
                        </td>
                      </tr>
                    );
                  } else if (item.type === 'superset') {
                    // Superset containing multiple exercises
                    const rows = [];
                    
                    // Add superset header row
                    rows.push(
                      <tr key={`superset-header-${item.id}`} className="bg-blue-50">
                        <td className="px-4 py-2 text-blue-700 font-medium" colSpan={8}>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-blue-500" />
                            <span>Superset {item.id.split('-')[1]}</span>
                            <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-700 border-blue-300">
                              {item.exercises.length} exercises
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );
                    
                    // Add exercise rows with continuous numbering
                    item.exercises.forEach((exercise, exerciseIndex) => {
                      const currentNumber = globalExerciseCount++;
                      
                      rows.push(
                        <tr 
                          key={exercise.id} 
                          className="border-b hover:bg-blue-50"
                          style={{
                            borderLeft: '2px solid #60a5fa', // Blue border on left side
                            borderRight: '2px solid #60a5fa', // Blue border on right side
                            borderBottom: exerciseIndex === item.exercises.length - 1 
                              ? '2px solid #60a5fa' 
                              : '1px solid #e5e7eb',
                          }}
                        >
                          <td className="px-4 py-3 text-gray-600">
                            {currentNumber}
                          </td>
                          <td className="px-1 py-3">
                            <Badge variant="outline">{getSectionName(exercise.part)}</Badge>
                          </td>
                          <td className="px-2 py-3 font-medium">{exercise.name}</td>
                          <td className="px-1 py-3">
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
                              className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`]}
                              </p>
                            )}
                          </td>
                          <td className="px-1 py-3">
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
                              className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`]}
                              </p>
                            )}
                          </td>
                          <td className="px-1 py-3">
                            <Input
                              type="text"
                              value={exercise.effort || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                // Only allow numeric input
                                if (value === "" || /^\d+$/.test(value)) {
                                  handleExerciseDetailChange(
                                    exercise.id,
                                    exercise.session,
                                    exercise.part,
                                    "effort",
                                    value
                                  )
                                }
                              }}
                              className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]}
                              </p>
                            )}
                          </td>
                          <td className="px-1 py-3">
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
                              className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <ExerciseDetailFields
                              exercise={exercise}
                              handleExerciseDetailChange={handleExerciseDetailChange}
                              errors={errors}
                            />
                          </td>
                        </tr>
                      );
                    });
                    
                    return rows;
                  } else {
                    return null;
                  }
                });
              })()}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
})

ExerciseTimeline.displayName = "ExerciseTimeline"

export default ExerciseTimeline 