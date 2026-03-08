# Implementation Tasks: Plan Page Improvements

**Feature**: 008-plan-workout-sync
**Created**: 2026-01-04
**Updated**: 2026-01-07
**Status**: Not Started
**Total Estimate**: 28-39 hours

---

## Overview

This task list covers both **Plan-Workout Sync** (Part A) and **UX Improvements** (Part B).

| Phase | Focus | Effort | Priority |
|-------|-------|--------|----------|
| Phase 1 | Individual Functionality | 6-8h | P0 |
| Phase 2 | Friction Reduction | 4-6h | P1 |
| Phase 3 | Sync MVP | 5-7h | P1 |
| Phase 4 | Polish | 5-8h | P2-P3 |
| Phase 5 | Advanced Sync | 8-10h | P2 |

---

## Phase 1: Individual Functionality (P0) - 6-8 hours

### Task 1.1: Enable Edit Block for Individual Users
**Priority**: P0-NEEDED | **Estimate**: 3-4 hours | **User Story**: US-B01

**Subtasks**:
- [ ] Create `components/features/plans/dialogs/EditBlockDialog.tsx`
  - Form fields: name, start_date, end_date, focus
  - Zod validation matching QuickStartWizard schema
  - Handle date conflicts (warn if dates affect existing workouts)
- [ ] Wire up in `IndividualWorkspace.tsx`
  - Remove `disabled` and `title="Coming soon"` from Edit Block button (line 72-75)
  - Add dialog state and trigger
- [ ] Connect to `updateMesocycleAction()`
  - Call on save, handle success/error with toast
  - Revalidate path on success
- [ ] Test: Edit block name, dates, focus - verify persistence

**Files**:
```
NEW: components/features/plans/dialogs/EditBlockDialog.tsx
MOD: components/features/plans/workspace/IndividualWorkspace.tsx
USE: actions/plans/plan-actions.ts (updateMesocycleAction)
```

---

### Task 1.2: Enable Add Workout for Individual Users
**Priority**: P0-NEEDED | **Estimate**: 3-4 hours | **User Story**: US-B02

**Subtasks**:
- [ ] Create `components/features/plans/dialogs/AddWorkoutDialog.tsx`
  - Form fields: name, day (select), type (optional)
  - Day dropdown: Mon-Sun (1-6, 0)
  - Optional: Copy from existing toggle
- [ ] Wire up in `IndividualWorkspace.tsx`
  - Remove `disabled` from Add Workout button (line 110-114)
  - Remove `disabled` from Add First Workout button (line 239-242)
  - Pass selected microcycle ID to dialog
- [ ] Create or reuse session plan creation action
  - May need new action or reuse `saveSessionPlanAction()`
  - Ensure proper microcycle_id linking
- [ ] Test: Add workout to empty week, add to week with existing workouts

**Files**:
```
NEW: components/features/plans/dialogs/AddWorkoutDialog.tsx
MOD: components/features/plans/workspace/IndividualWorkspace.tsx
USE: actions/plans/session-plan-actions.ts
```

---

## Phase 2: Friction Reduction (P1) - 4-6 hours

### Task 2.1: Remove Disabled Menu Items
**Priority**: P1-NEEDED | **Estimate**: 30 min | **User Story**: US-B03

**Subtasks**:
- [ ] Open `PlansHomeClient.tsx`
- [ ] Remove lines 121-133 (Duplicate, Export, Delete menu items)
- [ ] Verify dropdown still works with remaining items
- [ ] Test: Dropdown shows only working items (Assign to Groups)

**Files**:
```
MOD: components/features/plans/home/PlansHomeClient.tsx
```

---

### Task 2.2: Add Quick Start Workout CTA
**Priority**: P1-NEEDED | **Estimate**: 1-2 hours | **User Story**: US-B04

**Subtasks**:
- [ ] Create `components/features/plans/home/TodayWorkoutCTA.tsx`
  - Props: workout (id, name, exerciseCount) | null, blockId
  - If workout exists: Show prominent button with workout name
  - If null: Show "Rest Day" or hide component
  - Links to `/plans/{blockId}/session/{workoutId}`
