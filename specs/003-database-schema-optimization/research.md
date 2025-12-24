# Research: Database Schema Optimization

**Date**: 2025-12-24
**Feature**: 003-database-schema-optimization

## Research Summary

This document captures the decision rationale for the database schema optimization feature, resolving all technical questions identified during planning.

---

## Decision 1: Keep Explicit Columns vs JSONB Metadata

### Context
The `exercise_preset_details` and `exercise_training_details` tables have columns that are NULL for many rows:
- `height` - Only used for plyometric exercises (~5% of records)
- `effort` - Used for some training types (~15% of records)
- `tempo` - Used for hypertrophy/strength (~20% of records)
- `resistance` - Used for accommodating resistance (~10% of records)

### Options Considered

**Option A: Move sparse columns to JSONB `metadata`**
- Pros: Fewer columns, flexible schema
- Cons: Complex analytics queries, no direct indexing, JSON extraction overhead

**Option B: Keep as explicit columns**
- Pros: Direct SQL analytics, simple queries, partial indexing
- Cons: More columns (already exist), NULL overhead

### Decision
**KEEP explicit columns** (Option B)

### Rationale
1. **PostgreSQL NULL efficiency**: NULL values use only 1 bit per column in the null bitmap header, not 4/8 bytes per column
2. **Analytics queries**: Coaches need direct queries like `SELECT AVG(height) FROM workout_log_sets`
3. **Partial indexes**: Can create `WHERE height IS NOT NULL` indexes for sparse columns
4. **Existing schema**: Columns already exist, migration would be disruptive
5. **Type safety**: Explicit columns provide compile-time type checking

### Alternatives Rejected
- JSONB metadata: Query complexity outweighs storage savings (which are minimal)

---

## Decision 2: Table Naming Convention

### Context
Current table names don't clearly distinguish between:
- Coach-created training plans (templates)
- Athlete-recorded workout sessions (actual performance)

Current names:
- `exercise_preset_groups` (coach creates)
- `exercise_presets` (exercises in plan)
- `exercise_preset_details` (set prescriptions)
- `exercise_training_sessions` (athlete records)
- `exercise_training_details` (actual sets)

### Options Considered

**Option A: session_plan / workout_log**
- `session_plans` / `session_plan_exercises` / `session_plan_sets`
- `workout_logs` / `workout_log_sets`

**Option B: training_template / training_record**
- `training_templates` / `template_exercises` / `template_sets`
- `training_records` / `record_sets`

**Option C: plan / session**
- `plans` / `plan_exercises` / `plan_sets`
- `sessions` / `session_sets`

### Decision
**session_plan / workout_log** (Option A)

### Rationale
1. **Clear domain separation**: "Plan" = prescription, "Log" = record
2. **Familiar terminology**: Athletes understand "workout log"
3. **Avoids confusion**: "Session" alone is ambiguous (plan or log?)
4. **Consistent prefixing**: `session_plan_*` and `workout_log_*` groups related tables

### Alternatives Rejected
- Option B: "Template" suggests copy/clone, which isn't the primary use
- Option C: "Plan" too generic, "session" already overloaded

---

## Decision 3: VARCHAR vs TEXT

### Context
PostgreSQL documentation states VARCHAR and TEXT have identical performance characteristics.

### Decision
**Convert all VARCHAR to TEXT**

### Rationale
1. **No performance difference** in PostgreSQL (both use varlena storage)
2. **Simpler schema**: No arbitrary length limits to maintain
3. **Application validation**: Length limits should be enforced at application layer with Zod
4. **Best practice**: PostgreSQL documentation recommends TEXT

---

## Decision 4: Timestamp Type Standardization

### Context
Some tables use `timestamp without time zone`, others use `timestamptz`.

### Decision
**Use `timestamptz` for all timestamp columns**

### Rationale
1. **Timezone awareness**: Critical for international users
2. **PostgreSQL recommendation**: `timestamptz` is preferred
3. **Consistency**: All tables should use same type
4. **UTC storage**: Supabase stores in UTC, converts on client

---

## Decision 5: Cascade Delete Strategy

### Context
Several foreign keys use `NO ACTION` (default), causing orphaned rows on parent deletion.

### Decision
**Add `ON DELETE CASCADE` to child tables**

### Tables Affected
- `workout_log_sets.workout_log_id` → CASCADE
- `workout_logs.athlete_id` → CASCADE
- `macrocycles.user_id` → CASCADE
- `athlete_cycles.athlete_id` → CASCADE
- `athlete_cycles.macrocycle_id` → CASCADE

### Rationale
1. **Data integrity**: No orphaned rows
2. **Simplified cleanup**: Deleting parent removes all children
3. **Expected behavior**: Standard relational database pattern
4. **Safe for this domain**: Child data has no meaning without parent

---

## Decision 6: RLS Policy Updates

### Context
Current `exercises` policy allows all users to see all exercises, including private custom exercises.

### Decision
**Update to visibility-based policy**

### New Policy
```sql
visibility = 'global' OR owner_user_id = (
  SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
)
```

### Rationale
1. **Security**: Private exercises should be hidden
2. **User expectation**: Custom exercises are personal
3. **Existing column**: `visibility` column already exists
4. **Minimal disruption**: Only affects private exercises

---

## Decision 7: Migration Order

### Context
Schema changes must be applied in correct order to avoid breaking the application.

### Decision
**Phase order:**
1. Database migration (table renames, FK renames, cascades)
2. Type regeneration (`npx supabase gen types`)
3. Server action updates
4. Component updates
5. Utility updates
6. Timestamp additions
7. RLS policy updates
8. Documentation updates

### Rationale
1. **Database first**: Types depend on schema
2. **Types before code**: Code depends on types
3. **Actions before components**: Components use actions
4. **Security last**: Can be applied independently

---

## Technology Notes

### PostgreSQL NULL Handling
- NULL values stored in row header bitmap (1 bit per column)
- Row header is typically 23 bytes + bitmap
- With 20 columns, bitmap adds only 3 bytes (20 bits rounded to bytes)
- NULL columns don't consume their data type size

### Supabase Type Generation
```bash
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae
```
- Regenerates entire `database.ts` file
- Type aliases must be re-added after regeneration
- Extended types in `training.ts` reference generated types

### RLS Policy Performance
- Use `(select auth.uid())` instead of `auth.uid()` for caching
- Avoid complex JOINs in policies
- Consider security definer functions for complex access patterns
