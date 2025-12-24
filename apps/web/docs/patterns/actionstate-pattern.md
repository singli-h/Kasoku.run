# ActionState Pattern

> **Last Updated**: 2025-12-24

This document describes the `ActionState<T>` pattern used for all server actions in Kasoku.

## Overview

`ActionState<T>` is a discriminated union type that provides type-safe error handling for all server actions. This pattern eliminates the need for try-catch blocks in client components and ensures consistent error handling across the application.

## Type Definition

```typescript
// types/server-action-types.ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }
```

## Why ActionState?

### Benefits

1. **Type Safety**: TypeScript knows when data is available
2. **Consistent API**: All actions follow the same pattern
3. **No Try-Catch Needed**: Client components use discriminated unions
4. **Better DX**: Clear success/error states
5. **Error Messages**: Built-in error messaging

### Without ActionState (Anti-Pattern)

```typescript
// ❌ BAD: Throwing errors
export async function getData() {
  if (!userId) throw new Error("Not authenticated")
  return data
}

// Client must use try-catch
try {
  const data = await getData()
} catch (error) {
  // Handle error
}
```

### With ActionState (Correct Pattern)

```typescript
// ✅ GOOD: Returning ActionState
export async function getDataAction(): Promise<ActionState<Data>> {
  if (!userId) {
    return { isSuccess: false, message: "Not authenticated" }
  }
  return { isSuccess: true, message: "Success", data }
}

// Client uses discriminated union
const result = await getDataAction()
if (result.isSuccess) {
  // TypeScript knows result.data exists
  console.log(result.data)
} else {
  // TypeScript knows result.data doesn't exist
  console.error(result.message)
}
```

## Standard Implementation

### Basic Action Template

```typescript
import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import { getSupabase } from "@/lib/supabase"
import { ActionState } from "@/types"
import { revalidatePath } from "next/cache"

export async function getEntityAction(
  id: number
): Promise<ActionState<Entity>> {
  try {
    // 1. Authentication
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get Supabase client
    const supabase = getSupabase()

    // 4. Query with RLS
    const { data, error } = await supabase
      .from('entities')
      .select('id, name, created_at')
      .eq('id', id)
      .eq('user_id', dbUserId)
      .single()

    if (error) throw error

    // 5. Return success
    return { isSuccess: true, message: "Entity retrieved", data }
  } catch (error) {
    // 6. Error handling
    console.error("[getEntityAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to retrieve entity"
    }
  }
}
```

### Create Action

```typescript
export async function createEntityAction(
  input: EntityInsert
): Promise<ActionState<Entity>> {
  try {
    // 1. Validation (optional, can also be done in form)
    const validated = entitySchema.parse(input)

    // 2. Authentication
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 3. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 4. Get Supabase client
    const supabase = getSupabase()

    // 5. Insert
    const { data, error } = await supabase
      .from('entities')
      .insert({ ...validated, user_id: dbUserId })
      .select()
      .single()

    if (error) throw error

    // 6. Revalidate
    revalidatePath('/entities')

    // 7. Return success
    return { isSuccess: true, message: "Entity created", data }
  } catch (error) {
    console.error("[createEntityAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create entity"
    }
  }
}
```

### Update Action

```typescript
export async function updateEntityAction(
  id: number,
  input: EntityUpdate
): Promise<ActionState<Entity>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(userId)
    const supabase = getSupabase()

    // Update with user_id check (RLS also enforces this)
    const { data, error } = await supabase
      .from('entities')
      .update(input)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/entities')
    revalidatePath(`/entities/${id}`)

    return { isSuccess: true, message: "Entity updated", data }
  } catch (error) {
    console.error("[updateEntityAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to update entity"
    }
  }
}
```

### Delete Action

```typescript
export async function deleteEntityAction(
  id: number
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(userId)
    const supabase = getSupabase()

    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('user_id', dbUserId)

    if (error) throw error

    revalidatePath('/entities')

    return { isSuccess: true, message: "Entity deleted" }
  } catch (error) {
    console.error("[deleteEntityAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to delete entity"
    }
  }
}
```

## Client-Side Usage

### With React Query

