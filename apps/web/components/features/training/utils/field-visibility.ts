/**
 * Field Visibility Utility
 * 
 * Determines which fields should be visible for athlete input based on:
 * 1. Required fields per exercise type (always show)
 * 2. Optional fields present in plan data (show if plan has values)
 */

/**
 * Required fields per exercise type (always show for athlete input)
 * These are the essential fields athletes need to log for each exercise type
 */
const REQUIRED_FIELDS_BY_TYPE: Record<number, string[]> = {
  1: ['performing_time', 'rest_time'], // Isometric: duration + rest
  2: ['reps', 'rest_time'], // Plyometric: reps + rest (height optional)
  3: ['reps', 'weight', 'rest_time'], // Gym: reps + weight + rest
  4: ['reps', 'rest_time'], // Warmup: reps + rest (duration optional)
  5: ['performing_time', 'rest_time'], // Circuit: duration + rest
  6: ['distance', 'performing_time', 'rest_time'], // Sprint: distance + time + rest
  7: ['reps', 'rest_time'], // Drill: reps + rest (distance optional for running drills)
}

/**
 * Field name mapping from database to UI
 * Maps database field names to the field keys used in TrainingSet
 */
const FIELD_NAME_MAP: Record<string, string> = {
  reps: 'reps',
  weight: 'weight',
  distance: 'distance',
  performing_time: 'performingTime',
  rest_time: 'restTime',
  tempo: 'tempo',
  rpe: 'rpe',
  power: 'power',
  velocity: 'velocity',
  height: 'height',
  resistance: 'resistance',
  effort: 'effort',
}

/**
 * Reverse mapping from UI field names to database field names
 */
const UI_TO_DB_MAP: Record<string, string> = {
  reps: 'reps',
  weight: 'weight',
  distance: 'distance',
  performingTime: 'performing_time',
  restTime: 'rest_time',
  tempo: 'tempo',
  rpe: 'rpe',
  power: 'power',
  velocity: 'velocity',
  height: 'height',
  resistance: 'resistance',
  effort: 'effort',
}

/**
 * Get visible fields for an exercise based on exercise type and plan data
 * 
 * @param exerciseTypeId - Exercise type ID from database (1-7)
 * @param planSets - Array of plan sets with field values
 * @returns Array of field keys that should be visible
 */
export function getVisibleFields(
  exerciseTypeId: number | undefined,
  planSets: Array<{ [key: string]: any }> = []
): string[] {
  // Default to reps + rest_time if exercise type unknown
  if (!exerciseTypeId) {
    return ['reps', 'restTime']
  }

  // Get required fields for this exercise type (using database field names)
  const required = REQUIRED_FIELDS_BY_TYPE[exerciseTypeId] || ['reps', 'rest_time']
  
  // Map required fields to UI field names
  const requiredMapped = required.map(field => FIELD_NAME_MAP[field] || field)
  
  // Scan plan sets for optional fields with non-null values
  const optional = new Set<string>()
  
  planSets.forEach(set => {
    Object.keys(set).forEach(key => {
      // Handle both database field names (performing_time) and UI field names (performingTime)
      // First check if it's a UI field name and map to DB, then map back to UI
      const dbFieldName = UI_TO_DB_MAP[key] || key
      const uiFieldName = FIELD_NAME_MAP[dbFieldName] || key
      
      // Add if not null/undefined and not already in required fields
      if (set[key] != null && !requiredMapped.includes(uiFieldName)) {
        optional.add(uiFieldName)
      }
    })
  })
  
  // Return required fields first, then optional fields
  return [...requiredMapped, ...Array.from(optional)]
}

