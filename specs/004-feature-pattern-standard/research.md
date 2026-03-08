# Research: Feature Pattern Standardization

**Date**: 2025-12-24
**Feature Branch**: `004-feature-pattern-standard`
**Status**: Complete

## Research Areas

1. [TanStack Query Caching Best Practices](#1-tanstack-query-caching-best-practices)
2. [Draft Persistence Patterns](#2-draft-persistence-patterns)
3. [Optimistic Updates with Rollback](#3-optimistic-updates-with-rollback)
4. [Server Prefetching (HydrationBoundary)](#4-server-prefetching-hydrationboundary)
5. [Unsaved Changes Warning (beforeunload)](#5-unsaved-changes-warning-beforeunload)
6. [Next.js 16 Breaking Changes](#6-nextjs-16-breaking-changes)

---

## 1. TanStack Query Caching Best Practices

### Decision: Single QueryClient with Feature-Specific Stale Times

### Rationale
- Single QueryClient ensures consistent cache behavior across the app
- Feature-specific stale times allow optimization per data type
- Prevents excessive refetching while maintaining data freshness

### Configuration Pattern

```typescript
// providers/query-provider.tsx - SINGLE instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute default
      gcTime: 5 * 60 * 1000,     // 5 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Feature-specific overrides via hook options
const STALE_TIMES = {
  SESSIONS_TODAY: 30 * 1000,        // 30 seconds - frequently changing
  SESSION_DETAILS: 60 * 1000,       // 1 minute
  PERFORMANCE_HISTORY: 15 * 60 * 1000,  // 15 minutes - historical data
  TRAINING_PLANS: 30 * 60 * 1000,   // 30 minutes - rarely changes
}
```

### Current Issues Found
| Issue | Location | Fix |
|-------|----------|-----|
| staleTime=0 causes excessive refetch | query-config.ts:51-52 | Set to 30-60 seconds |
| Unused QueryClient factory | query-config.ts:88 | Delete function |
| No server prefetching | All pages | Add HydrationBoundary |

### Alternatives Considered
- **Per-feature QueryClient**: Rejected - breaks shared cache, complicates devtools
- **Global staleTime only**: Rejected - doesn't allow optimization per data type

---

## 2. Draft Persistence Patterns

### Decision: localStorage with JSON serialization (fallback to memory)

### Rationale
- localStorage is synchronous, simple, and universally supported
- IndexedDB is overkill for draft data (<100KB per session)
- Memory fallback handles private browsing mode gracefully

### Implementation Pattern

```typescript
// lib/workout-persistence.ts
const DRAFT_KEY_PREFIX = 'kasoku-draft-'

export function saveDraft<T>(entityType: string, id: number, data: T): void {
  try {
    const key = `${DRAFT_KEY_PREFIX}${entityType}-${id}`
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      version: 1
    }))
  } catch (e) {
    // Fallback to in-memory storage
    memoryDrafts.set(`${entityType}-${id}`, data)
  }
}

export function getDraft<T>(entityType: string, id: number): T | null {
  try {
    const key = `${DRAFT_KEY_PREFIX}${entityType}-${id}`
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const { data, timestamp } = JSON.parse(stored)
    // Expire after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return memoryDrafts.get(`${entityType}-${id}`) ?? null
  }
}

export function clearDraft(entityType: string, id: number): void {
  const key = `${DRAFT_KEY_PREFIX}${entityType}-${id}`
  localStorage.removeItem(key)
  memoryDrafts.delete(`${entityType}-${id}`)
}
```

### Alternatives Considered
- **IndexedDB**: Rejected - async API adds complexity, overkill for small data
- **SessionStorage**: Rejected - clears on tab close, not suitable for drafts
- **React Query persist**: Rejected - persists all queries, not selective drafts

---

## 3. Optimistic Updates with Rollback

### Decision: React Query useMutation with onMutate/onError/onSettled

### Rationale
- Built-in support in TanStack Query
- Automatic rollback on error
- Proper cache invalidation on success
- Type-safe with TypeScript

### Implementation Pattern

```typescript
// hooks/use[Feature]Mutations.ts
export function useSaveWorkoutSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: WorkoutSetUpdate) => {
      const result = await saveWorkoutSetAction(data)
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(newData.sessionId)
      })

      // Snapshot previous value
      const previous = queryClient.getQueryData(
        WORKOUT_QUERY_KEYS.SESSION_DETAILS(newData.sessionId)
      )

      // Optimistically update cache
      queryClient.setQueryData(
        WORKOUT_QUERY_KEYS.SESSION_DETAILS(newData.sessionId),
        (old: any) => ({
          ...old,
          sets: old.sets.map((s: any) =>
            s.id === newData.setId ? { ...s, ...newData } : s
          )
        })
      )

      return { previous }
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          WORKOUT_QUERY_KEYS.SESSION_DETAILS(newData.sessionId),
          context.previous
        )
      }
      toast.error('Failed to save. Changes reverted.')
    },

    // Invalidate on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEYS.SESSION_DETAILS(variables.sessionId)
      })
    }
  })
}
```

### Current Issues Found
- Auto-save queue in useRef is **lost on page refresh**
- No rollback mechanism in current implementation
- completeSession doesn't flush pending mutations

### Alternatives Considered
- **Manual state management**: Rejected - reinvents React Query features
- **SWR**: Rejected - TanStack Query already in use, more features

---

## 4. Server Prefetching (HydrationBoundary)

### Decision: Server Component prefetch + HydrationBoundary

### Rationale
- Eliminates client-side loading spinners on initial render
- Data available immediately in React Query cache
- SEO-friendly (data in initial HTML)
- Next.js 16 compatible

### Implementation Pattern

```typescript
// app/(protected)/workout/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function WorkoutPage() {
  const queryClient = new QueryClient()

  // Prefetch critical data server-side
  await queryClient.prefetchQuery({
    queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
    queryFn: async () => {
      const result = await getTodaySessionsAction()
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    }
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<WorkoutSkeleton />}>
        <WorkoutPageContent />
      </Suspense>
    </HydrationBoundary>
  )
}
```

### Pages Requiring This Pattern
1. `/workout` - Sessions today
2. `/plans` - Macrocycles list
3. `/plans/[id]` - Plan details
4. `/athletes` - Athlete roster

### Alternatives Considered
- **Client-only fetching**: Rejected - causes loading spinners, poor UX
- **getServerSideProps**: Rejected - Pages Router pattern, not App Router

---

## 5. Unsaved Changes Warning (beforeunload)

### Decision: Custom hook with React Router integration

### Rationale
- Prevents accidental data loss
- Works with both browser navigation and internal routing
- Simple API for component use

### Implementation Pattern

```typescript
// lib/hooks/useUnsavedChanges.ts
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const router = useRouter()

  // Browser navigation (refresh, close tab, back/forward)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Internal navigation (Next.js router)
  const safeNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }
    router.push(path)
  }, [hasUnsavedChanges, router])

  return { safeNavigate }
}
```

### Usage Pattern

```typescript
function WorkoutDashboard() {
  const { saveStatus } = useExerciseContext()
  const hasUnsavedChanges = saveStatus === 'saving' || pendingMutations > 0

  const { safeNavigate } = useUnsavedChanges(hasUnsavedChanges)

  return (
    <>
      {hasUnsavedChanges && <UnsavedIndicator />}
      <Button onClick={() => safeNavigate('/history')}>View History</Button>
    </>
  )
}
```

### Alternatives Considered
- **Router middleware**: Rejected - no clean pattern in App Router
- **Global state tracking**: Rejected - more complex, less granular

---

## 6. Next.js 16 Breaking Changes

### Decision: Follow post-CVE-2025-29927 auth patterns

### Key Findings

| Change | Old Pattern | New Pattern |
|--------|-------------|-------------|
| Middleware | `middleware.ts` for auth | `proxy.ts` for routing ONLY |
| Auth location | Edge middleware | Server actions, layouts |
| Params access | `{ params }` sync | `await props.params` async |
| Turbopack | `--turbopack` flag | Default (no flag needed) |
| Node.js | 18+ | 20.9+ required |

### Auth Pattern (Post-CVE)

```typescript
// OLD - VULNERABLE (middleware.ts)
export function middleware(req) {
  if (!isAuthenticated(req)) {
    return redirect('/login')
  }
}

// NEW - CORRECT (server actions)
export async function createPlanAction() {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: 'Not authenticated' }
  }
  // ... proceed with action
}
```

### Async Params Pattern

```typescript
// OLD (Next.js 15)
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id  // Sync access
}

// NEW (Next.js 16)
export default async function Page(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params  // Must await
}
```

### Current Codebase Status
- All dynamic routes already use async params pattern
- No middleware.ts exists (correct)
- Auth in server actions (correct pattern)

---

## Summary of Decisions

| Area | Decision | Confidence |
|------|----------|------------|
| Query Caching | Single QueryClient, feature stale times | High |
| Draft Persistence | localStorage with memory fallback | High |
| Optimistic Updates | React Query useMutation pattern | High |
| Server Prefetching | HydrationBoundary pattern | High |
| Unsaved Changes | Custom hook with beforeunload | Medium |
| Next.js 16 Auth | Server actions, not middleware | High |

## References

- [TanStack Query SSR Guide](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [CVE-2025-29927 Analysis](https://www.buildwithmatija.com/blog/nextjs16-middleware-change)
- [Clerk + Supabase Integration](https://supabase.com/docs/guides/auth/third-party/clerk)
