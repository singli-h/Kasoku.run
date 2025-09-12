# 🔐 Clerk Authentication Integration

This document details the Clerk authentication integration in the Kasoku application, including setup, usage patterns, and best practices for secure user authentication and authorization.

## 📋 Overview

Clerk provides comprehensive authentication and user management for the Kasoku application, handling user registration, login, session management, and integration with Supabase for database access control.

## 🛠️ Configuration

### Environment Variables
```bash
# Required for Clerk integration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Provider Setup
```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: 'hsl(221.2 83.2% 53.3%)',
          colorBackground: 'hsl(0 0% 100%)',
          colorInputBackground: 'hsl(0 0% 100%)',
          colorText: 'hsl(222.2 84% 4.9%)'
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## 🔧 Authentication Hooks

### useAuth()
Provides authentication state and user information:
```typescript
'use client'

import { useAuth } from '@clerk/nextjs'

export function AuthComponent() {
  const { isLoaded, userId, sessionId, getToken } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!userId) {
    return <div>Please sign in</div>
  }

  return <div>Welcome, user {userId}!</div>
}
```

### useUser()
Provides detailed user information and metadata:
```typescript
'use client'

import { useUser } from '@clerk/nextjs'

export function UserProfile() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>{user?.firstName} {user?.lastName}</h1>
      <p>{user?.primaryEmailAddress?.emailAddress}</p>
      <img src={user?.imageUrl} alt="Profile" />
    </div>
  )
}
```

## 🖥️ Server-Side Authentication

### auth() Helper
Used in Server Components and Server Actions:
```typescript
// Server Component
import { auth } from '@clerk/nextjs/server'

export default function ProtectedPage() {
  const { userId } = auth()

  if (!userId) {
    return <div>Please sign in</div>
  }

  return <div>Welcome, authenticated user!</div>
}
```

### currentUser() Helper
Provides complete user object on the server:
```typescript
import { currentUser } from '@clerk/nextjs/server'

export async function getUserData() {
  const user = await currentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName
  }
}
```

## 🔑 Supabase Integration

### Token Exchange Pattern
Clerk JWT tokens are used to authenticate with Supabase:
```typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function createServerSupabaseClient() {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )
}
```

### Client-Side Supabase Client
For client components with token fetching:
```typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

export function useSupabaseClient() {
  const { getToken } = useAuth()

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])
}
```

## 🛡️ Protected Routes

### Middleware Protection
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/settings(.*)',
  '/plans(.*)',
  '/sessions(.*)',
  '/athletes(.*)',
  '/performance(.*)',
  '/workout(.*)',
  '/library(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})
```

### Component-Level Protection
```typescript
// components/protected-route.tsx
'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!userId) {
    return null
  }

  return <>{children}</>
}
```

## 🎯 User Onboarding Flow

### Onboarding Middleware
```typescript
// middleware.ts - Extended
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()

    // Check if user needs onboarding
    const { userId } = auth()
    const user = await getUserFromSupabase(userId)

    if (!user?.onboarding_completed) {
      const onboardingUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }
})
```

### Onboarding Completion
```typescript
// Server Action
'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function completeOnboardingAction(formData: FormData) {
  const { userId } = auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Save onboarding data to Supabase
  await saveOnboardingData(userId, formData)

  // Mark onboarding as complete
  await updateUserOnboardingStatus(userId, true)

  redirect('/dashboard')
}
```

## 🔐 Security Best Practices

### Token Management
- **JWT Templates**: Use custom JWT templates for Supabase integration
- **Token Refresh**: Automatic token refresh handled by Clerk
- **Token Scoping**: Limit token permissions to necessary resources

### Session Security
- **Session Timeout**: Configure appropriate session timeouts
- **Secure Cookies**: Use secure, httpOnly cookies for session storage
- **CSRF Protection**: Built-in CSRF protection for forms

### Authorization Patterns
```typescript
// Role-based access control
export async function requireRole(requiredRole: 'athlete' | 'coach') {
  const { userId } = auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const userRole = await getUserRole(userId)

  if (userRole !== requiredRole) {
    throw new Error('Insufficient permissions')
  }

  return userId
}
```

## 🎨 UI Components

### Sign-In/Sign-Up Components
```typescript
// components/auth/sign-in-button.tsx
'use client'

