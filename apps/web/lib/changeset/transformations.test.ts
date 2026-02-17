import {
  transformToolInput,
  extractEntityId,
  buildProposedData,
  validateChangeRequest,
  mergeProposedWithCurrent,
  resetExecutionOrderCounter,
  getNextExecutionOrder,
} from './transformations'
import { isTempId } from './buffer-utils'
import type { ChangeRequest } from './types'

// Reset execution order before each test to avoid cross-test leakage
beforeEach(() => {
  resetExecutionOrderCounter()
})

// ============================================================================
// resetExecutionOrderCounter / getNextExecutionOrder
// ============================================================================

describe('execution order counter', () => {
  it('starts at 1 after reset', () => {
    expect(getNextExecutionOrder()).toBe(1)
  })

  it('increments on each call', () => {
    expect(getNextExecutionOrder()).toBe(1)
    expect(getNextExecutionOrder()).toBe(2)
    expect(getNextExecutionOrder()).toBe(3)
  })

  it('resets properly', () => {
    getNextExecutionOrder()
    getNextExecutionOrder()
    resetExecutionOrderCounter()
    expect(getNextExecutionOrder()).toBe(1)
  })
})

// ============================================================================
// extractEntityId
// ============================================================================

describe('extractEntityId', () => {
  it('generates temp ID for create operations', () => {
    const id = extractEntityId('session_plan_exercise', 'create', {})
    expect(isTempId(id)).toBe(true)
  })

  it('extracts ID from tool input for update operations', () => {
    const id = extractEntityId('session_plan_exercise', 'update', {
      sessionPlanExerciseId: 'abc-123',
    })
    expect(id).toBe('abc-123')
  })

  it('extracts ID from tool input for delete operations', () => {
    const id = extractEntityId('session_plan_exercise', 'delete', {
      sessionPlanExerciseId: 'abc-123',
    })
    expect(id).toBe('abc-123')
  })

  it('throws when ID is missing for update', () => {
    expect(() =>
      extractEntityId('session_plan_exercise', 'update', {})
    ).toThrow('Missing sessionPlanExerciseId')
  })

  it('creates composite ID for sets using parent exercise + set index', () => {
    const id = extractEntityId('session_plan_set', 'update', {
      sessionPlanExerciseId: 'ex-123',
      setIndex: 2,
    })
    expect(id).toBe('exercise:ex-123:set:2')
  })

  it('creates "all" composite ID for sets with applyToAllSets', () => {
    const id = extractEntityId('session_plan_set', 'update', {
      sessionPlanExerciseId: 'ex-123',
      applyToAllSets: true,
    })
    expect(id).toBe('exercise:ex-123:all')
  })

  it('creates workout composite ID for workout_log_set', () => {
    const id = extractEntityId('workout_log_set', 'update', {
      workoutLogExerciseId: 'wle-123',
      setIndex: 1,
    })
    expect(id).toBe('workout_exercise:wle-123:set:1')
  })

  it('throws for workout_log_set without setIndex', () => {
    expect(() =>
      extractEntityId('workout_log_set', 'update', {
        workoutLogExerciseId: 'wle-123',
      })
    ).toThrow('setIndex is required')
  })

  it('converts numeric ID to string', () => {
    const id = extractEntityId('session_plan', 'update', {
      sessionPlanId: 42,
    })
    expect(id).toBe('42')
  })
})

// ============================================================================
// buildProposedData
// ============================================================================

