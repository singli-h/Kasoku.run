# Implementation Tasks: Plan-Workout Sync

**Feature**: 008-plan-workout-sync
**Created**: 2026-01-04
**Status**: Not Started

---

## Phase 1: Auto-Push for Assigned Workouts (MVP)

### Task 1.1: Database Migration
- [ ] Add `synced_at` column to `workout_logs` table
- [ ] Add `last_plan_update_at` column to `workout_logs` (tracks when plan was last synced from)

```sql
ALTER TABLE workout_logs
ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_plan_update_at TIMESTAMPTZ;
```

**Estimated**: 1 hour
**Dependencies**: None

---

### Task 1.2: Create Sync Server Action
- [ ] Create `actions/workout/workout-sync-actions.ts`
- [ ] Implement `syncPlanToAssignedWorkoutsAction(sessionPlanId: string)`

**Logic**:
1. Fetch all `workout_logs` where `session_plan_id = planId` AND `session_status = 'assigned'`
2. For each workout:
   - Delete existing `workout_log_exercises` and `workout_log_sets`
   - Copy current `session_plan_exercises` → `workout_log_exercises`
   - Copy current `session_plan_sets` → `workout_log_sets`
   - Update `synced_at` and `last_plan_update_at`

**Estimated**: 4 hours
**Dependencies**: Task 1.1

---

### Task 1.3: Integrate Sync into Save Action
- [ ] Modify `saveSessionWithExercisesAction()` in `session-planner-actions.ts`
- [ ] Call `syncPlanToAssignedWorkoutsAction()` after successful save
- [ ] Handle errors gracefully (save succeeds even if sync fails)

**Estimated**: 2 hours
**Dependencies**: Task 1.2

---

### Task 1.4: Update TypeScript Types
- [ ] Update `types/database.ts` with new columns
- [ ] Regenerate types: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae`

**Estimated**: 30 minutes
**Dependencies**: Task 1.1

---

### Task 1.5: Unit Tests for Sync Logic
- [ ] Test: Sync updates all 'assigned' workouts
- [ ] Test: Sync skips 'ongoing' and 'completed' workouts
- [ ] Test: Sync creates correct exercises and sets
- [ ] Test: Sync handles no linked workouts gracefully

**Estimated**: 3 hours
**Dependencies**: Task 1.2

---

## Phase 2: Manual Re-Sync for Athletes (Optional)

### Task 2.1: Add Three-Dot Menu to WorkoutView
- [ ] Import `DropdownMenu` components from shadcn/ui
- [ ] Add three-dot button between Save and Finish buttons
- [ ] Show "Sync from Coach Plan" option when applicable

**Conditions to show**:
- `session_status === 'ongoing'`
- `session_plan_id IS NOT NULL`
- Plan has been updated since last sync (`session_plans.updated_at > workout_logs.synced_at`)

**Estimated**: 2 hours
**Dependencies**: Phase 1 complete

---

### Task 2.2: Implement Athlete Pull Sync Action
- [ ] Create `athletePullSyncAction(workoutLogId: string)`

**Merge Logic**:
1. Fetch current workout state (exercises + sets)
2. Fetch current session plan state
3. For each plan exercise:
   - If exists in workout: Update non-completed sets only
   - If missing: Add exercise at end
4. For each workout exercise:
   - If not in plan AND has logged data: Keep (preserve)
   - If not in plan AND no logged data: Remove
5. Update `synced_at`

**Estimated**: 6 hours
**Dependencies**: Task 2.1

---

### Task 2.3: Confirmation Dialog
- [ ] Create sync confirmation dialog component
- [ ] Show clear messaging about what will happen
- [ ] Handle loading state during sync

**Estimated**: 1 hour
**Dependencies**: Task 2.1

---

### Task 2.4: "Updates Available" Badge (Optional)
- [ ] Compare `session_plans.updated_at` with `workout_logs.synced_at`
- [ ] Show subtle badge in WorkoutView header when updates exist
- [ ] Clear badge after successful sync

**Estimated**: 2 hours
**Dependencies**: Phase 2 complete

---

### Task 2.5: Integration Tests for Merge Logic
- [ ] Test: Completed sets are never modified
- [ ] Test: Logged exercises are preserved even if coach removed
- [ ] Test: New exercises from coach appear at end
- [ ] Test: Uncompleted sets update correctly

**Estimated**: 4 hours
**Dependencies**: Task 2.2

---

## Definition of Done

### Phase 1 (MVP)
- [ ] Coach saves session plan → All 'assigned' workouts updated automatically
- [ ] Athletes who haven't started see updated workout
- [ ] No data loss possible (no athlete data exists yet)
- [ ] Unit tests passing

### Phase 2 (Full Feature)
- [ ] Athletes can manually sync ongoing workouts
- [ ] Athlete-logged data always preserved
- [ ] Clear UX with confirmation dialog
- [ ] Integration tests passing

---

## Risk Mitigation Checklist

- [ ] Transaction wrapping for atomic sync operations
- [ ] Error handling if individual workout sync fails
- [ ] Rate limiting if coach has many athletes
- [ ] Audit logging for sync events (optional)
- [ ] Rollback strategy documented

---

## Out of Scope (Future Consideration)

- Real-time sync via WebSocket/Supabase Realtime
- Granular change acceptance (accept some, reject others)
- Conflict resolution UI for complex scenarios
- Sync history/timeline view
- Notification to athletes when plan updated
