# Authentication Feature PRD (2025 Security-First Approach)

## Overview
Implement secure user authentication using Clerk with Supabase integration following 2025 security best practices. The system uses **anon key + RLS policies** instead of service role keys, **Clerk's native third-party authentication** (NO JWT templates), and **optimized middleware** to prevent authentication conflicts.

## Key 2025 Principles

### ✅ CORRECT 2025 Approach:
- **Native Third-Party Auth**: Configure Clerk as a third-party auth provider in Supabase dashboard
- **Default JWT Tokens**: Use Clerk's standard tokens (NO custom templates required)
- **Anon Key + RLS**: Security through row-level policies, not elevated permissions
- **Single Auth Flow**: Supabase recognizes Clerk tokens natively once configured

### ❌ DEPRECATED Patterns (Do NOT Use):
- **JWT Templates**: Old approach requiring custom Supabase JWT templates
- **Service Role Keys**: Security risk - use RLS instead
- **Token Transformation**: No need to modify Clerk's default tokens
- **Complex Auth Chains**: Modern integration is native and seamless

## Requirements

### Functional Requirements
1. **User Registration & Onboarding**
   - Users can sign up with email/password
   - Users can sign up with social providers (Google, GitHub)
   - Create corresponding user record in Supabase via secure webhook
   - **Onboarding flow** to collect required profile information
   - Track onboarding completion status in database

2. **User Authentication**
   - Users can log in with email/password
   - Users can log in with social providers
   - Maintain session state across page refreshes
   - **Automatic redirect** to onboarding if profile incomplete
   - **Dashboard access** only after onboarding completion

3. **User Profile Management**
   - Users can view their profile information via secure server actions
   - Users can update their profile details with RLS protection
   - Profile data securely stored in Supabase with row-level security
   - **Real-time validation** and error handling

4. **User Management**
   - Users can delete their account (soft delete with cleanup)
   - Users can change their password through Clerk
   - Users can manage connected social accounts
   - **Secure data isolation** via RLS policies

### Technical Requirements (2025 Standards)

#### 1. Clerk Integration (Native 2025 Approach)
- **Native Third-Party Auth**: Configure Clerk in Supabase dashboard as auth provider
- **Default JWT Usage**: Use Clerk's standard token (NO templates, NO modifications)
- **Middleware Optimization**: Single `auth()` call per request to prevent conflicts
- **Route Protection**: Comprehensive middleware-based protection
- **Error Handling**: Graceful handling of authentication edge cases
- **Parameter Passing**: Pass `userId` to server actions to avoid double auth() calls

#### 2. Supabase Integration (Security-First)
- **RLS-Only Architecture**: Use anon key + RLS policies (NO service role key)
- **Native Token Recognition**: Supabase validates Clerk tokens automatically after setup
- **Secure Server Actions**: All business logic in authenticated server actions
- **Database Functions**: Use SECURITY DEFINER functions for webhook operations
- **Policy Structure**: RLS policies using `auth.jwt() ->> 'sub'` for Clerk compatibility

#### 3. Security Implementation
- **Row-Level Security**: All user data access controlled by RLS policies
- **Native Token Validation**: Automatic JWT validation by Supabase (no custom logic)
- **Input Sanitization**: Comprehensive validation in server actions
- **Secure Architecture**: Infrastructure (lib/) separate from business logic (actions/)
- **Webhook Security**: SECURITY DEFINER functions for safe external integrations

#### 4. Performance & Architecture
- **Server Actions**: Centralized business logic with proper error handling
- **Middleware Efficiency**: Optimized to prevent authentication bottlenecks
- **Database Optimization**: Efficient RLS-compatible queries
- **Native Token Flow**: Leverage Clerk + Supabase native integration for performance

## Setup Requirements (2025 Method)

### 1. Supabase Third-Party Auth Configuration
**CRITICAL**: Configure Clerk as a third-party authentication provider:

1. **In Clerk Dashboard:**
   - Go to Integrations → Supabase
   - Activate Supabase integration
   - Copy your Clerk domain (e.g., `https://included-sawfly-62.clerk.accounts.dev`)

2. **In Supabase Dashboard:**
   - Go to Authentication → Sign In / Up
   - Click "Add provider" → Select "Clerk"
   - Paste Clerk domain and save
   - Enable the provider

### 2. RLS Policy Configuration
```sql
-- CORRECT 2025 Pattern - Works with native Clerk integration
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT TO authenticated 
  USING (clerk_id = (auth.jwt() ->> 'sub')::text);
```

