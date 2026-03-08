# Data Model: Feature Pattern Standardization

**Date**: 2025-12-24
**Feature Branch**: `004-feature-pattern-standard`
**Status**: Complete

## Overview

This document defines the data models for the standardized feature pattern, focusing on:
1. Mutation state management
2. Draft persistence
3. Query key structure
4. Feature state patterns

---

## 1. Mutation State Model

### MutationContext

Represents the context passed through React Query mutation lifecycle.

```typescript
interface MutationContext<T> {
  /** Previous data snapshot for rollback */
  previous: T | undefined
  /** Timestamp when mutation started */
  startedAt: number
  /** Optional correlation ID for tracking */
  correlationId?: string
}
```

### MutationResult

Standard result from server actions wrapped in mutations.

```typescript
interface MutationResult<T> {
  /** Whether the mutation succeeded */
  isSuccess: boolean
  /** Human-readable message */
  message: string
  /** Result data (only present on success) */
  data?: T
}
```

### MutationState (React Query)

```typescript
interface MutationState<TData, TError, TVariables, TContext> {
  status: 'idle' | 'pending' | 'success' | 'error'
  data?: TData
  error?: TError
  variables?: TVariables
  context?: TContext
  submittedAt?: number
  failureCount: number
  failureReason?: TError
}
```

---

## 2. Draft Persistence Model

### DraftEntry

Represents a persisted draft in localStorage.

```typescript
interface DraftEntry<T> {
  /** The draft data */
  data: T
  /** Unix timestamp when saved */
  timestamp: number
  /** Schema version for migrations */
  version: number
  /** Source entity type */
  entityType: 'workout' | 'session-plan' | 'plan'
  /** Entity ID */
  entityId: number
}
```

### WorkoutDraft

Specific draft model for workout sessions.

```typescript
interface WorkoutDraft {
  /** Workout log ID */
  sessionId: number
  /** Map of exercise ID to set data */
  exercises: Map<number, WorkoutExerciseDraft>
  /** Session-level notes */
  notes?: string
  /** When the draft was last modified */
  lastModified: number
}

interface WorkoutExerciseDraft {
  /** Exercise ID */
  exerciseId: number
  /** Set data array */
  sets: WorkoutSetDraft[]
  /** Exercise-level notes */
  notes?: string
}

interface WorkoutSetDraft {
  /** Set index (1-based) */
  setIndex: number
  /** Number of reps performed */
  reps?: number
  /** Weight used */
  weight?: number
  /** RPE (1-10) */
  rpe?: number
  /** Whether set is complete */
  completed: boolean
}
```

### DraftRecoveryPrompt

Data for recovery UI after page refresh.

```typescript
interface DraftRecoveryPrompt {
  /** Whether a draft exists */
  hasDraft: boolean
  /** When the draft was saved */
  savedAt: Date
  /** Preview of draft content */
  preview: string
  /** Action handlers */
  onRecover: () => void
  onDiscard: () => void
}
```

---

## 3. Query Key Structure

### Query Key Conventions

All query keys follow a hierarchical structure for efficient invalidation.

```typescript
const WORKOUT_QUERY_KEYS = {
  // Base key for all workout queries
  all: ['workout'] as const,

  // Sessions list queries
  sessions: () => [...WORKOUT_QUERY_KEYS.all, 'sessions'] as const,
  sessionsToday: () => [...WORKOUT_QUERY_KEYS.sessions(), 'today'] as const,
  sessionsHistory: (page: number, filters: SessionFilters) =>
    [...WORKOUT_QUERY_KEYS.sessions(), 'history', { page, ...filters }] as const,

  // Session detail queries
  session: (id: string | number) =>
    [...WORKOUT_QUERY_KEYS.all, 'session', String(id)] as const,
  sessionDetails: (id: string | number) =>
    [...WORKOUT_QUERY_KEYS.session(id), 'details'] as const,

  // Exercise queries
  exercise: (id: string | number) =>
    [...WORKOUT_QUERY_KEYS.all, 'exercise', String(id)] as const,
  exerciseDetails: (id: string | number) =>
    [...WORKOUT_QUERY_KEYS.exercise(id), 'details'] as const,
} as const

// Type helper for query keys
type WorkoutQueryKey = ReturnType<typeof WORKOUT_QUERY_KEYS[keyof typeof WORKOUT_QUERY_KEYS]>
```

