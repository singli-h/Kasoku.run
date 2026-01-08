# Tasks: ChangeSet Prompt Alignment

**Input**: Design documents from `/specs/009-changeset-prompt-alignment/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested - manual testing via AI chat interface per spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: `apps/web/` (Next.js monorepo)
- **Changeset module**: `apps/web/lib/changeset/`

---

## Phase 1: Setup (Discovery)

**Purpose**: Understand existing code structure and identify all files requiring changes

- [ ] T001 Search for all tool definition files in `apps/web/lib/changeset/` using grep for current tool names
- [ ] T002 Identify all imports of `buildSystemPrompt` across the codebase
- [ ] T003 Review transformation layer structure in `apps/web/lib/changeset/tool-implementations/`

---

## Phase 2: Foundational (No blocking prerequisites)

**Purpose**: This feature is a refactoring task - no new infrastructure needed

**Note**: All user stories can proceed after Phase 1 discovery is complete.

---

## Phase 3: User Story 1 - Consistent Tool Naming (Priority: P1) 🎯 MVP

**Goal**: Align all AI assistant tool names with database entity names (SessionPlan*, WorkoutLog*)

**Independent Test**: Have the AI propose changes in both domains and verify tool names match database entities

### Implementation for User Story 1

- [ ] T004 [P] [US1] Rename coach tools in AVAILABLE_TOOLS constant in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T005 [P] [US1] Rename coach tools in WORKFLOW_INSTRUCTIONS and examples in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T006 [P] [US1] Rename athlete tools in AVAILABLE_TOOLS constant in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T007 [P] [US1] Rename athlete tools in WORKFLOW_INSTRUCTIONS and examples in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T008 [US1] Rename `buildSystemPrompt()` to `buildCoachSystemPrompt()` in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T009 [US1] Update all imports of `buildSystemPrompt` to `buildCoachSystemPrompt` across codebase
- [ ] T010 [P] [US1] Update tool definitions in coach tool definition files (if separate from prompts)
- [ ] T011 [P] [US1] Update tool definitions in athlete tool definition files (if separate from prompts)

**Tool Naming Reference:**

Coach Domain:
| Current | New |
|---------|-----|
| `createExerciseChangeRequest` | `createSessionPlanExerciseChangeRequest` |
| `updateExerciseChangeRequest` | `updateSessionPlanExerciseChangeRequest` |
| `deleteExerciseChangeRequest` | `deleteSessionPlanExerciseChangeRequest` |
| `createSetChangeRequest` | `createSessionPlanSetChangeRequest` |
| `updateSetChangeRequest` | `updateSessionPlanSetChangeRequest` |
| `deleteSetChangeRequest` | `deleteSessionPlanSetChangeRequest` |
| `updateSessionChangeRequest` | `updateSessionPlanChangeRequest` |

Athlete Domain:
| Current | New |
|---------|-----|
| `createTrainingExerciseChangeRequest` | `createWorkoutLogExerciseChangeRequest` |
| `updateTrainingExerciseChangeRequest` | `updateWorkoutLogExerciseChangeRequest` |
| `createTrainingSetChangeRequest` | `createWorkoutLogSetChangeRequest` |
| `updateTrainingSetChangeRequest` | `updateWorkoutLogSetChangeRequest` |
| `updateTrainingSessionChangeRequest` | `updateWorkoutLogChangeRequest` |

**Checkpoint**: At this point, all tool names should match database entities. Test by verifying AI responses use correct tool names.

---

## Phase 4: User Story 2 - Delete Tools for Athletes (Priority: P2)

**Goal**: Athletes can remove proposed changes from the changeset buffer before confirmation

**Independent Test**: Propose multiple changes, remove one, confirm only remaining changes are submitted

### Implementation for User Story 2

- [ ] T012 [US2] Add delete tool descriptions to AVAILABLE_TOOLS in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T013 [US2] Add delete tool definitions for `deleteWorkoutLogExerciseChangeRequest` in tool definition files
- [ ] T014 [US2] Add delete tool definitions for `deleteWorkoutLogSetChangeRequest` in tool definition files
- [ ] T015 [US2] Implement temp-ID check in transformation layer in `apps/web/lib/changeset/tool-implementations/`
- [ ] T016 [US2] Add rejection message for real-ID delete attempts: "Deleting logged workout data is not allowed. To mark as incomplete, use updateWorkoutLogSetChangeRequest with completed: false instead."

**Transformation Layer Logic:**
```
IF entityId.startsWith('temp-')
  THEN remove from buffer (allowed)
ELSE
  THEN reject with guidance message
