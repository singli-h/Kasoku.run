# Implementation Plan: Session-Level Schedule Tags

**Branch**: `015-session-schedule-tags` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/015-session-schedule-tags/spec.md`

## Summary

Extend the existing event group mechanism to support session-level visibility tags. Athletes get multiple tags (discipline + schedule), sessions get `target_event_groups`, and RLS enforces visibility at both session and exercise levels using array overlap (`&&`).

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14+, React 18
**Primary Dependencies**: Supabase (PostgreSQL 15+), Tailwind CSS, shadcn/ui
**Storage**: PostgreSQL via Supabase (RLS-enforced)
**Testing**: E2E via agent-browser CLI
**Target Platform**: Web (responsive)
**Project Type**: Turborepo monorepo (`apps/web/`)

## Project Structure

### Documentation

```text
specs/015-session-schedule-tags/
├── spec.md              # Feature specification
├── plan.md              # This file
├── data-model.md        # Schema changes
├── tasks.md             # Implementation tasks
```

### Source Code (affected areas)

```text
supabase/migrations/
└── YYYYMMDD_session_schedule_tags.sql    # New migration

apps/web/
├── types/database.ts                     # Regenerated types
├── actions/
│   ├── athletes/athlete-actions.ts       # Array writes/reads
│   ├── athletes/event-group-actions.ts   # .contains() instead of .eq()
│   ├── onboarding/onboarding-actions.ts  # Array write
│   ├── plans/generate-microcycle-action.ts  # flatMap dedup
│   ├── workout/workout-session-actions.ts   # Array overlap filter
│   └── dashboard/dashboard-actions.ts       # Array overlap filter
├── components/features/athletes/
│   ├── components/athlete-card.tsx       # Multi-select tags
│   ├── components/athlete-roster-section.tsx  # Multi-select tags
│   ├── components/group-directory-section.tsx  # Array breakdown
│   └── types.ts                          # Array type
├── components/features/plans/
│   ├── workspace/components/MicrocycleEditor.tsx  # Preview filter
│   └── workspace/TrainingPlanWorkspace.tsx  # Session tag display
├── components/features/training/
│   └── views/WorkoutView.tsx             # Array overlap filter
└── app/(protected)/workout/[id]/page.tsx # Array extract
```

## Architecture

### Phase 1: Database Migration (single transaction)

One migration file, 8 steps in order:
1. Add `event_groups TEXT[]` column to `athletes`
2. Populate from existing `event_group` scalar → single-element array
3. Add `target_event_groups TEXT[]` to `session_plans` with GIN index
4. Create `auth_athlete_event_groups()` returning `TEXT[]`
5. Update RLS policies on `session_plan_exercises` and `session_plan_sets` to use `&&`
6. Create new RLS SELECT policy on `session_plans`
7. Drop old `auth_athlete_event_group()` function
8. Drop old `event_group` column

### Phase 2: Server Actions (array migration)

Update all server actions that read/write `event_group` to use `event_groups TEXT[]`:
- Scalar writes → array writes
- `.eq()` → `.contains()` / `.overlaps()`
- `.map(a => a.event_group)` → `.flatMap(a => a.event_groups ?? [])`
- `.includes(scalar)` → array overlap check

Architecture decision: Session-level filtering is RLS-only. Application code does NOT filter sessions. Exercise-level filtering stays dual-layer (RLS + application) for workout log copy.

### Phase 3: UI Components

1. **Athlete roster**: Single-select event group → multi-select checkbox popover
2. **Session editor**: Add "Visible to" tag selector (same component as exercise-level)
3. **Microcycle editor**: Add "Preview as" dropdown filter
4. **Untagged athlete warning**: Subtle indicator on roster

### Visibility Rules (RLS logic)

```sql
-- Session-level: athlete sees session if...
session.target_event_groups IS NULL              -- untagged = shared
OR session.target_event_groups = '{}'            -- empty = shared
OR (
  auth_athlete_event_groups() IS NOT NULL         -- athlete has tags
  AND auth_athlete_event_groups() != '{}'          -- and they're not empty
  AND auth_athlete_event_groups() && session.target_event_groups  -- and overlap exists
)
-- NOTE: athlete with NULL tags sees ONLY untagged sessions (intentional)

-- Exercise-level: same pattern, already exists, updated for array overlap
```

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Migration breaks existing exercise visibility | Data migration converts scalar → array atomically; test with existing data before deploy |
| Untagged athletes lose access to tagged content | Intentional — coach warning in UI; deploy note |
| RLS policy on session_plans conflicts with existing policies | Review all existing session_plans policies before adding new one |
| Type regeneration misses fields | Run `supabase gen types` immediately after migration |

## Implementation Order

1. **Migration** (database) — must be first, everything depends on it
2. **Type regeneration** — `database.ts` must match new schema
3. **Server actions** — update all reads/writes for array type
4. **UI: athlete multi-tag editor** — foundation for assigning tags
5. **UI: session tag selector** — core feature
6. **UI: microcycle preview filter** — usability for complex cases
7. **UI: untagged athlete warning** — safety indicator
8. **E2E verification** — test full flow
