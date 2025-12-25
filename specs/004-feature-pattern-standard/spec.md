# Feature Specification: Feature Pattern Standardization

**Feature Branch**: `004-feature-pattern-standard`
**Created**: 2025-12-24
**Updated**: 2025-12-25
**Status**: In Progress (Phase 9 Complete)
**Stack**: Next.js 16.0.10 + TanStack Query 5.90.12 + Clerk 6.36.2 + Supabase
**Input**: Audit revealing inconsistent patterns across features (Plans uses Context, Sessions uses Hooks, Athletes uses neither consistently) + Architecture review identifying data persistence, CRUD pattern, and caching optimization issues

## Recent Milestones

### Phase 9: UI Component Migration (2025-12-25) ✅

**Completed**: Unified training component architecture for both athlete and coach domains.

**Key Deliverables**:
- Created `components/features/training/` with unified types, adapters, views, and components
- Migrated `/workout/[id]` to use `WorkoutSessionDashboardV2`
- Migrated `/plans/[id]/session/[sessionId]` to use `SessionPlannerV2`
- Unified `TrainingExercise`/`TrainingSet` types mapping to database schema
- Build passes with zero errors

## User Scenarios & Testing

### User Story 1 - Developer Creates New Feature Following Standard (Priority: P1)

As a developer implementing a new feature, I want a clear, documented pattern so that my implementation matches team standards without code review rework.

**Why this priority**: Inconsistent feature structures increase cognitive load and maintenance burden. New features should follow established patterns.

**Independent Test**: Developer can scaffold a new feature directory structure that passes linting and matches existing features.

**Acceptance Scenarios**:

1. **Given** developer needs new "analytics" feature, **When** following feature pattern doc, **Then** creates correct directory structure in < 5 minutes
2. **Given** developer implements feature with state, **When** choosing between hooks/context, **Then** can determine correct approach from decision tree
3. **Given** developer creates feature components, **When** running lint, **Then** passes with zero warnings about structure

---

### User Story 2 - Existing Features Align to Standard (Priority: P1)

As a maintainer, I want all existing features to follow the same pattern so that context-switching between features is frictionless.

**Why this priority**: Current inconsistency (Plans=Context, Sessions=Hooks, Athletes=Mixed) causes confusion and bugs.

**Independent Test**: All 4 major features (plans, athletes, sessions, workout) pass structural linting rules.

**Acceptance Scenarios**:

1. **Given** developer opens plans feature, **When** checking structure, **Then** matches documented standard
2. **Given** developer opens sessions feature, **When** checking structure, **Then** matches same documented standard
3. **Given** any feature, **When** looking for types, **Then** finds them in consistent location (types.ts or types/)

---

### User Story 3 - AI Assistant Generates Consistent Code (Priority: P2)

As Claude Code, I want explicit pattern documentation so that I generate code matching the codebase conventions.

**Why this priority**: AI-generated code that doesn't match patterns requires manual refactoring.

**Independent Test**: Claude Code generates a new component that matches existing component patterns.

**Acceptance Scenarios**:

1. **Given** prompt to create new feature component, **When** generating code, **Then** uses correct file structure
2. **Given** prompt for data fetching component, **When** generating code, **Then** uses correct pattern (server component OR hook)
3. **Given** prompt for form component, **When** generating code, **Then** uses ActionState pattern correctly

---

### User Story 4 - Data Persistence Without Loss (Priority: P0 - CRITICAL)

As an athlete using the workout feature, I want my exercise data to persist reliably so that I never lose progress when refreshing the page or completing a session.

**Why this priority**: Current architecture uses client-side refs for auto-save queues, causing data loss on page refresh. This is a critical UX issue.

**Independent Test**: User can refresh page during workout and resume with all previously entered data intact.

**Acceptance Scenarios**:

