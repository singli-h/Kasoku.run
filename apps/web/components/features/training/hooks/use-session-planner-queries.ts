"use client"

/**
 * Session Planner Query Hooks
 * TanStack Query hooks for session planner data (event groups, subgroup filtering).
 */

import { useQuery } from "@tanstack/react-query"
import { getEventGroupsForGroupAction } from "@/actions/athletes/athlete-actions"

/**
 * Hook for fetching distinct event groups for an athlete group.
 * Used to populate subgroup filtering UI in the session planner.
 *
 * @param groupId - The athlete group ID (null/undefined disables the query)
 */
export function useEventGroupsForGroup(groupId: number | null | undefined) {
  return useQuery({
    queryKey: ['event-groups', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('No group ID')
      const result = await getEventGroupsForGroupAction(groupId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: 300_000, // 5 minutes — event groups rarely change
    enabled: !!groupId && groupId > 0,
  })
}
