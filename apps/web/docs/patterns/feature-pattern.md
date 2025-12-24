# Feature Pattern Standard

> **Last Updated**: 2025-12-24

This document defines the standard structure and patterns for implementing features in the Kasoku application.

## Overview

All features in Kasoku follow a consistent structure that ensures maintainability, testability, and clear separation of concerns.

## Standard Feature Structure

```
apps/web/
├── app/(protected)/[feature-name]/
│   └── page.tsx                    # Main feature page (server component)
├── components/features/[feature-name]/
│   ├── [feature-name]-page.tsx    # Main feature component
│   ├── [feature-name]-form.tsx    # Form components (if applicable)
│   ├── [feature-name]-list.tsx     # List/table components (if applicable)
│   └── index.ts                    # Exports
├── actions/[feature-name]/
│   ├── [feature-name]-actions.ts  # Server actions
│   └── index.ts                    # Exports
└── docs/features/[feature-name]/
    └── [feature-name]-overview.md  # Feature documentation
```

## Component Architecture

### Three-Layer Component Structure

1. **UI Components** (`components/ui/`)
   - Primitive, reusable components
   - No business logic
   - Examples: `Button`, `Input`, `Card`, `Dialog`

2. **Composed Components** (`components/composed/`)
   - Compound components built from UI primitives
   - Minimal business logic
   - Examples: `DataTable`, `FormField`, `PageLayout`

3. **Feature Components** (`components/features/[feature-name]/`)
   - Feature-specific components with business logic
   - Connected to server actions
   - Examples: `AthleteManagementDashboard`, `WorkoutSessionDashboard`

## Server Actions Pattern

### Standard Action Structure

All server actions follow the `ActionState<T>` pattern:

```typescript
import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import { getSupabase } from "@/lib/supabase"
import { ActionState } from "@/types"

export async function getFeatureDataAction(
  filters?: FeatureFilters
): Promise<ActionState<FeatureData[]>> {
  try {
    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // 2. Get database user ID
    const dbUserId = await getDbUserId(userId)

    // 3. Get Supabase client
    const supabase = getSupabase()

    // 4. Query with RLS (policies handle access control)
    const { data, error } = await supabase
      .from('feature_table')
      .select('id, name, created_at')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { isSuccess: true, message: "Success", data: data || [] }
  } catch (error) {
    console.error("[getFeatureDataAction]:", error)
    return { 
      isSuccess: false, 
      message: error instanceof Error ? error.message : "Failed to fetch data" 
    }
  }
}
```

### Action Naming Convention

- **Get operations**: `get[Entity]Action` (e.g., `getAthletesAction`)
- **Create operations**: `create[Entity]Action` (e.g., `createPlanAction`)
- **Update operations**: `update[Entity]Action` (e.g., `updateAthleteAction`)
- **Delete operations**: `delete[Entity]Action` (e.g., `deletePlanAction`)
- **List operations**: `get[Entity]ListAction` (e.g., `getPlansListAction`)

## Page Structure

### Server Component Pattern

```typescript
// app/(protected)/feature-name/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { FeaturePage } from "@/components/features/feature-name/feature-page"

export default async function FeaturePageRoute() {
  // 1. Authentication check
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  // 2. Optional: Role check
  // const hasAccess = await hasRoleAction(userId, "coach")
  // if (!hasAccess) {
  //   redirect("/dashboard")
  // }

  // 3. Render feature component
  return <FeaturePage />
}
```

### Client Component Pattern

```typescript
// components/features/feature-name/feature-page.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { getFeatureDataAction } from "@/actions/feature-name"
import { DataTable } from "@/components/composed/data-table"
import { Button } from "@/components/ui/button"

export function FeaturePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feature-data"],
    queryFn: async () => {
      const result = await getFeatureDataAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Feature Name</h1>
        <Button>Add New</Button>
      </div>
      <DataTable data={data} />
    </div>
  )
}
```

## Data Flow Pattern

```
User Interaction
    ↓
Client Component (React Query)
    ↓
Server Action (Authentication + RLS)
    ↓
Supabase Query (RLS Policies)
    ↓
Database
    ↓
Response (ActionState<T>)
    ↓
Client Component (Update UI)
```

## Error Handling Pattern

### Server Actions

```typescript
export async function createFeatureAction(
  input: FeatureInput
): Promise<ActionState<Feature>> {
  try {
    // Validation
    const validated = featureSchema.parse(input)
    
    // Authentication
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    // Business logic
    const dbUserId = await getDbUserId(userId)
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('features')
      .insert({ ...validated, user_id: dbUserId })
      .select()
      .single()

    if (error) throw error

    // Revalidation
    revalidatePath('/feature-name')

    return { isSuccess: true, message: "Feature created", data }
  } catch (error) {
    console.error("[createFeatureAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create"
    }
  }
}
```

### Client Components

```typescript
const mutation = useMutation({
  mutationFn: createFeatureAction,
  onSuccess: (result) => {
    if (result.isSuccess) {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: ["feature-data"] })
    } else {
      toast.error(result.message)
    }
  }
})
```

## Form Pattern

### React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const featureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type FeatureFormData = z.infer<typeof featureSchema>

export function FeatureForm() {
  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  })

  const mutation = useMutation({
    mutationFn: createFeatureAction,
    onSuccess: (result) => {
      if (result.isSuccess) {
        toast.success("Feature created")
        form.reset()
      } else {
        toast.error(result.message)
      }
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          Create
        </Button>
      </form>
    </Form>
  )
}
```

## Testing Pattern

### Unit Tests

```typescript
// __tests__/actions/feature-name/feature-actions.test.ts
import { createFeatureAction } from "@/actions/feature-name"

describe("createFeatureAction", () => {
  it("should create feature when authenticated", async () => {
    // Mock auth
    // Mock Supabase
    // Test action
  })
})
```

### E2E Tests

```typescript
// __tests__/e2e/feature-name/feature-name.e2e.ts
import { test, expect } from "@playwright/test"

test.describe("Feature Name", () => {
  test("should display feature list", async ({ page }) => {
    await page.goto("/feature-name")
    await expect(page.getByRole("heading", { name: "Feature Name" })).toBeVisible()
  })
})
```

## Documentation Pattern

Each feature should have:

1. **Feature Overview** (`docs/features/[feature-name]/[feature-name]-overview.md`)
   - User story
   - Workflow
   - Implementation status
   - Gaps/TODOs

2. **Code Comments**
   - Explain business logic
   - Document complex operations
   - Include examples for reusable patterns

## Anti-Patterns

### ❌ Don't: Direct Supabase calls in components

```typescript
// WRONG
"use client"
export function FeatureComponent() {
  const supabase = createClient() // ❌ Don't create clients in components
  // ...
}
```

### ❌ Don't: Bypass server actions

```typescript
// WRONG
export async function POST(req: Request) {
  // Complex business logic here ❌
  // Should be in server action
}
```

### ❌ Don't: Return raw data from actions

```typescript
// WRONG
export async function getData() {
  return data // ❌ Should return ActionState<T>
}
```

## Examples

See existing features for reference:
- **Athletes**: `components/features/athletes/`, `actions/athletes/`
- **Plans**: `components/features/plans/`, `actions/plans/`
- **Sessions**: `components/features/sessions/`, `actions/sessions/`

## Related Documentation

- [ActionState Pattern](./actionstate-pattern.md)
- [API Architecture](../development/api-architecture.md)
- [Component Architecture](../architecture/component-architecture.md)
- [Security Patterns](../security/row-level-security-analysis.md)

