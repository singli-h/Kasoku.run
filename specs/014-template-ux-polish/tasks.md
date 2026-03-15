# Tasks: Template & UX Polish

**Input**: Design documents from `/specs/014-template-ux-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested — manual browser verification only.

**Organization**: Tasks grouped by user story. US-3 foundational fix comes first (toast store), then US-1 (core refactor), then US-2/US-4 (depend on US-1), then US-3 polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Toast Store Fix)

**Purpose**: Fix the critical dual toast state store bug before any other work. This is the only truly blocking prerequisite — all other user stories can proceed after this.

- [x] T001 [US3] Consolidate duplicate `use-toast` hooks: update `apps/web/components/ui/toaster.tsx` to import from `@/hooks/use-toast` instead of `@/components/ui/use-toast`
- [x] T002 [US3] Delete duplicate hook file `apps/web/components/ui/use-toast.ts`
- [x] T003 [US3] Delete unused Sonner wrapper `apps/web/components/ui/sonner.tsx`
- [x] T004 [US3] In `apps/web/hooks/use-toast.ts`: change `TOAST_REMOVE_DELAY` from `1000000` to `5000` (5s auto-dismiss)
- [x] T005 [US3] Update `apps/web/components/features/plans/components/templates-page.tsx` toast import from `@/components/ui/use-toast` to `@/hooks/use-toast`

**Checkpoint**: Single toast state store active. All toasts render through one `<Toaster>` reading one store. Verify a toast appears and auto-dismisses in ~5s.

---

## Phase 2: US-1 — Template Component Unification (Priority: P1) 🎯 MVP

**Goal**: Replace custom `TemplateExerciseBlock` with the unified `ExerciseCard`, support all TrainingSet fields, enable exercise/set DnD reorder.

**Independent Test**: Open template page → create/edit a template → exercises render with ExerciseCard styling, expand/collapse works, DnD reorder works for both exercises and sets, all field types editable, save persists all fields.

### Server Action — Expand Field Support

- [x] T006 [US1] Expand `CreateTemplateInput` type in `apps/web/actions/plans/session-plan-actions.ts` to include all TrainingSet fields (`tempo`, `effort`, `power`, `velocity`, `height`, `resistance`, `resistance_unit_id`, `metadata`) in the `sets` array
- [x] T007 [US1] Update `createTemplateAction` insert logic in `apps/web/actions/plans/session-plan-actions.ts` to write all TrainingSet fields to `session_plan_sets` table (not just 6 fields)
- [x] T008 [US1] Update `updateTemplateAction` upsert logic in `apps/web/actions/plans/session-plan-actions.ts` to write all TrainingSet fields to `session_plan_sets` table

### Template State Migration

- [x] T009 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: remove local `SelectedExercise` interface, import `TrainingExercise` and `TrainingSet` from `@/components/features/training/types`
- [x] T010 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: update template edit state from `SelectedExercise[]` to `TrainingExercise[]`, generating stable IDs for exercises and sets (e.g., `template-${exerciseId}-${Date.now()}`)
- [x] T011 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: update `populateEditState` to use `dbPlanSetToTrainingSet` mapper from `training/types.ts` instead of manual 6-field copy, and construct full `TrainingExercise` objects with `section` derived from `exerciseTypeId`
- [x] T012 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: replace index-based `handleUpdateSetField(exerciseIndex, setIndex, field, value)` with ID-based `handleUpdateSet(exerciseId, setId, field, value)` to match ExerciseCard's callback signature
- [x] T013 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: update save handler to convert `TrainingExercise[]` back to DB format using `trainingSetToDbPlanSet` mapper for all fields

### Replace TemplateExerciseBlock with ExerciseCard

- [x] T014 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: import `ExerciseCard` from `@/components/features/training/components/ExerciseCard` and remove/inline the local `TemplateExerciseBlock` component
- [x] T015 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: add expand/collapse state management (`expandedIds: Set<string | number>`) and wire `onToggleExpand` callback for each ExerciseCard
- [x] T016 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: wire ExerciseCard callbacks — `onAddSet`, `onRemoveSet`, `onRemoveExercise`, `onReorderSets` — adapting existing `useExerciseSetHandlers` to ID-based signatures
- [x] T017 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: add exercise DnD reorder — `draggingExerciseId` state, `handleExerciseDragStart/DragOver/DragEnd/Drop` handlers (same pattern as `WorkoutView.tsx` lines 343–359), pass `isDragging/onDragStart/onDragOver/onDragEnd/onDrop` to each ExerciseCard

### View Mode Fix

- [x] T018 [US1] In `apps/web/components/features/plans/components/templates-page.tsx`: replace raw HTML `<table>` in `TemplateDetailSheet` view mode with `ExerciseCard` components rendered in read-only mode (`isAthlete={false}`, no edit callbacks, expanded by default)

**Checkpoint**: Template edit mode uses ExerciseCard with all fields. DnD works for exercises and sets. View mode shows ExerciseCard (no raw table). Save/load round-trips all TrainingSet fields.

---

## Phase 3: US-2 — Template AI Parser (Priority: P2)

**Goal**: Add AI paste-to-parse button on the template page so coaches can create templates from pasted workout text.

**Independent Test**: Open template page → click AI gradient button → paste workout text → exercises parsed and populated in template edit state → save template with parsed exercises.

**Dependencies**: Requires US-1 completion (needs `TrainingExercise[]` state in templates).

- [x] T019 [US2] In `apps/web/components/features/plans/components/templates-page.tsx`: add `pasteProgramOpen` state and import `PasteProgramDialog` from `@/components/features/training/components/PasteProgramDialog`
- [x] T020 [US2] In `apps/web/components/features/plans/components/templates-page.tsx`: add `AnimatedGradientText`-styled AI button next to "New Template" button in the template page header, using `Sparkles` icon from lucide-react
- [x] T021 [US2] In `apps/web/components/features/plans/components/templates-page.tsx`: implement `handleAIParsedExercises` callback that converts `ResolvedExercise[]` → `TrainingExercise[]` (using mapper from quickstart.md) and either appends to current template or opens a new template with the parsed exercises
- [x] T022 [US2] In `apps/web/components/features/plans/components/templates-page.tsx`: render `PasteProgramDialog` component with `open={pasteProgramOpen}`, `onOpenChange={setPasteProgramOpen}`, `onExercisesResolved={handleAIParsedExercises}`

**Checkpoint**: AI gradient button visible on template page. Clicking opens PasteProgramDialog. Pasting workout text → exercises parsed → populate template exercise list. Save works with AI-parsed exercises.

---

## Phase 4: US-4 — Min/All Field Toggle Fix (Priority: P3)

**Goal**: Add field visibility toggle to template edit mode, ensure workout and plan toggles work consistently.

**Independent Test**: Template edit → toggle shows/hides advanced fields. Workout page → Min/All toggle changes visible columns. Plan page → Advanced toggle persists via localStorage.

**Dependencies**: Requires US-1 completion (needs ExerciseCard in templates to pass toggle prop).

- [x] T023 [US4] In `apps/web/components/features/plans/components/templates-page.tsx`: import `useAdvancedFieldsToggle` from `@/lib/hooks/useAdvancedFieldsToggle` and `AdvancedFieldsToggle` from the plans individual components
- [x] T024 [US4] In `apps/web/components/features/plans/components/templates-page.tsx`: add `AdvancedFieldsToggle` component to the `TemplateDetailSheet` edit mode header area, wire `showAdvancedFields` state
- [x] T025 [US4] In `apps/web/components/features/plans/components/templates-page.tsx`: pass `showAllFields={showAdvancedFields}` to each `ExerciseCard` in template edit mode so the toggle controls field visibility
- [x] T026 [US4] Verify `apps/web/components/features/training/views/WorkoutView.tsx` `showAllFields` toggle (lines 399–411) correctly toggles between Min (required + filled) and All (all configurable) modes — fix if not wired correctly through ExerciseCard's `forCoach` logic

**Checkpoint**: Template edit has an Advanced toggle that shows/hides velocity, tempo, power, etc. Workout Min/All toggle works. Plan Advanced toggle persists via localStorage. All three views consistent.

---

## Phase 5: US-3 — Alert/Notification Polish (Priority: P4)

**Purpose**: Standardize toast titles, replace browser alert() calls, add success variant styling.

**Dependencies**: Requires Phase 1 (toast store fix) to be complete.

- [x] T027 [P] [US3] In `apps/web/components/features/plans/home/PlansHomeClient.tsx`: replace `alert()` calls (lines 130, 133) with `toast()` using `useToast` hook, and replace `window.confirm()` (line 121) with a confirmation dialog or toast
- [x] T028 [P] [US3] In `apps/web/hooks/use-toast.ts`: add a `"success"` variant type alongside `"default"` and `"destructive"` — green background/check icon styling
- [x] T029 [P] [US3] In `apps/web/components/ui/toaster.tsx`: add rendering support for the `"success"` variant (green border/icon styling, matching the destructive variant pattern)
- [x] T030 [US3] Audit and standardize toast title casing across the app to sentence case — search for `toast({` calls with Title Case titles (e.g., `"Session Started"` → `"Session started"`, `"Save Failed"` → `"Save failed"`) in files under `apps/web/components/features/`

**Checkpoint**: No `alert()` calls remain. Toast titles are sentence case. Success toasts have green styling. Error toasts use destructive variant. All toasts auto-dismiss in ~5s.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification across all user stories.

- [ ] T031 Verify backward compatibility: load an existing saved template with only 6 fields → confirm it renders correctly with ExerciseCard (missing fields show as empty/null)
- [ ] T032 Verify template save round-trip: create template with advanced fields (tempo, effort, velocity) → save → reload → confirm all field values preserved
- [x] T033 Run `npm run build:web` to verify TypeScript compilation succeeds with all changes
- [x] T034 Run `git diff --stat` to verify scope — only expected files modified, no drift

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Toast Store Fix)**: No dependencies — start immediately
- **Phase 2 (US-1 Template Unification)**: Can start after Phase 1 (or in parallel if toast isn't touched)
- **Phase 3 (US-2 AI Parser)**: Depends on Phase 2 completion (needs TrainingExercise state)
- **Phase 4 (US-4 Field Toggle)**: Depends on Phase 2 completion (needs ExerciseCard in templates)
- **Phase 5 (US-3 Alert Polish)**: Depends on Phase 1 completion only
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

```
Phase 1 (Toast Fix) ──┬──→ Phase 2 (US-1) ──┬──→ Phase 3 (US-2)
                       │                      └──→ Phase 4 (US-4)
                       └──→ Phase 5 (US-3 Polish)
                                                    ↓
                                              Phase 6 (Polish)
```

- **US-1**: Core refactor — no dependency on other stories, but US-2 and US-4 depend on it
- **US-2**: Depends on US-1 (needs TrainingExercise state to append AI-parsed exercises)
- **US-3**: Phase 1 (foundational) is independent; Phase 5 (polish) is independent of other stories
- **US-4**: Depends on US-1 (needs ExerciseCard in templates for toggle to pass through)

### Parallel Opportunities

- **Phase 1**: T001–T005 can run sequentially (same file dependencies)
- **Phase 2**: T006–T008 (server actions) can run in parallel with T009–T013 (state migration)
- **Phase 3 + Phase 4**: Can run in parallel after Phase 2 (different features, different code paths within same file — but same file means sequential in practice)
- **Phase 5**: T027, T028, T029 are [P] — different files, can run in parallel
- **Phase 5 + Phase 3/4**: Phase 5 can run in parallel with Phase 3/4 since it touches different files

---

## Parallel Example: Phase 2 (US-1)

```bash
# Launch server action tasks in parallel (different functions in same file):
Task T006: "Expand CreateTemplateInput type in session-plan-actions.ts"
Task T007: "Update createTemplateAction insert logic in session-plan-actions.ts"
Task T008: "Update updateTemplateAction upsert logic in session-plan-actions.ts"

# Meanwhile, in parallel — state migration tasks (different file):
Task T009: "Remove SelectedExercise, import TrainingExercise in templates-page.tsx"
Task T010: "Update template edit state to TrainingExercise[] in templates-page.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2 = US-1 Only)

1. Complete Phase 1: Toast Store Fix (T001–T005) — ~15 min
2. Complete Phase 2: US-1 Template Unification (T006–T018) — ~2 hours
3. **STOP and VALIDATE**: Templates render with ExerciseCard, DnD works, all fields save
4. This is the core deliverable — everything else is incremental polish

### Incremental Delivery

1. Phase 1 + Phase 2 → Template Unification working (MVP!)
2. Add Phase 3 (US-2) → AI parser on template page
3. Add Phase 4 (US-4) → Field toggle in templates
4. Add Phase 5 (US-3) → Toast polish across app
5. Phase 6 → Final verification

### Single Developer Strategy

Execute phases sequentially: 1 → 2 → 3 → 4 → 5 → 6
Total: 34 tasks across 6 phases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `templates-page.tsx` is the most heavily modified file (US-1, US-2, US-4 all touch it) — coordinate carefully
- `session-plan-actions.ts` changes (T006–T008) are backward-compatible — existing 6-field payloads still work since new fields default to null
- No database migrations needed — all columns already exist in `session_plan_sets`
- Verify with `npm run build:web` after each phase to catch TypeScript errors early
