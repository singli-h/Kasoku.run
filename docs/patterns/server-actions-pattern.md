# Server Actions Pattern

> **Last Updated**: 2025-12-25

This document describes advanced server action patterns used in Kasoku for complex operations, batch updates, and transaction-like operations.

## Overview

Kasoku uses Next.js Server Actions for all data mutations. This document extends the [ActionState Pattern](./actionstate-pattern.md) with advanced patterns for complex scenarios.

## Basic Pattern

See [ActionState Pattern](./actionstate-pattern.md) for the fundamental pattern:

```typescript
export async function myAction(input: Input): Promise<ActionState<Output>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }

    // ... operation

    revalidatePath('/path')
    return { isSuccess: true, message: 'Success', data }
  } catch (error) {
    console.error('[myAction]:', error)
    return { isSuccess: false, message: 'Failed' }
  }
}
```

## Comprehensive Save Pattern

For complex features that need to save multiple related entities atomically:

```typescript
/**
 * Save complete session with all exercises and sets
 * Handles: session metadata, exercise order, supersets, and all set parameters
 * Performs atomic transaction-like operations for data consistency
 *
 * ID Format Convention:
 * - Existing records: Numeric ID as string (e.g., "123") - will be updated
 * - New items: "new_" prefix (e.g., "new_1735123456789") - will be inserted
 */
export async function saveSessionWithExercisesAction(
  sessionId: number,
  sessionUpdates: Partial<Session>,
  exercises: SessionExercise[]
): Promise<ActionState<SessionPlan>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Step 1: Verify ownership
    const { data: existingSession, error: fetchError } = await supabase
      .from('session_plans')
      .select('id, user_id, microcycle_id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      return { isSuccess: false, message: "Session not found" }
    }

    if (existingSession.user_id !== dbUserId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Step 2: Update session metadata
    if (Object.keys(sessionUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('session_plans')
        .update(sessionUpdates)
        .eq('id', sessionId)

      if (updateError) {
        return { isSuccess: false, message: updateError.message }
      }
    }

    // Step 3: Categorize exercises (update vs insert vs delete)
    const { data: existingExercises } = await supabase
      .from('session_plan_exercises')
      .select('id')
      .eq('session_plan_id', sessionId)

    const existingIds = new Set((existingExercises || []).map(e => e.id))
    const exercisesToUpdate: SessionExercise[] = []
    const exercisesToInsert: SessionExercise[] = []
    const idsToKeep = new Set<number>()

    for (const exercise of exercises) {
      const idStr = String(exercise.id)
      const isNew = idStr.startsWith('new_')

      if (isNew) {
        exercisesToInsert.push(exercise)
      } else {
        const dbId = parseInt(idStr, 10)
        if (!isNaN(dbId) && existingIds.has(dbId)) {
          exercisesToUpdate.push(exercise)
          idsToKeep.add(dbId)
        } else {
          exercisesToInsert.push(exercise)
        }
      }
    }

    // Step 4: Delete removed exercises
    const idsToDelete = Array.from(existingIds).filter(id => !idsToKeep.has(id))
    if (idsToDelete.length > 0) {
      await supabase
        .from('session_plan_sets')
        .delete()
        .in('session_plan_exercise_id', idsToDelete)

      await supabase
        .from('session_plan_exercises')
        .delete()
        .in('id', idsToDelete)
    }

    // Step 5: Update existing exercises
    for (const exercise of exercisesToUpdate) {
      const dbId = parseInt(String(exercise.id), 10)

      await supabase
        .from('session_plan_exercises')
        .update({
          exercise_id: exercise.exercise_id,
          exercise_order: exercise.exercise_order,
          notes: exercise.notes
        })
        .eq('id', dbId)

      // Replace sets
      await supabase
        .from('session_plan_sets')
        .delete()
        .eq('session_plan_exercise_id', dbId)

      if (exercise.sets.length > 0) {
        await supabase
          .from('session_plan_sets')
          .insert(exercise.sets.map(set => ({
            session_plan_exercise_id: dbId,
            ...set
          })))
      }
    }

    // Step 6: Insert new exercises
    for (const exercise of exercisesToInsert) {
      const { data: newExercise } = await supabase
        .from('session_plan_exercises')
        .insert({
          session_plan_id: sessionId,
          exercise_id: exercise.exercise_id,
          exercise_order: exercise.exercise_order
        })
        .select('id')
        .single()

      if (newExercise && exercise.sets.length > 0) {
        await supabase
          .from('session_plan_sets')
          .insert(exercise.sets.map(set => ({
            session_plan_exercise_id: newExercise.id,
            ...set
          })))
      }
    }

    // Step 7: Fetch and return updated session
    const { data: updatedSession } = await supabase
      .from('session_plans')
      .select('*')
      .eq('id', sessionId)
      .single()

    // Step 8: Revalidate cache paths
    revalidatePath('/plans')
    revalidatePath(`/plans/[id]`, 'page')
    revalidatePath(`/plans/[id]/session/[sessionId]`, 'page')

    return {
      isSuccess: true,
      message: "Session saved successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error('[saveSessionWithExercisesAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Failed to save'
    }
  }
}
```

