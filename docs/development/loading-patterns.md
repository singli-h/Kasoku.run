# Loading Patterns & State Management

## Overview

This document outlines the standardized loading patterns and state management approaches used across the Kasoku application.

## Standard Components

### 1. Base Skeleton Component

**Location:** `components/ui/skeleton.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Basic usage
<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-32 rounded-full" />
```

### 2. UnifiedPageSkeleton

**Location:** `components/layout/page-skeleton.tsx`

The primary component for page-level loading states.

**Available Variants:**

| Variant | Use Case | Components |
|---------|----------|------------|
| `dashboard` | Dashboard pages | 4 metric cards + 2 content cards |
| `list` | List views | Filter bar + list items |
| `grid` | Grid layouts | 8 grid items (4-column) |
| `form` | Forms/settings | Form sections with fields |
| `default` | General pages | Simple content blocks |

**Usage:**
```tsx
<UnifiedPageSkeleton title="Page Name" variant="dashboard" />
<UnifiedPageSkeleton title="Athletes" variant="list" />
<UnifiedPageSkeleton title="Library" variant="grid" showActions={true} />
```

### 3. LoadingSpinner

**Location:** `components/features/workout/components/error-loading/workout-loading-states.tsx`

For inline and action loading states.

```tsx
import { LoadingSpinner } from '@/components/features/workout/components/error-loading/workout-loading-states'

<LoadingSpinner size="sm" />  // h-4 w-4
<LoadingSpinner size="md" />  // h-6 w-6 (default)
<LoadingSpinner size="lg" />  // h-8 w-8
```

### 4. ComponentSkeleton

**Location:** `components/layout/page-skeleton.tsx`

For specific UI elements within pages.

```tsx
import { ComponentSkeleton } from '@/components/layout'

<ComponentSkeleton variant="card" />
<ComponentSkeleton variant="table" />
<ComponentSkeleton variant="chart" />
<ComponentSkeleton variant="button" />
<ComponentSkeleton variant="input" />
```

## Usage Patterns

### Pattern 1: Server Component with Suspense (Recommended)

**Use for:** All page-level loading

```tsx
import { Suspense } from 'react'
import { UnifiedPageSkeleton } from '@/components/layout'

export default async function DashboardPage() {
  return (
    <PageLayout title="Dashboard">
      <Suspense fallback={<UnifiedPageSkeleton title="Dashboard" variant="dashboard" />}>
        <DashboardContent />
      </Suspense>
    </PageLayout>
  )
}

async function DashboardContent() {
  const data = await fetchDashboardData()
  return <Dashboard data={data} />
}
```

**Benefits:**
- Automatic loading state
- Works with Server Components
- Prevents layout shift
- SEO-friendly

### Pattern 2: Client Component with useQuery

**Use for:** Data fetching in client components

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner } from '@/components/features/workout/components/error-loading/workout-loading-states'

export function AthletesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['athletes'],
    queryFn: fetchAthletes
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) return <ErrorMessage error={error} />

  return <List data={data} />
}
```

### Pattern 3: Button Loading State

**Use for:** Form submissions and actions

```tsx
'use client'

