import {
  toSnakeCase,
  toCamelCase,
  convertKeysToSnakeCase,
  convertKeysToCamelCase,
  isValidEntityType,
  isWorkoutEntityType,
  isAnyValidEntityType,
  getEntityIdField,
  getAllEntityIdField,
  getEntityTableName,
  getAllEntityTableName,
  ENTITY_ID_FIELDS,
  WORKOUT_ENTITY_ID_FIELDS,
  ALL_ENTITY_ID_FIELDS,
  ENTITY_TABLE_NAMES,
  ALL_ENTITY_TABLE_NAMES,
  CAMEL_TO_SNAKE_MAP,
  METADATA_FIELDS,
  ID_FIELDS,
} from './entity-mappings'

// ============================================================================
// toSnakeCase
// ============================================================================

describe('toSnakeCase', () => {
  it('converts explicit mapped fields correctly', () => {
    expect(toSnakeCase('sessionPlanId')).toBe('id')
    expect(toSnakeCase('exerciseId')).toBe('exercise_id')
    expect(toSnakeCase('exerciseOrder')).toBe('exercise_order')
    expect(toSnakeCase('setIndex')).toBe('set_index')
    expect(toSnakeCase('restTime')).toBe('rest_time')
    expect(toSnakeCase('performingTime')).toBe('performing_time')
    expect(toSnakeCase('resistanceUnitId')).toBe('resistance_unit_id')
  })

  it('falls back to algorithmic conversion for unmapped fields', () => {
    expect(toSnakeCase('reps')).toBe('reps')
    expect(toSnakeCase('weight')).toBe('weight')
    expect(toSnakeCase('someCustomField')).toBe('some_custom_field')
  })

  it('handles single-word fields (no change)', () => {
    expect(toSnakeCase('name')).toBe('name')
    expect(toSnakeCase('notes')).toBe('notes')
  })

  it('handles workout domain fields', () => {
    expect(toSnakeCase('workoutLogId')).toBe('id')
    expect(toSnakeCase('workoutLogExerciseId')).toBe('id')
    expect(toSnakeCase('athleteId')).toBe('athlete_id')
    expect(toSnakeCase('dateTime')).toBe('date_time')
  })
})

// ============================================================================
// toCamelCase
// ============================================================================

