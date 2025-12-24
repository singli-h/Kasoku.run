/*
 * Clerk Webhook Handler for Supabase User & Organization Sync
 * 
 * This route handles Clerk webhooks to keep Supabase in sync with Clerk user data.
 * It uses the service-role client to bypass RLS for webhook operations.
 * 
 * VERCEL DEPLOYMENT PROTECTION NOTES:
 * 
 * RECOMMENDED: Disable Password Protection (Simplest)
 * - Production/Staging: Disable password protection entirely
 *   - Vercel Dashboard > Settings > Deployment Protection > Disable
 * - This allows webhooks to work without additional configuration
 * 
 * ALTERNATIVE: Protection Bypass (Only if you need protection enabled)
 * - Enable "Protection Bypass for Automation" in Vercel Dashboard
 * - Creates VERCEL_AUTOMATION_BYPASS_SECRET env var automatically
 * - NOTE: Clerk doesn't support custom headers natively, so this requires:
 *   - A webhook proxy service (Zapier, Make.com, or custom)
 *   - Or Clerk Enterprise features for webhook transformation
 * - For most cases, disabling protection is simpler
 * 
 * LOCAL DEVELOPMENT:
 * - Webhooks won't work on localhost - use ngrok or similar tunnel
 * - Example: `ngrok http 3000` → use `https://abc123.ngrok.io/api/auth/webhook` in Clerk
 * - ngrok URL changes on restart - update Clerk Dashboard when it changes
 * 
 * STAGING SETUP:
 * - Set up staging environment FIRST (before configuring webhooks)
 * - Option A: Separate Vercel project → `your-app-staging.vercel.app`
 * - Option B: Branch-based preview → `your-app-git-staging.vercel.app`
 * - Webhook URL: `https://your-staging-url.vercel.app/api/auth/webhook`
 * - Can share same Supabase dev server for local + staging
 * 
 * PROXY BYPASS:
 * - This route is in /api which is marked as public in proxy.ts
 * - Clerk middleware will not redirect webhook requests (no user session)
 * - Webhook security is handled via Svix signature verification below
 */

import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
// Use service-role client for webhooks to bypass RLS securely
import supabaseService from "@/lib/supabase-service"

// Define the webhook event types
interface UserWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted"
  data: {
    id: string
    username?: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
    created_at: number
    updated_at: number
    public_metadata?: {
      role?: string
    }
    unsafe_metadata?: {
      role?: string
    }
  }
}

interface OrganizationMembershipWebhookEvent {
  type: "organizationMembership.created" | "organizationMembership.updated" | "organizationMembership.deleted"
  data: {
    id: string
    organization: {
      id: string
      name: string
    }
    public_user_data: {
      user_id: string
      first_name?: string
      last_name?: string
      email_address?: string
      identifier?: string
      profile_image_url?: string
    }
    role: string
    public_metadata?: {
      internal_role?: string
    }
  }
}

type WebhookEvent = UserWebhookEvent | OrganizationMembershipWebhookEvent

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Webhook missing Svix headers")
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook secret is configured
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured")
    return new Response("Webhook secret not configured", {
      status: 500,
    })
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook signature:", err)
    return new Response("Error occurred -- invalid signature", {
      status: 400,
    })
  }

  // Handle the webhook
  const { type, data } = evt
  const eventId = (data as any).id || svix_id
  console.log(`[webhook:${eventId}] Received event: ${type}`)

  try {
    switch (type) {
      case "user.created":
        await handleUserCreated(data as UserWebhookEvent["data"])
        break
      case "user.updated":
        await handleUserUpdated(data as UserWebhookEvent["data"])
        break
      case "user.deleted":
        await handleUserDeleted(data as UserWebhookEvent["data"])
        break
      // TEMPORARILY DISABLED: Organization tables do not exist yet
      // case "organizationMembership.created":
      //   await handleOrganizationMembershipCreated(data as OrganizationMembershipWebhookEvent["data"])
      //   break
      // case "organizationMembership.updated":
      //   await handleOrganizationMembershipUpdated(data as OrganizationMembershipWebhookEvent["data"])
      //   break
      // case "organizationMembership.deleted":
      //   await handleOrganizationMembershipDeleted(data as OrganizationMembershipWebhookEvent["data"])
      //   break
      default:
        console.log(`[webhook:${eventId}] Unhandled webhook type: ${type}`)
    }
  } catch (error) {
    console.error(`[webhook:${eventId}] Error handling webhook ${type}:`, error)
    return new Response("Error processing webhook", {
      status: 500,
    })
  }

  return new Response("", { status: 200 })
}

