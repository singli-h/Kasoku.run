/*
<ai_context>
Exports the types for the app.
</ai_context>
*/

// Main types export file for GuideLayer AI

// Export all database types
export * from './database'

// Export all API types
export * from './api'

// Export server action types
export * from './server-action-types'

// Export composed component types
export * from './composed'

// Export conversation types
export * from './conversations'

// Export training types
export * from './training'

// Task types removed - using training sessions instead

// Re-export commonly used types for convenience (simplified for running website)
export type {
  // Database entities
  User,
  UserRole,
  
  // API types
  ActionState,
  ApiResponse,
  SessionClaims,
  AuthUser,
  
  // Request/Response types
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersResponse,
  
  // Form data types
  OnboardingFormData,
  ProfileFormData,
  
  // Dashboard types
  DashboardStats,
  
  // Error types
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  
  // Pagination
  PaginationParams,
  PaginatedResponse,
  
  // Webhook types
  ClerkWebhookEvent,
  UserCreatedWebhookData,
  UserUpdatedWebhookData,
  UserDeletedWebhookData
} from './api'

// Re-export training types for convenience
export type {
  // Training Periodization
  Macrocycle,
  MacrocycleInsert,
  MacrocycleUpdate,
  Mesocycle,
  MesocycleInsert,
  MesocycleUpdate,
  Microcycle,
  MicrocycleInsert,
  MicrocycleUpdate,
  
  // Exercise Library
  Exercise,
  ExerciseInsert,
  ExerciseUpdate,
  ExerciseType,
  ExerciseTypeInsert,
  ExerciseTypeUpdate,
  
  // Training Sessions
  ExerciseTrainingSession,
  ExerciseTrainingSessionInsert,
  ExerciseTrainingSessionUpdate,
  ExerciseTrainingDetail,
  ExerciseTrainingDetailInsert,
  ExerciseTrainingDetailUpdate,
  
  // Extended types
  MacrocycleWithDetails,
  MesocycleWithDetails,
  MicrocycleWithDetails,
  ExerciseWithDetails,
  ExerciseTrainingSessionWithDetails,
  
  // Form types
  CreateMacrocycleForm,
  CreateMesocycleForm,
  CreateMicrocycleForm,
  CreateSessionForm,
  CreateExercisePresetForm,
  CreateExercisePresetDetailForm,
  
  // Filter types
  TrainingPlanFilters,
  ExerciseFilters,
  
  // Constants
  TrainingGoal,
  ExperienceLevel,
  SessionMode,
  PlanStatus
} from './training'
