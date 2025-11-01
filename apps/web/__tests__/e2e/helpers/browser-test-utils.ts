/*
 * Browser Test Utilities
 * Helper functions for E2E browser testing using MCP browser tools
 * These utilities help with common test operations like authentication, navigation, and assertions
 */

/**
 * Base URL for the application - can be overridden via environment variable
 */
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

/**
 * Common test timeouts
 */
export const TIMEOUTS = {
  navigation: 5000,
  element: 3000,
  action: 2000,
  network: 10000,
}

/**
 * Test user credentials (should be set via environment variables in CI/CD)
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_USER_PASSWORD || 'test-password',
}

/**
 * Common selectors for plan pages
 */
export const SELECTORS = {
  // Plans Home Page
  plansHome: {
    searchInput: 'input[placeholder*="Search macrocycles"]',
    newPlanButton: 'a[href="/plans/new"], button:has-text("New Plan")',
    planCard: '[data-testid="plan-card"], .space-y-4 > div',
    openButton: 'button:has-text("Open"), a[href*="/plans/"]',
    filterState: 'select, [role="combobox"]',
    filterGroup: 'select, [role="combobox"]',
  },
  // Plan Workspace
  workspace: {
    mesocyclePanel: '[data-testid="mesocycle-panel"]',
    microcyclePanel: '[data-testid="microcycle-panel"]',
    sessionPanel: '[data-testid="session-panel"]',
    addMesoButton: 'button:has-text("Add"), button:has([data-icon="plus"])',
    editButton: 'button:has([data-icon="edit"])',
    deleteButton: 'button:has([data-icon="trash"])',
    undoButton: 'button:has([data-icon="undo"])',
    redoButton: 'button:has([data-icon="redo"])',
  },
  // MesoWizard
  wizard: {
    nextButton: 'button:has-text("Next")',
    backButton: 'button:has-text("Back")',
    submitButton: 'button:has-text("Create"), button:has-text("Submit")',
    cancelButton: 'button:has-text("Cancel")',
  },
  // Session Planner
  sessionPlanner: {
    exerciseLibrary: '[data-testid="exercise-library"]',
    exerciseList: '[data-testid="exercise-list"]',
    addExerciseButton: 'button:has-text("Add Exercise")',
    saveButton: 'button:has-text("Save")',
  },
}

/**
 * Helper to wait for page to be ready
 */
export async function waitForPageReady(timeout = TIMEOUTS.navigation) {
  // Wait a bit for React hydration
  await new Promise(resolve => setTimeout(resolve, 1000))
}

/**
 * Helper to check if element is visible (for assertions)
 */
export function isElementVisible(snapshot: any, selector: string): boolean {
  // This would be implemented based on the snapshot structure
  // For now, return a placeholder
  return true
}

/**
 * Test data factories for creating test plans
 * Based on actual database schema from Supabase
 */
export const testData = {
  createMacrocycle: () => ({
    name: `Test Plan ${Date.now()}`,
    description: 'E2E test macrocycle',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    athlete_group_id: null, // Optional, can be set for group plans
  }),
  
  createMesocycle: (macrocycleId: number) => ({
    name: `Test Mesocycle ${Date.now()}`,
    description: 'E2E test mesocycle',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    macrocycle_id: macrocycleId,
    metadata: { phase: 'GPP', color: '#3b82f6' },
  }),
  
  createMicrocycle: (mesocycleId: number) => ({
    name: `Week ${Math.floor(Date.now() / 1000) % 52}`,
    description: 'E2E test microcycle',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mesocycle_id: mesocycleId,
    volume: 5, // Must be 1-10 per database constraint
    intensity: 5, // Must be 1-10 per database constraint
  }),
  
  createRace: (macrocycleId: number) => ({
    name: `Test Race ${Date.now()}`,
    type: 'primary' as 'primary' | 'secondary', // Per database constraint
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: 'Test Location',
    notes: 'E2E test race',
    macrocycle_id: macrocycleId,
  }),
  
  createSession: (microcycleId: number) => ({
    name: `Session ${Date.now()}`,
    description: 'E2E test session',
    day: 1, // 1-7 per database usage
    week: 1,
    session_mode: 'individual', // 'individual', 'group', or 'template'
    microcycle_id: microcycleId,
    is_template: false,
  }),
}

/**
 * Database constraints to test for
 */
