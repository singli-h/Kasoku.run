# Implementation Plan: AI Session Assistant V1

**Branch**: `002-ai-session-assistant` | **Date**: 2025-12-22 | **Spec**: Coach Domain Only
**Input**: Reference documents from `/specs/002-ai-session-assistant/reference/`

## Summary

Implement an AI-powered session planning assistant using the ChangeSet pattern. Coaches can converse with AI to add/update/delete exercises, review proposed changes in an approval workflow, and commit changes atomically to the database.

**Core Pattern**: Human-in-the-loop AI with proposal → approval → execution flow.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15
**Primary Dependencies**: Vercel AI SDK (`useChat`, `onToolCall`), React Context
**Storage**: Supabase (`session_plans`, `session_plan_exercises`, `session_plan_sets` tables)
**Testing**: Manual E2E testing for V1
**Target Platform**: Web (responsive, mobile-first)
**Project Type**: Web application (monorepo)
**Performance Goals**: Sub-second tool call handling
**Constraints**: Must integrate with existing `saveSessionWithExercisesAction`
**Scale/Scope**: Coach domain only (Athlete domain deferred to V2)

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Existing server action reuse | PASS | Uses `saveSessionWithExercisesAction` |
| No new database tables | PASS | Uses existing `session_plans`, `session_plan_exercises`, `session_plan_sets` tables |
| RLS compliance | PASS | All queries go through existing auth flow |
| ActionState pattern | PASS | Execution layer returns `ActionState<T>` |

## Architecture Overview

### ChangeSet Pattern

The AI Session Assistant implements a **human-in-the-loop** workflow:

```
User Request → AI Proposes → Buffer Accumulates → User Reviews → Execute → Database
```

**State Machine**: `building` → `pending_approval` → `executing` → `approved/failed`

**Key Design Decisions**:
1. **Keyed Buffer**: Map-based storage with last-write-wins (upsert) semantics
2. **Pause/Resume**: AI stream pauses at `confirmChangeSet()`, resumes after user decision
3. **Client-Side Tools**: Proposal tools execute client-side, update buffer immediately
4. **Server-Side Execution**: Database mutations via Server Actions only

### Tool Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Read Tools** | Fetch context for AI | `getSessionContext`, `searchExercises` |
| **Proposal Tools** | Build changeset | `create/update/deleteExerciseChangeRequest` |
| **Coordination Tools** | Control workflow | `confirmChangeSet`, `resetChangeSet` |

### UI Display Types vs Operation Types

The ChangeSet uses three operations: `create`, `update`, `delete`.

The UI derives a fourth display type `swap` for better UX:

| Operation | UI Display | Condition |
|-----------|------------|-----------|
| `create` | `add` | Always |
| `update` | `swap` | When `exercise_id` changes |
| `update` | `update` | When other fields change |
| `delete` | `remove` | Always |

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-session-assistant/
├── plan.md              # This file
├── tasks.md             # Implementation tasks (27 tasks, 10 phases)
└── reference/           # Detailed architecture documents (12 files)
    ├── 20251221-changeset-principles.md
    ├── 20251221-changeset-architecture.md
    ├── 20251221-changeset-execution-flow.md
    ├── 20251221-changeset-transformation-layer.md
    ├── 20251221-changeset-client-tools.md
    ├── 20251221-changeset-concurrency.md
    ├── 20251221-session-v1-vision.md
    ├── 20251221-session-entity-model.md
    ├── 20251221-session-tool-definitions.md
    ├── 20251221-session-tools-overview.md
    ├── 20251221-session-ui-integration.md
    └── 20251221-session-future-scope.md
```

### Source Code (after implementation)

```text
apps/web/
├── lib/changeset/
│   ├── types.ts                    # ChangeSet, ChangeRequest types
│   ├── parser.ts                   # parseChangeRequestToolName()
│   ├── buffer-utils.ts             # makeBufferKey(), temp ID generation
│   ├── ChangeSetContext.tsx        # React Context for buffer
│   ├── useChangeSet.ts             # Hook for buffer operations
│   ├── entity-mappings.ts          # Entity type → ID field mappings
│   ├── transformations.ts          # Tool input → ChangeRequest
│   ├── ui-helpers.ts               # deriveUIDisplayType()
│   ├── tool-handler.ts             # Client-side tool execution
│   ├── execute.ts                  # Server action adapter
│   ├── errors.ts                   # Error classification
│   ├── tools/
│   │   ├── read-tools.ts           # getSessionContext, searchExercises
│   │   ├── proposal-tools.ts       # ChangeRequest tools
│   │   ├── coordination-tools.ts   # confirmChangeSet, resetChangeSet
│   │   └── index.ts                # Tool registry
│   ├── tool-implementations/
│   │   └── read-impl.ts            # Read tool implementations
│   └── prompts/
│       └── session-planner.ts      # System prompt template
│
├── app/api/ai/session-assistant/
│   └── route.ts                    # AI streaming endpoint
│
└── components/features/ai-assistant/
    ├── ApprovalBanner.tsx          # Pending/Applied/Failed states
    ├── ChangePreview.tsx           # Inline change display
    ├── ChatDrawer.tsx              # AI conversation interface
    └── SessionAssistant.tsx        # Main container
