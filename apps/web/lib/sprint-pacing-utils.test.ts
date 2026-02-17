import {
  calculateTargetTime,
  calculateActualIntensity,
  getPacingZone,
  formatTime,
  formatIntensity,
  calculatePacePer100m,
  isNewPersonalBest,
  getSuggestedIntensity,
  calculateSprintTarget,
  formatTargetPlaceholder,
  PACING_ZONES,
  type PersonalBest,
} from './sprint-pacing-utils'

// ============================================================================
// calculateTargetTime
// ============================================================================

describe('calculateTargetTime', () => {
  it('calculates target time from PB and intensity', () => {
    // 12.0s PB at 95% intensity = 12.0 / 0.95 = 12.63s
    expect(calculateTargetTime(12.0, 0.95)).toBe(12.63)
  })

  it('calculates slower time for lower intensity', () => {
    // 12.0s PB at 90% intensity = 12.0 / 0.90 = 13.33s
    expect(calculateTargetTime(12.0, 0.90)).toBe(13.33)
  })

  it('returns PB time at 100% intensity', () => {
    expect(calculateTargetTime(12.0, 1.0)).toBe(12.0)
  })

  it('returns null for null PB', () => {
    expect(calculateTargetTime(null, 0.95)).toBeNull()
  })

  it('returns null for zero PB', () => {
    expect(calculateTargetTime(0, 0.95)).toBeNull()
  })

  it('returns null for negative PB', () => {
    expect(calculateTargetTime(-5, 0.95)).toBeNull()
  })

  it('throws error for zero intensity', () => {
    expect(() => calculateTargetTime(12.0, 0)).toThrow('Target intensity must be between 0 and 1.0')
  })

  it('throws error for negative intensity', () => {
    expect(() => calculateTargetTime(12.0, -0.5)).toThrow('Target intensity must be between 0 and 1.0')
  })

  it('throws error for intensity greater than 1.0', () => {
    expect(() => calculateTargetTime(12.0, 1.1)).toThrow('Target intensity must be between 0 and 1.0')
  })

  it('rounds to 2 decimal places', () => {
    // 11.5 / 0.90 = 12.777... -> 12.78
    expect(calculateTargetTime(11.5, 0.90)).toBe(12.78)
  })
})

// ============================================================================
// calculateActualIntensity
// ============================================================================

describe('calculateActualIntensity', () => {
  it('calculates intensity from PB and actual time', () => {
    // 12.0s PB, ran 12.63s -> 12.0 / 12.63 = 0.9501...
    const result = calculateActualIntensity(12.0, 12.63)
    expect(result).toBeCloseTo(0.9501, 3)
  })

  it('returns intensity > 1.0 when faster than PB (new PB)', () => {
    // 12.0s PB, ran 11.5s -> 12.0 / 11.5 = 1.0434...
    const result = calculateActualIntensity(12.0, 11.5)
    expect(result).toBeGreaterThan(1.0)
  })

  it('returns exactly 1.0 when actual equals PB', () => {
    expect(calculateActualIntensity(12.0, 12.0)).toBe(1.0)
  })

  it('returns null for null PB', () => {
    expect(calculateActualIntensity(null, 12.0)).toBeNull()
  })

  it('returns null for null actual time', () => {
    expect(calculateActualIntensity(12.0, null)).toBeNull()
  })

  it('returns null for zero PB', () => {
    expect(calculateActualIntensity(0, 12.0)).toBeNull()
  })

  it('returns null for zero actual time', () => {
    expect(calculateActualIntensity(12.0, 0)).toBeNull()
  })

  it('returns null for negative values', () => {
    expect(calculateActualIntensity(-12.0, 12.0)).toBeNull()
    expect(calculateActualIntensity(12.0, -12.0)).toBeNull()
  })
})

// ============================================================================
// getPacingZone
// ============================================================================

