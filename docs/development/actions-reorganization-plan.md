# Actions Folder Reorganization Plan

**Date:** October 19, 2025
**Status:** Proposed

## Current State Analysis

### Current Structure
```
actions/
├── auth/                    ✅ Good - properly organized
│   ├── auth-helpers.ts
│   ├── user-actions.ts
│   └── index.ts
├── training/                ❌ Problem - everything cramped here
│   ├── athlete-actions.ts        (1,934 lines)
│   ├── coach-actions.ts          (350 lines)
│   ├── exercise-actions.ts       (1,646 lines)
│   ├── group-session-actions.ts  (576 lines)
│   ├── race-actions.ts           (480 lines)
│   ├── session-plan-actions.ts   (1,092 lines)
│   ├── session-planner-actions.ts (321 lines)
│   ├── sprint-session-actions.ts  (855 lines)
│   ├── training-plan-actions.ts   (1,209 lines)
│   ├── training-session-actions.ts (780 lines)
│   ├── workout-session-actions.ts  (359 lines)
│   └── index.ts                   (245 lines)
├── dashboard/               ✅ Good - single file for single feature
│   └── dashboard-actions.ts
├── knowledge-base/          ✅ Good - organized by feature
│   ├── knowledge-base-actions.ts
│   └── index.ts
└── users/                   ⚠️  Confusing - overlaps with auth
    ├── onboarding-actions.ts
    └── user-actions.ts
```

### Problems Identified

