/*
<ai_context>
Server actions for managing notification preferences.
Handles getting and updating reminder preferences (time, enabled status).
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types"

// ============================================================================
// Types
// ============================================================================

export interface ReminderPreferences {
  workout_reminders_enabled: boolean
  preferred_time: string  // HH:MM:SS format
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get the current user's reminder preferences
 */
export async function getReminderPreferencesAction(): Promise<ActionState<ReminderPreferences>> {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(clerkId)

    const { data, error } = await supabase
      .from('reminder_preferences')
      .select('workout_reminders_enabled, preferred_time')
      .eq('user_id', dbUserId)
      .single()

    // If no preferences exist yet, return defaults
    if (error && error.code === 'PGRST116') {
      return {
        isSuccess: true,
        message: "Using default preferences",
        data: {
          workout_reminders_enabled: true,
          preferred_time: '09:00:00'
        }
      }
    }

    if (error) {
      console.error('[getReminderPreferencesAction] Error:', error)
      return {
        isSuccess: false,
        message: error.message
      }
    }

    return {
      isSuccess: true,
      message: "Preferences loaded",
      data: {
        workout_reminders_enabled: data.workout_reminders_enabled,
        preferred_time: data.preferred_time
      }
    }
  } catch (err) {
    console.error('[getReminderPreferencesAction] Error:', err)
    return {
      isSuccess: false,
      message: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Update the current user's reminder preferences
 */
export async function updateReminderPreferencesAction(
  preferences: Partial<ReminderPreferences>
): Promise<ActionState<ReminderPreferences>> {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(clerkId)

    // Validate time format if provided (HH:MM or HH:MM:SS)
    let preferredTime: string | undefined
    if (preferences.preferred_time !== undefined) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
      if (!timeRegex.test(preferences.preferred_time)) {
        return {
          isSuccess: false,
          message: "Invalid time format. Use HH:MM or HH:MM:SS"
        }
      }
      // Ensure HH:MM:SS format
      preferredTime = preferences.preferred_time.length === 5
        ? `${preferences.preferred_time}:00`
        : preferences.preferred_time
    }

    // Build properly typed update object
    const updateData = {
      user_id: dbUserId,
      ...(preferences.workout_reminders_enabled !== undefined && {
        workout_reminders_enabled: preferences.workout_reminders_enabled
      }),
      ...(preferredTime !== undefined && {
        preferred_time: preferredTime
      })
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('reminder_preferences')
      .upsert(updateData, {
        onConflict: 'user_id'
      })
      .select('workout_reminders_enabled, preferred_time')
      .single()

    if (error) {
      console.error('[updateReminderPreferencesAction] Error:', error)
      return {
        isSuccess: false,
        message: error.message
      }
    }

    return {
      isSuccess: true,
      message: "Preferences updated",
      data: {
        workout_reminders_enabled: data.workout_reminders_enabled,
        preferred_time: data.preferred_time
      }
    }
  } catch (err) {
    console.error('[updateReminderPreferencesAction] Error:', err)
    return {
      isSuccess: false,
      message: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Check if the user has any push subscriptions
 */
export async function hasPushSubscriptionAction(): Promise<ActionState<boolean>> {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(clerkId)

    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', dbUserId)

    if (error) {
      console.error('[hasPushSubscriptionAction] Error:', error)
      return {
        isSuccess: false,
        message: error.message
      }
    }

    return {
      isSuccess: true,
      message: count && count > 0 ? "Has subscriptions" : "No subscriptions",
      data: (count ?? 0) > 0
    }
  } catch (err) {
    console.error('[hasPushSubscriptionAction] Error:', err)
    return {
      isSuccess: false,
      message: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}
