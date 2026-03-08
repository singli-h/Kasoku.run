import { scaffoldPlan, buildExerciseLibraryMap } from './scaffold'
import type { ScaffoldContext } from './scaffold'
import type { SimpleGeneratedPlan } from './schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let uuidCounter = 0

beforeEach(() => {
  uuidCounter = 0
  jest.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    uuidCounter += 1
    return `00000000-0000-4000-a000-${String(uuidCounter).padStart(12, '0')}` as ReturnType<
      typeof crypto.randomUUID
    >
  })
  // Suppress console.log / console.warn noise during tests
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** Minimal exercise library with a few known exercises. */
function makeLibrary(entries: [number, string][]): Map<number, string> {
  return new Map(entries)
}

/** Default scaffold context. */
function makeContext(overrides?: Partial<ScaffoldContext>): ScaffoldContext {
  return {
    mesocycleId: 'meso-1',
    exerciseLibrary: makeLibrary([
      [1, 'Bench Press'],
      [2, 'Squat'],
      [3, 'Deadlift'],
      [4, 'Pull-Up'],
    ]),
    ...overrides,
  }
}

/** Build a minimal valid SimpleGeneratedPlan. */
function makePlan(overrides?: Partial<SimpleGeneratedPlan>): SimpleGeneratedPlan {
  return {
    plan_name: 'Test Plan',
    plan_description: 'A test plan',
    microcycles: [
      {
        name: 'Week 1 - Foundation',
        sessions: [
          {
            day: 1,
            name: 'Upper Body',
            description: 'Push focus',
            exercises: [
              {
                exercise_id: 1,
                sets: 3,
                reps: 10,
                weight: 60,
                rpe: 7,
                rest_time: 120,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

// ===========================================================================
// scaffoldPlan
// ===========================================================================

describe('scaffoldPlan', () => {
  it('transforms a single week / single session / single exercise correctly', () => {
    const result = scaffoldPlan(makePlan(), makeContext())

    expect(result.microcycles).toHaveLength(1)

    const mc = result.microcycles[0]
    expect(mc.mesocycle_id).toBe('meso-1')
    expect(mc.week_number).toBe(1)
    expect(mc.name).toBe('Week 1 - Foundation')
    expect(mc.is_deload).toBe(false)

    expect(mc.session_plans).toHaveLength(1)
    const session = mc.session_plans[0]
    expect(session.name).toBe('Upper Body')
    expect(session.day_of_week).toBe('monday')
    expect(session.session_type).toBe('strength')
    expect(session.notes).toBe('Push focus')

    expect(session.session_plan_exercises).toHaveLength(1)
    const exercise = session.session_plan_exercises[0]
    expect(exercise.exercise_id).toBe('1')
    expect(exercise.exercise_name).toBe('Bench Press')
    expect(exercise.exercise_order).toBe(0)
    expect(exercise.session_plan_sets).toHaveLength(3)
  })

  it('creates all microcycles for a multi-week plan with correct week_number and mesocycle_id', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            { day: 1, name: 'S1', description: '', exercises: [{ exercise_id: 1, sets: 1, reps: 5, weight: 50, rpe: 6, rest_time: 60 }] },
          ],
        },
        {
          name: 'Week 2',
          sessions: [
            { day: 2, name: 'S2', description: '', exercises: [{ exercise_id: 2, sets: 1, reps: 5, weight: 60, rpe: 7, rest_time: 60 }] },
          ],
        },
        {
          name: 'Week 3',
          sessions: [
            { day: 3, name: 'S3', description: '', exercises: [{ exercise_id: 3, sets: 1, reps: 5, weight: 70, rpe: 8, rest_time: 60 }] },
          ],
        },
        {
          name: 'Week 4 - Deload',
          sessions: [
            { day: 4, name: 'S4', description: '', exercises: [{ exercise_id: 1, sets: 1, reps: 5, weight: 40, rpe: 5, rest_time: 60 }] },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())

    expect(result.microcycles).toHaveLength(4)
    result.microcycles.forEach((mc, i) => {
      expect(mc.week_number).toBe(i + 1)
      expect(mc.mesocycle_id).toBe('meso-1')
    })
  })

  it('expands sets count into individual SessionPlanSetData objects with correct set_index', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 1, sets: 4, reps: 8, weight: 80, rpe: 8, rest_time: 90 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const sets = result.microcycles[0].session_plans[0].session_plan_exercises[0].session_plan_sets

    expect(sets).toHaveLength(4)
    sets.forEach((s, i) => {
      expect(s.set_index).toBe(i + 1)
      expect(s.reps).toBe(8)
    })
  })

  it('passes weight value through to all expanded sets', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 1, sets: 3, reps: 5, weight: 80, rpe: 9, rest_time: 120 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const sets = result.microcycles[0].session_plans[0].session_plan_exercises[0].session_plan_sets

    for (const s of sets) {
      expect(s.weight).toBe(80)
    }
  })

  it('passes null weight (bodyweight) through to all expanded sets', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 4, sets: 3, reps: 10, weight: null, rpe: 7, rest_time: 60 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const sets = result.microcycles[0].session_plans[0].session_plan_exercises[0].session_plan_sets

    for (const s of sets) {
      expect(s.weight).toBeNull()
    }
  })

  it('passes RPE and rest_time through to each expanded set', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 2, sets: 2, reps: 6, weight: 100, rpe: 9, rest_time: 180 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const sets = result.microcycles[0].session_plans[0].session_plan_exercises[0].session_plan_sets

    for (const s of sets) {
      expect(s.rpe).toBe(9)
      expect(s.rest_time).toBe(180)
    }
  })

  it('re-indexes exercise_order after filtering invalid exercises', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 1, sets: 1, reps: 5, weight: 50, rpe: 7, rest_time: 60 },
                { exercise_id: 999, sets: 1, reps: 5, weight: 50, rpe: 7, rest_time: 60 }, // hallucinated
                { exercise_id: 2, sets: 1, reps: 5, weight: 60, rpe: 7, rest_time: 60 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const exercises = result.microcycles[0].session_plans[0].session_plan_exercises

    expect(exercises).toHaveLength(2)
    expect(exercises[0].exercise_name).toBe('Bench Press')
    expect(exercises[0].exercise_order).toBe(0)
    expect(exercises[1].exercise_name).toBe('Squat')
    expect(exercises[1].exercise_order).toBe(1)
  })

  it('silently filters out exercises with hallucinated IDs not in library', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 9999, sets: 3, reps: 10, weight: 50, rpe: 7, rest_time: 60 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const exercises = result.microcycles[0].session_plans[0].session_plan_exercises

    expect(exercises).toHaveLength(0)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping invalid exercise_id 9999')
    )
  })

  it.each([
    [0, 'sunday'],
    [1, 'monday'],
    [2, 'tuesday'],
    [3, 'wednesday'],
    [4, 'thursday'],
    [5, 'friday'],
    [6, 'saturday'],
  ])('maps day number %i to day_of_week "%s"', (dayNum, expected) => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: dayNum,
              name: 'Session',
              description: '',
              exercises: [
                { exercise_id: 1, sets: 1, reps: 5, weight: 50, rpe: 7, rest_time: 60 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    expect(result.microcycles[0].session_plans[0].day_of_week).toBe(expected)
  })

  it('detects deload weeks from name (case-insensitive)', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1 - Build',
          sessions: [
            { day: 1, name: 'S', description: '', exercises: [{ exercise_id: 1, sets: 1, reps: 5, weight: 50, rpe: 7, rest_time: 60 }] },
          ],
        },
        {
          name: 'Week 2 - DELOAD Week',
          sessions: [
            { day: 1, name: 'S', description: '', exercises: [{ exercise_id: 1, sets: 1, reps: 5, weight: 30, rpe: 5, rest_time: 60 }] },
          ],
        },
        {
          name: 'Week 3 - deload recovery',
          sessions: [
            { day: 1, name: 'S', description: '', exercises: [{ exercise_id: 1, sets: 1, reps: 5, weight: 30, rpe: 5, rest_time: 60 }] },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    expect(result.microcycles[0].is_deload).toBe(false)
    expect(result.microcycles[1].is_deload).toBe(true)
    expect(result.microcycles[2].is_deload).toBe(true)
  })

  it('generates unique IDs for all entities', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'A',
              description: '',
              exercises: [
                { exercise_id: 1, sets: 2, reps: 5, weight: 50, rpe: 7, rest_time: 60 },
                { exercise_id: 2, sets: 2, reps: 8, weight: 60, rpe: 7, rest_time: 90 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const allIds: string[] = []

    for (const mc of result.microcycles) {
      allIds.push(mc.id)
      for (const sp of mc.session_plans) {
        allIds.push(sp.id)
        for (const ex of sp.session_plan_exercises) {
          allIds.push(ex.id)
          for (const set of ex.session_plan_sets) {
            allIds.push(set.id)
          }
        }
      }
    }

    // All IDs must be unique
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
    // Expected: 1 microcycle + 1 session + 2 exercises + 4 sets = 8 IDs
    expect(allIds).toHaveLength(8)
  })

  it('produces an empty exercises array when all exercises in a session are invalid', () => {
    const plan = makePlan({
      microcycles: [
        {
          name: 'Week 1',
          sessions: [
            {
              day: 1,
              name: 'Ghost Session',
              description: '',
              exercises: [
                { exercise_id: 888, sets: 3, reps: 10, weight: 50, rpe: 7, rest_time: 60 },
                { exercise_id: 999, sets: 3, reps: 10, weight: 50, rpe: 7, rest_time: 60 },
              ],
            },
          ],
        },
      ],
    })

    const result = scaffoldPlan(plan, makeContext())
    const session = result.microcycles[0].session_plans[0]

    expect(session.session_plan_exercises).toEqual([])
    expect(session.name).toBe('Ghost Session')
  })
})

// ===========================================================================
// buildExerciseLibraryMap
// ===========================================================================

describe('buildExerciseLibraryMap', () => {
  it('converts array of {id, name} to a Map keyed by id', () => {
    const map = buildExerciseLibraryMap([
      { id: 1, name: 'Bench Press' },
      { id: 2, name: 'Squat' },
      { id: 3, name: 'Deadlift' },
    ])

    expect(map.size).toBe(3)
    expect(map.get(1)).toBe('Bench Press')
    expect(map.get(2)).toBe('Squat')
    expect(map.get(3)).toBe('Deadlift')
  })

  it('returns an empty Map for an empty array', () => {
    const map = buildExerciseLibraryMap([])
    expect(map.size).toBe(0)
  })
})
