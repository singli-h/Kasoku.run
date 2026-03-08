# Quickstart: Feature Pattern Standardization

**Date**: 2025-12-24
**Feature Branch**: `004-feature-pattern-standard`
**Status**: Ready for Implementation

## Overview

This guide provides step-by-step instructions for implementing the standardized feature pattern across the codebase. Follow this guide when migrating existing features or creating new ones.

---

## Prerequisites

- Node.js 20.9+ (required for Next.js 16)
- Familiarity with TanStack Query v5
- Understanding of React Server Components

---

## Quick Start (5 minutes)

### 1. Create Feature Directory Structure

```bash
# Navigate to features directory
cd apps/web/components/features

# Create new feature structure
mkdir -p my-feature/{components,hooks,context,config}
touch my-feature/{index.ts,types.ts}
touch my-feature/hooks/{index.ts,useMyFeatureQueries.ts,useMyFeatureMutations.ts}
touch my-feature/config/query-config.ts
```

### 2. Define Query Keys

```typescript
// my-feature/config/query-config.ts
export const MY_FEATURE_QUERY_KEYS = {
  all: ['my-feature'] as const,
  lists: () => [...MY_FEATURE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...MY_FEATURE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...MY_FEATURE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) =>
    [...MY_FEATURE_QUERY_KEYS.details(), String(id)] as const,
} as const

export const STALE_TIMES = {
  LIST: 30 * 1000,      // 30 seconds
  DETAIL: 60 * 1000,    // 1 minute
} as const
```

### 3. Create Query Hook

```typescript
// my-feature/hooks/useMyFeatureQueries.ts
import { useQuery } from '@tanstack/react-query'
import { MY_FEATURE_QUERY_KEYS, STALE_TIMES } from '../config/query-config'
import { getItemsAction, getItemAction } from '@/actions/my-feature/my-feature-actions'

export function useMyFeatureList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: MY_FEATURE_QUERY_KEYS.list(filters ?? {}),
    queryFn: async () => {
      const result = await getItemsAction(filters)
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },
    staleTime: STALE_TIMES.LIST,
  })
}

export function useMyFeatureDetail(id: string | number) {
  return useQuery({
    queryKey: MY_FEATURE_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const result = await getItemAction(id)
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!id,
  })
}
```

### 4. Create Mutation Hook with Optimistic Updates

```typescript
// my-feature/hooks/useMyFeatureMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MY_FEATURE_QUERY_KEYS } from '../config/query-config'
import { updateItemAction } from '@/actions/my-feature/my-feature-actions'
import { toast } from 'sonner'

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateItemInput) => {
      const result = await updateItemAction(data)
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: MY_FEATURE_QUERY_KEYS.detail(newData.id)
      })

      // Snapshot previous value
      const previous = queryClient.getQueryData(
        MY_FEATURE_QUERY_KEYS.detail(newData.id)
      )

      // Optimistically update
      queryClient.setQueryData(
        MY_FEATURE_QUERY_KEYS.detail(newData.id),
        (old: any) => ({ ...old, ...newData })
      )

      return { previous }
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          MY_FEATURE_QUERY_KEYS.detail(newData.id),
          context.previous
        )
      }
      toast.error('Failed to update. Changes reverted.')
    },

    // Invalidate on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: MY_FEATURE_QUERY_KEYS.detail(variables.id)
      })
      queryClient.invalidateQueries({
        queryKey: MY_FEATURE_QUERY_KEYS.lists()
      })
    },

    onSuccess: () => {
      toast.success('Updated successfully')
    },
  })
}
```

### 5. Add Server Prefetching

```typescript
// app/(protected)/my-feature/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Suspense } from 'react'
import { MY_FEATURE_QUERY_KEYS } from '@/components/features/my-feature/config/query-config'
import { getItemsAction } from '@/actions/my-feature/my-feature-actions'
import { MyFeatureList } from '@/components/features/my-feature'
import { UnifiedPageSkeleton } from '@/components/layout'

export default async function MyFeaturePage() {
  const queryClient = new QueryClient()

  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: MY_FEATURE_QUERY_KEYS.lists(),
    queryFn: async () => {
      const result = await getItemsAction()
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<UnifiedPageSkeleton title="Loading..." />}>
        <MyFeatureList />
      </Suspense>
    </HydrationBoundary>
  )
}
```

