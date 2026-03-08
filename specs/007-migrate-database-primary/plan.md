# Implementation Plan: Migrate Database Primary Keys to UUID

**Branch**: `007-migrate-database-primary` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-migrate-database-primary/spec.md`

## Summary

Migrate 6 session/workout tables from auto-increment integer PKs to native PostgreSQL UUID type. This enables client-side UUID generation in AI tools via `crypto.randomUUID()`, eliminating the temp ID resolution complexity that currently causes sets to be skipped when creating exercises with sets in a single AI conversation.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 16.0.10
**Primary Dependencies**: Supabase (PostgreSQL 15), Clerk Auth, Vercel AI SDK
**Storage**: PostgreSQL via Supabase (uuid-ossp extension available)
**Testing**: Jest, Playwright (E2E)
**Target Platform**: Web (Vercel deployment)
**Project Type**: Monorepo (Turborepo) - apps/web is primary
**Performance Goals**: N/A for pilot (no active users)
**Constraints**: Maintenance window acceptable (pilot)
**Scale/Scope**: ~450 rows across 6 tables (small dataset)

### Current State (from database inspection)

| Table | Row Count | Current PK Type |
|-------|-----------|-----------------|
| session_plans | 39 | integer |
| session_plan_exercises | 107 | integer |
| session_plan_sets | 114 | integer |
| workout_logs | 20 | integer |
| workout_log_exercises | 68 | integer |
| workout_log_sets | 100 | integer |

**Total**: 448 rows to migrate

### Foreign Key Dependencies

- `session_plan_exercises.session_plan_id` → `session_plans.id`
- `session_plan_sets.session_plan_exercise_id` → `session_plan_exercises.id`
- `workout_log_exercises.workout_log_id` → `workout_logs.id`
- `workout_log_sets.workout_log_exercise_id` → `workout_log_exercises.id`

**Note**: Other FKs (exercise_id, athlete_id, microcycle_id, etc.) reference tables NOT being migrated - these remain integer and unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains placeholder content (not project-specific). No blocking gates defined.

**Status**: PASS (no violations)

## Project Structure

### Documentation (this feature)

```text
specs/007-migrate-database-primary/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (migration SQL scripts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── lib/changeset/
│   ├── buffer-utils.ts          # Replace generateTempId() with crypto.randomUUID()
│   ├── transformations.ts       # Update ID extraction logic
│   ├── execute.ts               # Update coach execution
│   └── execute-workout.ts       # Update athlete execution
├── types/
│   └── database.ts              # Update ID types: number → string
├── actions/
│   ├── plans/                   # Update session plan actions
│   └── workout/                 # Update workout actions
└── components/features/
    ├── training/                # Update session planner components
    └── workout/                 # Update workout components

supabase/migrations/
├── 20260103XXXXXX_uuid_migration_step1_add_columns.sql
├── 20260103XXXXXX_uuid_migration_step2_populate.sql
├── 20260103XXXXXX_uuid_migration_step3_swap_columns.sql
└── 20260103XXXXXX_uuid_migration_step4_cleanup.sql
```

**Structure Decision**: Existing monorepo structure. Changes affect apps/web/ (TypeScript) and supabase/migrations/ (SQL).

## Complexity Tracking

> No Constitution violations to justify.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Multi-step migration | Medium | Required for safe rollback capability |
| Type changes | Low | Straightforward number → string |
| AI tool changes | Low | Replace temp ID generation with UUID |