async function handleUserCreated(data: UserWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses[0]?.email_address

  if (!primaryEmail) {
    console.error(`[handleUserCreated] No primary email found for user ${data.id}`)
    return
  }

  // Generate a username from email (fallback if no first/last name)
  const username = data.username || (data.first_name && data.last_name
    ? `${data.first_name.toLowerCase()}.${data.last_name.toLowerCase()}`
    : primaryEmail.split('@')[0])

  // Determine role from metadata or default to 'athlete'
  const role = data.public_metadata?.role || data.unsafe_metadata?.role || 'athlete'

  // Check if user already exists (handles webhook retries)
  const { data: existingUser } = await supabaseService
    .from("users")
    .select("id")
    .eq("clerk_id", data.id)
    .maybeSingle()

  if (existingUser) {
    // User already exists, update instead
    console.log(`[handleUserCreated] User already exists, updating: ${data.id}`)
    const { data: user, error } = await supabaseService
      .from("users")
      .update({
        email: primaryEmail,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        avatar_url: data.image_url || null,
        role: role,
      })
      .eq("clerk_id", data.id)
      .select()
      .single()

    if (error) {
      console.error(`[handleUserCreated] Error updating existing user ${data.id}:`, error)
      throw error
    }

    console.log(`[handleUserCreated] User updated in database: ${primaryEmail} (ID: ${user?.id})`)
    
    // Ensure profile records exist
    if (user) {
      await ensureUserProfile(user.id, role)
    }
    return
  }

  // Insert new user
  const { data: user, error } = await supabaseService
    .from("users")
    .insert({
      clerk_id: data.id,
      email: primaryEmail,
      username: username,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      avatar_url: data.image_url || null,
      role: role, 
      timezone: 'UTC', // Default timezone
      onboarding_completed: false,
    })
    .select()
    .single()

  if (error) {
    console.error(`[handleUserCreated] Error inserting user ${data.id}:`, error)
    throw error
  }

  console.log(`[handleUserCreated] User created in database: ${primaryEmail} (ID: ${user?.id})`)

  // Ensure profile records exist
  if (user) {
    await ensureUserProfile(user.id, role)
  }
}

async function handleUserUpdated(data: UserWebhookEvent["data"]) {
  const primaryEmail = data.email_addresses[0]?.email_address
  
  if (!primaryEmail) {
    console.error(`[handleUserUpdated] No primary email found for user ${data.id}`)
    return
  }

  // Determine role from metadata
  const role = data.public_metadata?.role || data.unsafe_metadata?.role

  // Try using the RPC function if available, fallback to direct update
  const { data: rpcResult, error: rpcError } = await supabaseService.rpc(
    'update_user_from_webhook',
    {
      p_clerk_id: data.id,
      p_email: primaryEmail,
      p_first_name: data.first_name || '',
      p_last_name: data.last_name || '',
      p_avatar_url: data.image_url || '',
    }
  )

  if (rpcError) {
    // Fallback to direct update if RPC doesn't exist
    console.warn(`[handleUserUpdated] RPC not available, using direct update:`, rpcError.message)
    const { error } = await supabaseService
      .from("users")
      .update({
        email: primaryEmail,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        avatar_url: data.image_url || null,
      })
      .eq("clerk_id", data.id)

    if (error) {
      console.error(`[handleUserUpdated] Error updating user ${data.id}:`, error)
      throw error
    }
  }

  // Get user to check role and ensure profiles
  const { data: user } = await supabaseService
      .from("users")
      .select("id, role")
      .eq("clerk_id", data.id)
      .maybeSingle()

  if (user) {
      // If role provided in metadata and different, update it
      if (role && role !== user.role) {
          console.log(`[handleUserUpdated] Updating role for user ${user.id} to ${role}`)
          await supabaseService.from("users").update({ role: role }).eq("id", user.id)
          await ensureUserProfile(user.id, role)
      } else {
          // Ensure profiles exist for current role
          await ensureUserProfile(user.id, role || user.role)
      }
  }

  console.log(`[handleUserUpdated] User updated in database: ${primaryEmail}`)
}

async function handleUserDeleted(data: UserWebhookEvent["data"]) {
  const { error } = await supabaseService
    .from("users")
    .delete()
    .eq("clerk_id", data.id)

  if (error) {
    console.error(`[handleUserDeleted] Error deleting user ${data.id}:`, error)
    throw error
  }

  console.log(`[handleUserDeleted] User deleted from database: ${data.id}`)
}

