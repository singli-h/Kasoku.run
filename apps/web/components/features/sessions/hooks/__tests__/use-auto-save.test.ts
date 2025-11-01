/**
 * Tests for useAutoSave hook
 * Tests debouncing, queuing, retry logic, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoSave } from '../use-auto-save'
import { updateSessionDetailAction } from '@/actions/sessions'

// Mock dependencies
jest.mock('@/actions/sessions', () => ({
  updateSessionDetailAction: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}))

// Mock timers
jest.useFakeTimers()

describe('useAutoSave', () => {
  const mockUpdateAction = updateSessionDetailAction as jest.MockedFunction<typeof updateSessionDetailAction>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockUpdateAction.mockResolvedValue({
      isSuccess: true,
      message: 'Saved',
      data: undefined
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe('Basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAutoSave())

      expect(result.current.isSaving).toBe(false)
      expect(result.current.hasPendingUpdates).toBe(false)
      expect(typeof result.current.queueUpdate).toBe('function')
      expect(typeof result.current.saveNow).toBe('function')
    })

    it('should accept custom debounce time', () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 5000 }))

      expect(result.current).toBeDefined()
      // Debounce time is internal, we'll test its effect in debouncing tests
    })
  })

  describe('Queueing updates', () => {
    it('should set hasPendingUpdates to true when update is queued', () => {
      const { result } = renderHook(() => useAutoSave())

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      expect(result.current.hasPendingUpdates).toBe(true)
    })

    it('should deduplicate updates with same key', () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        result.current.queueUpdate(1, 101, 201, 1, 10.8) // Same key, should replace
      })

      // Fast-forward time to trigger save
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      waitFor(() => {
        // Should only call action once with the latest value
        expect(mockUpdateAction).toHaveBeenCalledTimes(1)
        expect(mockUpdateAction).toHaveBeenCalledWith(1, 101, 201, 1, 10.8)
      })
    })

    it('should queue multiple updates for different cells', () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        result.current.queueUpdate(1, 101, 201, 2, 11.0) // Different set
        result.current.queueUpdate(1, 102, 201, 1, 9.8)  // Different athlete
      })

      expect(result.current.hasPendingUpdates).toBe(true)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Debouncing behavior', () => {
    it('should not save immediately when update is queued', () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 2000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      expect(mockUpdateAction).not.toHaveBeenCalled()
    })

    it('should save after debounce delay', async () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 2000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(1)
        expect(mockUpdateAction).toHaveBeenCalledWith(1, 101, 201, 1, 10.5)
      })
    })

    it('should reset debounce timer on new update', async () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 2000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      // Advance halfway
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Add another update - should reset timer
      act(() => {
        result.current.queueUpdate(1, 101, 201, 2, 11.0)
      })

      // Advance 1 second (total 2 seconds from first, 1 from second)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should not have saved yet
      expect(mockUpdateAction).not.toHaveBeenCalled()

      // Advance another second (2 seconds from second update)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled()
      })
    })
  })

  describe('Manual save', () => {
    it('should save immediately when saveNow is called', async () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 5000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      expect(mockUpdateAction).not.toHaveBeenCalled()

      // Trigger manual save
      await act(async () => {
        await result.current.saveNow()
      })

      expect(mockUpdateAction).toHaveBeenCalledTimes(1)
    })

    it('should clear pending updates after successful save', async () => {
      const { result } = renderHook(() => useAutoSave())

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
      })

      expect(result.current.hasPendingUpdates).toBe(true)

      await act(async () => {
        await result.current.saveNow()
      })

      await waitFor(() => {
        expect(result.current.hasPendingUpdates).toBe(false)
      })
    })
  })

  describe('Saving state', () => {
    it('should set isSaving to true during save operation', async () => {
      let resolveSave: (value: any) => void
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve
      })

      mockUpdateAction.mockReturnValue(savePromise as any)

      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
      })

      // Resolve the save
      act(() => {
        resolveSave!({ isSuccess: true, message: 'Saved', data: undefined })
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })
    })
  })

  describe('Error handling and retry', () => {
    it('should retry failed updates', async () => {
      mockUpdateAction.mockResolvedValueOnce({
        isSuccess: false,
        message: 'Failed'
      })

      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(1)
      })

      // Failed update should still be pending
      await waitFor(() => {
        expect(result.current.hasPendingUpdates).toBe(true)
      })
    })

    it('should handle rejected promises', async () => {
      mockUpdateAction.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled()
      })

      // Should re-queue the failed update
      await waitFor(() => {
        expect(result.current.hasPendingUpdates).toBe(true)
      })
    })

    it('should call onSaveError callback on failure', async () => {
      const onSaveError = jest.fn()
      mockUpdateAction.mockResolvedValueOnce({
        isSuccess: false,
        message: 'Failed to save'
      })

      const { result } = renderHook(() => useAutoSave({ onSaveError, debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(onSaveError).toHaveBeenCalled()
      })
    })

    it('should call onSaveSuccess callback on success', async () => {
      const onSaveSuccess = jest.fn()

      const { result } = renderHook(() => useAutoSave({ onSaveSuccess, debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Batch updates', () => {
    it('should send multiple updates in parallel', async () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        result.current.queueUpdate(1, 101, 201, 2, 11.0)
        result.current.queueUpdate(1, 102, 201, 1, 9.8)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(3)
      })
    })

    it('should handle partial failures in batch', async () => {
      mockUpdateAction
        .mockResolvedValueOnce({ isSuccess: true, message: 'Saved', data: undefined })
        .mockResolvedValueOnce({ isSuccess: false, message: 'Failed' })
        .mockResolvedValueOnce({ isSuccess: true, message: 'Saved', data: undefined })

      const { result } = renderHook(() => useAutoSave({ debounceMs: 1000 }))

      act(() => {
        result.current.queueUpdate(1, 101, 201, 1, 10.5)
        result.current.queueUpdate(1, 101, 201, 2, 11.0) // This will fail
        result.current.queueUpdate(1, 102, 201, 1, 9.8)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(3)
      })

      // Only failed update should be pending
      await waitFor(() => {
        expect(result.current.hasPendingUpdates).toBe(true)
      })
    })
  })
})
