# Research: Template & UX Polish

**Feature**: 014-template-ux-polish | **Date**: 2026-03-14

## US-1: Template Component Unification

### Current State

All template UI lives in a single 1072-line monolithic file: `apps/web/components/features/plans/components/templates-page.tsx`. It contains local sub-components:
- `TemplatesPage` — grid listing with search
- `TemplateCard` — card in the grid
- `NewTemplateDialog` — dialog for creating a template
- `TemplateDetailSheet` — sheet for viewing/editing an existing template
- `TemplateExerciseBlock` — exercise block used in edit mode
- `ExerciseSearchCombobox` — autocomplete for adding exercises
- `useExerciseSetHandlers` — shared hook for set CRUD operations

### SelectedExercise Type (template-local)

```typescript
interface SelectedExercise {
  exerciseId: number
  exerciseName: string
  exerciseTypeId?: number
  sets: Array<{
    reps: number | null
    weight: number | null
    distance: number | null
    performing_time: number | null
    rest_time: number | null
    rpe: number | null
  }>
}
```

**Gaps vs TrainingSet:**
- Missing fields: `tempo`, `height`, `power`, `velocity`, `effort`, `resistance`, `metadata`, `resistanceUnitId`
- Naming: uses DB snake_case (`performing_time`, `rest_time`) instead of UI camelCase
- No `id` or `setIndex` — fabricated as `template-${exerciseId}-${idx}` only at render time
- No `completed` state (acceptable for templates)

### TemplateExerciseBlock Analysis

Located at lines 332–432 of `templates-page.tsx`.

**What it does right:**
- Uses the shared `SetRow` component
- Calls `getVisibleFields` from `field-visibility.ts`
- Constructs a `TrainingSet[]` mapping from `SelectedExercise.sets`

**What's missing vs unified ExerciseCard:**
- No drag-and-drop (exercises cannot be reordered)
- No set reordering DnD (`SetRow` receives no DnD props)
- No exercise-level expand/collapse
- No superset support
- No subgroup chips
- No exercise notes display
- No `showAdvancedFields` control — always passes all visible fields
- `TrainingSet` fabrication drops `tempo`, `rpe`, `height`, `power`, `velocity`, `effort`, `resistance`

### handleUpdateSetField — Field Mapping Problem

Located at lines 464–491 of `templates-page.tsx`:

Only maps 6 fields (`reps`, `weight`, `distance`, `performingTime`, `restTime`, `rpe`). Fields like `tempo`, `height`, `power`, `velocity`, `effort`, `resistance` fall through to `field as string` (camelCase), but `SelectedExercise.sets` doesn't have those keys — updates silently write to undefined properties.

### View Mode — Raw HTML Table

`TemplateDetailSheet` view mode (lines 637–683) renders a raw HTML `<table>` with hardcoded columns: `#`, `Reps`, `Weight`, `Dist`, `Rest`. Does NOT use `SetRow`. Doesn't respect exercise type field visibility.

### Server Action Field Truncation

`CreateTemplateInput` in `session-plan-actions.ts` (lines 1641–1656) only accepts 6 fields: `reps`, `weight`, `distance`, `performing_time`, `rest_time`, `rpe`. The DB columns support all fields (`tempo`, `height`, `power`, `velocity`, `effort`, `resistance`, `metadata`, `resistance_unit_id`) but the action silently discards them. Same truncation in `updateTemplateAction`.

### Existing Type Mappers (unused in templates)

`training/types.ts` exports:
- `dbPlanSetToTrainingSet(dbSet)` — converts `session_plan_sets` row to `TrainingSet` with all fields
- `trainingSetToDbPlanSet(set, sessionPlanExerciseId)` — converts `TrainingSet` back to DB format

Templates currently bypass these mappers with manual 6-field copies.

### DnD Infrastructure (plan/workout)

