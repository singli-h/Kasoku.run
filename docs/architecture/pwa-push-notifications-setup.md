# PWA Push Notifications Setup Guide

This guide explains how to set up PWA push notifications for workout reminders.

## Overview

The system sends daily workout reminders to users who:
1. Have push notifications enabled
2. Have workout reminders enabled
3. Have a training session scheduled for today
4. Current time matches their preferred reminder time (default: 9 AM local)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser/PWA   │────▶│  Service Worker  │◀────│   Web Push API  │
│  (Subscribe UI) │     │  (sw.js)         │     │                 │
└────────┬────────┘     └──────────────────┘     └────────▲────────┘
         │                                                │
         ▼                                                │
┌─────────────────┐     ┌──────────────────┐             │
│    Supabase     │────▶│  Edge Function   │─────────────┘
│  (Subscriptions │     │  (send-reminders)│
│   + Preferences)│     │  + pg_cron       │
└─────────────────┘     └──────────────────┘
```

## Setup Instructions

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push API authentication.

```bash
# Install web-push globally (if not installed)
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================

Public Key:
BLBx-hf5...long_base64_string...

Private Key:
PrivateKeyBase64String...

=======================================
```

### 2. Configure Environment Variables

#### Local Development (`.env.local`)

Add to `apps/web/.env.local`:
```bash
# VAPID Keys for Web Push API
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLBx-hf5...your_public_key...
VAPID_PRIVATE_KEY=your_private_key...
VAPID_SUBJECT=mailto:support@yourdomain.com
```

#### Supabase Secrets

Set secrets for the Edge Function:
```bash
# Set VAPID keys as Supabase secrets
supabase secrets set NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_SUBJECT=mailto:support@yourdomain.com
```

#### Vercel (Production)

Add environment variables in Vercel Dashboard:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - The public VAPID key
- `VAPID_PRIVATE_KEY` - The private VAPID key (not exposed to client)
- `VAPID_SUBJECT` - Contact email in mailto: format

### 3. Run Database Migrations

Apply the new migrations to create required tables:
```bash
# From project root
supabase db push

# Or apply specific migrations
supabase migration up
```

This creates:
- `push_subscriptions` - Stores user push subscription data
- `reminder_preferences` - Stores user notification preferences
- `get_users_for_workout_reminder()` - Function to query users needing reminders

### 4. Deploy Edge Function

Deploy the Edge Function to Supabase:
```bash
# Deploy the function
supabase functions deploy send-workout-reminders

# Verify deployment
supabase functions list
```

### 5. Set Up pg_cron (Scheduled Execution)

The Edge Function needs to run every minute to check for users who need reminders.

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Database** → **Extensions**
2. Enable the `pg_cron` extension if not already enabled
3. Go to **Database** → **Cron Jobs** (or use SQL Editor)
4. Create a new cron job:

```sql
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the cron job to run every minute
SELECT cron.schedule(
  'workout-reminder-job',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-workout-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job;
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference (e.g., `abcdefghijk`)
- `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Project Settings → API)

#### Option B: Via Migration File

Add to a new migration file:
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Note: You'll need to manually set the URL and key after deployment
-- as they contain sensitive values
```

### 6. Add PWA Icons

The notification uses icons defined in `manifest.json`. Ensure these icons exist in `apps/web/public/icons/`:

- `icon-72x72.png` (badge icon)
- `icon-192x192.png` (main notification icon)

You can generate these from your logo using tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Testing

### Test Push Subscription (Browser Console)

```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistration().then(reg => console.log(reg))

// Check current subscription
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub => console.log(sub))
)
```

### Test Edge Function Manually

```bash
# Invoke the Edge Function directly
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-workout-reminders \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Test Notification Display

```javascript
// Show a test notification (after permission granted)
new Notification('Test Notification', {
  body: 'This is a test notification',
  icon: '/icons/icon-192x192.png'
})
```

## Troubleshooting

### Notifications not appearing

1. **Check browser support**: Push notifications require HTTPS (except localhost)
2. **Check permission**: `Notification.permission` should be `'granted'`
3. **Check service worker**: Must be registered and active
4. **Check subscription**: User must be subscribed to push

### Edge Function not sending

1. **Check logs**: `supabase functions logs send-workout-reminders`
2. **Check secrets**: Verify VAPID keys are set correctly
3. **Check cron job**: Verify it's running with `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Subscription fails

1. **Check VAPID public key**: Must match between client and server
2. **Check endpoint**: May be expired or invalid
3. **Network issues**: Check browser console for errors

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260120000000_create_push_subscriptions.sql` | Push subscriptions table |
| `supabase/migrations/20260120000001_create_reminder_preferences.sql` | Reminder preferences table |
| `supabase/migrations/20260120000002_create_workout_reminder_function.sql` | Query function |
| `apps/web/public/sw.js` | Service Worker |
| `apps/web/hooks/use-push-notifications.ts` | React hook for push management |
| `apps/web/app/api/push/subscribe/route.ts` | API to save subscription |
| `apps/web/app/api/push/unsubscribe/route.ts` | API to remove subscription |
| `apps/web/actions/notifications/notification-actions.ts` | Server actions |
| `supabase/functions/send-workout-reminders/index.ts` | Edge Function |

## Security Considerations

1. **VAPID Private Key**: Never expose in client code or commit to git
2. **Service Role Key**: Only use in server-side code and Edge Functions
3. **RLS Policies**: Users can only manage their own subscriptions
4. **Subscription Cleanup**: Invalid subscriptions are automatically removed

## Browser Support

Push notifications are supported in:
- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+ (macOS Ventura+)
- Chrome for Android
- Firefox for Android

**Not supported:**
- Safari on iOS (as of iOS 16.4, requires PWA to be installed)
- Older browsers
