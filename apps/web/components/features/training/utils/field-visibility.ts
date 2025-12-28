/**
 * Field Visibility Utility
 *
 * Determines which fields should be visible for set input based on:
 * 1. Required fields per exercise type (always show)
 * 2. Allowed optional fields per exercise type (show if plan has values)
 * 3. Never-show fields that don't apply to the exercise type
 *
 * Exercise Type Reference:
 * 1 = Isometric (planks, wall sits, holds)
 * 2 = Plyometric (box jumps, jump squats, bounding)
 * 3 = Gym (squats, bench press, deadlifts)
 * 4 = Warmup (dynamic stretches, jogging, mobility)
 * 5 = Circuit (circuit training stations, AMRAP)
 * 6 = Sprint (100m, flying sprints, acceleration)
 * 7 = Drill (A-skips, B-skips, technique drills)
 */

/**
 * Required fields per exercise type (always show for athlete input)
 * These are the essential fields athletes need to log for each exercise type
 */
const REQUIRED_FIELDS_BY_TYPE: Record<number, string[]> = {
  1: ['performing_time', 'rest_time'], // Isometric: duration + rest
  2: ['reps', 'height', 'rest_time'], // Plyometric: reps + jump height + rest
  3: ['reps', 'weight', 'rest_time'], // Gym: reps + weight + rest
  4: ['reps', 'rest_time'], // Warmup: reps + rest
  5: ['performing_time', 'rest_time'], // Circuit: duration + rest
  6: ['distance', 'performing_time', 'velocity', 'rest_time'], // Sprint: distance + time + velocity + rest
  7: ['reps', 'rest_time'], // Drill: reps + rest
}

/**
 * Allowed optional fields per exercise type
 * These fields can be shown if the coach includes them in the plan
 */
const OPTIONAL_FIELDS_BY_TYPE: Record<number, string[]> = {
  1: ['resistance', 'effort'], // Isometric: resistance bands, effort %
  2: ['distance', 'effort', 'power', 'velocity'], // Plyometric: bounding distance, VBT, force plate
  3: ['rpe', 'tempo', 'resistance', 'effort', 'power', 'velocity'], // Gym: RPE, tempo, VBT, Keiser
  4: ['distance', 'performing_time'], // Warmup: jogging distance, timed warmups
  5: ['reps', 'effort', 'distance'], // Circuit: rep-based stations, effort
  6: ['effort', 'resistance'], // Sprint: effort %, resistance (1080 Sprint) - velocity now required
  7: ['distance', 'performing_time', 'effort'], // Drill: running drills, timed drills
}

/**
 * Fields that should NEVER be shown for each exercise type
 * Even if plan data contains these values, they will not be displayed
 */
const EXCLUDED_FIELDS_BY_TYPE: Record<number, string[]> = {
  1: ['reps', 'weight', 'distance', 'height', 'tempo', 'power', 'velocity', 'rpe'], // Isometric
  2: ['weight', 'resistance', 'tempo', 'rpe'], // Plyometric (force plate data goes in metadata)
  3: ['distance', 'height'], // Gym
  4: ['weight', 'height', 'tempo', 'power', 'velocity', 'resistance', 'rpe', 'effort'], // Warmup
  5: ['weight', 'height', 'tempo', 'power', 'velocity', 'resistance', 'rpe'], // Circuit
  6: ['reps', 'weight', 'height', 'tempo', 'power', 'rpe'], // Sprint (resistance for 1080 Sprint)
  7: ['weight', 'height', 'resistance', 'tempo', 'power', 'velocity', 'rpe'], // Drill
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
 * @param options.forCoach - If true, shows all configurable fields (required + optional)
 * @returns Array of field keys that should be visible
 */
export function getVisibleFields(
  exerciseTypeId: number | undefined,
  planSets: Array<{ [key: string]: unknown }> = [],
  options: { forCoach?: boolean } = {}
): string[] {
  const { forCoach = false } = options

  // Default to reps + rest_time if exercise type unknown
  if (!exerciseTypeId) {
    return forCoach ? ['reps', 'weight', 'restTime', 'rpe'] : ['reps', 'restTime']
  }

  // Get required fields for this exercise type (using database field names)
  const required = REQUIRED_FIELDS_BY_TYPE[exerciseTypeId] || ['reps', 'rest_time']
  const allowedOptional = OPTIONAL_FIELDS_BY_TYPE[exerciseTypeId] || []
  const excluded = EXCLUDED_FIELDS_BY_TYPE[exerciseTypeId] || []

  // Map required fields to UI field names
  const requiredMapped = required.map(field => FIELD_NAME_MAP[field] || field)

  // Map allowed optional fields to UI field names
  const allowedOptionalMapped = allowedOptional.map(field => FIELD_NAME_MAP[field] || field)

  // For coach mode, show all configurable fields (required + optional)
  if (forCoach) {
    return [...requiredMapped, ...allowedOptionalMapped]
  }

  // For athlete mode, show required + optional fields with values
  const excludedMapped = excluded.map(field => FIELD_NAME_MAP[field] || field)

  // Scan plan sets for optional fields with non-null values
  const optional = new Set<string>()

  planSets.forEach(set => {
    Object.keys(set).forEach(key => {
      // Handle both database field names (performing_time) and UI field names (performingTime)
      const dbFieldName = UI_TO_DB_MAP[key] || key
      const uiFieldName = FIELD_NAME_MAP[dbFieldName] || key

      // Skip if field is in excluded list
      if (excludedMapped.includes(uiFieldName)) {
        return
      }

      // Skip if already in required fields
      if (requiredMapped.includes(uiFieldName)) {
        return
      }

      // Only add if field is in allowed optional list AND has a value
      const value = set[key]
      if (value != null && allowedOptionalMapped.includes(uiFieldName)) {
        optional.add(uiFieldName)
      }
    })
  })

  // Return required fields first, then optional fields
  return [...requiredMapped, ...Array.from(optional)]
}

/**
 * Get all fields that could be shown for an exercise type (for coach planning UI)
 * Returns required + optional fields (excludes never-show fields)
 *
 * @param exerciseTypeId - Exercise type ID from database (1-7)
 * @returns Array of field keys that can be configured for this exercise type
 */
export function getConfigurableFields(exerciseTypeId: number | undefined): string[] {
  if (!exerciseTypeId) {
    // Default: show common fields
    return ['reps', 'weight', 'restTime', 'rpe']
  }

  const required = REQUIRED_FIELDS_BY_TYPE[exerciseTypeId] || ['reps', 'rest_time']
  const optional = OPTIONAL_FIELDS_BY_TYPE[exerciseTypeId] || []

  // Combine and map to UI field names
  const allFields = [...required, ...optional]
  return allFields.map(field => FIELD_NAME_MAP[field] || field)
}

/**
 * Check if a field is valid for an exercise type
 *
 * @param exerciseTypeId - Exercise type ID from database (1-7)
 * @param fieldName - Field name (UI or database format)
 * @returns true if the field can be used for this exercise type
 */
export function isFieldAllowed(
  exerciseTypeId: number | undefined,
  fieldName: string
): boolean {
  if (!exerciseTypeId) {
    return true // No type = allow all fields
  }

  // Convert to UI field name for comparison
  const dbFieldName = UI_TO_DB_MAP[fieldName] || fieldName
  const uiFieldName = FIELD_NAME_MAP[dbFieldName] || fieldName

  const excluded = EXCLUDED_FIELDS_BY_TYPE[exerciseTypeId] || []
  const excludedMapped = excluded.map(field => FIELD_NAME_MAP[field] || field)

  return !excludedMapped.includes(uiFieldName)
}

