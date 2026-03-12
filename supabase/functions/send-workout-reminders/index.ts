/*
<ai_context>
Supabase Edge Function to send workout reminder push notifications.
Called by pg_cron every 5 minutes, it queries users who:
1. Have push subscriptions
2. Have workout reminders enabled
3. Have scheduled training for today (in their timezone)
4. Current time is at or after their preferred reminder time
5. Haven't already received a reminder today

Uses the Web Push API to send notifications.
</ai_context>
*/

// @deno-types="npm:@supabase/functions-js/edge-runtime.d.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Types
interface UserToNotify {
  user_id: number
  timezone: string
  preferred_time: string
  endpoint: string
  p256dh: string
  auth: string
  session_name: string
  exercise_count: number
}

interface NotificationPayload {
  title: string
  body: string
  icon: string
  badge: string
  tag: string
  data: { url: string }
}

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// VAPID keys for Web Push
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@kasoku.run'

Deno.serve(async (req: Request) => {
  try {
    // Verify request is from pg_cron or authorized source via service role key
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') ?? ''

    if (token !== supabaseServiceKey) {
      console.log('[send-workout-reminders] Unauthorized request rejected')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get current UTC time
    const nowUtc = new Date()
    console.log(`[send-workout-reminders] Running at ${nowUtc.toISOString()}`)

    // Query users who need reminders at their local time
    const { data: usersToNotify, error: queryError } = await supabase.rpc(
      'get_users_for_workout_reminder',
      { current_utc: nowUtc.toISOString() }
    )

    if (queryError) {
      console.error('[send-workout-reminders] Query error:', queryError)
      return new Response(
        JSON.stringify({ error: queryError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      console.log('[send-workout-reminders] No notifications to send')
      return new Response(
        JSON.stringify({ message: 'No notifications to send', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-workout-reminders] Found ${usersToNotify.length} users to notify`)

    // Send notifications to each user
    const results = await Promise.allSettled(
      usersToNotify.map((user: UserToNotify) => sendPushNotification(user))
    )

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Clean up invalid subscriptions (410 Gone or 404 Not Found)
    const invalidEndpoints: string[] = []
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const reason = result.reason as { statusCode?: number }
        if (reason?.statusCode === 410 || reason?.statusCode === 404) {
          invalidEndpoints.push(usersToNotify[index].endpoint)
        }
      }
    })

    if (invalidEndpoints.length > 0) {
      console.log(`[send-workout-reminders] Cleaning up ${invalidEndpoints.length} invalid subscriptions`)
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidEndpoints)

      if (deleteError) {
        console.error('[send-workout-reminders] Error cleaning up subscriptions:', deleteError)
      }
    }

    const response = {
      message: 'Notifications processed',
      successful,
      failed,
      cleanedUp: invalidEndpoints.length,
      timestamp: nowUtc.toISOString()
    }

    console.log('[send-workout-reminders] Result:', response)

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-workout-reminders] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Send a push notification to a single user
 */
async function sendPushNotification(user: UserToNotify): Promise<void> {
  // Import web-push library
  const webPush = await import("npm:web-push@3")

  // Configure VAPID
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  // Build notification payload
  const exerciseText = user.exercise_count > 0
    ? `${user.exercise_count} exercise${user.exercise_count > 1 ? 's' : ''}`
    : 'exercises'

  const payload: NotificationPayload = {
    title: "Time for your workout!",
    body: `${user.session_name} - ${exerciseText}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "workout-reminder",
    data: { url: "/dashboard" }
  }

  // Send the notification
  await webPush.sendNotification(
    {
      endpoint: user.endpoint,
      keys: {
        p256dh: user.p256dh,
        auth: user.auth
      }
    },
    JSON.stringify(payload)
  )

  // Mark reminder as sent to prevent duplicate notifications today
  const todayInUserTz = new Date().toLocaleDateString('en-CA', { timeZone: user.timezone || 'UTC' })
  await supabase.rpc('mark_reminder_sent', {
    p_user_id: user.user_id,
    p_date: todayInUserTz
  })

  console.log(`[send-workout-reminders] Sent notification to user ${user.user_id}, marked as sent for ${todayInUserTz}`)
}
