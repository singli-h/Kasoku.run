# Quickstart: Database Schema Optimization

**Date**: 2025-12-24
**Feature**: 003-database-schema-optimization

## Quick Reference

This document provides a quick implementation reference for the database schema optimization.

---

## 1. Database Migration SQL

Execute in Supabase SQL Editor (in order):

```sql
-- Step 1: Rename tables
ALTER TABLE exercise_preset_groups RENAME TO session_plans;
ALTER TABLE exercise_presets RENAME TO session_plan_exercises;
ALTER TABLE exercise_preset_details RENAME TO session_plan_sets;
ALTER TABLE exercise_training_sessions RENAME TO workout_logs;
ALTER TABLE exercise_training_details RENAME TO workout_log_sets;

-- Step 2: Rename FK columns
ALTER TABLE session_plan_exercises RENAME COLUMN exercise_preset_group_id TO session_plan_id;
ALTER TABLE session_plan_sets RENAME COLUMN exercise_preset_id TO session_plan_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN exercise_training_session_id TO workout_log_id;

-- Step 3: Add CASCADE constraints
ALTER TABLE workout_log_sets
  DROP CONSTRAINT IF EXISTS exercise_training_details_exercise_training_session_id_fkey,
  ADD CONSTRAINT workout_log_sets_workout_log_id_fkey
    FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE;

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS exercise_training_sessions_athlete_id_fkey,
  ADD CONSTRAINT workout_logs_athlete_id_fkey
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE macrocycles
  DROP CONSTRAINT IF EXISTS macrocycles_user_id_fkey,
  ADD CONSTRAINT macrocycles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## 2. Regenerate Types

```bash
cd apps/web
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > types/database.ts
```

Then add type aliases at the end of `types/database.ts`:

```typescript
// Convenience type aliases
export type SessionPlan = Tables<"session_plans">
export type SessionPlanExercise = Tables<"session_plan_exercises">
export type SessionPlanSet = Tables<"session_plan_sets">
export type WorkoutLog = Tables<"workout_logs">
export type WorkoutLogSet = Tables<"workout_log_sets">

// Legacy aliases (deprecated - remove after migration)
export type ExercisePresetGroup = SessionPlan
export type ExercisePreset = SessionPlanExercise
export type ExercisePresetDetail = SessionPlanSet
export type ExerciseTrainingSession = WorkoutLog
export type ExerciseTrainingDetail = WorkoutLogSet
```

---

## 3. Search & Replace Patterns

### Table Names in `.from()` calls

| Find | Replace |
|------|---------|
| `from('exercise_preset_groups')` | `from('session_plans')` |
| `from('exercise_presets')` | `from('session_plan_exercises')` |
| `from('exercise_preset_details')` | `from('session_plan_sets')` |
| `from('exercise_training_sessions')` | `from('workout_logs')` |
| `from('exercise_training_details')` | `from('workout_log_sets')` |

### Foreign Key Columns

| Find | Replace |
|------|---------|
| `exercise_preset_group_id` | `session_plan_id` |
| `exercise_preset_id` (in sets context) | `session_plan_exercise_id` |
| `exercise_training_session_id` | `workout_log_id` |

### Type Names

| Find | Replace |
|------|---------|
| `ExercisePresetGroup` | `SessionPlan` |
| `ExercisePreset` | `SessionPlanExercise` |
| `ExercisePresetDetail` | `SessionPlanSet` |
| `ExerciseTrainingSession` | `WorkoutLog` |
| `ExerciseTrainingDetail` | `WorkoutLogSet` |

---

## 4. Files to Update (Priority Order)

### P0 - Critical (must update immediately after DB migration)

1. `types/database.ts` - Regenerate + aliases
2. `types/training.ts` - Extended types
3. `types/index.ts` - Re-exports
4. `actions/sessions/training-session-actions.ts` - 40+ refs
5. `actions/library/exercise-actions.ts` - 30+ refs
6. `actions/plans/session-plan-actions.ts` - 25+ refs
7. `actions/workout/workout-session-actions.ts` - 15 refs

### P1 - High (update after actions)

8. `actions/plans/plan-actions.ts` - 12 refs
9. `actions/plans/session-planner-actions.ts` - 10 refs
10. `actions/plans/plan-assignment-actions.ts` - 5 refs
11. `actions/dashboard/dashboard-actions.ts` - 3 refs
12. `components/features/workout/context/exercise-context.tsx`
13. `components/features/workout/hooks/*.ts`
14. `components/features/plans/session-planner/types.ts`

### P2 - Medium (update last)

15. Remaining component files
16. `lib/changeset/entity-mappings.ts`
17. `lib/validation/training-schemas.ts`
18. Documentation files

---

## 5. Verification Commands

```bash
# After each file update
npm run type-check

# After all updates
npm run lint
npm run build

# Manual verification
# 1. Create a session plan in UI
# 2. Start a workout from that plan
# 3. Log sets in workout
# 4. Delete a session plan (verify cascade)
# 5. Verify workout log still exists (SET NULL)
```

---

## 6. Common Issues & Solutions

### Issue: "Table not found"
**Cause**: Database migration not applied
**Solution**: Run Step 1 SQL in Supabase

### Issue: Type errors after migration
**Cause**: Types not regenerated
**Solution**: Run `npx supabase gen types typescript`

### Issue: RLS blocking queries
**Cause**: Policies reference old table names (should auto-update, but verify)
**Solution**: Check policies in Supabase dashboard

### Issue: FK constraint errors
**Cause**: Old constraint names in code
**Solution**: Update constraint names in SQL and code

---

## 7. Rollback Plan

If issues occur, rollback in reverse order:

```sql
-- Rollback table renames
ALTER TABLE session_plans RENAME TO exercise_preset_groups;
ALTER TABLE session_plan_exercises RENAME TO exercise_presets;
ALTER TABLE session_plan_sets RENAME TO exercise_preset_details;
ALTER TABLE workout_logs RENAME TO exercise_training_sessions;
ALTER TABLE workout_log_sets RENAME TO exercise_training_details;

-- Rollback FK columns
ALTER TABLE exercise_presets RENAME COLUMN session_plan_id TO exercise_preset_group_id;
ALTER TABLE exercise_preset_details RENAME COLUMN session_plan_exercise_id TO exercise_preset_id;
ALTER TABLE exercise_training_details RENAME COLUMN workout_log_id TO exercise_training_session_id;
```

Then revert code changes and regenerate types.