describe('getPacingZone', () => {
  it('returns "max" for 95-100% intensity', () => {
    expect(getPacingZone(0.95)).toBe('max')
    expect(getPacingZone(1.0)).toBe('max')
    expect(getPacingZone(0.98)).toBe('max')
  })

  it('returns "near-max" for 90-94% intensity', () => {
    expect(getPacingZone(0.90)).toBe('near-max')
    expect(getPacingZone(0.94)).toBe('near-max')
  })

  it('returns "sub-max" for 85-89% intensity', () => {
    expect(getPacingZone(0.85)).toBe('sub-max')
    expect(getPacingZone(0.89)).toBe('sub-max')
  })

  it('returns "tempo" for 70-84% intensity', () => {
    expect(getPacingZone(0.70)).toBe('tempo')
    expect(getPacingZone(0.84)).toBe('tempo')
  })

  it('returns null for intensity below tempo zone', () => {
    expect(getPacingZone(0.69)).toBeNull()
    expect(getPacingZone(0.5)).toBeNull()
  })

  it('returns null for null intensity', () => {
    expect(getPacingZone(null)).toBeNull()
  })

  it('returns null for zero intensity', () => {
    expect(getPacingZone(0)).toBeNull()
  })

  it('returns "max" for intensity above 1.0 (new PB territory)', () => {
    expect(getPacingZone(1.05)).toBe('max')
  })
})

// ============================================================================
// formatTime
// ============================================================================

describe('formatTime', () => {
  it('formats milliseconds as seconds with decimals', () => {
    expect(formatTime(12340)).toBe('12.34s')
  })

  it('formats times over 60 seconds with minutes', () => {
    // 65.34 seconds = 1:05.34
    expect(formatTime(65340)).toBe('1:05.34')
  })

  it('pads seconds correctly in minute format', () => {
    // 62.0 seconds = 1:02.00
    expect(formatTime(62000)).toBe('1:02.00')
  })

  it('returns "-" for null', () => {
    expect(formatTime(null)).toBe('-')
  })

  it('returns "-" for zero', () => {
    expect(formatTime(0)).toBe('-')
  })

  it('returns "-" for negative values', () => {
    expect(formatTime(-1000)).toBe('-')
  })

  it('formats without milliseconds when includeMs is false', () => {
    expect(formatTime(12340, false)).toBe('12s')
  })

  it('formats minutes without ms when includeMs is false', () => {
    expect(formatTime(65340, false)).toBe('1:05')
  })

  it('handles exact second boundaries', () => {
    expect(formatTime(10000)).toBe('10.00s')
  })
})

// ============================================================================
// formatIntensity
// ============================================================================

describe('formatIntensity', () => {
  it('formats intensity as percentage', () => {
    expect(formatIntensity(0.95)).toBe('95.0%')
  })

  it('formats with custom decimal places', () => {
    expect(formatIntensity(0.9523, 2)).toBe('95.23%')
  })

  it('formats 100% intensity', () => {
    expect(formatIntensity(1.0)).toBe('100.0%')
  })

  it('returns "-" for null', () => {
    expect(formatIntensity(null)).toBe('-')
  })

  it('returns "-" for zero (falsy)', () => {
    // Note: 0 is falsy, so formatIntensity(0) returns "-"
    expect(formatIntensity(0)).toBe('-')
  })
})

// ============================================================================
// calculatePacePer100m
// ============================================================================

describe('calculatePacePer100m', () => {
  it('calculates pace per 100m', () => {
    // 200m in 24000ms = 12000ms per 100m
    expect(calculatePacePer100m(200, 24000)).toBe(12000)
  })

  it('returns null for null distance', () => {
    expect(calculatePacePer100m(null, 24000)).toBeNull()
  })

  it('returns null for null time', () => {
    expect(calculatePacePer100m(200, null)).toBeNull()
  })

  it('returns null for zero distance', () => {
    expect(calculatePacePer100m(0, 24000)).toBeNull()
  })

  it('returns null for zero time', () => {
    expect(calculatePacePer100m(200, 0)).toBeNull()
  })

  it('returns null for negative values', () => {
    expect(calculatePacePer100m(-200, 24000)).toBeNull()
    expect(calculatePacePer100m(200, -24000)).toBeNull()
  })

  it('rounds to nearest millisecond', () => {
    // 300m in 36500ms = (36500/300)*100 = 12166.666... -> 12167
    expect(calculatePacePer100m(300, 36500)).toBe(12167)
  })
})

