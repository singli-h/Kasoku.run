# Implementation Plan: Individual User Role

**Branch**: `006-individual-user-role` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/features/006-individual-user-role/spec.md`
**Design Doc**: [Individual User Role Design](../../../apps/web/docs/features/individual-user-role-design.md)

## Summary

Add support for "Individual" users who want to self-coach with AI assistance. This role sits between athlete and coach - individuals can create their own training plans ("Training Blocks"), log workouts, and benefit from AI-assisted planning. Implementation involves extending the role system, modifying onboarding flow, updating navigation visibility patterns, and adding role-based terminology mapping.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16.0.10
**Primary Dependencies**: React Hook Form, Zod, Clerk 6.x (auth), Supabase (database), shadcn/ui (components)
**Storage**: PostgreSQL via Supabase (existing schema supports nullable `athlete_group_id`)
**Testing**: Jest (unit), Playwright (E2E)
**Target Platform**: Web (Next.js App Router), responsive design
**Project Type**: Monorepo (Turborepo) with primary app at `apps/web/`
**Performance Goals**: Role context resolution < 100ms, onboarding completion < 90 seconds
**Constraints**: No database schema changes required (existing nullable FKs sufficient)
**Scale/Scope**: Affects ~10 files, ~240 lines of changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is a template (not customized for this project). Using project-level guidelines from `CLAUDE.md`:

| Gate | Status | Notes |
|------|--------|-------|
| Server Actions for data mutations | ✅ PASS | Using existing `onboarding-actions.ts` pattern |
| ActionState return type | ✅ PASS | All actions return `ActionState<T>` |
| No API routes for CRUD | ✅ PASS | All mutations via server actions |
| Auth checks in server actions | ✅ PASS | Using existing Clerk + Supabase flow |
| TypeScript strict mode | ✅ PASS | Extending existing types properly |
| Feature-based organization | ✅ PASS | Components in `components/features/` |

## Project Structure

### Documentation (this feature)

```text
.specify/features/006-individual-user-role/
├── spec.md              # Feature specification (created)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
├── checklists/          # Quality checklists
│   └── requirements.md  # Spec validation (created)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── contexts/
│   └── user-role-context.tsx          # MODIFY: Add 'individual' role type
├── actions/
│   └── onboarding/
│       └── onboarding-actions.ts      # MODIFY: Handle individual role
├── components/
│   ├── layout/
│   │   └── sidebar/
│   │       └── app-sidebar.tsx        # MODIFY: visibleTo pattern
│   └── features/
│       └── onboarding/
│           ├── onboarding-wizard.tsx  # MODIFY: Route individual flow
│           └── steps/
│               ├── role-selection-step.tsx    # MODIFY: Add third card
│               └── individual-details-step.tsx # NEW: Simplified onboarding
├── lib/
│   └── terminology.ts                 # NEW: Role-based term mapping
└── types/
    └── database.ts                    # Reference only (no changes needed)
```

**Structure Decision**: Following existing feature-based organization. New components placed alongside existing onboarding steps. Shared utilities (`terminology.ts`) in `lib/`.

## Complexity Tracking

No constitution violations detected. Implementation follows all existing patterns.

---

## Phase 0: Research Items ✅ COMPLETE

Based on the spec and technical context, the following research was conducted:

| # | Topic | Decision | Status |
|---|-------|----------|--------|
| R1 | Role-Based Access Control | Use `visibleTo` array pattern | ✅ Resolved |
| R2 | Race Conditions | UPSERT + unique constraints (existing pattern works) | ✅ Resolved |
| R3 | Context Performance | Current design sufficient, memoization if needed | ✅ Resolved |
| R4 | Terminology Hook | Pure utility function + optional hook | ✅ Resolved |

→ See [research.md](./research.md) for detailed findings and sources

## Phase 1: Design Artifacts ✅ COMPLETE

| Artifact | Description | Status |
|----------|-------------|--------|
| [data-model.md](./data-model.md) | Entity relationships and state transitions | ✅ Complete |
| [contracts/onboarding-actions.md](./contracts/onboarding-actions.md) | Onboarding action contracts | ✅ Complete |
| [contracts/navigation.md](./contracts/navigation.md) | Navigation visibility contracts | ✅ Complete |
| [contracts/terminology.md](./contracts/terminology.md) | Terminology mapping contracts | ✅ Complete |
| [quickstart.md](./quickstart.md) | Development setup and testing guide | ✅ Complete |

---

## Next Steps

Run `/speckit.tasks` to generate the task list for implementation.

---

*Plan created: 2026-01-02. Phase 0 and Phase 1 complete.*
