# Feature Spec: Template & UX Polish

**Branch**: `014-template-ux-polish` | **Date**: 2026-03-14

## Overview

Polish and unify the template system, add AI parsing to templates, standardize notifications, and fix field visibility toggles across the app.

## User Stories

### US-1: Template Component Unification
As a coach, I want the template view/edit UI to look and behave identically to the plan/workout page, so I have a consistent experience across the app.

**Acceptance Criteria:**
- Template exercises use the same `ExerciseCard` component as plan/workout views
- Exercise drag-and-drop reorder works in template edit mode
- Set drag-and-drop reorder works in template edit mode
- Template view mode uses `ExerciseCard` in read-only mode (no raw table)
- All TrainingSet fields are supported (effort, power, velocity, tempo, height, resistance) — not just the current 6
- `SelectedExercise.sets` expanded to include all TrainingSet fields
- `handleUpdateSetField` maps all camelCase→snake_case field pairs
- SetRow `draggable` attribute is conditional (only when `onDragStart` provided)

### US-2: Template AI Parser
As a coach, I want to paste a workout program as text on the template page and have AI parse it into structured exercises, so I can create templates quickly without manual entry.

**Acceptance Criteria:**
- A visually distinct AI button (gradient/rainbow styling) appears on the template page next to "New Template"
- Clicking it opens the existing `PasteProgramDialog`
- AI-parsed exercises populate the template exercise list
- Smart detection includes exercise grouping and superset identification
- The existing `PasteProgramDialog` in SessionPlannerV2 is hidden (moved exclusively to template page)
- Uses the existing `AnimatedGradientText` component for the button styling

### US-3: Alert/Notification Standardization
As a user, I want consistent notification behavior across the entire app, so feedback feels polished and predictable.

**Acceptance Criteria:**
- All toast notifications use a single system (consolidate Sonner vs Radix)
- Title casing is consistent (Sentence case everywhere)
- Success toasts have a distinct visual style (green/check icon)
- Error toasts persist longer or require manual dismiss
- Success toasts auto-dismiss in 3 seconds
- `PlansHomeClient.tsx` alert() calls replaced with toast
- Duplicate `use-toast` hook files consolidated to one canonical path
- Toast `TOAST_REMOVE_DELAY` set to a reasonable value (not 1000000ms)

### US-4: Min/All Field Toggle Fix
As an athlete, I want the Min/All field toggle on the workout page to visibly change what columns I see, so I can reduce clutter during my workout.

**Acceptance Criteria:**
- Min mode shows only required fields + fields with plan values
- All mode shows all configurable fields for the exercise type
- Toggle is visible and functional in workout view
- Plan view toggle (`showAdvancedFields` via localStorage) works independently
- Template view has a toggle or sensible defaults
- Both toggles (`showAllFields` and `showAdvancedFields`) are consistent across views

## Technical Constraints

- Must not break existing workout or plan views
- Template data model (`SelectedExercise`) must remain backward-compatible with existing saved templates
- PR system (just wired into correct pipeline) must continue working
- No database schema changes required
- All changes are frontend-only

## Dependencies

- Existing `ExerciseCard` at `training/components/ExerciseCard.tsx`
- Existing `SetRow` at `training/components/SetRow.tsx`
- Existing `PasteProgramDialog` at `training/components/PasteProgramDialog.tsx`
- Existing `AnimatedGradientText` at `composed/animated-gradient-text.tsx`
- Existing `useToast` hook at `hooks/use-toast.ts`
- Field visibility utility at `training/utils/field-visibility.ts`
