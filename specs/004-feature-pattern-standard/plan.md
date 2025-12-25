# Implementation Plan: Feature Pattern Standardization

**Branch**: `004-feature-pattern-standard` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-feature-pattern-standard/spec.md`

## Summary

Standardize the feature pattern across all major features (Plans, Sessions, Athletes, Workout) to ensure consistent architecture, fix critical data persistence issues in the Workout feature, and establish TanStack Query best practices for caching and mutations.

**Key Deliverables**:
1. Fix Workout data persistence (CRITICAL - data lost on page refresh)
2. Establish standard feature directory structure with hooks/, context/, types.ts
3. Implement React Query mutation pattern with optimistic updates and rollback
4. Add server prefetching with HydrationBoundary for all major pages
5. Document patterns for future feature development

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 16.0.10
**Primary Dependencies**:
- TanStack React Query 5.90.12
- Clerk 6.36.2 (authentication)
- Supabase (PostgreSQL backend)
- React Hook Form + Zod (forms)

**Storage**:
- Supabase PostgreSQL (primary)
- localStorage/IndexedDB (draft persistence)
- LRU Cache (Clerk ID to DB ID mapping)

**Testing**: Jest (unit) + Playwright (E2E)
**Target Platform**: Web (Next.js 16 App Router, Turbopack)
**Project Type**: Web application (monorepo with Turborepo)

**Performance Goals**:
- Query cache hit rate > 80%
- Zero data loss on page refresh
- Initial page load with server-prefetched data (no client waterfall)

**Constraints**:
- Next.js 16 breaking changes (no middleware auth, async params)
- Must maintain backward compatibility during migration
- No breaking changes to existing API contracts

**Scale/Scope**:
- 4 major features (Plans, Sessions, Athletes, Workout)
- ~80+ action files
- ~150+ component files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | N/A | This is a refactoring feature, not a new library |
| CLI Interface | N/A | Web-only feature |
| Test-First | PARTIAL | Will add tests for new mutation hooks |
| Integration Testing | REQUIRED | Need E2E tests for data persistence |
| Simplicity | PASS | Consolidating 4 patterns into 1 standard |

**Gate Status**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/004-feature-pattern-standard/
├── plan.md              # This file
├── research.md          # Phase 0 output - caching and persistence research
├── data-model.md        # Phase 1 output - mutation and draft models
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - not applicable (no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── components/features/
│   ├── [feature]/
│   │   ├── components/       # Feature UI components
│   │   │   └── index.ts      # Public component exports
│   │   ├── hooks/            # Custom hooks for data/state
│   │   │   ├── index.ts      # Public hook exports
│   │   │   ├── use[Feature]Queries.ts   # Data fetching
│   │   │   └── use[Feature]Mutations.ts # Data mutations
│   │   ├── context/          # Context providers (if needed)
│   │   │   └── [Feature]Context.tsx
│   │   ├── config/           # Query keys, stale times
│   │   │   └── query-config.ts
│   │   ├── types.ts          # Feature-specific types
│   │   └── index.ts          # Public API exports
│
├── lib/
│   ├── [feature]-persistence.ts  # Draft storage (localStorage/IndexedDB)
│   └── hooks/
│       └── useUnsavedChanges.ts  # beforeunload handler
│
├── docs/patterns/
│   ├── feature-pattern.md        # Standard feature structure
│   ├── actionstate-pattern.md    # Server action pattern
│   └── hooks-vs-context.md       # Decision guide
│
└── app/(protected)/
    └── [feature]/
        └── page.tsx              # Server prefetching with HydrationBoundary
```

**Structure Decision**: Follows existing apps/web/ monorepo structure. No new projects needed - this standardizes existing feature directories.

## Complexity Tracking

No violations requiring justification. This feature reduces complexity by consolidating 4 different patterns into 1 standard.

## Phase Summary

| Phase | Focus | Output | Status |
|-------|-------|--------|--------|
| 0 | Quick Fixes | Delete unused code, fix staleTime | ✅ COMPLETE |
| 1 | Research | research.md | ✅ COMPLETE |
| 2 | Data Persistence (CRITICAL) | workout-persistence.ts, mutations | ✅ COMPLETE |
| 3 | Server Prefetching | HydrationBoundary patterns | NOT STARTED |
| 4-6 | Feature Migration | Standard structure per feature | PARTIAL |
| 7 | Validation | Tests, documentation | IN PROGRESS |
| **9** | **UI Component Migration** | **Unified training components** | **✅ COMPLETE (2025-12-25)** |

## Dependencies

```mermaid
graph TD
    A[Phase 0: Quick Fixes] --> B[Phase 1: Research]
    B --> C[Phase 2: Workout Persistence]
    C --> D[Phase 3: Server Prefetching]
    D --> E[Phase 4: Sessions Feature]
    E --> F[Phase 5: Athletes Feature]
    F --> G[Phase 6: Plans Feature]
    G --> H[Phase 7: Validation]
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing workout flows | Medium | High | Feature flag for new persistence layer |
| Migration taking longer than expected | High | Medium | Prioritize CRITICAL Phase 2 first |
| React Query version incompatibilities | Low | Medium | Pin versions, test thoroughly |
