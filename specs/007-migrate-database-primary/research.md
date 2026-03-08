# Research: UUID Migration for Primary Keys

**Feature**: 007-migrate-database-primary
**Date**: 2026-01-02

## Research Questions

### 1. PostgreSQL UUID Support in Supabase

**Question**: What UUID functions are available in Supabase PostgreSQL?

**Findings**:
- `uuid-ossp` extension is already enabled
- `gen_random_uuid()` is available (native PostgreSQL 13+ function)
- `uuid_generate_v4()` is available (from uuid-ossp)

**Decision**: Use `gen_random_uuid()` for server-side default values
**Rationale**: Native function, no extension dependency, recommended by PostgreSQL docs
**Alternatives considered**: `uuid_generate_v4()` - equivalent but requires extension

### 2. Migration Strategy for Integer to UUID

**Question**: Best approach to migrate integer PKs to UUID with foreign key relationships?

**Decision**: Multi-step migration with backup columns

**Migration Steps**:
1. **Add new UUID columns** alongside existing integer columns
2. **Populate UUIDs** with `gen_random_uuid()` for each row
3. **Create mapping table** to track old_id → new_uuid
4. **Update foreign keys** using the mapping
5. **Swap columns** (rename old to backup, new to primary)
6. **Add constraints** (PK, FK, defaults)
7. **Cleanup** (drop backup columns after verification)

**Rationale**:
- Allows rollback at any step
- No data loss risk
- Can verify integrity between steps

**Alternatives considered**:
- Single transaction migration: Rejected - too risky for production
- Dual-write period: Rejected - unnecessary complexity for pilot with no users

### 3. TypeScript Type Changes

**Question**: How to update TypeScript types from `number` to `string`?

**Decision**: Update types in `types/database.ts` and regenerate Supabase types

**Files affected**:
- `types/database.ts` - Manual type definitions
- Run `npx supabase gen types typescript` after migration

**Rationale**: Supabase CLI generates accurate types from database schema

### 4. Client-side UUID Generation

**Question**: How to generate UUIDs in browser for AI tools?

**Decision**: Use native `crypto.randomUUID()`

**Code change in `buffer-utils.ts`**:
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

**Rationale**:
- Native browser API (no package needed)
- Available in all modern browsers
- Same format as PostgreSQL uuid type

**Alternatives considered**:
- `uuid` npm package: Rejected - unnecessary dependency
- Server-side generation: Rejected - defeats purpose of client-side ID

### 5. Foreign Key Handling During Migration

**Question**: How to handle FKs that reference non-migrated tables?

**Findings from schema inspection**:

**FKs within migrated tables (WILL change)**:
- `session_plan_exercises.session_plan_id` → `session_plans.id`
- `session_plan_sets.session_plan_exercise_id` → `session_plan_exercises.id`
- `workout_log_exercises.workout_log_id` → `workout_logs.id`
- `workout_log_sets.workout_log_exercise_id` → `workout_log_exercises.id`

**FKs to non-migrated tables (stay integer)**:
- `session_plan_exercises.exercise_id` → `exercises.id` (stays integer)
- `session_plans.microcycle_id` → `microcycles.id` (stays integer)
- `session_plans.user_id` → `users.id` (stays integer)
- `workout_logs.athlete_id` → `athletes.id` (stays integer)

**Decision**: Only migrate PKs and internal FKs for the 6 tables. External FKs remain integer.

**Rationale**: Minimizes migration scope while solving the core problem.

### 6. RLS Policy Impact

**Question**: Do RLS policies need updating after UUID migration?

**Decision**: Policies use column names, not types - minimal changes needed

**Verification needed**:
- Check if any policies compare IDs with integer literals
- Update any hardcoded ID comparisons

### 7. Rollback Strategy

**Question**: How to rollback if migration fails?

**Decision**: Keep backup columns until verification complete

**Rollback steps**:
1. Restore backup columns as primary
2. Re-add integer constraints
3. Drop UUID columns

**Verification before cleanup**:
- Row counts match pre-migration
- All FKs resolve correctly
- Application CRUD operations work

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| UUID generation (server) | `gen_random_uuid()` |
| UUID generation (client) | `crypto.randomUUID()` |
| Migration approach | Multi-step with backup columns |
| Rollback capability | Keep backup until verified |
| Type regeneration | Supabase CLI after migration |
| External FKs | Remain as integer |
| RLS policies | Review for hardcoded IDs |
