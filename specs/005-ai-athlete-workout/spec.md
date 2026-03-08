# Feature Specification: AI Athlete Workout Assistant

**Feature Branch**: `005-ai-athlete-workout`
**Created**: 2026-01-01
**Status**: Draft
**Parent Feature**: 002-ai-session-assistant (Coach version)
**Architecture Reference**: `specs/002-ai-session-assistant/reference/`

---

## Overview

An AI-powered assistant that enables **athletes** to modify their assigned workout sessions using natural language. The assistant proposes changes through a **human-in-the-loop approval workflow** (ChangeSet pattern) before committing to the database.

This feature extends the AI Session Assistant (002) from the Coach domain to the Athlete domain, following the same architectural principles and patterns.

**Key Differentiators:**
- **ChangeSet Pattern**: AI proposes changes → User reviews → Approve/Reject → Execute
- **Batch Approval**: Multiple changes reviewed and approved together
- **Natural Language Processing**: Converts unstructured athlete input into structured database operations
- **Permission Boundaries**: Athletes can only modify their own assigned sessions within coach-defined guardrails

---

## Scope

**This Feature**: Athlete domain (Workout execution)

| In Scope | Out of Scope |
|----------|--------------|
| Athlete logs workout performance (US-001) | Coach template modification (002-ai-session-assistant) |
| Athlete modifies own assigned session (US-004) | Plan generation or bulk assignment |
| Athlete searches for exercise alternatives (US-005) | Creating new sessions from scratch |
| Performance data entry via natural language | Modifying other athletes' sessions |
| Session notes and feedback logging | Voice input/output |
| Exercise alternatives with constraints | Conversation persistence (V2) |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Athlete Logs Workout Performance (Priority: P1)

An athlete describes their workout performance naturally, and the system parses and logs weights, reps, RPE to `workout_log_sets`.

**Target Audience**: Athlete only

**Target Database Tables**:
- `workout_log_sets` - CREATE/UPDATE (actual performance data)
- `workout_logs` - UPDATE (session status, notes)

**Why this priority**: Core value proposition - faster, more natural workout logging compared to manual UI entry. Enables hands-free logging during workouts.

**Independent Test**: Can be tested by an athlete dictating their set performance and verifying the data is correctly stored in workout_log_sets.

**Acceptance Scenarios**:

1. **Given** an athlete has an assigned workout open, **When** they say "I did 8 reps at 100kg, felt like RPE 8", **Then** the system creates a ChangeRequest to log the set with reps=8, weight=100, rpe=8.

2. **Given** an athlete is mid-workout, **When** they say "Log all my squats: 8 at 100, 8 at 105, 6 at 110", **Then** the system creates multiple ChangeRequests for each set with correct values.

3. **Given** an athlete made a logging mistake, **When** they say "Actually that last set was 10 reps not 8", **Then** the system creates an update ChangeRequest correcting the previous entry.

4. **Given** an athlete skipped a set, **When** they say "I skipped set 3 of bench press", **Then** the system logs the set with completed=false.

---

### User Story 2 - Athlete Modifies Own Assigned Session (Priority: P1)

Athletes with appropriate permissions can adjust their own assigned sessions within guardrails - swapping exercises, adjusting weights, or adding exercises.

**Target Audience**: Athlete only

**Target Database Tables**:
- `workout_log_exercises` - CREATE/UPDATE (exercise adjustments)
- `workout_log_sets` - CREATE/UPDATE (set adjustments)

**Why this priority**: Enables athletes to adapt workouts to equipment availability, minor injuries, or energy levels without waiting for coach approval for trivial changes.

**Independent Test**: Can be tested by an athlete requesting an exercise swap and verifying the change is correctly applied to their workout.

**Acceptance Scenarios**:

1. **Given** an athlete's assigned session has back squats, **When** they say "I need to swap squats for leg press, my knee is bothering me", **Then** the system proposes swapping the exercise while preserving set/rep structure.

2. **Given** an athlete wants to adjust today's load, **When** they say "Reduce all my weights by 10% today, I'm feeling tired", **Then** the system calculates and proposes updated weights for all exercises.

3. **Given** an athlete wants to add an exercise, **When** they say "Add 3 sets of face pulls at the end", **Then** the system proposes adding the exercise with default parameters.

4. **Given** a coach has restricted session modifications, **When** an athlete attempts to modify, **Then** the system informs them that modifications require coach approval.

---

### User Story 3 - Athlete Searches for Exercise Alternatives (Priority: P2)

Athletes search for alternative exercises based on constraints like equipment availability, injury considerations, or muscle targeting.

**Target Audience**: Athlete only

**Target Database Tables** (Read-only):
- `exercises` - SELECT with vector search (filtered by athlete-accessible exercises)
- `exercise_types` - SELECT (for filtering by movement pattern)

