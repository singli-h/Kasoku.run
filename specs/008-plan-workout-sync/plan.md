# Implementation Plan: Plan Page Improvements

**Branch**: `008-plan-workout-sync` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-plan-workout-sync/spec.md`

## Summary

Comprehensive improvements to the Plan page covering three areas:
1. **Plan-Workout Sync**: Auto-sync coach session plan changes to athlete workouts (assigned status), manual re-sync for ongoing workouts
2. **UX Improvements**: Enable individual user Edit Block/Add Workout, remove disabled menu items, add quick CTAs, make week days clickable
3. **Role-Based Experience**: Tailored terminology and page layouts for Coach, Athlete, and Individual roles

**Technical Approach**: Server actions for sync logic with transaction wrapping, new database column for sync tracking, client component enhancements for UI features.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) with Next.js 16.0.10
**Primary Dependencies**: Next.js 16, React 19, Supabase Client, Clerk 6.x, React Hook Form, Zod, shadcn/ui, Tailwind CSS
**Storage**: PostgreSQL (Supabase) with Row Level Security (RLS)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Web (modern browsers, mobile responsive)
**Project Type**: Web application (Turborepo monorepo, primary app at `apps/web/`)
**Performance Goals**: Server actions <200ms p95, no full page reloads on mutations
**Constraints**: Must use ActionState pattern, RLS policies enforced, no `any` types
**Scale/Scope**: Coaches managing teams (5-50 athletes), individual self-coached users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Since project constitution is not yet defined, applying CLAUDE.md guidelines as authoritative source:

| Principle | Status | Notes |
|-----------|--------|-------|
| **ActionState Pattern** | PASS | All new server actions will return `ActionState<T>` |
| **Authentication First** | PASS | All actions start with `await auth()` check |
| **RLS + Application Check** | PASS | Database changes respect RLS, explicit filters added |
| **No `any` Types** | PASS | Proper TypeScript interfaces defined |
| **Server Actions for CRUD** | PASS | No new API routes, all mutations via server actions |
| **Revalidate After Mutation** | PASS | `revalidatePath()` called after sync operations |
| **Feature-Based Organization** | PASS | New components in `components/features/plans/` |

**Gate Result**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/008-plan-workout-sync/
├── plan.md              # This file
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Quick reference (exists, to be updated)
├── ground-truth-audit.md # Code audit (complete)
├── tasks.md             # Task list (exists, to be updated by /speckit.tasks)
└── contracts/           # Phase 1 output (server action signatures)
```

### Source Code (repository root)

```text
apps/web/
├── actions/
│   ├── plans/
│   │   ├── session-planner-actions.ts  # MOD: Add sync trigger after save
│   │   └── plan-actions.ts             # USE: updateMesocycleAction
│   └── workout/
│       └── workout-sync-actions.ts     # NEW: Sync server actions
├── components/
│   └── features/
│       └── plans/
│           ├── workspace/
│           │   ├── IndividualWorkspace.tsx  # MOD: Enable buttons
│           │   └── TrainingPlanWorkspace.tsx # MOD: Add assigned-to section
│           ├── home/
│           │   ├── PlansHomeClient.tsx       # MOD: Remove disabled items
│           │   ├── IndividualPlansHomeClient.tsx # MOD: CTA, clickable days
│           │   └── TodayWorkoutCTA.tsx       # NEW: Quick action component
│           └── dialogs/
│               ├── EditBlockDialog.tsx       # NEW: Edit form
│               └── AddWorkoutDialog.tsx      # NEW: Add form
├── types/
│   └── database.ts     # MOD: Add synced_at column type
└── supabase/
    └── migrations/
        └── YYYYMMDD_add_synced_at.sql  # NEW: Database migration
```

**Structure Decision**: Web application using Next.js App Router pattern. All changes within existing `apps/web/` structure following feature-based component organization.

## Complexity Tracking

> No constitution violations requiring justification.

| Item | Decision | Rationale |
|------|----------|-----------|
| Sync transaction wrapping | Required | Atomic operations prevent partial sync states |
| LRU cache for user IDs | Existing pattern | Acceptable for current scale per CLAUDE.md |
| Multiple dialog components | Standard pattern | Each dialog has distinct form/validation needs |

## Implementation Phases

### Phase 1: Individual Functionality (P0) - 6-8 hours
Enable Edit Block and Add Workout for individual users.

### Phase 2: Friction Reduction (P1) - 4-6 hours
Remove disabled menu items, add Quick CTA, make week days clickable.

### Phase 3: Sync MVP (P1) - 5-7 hours
Database migration, sync server action, integrate with save action.

### Phase 4: Polish (P2-P3) - 5-8 hours
Tooltips, router.refresh(), expand/collapse completed blocks.

### Phase 5: Advanced Sync (P2) - 8-10 hours
Manual re-sync for athletes, sync indicator badge.

**Total Estimate**: 28-39 hours

## Dependencies

| Phase | Depends On |
|-------|------------|
| Phase 1 | None - can start immediately |
| Phase 2 | None - can start immediately |
| Phase 3 | Task 3.1 (database migration) before 3.2/3.3 |
| Phase 4 | Task 2.2 for consolidation (optional) |
| Phase 5 | Phase 3 complete (synced_at column) |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss (athlete work) | Critical | Never delete completed sets/exercises during sync |
| Race condition on save | High | Transaction wrapping, optimistic locking pattern |
| Edit date conflicts | Medium | Warn if dates affect existing workouts |
| Performance (many athletes) | Medium | Batch operations, limit concurrent syncs |
