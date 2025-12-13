# Error Boundary Standardization and Query Optimization - Implementation Plan

> **Date**: 2025-12-12  
> **Status**: Ready for Execution  
> **Estimated Time**: 5-7 days

---

## Overview

This plan addresses two critical improvements:
1. **Standardize error boundaries** - Replace scattered custom error boundary implementations with a unified system using `react-error-boundary`
2. **Optimize database queries** - Replace `select('*')` with specific fields and add pagination where missing

**Schema Verification**: All queries verified against live Supabase schema (Project ID: `pcteaouusthwbgzczoae`)

---

## Part 1: Error Boundary Standardization

### Current State Analysis

**Existing Error Boundaries:**
- `WorkoutErrorBoundary` - Custom class component in `components/features/workout/components/error-loading/workout-error-boundary.tsx`
- `PlanErrorBoundary` - Custom class component in `components/error-boundary/PlanErrorBoundary.tsx`
- `ErrorFallback` - Reusable fallback component using react-error-boundary pattern in `components/layout/error-fallback.tsx`
- `GlobalError` - Next.js global error page in `app/global-error.tsx` (basic, needs improvement)
- `protected-layout.tsx` - Uses `react-error-boundary` library (good pattern)

**Library Available:** `react-error-boundary@^6.0.0` already installed

**Usage Locations:**
- `WorkoutErrorBoundary`: Used in 2 files (workout-history-page.tsx, workout-page-content.tsx)
- `PlanErrorBoundary`: Used in 1 file (plans/[id]/page.tsx)
- `useWorkoutErrorHandler`: Hook exists but minimal usage

### Implementation Steps

#### Step 1: Create Standardized Error Boundary System

**File: `components/error-boundary/global-error-boundary.tsx`**
- Create reusable error boundary component using `react-error-boundary` library
- Support configurable fallback UI
- Include error logging (console + future error tracking integration point)
- Support reset functionality
- Match design system (use existing `ErrorFallback` as base)
- Export as default component

**File: `components/error-boundary/feature-error-boundary.tsx`**
- Create feature-specific wrapper that uses global error boundary
- Allow custom error messages per feature
- Support feature-specific recovery actions
- Props: `featureName`, `customMessage?`, `onReset?`, `children`

**File: `components/error-boundary/index.ts`**
- Export all error boundary components
- Export error handling utilities
- Export types/interfaces

#### Step 2: Improve Global Error Page

**File: `app/global-error.tsx`**
- Update to match design system (use Card components, proper styling)
- Add better error messaging
- Include reset functionality
- Match styling with `ErrorFallback` component
- Use shadcn/ui components for consistency

#### Step 3: Replace Custom Error Boundaries

**Replace `WorkoutErrorBoundary`:**
- File: `components/features/workout/components/error-loading/workout-error-boundary.tsx`
- Replace with `FeatureErrorBoundary` wrapper
- Update imports in:
  - `components/features/workout/components/pages/workout-history-page.tsx`
  - `components/features/workout/components/pages/workout-page-content.tsx`
- Update export in `components/features/workout/components/error-loading/index.ts`

**Replace `PlanErrorBoundary`:**
- File: `components/error-boundary/PlanErrorBoundary.tsx`
- Replace with `FeatureErrorBoundary` wrapper
- Update imports in:
  - `app/(protected)/plans/[id]/page.tsx`

#### Step 4: Add Global Error Boundary to Root Layout

**File: `app/layout.tsx`**
- Wrap children with `GlobalErrorBoundary` component
- This provides app-wide error catching
- Place after ClerkProvider, before Providers

#### Step 5: Update Protected Layout

**File: `components/layout/protected-layout.tsx`**
- Already uses `react-error-boundary` - verify it uses new standardized component
- Ensure consistency with global boundary
- Update to use `GlobalErrorBoundary` or keep as-is if redundant

### Error Boundary Architecture

```
app/layout.tsx
  └── GlobalErrorBoundary (catches all errors)
      └── ProtectedLayout
          └── ErrorBoundary (catches layout errors - optional, may be redundant)
              └── Feature Pages
                  └── FeatureErrorBoundary (optional, feature-specific)
```

---

## Part 2: Query Optimization

### Schema Verification (Supabase Project: pcteaouusthwbgzczoae)

**Verified Tables and Columns:**

**races table:**
- `id` (bigint), `macrocycle_id` (bigint), `user_id` (integer), `name` (text), `date` (date), `type` (text), `location` (text), `notes` (text), `created_at` (timestamptz), `updated_at` (timestamptz)