**Why this priority**: Enables athletes to make informed decisions when they need to substitute exercises, improving autonomy while maintaining training quality.

**Independent Test**: Can be tested by an athlete searching for exercise alternatives with specific constraints and receiving relevant results.

**Acceptance Scenarios**:

1. **Given** an athlete has knee discomfort, **When** they ask "Find me a quad exercise that's easy on the knees", **Then** the system returns exercises filtered by injury consideration.

2. **Given** an athlete lacks equipment, **When** they say "What can I do instead of cable rows? I only have dumbbells", **Then** the system returns dumbbell alternatives targeting the same muscles.

3. **Given** an athlete finds a suitable alternative, **When** they say "Use that one instead", **Then** the system creates a swap ChangeRequest (triggering US-002).

---

### User Story 4 - Athlete Adds Session Notes (Priority: P2)

Athletes can add notes and feedback about their workout through natural conversation, which gets stored for coach review and future AI context.

**Target Audience**: Athlete only

**Target Database Tables**:
- `workout_logs` - UPDATE (notes field)
- `ai_memories` - CREATE (session summary for future context)

**Why this priority**: Captures qualitative feedback that improves coach-athlete communication and provides context for future AI recommendations.

**Independent Test**: Can be tested by an athlete describing how they felt during the workout and verifying notes are saved to the session.

**Acceptance Scenarios**:

1. **Given** an athlete completes their workout, **When** they say "That session felt great, really hit the groove on deadlifts", **Then** the system proposes adding this to session notes.

2. **Given** an athlete mentions an issue, **When** they say "My shoulder was clicking during overhead press", **Then** the system logs the note and optionally flags for coach attention.

---

### Edge Cases

- What happens when the athlete tries to modify a completed session?
- How does the system handle ambiguous exercise names (e.g., "press" could mean bench press, overhead press)?
- What happens if the AI misinterprets the athlete's intent?
  - **Solution**: User clicks "Regenerate" to clear changes and try again
- What happens when the athlete's coach has disabled self-modifications?
- How does the system handle logging for exercises not in the original plan (added during workout)?
- What happens if the athlete tries to log impossible values (e.g., negative reps)?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Performance Logging
- **FR-001**: System MUST support logging set performance (reps, weight, RPE) via natural language
- **FR-002**: System MUST support logging multiple sets in a single utterance
- **FR-003**: System MUST support updating previously logged set data via natural language
- **FR-004**: System MUST support marking sets as skipped (completed=false)
- **FR-005**: System MUST support logging additional metrics (power, velocity, distance, duration) when relevant

#### Session Modification
- **FR-006**: System MUST support swapping exercises while preserving set structure
- **FR-007**: System MUST support adjusting set parameters (reps, weight, rest) within the session
- **FR-008**: System MUST support adding exercises to the session
- **FR-009**: System MUST NOT allow deleting exercises from assigned sessions (coach authority)
- **FR-010**: System MUST respect coach-defined permission levels for modifications

#### Exercise Search
- **FR-011**: System MUST search exercises by name, muscle group, or movement pattern
- **FR-012**: System MUST filter searches by injury considerations when specified
- **FR-013**: System MUST filter searches by equipment availability when specified
- **FR-014**: Search results MUST include exercise name, description, and relevance reasoning

#### Safety & Validation
- **FR-015**: System MUST validate athlete owns the workout session before allowing modifications
- **FR-016**: System MUST prevent modifications to completed sessions
- **FR-017**: System MUST use ChangeSet pattern for all modifications (propose → review → approve)
- **FR-018**: System MUST use existing `saveWorkoutLogAction` for atomic database mutations

#### User Experience
- **FR-019**: System MUST stream AI responses in real-time for perceived performance
- **FR-020**: System MUST provide clear error messages when actions cannot be completed
- **FR-021**: System MUST handle ambiguous requests by asking clarifying questions
- **FR-022**: System MUST show before/after values for all proposed changes

### Key Entities

- **ChangeSet**: A batch of proposed changes awaiting athlete approval. Contains multiple ChangeRequests.
- **ChangeRequest**: A single proposed operation (create/update) on an entity (session/exercise/set).
- **Training Context**: The workout session being modified, including prescribed vs actual data.
- **Tool Invocation**: A structured action the AI decides to take (log, modify, search).

---

## ChangeSet Pattern Implementation

This feature follows the ChangeSet pattern as defined in `specs/002-ai-session-assistant/reference/20251221-changeset-principles.md`.

### Five Core Principles

1. **Autonomy with Accountability**: AI proposes changes freely; athlete approves before execution
2. **Transparency**: Athletes see complete before/after context before approving
3. **Batching Over Incrementalism**: Related operations grouped into single approval
4. **Sequential Consistency**: Operations execute in specified order
5. **Stream Synchronization**: AI pauses when approval needed, resumes after decision

