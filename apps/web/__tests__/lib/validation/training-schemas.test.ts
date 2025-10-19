/*
<ai_context>
Jest tests for Zod validation schemas.
Validates schema rules, error messages, and edge cases.
</ai_context>
*/

import { describe, it, expect } from '@jest/globals'
import {
  MacrocycleSchema,
  MesocycleSchema,
  MicrocycleSchema,
  SessionSchema,
  ExercisePresetSchema,
  SetDetailsSchema,
  RaceSchema,
  getValidationErrors,
  formatValidationError
} from '@/lib/validation/training-schemas'
import { ZodError } from 'zod'

describe('Training Validation Schemas', () => {
  describe('MacrocycleSchema', () => {
    it('should validate a valid macrocycle', () => {
      const validData = {
        name: 'Annual Training Plan',
        description: 'Full year plan',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when name is empty', () => {
      const invalidData = {
        name: '',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name is required')
      }
    })

    it('should fail when end date is before start date', () => {
      const invalidData = {
        name: 'Invalid Plan',
        start_date: '2025-12-31',
        end_date: '2025-01-01'
      }

      const result = MacrocycleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('End date must be after start date')
      }
    })

    it('should fail when date format is invalid', () => {
      const invalidData = {
        name: 'Invalid Plan',
        start_date: '01/01/2025',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional athlete_group_id', () => {
      const validData = {
        name: 'Team Plan',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        athlete_group_id: 1
      }

      const result = MacrocycleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('MesocycleSchema', () => {
    it('should validate a valid mesocycle', () => {
      const validData = {
        name: 'Base Building Phase',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        macrocycle_id: 1
      }

      const result = MesocycleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when macrocycle_id is missing', () => {
      const invalidData = {
        name: 'Phase',
        start_date: '2025-01-01',
        end_date: '2025-03-31'
      }

      const result = MesocycleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept metadata field', () => {
      const validData = {
        name: 'Phase',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        macrocycle_id: 1,
        metadata: { phase: 'GPP', color: '#blue' }
      }

      const result = MesocycleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('SessionSchema', () => {
    it('should validate a valid session', () => {
      const validData = {
        name: 'Upper Body Strength',
        description: 'Focus on compound movements',
        day: 1,
        week: 1,
        microcycle_id: 1
      }

      const result = SessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when day is out of range', () => {
      const invalidData = {
        name: 'Session',
        day: 8
      }

      const result = SessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 1')
      }
    })

    it('should validate session_mode enum', () => {
      const validData = {
        name: 'Team Session',
        session_mode: 'group' as const
      }

      const result = SessionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail with invalid session_mode', () => {
      const invalidData = {
        name: 'Session',
        session_mode: 'invalid'
      }

      const result = SessionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('SetDetailsSchema', () => {
    it('should validate valid set details', () => {
      const validData = {
        exercise_preset_id: 1,
        set_index: 0,
        reps: 10,
        weight: 135,
        rest_time: 90,
        rpe: 8
      }

      const result = SetDetailsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when reps exceed maximum', () => {
      const invalidData = {
        exercise_preset_id: 1,
        set_index: 0,
        reps: 1000
      }

      const result = SetDetailsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('less than 1000')
      }
    })

    it('should fail when RPE is out of range', () => {
      const invalidData = {
        exercise_preset_id: 1,
        set_index: 0,
        rpe: 11
      }

      const result = SetDetailsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 0 and 10')
      }
    })

    it('should accept all optional advanced parameters', () => {
      const validData = {
        exercise_preset_id: 1,
        set_index: 0,
        tempo: '3010',
        distance: 400,
        height: 24,
        power: 350,
        velocity: 1.2,
        effort: 85,
        performing_time: 60
      }

      const result = SetDetailsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('RaceSchema', () => {
    it('should validate a valid race', () => {
      const validData = {
        name: 'Boston Marathon',
        type: 'Marathon',
        date: '2025-04-21',
        location: 'Boston, MA',
        macrocycle_id: 1
      }

      const result = RaceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when required fields are missing', () => {
      const invalidData = {
        name: 'Marathon',
        date: '2025-04-21'
      }

      const result = RaceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional location and notes', () => {
      const validData = {
        name: 'Local 5K',
        type: '5K',
        date: '2025-06-15',
        location: 'City Park',
        notes: 'Fundraiser race'
      }

      const result = RaceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Validation Error Helpers', () => {
    it('should extract validation errors as record', () => {
      const invalidData = {
        name: '',
        start_date: 'invalid',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(invalidData)
      if (!result.success) {
        const errors = getValidationErrors(result.error)
        expect(errors).toHaveProperty('name')
        expect(errors).toHaveProperty('start_date')
      }
    })

    it('should format validation error as string', () => {
      const invalidData = {
        name: '',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(invalidData)
      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('name')
        expect(formatted).toContain('required')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings as optional fields', () => {
      const data = {
        name: 'Test',
        description: '',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      const result = MacrocycleSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle null values for optional fields', () => {
      const data = {
        exercise_preset_id: 1,
        set_index: 0,
        reps: null,
        weight: null
      }

      const result = SetDetailsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate zero values correctly', () => {
      const data = {
        exercise_preset_id: 1,
        set_index: 0,
        reps: 0,
        weight: 0,
        rest_time: 0
      }

      const result = SetDetailsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