describe('buildProposedData', () => {
  it('excludes metadata fields (reasoning)', () => {
    const data = buildProposedData('session_plan_exercise', {
      exerciseId: 456,
      exerciseOrder: 1,
      reasoning: 'Adding bench press',
    })
    expect(data).not.toHaveProperty('reasoning')
    expect(data['exercise_id']).toBe(456)
    expect(data['exercise_order']).toBe(1)
  })

  it('excludes ID fields from proposed data', () => {
    const data = buildProposedData('session_plan_exercise', {
      sessionPlanExerciseId: 'abc',
      exerciseId: 456,
      exerciseOrder: 1,
    })
    // sessionPlanExerciseId is an ID field and should be excluded
    expect(data).not.toHaveProperty('sessionPlanExerciseId')
    expect(data).not.toHaveProperty('session_plan_exercise_id')
    // exerciseId is also in ID_FIELDS, so it gets excluded
    expect(data).not.toHaveProperty('exerciseId')
  })

  it('converts keys to snake_case', () => {
    const data = buildProposedData('session_plan_exercise', {
      exerciseOrder: 2,
      notes: 'test notes',
    })
    expect(data).toHaveProperty('exercise_order', 2)
    expect(data).toHaveProperty('notes', 'test notes')
  })

  it('adds session plan parent FK for exercises when sessionId provided', () => {
    const data = buildProposedData('session_plan_exercise', {
      exerciseOrder: 1,
    }, 'session-abc')
    // The session parent FK should be stored under 'session_plan_id' (the actual
    // database FK column), NOT under 'id' (which is the primary key column).
    expect(data['session_plan_id']).toBe('session-abc')
    expect(data).not.toHaveProperty('id')
  })

  it('does not override existing sessionPlanId when in tool input', () => {
    // When sessionPlanId is in tool input, it's in ID_FIELDS and gets excluded from data.
    // After snake_case conversion, result has no 'session_plan_id', so sessionId is added.
    const data = buildProposedData('session_plan_exercise', {
      sessionPlanId: 'existing-id',
      exerciseOrder: 1,
    }, 'session-override')
    // sessionPlanId is excluded (it's an ID field), so sessionId fills the FK
    expect(data['session_plan_id']).toBe('session-override')
    expect(data).not.toHaveProperty('id')
  })

  it('excludes undefined values', () => {
    const data = buildProposedData('session_plan_exercise', {
      exerciseOrder: 1,
      notes: undefined,
    })
    expect(data).toHaveProperty('exercise_order', 1)
    expect(data).not.toHaveProperty('notes')
  })

  it('adds parent FK for sets from tool input', () => {
    const data = buildProposedData('session_plan_set', {
      sessionPlanExerciseId: 'ex-abc',
      reps: 10,
      weight: 60,
    })
    // sessionPlanExerciseId should be stored as session_plan_exercise_id FK
    expect(data['session_plan_exercise_id']).toBe('ex-abc')
  })
})

// ============================================================================
// transformToolInput
// ============================================================================

describe('transformToolInput', () => {
  it('creates a valid ChangeRequest for a create operation', () => {
    const result = transformToolInput('session_plan_exercise', 'create', {
      exerciseOrder: 1,
      reasoning: 'Adding exercise',
    }, { sessionId: 'sess-1' })

    expect(result.operationType).toBe('create')
    expect(result.entityType).toBe('session_plan_exercise')
    expect(isTempId(result.entityId!)).toBe(true)
    expect(result.proposedData).not.toBeNull()
    expect(result.proposedData!['exercise_order']).toBe(1)
    expect(result.aiReasoning).toBe('Adding exercise')
    expect(result.executionOrder).toBe(1) // First operation after reset
  })

  it('creates a valid ChangeRequest for an update operation', () => {
    const result = transformToolInput('session_plan_exercise', 'update', {
      sessionPlanExerciseId: 'ex-123',
      exerciseOrder: 2,
      reasoning: 'Reordering',
    }, { currentData: { exercise_order: 1 } })

    expect(result.operationType).toBe('update')
    expect(result.entityId).toBe('ex-123')
    expect(result.currentData).toEqual({ exercise_order: 1 })
    expect(result.proposedData!['exercise_order']).toBe(2)
  })

  it('creates a valid ChangeRequest for a delete operation', () => {
    const result = transformToolInput('session_plan_exercise', 'delete', {
      sessionPlanExerciseId: 'ex-123',
      reasoning: 'Removing exercise',
    })

    expect(result.operationType).toBe('delete')
    expect(result.entityId).toBe('ex-123')
    // Delete operations may have minimal proposedData for UI grouping or null
    expect(result.aiReasoning).toBe('Removing exercise')
  })

  it('throws for unsupported entity type', () => {
    expect(() =>
      transformToolInput('invalid_type', 'create', {})
    ).toThrow('Unsupported entity type')
  })

  it('uses provided execution order', () => {
    const result = transformToolInput('session_plan_exercise', 'create', {}, {
      executionOrder: 42,
    })
    expect(result.executionOrder).toBe(42)
  })

  it('auto-increments execution order when not provided', () => {
    const r1 = transformToolInput('session_plan_exercise', 'create', {})
    const r2 = transformToolInput('session_plan_exercise', 'create', {})
    expect(r2.executionOrder).toBe(r1.executionOrder + 1)
  })

  it('generates unique request IDs', () => {
    const r1 = transformToolInput('session_plan_exercise', 'create', {})
    const r2 = transformToolInput('session_plan_exercise', 'create', {})
    expect(r1.id).not.toBe(r2.id)
  })

  it('works with workout entity types', () => {
    const result = transformToolInput('workout_log_exercise', 'create', {
      workoutLogId: 'wl-123',
      notes: 'test',
    })
    expect(result.entityType).toBe('workout_log_exercise')
    expect(result.proposedData!['workout_log_id']).toBe('wl-123')
  })

  it('includes parent FK in delete proposedData for sets', () => {
    const result = transformToolInput('session_plan_set', 'delete', {
      sessionPlanSetId: 'set-123',
      sessionPlanExerciseId: 'ex-456',
      reasoning: 'Removing set',
    })
    // For deletes, parent FK should be included for UI grouping
    expect(result.proposedData).not.toBeNull()
    expect(result.proposedData!['session_plan_exercise_id']).toBe('ex-456')
  })
})

