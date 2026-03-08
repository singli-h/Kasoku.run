# API Contracts

**Feature**: 001-frontend-responsive-design

---

## Overview

**No new API contracts.** This feature is CSS-only and uses existing server actions.

---

## Existing Contracts (Reference Only)

These server actions are already implemented and will be tested via browser automation:

### Plans Page Actions

**File**: `apps/web/actions/plans/plan-actions.ts`

#### `createMacrocycleAction(input: CreateMacrocycleForm): Promise<ActionState<Macrocycle>>`

**Input**:
```typescript
{
  name: string;
  start_date: Date;
  end_date: Date;
  race_date?: Date;
}
```

**Output**:
```typescript
ActionState<{
  id: string;
  name: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
}>
```

**Browser Test**: Verify creates row in `macrocycles` table

---

#### `updateMacrocycleAction(id: string, input: Partial<CreateMacrocycleForm>): Promise<ActionState<Macrocycle>>`

**Browser Test**: Verify updates row in `macrocycles` table

---

#### `deleteMacrocycleAction(id: string): Promise<ActionState<void>>`

**Browser Test**: Verify deletes row from `macrocycles` table and cascades to mesocycles

---

### Session Page Actions

**File**: `apps/web/actions/plans/session-planner-actions.ts`

#### `saveSessionWithExercisesAction(session: Session, exercises: SessionExercise[]): Promise<ActionState<void>>`

**Browser Test**: Verify creates rows in `exercise_preset_groups`, `exercise_presets`, and `exercise_preset_details` tables

---

### Workout Page Actions

**File**: `apps/web/actions/sessions/training-session-actions.ts`

#### `startTrainingSessionAction(sessionId: string): Promise<ActionState<void>>`

**Browser Test**: Verify updates `status` from 'assigned' → 'ongoing' in `exercise_training_sessions` table

---

#### `completeTrainingSessionAction(sessionId: string): Promise<ActionState<void>>`

**Browser Test**: Verify updates `status` to 'completed' and sets `completed_at` timestamp

---

#### `addExercisePerformanceAction(sessionId: string, exerciseId: string, setData: SetData): Promise<ActionState<void>>`

**Browser Test**: Verify creates row in `exercise_training_details` table

---

## Contract Testing Strategy

Since all contracts already exist, browser tests will verify:

1. **Request/Response Format**: Actions still accept/return correct types after CSS changes
2. **Database Side Effects**: All CRUD operations persist to Supabase correctly
3. **Error Handling**: Actions return proper `ActionState` error responses
4. **Authorization**: RLS policies still enforce user ownership

**Testing Tool**: Cursor browser tool + Supabase MCP integration

**Pattern**:
```typescript
// 1. Perform UI action
await browser.click('button[data-testid="create-macrocycle"]');
await browser.fill('input[name="name"]', 'Test Macrocycle');
await browser.click('button[type="submit"]');

// 2. Verify database state via Supabase MCP
const result = await supabase
  .from('macrocycles')
  .select('*')
  .eq('name', 'Test Macrocycle')
  .single();

expect(result.data).toBeTruthy();
expect(result.data.user_id).toBe(currentUserId);
```

---

## Summary

No new contracts defined. All existing server actions will be regression tested via browser automation to ensure CSS changes don't break functionality.
