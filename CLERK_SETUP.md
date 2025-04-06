# Clerk Integration Setup

This document outlines the steps needed to set up Clerk authentication with your Next.js and Supabase application.

## Configuration Steps

1. **Set up environment variables in Vercel:**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
   - `CLERK_SECRET_KEY` - Your Clerk secret key
   - `CLERK_WEBHOOK_SECRET` - Your Clerk webhook signing secret
   - `NEXT_PUBLIC_CLERK_FRONTEND_API` - The URL for Clerk's frontend API
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

2. **Configure Clerk JWT template:**
   - Go to the Clerk Dashboard > JWT Templates
   - Create a new template named "supabase"
   - Use the following claims:
     ```json
           {
       "aud": "authenticated",
       "role": "authenticated",
       "email": "{{user.primary_email_address}}",
       "app_metadata": {},
       "user_metadata": {
         "clerk_id": "{{user.id}}"
       }
     }
     ```

3. **Configure Clerk webhook:**
   - In the Clerk Dashboard, go to Webhooks
   - Add a new endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Enable at least these events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `email.created`
     - `email.updated`

4. **Run database migrations:**
   - The Supabase migrations in this project will set up the required database tables
   - You can apply them manually if needed with:
     ```
     npx supabase migration up
     ```

## Troubleshooting

- If you encounter the "Super constructor null of Fs is not a constructor" error, this is a known issue in Vercel's serverless environment when using the svix library. Our implementation works around this by skipping the webhook verification in production environments.

- Check the webhook logs table in Supabase to see if webhooks are being received properly:
  ```sql
  SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
  ```

- Ensure that the `users` table has the `clerk_id` column with a unique constraint.

## Security Considerations

- The current implementation skips webhook signature verification in production due to compatibility issues with Vercel's serverless environment.
- For additional security, consider using IP allowlisting in your Clerk webhook settings.
- The webhook endpoint is accessible to the public, so securing it properly is important. 