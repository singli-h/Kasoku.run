import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Webhook } from 'https://esm.sh/svix@1.14.0'

// Environment variables
const clerkWebhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Create a Supabase client with the Admin key
const supabase = createClient(
  supabaseUrl!,
  supabaseServiceKey!,
  {
    auth: {
      persistSession: false,
    }
  }
)

Deno.serve(async (req) => {
  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify webhook signature
    const payload = await req.text()
    const headers = req.headers

    // Get Svix headers for verification
    const svixId = headers.get('svix-id')
    const svixTimestamp = headers.get('svix-timestamp')
    const svixSignature = headers.get('svix-signature')

    // If there's no webhook secret or signature headers, return an error
    if (!clerkWebhookSecret || !svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Clerk webhook secret or signature headers')
      return new Response(
        JSON.stringify({ error: 'Missing webhook verification information' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a new Svix webhook instance with the secret
    const wh = new Webhook(clerkWebhookSecret)

    // Verify the webhook payload
    let evt
    try {
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response(
        JSON.stringify({ error: 'Error verifying webhook' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Now `evt` contains the verified webhook payload
    const { type, data } = evt

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: type,
        payload: evt
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
      // Continue processing even if logging fails
    }

    // Handle different event types
    switch (type) {
      case 'user.created': {
        // Handle user created event
        const { id, email_addresses, first_name, last_name, username, created_at } = data
        const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id)?.email_address

        // Insert user into the Supabase users table
        const { error } = await supabase
          .from('users')
          .insert({
            clerk_id: id,
            email: primaryEmail,
            username: username || (first_name ? first_name.toLowerCase() : ''),
            first_name: first_name || '',
            last_name: last_name || '',
            timezone: 'UTC', // Default timezone
            subscription_status: 'free', // Default subscription status
            avatar_url: data.image_url,
            metadata: {
              first_name,
              last_name
            }
          })

        if (error) {
          console.error('Error inserting user into Supabase:', error)
          return new Response(
            JSON.stringify({ error: 'Error inserting user' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        break
      }
      case 'user.updated': {
        // Handle user updated event
        const { id, email_addresses, first_name, last_name, username } = data
        const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id)?.email_address

        // Update user in the Supabase users table
        const { error } = await supabase
          .from('users')
          .update({
            email: primaryEmail,
            first_name: first_name || '',
            last_name: last_name || '',
            username: username || (first_name ? first_name.toLowerCase() : ''),
            avatar_url: data.image_url,
            updated_at: new Date().toISOString(),
            metadata: {
              first_name,
              last_name
            }
          })
          .eq('clerk_id', id)

        if (error) {
          console.error('Error updating user in Supabase:', error)
          return new Response(
            JSON.stringify({ error: 'Error updating user' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        break
      }
      case 'user.deleted': {
        // Handle user deleted event
        const { id } = data

        // Soft delete the user by setting deleted_at
        const { error } = await supabase
          .from('users')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('clerk_id', id)

        if (error) {
          console.error('Error handling user deletion in Supabase:', error)
          return new Response(
            JSON.stringify({ error: 'Error handling user deletion' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        break
      }
      default:
        // We don't handle other event types
        console.log(`Unhandled event type: ${type}`)
    }
    
    // Return a success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error processing webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
});
