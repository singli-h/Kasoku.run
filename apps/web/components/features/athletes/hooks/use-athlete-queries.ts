"use client"

/**
 * Athletes React Query Hooks
 * TanStack Query hooks for athlete management, groups, and personal bests
 *
 * @see docs/patterns/react-query-caching-pattern.md for usage guidelines
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import {
  ATHLETES_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG,
  INVALIDATION_PATTERNS,
  PREFETCH_STRATEGIES,
} from "../config/query-config"
import {
  getCurrentAthleteProfileAction,
  getAthleteByIdAction,
  getAthletesByGroupAction,
  getCoachAthleteGroupsAction,
  createAthleteGroupAction,
  updateAthleteGroupAction,
  deleteAthleteGroupAction,
  assignAthleteToGroupAction,
  removeAthleteFromGroupAction,
  getRosterWithGroupCountsAction,
  bulkAssignAthletesAction,
  bulkMoveAthletesAction,
  bulkRemoveAthletesAction,
  getAthleteGroupHistoryAction,
  getGroupHistoryAction,
  createOrUpdateAthleteProfileAction,
  updateAthleteProfileAction,
} from "@/actions/athletes/athlete-actions"
import {
  getCurrentCoachProfileAction,
  createOrUpdateCoachProfileAction,
} from "@/actions/athletes/coach-management-actions"
import {
  getAthletePBsAction,
  getMyPersonalBestsAction,
  createPBAction,
  updatePBAction,
  deletePBAction,
} from "@/actions/athletes/personal-best-actions"
import type { Athlete, AthleteGroup, Database } from "@/types/database"

// Types from database schema (not exported from database.ts)
type Coach = Database["public"]["Tables"]["coaches"]["Row"]
type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

// ============================================================================
// ATHLETE QUERIES
// ============================================================================

/**
 * Hook for fetching current athlete profile
 */