- [ ] Integrate in `IndividualPlansHomeClient.tsx`
  - Add above "Active Training" section when todayWorkout exists
  - Pass todayWorkout prop (already available from server)
- [ ] Style: Primary color, icon, larger touch target
- [ ] Test: Click CTA, verify navigation to correct session

**Files**:
```
NEW: components/features/plans/home/TodayWorkoutCTA.tsx
MOD: components/features/plans/home/IndividualPlansHomeClient.tsx
```

---

### Task 2.3: Make Week Overview Days Clickable
**Priority**: P1-NEEDED | **Estimate**: 1 hour | **User Story**: US-B05

**Subtasks**:
- [ ] Modify `WeekOverview` in `IndividualPlansHomeClient.tsx` (lines 139-190)
  - Add onClick handler to days with workouts
  - Navigate to session: `/plans/${block.id}/session/${workout.id}`
  - Add cursor-pointer and hover:bg styles
  - Keep rest days non-clickable
- [ ] Get workout ID from dayWorkouts array for navigation
- [ ] Test: Click Monday workout, verify navigation

**Files**:
```
MOD: components/features/plans/home/IndividualPlansHomeClient.tsx
```

---

## Phase 3: Sync MVP (P1) - 5-7 hours

### Task 3.1: Database Migration - Add synced_at Column
**Priority**: P1-NEEDED | **Estimate**: 1 hour | **User Story**: US-A01

**Subtasks**:
- [ ] Create Supabase migration
  ```sql
  ALTER TABLE workout_logs
  ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN last_plan_update_at TIMESTAMPTZ;
  ```
