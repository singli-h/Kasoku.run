# React Query Caching Pattern

> **Last Updated**: 2025-12-25

This document describes the TanStack Query (React Query) caching patterns used in Kasoku for optimized data fetching and state management.

## Overview

Kasoku uses TanStack Query for server state management with a centralized configuration approach. Each feature has its own query configuration file defining query keys, cache times, stale times, and retry strategies.

## Architecture

```
components/features/[feature]/
├── config/
│   └── query-config.ts    # Query keys, cache times, retry config
├── hooks/
│   ├── use-[feature]-queries.ts  # Query hooks
│   └── index.ts           # Re-exports
└── context/
    └── [feature]-context.tsx  # Optional: For complex state
```

## Query Configuration

### Query Keys

Query keys follow a hierarchical structure for efficient cache management:

```typescript
// config/query-config.ts
export const FEATURE_QUERY_KEYS = {
  // Base queries
  LIST: ['feature-list'] as const,
  DETAIL: (id: number) => ['feature-detail', id] as const,

  // Nested queries
  BY_PARENT: (parentId: number) => ['feature', 'by-parent', parentId] as const,

  // With filters
  FILTERED: (page: number, filters: Filters) =>
    ['feature', 'filtered', page, filters] as const,
} as const
```

**Naming Convention:**
- Use SCREAMING_SNAKE_CASE for key names
- Use descriptive names that indicate data scope
- Include all parameters that affect the data

### Cache Times

Configure garbage collection times (gcTime) based on data volatility:

```typescript
export const CACHE_TIMES = {
  // Short-lived: 30 seconds to 1 minute
  SESSION_DETAILS: 60 * 1000,        // 1 minute

  // Medium-lived: 5-15 minutes
  SESSION_PLAN: 10 * 60 * 1000,      // 10 minutes
  EXERCISE_LIBRARY: 15 * 60 * 1000,  // 15 minutes

  // Long-lived: 30 minutes to 1 hour
  TRAINING_PLANS: 60 * 60 * 1000,    // 1 hour
} as const
```

**Guidelines:**
- Frequently updated data: 30s - 1min
- Moderately updated data: 5-15min
- Rarely updated data: 30min - 1hr

### Stale Times

Configure when data becomes stale (triggers background refetch):

```typescript
export const STALE_TIMES = {
  // Fresh data: short stale times
  SESSION_DETAILS: 60 * 1000,        // 1 minute

  // Moderately fresh: 1-5 minutes
  SESSION_PLAN: 5 * 60 * 1000,       // 5 minutes

  // Stale-tolerant: 15-30 minutes
  TRAINING_PLANS: 30 * 60 * 1000,    // 30 minutes
} as const
```

**Guidelines:**
- Set staleTime <= gcTime (cacheTime)
- Higher staleTime = fewer network requests
- Balance freshness vs performance

### Retry Configuration

Configure retry strategies based on data criticality:

```typescript
export const RETRY_CONFIG = {
  // Critical data - retry aggressively
  CRITICAL: {
    retries: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Non-critical data - retry less
  NON_CRITICAL: {
    retries: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  },

  // Background data - minimal retries
  BACKGROUND: {
    retries: 1,
    retryDelay: () => 5000,
  },
} as const
```

## Query Hooks

### Basic Query Hook

```typescript
// hooks/use-session-planner-queries.ts
"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  SESSION_PLANNER_QUERY_KEYS,
  CACHE_TIMES,
  STALE_TIMES,
  RETRY_CONFIG
} from '../config/query-config'
import { getSessionPlanAction } from '@/actions/plans/session-planner-actions'

export function useSessionPlan(sessionId: number, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
    queryFn: async () => {
      const result = await getSessionPlanAction(sessionId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    staleTime: STALE_TIMES.SESSION_PLAN,
    gcTime: CACHE_TIMES.SESSION_PLAN,
    retry: RETRY_CONFIG.CRITICAL.retries,
    retryDelay: RETRY_CONFIG.CRITICAL.retryDelay,
    enabled: options?.enabled ?? true,
  })

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
    })
  }, [queryClient, sessionId])

  return { ...query, refetch }
}
```

### Mutation Hook

```typescript
export function useSessionPlanMutations() {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async ({ sessionId, session, exercises }: SaveParams) => {
      const result = await saveSessionWithExercisesAction(
        sessionId, session, exercises
      )
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(variables.sessionId)
      })
      queryClient.invalidateQueries({
        queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(
          data.microcycle_id
        )
      })
    },
    onError: (error) => {
      console.error('[useSessionPlanMutations] Save failed:', error)
    },
  })

  return { save: saveMutation }
}
```