**exercise_types table:**
- `id` (integer), `type` (varchar), `description` (text)

**units table:**
- `id` (integer), `name` (varchar), `description` (text)

**exercise_training_details table:**
- `id`, `exercise_training_session_id`, `exercise_preset_id`, `resistance_unit_id`, `reps`, `distance`, `completed`, `power`, `velocity`, `tempo`, `metadata`, `created_at`, `set_index`, `weight`, `effort`, `performing_time`, `rest_time`, `height`, `resistance`, `rpe`

**exercise_preset_groups table:**
- `id`, `athlete_group_id`, `user_id`, `microcycle_id`, `name`, `description`, `session_mode`, `week`, `day`, `date`, `updated_at`, `created_at`, `deleted`, `is_template`

### Query Optimization Details

#### File 1: `apps/web/actions/plans/race-actions.ts`

**Query 1: `getRacesByMacrocycleAction` (line ~74)**
- Current: `.select('*')`
- Replace with: `id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at`
- Add pagination: Consider adding limit if macrocycles can have many races
- Fields used in code: `id`, `name`, `date`, `type` (from PlansHome.tsx analysis)

**Query 2: `getRacesAction` (line ~126)**
- Current: `.select('*')`
- Replace with: `id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at`
- Add pagination: Add `.limit(100)` or implement page-based pagination

**Query 3: `getRaceByIdAction` (line ~177)**
- Current: `.select('*')`
- Replace with: `id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at`
- Single record, no pagination needed

**Query 4: `getUpcomingRacesAction` (line ~455)**
- Current: `.select('*')`
- Replace with: `id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at`
- Add limit: `.limit(10)` for upcoming races

#### File 2: `apps/web/actions/library/exercise-actions.ts`

**Query 1: `getExerciseTypesAction` (line ~448)**
- Current: `.select('*')`
- Replace with: `id, type, description`
- Small table, but should still be specific
- No pagination needed (small reference table)

**Query 2: `getUnitsAction` (line ~534)**
- Current: `.select('*')`
- Replace with: `id, name, description`
- Small table, but should still be specific
- No pagination needed (small reference table)

**Query 3: (line ~1305) - Need to verify context**
- Identify query context and required fields
- Replace `select('*')` with specific fields

#### File 3: `apps/web/actions/sessions/training-session-actions.ts`

**Query: `getPerformanceMetricsAction` (line ~1117)**
- Current: Uses `select('*')` in nested query for `exercise_training_details`
- Context: Getting performance data for metrics calculation
- Replace nested `*` with: `id, exercise_training_session_id, exercise_preset_id, reps, distance, power, velocity, completed, set_index, weight, effort, performing_time, rest_time, resistance, rpe`
- Fields actually used: `reps`, `power`, `distance`, `completed`, `set_index` (from code analysis)

#### File 4: `apps/web/actions/plans/session-plan-actions.ts`

**Query: (line ~703)**
- Current: `.select('*')` from `exercise_preset_groups`
- Context: Getting plan sessions
- Replace with: `id, athlete_group_id, user_id, microcycle_id, name, description, session_mode, week, day, date, updated_at, created_at, deleted, is_template`
- Fields used: `id`, `name`, `day`, `session_mode`, `exercise_presets` (nested)

#### File 5: `apps/web/actions/plans/session-planner-actions.ts`

**Query: (line ~298)**
- Current: `.select('*')` from `exercise_preset_groups`
- Context: Fetching updated session after modification
- Replace with: `id, athlete_group_id, user_id, microcycle_id, name, description, session_mode, week, day, date, updated_at, created_at, deleted, is_template`
- Single record, no pagination needed

### Pagination Strategy

**Current Pagination Patterns:**
- `workout-session-actions.ts` uses `.range((page - 1) * limit, page * limit - 1)` - Good pattern to follow

**Queries Needing Pagination:**
1. `getRacesByMacrocycleAction` - Add optional limit parameter (default 50)
2. `getRacesAction` - Add pagination (page-based, default limit 50)
3. `getExercisesAction` - Already has filters, add pagination if returning large lists

**Pagination Implementation:**
- Use `.range(start, end)` pattern for consistency
- Add optional `page` and `limit` parameters to action functions
- Default limit: 50 for lists, 10 for "recent/upcoming" queries

---

## Part 3: Cleanup and Refactoring Plan

### Files to Remove After Migration

#### Error Boundary Cleanup

