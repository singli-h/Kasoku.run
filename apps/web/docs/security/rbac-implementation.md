# Role-Based Access Control (RBAC) Implementation

## Overview

This document provides comprehensive guidance on implementing and using role-based access control in the Kasoku application.

## User Roles

### Available Roles
```typescript
type UserRole = 'athlete' | 'coach' | 'admin'
```

### Role Permissions Matrix

| Feature | Athlete | Coach | Admin |
|---------|---------|-------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Workout | ✅ | ✅ | ✅ |
| Exercise Library | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |
| **Athletes Management** | ❌ | ✅ | ✅ |
| **Training Plans** | ❌ | ✅ | ✅ |
| **Sessions** | ❌ | ✅ | ✅ |
| **Knowledge Base** | ❌ | ✅ | ✅ |

## Architecture Components

### 1. User Cache Layer
**Location:** `apps/web/lib/user-cache.ts`

Provides cached role lookups to minimize database queries:

```typescript
import { getUserRole, getUserInfo } from '@/lib/user-cache'

// Get just the role
const role = await getUserRole(clerkId)

// Get both ID and role in one query
const { id, role } = await getUserInfo(clerkId)
```

**Cache Details:**
- Type: LRU Cache
- Size: 100 entries
- TTL: 15 minutes
- Scope: Process-local

### 2. User Role Context
**Location:** `apps/web/contexts/user-role-context.tsx`

Client-side React Context for role access:

```tsx
import { useUserRole } from '@/contexts/user-role-context'

function MyComponent() {
  const { role, isCoach, isAthlete, isAdmin, hasRole, isLoading } = useUserRole()

  if (isLoading) return <Spinner />
  if (!isCoach) return null

  return <CoachOnlyFeature />
}
```

### 3. Server-Side Protection
**Location:** `apps/web/components/auth/server-protect-route.tsx`

Server utilities for protecting pages:

```tsx
import { serverProtectRoute } from '@/components/auth/server-protect-route'

export default async function CoachPage() {
  // Redirects unauthorized users before rendering
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })

  return <CoachContent />
}
```

**Additional utilities:**
```tsx
import { getCurrentUserRole, hasRole } from '@/components/auth/server-protect-route'

// Get role in server component
const role = await getCurrentUserRole()

// Check role in server component
const isCoach = await hasRole(['coach', 'admin'])
```

### 4. Client-Side Protection
**Location:** `apps/web/components/auth/protect-route.tsx`

Client component for protecting routes:

```tsx
import { ProtectRoute } from '@/components/auth/protect-route'

<ProtectRoute allowedRoles={['coach', 'admin']} redirectTo="/dashboard">
  <CoachFeature />
</ProtectRoute>
```

### 5. API Route
**Location:** `apps/web/app/api/user/role/route.ts`

Provides role information to client-side code:

```typescript
// GET /api/user/role
// Returns: { role: 'coach' | 'athlete' | 'admin' }
```

## Implementation Patterns

### Pattern 1: Protect an Entire Page (Server-Side)

**Recommended for:** All coach-only pages

```tsx
// apps/web/app/(protected)/athletes/page.tsx
import { serverProtectRoute } from '@/components/auth/server-protect-route'

export default async function AthletesPage() {
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })

  return <AthletesList />
}
```

**Benefits:**
- No client-side flash
- SEO-friendly redirects
- Works with SSR
- Executes before any data fetching

### Pattern 2: Conditional Rendering in Server Components

```tsx
import { getCurrentUserRole } from '@/components/auth/server-protect-route'

export default async function DashboardPage() {
  const role = await getCurrentUserRole()

  return (
    <div>
      <UserDashboard />
      {role === 'coach' && <CoachPanel />}
      {role === 'admin' && <AdminPanel />}
    </div>
  )
}
```

### Pattern 3: Protect Client Components

```tsx
'use client'

import { useUserRole } from '@/contexts/user-role-context'

export function FeatureToggle() {
  const { isCoach, isLoading } = useUserRole()

  if (isLoading) return <Skeleton />
  if (!isCoach) return null

  return <CoachFeature />
}
```

### Pattern 4: Sidebar/Navigation Filtering

