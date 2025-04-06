/**
 * Clerk Webhook Handler
 * 
 * This handler processes webhooks from Clerk to sync user data with our database.
 * It handles user creation, updates, and deletions.
 */
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { syncUserToProfile } from '@/lib/clerk';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Webhook secret for verifying Clerk webhook requests
 */
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

/**
 * Log webhook event with structured data
 */
function logWebhookEvent(eventType: string, userId: string, data: any, error?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    type: 'webhook_event',
    eventType,
    userId,
    data,
    error,
  }));
}

/**
 * POST handler for Clerk webhooks
 * 
 * @param request - The incoming webhook request
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    if (!webhookSecret) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    // Get the raw body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      logWebhookEvent('verification_failed', 'unknown', payload, err);
      return new Response('Error verifying webhook', { status: 400 });
    }

    // Handle the webhook
    const { id } = evt.data;
    const eventType = evt.type;

    if (!id) {
      logWebhookEvent('missing_user_id', 'unknown', evt.data);
      return new Response('Missing user ID', { status: 400 });
    }

    logWebhookEvent(eventType, id, evt.data);

    try {
      switch (eventType) {
        case 'user.created':
        case 'user.updated': {
          // Extract user data from the webhook payload
          const { 
            first_name, 
            last_name, 
            email_addresses, 
            image_url,
            public_metadata,
            private_metadata,
            unsafe_metadata 
          } = evt.data;

          // Validate email
          if (!email_addresses || email_addresses.length === 0) {
            throw new Error('No email addresses provided');
          }

          const primaryEmail = email_addresses[0].email_address;
          if (!primaryEmail) {
            throw new Error('Invalid primary email');
          }

          // Sync user data to our database
          await syncUserToProfile(id, {
            firstName: first_name,
            lastName: last_name,
            email: primaryEmail,
            imageUrl: image_url,
            metadata: {
              public: public_metadata,
              private: private_metadata,
              unsafe: unsafe_metadata
            }
          });
          break;
        }

        case 'user.deleted': {
          // For user deletion, we'll soft delete by updating the user
          const { error } = await supabaseAdmin
            .from('users')
            .update({ 
              deleted_at: new Date().toISOString(),
              metadata: { deleted: true }
            })
            .eq('clerk_id', id);

          if (error) throw error;
          break;
        }

        default:
          logWebhookEvent('unhandled_event', id, evt.data);
          // Don't throw error for unhandled events
          break;
      }
      
      return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
      logWebhookEvent('processing_error', id, evt.data, error);
      return new Response('Error processing webhook', { status: 500 });
    }
  } catch (error) {
    logWebhookEvent('unexpected_error', 'unknown', null, error);
    return new Response('Error processing webhook', { status: 500 });
  }
} 