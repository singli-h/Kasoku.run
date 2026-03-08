# Quick Start: Plan Page Improvements

## TL;DR

**Three Problem Areas**:
1. **Sync Gap**: Coach modifies session plan → Athletes don't see changes
2. **UX Gap**: Individual users can't edit blocks, disabled features visible, missing CTAs
3. **Terminology Gap**: Technical jargon confuses athletes and individual users

**Solution**: 5-phase implementation covering sync + UX + role-based experience

---

## Role-Based Terminology

| Database | Coach UI | Athlete UI | Individual UI |
|----------|----------|------------|---------------|
| macrocycles | "Season" | *(hidden)* | "My Plan" |
| mesocycles | "Phase" | "Current Phase" | "Training Block" |
| microcycles | "Week" | "This Week" | "Week" |
| session_plans | "Session" | "Workout" | "Workout" |

---

## Priority Summary

| Priority | Items | Status |
|----------|-------|--------|
| **P0-NEEDED** | Edit Block, Add Workout (Individual) | Blocks workflow |
| **P1-NEEDED** | Remove disabled items, Quick CTA, Clickable days, Auto-sync | High friction |
| **P2-GOOD** | Router refresh, Tooltips, Completed filter, Assigned-to section | Polish |
| **P3-GOOD** | Consolidate sections, Swipe indicator, Sync badge | Nice-to-have |

---

## Phase Overview

| Phase | Focus | Effort | Start |
|-------|-------|--------|-------|
| Phase 1 | Individual Edit/Add | 6-8h | Immediately |
| Phase 2 | Friction Reduction | 4-6h | Immediately |
| Phase 3 | Sync MVP | 5-7h | After Phase 1-2 |
| Phase 4 | Polish | 5-8h | As time permits |
| Phase 5 | Advanced Sync | 8-10h | After Phase 3 |

---

## Phase 1: Individual Functionality (P0)

### Enable Edit Block
**Problem**: `IndividualWorkspace.tsx:72-75` has disabled "Edit Block" button

**Solution**:
1. Create `EditBlockDialog.tsx` with name/dates/focus form
2. Remove `disabled` prop from button
3. Connect to existing `updateMesocycleAction()`

### Enable Add Workout
**Problem**: `IndividualWorkspace.tsx:110-114` has disabled "Add Workout" button

**Solution**:
1. Create `AddWorkoutDialog.tsx` with day/name/type form
2. Remove `disabled` prop from buttons
3. Connect to `createSessionPlanAction()`

---

## Phase 2: Friction Reduction (P1)

### Remove Disabled Menu Items
**Problem**: Coach sees Duplicate/Export/Delete as disabled (frustrating)

**Solution**: Delete lines 121-133 in `PlansHomeClient.tsx`

### Add Quick Start CTA
**Problem**: No prominent "Start Today's Workout" button

**Solution**: Create `TodayWorkoutCTA.tsx` component, add to home page

### Make Week Days Clickable
**Problem**: Week overview days show workouts but aren't interactive

**Solution**: Add onClick handlers to navigate to session

---

## Phase 3: Sync MVP (P1)

### Auto-Push to Assigned Workouts
When coach saves session plan, automatically update athlete workouts that haven't started.

**Database Change**:
```sql
ALTER TABLE workout_logs
ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_plan_update_at TIMESTAMPTZ;
```

**Steps**:
1. Apply migration (adds `synced_at` column)
2. Create `syncPlanToAssignedWorkoutsAction()`
3. Call after `saveSessionWithExercisesAction()`

**Safe because**: Athletes haven't logged any data yet (status = 'assigned')

---

## Key Files Quick Reference

### Part A - Sync
| File | Purpose |
|------|---------|
| `actions/workout/workout-sync-actions.ts` | NEW - Sync logic |
| `actions/plans/session-planner-actions.ts` | Add sync trigger |
| `components/features/training/views/WorkoutView.tsx` | Add menu (Phase 5) |

### Part B - UX
| File | Purpose |
|------|---------|
| `IndividualWorkspace.tsx` | Enable Edit/Add buttons |
| `PlansHomeClient.tsx` | Remove disabled items, router.refresh() |
| `IndividualPlansHomeClient.tsx` | CTA, clickable days |
| `EditBlockDialog.tsx` | NEW - Edit form |
| `AddWorkoutDialog.tsx` | NEW - Add form |
| `TodayWorkoutCTA.tsx` | NEW - Quick action |

---

## Pages by Role

| Page | Coach | Athlete | Individual |
|------|-------|---------|------------|
| Plans Home | List seasons, groups | Redirect to /workout | Today CTA, active block |
| Plan Detail | 3-panel workspace | N/A | 2-panel workspace |
| Assignment | Full dialog | N/A | N/A |
| Workout | N/A | Execute | Execute |

---

## Design Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Specification | [spec.md](./spec.md) | Full feature spec |
| Implementation Plan | [plan.md](./plan.md) | Technical approach |
| Research | [research.md](./research.md) | Decisions & rationale |
| Data Model | [data-model.md](./data-model.md) | Schema changes |
| Contracts | [contracts/](./contracts/) | Server action interfaces |
| Code Audit | [ground-truth-audit.md](./ground-truth-audit.md) | Line numbers |
| Tasks | [tasks.md](./tasks.md) | Implementation tasks |

---

## Decision: Where to Start?

### Recommended Order:
1. **Phase 1 + 2 in parallel** (2-3 days)
   - Unblocks individual users
   - Quick UX wins
   - No database changes needed

2. **Phase 3** (1 day)
   - Requires database migration
   - High value for coaches

3. **Phase 4 + 5 as time permits**
   - Polish and advanced features

---

## Total Effort

**MVP (Phase 1-3)**: 15-21 hours
**Complete (All Phases)**: 28-39 hours
