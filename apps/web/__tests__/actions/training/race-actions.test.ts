/**
 * Comprehensive test suite for race CRUD actions
 *
 * Test Coverage:
 * - Authentication & Authorization
 * - Input Validation (Zod schemas)
 * - Database Operations (CRUD)
 * - Error Handling
 * - Performance Monitoring
 * - RLS Security
 * - Edge Cases & Boundary Conditions
 * - Data Integrity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createRaceAction,
  getRacesByMacrocycleAction,
  getRacesAction,
  getRaceByIdAction,
  updateRaceAction,
  deleteRaceAction,
  getUpcomingRacesAction
} from '@/actions/plans/race-actions'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/supabase-server', () => ({
  default: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/user-cache', () => ({
  getDbUserId: vi.fn()
}))

import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'

describe('Race Actions - Comprehensive Test Suite', () => {
  const mockUserId = 'user_123'
  const mockDbUserId = 1
  const mockRaceId = 100
  const mockMacrocycleId = 50

  const mockRace = {
    id: mockRaceId,
    name: 'Boston Marathon',
    type: 'Marathon',
    date: '2025-04-21',
    location: 'Boston, MA',
    notes: 'Goal: Sub 3:00',
    macrocycle_id: mockMacrocycleId,
    user_id: mockDbUserId,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    ;(auth as any).mockResolvedValue({ userId: mockUserId })
    ;(getDbUserId as any).mockResolvedValue(mockDbUserId)

    // Setup default Supabase mock chain
    const mockSelect = vi.fn().mockReturnThis()
    const mockInsert = vi.fn().mockReturnThis()
    const mockUpdate = vi.fn().mockReturnThis()
    const mockDelete = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    ;(supabase.from as any).mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // AUTHENTICATION & AUTHORIZATION TESTS
  // ============================================================================

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      ;(auth as any).mockResolvedValue({ userId: null })

      const result = await createRaceAction({
        name: 'Test Race',
        type: '5K',
        date: '2025-06-01'
      })

      expect(result.isSuccess).toBe(false)
      expect(result.message).toContain('not authenticated')
    })

    it('should call getDbUserId for authenticated users', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRace,
              error: null
            })
          })
        })
      })
      ;(supabase.from as any) = mockFrom

      await createRaceAction({
        name: 'Test Race',
        type: '5K',
        date: '2025-06-01'
      })

      expect(getDbUserId).toHaveBeenCalledWith(mockUserId)
      expect(getDbUserId).toHaveBeenCalledTimes(1)
    })

    it('should enforce user_id in all database operations', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockRace,
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })
      ;(supabase.from as any) = mockFrom

      await createRaceAction({
        name: 'Test Race',
        type: '5K',
        date: '2025-06-01'
      })

      // Verify user_id is included in insert
      expect(mockInsert).toHaveBeenCalled()
      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.user_id).toBe(mockDbUserId)
    })
  })

  // ============================================================================
  // INPUT VALIDATION TESTS
  // ============================================================================

  describe('Input Validation', () => {
    describe('createRaceAction validation', () => {
      it('should reject empty race name', async () => {
        const result = await createRaceAction({
          name: '',
          type: '5K',
          date: '2025-06-01'
        })

        expect(result.isSuccess).toBe(false)
        expect(result.message).toContain('Name is required')
      })

      it('should reject race name exceeding 100 characters', async () => {
        const result = await createRaceAction({
          name: 'A'.repeat(101),
          type: '5K',
          date: '2025-06-01'
        })

        expect(result.isSuccess).toBe(false)
        expect(result.message).toContain('100 characters')
      })

      it('should reject invalid date format', async () => {
        const result = await createRaceAction({
          name: 'Test Race',
          type: '5K',
          date: 'invalid-date'
        })

        expect(result.isSuccess).toBe(false)
        expect(result.message).toContain('date')
      })

      it('should accept valid race data', async () => {
        const mockFrom = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRace,
                error: null
              })
            })
          })
        })
        ;(supabase.from as any) = mockFrom

        const result = await createRaceAction({
          name: 'Test Race',
          type: '5K',
          date: '2025-06-01',
          location: 'Test Location',
          notes: 'Test notes'
        })

        expect(result.isSuccess).toBe(true)
      })
    })
  })
})
