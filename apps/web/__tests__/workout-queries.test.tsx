/**
 * Workout Queries Tests
 * Comprehensive tests for workout query hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useSessionsToday, 
  useSessionsHistory, 
  useSessionMutations 
} from '@/components/features/workout/hooks/use-workout-queries'
import { 
  getTodayAndOngoingSessionsAction,
  getPastSessionsAction,
  startTrainingSessionAction,
  completeTrainingSessionAction
} from '@/actions/training/workout-session-actions'

// Mock the actions
jest.mock('@/actions/training/workout-session-actions', () => ({
  getTodayAndOngoingSessionsAction: jest.fn(),
  getPastSessionsAction: jest.fn(),
  startTrainingSessionAction: jest.fn(),
  completeTrainingSessionAction: jest.fn(),
  updateTrainingSessionStatusAction: jest.fn(),
}))

const mockGetTodayAndOngoingSessionsAction = getTodayAndOngoingSessionsAction as jest.MockedFunction<typeof getTodayAndOngoingSessionsAction>
const mockGetPastSessionsAction = getPastSessionsAction as jest.MockedFunction<typeof getPastSessionsAction>
const mockStartTrainingSessionAction = startTrainingSessionAction as jest.MockedFunction<typeof startTrainingSessionAction>
const mockCompleteTrainingSessionAction = completeTrainingSessionAction as jest.MockedFunction<typeof completeTrainingSessionAction>

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Workout Query Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useSessionsToday', () => {
    it('should fetch today sessions successfully', async () => {
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

      mockGetTodayAndOngoingSessionsAction.mockResolvedValue({
        isSuccess: true,
        data: mockSessions,
        message: 'Success'
      })

      const { result } = renderHook(() => useSessionsToday(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockSessions)
      expect(mockGetTodayAndOngoingSessionsAction).toHaveBeenCalledWith(undefined)
    })

    it('should handle fetch error', async () => {
      mockGetTodayAndOngoingSessionsAction.mockResolvedValue({
        isSuccess: false,
        message: 'Failed to fetch sessions'
      })

      const { result } = renderHook(() => useSessionsToday(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should refetch sessions', async () => {
      const mockSessions = []
      mockGetTodayAndOngoingSessionsAction.mockResolvedValue({
        isSuccess: true,
        data: mockSessions,
        message: 'Success'
      })

      const { result } = renderHook(() => useSessionsToday(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Call refetch
      result.current.refetchSessions()

      await waitFor(() => {
        expect(mockGetTodayAndOngoingSessionsAction).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('useSessionsHistory', () => {
    it('should fetch history sessions with pagination', async () => {
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

      const mockHistoryData = {
        sessions: mockSessions,
        totalCount: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }

      mockGetPastSessionsAction.mockResolvedValue({
        isSuccess: true,
        data: mockHistoryData,
        message: 'Success'
      })

      const { result } = renderHook(() => useSessionsHistory({
        page: 1,
        filters: { limit: 10 }
      }), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockHistoryData)
      expect(mockGetPastSessionsAction).toHaveBeenCalledWith(
        undefined,
        1,
        10,
        undefined,
        undefined
      )
    })

    it('should handle date filtering', async () => {
      const mockSessions = []
      const mockHistoryData = {
        sessions: mockSessions,
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }

      mockGetPastSessionsAction.mockResolvedValue({
        isSuccess: true,
        data: mockHistoryData,
        message: 'Success'
      })

      const { result } = renderHook(() => useSessionsHistory({
        page: 1,
        filters: { 
          limit: 10,
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      }), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetPastSessionsAction).toHaveBeenCalledWith(
        undefined,
        1,
        10,
        '2024-01-01',
        '2024-01-31'
      )
    })
  })

  describe('useSessionMutations', () => {
    it('should start session successfully', async () => {
      const mockUpdatedSession = {
        id: 1,
        session_status: 'ongoing',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockStartTrainingSessionAction.mockResolvedValue({
        isSuccess: true,
        data: mockUpdatedSession,
        message: 'Session started'
      })

      const { result } = renderHook(() => useSessionMutations(), {
        wrapper: createWrapper()
      })

      await result.current.startSession.mutateAsync(1)

      expect(mockStartTrainingSessionAction).toHaveBeenCalledWith(1)
    })

    it('should complete session successfully', async () => {
      const mockUpdatedSession = {
        id: 1,
        session_status: 'completed',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockCompleteTrainingSessionAction.mockResolvedValue({
        isSuccess: true,
        data: mockUpdatedSession,
        message: 'Session completed'
      })

      const { result } = renderHook(() => useSessionMutations(), {
        wrapper: createWrapper()
      })

      await result.current.completeSession.mutateAsync(1)

      expect(mockCompleteTrainingSessionAction).toHaveBeenCalledWith(1)
    })

    it('should handle mutation errors', async () => {
      mockStartTrainingSessionAction.mockResolvedValue({
        isSuccess: false,
        message: 'Failed to start session'
      })

      const { result } = renderHook(() => useSessionMutations(), {
        wrapper: createWrapper()
      })

      await expect(result.current.startSession.mutateAsync(1)).rejects.toThrow()
    })
  })
})
