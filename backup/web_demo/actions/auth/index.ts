// Export all authentication server actions

// User actions
export {
  getCurrentUserAction,
  getCurrentUserWithMembershipsAction,
  getUserOrganizationsAction,
  getUserRoleInOrganizationAction,
  checkUserExistsAction,
  getUserByClerkIdAction,
  // User management functions (moved from lib/supabase.ts)
  createSupabaseUserAction,
  createSupabaseUserFromWebhookAction,
  updateSupabaseUserFromWebhookAction,
  getSupabaseUser,
  updateSupabaseUserAction,
  getUserMembershipsAction,
  checkUserNeedsOnboardingAction,
  completeOnboardingAction,
  // Debug function
  createCurrentUserAction
} from './user-actions'

// Organization actions
export {
  createOrganizationAction,
  updateOrganizationAction,
  getOrganizationAction,
  createMembershipAction,
  removeMembershipAction,
  assignRoleAction,
  removeRoleAction,
  getRolesAction,
  getRoleByNameAction,
  getOrganizationMembersAction
} from './organization-actions'

// Auth helper actions
export {
  isAuthenticatedAction,
  hasRoleAction,
  isAdminAction,
  canAccessOrgAction,
  getUserHighestRoleAction,
  isSystemAdminAction,
  getOrganizationsWithRoleAction,
  validatePermissionAction
} from './auth-helpers' 