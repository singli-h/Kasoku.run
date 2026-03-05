/**
 * Tests for completeOnboardingAction.
 *
 * The function validates input, generates a unique username, then calls
 * the `complete_onboarding` RPC to atomically create the user and
 * role-specific profile.
 */

import { currentUser } from "@clerk/nextjs/server"
import { completeOnboardingAction, OnboardingActionData } from "../onboarding-actions"

// ---------------------------------------------------------------------------
// Supabase chainable mock
//
// Two mock paths:
//   1. `.from('users').select('username').like('username', pattern)`
//      Batch username uniqueness check — returns array of taken usernames.
//   2. `.from('athlete_groups').select('id').eq('id', n).single()`
//      Group validation — returns { id } if valid, null if not.
//   3. `.rpc('complete_onboarding', params).single()`
//      Atomic onboarding RPC.
// ---------------------------------------------------------------------------

/** Taken usernames returned by the batch LIKE query (empty = none taken) */
let usernameQueryResponse: { data: Array<{ username: string }> | null; error: unknown } = {
  data: [],
  error: null,
}

/** Response for athlete_groups existence check */
let athleteGroupResponse: { data: { id: number } | null; error: unknown } = {
  data: { id: 5 },
  error: null,
}

/** Response for the RPC call */
let rpcResponse: { data: unknown; error: unknown } = { data: null, error: null }

/** Capture the params passed to rpc() for assertion */
let capturedRpcParams: Record<string, unknown> | null = null

function createFromChain(tableName: string) {
  if (tableName === "athlete_groups") {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve(athleteGroupResponse)),
    }
  }
  // Default: users table username query
  return {
    select: jest.fn().mockReturnThis(),
    like: jest.fn(() => Promise.resolve(usernameQueryResponse)),
  }
}

const mockFrom = jest.fn((tableName: string) => createFromChain(tableName))

const mockRpc = jest.fn((fnName: string, params: Record<string, unknown>) => {
  capturedRpcParams = params
  return {
    single: jest.fn(() => Promise.resolve(rpcResponse)),
  }
})