// ============================================================================
// isNewPersonalBest
// ============================================================================

describe('isNewPersonalBest', () => {
  it('returns true when new time is faster', () => {
    expect(isNewPersonalBest(11500, 12000)).toBe(true)
  })

  it('returns false when new time is slower', () => {
    expect(isNewPersonalBest(12500, 12000)).toBe(false)
  })

  it('returns false when times are equal', () => {
    expect(isNewPersonalBest(12000, 12000)).toBe(false)
  })

  it('returns true when no current PB exists (null)', () => {
    expect(isNewPersonalBest(12000, null)).toBe(true)
  })

  it('returns true when current PB is zero', () => {
    expect(isNewPersonalBest(12000, 0)).toBe(true)
  })

  it('returns false when new time is null', () => {
    expect(isNewPersonalBest(null, 12000)).toBe(false)
  })

  it('returns false when new time is zero', () => {
    expect(isNewPersonalBest(0, 12000)).toBe(false)
  })

  it('returns false when new time is negative', () => {
    expect(isNewPersonalBest(-1000, 12000)).toBe(false)
  })
})

// ============================================================================
// getSuggestedIntensity
// ============================================================================

describe('getSuggestedIntensity', () => {
  it('returns peak/competition intensity range', () => {
    const result = getSuggestedIntensity('peak')
    expect(result).toEqual({ min: 0.95, max: 1.0, default: 0.98 })
  })

  it('matches "competition" phase', () => {
    const result = getSuggestedIntensity('competition')
    expect(result.default).toBe(0.98)
  })

  it('returns build phase intensity range', () => {
    const result = getSuggestedIntensity('build')
    expect(result).toEqual({ min: 0.85, max: 0.95, default: 0.90 })
  })

  it('matches "specific" phase', () => {
    const result = getSuggestedIntensity('specific training')
    expect(result.default).toBe(0.90)
  })

  it('returns taper intensity range', () => {
    const result = getSuggestedIntensity('taper')
    expect(result).toEqual({ min: 0.80, max: 0.90, default: 0.85 })
  })

  it('returns base phase intensity range', () => {
    const result = getSuggestedIntensity('base')
    expect(result).toEqual({ min: 0.70, max: 0.85, default: 0.75 })
  })

  it('matches "general" phase', () => {
    const result = getSuggestedIntensity('general fitness')
    expect(result.default).toBe(0.75)
  })

  it('returns default sub-max range for unknown phase', () => {
    const result = getSuggestedIntensity('unknown')
    expect(result).toEqual({ min: 0.85, max: 0.90, default: 0.87 })
  })

  it('returns default for null phase', () => {
    const result = getSuggestedIntensity(null)
    expect(result).toEqual({ min: 0.85, max: 0.90, default: 0.87 })
  })

  it('is case-insensitive', () => {
    expect(getSuggestedIntensity('PEAK')).toEqual(getSuggestedIntensity('peak'))
    expect(getSuggestedIntensity('Build')).toEqual(getSuggestedIntensity('build'))
  })
})

// ============================================================================
// calculateSprintTarget
// ============================================================================