1. **Given** athlete enters set data during workout, **When** page is refreshed, **Then** all entered data is recovered
2. **Given** athlete clicks "Complete Workout", **When** there are pending unsaved changes, **Then** all changes are saved before session is marked complete
3. ~~**Given** network connection is lost, **When** athlete continues entering data, **Then** data is queued locally and synced when connection restores~~ **[FUTURE SCOPE]**
4. **Given** save operation fails, **When** UI shows optimistic update, **Then** UI reverts to previous state with error notification

---

### User Story 5 - Consistent Data Mutation Patterns (Priority: P1)

As a developer implementing data mutations, I want a single standardized pattern so that all CRUD operations behave consistently with proper error handling and cache invalidation.

**Why this priority**: Current codebase has 3+ different patterns for mutations (direct server actions, hook wrappers, context-based), causing inconsistent behavior.

**Independent Test**: All mutation operations follow ActionState pattern with proper revalidation.

**Acceptance Scenarios**:

1. **Given** any create/update/delete operation, **When** checking implementation, **Then** uses standardized mutation hook pattern
2. **Given** mutation succeeds, **When** checking cache, **Then** relevant paths are revalidated
3. **Given** mutation fails, **When** using optimistic updates, **Then** UI rolls back to previous state

---

---

### User Story 6 - Athlete Efficient Workout Logging (Priority: P1)

As an athlete using the workout feature, I want a streamlined interface that shows only relevant metrics and pre-fills planned values so that I can log my workout with minimal taps and focus on training.

**Why this priority**: Athletes are the primary end-users. Current UI shows all possible fields, overwhelming users with irrelevant inputs. Pre-filling planned values reduces friction significantly.

**Independent Test**: Athlete can complete a 10-exercise workout with 3 sets each in under 60 seconds of active input time.

**Acceptance Scenarios**:

1. **Given** athlete starts a strength workout with reps/weight/rpe prescribed, **When** viewing exercise card, **Then** only reps, weight, and RPE columns are shown (not distance, time, velocity, etc.)
2. **Given** coach prescribes 3×5 @ 80% effort for squat, **When** athlete opens that exercise, **Then** weight field is pre-filled with 80% of athlete's PR (from `athlete_personal_bests`)
3. **Given** athlete wants to mark all sets complete, **When** tapping the exercise index circle, **Then** all sets toggle to completed state
4. **Given** athlete is following the exact plan, **When** sets are already pre-filled with planned values, **Then** athlete only needs to tap complete (no manual entry required)
5. **Given** athlete modifies a pre-filled value, **When** viewing the set row, **Then** a subtle indicator shows "modified from plan"

---

### User Story 7 - Clear Workout Navigation (Priority: P1)

As an athlete, I want clear navigation between the workout list and active workout so that I always know where I am and can easily continue or start sessions.

**Why this priority**: Current navigation is confusing - unclear distinction between `/workout` and `/workout/[id]` pages, "Back" behavior inconsistent.

**Independent Test**: User can navigate from workout list → start session → complete session → back to list without confusion.

**Acceptance Scenarios**:

1. **Given** athlete has an ongoing session, **When** visiting `/workout`, **Then** "Continue Workout" card is prominently displayed at top
2. **Given** athlete has today's assigned sessions, **When** visiting `/workout`, **Then** sessions are listed with clear date and "Start" action
3. **Given** athlete is in active workout at `/workout/[id]`, **When** tapping "Back to Workouts", **Then** navigates to `/workout` (not browser back)
4. **Given** athlete completes a workout, **When** tapping "Finish", **Then** shows completion summary and option to return to workout list

---

### Edge Cases

- What if a feature genuinely needs different patterns? (Document exception with rationale in feature README)
- How do we handle gradual migration? (Create migration guide, prioritize by usage frequency)
- What about third-party component patterns? (Wrap in feature-specific components that follow pattern)
- What if user has no network during workout? (Local persistence + sync queue pattern)
- What if multiple browser tabs have same workout? (Last-write-wins with conflict notification)
- What if athlete has no PR for an exercise with effort percentage? (Show empty field, allow manual entry)
- What if athlete modifies pre-filled value back to original? (Clear "modified" indicator)
- What if coach didn't prescribe any values for a set? (Show empty inputs, athlete enters all values)