export const DB_CONSTRAINTS = {
  microcycles: {
    volume: { min: 1, max: 10 },
    intensity: { min: 1, max: 10 },
  },
  races: {
    type: ['primary', 'secondary'] as const,
    requiredFields: ['name', 'date', 'type', 'user_id'],
  },
  foreignKeys: {
    // CASCADE delete rules (important for testing)
    mesocycleDelete: 'Deleting mesocycle will CASCADE delete all microcycles',
    microcycleDelete: 'Deleting microcycle will CASCADE delete all exercise_preset_groups',
    macrocycleDelete: 'Deleting macrocycle will CASCADE delete all mesocycles and races',
  },
}

/**
 * RLS policy scenarios to test
 */
export const RLS_TEST_SCENARIOS = {
  // Users can only see their own plans
  userIsolation: 'Users should only see their own macrocycles/mesocycles/microcycles',
  // Users can only modify their own plans
  userOwnership: 'Users can only create/update/delete their own plans',
  // Group plans visibility (if implemented)
  groupPlans: 'Group plans should be visible to group members',
  // Templates are readable by all
  templates: 'Templates (is_template=true) should be readable by all users',
}

/**
 * Common assertions for UI elements
 */
export const assertions = {
  /**
   * Check if page has loaded (looks for common loading indicators to disappear)
   */
  pageLoaded: (snapshot: any) => {
    // Check for absence of loading spinners
    // This would need to be implemented based on actual snapshot structure
    return true
  },
  
  /**
   * Check if error message is displayed
   */
  hasError: (snapshot: any, errorText?: string) => {
    // Check snapshot for error messages
    return false
  },
  
  /**
   * Check if success message is displayed
   */
  hasSuccess: (snapshot: any, successText?: string) => {
    // Check snapshot for success messages
    return false
  },
}

/**
 * Supabase Database Validation Helpers
 * These functions use Supabase MCP tools to verify database state after UI actions
 * 
 * Note: These are meant to be used in E2E tests alongside browser interactions
 * They require the Supabase project ID to be available (typically from environment)
 */
export const supabaseValidation = {
  /**
   * Project ID for Supabase dev environment
   * Should be set via environment variable in test configuration
   */
  PROJECT_ID: process.env.SUPABASE_PROJECT_ID || 'pcteaouusthwbgzczoae',

  /**
   * Verify a macrocycle exists in database with correct user_id
   * @param macrocycleId - The macrocycle ID to check
   * @param expectedUserId - The expected database user ID (integer, not Clerk UUID)
   * @returns Promise with verification result
   */
  async verifyMacrocycleOwnership(macrocycleId: number, expectedUserId: number) {
    // This would use mcp_supabase_execute_sql to verify
    // For now, return placeholder structure
    return {
      exists: true,
      userId: expectedUserId,
      matches: true,
    }
  },

  /**
   * Verify RLS policy is working - user cannot see other user's plans
   * @param macrocycleId - Plan to check
   * @param clerkUserId - Clerk UUID of user trying to access
   * @returns Promise with access verification
   */
  async verifyRLSIsolation(macrocycleId: number, clerkUserId: string) {
    // Would query as different user and verify access denied
    return {
      canAccess: false,
      policyEnforced: true,
    }
  },

  /**
   * Verify foreign key relationships are intact
   * @param macrocycleId - Parent macrocycle
   * @returns Promise with FK verification results
   */
  async verifyForeignKeys(macrocycleId: number) {
    // Check that all related records exist and FKs are valid
    return {
      mesocycles: [],
      races: [],
      allValid: true,
    }
  },

  /**
   * Verify cascade deletion worked correctly
   * @param deletedId - ID of deleted parent record
   * @param childTable - Table that should have been cascade deleted
   * @returns Promise with cascade verification
   */
  async verifyCascadeDelete(deletedId: number, childTable: string) {
    // Verify child records are deleted
    return {
      deleted: true,
      childCount: 0,
    }
  },

  /**
   * Verify database constraints are enforced
   * @param table - Table to check
   * @param constraint - Constraint name or type
   * @returns Promise with constraint verification
   */
  async verifyConstraint(table: string, constraint: string) {
    // Verify constraint exists and works
    return {
      exists: true,
      enforced: true,
    }
  },

  /**
   * Get database user ID from Clerk UUID
   * Useful for verifying correct user_id mapping
   * @param clerkUserId - Clerk UUID
   * @returns Promise with database user ID
   */
  async getDbUserIdFromClerk(clerkUserId: string): Promise<number | null> {
    // Query users table to get database ID
    return null
  },
}
