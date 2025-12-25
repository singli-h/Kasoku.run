/**
 * Exercise Search Hook
 *
 * Provides efficient, debounced search for exercise library with React Query caching.
 * Optimized for the exercise picker with server-side pagination.
 */

"use client"

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { searchExercisesAction } from '@/actions/library/exercise-actions'
import type { ExerciseFilters, PaginatedExercises, ExerciseWithDetails } from '@/types/training'

// Query keys for exercise search
export const EXERCISE_QUERY_KEYS = {
  SEARCH: (filters: ExerciseFilters) => ['exercises', 'search', filters] as const,
  ALL: ['exercises'] as const,
}

// Cache configuration - exercises rarely change
const EXERCISE_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 5 minutes - exercises don't change often
  gcTime: 30 * 60 * 1000,    // 30 minutes cache retention
}

interface UseExerciseSearchOptions {
  /** Initial search query */
  initialQuery?: string
  /** Exercise type filter */
  exerciseTypeId?: number
  /** Number of results per page */
  pageSize?: number
  /** Debounce delay in ms */
  debounceMs?: number
  /** Whether the search is enabled (e.g., picker is open) */
  enabled?: boolean
}

interface UseExerciseSearchReturn {
  /** Search query input value */
  searchQuery: string
  /** Update search query */
  setSearchQuery: (query: string) => void
  /** Filtered exercises from search */
  exercises: ExerciseWithDetails[]
  /** Total count of matching exercises */
  totalCount: number
  /** Whether more results are available */
  hasMore: boolean
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Fetch next page */
  fetchNextPage: () => void
  /** Current page number */
  currentPage: number
  /** Reset search to initial state */
  resetSearch: () => void
}

/**
 * Hook for searching exercises with debouncing and pagination
 *
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   exercises,
 *   isLoading
 * } = useExerciseSearch({ enabled: isPickerOpen })
 * ```
 */
export function useExerciseSearch({
  initialQuery = '',
  exerciseTypeId,
  pageSize = 20,
  debounceMs = 300,
  enabled = true,
}: UseExerciseSearchOptions = {}): UseExerciseSearchReturn {
  // Local state for the search input (updates immediately)
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  // Debounced search term for API calls
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)

  // Accumulated exercises for infinite scroll
  const [accumulatedExercises, setAccumulatedExercises] = useState<ExerciseWithDetails[]>([])

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(0) // Reset to first page on new search
      setAccumulatedExercises([]) // Clear accumulated results
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchQuery, debounceMs])

  // Build filters for the query
  const filters: ExerciseFilters = useMemo(() => ({
    search: debouncedQuery || undefined,
    exercise_type_id: exerciseTypeId,
    limit: pageSize,
    offset: currentPage * pageSize,
  }), [debouncedQuery, exerciseTypeId, pageSize, currentPage])

  // Query for exercises
  const { data, isLoading, error, isFetching } = useQuery<PaginatedExercises>({
    queryKey: EXERCISE_QUERY_KEYS.SEARCH(filters),
    queryFn: async () => {
      const result = await searchExercisesAction(filters)

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: EXERCISE_CACHE_CONFIG.staleTime,
    gcTime: EXERCISE_CACHE_CONFIG.gcTime,
    enabled: enabled,
    placeholderData: (previousData) => previousData,
  })

  // Accumulate exercises for infinite scroll
  useEffect(() => {
    if (data?.exercises) {
      if (currentPage === 0) {
        setAccumulatedExercises(data.exercises)
      } else {
        setAccumulatedExercises(prev => [...prev, ...data.exercises])
      }
    }
  }, [data, currentPage])

  // Fetch next page
  const fetchNextPage = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setCurrentPage(prev => prev + 1)
    }
  }, [data?.hasMore, isFetching])

  // Reset search
  const resetSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setCurrentPage(0)
    setAccumulatedExercises([])
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    exercises: accumulatedExercises,
    totalCount: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading: isLoading && currentPage === 0, // Only show loading for initial load
    error: error as Error | null,
    fetchNextPage,
    currentPage,
    resetSearch,
  }
}

/**
 * Hook for getting exercise type options for filter dropdown
 */
export function useExerciseTypes() {
  return useQuery({
    queryKey: ['exerciseTypes'],
    queryFn: async () => {
      // Import dynamically to avoid circular dependencies
      const { getExerciseTypesAction } = await import('@/actions/library/exercise-actions')
      const result = await getExerciseTypesAction()

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      return result.data
    },
    staleTime: 60 * 60 * 1000, // 1 hour - exercise types rarely change
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
