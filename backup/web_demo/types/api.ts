// API response types for GuideLayer AI

import type { 
  User, 
  Organization, 
  Task, 
  Conversation, 
  ChatMessage,
  Membership,
  Role,
  UserRole,
  KBArticle,
  UserWithMemberships,
  TaskWithDetails,
  ConversationWithMessages,
  MembershipWithDetails
} from './database'

// Base API response structure
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Server Action Response type (consistent with ActionState pattern)
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }

// Authentication API types
export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  imageUrl?: string
  hasImage: boolean
  primaryEmailAddressId?: string
  primaryPhoneNumberId?: string
  username?: string
  lastSignInAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface SessionClaims {
  sub: string // Clerk user ID
  email: string
  name?: string
  image?: string
  organizationId?: number // Current organization ID
  organizationRole?: string // User's role in current organization
  organizationSlug?: string // Organization slug/identifier
}

// User management API types
export interface CreateUserRequest {
  clerkId: string
  email: string
  fullName?: string
  avatarUrl?: string
}

export interface UpdateUserRequest {
  email?: string
  fullName?: string
  avatarUrl?: string
}

export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends ApiResponse<User[]> {}
export interface UserWithMembershipsResponse extends ApiResponse<UserWithMemberships> {}

// Organization management API types
export interface CreateOrganizationRequest {
  name: string
  stripeCustomerId?: string
  subscriptionStatus?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  stripeCustomerId?: string
  subscriptionStatus?: string
}

export interface OrganizationResponse extends ApiResponse<Organization> {}
export interface OrganizationsResponse extends ApiResponse<Organization[]> {}

// Membership management API types
export interface CreateMembershipRequest {
  organizationId: number
  userId: number
  roleId?: number
}

export interface MembershipResponse extends ApiResponse<Membership> {}
export interface MembershipsResponse extends ApiResponse<Membership[]> {}
export interface MembershipWithDetailsResponse extends ApiResponse<MembershipWithDetails> {}

// Task management API types
export interface CreateTaskRequest {
  title: string
  description?: string
  status?: string
  payload?: Record<string, any>
  assigneeId?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: string
  payload?: Record<string, any>
  assigneeId?: number
}

export interface TaskResponse extends ApiResponse<Task> {}
export interface TasksResponse extends ApiResponse<Task[]> {}
export interface TaskWithDetailsResponse extends ApiResponse<TaskWithDetails> {}
export interface TasksWithDetailsResponse extends ApiResponse<TaskWithDetails[]> {}

// Conversation and chat API types
export interface CreateConversationRequest {
  taskId: number
}

export interface CreateChatMessageRequest {
  conversationId: number
  content: string
  role?: 'user' | 'assistant'
}

export interface ConversationResponse extends ApiResponse<Conversation> {}
export interface ConversationWithMessagesResponse extends ApiResponse<ConversationWithMessages> {}
export interface ChatMessageResponse extends ApiResponse<ChatMessage> {}
export interface ChatMessagesResponse extends ApiResponse<ChatMessage[]> {}

// Knowledge Base API types
export interface CreateKBArticleRequest {
  title: string
  body: string
}

export interface UpdateKBArticleRequest {
  title?: string
  body?: string
}

export interface SearchKBRequest {
  query: string
  limit?: number
  threshold?: number
}

export interface SearchKBResult {
  article: KBArticle
  similarity: number
  matchedChunks: string[]
}

export interface KBArticleResponse extends ApiResponse<KBArticle> {}
export interface KBArticlesResponse extends ApiResponse<KBArticle[]> {}
export interface SearchKBResponse extends ApiResponse<SearchKBResult[]> {}

// Role and permission API types
export interface AssignRoleRequest {
  membershipId: number
  roleId: number
}

export interface RoleResponse extends ApiResponse<Role> {}
export interface RolesResponse extends ApiResponse<Role[]> {}
export interface UserRoleResponse extends ApiResponse<UserRole> {}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Filtering types
export interface TaskFilters {
  status?: string[]
  assigneeId?: number
  createdBy?: number
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ConversationFilters {
  taskId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR'
  fields: Record<string, string[]>
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR'
}

export interface AuthorizationError extends ApiError {
  code: 'AUTHORIZATION_ERROR'
  requiredRole?: string
  userRole?: string
}

export interface NotFoundError extends ApiError {
  code: 'NOT_FOUND'
  resource: string
  resourceId: string | number
}

// Webhook types
export interface ClerkWebhookEvent {
  type: string
  data: Record<string, any>
  object: 'event'
  timestamp: number
}

export interface UserCreatedWebhookData {
  id: string
  email_addresses: Array<{
    email_address: string
    id: string
    verification: {
      status: string
    }
  }>
  first_name?: string
  last_name?: string
  image_url?: string
  created_at: number
  updated_at: number
}

export interface UserUpdatedWebhookData extends UserCreatedWebhookData {}

export interface UserDeletedWebhookData {
  id: string
  deleted: true
}

// Form data types
export interface OnboardingFormData {
  fullName: string
  organizationPreference?: string
  notifications?: {
    email: boolean
    push: boolean
  }
}

export interface TaskFormData {
  title: string
  description: string
  assigneeId?: number
  status?: string
}

export interface ProfileFormData {
  fullName: string
  email: string
  notifications?: {
    email: boolean
    push: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
}

// Dashboard data types
export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  activeConversations: number
  recentActivity: {
    id: string
    type: 'task_created' | 'task_completed' | 'message_sent' | 'article_created'
    description: string
    timestamp: string
    user?: User
  }[]
}

export interface DashboardResponse extends ApiResponse<DashboardStats> {}

// Real-time updates
export interface RealtimeEvent<T = any> {
  type: string
  payload: T
  timestamp: string
  userId?: string
  organizationId?: number
}

export interface TaskUpdatedEvent extends RealtimeEvent<Task> {
  type: 'task.updated'
}

export interface MessageSentEvent extends RealtimeEvent<ChatMessage> {
  type: 'message.sent'
}

export interface ConversationUpdatedEvent extends RealtimeEvent<Conversation> {
  type: 'conversation.updated'
}

// Export all database types for convenience
export * from './database' 