// ============================================================================
// validateChangeRequest
// ============================================================================

describe('validateChangeRequest', () => {
  const baseRequest: ChangeRequest = {
    id: 'cr_test',
    changesetId: 'cs_test',
    operationType: 'create',
    entityType: 'session_plan_exercise',
    entityId: 'temp-123',
    currentData: null,
    proposedData: { exercise_order: 1 },
    executionOrder: 1,
    createdAt: new Date(),
  }

  it('returns true for a valid create request', () => {
    expect(validateChangeRequest(baseRequest)).toBe(true)
  })

  it('returns true for a valid update request', () => {
    expect(validateChangeRequest({
      ...baseRequest,
      operationType: 'update',
      entityId: 'ex-123',
      currentData: { exercise_order: 1 },
      proposedData: { exercise_order: 2 },
    })).toBe(true)
  })

  it('returns true for a valid delete request', () => {
    expect(validateChangeRequest({
      ...baseRequest,
      operationType: 'delete',
      entityId: 'ex-123',
      proposedData: null,
    })).toBe(true)
  })

  it('throws for missing entityType', () => {
    expect(() => validateChangeRequest({
      ...baseRequest,
      entityType: '',
    })).toThrow('missing entityType')
  })

  it('throws for invalid entityType', () => {
    expect(() => validateChangeRequest({
      ...baseRequest,
      entityType: 'invalid_type',
    })).toThrow('Invalid entityType')
  })

  it('throws for update without entityId', () => {
    expect(() => validateChangeRequest({
      ...baseRequest,
      operationType: 'update',
      entityId: '',
    })).toThrow('missing entityId')
  })

  it('throws for create/update without proposedData', () => {
    expect(() => validateChangeRequest({
      ...baseRequest,
      operationType: 'create',
      proposedData: null,
    })).toThrow('missing proposedData')
  })

  it('allows null proposedData for delete', () => {
    expect(validateChangeRequest({
      ...baseRequest,
      operationType: 'delete',
      entityId: 'ex-123',
      proposedData: null,
    })).toBe(true)
  })
})

// ============================================================================
// mergeProposedWithCurrent
// ============================================================================

describe('mergeProposedWithCurrent', () => {
  it('merges proposed data over current data', () => {
    const current = { exercise_order: 1, notes: 'original' }
    const proposed = { exercise_order: 2 }
    const result = mergeProposedWithCurrent(current, proposed)
    expect(result).toEqual({ exercise_order: 2, notes: 'original' })
  })

  it('returns proposed when current is null (create)', () => {
    const proposed = { exercise_order: 1, name: 'New' }
    const result = mergeProposedWithCurrent(null, proposed)
    expect(result).toEqual(proposed)
  })

  it('returns current when proposed is null (no changes)', () => {
    const current = { exercise_order: 1 }
    const result = mergeProposedWithCurrent(current, null)
    expect(result).toEqual(current)
  })

  it('returns empty object when both are null', () => {
    expect(mergeProposedWithCurrent(null, null)).toEqual({})
  })

  it('proposed fields overwrite current fields', () => {
    const result = mergeProposedWithCurrent(
      { a: 1, b: 2, c: 3 },
      { b: 20, c: 30 }
    )
    expect(result).toEqual({ a: 1, b: 20, c: 30 })
  })
})