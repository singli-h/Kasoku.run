# Hooks vs Context: When to Use Each

> **Last Updated**: 2025-12-24

This document explains when to use React Hooks vs Context API for state management in Kasoku.

## Overview

Kasoku uses a hybrid approach to state management:
- **React Context**: For global, shared state (user role, theme, etc.)
- **React Hooks**: For component-local state and server state
- **TanStack Query**: For server state management and caching

## Decision Framework

### Use Context When:

1. **Global State**: State needed across multiple unrelated components
2. **Provider Pattern**: Need to wrap app/feature with provider
3. **Shared Configuration**: Theme, user role, feature flags
4. **Avoid Prop Drilling**: Passing props through many levels

### Use Hooks When:

1. **Component-Local State**: State only used in one component
2. **Server State**: Data fetched from server (use TanStack Query)
3. **Form State**: Form inputs (use React Hook Form)
4. **Derived State**: Computed from props or other state
5. **Temporary State**: UI state like modals, dropdowns

## Context Patterns

### User Role Context

```typescript
// contexts/user-role-context.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

type UserRole = "athlete" | "coach" | "admin" | null

const UserRoleContext = createContext<{
  role: UserRole
  isLoading: boolean
}>({
  role: null,
  isLoading: true
})

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [role, setRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch role from server
    // ...
  }, [user])

  return (
    <UserRoleContext.Provider value={{ role, isLoading }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  return useContext(UserRoleContext)
}
```

**When to Use**: User role needed across many components (navigation, permissions, etc.)

### Theme Context

```typescript
// contexts/theme-context.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: "system",
  setTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    // Apply theme
    // ...
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

**When to Use**: Theme needed globally across all components

## Hook Patterns

### Component-Local State

```typescript
"use client"

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0) // ✅ Local state

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}
```

**When to Use**: State only used in this component

### Server State (TanStack Query)

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { getAthletesAction } from "@/actions/athletes"

export function AthletesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const result = await getAthletesAction()
      if (!result.isSuccess) throw new Error(result.message)
      return result.data
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* Render athletes */}</div>
}
```

**When to Use**: Data fetched from server (always use TanStack Query, not Context)

### Form State (React Hook Form)

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function AthleteForm() {
  const form = useForm({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      name: "",
      email: ""
    }
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

**When to Use**: Form inputs (always use React Hook Form, not Context)

## Common Patterns

### Feature-Level Context

```typescript
// components/features/workout/workout-context.tsx
"use client"

import { createContext, useContext, useState } from "react"

type WorkoutState = {
  sessionId: number | null
  currentExercise: number | null
  isActive: boolean
}

const WorkoutContext = createContext<{
  state: WorkoutState
  setState: (state: Partial<WorkoutState>) => void
} | null>(null)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>({
    sessionId: null,
    currentExercise: null,
    isActive: false
  })

  return (
    <WorkoutContext.Provider value={{ state, setState }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error("useWorkout must be used within WorkoutProvider")
  }
  return context
}
```

**When to Use**: State shared across multiple components within a feature

### Derived State Hook

```typescript
// hooks/use-filtered-athletes.ts
import { useMemo } from "react"
import { Athlete } from "@/types"

export function useFilteredAthletes(
  athletes: Athlete[],
  search: string,
  status?: string
) {
  return useMemo(() => {
    let filtered = athletes

    if (search) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }

    return filtered
  }, [athletes, search, status])
}
```

**When to Use**: Computed/derived state from props or other state

## Anti-Patterns

### ❌ Don't: Use Context for Server State

```typescript
// WRONG
const DataContext = createContext<Data[]>([])

export function DataProvider({ children }) {
  const [data, setData] = useState<Data[]>([])

  useEffect(() => {
    fetchData().then(setData) // ❌ Use TanStack Query instead
  }, [])

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  )
}
```

**Why**: TanStack Query provides caching, refetching, and better error handling

### ❌ Don't: Use Context for Form State

```typescript
// WRONG
const FormContext = createContext<FormData>({})

// ❌ Use React Hook Form instead
```

**Why**: React Hook Form provides validation, error handling, and better performance

### ❌ Don't: Use Context for Component-Local State

```typescript
// WRONG
const ModalContext = createContext<{ isOpen: boolean }>({ isOpen: false })

// ✅ Use useState instead
const [isOpen, setIsOpen] = useState(false)
```

**Why**: Unnecessary complexity for local state

### ❌ Don't: Create Context for Everything

```typescript
// WRONG - Too many contexts
<UserContext>
  <ThemeContext>
    <FeatureContext>
      <ComponentContext>
        {/* ... */}
      </ComponentContext>
    </FeatureContext>
  </ThemeContext>
</UserContext>
```

**Why**: Context should be used sparingly for truly global state

## Best Practices

### 1. Keep Context Providers Close to Consumers

```typescript
// ✅ GOOD: Provider wraps only what needs it
<WorkoutProvider>
  <WorkoutDashboard />
  <WorkoutTimer />
</WorkoutProvider>

// ❌ BAD: Provider wraps entire app when only feature needs it
<App>
  <WorkoutProvider>
    {/* Everything */}
  </WorkoutProvider>
</App>
```

### 2. Use Custom Hooks for Context

```typescript
// ✅ GOOD: Custom hook with error handling
export function useUserRole() {
  const context = useContext(UserRoleContext)
  if (!context) {
    throw new Error("useUserRole must be used within UserRoleProvider")
  }
  return context
}
```

### 3. Split Large Contexts

```typescript
// ✅ GOOD: Separate contexts for different concerns
<UserRoleContext>
  <ThemeContext>
    {/* App */}
  </ThemeContext>
</UserRoleContext>

// ❌ BAD: One large context with everything
<AppContext>
  {/* Everything */}
</AppContext>
```

## Decision Tree

```
Is state needed across multiple unrelated components?
├─ Yes → Use Context
│  ├─ Is it server state? → Use TanStack Query (not Context)
│  ├─ Is it form state? → Use React Hook Form (not Context)
│  └─ Is it truly global? → Use Context
│
└─ No → Use Hooks
   ├─ Is it server state? → Use TanStack Query
   ├─ Is it form state? → Use React Hook Form
   └─ Is it local state? → Use useState/useReducer
```

## Examples in Codebase

### Context Usage
- `contexts/user-role-context.tsx` - User role across app
- `components/features/workout/workout-context.tsx` - Workout state within feature

### Hook Usage
- `hooks/use-mobile.tsx` - Mobile detection hook
- `hooks/use-toast.ts` - Toast notifications hook
- All components use `useState` for local state

### TanStack Query Usage
- All server data fetching uses `useQuery`/`useMutation`
- See any feature component for examples

## Related Documentation

- [Feature Pattern](./feature-pattern.md)
- [Component Architecture](../architecture/component-architecture.md)
- [API Architecture](../development/api-architecture.md)