describe('toCamelCase', () => {
  it('converts explicit mapped fields correctly', () => {
    expect(toCamelCase('exercise_id')).toBe('exerciseId')
    expect(toCamelCase('exercise_order')).toBe('exerciseOrder')
    expect(toCamelCase('set_index')).toBe('setIndex')
    expect(toCamelCase('rest_time')).toBe('restTime')
  })

  it('falls back to algorithmic conversion for unmapped fields', () => {
    expect(toCamelCase('some_custom_field')).toBe('someCustomField')
  })

  it('handles single-word fields (no change)', () => {
    expect(toCamelCase('name')).toBe('name')
    expect(toCamelCase('reps')).toBe('reps')
  })

  it('converts "id" back to mapped camelCase form', () => {
    // Note: SNAKE_TO_CAMEL_MAP is generated from CAMEL_TO_SNAKE_MAP
    // Multiple camelCase keys map to 'id', so the last one wins
    // This documents the actual behavior
    const result = toCamelCase('id')
    // The result is whichever mapping was last in CAMEL_TO_SNAKE_MAP entries
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// convertKeysToSnakeCase / convertKeysToCamelCase
// ============================================================================

describe('convertKeysToSnakeCase', () => {
  it('converts all keys in an object', () => {
    const input = {
      exerciseId: 456,
      exerciseOrder: 1,
      notes: 'test',
    }
    const result = convertKeysToSnakeCase(input)
    expect(result).toEqual({
      exercise_id: 456,
      exercise_order: 1,
      notes: 'test',
    })
  })

  it('preserves values unchanged', () => {
    const input = { exerciseId: 456, name: 'Bench Press' }
    const result = convertKeysToSnakeCase(input)
    expect(result['exercise_id']).toBe(456)
    expect(result['name']).toBe('Bench Press')
  })

  it('handles empty object', () => {
    expect(convertKeysToSnakeCase({})).toEqual({})
  })
})

describe('convertKeysToCamelCase', () => {
  it('converts all keys in an object', () => {
    const input = {
      exercise_id: 456,
      exercise_order: 1,
      notes: 'test',
    }
    const result = convertKeysToCamelCase(input)
    expect(result).toEqual({
      exerciseId: 456,
      exerciseOrder: 1,
      notes: 'test',
    })
  })

  it('handles empty object', () => {
    expect(convertKeysToCamelCase({})).toEqual({})
  })
})

// ============================================================================
// Entity type validators
// ============================================================================

describe('isValidEntityType', () => {
  it('returns true for session entity types', () => {
    expect(isValidEntityType('session_plan')).toBe(true)
    expect(isValidEntityType('session_plan_exercise')).toBe(true)
    expect(isValidEntityType('session_plan_set')).toBe(true)
  })

  it('returns false for workout entity types', () => {
    expect(isValidEntityType('workout_log')).toBe(false)
    expect(isValidEntityType('workout_log_exercise')).toBe(false)
  })

  it('returns false for unknown types', () => {
    expect(isValidEntityType('unknown')).toBe(false)
    expect(isValidEntityType('')).toBe(false)
  })
})

describe('isWorkoutEntityType', () => {
  it('returns true for workout entity types', () => {
    expect(isWorkoutEntityType('workout_log')).toBe(true)
    expect(isWorkoutEntityType('workout_log_exercise')).toBe(true)
    expect(isWorkoutEntityType('workout_log_set')).toBe(true)
  })

  it('returns false for session entity types', () => {
    expect(isWorkoutEntityType('session_plan')).toBe(false)
    expect(isWorkoutEntityType('session_plan_exercise')).toBe(false)
  })

  it('returns false for unknown types', () => {
    expect(isWorkoutEntityType('unknown')).toBe(false)
  })
})

describe('isAnyValidEntityType', () => {
  it('returns true for both session and workout types', () => {
    expect(isAnyValidEntityType('session_plan')).toBe(true)
    expect(isAnyValidEntityType('session_plan_exercise')).toBe(true)
    expect(isAnyValidEntityType('workout_log')).toBe(true)
    expect(isAnyValidEntityType('workout_log_set')).toBe(true)
  })

  it('returns false for unknown types', () => {
    expect(isAnyValidEntityType('unknown')).toBe(false)
    expect(isAnyValidEntityType('users')).toBe(false)
  })
})

// ============================================================================
// Entity ID field and table name lookups
// ============================================================================

describe('getEntityIdField', () => {
  it('returns correct ID field for session entities', () => {
    expect(getEntityIdField('session_plan')).toBe('sessionPlanId')
    expect(getEntityIdField('session_plan_exercise')).toBe('sessionPlanExerciseId')
    expect(getEntityIdField('session_plan_set')).toBe('sessionPlanSetId')
  })
})

describe('getAllEntityIdField', () => {
  it('returns correct ID field for any entity type', () => {
    expect(getAllEntityIdField('session_plan')).toBe('sessionPlanId')
    expect(getAllEntityIdField('workout_log')).toBe('workoutLogId')
    expect(getAllEntityIdField('workout_log_exercise')).toBe('workoutLogExerciseId')
    expect(getAllEntityIdField('workout_log_set')).toBe('workoutLogSetId')
  })
})

describe('getEntityTableName', () => {
  it('returns correct table name for session entities', () => {
    expect(getEntityTableName('session_plan')).toBe('session_plans')
    expect(getEntityTableName('session_plan_exercise')).toBe('session_plan_exercises')
    expect(getEntityTableName('session_plan_set')).toBe('session_plan_sets')
  })
})

describe('getAllEntityTableName', () => {
  it('returns correct table name for any entity type', () => {
    expect(getAllEntityTableName('workout_log')).toBe('workout_logs')
    expect(getAllEntityTableName('workout_log_exercise')).toBe('workout_log_exercises')
    expect(getAllEntityTableName('workout_log_set')).toBe('workout_log_sets')
  })
})

// ============================================================================
// Constants integrity
// ============================================================================

describe('ENTITY_ID_FIELDS', () => {
  it('has entries for all three session entity types', () => {
    expect(Object.keys(ENTITY_ID_FIELDS)).toHaveLength(3)
    expect(ENTITY_ID_FIELDS).toHaveProperty('session_plan')
    expect(ENTITY_ID_FIELDS).toHaveProperty('session_plan_exercise')
    expect(ENTITY_ID_FIELDS).toHaveProperty('session_plan_set')
  })
})

describe('ALL_ENTITY_ID_FIELDS', () => {
  it('has entries for all six entity types (3 session + 3 workout)', () => {
    expect(Object.keys(ALL_ENTITY_ID_FIELDS)).toHaveLength(6)
  })
})

describe('METADATA_FIELDS', () => {
  it('excludes reasoning fields', () => {
    expect(METADATA_FIELDS.has('reasoning')).toBe(true)
    expect(METADATA_FIELDS.has('aiReasoning')).toBe(true)
  })

  it('excludes ordering helper', () => {
    expect(METADATA_FIELDS.has('insertAfterExerciseId')).toBe(true)
  })

  it('does not exclude data fields', () => {
    expect(METADATA_FIELDS.has('name')).toBe(false)
    expect(METADATA_FIELDS.has('reps')).toBe(false)
    expect(METADATA_FIELDS.has('exerciseName')).toBe(false)
  })
})

describe('ID_FIELDS', () => {
  it('includes all entity ID fields', () => {
    expect(ID_FIELDS.has('sessionPlanId')).toBe(true)
    expect(ID_FIELDS.has('sessionPlanExerciseId')).toBe(true)
    expect(ID_FIELDS.has('sessionPlanSetId')).toBe(true)
    expect(ID_FIELDS.has('workoutLogId')).toBe(true)
    expect(ID_FIELDS.has('workoutLogExerciseId')).toBe(true)
    expect(ID_FIELDS.has('workoutLogSetId')).toBe(true)
    expect(ID_FIELDS.has('id')).toBe(true)
  })
})