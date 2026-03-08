# Tasks: Individual User Role

**Input**: Design documents from `.specify/features/006-individual-user-role/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification. Tasks focus on implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: Primary app at `apps/web/`
- All paths relative to `apps/web/` unless otherwise noted

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verify existing infrastructure

- [x] T001 Verify branch 006-individual-user-role is active and up to date with 005-ai-athlete-workout
- [x] T002 [P] Read existing user-role-context.tsx to understand current implementation in apps/web/contexts/user-role-context.tsx
- [x] T003 [P] Read existing onboarding-actions.ts to understand current patterns in apps/web/actions/onboarding/onboarding-actions.ts
- [x] T004 [P] Read existing app-sidebar.tsx to understand navigation structure in apps/web/components/layout/sidebar/app-sidebar.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type extensions and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add 'individual' to UserRole type in apps/web/contexts/user-role-context.tsx
- [x] T006 Add isIndividual computed property to UserRoleContextValue in apps/web/contexts/user-role-context.tsx
- [x] T007 [P] Create terminology utility function in apps/web/lib/terminology.ts (see contracts/terminology.md)
- [x] T008 [P] Create useTerminology hook in apps/web/lib/terminology.ts
- [x] T009 Update OnboardingData interface to include 'individual' role option in apps/web/components/features/onboarding/onboarding-wizard.tsx

**Checkpoint**: Foundation ready - UserRole type extended, terminology utility created, user story implementation can begin

---

## Phase 3: User Story 1 - Role Selection During Onboarding (Priority: P1) 🎯 MVP

**Goal**: Enable users to select "Train Myself" as a role option during onboarding, with simplified individual-specific fields

**Independent Test**: Complete onboarding flow selecting "Train Myself" and verify user.role = 'individual' and athlete record exists

### Implementation for User Story 1

- [x] T010 [P] [US1] Add third card "Train Myself" to role selection in apps/web/components/features/onboarding/steps/role-selection-step.tsx
- [x] T011 [P] [US1] Update handleRoleSelect function signature to accept 'individual' in apps/web/components/features/onboarding/steps/role-selection-step.tsx
- [x] T012 [US1] Create individual-details-step.tsx component in apps/web/components/features/onboarding/steps/individual-details-step.tsx
- [x] T013 [US1] Add individual-specific fields (trainingGoals, experienceLevel, availableEquipment) to individual-details-step.tsx
- [x] T014 [US1] Add form validation using Zod for individual onboarding fields in individual-details-step.tsx
- [x] T015 [US1] Update onboarding-wizard.tsx to route to individual-details-step when role='individual' in apps/web/components/features/onboarding/onboarding-wizard.tsx
- [x] T016 [US1] Add individual handling to completeOnboardingAction in apps/web/actions/onboarding/onboarding-actions.ts
- [x] T017 [US1] Create silent athlete record for individual users in onboarding-actions.ts (enables workout logging FK)
- [x] T018 [US1] Add individualData fields to OnboardingActionData interface in onboarding-actions.ts

**Checkpoint**: User Story 1 complete - New users can select "Train Myself" and complete individual onboarding

---

## Phase 4: User Story 2 - Individual Navigation and Access Control (Priority: P1)

**Goal**: Individual users see athlete navigation plus "My Training", with coach-only items hidden

**Independent Test**: Log in as individual user and verify sidebar shows: Overview, Workout, My Training, Exercise Library, Knowledge Base, Performance, Settings - NOT Athletes/Sessions

### Implementation for User Story 2

- [x] T019 [US2] Replace coachOnly boolean with visibleTo array pattern in NavItem interface in apps/web/components/layout/sidebar/app-sidebar.tsx
- [x] T020 [US2] Replace coachOnly boolean with visibleTo array pattern in TrainingItem interface in apps/web/components/layout/sidebar/app-sidebar.tsx
- [x] T021 [US2] Update navItems array with visibleTo configuration per contracts/navigation.md in app-sidebar.tsx
- [x] T022 [US2] Update trainingItems array with visibleTo configuration per contracts/navigation.md in app-sidebar.tsx
- [x] T023 [US2] Update filteredNavItems logic to use visibleTo.includes(role) pattern in app-sidebar.tsx
- [x] T024 [US2] Update filteredTrainingItems logic to use visibleTo.includes(role) pattern in app-sidebar.tsx
- [x] T025 [US2] Add role to useUserRole destructuring in app-sidebar.tsx (uses role directly for flexibility)
- [x] T026 [P] [US2] Update nav-main.tsx if needed for individual role handling in apps/web/components/layout/sidebar/nav-main.tsx (no changes needed - filtering done in parent)

**Checkpoint**: User Story 2 complete - Individual users see correct navigation items

---

## Phase 5: User Story 3 - Simplified Training Block Creation (Priority: P2)

**Goal**: Individual users see friendly terminology (Training Block, Week, Workout) instead of technical terms, with Macrocycle hidden

**Independent Test**: Create a Training Block as individual user and verify no "Mesocycle", "Microcycle", or "Macrocycle" terminology appears

### Implementation for User Story 3

- [ ] T027 [US3] Identify all plan/workspace components that display periodization terminology
- [ ] T028 [P] [US3] Import useTerminology hook in plan creation components
- [ ] T029 [US3] Replace hardcoded "Mesocycle" with terms.mesocycle in plan creation flow
- [ ] T030 [US3] Replace hardcoded "Microcycle" with terms.microcycle in plan workspace components
- [ ] T031 [US3] Replace hardcoded "Session Plan" with terms.sessionPlan in session-related components
- [ ] T032 [US3] Add conditional rendering to hide Macrocycle UI when terms.macrocycle is null
- [ ] T033 [US3] Add one-active-block validation for individual users in plan creation action
- [ ] T034 [US3] Display user-friendly message when individual tries to create second active Training Block

**Checkpoint**: User Story 3 complete - Individual users see friendly terminology throughout planning flow

---

## Phase 6: User Story 4 - Workout Logging for Individuals (Priority: P2)

**Goal**: Individual users can log workouts linked to their Training Block/Week with progress saved to athlete record

**Independent Test**: Log a complete workout as individual user and verify it appears in training history

### Implementation for User Story 4

- [ ] T035 [US4] Verify workout page correctly loads for individual users in apps/web/app/(protected)/workout/
- [ ] T036 [US4] Ensure workout logging saves to individual's silently-created athlete record
- [ ] T037 [US4] Verify session_plan lookup works for individual's Training Blocks (user_id filter, not athlete_group_id)
- [ ] T038 [US4] Update any "Session Plan" labels to use terminology utility in workout components
- [ ] T039 [US4] Verify workout history display for individual users

**Checkpoint**: User Story 4 complete - Individual users can log and view workouts

---

## Phase 7: User Story 5 - Individual to Coach/Athlete Upgrade Path (Priority: P3)

**Goal**: Support role transitions while preserving training history and workout data

**Independent Test**: Change individual's role to Coach or Athlete and verify all workout history remains accessible

### Implementation for User Story 5

- [ ] T040 [US5] Add role transition action in apps/web/actions/auth/ or appropriate location
- [ ] T041 [US5] Implement Individual → Coach transition (create coaches record, preserve athlete record)
- [ ] T042 [US5] Implement Individual → Athlete transition (link athlete record to coach's group)
- [ ] T043 [US5] Add validation to prevent data loss during role transitions
- [ ] T044 [US5] Mark previous Training Blocks as read-only when transitioning to Athlete role
- [ ] T045 [US5] Add role transition UI to Settings page if not already present

**Checkpoint**: User Story 5 complete - Role transitions work without data loss

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T046 [P] Update design document with implementation notes in apps/web/docs/features/individual-user-role-design.md (DONE: marked coachOnly as deprecated)
- [x] T047 Run type-check: npx tsc --noEmit to verify no TypeScript errors (PASSED)
- [ ] T048 Run linter: npm run lint to verify no ESLint errors (BLOCKED: pre-existing ESLint config issue)
- [x] T049 Run build: npm run build to verify production build succeeds (PASSED - Next.js 16.0.10 Turbopack)
- [ ] T050 Manual QA: Complete full onboarding flow as individual user
- [ ] T051 Manual QA: Verify all navigation items correct for individual role
- [ ] T052 Manual QA: Create Training Block and verify terminology throughout
- [ ] T053 Manual QA: Log workout and verify it appears in history

### Code Review Completed (2026-01-02)

**Legacy Pattern Cleanup:**
- [x] Removed all `coachOnly` references from source code (only docs had references)
- [x] Updated `docs/security/rbac-implementation.md` to use `visibleTo` pattern
- [x] Updated `docs/features/individual-user-role-design.md` to mark implementation complete
- [x] Removed unused `Input` import from `individual-details-step.tsx`
- [x] Verified all modified files have clean imports and no legacy patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can run in parallel
  - US3 and US4 are both P2 and can run in parallel (after US1/US2 if needed for context)
  - US5 is P3 and can start after Foundational
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Core entry point for individual users
- **User Story 2 (P1)**: Can start after Foundational - Can run in parallel with US1
- **User Story 3 (P2)**: Can start after Foundational - Depends on terminology utility from Phase 2
- **User Story 4 (P2)**: Can start after Foundational - Depends on athlete record from US1 for testing
- **User Story 5 (P3)**: Can start after Foundational - Depends on US1 for individual users to exist

### Within Each User Story

- Models/types before services
- Services/actions before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 can run in parallel (reading existing files)
- T007, T008 can run in parallel (different functions in same new file)
- T010, T011 can run in parallel within US1 (same file but independent changes)
- T019-T026 in US2 should be sequential (same file modifications)
- T028 can run in parallel with other terminology updates
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch foundational tasks in parallel:
# Group 1: Context updates (sequential - same file)
Task T005: "Add 'individual' to UserRole type"
Task T006: "Add isIndividual computed property"

# Group 2: New utility file (parallel)
Task T007: "Create terminology utility function"
Task T008: "Create useTerminology hook"

# Group 3: Wizard update (after Group 1)
Task T009: "Update OnboardingData interface"
```

