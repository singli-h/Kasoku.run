/**
 * Tests for workout session actions:
 * - updateTrainingSessionStatusAction
 * - startTrainingSessionAction
 * - getWorkoutSessionByIdAction
 */

// ---------------------------------------------------------------------------
// Mock modules (must be declared before imports)
// ---------------------------------------------------------------------------

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}))

jest.mock("@/lib/user-cache", () => ({
  getDbUserId: jest.fn(),
}))

jest.mock("@/lib/auth-utils", () => ({
  verifySessionOwnership: jest.fn(),
  verifyAthleteAccess: jest.fn(),
  logAuthFailure: jest.fn(),
}))

jest.mock("@/actions/athletes/personal-best-actions", () => ({
  processSessionForPBsAction: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Chainable Supabase mock factory
// ---------------------------------------------------------------------------

interface ChainableQuery {
  from: jest.Mock
  select: jest.Mock
  update: jest.Mock
  insert: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  in: jest.Mock
  or: jest.Mock
  single: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  range: jest.Mock
  gte: jest.Mock
  lte: jest.Mock
  maybeSingle: jest.Mock
}

/**
 * Creates a chainable mock that mimics the Supabase PostgREST query builder.
 * Every method returns the same object so calls can be chained in any order.
 * Resolve the final result by setting `_result` on the returned object.
 */
function createChainableQuery(): ChainableQuery {
  const query: any = {}

  const methods = [
    "from",
    "select",
    "update",
    "insert",
    "delete",
    "eq",
    "neq",
    "in",
    "or",
    "single",
    "order",
    "limit",
    "range",
    "gte",
    "lte",
    "maybeSingle",
  ]

  for (const method of methods) {
    query[method] = jest.fn().mockReturnThis()
  }

  return query as ChainableQuery
}

/**
 * Configures a chainable query to resolve with the given data/error
 * when `.single()` (or any terminal method) is awaited.
 */
function resolveQuery(
  query: ChainableQuery,
  result: { data?: any; error?: any; count?: number | null }
) {
  // The query itself is thenable (Promise-like) when awaited.
  // Override `single` to return a resolved promise-like value.
  query.single.mockResolvedValue(result)

  // For queries that don't call `.single()`, make the query itself thenable
  // by adding a `.then` so it can be awaited directly.
  ;(query as any).then = (
    resolve: (v: any) => void,
    reject?: (e: any) => void
  ) => Promise.resolve(result).then(resolve, reject)
}

// Create the mock supabase client. We create fresh chainable queries per test
// via beforeEach, but the module mock needs to exist at declaration time.
const mockSupabase = createChainableQuery()

jest.mock("@/lib/supabase-server", () => ({
  __esModule: true,
  default: mockSupabase,
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import {
  verifySessionOwnership,
  logAuthFailure,
} from "@/lib/auth-utils"
import { processSessionForPBsAction } from "@/actions/athletes/personal-best-actions"
import {
  updateTrainingSessionStatusAction,
  startTrainingSessionAction,
  getWorkoutSessionByIdAction,
} from "../workout-session-actions"

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockGetDbUserId = getDbUserId as jest.MockedFunction<typeof getDbUserId>
const mockVerifySessionOwnership = verifySessionOwnership as jest.MockedFunction<
  typeof verifySessionOwnership
>
const mockLogAuthFailure = logAuthFailure as jest.MockedFunction<
  typeof logAuthFailure
>
const mockProcessSessionForPBs = processSessionForPBsAction as jest.MockedFunction<
  typeof processSessionForPBsAction
>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLERK_USER_ID = "clerk_user_123"
const DB_USER_ID = 42
const SESSION_ID = "session-uuid-abc"

/** Standard authenticated setup: auth() returns userId, getDbUserId resolves */
function setupAuthenticated() {
  mockAuth.mockResolvedValue({ userId: CLERK_USER_ID } as any)
  mockGetDbUserId.mockResolvedValue(DB_USER_ID)
}

/** Setup unauthenticated: auth() returns null userId */
function setupUnauthenticated() {
  mockAuth.mockResolvedValue({ userId: null } as any)
}

/**
 * Reset all chainable methods on the supabase mock so each test starts clean.
 */
function resetSupabaseMock() {
  const methods = [
    "from",
    "select",
    "update",
    "insert",
    "delete",
    "eq",
    "neq",
    "in",
    "or",
    "single",
    "order",
    "limit",
    "range",
    "gte",
    "lte",
    "maybeSingle",
  ]
  for (const method of methods) {
    ;(mockSupabase as any)[method].mockReset().mockReturnThis()
  }
  // Remove any leftover thenable
  delete (mockSupabase as any).then
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  resetSupabaseMock()
  // Suppress console.error/log in tests
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ============================================================================
// updateTrainingSessionStatusAction
// ============================================================================

describe("updateTrainingSessionStatusAction", () => {
  const mockSessionRow = {
    id: SESSION_ID,
    date_time: "2026-02-13T10:00:00Z",
    session_status: "completed",
    notes: null,
    athlete_id: 1,
    session_plan_id: 10,
    created_at: "2026-02-10T08:00:00Z",
    updated_at: "2026-02-13T10:00:00Z",
  }

  it("should complete a session and trigger PB detection", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)
    mockProcessSessionForPBs.mockResolvedValue({
      isSuccess: true,
      message: "2 new PBs detected",
      data: [],
    } as any)

    // Supabase update chain: from().update().eq().select().single()
    mockSupabase.single.mockResolvedValue({
      data: mockSessionRow,
      error: null,
    })

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "completed"
    )

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Session status updated successfully")
    expect(result.data).toEqual(mockSessionRow)

    // Verify supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith("workout_logs")
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ session_status: "completed" })
    )
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", SESSION_ID)

    // processSessionForPBsAction should be called asynchronously
    // Allow microtask queue to flush
    await new Promise((r) => setTimeout(r, 0))
    expect(mockProcessSessionForPBs).toHaveBeenCalledWith(SESSION_ID)
  })

  it("should update status to completed even if session was already completed (no prior status check)", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)
    mockProcessSessionForPBs.mockResolvedValue({
      isSuccess: true,
      message: "No new PBs",
      data: [],
    } as any)

    // The action doesn't check previous status - it just updates
    mockSupabase.single.mockResolvedValue({
      data: { ...mockSessionRow, session_status: "completed" },
      error: null,
    })

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "completed"
    )

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Session status updated successfully")

    await new Promise((r) => setTimeout(r, 0))
    expect(mockProcessSessionForPBs).toHaveBeenCalledWith(SESSION_ID)
  })

  it("should return unauthorized when ownership verification fails", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(false)

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "completed"
    )

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Not authorized to modify this session")

    // logAuthFailure should be called
    expect(mockLogAuthFailure).toHaveBeenCalledWith(
      "updateTrainingSessionStatusAction",
      expect.objectContaining({
        userId: DB_USER_ID,
        resourceType: "workout_log",
        resourceId: SESSION_ID,
      })
    )

    // Supabase update should NOT have been called
    expect(mockSupabase.update).not.toHaveBeenCalled()

    // PB processing should NOT have been triggered
    expect(mockProcessSessionForPBs).not.toHaveBeenCalled()
  })

  it("should not trigger PB detection for non-completed statuses", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)

    mockSupabase.single.mockResolvedValue({
      data: { ...mockSessionRow, session_status: "cancelled" },
      error: null,
    })

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "cancelled"
    )

    expect(result.isSuccess).toBe(true)

    await new Promise((r) => setTimeout(r, 0))
    expect(mockProcessSessionForPBs).not.toHaveBeenCalled()
  })

  it("should return failure when unauthenticated", async () => {
    setupUnauthenticated()

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "completed"
    )

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Authentication required")
  })

  it("should return failure when supabase update errors", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database error", code: "42P01" },
    })

    const result = await updateTrainingSessionStatusAction(
      SESSION_ID,
      "completed"
    )

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Failed to update session status")
  })
})

