"use server"

import supabase from "@/lib/supabase-server"
import { ActionState } from "@/types"
import { Database } from "@/types/database"

// Type alias for the RPC function arguments
type CompleteOnboardingArgs = Database["public"]["Functions"]["complete_onboarding"]["Args"]

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

/**
 * Complete user onboarding using an atomic database transaction.
 *
 * This function uses the `complete_onboarding` RPC function which:
 * - Creates/updates the user record
 * - Creates the appropriate role-specific profile (athlete, coach, or individual)
 * - All operations happen in a single transaction for data consistency
 *
 * If any step fails, the entire transaction is rolled back.
 */
export async function completeOnboardingAction(
  data: OnboardingActionData
): Promise<ActionState<{ userId: string }>> {
  try {
    console.log('Starting atomic onboarding for:', data.clerkId, 'role:', data.role)

    // Prepare RPC parameters based on role
    // Start with required base params, then add optional role-specific params
    const rpcParams: CompleteOnboardingArgs = {
      p_clerk_id: data.clerkId,
      p_username: data.username,
      p_email: data.email,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_role: data.role,
      p_birthdate: data.birthdate,
      p_timezone: data.timezone,
      p_subscription: data.subscription,
    }

    // Add role-specific parameters (undefined for optional fields that aren't set)
    if (data.role === "athlete" && data.athleteData) {
      rpcParams.p_height = data.athleteData.height ?? undefined
      rpcParams.p_weight = data.athleteData.weight ?? undefined
      rpcParams.p_training_goals = data.athleteData.trainingGoals
      rpcParams.p_experience = data.athleteData.experience
      rpcParams.p_events = data.athleteData.events
    } else if (data.role === "coach" && data.coachData) {
      rpcParams.p_speciality = data.coachData.speciality
      rpcParams.p_experience = data.coachData.experience
      rpcParams.p_philosophy = data.coachData.philosophy
      rpcParams.p_sport_focus = data.coachData.sportFocus
    } else if (data.role === "individual" && data.individualData) {
      rpcParams.p_training_goals = data.individualData.trainingGoals
      rpcParams.p_experience = data.individualData.experienceLevel
      rpcParams.p_available_equipment = data.individualData.availableEquipment
    }

    // Call the atomic onboarding RPC function
    const { data: result, error: rpcError } = await supabase
      .rpc('complete_onboarding', rpcParams)
      .single()

    if (rpcError) {
      console.error('RPC error in onboarding:', rpcError)
      return {
        isSuccess: false,
        message: `Onboarding failed: ${rpcError.message}`
      }
    }

    // Handle RPC result
    if (!result) {
      console.error('No result from onboarding RPC')
      return {
        isSuccess: false,
        message: 'Onboarding failed: no response from database'
      }
    }

    const { success, user_id, message } = result as { success: boolean; user_id: number | null; message: string }

    if (!success || !user_id) {
      console.error('Onboarding RPC returned failure:', message)
      return {
        isSuccess: false,
        message: message || 'Onboarding failed'
      }
    }

    console.log('Onboarding completed successfully for user:', user_id)

    return {
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: user_id.toString() }
    }

  } catch (error: any) {
    console.error('Unexpected error in completeOnboardingAction:', error)
    return {
      isSuccess: false,
      message: `Unexpected error: ${error.message}`
    }
  }
} 