---

## Parallel Example: User Story 1

```bash
# After Foundational complete, launch US1 tasks:
# Group 1: Role selection (parallel - independent changes)
Task T010: "Add third card 'Train Myself'"
Task T011: "Update handleRoleSelect signature"

# Group 2: New component (sequential)
Task T012: "Create individual-details-step.tsx"
Task T013: "Add individual-specific fields"
Task T014: "Add form validation"

# Group 3: Wizard routing (after Group 2)
Task T015: "Route to individual-details-step"

# Group 4: Action updates (parallel with Group 2)
Task T016: "Add individual handling to action"
Task T017: "Create silent athlete record"
Task T018: "Add individualData to interface"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (onboarding)
4. Complete Phase 4: User Story 2 (navigation)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready - individuals can onboard and navigate

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Individuals can onboard
3. Add User Story 2 → Test independently → Correct navigation
4. Add User Story 3 → Test independently → Friendly terminology
5. Add User Story 4 → Test independently → Workout logging
6. Add User Story 5 → Test independently → Upgrade paths
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (onboarding)
   - Developer B: User Story 2 (navigation)
3. After US1/US2:
   - Developer A: User Story 3 (terminology)
   - Developer B: User Story 4 (workout logging)
4. Developer A or B: User Story 5 (upgrade path)

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 4 | Verify branch, read existing files |
| Phase 2: Foundational | 5 | Type extensions, terminology utility |
| Phase 3: US1 | 9 | Role selection onboarding |
| Phase 4: US2 | 8 | Navigation visibility |
| Phase 5: US3 | 8 | Terminology mapping |
| Phase 6: US4 | 5 | Workout logging |
| Phase 7: US5 | 6 | Upgrade path |
| Phase 8: Polish | 8 | QA and verification |
| **Total** | **53** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

---

## Phase 9: "My Training" UI Implementation (Priority: P2)

**Purpose**: Implement the simplified, individual-focused "My Training" UI experience

**Related Docs**:
- [Lo-Fi Wireframes](../../../apps/web/docs/design/individual-my-training-lofi.md)
- [Implementation Plan](./individual-my-training-implementation-plan.md)

### 9.1 Foundation & Utilities

- [ ] T054 [P] [UI] Create terminology hook usage pattern in apps/web/lib/terminology.ts (add useTerminology export)
- [ ] T055 [P] [UI] Create getActiveMesocycleForUserAction in apps/web/actions/plans/plan-actions.ts
- [ ] T056 [P] [UI] Create getUserMesocyclesAction in apps/web/actions/plans/plan-actions.ts (individual's Training Blocks)

### 9.2 Home Page Adaptation

- [ ] T057 [UI] Create TrainingBlockCard component in apps/web/components/features/plans/home/TrainingBlockCard.tsx
- [ ] T058 [UI] Create IndividualPlansHome component in apps/web/components/features/plans/home/IndividualPlansHome.tsx
- [ ] T059 [UI] Create EmptyTrainingState component in apps/web/components/features/plans/home/EmptyTrainingState.tsx
- [ ] T060 [UI] Add role detection to plans page in apps/web/app/(protected)/plans/page.tsx
- [ ] T061 [UI] Hide group filter for individuals in apps/web/components/features/plans/home/PlansHomeClient.tsx
- [ ] T062 [UI] Update page header to use terminology in apps/web/components/features/plans/components/PlanPageHeader.tsx

### 9.3 Quick Start Wizard (2-Step)

- [ ] T063 [UI] Create QuickStartWizard container in apps/web/components/features/plans/components/quickstart/QuickStartWizard.tsx
- [ ] T064 [UI] Create BlockSetupStep (Step 1) in apps/web/components/features/plans/components/quickstart/BlockSetupStep.tsx
- [ ] T065 [UI] Create WeekTemplateStep (Step 2) in apps/web/components/features/plans/components/quickstart/WeekTemplateStep.tsx
- [ ] T066 [UI] Create TemplateQuickSelect component in apps/web/components/features/plans/components/quickstart/TemplateQuickSelect.tsx
- [ ] T067 [UI] Add quick-setup presets (Upper/Lower, PPL, Full Body) to WeekTemplateStep
- [ ] T068 [UI] Route individuals to QuickStartWizard in apps/web/app/(protected)/plans/new/page.tsx
- [ ] T069 [UI] Create block creation action that creates mesocycle + microcycles + sessions in one transaction

### 9.4 Simplified Workspace (2-Column)

- [ ] T070 [UI] Create IndividualWorkspace component in apps/web/components/features/plans/workspace/IndividualWorkspace.tsx
- [ ] T071 [UI] Create WeeksList panel in apps/web/components/features/plans/workspace/components/WeeksList.tsx
- [ ] T072 [UI] Create WeekDetailPanel in apps/web/components/features/plans/workspace/components/WeekDetailPanel.tsx
- [ ] T073 [UI] Create WorkoutCard (simplified session) in apps/web/components/features/plans/workspace/components/WorkoutCard.tsx
- [ ] T074 [UI] Add role detection to workspace page in apps/web/app/(protected)/plans/[id]/page.tsx
- [ ] T075 [UI] Implement mobile slide navigation in IndividualWorkspace (reuse pattern from TrainingPlanWorkspace)
- [ ] T076 [UI] Add "Today" badge to current day's workout

### 9.5 Workout Editor Simplification

- [ ] T077 [UI] Create IndividualWorkoutEditor in apps/web/components/features/plans/session-planner/IndividualWorkoutEditor.tsx
- [ ] T078 [UI] Route to individual editor in apps/web/app/(protected)/plans/[id]/session/[sessionId]/page.tsx
- [ ] T079 [UI] Add "Save as Template" shortcut button to workout editor footer
- [ ] T080 [UI] Simplify exercise add flow (hide superset for individuals by default)

### 9.6 Edge Cases & Polish

- [ ] T081 [UI] Handle "no active block" empty state with template suggestions
- [ ] T082 [UI] Handle Training Block completion flow (mark complete, suggest next block)
- [ ] T083 [UI] Add deep link to today's workout from dashboard
- [ ] T084 [UI] Add week completion celebration animation
- [ ] T085 [UI] Add block completion summary view

### 9.7 Testing

- [ ] T086 [UI] Unit tests for terminology hook in apps/web/lib/__tests__/terminology.test.ts
- [ ] T087 [UI] Integration test: create Training Block flow
- [ ] T088 [UI] E2E test: individual creates block → edits workout → completes workout
- [ ] T089 [UI] E2E test: verify coach experience unchanged

---

## Analysis: Best Practices & Pitfalls

### Patterns to Follow (from existing Plans implementation)

#### 1. ActionState<T> Pattern (REQUIRED)
```typescript
// ✅ CORRECT: All server actions return ActionState<T>
export async function createTrainingBlockAction(
  data: CreateBlockData
): Promise<ActionState<Mesocycle>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }

    const dbUserId = await getDbUserId(userId)
    // ... implementation

    revalidatePath('/plans')
    return { isSuccess: true, message: 'Training Block created', data }
  } catch (error) {
    console.error('[createTrainingBlockAction]:', error)
    return { isSuccess: false, message: 'Failed to create Training Block' }
  }
}
```

#### 2. Authentication Flow (REQUIRED)
```typescript
// ✅ CORRECT: Always start with auth check + DB user lookup
const { userId } = await auth()
if (!userId) return { isSuccess: false, message: 'Not authenticated' }
const dbUserId = await getDbUserId(userId)  // Cached via LRU
```

#### 3. Server Component → Client Component Pattern
```typescript
// ✅ CORRECT: Fetch on server, pass to client
// page.tsx (Server)
export default async function PlansPage() {
  const result = await getMesocyclesAction()
  return <PlansClient initialData={result.data} />
}

