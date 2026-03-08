# Research: Plan Page Improvements

**Feature**: 008-plan-workout-sync
**Date**: 2026-01-08
**Status**: Complete

---

## Research Summary

This document consolidates research findings for the Plan Page Improvements feature, covering terminology standards, industry patterns, current architecture analysis, and technical decisions.

---

## 1. Periodization Terminology Standards

### Research Question
How should we present periodization terminology to different user roles (Coach, Athlete, Individual)?

### Findings

**Industry Standard (Sports Science)**

Based on research from [TrainingPeaks](https://www.trainingpeaks.com/blog/macrocycles-mesocycles-and-microcycles-understanding-the-3-cycles-of-periodization/), [TrainerRoad](https://www.trainerroad.com/blog/training-periodization-macro-meso-microcycles-of-training/), and [CoachRx](https://www.coachrx.app/articles/planning-amp-periodization-tools-to-design-better-programs):

| Cycle | Duration | Purpose |
|-------|----------|---------|
| **Macrocycle** | 6-12 months | Season/year overview, all training phases |
| **Mesocycle** | 3-12 weeks (typically 4-6) | Training block with specific goal (Base, Build, Peak) |
| **Microcycle** | 1 week | Weekly training structure |

**Industry App Approaches**

| App | Coach View | Athlete View | Approach |
|-----|-----------|--------------|----------|
| TrainingPeaks | Full macro/meso/micro | Calendar + today | Technical for coaches, simple for athletes |
| CoachRx | Phases (Accumulation, Build, Peak) | Daily plan | Goal-based naming |
| COROS | "Phases" not cycles | Phase progress | Avoids jargon entirely |
| BridgeAthletic | Programs → Weeks | Weekly view | Spreadsheet-like, familiar |
| TrainHeroic | Blocks → Weeks → Days | "Today's Training" | Progressive disclosure |

### Decision
**Role-based terminology mapping**:

| Database Term | Coach UI | Athlete UI | Individual UI |
|---------------|----------|------------|---------------|
| `macrocycles` | "Season" or "Annual Plan" | *(hidden)* | "My Plan" |
| `mesocycles` | "Phase" or "Block" | "Current Phase" | "Training Block" |
| `microcycles` | "Week" | "This Week" | "Week" |
| `session_plans` | "Session" | "Workout" | "Workout" |

### Rationale
- Coaches understand periodization terminology - keep technical terms
- Athletes just need to know what to do today - hide hierarchy
- Individual users are self-coached - simplified but functional

### Alternatives Considered
1. **Use technical terms for everyone**: Rejected - confusing for athletes
2. **Use simplified terms for everyone**: Rejected - loses precision for coaches
3. **Create entirely new terminology**: Rejected - unnecessary complexity

---

## 2. Current Architecture Analysis

### Research Question
What is the current state of the Plan page implementation and what specifically needs to change?

### Findings

**Ground Truth Code Audit** (from `ground-truth-audit.md`)

| Component | Lines | Status |
|-----------|-------|--------|
| `PlansHome.tsx` | 142 | Server component, working |
| `PlansHomeClient.tsx` | 270 | 3 disabled menu items (lines 121-133) |
| `IndividualPlansHome.tsx` | 92 | Server component, working |
| `IndividualPlansHomeClient.tsx` | 191 | Week not clickable |
| `TrainingPlanWorkspace.tsx` | 1185 | 3-panel layout, well-architected |
| `IndividualWorkspace.tsx` | 283 | 3 disabled buttons (lines 72-75, 110-114, 239-242) |

**Key Finding**: The Plan Detail Page (workspace) is **well-architected** and doesn't need structural changes. Only minor additions needed:
- Coach: Add "Assigned To" section
- Individual: Enable disabled buttons

**Disabled Features Identified**

```typescript
// IndividualWorkspace.tsx:72-75
<Button disabled title="Coming soon">Edit Block</Button>

// IndividualWorkspace.tsx:110-114, 239-242
<Button disabled title="Coming soon">Add Workout</Button>

// PlansHomeClient.tsx:121-133
<DropdownMenuItem disabled>Duplicate Plan</DropdownMenuItem>
<DropdownMenuItem disabled>Export</DropdownMenuItem>
<DropdownMenuItem disabled>Delete</DropdownMenuItem>

// PlansHomeClient.tsx:261
window.location.reload() // Should be router.refresh()
```

### Decision
- **Keep existing workspace structure** - it's well-designed
- **Enable disabled buttons** rather than redesign
- **Add new components** only where functionality is missing

### Rationale
- Minimizes risk and development time
- Builds on proven architecture
- Users already familiar with existing layout

---

## 3. Assignment System Analysis

### Research Question
How does the current coach-to-athlete assignment system work? What's the sync gap?

### Findings

**Current Assignment Flow**

```
Coach creates session_plan
        ↓
Coach assigns to athletes via assignPlanToAthletesAction()
        ↓
Creates workout_logs (linked via session_plan_id)
        ↓
Coach modifies session_plan → ❌ workout_logs NOT updated
        ↓
Athlete sees ORIGINAL plan
```

**Assignment is at Macrocycle Level Only**
- Current implementation assigns entire macrocycle (all sessions)
- No granular assignment (single phase, week, or session)
- `assignPlanToAthletesAction()` in `plan-assignment-actions.ts:32-239`

**Session Status States**

| Status | Description | Sync Behavior |
|--------|-------------|---------------|
| `assigned` | Athlete hasn't started | Safe to auto-sync |
| `ongoing` | Athlete in progress | Manual sync only (preserve logged data) |
| `completed` | Athlete finished | Never sync (historical data) |
| `cancelled` | Skipped | No sync needed |

### Decision
**Sync Strategy**:
1. **Auto-sync for `assigned`**: Safe - no athlete data to lose
2. **Manual sync for `ongoing`**: Athlete opts in, preserve logged data
3. **Never sync `completed`**: Historical integrity

### Rationale
- Protects athlete-logged data (critical requirement)
- Reduces coach friction (auto-push for unstarted)
- Gives athletes control when mid-workout

### Alternatives Considered
1. **Always auto-sync everything**: Rejected - would overwrite athlete data
2. **Never auto-sync**: Rejected - coach updates never propagate
3. **Granular field-level sync**: Rejected - too complex for MVP

---

## 4. Sync Implementation Pattern

### Research Question
What's the best pattern for implementing sync between session_plans and workout_logs?

### Findings

**Database Relationship**

```sql
-- Current FK relationship
workout_logs.session_plan_id → session_plans.id (nullable)

-- Relevant tables
session_plans → session_plan_exercises → session_plan_sets
workout_logs → workout_log_exercises → workout_log_sets
```

**Proposed Schema Addition**

```sql
ALTER TABLE workout_logs
ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_plan_update_at TIMESTAMPTZ;
```

**Sync Detection**
- Compare `session_plans.updated_at` with `workout_logs.synced_at`
- If plan updated after sync → show "Updates available" indicator

### Decision
**Implementation Pattern**:

1. **Sync trigger**: After `saveSessionWithExercisesAction()` succeeds
2. **Sync action**: New `syncPlanToAssignedWorkoutsAction(sessionPlanId)`
3. **Transaction wrapping**: Atomic operations to prevent partial sync
4. **Error handling**: Save succeeds even if sync fails (graceful degradation)

### Rationale
- Decouples sync from save (can retry sync independently)
- Transaction ensures data consistency
- Graceful degradation prevents save failures

---

## 5. UI Component Patterns

### Research Question
What new UI components are needed and how should they be structured?

### Findings

**New Components Needed**

| Component | Purpose | Pattern |
|-----------|---------|---------|
| `EditBlockDialog.tsx` | Edit mesocycle name/dates/focus | Dialog + Form (shadcn) |
| `AddWorkoutDialog.tsx` | Add session to microcycle | Dialog + Form (shadcn) |
| `TodayWorkoutCTA.tsx` | Quick action for today's workout | Card component |
| `AssignedToSection.tsx` | Show assignment status for coach | Card component |

**Existing Patterns to Follow**

```typescript
// Dialog pattern from EditMesocycleDialog.tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Block</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      {/* Form fields with shadcn FormField */}
    </Form>
    <DialogFooter>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Server action pattern from plan-actions.ts
export async function updateMesocycleAction(
  id: number,
  data: UpdateMesocycleInput
): Promise<ActionState<Mesocycle>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: 'Not authenticated' }
  // ... implementation
}
```

### Decision
- Reuse existing dialog patterns
- Follow ActionState return type
- Use Zod for form validation
- Match existing component structure in `components/features/plans/`

### Rationale
- Consistency with existing codebase
- Faster development (proven patterns)
- Easier code review

---

## 6. Performance Considerations

### Research Question
What performance concerns exist for sync operations with many athletes?

### Findings

**Potential Scale**
- Coach with 50 athletes
- Session plan with 10 exercises, 40 sets each
- Worst case: 50 × 10 × 40 = 20,000 set records to update

**Mitigation Strategies**

1. **Batch operations**: Insert/update in batches (100 records/batch)
2. **Parallel processing**: Use Promise.all for independent operations
3. **Queue for large syncs**: Consider background job for >100 workouts
4. **Rate limiting**: Prevent rapid re-saves from triggering multiple syncs

### Decision
**MVP Approach**:
- Batch operations (handled by Supabase's bulk insert)
- Limit to 100 concurrent workout syncs
- Log warning if sync takes >5 seconds
- No queue for MVP (add if needed based on real usage)

### Rationale
- Most coaches have <20 athletes
- Supabase handles bulk operations efficiently
- Can optimize later based on actual performance data

---

## Summary of Decisions

| Area | Decision | Confidence |
|------|----------|------------|
| Terminology | Role-based mapping | High |
| Workspace structure | Keep existing, enable buttons | High |
| Sync strategy | Auto for assigned, manual for ongoing | High |
| Database changes | Add synced_at column | High |
| New components | 4 new components following existing patterns | High |
| Performance | Batch operations, MVP without queue | Medium |

---

## Open Items for Implementation

1. **Granular assignment**: Phase/Week/Session assignment deferred to future iteration
2. **Public sessions**: Not in scope for this feature
3. **Real-time sync**: WebSocket/Supabase Realtime deferred
4. **Notification to athletes**: Consider for future (when coach updates plan)

---

## References

- [TrainingPeaks - Periodization](https://www.trainingpeaks.com/blog/macrocycles-mesocycles-and-microcycles-understanding-the-3-cycles-of-periodization/)
- [TrainerRoad - Training Periodization](https://www.trainerroad.com/blog/training-periodization-macro-meso-microcycles-of-training/)
- [CoachRx - Planning & Periodization Tools](https://www.coachrx.app/articles/planning-amp-periodization-tools-to-design-better-programs)
- [CoachMePlus - Software Guide](https://coachmeplus.com/strength-conditioning-software-guide/)
- Ground Truth Audit: `specs/008-plan-workout-sync/ground-truth-audit.md`