jest.mock("@/lib/supabase-server", () => ({
  __esModule: true,
  default: {
    from: (...args: unknown[]) => mockFrom(...args as [string]),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

// Mock Clerk — default returns a plain user (no invitation metadata)
jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(() =>
    Promise.resolve({
      id: "clerk_abc123",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      publicMetadata: {},
    })
  ),
}))

const mockCurrentUser = currentUser as jest.Mock

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

function validCoachData(): OnboardingActionData {
  return {
    clerkId: "clerk_coach1",
    username: "coachbob",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Smith",
    role: "coach",
    timezone: "America/Chicago",
    subscription: "free",
    coachData: {
      speciality: "Endurance",
      experience: "10 years",
      philosophy: "Progressive overload",
      sportFocus: "Running",
    },
  }
}

function validIndividualData(): OnboardingActionData {
  return {
    clerkId: "clerk_ind1",
    username: "induser",
    email: "ind@example.com",
    firstName: "Sam",
    lastName: "Jones",
    role: "individual",
    timezone: "Europe/London",
    subscription: "free",
    individualData: {
      trainingGoals: "Lose weight",
      experienceLevel: "beginner",
      availableEquipment: ["dumbbells", "resistance_bands"],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("completeOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usernameQueryResponse = { data: [], error: null }
    athleteGroupResponse = { data: { id: 5 }, error: null }
    rpcResponse = { data: null, error: null }
    capturedRpcParams = null
    // Restore default Clerk mock
    mockCurrentUser.mockResolvedValue({
      id: "clerk_abc123",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      publicMetadata: {},
    })
  })

  // -----------------------------------------------------------------------
  // 1. Happy path — athlete role
  // -----------------------------------------------------------------------
  it("completes onboarding successfully with valid athlete data", async () => {
    rpcResponse = {
      data: { success: true, created_user_id: 1, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe("Onboarding completed successfully")
    if (result.isSuccess) {
      expect(result.data).toEqual({ userId: "1" })
    }

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

    // One batch username query, no group check
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledWith("users")
  })

  // -----------------------------------------------------------------------
  // 2. Happy path — coach role
  // -----------------------------------------------------------------------
  it("completes onboarding successfully with valid coach data", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_coach1",
      emailAddresses: [{ emailAddress: "bob@example.com" }],
      publicMetadata: {},
    })

    rpcResponse = {
      data: { success: true, created_user_id: 2, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validCoachData())

    expect(result.isSuccess).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith("complete_onboarding", expect.objectContaining({
      p_role: "coach",
      p_speciality: "Endurance",
      p_experience: "10 years",
      p_philosophy: "Progressive overload",
      p_sport_focus: "Running",
    }))
    // Coach-specific fields should be present, athlete fields should not
    expect(capturedRpcParams).not.toHaveProperty("p_events")
    expect(capturedRpcParams).not.toHaveProperty("p_available_equipment")
  })

  // -----------------------------------------------------------------------
  // 3. Happy path — individual role
  // -----------------------------------------------------------------------
  it("completes onboarding successfully with valid individual data", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_ind1",
      emailAddresses: [{ emailAddress: "ind@example.com" }],
      publicMetadata: {},
    })

    rpcResponse = {
      data: { success: true, created_user_id: 3, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validIndividualData())

    expect(result.isSuccess).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith("complete_onboarding", expect.objectContaining({
      p_role: "individual",
      p_training_goals: "Lose weight",
      p_experience: "beginner",
      p_available_equipment: ["dumbbells", "resistance_bands"],
    }))
    expect(capturedRpcParams).not.toHaveProperty("p_events")
  })

  // -----------------------------------------------------------------------
  // 4. Invited athlete — valid group
  // -----------------------------------------------------------------------
  it("passes p_group_id and forces athlete role for invited athlete with valid group", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_abc123",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      publicMetadata: { groupId: 5, role: "athlete" },
    })
    athleteGroupResponse = { data: { id: 5 }, error: null }

    rpcResponse = {
      data: { success: true, created_user_id: 10, message: "OK" },
      error: null,
    }

    // Submit as "coach" role — invitation should force "athlete"
    const data: OnboardingActionData = {
      ...validAthleteData(),
      role: "coach",
    }

    const result = await completeOnboardingAction(data)

    expect(result.isSuccess).toBe(true)
    expect(capturedRpcParams!.p_role).toBe("athlete")
    expect(capturedRpcParams!.p_group_id).toBe(5)

    // username query + group validation
    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(mockFrom).toHaveBeenCalledWith("athlete_groups")
  })

  // -----------------------------------------------------------------------
  // 5. Invited athlete — invalid group (group doesn't exist)
  // -----------------------------------------------------------------------
  it("ignores groupId when group does not exist in database", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_abc123",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      publicMetadata: { groupId: 999 },
    })
    athleteGroupResponse = { data: null, error: null } // group not found

    rpcResponse = {
      data: { success: true, created_user_id: 11, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    // p_group_id should not be passed (or be undefined/null)
    expect(capturedRpcParams!.p_group_id).toBeUndefined()
  })

  // -----------------------------------------------------------------------
  // 6. Authentication failure
  // -----------------------------------------------------------------------
  it("returns failure when user is not authenticated", async () => {
    mockCurrentUser.mockResolvedValue(null)

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("Not authenticated")
    expect(mockRpc).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // 7. Server email used instead of client-supplied email
  // -----------------------------------------------------------------------
  it("uses server-side Clerk email, not client-supplied email", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_abc123",
      emailAddresses: [{ emailAddress: "server@example.com" }],
      publicMetadata: {},
    })

    rpcResponse = {
      data: { success: true, created_user_id: 1, message: "OK" },
      error: null,
    }

    // Client supplies a different email — server email should win
    const data = { ...validAthleteData(), email: "client-supplied@evil.com" }
    const result = await completeOnboardingAction(data)

    expect(result.isSuccess).toBe(true)
    expect(capturedRpcParams!.p_email).toBe("server@example.com")
    expect(capturedRpcParams!.p_email).not.toBe("client-supplied@evil.com")
  })

  // -----------------------------------------------------------------------
  // 8. Duplicate onboarding attempt
  // -----------------------------------------------------------------------
  it("returns failure when RPC reports user already onboarded", async () => {
    rpcResponse = {
      data: { success: false, created_user_id: null, message: "User already onboarded" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe("User already onboarded")
  })

  // -----------------------------------------------------------------------
  // 9. Input validation
  // -----------------------------------------------------------------------
  describe("input validation", () => {
    it("rejects empty clerkId", async () => {
      const data = { ...validAthleteData(), clerkId: "" }
      const result = await completeOnboardingAction(data)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Clerk ID is required")
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
  // 10. RPC error handling
  // -----------------------------------------------------------------------
  it("returns failure when RPC returns an error", async () => {
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
    rpcResponse = { data: null, error: null }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("no response from database")
  })

  // -----------------------------------------------------------------------
  // 11. Username collision handling
  // -----------------------------------------------------------------------
  it("appends numeric suffix when username already exists", async () => {
    usernameQueryResponse = { data: [{ username: "janedoe" }], error: null }
    rpcResponse = {
      data: { success: true, created_user_id: 42, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.data).toEqual({ userId: "42" })
    }
    expect(capturedRpcParams!.p_username).toBe("janedoe1")
    expect(mockFrom).toHaveBeenCalledTimes(1) // single batch query
    expect(mockFrom).toHaveBeenCalledWith("users")
  })

  it("tries multiple suffixes when several usernames are taken", async () => {
    usernameQueryResponse = {
      data: [{ username: "janedoe" }, { username: "janedoe1" }],
      error: null,
    }
    rpcResponse = {
      data: { success: true, created_user_id: 99, message: "OK" },
      error: null,
    }

    const result = await completeOnboardingAction(validAthleteData())

    expect(result.isSuccess).toBe(true)
    expect(capturedRpcParams!.p_username).toBe("janedoe2")
    expect(mockFrom).toHaveBeenCalledTimes(1) // still one batch query
  })

  // -----------------------------------------------------------------------
  // 12. Username sanitization
  // -----------------------------------------------------------------------
  it("strips special characters from username", async () => {
    rpcResponse = {
      data: { success: true, created_user_id: 5, message: "OK" },
      error: null,
    }

    const data = { ...validAthleteData(), username: "ja@ne.doe_2024!" }
    await completeOnboardingAction(data)

    // Special chars stripped: @ . _ ! removed → "janedoe2024"
    expect(capturedRpcParams!.p_username).toBe("janedoe2024")
  })

  it("pads username shorter than 3 chars to minimum length", async () => {
    rpcResponse = {
      data: { success: true, created_user_id: 6, message: "OK" },
      error: null,
    }

    const data = { ...validAthleteData(), username: "ab" }
    await completeOnboardingAction(data)

    // "ab" padded to "ab0"
    expect(capturedRpcParams!.p_username).toBe("ab0")
  })

  it("truncates username longer than 20 chars", async () => {
    rpcResponse = {
      data: { success: true, created_user_id: 7, message: "OK" },
      error: null,
    }

    const data = { ...validAthleteData(), username: "averylongusernamethatexceeds20chars" }
    await completeOnboardingAction(data)

    const username = capturedRpcParams!.p_username as string
    expect(username.length).toBeLessThanOrEqual(20)
  })
})
