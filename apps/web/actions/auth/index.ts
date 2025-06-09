/*
<ai_context>
Auth module exports for the simplified athlete/coach role system
</ai_context>
*/

// Auth helper functions
export {
  isAuthenticatedAction,
  hasRoleAction,
  isAdminAction,
  isCoachAction,
  isAthleteAction,
  getUserRoleAction,
  canAccessAthleteDataAction,
  getUserProfileAction,
  validatePermissionAction
} from './auth-helpers'

// User management functions
export {
  getCurrentUserAction,
  checkUserExistsAction,
  createSupabaseUserAction,
  createSupabaseUserFromWebhookAction,
  updateSupabaseUserAction,
  getUserByClerkIdAction,
  checkUserNeedsOnboardingAction,
  completeOnboardingAction,
  updateSupabaseUserFromWebhookAction,
  createCurrentUserAction
} from './user-actions' 