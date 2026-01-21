# Clerk Webhook Setup Guide for Vercel

This guide covers setting up Clerk webhooks for local development, staging, and production environments on Vercel.

## Quick Answer Summary

### 1. Do you need Vercel Protection Bypass?

**Short answer: No, for most cases.**

**Recommended approach:**
- **Production/Staging**: Disable password protection entirely (simplest)
- **Preview deployments**: Either disable protection OR use bypass (if you need protection)

**When to use Protection Bypass:**
- You want to keep password protection enabled on preview/staging
- You're using automation services that need to bypass protection
- You have a custom webhook proxy that can add the bypass header

**Note:** Clerk webhooks don't natively support custom headers, so using the bypass requires additional setup (webhook proxy or Clerk webhook transformation).

### 2. Local Dev + Staging Setup

**Yes, you should set up staging before configuring webhooks.** Here's the recommended approach:

## Environment Setup Strategy

### Option A: Separate Environments (Recommended)

1. **Local Development**
   - Use `ngrok` or similar tunneling service
   - URL: `https://your-ngrok-url.ngrok.io/api/auth/webhook`
   - Configure in Clerk Dashboard for development/testing

2. **Staging Environment**
   - Create a separate Vercel project or use branch-based deployments
   - URL: `https://your-app-staging.vercel.app/api/auth/webhook`
   - Configure separate Clerk webhook endpoint for staging

3. **Production Environment**
   - URL: `https://your-app.vercel.app/api/auth/webhook`
   - Configure production Clerk webhook endpoint

### Option B: Branch-Based Deployments (Simpler)

1. **Local Development**: Use ngrok
2. **Staging**: Use Vercel preview deployments from `staging` branch
   - URL: `https://your-app-git-staging-yourteam.vercel.app/api/auth/webhook`
   - Note: Preview URLs change, so you'll need to update Clerk when deploying
3. **Production**: Use main branch deployment
   - URL: `https://your-app.vercel.app/api/auth/webhook`

## Step-by-Step Setup

### Step 1: Set Up Staging Environment

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Git
   - Configure branch-based deployments:
     - Production: `main` branch → `your-app.vercel.app`
     - Preview: `staging` branch → `your-app-git-staging.vercel.app`

2. **Or create separate Vercel project:**
   - Create new project: `your-app-staging`
   - Connect to same repo, use `staging` branch
   - Deploy to: `your-app-staging.vercel.app`

### Step 2: Configure Vercel Deployment Protection

#### For Production/Staging (Recommended: Disable Protection)

1. Go to Vercel Dashboard → Your Project → Settings → Deployment Protection
2. **Disable Password Protection** for production and staging
3. This allows webhooks to work without additional configuration

#### Alternative: Enable Protection Bypass (If you need protection)

1. Go to Vercel Dashboard → Your Project → Settings → Deployment Protection
2. Enable **"Protection Bypass for Automation"**
3. This creates `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable automatically
4. **Note:** Clerk doesn't support custom headers natively, so you'd need:
   - A webhook proxy service (like Zapier, Make.com, or custom)
   - Or modify Clerk webhook payload (requires Clerk Enterprise features)

### Step 3: Configure Clerk Webhooks

#### For Local Development

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your local server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   # This gives you: https://abc123.ngrok.io
   ```

4. **In Clerk Dashboard:**
   - Go to Webhooks → Add Endpoint
   - URL: `https://abc123.ngrok.io/api/auth/webhook`
   - Select events: `user.created`, `user.updated`, `user.deleted`, `organizationMembership.*`
   - Copy the signing secret to your `.env.local`:
     ```bash
     CLERK_WEBHOOK_SECRET=whsec_...
     ```

#### For Staging

1. **Get your staging URL:**
   - If using branch deployments: `https://your-app-git-staging.vercel.app`
   - If using separate project: `https://your-app-staging.vercel.app`

2. **In Clerk Dashboard:**
   - Create a separate webhook endpoint for staging
   - URL: `https://your-staging-url.vercel.app/api/auth/webhook`
   - Use staging environment's `CLERK_WEBHOOK_SECRET` in Vercel environment variables

3. **In Vercel Dashboard:**
   - Go to your staging project → Settings → Environment Variables
   - Add `CLERK_WEBHOOK_SECRET` with staging webhook secret

#### For Production

1. **In Clerk Dashboard:**
   - Create production webhook endpoint
   - URL: `https://your-app.vercel.app/api/auth/webhook`
   - Use production `CLERK_WEBHOOK_SECRET`

2. **In Vercel Dashboard:**
   - Add `CLERK_WEBHOOK_SECRET` to production environment variables

### Step 4: Test Webhooks

#### Test Local Development

1. Start local server + ngrok
2. Create a test user in Clerk
3. Check your local server logs for webhook events
4. Verify user appears in Supabase `users` table

#### Test Staging

1. Deploy to staging
2. Create test user in Clerk (using staging webhook endpoint)
3. Check Vercel function logs: Project → Deployments → Latest → Functions → `/api/auth/webhook`
4. Verify user in Supabase

#### Test Production

1. Deploy to production
2. Test with real user signup
3. Monitor Vercel logs and Supabase

## Environment Variables Checklist

### Local Development (`.env.local`)
```bash
CLERK_WEBHOOK_SECRET=whsec_... # From Clerk Dashboard (dev webhook)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Staging (Vercel Environment Variables)
```bash
CLERK_WEBHOOK_SECRET=whsec_... # From Clerk Dashboard (staging webhook)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VERCEL_ENV=preview # or staging
```

### Production (Vercel Environment Variables)
```bash
CLERK_WEBHOOK_SECRET=whsec_... # From Clerk Dashboard (production webhook)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VERCEL_ENV=production
```

## Troubleshooting

### Webhooks Not Working in Preview/Staging

**Issue:** Webhooks return 401/403 errors

**Solutions:**
1. **Check Deployment Protection:**
   - Vercel Dashboard → Settings → Deployment Protection
   - Disable password protection for the deployment

2. **Check Webhook URL:**
   - Verify the URL in Clerk Dashboard matches your deployment URL
   - Preview URLs change - update Clerk when deploying new preview

3. **Check Environment Variables:**
   - Verify `CLERK_WEBHOOK_SECRET` is set in Vercel
   - Verify it matches the secret from Clerk Dashboard

4. **Check Vercel Logs:**
   - Project → Deployments → Latest → Functions → `/api/auth/webhook`
   - Look for error messages

### Webhooks Not Working Locally

**Issue:** ngrok tunnel not receiving webhooks

**Solutions:**
1. **Verify ngrok is running:**
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/auth/webhook
   # Should return 400 (missing headers) not 404
   ```

2. **Update Clerk webhook URL:**
   - ngrok URLs change on restart
   - Update Clerk Dashboard with new ngrok URL

3. **Check local server is running:**
   ```bash
   curl http://localhost:3000/api/auth/webhook
   ```

## Recommended Workflow

1. **Set up staging environment first** (before configuring webhooks)
2. **Disable password protection** on production/staging (simplest approach)
3. **Use separate Clerk webhook endpoints** for each environment
4. **Test locally with ngrok** before deploying
5. **Monitor Vercel function logs** after deployment

## Security Notes

- **Never commit webhook secrets** to git
- **Use different secrets** for each environment
- **Rotate secrets** if compromised
- **Monitor webhook logs** for suspicious activity
- **Use Svix signature verification** (already implemented in webhook handler)

