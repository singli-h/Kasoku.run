# Tasks: AI Athlete Workout Assistant

**Input**: Design documents from `/specs/005-ai-athlete-workout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/athlete-tools.yaml

**Tests**: Manual E2E testing (matching 002-ai-session-assistant approach). No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: All paths relative to `apps/web/`
- Existing ChangeSet infrastructure: `lib/changeset/`
- AI assistant components: `components/features/ai-assistant/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create athlete-specific tools and API infrastructure that all user stories depend on

- [x] T001 [P] Create `createTrainingSetChangeRequest` tool schema in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [x] T002 [P] Create `updateTrainingSetChangeRequest` tool schema in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [x] T003 [P] Create `updateTrainingExerciseChangeRequest` tool schema in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [x] T004 [P] Create `updateTrainingSessionChangeRequest` tool schema in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [x] T005 Export `athleteProposalTools` object from `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [x] T006 Add `athleteDomainTools` export to `apps/web/lib/changeset/tools/index.ts` combining read tools, athlete proposal tools, and coordination tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API and context infrastructure that MUST be complete before ANY user story can be implemented

**WARNING**: No user story work can begin until this phase is complete

- [x] T007 Create `WorkoutContext` interface and `getWorkoutContext` implementation in `apps/web/lib/changeset/tool-implementations/workout-read-impl.ts`
- [x] T008 Create athlete system prompt in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [x] T009 Create API route at `apps/web/app/api/ai/workout-assistant/route.ts` with authentication and ownership verification
- [x] T010 Create `WorkoutAssistantWrapper` component at `apps/web/app/(protected)/workout/[id]/WorkoutAssistantWrapper.tsx` (Already integrated via SessionAssistant with domain='workout' in WorkoutSessionClient.tsx)
- [x] T011 Verify existing `execute-workout.ts` handles `workout_log_set` create/update operations correctly
- [x] T012 Update tool handler at `apps/web/lib/changeset/tool-handler.ts` if athlete-specific handling is needed (Updated parser.ts, transformations.ts, entity-mappings.ts to support athlete domain)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Athlete Logs Workout Performance (Priority: P1)

**Goal**: Athletes can describe their workout performance naturally and the system logs weights, reps, RPE to workout_log_sets

**Independent Test**:
1. Open workout page as athlete
2. Say "I did 8 reps at 100kg, felt like RPE 8"
3. Verify ChangeRequest appears with reps=8, weight=100, rpe=8
4. Click Approve
5. Verify data saved to workout_log_sets

### Implementation for User Story 1

- [x] T013 [US1] Wire up `WorkoutAssistantWrapper` in workout page at `apps/web/app/(protected)/workout/[id]/page.tsx` (Already integrated via WorkoutSessionClient.tsx)
- [x] T014 [US1] Ensure `createTrainingSetChangeRequest` tool receives correct `workoutLogExerciseId` from context (Context includes workoutLogExerciseId per exercise)
- [ ] T015 [US1] Test logging a single set: "I did 8 reps at 100kg"
- [ ] T016 [US1] Test logging multiple sets: "Log all my squats: 8 at 100, 8 at 105, 6 at 110"
- [ ] T017 [US1] Test updating a logged set: "Actually that last set was 10 reps not 8"
- [ ] T018 [US1] Test skipping a set: "I skipped set 3 of bench press" (completed=false)

**Checkpoint**: Athletes can log and update set performance via natural language

---

## Phase 4: User Story 2 - Athlete Modifies Own Assigned Session (Priority: P1)

**Goal**: Athletes can swap exercises, adjust weights, and add exercises to their assigned sessions

**Independent Test**:
1. Open workout page with assigned squats
2. Say "I need to swap squats for leg press, my knee is bothering me"
3. Verify swap ChangeRequest appears
4. Click Approve
5. Verify exercise swapped in workout_log_exercises

### Implementation for User Story 2

- [x] T019 [P] [US2] Create `createTrainingExerciseChangeRequest` tool schema in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts` for adding exercises (Already created in T001-T005)
- [x] T020 [US2] Verify `execute-workout.ts` handles `workout_log_exercise` update operations for swaps (Implemented in execute-workout.ts + workout-exercise-actions.ts)
- [ ] T021 [US2] Test swapping an exercise: "Swap squats for leg press"
- [ ] T022 [US2] Test adjusting weights: "Reduce all my weights by 10% today"
- [ ] T023 [US2] Test adding an exercise: "Add 3 sets of face pulls at the end"

**Checkpoint**: Athletes can modify their sessions (swap, adjust, add)

---

## Phase 5: User Story 3 - Athlete Searches for Exercise Alternatives (Priority: P2)

**Goal**: Athletes can search for alternative exercises based on constraints like equipment or injury considerations

**Independent Test**:
1. Open workout page
2. Say "Find me a quad exercise that's easy on the knees"
3. Verify search results are returned
4. Say "Use that one instead"
5. Verify swap ChangeRequest is created

### Implementation for User Story 3

- [x] T024 [US3] Verify `searchExercises` tool from coach domain works in athlete context (Included in athleteDomainTools via readTools)
- [x] T025 [US3] Update system prompt to guide AI on exercise search + swap workflow (Already in workout-athlete.ts)
- [ ] T026 [US3] Test searching with injury constraint: "Find quad exercise easy on knees"
- [ ] T027 [US3] Test searching with equipment constraint: "What can I do instead of cable rows? Only have dumbbells"
- [ ] T028 [US3] Test chained search-then-swap: "Use that one instead" after search