Uses native HTML5 drag-and-drop (no library):
- **Exercise DnD** in `WorkoutView.tsx`: `draggingExerciseId` state, `handleExerciseDragStart/End/Drop` handlers
- **Set DnD** inside `ExerciseCard.tsx` (lines 383–412): `draggingSetId`, `dragOverSetId` local state
- `SetRow` receives `isDragging`, `onDragStart`, `onDragOver`, `onDragEnd`, `onDrop`

### ExerciseCard Props Interface

Key props at lines 25–88 of `ExerciseCard.tsx`:
- `exercise: TrainingExercise` — needs `id`, `exerciseId`, `name`, `section`, `exerciseOrder`, `sets`, `exerciseTypeId`, `targetEventGroups`, `expanded`
- `isAthlete: boolean` — `false` for templates
- `onToggleExpand`, `onCompleteSet`, `onUpdateSet(setId, field, value)`, `onAddSet`, `onRemoveSet`, `onRemoveExercise`, `onReorderSets`
- DnD: `isDragging`, `onDragStart`, `onDragOver`, `onDragEnd`, `onDrop`
- `showAllFields` — replaces always-forCoach behavior
- PR/AI props — optional, can omit in templates

### Key Migration Decisions

1. **Replace `SelectedExercise` with `TrainingExercise`** — gives stable set IDs, all fields, existing mappers
2. **`section` field** required by `TrainingExercise` but templates have no concept — derive from `exerciseTypeId` using `getSectionOrder` or default to `"Gym"`
3. **ID-based vs index-based updates** — ExerciseCard uses `onUpdateSet(setId, field, value)` not `onUpdateSetField(exerciseIndex, setIndex, field, value)`
4. **Update server actions** to accept and persist all TrainingSet fields

---

## US-2: Template AI Parser

### PasteProgramDialog

**File**: `apps/web/components/features/training/components/PasteProgramDialog.tsx`

**Props:**
```typescript
interface PasteProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExercisesResolved: (exercises: ResolvedExercise[]) => void
}
```

**Output — ResolvedExercise:**
```typescript
interface ResolvedExercise extends ParsedExercise {
  resolvedExerciseId: number
  resolvedExerciseName: string
  resolutionType: "matched" | "created"
  resolvedExerciseTypeId?: number | null
  resolvedExerciseType?: string | null
}
```

**4-Step Flow:**
1. **Input**: User pastes text into textarea
2. **Parse**: `aiParseSessionAction(rawText)` — server action using gpt-4o-mini via Vercel AI SDK
3. **Preview**: `PasteProgramPreview` renders editable exercise list (name, type, reorder, delete)
4. **Resolve**: Name resolution loop (search → exact match or create), then `onExercisesResolved(resolved)`

**Current Render Location**: Only in `SessionPlannerV2.tsx` (lines 1073–1077), triggered from a `DropdownMenuItem` ("Paste Program") at line 865.

### AnimatedGradientText

**File**: `apps/web/components/composed/animated-gradient-text.tsx`
**Export**: via `apps/web/components/composed/index.ts`
Currently unused by PasteProgramDialog. Spec plans to use it for the trigger button styling.

### Template Integration Requirements

- Add `PasteProgramDialog` to template page with `AnimatedGradientText` button
- Convert `ResolvedExercise[]` → `TrainingExercise[]` for template state
- The dialog already handles exercise library search/creation — no new backend needed
- Hide from `SessionPlannerV2` (moved exclusively to template page per spec)

---

## US-3: Alert/Notification Standardization

### Critical Bug: Two Separate Toast State Stores

| Store | Import Path | Who Reads | Who Writes |
|-------|-------------|-----------|------------|
| Store A | `@/hooks/use-toast` | Nobody (orphaned) | 49 feature files |
| Store B | `@/components/ui/use-toast` | `<Toaster>` in `toaster.tsx` | Only `templates-page.tsx` |

The `<Toaster>` mounted in `app/layout.tsx` reads from Store B (`@/components/ui/use-toast`). All 49 feature files write to Store A (`@/hooks/use-toast`). These are **separate module instances**. In practice Node module caching likely makes them the same instance, but architecturally broken.

