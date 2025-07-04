// Mock Clerk's auth before anything else
const mockAuth = jest.fn()
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}))

// Mock the Supabase client
const mockSupabaseUpsert = jest.fn()
const mockSupabaseInsert = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockSupabaseSelect = jest.fn().mockReturnThis()
const mockSupabaseEq = jest.fn().mockReturnThis()
const mockSupabaseSingle = jest.fn()

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSupabaseSelect,
    insert: mockSupabaseInsert,
    update: mockSupabaseUpdate,
    upsert: mockSupabaseUpsert,
    eq: mockSupabaseEq,
    single: mockSupabaseSingle,
  })),
}

jest.mock("@/lib/supabase-server", () => mockSupabaseClient)

import {
  completeOnboardingAction,
  OnboardingActionData,
} from "@/actions/users/onboarding-actions"

describe("Onboarding Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to authenticated user
    mockAuth.mockResolvedValue({ userId: "user_clerk_123" })
  })

  describe("completeOnboardingAction", () => {
    it("should return an error if the user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await completeOnboardingAction({
        clerkId: "test-clerk-id",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
      })

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Not authenticated")
    })

    it("should successfully create a new athlete user", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_123",
        username: "newathlete",
        email: "athlete@example.com",
        firstName: "New",
        lastName: "Athlete",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
        athleteData: {
          trainingGoals: "Run a marathon",
          experience: "Beginner",
          events: ["5k"],
        },
      }

      // Mock user upsert success
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: [{ id: 1 }], error: null }),
      })
      // Mock no existing athlete found
      mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
      // Mock athlete insert success
      mockSupabaseInsert.mockResolvedValue({ error: null })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe("Onboarding completed successfully")
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users")
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("athletes")
      expect(mockSupabaseUpsert).toHaveBeenCalledTimes(1)
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1)
    })

    it("should successfully create a new coach user", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_456",
        username: "newcoach",
        email: "coach@example.com",
        firstName: "New",
        lastName: "Coach",
        role: "coach",
        timezone: "UTC",
        subscription: "free",
        coachData: {
          speciality: "Sprints",
          experience: "5 years",
          philosophy: "Train smart",
          sportFocus: "Track & Field",
        },
      }

      // Mocks
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: [{ id: 2 }], error: null }),
      })
      mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
      mockSupabaseInsert.mockResolvedValue({ error: null })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe("Onboarding completed successfully")
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users")
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("coaches")
      expect(mockSupabaseUpsert).toHaveBeenCalledTimes(1)
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1)
    })

    it("should handle user upsert failure", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_fail",
        username: "failuser",
        email: "fail@example.com",
        firstName: "Fail",
        lastName: "User",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
      }
      const dbError = { message: "DB constraint violation" }

      // Mock user upsert failure
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: null, error: dbError }),
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toContain("Failed to create user")
    })

    it("should handle athlete insert failure", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_athlete_fail",
        username: "athletefail",
        email: "athletefail@example.com",
        firstName: "Athlete",
        lastName: "Fail",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
        athleteData: {
          trainingGoals: "Something",
          experience: "Some",
          events: [],
        },
      }
      const dbError = { message: "Athlete insert error" }

      // Mock user success, athlete insert failure
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: [{ id: 3 }], error: null }),
      })
      mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
      mockSupabaseInsert.mockResolvedValue({ error: dbError })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toContain("Failed to create athlete profile")
    })

    it("should handle coach insert failure", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_coach_fail",
        username: "coachfail",
        email: "coachfail@example.com",
        firstName: "Coach",
        lastName: "Fail",
        role: "coach",
        timezone: "UTC",
        subscription: "free",
        coachData: {
          speciality: "any",
          experience: "any",
          philosophy: "any",
          sportFocus: "any",
        },
      }
      const dbError = { message: "Coach insert error" }

      // Mock user success, coach insert failure
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: [{ id: 4 }], error: null }),
      })
      mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
      mockSupabaseInsert.mockResolvedValue({ error: dbError })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toContain("Failed to create coach profile")
    })

    it("should successfully update an existing athlete user", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_123",
        username: "existingathlete",
        email: "athlete@example.com",
        firstName: "Existing",
        lastName: "Athlete",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
        athleteData: {
          trainingGoals: "Run a faster marathon",
          experience: "Intermediate",
          events: ["10k"],
        },
      }

      // Mock user upsert success
      mockSupabaseUpsert.mockReturnValue({
        select: () => ({ data: [{ id: 1 }], error: null }),
      })
      // Mock existing athlete found
      mockSupabaseSingle.mockResolvedValue({ data: { id: 101 }, error: null })
      // Mock athlete update success
      mockSupabaseUpdate.mockResolvedValue({ error: null })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
      expect(mockSupabaseUpdate).toHaveBeenCalledTimes(1)
      expect(mockSupabaseInsert).not.toHaveBeenCalled()
    })
  })
}) 