## Requirements

### Functional Requirements

#### Standard Feature Structure

- **FR-001**: Every feature MUST have the following structure:
  ```
  components/features/[feature-name]/
  ├── components/          # Feature-specific UI components
  │   ├── index.ts        # Public component exports
  │   └── [Component].tsx
  ├── hooks/              # Custom hooks for data/state (if needed)
  │   ├── index.ts        # Public hook exports
  │   ├── use[Feature]Queries.ts  # Data fetching hooks
  │   └── use[Feature]Mutations.ts # Data mutation hooks
  ├── context/            # Context providers (if needed)
  │   ├── index.ts        # Public context exports
  │   └── [Feature]Context.tsx
  ├── types.ts            # Feature-specific types
  ├── index.ts            # Public API exports
  └── README.md           # Feature documentation (optional)
  ```

- **FR-002**: Feature index.ts MUST export only public API (components, hooks, types)
- **FR-003**: All component files MUST be PascalCase
- **FR-004**: All hook files MUST start with "use" prefix
- **FR-005**: Types MUST be in a single types.ts file (not scattered across components)

#### State Management Decision Tree

- **FR-006**: Use **Server Components** when:
  - Data fetching on initial render
  - No user interactivity required
  - SEO is important

- **FR-007**: Use **Custom Hooks** when:
  - Local state for single component or small component tree
  - Data fetching with caching (React Query pattern)
  - Reusable stateful logic

- **FR-008**: Use **Context API** when:
  - State shared across many components in feature
  - State needs to be modified by deeply nested components
  - Complex state with reducers

- **FR-009**: NEVER mix patterns within single feature without documented rationale

#### Component Patterns

- **FR-010**: Page-level components MUST be server components unless interactivity required
- **FR-011**: Client components MUST have 'use client' directive at top
- **FR-012**: Data fetching client components MUST use hooks, not useEffect
- **FR-013**: Forms MUST use React Hook Form + Zod + ActionState pattern
- **FR-014**: Loading states MUST use Suspense boundaries or dedicated loading components

#### Export Patterns

- **FR-015**: Each subdirectory (components/, hooks/, context/) MUST have index.ts
- **FR-016**: Feature index.ts MUST re-export from subdirectories
- **FR-017**: Internal components (not part of public API) MUST NOT be exported from index

#### Data Persistence Patterns (NEW)

- **FR-018**: All data mutations MUST use server actions returning `ActionState<T>`
- **FR-019**: All server actions MUST call `revalidatePath()` or `revalidateTag()` after successful mutations
- **FR-020**: Features with draft/in-progress data MUST implement local persistence (localStorage/IndexedDB)
- **FR-021**: Auto-save functionality MUST NOT use client-side refs that are lost on unmount
- **FR-022**: "Complete" or "Submit" actions MUST flush all pending saves before finalizing

#### Mutation Hook Pattern (NEW)

- **FR-023**: Data mutations MUST use React Query's `useMutation` with:
  - `onMutate`: Cancel queries, snapshot previous state, apply optimistic update
  - `onError`: Rollback to previous state, show error notification
  - `onSettled`: Invalidate relevant queries

- **FR-024**: Example mutation hook structure:
  ```typescript
  // hooks/use[Feature]Mutations.ts
  export function useSave[Entity]() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: save[Entity]Action,
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: ['feature', id] })
        const previous = queryClient.getQueryData(['feature', id])
        queryClient.setQueryData(['feature', id], (old) => ({ ...old, ...newData }))
        return { previous }
      },
      onError: (err, newData, context) => {
        queryClient.setQueryData(['feature', id], context?.previous)
        toast.error("Failed to save")
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['feature'] })
      }
    })
  }
  ```

