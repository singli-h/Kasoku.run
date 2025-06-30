"use server"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { completeOnboardingAction } from "@/actions/users/onboarding-actions"

// Zod schema for onboarding data validation
const OnboardingSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["athlete", "coach"], {
    required_error: "Role must be either 'athlete' or 'coach'",
  }),
  birthdate: z.string().optional(),
  timezone: z.string().default("UTC"),
  subscription: z.enum(["free", "paid"]).default("free"),
  
  // Optional athlete-specific data
  athleteData: z.object({
    height: z.number().nullable().optional(),
    weight: z.number().nullable().optional(),
    trainingGoals: z.string().default(""),
    experience: z.string().default(""),
    events: z.array(z.string()).default([]),
  }).optional(),
  
  // Optional coach-specific data
  coachData: z.object({
    speciality: z.string().default(""),
    experience: z.string().default(""),
    philosophy: z.string().default(""),
    sportFocus: z.string().default(""),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate data with Zod
    const validationResult = OnboardingSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors)
      return NextResponse.json(
        { 
          isSuccess: false, 
          message: "Validation failed",
          errors: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Call the server action
    const result = await completeOnboardingAction(validatedData)

    if (result.isSuccess) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    console.error('Error in onboarding API route:', error)
    return NextResponse.json(
      { 
        isSuccess: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 