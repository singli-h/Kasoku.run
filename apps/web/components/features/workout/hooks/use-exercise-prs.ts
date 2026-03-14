/*
<ai_context>
Hook for fetching and managing exercise PRs during a workout session.
Stores all PRs per exercise (multiple distances for sprints).
Provides findPR helper for distance-specific lookups.
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getExercisePRsAction, upsertExercisePRAction } from "@/actions/workout/pr-actions"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

/** PRs keyed by exercise_id. Each exercise may have multiple PRs (different distances for sprints). */
export interface ExercisePRMap {
  [exerciseId: number]: PersonalBest[]
}

/**
 * Find the best-matching PR for a given distance.
 * - If distance provided: exact match only (no fallback — different distances are different PRs)
 * - If no distance: null-distance PR first, then first available
 */
export function findPR(prs: PersonalBest[] | undefined, distance?: number | null): PersonalBest | undefined {
  if (!prs || prs.length === 0) return undefined
  if (distance != null) {
    return prs.find(pr => pr.distance === distance)
  }
  return prs.find(pr => pr.distance === null) ?? prs[0]
}

interface UseExercisePRsReturn {
  /** Map of exercise_id -> PersonalBest[] */
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
  const fetchedIdsRef = useRef<string>("")

  useEffect(() => {
    const uniqueIds = [...new Set(exerciseIds.filter(id => id > 0))]
    if (uniqueIds.length === 0) return

    const idsKey = uniqueIds.sort().join(",")
    if (idsKey === fetchedIdsRef.current) return
    fetchedIdsRef.current = idsKey

    setIsLoading(true)

    getExercisePRsAction(uniqueIds).then((result) => {
      if (result.isSuccess && result.data) {
        const map: ExercisePRMap = {}
        for (const pb of result.data) {
          if (pb.exercise_id == null) continue
          if (!map[pb.exercise_id]) {
            map[pb.exercise_id] = []
          }
          map[pb.exercise_id].push(pb)
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
      // Optimistic update: add or replace in the array
      setPrMap(prev => {
        const existing = prev[exerciseId] || []
        const updated = existing.filter(pr =>
          distance != null ? pr.distance !== distance : pr.distance !== null
        )
        updated.push(result.data)
        return { ...prev, [exerciseId]: updated }
      })
      return true
    }
    return false
  }, [])

  return { prMap, isLoading, savePR }
}
