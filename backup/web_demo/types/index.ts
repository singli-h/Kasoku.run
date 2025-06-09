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

// Export task list types
export * from './tasks'

// Re-export commonly used types for convenience
export type {
  // Database entities
  User,
  Organization,
  Task,
  Conversation,
  ChatMessage,
  Membership,
  Role,
  UserRole,
  KBArticle,
  
  // Composite types
  UserWithMemberships,
  TaskWithDetails,
  ConversationWithMessages,
  MembershipWithDetails,
  
  // API types
  ActionState,
  ApiResponse,
  SessionClaims,
  AuthUser,
  
  // Request/Response types
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  TasksResponse,
  
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersResponse,
  
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationResponse,
  OrganizationsResponse,
  
  // Form data types
  OnboardingFormData,
  TaskFormData,
  ProfileFormData,
  
  // Dashboard types
  DashboardStats,
  DashboardResponse,
  
  // Error types
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  
  // Enum types
  RoleName,
  TaskStatus,
  ChatMessageRole,
  EntityType,
  
  // Pagination and filtering
  PaginationParams,
  PaginatedResponse,
  TaskFilters,
  ConversationFilters,
  
  // Webhook types
  ClerkWebhookEvent,
  UserCreatedWebhookData,
  UserUpdatedWebhookData,
  UserDeletedWebhookData,
  
  // Real-time types
  RealtimeEvent,
  TaskUpdatedEvent,
  MessageSentEvent,
  ConversationUpdatedEvent,
  
  // Knowledge Base types
  CreateKBArticleRequest,
  UpdateKBArticleRequest,
  SearchKBRequest,
  SearchKBResult,
  KBArticleResponse,
  SearchKBResponse
} from './api'