- **FR-025**: All mutation hooks MUST be placed in `hooks/use[Feature]Mutations.ts`

#### Draft Persistence Pattern (NEW)

- **FR-026**: Features with user-entered draft data MUST implement:
  ```typescript
  // lib/[feature]-persistence.ts
  const DRAFT_KEY = '[feature]-draft'

  export function saveDraft(id: number, data: DraftData): void
  export function getDraft(id: number): DraftData | null
  export function clearDraft(id: number): void
  ```

- **FR-027**: Draft data MUST be saved on every user input (debounced 500ms)
- **FR-028**: Draft data MUST be cleared after successful server save
- **FR-029**: Page load MUST check for existing draft and offer recovery option

#### Save-Before-Complete Pattern (NEW)

- **FR-030**: Any "Complete" or "Finish" action MUST:
  1. Cancel all ongoing queries
  2. Wait for pending mutations to complete
  3. Flush any draft data to server
  4. Clear local draft storage
  5. Then mark the entity as complete

- **FR-031**: Example implementation:
  ```typescript
  const handleComplete = async () => {
    // 1. Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['workout'] })

    // 2. Wait for pending mutations
    const pendingMutations = queryClient.getMutationCache().findAll({ status: 'pending' })
    await Promise.all(pendingMutations.map(m => m.promise))

    // 3. Flush draft data
    const draft = getDraft(sessionId)
    if (draft) {
      await saveDraftAction(sessionId, draft)
      clearDraft(sessionId)
    }

    // 4. Complete the session
    const result = await completeSessionAction(sessionId)
    if (result.isSuccess) {
      toast.success("Completed!")
      router.push('/history')
    }
  }
  ```

#### Unsaved Changes Warning (NEW)

- **FR-032**: Pages with unsaved changes MUST show confirmation dialog on:
  - Browser back/forward navigation
  - Page refresh (beforeunload event)
  - Internal navigation (Next.js router)

- **FR-033**: Unsaved changes indicator MUST be visible to user (e.g., dot in header, "Saving..." status)

#### Next.js 16 Specific Requirements (CRITICAL)

- **FR-034**: DO NOT create `middleware.ts` for authentication - deprecated in Next.js 16
- **FR-035**: Auth checks MUST be in server actions, layouts, or route handlers (NOT proxy/middleware)
- **FR-036**: All `params` and `searchParams` access MUST use `await` (sync access removed)
  ```typescript
  // ✅ Correct Next.js 16 pattern
  export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
  }
  ```
- **FR-037**: If `app/proxy.ts` is needed, use ONLY for routing (redirects, rewrites, headers)

#### TanStack Query Configuration Standards (NEW)

- **FR-038**: Application MUST have exactly ONE QueryClient instance (in providers.tsx)
- **FR-039**: Feature-specific query configs MUST NOT create separate QueryClient instances
- **FR-040**: Default staleTime MUST be > 0 for all queries (avoid excessive refetching)
  ```typescript
  // ❌ Bad - causes immediate refetch on every render
  staleTime: 0

  // ✅ Good - appropriate for different data types
  SESSIONS_TODAY: 30 * 1000,     // 30 seconds for real-time data
  PERFORMANCE_HISTORY: 15 * 60 * 1000  // 15 minutes for historical data
  ```
- **FR-041**: Critical queries SHOULD use server prefetching with HydrationBoundary
  ```typescript
  // app/(protected)/workout/page.tsx
  export default async function WorkoutPage() {
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: WORKOUT_QUERY_KEYS.SESSIONS_TODAY,
      queryFn: () => getTodaySessionsAction()
    })
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WorkoutPageContent />
      </HydrationBoundary>
    )
  }
  ```
- **FR-042**: Query keys MUST be defined in centralized config file per feature

#### LRU Cache Optimization (NEW)