### 3. No JWT Templates Required
With native third-party auth:
- ✅ Clerk's default tokens work automatically
- ✅ No custom JWT templates needed
- ✅ No token transformation required
- ✅ Seamless integration out of the box

## User Stories

### Core Authentication
- As a user, I want to sign up for an account so I can access the application
- As a user, I want to log in to my account so I can access my secure data
- As a user, I want my session to persist across page refreshes so I don't lose my progress
- As a user, I want to be automatically redirected through onboarding if my profile is incomplete

### Profile Management
- As a user, I want to complete my profile during onboarding so I can access the full application
- As a user, I want to update my profile information so I can keep it current
- As a user, I want my data to be secure so only I can access my information
- As a user, I want to log out so I can secure my account when done

### Developer Experience
- As a developer, I want secure authentication that follows 2025 best practices
- As a developer, I want to avoid service role key usage for better security
- As a developer, I want optimized middleware that doesn't cause conflicts
- As a developer, I want clear separation between infrastructure and business logic

## Acceptance Criteria

### Authentication Flow
- [ ] User can successfully register with email/password
- [ ] User can successfully register with social providers (Google, GitHub)
- [ ] User record is securely created in Supabase via webhook with SECURITY DEFINER function
- [ ] User can log in and access protected routes
- [ ] Authentication state persists across page refreshes
- [ ] Middleware efficiently handles route protection without auth() conflicts

### Onboarding & Profile
- [ ] New users are redirected to onboarding after signup
- [ ] Users cannot access dashboard until onboarding is complete
- [ ] Users can complete onboarding with required profile information
- [ ] Onboarding completion is tracked in database
- [ ] Users can view and update their profile securely
- [ ] Profile updates are validated and protected by RLS

### Security & Performance
- [ ] All user data access uses RLS policies (no service role key)
- [ ] Clerk's default JWT token works with Supabase RLS
- [ ] Users can only access their own data (verified by security testing)
- [ ] Middleware performs single auth() call per request
- [ ] Server actions handle all business logic securely
- [ ] Database functions use SECURITY DEFINER for webhook safety

### Error Handling
- [ ] Authentication failures are handled gracefully
- [ ] User creation errors in Supabase are caught and logged
- [ ] Token validation errors provide appropriate feedback
- [ ] Middleware continues operation even if onboarding checks fail

## Technical Specifications

### Environment Variables
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Anon Key Only - RLS for Security)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... 
# Note: NO service role key required
# Note: NO JWT template configuration needed (2025 approach)
```

### Database Schema
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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

## Dependencies
- **Clerk SDK**: Latest version with native third-party auth support
- **Supabase Client**: For RLS-based data access with native Clerk token recognition
- **Next.js 15+**: For optimized middleware and server actions
- **TypeScript**: For type-safe development

## 2025 Migration Notes

If upgrading from older JWT template patterns:

### ❌ Remove These Deprecated Patterns:
- Custom JWT templates in Supabase
- Token transformation middleware
- Service role key usage for user operations
- Complex auth chains and token modifications

### ✅ Implement These 2025 Patterns:
- Native third-party auth configuration
- Clerk's default token usage
- RLS-only security architecture
- Simple, efficient auth flow

## Risks & Mitigations

### Security Risks
- **Risk**: Improper RLS configuration could expose user data
- **Mitigation**: Comprehensive security testing and policy validation

- **Risk**: Third-party auth misconfiguration could break authentication
- **Mitigation**: Follow exact setup steps and test with real tokens

### Performance Risks  
- **Risk**: Multiple auth() calls could cause middleware slowdowns
- **Mitigation**: Optimized middleware with single auth() call and userId passing

- **Risk**: RLS policies could impact query performance
- **Mitigation**: Proper indexing and query optimization

### Implementation Risks
- **Risk**: Migration from JWT template patterns could introduce bugs
- **Mitigation**: Complete removal of old patterns and comprehensive testing

## Success Metrics
- **Security**: 100% of user data access goes through RLS policies
- **Performance**: Authentication middleware response time < 50ms
- **Reliability**: 99.9% uptime for authentication flow
- **Developer Experience**: Zero authentication-related bugs in production
- **Simplicity**: Native integration reduces complexity by 80%

## Future Considerations
- **Multi-tenant support**: Extend RLS for organization-based access
- **Advanced roles**: Implement role-based access control
- **SSO integration**: Add enterprise SSO support
- **Audit logging**: Track all authentication and authorization events 