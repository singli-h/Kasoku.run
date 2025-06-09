// API response types for Kasoku running website
// Simplified for athlete/coach management system

import type { 
  User, 
  UserRole
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
  role?: UserRole // User's role (athlete/coach/admin)
}

// User management API types
export interface CreateUserRequest {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role?: UserRole
}

export interface UpdateUserRequest {
  email?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role?: UserRole
}

export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends ApiResponse<User[]> {}

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

// Clerk webhook types
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

// Onboarding types
export interface OnboardingFormData {
  firstName: string
  lastName: string
  role?: UserRole
}

// Profile types
export interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
}

// Dashboard types (simplified for running website)
export interface DashboardStats {
  totalAthletes?: number
  totalCoaches?: number
  recentActivity: {
    id: string
    type: 'user_created' | 'profile_updated' | 'role_assigned'
    description: string
    timestamp: string
    user?: User
  }[]
}

// Export all database types for convenience
export * from './database' 