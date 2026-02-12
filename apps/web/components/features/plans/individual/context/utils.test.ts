import {
  getAIContextLevel,
  findCurrentWeek,
  isWeekCurrent,
  isWeekPast,
  isWeekFuture,
  findTodayWorkout,
  sortByDay,
  getDayAbbrev,
  getDayName,
  formatDateShort,
  formatDateRange,
  buildAIContextInfo,
} from './utils'
import type { MicrocycleWithDetails, SessionPlanWithDetails } from '@/types/training'

// Helper to create a minimal MicrocycleWithDetails mock
function mockWeek(overrides: Partial<MicrocycleWithDetails> = {}): MicrocycleWithDetails {
  return {
    id: 1,
    mesocycle_id: 1,
    week_number: 1,
    name: 'Week 1',
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: null,
    focus: null,
    intensity_target: null,
    volume_target: null,
    user_id: 'user-1',
    ...overrides,
  } as MicrocycleWithDetails
}

// Helper to create a minimal SessionPlanWithDetails mock
function mockSession(overrides: Partial<SessionPlanWithDetails> = {}): SessionPlanWithDetails {
  return {
    id: 'session-1',
    microcycle_id: 1,
    name: 'Workout A',
    day: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: null,
    order_index: 0,
    user_id: 'user-1',
    ...overrides,
  } as SessionPlanWithDetails
}

// ============================================================================
// getAIContextLevel
// ============================================================================

describe('getAIContextLevel', () => {
  it('returns "exercise" when exerciseId is set', () => {
    expect(getAIContextLevel({
      selectedWeekId: 1,
      selectedSessionId: 'sess-1',
      selectedExerciseId: 'ex-1',
    })).toBe('exercise')
  })

  it('returns "session" when sessionId is set but no exerciseId', () => {
    expect(getAIContextLevel({
      selectedWeekId: 1,
      selectedSessionId: 'sess-1',
      selectedExerciseId: null,
    })).toBe('session')
  })

  it('returns "week" when only weekId is set', () => {
    expect(getAIContextLevel({
      selectedWeekId: 1,
      selectedSessionId: null,
      selectedExerciseId: null,
    })).toBe('week')
  })

  it('returns "block" when nothing is selected', () => {
    expect(getAIContextLevel({
      selectedWeekId: null,
      selectedSessionId: null,
      selectedExerciseId: null,
    })).toBe('block')
  })
})

// ============================================================================
// findCurrentWeek
// ============================================================================

describe('findCurrentWeek', () => {
  it('returns null for empty array', () => {
    expect(findCurrentWeek([])).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(findCurrentWeek(undefined)).toBeNull()
  })

  it('returns the week containing today', () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 2)
    const end = new Date(today)
    end.setDate(end.getDate() + 4)

    const pastWeek = mockWeek({
      id: 1,
      start_date: '2020-01-01',
      end_date: '2020-01-07',
    })
    const currentWeek = mockWeek({
      id: 2,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    })

    expect(findCurrentWeek([pastWeek, currentWeek])?.id).toBe(2)
  })

  it('returns the first week when no current week matches', () => {
    const pastWeek = mockWeek({
      id: 1,
      start_date: '2020-01-01',
      end_date: '2020-01-07',
    })
    const futureWeek = mockWeek({
      id: 2,
      start_date: '2099-01-01',
      end_date: '2099-01-07',
    })

    expect(findCurrentWeek([pastWeek, futureWeek])?.id).toBe(1)
  })

  it('handles weeks with null dates', () => {
    const weekNoDate = mockWeek({ id: 1 })
    expect(findCurrentWeek([weekNoDate])?.id).toBe(1)
  })
})

// ============================================================================
// isWeekCurrent / isWeekPast / isWeekFuture
// ============================================================================

describe('isWeekCurrent', () => {
  it('returns true for a week containing today', () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 1)
    const end = new Date(today)
    end.setDate(end.getDate() + 1)

    const week = mockWeek({
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    })
    expect(isWeekCurrent(week)).toBe(true)
  })

  it('returns false for a past week', () => {
    const week = mockWeek({
      start_date: '2020-01-01',
      end_date: '2020-01-07',
    })
    expect(isWeekCurrent(week)).toBe(false)
  })

  it('returns false when dates are null', () => {
    expect(isWeekCurrent(mockWeek())).toBe(false)
  })
})

describe('isWeekPast', () => {
  it('returns true for a past week', () => {
    const week = mockWeek({ end_date: '2020-01-07' })
    expect(isWeekPast(week)).toBe(true)
  })

  it('returns false for a future week', () => {
    const week = mockWeek({ end_date: '2099-12-31' })
    expect(isWeekPast(week)).toBe(false)
  })

  it('returns false when end_date is null', () => {
    expect(isWeekPast(mockWeek())).toBe(false)
  })
})

describe('isWeekFuture', () => {
  it('returns true for a future week', () => {
    const week = mockWeek({ start_date: '2099-01-01' })
    expect(isWeekFuture(week)).toBe(true)
  })

  it('returns false for a past week', () => {
    const week = mockWeek({ start_date: '2020-01-01' })
    expect(isWeekFuture(week)).toBe(false)
  })

  it('returns false when start_date is null', () => {
    expect(isWeekFuture(mockWeek())).toBe(false)
  })
})

// ============================================================================
// findTodayWorkout
// ============================================================================

