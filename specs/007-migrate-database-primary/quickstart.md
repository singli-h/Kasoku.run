# Quickstart: UUID Migration for Primary Keys

**Feature**: 007-migrate-database-primary
**Date**: 2026-01-02

## Overview

This migration changes primary keys from auto-increment integers to native PostgreSQL UUIDs for 6 session/workout tables. This enables client-side ID generation via `crypto.randomUUID()`, eliminating temp ID resolution complexity in AI tools.

## Prerequisites

- [ ] Database backup completed
- [ ] Application in maintenance mode (no active users during migration)
- [ ] Access to Supabase SQL editor or migration tool
- [ ] TypeScript code changes ready but not deployed

## Migration Order

Execute migrations in this exact order. Verify each step before proceeding.

### Step 1: Add UUID Columns (Safe, Non-Breaking)

```bash
# Apply migration
supabase db push --db-url $DATABASE_URL < contracts/01_add_uuid_columns.sql
```

**Verify**: New `new_id` and `new_*_id` columns exist on all 6 tables.

### Step 2: Populate UUIDs (Safe, Non-Breaking)

```bash
# Apply migration
supabase db push --db-url $DATABASE_URL < contracts/02_populate_uuids.sql
```

**Verify**:
- All rows have UUIDs in `new_id` columns
- All foreign key references populated in `new_*_id` columns
- Check orphan queries return 0 rows

### Step 3: Swap Columns (Breaking Change)

**IMPORTANT**: Deploy TypeScript code changes BEFORE this step.

```bash
# Apply migration
supabase db push --db-url $DATABASE_URL < contracts/03_swap_columns.sql
```

**Verify**:
- `id` columns now contain UUIDs
- Old integer IDs in `old_id` backup columns
- Foreign key constraints working

### Step 4: Test Application

Before cleanup, verify:
- [ ] Application builds without type errors
- [ ] CRUD operations work for all 6 tables
- [ ] AI tools can create exercise + sets in single conversation
- [ ] Existing data displays correctly

### Step 5: Cleanup (Final, Irreversible)

Only after thorough testing:

```bash
# Apply migration
supabase db push --db-url $DATABASE_URL < contracts/04_cleanup.sql
```

**Verify**:
- No `old_*` columns remain
- Sequences dropped
- UUID defaults working

## Rollback

If issues occur BEFORE cleanup step:

```bash
supabase db push --db-url $DATABASE_URL < contracts/rollback.sql
```

**Note**: Rollback requires backup columns to exist. After cleanup, rollback is NOT possible.

## TypeScript Code Changes

### 1. Update buffer-utils.ts

```typescript
// Before
export function generateTempId(): string {
  tempIdCounter += 1
  return `${TEMP_ID_PREFIX}${tempIdCounter.toString().padStart(3, '0')}`
}

// After
export function generateEntityId(): string {
  return crypto.randomUUID()
}
```

### 2. Update Type Definitions

Change all affected ID fields from `number` to `string`:

```typescript
// types/database.ts
interface SessionPlan {
  id: string  // was: number
  // ...
}

interface SessionPlanExercise {
  id: string  // was: number
  session_plan_id: string  // was: number
  // ...
}
```

### 3. Regenerate Supabase Types

After migration step 3:

```bash
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > types/supabase.ts
```

### 4. Remove Temp ID Code

After UUID migration verified working:
- Remove `isTempId()` function usage where no longer needed
- Remove temp ID resolution logic from execute layers
- Clean up `TEMP_ID_PREFIX` constant if unused

## Verification Checklist

| Check | Expected | Actual |
|-------|----------|--------|
| session_plans row count | 39 | |
| session_plan_exercises row count | 107 | |
| session_plan_sets row count | 114 | |
| workout_logs row count | 20 | |
| workout_log_exercises row count | 68 | |
| workout_log_sets row count | 100 | |
| Type check passes | Yes | |
| Build succeeds | Yes | |
| AI creates exercise + sets | Yes | |

## Troubleshooting

### Foreign Key Violation During Swap

If FK constraints fail during step 3, check for orphaned records:

```sql
-- Find orphaned records
SELECT * FROM session_plan_exercises WHERE new_session_plan_id IS NULL;
```

Fix by either populating the UUID or deleting orphaned records.

### Type Errors After Migration

Ensure all ID comparisons use string, not number:

```typescript
// Wrong
if (exercise.id === 123) { ... }

// Correct
if (exercise.id === '550e8400-e29b-41d4-a716-446655440000') { ... }
```

### Rollback Fails

If rollback script fails, backup columns may have been dropped. Restore from database backup.

## Success Criteria

- [ ] SC-001: AI creates exercise + sets in single conversation (100% success)
- [ ] SC-002: All data migrated with zero loss
- [ ] SC-003: All FK relationships preserved
- [ ] SC-004: Build passes with zero type errors
- [ ] SC-005: All existing tests pass
- [ ] SC-006: No temp ID code remains