// PlansClient.tsx (Client)
'use client'
export function PlansClient({ initialData }: { initialData: Mesocycle[] }) {
  // Use for interactivity
}
```

#### 4. Role-Based Conditional Rendering
```typescript
// ✅ CORRECT: Use role context for UI decisions
const { isIndividual, isCoach } = useUserRole()

if (isIndividual) {
  return <IndividualPlansHome />
}
return <PlansHome />  // Coach view
```

#### 5. Terminology Hook Usage
```typescript
// ✅ CORRECT: Use terminology hook for role-based labels
const { mesocycle, microcycle, sessionPlan } = useTerminology()

return <h1>Create {mesocycle}</h1>  // "Training Block" or "Mesocycle"
```

#### 6. Explicit Authorization Filters
```typescript
// ✅ CORRECT: Even with RLS, add explicit filters for clarity
const { data } = await supabase
  .from('mesocycles')
  .select('*')
  .eq('user_id', dbUserId)  // Explicit filter
  .is('athlete_group_id', null)  // Individual-specific
```

#### 7. Cache Revalidation After Mutations
```typescript
// ✅ CORRECT: Always revalidate affected paths
await supabase.from('mesocycles').insert(data)
revalidatePath('/plans')
revalidatePath(`/plans/${id}`)
```

---

### Pitfalls to Avoid

#### 1. ❌ Over-Fetching Data
```typescript
// ❌ BAD: Fetches all columns
.select('*')

