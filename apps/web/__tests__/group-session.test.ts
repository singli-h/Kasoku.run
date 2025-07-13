/**
 * Group Session Tests
 * Unit tests for group session logging functionality
 */

import { describe, it, expect } from '@jest/globals'

describe('Session Utils', () => {
  describe('buildPerformancePayload', () => {
    it('builds correct payload from performance data', () => {
      const performance = {
        1: { 1: 12500, 2: 13000 },
        2: { 1: 11800, 2: null }
      }
      
      const rounds = [
        { roundNumber: 1, distance: 40 },
        { roundNumber: 2, distance: 60 }
      ]
      
      const payload = buildPerformancePayload(performance, rounds)
      
      expect(payload).toEqual([
        { athleteId: 1, roundNumber: 1, time: 12500, distance: 40 },
        { athleteId: 1, roundNumber: 2, time: 13000, distance: 60 },
        { athleteId: 2, roundNumber: 1, time: 11800, distance: 40 }
      ])
    })
    
    it('handles empty performance data', () => {
      const payload = buildPerformancePayload({}, [])
      expect(payload).toEqual([])
    })
    
    it('filters out null values', () => {
      const performance = {
        1: { 1: null, 2: 12500 }
      }
      
      const rounds = [
        { roundNumber: 1, distance: 40 },
        { roundNumber: 2, distance: 60 }
      ]
      
      const payload = buildPerformancePayload(performance, rounds)
      
      expect(payload).toEqual([
        { athleteId: 1, roundNumber: 2, time: 12500, distance: 60 }
      ])
    })
  })

  describe('validateSessionData', () => {
    it('validates complete session data', () => {
      const sessionData = {
        selectedGroupId: 1,
        selectedPresetId: 1,
        athletes: [{ id: 1, name: 'John Doe' }],
        rounds: [{ roundNumber: 1, distance: 40 }]
      }
      
      const result = validateSessionData(sessionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
    
    it('validates missing required fields', () => {
      const sessionData = {
        selectedGroupId: null,
        selectedPresetId: null,
        athletes: [],
        rounds: []
      }
      
      const result = validateSessionData(sessionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Group selection is required')
      expect(result.errors).toContain('Preset selection is required')
      expect(result.errors).toContain('At least one athlete is required')
      expect(result.errors).toContain('At least one round is required')
    })
    
    it('validates round distances', () => {
      const sessionData = {
        selectedGroupId: 1,
        selectedPresetId: 1,
        athletes: [{ id: 1, name: 'John Doe' }],
        rounds: [
          { roundNumber: 1, distance: 0 },
          { roundNumber: 2, distance: -10 }
        ]
      }
      
      const result = validateSessionData(sessionData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Round 1: Distance must be greater than 0')
      expect(result.errors).toContain('Round 2: Distance must be greater than 0')
    })
  })

  describe('formatSessionTime', () => {
    it('formats time correctly', () => {
      expect(formatSessionTime(0)).toBe('00:00')
      expect(formatSessionTime(59)).toBe('00:59')
      expect(formatSessionTime(60)).toBe('01:00')
      expect(formatSessionTime(3661)).toBe('61:01')
    })
  })
})

describe('Group Session Integration', () => {
  describe('Performance Data Management', () => {
    it('handles performance data updates correctly', () => {
      const initialPerformance = {
        1: { 1: 12500 }
      }
      
      // Simulate adding a new time
      const updatedPerformance = {
        ...initialPerformance,
        1: {
          ...initialPerformance[1],
          2: 13000
        }
      }
      
      expect(updatedPerformance).toEqual({
        1: { 1: 12500, 2: 13000 }
      })
    })
    
    it('handles round removal correctly', () => {
      const performance = {
        1: { 1: 12500, 2: 13000, 3: 14000 },
        2: { 1: 11800, 2: 12200, 3: 13500 }
      }
      
      // Remove round 2
      const updatedPerformance = { ...performance }
      Object.keys(updatedPerformance).forEach(athleteId => {
        delete (updatedPerformance as any)[Number(athleteId)][2]
      })
      
      expect(updatedPerformance).toEqual({
        1: { 1: 12500, 3: 14000 },
        2: { 1: 11800, 3: 13500 }
      })
    })
  })

  describe('Round Management', () => {
    it('adds rounds correctly', () => {
      const initialRounds = [
        { roundNumber: 1, distance: 40 },
        { roundNumber: 2, distance: 40 }
      ]
      
      const newRoundNumber = Math.max(...initialRounds.map(r => r.roundNumber)) + 1
      const newRounds = [...initialRounds, { roundNumber: newRoundNumber, distance: 40 }]
      
      expect(newRounds).toEqual([
        { roundNumber: 1, distance: 40 },
        { roundNumber: 2, distance: 40 },
        { roundNumber: 3, distance: 40 }
      ])
    })
    
    it('removes rounds correctly', () => {
      const initialRounds = [
        { roundNumber: 1, distance: 40 },
        { roundNumber: 2, distance: 60 },
        { roundNumber: 3, distance: 40 }
      ]
      
      const filteredRounds = initialRounds.filter(r => r.roundNumber !== 2)
      
      expect(filteredRounds).toEqual([
        { roundNumber: 1, distance: 40 },
        { roundNumber: 3, distance: 40 }
      ])
    })
  })

  describe('Time Validation', () => {
    it('validates sprint times correctly', () => {
      // Valid times
      expect(validateSprintTime('10.25')).toBe(true)
      expect(validateSprintTime('0.5')).toBe(true)
      expect(validateSprintTime('60.0')).toBe(true)
      
      // Invalid times
      expect(validateSprintTime('invalid')).toBe(false)
      expect(validateSprintTime('')).toBe(true) // Empty is valid
      expect(validateSprintTime('0.01')).toBe(false) // Too small
      expect(validateSprintTime('400')).toBe(false) // Too large
      expect(validateSprintTime('-5')).toBe(false) // Negative
    })
  })
})

// Helper functions for testing
export const buildPerformancePayload = (performance: any, rounds: any[]) => {
  const payload: any[] = []
  
  for (const athleteId in performance) {
    for (const roundNumber in performance[athleteId]) {
      const time = performance[athleteId][roundNumber]
      if (time !== null) {
        const round = rounds.find(r => r.roundNumber === Number(roundNumber))
        payload.push({
          athleteId: Number(athleteId),
          roundNumber: Number(roundNumber),
          time: time,
          distance: round ? round.distance : 0,
        })
      }
    }
  }
  
  return payload
}

export const validateSessionData = (sessionData: any) => {
  const errors: string[] = []
  
  if (!sessionData.selectedGroupId) {
    errors.push('Group selection is required')
  }
  
  if (!sessionData.selectedPresetId) {
    errors.push('Preset selection is required')
  }
  
  if (!sessionData.athletes || sessionData.athletes.length === 0) {
    errors.push('At least one athlete is required')
  }
  
  if (!sessionData.rounds || sessionData.rounds.length === 0) {
    errors.push('At least one round is required')
  }
  
  // Validate round distances
  if (sessionData.rounds) {
    sessionData.rounds.forEach((round: any) => {
      if (round.distance <= 0) {
        errors.push(`Round ${round.roundNumber}: Distance must be greater than 0`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const formatSessionTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export const validateSprintTime = (timeString: string): boolean => {
  if (!timeString || timeString.trim() === "") return true // Empty is valid
  
  const time = parseFloat(timeString)
  
  // Check if it's a valid number
  if (isNaN(time)) return false
  
  // Check reasonable bounds for sprint times (0.1 to 300 seconds)
  if (time < 0.1 || time > 300) return false
  
  return true
} 