# Authentication Feature Overview

## Architecture (2025 Best Practices)

The authentication system uses a **native integration approach** combining Clerk for authentication flow and Supabase for user data storage, following 2025 security best practices.

### Key Principles
- **✅ Native Third-Party Auth**: Clerk configured as auth provider in Supabase dashboard
- **✅ Uses Clerk's default JWT** (NO custom templates required)
- **✅ Anon key + RLS policies** instead of service role key for security
- **✅ Middleware optimization** to prevent auth() conflicts
- **✅ Seamless token integration** via native Supabase recognition
- **✅ Correct RLS syntax** using `auth.jwt() ->> 'sub'` for Clerk IDs

### 🚨 CRITICAL 2025 Setup

**MUST Configure Clerk as Third-Party Auth Provider:**

1. **Clerk Dashboard → Integrations → Supabase**
   - Activate Supabase integration
   - Copy your Clerk domain (e.g., `https://included-sawfly-62.clerk.accounts.dev`)

2. **Supabase Dashboard → Authentication → Sign In / Up**
   - Click "Add provider" → Select "Clerk"
   - Paste Clerk domain and save
   - Enable the provider

**Without this setup, authentication will fail with 401 errors!**

### Flow Diagram
```
User Registration/Login
        ↓
    Clerk Auth (Default JWT)
        ↓
   Supabase Native Recognition (Third-Party Auth)
        ↓
   Middleware (Pass userId to actions)
        ↓
   Server Actions (Use Clerk token + Anon key)
        ↓
   Supabase RLS (auth.jwt() ->> 'sub')
        ↓
    Secure Data Access
```

### ❌ DEPRECATED 2025 - Do NOT Use:
- **JWT Templates**: Old approach requiring custom Supabase configuration
- **Token Transformation**: Modern integration requires NO token modification
- **Service Role Keys**: Security risk - use RLS instead
- **Complex Auth Middleware**: Native integration eliminates complexity

## Critical Implementation Patterns

### 1. RLS Policy Configuration (CRITICAL)

**✅ CORRECT Pattern - Use for all tables:**
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Use auth.jwt() ->> 'sub' for Clerk authentication (works with native integration)
CREATE POLICY "Users can view their own records" ON table_name
  FOR SELECT TO authenticated 
  USING (clerk_id = (auth.jwt() ->> 'sub')::text);

CREATE POLICY "Users can update their own records" ON table_name
  FOR UPDATE TO authenticated 
  USING (clerk_id = (auth.jwt() ->> 'sub')::text)
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub')::text);

CREATE POLICY "Users can insert their own records" ON table_name
  FOR INSERT TO authenticated 
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub')::text);
```

**❌ INCORRECT Pattern - DO NOT USE:**
```sql
-- This causes UUID casting errors with Clerk IDs
USING (clerk_id = auth.uid()::text)  -- WRONG!

-- Clerk IDs are text format, not UUIDs
-- auth.uid() returns UUID, but Clerk uses text IDs
```

### 2. Organization-Scoped RLS Policies

For tables that belong to organizations (tasks, comments, etc.):

```sql
CREATE POLICY "Users can view data in their organizations" ON table_name
  FOR SELECT TO authenticated 
  USING (
    organization_id IN (
      SELECT m.organization_id FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE u.clerk_id = (auth.jwt() ->> 'sub')::text
    )
  );
```

### 3. Polymorphic Relationship Handling

For tables with polymorphic relationships (like comments that can belong to tasks OR kb_articles):

**❌ AVOID automatic joins that PostgREST can't resolve:**
```typescript
// This will fail because PostgREST can't detect the polymorphic relationship
const { data } = await supabase
  .from('tasks')
  .select('*, comments:comments(count)')  // FAILS!
```

**✅ Use manual queries instead:**
```typescript
// Get tasks first
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', orgId)

// Then get comment counts separately
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

## Implementation Details