```

**Checkpoint**: At this point, athletes can remove individual proposals. Test by proposing, removing, and confirming.

---

## Phase 5: User Story 3 - Goal-Oriented Prompts (Priority: P3)

**Goal**: AI responses focus on goals rather than procedural step-by-step instructions

**Independent Test**: Review AI responses to verify they focus on outcomes, not procedures

### Implementation for User Story 3

- [ ] T017 [P] [US3] Refactor PERSONA to goal-oriented format in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T018 [P] [US3] Refactor PERSONA to goal-oriented format in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T019 [P] [US3] Replace WORKFLOW_INSTRUCTIONS with CONSTRAINTS section in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T020 [P] [US3] Replace WORKFLOW_INSTRUCTIONS with CONSTRAINTS section in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T021 [P] [US3] Add SOFT_GUIDANCE section in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T022 [P] [US3] Add SOFT_GUIDANCE section in `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T023 [P] [US3] Remove `buildRejectionFollowUpPrompt()` function from `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T024 [P] [US3] Remove `buildRejectionFollowUpPrompt()` function from `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T025 [P] [US3] Remove `buildExecutionFailurePrompt()` function from `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T026 [P] [US3] Remove `buildExecutionFailurePrompt()` function from `apps/web/lib/changeset/prompts/workout-athlete.ts`
- [ ] T027 [US3] Update prompt builder to use new section structure in `apps/web/lib/changeset/prompts/session-planner.ts`
- [ ] T028 [US3] Update prompt builder to use new section structure in `apps/web/lib/changeset/prompts/workout-athlete.ts`

**New Prompt Structure:**
```
PERSONA (goal-oriented)
CONSTRAINTS (must-follow rules)
SOFT_GUIDANCE (principles, adapt to context)
DOMAIN_KNOWLEDGE (business rules - keep existing)
CONTEXT_SECTION (dynamic)
```

**Checkpoint**: All prompts should be goal-oriented with no step-by-step procedures. Test by reviewing AI responses.

---

## Phase 6: Polish & Verification

**Purpose**: Final validation and cleanup

- [ ] T029 Verify all coach tools use `SessionPlan` prefix
- [ ] T030 Verify all athlete tools use `WorkoutLog` prefix
- [ ] T031 Verify delete tools work for temp-IDs and reject real-IDs
- [ ] T032 Verify no step-by-step procedural instructions remain in prompts
- [ ] T033 Run quickstart.md verification checklist
- [ ] T034 Manual testing: Coach domain - add/update/delete exercises and sets
- [ ] T035 Manual testing: Athlete domain - log sets, remove proposal, attempt delete saved data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: N/A for this feature
- **User Story 1 (Phase 3)**: Depends on Setup (discovery) completion
- **User Story 2 (Phase 4)**: Can run in parallel with US1 (different functionality)
- **User Story 3 (Phase 5)**: Should complete after US1 (tool names settled before prompt restructure)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - can start after Phase 1
- **User Story 2 (P2)**: Independent - can start after Phase 1
- **User Story 3 (P3)**: Recommend after US1 (tool names should be finalized first)

### Within Each User Story

- Coach and athlete prompt files can be edited in parallel (marked [P])
- Within a single file, changes should be sequential to avoid conflicts

### Parallel Opportunities

**US1 Parallel Tasks:**
- T004, T005 (coach file) can run with T006, T007 (athlete file)
- T010, T011 (tool definitions) can run in parallel

**US3 Parallel Tasks:**
- All tasks marked [P] in Phase 5 can run in parallel (different files or independent changes)

---

## Parallel Example: User Story 1

```bash
# Launch coach and athlete tool renaming in parallel:
Task: "T004 - Rename coach tools in AVAILABLE_TOOLS"
Task: "T006 - Rename athlete tools in AVAILABLE_TOOLS"

# Then launch workflow/example updates:
Task: "T005 - Rename coach tools in WORKFLOW_INSTRUCTIONS"
Task: "T007 - Rename athlete tools in WORKFLOW_INSTRUCTIONS"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (discovery)
2. Complete Phase 3: User Story 1 (tool naming)
3. **STOP and VALIDATE**: Verify tool names match database entities
4. This alone provides clearer, more maintainable code

### Incremental Delivery

1. Complete Setup → Discovery complete
2. Add User Story 1 → Tool naming aligned → Clearer AI responses
3. Add User Story 2 → Delete tools added → Athletes can remove proposals
4. Add User Story 3 → Goal-oriented prompts → More natural AI interactions
5. Each story adds value independently

### Recommended Order

Given the nature of this refactoring:
1. **US1 first**: Establishes naming convention before other changes
2. **US2 second**: Adds functionality (delete tools) using new naming
3. **US3 third**: Restructures prompts with final tool names in place

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Manual testing via AI chat interface (no automated tests per spec)
- Commit after each phase or logical group
- Reference `quickstart.md` for detailed implementation guidance
- Reference `research.md` for decision rationale