- **FR-043**: User ID cache (Clerk → DB) is process-local; accept cold start DB queries
- **FR-044**: Consider Redis/Vercel KV only if cold start latency becomes problematic
- **FR-045**: Cache invalidation MUST happen when user data changes (role, deletion)

#### Multi-Tab Handling (NEW)

- **FR-046**: When multiple browser tabs have the same workout open, the application MUST use last-write-wins semantics with a visible conflict notification to the user when data from another tab overwrites local changes

#### Athlete Workout UI Requirements (NEW - 2025-12-25)

- **FR-047**: Athlete workout view MUST dynamically render only the input columns that the coach's plan includes (based on non-null values in `session_plan_sets`)
- **FR-048**: For strength exercises with `effort` percentage but no explicit `weight`, the system MUST auto-generate target weight from `athlete_personal_bests` table
- **FR-049**: For sprint exercises with `effort` percentage, the system MUST auto-generate target time based on athlete's PR for that distance
- **FR-050**: Workout set rows MUST pre-fill with coach's planned values from `session_plan_sets` when athlete starts a session
- **FR-051**: Exercise index circle (showing exercise number) MUST be clickable to toggle all sets complete/incomplete in one tap
- **FR-052**: Session timer MUST be positioned to the LEFT of the % complete indicator to minimize UI shift during save/finish animations

#### Workout Page Architecture Requirements (NEW - 2025-12-25)

- **FR-053**: `/workout` page MUST prioritize displaying ongoing sessions (`status: 'ongoing'`) with a prominent "Continue Workout" action
- **FR-054**: `/workout` page MUST show today's assigned sessions (`status: 'assigned'`, `date: today`) below any ongoing session
- **FR-055**: `/workout` page MUST display clear date indicators on each session card
- **FR-056**: `/workout` page MUST redirect to `/workout/[id]` when user clicks "Start Session", after calling `startTrainingSessionAction()`
- **FR-057**: `/workout/[id]` page MUST provide a "Back to Workouts" navigation that goes to `/workout` (not browser back)
- **FR-058**: `/workout/[id]` page MUST show exercises with current progress for `ongoing` sessions, or read-only summary for `completed` sessions

#### Minimal Section Grouping (NEW - 2025-12-25)

- **FR-059**: Exercise sections MUST be determined dynamically by consecutive exercises with the same `exercise_type_id` (grouping logic already exists in `exercise-grouping.ts`)
- **FR-060**: Section transitions MUST be rendered with a minimal separator line between different exercise types, NOT heavy Card headers
- **FR-061**: Section labels (e.g., "Warm Up", "Sprint") MAY be shown as small, unobtrusive text above the separator line but are OPTIONAL
- **FR-062**: Progress tracking MUST be at session level (header), NOT at section level (remove section-level progress bars)
- **FR-063**: "Mark All" for sections is REPLACED by the exercise circle tap (FR-051) for individual exercises

### Key Entities

- **Feature**: Self-contained domain module with components, state, and types
- **Component**: UI building block, either server (default) or client
- **Hook**: Reusable stateful logic with "use" prefix
- **Context**: Shared state provider for component tree
- **Mutation**: Server action wrapped in React Query mutation hook with optimistic updates
- **Draft**: Local persistence of user-entered data not yet saved to server

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of features have components/, index.ts, and types.ts
- **SC-002**: 100% of features have index.ts with proper exports
- **SC-003**: Zero components with useEffect for data fetching (all use hooks or server components)
- **SC-004**: All features pass structural linting (ESLint rules for exports)
- **SC-005**: Feature pattern documentation exists and is referenced in CLAUDE.md ✅
- **SC-006**: Zero data loss on page refresh during workout (draft recovery works)
- **SC-007**: 100% of mutations use ActionState return type
- **SC-008**: 100% of mutations have optimistic update with rollback capability
- **SC-009**: All "Complete" actions flush pending saves before finalizing
- **SC-010**: User sees save status indicator for all features with auto-save

### Caching & Performance Criteria (NEW)

