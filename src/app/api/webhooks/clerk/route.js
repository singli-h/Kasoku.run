import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request) {
  try {
    // Get the request body
    const payload = await request.json();
    
    // Get Clerk webhook signature from headers
    const headersList = headers();
    const svixId = headersList.get('svix-id');
    const svixTimestamp = headersList.get('svix-timestamp');
    const svixSignature = headersList.get('svix-signature');
    
    // If there's no signature in the headers, reject the request
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(
        JSON.stringify({ error: 'Missing Svix headers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verification is optional but recommended
    // This will verify the webhook actually came from Clerk
    // You can skip this step if you don't want to verify
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    // If we have a webhook secret, verify the request
    if (webhookSecret) {
      const svixHeaders = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };
      
      // Create a new Svix instance with your webhook secret
      const wh = new Webhook(webhookSecret);
      
      try {
        // Verify the webhook payload
        wh.verify(JSON.stringify(payload), svixHeaders);
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return new Response(
          JSON.stringify({ error: 'Webhook verification failed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get the ID and type
    const { id } = payload.data;
    const eventType = payload.type;
    
    // Log the webhook event (optional)
    console.log(`Webhook with ID: ${id} and type: ${eventType}`);
    console.log('Webhook payload:', JSON.stringify(payload));

    // First, log the webhook in Supabase for debugging
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        payload: payload
      });

    // Process different event types
    if (eventType === 'user.created') {
      const userData = payload.data;
      const userId = userData.id;
      
      // Insert new user into public.users table
      await supabaseAdmin
        .from('users')
        .insert({
          username: userData.username || `user_${userId.substring(0, 8)}`,
          email: userData.email_addresses[0]?.email_address || '',
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          clerk_id: userId,
          avatar_url: userData.image_url,
          timezone: userData.timezone || 'UTC',
          subscription_status: 'free',
          metadata: userData
        });
      
    } else if (eventType === 'user.updated') {
      const userData = payload.data;
      const userId = userData.id;
      
      // Update existing user
      await supabaseAdmin
        .from('users')
        .update({
          username: userData.username,
          email: userData.email_addresses[0]?.email_address,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          avatar_url: userData.image_url,
          timezone: userData.timezone,
          metadata: userData,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId);
      
    } else if (eventType === 'user.deleted') {
      const userId = payload.data.id;
      
      // Soft delete the user
      await supabaseAdmin
        .from('users')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('clerk_id', userId);
    } else if (eventType === 'email.created') {
      const emailData = payload.data;
      const userId = emailData.user_id;
      
      // If it's a primary email, update the user
      if (emailData.verification_status === 'verified' && emailData.primary) {
        await supabaseAdmin
          .from('users')
          .update({
            email: emailData.email_address,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', userId);
      }
    }

    // Return a success response
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return an error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 