```tsx
'use client'

import { useUserRole } from '@/contexts/user-role-context'

const navItems = [
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Athletes', url: '/athletes', coachOnly: true },
]

export function Sidebar() {
  const { isCoach, isAdmin } = useUserRole()

  const filteredItems = navItems.filter(item => {
    if (item.coachOnly) {
      return isCoach || isAdmin
    }
    return true
  })

  return <NavList items={filteredItems} />
}
```

### Pattern 5: Protect Server Actions

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/user-cache'
import { ActionState } from '@/types'

export async function deleteAthleteAction(athleteId: number): Promise<ActionState<void>> {
  const { userId } = await auth()

  if (!userId) {
    return { isSuccess: false, message: 'Not authenticated' }
  }

  const role = await getUserRole(userId)

  if (role !== 'coach' && role !== 'admin') {
    return { isSuccess: false, message: 'Insufficient permissions' }
  }

  // Proceed with deletion
}
```

## Protected Pages

The following pages require coach/admin access:

| Page | File | Protection |
|------|------|------------|
| Athletes | `app/(protected)/athletes/page.tsx` | Coach/Admin |
| Plans (List) | `app/(protected)/plans/page.tsx` | Coach/Admin |
| Plan Workspace | `app/(protected)/plans/[id]/page.tsx` | Coach/Admin |
| Sessions | `app/(protected)/sessions/page.tsx` | Coach/Admin |
| Knowledge Base | `app/(protected)/knowledge-base/page.tsx` | Coach/Admin |

## Best Practices

### 1. Always Use Server-Side Protection for Pages

❌ **Don't:**
```tsx
export default function AthletesPage() {
  return (
    <ProtectRoute allowedRoles={['coach']}>
      <AthletesList />
    </ProtectRoute>
  )
}
```

✅ **Do:**
```tsx
export default async function AthletesPage() {
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })
  return <AthletesList />
}
```

### 2. Handle Loading States

❌ **Don't:**
```tsx
function MyComponent() {
  const { isCoach } = useUserRole()
  return isCoach ? <CoachView /> : null // Flashes for coaches
}
```

✅ **Do:**
```tsx
function MyComponent() {
  const { isCoach, isLoading } = useUserRole()
  if (isLoading) return <Skeleton />
  return isCoach ? <CoachView /> : null
}
```

### 3. Protect Both Routes and Data

Always protect:
1. Page routes (server-side)
2. API routes
3. Server actions
4. Database queries (via RLS)

### 4. Invalidate Cache on Role Changes

```typescript
import { invalidateUserCache } from '@/lib/user-cache'

export async function updateUserRoleAction(userId: string, newRole: string) {
  // Update role in database
  await updateUserRole(userId, newRole)

  // Clear cache to force fresh lookup
  invalidateUserCache(userId)
}
```

## Troubleshooting

### Role Not Updating
```typescript
// Clear cache after role change
import { invalidateUserCache } from '@/lib/user-cache'
invalidateUserCache(clerkId)
```

### Client Components Not Re-rendering
Ensure `UserRoleProvider` wraps your app in `components/utilities/providers.tsx`

### Unauthorized Access Despite Role
Check:
1. Database role column value
2. Cache expiration (15 min TTL)
3. Clerk authentication status
4. RLS policies in Supabase

## Testing

### Test Different Roles
```typescript
// In development, manually set role in database
UPDATE users SET role = 'coach' WHERE clerk_id = 'user_xxx';

// Then clear cache
import { clearUserCache } from '@/lib/user-cache'
clearUserCache()
```

### Test Checklist

- [ ] **As Athlete:**
  - [ ] Cannot see coach-only items in sidebar
  - [ ] Direct navigation to coach pages redirects to dashboard
  - [ ] Can access athlete-allowed pages

- [ ] **As Coach:**
  - [ ] Can see all navigation items
  - [ ] Can access all pages
  - [ ] Can perform coach-only actions

- [ ] **As Admin:**
  - [ ] Has full access to all features

## Related Documentation

- [Row Level Security](./row-level-security-analysis.md) - Database-level security
- [API Architecture](../development/api-architecture.md) - API security patterns
- [Performance Optimization](../development/performance-optimization.md) - Caching strategies
