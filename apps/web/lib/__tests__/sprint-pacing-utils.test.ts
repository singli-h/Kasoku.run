/**
 * Tests for sprint pacing utilities
 * Tests PB-based target calculation and exact exercise matching
 */

import { calculateSprintTarget } from '../sprint-pacing-utils'

describe('calculateSprintTarget', () => {
  const mockPBs = [
    {
      id: 1,
      athlete_id: 101,
      exercise_id: 201,
      value: 10.5, // 10.5 seconds
      unit_id: 5, // 5 = seconds
      verified: true,
      achieved_date: '2024-01-15'
    },
    {
      id: 2,
      athlete_id: 101,
      exercise_id: 202,
      value: 12.8,
      unit_id: 5, // 5 = seconds
      verified: true,
      achieved_date: '2024-01-20'
    }
  ]

  describe('Basic calculations', () => {
    it('should calculate target at 95% effort', () => {
      const result = calculateSprintTarget(mockPBs, 201, 0.95)

      // Target should be PB / effort = 10.5 / 0.95 = 11.05
      expect(result.targetSeconds).toBeCloseTo(11.05, 2)
      expect(result.pbSeconds).toBe(10.5)
      expect(result.note).toBe('95% effort')
    })

    it('should calculate target at custom effort level', () => {
      const result = calculateSprintTarget(mockPBs, 201, 0.90)

      // Target should be PB / effort = 10.5 / 0.90 = 11.67
      expect(result.targetSeconds).toBeCloseTo(11.67, 2)
      expect(result.pbSeconds).toBe(10.5)
      expect(result.note).toBe('90% effort')
    })

    it('should calculate target at 100% effort', () => {
      const result = calculateSprintTarget(mockPBs, 201, 1.0)

      // Target should equal PB at 100% effort
      expect(result.targetSeconds).toBeCloseTo(10.5, 2)
      expect(result.pbSeconds).toBe(10.5)
      expect(result.note).toBe('100% effort')
    })

    it('should find correct PB for different exercise', () => {
      const result = calculateSprintTarget(mockPBs, 202, 0.95)

      expect(result.targetSeconds).toBeCloseTo(13.47, 2)
      expect(result.pbSeconds).toBe(12.8)
      expect(result.note).toBe('95% effort')
    })
  })

  describe('Edge cases', () => {
    it('should return null target when no PB exists for exercise', () => {
      const result = calculateSprintTarget(mockPBs, 999, 0.95) // Non-existent exercise

      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('No PB recorded')
    })

    it('should return null target when PB array is empty', () => {
      const result = calculateSprintTarget([], 201, 0.95)

      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('No PB recorded')
    })

    it('should handle zero effort gracefully', () => {
      const result = calculateSprintTarget(mockPBs, 201, 0)

      // Division by zero/invalid effort should return null
      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('Invalid effort percentage')
    })

    it('should handle negative effort gracefully', () => {
      const result = calculateSprintTarget(mockPBs, 201, -0.5)

      // Negative effort should be treated as invalid
      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('Invalid effort percentage')
    })

    it('should handle effort > 1 (over-maximal effort) as invalid', () => {
      const result = calculateSprintTarget(mockPBs, 201, 1.1)

      // Effort > 1.0 should be invalid
      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('Invalid effort percentage')
    })
  })

  describe('Exercise matching', () => {
    it('should only match exact exercise IDs', () => {
      const result = calculateSprintTarget(mockPBs, 201, 0.95)

      // Should find exercise 201, not 202
      expect(result.pbSeconds).toBe(10.5)
      expect(result.pbSeconds).not.toBe(12.8)
    })

    it('should not apply scaling between different exercises', () => {
      const pbs100m = [
        { id: 1, athlete_id: 101, exercise_id: 100, value: 10.0, unit_id: 5, verified: true, achieved_date: '2024-01-01' }
      ]

      // Should NOT find PB for 200m based on 100m
      const result = calculateSprintTarget(pbs100m, 200, 0.95)
      expect(result.targetSeconds).toBeNull()
      expect(result.note).toBe('No PB recorded')
    })

    it('should require unit_id = 5 (seconds) for time-based exercises', () => {
      const pbsWrongUnit = [
        { id: 1, athlete_id: 101, exercise_id: 201, value: 10.5, unit_id: 3, verified: true, achieved_date: '2024-01-01' } // Wrong unit
      ]

      const result = calculateSprintTarget(pbsWrongUnit, 201, 0.95)
      expect(result.targetSeconds).toBeNull()
      expect(result.note).toBe('No PB recorded')
    })
  })

  describe('Multiple PBs for same exercise', () => {
    it('should use the first matching PB (no deduplication in function)', () => {
      const multiplePBs = [
        { id: 1, athlete_id: 101, exercise_id: 201, value: 11.0, unit_id: 5, verified: true, achieved_date: '2024-01-01' }, // First match
        { id: 2, athlete_id: 101, exercise_id: 201, value: 10.5, unit_id: 5, verified: true, achieved_date: '2024-01-15' },
        { id: 3, athlete_id: 101, exercise_id: 201, value: 11.2, unit_id: 5, verified: true, achieved_date: '2024-01-10' }
      ]

      const result = calculateSprintTarget(multiplePBs, 201, 0.95)

      // Should use the first match (11.0)
      expect(result.pbSeconds).toBe(11.0)
      expect(result.targetSeconds).toBeCloseTo(11.58, 2)
    })
  })

  describe('Return value structure', () => {
    it('should return correct structure with PB', () => {
      const result = calculateSprintTarget(mockPBs, 201, 0.95)

      expect(result).toHaveProperty('targetSeconds')
      expect(result).toHaveProperty('pbSeconds')
      expect(result).toHaveProperty('note')

      expect(typeof result.targetSeconds).toBe('number')
      expect(typeof result.pbSeconds).toBe('number')
      expect(typeof result.note).toBe('string')
    })

    it('should return correct structure without PB', () => {
      const result = calculateSprintTarget([], 201, 0.95)

      expect(result).toHaveProperty('targetSeconds')
      expect(result).toHaveProperty('pbSeconds')
      expect(result).toHaveProperty('note')

      expect(result.targetSeconds).toBeNull()
      expect(result.pbSeconds).toBeNull()
      expect(result.note).toBe('No PB recorded')
    })
  })
})
