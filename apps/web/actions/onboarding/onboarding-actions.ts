"use server"

import { currentUser } from "@clerk/nextjs/server"
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
 * Generate a unique username by checking if it exists and adding a suffix if needed.
 */
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  // Sanitize the username: lowercase, remove special chars, limit length
  let username = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20)

  // Ensure minimum length
  if (username.length < 3) {
    username = username.padEnd(3, '0')
  }

  // Check if username exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!existingUser) {
    return username
  }

  // Username exists, try adding numeric suffix
  for (let i = 1; i <= 999; i++) {
    const candidateUsername = `${username.slice(0, 17)}${i}`
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', candidateUsername)
      .maybeSingle()

    if (!existing) {
      return candidateUsername
    }
  }

  // Fallback: use timestamp
  return `${username.slice(0, 10)}${Date.now().toString(36)}`
}

/**
 * Validate onboarding input data.
 */
function validateOnboardingData(data: OnboardingActionData): { valid: boolean; error?: string } {
  if (!data.clerkId || data.clerkId.trim().length === 0) {
    return { valid: false, error: 'Clerk ID is required' }
  }
  if (!data.email || !data.email.includes('@')) {
    return { valid: false, error: 'Valid email is required' }
  }
  if (!data.firstName || data.firstName.trim().length === 0) {
    return { valid: false, error: 'First name is required' }
  }
  if (!data.lastName || data.lastName.trim().length === 0) {
    return { valid: false, error: 'Last name is required' }
  }
  if (!['athlete', 'coach', 'individual'].includes(data.role)) {
    return { valid: false, error: 'Invalid role specified' }
  }
  return { valid: true }
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

    // Validate input data
    const validation = validateOnboardingData(data)
    if (!validation.valid) {
      console.error('Validation failed:', validation.error)
      return {
        isSuccess: false,
        message: validation.error || 'Validation failed'
      }
    }

    // Generate unique username to avoid conflicts
    const uniqueUsername = await generateUniqueUsername(data.username)
    console.log('Generated unique username:', uniqueUsername, 'from base:', data.username)

    // Read Clerk publicMetadata for invitation context (tamper-proof, set server-side)
    const clerkUser = await currentUser()
    const meta = clerkUser?.publicMetadata as { groupId?: number; coachId?: number; role?: string } | undefined
    let invitedGroupId: number | null = meta?.groupId ?? null

    // Validate the group actually exists before passing to RPC
    if (invitedGroupId !== null) {
      const { data: groupCheck } = await supabase
        .from('athlete_groups')
        .select('id')
        .eq('id', invitedGroupId)
        .single()

      if (!groupCheck) {
        console.warn(`Invalid groupId ${invitedGroupId} from Clerk metadata — ignoring`)
        invitedGroupId = null
      }
    }

    // If user was invited as athlete, force that role regardless of what was submitted
    const effectiveRole = meta?.role === 'athlete' ? 'athlete' : data.role

    // Prepare RPC parameters based on role
    // Start with required base params, then add optional role-specific params
    const rpcParams: CompleteOnboardingArgs = {
      p_clerk_id: data.clerkId,
      p_username: uniqueUsername,
      p_email: data.email,
      p_first_name: data.firstName.trim(),
      p_last_name: data.lastName.trim(),
      p_role: effectiveRole,
      // Only pass birthdate if it's a non-empty string (empty string would fail DATE cast)
      p_birthdate: data.birthdate && data.birthdate.trim() ? data.birthdate.trim() : undefined,
      p_timezone: data.timezone || 'UTC',
      p_subscription: data.subscription,
      // Link invited athlete to coach's group
      p_group_id: invitedGroupId ?? undefined,
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

    const { success, created_user_id, message } = result as { success: boolean; created_user_id: number | null; message: string }

    if (!success || !created_user_id) {
      console.error('Onboarding RPC returned failure:', message)
      return {
        isSuccess: false,
        message: message || 'Onboarding failed'
      }
    }

    console.log('Onboarding completed successfully for user:', created_user_id)

    return {
      isSuccess: true,
      message: "Onboarding completed successfully",
      data: { userId: created_user_id.toString() }
    }

  } catch (error: any) {
    console.error('Unexpected error in completeOnboardingAction:', error)
    return {
      isSuccess: false,
      message: `Unexpected error: ${error.message}`
    }
  }
} 