**Checkpoint**: Athletes can discover and apply exercise alternatives

---

## Phase 6: User Story 4 - Athlete Adds Session Notes (Priority: P2)

**Goal**: Athletes can add notes and feedback about their workout through natural conversation

**Independent Test**:
1. Complete a workout
2. Say "That session felt great, really hit the groove on deadlifts"
3. Verify note ChangeRequest appears
4. Click Approve
5. Verify note saved to workout_logs.notes

### Implementation for User Story 4

- [x] T029 [US4] Ensure `updateTrainingSessionChangeRequest` correctly updates `workout_logs.notes` (Implemented via updateWorkoutNotesAction)
- [x] T030 [US4] Verify `execute-workout.ts` handles `workout_log` update operations (Implemented applyWorkoutLogChange function)
- [ ] T031 [US4] Test adding a positive note: "That session felt great"
- [ ] T032 [US4] Test flagging an issue: "My shoulder was clicking during overhead press"

**Checkpoint**: Athletes can capture session feedback via conversation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Add error handling for ambiguous exercise names in system prompt
- [ ] T034 [P] Add validation to prevent modifications to completed sessions
- [ ] T035 [P] Add helpful error messages when athlete doesn't own workout
- [ ] T036 [P] Verify inline change indicators work with workout entity types
- [ ] T037 Run quickstart.md validation (manual E2E test of all scenarios)

---

## Phase 8: P2 Enhancements (Optional)

**Purpose**: P2-priority features deferred from initial implementation

- [ ] T038 [P2] Create `getExerciseHistory` tool in `apps/web/lib/changeset/tool-implementations/workout-read-impl.ts`
- [ ] T039 [P2] Add `getExerciseHistory` to `athleteDomainTools` in `apps/web/lib/changeset/tools/index.ts`
- [ ] T040 [P2] Implement coach permission checking in API route
- [ ] T041 [P2] Add UI indicator when coach has restricted modifications

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 - can proceed in parallel or sequentially
  - US3 and US4 are P2 - can start after P1 stories or in parallel
- **Polish (Phase 7)**: Depends on all P1 user stories being complete
- **P2 Enhancements (Phase 8)**: Optional, can be done anytime after Polish

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Independent from US1
- **User Story 3 (P2)**: Can start after Foundational - Builds on US2 (swap workflow)
- **User Story 4 (P2)**: Can start after Foundational - Independent from other stories

### Parallel Opportunities

**Phase 1 (All parallel):**
```bash
Task: T001 createTrainingSetChangeRequest tool
Task: T002 updateTrainingSetChangeRequest tool
Task: T003 updateTrainingExerciseChangeRequest tool
Task: T004 updateTrainingSessionChangeRequest tool
```

**Phase 2 (Mixed):**
```bash
# Parallel:
Task: T007 workout-read-impl.ts
Task: T008 workout-athlete.ts prompt

# Sequential after above:
Task: T009 API route (needs tools + prompt)
Task: T010 Wrapper component
```

**After Foundational - User Stories in Parallel:**
```bash
# Developer A: User Story 1
Task: T013-T018 (set logging)

# Developer B: User Story 2
Task: T019-T023 (session modification)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (tools)
2. Complete Phase 2: Foundational (API + wrapper)
3. Complete Phase 3: User Story 1 (set logging)
4. **STOP and VALIDATE**: Test logging performance independently
5. Demo: "Athletes can log their workout performance via natural language"

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (Set Logging) → MVP!
3. Add User Story 2 (Session Modification) → Enhanced MVP
4. Add User Story 3 (Exercise Search) → Full athlete autonomy
5. Add User Story 4 (Session Notes) → Complete feedback loop
6. Polish → Production ready

### Critical Path

```
T001-T005 (tools) → T006 (export) → T007-T008 (impl) → T009 (API) →
T010 (wrapper) → T013 (page integration) → US1 complete
```

---

## Task Summary

| Category | Count | Tasks |
|----------|-------|-------|
| Setup | 6 | T001-T006 |
| Foundational | 6 | T007-T012 |
| User Story 1 (P1) | 6 | T013-T018 |
| User Story 2 (P1) | 5 | T019-T023 |
| User Story 3 (P2) | 5 | T024-T028 |
| User Story 4 (P2) | 4 | T029-T032 |
| Polish | 5 | T033-T037 |
| P2 Enhancements | 4 | T038-T041 |
| **Total** | **41** | |

### By Priority

| Priority | Stories | Tasks |
|----------|---------|-------|
| P1 | US1, US2 | 11 |
| P2 | US3, US4 | 9 |
| Foundation | Setup + Foundational | 12 |
| Polish/Optional | Polish + P2 Enhancements | 9 |

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- T015-T018, T021-T023, T026-T028, T031-T032 are E2E test scenarios (manual testing)
- This feature heavily reuses existing 002-ai-session-assistant infrastructure (16 components)
- New code is minimal: 6 new files, 3 modified files
- MVP (US1 only) delivers core value: natural language workout logging
