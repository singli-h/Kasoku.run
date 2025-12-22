# AI Session Assistant: V1 Vision

**Purpose**: Define minimum viable implementation scope
**Feature**: 002-ai-session-assistant
**Status**: Ready for implementation

---

## Goal

Coach opens session planner → talks to AI → AI proposes changes → Coach approves → Changes saved.

---

## User Flow (Happy Path)

```
1. Coach opens /plans/[id]/session-planner
2. Coach: "Add leg press with 3 sets of 10 reps at 80kg"
3. AI calls:
   - createExerciseChangeRequest(...)
   - createSetChangeRequest(...) x3
   - confirmChangeSet(...)
4. UI shows approval banner: "3 Changes Pending" [Approve] [Regenerate] [Dismiss]
5. Coach clicks "Approve"
6. Changes saved to database
7. UI shows "Changes Applied"
```

## User Flow (Iterative Correction)

```
1. Coach: "Add leg press with 3 sets"
2. AI proposes changes → Banner shows [Approve] [Regenerate] [Dismiss]
3. Coach clicks "Regenerate" or types "Make it 4 sets instead"
4. ChangeSet returns to "building" state (changes cleared)
5. AI receives feedback, proposes new changes
6. Repeat until Coach approves or dismisses
```

**Key insight**: Conversation is ongoing, changeset just resets to building state.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| AI Streaming | Vercel AI SDK | `useChat`, `onToolCall` |
| Changeset Buffer | React Context | In-memory, keyed Map |
| Tool Execution | Client-side handlers | Proposal + coordination tools |
| Database | Supabase | Existing `exercise_preset_*` tables |
| Execution | Server Action | Wraps Supabase transaction |

---

## V1 Scope

### In Scope

| Feature | Notes |
|---------|-------|
| Coach domain (training plans) | `exercise_preset_*` tables |
| In-memory changeset buffer | Keyed Map, last-write-wins |
| Approval flow with feedback | Approve / Regenerate / Dismiss |
| Iterative correction | Regenerate clears buffer, AI re-proposes |
| Single changeset per conversation | One active at a time |
| Basic error display | Show error message on failure |
| Demo UI components | Adapt existing `components/features/ai-assistant/demo/` |

### Out of Scope (V1)

| Feature | Reason | Future Version |
|---------|--------|----------------|
| Athlete domain | Focus on coach first | V2 |
| Persistence for building state | In-memory is fine for MVP | V2 |
| Changeset history/audit UI | Not critical for core flow | V2 |
| Prompt engineering/optimization | Get it working first | Ongoing |
| Real-time conflict detection | Basic stale check is enough | V2 |

---

## What Needs to Be Built

### 1. Core Library (`lib/changeset/`)

```
lib/changeset/
├── types.ts                # ChangeSet, ChangeRequest types
├── ChangeSetContext.tsx    # React context for buffer
├── transformations.ts      # Tool input → ChangeRequest
├── parser.ts               # parseChangeRequestToolName
└── execute.ts              # Server action for DB transaction
```

### 2. API Route (`app/api/ai/session-assistant/route.ts`)

- Register tools (proposal + coordination + read)
- Basic system prompt
- Stream handling

### 3. Page Integration

```
app/(protected)/plans/[planId]/session-planner/
└── page.tsx
    ├── ChangeSetProvider wrapper
    ├── useChat with onToolCall handler
    └── ApprovalBanner component
```

### 4. Components (adapt from demo)

```
components/features/ai-assistant/
├── ApprovalBanner.tsx      # Pending/Applied/Failed states
├── ChatDrawer.tsx          # AI conversation interface
└── ChangePreview.tsx       # Show pending changes inline
```

---

## UI Display Types vs Operation Types

**Important**: The ChangeSet pattern uses three operation types: `create`, `update`, `delete`.

The demo UI uses a fourth display type `swap` for better UX. This is a **UI-only concept**:

| Operation Type | UI Display Type | Condition |
|----------------|-----------------|-----------|
| `create` | `add` | Always |
| `update` | `swap` | When `exercise_id` changes |
| `update` | `update` | When other fields change |
| `delete` | `remove` | Always |

### Derivation Logic

```typescript
function deriveUIDisplayType(request: ChangeRequest): 'add' | 'swap' | 'update' | 'remove' {
  if (request.operationType === 'create') return 'add'
  if (request.operationType === 'delete') return 'remove'

  // operationType === 'update'
  if (request.entityType === 'preset_exercise' &&
      request.proposedData?.exercise_id !== request.currentData?.exercise_id) {
    return 'swap'  // Exercise being replaced
  }

  return 'update'
}
```

### Demo Components

The demo components at `components/features/ai-assistant/demo/` use `swap` as a type.

**Do NOT modify demo components.** They serve as a reference prototype. When implementing:
1. Keep demo as-is for reference
2. New implementation derives `swap` display from `update` operations
3. ChangeSet pattern remains clean (only create/update/delete)

---

## Critical Path

```
1. Create ChangeSetContext with keyed buffer
2. Create transformation layer (tool input → ChangeRequest)
3. Create server action for execution
4. Wire up onToolCall handler
5. Integrate ApprovalBanner
6. Test end-to-end flow
```

---

## Success Criteria

- [ ] Coach can ask AI to add/update/delete exercises
- [ ] AI proposes changes via tool calls
- [ ] Changes appear in approval banner
- [ ] Coach can approve → changes saved to DB
- [ ] Coach can regenerate → AI re-proposes with feedback
- [ ] Coach can dismiss → changes discarded
- [ ] Basic error handling (show message on failure)

---

## References

- Architecture: `20251221-changeset-architecture.md`
- Execution Flow: `20251221-changeset-execution-flow.md`
- Client Tools: `20251221-changeset-client-tools.md`
- Concurrency: `20251221-changeset-concurrency.md`
- Tool Definitions: `20251221-session-tool-definitions.md`
- Entity Model: `20251221-session-entity-model.md`
- UI Integration: `20251221-session-ui-integration.md`