### 1. Clerk Configuration
- **Location**: `apps/web/middleware.ts`
- **Purpose**: Route protection and optimized authentication middleware
- **Key Features**:
  - **Single `auth()` call per request** to prevent conflicts
  - Passes `userId` to actions to avoid double authentication
  - **Simplified onboarding checks** - removed from middleware to prevent recursion
  - Error handling for auth edge cases

**✅ Optimized Middleware Pattern:**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // Protect routes without calling additional auth() functions
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL('/login', req.url)
    return Response.redirect(signInUrl)
  }
  
  // Let individual pages handle onboarding checks
  // Don't call server actions from middleware to avoid recursion
})
```

### 2. Supabase Integration (2025 Native Approach)
- **Location**: `apps/web/lib/supabase.ts` and `apps/web/actions/auth/user-actions.ts`
- **Purpose**: Secure user data management using native Clerk integration
- **Architecture**:
  - **Native Third-Party Auth**: Supabase recognizes Clerk tokens automatically
  - **Server Actions**: Handle all business logic with seamless token flow
  - **RLS Policies**: Use `auth.jwt() ->> 'sub'` with native token recognition
  - **Anon Key**: Used with proper RLS (no service role key needed)
  
### 3. Token Authentication Flow (2025 Simplified)
- **Native Integration**: Supabase automatically recognizes Clerk tokens after setup
- **Default JWT**: Uses Clerk's standard token (NO templates required)
- **Seamless Flow**: Token validation happens automatically in Supabase
- **Security**: Users can only access their own data via RLS policies

### 4. Common Error Patterns & Solutions

#### UUID Type Errors
**Problem**: `invalid input syntax for type uuid: user_2y2JrUjKBbV7gXXt5g1Yz7sXfsF`

**Cause**: Using `auth.uid()` instead of `auth.jwt() ->> 'sub'` in RLS policies

**Solution**: Update all RLS policies to use `auth.jwt() ->> 'sub'`

#### Relationship Errors  
**Problem**: `Could not find a relationship between 'table1' and 'table2'`

**Cause**: Polymorphic relationships that PostgREST can't auto-detect

**Solution**: Use manual queries instead of automatic joins

#### Middleware Recursion
**Problem**: `auth() was called but Clerk can't detect usage of clerkMiddleware()`

**Cause**: Calling server actions from middleware that use `auth()` again

**Solution**: Simplify middleware, move business logic to page components

## Database Schema & Security

### Users Table
```sql
-- Supabase users table with onboarding support
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,  -- Clerk IDs are TEXT, not UUID
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policies (2025 Native Integration)
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CORRECT: Use auth.jwt() ->> 'sub' for native Clerk integration
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT TO authenticated 
  USING (clerk_id = (auth.jwt() ->> 'sub')::text);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE TO authenticated 
  USING (clerk_id = (auth.jwt() ->> 'sub')::text)
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub')::text);

CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT TO authenticated 
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub')::text);
```

### Organization-Scoped Tables
```sql
-- Example: Tasks table with organization isolation
CREATE POLICY "Users can view tasks in their organizations" ON tasks
  FOR SELECT TO authenticated 
  USING (
    organization_id IN (
      SELECT m.organization_id FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE u.clerk_id = (auth.jwt() ->> 'sub')::text
    )
  );
```

### Secure Database Functions
```sql
-- SECURITY DEFINER function for webhook user creation
CREATE OR REPLACE FUNCTION create_user_from_webhook(
  p_clerk_id TEXT,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS TABLE(result users) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO users (clerk_id, email, first_name, last_name, avatar_url)
  VALUES (p_clerk_id, p_email, p_first_name, p_last_name, p_avatar_url)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Environment Variables
```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Using Anon Key + RLS - Secure!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (ANON key, NOT service role)

# Webhooks
CLERK_WEBHOOK_SECRET=whsec_...