**1. `components/features/workout/components/error-loading/workout-error-boundary.tsx`**
- **Action**: Delete file after migration
- **Dependencies**: 
  - Update `components/features/workout/components/error-loading/index.ts` to remove export
  - Update imports in workout pages
- **Backup**: Keep in git history, no need to archive

**2. `components/error-boundary/PlanErrorBoundary.tsx`**
- **Action**: Delete file after migration
- **Dependencies**:
  - Update imports in `app/(protected)/plans/[id]/page.tsx`
- **Backup**: Keep in git history

**3. `components/features/workout/components/error-loading/index.ts`**
- **Action**: Update exports
- **Remove**: `WorkoutErrorBoundary`, `useWorkoutErrorHandler` exports
- **Add**: Re-export from new standardized location if needed, or remove entirely

### Files to Update (Not Delete)

#### Error Boundary Updates

**1. `components/layout/error-fallback.tsx`**
- **Action**: Keep as-is (already uses react-error-boundary pattern)
- **Note**: May be used by new standardized boundaries

**2. `app/global-error.tsx`**
- **Action**: Improve design and functionality
- **Keep**: File stays, content updated

**3. Test Files**
- **File**: `apps/web/__tests__/workout-error-loading.test.tsx`
- **Action**: Update tests to use new standardized error boundaries
- **Update**: Test imports and component references

### Import Updates Required

#### Error Boundary Imports

**Files to Update:**
1. `components/features/workout/components/pages/workout-history-page.tsx`
   - Change: `import { WorkoutErrorBoundary } from '../error-loading'`
   - To: `import { FeatureErrorBoundary } from '@/components/error-boundary'`

2. `components/features/workout/components/pages/workout-page-content.tsx`
   - Change: `import { WorkoutErrorBoundary } from "../error-loading"`
   - To: `import { FeatureErrorBoundary } from '@/components/error-boundary'`

3. `app/(protected)/plans/[id]/page.tsx`
   - Change: `import { PlanErrorBoundary } from "@/components/error-boundary/PlanErrorBoundary"`
   - To: `import { FeatureErrorBoundary } from '@/components/error-boundary'`

4. `components/features/workout/components/error-loading/index.ts`
   - Remove: `WorkoutErrorBoundary`, `useWorkoutErrorHandler` exports
   - Keep: Other exports (loading components)

### Query Optimization Cleanup

**No files to delete** - Only query strings updated within existing files.

**Files Modified (Queries Only):**
1. `apps/web/actions/plans/race-actions.ts` - 4 query updates
2. `apps/web/actions/library/exercise-actions.ts` - 3 query updates
3. `apps/web/actions/sessions/training-session-actions.ts` - 1 query update
4. `apps/web/actions/plans/session-plan-actions.ts` - 1 query update
5. `apps/web/actions/plans/session-planner-actions.ts` - 1 query update

---

## Implementation Order

### Phase 1: Error Boundary Standardization (2-3 days)

**Day 1:**
1. Create standardized error boundary components
   - `components/error-boundary/global-error-boundary.tsx`
   - `components/error-boundary/feature-error-boundary.tsx`
   - `components/error-boundary/index.ts`
2. Improve `app/global-error.tsx`
3. Add global boundary to `app/layout.tsx`

**Day 2:**
4. Replace `WorkoutErrorBoundary` with `FeatureErrorBoundary`
5. Replace `PlanErrorBoundary` with `FeatureErrorBoundary`
6. Update all imports
7. Test error scenarios

**Day 3:**
8. Update test files
9. Verify all error boundaries work
10. Remove old error boundary files

### Phase 2: Query Optimization (3-4 days)

**Day 1:**
1. Verify schema against Supabase (already done)
2. Document field requirements for each query
3. Optimize race-actions.ts (4 queries)

**Day 2:**
4. Optimize exercise-actions.ts (3 queries)
5. Optimize session-plan-actions.ts (1 query)
6. Optimize session-planner-actions.ts (1 query)

**Day 3:**
7. Optimize training-session-actions.ts (1 complex nested query)
8. Add pagination to list queries

**Day 4:**
9. Test all optimized queries
10. Verify no TypeScript errors
11. Performance check

---

## Testing Strategy

### Error Boundary Testing
- [ ] Test error boundary catches errors correctly
- [ ] Test reset functionality works
- [ ] Test error logging (console in dev)
- [ ] Test fallback UI displays correctly
- [ ] Test nested error boundaries (global → feature)
- [ ] Test existing error boundary tests still pass
- [ ] Update test files to use new components

