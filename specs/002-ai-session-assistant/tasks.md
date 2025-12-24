# Tasks: AI Session Assistant V1 (Coach Domain)

**Input**: Reference documents from `/specs/002-ai-session-assistant/reference/`
**Scope**: Coach domain (Training Plans) only - Athlete domain deferred to V2
**Tech Stack**: Next.js 15, Vercel AI SDK, React Context, Supabase
**Constraint**: Must integrate with existing `saveSessionWithExercisesAction` in `apps/web/actions/plans/session-planner-actions.ts`
**Database Tables**: `session_plans`, `session_plan_exercises`, `session_plan_sets` (Coach); `workout_logs`, `workout_log_exercises`, `workout_log_sets` (Athlete V2)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Core Types & Infrastructure)

**Purpose**: Establish foundational types and project structure

- [x] T001 Create ChangeSet types in `apps/web/lib/changeset/types.ts`
  - `ChangeSet`, `ChangeSetStatus`, `ChangeRequest`, `OperationType`
  - See reference: `20251221-changeset-architecture.md` section 3

- [x] T002 [P] Create tool name parser in `apps/web/lib/changeset/parser.ts`
  - `parseChangeRequestToolName()` function
  - Regex: `/^(create|update|delete)(\w+)ChangeRequest$/`
  - See reference: `20251221-changeset-architecture.md` section 4.4

- [x] T003 [P] Create buffer key utilities in `apps/web/lib/changeset/buffer-utils.ts`
  - `makeBufferKey(entityType, entityId)`
  - Temp ID generation for creates
  - See reference: `20251221-changeset-architecture.md` section 2

**Checkpoint**: Core types defined, ready for context implementation

---

## Phase 2: ChangeSet Context (Buffer Management)

**Purpose**: Implement React Context for in-memory keyed buffer

- [x] T004 Create ChangeSetContext in `apps/web/lib/changeset/ChangeSetContext.tsx`
  - Keyed Map buffer with upsert semantics (last-write-wins)
  - State: `status`, `changeRequests`, `title`, `description`
  - Methods: `upsert()`, `remove()`, `clear()`, `snapshot()`
  - See reference: `20251221-changeset-architecture.md` section 2

- [x] T005 Create useChangeSet hook in `apps/web/lib/changeset/useChangeSet.ts`
  - Expose buffer operations
  - Expose status management
  - `getPendingCount()`, `getChangesByEntity()`

**Checkpoint**: Buffer management complete, can accumulate changes

---

## Phase 3: Transformation Layer (Tool Input → ChangeRequest)

**Purpose**: Convert AI tool calls to standard ChangeRequest format

- [x] T006 Create entity ID field mappings in `apps/web/lib/changeset/entity-mappings.ts`
  - Map entity types to their ID field names
  - `preset_session` → `presetGroupId` (maps to `session_plans.id`)
  - `preset_exercise` → `presetExerciseId` (maps to `session_plan_exercises.id`)
  - `preset_set` → `presetDetailId` (maps to `session_plan_sets.id`, identified by exerciseId + setIndex in tools)
  - Include camelCase → snake_case column mappings (e.g., `exerciseOrder` → `exercise_order`)
  - See reference: `20251221-changeset-transformation-layer.md`

- [x] T007 Create transformation functions in `apps/web/lib/changeset/transformations.ts`
  - `transformToolInput(entityType, operationType, toolInput): ChangeRequest`
  - Extract entity ID based on operation type
  - Build proposedData (exclude metadata fields)
  - Handle case conversion: camelCase → snake_case
  - See reference: `20251221-changeset-transformation-layer.md`

- [x] T008 Create UI display type derivation in `apps/web/lib/changeset/ui-helpers.ts`
  - `deriveUIDisplayType(request): 'add' | 'swap' | 'update' | 'remove'`
  - Swap detection: when `exercise_id` changes on update
  - See reference: `20251221-session-v1-vision.md` section "UI Display Types"

**Checkpoint**: Tool inputs can be transformed to ChangeRequests

---

## Phase 4: AI Tool Definitions (Coach Domain)

**Purpose**: Define Vercel AI SDK tool schemas for coach domain

- [x] T009 Create read tool schemas in `apps/web/lib/changeset/tools/read-tools.ts`
  - `getSessionContext` - returns session with exercises and sets
  - `searchExercises` - search exercise library
  - See reference: `20251221-session-tool-definitions.md` sections "Read Tools" and "Shared Tools"

- [x] T010 [P] Create proposal tool schemas in `apps/web/lib/changeset/tools/proposal-tools.ts`
  - Session: `createSessionChangeRequest`, `updateSessionChangeRequest`
  - Exercise: `createExerciseChangeRequest`, `updateExerciseChangeRequest`, `deleteExerciseChangeRequest`
  - Set: `createSetChangeRequest`, `updateSetChangeRequest`, `deleteSetChangeRequest`
  - See reference: `20251221-session-tool-definitions.md` section "Domain 1"