# Note: NO service role key needed - using native integration + RLS
# Note: NO JWT template configuration needed - using native third-party auth
```

## Testing Strategy
- **Unit Tests**: Server action logic and RLS policy validation
- **Integration Tests**: Native Clerk + Supabase flow with real tokens
- **E2E Tests**: Complete authentication journey including onboarding
- **Security Tests**: RLS enforcement, native token validation, unauthorized access prevention
- **Performance Tests**: Middleware efficiency, native integration performance

## Performance Considerations
- **Optimized Middleware**: Single `auth()` call per request
- **Native Integration**: Eliminates token transformation overhead
- **Database Queries**: Efficient RLS-optimized queries with proper indexes
- **Route Protection**: Minimal authentication overhead
- **Manual Joins**: For polymorphic relationships to avoid PostgREST limitations

## Security Measures (2025 Standards)
- **RLS-First Architecture**: All data access controlled by row-level security
- **Native Token Validation**: Supabase validates Clerk JWTs automatically via third-party auth
- **No Service Role Key**: Uses anon key + proper RLS configuration
- **Middleware Optimization**: Prevents auth() conflicts and timing issues
- **Third-Party Auth Setup**: Secure integration through Supabase dashboard configuration
- **Input Validation**: All user inputs validated and sanitized
- **Correct RLS Syntax**: Uses `auth.jwt() ->> 'sub'` for native Clerk compatibility

## Troubleshooting Common Issues

### 1. 401 Authentication Errors
```
Error: Authentication failed - unauthorized access
```
**Most Common Cause**: Clerk not configured as third-party auth provider in Supabase

**Fix**: Follow the critical setup steps above to configure Clerk in Supabase dashboard

### 2. UUID Type Errors
```
Error: invalid input syntax for type uuid: user_2y2JrUjKBbV7gXXt5g1Yz7sXfsF
```
**Fix**: Update RLS policies to use `auth.jwt() ->> 'sub'` instead of `auth.uid()`

### 3. PostgREST Relationship Errors
```
Error: Could not find a relationship between 'tasks' and 'comments'
```
**Fix**: Use manual queries for polymorphic relationships instead of automatic joins

### 4. Middleware Auth Conflicts
```
Error: auth() was called but Clerk can't detect usage of clerkMiddleware()
```
**Fix**: Remove server action calls from middleware, simplify to basic route protection

## Migration from Old Patterns

If upgrading from older authentication patterns:

### ❌ Remove These Deprecated Patterns:
1. **JWT Templates**: Remove any custom Supabase JWT template configurations
2. **Service Role Key Usage**: Replace with anon key + RLS
3. **Token Transformation Logic**: Remove custom token modification code
4. **Complex Auth Middleware**: Simplify to native integration approach

### ✅ Implement These 2025 Patterns:
1. **Configure Third-Party Auth**: Set up Clerk as auth provider in Supabase dashboard
2. **Use Default Tokens**: Leverage Clerk's standard JWT without modification
3. **Centralize Business Logic**: Move all logic to server actions (remove from `lib/supabase.ts`)
4. **Update ALL RLS Policies**: Use `auth.jwt() ->> 'sub'` instead of `auth.uid()`
5. **Optimize Middleware**: Pass userId to actions instead of multiple auth() calls
6. **Fix Polymorphic Queries**: Use manual joins instead of automatic relations
7. **Test Native Integration**: Verify authentication works with real Clerk tokens

## Deployment Checklist

- [ ] ✅ Clerk configured as third-party auth provider in Supabase dashboard
- [ ] ✅ All RLS policies use `auth.jwt() ->> 'sub'` syntax
- [ ] ✅ Middleware calls `auth()` only once per request
- [ ] ✅ No JWT template configurations (using native approach)
- [ ] ✅ No service role key usage (anon key + RLS only)
- [ ] ✅ Webhook endpoints are properly secured
- [ ] ✅ Environment variables are correctly configured
- [ ] ✅ Database functions use SECURITY DEFINER appropriately
- [ ] ✅ All polymorphic relationships use manual queries
- [ ] ✅ User creation webhook is tested end-to-end
- [ ] ✅ Onboarding flow redirects work correctly
- [ ] ✅ RLS policies tested with real Clerk tokens via native integration 