import { SignInButton, useUser } from '@clerk/nextjs'

export function SignInButtonComponent() {
  const { user } = useUser()

  if (user) {
    return <div>Welcome, {user.firstName}!</div>
  }

  return (
    <SignInButton mode="modal">
      <button className="btn-primary">Sign In</button>
    </SignInButton>
  )
}
```

### User Menu Component
```typescript
// components/auth/user-menu.tsx
'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export function UserMenu() {
  const { user } = useUser()

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8'
        }
      }}
      userProfileMode="modal"
      userProfileUrl="/settings"
      afterSignOutUrl="/"
    />
  )
}
```

## 🔧 Development & Testing

### Mock Authentication (Development)
```typescript
// lib/auth-mock.ts
export const mockAuth = {
  userId: 'mock-user-id',
  sessionId: 'mock-session-id',
  getToken: async () => 'mock-jwt-token'
}
```

### Testing Authentication
```typescript
// __tests__/auth.test.ts
import { render, screen } from '@testing-library/react'
import { ClerkProvider } from '@clerk/nextjs'
import { ProtectedComponent } from '@/components/protected-component'

const mockAuth = {
  userId: 'test-user-id',
  sessionId: 'test-session-id'
}

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockAuth,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

test('renders protected content when authenticated', () => {
  render(
    <ClerkProvider publishableKey="test-key">
      <ProtectedComponent />
    </ClerkProvider>
  )

  expect(screen.getByText('Protected Content')).toBeInTheDocument()
})
```

## 📊 Monitoring & Analytics

### Authentication Events
```typescript
// lib/auth-events.ts
import { useAuth } from '@clerk/nextjs'

export function useAuthTracking() {
  const { userId, sessionId } = useAuth()

  // Track authentication events
  useEffect(() => {
    if (userId) {
      posthog.capture('user_authenticated', {
        userId,
        sessionId,
        timestamp: new Date().toISOString()
      })
    }
  }, [userId, sessionId])
}
```

### Error Tracking
```typescript
// lib/auth-errors.ts
import { useAuth } from '@clerk/nextjs'

export function useAuthErrorTracking() {
  const { sessionId } = useAuth()

  const trackAuthError = (error: Error, context: string) => {
    posthog.capture('auth_error', {
      error: error.message,
      context,
      sessionId,
      timestamp: new Date().toISOString()
    })
  }

  return { trackAuthError }
}
```

## 🚀 Production Considerations

### Environment Configuration
- **Separate Keys**: Use different Clerk keys for each environment
- **Domain Whitelist**: Configure allowed domains for production
- **Redirect URLs**: Set appropriate redirect URLs for production

### Performance Optimization
- **Lazy Loading**: Load Clerk components only when needed
- **Bundle Splitting**: Separate authentication code from main bundle
- **Caching**: Cache user data appropriately

### Security Hardening
- **Rate Limiting**: Implement rate limiting for authentication endpoints
- **Audit Logging**: Log authentication events for security monitoring
- **Token Expiry**: Configure appropriate token expiry times

## 📋 Troubleshooting

### Common Issues

#### "Invalid Clerk Key" Error
- Verify environment variables are correctly set
- Check that publishable key matches secret key environment
- Ensure keys are for the correct Clerk application

#### Authentication Loop
- Check middleware configuration for correct route patterns
- Verify onboarding completion logic
- Ensure redirect URLs are properly configured

#### Supabase Token Issues
- Verify JWT template is correctly configured in Clerk
- Check that Supabase RLS policies are properly set up
- Ensure token has appropriate permissions

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Clerk Debug:', {
    userId: auth().userId,
    sessionId: auth().sessionId,
    claims: auth().sessionClaims
  })
}
```

## 🔗 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Integration](https://clerk.com/docs/references/nextjs/overview)
- [Supabase Auth Integration](https://supabase.com/docs/guides/auth)
- [JWT Templates Guide](https://clerk.com/docs/references/backend/overview)

This integration provides a robust, secure, and scalable authentication system that seamlessly integrates with the rest of the Kasoku application architecture.
