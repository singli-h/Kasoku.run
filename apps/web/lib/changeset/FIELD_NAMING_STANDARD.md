# ChangeSet Field Naming Standard

> **Created**: 2026-01-01
> **Purpose**: Prevent field name conversion bugs between camelCase and snake_case

## Problem Statement

The changeset system handles data flow between:
1. **AI Tool Input** (camelCase) - e.g., `workoutLogExerciseId`
2. **Database Columns** (snake_case) - e.g., `workout_log_exercise_id`

Converting between these formats can cause bugs when:
- Multiple camelCase fields map to the same snake_case value (e.g., all ID fields map to `'id'`)
- Foreign key fields get converted incorrectly (e.g., `workout_log_exercise_id` → `workoutLogExerciseIdFk` instead of `workoutLogExerciseId`)

## The Standard

### 1. `proposedData` and `currentData` Always Use snake_case

After transformation, the `proposedData` field in `ChangeRequest` should contain snake_case keys matching database columns.

```typescript
// CORRECT: proposedData uses snake_case
const changeRequest: ChangeRequest = {
  entityType: 'workout_log_set',
  proposedData: {
    workout_log_exercise_id: 123,  // snake_case FK
    set_index: 1,
    reps: 8,
    weight: 100,
  }
}
```

### 2. Execution Layer Uses snake_case Directly

**DO NOT** call `convertKeysToCamelCase(proposedData)` in execution code.
Read snake_case fields directly:

```typescript
// CORRECT: Read snake_case directly
const workoutLogExerciseId = proposedData?.workout_log_exercise_id as number

// WRONG: Converting causes bugs
const data = convertKeysToCamelCase(proposedData)
const workoutLogExerciseId = data?.workoutLogExerciseId // May be undefined!
```

### 3. UI Components Check Both Formats (for Compatibility)

When reading `proposedData` in UI hooks/components, check both formats as fallback:

```typescript
// CORRECT: Check both formats for robustness
const parentExerciseId =
  proposedData?.session_plan_exercise_id ??  // Primary: snake_case
  proposedData?.sessionPlanExerciseId        // Fallback: legacy camelCase
```

## Why This Happens

The `CAMEL_TO_SNAKE_MAP` has multiple camelCase keys mapping to the same snake_case value:

```typescript
const CAMEL_TO_SNAKE_MAP = {
  sessionPlanId: 'id',           // PK of session_plans
  sessionPlanExerciseId: 'id',   // PK of session_plan_exercises
  sessionPlanSetId: 'id',        // PK of session_plan_sets
  workoutLogExerciseId: 'id',    // PK of workout_log_exercises
  // ...
  workoutLogExerciseId_fk: 'workout_log_exercise_id',  // FK field
}
```

When reversing (snake → camel), only the **last** mapping is kept:

```typescript
const SNAKE_TO_CAMEL_MAP = {
  'id': 'workoutLogSetId',  // Last one wins!
  'workout_log_exercise_id': 'workoutLogExerciseIdFk',  // Note: _fk suffix!
}
```

This causes `workout_log_exercise_id` to become `workoutLogExerciseIdFk`, not `workoutLogExerciseId`.

## Files Following This Standard

### Execution Files
- `execute-workout.ts` - Uses snake_case directly (fixed 2026-01-01)
- `execute.ts` - Uses fallback pattern (both formats checked)

### Transformation Files
- `transformations.ts` - Converts AI input to snake_case for storage
- `entity-mappings.ts` - Defines field mappings

### UI Hooks
- `useAISetChanges.ts` - Checks both formats
- `useAIExerciseChanges.ts` - Checks both formats

## Migration Notes

When updating old code:

1. **Remove** `convertKeysToCamelCase()` calls in execution paths
2. **Change** field access from camelCase to snake_case
3. **Add** debug logging to verify correct field names

Example migration:

```typescript
// BEFORE (buggy)
const proposedData = convertKeysToCamelCase(request.proposedData)
const exerciseId = proposedData?.workoutLogExerciseId

// AFTER (correct)
const proposedData = request.proposedData  // Already snake_case
const exerciseId = proposedData?.workout_log_exercise_id
```

## Related Files

- [entity-mappings.ts](./entity-mappings.ts) - Field name mappings
- [transformations.ts](./transformations.ts) - Input transformation
- [execute-workout.ts](./execute-workout.ts) - Workout execution
- [execute.ts](./execute.ts) - Session execution
