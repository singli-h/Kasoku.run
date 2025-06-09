# Clerk + Supabase Authentication Troubleshooting Guide (2025)

This guide covers common authentication and database issues encountered when integrating Clerk with Supabase using the **2025 native third-party authentication approach**.

## 🚨 Most Common Issue: 401 Authentication Errors

### 1. Authentication Failure (Primary Cause of 401s)

**Error Message:**
```
error: Authentication failed - unauthorized access
error: JWT claims missing or invalid
error: 401 Unauthorized
```

**Root Cause:**
Clerk is **NOT configured as a third-party authentication provider** in your Supabase project. This is the most common issue and the first thing to check.

**Solution (CRITICAL 2025 Setup):**

1. **In Clerk Dashboard:**
   - Go to **Integrations → Supabase**
   - Click **"Activate Supabase integration"**
   - Copy your **Clerk domain** (e.g., `https://included-sawfly-62.clerk.accounts.dev`)

2. **In Supabase Dashboard:**
   - Go to **Authentication → Sign In / Up**
   - Click **"Add provider"** → Select **"Clerk"**
   - Paste the Clerk domain and save
   - **Enable the provider**

3. **Verify the Setup:**
   - Check that Clerk appears as an enabled provider in Supabase
   - Test with a real Clerk token to confirm authentication works

**Why This Matters:**
- Without this setup, Supabase doesn't recognize Clerk JWT tokens
- Your RLS policies will fail because `auth.jwt()` returns null
- All database operations will result in 401 errors

### 2. Incorrect Environment Configuration

**Check Your Environment Variables:**
```env
# ✅ REQUIRED for 2025 approach
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... 

# ❌ NOT NEEDED for 2025 approach
# No JWT template configurations required
# No service role key needed
```

## Other Common Error Patterns & Solutions

### 3. UUID Type Casting Errors

**Error Message:**
```
error: invalid input syntax for type uuid: "user_2y2JrUjKBbV7gXXt5g1Yz7sXfsF"
```

**Root Cause:**
RLS policies are using `auth.uid()` instead of `auth.jwt() ->> 'sub'`. Clerk user IDs are text format (e.g., `user_2y2JrUjKBbV7gXXt5g1Yz7sXfsF`), but `auth.uid()` expects UUID format.

**Solution:**
Update ALL RLS policies to use the correct 2025 syntax:

```sql
-- ❌ WRONG - Causes UUID casting errors (old pattern)
CREATE POLICY "Users can view their data" ON table_name
  USING (user_id = auth.uid());

-- ✅ CORRECT - Works with 2025 native Clerk integration
CREATE POLICY "Users can view their data" ON table_name
  USING (clerk_id = (auth.jwt() ->> 'sub')::text);
```

**Tables to Check:**
- users
- memberships
- tasks
- conversations
- chat_messages
- organizations (if user-scoped)
- user_memories
- organization_memories
- user_roles
- events
- external_refs
- kb_articles
- kb_embeddings
- comments

### 4. PostgREST Relationship Errors

**Error Message:**
```
error: Could not find a relationship between 'tasks' and 'comments'
```

**Root Cause:**
Polymorphic relationships where one table can reference multiple entity types. PostgREST cannot automatically detect foreign key relationships in polymorphic scenarios.

**Solution:**
Use manual queries instead of automatic joins:

```typescript
// ❌ WRONG - Automatic join fails on polymorphic relationships
const { data } = await supabase
  .from('tasks')
  .select('*, comments:comments(count)')  // FAILS!

// ✅ CORRECT - Manual queries (2025 approach)
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', orgId)

const commentCounts = await Promise.all(
  tasks.map(async (task) => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'task')
      .eq('entity_id', task.id)
      .eq('is_deleted', false)
    
    return { taskId: task.id, commentCount: count || 0 }
  })
)
```

### 5. Middleware Authentication Conflicts

**Error Message:**
```
error: auth() was called but Clerk can't detect usage of clerkMiddleware()
```

**Root Cause:**
Recursive `auth()` calls where middleware calls server actions that also call `auth()`.

**Solution:**
Simplify middleware to avoid calling server actions (2025 best practice):

```typescript
// ❌ WRONG - Calls server actions from middleware (old pattern)
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // This causes recursion!
  const result = await checkUserNeedsOnboardingAction()
})

// ✅ CORRECT - Simple middleware (2025 approach)
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  if (!isPublicRoute(req) && !userId) {
    return Response.redirect(new URL('/login', req.url))
  }
  
  // Let pages handle business logic, not middleware
})
```

### 6. RLS Policy Blocking Access

**Error Message:**
```
error: new row violates row-level security policy
```

**Root Cause:**
Either incorrect RLS policy syntax or user doesn't exist in the database yet.

**Solutions:**

1. **Check RLS Policy Syntax (2025 Pattern):**
```sql
-- Ensure using correct Clerk authentication with native integration
WHERE clerk_id = (auth.jwt() ->> 'sub')::text
```

