# Implementation Plan: Frontend Responsive Design Fixes

**Branch**: `001-frontend-responsive-design` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-responsive-design/spec.md`

## Summary

This feature implements 6 critical CSS/layout fixes for mobile responsiveness and accessibility across 3 pages (Plans, Workout, Session), plus comprehensive browser testing with Supabase verification to ensure zero bugs remaining. The approach uses existing Tailwind utility classes, adds no backend complexity, and validates all CRUD operations via AI-driven browser testing with MCP integration.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 15 (App Router)
**Primary Dependencies**:
- Tailwind CSS 3.x (utility-first CSS)
- shadcn/ui components (Button, Dialog, Sidebar, etc.)
- Recharts (chart library - needs responsive config)
- Cursor Browser Tool (AI-driven testing)
- Supabase MCP Server (database verification)

**Storage**: Supabase PostgreSQL (existing - no schema changes)
- Dev project: pcteaouusthwbgzczoae (eu-west-2)
- Tables: macrocycles, mesocycles, microcycles, exercise_preset_groups, exercise_training_sessions

**Testing**:
- Cursor Browser Tool (AI agent on-demand)
- Supabase MCP integration for database verification
- Accessibility: axe-core for WCAG 2.1 AA compliance

**Target Platform**: Web (responsive: mobile 375px, tablet 768px, desktop 1920px)
**Project Type**: Web application (Next.js monorepo at `apps/web/`)
**Performance Goals**:
- Chart render time < 100ms on mobile
- Focus indicator transitions < 200ms
- No layout shift (CLS score 0)

**Constraints**:
- CSS-only changes (no backend modifications)
- Use existing `globals.css` utilities (`.mobile-safe-x`, `.touch-target`)
- Must not break existing functionality
- WCAG 2.1 Level AA compliance mandatory

**Scale/Scope**:
- 3 pages (Plans, Workout, Session)
- 7 component files to modify (VolumeIntensityChart, ExerciseRow, sidebar, dialog, PlansHomeClient, tailwind.config, button)
- Comprehensive browser tests: ~50-70 test scenarios across all CRUD operations + edge cases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ **PASS** (No constitution violations - CSS-only changes with existing utilities)

Since the project constitution is not yet defined (template file), applying standard Next.js/React best practices:

| Principle | Status | Notes |
|-----------|--------|-------|
| **No Backend Changes** | ✅ PASS | CSS/layout fixes only, no database schema changes |
| **Use Existing Utilities** | ✅ PASS | Leverages `globals.css` utilities (`.mobile-safe-x`, `.touch-target`, etc.) |
| **Type Safety** | ✅ PASS | TypeScript strict mode, all changes use existing typed components |
| **WCAG 2.1 AA Compliance** | ✅ PASS | Focus indicators, touch targets, contrast ratios all meet standards |
| **No New Dependencies** | ✅ PASS | Uses existing Tailwind, Recharts, shadcn/ui - no new packages |
| **Testing Before Deploy** | ✅ PASS | Comprehensive browser testing with Supabase verification before production |

**Complexity Justification**: None needed - this feature reduces complexity by using existing utilities instead of adding new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Existing Next.js Monorepo)

```text
apps/web/
├── app/
│   ├── (protected)/
│   │   ├── plans/          # Plans page routes
│   │   ├── workout/        # Workout page routes
│   │   └── sessions/       # Session page routes
│   └── globals.css         # ✏️ MODIFY: Already has mobile utilities
│
├── components/
│   ├── ui/
│   │   ├── button.tsx              # ✏️ MODIFY: Add touch-target utility
│   │   ├── dialog.tsx              # ✏️ MODIFY: Add overflow-y-auto, focus styles
│   │   └── sidebar.tsx             # ✏️ MODIFY: Tablet collapsible, focus styles
│   │
│   └── features/
│       ├── plans/
│       │   ├── home/
│       │   │   ├── VolumeIntensityChart.tsx    # ✏️ MODIFY: Responsive height
│       │   │   └── PlansHomeClient.tsx         # ✏️ MODIFY: Dialog overflow
│       │   └── session-planner/
│       │       └── components/
│       │           └── ExerciseRow.tsx         # ✏️ MODIFY: Mobile card width
│       │
│       ├── workout/         # No CSS changes (testing only)
│       └── sessions/        # No CSS changes (testing only)
│
├── tailwind.config.ts      # ✏️ MODIFY: Add z-index hierarchy
│
└── __tests__/             # Browser tests executed here via Cursor
    └── e2e/
        ├── plans/
        ├── workout/
        └── sessions/
