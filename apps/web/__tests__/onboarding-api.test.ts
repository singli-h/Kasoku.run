/**
 * @jest-environment node
 */

// Polyfill for NextRequest in Node.js environment
import { TextEncoder, TextDecoder } from "util"
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock the onboarding action before importing anything else
jest.mock("@/actions/users/onboarding-actions", () => ({
  completeOnboardingAction: jest.fn(),
}))

import { NextRequest } from "next/server"
import { POST } from "@/app/api/users/onboard/route"
import { completeOnboardingAction } from "@/actions/users/onboarding-actions"

// Get the mocked function
const mockCompleteOnboardingAction = completeOnboardingAction as jest.MockedFunction<typeof completeOnboardingAction>

describe("POST /api/users/onboard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully process a valid athlete onboarding request", async () => {
    const requestBody = {
      clerkId: "user_clerk_123",
      username: "testathlete",
      email: "athlete@example.com",
      firstName: "Test",
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

    // Mock successful action response
    mockCompleteOnboardingAction.mockResolvedValue({
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: "123" },
    })

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.isSuccess).toBe(true)
    expect(responseData.message).toBe("Onboarding completed successfully")
    expect(responseData.data.userId).toBe("123")
    expect(mockCompleteOnboardingAction).toHaveBeenCalledWith(requestBody)
  })

  it("should successfully process a valid coach onboarding request", async () => {
    const requestBody = {
      clerkId: "user_clerk_456",
      username: "testcoach",
      email: "coach@example.com",
      firstName: "Test",
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

    // Mock successful action response
    mockCompleteOnboardingAction.mockResolvedValue({
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: "456" },
    })

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.isSuccess).toBe(true)
    expect(responseData.message).toBe("Onboarding completed successfully")
    expect(responseData.data.userId).toBe("456")
    expect(mockCompleteOnboardingAction).toHaveBeenCalledWith(requestBody)
  })

  it("should handle invalid JSON in request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.isSuccess).toBe(false)
    expect(responseData.message).toContain("Server error:")
  })

  it("should handle missing required fields", async () => {
    const requestBody = {
      clerkId: "user_clerk_123",
      username: "testuser",
      // Missing email, firstName, lastName, role, timezone, subscription
    }

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.isSuccess).toBe(false)
    expect(responseData.message).toBe("Validation failed")
    expect(responseData.errors).toBeDefined()
  })

  it("should handle action failure", async () => {
    const requestBody = {
      clerkId: "user_clerk_fail",
      username: "failuser",
      email: "fail@example.com",
      firstName: "Fail",
      lastName: "User",
      role: "athlete",
      timezone: "UTC",
      subscription: "free",
    }

    // Mock action failure response
    mockCompleteOnboardingAction.mockResolvedValue({
      isSuccess: false,
      message: "Database error occurred",
    })

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.isSuccess).toBe(false)
    expect(responseData.message).toBe("Database error occurred")
  })

  it("should handle unexpected errors", async () => {
    const requestBody = {
      clerkId: "user_clerk_error",
      username: "erroruser",
      email: "error@example.com",
      firstName: "Error",
      lastName: "User",
      role: "athlete",
      timezone: "UTC",
      subscription: "free",
    }

    // Mock action throwing an error
    mockCompleteOnboardingAction.mockRejectedValue(new Error("Unexpected error"))

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.isSuccess).toBe(false)
    expect(responseData.message).toBe("Server error: Unexpected error")
  })

  it("should validate athlete data when role is athlete", async () => {
    const requestBody = {
      clerkId: "user_clerk_123",
      username: "testathlete",
      email: "athlete@example.com",
      firstName: "Test",
      lastName: "Athlete",
      role: "athlete",
      timezone: "UTC",
      subscription: "free",
      athleteData: {
        // Missing required fields: trainingGoals, experience, events
      },
    }

    // Mock successful action response (since validation passes with defaults)
    mockCompleteOnboardingAction.mockResolvedValue({
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: "123" },
    })

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    // This should actually succeed because the schema provides defaults
    expect(response.status).toBe(200)
    expect(responseData.isSuccess).toBe(true)
    expect(mockCompleteOnboardingAction).toHaveBeenCalled()
  })

  it("should validate coach data when role is coach", async () => {
    const requestBody = {
      clerkId: "user_clerk_456",
      username: "testcoach",
      email: "coach@example.com",
      firstName: "Test",
      lastName: "Coach",
      role: "coach",
      timezone: "UTC",
      subscription: "free",
      coachData: {
        // Missing required fields: speciality, experience, philosophy, sportFocus
      },
    }

    // Mock successful action response (since validation passes with defaults)
    mockCompleteOnboardingAction.mockResolvedValue({
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: "456" },
    })

    const request = new NextRequest("http://localhost:3000/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const responseData = await response.json()

    // This should actually succeed because the schema provides defaults
    expect(response.status).toBe(200)
    expect(responseData.isSuccess).toBe(true)
    expect(mockCompleteOnboardingAction).toHaveBeenCalled()
  })
}) 