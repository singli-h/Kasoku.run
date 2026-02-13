/**
 * Tests for deleteMesocycleAction cascade delete.
 *
 * The function deletes a mesocycle and all dependent entities in reverse
 * dependency order: session_plan_sets -> session_plan_exercises ->
 * session_plans -> microcycles -> mesocycles.
 */

import { deleteMesocycleAction } from "../plan-actions"

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}))

const mockGetDbUserId = jest.fn()
jest.mock("@/lib/user-cache", () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId(...args),
}))

const mockRevalidatePath = jest.fn()
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

// ---------------------------------------------------------------------------
// Supabase chainable mock
//
// Each `.from(table)` call records the table name and returns a fresh chain
// whose terminal method (`select`/`delete` without further chaining, or the
// implicit await via the resolved `{ data, error }`) returns a value looked
// up from a pre-configured response map.
//
// The response map is keyed by `"<table>:<operation>"` where operation is
// "select" or "delete". Tests populate the map before each run.
// ---------------------------------------------------------------------------

interface ChainResponse {
  data?: unknown
  error?: { message: string; code?: string } | null
}

/** Map of "table:operation" -> response */
let responseMap: Record<string, ChainResponse> = {}

/** Ordered log of { table, operation } so tests can assert call order */
let callLog: Array<{ table: string; operation: string }> = []

function createChain(table: string) {
  let operation = "select" // default; flipped by .delete()

  const chain: Record<string, unknown> = {}

  const self = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        // Make the chain thenable so `await` resolves it
        const result = resolveChain()
        if (prop === "then") return result.then.bind(result)
        if (prop === "catch") return result.catch.bind(result)
        return result.finally.bind(result)
      }

      // Chainable methods
      return (..._args: unknown[]) => {
        if (prop === "delete") {
          operation = "delete"
        }
        if (prop === "select") {
          operation = "select"
        }
        return self
      }
    },
  })

  function resolveChain(): Promise<ChainResponse> {
    const key = `${table}:${operation}`
    callLog.push({ table, operation })
    const response = responseMap[key] ?? { data: null, error: null }
    return Promise.resolve(response)
  }

  return self
}

const mockSupabase = { from: jest.fn((table: string) => createChain(table)) }

jest.mock("@/lib/supabase-server", () => ({
  __esModule: true,
  default: { from: (table: string) => mockSupabase.from(table) },
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function setDefaultAuth() {
  mockAuth.mockResolvedValue({ userId: "clerk-user-123" })
  mockGetDbUserId.mockResolvedValue(42)
}

/**
 * Populate the response map with a full hierarchy:
 *   microcycles [1, 2]
 *   session_plans ["sp-1", "sp-2"]
 *   session_plan_exercises ["ex-1", "ex-2"]
 * All deletes succeed (error: null).
 */
function setFullHierarchyResponses() {
  responseMap = {
    // Gather phase
    "microcycles:select": { data: [{ id: 1 }, { id: 2 }], error: null },
    "session_plans:select": { data: [{ id: "sp-1" }, { id: "sp-2" }], error: null },
    "session_plan_exercises:select": { data: [{ id: "ex-1" }, { id: "ex-2" }], error: null },

    // Delete phase (reverse order)
    "session_plan_sets:delete": { data: null, error: null },
    "session_plan_exercises:delete": { data: null, error: null },
    "session_plans:delete": { data: null, error: null },
    "microcycles:delete": { data: null, error: null },
    "mesocycles:delete": { data: null, error: null },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deleteMesocycleAction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    responseMap = {}
    callLog = []
  })

  // -----------------------------------------------------------------------
  // 1. Cascade delete full hierarchy
  // -----------------------------------------------------------------------
  it("deletes all dependent entities in correct reverse-dependency order", async () => {
    setDefaultAuth()
    setFullHierarchyResponses()

    const result = await deleteMesocycleAction(99)

    // Verify success
    expect(result.isSuccess).toBe(true)
    expect(result.message).toContain("deleted")

    // Extract the ordered table:operation pairs from the call log.
    // The gather phase comes first (selects), then the delete phase.
    const deleteOps = callLog.filter((c) => c.operation === "delete")

    // Expecting 5 deletes in this exact order:
    //   1. session_plan_sets  (sets first)
    //   2. session_plan_exercises
    //   3. session_plans
    //   4. microcycles
    //   5. mesocycles (the target itself, last)
    expect(deleteOps.map((c) => c.table)).toEqual([
      "session_plan_sets",
      "session_plan_exercises",
      "session_plans",
      "microcycles",
      "mesocycles",
    ])

    // Verify revalidatePath was called on success
    expect(mockRevalidatePath).toHaveBeenCalledWith("/plans", "page")
  })

  // -----------------------------------------------------------------------
  // 2. Non-existent mesocycle (no children)
  // -----------------------------------------------------------------------
  it("deletes only the mesocycle when there are no children", async () => {
    setDefaultAuth()

    responseMap = {
      // No microcycles found
      "microcycles:select": { data: [], error: null },
      // Only the mesocycle delete itself should be called
      "mesocycles:delete": { data: null, error: null },
    }

    const result = await deleteMesocycleAction(999)

    expect(result.isSuccess).toBe(true)

    // Only the microcycles select (gather) and the final mesocycle delete
    // should appear. No cascade deletes for child tables.
    const deleteOps = callLog.filter((c) => c.operation === "delete")
    expect(deleteOps).toHaveLength(1)
    expect(deleteOps[0].table).toBe("mesocycles")

    expect(mockRevalidatePath).toHaveBeenCalledWith("/plans", "page")
  })

  // -----------------------------------------------------------------------
  // 3. Unauthenticated user
  // -----------------------------------------------------------------------
  it("returns failure when user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await deleteMesocycleAction(1)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("User not authenticated")

    // No Supabase calls should have been made
    expect(mockSupabase.from).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // 4. Mesocycle delete fails
  // -----------------------------------------------------------------------
  it("returns failure when the final mesocycle delete errors", async () => {
    setDefaultAuth()

    responseMap = {
      // Gather phase succeeds with children
      "microcycles:select": { data: [{ id: 1 }], error: null },
      "session_plans:select": { data: [{ id: "sp-1" }], error: null },
      "session_plan_exercises:select": { data: [{ id: "ex-1" }], error: null },

      // Cascade deletes succeed
      "session_plan_sets:delete": { data: null, error: null },
      "session_plan_exercises:delete": { data: null, error: null },
      "session_plans:delete": { data: null, error: null },
      "microcycles:delete": { data: null, error: null },

      // But the mesocycle delete itself fails
      "mesocycles:delete": {
        data: null,
        error: { message: "permission denied for table mesocycles" },
      },
    }

    const result = await deleteMesocycleAction(99)

    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("Failed to delete mesocycle")
    expect(result.message).toContain("permission denied")

    // revalidatePath should NOT be called on failure
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
