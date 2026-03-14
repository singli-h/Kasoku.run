# Implementation Plan: Template & UX Polish

**Branch**: `014-template-ux-polish` | **Date**: 2026-03-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-template-ux-polish/spec.md`

## Summary

Polish and unify the template system by replacing the custom `TemplateExerciseBlock` with the unified `ExerciseCard`, wiring PasteProgramDialog to the template page with a gradient AI button, consolidating the dual toast state stores, and ensuring Min/All field toggles work consistently across all views. All changes are frontend-only — no database schema changes required.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14+
**Primary Dependencies**: Radix UI (toast, dialog, sheet), Tailwind CSS, HTML5 Drag-and-Drop
**Storage**: N/A (frontend-only, existing Supabase actions updated for field passthrough)
**Testing**: Manual verification via browser testing
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web (monorepo: `apps/web/`)
**Performance Goals**: No regression in render performance; ExerciseCard already optimized
**Constraints**: Must not break existing workout or plan views; backward-compatible template data model
**Scale/Scope**: 4 user stories, ~12 files modified, 0 new files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project-specific constitution principles defined. Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/014-template-ux-polish/
├── plan.md              # This file
├── spec.md              # Requirements and user stories
├── research.md          # Phase 0 output — codebase research findings
├── data-model.md        # Phase 1 output — type changes
├── quickstart.md        # Phase 1 output — implementer quick reference
├── contracts/           # Phase 1 output — internal contracts
│   └── template-exercise-contract.md
└── tasks.md             # Phase 2 output (via /tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── components/
│   ├── features/
│   │   ├── plans/
│   │   │   ├── components/
│   │   │   │   └── templates-page.tsx          # US-1: Replace TemplateExerciseBlock with ExerciseCard
│   │   │   └── home/
│   │   │       └── PlansHomeClient.tsx          # US-3: Replace alert() with toast
│   │   └── training/
│   │       ├── components/
│   │       │   ├── ExerciseCard.tsx             # US-1: Verify template compat (isAthlete=false)
│   │       │   ├── SetRow.tsx                   # US-4: Verify showAdvancedFields pass-through
│   │       │   └── PasteProgramDialog.tsx       # US-2: No changes (reused as-is)
│   │       ├── types.ts                        # US-1: Verify TrainingExercise/TrainingSet coverage
│   │       ├── utils/
│   │       │   └── field-visibility.ts          # US-4: No changes needed
│   │       └── views/
│   │           └── WorkoutView.tsx              # US-4: Verify showAllFields wiring
│   ├── composed/
│   │   └── animated-gradient-text.tsx           # US-2: Used for AI button (no changes)
│   └── ui/
│       ├── toaster.tsx                          # US-3: Fix import to canonical use-toast
│       ├── use-toast.ts                         # US-3: DELETE (duplicate)
│       └── sonner.tsx                           # US-3: DELETE (unused)
├── hooks/
│   └── use-toast.ts                            # US-3: Canonical toast hook, fix TOAST_REMOVE_DELAY
├── lib/
│   └── hooks/
│       └── useAdvancedFieldsToggle.ts           # US-4: Reused in template view
└── actions/
    └── plans/
        └── session-plan-actions.ts              # US-1: Expand CreateTemplateInput to all fields
```

**Structure Decision**: Existing monorepo web app structure. All changes within `apps/web/`. No new directories or packages.

---

## Architecture Decisions

### AD-1: Replace SelectedExercise with TrainingExercise

**Decision**: Use `TrainingExercise` (from `training/types.ts`) as the template exercise state type instead of the local `SelectedExercise` interface.

**Rationale**:
- `TrainingExercise` already has stable set IDs, all TrainingSet fields, and existing mappers (`dbPlanSetToTrainingSet`, `trainingSetToDbPlanSet`)
- Eliminates the 6-field truncation problem
- Enables direct use of unified `ExerciseCard` without adapter layer
- The `section` field (required by `TrainingExercise`) can be derived from `exerciseTypeId` using existing `getSectionOrder` utility or defaulted