describe('findTodayWorkout', () => {
  it('returns null for empty array', () => {
    expect(findTodayWorkout([])).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(findTodayWorkout(undefined)).toBeNull()
  })

  it('returns the workout matching today', () => {
    const today = new Date().getDay()
    const todaySession = mockSession({ id: 'today', day: today })
    const otherSession = mockSession({ id: 'other', day: (today + 3) % 7 })

    expect(findTodayWorkout([otherSession, todaySession])?.id).toBe('today')
  })

  it('returns next upcoming workout when no match for today', () => {
    // Use a day that's definitely not today
    const today = new Date().getDay()
    const tomorrow = (today + 1) % 7
    const dayAfter = (today + 2) % 7

    const tomorrowSession = mockSession({ id: 'tomorrow', day: tomorrow })
    const dayAfterSession = mockSession({ id: 'day-after', day: dayAfter })

    const result = findTodayWorkout([dayAfterSession, tomorrowSession])
    // Should pick the closest upcoming day
    expect(result?.id).toBe('tomorrow')
  })
})

// ============================================================================
// sortByDay
// ============================================================================

describe('sortByDay', () => {
  it('sorts Monday (1) before Sunday (0)', () => {
    const sun = mockSession({ id: 'sun', day: 0 })
    const mon = mockSession({ id: 'mon', day: 1 })
    const wed = mockSession({ id: 'wed', day: 3 })

    const sorted = sortByDay([sun, wed, mon])
    expect(sorted.map(s => s.id)).toEqual(['mon', 'wed', 'sun'])
  })

  it('handles null days by placing them last', () => {
    const mon = mockSession({ id: 'mon', day: 1 })
    const noDay = mockSession({ id: 'none', day: null })

    const sorted = sortByDay([noDay, mon])
    expect(sorted.map(s => s.id)).toEqual(['mon', 'none'])
  })

  it('returns empty array for empty input', () => {
    expect(sortByDay([])).toEqual([])
  })
})

// ============================================================================
// getDayAbbrev / getDayName
// ============================================================================

describe('getDayAbbrev', () => {
  it('returns correct abbreviations', () => {
    expect(getDayAbbrev(0)).toBe('Sun')
    expect(getDayAbbrev(1)).toBe('Mon')
    expect(getDayAbbrev(2)).toBe('Tue')
    expect(getDayAbbrev(3)).toBe('Wed')
    expect(getDayAbbrev(4)).toBe('Thu')
    expect(getDayAbbrev(5)).toBe('Fri')
    expect(getDayAbbrev(6)).toBe('Sat')
  })

  it('returns dash for out-of-range values', () => {
    expect(getDayAbbrev(7)).toBe('—')
    expect(getDayAbbrev(-1)).toBe('—')
  })
})

describe('getDayName', () => {
  it('returns full day names', () => {
    expect(getDayName(0)).toBe('Sunday')
    expect(getDayName(1)).toBe('Monday')
    expect(getDayName(6)).toBe('Saturday')
  })

  it('returns "Unscheduled" for null', () => {
    expect(getDayName(null)).toBe('Unscheduled')
  })

  it('returns dash for out-of-range values', () => {
    expect(getDayName(7)).toBe('—')
  })
})

// ============================================================================
// formatDateShort / formatDateRange
// ============================================================================

describe('formatDateShort', () => {
  it('formats a date string', () => {
    // Use a date that's unambiguous
    const result = formatDateShort('2026-01-15')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/15/)
  })

  it('returns empty string for null', () => {
    expect(formatDateShort(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDateShort(undefined)).toBe('')
  })
})

describe('formatDateRange', () => {
  it('formats a date range', () => {
    const result = formatDateRange('2026-01-15', '2026-01-21')
    expect(result).toContain(' - ')
    expect(result).toMatch(/Jan/)
  })

  it('returns end only when start is null', () => {
    const result = formatDateRange(null, '2026-01-21')
    expect(result).toMatch(/Jan/)
    expect(result).not.toContain(' - ')
  })

  it('returns start only when end is null', () => {
    const result = formatDateRange('2026-01-15', null)
    expect(result).toMatch(/Jan/)
    expect(result).not.toContain(' - ')
  })

  it('returns empty string when both are null', () => {
    expect(formatDateRange(null, null)).toBe('')
  })
})

// ============================================================================
// buildAIContextInfo
// ============================================================================

describe('buildAIContextInfo', () => {
  it('builds context info from params', () => {
    const week = mockWeek({ name: 'Week 3' })
    const session = mockSession({ name: 'Sprint Day', day: 2 })

    const result = buildAIContextInfo({
      aiContextLevel: 'session',
      selectedWeekId: 3,
      selectedWeek: week,
      weekNumber: 3,
      selectedSessionId: 'sess-1',
      selectedSession: session,
      selectedExerciseId: null,
    })

    expect(result).toEqual({
      level: 'session',
      weekId: 3,
      weekName: 'Week 3',
      weekNumber: 3,
      sessionId: 'sess-1',
      sessionName: 'Sprint Day',
      sessionDay: 2,
      exerciseId: null,
    })
  })

  it('handles null selections gracefully', () => {
    const result = buildAIContextInfo({
      aiContextLevel: 'block',
      selectedWeekId: null,
      selectedWeek: null,
      weekNumber: null,
      selectedSessionId: null,
      selectedSession: null,
      selectedExerciseId: null,
    })

    expect(result).toEqual({
      level: 'block',
      weekId: null,
      weekName: null,
      weekNumber: null,
      sessionId: null,
      sessionName: null,
      sessionDay: null,
      exerciseId: null,
    })
  })
})
