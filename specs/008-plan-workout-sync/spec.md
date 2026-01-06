# Feature Specification: Plan-Workout Sync

**Feature Branch**: `008-plan-workout-sync`
**Created**: 2026-01-04
**Status**: Draft
**Priority**: Medium
**Estimated Complexity**: High

---

## Overview

Enable **automatic synchronization** of coach session plan changes to athlete workouts, plus a **manual re-sync** option for athletes. Currently, when a coach modifies a session plan after athletes are assigned, the changes do NOT propagate - athletes see the original plan.

### Current Architecture

```
Coach creates session_plan
        ↓
Coach assigns to athletes → Creates workout_logs (linked via session_plan_id)
        ↓
Coach modifies session_plan → ❌ workout_logs NOT updated
        ↓
Athlete sees ORIGINAL plan
```

### Proposed Architecture

```
Coach modifies session_plan
        ↓
Auto-sync to workout_logs WHERE session_status = 'assigned'
        ↓
Athletes in 'ongoing' sessions can manually re-sync (opt-in)
```

---

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Auto-push coach changes on save | Real-time live sync (WebSocket) |
| Manual re-sync button for athletes | Conflict resolution UI for complex merges |
| Sync to 'assigned' workouts | Sync to 'completed' workouts |
| Opt-in sync for 'ongoing' workouts | Automatic sync for 'ongoing' (too risky) |
| Exercise add/remove/reorder sync | Historical version tracking |
| Set parameter sync | Undo sync operation |

---

## Database Relationship Reference

```sql
-- Current FK relationship
workout_logs.session_plan_id → session_plans.id (nullable)

-- Session status enum
session_status: 'assigned' | 'ongoing' | 'completed' | 'cancelled'

-- Relevant tables for sync
session_plans → session_plan_exercises → session_plan_sets
workout_logs → workout_log_exercises → workout_log_sets
```

---

## User Scenarios

### US-001: Coach Auto-Push Changes (Priority: P1)

When a coach saves changes to a session plan, automatically update all linked workouts that athletes haven't started yet.

**Target Audience**: Coach (trigger), Athletes (recipients)

**Trigger**: `saveSessionWithExercisesAction()` in session-planner-actions.ts

**Target Workouts**:
- `workout_logs` WHERE `session_plan_id = {plan_id}` AND `session_status = 'assigned'`

**Sync Operations**:
| Plan Change | Sync Action |
|-------------|-------------|
| Exercise added | Create new `workout_log_exercise` + sets |
| Exercise removed | Delete `workout_log_exercise` + sets |
| Exercise reordered | Update `exercise_order` |
| Set added | Create new `workout_log_set` |
| Set removed | Delete `workout_log_set` |
| Set parameters changed | Update `workout_log_set` values |
| Session name/description | Update `workout_logs` metadata |

**Acceptance Criteria**:

1. **Given** 5 athletes have workout_logs linked to session plan X with status='assigned', **When** coach saves changes to session plan X, **Then** all 5 workout_logs are updated with new exercises/sets.

2. **Given** 1 athlete has started (status='ongoing') and 4 have not, **When** coach saves changes, **Then** only the 4 'assigned' workouts are updated; the 'ongoing' workout is unchanged.

3. **Given** coach adds a new exercise to session plan, **When** sync runs, **Then** new `workout_log_exercise` is created for each 'assigned' workout with corresponding sets.

4. **Given** coach removes an exercise, **When** sync runs, **Then** corresponding `workout_log_exercise` is deleted (only if no actual data logged).

---

### US-002: Athlete Manual Re-Sync (Priority: P2)

Athletes with 'ongoing' sessions can optionally pull coach updates via a manual sync button.

**Target Audience**: Athlete

**UI Location**:
- Hidden in overflow menu (three-dot menu) next to Save button in WorkoutView header
- Shows only when: `session_status = 'ongoing'` AND `session_plan_id IS NOT NULL`

**User Flow**:
```
Athlete opens ongoing workout
        ↓
Clicks three-dot menu (⋮)
        ↓
Sees "Sync from Coach Plan" option
        ↓
Confirmation dialog: "Pull latest changes from coach? Your logged performance data will be preserved."
        ↓
Click "Sync" → Merges changes
```