2. **Verify User Exists:**
```typescript
// Check if user exists in database
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_id', userId)
  .single()

if (!user) {
  // User doesn't exist - webhook may have failed
  console.error('User not found in database')
}
```

3. **Check Webhook Configuration:**
```typescript
// Verify webhook secret is set
if (!process.env.CLERK_WEBHOOK_SECRET) {
  console.error('CLERK_WEBHOOK_SECRET not configured')
}
```

## Diagnostic Steps (2025 Approach)

### 1. Verify Third-Party Auth Setup (FIRST STEP)

**Check Supabase Dashboard:**
1. Go to Authentication → Sign In / Up
2. Verify Clerk appears as an enabled third-party provider
3. Check that the Clerk domain is correctly configured

**Test with SQL:**
```sql
-- This should return valid JWT claims when authenticated
SELECT current_setting('request.jwt.claims', true);

-- This should return your Clerk user ID
SELECT auth.jwt() ->> 'sub';
```

### 2. Verify Environment Variables

```bash
# Required for 2025 native approach
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# NOT needed for 2025 approach
# No JWT template configurations
# No service role key
```

### 3. Test Native Integration

Create a simple test to verify the integration:
```typescript
export async function testNativeIntegrationAction() {
  const { userId } = await auth()
  
  if (!userId) {
    return { error: "Not authenticated with Clerk" }
  }
  
  const supabase = createServerSupabaseClient()
  
  // Test if Supabase recognizes the Clerk token
  const { data, error } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('clerk_id', userId)
    .single()
  
  return {
    clerkUserId: userId,
    supabaseRecognition: !error,
    error: error?.message
  }
}
```

### 4. Verify RLS Policies

Test policies directly in Supabase SQL Editor:
```sql
-- Test user lookup with actual Clerk ID
SELECT * FROM users WHERE clerk_id = 'user_2y2JrUjKBbV7gXXt5g1Yz7sXfsF';

-- Test that JWT contains expected claims
SELECT 
  auth.jwt() ->> 'sub' as clerk_user_id,
  auth.jwt() ->> 'iss' as issuer,
  auth.jwt() ->> 'aud' as audience;
```

## 2025 Migration Checklist

If upgrading from older authentication patterns:

### ❌ Remove These Deprecated Patterns:
- [ ] Custom JWT templates in Supabase
- [ ] Service role key usage for user operations  
- [ ] Token transformation middleware
- [ ] Complex auth chains and token modifications
- [ ] Custom authentication logic in `lib/supabase.ts`

### ✅ Implement These 2025 Patterns:
- [ ] **Configure Clerk as third-party auth provider** (CRITICAL)
- [ ] Use Clerk's default tokens without modification
- [ ] Update ALL RLS policies to use `auth.jwt() ->> 'sub'`
- [ ] Simplify middleware to basic route protection
- [ ] Move business logic to server actions
- [ ] Use anon key + RLS instead of service role key
- [ ] Test with real Clerk tokens via native integration

## Prevention Checklist

- [ ] ✅ **Clerk configured as third-party auth provider** (MOST IMPORTANT)
- [ ] ✅ All RLS policies use `auth.jwt() ->> 'sub'` syntax
- [ ] ✅ No JWT template configurations (using native approach)
- [ ] ✅ No service role key usage (anon key + RLS only)
- [ ] ✅ Middleware doesn't call server actions
- [ ] ✅ Polymorphic relationships use manual queries
- [ ] ✅ Webhook endpoint is properly secured and tested
- [ ] ✅ Environment variables correctly configured for 2025 approach
- [ ] ✅ User creation webhook works end-to-end
- [ ] ✅ Token passing works in server actions
- [ ] ✅ Database functions use SECURITY DEFINER appropriately

## Testing Recommendations

1. **Test Third-Party Auth Setup**: Verify Clerk appears as enabled provider in Supabase
2. **Test with Real Clerk Tokens**: Always test RLS policies with actual JWT tokens 
3. **Test Webhook Flow**: Verify user creation works end-to-end from Clerk to Supabase
4. **Test Edge Cases**: Handle scenarios where users don't exist in database
5. **Monitor Integration**: Watch both Clerk and Supabase logs for authentication issues
6. **Validate Native Flow**: Ensure no custom token transformation is happening

## Additional Resources

- [Clerk + Supabase Native Integration (2025)](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth Documentation](https://supabase.com/docs/guides/auth/third-party-auth)
- [PostgREST Foreign Key Relationships](https://postgrest.org/en/v11/references/api/tables_views.html#embedded-filters)

## Quick Fix for 401 Errors

**If you're getting 401 errors, follow these steps in order:**

1. ✅ **Configure Clerk in Supabase Dashboard** (Authentication → Sign In / Up → Add Clerk provider)
2. ✅ **Verify environment variables** are correct
3. ✅ **Check RLS policies** use `auth.jwt() ->> 'sub'`
4. ✅ **Test with real tokens** to confirm integration works
5. ✅ **Remove any JWT template configurations** (not needed in 2025) 