### Keyed Buffer Architecture

Uses Key-Value Map (not array) for change accumulation:
- Key: `{entityType}:{entityId}` (e.g., `training_set:123`)
- Behavior: Last-write-wins (upsert) - AI corrects by re-proposing
- DISCARD: Special flag to remove entry from buffer

### State Machine

| State | Description | AI Stream |
|-------|-------------|-----------|
| `building` | AI accumulating changes | Active |
| `pending_approval` | Awaiting athlete decision | **Paused** |
| `executing` | Applying changes atomically | Paused |
| `approved` | Successfully applied | Resumed |
| `rejected` | Athlete rejected completely | Resumed |

---

## Tool Definitions

### Read Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `getSessionContext` | Get workout with prescribed vs actual | Includes progress stats |
| `getExerciseHistory` | Get recent performance for exercise | For recommendations |
| `searchExercises` | Search exercise library | Filtered by athlete access |

### Proposal Tools

| Tool | Entity | Operation | Notes |
|------|--------|-----------|-------|
| `createTrainingSetChangeRequest` | TrainingSet | Create | Log set performance |
| `updateTrainingSetChangeRequest` | TrainingSet | Update | Correct logged data |
| `createTrainingExerciseChangeRequest` | TrainingExercise | Create | Add exercise to session |
| `updateTrainingExerciseChangeRequest` | TrainingExercise | Update | Swap exercise, update notes |
| `updateTrainingSessionChangeRequest` | TrainingSession | Update | Session notes only |

### Coordination Tools

| Tool | Purpose |
|------|---------|
| `confirmChangeSet` | Submit for athlete approval (pauses AI stream) |
| `resetChangeSet` | Clear all pending changes |

**Total**: 10 tools (vs 12 for coach)

### Tool Restrictions

Athletes CANNOT:
- Delete exercises (use swap instead)
- Delete sets (mark as skipped with complete=false)
- Modify session-level properties beyond notes
- Access other athletes' data

---

## UI/UX Design

### Design Principles

1. **Mobile-First, PWA-Ready**: All interfaces designed for touch-first interaction
2. **Inline Changes**: AI-proposed changes displayed directly on exercise cards
3. **Batch Approval**: Lean approval flow - approve/reject all at once
4. **Workout Mode Optimized**: Minimal taps, large touch targets

### Chat Interface

Uses the same **bottom drawer** interface (Vaul library) as coach version:

```
┌─────────────────────────────────────┐
│  AI Assistant              [Close]  │
├─────────────────────────────────────┤
│                                     │
│  [Chat messages scroll area]        │
│                                     │
│  User: "I did 8 reps at 100kg"      │
│  AI: "Got it! Logging set 1..."     │
│                                     │
├─────────────────────────────────────┤
│  [Text input]              [Send]   │
└─────────────────────────────────────┘
```

### Pending Changes Display

Changes displayed **inline on workout cards** with visual indicators:

| Type | Badge | Background | Description |
|------|-------|------------|-------------|
| **Log** | Green | `bg-green-50` | New performance data |
| **Update** | Amber | `bg-amber-50` | Corrected data |
| **Swap** | Blue | `bg-blue-50` | Exercise replacement |
| **Add** | Green dashed | `bg-green-50` | New exercise |

### Approval Banner

