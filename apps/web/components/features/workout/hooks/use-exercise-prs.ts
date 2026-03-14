/*
<ai_context>
Hook for fetching and managing exercise PRs during a workout session.
Provides PR data keyed by exercise_id for quick lookup in exercise cards.
Supports optimistic updates when athlete enters a new PR mid-workout.
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getExercisePRsAction, upsertExercisePRAction } from "@/actions/workout/pr-actions"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

/** PR keyed by exercise_id. For exercises with multiple PRs (e.g. sprint distances), keeps the one without distance (gym) or latest. */
export interface ExercisePRMap {
  [exerciseId: number]: PersonalBest
}

interface UseExercisePRsReturn {
  /** Map of exercise_id -> PersonalBest */
  prMap: ExercisePRMap
  /** Whether PRs are loading */
  isLoading: boolean
  /** Save/update a PR. Returns true on success. */
  savePR: (exerciseId: number, value: number, unitId: number, distance?: number | null) => Promise<boolean>
}

/**
 * Hook to fetch and manage PRs for exercises in a workout session.
 * @param exerciseIds - Array of exercise IDs to fetch PRs for
 */
export function useExercisePRs(exerciseIds: number[]): UseExercisePRsReturn {
  const [prMap, setPrMap] = useState<ExercisePRMap>({})
  const [isLoading, setIsLoading] = useState(false)
  // Track which IDs we've already fetched to avoid re-fetching
  const fetchedIdsRef = useRef<string>("")

  useEffect(() => {
    // Deduplicate and filter valid IDs
    const uniqueIds = [...new Set(exerciseIds.filter(id => id > 0))]
    if (uniqueIds.length === 0) return

    // Skip if we already fetched for these exact IDs
    const idsKey = uniqueIds.sort().join(",")
    if (idsKey === fetchedIdsRef.current) return
    fetchedIdsRef.current = idsKey

    setIsLoading(true)

    getExercisePRsAction(uniqueIds).then((result) => {
      if (result.isSuccess && result.data) {
        const map: ExercisePRMap = {}
        for (const pb of result.data) {
          if (pb.exercise_id == null) continue
          const existing = map[pb.exercise_id]
          // For gym PRs (unit_id=3, no distance): keep the one with highest value
          // For sprint PRs (unit_id=5): keep the one without distance or latest
          if (!existing) {
            map[pb.exercise_id] = pb
          } else if (pb.distance == null && existing.distance != null) {
            // Prefer the one without distance (base PR)
            map[pb.exercise_id] = pb
          } else if (pb.distance == null && existing.distance == null && pb.value > existing.value) {
            // Same type, keep higher value (gym)
            map[pb.exercise_id] = pb
          }
        }
        setPrMap(map)
      }
    }).finally(() => {
      setIsLoading(false)
    })
  }, [exerciseIds])

  const savePR = useCallback(async (
    exerciseId: number,
    value: number,
    unitId: number,
    distance?: number | null
  ): Promise<boolean> => {
    const result = await upsertExercisePRAction(exerciseId, value, unitId, distance)
    if (result.isSuccess && result.data) {
      // Optimistic update: immediately reflect in the map
      setPrMap(prev => ({
        ...prev,
        [exerciseId]: result.data,
      }))
      return true
    }
    return false
  }, [])

  return { prMap, isLoading, savePR }
}