- **SC-011**: Exactly ONE QueryClient instance exists in application
- **SC-012**: Zero queries with staleTime=0 (except realtime subscriptions)
- **SC-013**: All page routes use server prefetching with HydrationBoundary
- **SC-014**: Initial page load fetches data server-side (no client waterfall)
- **SC-015**: Query cache hit rate > 80% in production (measured via React Query devtools)

### Next.js 16 Compliance Criteria (NEW)

- **SC-016**: Zero middleware.ts files in codebase
- **SC-017**: All auth checks in server actions, layouts, or route handlers
- **SC-018**: 100% of page components use async params pattern
- **SC-019**: Zero synchronous access to cookies(), headers(), params, searchParams

## Current State Audit

### Plans Feature (40 files, 11,259 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 11 subdirectories, nested structure |
| hooks/ | No | Uses context directly |
| context/ | Yes (workspace/context/) | Non-standard location |
| types.ts | Yes (session-planner/types.ts) | Non-standard location |
| index.ts | No | Missing |

**Data Pattern Issues**:
- Uses undo/redo history (50 states) stored in useState - lost on refresh
- No draft persistence for session planner
- Manual save only (no auto-save)

**Migration Needed**:
- Create hooks/ directory with mutation hooks
- Move context to standard location
- Consolidate types to feature root
- Add index.ts with exports
- Add draft persistence for session planning

### Sessions Feature (8 files, 1,131 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 4 components |
| hooks/ | Yes | 2 hooks (useSessionData, useAutoSave) |
| context/ | No | Not needed |
| types.ts | No | Types in hooks |
| index.ts | Yes | Good exports |

**Data Pattern Issues**:
- useAutoSave uses debounced server calls (good)
- Types scattered in hook files

**Migration Needed**:
- Extract types from hooks to types.ts
- Minor structure cleanup

### Athletes Feature (7 files, 1,154 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 5 components |
| hooks/ | No | Uses useState directly |
| context/ | No | Not needed |
| types.ts | Yes | Good |
| index.ts | Yes | Good exports |

**Data Pattern Issues**:
- No mutation hooks (direct server action calls)
- Missing optimistic updates

**Migration Needed**:
- Add mutation hooks for athlete CRUD operations
- Otherwise good structure

### Workout Feature (16 files, 5,957 LOC) - CRITICAL
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | Multiple subdirectories |
| hooks/ | Yes | 4 hooks but issues |
| context/ | Yes | ExerciseContext with save queue |
| types.ts | No | Uses training.ts types |
| index.ts | No | Missing |

**CRITICAL BUGS FOUND (2025-12-24)**:

1. **Save Button Does NOT Save Exercise Data**
   - Location: `use-workout-session.ts:184-205`
   - `saveSession()` only updates `session_status` to 'ongoing'
   - It does NOT save any exercise/set performance data
   - User sees "Session Saved" toast but nothing is actually saved!

2. **Finish Button Same Problem**
   - Location: `use-workout-session.ts:208-239`
   - Calls `saveSession()` (broken) then `completeSession()`
   - Only updates status to 'completed', doesn't save exercise data
   - All workout data is lost when finishing!

3. **Auto-Save Queue Never Flushed by Buttons**
   - `workoutApi.forceSave()` exists but is never called by Save/Finish buttons
   - Exercise data only saves via debounced auto-save (2s delay)
   - If user clicks Finish before auto-save fires, data is lost

4. **Root Cause**: Disconnect between auto-save and button actions
   - Exercise data: Saved by `ExerciseContext` via `useWorkoutApi.saveExercisePerformance()`
   - Save/Finish buttons: Only call `useWorkoutSession` which updates session status
   - These two systems don't communicate!

**Data Pattern Issues (CRITICAL)**:
- Auto-save queue stored in `useRef` - **lost on page refresh**
- `completeSession` doesn't flush save queue before completing
- No draft persistence layer
- No rollback on failed optimistic updates
- 3-layer indirection: ExerciseContext → useWorkoutSession → useWorkoutApi → server actions
- **Save button doesn't save exercise data (only session status)**
- **Finish button doesn't ensure exercise data is saved before completing**