// ✅ GOOD: Select specific fields
.select('id, name, start_date, end_date, user_id')
```

#### 2. ❌ Skipping Auth Checks
```typescript
// ❌ BAD: No auth verification
export async function deleteBlock(id: string) {
  await supabase.from('mesocycles').delete().eq('id', id)
}

// ✅ GOOD: Always verify auth + ownership
export async function deleteBlockAction(id: string): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: 'Not authenticated' }

  const dbUserId = await getDbUserId(userId)

  // Verify ownership
  const { data: block } = await supabase
    .from('mesocycles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (block?.user_id !== dbUserId) {
    return { isSuccess: false, message: 'Not authorized' }
  }

  // Now safe to delete
  await supabase.from('mesocycles').delete().eq('id', id)
  revalidatePath('/plans')
  return { isSuccess: true, message: 'Deleted' }
}
```

#### 3. ❌ Hardcoded Mock Data
```typescript
// ❌ BAD: Fallback to mock data hides bugs
const volume = data?.volume || [5, 6, 7, 5]

// ✅ GOOD: Proper empty state handling
if (!data?.volume?.length) {
  return <EmptyState message="No volume data yet" />
}
```

#### 4. ❌ Missing Error Context in Logs
```typescript
// ❌ BAD: No context for debugging
catch (error) {
  return { isSuccess: false, message: 'Failed' }
}

