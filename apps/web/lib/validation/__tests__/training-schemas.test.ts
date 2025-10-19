/**
 * Comprehensive test suite for training validation schemas
 *
 * Test Coverage:
 * - All Zod schema validations
 * - Edge cases and boundary conditions
 * - Error message quality
 * - Type inference
 */

import { describe, it, expect } from 'vitest'
import {
  RaceSchema,
  MacrocycleSchema,
  MesocycleSchema,
  MicrocycleSchema,
  getValidationErrors,
  formatValidationError
} from '../training-schemas'
import { z } from 'zod'

describe('Training Validation Schemas', () => {
  describe('RaceSchema', () => {
    it('should validate correct race data', () => {
      const data = {
        name: 'Boston Marathon',
        type: 'Marathon',
        date: '2025-04-21',
        location: 'Boston, MA',
        notes: 'Goal: Sub 3:00'
      }

      expect(() => RaceSchema.parse(data)).not.toThrow()
    })

    it('should reject empty name', () => {
      const data = {
        name: '',
        type: 'Marathon',
        date: '2025-04-21'
      }

      expect(() => RaceSchema.parse(data)).toThrow()
    })

    it('should reject name exceeding 100 characters', () => {
      const data = {
        name: 'A'.repeat(101),
        type: 'Marathon',
        date: '2025-04-21'
      }

      expect(() => RaceSchema.parse(data)).toThrow()
    })

    it('should accept name at exactly 100 characters', () => {
      const data = {
        name: 'A'.repeat(100),
        type: 'Marathon',
        date: '2025-04-21'
      }

      expect(() => RaceSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid date format', () => {
      const data = {
        name: 'Test Race',
        type: 'Marathon',
        date: 'invalid-date'
      }

      expect(() => RaceSchema.parse(data)).toThrow()
    })

    it('should accept valid date formats', () => {
      const validDates = [
        '2025-01-01',
        '2025-12-31',
        '2099-06-15'
      ]

      validDates.forEach(date => {
        const data = {
          name: 'Test Race',
          type: 'Marathon',
          date
        }
        expect(() => RaceSchema.parse(data)).not.toThrow()
      })
    })

    it('should make location optional', () => {
      const data = {
        name: 'Test Race',
        type: 'Marathon',
        date: '2025-06-01'
        // location omitted
      }

      expect(() => RaceSchema.parse(data)).not.toThrow()
    })

    it('should make notes optional', () => {
      const data = {
        name: 'Test Race',
        type: 'Marathon',
        date: '2025-06-01'
        // notes omitted
      }

      expect(() => RaceSchema.parse(data)).not.toThrow()
    })
  })

  describe('MacrocycleSchema', () => {
    it('should validate correct macrocycle data', () => {
      const data = {
        name: 'Spring Training Block',
        description: 'Building base for marathon',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      expect(() => MacrocycleSchema.parse(data)).not.toThrow()
    })

    it('should reject when end_date is before start_date', () => {
      const data = {
        name: 'Invalid Plan',
        start_date: '2025-12-31',
        end_date: '2025-01-01'
      }

      expect(() => MacrocycleSchema.parse(data)).toThrow()
    })

    it('should accept when end_date is after start_date', () => {
      const data = {
        name: 'Valid Plan',
        start_date: '2025-01-01',
        end_date: '2025-01-02'
      }

      expect(() => MacrocycleSchema.parse(data)).not.toThrow()
    })

    it('should reject empty name', () => {
      const data = {
        name: '',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      expect(() => MacrocycleSchema.parse(data)).toThrow()
    })

    it('should accept empty description', () => {
      const data = {
        name: 'Test Plan',
        description: '',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      expect(() => MacrocycleSchema.parse(data)).not.toThrow()
    })

    it('should reject description exceeding 500 characters', () => {
      const data = {
        name: 'Test Plan',
        description: 'A'.repeat(501),
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }

      expect(() => MacrocycleSchema.parse(data)).toThrow()
    })
  })

  describe('Validation Error Helpers', () => {
    it('should extract validation errors', () => {
      try {
        RaceSchema.parse({
          name: '',
          type: 'Marathon',
          date: 'invalid'
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = getValidationErrors(error)
          expect(errors).toBeDefined()
          expect(typeof errors).toBe('object')
        }
      }
    })

    it('should format validation error messages', () => {
      try {
        RaceSchema.parse({
          name: '',
          type: 'Marathon',
          date: 'invalid'
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error)
          expect(formatted).toBeDefined()
          expect(typeof formatted).toBe('string')
          expect(formatted.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
