/**
 * Error and Loading Components
 * Components for handling errors and loading states in workout features
 */

// WorkoutErrorBoundary removed - use FeatureErrorBoundary from @/components/error-boundary instead
// useWorkoutErrorHandler removed - use react-error-boundary hooks directly if needed
export { 
  LoadingSpinner, 
  WorkoutLoadingCard, 
  SessionLoadingSkeleton, 
  WorkoutActionLoading, 
  WorkoutPageLoading 
} from './workout-loading-states'
