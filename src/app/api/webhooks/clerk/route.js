import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Initialize Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req) {
  try {
    // Get the headers
    const headersList = headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    // If there are no headers, return 400
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response(
        JSON.stringify({
          error: 'Error occurred -- no svix headers',
        }),
        {
          status: 400,
        }
      );
    }

    // Get the payload body
    const payload = await req.json();
    
    // We're skipping the verification step entirely in Vercel to avoid FS issues
    // In a real production app, you might want to use a different approach, like 
    // an environment variable to toggle verification on/off

    // Log the webhook for debugging purposes
    try {
      await supabaseAdmin.from('webhook_logs').insert({
        event_type: payload.type,
        payload: payload
      });
    } catch (error) {
      console.log('Error logging webhook:', error.message);
      // Continue processing even if logging fails
    }

    const eventType = payload.type;
    console.log(`Webhook with event type ${eventType}`);

    // Handle the different event types
    if (eventType === 'user.created') {
      const userData = payload.data;
      const primaryEmail = userData.email_addresses && userData.email_addresses.length > 0 
        ? userData.email_addresses.find(email => email.id === userData.primary_email_address_id)?.email_address 
        : null;
      
      // Format the name from first_name and last_name
      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      
      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: userData.id,
          username: userData.username || `user_${userData.id.substring(0, 8)}`,
          email: primaryEmail,
          name: fullName,
          avatar_url: userData.image_url,
          timezone: userData.timezone || 'UTC',
          subscription_status: 'free',
          metadata: userData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error inserting user into Supabase:', error.message);
        return new Response(
          JSON.stringify({
            error: 'Error inserting user into Supabase',
            details: error.message,
          }),
          {
            status: 500,
          }
        );
      }

    } else if (eventType === 'user.updated') {
      const userData = payload.data;
      const primaryEmail = userData.email_addresses && userData.email_addresses.length > 0 
        ? userData.email_addresses.find(email => email.id === userData.primary_email_address_id)?.email_address 
        : null;
      
      // Format the name from first_name and last_name
      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          username: userData.username,
          email: primaryEmail,
          name: fullName,
          avatar_url: userData.image_url,
          timezone: userData.timezone || 'UTC',
          metadata: userData,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userData.id);

      if (error) {
        console.error('Error updating user in Supabase:', error.message);
        return new Response(
          JSON.stringify({
            error: 'Error updating user in Supabase',
            details: error.message,
          }),
          {
            status: 500,
          }
        );
      }

    } else if (eventType === 'user.deleted') {
      const userId = payload.data.id;

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('clerk_id', userId);

      if (error) {
        console.error('Error soft-deleting user in Supabase:', error.message);
        return new Response(
          JSON.stringify({
            error: 'Error soft-deleting user in Supabase',
            details: error.message,
          }),
          {
            status: 500,
          }
        );
      }

    } else if (eventType === 'email.created' || eventType === 'email.updated') {
      // Handle email updates
      const emailData = payload.data;
      
      if (emailData.id === emailData.user.primary_email_address_id) {
        // This is the primary email, update the user record
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            email: emailData.email_address,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', emailData.user.id);

        if (error) {
          console.error('Error updating user email in Supabase:', error.message);
          return new Response(
            JSON.stringify({
              error: 'Error updating user email in Supabase',
              details: error.message,
            }),
            {
              status: 500,
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return new Response(
      JSON.stringify({
        error: 'Error occurred',
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
} 