// ============================================================================
// startTrainingSessionAction
// ============================================================================

describe("startTrainingSessionAction", () => {
  const mockSessionRow = {
    id: SESSION_ID,
    date_time: "2026-02-13T10:00:00Z",
    session_status: "ongoing",
    notes: null,
    athlete_id: 1,
    session_plan_id: 10,
    created_at: "2026-02-10T08:00:00Z",
    updated_at: "2026-02-13T10:00:00Z",
  }

  it("should start a session successfully by setting status to ongoing", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)

    mockSupabase.single.mockResolvedValue({
      data: mockSessionRow,
      error: null,
    })

    const result = await startTrainingSessionAction(SESSION_ID)

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Session started successfully")
    expect(result.data).toEqual(mockSessionRow)

    // Verify the update was called with 'ongoing' status
    expect(mockSupabase.from).toHaveBeenCalledWith("workout_logs")
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ session_status: "ongoing" })
    )
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", SESSION_ID)
  })

  it("should return authentication required when user is not authenticated", async () => {
    setupUnauthenticated()

    const result = await startTrainingSessionAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Authentication required")

    // Nothing else should be called
    expect(mockGetDbUserId).not.toHaveBeenCalled()
    expect(mockVerifySessionOwnership).not.toHaveBeenCalled()
    expect(mockSupabase.update).not.toHaveBeenCalled()
  })

  it("should return unauthorized when ownership verification fails", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(false)

    const result = await startTrainingSessionAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Not authorized to start this session")

    expect(mockLogAuthFailure).toHaveBeenCalledWith(
      "startTrainingSessionAction",
      expect.objectContaining({
        userId: DB_USER_ID,
        resourceType: "workout_log",
        resourceId: SESSION_ID,
      })
    )

    expect(mockSupabase.update).not.toHaveBeenCalled()
  })

  it("should return failure when supabase update errors", async () => {
    setupAuthenticated()
    mockVerifySessionOwnership.mockResolvedValue(true)

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Connection error", code: "PGRST000" },
    })

    const result = await startTrainingSessionAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Failed to start session")
  })
})

