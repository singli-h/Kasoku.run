"use server"

import supabase from "@/lib/supabase-server"
import { ActionState } from "@/types"

export interface OnboardingActionData {
  clerkId: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "athlete" | "coach" | "individual"
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
  individualData?: {
    trainingGoals: string
    experienceLevel: string
    availableEquipment: string[]
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

      // Check if athlete record already exists (Coaches also need an athlete profile)
      const { data: existingAthlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingAthlete) {
        console.log(`Creating default athlete record for coach ${userId}`)
        const { error: athleteError } = await supabase
          .from('athletes')
          .insert({ user_id: userId })

        if (athleteError) {
          console.error('Error creating default athlete profile for coach:', athleteError)
          // Don't fail the whole onboarding if this fails, but log it
        }
      }
    }

    // Handle individual role - create silent athlete record for workout logging FK
    if (data.role === "individual" && data.individualData) {
      // Check if athlete record already exists
      const { data: existingAthlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingAthlete) {
        console.log(`Creating silent athlete record for individual ${userId}`)
        const { error: athleteError } = await supabase
          .from('athletes')
          .insert({
            user_id: userId,
            training_goals: data.individualData.trainingGoals,
            experience: data.individualData.experienceLevel,
            // Store available equipment in a metadata field or training_goals
            // Note: athlete table doesn't have availableEquipment column, store in training_goals
          })

        if (athleteError) {
          console.error('Error creating athlete profile for individual:', athleteError)
          // Don't fail the whole onboarding - silent record is optional but recommended
        } else {
          console.log('Silent athlete record created for individual user')
        }
      } else {
        // Update existing athlete record with individual data
        const { error: athleteError } = await supabase
          .from('athletes')
          .update({
            training_goals: data.individualData.trainingGoals,
            experience: data.individualData.experienceLevel,
          })
          .eq('user_id', userId)

        if (athleteError) {
          console.error('Error updating athlete profile for individual:', athleteError)
        } else {
          console.log('Athlete record updated for individual user')
        }
      }
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