import { useButtonLoadingState } from '@/hooks/use-loading-state'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SaveButton() {
  const [isLoading, withLoading] = useButtonLoadingState()

  async function handleClick() {
    const result = await withLoading(async () => {
      return await saveData()
    })

    if (result.success) {
      toast.success('Saved!')
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save
    </Button>
  )
}
```

### Pattern 4: useLoadingState Hook

**Location:** `hooks/use-loading-state.ts`

Standardized loading state management for client components.

**Basic Usage:**
```tsx
import { useLoadingState } from '@/hooks/use-loading-state'

function MyComponent() {
  const loading = useLoadingState()

  async function handleSubmit() {
    const result = await loading.executeAsync(async () => {
      return await saveData()
    })

    if (result.success) {
      toast.success('Saved!')
    }
  }

  if (loading.isLoading) return <Skeleton />
  if (loading.isError) return <Error error={loading.error} />

  return <Form onSubmit={handleSubmit} />
}
```

**API:**
```typescript
const loading = useLoadingState()

// State checks
loading.isLoading   // boolean
loading.isIdle      // boolean
loading.isSuccess   // boolean
loading.isError     // boolean
loading.error       // Error | null

// State setters
loading.setLoading()
loading.setSuccess()
loading.setError(error)
loading.setIdle()
loading.reset()

// Automatic execution
loading.executeAsync(asyncFn)
```

**Multiple States:**
```tsx
import { useMultipleLoadingStates } from '@/hooks/use-loading-state'

function ProfilePage() {
  const states = useMultipleLoadingStates({
    profile: 'idle',
    avatar: 'idle',
    settings: 'idle'
  })

  async function updateProfile() {
    await states.profile.executeAsync(async () => {
      return await updateProfileAction(data)
    })
  }

  return (
    <Button
      onClick={updateProfile}
      disabled={states.profile.isLoading}
    >
      Save Profile
    </Button>
  )
}
```

## Best Practices

### 1. Always Provide Loading States

❌ **Don't:**
```tsx
export function MyComponent() {
  const { data } = useQuery(...)
  return <List data={data} />  // Undefined during loading
}
```

✅ **Do:**
```tsx
export function MyComponent() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  return <List data={data} />
}
```

### 2. Match Skeleton to Content

❌ **Don't:**
```tsx
// Generic spinner for complex layout
if (isLoading) return <Spinner />
```

✅ **Do:**
```tsx
// Skeleton matches actual layout
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />  {/* Title */}
      <Skeleton className="h-32 w-full" />  {/* Content */}
    </div>
  )
}
```

### 3. Prevent Layout Shift

Use fixed heights for skeletons:

```tsx
// Bad - layout shifts when loaded
<Skeleton className="w-full" />

// Good - matches content height
<Skeleton className="h-64 w-full" />
```

### 4. Use Suspense for Server Components

```tsx
// Server Component
export default async function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AsyncContent />
    </Suspense>
  )
}

async function AsyncContent() {
  const data = await fetchData()
  return <Content data={data} />
}
```

### 5. Accessibility

```tsx
<div aria-busy="true" aria-label="Loading athletes">
  <LoadingSpinner />
</div>

<Skeleton role="status" aria-label="Loading content" />
```

## Animation Utilities

### Global CSS Classes
**Location:** `apps/web/app/globals.css`

```css
.mobile-animate-fast {
  @apply transition-all duration-200 ease-out;
}

.mobile-animate-smooth {
  @apply transition-all duration-300 ease-in-out;
}
```

### Standard Timings
- Skeleton pulse: 2s (Tailwind default)
- Spinner rotation: 1s (`animate-spin`)
- Framer Motion transitions: 200-300ms
- Modal animations: 200ms

## Page-by-Page Standards

| Page | Variant | Notes |
|------|---------|-------|
| Dashboard | dashboard | 4 metric cards pattern |
| Workout | grid | Grid layout |
| Athletes | list | List with filters |
| Plans | grid | Plan cards |
| Sessions | dashboard | Session metrics |
| Performance | dashboard | Analytics cards |
| Library | grid | Exercise cards |
| Settings | form | Form sections |

## Error Handling

### Pattern with Loading State

```tsx
const { data, isLoading, error } = useQuery(...)

if (isLoading) return <Skeleton />
if (error) {
  return (
    <div className="p-8 text-center">
      <p className="text-destructive">Error: {error.message}</p>
      <Button onClick={refetch}>Try Again</Button>
    </div>
  )
}

return <Content data={data} />
```

## Quick Reference

### Imports You'll Need

```tsx
// Page Loading
import { UnifiedPageSkeleton } from '@/components/layout'
import { Suspense } from 'react'

// Component Loading
import { LoadingSpinner } from '@/components/features/workout/components/error-loading/workout-loading-states'
import { Skeleton } from '@/components/ui/skeleton'
import { ComponentSkeleton } from '@/components/layout'

