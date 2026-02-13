/**
 * Tests for completeOnboardingAction.
 *
 * The function validates input, generates a unique username, then calls
 * the `complete_onboarding` RPC to atomically create the user and
 * role-specific profile.
 */

import { completeOnboardingAction, OnboardingActionData } from "../onboarding-actions"

// ---------------------------------------------------------------------------
// Supabase chainable mock
//
// We need two mock paths:
//   1. `.from('users').select('id').eq('username', ...).maybeSingle()`
//      for the username uniqueness check inside generateUniqueUsername
//   2. `.rpc('complete_onboarding', params).single()`
//      for the actual onboarding RPC call
//
// The username mock tracks sequential calls so we can test collision
// handling (first call returns existing user, second returns null).
// ---------------------------------------------------------------------------

/** Queued responses for username checks (shifted in order) */
let usernameResponses: Array<{ data: unknown; error: unknown }> = []

/** Response for the RPC call */
let rpcResponse: { data: unknown; error: unknown } = { data: null, error: null }

/** Capture the params passed to rpc() for assertion */
let capturedRpcParams: Record<string, unknown> | null = null

function createFromChain() {
  // Each call to .maybeSingle() shifts the next queued username response
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(() => {
      const response = usernameResponses.shift() ?? { data: null, error: null }
      return Promise.resolve(response)
    }),
  }
  return chain
}

const mockFrom = jest.fn(() => createFromChain())

const mockRpc = jest.fn((fnName: string, params: Record<string, unknown>) => {
  capturedRpcParams = params
  return {
    single: jest.fn(() => Promise.resolve(rpcResponse)),
  }
})

jest.mock("@/lib/supabase-server", () => ({
  __esModule: true,
  default: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function validAthleteData(): OnboardingActionData {
  return {
    clerkId: "clerk_abc123",
    username: "janedoe",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    role: "athlete",
    birthdate: "1995-06-15",
    timezone: "America/New_York",
    subscription: "free",
    athleteData: {
      height: 170,
      weight: 65,
      trainingGoals: "Run a sub-20 5k",
      experience: "intermediate",
      events: ["5k", "10k"],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("completeOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usernameResponses = []
    rpcResponse = { data: null, error: null }
    capturedRpcParams = null
  })

  // -----------------------------------------------------------------------
  // 1. Complete onboarding with valid data
  // -----------------------------------------------------------------------
  it("completes onboarding successfully with valid athlete data", async () => {
    // Username does not exist yet
    usernameResponses = [{ data: null, error: null }]

    // RPC succeeds
    rpcResponse = {
      data: { success: true, created_user_id: 1, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Onboarding completed successfully")
    expect(result).toHaveProperty("data")
    if (result.isSuccess) {
      expect(result.data).toEqual({ userId: "1" })
    }

    // Verify RPC was called with correct params
    expect(mockRpc).toHaveBeenCalledWith("complete_onboarding", expect.objectContaining({
      p_clerk_id: "clerk_abc123",
      p_username: "janedoe",
      p_email: "jane@example.com",
      p_first_name: "Jane",
      p_last_name: "Doe",
      p_role: "athlete",
      p_timezone: "America/New_York",
      p_subscription: "free",
      p_training_goals: "Run a sub-20 5k",
      p_experience: "intermediate",
      p_events: ["5k", "10k"],
    }))
  })

  // -----------------------------------------------------------------------
  // 2. Handle duplicate onboarding attempt
  // -----------------------------------------------------------------------
  it("returns failure when RPC reports user already onboarded", async () => {
    usernameResponses = [{ data: null, error: null }]

    rpcResponse = {
      data: { success: false, created_user_id: null, message: "User already onboarded" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("User already onboarded")
  })

  // -----------------------------------------------------------------------
  // 3. Handle missing required fields (validation)
  // -----------------------------------------------------------------------
  describe("input validation", () => {
    it("rejects empty clerkId", async () => {
      const data = { ...validAthleteData(), clerkId: "" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Clerk ID is required")

      // No supabase calls should occur
      expect(mockFrom).not.toHaveBeenCalled()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects missing email", async () => {
      const data = { ...validAthleteData(), email: "" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Valid email is required")
      expect(mockFrom).not.toHaveBeenCalled()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects email without @ symbol", async () => {
      const data = { ...validAthleteData(), email: "not-an-email" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Valid email is required")
    })

    it("rejects empty firstName", async () => {
      const data = { ...validAthleteData(), firstName: "" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("First name is required")
    })

    it("rejects whitespace-only firstName", async () => {
      const data = { ...validAthleteData(), firstName: "   " }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("First name is required")
    })

    it("rejects empty lastName", async () => {
      const data = { ...validAthleteData(), lastName: "" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Last name is required")
    })

    it("rejects invalid role", async () => {
      const data = { ...validAthleteData(), role: "admin" as OnboardingActionData["role"] }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Invalid role specified")
    })
  })

  // -----------------------------------------------------------------------
  // 4. Handle RPC error
  // -----------------------------------------------------------------------
  it("returns failure when RPC returns an error", async () => {
    usernameResponses = [{ data: null, error: null }]

    rpcResponse = {
      data: null,
      error: { message: "connection refused", code: "PGRST301" },
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("Onboarding failed")
    expect(result.message).toContain("connection refused")
  })

  it("returns failure when RPC returns null result", async () => {
    usernameResponses = [{ data: null, error: null }]

    rpcResponse = {
      data: null,
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("no response from database")
  })

  // -----------------------------------------------------------------------
  // 5. Username collision handling
  // -----------------------------------------------------------------------
  it("appends numeric suffix when username already exists", async () => {
    // First check: username "janedoe" exists
    // Second check: username "janedoe1" is available
    usernameResponses = [
      { data: { id: 1 }, error: null },
      { data: null, error: null },
    ]

    rpcResponse = {
      data: { success: true, created_user_id: 42, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.data).toEqual({ userId: "42" })
    }

    // Verify the RPC was called with the suffixed username
    expect(capturedRpcParams).not.toBeNull()
    expect(capturedRpcParams!.p_username).toBe("janedoe1")

    // Verify two username checks were made
    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(mockFrom).toHaveBeenCalledWith("users")
  })

  it("tries multiple suffixes when several usernames are taken", async () => {
    // "janedoe" taken, "janedoe1" taken, "janedoe2" available
    usernameResponses = [
      { data: { id: 1 }, error: null },
      { data: { id: 2 }, error: null },
      { data: null, error: null },
    ]

    rpcResponse = {
      data: { success: true, created_user_id: 99, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    expect(capturedRpcParams!.p_username).toBe("janedoe2")
    expect(mockFrom).toHaveBeenCalledTimes(3)
  })
})