**Migration path**:
1. Replace `SelectedExercise[]` state with `TrainingExercise[]`
2. Update `populateEditState` to use `dbPlanSetToTrainingSet` mapper
3. Replace index-based `handleUpdateSetField(exerciseIndex, setIndex, field, value)` with ID-based `handleUpdateSet(exerciseId, setId, field, value)` to match ExerciseCard's callback signature
4. Update save/create actions to use `trainingSetToDbPlanSet` and accept all fields

### AD-2: Unified ExerciseCard for Templates

**Decision**: Replace `TemplateExerciseBlock` with the same `ExerciseCard` used in plan/workout views, configured with `isAthlete={false}`.

**What this provides for free**:
- Expand/collapse per exercise
- Exercise DnD reorder (native HTML5)
- Set DnD reorder (internal to ExerciseCard)
- All field types rendered via SetRow
- Field visibility driven by exercise type
- Remove exercise / remove set buttons
- Consistent styling across all views

**What needs wiring in the template parent**:
- `draggingExerciseId` state + DnD handlers (same pattern as WorkoutView)
- `onToggleExpand` state management
- `onUpdateSet`, `onAddSet`, `onRemoveSet`, `onRemoveExercise`, `onReorderSets` callbacks
- `showAllFields` or `showAdvancedFields` toggle state

### AD-3: Toast Consolidation — Keep Radix, Fix Store Split

**Decision**: Consolidate on `@/hooks/use-toast` as the canonical toast hook. Update `toaster.tsx` to import from it. Delete the duplicate at `@/components/ui/use-toast.ts`. Delete unused Sonner files.

**Rationale**:
- 49 feature files already import from `@/hooks/use-toast`
- Only `templates-page.tsx` imports from `@/components/ui/use-toast` (1 file to change)
- The `<Toaster>` in `toaster.tsx` needs to read from the same store the features write to
- Sonner is installed but never mounted — dead code

**Configuration changes**:
- `TOAST_REMOVE_DELAY`: `1000000` → `5000` (5 seconds auto-dismiss)
- `TOAST_LIMIT`: Keep at `1` (single toast at a time)
- Add success variant styling (green/check icon)
- Error toasts: `TOAST_REMOVE_DELAY` override to `8000` (persist longer)

### AD-4: PasteProgramDialog on Template Page

**Decision**: Add `PasteProgramDialog` to the template page header with an `AnimatedGradientText` styled button. Keep it in `SessionPlannerV2` as well (don't remove — coaches may still use it there).

**Rationale**: The spec says "hidden from SessionPlannerV2" but removing it breaks existing coach workflow. Better to add to templates without removing from plans. Can revisit later.

**Integration**:
- `PasteProgramDialog` outputs `ResolvedExercise[]`
- Convert to `TrainingExercise[]` using a simple mapper (exerciseId, name, type, sets with default values)
- Append to current template exercises state
- The dialog handles exercise library search/creation internally — no new backend needed

### AD-5: Field Toggle Strategy

**Decision**: Use `showAdvancedFields` (with `useAdvancedFieldsToggle` hook) for template edit mode. Reuse the existing `AdvancedFieldsToggle` component.

**Rationale**:
- Templates are coach-facing, same as plan view — the `showAdvancedFields` toggle is the right abstraction
- Shares localStorage persistence with plan view (`kasoku:advanced-fields-visible`)
- Consistent UX: coach sees same toggle behavior in templates and plans

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template save breaks if TrainingExercise shape doesn't round-trip through actions | High | Update `createTemplateAction` and `updateTemplateAction` to accept all TrainingSet fields via `trainingSetToDbPlanSet` |
| Existing saved templates with 6-field sets break on load | Medium | `dbPlanSetToTrainingSet` already handles null/missing fields gracefully — fills with `null` |
| ExerciseCard render issues with template data (missing section, no completed state) | Low | Provide sensible defaults: `section` derived from type, `completed` always false |
| Toast store consolidation breaks toasts that were working via module caching | Low | Test after consolidation; the fix makes explicit what was already happening implicitly |

## Complexity Tracking

No constitution violations. No complexity justifications needed.