### Invalidation Patterns

```typescript
const INVALIDATION_PATTERNS = {
  // Invalidate all workout data
  all: () => queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.all }),

  // Invalidate session lists (after create/delete)
  sessions: () => queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.sessions() }),

  // Invalidate specific session (after update)
  session: (id: string) =>
    queryClient.invalidateQueries({ queryKey: WORKOUT_QUERY_KEYS.session(id) }),
}
```

---

## 4. Feature State Model

### SaveStatus

Status indicator for auto-save functionality.

```typescript
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusDisplay {
  status: SaveStatus
  label: string
  icon: 'check' | 'loader' | 'alert-circle' | 'none'
  className: string
}

const SAVE_STATUS_DISPLAY: Record<SaveStatus, SaveStatusDisplay> = {
  idle: { status: 'idle', label: '', icon: 'none', className: '' },
  saving: { status: 'saving', label: 'Saving...', icon: 'loader', className: 'text-muted animate-pulse' },
  saved: { status: 'saved', label: 'Saved', icon: 'check', className: 'text-green-500' },
  error: { status: 'error', label: 'Save failed', icon: 'alert-circle', className: 'text-destructive' },
}
```

### FeatureState

Generic state interface for features with data management.

```typescript
interface FeatureState<TData> {
  /** Current data */
  data: TData | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Save status for auto-save */
  saveStatus: SaveStatus
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
}
```

---

## 5. Standard Feature Directory Types

### Feature Module Exports

Each feature MUST export these from `index.ts`:

```typescript
// components/features/[feature]/index.ts

// Components (public API)
export { FeatureComponent } from './components'
export { AnotherComponent } from './components'

// Hooks
export { useFeatureQueries } from './hooks'
export { useFeatureMutations } from './hooks'

// Types
export type { FeatureData, FeatureState } from './types'

// Context (if applicable)
export { FeatureProvider, useFeatureContext } from './context'
```

### Types File Structure

```typescript
// components/features/[feature]/types.ts

// Domain entities
export interface FeatureEntity {
  id: number
  // ... entity fields
}

// Component props
export interface FeatureCardProps {
  data: FeatureEntity
  onSelect?: (id: number) => void
}

// Hook return types
export interface UseFeatureQueriesReturn {
  data: FeatureEntity[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// Context types
export interface FeatureContextValue {
  state: FeatureState<FeatureEntity>
  actions: FeatureActions
}
```

---

## 6. Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Feature Module                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   queries/   │────>│   context/   │────>│  components/ │    │
│  │  mutations   │     │   provider   │     │              │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                       types.ts                            │  │
│  │  - Entity types (from database)                          │  │
│  │  - Component props                                        │  │
│  │  - Hook return types                                      │  │
│  │  - Context types                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Shared Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  lib/        │     │  actions/    │     │  types/      │    │
│  │  persistence │     │  feature/    │     │  training.ts │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. State Transitions

### Workout Session State Machine

```
                    ┌──────────┐
                    │ assigned │
                    └────┬─────┘
                         │ startSession()
                         ▼
                    ┌──────────┐
          ┌────────│ ongoing  │────────┐
          │        └────┬─────┘        │
          │             │              │
          │ cancelSession()  completeSession()
          │             │              │
          ▼             │              ▼
    ┌───────────┐       │        ┌───────────┐
    │ cancelled │       │        │ completed │
    └───────────┘       │        └───────────┘
                        │
                        │ (auto-save on each update)
                        ▼
                 ┌─────────────┐
                 │ Draft saved │
                 │ to storage  │
                 └─────────────┘
```

### Save Status Transitions

```
           ┌─────────┐
           │  idle   │◄───────────────────┐
           └────┬────┘                    │
                │ user makes change       │ 2s after success
                ▼                         │
           ┌─────────┐               ┌────┴────┐
           │ saving  │──────────────>│  saved  │
           └────┬────┘  success      └─────────┘
                │
                │ error
                ▼
           ┌─────────┐
           │  error  │──────────────> (retry or idle after 3s)
           └─────────┘
```

---

## Summary

This data model supports:
- Type-safe mutations with rollback capability
- Persistent drafts for data recovery
- Hierarchical query keys for efficient cache invalidation
- Standard state patterns across all features
- Clear state transitions for workout sessions