- [x] T011 [P] Create coordination tool schemas in `apps/web/lib/changeset/tools/coordination-tools.ts`
  - `confirmChangeSet` - submit for approval
  - `resetChangeSet` - clear buffer
  - See reference: `20251221-session-tool-definitions.md` section "Coordination Tools"

- [x] T012 Create tool registry in `apps/web/lib/changeset/tools/index.ts`
  - Export all tools as single object for API route
  - Filter by domain (coach-only for V1)

**Checkpoint**: All AI tools defined, ready for API route

---

## Phase 5: Tool Handlers (Client-Side Execution)

**Purpose**: Handle tool calls on client, manage pause/resume

- [x] T013 Create tool handler in `apps/web/lib/changeset/tool-handler.ts`
  - `handleToolCall(toolName, args, context): ToolResult | 'PAUSE'`
  - Proposal tools: transform → upsert to buffer → return success
  - `confirmChangeSet`: show approval widget → return 'PAUSE'
  - `resetChangeSet`: clear buffer → return success
  - See reference: `20251221-changeset-architecture.md` section 4.4

- [x] T014 Create read tool implementations in `apps/web/lib/changeset/tool-implementations/read-impl.ts`
  - `executeGetSessionContext(sessionId)` - fetch from Supabase
  - `executeSearchExercises(query, filters)` - search exercises table
  - Format response for AI consumption

**Checkpoint**: Tool calls can be handled client-side

---

## Phase 6: Execution Layer (Server Action)

**Purpose**: Apply approved changes to database atomically

- [x] T015 Create execution action adapter in `apps/web/lib/changeset/execute.ts`
  - `executeChangeSet(changeset): Promise<ExecutionResult>`
  - Convert ChangeRequests to `SessionExercise[]` format
  - Call existing `saveSessionWithExercisesAction`
  - Handle temp ID → real ID mapping for new exercises
  - See reference: `20251221-changeset-execution-flow.md`

- [x] T016 Create error classification in `apps/web/lib/changeset/errors.ts`
  - `ExecutionError` type with `TRANSIENT`, `LOGIC_DATA`, `STALE_STATE`, `CRITICAL`
  - `classifyError(error): ErrorType`
  - See reference: `20251221-changeset-architecture.md` section 8

**Checkpoint**: Approved changes can be saved to database

---

## Phase 7: API Route (AI Streaming)

**Purpose**: Create API endpoint for AI chat with tool calling

- [x] T017 Create chat API route in `apps/web/app/api/ai/session-assistant/route.ts`
  - Use Vercel AI SDK `streamText`
  - Register all coach domain tools
  - Basic system prompt for session planning
  - Include session context in system prompt
  - See reference: `20251221-session-v1-vision.md` section "Tech Stack"

- [x] T018 Create system prompt template in `apps/web/lib/changeset/prompts/session-planner.ts`
  - Define coach persona
  - Explain available tools
  - Instruction to always call `confirmChangeSet` after proposing

**Checkpoint**: AI endpoint ready for client integration

---

## Phase 8: UI Components (Approval Flow)

**Purpose**: Build UI for change visualization and approval

- [x] T019 Create ApprovalBanner component in `apps/web/components/features/ai-assistant/ApprovalBanner.tsx`
  - States: pending, executing, applied, failed
  - Buttons: Approve, Regenerate, Dismiss
  - Show change count
  - See reference: `20251221-session-ui-integration.md` section "Approval Banner"

- [x] T020 [P] Create ChangePreview component in `apps/web/components/features/ai-assistant/ChangePreview.tsx`
  - Transform ChangeRequest → UI display
  - Visual indicators for add/swap/update/remove
  - Show AI reasoning
  - See reference: `20251221-session-ui-integration.md` section "Change Type Visualization"

- [x] T021 [P] Create ChatDrawer component in `apps/web/components/features/ai-assistant/ChatDrawer.tsx`
  - Use Vaul for drawer behavior
  - Message history display
  - Input at bottom
  - Streaming response display
  - See reference: `20251221-session-ui-integration.md` section "Chat Drawer"

**Checkpoint**: UI components ready for page integration

---

## Phase 9: Page Integration

**Purpose**: Wire everything together on session planner page

- [ ] T022 Create SessionAssistant container in `apps/web/components/features/ai-assistant/SessionAssistant.tsx`
  - Wrap with ChangeSetProvider
  - Integrate useChat from Vercel AI SDK
  - Wire onToolCall to tool handler
  - Manage pause/resume via addToolResult
  - See reference: `20251221-changeset-architecture.md` section 5

- [ ] T023 Integrate AI assistant into session planner page
  - File: `apps/web/app/(protected)/plans/[planId]/session-planner/page.tsx`
  - Add ChatDrawer trigger button
  - Add ApprovalBanner (sticky bottom)
  - Pass session context to AI
  - Handle approval → execute → refresh

**Checkpoint**: End-to-end flow working on session planner page

---

## Phase 10: Polish & Error Handling