### 6. Export Public API

```typescript
// my-feature/index.ts

// Components
export { MyFeatureList } from './components/MyFeatureList'
export { MyFeatureCard } from './components/MyFeatureCard'

// Hooks
export { useMyFeatureList, useMyFeatureDetail } from './hooks/useMyFeatureQueries'
export { useUpdateItem } from './hooks/useMyFeatureMutations'

// Types
export type { MyFeatureItem, MyFeatureListProps } from './types'

// Config (for server prefetching)
export { MY_FEATURE_QUERY_KEYS } from './config/query-config'
```

---

## Common Patterns

### Draft Persistence (for forms)

```typescript
// lib/my-feature-persistence.ts
const DRAFT_KEY = 'kasoku-draft-my-feature'

export function saveDraft<T>(id: number, data: T): void {
  try {
    localStorage.setItem(`${DRAFT_KEY}-${id}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      version: 1,
    }))
  } catch {
    // Fallback to memory if localStorage is full
  }
}

export function getDraft<T>(id: number): T | null {
  try {
    const stored = localStorage.getItem(`${DRAFT_KEY}-${id}`)
    if (!stored) return null

    const { data, timestamp } = JSON.parse(stored)
    // Expire after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${DRAFT_KEY}-${id}`)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearDraft(id: number): void {
  localStorage.removeItem(`${DRAFT_KEY}-${id}`)
}
```

### Unsaved Changes Warning

```typescript
// lib/hooks/useUnsavedChanges.ts
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const router = useRouter()
  const safeNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Leave anyway?')) return
    }
    router.push(path)
  }, [hasUnsavedChanges, router])

  return { safeNavigate }
}
```

### Save Status Indicator

```typescript
// components/ui/save-status.tsx
'use client'

import { Loader2, Check, AlertCircle } from 'lucide-react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  const config = {
    saving: { icon: Loader2, label: 'Saving...', className: 'animate-spin text-muted-foreground' },
    saved: { icon: Check, label: 'Saved', className: 'text-green-500' },
    error: { icon: AlertCircle, label: 'Save failed', className: 'text-destructive' },
  }[status]

  const Icon = config.icon
  return (
    <div className="flex items-center gap-1 text-sm">
      <Icon className={`h-4 w-4 ${config.className}`} />
      <span className={config.className}>{config.label}</span>
    </div>
  )
}
```

---

## Migration Checklist

When migrating an existing feature:

- [ ] Create `config/query-config.ts` with query keys
- [ ] Create `hooks/use[Feature]Queries.ts`
- [ ] Create `hooks/use[Feature]Mutations.ts` with optimistic updates
- [ ] Add `HydrationBoundary` to page.tsx for server prefetching
- [ ] Set appropriate `staleTime` per query type
- [ ] Add draft persistence for forms (if applicable)
- [ ] Add `useUnsavedChanges` hook (if applicable)
- [ ] Export public API from `index.ts`
- [ ] Update `types.ts` with proper interfaces

---

## Troubleshooting

### Query not updating after mutation

Ensure you're invalidating the correct query keys:

```typescript
onSettled: () => {
  // Invalidate both detail and list queries
  queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
  queryClient.invalidateQueries({ queryKey: KEYS.lists() })
}
```

### Optimistic update not showing

Check that you're updating the exact query key that's being read:

```typescript
// Reading from this key
const { data } = useQuery({ queryKey: KEYS.detail(id) })

// Must update the same key
queryClient.setQueryData(KEYS.detail(id), newData)
```

### Server prefetch not hydrating

Ensure:
1. `HydrationBoundary` wraps the client component
2. Query keys match exactly between server prefetch and client useQuery
3. `dehydrate(queryClient)` is passed to `state` prop

---

## References

- [TanStack Query SSR Guide](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- [Next.js 16 App Router](https://nextjs.org/docs/app)
- [Feature Pattern Documentation](../../apps/web/docs/patterns/feature-pattern.md)