// State Management
import { useLoadingState, useButtonLoadingState } from '@/hooks/use-loading-state'
```

### Common Patterns

**Full Page Loading:**
```tsx
<UnifiedPageSkeleton title="Page Name" variant="dashboard" />
```

**Inline Spinner:**
```tsx
<LoadingSpinner size="md" />
```

**Button Loading:**
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

**List Loading:**
```tsx
{Array(5).fill(0).map((_, i) => (
  <div key={i} className="flex items-center gap-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
))}
```

## Pattern 5: Server-Side Search with Pagination

**Use for:** Large datasets that shouldn't be loaded upfront (e.g., exercise library, athlete database)

This pattern combines server-side pagination with React Query caching for efficient, scalable data loading.

### Implementation

**Server Action with Pagination:**
```typescript
// actions/library/exercise-actions.ts
export async function searchExercisesAction(
  filters: ExerciseFilters
): Promise<ActionState<PaginatedExercises>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }

    const limit = filters.limit ?? 20
    const offset = filters.offset ?? 0

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1)

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query

    return {
      isSuccess: true,
      message: 'Exercises retrieved',
      data: {
        exercises: data ?? [],
        total: count ?? 0,
        hasMore: (offset + limit) < (count ?? 0)
      }
    }
  } catch (error) {
    console.error('[searchExercisesAction]', error)
    return { isSuccess: false, message: 'Failed to search exercises' }
  }
}
```

**React Query Hook with Debouncing:**
```typescript
// components/features/training/hooks/useExerciseSearch.ts
export function useExerciseSearch({
  initialQuery = '',
  pageSize = 20,
  debounceMs = 300,
  enabled = true,
}: UseExerciseSearchOptions = {}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(0)
  const [accumulatedResults, setAccumulatedResults] = useState([])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(0)
      setAccumulatedResults([])
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [searchQuery, debounceMs])

  const filters = useMemo(() => ({
    search: debouncedQuery || undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  }), [debouncedQuery, pageSize, currentPage])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['exercises', 'search', filters],
    queryFn: async () => {
      const result = await searchExercisesAction(filters)
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    enabled,
  })

  // Accumulate for infinite scroll
  useEffect(() => {
    if (data?.exercises) {
      setAccumulatedResults(prev =>
        currentPage === 0 ? data.exercises : [...prev, ...data.exercises]
      )
    }
  }, [data, currentPage])

  const fetchNextPage = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setCurrentPage(prev => prev + 1)
    }
  }, [data?.hasMore, isFetching])

  return {
    searchQuery,
    setSearchQuery,
    results: accumulatedResults,
    hasMore: data?.hasMore ?? false,
    isLoading: isLoading && currentPage === 0,
    fetchNextPage,
  }
}
```

**Component Usage:**
```tsx
'use client'

function ExercisePicker({ onSelect }) {
  const {
    searchQuery,
    setSearchQuery,
    results,
    hasMore,
    isLoading,
    fetchNextPage
  } = useExerciseSearch({ enabled: isOpen })

  return (
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search exercises..."
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <VirtualizedList
          items={results}
          renderItem={(item) => (
            <ExerciseCard exercise={item} onClick={() => onSelect(item)} />
          )}
          onEndReached={fetchNextPage}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}
```

### Key Benefits

1. **Performance**: Only loads data when needed, not at page load
2. **Scalability**: Handles large datasets (1000+ items) efficiently
3. **Caching**: React Query caches search results for 5 minutes
4. **UX**: Debounced input prevents excessive API calls
5. **Infinite Scroll**: Supports progressive loading with `fetchNextPage`

### When to Use

| Scenario | Pattern |
|----------|---------|
| Small dataset (<100 items) | Load upfront with server component |
| Medium dataset (100-500 items) | Consider either approach |
| Large dataset (500+ items) | **Use server-side search** |
| Real-time search needed | **Use server-side search** |
| Picker/modal component | **Use server-side search** |

### Cache Configuration

```typescript
const SEARCH_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,   // 5 min - results still valid
  gcTime: 30 * 60 * 1000,     // 30 min - keep in memory
}
```

**Why these values?**
- Exercise data rarely changes mid-session
- 5-minute stale time balances freshness with performance
- 30-minute garbage collection keeps frequently-used searches cached

### Backward Compatibility

Components can support both patterns for gradual migration:

```tsx
interface PickerProps {
  /** Pre-loaded exercises (optional - uses server search if not provided) */
  exercises?: Exercise[]
}

function ExercisePicker({ exercises: propExercises }: PickerProps) {
  // Use prop data if provided, otherwise use server search
  const useServerSearch = !propExercises || propExercises.length === 0

  const { results, ... } = useExerciseSearch({
    enabled: useServerSearch
  })

  const displayExercises = useServerSearch ? results : propExercises
  // ...
}
```

## Related Documentation

- [Performance Optimization](./performance-optimization.md) - Caching and optimization
- [API Architecture](./api-architecture.md) - API loading patterns
- [Design System](../design/design-system-overview.md) - UI components
- [Exercise Library](../features/exercises/exercise-library-overview.md) - Feature documentation
