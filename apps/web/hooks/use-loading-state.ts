"use client"

import { useState, useCallback } from 'react'

/**
 * Loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Hook return type
 */
export interface UseLoadingStateReturn {
  state: LoadingState
  isLoading: boolean
  isIdle: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  setLoading: () => void
  setSuccess: () => void
  setError: (error: Error | string) => void
  setIdle: () => void
  reset: () => void
  executeAsync: <T>(
    asyncFn: () => Promise<T>
  ) => Promise<{ success: boolean; data?: T; error?: Error }>
}

/**
 * useLoadingState - Standardized loading state management
 *
 * This hook provides a consistent way to manage loading states across
 * all client components, ensuring uniform UX patterns.
 *
 * @example
 * Basic usage with manual state management:
 * ```tsx
 * function MyComponent() {
 *   const loading = useLoadingState()
 *
 *   async function handleSubmit() {
 *     loading.setLoading()
 *     try {
 *       await saveData()
 *       loading.setSuccess()
 *     } catch (error) {
 *       loading.setError(error)
 *     }
 *   }
 *
 *   return (
 *     <Button onClick={handleSubmit} disabled={loading.isLoading}>
 *       {loading.isLoading && <Spinner />}
 *       Submit
 *     </Button>
 *   )
 * }
 * ```
 *
 * @example
 * Automatic state management with executeAsync:
 * ```tsx
 * function MyComponent() {
 *   const loading = useLoadingState()
 *
 *   async function handleSubmit() {
 *     const result = await loading.executeAsync(async () => {
 *       return await saveData()
 *     })
 *
 *     if (result.success) {
 *       toast.success('Saved!')
 *     }
 *   }
 *
 *   if (loading.isLoading) return <Skeleton />
 *   if (loading.isError) return <Error error={loading.error} />
 *
 *   return <Form onSubmit={handleSubmit} />
 * }
 * ```
 *
 * @example
 * With initial state:
 * ```tsx
 * const loading = useLoadingState('loading')  // Starts in loading state
 * ```
 */
export function useLoadingState(
  initialState: LoadingState = 'idle'
): UseLoadingStateReturn {
  const [state, setState] = useState<LoadingState>(initialState)
  const [error, setErrorState] = useState<Error | null>(null)

  const setLoading = useCallback(() => {
    setState('loading')
    setErrorState(null)
  }, [])

  const setSuccess = useCallback(() => {
    setState('success')
    setErrorState(null)
  }, [])

  const setError = useCallback((err: Error | string) => {
    setState('error')
    setErrorState(err instanceof Error ? err : new Error(err))
  }, [])

  const setIdle = useCallback(() => {
    setState('idle')
    setErrorState(null)
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    setErrorState(null)
  }, [initialState])

  /**
   * Execute an async function with automatic loading state management
   *
   * @param asyncFn - Async function to execute
   * @returns Object with success flag, data, and error
   */
  const executeAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>
    ): Promise<{ success: boolean; data?: T; error?: Error }> => {
      setLoading()

      try {
        const data = await asyncFn()
        setSuccess()
        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        return { success: false, error }
      }
    },
    [setLoading, setSuccess, setError]
  )

  return {
    state,
    isLoading: state === 'loading',
    isIdle: state === 'idle',
    isSuccess: state === 'success',
    isError: state === 'error',
    error,
    setLoading,
    setSuccess,
    setError,
    setIdle,
    reset,
    executeAsync
  }
}

/**
 * useMultipleLoadingStates - Manage multiple independent loading states
 *
 * Useful for forms or pages with multiple async operations that can
 * happen independently.
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const loadingStates = useMultipleLoadingStates({
 *     profile: 'idle',
 *     avatar: 'idle',
 *     settings: 'idle'
 *   })
 *
 *   async function updateProfile() {
 *     await loadingStates.profile.executeAsync(async () => {
 *       return await updateProfileAction(data)
 *     })
 *   }
 *
 *   async function uploadAvatar() {
 *     await loadingStates.avatar.executeAsync(async () => {
 *       return await uploadAvatarAction(file)
 *     })
 *   }
 *
 *   return (
 *     <>
 *       <Button
 *         onClick={updateProfile}
 *         disabled={loadingStates.profile.isLoading}
 *       >
 *         Save Profile
 *       </Button>
 *       <Button
 *         onClick={uploadAvatar}
 *         disabled={loadingStates.avatar.isLoading}
 *       >
 *         Upload Avatar
 *       </Button>
 *     </>
 *   )
 * }
 * ```
 */
export function useMultipleLoadingStates<T extends Record<string, LoadingState>>(
  initialStates: T
): Record<keyof T, UseLoadingStateReturn> {
  const states = {} as Record<keyof T, UseLoadingStateReturn>

  for (const key in initialStates) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    states[key] = useLoadingState(initialStates[key])
  }

  return states
}

/**
 * useButtonLoadingState - Specialized hook for button loading states
 *
 * Provides a simpler API specifically for button loading states.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const [isLoading, withLoading] = useButtonLoadingState()
 *
 *   async function handleClick() {
 *     await withLoading(async () => {
 *       await saveData()
 *     })
 *   }
 *
 *   return (
 *     <Button onClick={handleClick} disabled={isLoading}>
 *       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
 *       Save
 *     </Button>
 *   )
 * }
 * ```
 */
export function useButtonLoadingState(
  initialState: boolean = false
): [
  boolean,
  <T>(fn: () => Promise<T>) => Promise<{ success: boolean; data?: T; error?: Error }>
] {
  const [isLoading, setIsLoading] = useState(initialState)

  const withLoading = useCallback(
    async <T,>(
      fn: () => Promise<T>
    ): Promise<{ success: boolean; data?: T; error?: Error }> => {
      setIsLoading(true)
      try {
        const data = await fn()
        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        return { success: false, error }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return [isLoading, withLoading]
}
