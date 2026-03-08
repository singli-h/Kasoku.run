# Pattern Documentation

> **Last Updated**: 2025-12-25

This directory contains reusable code patterns and architectural guidelines for consistent implementation across the Kasoku application.

## Available Patterns

### Core Patterns

#### [Feature Pattern](./feature-pattern.md)
Standard structure and patterns for implementing features in Kasoku. Includes component architecture, server action patterns, data flow, and testing guidelines.

#### [ActionState Pattern](./actionstate-pattern.md)
The `ActionState<T>` discriminated union pattern used for all server actions. Provides type-safe error handling and consistent API across all actions.

### State Management

#### [State Management Pattern](./state-management-pattern.md)
Comprehensive guide to state management in Kasoku, including Feature Context patterns, auto-save, undo/redo, and AI changeset integration.

#### [Hooks vs Context](./hooks-vs-context.md)
Decision guide for when to use React Hooks vs Context API for state management. Includes patterns, examples, and anti-patterns.

### Data Layer

#### [React Query Caching Pattern](./react-query-caching-pattern.md)
TanStack Query patterns for server state management, including query configuration, cache strategies, invalidation patterns, and prefetching.

#### [Server Actions Pattern](./server-actions-pattern.md)
Advanced server action patterns for complex operations, batch updates, transaction-like operations, and ID format conventions.

## Quick Reference

| Pattern | When to Use |
|---------|-------------|
| **Feature Pattern** | Implementing any new feature |
| **ActionState Pattern** | All server actions |
| **State Management Pattern** | Complex feature state with undo/redo |
| **Hooks vs Context** | Deciding between hooks and context |
| **React Query Pattern** | Server data fetching and caching |
| **Server Actions Pattern** | Complex save operations, batch updates |

## Pattern Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    Feature Pattern                       │
│  (Overall structure for any feature implementation)      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │  State Mgmt     │    │  Data Layer              │    │
│  │  - Context      │    │  - React Query           │    │
│  │  - Hooks        │    │  - Server Actions        │    │
│  │  - ActionState  │    │  - Cache Invalidation    │    │
│  └─────────────────┘    └──────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Examples in Codebase

### Session Planner (Full Pattern Implementation)

```
components/features/plans/session-planner/
├── config/
│   └── query-config.ts           # Query keys, cache times
├── hooks/
│   ├── use-session-planner-queries.ts
│   └── index.ts
├── context/
│   ├── session-planner-context.tsx
│   └── index.ts
├── components/
│   └── ...
└── types.ts

actions/plans/
├── session-planner-actions.ts    # Comprehensive save action
└── ...
```

### Workout (Full Pattern Implementation)

```
components/features/workout/
├── config/
│   └── query-config.ts
├── hooks/
│   ├── use-workout-queries.ts
│   └── ...
├── context/
│   └── exercise-context.tsx
└── ...

actions/workout/
└── workout-session-actions.ts
```

## Related Documentation

- [API Architecture](../development/api-architecture.md)
- [Component Architecture](../architecture/component-architecture.md)
- [Security Patterns](../security/row-level-security-analysis.md)
- [Loading Patterns](../development/loading-patterns.md)