// ✅ GOOD: Log with action name and context
catch (error) {
  console.error('[createTrainingBlockAction]:', error)
  return {
    isSuccess: false,
    message: error instanceof Error ? error.message : 'Failed to create Training Block'
  }
}
```

#### 5. ❌ Type Casting to `any`
```typescript
// ❌ BAD: Hides type errors
const blocks = data as any

// ✅ GOOD: Proper type assertion with unknown intermediate
const blocks = (data || []) as unknown as MesocycleWithDetails[]
```

#### 6. ❌ Client-Side Fetching for Initial Load
```typescript
// ❌ BAD: Unnecessary client fetch for initial data
'use client'
useEffect(() => {
  async function load() {
    const data = await getBlocksAction()
    setBlocks(data)
  }
  load()
}, [])

// ✅ GOOD: Server-side fetch, pass as prop
// page.tsx (Server)
const blocks = await getBlocksAction()
return <BlocksList initialBlocks={blocks.data} />
```

#### 7. ❌ Forgetting Soft-Delete Filter
```typescript
// ❌ BAD: May return deleted records
const { data } = await supabase.from('session_plans').select()

// ✅ GOOD: Filter out deleted records
const { data } = await supabase
  .from('session_plans')
  .select()
  .eq('deleted', false)
```

#### 8. ❌ Mixing Terminology
```typescript
// ❌ BAD: Hardcoded coach terminology for individuals
<h1>Create Mesocycle</h1>