1. **Everything in training/**: 12 files, 9,847 lines of code all in one folder
2. **Poor discoverability**: Hard to find specific actions
3. **Naming inconsistency**: Multiple "session" files with unclear differences
4. **Not aligned with features**: Doesn't match component structure
5. **Duplicate user actions**: `actions/users/user-actions.ts` + `actions/auth/user-actions.ts`

### Feature-to-Actions Mapping

Based on codebase analysis:

| Feature | Current Location | Should Be | Used By |
|---------|------------------|-----------|---------|
| **Athletes** | `training/athlete-actions.ts` | `athletes/` | Athletes page, athlete components |
| **Coaches** | `training/coach-actions.ts` | `coaches/` or combine with athletes | Coach management |
| **Plans** | `training/training-plan-actions.ts` | `plans/` | Plans page, plan workspace |
| **Plans** | `training/race-actions.ts` | `plans/` | Plans page (races are part of plans) |
| **Sessions** | `training/sprint-session-actions.ts` | `sessions/` | Sessions dashboard |
| **Sessions** | `training/group-session-actions.ts` | `sessions/` | Group session components |
| **Sessions** | `training/training-session-actions.ts` | `sessions/` | Session management |
| **Sessions** | `training/session-plan-actions.ts` | `sessions/` or `plans/` | Session planning |
| **Sessions** | `training/session-planner-actions.ts` | `sessions/` or `plans/` | Session planner |
| **Workout** | `training/workout-session-actions.ts` | `workout/` | Workout execution |
| **Exercise** | `training/exercise-actions.ts` | `exercises/` or `library/` | Exercise library, forms |
| **Onboarding** | `users/onboarding-actions.ts` | `onboarding/` | Onboarding flow |
| **Users** | `users/user-actions.ts` | Merge with `auth/` | User management |

## Proposed New Structure

```
actions/
├── auth/                        # Authentication & user management
│   ├── auth-helpers.ts          (existing)
│   ├── user-actions.ts          (existing - merge users/user-actions.ts here)
│   └── index.ts
│
├── athletes/                    # Athlete management
│   ├── athlete-actions.ts       (from training/)
│   ├── coach-actions.ts         (from training/ - rename to athlete-coach-actions.ts)
│   └── index.ts
│
├── plans/                       # Training plan management
│   ├── plan-actions.ts          (from training/training-plan-actions.ts)
│   ├── race-actions.ts          (from training/)
│   ├── session-plan-actions.ts  (from training/ - or move to sessions/)
│   └── index.ts
│
├── sessions/                    # Training session management
│   ├── group-session-actions.ts     (from training/)
│   ├── sprint-session-actions.ts    (from training/)
│   ├── training-session-actions.ts  (from training/)
│   ├── session-planner-actions.ts   (from training/)
│   └── index.ts
│
├── workout/                     # Workout execution
│   ├── workout-session-actions.ts   (from training/)
│   └── index.ts
│
├── exercises/                   # Exercise library (or "library/")
│   ├── exercise-actions.ts      (from training/)
│   └── index.ts
│
├── onboarding/                  # User onboarding
│   ├── onboarding-actions.ts    (from users/)
│   └── index.ts
│
├── dashboard/                   # Dashboard (existing - good)
│   └── dashboard-actions.ts
│
└── knowledge-base/              # Knowledge base (existing - good)
    ├── knowledge-base-actions.ts
    └── index.ts
```

## Decision Points

### 1. Session Actions Organization

**Question:** How to organize the 4 different session-related files?

**Options:**
- **A. Keep all in `sessions/`** - Simpler, everything session-related together
- **B. Split by context:**
  - `sessions/` for execution (sprint, group, training sessions)
  - `plans/` for planning (session-plan, session-planner)

**Recommendation:** **Option B** - More semantic alignment
- Session planning is part of the plan creation workflow
- Session execution is separate runtime functionality

### 2. Exercise Actions Location

**Question:** Should it be `exercises/` or `library/`?

**Options:**
- **A. `exercises/`** - Matches database table name
- **B. `library/`** - Matches page route (`/library`)

**Recommendation:** **Option B (`library/`)** - Matches user-facing feature name

### 3. Coach Actions

**Question:** What to do with `coach-actions.ts`?

**Analysis:**
```typescript
// Current file has 350 lines with functions like:
- getCoachByUserIdAction
- createCoachAction
- updateCoachAction
```

**Options:**
- **A. Create `coaches/` folder** - Separate feature
- **B. Merge into `athletes/`** - Coaches manage athletes
- **C. Keep in `auth/`** - Role-related

**Recommendation:** **Option B** - Rename to `athletes/coach-management-actions.ts`
- Coaches and athletes are closely related
- Avoids proliferation of folders
- Still discoverable

### 4. Users Folder

**Question:** What to do with `users/` folder?

**Current files:**
- `user-actions.ts` - Basic user CRUD (duplicates `auth/user-actions.ts`)
- `onboarding-actions.ts` - Onboarding flow

**Recommendation:**
- Merge `user-actions.ts` into `auth/user-actions.ts`
- Move `onboarding-actions.ts` to `onboarding/`
- Delete `users/` folder

## Proposed Final Structure

```
actions/
├── auth/                        # ✅ Keep as-is (merge users/user-actions.ts)
├── athletes/                    # ✨ New - athlete & coach management
├── plans/                       # ✨ New - training plan & race management
├── sessions/                    # ✨ New - session execution (sprint, group, training)
├── workout/                     # ✨ New - workout execution
├── library/                     # ✨ New - exercise library management
├── onboarding/                  # ✨ New - user onboarding
├── dashboard/                   # ✅ Keep as-is
└── knowledge-base/              # ✅ Keep as-is
```

## Detailed File Mapping

### From `training/` to New Locations

| Current File | New Location | New Name | Reason |
|--------------|--------------|----------|---------|
| `athlete-actions.ts` | `athletes/` | `athlete-actions.ts` | Core athlete management |
| `coach-actions.ts` | `athletes/` | `coach-management-actions.ts` | Coaches manage athletes |
| `training-plan-actions.ts` | `plans/` | `plan-actions.ts` | Training plans |
| `race-actions.ts` | `plans/` | `race-actions.ts` | Races are part of plans |
| `session-plan-actions.ts` | `plans/` | `session-plan-actions.ts` | Planning sessions in plans |
| `session-planner-actions.ts` | `plans/` | `session-planner-actions.ts` | Session planner tool |
| `sprint-session-actions.ts` | `sessions/` | `sprint-session-actions.ts` | Sprint session execution |
| `group-session-actions.ts` | `sessions/` | `group-session-actions.ts` | Group session execution |
| `training-session-actions.ts` | `sessions/` | `training-session-actions.ts` | Training session execution |
| `workout-session-actions.ts` | `workout/` | `workout-session-actions.ts` | Workout execution |
| `exercise-actions.ts` | `library/` | `exercise-actions.ts` | Exercise library |

### From `users/` to New Locations

| Current File | New Location | Action |
|--------------|--------------|--------|
| `user-actions.ts` | `auth/` | Merge into existing file |
| `onboarding-actions.ts` | `onboarding/` | Move as-is |

## Implementation Strategy

### Phase 1: Create New Folders & Move Files (No Breaking Changes)

1. Create new folder structure
2. Copy files to new locations (don't delete originals yet)
3. Update internal imports within moved files
4. Create index.ts files with re-exports

### Phase 2: Update Imports Across Codebase

1. Find all imports from `actions/training`
2. Update to new locations
3. Test each feature after updating

### Phase 3: Cleanup

1. Verify all imports updated
2. Delete old `training/` folder
3. Delete old `users/` folder
4. Update any documentation

### Phase 4: Verify

1. Run type checking (`npm run type-check`)
2. Test all affected features
3. Ensure no broken imports

## Benefits

1. **Better Discoverability**: Actions organized by feature, not domain
2. **Smaller Files**: Easier to navigate and understand
3. **Aligned with Pages**: Matches `app/(protected)` structure
4. **Aligned with Components**: Matches `components/features` structure
5. **Easier Onboarding**: New developers can find actions easily
6. **Better Separation**: Clear boundaries between features

## Risks & Mitigation

### Risk 1: Breaking Imports
**Impact:** High - many files import from `actions/training`
**Mitigation:**
- Use multi-step approach (copy first, then move)
- Update imports systematically
- Run type checking after each batch

### Risk 2: Circular Dependencies
**Impact:** Medium - some actions might reference each other
**Mitigation:**
- Keep shared utilities in a common location
- Review cross-feature dependencies
- Extract shared logic to `lib/` if needed

### Risk 3: Naming Confusion
**Impact:** Low - developers might look in wrong folder
**Mitigation:**
- Clear naming conventions
- Update documentation
- Add comments in index files

## Estimated Effort

- **Planning & Review:** 30 minutes ✅ (this document)
- **Create new structure:** 15 minutes
- **Move files & update internal imports:** 1 hour
- **Update all imports across codebase:** 2-3 hours
- **Testing & verification:** 1 hour
- **Total:** ~4-5 hours

## Alternative: Minimal Change Approach

If full reorganization is too risky, consider this minimal approach:

1. **Keep existing folders** but rename for clarity:
   - `training/` → `sessions-and-plans/` (more descriptive)

2. **Only extract obvious separations:**
   - Move `athlete-actions.ts` → `athletes/`
   - Move `exercise-actions.ts` → `library/`
   - Move `workout-session-actions.ts` → `workout/`

3. **Keep session-related actions together** in renamed folder

**Pros:** Less risky, faster
**Cons:** Doesn't solve the core organization problem

## Recommendation

**Proceed with full reorganization** for these reasons:

1. Current structure is already problematic (9,847 lines in one folder)
2. Code is stable enough for safe refactoring
3. TypeScript will catch any broken imports
4. Long-term maintainability is worth the upfront effort
5. Aligns perfectly with existing feature structure

## Next Steps

1. ✅ Review and approve this plan
2. Create new folder structure
3. Copy files (keep originals)
4. Update imports systematically
5. Test thoroughly
6. Remove old files
7. Update documentation

---

**Approval Required:** Please review and confirm before proceeding with implementation.
