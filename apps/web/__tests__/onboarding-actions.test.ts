// Mock the Supabase client
jest.mock("@/lib/supabase-server", () => {
  const mockSupabaseUpsert = jest.fn()
  const mockSupabaseInsert = jest.fn()
  const mockSupabaseUpdate = jest.fn()
  const mockSupabaseSelect = jest.fn().mockReturnThis()
  const mockSupabaseEq = jest.fn().mockReturnThis()
  const mockSupabaseSingle = jest.fn()

  return {
    from: jest.fn(() => ({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      upsert: mockSupabaseUpsert,
      eq: mockSupabaseEq,
      single: mockSupabaseSingle,
    })),
    __esModule: true,
    default: {
      from: jest.fn(() => ({
        select: mockSupabaseSelect,
        insert: mockSupabaseInsert,
        update: mockSupabaseUpdate,
        upsert: mockSupabaseUpsert,
        eq: mockSupabaseEq,
        single: mockSupabaseSingle,
      })),
    },
  }
})

import {
  completeOnboardingAction,
  OnboardingActionData,
} from "@/actions/users/onboarding-actions"
import supabase from "@/lib/supabase-server"

// Get the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe("Onboarding Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("completeOnboardingAction", () => {
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
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [{ id: 1 }], error: null }),
      })
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        if (table === "athletes") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            insert: mockInsert,
          }
        }
        return {}
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe("Onboarding completed successfully")
      expect(result.data?.userId).toBe("1")
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

      // Mock user upsert success
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [{ id: 2 }], error: null }),
      })
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        if (table === "coaches") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            insert: mockInsert,
          }
        }
        return {}
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe("Onboarding completed successfully")
      expect(result.data?.userId).toBe("2")
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
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: null, error: dbError }),
      })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        return {}
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
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [{ id: 3 }], error: null }),
      })
      const mockInsert = jest.fn().mockResolvedValue({ error: dbError })
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        if (table === "athletes") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            insert: mockInsert,
          }
        }
        return {}
      })

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
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [{ id: 4 }], error: null }),
      })
      const mockInsert = jest.fn().mockResolvedValue({ error: dbError })
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        if (table === "coaches") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            insert: mockInsert,
          }
        }
        return {}
      })

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
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [{ id: 1 }], error: null }),
      })
      const mockUpdate = jest.fn().mockResolvedValue({ error: null })
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 101 }, error: null })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        if (table === "athletes") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(mockUpdate),
            }),
          }
        }
        return {}
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(true)
    })

    it("should handle missing user ID after creation", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_no_id",
        username: "noid",
        email: "noid@example.com",
        firstName: "No",
        lastName: "ID",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
      }

      // Mock user upsert success but no ID returned
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ data: [], error: null }),
      })

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === "users") {
          return { upsert: mockUpsert }
        }
        return {}
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe("Failed to retrieve user ID after creation")
    })

    it("should handle unexpected errors", async () => {
      const testData: OnboardingActionData = {
        clerkId: "user_clerk_error",
        username: "error",
        email: "error@example.com",
        firstName: "Error",
        lastName: "User",
        role: "athlete",
        timezone: "UTC",
        subscription: "free",
      }

      // Mock unexpected error
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error("Unexpected database error")
      })

      const result = await completeOnboardingAction(testData)

      expect(result.isSuccess).toBe(false)
      expect(result.message).toContain("Unexpected error")
    })
  })
}) 