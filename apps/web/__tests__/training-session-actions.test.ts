/**
 * Tests for training session server actions
 * Tests authentication, authorization, data operations
 */

import {
  getGroupSessionsAction,
  getGroupSessionDataAction,
  updateSessionDetailAction
} from '../actions/sessions/training-session-actions'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}))

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: {
    from: jest.fn()
  }
}))

jest.mock('@/lib/user-cache', () => ({
  getDbUserId: jest.fn()
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockGetDbUserId = getDbUserId as jest.MockedFunction<typeof getDbUserId>
const mockFrom = supabase.from as jest.Mock

describe('Training Session Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default successful auth
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any)
    mockGetDbUserId.mockResolvedValue(456)
  })

  describe('getGroupSessionsAction', () => {
    it('should return error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const result = await getGroupSessionsAction()

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })

    it('should return error when no coach profile found', async () => {
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null })

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      const result = await getGroupSessionsAction()

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('No coach profile found')
    })

    it('should return empty array when no athlete groups found', async () => {
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 789 },
        error: null
      })

      // First call for coach
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      // Second call for athlete_groups
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      } as any)

      const result = await getGroupSessionsAction()

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return sessions for coach athlete groups', async () => {
      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 789 },
        error: null
      })

      // Coach lookup
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      // Athlete groups lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 1 }, { id: 2 }],
          error: null
        })
      } as any)

      // Sessions lookup
      const mockIn = jest.fn().mockReturnThis()
      const mockNot = jest.fn().mockReturnThis()
      const mockOrder = jest.fn().mockResolvedValue({
        data: [
          {
            id: 100,
            date_time: '2024-01-15T10:00:00Z',
            session_status: 'assigned',
            exercise_preset_groups: { name: 'Sprint Session' },
            athlete_groups: { group_name: 'Elite Sprinters', athletes: [{ count: 5 }] }
          }
        ],
        error: null
      })

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        not: mockNot,
        in: mockIn,
        order: mockOrder
      } as any)

      const result = await getGroupSessionsAction()

      expect(result.isSuccess).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toMatchObject({
        id: 100,
        name: 'Sprint Session',
        athleteGroupName: 'Elite Sprinters',
        athleteCount: 5
      })
    })
  })

  describe('getGroupSessionDataAction', () => {
    const sessionId = 100

    it('should return error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const result = await getGroupSessionDataAction(sessionId)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })

    it('should return error when coach does not own session', async () => {
      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup with different coach
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: sessionId,
            athlete_groups: { coach_id: 999 } // Different coach
          },
          error: null
        })
      } as any)

      const result = await getGroupSessionDataAction(sessionId)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Unauthorized: You do not own this athlete group')
    })

    it('should return session data with athletes, exercises, and PBs', async () => {
      const mockSessionData = {
        id: sessionId,
        date_time: '2024-01-15T10:00:00Z',
        session_status: 'ongoing',
        athlete_groups: {
          id: 1,
          coach_id: 789,
          athletes: [
            {
              id: 101,
              user: { id: 1001, first_name: 'John', last_name: 'Doe' }
            }
          ]
        },
        exercise_preset_groups: {
          name: 'Sprint Session',
          exercise_presets: [
            {
              exercise: { id: 201, name: '100m Sprint' },
              exercise_preset_details: [
                { reps: 1, distance: 100, unit: { name: 'm' } },
                { reps: 1, distance: 100, unit: { name: 'm' } }
              ]
            }
          ]
        }
      }

      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSessionData,
          error: null
        })
      } as any)

      // Mock performance data lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      } as any)

      // Mock PBs lookup (has two chained .in() calls)
      const mockInChain = {
        in: jest.fn().mockResolvedValue({
          data: [
            {
              athlete_id: 101,
              exercise_id: 201,
              value: 10.5,
              unit_id: 1,
              achieved_date: '2024-01-01'
            }
          ],
          error: null
        })
      }

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnValue(mockInChain)
      } as any)

      const result = await getGroupSessionDataAction(sessionId)

      expect(result.isSuccess).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.session.id).toBe(sessionId)
      expect(result.data!.athletes).toHaveLength(1)
      expect(result.data!.exercises).toHaveLength(1)
      expect(result.data!.personalBests[101][201]).toMatchObject({
        value: 10.5
      })
    })
  })

  describe('updateSessionDetailAction', () => {
    const sessionId = 100
    const athleteId = 101
    const exerciseId = 201
    const setIndex = 1
    const performingTime = 10.5

    it('should return error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const result = await updateSessionDetailAction(
        sessionId,
        athleteId,
        exerciseId,
        setIndex,
        performingTime
      )

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })

    it('should return error when coach does not own session', async () => {
      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup with different coach
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: sessionId,
            athlete_groups: { coach_id: 999 } // Different coach
          },
          error: null
        })
      } as any)

      const result = await updateSessionDetailAction(
        sessionId,
        athleteId,
        exerciseId,
        setIndex,
        performingTime
      )

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Unauthorized: You do not own this session')
    })

    it('should update existing performance detail', async () => {
      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: sessionId,
            athlete_groups: { coach_id: 789 }
          },
          error: null
        })
      } as any)

      // Mock existing detail lookup
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { id: 5000 },
        error: null
      })

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle
      } as any)

      // Mock update
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      } as any)

      const result = await updateSessionDetailAction(
        sessionId,
        athleteId,
        exerciseId,
        setIndex,
        performingTime
      )

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe('Performance data saved')
    })

    it('should insert new performance detail when none exists', async () => {
      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: sessionId,
            athlete_groups: { coach_id: 789 }
          },
          error: null
        })
      } as any)

      // Mock existing detail lookup - not found
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      } as any)

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      } as any)

      const result = await updateSessionDetailAction(
        sessionId,
        athleteId,
        exerciseId,
        setIndex,
        performingTime
      )

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe('Performance data saved')
    })

    it('should handle null performingTime (clearing a value)', async () => {
      // Mock coach lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 789 },
          error: null
        })
      } as any)

      // Mock session lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: sessionId,
            athlete_groups: { coach_id: 789 }
          },
          error: null
        })
      } as any)

      // Mock existing detail lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 5000 },
          error: null
        })
      } as any)

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis()
      mockFrom.mockReturnValueOnce({
        update: mockUpdate,
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      } as any)

      const result = await updateSessionDetailAction(
        sessionId,
        athleteId,
        exerciseId,
        setIndex,
        null // Clearing value
      )

      expect(result.isSuccess).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          performing_time: null,
          completed: false
        })
      )
    })
  })
})
