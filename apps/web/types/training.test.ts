import {
  isValidEquipmentCategory,
  isValidTrainingFocus,
  sanitizeEquipment,
  createMesocycleMetadata,
  VALID_EQUIPMENT_CATEGORIES,
  VALID_TRAINING_FOCUS,
  TRAINING_GOALS,
  EXPERIENCE_LEVELS,
  SESSION_MODES,
  PLAN_STATUSES,
} from './training'

// ============================================================================
// isValidEquipmentCategory
// ============================================================================

describe('isValidEquipmentCategory', () => {
  it('returns true for all valid equipment categories', () => {
    for (const cat of VALID_EQUIPMENT_CATEGORIES) {
      expect(isValidEquipmentCategory(cat)).toBe(true)
    }
  })

  it('returns false for invalid strings', () => {
    expect(isValidEquipmentCategory('treadmill')).toBe(false)
    expect(isValidEquipmentCategory('resistance_band')).toBe(false)
    expect(isValidEquipmentCategory('')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isValidEquipmentCategory(42)).toBe(false)
    expect(isValidEquipmentCategory(null)).toBe(false)
    expect(isValidEquipmentCategory(undefined)).toBe(false)
    expect(isValidEquipmentCategory(true)).toBe(false)
    expect(isValidEquipmentCategory([])).toBe(false)
  })
})

// ============================================================================
// isValidTrainingFocus
// ============================================================================

describe('isValidTrainingFocus', () => {
  it('returns true for all valid focus types', () => {
    for (const focus of VALID_TRAINING_FOCUS) {
      expect(isValidTrainingFocus(focus)).toBe(true)
    }
  })

  it('returns false for invalid strings', () => {
    expect(isValidTrainingFocus('hypertrophy')).toBe(false)
    expect(isValidTrainingFocus('power')).toBe(false)
    expect(isValidTrainingFocus('')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isValidTrainingFocus(42)).toBe(false)
    expect(isValidTrainingFocus(null)).toBe(false)
    expect(isValidTrainingFocus(undefined)).toBe(false)
  })
})

// ============================================================================
// sanitizeEquipment
// ============================================================================

describe('sanitizeEquipment', () => {
  it('returns valid equipment categories from array', () => {
    const result = sanitizeEquipment(['bodyweight', 'dumbbells', 'barbell'])
    expect(result).toEqual(['bodyweight', 'dumbbells', 'barbell'])
  })

  it('filters out invalid categories', () => {
    const result = sanitizeEquipment(['bodyweight', 'treadmill', 'barbell'])
    expect(result).toEqual(['bodyweight', 'barbell'])
  })

  it('defaults to ["bodyweight"] for empty array', () => {
    expect(sanitizeEquipment([])).toEqual(['bodyweight'])
  })

  it('defaults to ["bodyweight"] for non-array input', () => {
    expect(sanitizeEquipment(null)).toEqual(['bodyweight'])
    expect(sanitizeEquipment(undefined)).toEqual(['bodyweight'])
    expect(sanitizeEquipment('bodyweight')).toEqual(['bodyweight'])
    expect(sanitizeEquipment(42)).toEqual(['bodyweight'])
  })

  it('defaults to ["bodyweight"] when all items are invalid', () => {
    expect(sanitizeEquipment(['treadmill', 'bands'])).toEqual(['bodyweight'])
  })

  it('preserves order of valid categories', () => {
    const result = sanitizeEquipment(['cables', 'bodyweight', 'bench'])
    expect(result).toEqual(['cables', 'bodyweight', 'bench'])
  })
})

// ============================================================================
// createMesocycleMetadata
// ============================================================================

describe('createMesocycleMetadata', () => {
  it('creates metadata from valid input', () => {
    const result = createMesocycleMetadata({
      focus: 'strength',
      equipment: ['bodyweight', 'dumbbells'],
      createdVia: 'quick-start',
    })

    expect(result.focus).toBe('strength')
    expect(result.equipment).toEqual(['bodyweight', 'dumbbells'])
    expect(result.createdVia).toBe('quick-start')
  })

  it('sets focus to undefined for invalid focus', () => {
    const result = createMesocycleMetadata({
      focus: 'hypertrophy' as any,
      equipment: ['bodyweight'],
    })
    expect(result.focus).toBeUndefined()
  })

  it('sanitizes equipment array', () => {
    const result = createMesocycleMetadata({
      equipment: ['bodyweight', 'invalid-item', 'barbell'],
    })
    expect(result.equipment).toEqual(['bodyweight', 'barbell'])
  })

  it('defaults equipment to ["bodyweight"] when not provided', () => {
    const result = createMesocycleMetadata({})
    expect(result.equipment).toEqual(['bodyweight'])
  })

  it('preserves aiContext metadata', () => {
    const aiContext = { model: 'gpt-4', generatedAt: '2026-01-01' }
    const result = createMesocycleMetadata({ aiContext })
    expect(result.aiContext).toEqual(aiContext)
  })

  it('handles all createdVia options', () => {
    const options: Array<'quick-start' | 'ai-generator' | 'manual' | 'template'> = [
      'quick-start', 'ai-generator', 'manual', 'template'
    ]
    for (const via of options) {
      const result = createMesocycleMetadata({ createdVia: via })
      expect(result.createdVia).toBe(via)
    }
  })
})

// ============================================================================
// Constants integrity
// ============================================================================

describe('constants', () => {
  it('VALID_EQUIPMENT_CATEGORIES has expected items', () => {
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('bodyweight')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('dumbbells')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('barbell')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('kettlebells')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('cables')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('machines')
    expect(VALID_EQUIPMENT_CATEGORIES).toContain('bench')
    expect(VALID_EQUIPMENT_CATEGORIES).toHaveLength(7)
  })

  it('VALID_TRAINING_FOCUS has expected items', () => {
    expect(VALID_TRAINING_FOCUS).toContain('strength')
    expect(VALID_TRAINING_FOCUS).toContain('endurance')
    expect(VALID_TRAINING_FOCUS).toContain('general')
    expect(VALID_TRAINING_FOCUS).toHaveLength(3)
  })

  it('TRAINING_GOALS has 6 options', () => {
    expect(TRAINING_GOALS).toHaveLength(6)
    expect(TRAINING_GOALS).toContain('strength')
    expect(TRAINING_GOALS).toContain('hypertrophy')
    expect(TRAINING_GOALS).toContain('endurance')
    expect(TRAINING_GOALS).toContain('power')
    expect(TRAINING_GOALS).toContain('sport_specific')
    expect(TRAINING_GOALS).toContain('general_fitness')
  })

  it('EXPERIENCE_LEVELS has 3 options', () => {
    expect(EXPERIENCE_LEVELS).toHaveLength(3)
    expect(EXPERIENCE_LEVELS).toContain('beginner')
    expect(EXPERIENCE_LEVELS).toContain('intermediate')
    expect(EXPERIENCE_LEVELS).toContain('advanced')
  })

  it('SESSION_MODES has 2 options', () => {
    expect(SESSION_MODES).toHaveLength(2)
    expect(SESSION_MODES).toContain('individual')
    expect(SESSION_MODES).toContain('group')
  })

  it('PLAN_STATUSES has 4 options', () => {
    expect(PLAN_STATUSES).toHaveLength(4)
    expect(PLAN_STATUSES).toContain('pending')
    expect(PLAN_STATUSES).toContain('active')
    expect(PLAN_STATUSES).toContain('completed')
    expect(PLAN_STATUSES).toContain('archived')
  })
})