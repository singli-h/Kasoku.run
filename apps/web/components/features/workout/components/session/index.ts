/**
 * Session Components
 * Reusable components for displaying and managing workout sessions
 * 
 * Note: These components have been moved to @/components/composed
 * for better reusability across multiple pages.
 */

// Re-export from composed components for backward compatibility
export { 
  WorkoutSessionCard as SessionCard,
  WorkoutSessionStatusBadge as SessionStatusBadge,
  WorkoutSessionDateDisplay as SessionDateDisplay,
  WorkoutSessionDurationDisplay as SessionDurationDisplay,
  WorkoutSessionExerciseCount as SessionExerciseCount
} from '@/components/composed'

// Export types
export type { SessionStatus } from '@/components/features/workout/hooks/use-workout-session'
