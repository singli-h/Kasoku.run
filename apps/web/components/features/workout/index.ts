// Workout feature domain exports
export { ExerciseProvider, useExerciseContext } from './context/exercise-context'
export type { WorkoutExercise } from './context/exercise-context'

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

export { ExerciseDashboard } from './components/exercise-dashboard'
export { ExerciseTypeSection } from './components/exercise-type-section'
export { ExerciseCard } from './components/exercise-card'
export { SupersetContainer } from './components/superset-container'
export { SetRow, SetTable, SetTableHeader, getDisplayColumns, DEFAULT_FIELD_CONFIG } from './components/set-row'
export { VideoPlayer, CompactVideoPlayer, VideoDemoButton } from './components/video-player'
export { useWorkoutApi } from './hooks/use-workout-api' 