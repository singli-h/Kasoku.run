import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
import { useSupabaseQuery, SupabaseQueryError, getErrorMessage } from '@/hooks/useSupabaseQuery'
import { getCurrentUserAction } from '@/actions/auth/user-actions'
import { createClientSupabaseClient } from '@/lib/supabase-client'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('@/actions/auth/user-actions')
jest.mock('@/lib/supabase-client')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetCurrentUserAction = getCurrentUserAction as jest.MockedFunction<typeof getCurrentUserAction>
const mockCreateClientSupabaseClient = createClientSupabaseClient as jest.MockedFunction<typeof createClientSupabaseClient>

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
}

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockResolvedValue('mock-token'),
      isLoaded: true,
      isSignedIn: true,
      userId: 'mock-clerk-id'
    } as any)
    
    mockCreateClientSupabaseClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('successful queries', () => {
    it('should fetch data successfully with valid user context', async () => {
      // Mock successful user context
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      // Mock successful Supabase query
      const mockFetchFn = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Test Item' }],
        error: null
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([{ id: 1, name: 'Test Item' }])
      expect(mockFetchFn).toHaveBeenCalledWith(mockSupabaseClient, 123)
    })

    it('should use custom user context function when provided', async () => {
      const customUserContextFn = jest.fn().mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 456 }
      })

      const mockFetchFn = jest.fn().mockResolvedValue({
        data: { id: 1, name: 'Test Item' },
        error: null
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn, {
          userContextFn: customUserContextFn
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(customUserContextFn).toHaveBeenCalled()
      expect(mockFetchFn).toHaveBeenCalledWith(mockSupabaseClient, 456)
    })
  })

  describe('authentication failures', () => {
    it('should throw AUTH_FAILED error when user context fails', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: false,
        message: 'User not authenticated'
      })

      const mockFetchFn = jest.fn()

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(SupabaseQueryError)
      expect((result.current.error as SupabaseQueryError).code).toBe('AUTH_FAILED')
      expect(mockFetchFn).not.toHaveBeenCalled()
    })

    it('should throw AUTH_FAILED error when user data is missing', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: null
      })

      const mockFetchFn = jest.fn()

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect((result.current.error as SupabaseQueryError).code).toBe('AUTH_FAILED')
    })
  })

  describe('database errors', () => {
    it('should classify permission errors correctly', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      const mockFetchFn = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'Permission denied' }
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect((result.current.error as SupabaseQueryError).code).toBe('PERMISSION_DENIED')
    })

    it('should classify not found errors correctly', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      const mockFetchFn = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect((result.current.error as SupabaseQueryError).code).toBe('DATABASE_ERROR')
    })

    it('should handle null data by throwing DATABASE_ERROR', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      const mockFetchFn = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect((result.current.error as SupabaseQueryError).code).toBe('DATABASE_ERROR')
    })
  })

  describe('retry logic', () => {
    it('should not retry AUTH_FAILED errors', async () => {
      let callCount = 0
      mockGetCurrentUserAction.mockImplementation(() => {
        callCount++
        return Promise.resolve({
          isSuccess: false,
          message: 'User not authenticated'
        })
      })

      const mockFetchFn = jest.fn()

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should only be called once (no retries for auth failures)
      expect(callCount).toBe(1)
    })

    it('should retry DATABASE_ERROR with exponential backoff', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      let callCount = 0
      const mockFetchFn = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({
            data: null,
            error: { message: 'Network error' }
          })
        }
        return Promise.resolve({
          data: { id: 1, name: 'Success' },
          error: null
        })
      })

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 1, // Fast retry for testing
          },
        },
      })

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn),
        { wrapper: TestWrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(callCount).toBe(3) // Should retry twice before succeeding
    })
  })

  describe('custom options', () => {
    it('should disable retries when enableRetries is false', async () => {
      mockGetCurrentUserAction.mockResolvedValue({
        isSuccess: true,
        message: 'Success',
        data: { id: 123 }
      })

      let callCount = 0
      const mockFetchFn = jest.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({
          data: null,
          error: { message: 'Network error' }
        })
      })

      const { result } = renderHook(
        () => useSupabaseQuery(['test-query'], mockFetchFn, {
          enableRetries: false
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(callCount).toBe(1) // Should not retry
    })
  })
})

describe('SupabaseQueryError', () => {
  it('should create error with correct properties', () => {
    const originalError = new Error('Original error')
    const error = new SupabaseQueryError(
      'Test error',
      'DATABASE_ERROR',
      originalError
    )

    expect(error.name).toBe('SupabaseQueryError')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.originalError).toBe(originalError)
  })
})

describe('getErrorMessage', () => {
  it('should return user-friendly messages for different error codes', () => {
    expect(getErrorMessage(new SupabaseQueryError('', 'AUTH_FAILED')))
      .toBe('Please sign in to continue')
    
    expect(getErrorMessage(new SupabaseQueryError('', 'PERMISSION_DENIED')))
      .toBe('You do not have permission to access this data')
    
    expect(getErrorMessage(new SupabaseQueryError('', 'NETWORK_ERROR')))
      .toBe('Network error. Please check your connection and try again')
    
    expect(getErrorMessage(new SupabaseQueryError('Custom message', 'DATABASE_ERROR')))
      .toBe('Custom message')
  })

  it('should handle non-SupabaseQueryError instances', () => {
    expect(getErrorMessage(new Error('Regular error')))
      .toBe('Regular error')
    
    expect(getErrorMessage('String error'))
      .toBe('An unexpected error occurred')
    
    expect(getErrorMessage(null))
      .toBe('An unexpected error occurred')
  })
}) 