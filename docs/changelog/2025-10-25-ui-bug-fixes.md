# UI/UX Bug Fixes - October 25, 2025

## Summary
Fixed 5 critical UI/UX bugs affecting the training plans and session planner workflows.

## Issues Fixed

### 1. Mesocycle Ordering Bug ✅
- **Issue**: Weeks displayed out of order (Week 1 appearing after 2, 3, 4)
- **Root Cause**: Missing `.order()` clauses in nested query
- **Fix**: Added ordering by `start_date` for mesocycles and microcycles
- **File**: `apps/web/actions/plans/plan-actions.ts:155-178`
- **Impact**: Training plan timeline now displays weeks chronologically

### 2. Session Planner Toolbar Misalignment ✅
- **Issue**: Add Exercise section toolbar shifted down incorrectly
- **Root Cause**: Sticky positioning with incorrect offset values
- **Fix**: Removed sticky positioning, replaced with simple margin
- **File**: `apps/web/components/features/plans/session-planner/components/Toolbar.tsx:48`
- **Impact**: Improved session planner UI layout

### 3. Duplicate Page Headers ✅
- **Issue**: Two "Training Plans" headers on `/plans` page
- **Root Cause**: `PageLayout` and `PlansHomeClient` both rendering headers
- **Fix**: Removed duplicate header from `PlansHomeClient`, kept only action button
- **File**: `apps/web/components/features/plans/home/PlansHomeClient.tsx:149-160`
- **Impact**: Cleaner, more consistent page layout following standard pattern

### 4. Plan Creation Wizard Error ✅
- **Issue**: `onNext is not defined` error when clicking New Plan
- **Root Cause**: Undefined `onNext` callback in `PlanTypeSelection` component
- **Fix**: Removed redundant Next button (component already calls `onSelect` on card click)
- **File**: `apps/web/components/features/plans/components/mesowizard/plan-type-selection.tsx:319-321`
- **Impact**: Plan creation wizard now works without errors

### 5. Type Safety Improvements ✅
Fixed pre-existing TypeScript errors during investigation:
- **athlete-actions.ts**: Added null→undefined conversions for Supabase compatibility
- **plan-actions.ts**: Fixed relation name (`athlete_group` → `athlete_groups`)
- **plan-assignment-actions.ts**: Added null check and const assertions for enum values

## Testing Notes

### Manual Testing Required
1. Verify mesocycle/microcycle weeks display in correct order on `/plans/[id]`
2. Check toolbar alignment on `/plans/[id]/session/[sessionId]`
3. Confirm single header on `/plans` page
4. Test new plan creation flow via "New Plan" button

### Regression Testing
- All plan viewing/editing functionality
- Session planner exercise management
- Plan creation wizard (all 4 steps)

## Technical Details

### Query Optimization
```typescript
// Added nested ordering for proper data display
.order('start_date', { referencedTable: 'mesocycles', ascending: true })
.order('start_date', { referencedTable: 'mesocycles.microcycles', ascending: true })
```

### Component Simplification
- Removed 12 lines of duplicate header code
- Removed 10 lines of redundant button code
- Improved component reusability following DRY principles

## Related Documentation
- Architecture: `docs/architecture/component-architecture.md`
- Layout System: `docs/design/unified-layout-system.md`
- Loading Patterns: `docs/development/loading-patterns.md`

## Author
Claude Code Assistant

## Date
October 25, 2025
