"use client"

import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
// @ts-ignore - Clerk types issue in this environment
import { useAuth } from '@clerk/nextjs'
import { getCurrentUserAction } from '@/actions/auth/user-actions'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Module-level promise deduplication for getCurrentUserAction
let cachedUserPromise: Promise<any> | null = null
let cachedUserPromiseTimestamp = 0
const USER_CACHE_TTL = 30 * 1000 // 30 seconds

/** Clear the module-level user cache (call on sign-out to prevent stale data) */
export function clearUserCache() {
  cachedUserPromise = null
  cachedUserPromiseTimestamp = 0
}

function getUser(userContextFn: () => Promise<any>): Promise<any> {
  const now = Date.now()
  if (!cachedUserPromise || now - cachedUserPromiseTimestamp > USER_CACHE_TTL) {
    cachedUserPromiseTimestamp = now
    cachedUserPromise = userContextFn().catch(err => {
      cachedUserPromise = null // clear on error so next call retries
      throw err
    })
  }
  return cachedUserPromise
}

/**
 * Specific error types for better error handling and UX
 */
export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public code: 'AUTH_FAILED' | 'NETWORK_ERROR' | 'DATABASE_ERROR' | 'PERMISSION_DENIED',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'SupabaseQueryError'
  }
}

/**
 * User context function type for flexibility
 */
export type UserContextFn = () => Promise<{
  isSuccess: boolean
  message: string
  data?: { id: number } | null
}>

/**
 * Custom hook for standardized Supabase data fetching using React Query
 * 
 * Features:
 * - Flexible user context resolution
 * - Proper error classification and handling
 * - Smart retry logic (doesn't retry auth failures)
 * - Type-safe with database schema
 * - Consistent caching strategy
 * 
 * @param key - React Query cache key
 * @param fetchFn - Function that performs the Supabase query
 * @param options - Extended options including custom user context
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error } = useSupabaseQuery(
 *   ['training-plans'],
 *   (supabase, dbUserId) => 
 *     supabase.from('training_plans').select('*').eq('user_id', dbUserId)
 * )
 * ```
 */
export function useSupabaseQuery<T>(
  key: QueryKey,
  fetchFn: (supabase: SupabaseClient<Database>, dbUserId: number) => Promise<{ data: T | null; error: any }>,
  options?: {
    userContextFn?: UserContextFn
    enableRetries?: boolean
    retryDelayMultiplier?: number
  } & Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { getToken } = useAuth()
  
  const {
    userContextFn = getCurrentUserAction,
    enableRetries = true,
    retryDelayMultiplier = 1000,
    ...queryOptions
  } = options || {}
  
  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<T> => {
      try {
        // Create Supabase client for this request
        const supabase = createClientSupabaseClient(getToken)
        
        // Get user context using configurable function (deduplicated)
        const userResult = await getUser(userContextFn)
        
        if (!userResult.isSuccess || !userResult.data?.id) {
          throw new SupabaseQueryError(
            userResult.message || 'User not authenticated or missing ID',
            'AUTH_FAILED'
          )
        }
        
        // Execute the query function
        const { data, error } = await fetchFn(supabase, userResult.data.id)
        
        if (error) {
          // Classify the error for better handling
          let errorCode: SupabaseQueryError['code'] = 'DATABASE_ERROR'
          
          if (error.code === 'PGRST301' || error.message?.includes('permission')) {
            errorCode = 'PERMISSION_DENIED'
          } else if (error.code === 'PGRST116') {
            errorCode = 'DATABASE_ERROR' // Not found
          } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorCode = 'NETWORK_ERROR'
          }
          
          throw new SupabaseQueryError(
            error.message || 'Database query failed',
            errorCode,
            error
          )
        }
        
        // Handle null data case
        if (data === null) {
          throw new SupabaseQueryError(
            'No data found',
            'DATABASE_ERROR'
          )
        }
        
        return data
      } catch (error) {
        // Re-throw SupabaseQueryError as-is
        if (error instanceof SupabaseQueryError) {
          throw error
        }
        
        // Wrap unknown errors
        throw new SupabaseQueryError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          'DATABASE_ERROR',
          error instanceof Error ? error : undefined
        )
      }
    },
    
    // Smart retry logic - don't retry auth failures
    retry: enableRetries ? (failureCount, error) => {
      if (error instanceof SupabaseQueryError && error.code === 'AUTH_FAILED') {
        return false
      }
      return failureCount < 3
    } : false,
    
    // Exponential backoff with configurable multiplier
    retryDelay: (attemptIndex: number) => 
      Math.min(retryDelayMultiplier * 2 ** attemptIndex, 30000),
    
    // Default stale time (data is fresh for 60 seconds)
    staleTime: 60 * 1000,
    
    // Default garbage collection time (5 minutes)
    gcTime: 5 * 60 * 1000,
    
    // Don't refetch on window focus by default (can be overridden)
    refetchOnWindowFocus: false,
    
    // Apply any additional options
    ...queryOptions,
  })
}

/**
 * Utility function to check if an error is a SupabaseQueryError
 */
export function isSupabaseQueryError(error: unknown): error is SupabaseQueryError {
  return error instanceof SupabaseQueryError
}

/**
 * Utility function to get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isSupabaseQueryError(error)) {
    switch (error.code) {
      case 'AUTH_FAILED':
        return 'Please sign in to continue'
      case 'PERMISSION_DENIED':
        return 'You do not have permission to access this data'
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again'
      case 'DATABASE_ERROR':
        return error.message || 'A database error occurred'
      default:
        return error.message
    }
  }
  
  return error instanceof Error ? error.message : 'An unexpected error occurred'
} 