### Duplicate use-toast.ts Files

| File | TOAST_REMOVE_DELAY | TOAST_LIMIT |
|------|-------------------|-------------|
| `apps/web/hooks/use-toast.ts` | `1000000` (16.67 min) | `1` |
| `apps/web/components/ui/use-toast.ts` | `1000000` (16.67 min) | `1` |

Functionally identical copies. `TOAST_REMOVE_DELAY = 1000000` means toasts never auto-remove.

### Sonner Status

- `apps/web/components/ui/sonner.tsx` exists but is **never mounted** in any layout
- Zero feature files currently import from `"sonner"` (previously migrated)

### Native alert() Calls

`apps/web/components/features/plans/home/PlansHomeClient.tsx`:
- Line 121: `window.confirm(...)` — blocks main thread
- Line 130: `alert(result.message)` — raw browser alert
- Line 133: `alert('Failed to unassign plan...')` — raw browser alert

### Title Casing — Completely Inconsistent

Three patterns in simultaneous use:
- **Title Case**: `"Session Started"`, `"Workout Complete!"`, `"Template Saved"`
- **Sentence case**: `"Session created"`, `"Notes updated"`, `"Race saved"`
- **Generic words**: `"Error"`, `"Success"`, `"Created"`

### Recommendation

1. **Consolidate to one `use-toast.ts`** — canonical path `@/hooks/use-toast`, update `toaster.tsx` import
2. **Set `TOAST_REMOVE_DELAY` to 5000ms** (5 seconds)
3. **Standardize title casing** — Sentence case everywhere
4. **Replace `alert()` calls** with toast/dialog
5. **Delete Sonner** (`sonner.tsx` + `sonner` package) — unused, confusing

---

## US-4: Min/All Field Toggle

### Two Independent Toggles

| | `showAllFields` | `showAdvancedFields` |
|---|---|---|
| View | WorkoutView (athlete) | IndividualPlanPage / SessionPlannerV2 (coach) |
| Default | `false` (min mode) | `true` via localStorage |
| Persistence | None — `useState`, resets on mount | localStorage `kasoku:advanced-fields-visible` |
| What it controls | Whether athlete sees optional fields without values | Whether advanced fields shown at all |

### showAllFields (Workout)

- Declared in `WorkoutView.tsx` line 182
- UI: `<button>` with `SlidersHorizontal` icon, toggles "Min"/"All" labels (lines 399–411)
- Passed to `ExerciseCard` as prop
- Connection: `ExerciseCard` line 350 — `forCoach = !isAthlete || showAllFields`
  - `showAllFields = true` → forces coach-mode visibility (all configurable fields)
  - `showAllFields = false` → athlete mode (required + filled fields only)

### showAdvancedFields (Plan)

- Hook: `apps/web/lib/hooks/useAdvancedFieldsToggle.ts`
  - localStorage key: `kasoku:advanced-fields-visible`, default `false`
- UI: `AdvancedFieldsToggle.tsx` — two variants: `inline` (Switch) and `card` (mobile sheet)
- Rendered in `IndividualPlanPage.tsx` at line 526 (desktop) and `MobileSettingsSheet`
- Connection: `SetRow.tsx` lines 202–206 — AND gate on top of `visibleFields`:
  ```
  showVelocity = (visibleFields?.velocity ?? false) && showAdvancedFields
  ```

### Template View — No Toggle

`templates-page.tsx` calls `getVisibleFields(..., { forCoach: true })` directly — always in coach mode, no toggle exists.

### Recommendation

- Template edit: Add `showAdvancedFields` toggle (reuse `useAdvancedFieldsToggle` hook + `AdvancedFieldsToggle` component)
- Template view: Sensible default — show fields that have values
- Workout `showAllFields`: Consider localStorage persistence so preference survives navigation
- Ensure both toggles work consistently with ExerciseCard after template unification
