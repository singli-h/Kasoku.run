# Clerk Webhook Handler

This Supabase Edge Function provides an endpoint for handling webhooks from Clerk authentication service. It processes user events (creation, updates, deletion) and syncs user data to your Supabase database.

## Features

- Securely validates webhook signatures using the Svix library
- Handles user.created, user.updated, and user.deleted events
- Syncs data to the users table in your Supabase database
- Uses soft deletion for user.deleted events

## Environment Variables

The following environment variables need to be set:

- `CLERK_WEBHOOK_SECRET`: The signing secret for your Clerk webhook
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (admin access)

## Setup

1. Create a webhook endpoint in the Clerk Dashboard
   - Go to Webhooks in your Clerk Dashboard
   - Add a new endpoint with the URL of this function (e.g., https://your-project.supabase.co/functions/v1/clerk-webhook)
   - Subscribe to the events you want to handle (user.created, user.updated, user.deleted)
   - Copy the signing secret to use as your CLERK_WEBHOOK_SECRET

2. Set environment variables in the Supabase Dashboard
   - Go to Settings > API in your Supabase Dashboard
   - Add the environment variables listed above under the "Edge Functions" section

3. Deploy the function
   ```bash
   supabase functions deploy clerk-webhook --no-verify-jwt
   ```

## Testing

You can test the webhook by triggering user events in Clerk:
- Create a new user in your application
- Update user information
- Delete a user

## Usage in Your Application

Your application does not need to directly interact with this webhook handler. It runs automatically in response to Clerk user events.

To query user data from your application, use the `@clerk/nextjs` SDK along with the Supabase client configured with Clerk JWT authentication. 

## Data Synchronization

The webhook handler synchronizes the following data to the users table:

- clerk_id: Clerk's user ID
- email: User's primary email address
- name: Combined first and last name
- username: User's username or lowercase first name
- timezone: Default 'UTC'
- subscription_status: Default 'free'
- avatar_url: User's profile image URL
- metadata: Additional user data (first_name, last_name)
- deleted_at: Timestamp for soft deletion
- updated_at: Last update timestamp 