```
┌─────────────────────────────────────┐
│ 🤖 3 Changes Pending                │
│                                     │
│ [Approve All]  [Regenerate]  [Dismiss] │
└─────────────────────────────────────┘
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Athletes can log set performance via natural language and approve changes
- **SC-002**: AI response time for simple queries is under 2 seconds (time to first token)
- **SC-003**: Exercise search returns relevant alternatives for common constraints
- **SC-004**: Zero data corruption incidents (all changes atomic via ChangeSet pattern)
- **SC-005**: Approval flow works end-to-end: propose → review → approve/regenerate/dismiss
- **SC-006**: Workout logging adoption increases by 50% compared to manual-only entry
- **SC-007**: 90% of logged sets via AI match athlete's intended values (measured by correction rate)

---

## Assumptions

1. **ChangeSet Pattern**: The ChangeSet pattern implementation from 002-ai-session-assistant is reusable
2. **Vercel AI SDK**: Provides stable `useChat`, `streamText`, and tool calling capabilities
3. **Exercise Library Coverage**: Sufficient coverage for meaningful alternative suggestions
4. **User Authentication**: Existing Clerk authentication provides athlete identity
5. **Database Schema**: Current `workout_logs`, `workout_log_exercises`, `workout_log_sets` tables support required operations
6. **Existing Server Action**: `saveWorkoutLogAction` handles atomic workout saves
7. **Coach Permissions**: Default allows athlete session modifications; coaches can restrict

---

## Dependencies

- **002-ai-session-assistant**: ChangeSet pattern implementation, shared UI components
- Vercel AI SDK (`ai` package)
- Existing exercise library with populated data
- Existing workout logging server actions
- Supabase client for exercise search and workout data

---

## Architecture References

All architectural decisions follow the reference documents in `specs/002-ai-session-assistant/reference/`:

| Document | Purpose |
|----------|---------|
| `20251221-changeset-principles.md` | Core pattern principles |
| `20251221-changeset-architecture.md` | Technical architecture & state machine |
| `20251221-session-entity-model.md` | Entity model & database mappings |
| `20251221-session-tool-definitions.md` | Tool schemas (athlete tools section) |
| `20251221-session-tools-overview.md` | Tool summary & workflows |
| `20251221-changeset-client-tools.md` | Client-side implementation |

---

## Implementation Status

This section documents what already exists from the 002-ai-session-assistant implementation and what needs to be built.

### Already Implemented (Reusable) ✅

| Component | Location | Notes |
|-----------|----------|-------|
| **ChangeSet Core Types** | `lib/changeset/types.ts` | Includes `WorkoutEntityType` already defined |
| **ChangeSet Context** | `lib/changeset/ChangeSetContext.tsx` | Provider for changeset state |
| **ChangeSet Hook** | `lib/changeset/useChangeSet.ts` | Buffer management hook |
| **Workout Execution** | `lib/changeset/execute-workout.ts` | Adapter for `workout_log_set` mutations |
| **Error Classification** | `lib/changeset/errors.ts` | Error taxonomy for recovery |
| **Entity Mappings** | `lib/changeset/entity-mappings.ts` | Key conversion utilities |
| **Buffer Utilities** | `lib/changeset/buffer-utils.ts` | Keyed buffer operations |
| **Chat UI** | `components/features/ai-assistant/ChatDrawer.tsx` | Bottom drawer chat interface |
| **Approval Banner** | `components/features/ai-assistant/ApprovalBanner.tsx` | Batch approval UI |
| **Change Indicators** | `components/features/ai-assistant/indicators/` | `ChangeTypeBadge`, `InlineValueDiff`, etc. |
| **AI Wrappers** | `components/features/ai-assistant/wrappers/` | `AIEnhancedExerciseCard`, `AIEnhancedSetRow` |
| **AI Hooks** | `components/features/ai-assistant/hooks/` | `useAIChangeForEntity`, `useAIExerciseChanges` |
| **Inline Proposal UI** | `components/features/ai-assistant/inline/` | `InlineProposalSection`, `ProposalActionBar` |
| **Coordination Tools** | `lib/changeset/tools/coordination-tools.ts` | `confirmChangeSet`, `resetChangeSet` |
| **Read Tools** | `lib/changeset/tools/read-tools.ts` | `getSessionContext`, `searchExercises` |
| **Read Implementation** | `lib/changeset/tool-implementations/read-impl.ts` | Server-side read execution |

### Needs Implementation ❌

| Component | Description | Priority |
|-----------|-------------|----------|
| **Athlete Proposal Tools** | `createTrainingSetChangeRequest`, `updateTrainingSetChangeRequest`, `updateTrainingSessionChangeRequest`, etc. | P1 |
| **Athlete Tools Export** | `athleteDomainTools` in `lib/changeset/tools/index.ts` | P1 |
| **Athlete API Route** | `/api/ai/workout-assistant/route.ts` (or extend existing) | P1 |
| **Athlete System Prompt** | `lib/changeset/prompts/workout-athlete.ts` | P1 |
| **Workout Context Read** | `getWorkoutContext` tool implementation for athlete domain | P1 |
| **Exercise History Tool** | `getExerciseHistory` for athlete performance data | P2 |
| **Workout Page Integration** | Wire up AI assistant to `/workout/[id]` page | P1 |
| **Permission Checking** | Coach permission level validation for modifications | P2 |

### Partial Implementation ⚠️

| Component | Status | What's Missing |
|-----------|--------|----------------|
| **Tool Handler** | `lib/changeset/tool-handler.ts` exists | May need athlete-specific handling |
| **Transformations** | `lib/changeset/transformations.ts` exists | May need athlete entity transforms |
| **Workout UI Demo** | `components/features/workout/demo/WorkoutUIDemo.tsx` | Uses simulated AI, needs real integration |

---

## Out of Scope

- Coach domain modifications (covered by 002-ai-session-assistant)
- Creating sessions from scratch (athletes work with assigned sessions)
- Voice input/output
- Offline functionality
- Multi-language support (English only)
- Conversation persistence across sessions (future enhancement)
- Integration with external fitness tracking devices