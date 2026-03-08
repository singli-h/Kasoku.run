/**
 * Athletes Hooks
 * Re-exports all athlete-related React Query hooks
 *
 * @see docs/patterns/react-query-caching-pattern.md for usage guidelines
 */

// Query hooks
export {
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
} from "./use-athlete-queries"

// Mutation hooks
export {
  useAthleteMutations,
  useGroupMutations,
  useBulkAthleteMutations,
  usePBMutations,
  useCoachMutations,
} from "./use-athlete-queries"

// Utility hooks
export { useAthletePrefetch, useAthleteCache } from "./use-athlete-queries"

// Default export for convenience
export { default as athleteQueries } from "./use-athlete-queries"