// TEMPORARILY DISABLED: Organization tables do not exist yet
/*
async function handleOrganizationMembershipCreated(data: OrganizationMembershipWebhookEvent["data"]) {
  const clerkUserId = data.public_user_data?.user_id
  const orgId = data.organization?.id
  const clerkRole = data.role
  const membershipId = data.id

  if (!clerkUserId || !orgId) {
    console.error(`[handleOrganizationMembershipCreated] Missing required data:`, {
      clerkUserId,
      orgId,
      membershipId
    })
    return
  }

  // Extract user data from webhook payload
  const email = data.public_user_data?.email_address || data.public_user_data?.identifier
  const firstName = data.public_user_data?.first_name
  const lastName = data.public_user_data?.last_name
  const avatarUrl = data.public_user_data?.profile_image_url
  const internalRoleOverride = data.public_metadata?.internal_role

  // Try using the complete_invitation_flow RPC if email is available
  if (email) {
    const { data: rpcResult, error: rpcError } = await supabaseService.rpc(
      'complete_invitation_flow',
      {
        p_clerk_user_id: clerkUserId,
        p_email: email,
        p_first_name: firstName || null,
        p_last_name: lastName || null,
        p_avatar_url: avatarUrl || null,
        p_org_clerk_id: orgId,
        p_org_name: data.organization?.name || null,
        p_clerk_membership_id: membershipId,
        p_role: clerkRole,
        p_internal_role_override: internalRoleOverride || null,
      }
    )

    if (!rpcError) {
      console.log(`[handleOrganizationMembershipCreated] Membership created via RPC:`, rpcResult)
      return
    }

    // Fallback to legacy RPC if new one doesn't exist
    console.warn(`[handleOrganizationMembershipCreated] RPC not available, using legacy:`, rpcError.message)
  }

  // Fallback to legacy RPC function
  const { data: legacyResult, error: legacyError } = await supabaseService.rpc(
    'create_membership_from_webhook',
    {
      p_user_clerk_id: clerkUserId,
      p_org_clerk_id: orgId,
      p_clerk_membership_id: membershipId,
      p_role: clerkRole,
      p_org_name: data.organization?.name || null,
    }
  )

  if (legacyError) {
    console.error(`[handleOrganizationMembershipCreated] Error creating membership:`, legacyError)
    throw legacyError
  }

  console.log(`[handleOrganizationMembershipCreated] Membership created:`, legacyResult)
}

async function handleOrganizationMembershipUpdated(data: OrganizationMembershipWebhookEvent["data"]) {
  const clerkUserId = data.public_user_data?.user_id
  const orgId = data.organization?.id
  const clerkRole = data.role
  const membershipId = data.id

  if (!clerkUserId || !orgId) {
    console.error(`[handleOrganizationMembershipUpdated] Missing required data:`, {
      clerkUserId,
      orgId,
      membershipId
    })
    return
  }

  // Update membership role in Supabase
  const { error } = await supabaseService
    .from("memberships")
    .update({
      role_id: null, // Will need to map Clerk role to role_id
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_membership_id", membershipId)

  if (error) {
    console.error(`[handleOrganizationMembershipUpdated] Error updating membership:`, error)
    // Don't throw - membership updates are non-critical
    console.warn(`[handleOrganizationMembershipUpdated] Continuing despite error`)
  } else {
    console.log(`[handleOrganizationMembershipUpdated] Membership updated: ${membershipId}`)
  }
}

async function handleOrganizationMembershipDeleted(data: OrganizationMembershipWebhookEvent["data"]) {
  const membershipId = data.id

  if (!membershipId) {
    console.error(`[handleOrganizationMembershipDeleted] Missing membership ID`)
    return
  }

  // Soft delete by setting removed_at timestamp
  const { error } = await supabaseService
    .from("memberships")
    .update({
      removed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_membership_id", membershipId)

  if (error) {
    console.error(`[handleOrganizationMembershipDeleted] Error deleting membership:`, error)
    throw error
  }

  console.log(`[handleOrganizationMembershipDeleted] Membership deleted: ${membershipId}`)
}
*/

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

async function ensureUserProfile(userId: number, role: string) {
  // Ensure athlete record exists for both athletes and coaches
  if (role === 'athlete' || role === 'coach') {
    const { data: existingAthlete } = await supabaseService
      .from('athletes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (!existingAthlete) {
      console.log(`[ensureUserProfile] Creating athlete record for user ${userId}`)
      const { error } = await supabaseService.from('athletes').insert({ user_id: userId })
      if (error) console.error(`[ensureUserProfile] Error creating athlete record:`, error)
    }
  }

  // Ensure coach record exists only for coaches
  if (role === 'coach') {
    const { data: existingCoach } = await supabaseService
      .from('coaches')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (!existingCoach) {
      console.log(`[ensureUserProfile] Creating coach record for user ${userId}`)
      const { error } = await supabaseService.from('coaches').insert({ user_id: userId })
      if (error) console.error(`[ensureUserProfile] Error creating coach record:`, error)
    }
  }
} 