// ============================================================================
// getWorkoutSessionByIdAction
// ============================================================================

describe("getWorkoutSessionByIdAction", () => {
  const mockAthleteRow = { id: 1 }

  const mockFullSession = {
    id: SESSION_ID,
    date_time: "2026-02-13T10:00:00Z",
    session_status: "ongoing",
    notes: "Warm-up complete",
    athlete_id: 1,
    session_plan_id: 10,
    session_plan: {
      id: 10,
      name: "Sprint Day",
      description: "Speed work",
      date: "2026-02-13",
      session_plan_exercises: [],
    },
    athlete: {
      id: 1,
      user_id: DB_USER_ID,
      athlete_group_id: 5,
    },
    workout_log_exercises: [
      {
        id: 100,
        exercise_id: 50,
        exercise_order: 1,
        superset_id: null,
        notes: null,
        session_plan_exercise_id: 20,
        exercise: {
          id: 50,
          name: "100m Sprint",
          description: "Full speed sprint",
          video_url: null,
          exercise_type: { id: 1, type: "sprint" },
          unit: { id: 1, name: "seconds" },
        },
        workout_log_sets: [
          {
            id: 200,
            set_index: 0,
            reps: 1,
            weight: null,
            distance: 100,
            performing_time: 11.5,
            rest_time: 180,
            velocity: null,
            power: null,
            height: null,
            effort: null,
            resistance: null,
            tempo: null,
            rpe: 8,
            completed: true,
            metadata: null,
            workout_log_exercise_id: 100,
          },
        ],
      },
    ],
  }

  it("should get a session successfully with all details", async () => {
    setupAuthenticated()

    // The action makes TWO supabase queries:
    // 1. athletes table to get athlete.id
    // 2. workout_logs table to get the session with details
    //
    // Both end with .single(), so we need to handle sequential calls.
    // Since `from` is called twice, we chain the responses.
    let fromCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      fromCallCount++
      return mockSupabase
    })

    let singleCallCount = 0
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++
      if (singleCallCount === 1) {
        // First single() call: athlete lookup
        return Promise.resolve({ data: mockAthleteRow, error: null })
      }
      // Second single() call: session query
      return Promise.resolve({ data: mockFullSession, error: null })
    })

    const result = await getWorkoutSessionByIdAction(SESSION_ID)

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Session retrieved successfully")
    expect(result.data).toBeDefined()

    // Verify both from() calls
    expect(mockSupabase.from).toHaveBeenCalledWith("athletes")
    expect(mockSupabase.from).toHaveBeenCalledWith("workout_logs")

    // Verify the workout_logs query included athlete_id filter
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", SESSION_ID)
    expect(mockSupabase.eq).toHaveBeenCalledWith("athlete_id", mockAthleteRow.id)
  })

  it("should return session not found when query returns PGRST116 error", async () => {
    setupAuthenticated()

    let singleCallCount = 0
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++
      if (singleCallCount === 1) {
        // Athlete lookup succeeds
        return Promise.resolve({ data: mockAthleteRow, error: null })
      }
      // Session query returns not found
      return Promise.resolve({
        data: null,
        error: { message: "No rows returned", code: "PGRST116" },
      })
    })

    const result = await getWorkoutSessionByIdAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Session not found")
  })

  it("should return failure when user is not authenticated", async () => {
    setupUnauthenticated()

    const result = await getWorkoutSessionByIdAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Authentication required")

    expect(mockGetDbUserId).not.toHaveBeenCalled()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it("should return failure when athlete profile is not found", async () => {
    setupAuthenticated()

    // Athlete lookup returns null
    mockSupabase.single.mockResolvedValue({ data: null, error: null })

    const result = await getWorkoutSessionByIdAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Athlete profile not found")
  })

  it("should return failure when supabase returns a non-PGRST116 error", async () => {
    setupAuthenticated()

    let singleCallCount = 0
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++
      if (singleCallCount === 1) {
        return Promise.resolve({ data: mockAthleteRow, error: null })
      }
      return Promise.resolve({
        data: null,
        error: { message: "Internal server error", code: "50000" },
      })
    })

    const result = await getWorkoutSessionByIdAction(SESSION_ID)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Failed to fetch session")
  })
})