- [ ] Apply migration via Supabase dashboard
- [ ] Update `types/database.ts` with new columns
- [ ] Regenerate types: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae`
- [ ] Test: Verify columns exist in database

**Files**:
```
NEW: supabase/migrations/YYYYMMDD_add_synced_at.sql
MOD: types/database.ts
```

---

### Task 3.2: Create Sync Server Action
**Priority**: P1-NEEDED | **Estimate**: 4 hours | **User Story**: US-A01

**Subtasks**:
- [ ] Create `actions/workout/workout-sync-actions.ts`
- [ ] Implement `syncPlanToAssignedWorkoutsAction(sessionPlanId: number)`
  - Fetch all `workout_logs` where `session_plan_id = planId` AND `session_status = 'assigned'`
  - For each workout:
    - Delete existing `workout_log_exercises` and `workout_log_sets`
    - Copy current `session_plan_exercises` → `workout_log_exercises`
    - Copy current `session_plan_sets` → `workout_log_sets`
    - Update `synced_at` and `last_plan_update_at`
- [ ] Add transaction wrapping for atomic operations
- [ ] Handle edge cases: no linked workouts, partial failures

**Files**:
```
NEW: actions/workout/workout-sync-actions.ts
```

---

### Task 3.3: Integrate Sync into Save Action
**Priority**: P1-NEEDED | **Estimate**: 1 hour | **User Story**: US-A01

**Subtasks**:
- [ ] Modify `saveSessionWithExercisesAction()` in `session-planner-actions.ts`
- [ ] Call `syncPlanToAssignedWorkoutsAction()` after successful save
- [ ] Handle errors gracefully (save succeeds even if sync fails)
- [ ] Test: Coach saves plan, verify assigned workouts updated

**Files**:
```
MOD: actions/plans/session-planner-actions.ts
```

---

## Phase 4: Polish (P2-P3) - 5-8 hours

### Task 4.1: Replace window.location.reload()
**Priority**: P2-GOOD | **Estimate**: 15 min | **User Story**: US-B07

**Subtasks**:
- [ ] Open `PlansHomeClient.tsx`
- [ ] Import useRouter: `import { useRouter } from 'next/navigation'`
- [ ] Add router hook: `const router = useRouter()`
- [ ] Replace line 261 `window.location.reload()` with `router.refresh()`
- [ ] Test: Assign plan, verify refresh without full reload

**Files**:
```
MOD: components/features/plans/home/PlansHomeClient.tsx
```

---

### Task 4.2: Add Periodization Tooltips
**Priority**: P2-GOOD | **Estimate**: 1-2 hours | **User Story**: US-B06

**Subtasks**:
- [ ] Create tooltip content:
  - Macrocycle: "Your annual or seasonal training plan"
  - Mesocycle: "A training phase (4-8 weeks) with specific goals"
  - Microcycle: "A single training week"
- [ ] Add info icons + Tooltip component to:
  - `plan-type-selection.tsx` (wizard step 1)
  - `TrainingPlanWorkspace.tsx` column headers
- [ ] Use shadcn Tooltip component
- [ ] Test: Hover info icons, verify tooltip appears

**Files**:
```
MOD: components/features/plans/components/mesowizard/plan-type-selection.tsx
MOD: components/features/plans/workspace/TrainingPlanWorkspace.tsx
```

---

### Task 4.3: Fix Completed Blocks "View All" Link
**Priority**: P2-GOOD | **Estimate**: 1 hour | **User Story**: US-B08

**Subtasks**:
- [ ] Replace "View all X completed" link with expand/collapse button
- [ ] Add local state: `const [showAllCompleted, setShowAllCompleted] = useState(false)`
- [ ] Toggle between showing 3 vs all completed blocks
- [ ] Test: Click shows all completed blocks

**Files**:
```
MOD: components/features/plans/home/IndividualPlansHomeClient.tsx
```

---

### Task 4.4: Consolidate Active + This Week Sections
**Priority**: P3-GOOD | **Estimate**: 2-3 hours | **User Story**: US-B09

**Subtasks**:
- [ ] Design combined "My Training" section layout
- [ ] Merge Active Training card + WeekOverview into single component
- [ ] Include Quick CTA (from Task 2.2)
- [ ] Remove redundant section headers
- [ ] Test: Verify same information, cleaner layout

**Files**:
```
MOD: components/features/plans/home/IndividualPlansHomeClient.tsx
NEW: components/features/plans/home/MyTrainingSection.tsx (optional)
```

---

### Task 4.5: Add Mobile Swipe Indicator
**Priority**: P3-GOOD | **Estimate**: 1 hour | **User Story**: US-B10

**Subtasks**:
- [ ] Add pagination dots to coach workspace mobile view
  - 3 dots for 3 panels
  - Highlight current panel based on mobileViewIndex
- [ ] Position below navbar or at bottom of viewport
- [ ] Test: Mobile viewport shows dots, updates on swipe

**Files**:
```
MOD: components/features/plans/workspace/TrainingPlanWorkspace.tsx
```

---

## Phase 5: Advanced Sync (P2) - 8-10 hours

### Task 5.1: Add Three-Dot Menu to WorkoutView
**Priority**: P2-NEEDED | **Estimate**: 2 hours | **User Story**: US-A02

**Subtasks**:
- [ ] Import `DropdownMenu` components from shadcn/ui
- [ ] Add three-dot button between Save and Finish buttons
- [ ] Show "Sync from Coach Plan" option when:
  - `session_status === 'ongoing'`
  - `session_plan_id IS NOT NULL`
- [ ] Test: Menu appears for ongoing workouts with linked plan

**Files**:
```
MOD: components/features/training/views/WorkoutView.tsx
```

---

### Task 5.2: Implement Athlete Pull Sync Action
**Priority**: P2-NEEDED | **Estimate**: 4-5 hours | **User Story**: US-A02

**Subtasks**:
- [ ] Create `athletePullSyncAction(workoutLogId: number)` in workout-sync-actions.ts
- [ ] Merge Logic:
  1. Fetch current workout state (exercises + sets)
  2. Fetch current session plan state
  3. For each plan exercise:
     - If exists in workout: Update non-completed sets only
     - If missing: Add exercise at end
  4. For each workout exercise:
     - If not in plan AND has logged data: Keep (preserve)
     - If not in plan AND no logged data: Remove
  5. Update `synced_at`
- [ ] Test: Athlete syncs mid-workout, new exercises appear, logged data preserved

**Files**:
```
MOD: actions/workout/workout-sync-actions.ts
```

---

### Task 5.3: Sync Confirmation Dialog
**Priority**: P2-NEEDED | **Estimate**: 1 hour | **User Story**: US-A02

**Subtasks**:
- [ ] Create sync confirmation dialog component
- [ ] Show clear messaging about what will happen
- [ ] Handle loading state during sync
- [ ] Display success/error toast after sync

**Files**:
```
NEW: components/features/training/dialogs/SyncConfirmDialog.tsx
MOD: components/features/training/views/WorkoutView.tsx
```

---

### Task 5.4: "Updates Available" Badge
**Priority**: P3-GOOD | **Estimate**: 2 hours | **User Story**: US-A03

**Subtasks**:
- [ ] Compare `session_plans.updated_at` with `workout_logs.synced_at`
- [ ] Show subtle badge in WorkoutView header when updates exist
- [ ] Clear badge after successful sync
- [ ] Test: Coach updates plan, athlete sees badge, badge disappears after sync

**Files**:
```
MOD: components/features/training/views/WorkoutView.tsx
NEW: components/ui/sync-badge.tsx (or inline)
```

---

## Verification Checklists

### Phase 1 Complete (Individual Functionality)
- [ ] Individual can edit block name
- [ ] Individual can edit block dates
- [ ] Individual can edit block focus
- [ ] Individual can add workout to week
- [ ] Changes persist to database
- [ ] Toast notifications on success/error

### Phase 2 Complete (Friction Reduction)
- [ ] Coach dropdown has no disabled items
- [ ] Quick CTA appears for today's workout
- [ ] Clicking CTA navigates to session
- [ ] Week days are clickable
- [ ] Clicking day navigates to session

### Phase 3 Complete (Sync MVP)
- [ ] synced_at column exists in database
- [ ] Coach saves session plan
- [ ] Assigned workouts automatically update
- [ ] Ongoing workouts NOT affected
- [ ] Completed workouts NOT affected
- [ ] No data loss possible

### Phase 4 Complete (Polish)
- [ ] Assignment uses router.refresh()
- [ ] Tooltips explain periodization terms
- [ ] "View all completed" works
- [ ] Mobile swipe indicator visible

### Phase 5 Complete (Advanced Sync)
- [ ] Three-dot menu shows for ongoing workouts
- [ ] "Sync from Coach Plan" option visible
- [ ] Confirmation dialog shows
- [ ] Sync preserves completed data
- [ ] New exercises appear
- [ ] Sync badge shows when updates available
- [ ] Badge disappears after sync

---

## Risk Mitigation Checklist

- [ ] Transaction wrapping for atomic sync operations
- [ ] Error handling if individual workout sync fails
- [ ] Rate limiting if coach has many athletes
- [ ] Edit date validation (warn about workout conflicts)
- [ ] Microcycle ID correctly passed for add workout
- [ ] Never delete completed sets/exercises during sync

---

## Dependencies

| Phase | Depends On |
|-------|------------|
| Phase 1 | None - can start immediately |
| Phase 2 | None - can start immediately |
| Phase 3 | Task 3.1 (database) before 3.2/3.3 |
| Phase 4 | Task 2.2 for consolidation (optional) |
| Phase 5 | Phase 3 complete (synced_at column) |

---

## Out of Scope (Future Consideration)

- Real-time sync via WebSocket/Supabase Realtime
- Granular change acceptance (accept some, reject others)
- Conflict resolution UI for complex scenarios
- Sync history/timeline view
- Notification to athletes when plan updated
- Implement Duplicate/Export/Delete for coach
- Calendar view paradigm
- Drag-and-drop reordering
- Template library