describe('calculateSprintTarget', () => {
  const basePB: PersonalBest = {
    id: 1,
    athlete_id: 100,
    exercise_id: 5,
    value: 12.0,
    unit_id: 5, // seconds
    achieved_date: '2026-01-01',
    verified: true,
  }

  it('calculates target for exact exercise match', () => {
    const result = calculateSprintTarget([basePB], 5, 0.95)
    expect(result.targetSeconds).toBe(12.63)
    expect(result.pbSeconds).toBe(12.0)
    expect(result.note).toBe('95% effort')
  })

  it('returns null when no PB for exercise', () => {
    const result = calculateSprintTarget([basePB], 8, 0.95)
    expect(result.targetSeconds).toBeNull()
    expect(result.pbSeconds).toBeNull()
    expect(result.note).toBe('No PB recorded')
  })

  it('returns null when PB has wrong unit_id', () => {
    const nonTimePB: PersonalBest = { ...basePB, unit_id: 3 } // Not seconds
    const result = calculateSprintTarget([nonTimePB], 5, 0.95)
    expect(result.targetSeconds).toBeNull()
  })

  it('returns error for invalid effort (0)', () => {
    const result = calculateSprintTarget([basePB], 5, 0)
    expect(result.targetSeconds).toBeNull()
    expect(result.note).toBe('Invalid effort percentage')
  })

  it('returns error for invalid effort (>1.0)', () => {
    const result = calculateSprintTarget([basePB], 5, 1.1)
    expect(result.targetSeconds).toBeNull()
    expect(result.note).toBe('Invalid effort percentage')
  })

  it('returns error for negative effort', () => {
    const result = calculateSprintTarget([basePB], 5, -0.5)
    expect(result.targetSeconds).toBeNull()
    expect(result.note).toBe('Invalid effort percentage')
  })

  it('handles empty PBs array', () => {
    const result = calculateSprintTarget([], 5, 0.95)
    expect(result.targetSeconds).toBeNull()
    expect(result.note).toBe('No PB recorded')
  })

  it('picks exact exercise match from multiple PBs', () => {
    const pbs: PersonalBest[] = [
      basePB,
      { ...basePB, id: 2, exercise_id: 6, value: 24.0 },
    ]
    const result = calculateSprintTarget(pbs, 6, 0.90)
    expect(result.targetSeconds).toBe(26.67)
    expect(result.pbSeconds).toBe(24.0)
  })

  it('calculates correct target at 100% effort', () => {
    const result = calculateSprintTarget([basePB], 5, 1.0)
    expect(result.targetSeconds).toBe(12.0)
    expect(result.note).toBe('100% effort')
  })
})

// ============================================================================
// formatTargetPlaceholder
// ============================================================================

describe('formatTargetPlaceholder', () => {
  it('formats seconds to 2 decimal places', () => {
    expect(formatTargetPlaceholder(12.63)).toBe('12.63')
  })

  it('returns "Enter time" for null', () => {
    expect(formatTargetPlaceholder(null)).toBe('Enter time')
  })

  it('returns "Enter time" for zero (falsy)', () => {
    // 0 is falsy in JS, so formatTargetPlaceholder(0) returns "Enter time"
    expect(formatTargetPlaceholder(0)).toBe('Enter time')
  })

  it('formats whole numbers with .00', () => {
    expect(formatTargetPlaceholder(12.0)).toBe('12.00')
  })
})

// ============================================================================
// PACING_ZONES constant
// ============================================================================

describe('PACING_ZONES', () => {
  it('has four zones defined', () => {
    expect(Object.keys(PACING_ZONES)).toHaveLength(4)
  })

  it('zones have contiguous ranges (no gaps)', () => {
    // Verify tempo.max == sub-max.min, sub-max.max == near-max.min, etc.
    expect(PACING_ZONES.tempo.max).toBe(PACING_ZONES['sub-max'].min)
    expect(PACING_ZONES['sub-max'].max).toBe(PACING_ZONES['near-max'].min)
    expect(PACING_ZONES['near-max'].max).toBe(PACING_ZONES.max.min)
  })

  it('max zone upper bound is 1.0', () => {
    expect(PACING_ZONES.max.max).toBe(1.0)
  })

  it('tempo zone lower bound is 0.7', () => {
    expect(PACING_ZONES.tempo.min).toBe(0.7)
  })

  it('each zone has label and description', () => {
    for (const zone of Object.values(PACING_ZONES)) {
      expect(zone.label).toBeTruthy()
      expect(zone.description).toBeTruthy()
    }
  })
})