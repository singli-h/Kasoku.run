// Workout feature domain exports
export { ExerciseProvider, useExerciseContext } from './context/exercise-context'
export type { WorkoutExercise, SaveStatus, SaveInfo } from './context/exercise-context'

export { useWorkoutSession } from './hooks/use-workout-session'
export type { SessionStatus } from './hooks/use-workout-session'

export { 
  groupExercises, 
  getExerciseGroupType, 
  getExercisesForGroupType,
  groupContainsSupersets,
  separateGymAndSupersets
} from './utils/exercise-grouping'
export type { ExerciseGroup, ExerciseGroupType } from './utils/exercise-grouping'

// Export page components
export * from './components/pages'

// Export session components
export * from './components/session'

// Export exercise components
export * from './components/exercise'

// Export UI components
export * from './components/ui'

// Export error and loading components
export * from './components/error-loading'

// Export hooks
export { useWorkoutApi } from './hooks/use-workout-api'
export {
  useSessionsToday,
  useSessionsHistory,
  useSessionMutations,
  useWorkoutPrefetch,
  useWorkoutCache
} from './hooks/use-workout-queries'
export {
  useWorkoutMutations,
  useSaveWorkoutSet,
  useUpdateWorkoutSet,
  useStartSession,
  useCompleteSession,
  useUpdateSessionNotes
} from './hooks/useWorkoutMutations'

// Export query config
export { WORKOUT_QUERY_KEYS, CACHE_TIMES, STALE_TIMES } from './config/query-config' 