/**
 * Training Feature - Unified Components for Coach Planning & Athlete Execution
 *
 * This module provides shared UI components and types for:
 * - Coach: Session planning (/plans/[id]/session/[sessionId])
 * - Athlete: Workout execution (/workout)
 *
 * @example
 * ```tsx
 * import {
 *   ExerciseCard,
 *   SectionDivider,
 *   ExercisePickerSheet,
 *   SessionCompletionModal,
 *   useTrainingExercises,
 *   useSessionTimer,
 *   type TrainingExercise,
 *   type TrainingSet,
 * } from '@/components/features/training'
 * ```
 */

// Types
export * from './types'

// Components
export * from './components'

// Hooks
export * from './hooks'

// Views
export * from './views'

// Adapters
export * from './adapters'