### Query Optimization Testing
- [ ] Verify all queries return expected data
- [ ] Test pagination works correctly
- [ ] Verify no TypeScript errors
- [ ] Test with real data to ensure no missing fields
- [ ] Performance check (queries should be faster)
- [ ] Verify nested selects work correctly
- [ ] Test edge cases (empty results, large datasets)

---

## Success Criteria

### Error Boundary Standardization
- [ ] Single standardized error boundary system in place
- [ ] All custom error boundaries replaced
- [ ] Global error boundary catches app-wide errors
- [ ] Error fallback UI matches design system
- [ ] Error logging works (console in dev)
- [ ] All existing error boundary tests pass
- [ ] Old error boundary files removed
- [ ] All imports updated

### Query Optimization
- [ ] Zero instances of `select('*')` in action files (except where all fields truly needed)
- [ ] All list queries have pagination (where appropriate)
- [ ] All queries return only required fields
- [ ] No TypeScript errors
- [ ] All queries tested and working
- [ ] Performance improved (queries faster)
- [ ] Schema verified against live Supabase

---

## Files to Create

1. `components/error-boundary/global-error-boundary.tsx`
2. `components/error-boundary/feature-error-boundary.tsx`
3. `components/error-boundary/index.ts` (update exports)

## Files to Modify

### Error Boundaries
1. `app/global-error.tsx` - Improve design and functionality
2. `app/layout.tsx` - Add global error boundary
3. `components/features/workout/components/error-loading/workout-error-boundary.tsx` - DELETE after migration
4. `components/error-boundary/PlanErrorBoundary.tsx` - DELETE after migration
5. `components/features/workout/components/pages/workout-history-page.tsx` - Update imports
6. `components/features/workout/components/pages/workout-page-content.tsx` - Update imports
7. `app/(protected)/plans/[id]/page.tsx` - Update imports
8. `components/layout/protected-layout.tsx` - Verify uses standardized component
9. `components/features/workout/components/error-loading/index.ts` - Update exports
10. `apps/web/__tests__/workout-error-loading.test.tsx` - Update tests

### Query Optimization
1. `apps/web/actions/plans/race-actions.ts` - 4 queries
2. `apps/web/actions/sessions/training-session-actions.ts` - 1 query
3. `apps/web/actions/plans/session-plan-actions.ts` - 1 query
4. `apps/web/actions/plans/session-planner-actions.ts` - 1 query
5. `apps/web/actions/library/exercise-actions.ts` - 3 queries

---

## Detailed Cleanup Checklist

### After Error Boundary Migration

**Files to Delete:**
- [ ] `components/features/workout/components/error-loading/workout-error-boundary.tsx`
- [ ] `components/error-boundary/PlanErrorBoundary.tsx`

**Files to Update Exports:**
- [ ] `components/features/workout/components/error-loading/index.ts` - Remove WorkoutErrorBoundary export

**Files to Update Imports:**
- [ ] `components/features/workout/components/pages/workout-history-page.tsx`
- [ ] `components/features/workout/components/pages/workout-page-content.tsx`
- [ ] `app/(protected)/plans/[id]/page.tsx`

**Test Files to Update:**
- [ ] `apps/web/__tests__/workout-error-loading.test.tsx` - Update to test new components

### After Query Optimization

**No files to delete** - Only query strings modified

**Verification:**
- [ ] Run `grep -r "select('*')" apps/web/actions` - Should return 0 results (or only in comments)
- [ ] All TypeScript types still valid
- [ ] All queries tested with real data

---

## Notes

- `react-error-boundary` library is already installed - no new dependencies needed
- Some queries use complex nested selects - these need careful analysis
- Pagination pattern should follow existing `.range()` pattern for consistency
- Error boundaries should integrate with future error tracking (Sentry/PostHog) - add integration points now
- Schema verified against live Supabase project `pcteaouusthwbgzczoae`
- All table columns verified from Supabase MCP tools

---

## Risk Mitigation

### Error Boundary Risks
- **Risk**: Breaking existing error handling
- **Mitigation**: Test thoroughly, keep old files until verified, update tests

### Query Optimization Risks
- **Risk**: Missing required fields causing runtime errors
- **Mitigation**: Verify field usage in components, test with real data, keep TypeScript strict mode

---

**Plan Status**: Ready for Execution  
**Next Step**: Begin Phase 1 - Error Boundary Standardization