## ID Format Convention

Consistent ID format for distinguishing new vs existing items:

```typescript
/**
 * ID Format Convention:
 * - Existing database records: Numeric ID as string (e.g., "123")
 * - New client-side items: "new_" prefix (e.g., "new_1735123456789")
 */

// Check if ID is new
function isNewItem(id: string | number): boolean {
  const idStr = String(id)
  return idStr.startsWith('new_') || idStr.startsWith('new-')
}

// Generate new ID
function generateNewId(): string {
  return `new_${Date.now()}`
}

// Parse existing ID
function parseExistingId(id: string | number): number | null {
  const idStr = String(id)
  if (isNewItem(idStr)) return null
  const parsed = parseInt(idStr, 10)
  return isNaN(parsed) ? null : parsed
}
```

## Batch Operations

For operations on multiple items:

```typescript
export async function batchUpdateExercisesAction(
  exercises: Array<{ id: number; updates: Partial<Exercise> }>
): Promise<ActionState<number>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership of all exercises
    const exerciseIds = exercises.map(e => e.id)
    const { data: existing } = await supabase
      .from('exercises')
      .select('id, user_id')
      .in('id', exerciseIds)

    const unauthorized = existing?.filter(e => e.user_id !== dbUserId)
    if (unauthorized && unauthorized.length > 0) {
      return { isSuccess: false, message: "Unauthorized access to some exercises" }
    }

    // Perform batch updates
    let updatedCount = 0
    for (const { id, updates } of exercises) {
      const { error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)

      if (!error) updatedCount++
    }

    revalidatePath('/exercises')

    return {
      isSuccess: true,
      message: `Updated ${updatedCount} exercises`,
      data: updatedCount
    }
  } catch (error) {
    console.error('[batchUpdateExercisesAction]:', error)
    return { isSuccess: false, message: 'Batch update failed' }
  }
}
```

## Optimistic Actions

Return immediately with optimistic data while operation completes:

```typescript
export async function toggleSetCompleteAction(
  setId: number,
  completed: boolean
): Promise<ActionState<{ id: number; completed: boolean }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    // Fast operation - update single field
    const { error } = await supabase
      .from('workout_log_sets')
      .update({ completed })
      .eq('id', setId)

    if (error) {
      return { isSuccess: false, message: error.message }
    }

    // Return the expected state (no need to refetch)
    return {
      isSuccess: true,
      message: completed ? 'Set completed' : 'Set uncompleted',
      data: { id: setId, completed }
    }
  } catch (error) {
    console.error('[toggleSetCompleteAction]:', error)
    return { isSuccess: false, message: 'Toggle failed' }
  }
}
```

## Cache Revalidation Patterns

### Single Path

```typescript
revalidatePath('/plans')
```

### Dynamic Paths