```

## Key Integration Points

### 1. Existing Server Action

The execution layer adapts to the existing `saveSessionWithExercisesAction`:

```typescript
// apps/web/actions/plans/session-planner-actions.ts
export async function saveSessionWithExercisesAction(
  sessionId: number,
  sessionUpdates: Partial<Session>,
  exercises: SessionExercise[]
): Promise<ActionState<ExercisePresetGroup>>
```

**Adaptation Required**:
- Convert `ChangeRequest[]` to `SessionExercise[]` format
- Map temp IDs to real IDs for new exercises
- Extract session updates from session-level changes

### 2. Case Convention

Tools use **camelCase** (AI-friendly), database uses **snake_case**.

Transformation layer handles conversion:
- `exerciseOrder` → `exercise_order`
- `supersetId` → `superset_id`
- `exerciseId` → `exercise_id`
- `sessionPlanId` → `session_plan_id`
- `sessionPlanExerciseId` → `session_plan_exercise_id`

### 3. Entity ID Mappings

```typescript
const entityIdFields = {
  preset_session: 'presetGroupId',    // → session_plans.id
  preset_exercise: 'presetExerciseId', // → session_plan_exercises.id
  preset_set: 'presetDetailId'         // → session_plan_sets.id
}
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Case convention mismatch | Transformation layer with explicit mappings |
| Temp ID handling | Clear temp ID format (`ex_uuid`), ID resolution during execution |
| Stream pause/resume | Vercel AI SDK's `onToolCall` + `addToolResult` pattern |
| In-memory buffer loss | Accept for V1; sessionStorage backup as V1.1 enhancement |
| Demo component confusion | Keep demo as-is; new implementation in separate files |

## Success Criteria

From V1 Vision (`20251221-session-v1-vision.md`):

- [ ] Coach can ask AI to add/update/delete exercises
- [ ] AI proposes changes via tool calls
- [ ] Changes appear in approval banner
- [ ] Coach can approve → changes saved to DB
- [ ] Coach can regenerate → AI re-proposes with feedback
- [ ] Coach can dismiss → changes discarded
- [ ] Basic error handling (show message on failure)

## Reference Documents

### ChangeSet Pattern (Domain-Agnostic)

| Document | Purpose |
|----------|---------|
| `20251221-changeset-principles.md` | Core principles: autonomy with accountability, iterative correction |
| `20251221-changeset-architecture.md` | State machine, keyed buffer design, tool patterns |
| `20251221-changeset-execution-flow.md` | Approval → execution → commit flow |
| `20251221-changeset-transformation-layer.md` | Tool input → ChangeRequest conversion |
| `20251221-changeset-client-tools.md` | Client vs server tool execution patterns |
| `20251221-changeset-concurrency.md` | Optimistic locking, conflict handling |

### Session Assistant (Domain-Specific)

| Document | Purpose |
|----------|---------|
| `20251221-session-v1-vision.md` | V1 scope, success criteria |
| `20251221-session-entity-model.md` | Database table mappings (session_plans, session_plan_exercises, session_plan_sets, workout_logs, workout_log_exercises, workout_log_sets) |
| `20251221-session-tool-definitions.md` | Complete tool schemas (Coach + Athlete) |
| `20251221-session-tools-overview.md` | Quick reference summary of all tools |
| `20251221-session-ui-integration.md` | Component specs, visual design |
| `20251221-session-future-scope.md` | Out of scope items, future enhancements |

## Next Steps

See `tasks.md` for detailed implementation breakdown (27 tasks across 10 phases).

Critical path:
```
T001 (types) → T004 (context) → T007 (transform) → T010 (tools) →
T013 (handler) → T015 (execute) → T017 (API) → T019 (banner) →
T022 (container) → T023 (integration)
```
