# Quick Start: Plan-Workout Sync

## TL;DR

**Problem**: Coach modifies session plan → Athletes don't see changes

**Solution**:
1. **Auto-push** to 'assigned' workouts (automatic)
2. **Manual sync** for 'ongoing' workouts (opt-in via menu)

---

## Phase 1: Auto-Push (Recommended Start)

### What It Does
When coach saves session plan changes, automatically update all athlete workouts that haven't started yet.

### Safe Because
- Athletes haven't logged any data yet
- Full replace is safe (no merge needed)
- Simple logic, low risk

### Implementation Steps

1. **Add migration**:
```sql
ALTER TABLE workout_logs ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW();
```

2. **Create sync action** (`workout-sync-actions.ts`):
```typescript
export async function syncPlanToAssignedWorkoutsAction(
  sessionPlanId: string
): Promise<ActionState<{ syncedCount: number }>> {
  // 1. Get all 'assigned' workout_logs for this plan
  // 2. Delete their exercises/sets
  // 3. Copy current plan exercises/sets
  // 4. Update synced_at
}
```

3. **Hook into save** (`session-planner-actions.ts`):
```typescript
// After successful save in saveSessionWithExercisesAction:
await syncPlanToAssignedWorkoutsAction(sessionId)
```

---

## Phase 2: Manual Sync (Advanced)

### What It Does
Athletes in ongoing workouts can pull coach updates via menu button.

### Complex Because
- Must preserve athlete-logged data
- Merge logic has many edge cases
- Need careful UX

### UI Location
```
WorkoutView header: [Save] [⋮] [Finish]
                           └─> "Sync from Coach Plan"
```

### Merge Rules
| Scenario | Action |
|----------|--------|
| Coach added exercise | Add at end |
| Coach removed (athlete logged) | **Keep** |
| Coach removed (no logs) | Remove |
| Coach changed uncompleted set | Update |
| Coach changed completed set | **Keep** |

---

## Decision: Is It Worth It?

### Phase 1: **YES**
- Low complexity
- High value (common use case)
- No risk of data loss
- ~8 hours implementation

### Phase 2: **MAYBE**
- High complexity
- Edge cases are tricky
- ROI depends on actual usage
- ~15 hours implementation

**Recommendation**: Ship Phase 1, gather data, then decide on Phase 2.

---

## Key Files

| File | Purpose |
|------|---------|
| `actions/workout/workout-sync-actions.ts` | NEW - Sync logic |
| `actions/plans/session-planner-actions.ts` | Add sync trigger |
| `components/features/training/views/WorkoutView.tsx` | Add menu (Phase 2) |
| `types/database.ts` | Add synced_at type |