**Merge Strategy** (for ongoing sessions):
| Scenario | Behavior |
|----------|----------|
| Coach added new exercise | Add to athlete's workout (at end) |
| Coach removed exercise (athlete hasn't logged) | Remove from workout |
| Coach removed exercise (athlete HAS logged) | **Keep** - preserve athlete data |
| Coach changed set parameters | Update only sets athlete hasn't completed |
| Coach added sets | Add new sets |
| Coach removed sets (not completed) | Remove sets |
| Coach removed sets (completed) | **Keep** - preserve athlete data |

**Acceptance Criteria**:

1. **Given** athlete is mid-workout (status='ongoing'), **When** they click "Sync from Coach Plan", **Then** new exercises from coach appear in their workout.

2. **Given** athlete has completed 3 of 5 sets, **When** coach changes set 4 parameters and athlete syncs, **Then** sets 1-3 unchanged, set 4 updated, set 5 updated.

3. **Given** athlete has logged performance on an exercise, **When** coach deletes that exercise and athlete syncs, **Then** exercise is preserved (athlete data protected).

4. **Given** coach hasn't made any changes since assignment, **When** athlete clicks sync, **Then** toast: "Already up to date with coach plan."

---

### US-003: Sync Indicator (Priority: P3)

Show athletes when their workout differs from the current coach plan.

**UI**: Small badge/indicator near session title showing "Updates available" if plan has changed.

**Check Logic**:
- Compare `session_plans.updated_at` with `workout_logs.synced_at` (new column)
- If plan updated after last sync → show indicator

**Acceptance Criteria**:

1. **Given** coach updates session plan after athlete started, **When** athlete views ongoing workout, **Then** "Updates available" badge appears.

2. **Given** athlete syncs successfully, **When** they view workout, **Then** badge disappears.

---

## Technical Analysis

### Complexity Assessment: **HIGH**

| Factor | Complexity | Reason |
|--------|------------|--------|
| Auto-push logic | Medium | Straightforward for 'assigned' status |
| Merge for 'ongoing' | **High** | Must preserve athlete-logged data |
| Performance | Medium | May need to update many rows |
| Race conditions | **High** | Athlete saving while coach pushes |
| Edge cases | **High** | Partial completion, supersets, etc. |

### Implementation Estimate

| Component | Effort |
|-----------|--------|
| Database: Add `synced_at` column | 1 hour |
| Server: `syncPlanToWorkoutsAction()` | 4-6 hours |
| Server: `athletePullSyncAction()` | 6-8 hours |
| UI: Three-dot menu + sync option | 2-3 hours |
| UI: "Updates available" indicator | 2 hours |
| Testing: Unit + integration | 4-6 hours |
| **Total** | **19-26 hours** |

### Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss (athlete work) | **Critical** | Never delete completed sets/exercises |
| Race condition on save | High | Use optimistic locking or queue |
| Performance (many athletes) | Medium | Batch operations, background job |
| Confusing UX | Medium | Clear messaging, confirmation dialogs |

---

## Recommended Approach

### Phase 1: Auto-Push (MVP)
- Implement auto-sync ONLY for `session_status = 'assigned'` workouts
- Safe: Athletes haven't started, no data to preserve
- Trigger: On `saveSessionWithExercisesAction()` completion

### Phase 2: Manual Re-Sync
- Add three-dot menu with "Sync from Coach Plan" option
- Implement conservative merge (preserve all athlete data)
- Show confirmation dialog with clear messaging

### Phase 3: Indicators (Optional)
- Add `synced_at` column to `workout_logs`
- Show "Updates available" badge when plan is newer

---

## UI Design

### Three-Dot Menu Location (WorkoutView.tsx)

```
Current:  [Save] [Finish]

Proposed: [Save] [⋮] [Finish]
                  └─> "Sync from Coach Plan" (if ongoing + has plan)
                      "View Original Plan" (future)
```

### Confirmation Dialog

```
┌─────────────────────────────────────┐
│  Sync from Coach Plan?              │
│                                     │
│  Your coach has updated the session │
│  plan. Pull the latest changes?     │
│                                     │
│  • Your logged performance will be  │
│    preserved                        │
│  • New exercises may be added       │
│  • Uncompleted sets may change      │
│                                     │
│        [Cancel]    [Sync Now]       │
└─────────────────────────────────────┘
```

### "Updates Available" Badge

```
┌─────────────────────────────────────┐
│ Upper Body Strength     🔵 Updates  │
│ Session 3 of Week 2        available│
└─────────────────────────────────────┘
```

---

## Decision Points for Product Owner

1. **Auto-push behavior**: Should coach get notification/confirmation when changes will push to N athletes?

2. **Athlete notification**: Should athletes get notified when coach updates their assigned (not started) workout?

3. **Completed workout sync**: Should we allow re-sync for completed workouts? (Currently: No)

4. **Granular sync**: Should athletes be able to choose which changes to accept? (Currently: All or nothing)

5. **Sync history**: Should we track sync events for audit? (Adds complexity)

---

## Files to Modify

| File | Changes |
|------|---------|
| `actions/plans/session-planner-actions.ts` | Add sync trigger after save |
| `actions/workout/workout-sync-actions.ts` | **NEW** - Sync server actions |
| `components/features/training/views/WorkoutView.tsx` | Add three-dot menu |
| `types/database.ts` | Add `synced_at` column type |
| Supabase migration | Add `synced_at` to `workout_logs` |

---

## Conclusion

This feature addresses a real gap in the coach-athlete workflow. The recommended phased approach starts with the safe auto-push for unstarted workouts (Phase 1), then adds manual sync for advanced users (Phase 2).

**Recommendation**: Implement Phase 1 first (auto-push for 'assigned' workouts) as it's lower complexity and addresses the most common use case. Phase 2 (manual sync for ongoing) can be deferred if the edge cases prove too complex for the ROI.

**Worth doing?** Yes, Phase 1 is definitely worth it. Phase 2 depends on how often athletes actually need to sync mid-workout - recommend gathering usage data first.