```

**Structure Decision**: Modify existing files in-place. No new files needed. All changes are CSS/className updates using existing Tailwind utilities from `globals.css`.

## Complexity Tracking

**No violations** - This feature uses existing patterns and utilities, adding zero complexity.

---

## Phase 0: Research (COMPLETE ✅)

**Output**: [research.md](./research.md)

**Key Decisions**:
1. Responsive chart heights: h-48/h-56/h-64 with Tailwind breakpoints
2. Chart margins via useResponsiveChartMargins hook: 10px mobile, 30px desktop
3. Focus indicators: focus-visible:ring-2 pattern for WCAG 2.1 AA compliance
4. Touch targets: Use existing .touch-target utility (44x44px minimum)
5. Mobile exercise cards: w-[calc(100vw-2rem)] for full width minus padding
6. Z-index hierarchy: Centralized in tailwind.config.ts
7. Dialog overflow: Add overflow-y-auto for scrolling
8. Browser testing: AI agent on-demand with Cursor + Supabase MCP

**All technical unknowns resolved** ✅

---

## Phase 1: Design & Contracts (COMPLETE ✅)

**Outputs**:
- [data-model.md](./data-model.md) - Reference for existing Supabase schema
- [contracts/README.md](./contracts/README.md) - Existing server actions (no changes)
- [quickstart.md](./quickstart.md) - Implementation guide with code examples
- [CLAUDE.md](../../CLAUDE.md) - Updated agent context

**Key Artifacts**:
1. **Data Model**: No new entities - documented existing tables for browser test verification
2. **API Contracts**: No new endpoints - documented existing server actions
3. **Quickstart Guide**: Step-by-step implementation with code snippets for all 7 CSS fixes
4. **Agent Context**: Updated with TypeScript/Next.js/Supabase stack info

**Design complete** ✅ - Ready for task generation

---

## Phase 2: Task Generation (Next Step)

**Command**: Run `/tasks` or `/speckit.tasks` to generate dependency-ordered task list

**Expected Output**: `tasks.md` with:
- Task breakdown for 7 CSS fixes (estimated 2 hours total)
- Task breakdown for comprehensive browser testing (estimated 4 hours total)
- Dependencies between tasks (CSS fixes → browser tests)
- Acceptance criteria for each task

---

## Implementation Summary

**Total Effort**: ~6 hours (2 hours CSS + 4 hours testing)

**Files to Modify** (7 total):
1. VolumeIntensityChart.tsx - Responsive height + margins hook
2. ExerciseRow.tsx - Mobile card width fix
3. sidebar.tsx - Focus indicators + tablet collapsible
4. dialog.tsx - Overflow scroll + focus indicators
5. PlansHomeClient.tsx - Dialog overflow fix
6. tailwind.config.ts - Z-index hierarchy
7. button.tsx - Touch target utility

**Testing Strategy**:
- ~50-70 browser test scenarios across Plans/Workout/Session pages
- Supabase database verification for all CRUD operations
- Edge case coverage: empty states, deletions, concurrent edits
- Accessibility audit: axe-core for WCAG 2.1 AA compliance

**Success Criteria** (20 total):
- SC-001 through SC-005: CSS/layout fixes verified
- SC-006 through SC-012: Comprehensive testing coverage
- SC-013 through SC-020: Definition of done checklist

**No backend changes, zero new dependencies, uses existing utilities** ✅
