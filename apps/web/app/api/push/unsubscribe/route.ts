/*
<ai_context>
API route to remove a push notification subscription.
Deletes the subscription from push_subscriptions table.
</ai_context>
*/

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"

interface UnsubscribeRequest {
  endpoint: string
}

/**
 * POST /api/push/unsubscribe
 *
 * Removes a push notification subscription for the authenticated user
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
    const body: UnsubscribeRequest = await request.json()

    if (!body.endpoint) {
      return NextResponse.json(
        { error: "Endpoint required" },
        { status: 400 }
      )
    }

    // Delete the subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', dbUserId)
      .eq('endpoint', body.endpoint)

    if (error) {
      console.error('[push/unsubscribe] Error:', error)
      return NextResponse.json(
        { error: "Failed to remove subscription" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/unsubscribe] Error:', err)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
