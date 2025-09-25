/**
 * Workout Session Actions Tests
 * Comprehensive tests for workout session server actions
 */

import { 
  getTodayAndOngoingSessionsAction,
  getPastSessionsAction,
  startTrainingSessionAction,
  completeTrainingSessionAction,
  updateTrainingSessionStatusAction
} from '@/actions/training/workout-session-actions'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/user-cache')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockSupabase = supabase as jest.MockedFunction<typeof supabase>
const mockGetDbUserId = getDbUserId as jest.MockedFunction<typeof getDbUserId>

describe('Workout Session Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth to return a user
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    
    // Mock getDbUserId to return a database user ID
    mockGetDbUserId.mockResolvedValue(1)
    
    // Mock Supabase client
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis(),
    }
    
    mockSupabase.mockReturnValue(mockSupabaseClient as any)
  })

  describe('getTodayAndOngoingSessionsAction', () => {
    it('should fetch today and ongoing sessions successfully', async () => {
      const mockSessions = [
        {
          id: 1,
          session_status: 'ongoing',
          date_time: '2024-01-15T10:00:00Z',
          exercise_preset_group: {
            id: 1,
            name: 'Morning Workout',
            description: 'A great morning routine'
          }
        }
      ]

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ data: mockSessions, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await getTodayAndOngoingSessionsAction()

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual(mockSessions)
    })

    it('should handle authentication failure', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await getTodayAndOngoingSessionsAction()

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Authentication required')
    })

    it('should handle database errors', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await getTodayAndOngoingSessionsAction()

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Failed to fetch sessions')
    })
  })

  describe('getPastSessionsAction', () => {
    it('should fetch past sessions with pagination', async () => {
      const mockSessions = [
        {
          id: 1,
          session_status: 'completed',
          date_time: '2024-01-14T10:00:00Z',
          exercise_preset_group: {
            id: 1,
            name: 'Completed Workout',
            description: 'A completed workout'
          }
        }
      ]

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ data: mockSessions, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await getPastSessionsAction(undefined, 1, 10)

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual({
        sessions: mockSessions,
        totalCount: mockSessions.length,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    })

    it('should handle date filtering', async () => {
      const mockSessions = []
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ data: mockSessions, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await getPastSessionsAction(undefined, 1, 10, startDate, endDate)

      expect(result.isSuccess).toBe(true)
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('date_time', startDate)
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('date_time', endDate)
    })
  })

  describe('startTrainingSessionAction', () => {
    it('should start a training session successfully', async () => {
      const sessionId = 1
      const mockUpdatedSession = {
        id: sessionId,
        session_status: 'ongoing',
        updated_at: '2024-01-15T10:00:00Z'
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedSession, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await startTrainingSessionAction(sessionId)

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual(mockUpdatedSession)
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        session_status: 'ongoing',
        updated_at: expect.any(String)
      })
    })

    it('should handle session not found', async () => {
      const sessionId = 999

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Session not found' } })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await startTrainingSessionAction(sessionId)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Session not found')
    })
  })

  describe('completeTrainingSessionAction', () => {
    it('should complete a training session successfully', async () => {
      const sessionId = 1
      const mockUpdatedSession = {
        id: sessionId,
        session_status: 'completed',
        updated_at: '2024-01-15T10:00:00Z'
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedSession, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await completeTrainingSessionAction(sessionId)

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual(mockUpdatedSession)
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        session_status: 'completed',
        updated_at: expect.any(String)
      })
    })
  })

  describe('updateTrainingSessionStatusAction', () => {
    it('should update session status successfully', async () => {
      const sessionId = 1
      const status = 'cancelled'
      const mockUpdatedSession = {
        id: sessionId,
        session_status: status,
        updated_at: '2024-01-15T10:00:00Z'
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedSession, error: null })
      }
      
      mockSupabase.mockReturnValue(mockSupabaseClient as any)

      const result = await updateTrainingSessionStatusAction(sessionId, status)

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual(mockUpdatedSession)
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        session_status: status,
        updated_at: expect.any(String)
      })
    })

    it('should validate session status', async () => {
      const sessionId = 1
      const invalidStatus = 'invalid_status'

      const result = await updateTrainingSessionStatusAction(sessionId, invalidStatus)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('Invalid session status')
    })
  })
})