**Migration Needed**:
- **FIX CRITICAL**: Save button must call `forceSave()` and wait for queue to flush
- **FIX CRITICAL**: Finish button must call `forceSave()` before completing session
- Replace useRef queue with React Query mutations
- Add localStorage/IndexedDB draft persistence
- Implement save-before-complete pattern
- Add beforeunload handler for unsaved changes
- Consolidate hook layers
- Add index.ts with exports

### Caching & Optimization Audit (NEW)

#### TanStack Query Configuration
| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| Unused QueryClient factory | `query-config.ts:88` | Medium | Delete `createWorkoutQueryClient()` |
| staleTime=0 for critical queries | `query-config.ts:51-52` | Medium | Set to 30-60 seconds |
| No server prefetching | All query hooks | High | Add HydrationBoundary |
| Duplicate useSupabaseQuery hook | `hooks/useSupabaseQuery.ts` | Low | Consolidate patterns |

#### LRU Cache (User ID Mapping)
| Setting | Value | Assessment |
|---------|-------|------------|
| Max entries | 100 | ✅ Sufficient |
| TTL | 15 minutes | ✅ Good balance |
| Cold start behavior | DB query (~5-10ms) | ✅ Acceptable |
| Cross-instance sharing | None (process-local) | ⚠️ Accept for now |

#### Clerk + Supabase Auth (2025 Pattern)
| Pattern | Status |
|---------|--------|
| Native third-party integration | ✅ Correct |
| Fresh JWT per request | ✅ Correct |
| JWKS caching by Supabase | ✅ Automatic (10 min) |
| No middleware auth | ✅ Correct for Next.js 16 |

#### Next.js 16 Compliance
| Requirement | Status |
|-------------|--------|
| No middleware.ts for auth | ✅ File doesn't exist |
| Auth in server actions | ✅ Current pattern |
| Async params/searchParams | ⚠️ Needs audit |
| proxy.ts if needed | ✅ Not needed currently |

## Implementation Plan

### Phase 0: Quick Fixes (Immediate - 1 hour)
**Priority**: Get quick wins before major refactoring

1. **Delete unused QueryClient factory**
   - File: `components/features/workout/config/query-config.ts:88`
   - Remove `createWorkoutQueryClient()` function (never used)

2. **Fix staleTime=0 issues**
   - File: `components/features/workout/config/query-config.ts:51-52`
   - Change `SESSIONS_TODAY: 0` → `30 * 1000` (30 seconds)
   - Change `SESSION_DETAILS: 0` → `60 * 1000` (1 minute)

3. **Audit async params usage** (Next.js 16 compliance)
   - Search for `{ params }` in page.tsx files
   - Ensure all use `await props.params` pattern

### Phase 1: Define Standard (Day 1)
1. Create `docs/patterns/feature-pattern.md` with full specification
2. Create `docs/patterns/actionstate-pattern.md` for data mutations
3. Create `docs/patterns/hooks-vs-context.md` decision guide
4. ~~Update CLAUDE.md to reference pattern docs~~ ✅ DONE (2025-12-24)

### Phase 2: Fix Workout Data Persistence (Days 2-3) - CRITICAL
1. Add `beforeunload` handler to warn about unsaved changes
2. Create `lib/workout-persistence.ts` for draft storage
3. Implement `useSaveWorkoutSet` mutation hook with rollback
4. Update `completeSession` to flush pending saves
5. Test: Enter data → refresh → verify recovery

### Phase 3: Add Server Prefetching (Day 3)
**Priority**: Improve initial load performance

1. Add HydrationBoundary to workout page
   ```typescript
   // app/(protected)/workout/page.tsx
   const queryClient = new QueryClient()
   await queryClient.prefetchQuery({...})
   return <HydrationBoundary state={dehydrate(queryClient)}>...</HydrationBoundary>
   ```