```typescript
"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { getEntityAction, createEntityAction } from "@/actions/entities"
import { toast } from "sonner"

export function EntityComponent() {
  // Query
  const { data, isLoading } = useQuery({
    queryKey: ["entity"],
    queryFn: async () => {
      const result = await getEntityAction(1)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    }
  })

  // Mutation
  const mutation = useMutation({
    mutationFn: createEntityAction,
    onSuccess: (result) => {
      if (result.isSuccess) {
        toast.success(result.message)
        // Invalidate queries
      } else {
        toast.error(result.message)
      }
    }
  })

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {data && <div>{data.name}</div>}
      <button onClick={() => mutation.mutate({ name: "New Entity" })}>
        Create
      </button>
    </div>
  )
}
```

### Direct Usage (Without React Query)

```typescript
"use client"

import { useState } from "react"
import { getEntityAction } from "@/actions/entities"

export function EntityComponent() {
  const [entity, setEntity] = useState<Entity | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    const result = await getEntityAction(1)
    if (result.isSuccess) {
      setEntity(result.data)
      setError(null)
    } else {
      setError(result.message)
      setEntity(null)
    }
  }

  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}
      {entity && <div>{entity.name}</div>}
      <button onClick={handleLoad}>Load</button>
    </div>
  )
}
```

## Error Handling Best Practices

### 1. Always Log Errors

```typescript
catch (error) {
  console.error("[actionName]:", error) // Always log with action name
  return {
    isSuccess: false,
    message: error instanceof Error ? error.message : "Failed"
  }
}
```

### 2. Provide Contextual Messages

```typescript
if (!userId) {
  return { isSuccess: false, message: "Authentication required" }
}

if (!data) {
  return { isSuccess: false, message: "Entity not found" }
}
```

### 3. Handle Specific Error Types

```typescript
catch (error) {
  if (error instanceof ZodError) {
    return { isSuccess: false, message: "Invalid input data" }
  }
  if (error.code === 'PGRST116') {
    return { isSuccess: false, message: "Entity not found" }
  }
  // ...
}
```

## Type Safety Examples

### TypeScript Knows Data Exists

```typescript
const result = await getEntityAction(1)

if (result.isSuccess) {
  // ✅ TypeScript knows result.data exists
  console.log(result.data.name) // No type error
  console.log(result.data.id)    // No type error
} else {
  // ✅ TypeScript knows result.data doesn't exist
  // console.log(result.data) // Type error!
  console.log(result.message) // Only message available
}
```

### Array Results

```typescript
export async function getEntitiesAction(): Promise<ActionState<Entity[]>> {
  // ...
  return { isSuccess: true, message: "Success", data: [] }
}

// Usage
const result = await getEntitiesAction()
if (result.isSuccess) {
  result.data.forEach(entity => {
    // TypeScript knows entity is Entity
    console.log(entity.name)
  })
}
```

## Common Patterns

### Pagination

```typescript
export async function getEntitiesAction(
  page: number = 1,
  limit: number = 10
): Promise<ActionState<{ entities: Entity[]; total: number }>> {
  // ...
  const { data, error, count } = await supabase
    .from('entities')
    .select('*', { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)

  return {
    isSuccess: true,
    message: "Entities retrieved",
    data: { entities: data || [], total: count || 0 }
  }
}
```

### Filtering

```typescript
export async function getEntitiesAction(
  filters?: EntityFilters
): Promise<ActionState<Entity[]>> {
  // ...
  let query = supabase.from('entities').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query
  // ...
}
```

## Anti-Patterns

### ❌ Don't: Return Raw Data

```typescript
// WRONG
export async function getData() {
  return data // ❌ Should return ActionState<T>
}
```

### ❌ Don't: Throw Errors

```typescript
// WRONG
export async function getData() {
  if (!userId) throw new Error("Not authenticated") // ❌ Should return ActionState
}
```

### ❌ Don't: Return Null/Undefined

```typescript
// WRONG
export async function getData() {
  if (!data) return null // ❌ Should return ActionState
}
```

### ❌ Don't: Mix Return Types

```typescript
// WRONG
export async function getData() {
  if (error) return { error: "Failed" } // ❌ Inconsistent
  return data // ❌ Inconsistent
}
```

## Related Documentation

- [Feature Pattern](./feature-pattern.md)
- [API Architecture](../development/api-architecture.md)
- [Server Actions Guide](../development/api-architecture.md#server-actions)