### Prefetch Hook

```typescript
export function useSessionPlannerPrefetch() {
  const queryClient = useQueryClient()

  const prefetchSession = useCallback((sessionId: number) => {
    queryClient.prefetchQuery({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
      queryFn: async () => {
        const result = await getSessionPlanAction(sessionId)
        if (!result.isSuccess) throw new Error(result.message)
        return result.data
      },
      staleTime: STALE_TIMES.SESSION_PLAN,
    })
  }, [queryClient])

  return { prefetchSession }
}
```

### Cache Management Hook

```typescript
export function useSessionPlannerCache() {
  const queryClient = useQueryClient()

  const invalidateSession = useCallback((sessionId: number) => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId)
    })
  }, [queryClient])

  const invalidateByMicrocycle = useCallback((microcycleId: number) => {
    queryClient.invalidateQueries({
      queryKey: SESSION_PLANNER_QUERY_KEYS.SESSION_PLANS_BY_MICROCYCLE(microcycleId)
    })
  }, [queryClient])

  const setSessionData = useCallback((sessionId: number, data: SessionPlan) => {
    queryClient.setQueryData(
      SESSION_PLANNER_QUERY_KEYS.SESSION_PLAN(sessionId),
      data
    )
  }, [queryClient])

  return { invalidateSession, invalidateByMicrocycle, setSessionData }
}
```

## Integration with ActionState

Always integrate with the ActionState pattern:

```typescript
queryFn: async () => {
  const result = await getDataAction(id)

  // ActionState pattern - check isSuccess
  if (!result.isSuccess) {
    throw new Error(result.message)
  }

  return result.data
}
```

## Optimistic Updates

For better UX, use optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: updateDataAction,

  // Optimistic update before API call
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['data'] })
    const previousData = queryClient.getQueryData(['data'])

    queryClient.setQueryData(['data'], (old: Data) => ({
      ...old,
      ...newData
    }))

    return { previousData }
  },

  // Rollback on error
  onError: (err, newData, context) => {
    queryClient.setQueryData(['data'], context?.previousData)
  },

  // Refetch to sync with server
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['data'] })
  },
})
```

## Invalidation Patterns

### Single Query Invalidation

```typescript
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.DETAIL(id)
})
```

### Related Queries Invalidation

```typescript
// Invalidate all related queries
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.LIST
})
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.BY_PARENT(parentId)
})
```

### Partial Key Matching

```typescript
// Invalidate all queries starting with 'session'
queryClient.invalidateQueries({
  queryKey: ['session'],
  exact: false
})
```

## Best Practices

### 1. Single QueryClient Instance

```typescript
// providers.tsx - Create ONCE at app level
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
})

// Do NOT create per feature
```

### 2. Use Query Key Factories

```typescript
// ✅ GOOD: Centralized query keys
const result = useQuery({
  queryKey: QUERY_KEYS.DETAIL(id)
})

// ❌ BAD: Inline query keys
const result = useQuery({
  queryKey: ['detail', id]
})
```

### 3. Keep QueryFn Pure

```typescript
// ✅ GOOD: Pure function
queryFn: async () => {
  const result = await getDataAction(id)
  if (!result.isSuccess) throw new Error(result.message)
  return result.data
}

// ❌ BAD: Side effects in queryFn
queryFn: async () => {
  console.log('Fetching...')  // Side effect
  localStorage.setItem('lastFetch', Date.now())  // Side effect
  return await getData()
}
```

### 4. Handle Loading and Error States

```typescript
export function DataComponent() {
  const { data, isLoading, error } = useQuery(...)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return <DataView data={data} />
}
```

## File Structure Example

```
components/features/session-planner/
├── config/
│   └── query-config.ts
├── hooks/
│   ├── use-session-planner-queries.ts
│   └── index.ts
├── context/
│   ├── session-planner-context.tsx
│   └── index.ts
├── components/
│   └── ...
└── types.ts
```

## Related Documentation

- [ActionState Pattern](./actionstate-pattern.md)
- [Hooks vs Context](./hooks-vs-context.md)
- [Feature Pattern](./feature-pattern.md)
- [API Architecture](../development/api-architecture.md)
