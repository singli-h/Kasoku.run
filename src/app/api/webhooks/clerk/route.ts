/**
 * Clerk Webhook Handler
 * 
 * This handler processes webhooks from Clerk to sync user data with our database.
 * It handles user creation, updates, and deletions.
 */
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Webhook secret for verifying Clerk webhook requests
 */
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

type UserWebhookData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{ email_address: string }>;
  image_url: string;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  unsafe_metadata: Record<string, unknown>;
  [key: string]: unknown;
};

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
    error: error ? {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : undefined,
  }));
}

/**
 * POST handler for Clerk webhooks
 * 
 * @param request - The incoming webhook request
 */
export async function POST(request: Request) {
  try {
    // Verify environment variables
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return new Response('Configuration error', { status: 500 });
    }

    // Get and verify headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing Svix headers:', { svix_id, svix_timestamp, svix_signature });
      return new Response('Missing webhook headers', { status: 400 });
    }

    // Get and verify body
    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      console.error('Error parsing webhook body:', err);
      return new Response('Invalid webhook body', { status: 400 });
    }

    const body = JSON.stringify(payload);
    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response('Invalid webhook signature', { status: 401 });
    }

    const eventType = evt.type;

    // Only process user events
    if (!eventType.startsWith('user.')) {
      console.log('Ignoring non-user event:', eventType);
      return new Response('Not a user event', { status: 200 });
    }

    // Type assertion after validating it's a user event
    const { id, ...attributes } = evt.data as unknown as UserWebhookData;

    if (!id) {
      console.error('Missing user ID in webhook data');
      return new Response('Missing user ID', { status: 400 });
    }

    console.log(`Processing ${eventType} for user ${id}`);

    try {
      switch (eventType) {
        case 'user.created':
        case 'user.updated': {
          const { 
            email_addresses,
            first_name, 
            last_name, 
            image_url,
            public_metadata,
            private_metadata,
            unsafe_metadata 
          } = attributes;

          if (!email_addresses?.length) {
            throw new Error('No email addresses provided');
          }

          const primaryEmail = email_addresses[0].email_address;
          if (!primaryEmail) {
            throw new Error('Invalid primary email');
          }

          // Create or update user in Supabase
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
              clerk_id: id,
              email: primaryEmail,
              name: [first_name, last_name].filter(Boolean).join(' '),
              avatar_url: image_url,
              metadata: {
                public: public_metadata,
                private: private_metadata,
                unsafe: unsafe_metadata
              },
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'clerk_id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (userError) {
            console.error('Error upserting user:', userError);
            throw userError;
          }

          console.log('Successfully synced user:', id);
          return new Response(JSON.stringify({ success: true, data: userData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        case 'user.deleted': {
          const { error } = await supabaseAdmin
            .from('users')
            .update({ 
              deleted_at: new Date().toISOString(),
              metadata: { deleted: true }
            })
            .eq('clerk_id', id);

          if (error) {
            console.error('Error soft-deleting user:', error);
            throw error;
          }

          console.log('Successfully marked user as deleted:', id);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        default:
          console.log('Ignoring event:', eventType);
          return new Response(`Unhandled webhook event: ${eventType}`, { status: 400 });
      }
    } catch (error) {
      console.error(`Error processing ${eventType}:`, error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType,
        userId: id
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Unexpected webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 