export function useCurrentAthlete(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.CURRENT_ATHLETE,
    queryFn: async () => {
      const result = await getCurrentAthleteProfileAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.CURRENT_ATHLETE,
    gcTime: CACHE_TIMES.CURRENT_ATHLETE,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for fetching athlete by ID
 */
export function useAthlete(athleteId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETE(athleteId),
    queryFn: async () => {
      const result = await getAthleteByIdAction(athleteId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.ATHLETE,
    gcTime: CACHE_TIMES.ATHLETE,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled: (options?.enabled ?? true) && athleteId > 0,
  })
}

/**
 * Hook for fetching athletes by group
 */
export function useAthletesByGroup(groupId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETES_BY_GROUP(groupId),
    queryFn: async () => {
      const result = await getAthletesByGroupAction(groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.ATHLETES_BY_GROUP,
    gcTime: CACHE_TIMES.ATHLETES_BY_GROUP,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled: (options?.enabled ?? true) && groupId > 0,
  })
}

// ============================================================================
// GROUP QUERIES
// ============================================================================

/**
 * Hook for fetching coach's athlete groups
 */
export function useAthleteGroups(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.GROUPS,
    queryFn: async () => {
      const result = await getCoachAthleteGroupsAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.GROUPS,
    gcTime: CACHE_TIMES.GROUPS,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for fetching roster with group counts
 */
export function useRoster(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.ROSTER,
    queryFn: async () => {
      const result = await getRosterWithGroupCountsAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.ROSTER,
    gcTime: CACHE_TIMES.ROSTER,
    retry: RETRY_CONFIG.STANDARD.retries,
    retryDelay: RETRY_CONFIG.STANDARD.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// COACH QUERIES
// ============================================================================

/**
 * Hook for fetching current coach profile
 */
export function useCurrentCoach(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.CURRENT_COACH,
    queryFn: async () => {
      const result = await getCurrentCoachProfileAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.CURRENT_COACH,
    gcTime: CACHE_TIMES.CURRENT_COACH,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for fetching current user's coach profile
 * @deprecated Use useCurrentCoach instead — this is an alias for backwards compatibility
 */
export function useCoachProfile(_userId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.CURRENT_COACH,
    queryFn: async () => {
      const result = await getCurrentCoachProfileAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.CURRENT_COACH,
    gcTime: CACHE_TIMES.CURRENT_COACH,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// PERSONAL BEST QUERIES
// ============================================================================

/**
 * Hook for fetching athlete's personal bests
 */
export function useAthletePBs(athleteId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETE_PBS(athleteId),
    queryFn: async () => {
      const result = await getAthletePBsAction(athleteId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.ATHLETE_PBS,
    gcTime: CACHE_TIMES.ATHLETE_PBS,
    retry: RETRY_CONFIG.BACKGROUND.retries,
    retryDelay: RETRY_CONFIG.BACKGROUND.retryDelay,
    enabled: (options?.enabled ?? true) && athleteId > 0,
  })
}

/**
 * Hook for fetching current athlete's personal bests
 */
export function useMyPersonalBests(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.MY_PBS,
    queryFn: async () => {
      const result = await getMyPersonalBestsAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.MY_PBS,
    gcTime: CACHE_TIMES.MY_PBS,
    retry: RETRY_CONFIG.BACKGROUND.retries,
    retryDelay: RETRY_CONFIG.BACKGROUND.retryDelay,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// HISTORY QUERIES
// ============================================================================

/**
 * Hook for fetching athlete's group history
 */
export function useAthleteHistory(athleteId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.ATHLETE_HISTORY(athleteId),
    queryFn: async () => {
      const result = await getAthleteGroupHistoryAction(athleteId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.ATHLETE_HISTORY,
    gcTime: CACHE_TIMES.ATHLETE_HISTORY,
    retry: RETRY_CONFIG.BACKGROUND.retries,
    retryDelay: RETRY_CONFIG.BACKGROUND.retryDelay,
    enabled: (options?.enabled ?? true) && athleteId > 0,
  })
}

/**
 * Hook for fetching group history
 */
export function useGroupHistory(groupId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATHLETES_QUERY_KEYS.GROUP_HISTORY(groupId),
    queryFn: async () => {
      const result = await getGroupHistoryAction(groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.GROUP_HISTORY,
    gcTime: CACHE_TIMES.GROUP_HISTORY,
    retry: RETRY_CONFIG.BACKGROUND.retries,
    retryDelay: RETRY_CONFIG.BACKGROUND.retryDelay,
    enabled: (options?.enabled ?? true) && groupId > 0,
  })
}

// ============================================================================
// ATHLETE MUTATIONS
// ============================================================================

/**
 * Hook for athlete profile mutations
 */
export function useAthleteMutations() {
  const queryClient = useQueryClient()

  const createOrUpdateProfile = useMutation({
    mutationFn: async (input: Parameters<typeof createOrUpdateAthleteProfileAction>[0]) => {
      const result = await createOrUpdateAthleteProfileAction(input)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATHLETES_QUERY_KEYS.CURRENT_ATHLETE })
    },
  })

  const updateProfile = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: number
      updates: Parameters<typeof updateAthleteProfileAction>[1]
    }) => {
      const result = await updateAthleteProfileAction(userId, updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ATHLETES_QUERY_KEYS.ATHLETE(data.id),
        })
      }
      queryClient.invalidateQueries({ queryKey: ATHLETES_QUERY_KEYS.CURRENT_ATHLETE })
    },
  })

  return { createOrUpdateProfile, updateProfile }
}

// ============================================================================
// GROUP MUTATIONS
// ============================================================================

/**
 * Hook for athlete group mutations
 */
export function useGroupMutations() {
  const queryClient = useQueryClient()

  const createGroup = useMutation({
    mutationFn: async (input: Parameters<typeof createAthleteGroupAction>[0]) => {
      const result = await createAthleteGroupAction(input)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate all group-related queries
      INVALIDATION_PATTERNS.ALL_GROUPS().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const updateGroup = useMutation({
    mutationFn: async ({
      groupId,
      updates,
    }: {
      groupId: number
      updates: Parameters<typeof updateAthleteGroupAction>[1]
    }) => {
      const result = await updateAthleteGroupAction(groupId, updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      INVALIDATION_PATTERNS.GROUP(variables.groupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const deleteGroup = useMutation({
    mutationFn: async (groupId: number) => {
      const result = await deleteAthleteGroupAction(groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, groupId) => {
      INVALIDATION_PATTERNS.GROUP(groupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const assignAthlete = useMutation({
    mutationFn: async ({ athleteId, groupId }: { athleteId: number; groupId: number }) => {
      const result = await assignAthleteToGroupAction(athleteId, groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      INVALIDATION_PATTERNS.GROUP(variables.groupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      INVALIDATION_PATTERNS.ATHLETE(variables.athleteId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const removeAthlete = useMutation({
    mutationFn: async (athleteId: number) => {
      const result = await removeAthleteFromGroupAction(athleteId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, athleteId) => {
      // Invalidate all groups and the athlete
      INVALIDATION_PATTERNS.ALL_GROUPS().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      INVALIDATION_PATTERNS.ATHLETE(athleteId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  return { createGroup, updateGroup, deleteGroup, assignAthlete, removeAthlete }
}

// ============================================================================
// BULK MUTATIONS
// ============================================================================

/**
 * Hook for bulk athlete operations
 */
export function useBulkAthleteMutations() {
  const queryClient = useQueryClient()

  const bulkAssign = useMutation({
    mutationFn: async ({
      athleteIds,
      groupId,
    }: {
      athleteIds: number[]
      groupId: number
    }) => {
      const result = await bulkAssignAthletesAction(athleteIds, groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      INVALIDATION_PATTERNS.GROUP(variables.groupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      variables.athleteIds.forEach((athleteId) => {
        INVALIDATION_PATTERNS.ATHLETE(athleteId).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      })
    },
  })

  const bulkMove = useMutation({
    mutationFn: async ({
      athleteIds,
      targetGroupId,
    }: {
      athleteIds: number[]
      targetGroupId: number
    }) => {
      const result = await bulkMoveAthletesAction(athleteIds, targetGroupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // Invalidate target group and all groups to refresh counts
      INVALIDATION_PATTERNS.GROUP(variables.targetGroupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      INVALIDATION_PATTERNS.ALL_GROUPS().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      variables.athleteIds.forEach((athleteId) => {
        INVALIDATION_PATTERNS.ATHLETE(athleteId).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      })
    },
  })

  const bulkRemove = useMutation({
    mutationFn: async (athleteIds: number[]) => {
      const result = await bulkRemoveAthletesAction(athleteIds)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, athleteIds) => {
      // Invalidate all groups to refresh counts
      INVALIDATION_PATTERNS.ALL_GROUPS().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      athleteIds.forEach((athleteId) => {
        INVALIDATION_PATTERNS.ATHLETE(athleteId).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      })
    },
  })

  return { bulkAssign, bulkMove, bulkRemove }
}

// ============================================================================
// PERSONAL BEST MUTATIONS
// ============================================================================

/**
 * Hook for personal best mutations
 */
export function usePBMutations() {
  const queryClient = useQueryClient()

  const createPB = useMutation({
    mutationFn: async (input: Parameters<typeof createPBAction>[0]) => {
      const result = await createPBAction(input)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data) => {
      if (data?.athlete_id) {
        INVALIDATION_PATTERNS.PERSONAL_BESTS(data.athlete_id).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
  })

  const updatePB = useMutation({
    mutationFn: async ({
      pbId,
      updates,
    }: {
      pbId: number
      updates: Parameters<typeof updatePBAction>[1]
    }) => {
      const result = await updatePBAction(pbId, updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data) => {
      if (data?.athlete_id) {
        INVALIDATION_PATTERNS.PERSONAL_BESTS(data.athlete_id).forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
  })

  const deletePB = useMutation({
    mutationFn: async ({ pbId, athleteId }: { pbId: number; athleteId: number }) => {
      const result = await deletePBAction(pbId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return athleteId
    },
    onSuccess: (athleteId) => {
      INVALIDATION_PATTERNS.PERSONAL_BESTS(athleteId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  return { createPB, updatePB, deletePB }
}

// ============================================================================
// COACH MUTATIONS
// ============================================================================

/**
 * Hook for coach profile mutations
 */
export function useCoachMutations() {
  const queryClient = useQueryClient()

  const createOrUpdateProfile = useMutation({
    mutationFn: async (input: Parameters<typeof createOrUpdateCoachProfileAction>[0]) => {
      const result = await createOrUpdateCoachProfileAction(input)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATHLETES_QUERY_KEYS.CURRENT_COACH })
    },
  })

  const updateProfile = useMutation({
    mutationFn: async ({
      updates,
    }: {
      userId?: number // kept for call-site compat, ignored — server resolves identity
      updates: Parameters<typeof createOrUpdateCoachProfileAction>[0]
    }) => {
      const result = await createOrUpdateCoachProfileAction(updates)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATHLETES_QUERY_KEYS.CURRENT_COACH })
    },
  })

  return { createOrUpdateProfile, updateProfile }
}

// ============================================================================
// PREFETCH HOOKS
// ============================================================================

/**
 * Hook for prefetching athlete data
 */
export function useAthletePrefetch() {
  const queryClient = useQueryClient()

  const prefetchAthlete = useCallback(
    (athleteId: number) => {
      queryClient.prefetchQuery({
        ...PREFETCH_STRATEGIES.ATHLETE(athleteId),
        queryFn: async () => {
          const result = await getAthleteByIdAction(athleteId)
          if (!result.isSuccess) throw new Error(result.message)
          return result.data
        },
      })
    },
    [queryClient]
  )

  const prefetchGroup = useCallback(
    (groupId: number) => {
      queryClient.prefetchQuery({
        ...PREFETCH_STRATEGIES.GROUP(groupId),
        queryFn: async () => {
          const result = await getAthletesByGroupAction(groupId)
          if (!result.isSuccess) throw new Error(result.message)
          return result.data
        },
      })
    },
    [queryClient]
  )

  return { prefetchAthlete, prefetchGroup }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Hook for managing athlete cache
 */
export function useAthleteCache() {
  const queryClient = useQueryClient()

  const invalidateAthlete = useCallback(
    (athleteId: number) => {
      INVALIDATION_PATTERNS.ATHLETE(athleteId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
    [queryClient]
  )

  const invalidateGroup = useCallback(
    (groupId: number) => {
      INVALIDATION_PATTERNS.GROUP(groupId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
    [queryClient]
  )

  const invalidateAllGroups = useCallback(() => {
    INVALIDATION_PATTERNS.ALL_GROUPS().forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key })
    })
  }, [queryClient])

  const invalidatePersonalBests = useCallback(
    (athleteId: number) => {
      INVALIDATION_PATTERNS.PERSONAL_BESTS(athleteId).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
    [queryClient]
  )

  const setAthleteData = useCallback(
    (athleteId: number, data: Athlete) => {
      queryClient.setQueryData(ATHLETES_QUERY_KEYS.ATHLETE(athleteId), data)
    },
    [queryClient]
  )

  const setGroupsData = useCallback(
    (data: AthleteGroup[]) => {
      queryClient.setQueryData(ATHLETES_QUERY_KEYS.GROUPS, data)
    },
    [queryClient]
  )

  return {
    invalidateAthlete,
    invalidateGroup,
    invalidateAllGroups,
    invalidatePersonalBests,
    setAthleteData,
    setGroupsData,
  }
}

export default {
  // Queries
  useCurrentAthlete,
  useAthlete,
  useAthletesByGroup,
  useAthleteGroups,
  useRoster,
  useCurrentCoach,
  useCoachProfile,
  useAthletePBs,
  useMyPersonalBests,
  useAthleteHistory,
  useGroupHistory,
  // Mutations
  useAthleteMutations,
  useGroupMutations,
  useBulkAthleteMutations,
  usePBMutations,
  useCoachMutations,
  // Utilities
  useAthletePrefetch,
  useAthleteCache,
}
