# Implementation Plan: Database Schema Optimization

**Branch**: `003-database-schema-optimization` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-database-schema-optimization/spec.md`

## Summary

Database schema optimization for the Kasoku training platform, focusing on:
1. **Table Renaming**: Rename 5 tables to clearly distinguish coach-created plans vs athlete-recorded workouts
2. **RLS Security Fixes**: Update RLS policies for `exercises` and `macrocycles` tables
3. **Cascade Deletes**: Add missing `ON DELETE CASCADE` constraints
4. **Timestamp Standardization**: Add/fix `created_at` and `updated_at` columns
5. **Data Type Optimization**: Convert `VARCHAR` to `TEXT`, fix `timestamp` to `timestamptz`

**Critical Decision**: All training metric columns (`height`, `effort`, `tempo`, `resistance`, `velocity`, `power`) are KEPT as explicit columns for direct SQL analytics. PostgreSQL efficiently handles NULL values (1 bit per column in bitmap header).

## Technical Context

**Language/Version**: TypeScript 5.x, PostgreSQL 15.8.1
**Primary Dependencies**: Supabase (PostgreSQL), Next.js 16, Clerk Auth
**Storage**: PostgreSQL via Supabase (Project ID: `pcteaouusthwbgzczoae`)
**Testing**: Jest (unit), Playwright (E2E), Manual SQL verification
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (monorepo: `apps/web/`)
**Performance Goals**: No query performance regression, maintain <100ms for common queries
**Constraints**: Zero downtime migration, RLS policies must remain functional
**Scale/Scope**: 32 tables, ~45 files affected, 5 table renames, 3 FK column renames

## Constitution Check

*GATE: Not applicable - project constitution is template-only (not customized)*

This feature is a database migration with no new libraries or architectural changes. Focus is on:
- Security (RLS policy fixes)
- Data integrity (CASCADE deletes)
- Developer experience (clear naming)

## Project Structure

### Documentation (this feature)

```text
specs/003-database-schema-optimization/
├── plan.md              # This file
├── research.md          # Phase 0 - Decision rationale
├── data-model.md        # Phase 1 - Entity definitions
├── quickstart.md        # Phase 1 - Implementation quick reference
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── types/
│   ├── database.ts      # Auto-regenerated after migration
│   ├── training.ts      # Extended types (manual update)
│   └── index.ts         # Re-exports (manual update)
├── actions/
│   ├── plans/           # 4 files to update
│   ├── sessions/        # 1 file to update
│   ├── workout/         # 1 file to update
│   ├── library/         # 1 file to update
│   └── dashboard/       # 1 file to update
├── components/features/
│   ├── workout/         # ~10 files to update
│   ├── plans/           # ~5 files to update
│   └── sessions/        # ~2 files to update
├── lib/
│   ├── changeset/       # Entity mappings to update
│   └── validation/      # Schema names to update
└── docs/                # Documentation updates (already started)
```

**Structure Decision**: This is a schema migration affecting the existing web application structure. No new directories or architectural changes required.

## Implementation Phases

### Phase 1: Database Migration (P0 - Critical)

Execute SQL migration in Supabase:

1. **Table Renames** (non-breaking, immediate effect)
   - `exercise_preset_groups` → `session_plans`
   - `exercise_presets` → `session_plan_exercises`
   - `exercise_preset_details` → `session_plan_sets`
   - `exercise_training_sessions` → `workout_logs`
   - `exercise_training_details` → `workout_log_sets`

2. **FK Column Renames** (non-breaking)
   - `exercise_preset_group_id` → `session_plan_id`
   - `exercise_preset_id` (in sets) → `session_plan_exercise_id`
   - `exercise_training_session_id` → `workout_log_id`

3. **Cascade Constraints** (safety improvement)
   - Add `ON DELETE CASCADE` to 5 foreign keys

**Verification**: RLS policies auto-apply to renamed tables. Trigger names may need updating.

### Phase 2: Type Regeneration (P0 - Critical)

```bash
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > apps/web/types/database.ts
```

Then update:
- Type aliases in `database.ts` (5 type renames)
- Extended types in `training.ts` (3 interface updates)
- Re-exports in `index.ts`

### Phase 3: Server Action Updates (P0 - Critical)

Update 8 action files with ~100 total references:
- `plan-actions.ts` - 12 refs
- `session-plan-actions.ts` - 25+ refs
- `session-planner-actions.ts` - 10 refs
- `plan-assignment-actions.ts` - 5 refs
- `training-session-actions.ts` - 40+ refs
- `workout-session-actions.ts` - 15 refs
- `exercise-actions.ts` - 30+ refs
- `dashboard-actions.ts` - 3 refs

### Phase 4: Component Updates (P1 - High)

Update ~15 component files across:
- Workout feature (context, hooks, components)
- Plans feature (session planner, pages)
- Session feature (hooks)
- Composed components

### Phase 5: Utility Updates (P1 - High)

- `lib/changeset/entity-mappings.ts` - Table/field mappings
- `lib/changeset/tool-implementations/read-impl.ts` - Table references
- `lib/validation/training-schemas.ts` - Schema names

### Phase 6: Timestamps & Data Types (P2 - Medium)

1. Add `created_at`/`updated_at` to tables missing them
2. Add `DEFAULT now()` to nullable timestamp columns
3. Fix `timestamp` → `timestamptz` type mismatch
4. Create `updated_at` trigger function
5. Apply triggers to all relevant tables

### Phase 7: RLS Security Fixes (P1 - High)

1. Update `exercises` policy: `visibility = 'global' OR owner_user_id = auth.uid()`
2. Update `macrocycles` policy: Add coach access via `athlete_group_id`
3. Verify `ai_memories` policy (RLS enabled, needs explicit policies)

### Phase 8: Documentation (P2 - Medium)

- Remove "Planned Rename" notes from docs
- Update all table references in ~11 documentation files

## Verification Checklist

- [ ] All table renames applied
- [ ] All FK column renames applied
- [ ] Type generation successful
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] CRUD operations work for session_plans
- [ ] CRUD operations work for workout_logs
- [ ] Cascade deletes work correctly
- [ ] RLS policies block unauthorized access
- [ ] No performance regression

## Complexity Tracking

*No complexity violations - this is a straightforward schema migration*

| Item | Status | Notes |
|------|--------|-------|
| Column consolidation | REJECTED | Keeping explicit columns for SQL analytics |
| JSONB metadata migration | REJECTED | PostgreSQL NULL handling is efficient |
| Breaking API changes | AVOIDED | Internal refactoring only |
