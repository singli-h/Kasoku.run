"use client"

import React, { useMemo, memo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers } from "lucide-react"
import ExerciseDetailFields from "./ExerciseDetailFields"
import { Button } from "@/components/ui/button"

/**
 * Exercise Timeline Component
 * 
 * Displays all exercises from all sections in chronological order.
 * Allows editing exercise details in a consolidated view.
 * 
 * @param {Object} props - Component props
 * @param {number} props.sessionId - Current session ID
 * @param {string} props.sessionName - Current session name
 * @param {string} props.weekday - Current weekday
 * @param {string} props.trainingGoals - Training goals text
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.getSectionName - Function to get section name from ID
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 * @param {Array} props.supersets - Array of supersets for this session
 * @param {string} props.mode - Mode of the timeline ('individual' or 'group')
 * @param {boolean} props.aiLoadingAll - Indicates if AI is loading all sessions
 * @param {number} props.cooldownAll - Cooldown time for auto-filling all sessions
 * @param {Function} props.handleAutoFillAll - Function to handle auto-filling all sessions
 * @param {Function} props.handleRevertAll - Function to handle reverting all sessions
 * @param {number} props.historyAllCount - Count of history for all sessions
 */
const ExerciseTimeline = memo(({
  sessionId,
  activeSections,
  handleExerciseDetailChange,
  errors = {},
  getSectionName,
  getOrderedExercises,
  supersets = [],
  mode = 'individual',
  aiLoadingAll,
  cooldownAll,
  handleAutoFillAll,
  handleRevertAll,
  historyAllCount
}) => {
  // Get ordered exercises and supersets for each section
  const getOrderedExercisesAndSupersets = useMemo(() => {
    return (sectionId) => {
      // Get exercises for this section, including those that are part of supersets
      // but only if the superset belongs to this section
      const sectionExercises = getOrderedExercises(sessionId, sectionId);
      
      // Step 1: Identify all supersets and find the position of the first exercise in each
      const supersetPositions = new Map();
      const supersetIds = new Set();
      
      // First pass - collect all superset IDs and find the first occurrence position
      sectionExercises.forEach((exercise) => {
        if (exercise.supersetId && exercise.section === sectionId) {
          // Only add supersets that belong to this section
          supersetIds.add(exercise.supersetId);
          // Use the minimum position value for each superset
          const currentPosition = exercise.position || 0;
          if (!supersetPositions.has(exercise.supersetId) || 
              currentPosition < (supersetPositions.get(exercise.supersetId) || Infinity)) {
            supersetPositions.set(exercise.supersetId, currentPosition);
          }
        }
      });
      
      // Step 2: Group exercises by superset while preserving order
      const supersetMap = new Map();
      const orderedSupersetExercises = new Map();
      const normalExercises = [];
      
      // Initialize maps for each superset
      supersetIds.forEach(id => {
        supersetMap.set(id, []);
        orderedSupersetExercises.set(id, []);
      });
      
      // Collect exercises for each superset
      sectionExercises.forEach(exercise => {
        if (exercise.supersetId && supersetIds.has(exercise.supersetId)) {
          supersetMap.get(exercise.supersetId).push(exercise);
          
          // Track the original order of exercises within the superset
          if (!orderedSupersetExercises.get(exercise.supersetId).some(ex => ex.id === exercise.id)) {
            orderedSupersetExercises.get(exercise.supersetId).push(exercise);
          }
        } else if (!exercise.supersetId) {
          normalExercises.push(exercise);
        }
      });
      
      // Sort exercises within each superset strictly by their position
      orderedSupersetExercises.forEach((exercises) => {
        exercises.sort((a, b) => {
          // First sort by position
          const positionDiff = (a.position || 0) - (b.position || 0);
          if (positionDiff !== 0) return positionDiff;
          
          // If positions are identical, sort by ID (assuming newer items have higher IDs)
          return a.id - b.id;
        });
      });
      
      // Step 3: Create a unified list of exercises and supersets
      const unifiedItems = [];
      const addedExerciseIds = new Set(); // Track added exercise IDs to avoid duplicates
      
      // Add normal exercises
      normalExercises.forEach(exercise => {
        if (!addedExerciseIds.has(exercise.id)) {
          unifiedItems.push({
            type: 'exercise',
            exercise,
            position: exercise.position || 0
          });
          addedExerciseIds.add(exercise.id);
        }
      });
      
      // Add supersets with their exercises
      supersetIds.forEach(supersetId => {
        const supersetExercises = orderedSupersetExercises.get(supersetId) || [];
        
        // Skip empty supersets
        if (supersetExercises.length === 0) return;
        
        // Get the superset position from the map
        const position = supersetPositions.get(supersetId) || 0;
        
        // Add the superset as a group
        unifiedItems.push({
          type: 'superset',
          id: supersetId,
          displayNumber: Array.from(supersetIds).indexOf(supersetId) + 1,
          exercises: supersetExercises,
          position: position
        });
        
        // Mark all exercises in this superset as added
        supersetExercises.forEach(ex => addedExerciseIds.add(ex.id));
      });
      
      // Sort the unified items by position
      unifiedItems.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      return unifiedItems;
    };
  }, [getOrderedExercises, sessionId]);
  
  // Get all exercises for the timeline view, properly ordered
  const orderedItems = useMemo(() => {
    // Create a flat array of ordered items
    const result = [];
    
    // Process each section in their defined order 
    // The section order in activeSections determines the priority
    activeSections.forEach((sectionId, sectionIndex) => {
      // Get the ordered exercises and supersets for this section
      const sectionItems = getOrderedExercisesAndSupersets(sectionId);
      
      // Add them to the result, adding section metadata to maintain hierarchy
      sectionItems.forEach(item => {
        result.push({
          ...item,
          sectionId,
          sectionIndex  // Store the section index to maintain section order
        });
      });
    });
    
    // Sort the combined results respecting the hierarchical order:
    // 1. First by section index (to maintain the active sections order)
    // 2. Then by position within each section (for ordering items in each section)
    result.sort((a, b) => {
      // First compare by section index
      if (a.sectionIndex !== b.sectionIndex) {
        return a.sectionIndex - b.sectionIndex;
      }
      
      // If in the same section, compare by position
      return (a.position || 0) - (b.position || 0);
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
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Exercise Timeline</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className={`bg-gradient-to-r from-purple-600 to-blue-500 text-white transform transition hover:scale-105 ${aiLoadingAll || cooldownAll > 0 ? 'opacity-50 cursor-wait' : ''}`}
            onClick={handleAutoFillAll}
            disabled={aiLoadingAll || cooldownAll > 0}
          >
            🧠 Auto-Fill All Sessions{cooldownAll > 0 ? ` (${cooldownAll}s)` : ''}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-gray-100 transition"
            onClick={handleRevertAll}
            disabled={historyAllCount === 0}
          >
            Revert All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">#</th>
                {mode !== 'group' && (
                  <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Section</th>
                )}
                <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Exercise</th>
                {mode === 'group' ? (
                  <>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Distance</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Time (sec)</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Effort (%)</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Rest (sec)</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Details</th>
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Sets</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Reps</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Effort (%)</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Rest (sec)</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">Details</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Use an IIFE to maintain a global exercise counter
                let globalExerciseCount = 1;
                
                return orderedItems.map((item) => {
                  if (item.type === 'exercise') {
                    // Single exercise item
                    const exercise = item.exercise;
                    const currentNumber = globalExerciseCount++;
                    
                    return (
                      <tr key={exercise.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{currentNumber}</td>
                        {mode !== 'group' && (
                          <td className="px-1 py-3">
                            <Badge variant="outline">{getSectionName(exercise.part)}</Badge>
                          </td>
                        )}
                        <td className="px-2 py-3 text-base font-medium">{exercise.name}</td>
                        {mode === 'group' ? (
                          // Group mode: show distance & duration columns
                          <>  
                            <td className="px-2 py-3">
                              <Input
                                type="text"
                                value={exercise.distance || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || /^\d+$/.test(val)) {
                                    handleExerciseDetailChange(
                                      exercise.id,
                                      exercise.session,
                                      exercise.part,
                                      "distance",
                                      val
                                    )
                                  }
                                }}
                                className={`w-20 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                  errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-distance`]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <Input
                                type="text"
                                value={exercise.duration || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || /^\d+(\.\d+)?$/.test(val)) {
                                    handleExerciseDetailChange(
                                      exercise.id,
                                      exercise.session,
                                      exercise.part,
                                      "duration",
                                      val
                                    )
                                  }
                                }}
                                className={`w-20 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                  errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-duration`]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <Input
                                type="text"
                                value={exercise.effort || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || /^\d+$/.test(val)) {
                                    handleExerciseDetailChange(
                                      exercise.id,
                                      exercise.session,
                                      exercise.part,
                                      "effort",
                                      val
                                    )
                                  }
                                }}
                                className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                  errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <Input
                                type="text"
                                value={exercise.rest || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || /^\d+$/.test(val)) {
                                    handleExerciseDetailChange(
                                      exercise.id,
                                      exercise.session,
                                      exercise.part,
                                      "rest",
                                      val
                                    )
                                  }
                                }}
                                className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                  errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <ExerciseDetailFields
                                exercise={exercise}
                                mode={mode}
                                handleExerciseDetailChange={handleExerciseDetailChange}
                                errors={errors}
                              />
                            </td>
                          </>
                        ) : (
                          // Individual mode: show full columns
                          <>
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
                                mode={mode}
                                handleExerciseDetailChange={handleExerciseDetailChange}
                                errors={errors}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  } else if (item.type === 'superset') {
                    // Superset containing multiple exercises
                    const rows = [];
                    
                    // Extract the display number using multiple sources
                    // 1. First try to find the superset in the supersets array (most accurate)
                    const supersetInfo = supersets.find(s => s.id === item.id);
                    let displayNumber = supersetInfo?.displayNumber;
                    
                    // 2. If not found in supersets array, try to extract from ID
                    let extractedFromId = null;
                    if (!displayNumber && item.id) {
                      const idParts = item.id.split('-');
                      if (idParts.length >= 3) {
                        extractedFromId = parseInt(idParts[idParts.length - 1], 10);
                        if (!isNaN(extractedFromId)) {
                          displayNumber = extractedFromId;
                        }
                      }
                    }
                    
                    // 3. Fall back to item's own displayNumber or default to 1
                    if (!displayNumber) {
                      displayNumber = item.displayNumber || 1;
                    }
                    
                    // Debug log to trace the display number resolution
                    console.log(`Superset ${item.id}: Found in supersets: ${!!supersetInfo}, ` + 
                                `Superset displayNumber: ${supersetInfo?.displayNumber}, ` +
                                `Extracted from ID: ${extractedFromId}, ` +
                                `Item's displayNumber: ${item.displayNumber}, ` +
                                `Final displayNumber: ${displayNumber}`);
                    
                    // Add superset header row
                    rows.push(
                      <tr key={`superset-header-${item.id}`} className="bg-blue-50">
                        <td className="px-4 py-2 text-blue-700 font-medium" colSpan={mode === 'group' ? 7 : 8}>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-blue-500" />
                            <span>Superset {displayNumber}</span>
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
                          {mode !== 'group' && (
                            <td className="px-1 py-3">
                              <Badge variant="outline">{getSectionName(exercise.part)}</Badge>
                            </td>
                          )}
                          <td className="px-2 py-3 font-medium">{exercise.name}</td>
                          {mode === 'group' ? (
                            // Group mode: show distance & duration columns
                            <>  
                              <td className="px-2 py-3">
                                <Input
                                  type="text"
                                  value={exercise.distance || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "" || /^\d+$/.test(val)) {
                                      handleExerciseDetailChange(
                                        exercise.id,
                                        exercise.session,
                                        exercise.part,
                                        "distance",
                                        val
                                      )
                                    }
                                  }}
                                  className={`w-20 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                    errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-distance`]
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                              </td>
                              <td className="px-2 py-3">
                                <Input
                                  type="text"
                                  value={exercise.duration || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "" || /^\d+(\.\d+)?$/.test(val)) {
                                      handleExerciseDetailChange(
                                        exercise.id,
                                        exercise.session,
                                        exercise.part,
                                        "duration",
                                        val
                                      )
                                    }
                                  }}
                                  className={`w-20 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                    errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-duration`]
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                              </td>
                              <td className="px-2 py-3">
                                <Input
                                  type="text"
                                  value={exercise.effort || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "" || /^\d+$/.test(val)) {
                                      handleExerciseDetailChange(
                                        exercise.id,
                                        exercise.session,
                                        exercise.part,
                                        "effort",
                                        val
                                      )
                                    }
                                  }}
                                  className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                    errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-effort`]
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                              </td>
                              <td className="px-2 py-3">
                                <Input
                                  type="text"
                                  value={exercise.rest || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "" || /^\d+$/.test(val)) {
                                      handleExerciseDetailChange(
                                        exercise.id,
                                        exercise.session,
                                        exercise.part,
                                        "rest",
                                        val
                                      )
                                    }
                                  }}
                                  className={`w-16 h-8 text-sm border focus:border-blue-400 text-center px-1 ${
                                    errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`]
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                              </td>
                              <td className="px-2 py-3">
                                <ExerciseDetailFields
                                  exercise={exercise}
                                  mode={mode}
                                  handleExerciseDetailChange={handleExerciseDetailChange}
                                  errors={errors}
                                />
                              </td>
                            </>
                          ) : (
                            // Individual mode: show full columns
                            <>
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
                                  mode={mode}
                                  handleExerciseDetailChange={handleExerciseDetailChange}
                                  errors={errors}
                                />
                              </td>
                            </>
                          )}
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