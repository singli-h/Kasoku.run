import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'
import { Webhook } from 'https://esm.sh/svix@1.7.0'

// Define CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

        console.log(`Webhook: Creating new user ${id} with email ${primaryEmail}`);

        // Insert user into the Supabase users table
        const { data: userData, error } = await supabase
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
            onboarding_completed: false, // New users need to complete onboarding
            metadata: {
              first_name,
              last_name
            }
          })
          .select()

        if (error) {
          console.error('Error inserting user into Supabase:', error)
          return new Response(
            JSON.stringify({ error: 'Error inserting user' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        // Check if user was created successfully
        if (userData && userData.length > 0) {
          console.log(`Created user with ID: ${userData[0].id}`);
          
          // The trigger should create the athlete record automatically
          // But we'll double-check that the athlete record exists
          const { data: athleteData, error: athleteError } = await supabase
            .from('athletes')
            .select('*')
            .eq('user_id', userData[0].id);
            
          if (athleteError || !athleteData || athleteData.length === 0) {
            console.log(`Creating default athlete record for user ${userData[0].id}`);
            
            // Create a default athlete record if it doesn't exist
            const { error: createAthleteError } = await supabase
              .from('athletes')
              .insert({
                user_id: userData[0].id,
                height: 0,
                weight: 0,
                training_goals: '',
                experience: '',
                events: []
              });
              
            if (createAthleteError) {
              console.error('Error creating default athlete record:', createAthleteError);
            }
          }
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
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error processing webhook' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
});