**Purpose**: Robustness and edge case handling

- [ ] T024 Add loading states throughout
  - ChatDrawer: streaming indicator
  - ApprovalBanner: executing spinner
  - Exercise cards: optimistic updates

- [ ] T025 [P] Add error handling UI
  - Failed execution: show error in banner
  - Network errors: retry option
  - Stale data: refresh prompt

- [ ] T026 [P] Add session storage backup for buffer
  - Persist buffer to sessionStorage
  - Restore on page refresh (optional V1.1)

- [ ] T027 Manual E2E testing
  - Test happy path: add exercise → approve → saved
  - Test regenerate flow: propose → regenerate → new proposal
  - Test dismiss flow: propose → dismiss → cleared
  - Test error recovery: simulate stale data

**Checkpoint**: Production-ready for coach domain

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ├─── T001 types.ts (FIRST - other tasks depend on types)
    │
    └─── T002, T003 can run in parallel after T001
           │
           ▼
Phase 2 (Context) ─── depends on Phase 1
    │
    └─── T004 → T005 (sequential)
           │
           ▼
Phase 3 (Transform) ─── depends on Phase 1
    │
    └─── T006 → T007 → T008 (sequential)
           │
           ▼
Phase 4 (Tools) ─── depends on Phase 1
    │
    ├─── T009, T010, T011 can run in parallel
    │
    └─── T012 depends on T009-T011
           │
           ▼
Phase 5 (Handlers) ─── depends on Phase 2, 3, 4
    │
    └─── T013 → T014 (sequential)
           │
           ▼
Phase 6 (Execution) ─── depends on Phase 1
    │
    └─── T015 → T016 (sequential)
           │
           ▼
Phase 7 (API) ─── depends on Phase 4, 5
    │
    └─── T017 → T018 (sequential)
           │
           ▼
Phase 8 (UI) ─── depends on Phase 2
    │
    └─── T019, T020, T021 can run in parallel
           │
           ▼
Phase 9 (Integration) ─── depends on ALL above
    │
    └─── T022 → T023 (sequential)
           │
           ▼
Phase 10 (Polish) ─── depends on Phase 9
    │
    └─── T024, T025, T026 can run in parallel
    │
    └─── T027 depends on all Phase 10 tasks
```

### Critical Path

The minimum path to first working demo:

```
T001 → T004 → T007 → T010 → T013 → T015 → T017 → T019 → T022 → T023
```

---

## Parallel Execution Examples

### After Phase 1 completes:

```bash
# Phase 2, 3, 4 can start in parallel (different directories)
Task: "Create ChangeSetContext in apps/web/lib/changeset/ChangeSetContext.tsx"
Task: "Create transformation functions in apps/web/lib/changeset/transformations.ts"
Task: "Create proposal tool schemas in apps/web/lib/changeset/tools/proposal-tools.ts"
```

### Phase 8 UI components:

```bash
# All three can run in parallel (different files)
Task: "Create ApprovalBanner component"
Task: "Create ChangePreview component"
Task: "Create ChatDrawer component"
```

---

## Success Criteria (from V1 Vision)

- [ ] Coach can ask AI to add/update/delete exercises
- [ ] AI proposes changes via tool calls
- [ ] Changes appear in approval banner
- [ ] Coach can approve → changes saved to DB
- [ ] Coach can regenerate → AI re-proposes with feedback
- [ ] Coach can dismiss → changes discarded
- [ ] Basic error handling (show message on failure)

---

## File Structure After Implementation

```
apps/web/
├── lib/changeset/
│   ├── types.ts                    # T001
│   ├── parser.ts                   # T002
│   ├── buffer-utils.ts             # T003
│   ├── ChangeSetContext.tsx        # T004
│   ├── useChangeSet.ts             # T005
│   ├── entity-mappings.ts          # T006
│   ├── transformations.ts          # T007
│   ├── ui-helpers.ts               # T008
│   ├── tool-handler.ts             # T013
│   ├── execute.ts                  # T015
│   ├── errors.ts                   # T016
│   ├── tools/
│   │   ├── read-tools.ts           # T009
│   │   ├── proposal-tools.ts       # T010
│   │   ├── coordination-tools.ts   # T011
│   │   └── index.ts                # T012
│   ├── tool-implementations/
│   │   └── read-impl.ts            # T014
│   └── prompts/
│       └── session-planner.ts      # T018
│
├── app/api/ai/session-assistant/
│   └── route.ts                    # T017
│
└── components/features/ai-assistant/
    ├── ApprovalBanner.tsx          # T019
    ├── ChangePreview.tsx           # T020
    ├── ChatDrawer.tsx              # T021
    └── SessionAssistant.tsx        # T022
```

---

## Notes

- [P] tasks = different files, no dependencies
- Each phase has a checkpoint for validation
- Existing `saveSessionWithExercisesAction` is reused (not replaced)
- Demo components in `demo/` folder remain untouched (reference only)
- Athlete domain (V2) will follow same pattern with different entity types
