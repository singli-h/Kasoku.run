import {
  SimpleExerciseSchema,
  SimpleSessionSchema,
  SimpleGeneratedPlanSchema,
} from './schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid exercise matching SimpleExerciseSchema. */
function validExercise(overrides?: Record<string, unknown>) {
  return {
    exercise_id: 1,
    sets: 3,
    reps: 10,
    weight: 60,
    rpe: 7,
    rest_time: 120,
    ...overrides,
  }
}

/** Minimal valid session matching SimpleSessionSchema. */
function validSession(overrides?: Record<string, unknown>) {
  return {
    day: 1,
    name: 'Upper Body',
    description: 'Push focus session',
    exercises: [validExercise()],
    ...overrides,
  }
}

/** Minimal valid plan matching SimpleGeneratedPlanSchema. */
function validPlan(overrides?: Record<string, unknown>) {
  return {
    plan_name: 'Test Plan',
    plan_description: 'A test plan',
    microcycles: [
      {
        name: 'Week 1',
        sessions: [validSession()],
      },
    ],
    ...overrides,
  }
}

// ===========================================================================
// SimpleExerciseSchema
// ===========================================================================

describe('SimpleExerciseSchema', () => {
  it('accepts a valid exercise with all fields', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise())
    expect(result.success).toBe(true)
  })

  it('accepts null weight (bodyweight exercise)', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ weight: null }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.weight).toBeNull()
    }
  })

  it('accepts weight = 0 (boundary)', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ weight: 0 }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.weight).toBe(0)
    }
  })

  it('rejects negative reps', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ reps: -1 }))
    expect(result.success).toBe(false)
  })

  it('rejects reps = 0 (min is 1)', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ reps: 0 }))
    expect(result.success).toBe(false)
  })

  it('rejects RPE > 10', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ rpe: 11 }))
    expect(result.success).toBe(false)
  })

  it('rejects RPE < 1', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ rpe: 0 }))
    expect(result.success).toBe(false)
  })

  it('rejects sets > 10', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ sets: 11 }))
    expect(result.success).toBe(false)
  })

  it('rejects sets = 0 (min is 1)', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ sets: 0 }))
    expect(result.success).toBe(false)
  })

  it('rejects a missing required field (exercise_id)', () => {
    const { exercise_id: _, ...noId } = validExercise()
    const result = SimpleExerciseSchema.safeParse(noId)
    expect(result.success).toBe(false)
  })

  it('rejects a missing required field (rpe)', () => {
    const { rpe: _, ...noRpe } = validExercise()
    const result = SimpleExerciseSchema.safeParse(noRpe)
    expect(result.success).toBe(false)
  })

  it('rejects rest_time > 600', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ rest_time: 601 }))
    expect(result.success).toBe(false)
  })

  it('accepts rest_time = 0 (boundary)', () => {
    const result = SimpleExerciseSchema.safeParse(validExercise({ rest_time: 0 }))
    expect(result.success).toBe(true)
  })
})

// ===========================================================================
// SimpleSessionSchema
// ===========================================================================

describe('SimpleSessionSchema', () => {
  it('accepts a valid session with exercises', () => {
    const result = SimpleSessionSchema.safeParse(validSession())
    expect(result.success).toBe(true)
  })

  it('rejects an empty exercises array (min 1)', () => {
    const result = SimpleSessionSchema.safeParse(validSession({ exercises: [] }))
    expect(result.success).toBe(false)
  })

  it('rejects day < 0', () => {
    const result = SimpleSessionSchema.safeParse(validSession({ day: -1 }))
    expect(result.success).toBe(false)
  })

  it('rejects day > 6', () => {
    const result = SimpleSessionSchema.safeParse(validSession({ day: 7 }))
    expect(result.success).toBe(false)
  })

  it('accepts day = 0 (Sunday) and day = 6 (Saturday)', () => {
    expect(SimpleSessionSchema.safeParse(validSession({ day: 0 })).success).toBe(true)
    expect(SimpleSessionSchema.safeParse(validSession({ day: 6 })).success).toBe(true)
  })

  it('rejects when name is missing', () => {
    const { name: _, ...noName } = validSession()
    const result = SimpleSessionSchema.safeParse(noName)
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// SimpleGeneratedPlanSchema
// ===========================================================================

describe('SimpleGeneratedPlanSchema', () => {
  it('accepts a valid 4-week plan', () => {
    const plan = validPlan({
      microcycles: Array.from({ length: 4 }, (_, i) => ({
        name: `Week ${i + 1}`,
        sessions: [validSession()],
      })),
    })

    const result = SimpleGeneratedPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.microcycles).toHaveLength(4)
    }
  })

  it('rejects empty microcycles array (min 1)', () => {
    const result = SimpleGeneratedPlanSchema.safeParse(validPlan({ microcycles: [] }))
    expect(result.success).toBe(false)
  })

  it('rejects more than 12 microcycles (max 12)', () => {
    const plan = validPlan({
      microcycles: Array.from({ length: 13 }, (_, i) => ({
        name: `Week ${i + 1}`,
        sessions: [validSession()],
      })),
    })

    const result = SimpleGeneratedPlanSchema.safeParse(plan)
    expect(result.success).toBe(false)
  })

  it('accepts exactly 12 microcycles (boundary)', () => {
    const plan = validPlan({
      microcycles: Array.from({ length: 12 }, (_, i) => ({
        name: `Week ${i + 1}`,
        sessions: [validSession()],
      })),
    })

    const result = SimpleGeneratedPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
  })

  it('rejects when plan_name is missing', () => {
    const { plan_name: _, ...noPlanName } = validPlan()
    const result = SimpleGeneratedPlanSchema.safeParse(noPlanName)
    expect(result.success).toBe(false)
  })

  it('rejects when plan_description is missing', () => {
    const { plan_description: _, ...noDesc } = validPlan()
    const result = SimpleGeneratedPlanSchema.safeParse(noDesc)
    expect(result.success).toBe(false)
  })
})
