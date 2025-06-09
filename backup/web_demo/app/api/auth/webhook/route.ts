"use server"

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { Webhook } from "svix"
import { ClerkWebhookEvent, UserCreatedWebhookData } from "@/types"
import { 
  createSupabaseUserFromWebhookAction,
  updateSupabaseUserFromWebhookAction,
  getSupabaseUser
} from '@/actions/auth'

export async function POST(req: NextRequest) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not configured")
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      )
    }

    // Get headers
    const headersList = await headers()
    const svix_id = headersList.get("svix-id")
    const svix_timestamp = headersList.get("svix-timestamp")
    const svix_signature = headersList.get("svix-signature")

    // Check if all required headers are present
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing required svix headers")
      return NextResponse.json(
        { error: "Missing required webhook headers" },
        { status: 400 }
      )
    }

    // Get the raw body for signature verification
    const rawBody = await req.text()

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret)

    let evt: ClerkWebhookEvent

    // Verify the webhook signature
    try {
      evt = wh.verify(rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      )
    }

    console.log("Verified webhook received:", {
      type: evt.type,
      id: svix_id,
      timestamp: svix_timestamp,
    })

    // Process different event types
    let result: any = null

    switch (evt.type) {
      case "user.created":
        result = await handleUserCreated(evt.data as UserCreatedWebhookData)
        break
      case "user.updated":
        result = await handleUserUpdated(evt.data as UserCreatedWebhookData)
        break
      case "user.deleted":
        result = await handleUserDeleted(evt.data as { id: string; deleted: boolean })
        break
      default:
        console.log(`Unhandled webhook event type: ${evt.type}`)
        result = { message: `Event type ${evt.type} not processed` }
    }

    // Prepare response
    const response = NextResponse.json(
      { 
        success: true, 
        message: "Webhook processed successfully",
        eventType: evt.type,
        result
      },
      { status: 200 }
    )

    // Add CORS headers for webhook handling
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, svix-id, svix-timestamp, svix-signature")

    return response

  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle user creation events
async function handleUserCreated(userData: UserCreatedWebhookData) {
  try {
    console.log("Processing user.created event:", {
      userId: userData.id,
      email: userData.email_addresses?.[0]?.email_address
    })

    // Extract user information
    const primaryEmail = userData.email_addresses?.[0]?.email_address
    if (!primaryEmail) {
      throw new Error("No primary email found for user")
    }

    // Check if user already exists (idempotent operation)
    const existingUser = await getSupabaseUser(userData.id)

    if (existingUser) {
      console.log(`User ${userData.id} already exists in Supabase`)
      return { 
        message: "User already exists", 
        userId: existingUser.id,
        action: "skipped"
      }
    }

    // Create user in Supabase using action
    const result = await createSupabaseUserFromWebhookAction(
      userData.id,
      primaryEmail,
      userData.first_name || undefined,
      userData.last_name || undefined,
      userData.image_url || undefined
    )

    if (!result.isSuccess) {
      console.error("Error creating user in Supabase:", result.message)
      throw new Error(result.message)
    }

    console.log("User created successfully in Supabase:", {
      supabaseUserId: result.data.id,
      clerkId: userData.id,
      email: primaryEmail
    })

    return {
      message: "User created successfully",
      userId: result.data.id,
      clerkId: userData.id,
      email: primaryEmail,
      action: "created"
    }

  } catch (error) {
    console.error("Error handling user.created event:", error)
    throw error
  }
}

// Handle user update events
async function handleUserUpdated(userData: UserCreatedWebhookData) {
  try {
    console.log("Processing user.updated event:", {
      userId: userData.id,
      email: userData.email_addresses?.[0]?.email_address
    })

    const primaryEmail = userData.email_addresses?.[0]?.email_address
    if (!primaryEmail) {
      throw new Error("No primary email found for user")
    }

    // Update user in Supabase using action
    const result = await updateSupabaseUserFromWebhookAction(
      userData.id,
      primaryEmail,
      userData.first_name || undefined,
      userData.last_name || undefined,
      userData.image_url || undefined
    )

    if (!result.isSuccess) {
      console.error("Error updating user in Supabase:", result.message)
      throw new Error(result.message)
    }

    console.log("User updated successfully in Supabase:", {
      supabaseUserId: result.data.id,
      clerkId: userData.id,
      email: primaryEmail
    })

    return {
      message: "User updated successfully",
      userId: result.data.id,
      clerkId: userData.id,
      email: primaryEmail,
      action: "updated"
    }

  } catch (error) {
    console.error("Error handling user.updated event:", error)
    throw error
  }
}

// Handle user deletion events
async function handleUserDeleted(userData: { id: string; deleted: boolean }) {
  try {
    console.log("Processing user.deleted event:", {
      userId: userData.id
    })

    // For deletion, we still need direct Supabase access since we don't have a delete action yet
    // TODO: Create a deleteUserAction for consistency
    const { createServerSupabaseClient } = await import('@/lib/supabase')
    const supabase = createServerSupabaseClient()

    // Delete user from Supabase (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', userData.id)

    if (deleteError) {
      console.error("Error deleting user from Supabase:", deleteError)
      throw deleteError
    }

    console.log("User deleted successfully from Supabase:", {
      clerkId: userData.id
    })

    return {
      message: "User deleted successfully",
      clerkId: userData.id,
      action: "deleted"
    }

  } catch (error) {
    console.error("Error handling user.deleted event:", error)
    throw error
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, svix-id, svix-timestamp, svix-signature",
      },
    }
  )
} 