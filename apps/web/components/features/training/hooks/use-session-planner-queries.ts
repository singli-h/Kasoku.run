"use client"

/**
 * Session Planner Query Hooks
 * TanStack Query hooks for session planner data (subgroups, subgroup filtering).
 */

import { useQuery } from "@tanstack/react-query"
import { getSubgroupsForGroupAction } from "@/actions/athletes/athlete-actions"

/**
 * Hook for fetching distinct subgroups for an athlete group.
 * Used to populate subgroup filtering UI in the session planner.
 *
 * @param groupId - The athlete group ID (null/undefined disables the query)
 */
export function useSubgroupsForGroup(groupId: number | null | undefined) {
  return useQuery({
    queryKey: ['subgroups', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('No group ID')
      const result = await getSubgroupsForGroupAction(groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: 300_000, // 5 minutes — subgroups rarely change
    enabled: !!groupId && groupId > 0,
  })
}
