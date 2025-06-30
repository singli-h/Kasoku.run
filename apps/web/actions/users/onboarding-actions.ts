"use server"

import supabase from "@/lib/supabase-server"
import { ActionState } from "@/types"

export interface OnboardingActionData {
  clerkId: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "athlete" | "coach"
  birthdate?: string
  timezone: string
  subscription: "free" | "paid"
  athleteData?: {
    height?: number | null
    weight?: number | null
    trainingGoals: string
    experience: string
    events: string[]
  }
  coachData?: {
    speciality: string
    experience: string
    philosophy: string
    sportFocus: string
  }
}

export async function completeOnboardingAction(
  data: OnboardingActionData
): Promise<ActionState<{ userId: string }>> {
  try {
    // Using singleton supabase client

    // Start a transaction by creating the user first
    const userFields = {
      clerk_id: data.clerkId,
      username: data.username,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      birthdate: data.birthdate || null,
      subscription_status: data.subscription,
      timezone: data.timezone,
      onboarding_completed: true,
      role: data.role,
      metadata: { role: data.role },
    }

    console.log('Creating/updating user with data:', userFields)

    // Upsert the user record
    const { data: users, error: userError } = await supabase
      .from('users')
      .upsert([userFields], { onConflict: 'clerk_id' })
      .select('id')

    if (userError) {
      console.error('Error upserting user:', userError)
      return { 
        isSuccess: false, 
        message: `Failed to create user: ${userError.message}` 
      }
    }

    const userId = users?.[0]?.id
    if (!userId) {
      return { 
        isSuccess: false, 
        message: 'Failed to retrieve user ID after creation' 
      }
    }

    console.log('User created/updated with ID:', userId)

    // Handle role-specific data
    if (data.role === "athlete" && data.athleteData) {
      // Check if athlete record already exists
      const { data: existingAthlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', userId)
        .single()

      const athleteFields = {
        user_id: userId,
        height: data.athleteData.height ?? null,
        weight: data.athleteData.weight ?? null,
        training_goals: data.athleteData.trainingGoals,
        experience: data.athleteData.experience,
        events: data.athleteData.events,
      }

      if (existingAthlete) {
        // Update existing athlete record
        const { error: athleteError } = await supabase
          .from('athletes')
          .update(athleteFields)
          .eq('user_id', userId)

        if (athleteError) {
          console.error('Error updating athlete:', athleteError)
          return { 
            isSuccess: false, 
            message: `Failed to update athlete profile: ${athleteError.message}` 
          }
        }
      } else {
        // Create new athlete record
        const { error: athleteError } = await supabase
          .from('athletes')
          .insert(athleteFields)

        if (athleteError) {
          console.error('Error creating athlete:', athleteError)
          return { 
            isSuccess: false, 
            message: `Failed to create athlete profile: ${athleteError.message}` 
          }
        }
      }

      console.log('Athlete profile created/updated successfully')
    }

    if (data.role === "coach" && data.coachData) {
      // Check if coach record already exists
      const { data: existingCoach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', userId)
        .single()

      const coachFields = {
        user_id: userId,
        speciality: data.coachData.speciality,
        experience: data.coachData.experience,
        philosophy: data.coachData.philosophy,
        sport_focus: data.coachData.sportFocus,
      }

      if (existingCoach) {
        // Update existing coach record
        const { error: coachError } = await supabase
          .from('coaches')
          .update(coachFields)
          .eq('user_id', userId)

        if (coachError) {
          console.error('Error updating coach:', coachError)
          return { 
            isSuccess: false, 
            message: `Failed to update coach profile: ${coachError.message}` 
          }
        }
      } else {
        // Create new coach record
        const { error: coachError } = await supabase
          .from('coaches')
          .insert(coachFields)

        if (coachError) {
          console.error('Error creating coach:', coachError)
          return { 
            isSuccess: false, 
            message: `Failed to create coach profile: ${coachError.message}` 
          }
        }
      }

      console.log('Coach profile created/updated successfully')
    }

    return {
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: userId.toString() }
    }

  } catch (error: any) {
    console.error('Unexpected error in completeOnboardingAction:', error)
    return { 
      isSuccess: false, 
      message: `Unexpected error: ${error.message}` 
    }
  }
} 