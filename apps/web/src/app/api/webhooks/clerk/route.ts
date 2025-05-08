import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServerSupabaseClient } from '@/lib/supabase';

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhooks (user.created, user.updated, user.deleted)
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  let evt;

  try {
    evt = new Webhook(clerkWebhookSecret).verify(payload, headers);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { type, data } = evt;

  try {
    if (type === 'user.created') {
      const { id, email_addresses, first_name, last_name, username, created_at } = data;
      const primaryEmail = email_addresses.find((e: any) => e.id === data.primary_email_address_id)?.email_address;

      await supabase.from('users').insert({
        clerk_id: id,
        email: primaryEmail,
        username: username || (first_name?.toLowerCase() || ''),
        first_name: first_name || '',
        last_name: last_name || '',
        timezone: 'UTC',
        subscription_status: 'free',
        avatar_url: data.image_url,
        onboarding_completed: false,
        role: 'athlete'
      });

      // Ensure a default athlete record exists
      const { data: athlete } = await supabase.from('athletes').select('id').eq('user_id', data.user_id);
      if (!athlete || athlete.length === 0) {
        await supabase.from('athletes').insert({ user_id: data.user_id, height: 0, weight: 0, training_goals: '', experience: '', events: [] });
      }
    }

    if (type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, username } = data;
      const primaryEmail = email_addresses.find((e: any) => e.id === data.primary_email_address_id)?.email_address;

      await supabase.from('users').update({
        email: primaryEmail,
        first_name: first_name || '',
        last_name: last_name || '',
        username: username || (first_name?.toLowerCase() || ''),
        avatar_url: data.image_url,
        updated_at: new Date().toISOString()
      }).eq('clerk_id', id);
    }

    if (type === 'user.deleted') {
      await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('clerk_id', data.id);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    // proceed anyway to acknowledge receipt
  }

  return NextResponse.json({ success: true });
} 