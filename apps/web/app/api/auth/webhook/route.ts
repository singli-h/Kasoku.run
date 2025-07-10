"use server"

import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import supabase from "@/lib/supabase-server"

// Define the webhook event types
interface WebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
    created_at: number
    updated_at: number
  }
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  // Handle the webhook
  const { type, data } = evt
  console.log(`Webhook received: ${type}`)

  try {
    switch (type) {
      case "user.created":
        await handleUserCreated(data)
        break
      case "user.updated":
        await handleUserUpdated(data)
        break
      case "user.deleted":
        await handleUserDeleted(data)
        break
      default:
        console.log(`Unhandled webhook type: ${type}`)
    }
  } catch (error) {
    console.error(`Error handling webhook ${type}:`, error)
    return new Response("Error processing webhook", {
      status: 500,
    })
  }

  return new Response("", { status: 200 })
}

async function handleUserCreated(data: WebhookEvent["data"]) {
  const primaryEmail = data.email_addresses[0]?.email_address
  
  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  // Generate a username from email (fallback if no first/last name)
  const username = data.first_name && data.last_name 
    ? `${data.first_name.toLowerCase()}.${data.last_name.toLowerCase()}`
    : primaryEmail.split('@')[0]

  const { error } = await supabase
    .from("users")
    .insert({
      clerk_id: data.id,
      email: primaryEmail,
      username: username,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      avatar_url: data.image_url || null,
      role: 'athlete', // Default role
      timezone: 'UTC', // Default timezone
      onboarding_completed: false,
    })

  if (error) {
    console.error("Error creating user in database:", error)
    throw error
  }

  console.log(`User created in database: ${primaryEmail}`)
}

async function handleUserUpdated(data: WebhookEvent["data"]) {
  const primaryEmail = data.email_addresses[0]?.email_address
  
  if (!primaryEmail) {
    console.error("No primary email found for user")
    return
  }

  const { error } = await supabase
    .from("users")
    .update({
      email: primaryEmail,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      avatar_url: data.image_url || null,
    })
    .eq("clerk_id", data.id)

  if (error) {
    console.error("Error updating user in database:", error)
    throw error
  }

  console.log(`User updated in database: ${primaryEmail}`)
}

async function handleUserDeleted(data: WebhookEvent["data"]) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("clerk_id", data.id)

  if (error) {
    console.error("Error deleting user from database:", error)
    throw error
  }

  console.log(`User deleted from database: ${data.id}`)
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