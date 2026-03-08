/*
<ai_context>
API route to save a push notification subscription.
Creates/updates the subscription in push_subscriptions table
and ensures default reminder preferences exist.
</ai_context>
*/

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"

interface SubscribeRequest {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * POST /api/push/subscribe
 *
 * Saves a push notification subscription for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const dbUserId = await getDbUserId(clerkId)
    const body: SubscribeRequest = await request.json()

    // Validate request body
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      )
    }

    // Upsert subscription and default reminder preferences in parallel
    const [{ error: subscriptionError }, { error: prefsError }] = await Promise.all([
      supabase
        .from('push_subscriptions')
        .upsert({
          user_id: dbUserId,
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          user_agent: request.headers.get('user-agent') || null
        }, {
          onConflict: 'user_id,endpoint'
        }),
      supabase
        .from('reminder_preferences')
        .upsert({
          user_id: dbUserId,
          workout_reminders_enabled: true,
          preferred_time: '09:00:00'
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        }),
    ])

    if (subscriptionError) {
      console.error('[push/subscribe] Subscription error:', subscriptionError)
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      )
    }

    if (prefsError) {
      // Log but don't fail - subscription was saved successfully
      console.error('[push/subscribe] Preferences error:', prefsError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/subscribe] Error:', err)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