// ✅ GOOD: Use terminology hook
const terms = useTerminology()
<h1>Create {terms.mesocycle}</h1>
```

---

### Performance Optimizations

#### 1. Parallel Data Fetching
```typescript
// ✅ GOOD: Fetch independent data in parallel
const [blocksResult, templatesResult] = await Promise.all([
  getUserMesocyclesAction(),
  getTemplatesAction()
])
```

#### 2. Selective Field Loading
```typescript
// ✅ GOOD: Only load needed relationship data
const { data } = await supabase
  .from('mesocycles')
  .select(`
    id, name, start_date, end_date,
    microcycles(id, name, week_number)
  `)
```

#### 3. Lazy Loading Heavy Components
```typescript
// ✅ GOOD: Lazy load workspace components
const IndividualWorkspace = dynamic(
  () => import('./IndividualWorkspace'),
  { loading: () => <WorkspaceSkeleton /> }
)
```

#### 4. Optimistic Updates for Better UX
```typescript
// ✅ GOOD: Optimistic update for workout completion
const handleComplete = async () => {
  setStatus('completed')  // Optimistic
  const result = await completeWorkoutAction(id)
  if (!result.isSuccess) {
    setStatus('pending')  // Rollback
    toast.error(result.message)
  }
}
```

---

### Component Reuse Strategy

| Existing Component | Reuse in Individual UI | Notes |
|--------------------|----------------------|-------|
| Exercise Library Modal | ✅ As-is | Same exercise database |
| Set Configuration | ✅ As-is | Same set editor |
| VolumeIntensityChart | ✅ As-is (collapsible) | Add collapse toggle |
| EditSessionDialog | ✅ With terminology | Rename labels only |
| CopySessionDialog | ✅ Simplified | Hide advanced options |
| ExercisePlanningPanel | ✅ As-is | Same exercise flow |
| Template selector | ✅ As-is | Same templates |

---

### Database Considerations

#### No Schema Changes Required

The existing schema supports individuals:
- `mesocycles.athlete_group_id` is **nullable** ✅
- `session_plans.user_id` is **nullable** ✅
- `exercise_preset_groups.user_id` is **nullable** ✅

#### Query Pattern for Individuals
```sql
-- Individual's Training Blocks (mesocycles without group)
SELECT * FROM mesocycles
WHERE user_id = $1
  AND athlete_group_id IS NULL
ORDER BY start_date DESC;
```

---

## Updated Summary

| Phase | Tasks | Status | Description |
|-------|-------|--------|-------------|
| Phase 1: Setup | 4 | ✅ Complete | Verify branch, read existing files |
| Phase 2: Foundational | 5 | ✅ Complete | Type extensions, terminology utility |
| Phase 3: US1 | 9 | ✅ Complete | Role selection onboarding |
| Phase 4: US2 | 8 | ✅ Complete | Navigation visibility |
| Phase 5: US3 | 8 | 🔲 Pending | Terminology mapping |
| Phase 6: US4 | 5 | 🔲 Pending | Workout logging |
| Phase 7: US5 | 6 | 🔲 Pending | Upgrade path |
| Phase 8: Polish | 8 | 🔲 Partial | QA and verification |
| **Phase 9: UI** | **36** | 🔲 **NEW** | **My Training UI implementation** |
| **Total** | **89** | | |

---

## Implementation Priority

### MVP (Individual can create and use Training Blocks)

1. **Phase 5** (T027-T034): Terminology mapping - REQUIRED first
2. **Phase 9.1** (T054-T056): Foundation utilities
3. **Phase 9.2** (T057-T062): Home page adaptation
4. **Phase 9.3** (T063-T069): Quick Start wizard
5. **Phase 9.4** (T070-T076): Simplified workspace

### Post-MVP

6. **Phase 9.5** (T077-T080): Workout editor simplification
7. **Phase 9.6** (T081-T085): Edge cases & polish
8. **Phase 6** (T035-T039): Workout logging verification
9. **Phase 9.7** (T086-T089): Testing

### Future

10. **Phase 7** (T040-T045): Upgrade path
11. **Phase 8** remaining: Final QA

---

*Tasks updated: 2026-01-04*
*Added Phase 9 with 36 tasks for My Training UI implementation*
*Added Analysis section with patterns, pitfalls, and optimizations*