```typescript
revalidatePath(`/plans/${planId}`)
revalidatePath(`/plans/[id]`, 'page') // All dynamic segments
```

### Multiple Related Paths

```typescript
// After mutation that affects multiple views
revalidatePath('/plans')
revalidatePath(`/plans/${planId}`)
revalidatePath(`/athletes/${athleteId}/plans`)
```

### Full Layout Revalidation

```typescript
revalidatePath('/', 'layout') // Revalidate entire app
```

## Error Handling Patterns

### Specific Error Types

```typescript
try {
  // ... operation
} catch (error) {
  console.error('[actionName]:', error)

  // Handle specific error types
  if (error instanceof ZodError) {
    return { isSuccess: false, message: 'Invalid input data' }
  }

  if (error.code === '23505') { // Postgres unique violation
    return { isSuccess: false, message: 'Item already exists' }
  }

  if (error.code === '23503') { // Postgres foreign key violation
    return { isSuccess: false, message: 'Referenced item not found' }
  }

  return {
    isSuccess: false,
    message: error instanceof Error ? error.message : 'Operation failed'
  }
}
```

### User-Friendly Messages

```typescript
// ✅ GOOD: User-friendly message
return { isSuccess: false, message: 'Session not found' }

// ❌ BAD: Technical message
return { isSuccess: false, message: 'PGRST116: not found' }
```

## Action Organization

### File Structure

```
actions/
├── auth/
│   └── auth-helpers.ts
├── plans/
│   ├── plan-actions.ts          # CRUD for plans
│   ├── session-plan-actions.ts  # Session plan CRUD
│   └── session-planner-actions.ts # Complex session editing
├── workout/
│   └── workout-session-actions.ts
└── library/
    └── exercise-actions.ts
```

### Naming Convention

```typescript
// CRUD operations
export async function getPlansAction()
export async function getPlanByIdAction(id: number)
export async function createPlanAction(input: PlanInput)
export async function updatePlanAction(id: number, input: Partial<PlanInput>)
export async function deletePlanAction(id: number)

// Complex operations
export async function saveSessionWithExercisesAction(...)
export async function duplicatePlanAction(planId: number)
export async function assignPlanToAthleteAction(planId: number, athleteId: number)
```

## Integration with React Query

```typescript
// hooks/use-session-planner-queries.ts
const saveMutation = useMutation({
  mutationFn: async (params: SaveParams) => {
    const result = await saveSessionWithExercisesAction(
      params.sessionId,
      params.session,
      params.exercises
    )

    // ActionState integration
    if (!result.isSuccess) {
      throw new Error(result.message)
    }

    return result.data
  },
  onSuccess: (data) => {
    // Invalidate related queries
    queryClient.invalidateQueries(['session-plan', params.sessionId])
    queryClient.invalidateQueries(['session-plans', data.microcycle_id])
  },
  onError: (error) => {
    console.error('Save failed:', error)
    toast.error(error.message)
  }
})
```

## Best Practices

### 1. Always Verify Ownership

```typescript
// Verify before any modification
const { data: resource } = await supabase
  .from('table')
  .select('user_id')
  .eq('id', resourceId)
  .single()

if (resource?.user_id !== dbUserId) {
  return { isSuccess: false, message: "Unauthorized" }
}
```

### 2. Use Explicit Filters

```typescript
// ✅ GOOD: Explicit filter (even with RLS)
.eq('user_id', dbUserId)

// ❌ BAD: Rely only on RLS
// RLS should be defense-in-depth, not primary
```

### 3. Log with Context

```typescript
console.error('[saveSessionWithExercisesAction] Step 5 failed:', error)
// Instead of just:
console.error('Error:', error)
```

### 4. Revalidate After Mutations

```typescript
// After any mutation
revalidatePath('/affected-path')
```

## Related Documentation

- [ActionState Pattern](./actionstate-pattern.md)
- [React Query Caching Pattern](./react-query-caching-pattern.md)
- [API Architecture](../development/api-architecture.md)
- [Security Patterns](../security/row-level-security-analysis.md)