2. Add HydrationBoundary to plans page
3. Add HydrationBoundary to sessions page

### Phase 4: Sessions Feature (Day 4) - Reference Implementation
1. Extract types to types.ts
2. Document as reference feature
3. Use as template for others

### Phase 5: Athletes Feature (Day 4-5)
1. Already mostly compliant
2. Add mutation hooks for CRUD operations
3. Verify exports

### Phase 6: Plans Feature (Days 5-7)
1. Largest feature, most migration work
2. Move context to standard location
3. Create hooks/ directory with mutation hooks
4. Consolidate types
5. Add index.ts
6. Add draft persistence for session planner

### Phase 7: Validation (Day 8)
1. Run structural linting on all features
2. Update feature documentation
3. Create migration guide for future features
4. Verify zero data loss on all features
5. Verify Next.js 16 async params compliance

## Pattern Documentation Draft

### When to Use Each Pattern

```
                    ┌─────────────────────┐
                    │ Need State/Effects? │
                    └─────────┬───────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                   No                  Yes
                    │                   │
                    ▼                   │
           ┌────────────────┐          │
           │ Server         │          │
           │ Component      │          │
           └────────────────┘          │
                              ┌────────┴────────┐
                              │                 │
                              ▼                 ▼
                    ┌──────────────┐   ┌──────────────┐
                    │ Local/Simple │   │ Shared/Deep  │
                    │ State?       │   │ Tree State?  │
                    └──────┬───────┘   └──────┬───────┘
                           │                  │
                           ▼                  ▼
                    ┌────────────┐     ┌────────────┐
                    │ Custom     │     │ Context    │
                    │ Hook       │     │ + Reducer  │
                    └────────────┘     └────────────┘
```

### Data Mutation Decision Tree (NEW)

```
                    ┌─────────────────────────┐
                    │ Need to mutate data?    │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ Use Server Action with  │
                    │ ActionState<T> return   │
                    └─────────┬───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌─────────────┐    ┌─────────────────┐
            │ Simple form │    │ Complex/Draft   │
            │ submit?     │    │ data entry?     │
            └─────┬───────┘    └───────┬─────────┘
                  │                    │
                  ▼                    ▼
           ┌────────────┐     ┌───────────────────┐
           │ Direct     │     │ React Query       │
           │ action     │     │ useMutation +     │
           │ call       │     │ Local Persistence │
           └────────────┘     └───────────────────┘
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `PlanCard.tsx` |
| Hook | camelCase with use prefix | `usePlanData.ts` |
| Mutation Hook | camelCase with use prefix | `usePlanMutations.ts` |
| Context | PascalCase with Context suffix | `PlanContext.tsx` |
| Types | lowercase | `types.ts` |
| Index | lowercase | `index.ts` |
| Utils | kebab-case | `date-utils.ts` |
| Persistence | kebab-case | `workout-persistence.ts` |

## Assumptions

- React Query (TanStack Query 5.x) is available and preferred for data fetching/caching
- localStorage is available for draft persistence (falls back to memory if not)
- All server actions follow the existing ActionState pattern
- Network connectivity is generally available but brief disconnections should be handled
- **Next.js 16** is the runtime - middleware.ts is deprecated, use proxy.ts only for routing
- **Clerk 6.x** with native Supabase integration (no JWT templates)
- Auth verification happens in server actions, not at network edge (post CVE-2025-29927)
- Async params/searchParams access is required (sync access removed in Next.js 16)
- Turbopack is the default bundler (webpack requires explicit --webpack flag)

## References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)
- [TanStack Query SSR Guide](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)
- [Clerk + Supabase Integration](https://supabase.com/docs/guides/auth/third-party/clerk)
- [CVE-2025-29927 - Middleware Bypass Vulnerability](https://www.buildwithmatija.com/blog/nextjs16-middleware-change)
