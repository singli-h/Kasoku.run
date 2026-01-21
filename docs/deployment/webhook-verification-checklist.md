# Clerk Webhook Verification Checklist

Since Vercel and Clerk webhook endpoint are already configured, here's what's left to verify and test:

## ✅ Pre-Deployment Verification

### 1. Environment Variables in Vercel
Verify these are set in Vercel Dashboard → Settings → Environment Variables for **staging**:

- [ ] `CLERK_WEBHOOK_SECRET` - Must match the secret from Clerk Dashboard webhook endpoint
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for dev Supabase instance
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Dev Supabase URL (e.g., `https://hggincgdjwqgaezmwzhy.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Dev Supabase anon key

**How to verify:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Filter by "Staging" or "Preview" environment
3. Ensure all variables above are present

### 2. Deployment Protection
- [ ] Password protection is **disabled** for staging deployments
  - Vercel Dashboard → Settings → Deployment Protection
  - Ensure "Password Protection" is OFF for staging/preview

### 3. Clerk Webhook Configuration
Verify in Clerk Dashboard:

- [ ] Webhook endpoint URL: `https://staging.kasoku.run/api/auth/webhook`
- [ ] Events selected:
  - `user.created`
  - `user.updated`
  - `user.deleted`
  - `organizationMembership.created`
  - `organizationMembership.updated`
  - `organizationMembership.deleted`
- [ ] Webhook is **active/enabled**
- [ ] Copy the signing secret (should match `CLERK_WEBHOOK_SECRET` in Vercel)

## 🧪 Testing Checklist

### Test 1: Verify Webhook Endpoint is Accessible
```bash
# Test if endpoint responds (should return 400 - missing headers, not 404)
curl -X POST https://staging.kasoku.run/api/auth/webhook
# Expected: 400 Bad Request (missing Svix headers) - this is GOOD!
```

### Test 2: Create Test User
1. Go to Clerk Dashboard → Users → Create User
2. Create a test user with email (e.g., `test-webhook@example.com`)
3. Check Vercel logs:
   - Vercel Dashboard → Deployments → Latest → Functions → `/api/auth/webhook`
   - Look for: `[webhook:xxx] Received event: user.created`
   - Look for: `[handleUserCreated] User synced in database: test-webhook@example.com`

### Test 3: Verify User in Supabase
1. Go to Supabase Dashboard → Table Editor → `users` table
2. Search for the test user by email
3. Verify:
   - User exists with correct `clerk_id`
   - Email matches
   - `onboarding_completed` is `false`
   - `role` is `athlete` (default)

### Test 4: Test User Update
1. In Clerk Dashboard, update the test user's name
2. Check Vercel logs for `user.updated` event
3. Verify in Supabase that the user's `first_name`/`last_name` updated

### Test 5: Test Organization Membership (if applicable)
1. Create an organization in Clerk
2. Add the test user to the organization
3. Check Vercel logs for `organizationMembership.created`
4. Verify in Supabase `memberships` table

## 🔍 Troubleshooting

### If webhooks aren't working:

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions → `/api/auth/webhook`
   - Look for error messages

2. **Common Issues:**
   - ❌ "CLERK_WEBHOOK_SECRET is not configured" → Add env var in Vercel
   - ❌ "Error occurred -- invalid signature" → Secret mismatch, check Clerk Dashboard
   - ❌ "Error occurred -- no svix headers" → Webhook URL might be wrong or protection blocking
   - ❌ 401/403 errors → Password protection might be enabled

3. **Verify Webhook Secret Match:**
   - Clerk Dashboard → Webhooks → Your endpoint → Copy signing secret
   - Vercel Dashboard → Environment Variables → `CLERK_WEBHOOK_SECRET`
   - They must match exactly

4. **Test Webhook Manually:**
   - Clerk Dashboard → Webhooks → Your endpoint → "Send test event"
   - Check Vercel logs to see if it arrives

## 📝 Next Steps After Verification

Once everything is working:

1. **Monitor First Real Signups:**
   - Watch Vercel logs during actual user signups
   - Verify users appear in Supabase immediately

2. **Test Onboarding Flow:**
   - Complete onboarding for a test user
   - Verify `onboarding_completed` updates in Supabase

3. **Set Up Production:**
   - Repeat same setup for production environment
   - Use production Supabase instance
   - Configure production Clerk webhook endpoint

## 🎯 Success Criteria

✅ Webhook endpoint responds (400 for missing headers is correct)  
✅ Test user creation triggers webhook  
✅ User appears in Supabase `users` table  
✅ User updates sync to Supabase  
✅ No errors in Vercel function logs  
✅ Organization memberships sync (if applicable)

