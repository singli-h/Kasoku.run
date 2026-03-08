# Research: AI Athlete Workout Assistant

**Feature**: 005-ai-athlete-workout
**Date**: 2026-01-01

## Overview

This document consolidates research findings for implementing the Athlete domain of the AI Session Assistant. Since the Coach domain (002-ai-session-assistant) is fully implemented, this research focuses on identifying what can be reused and what needs to be built.

## Research Questions

### Q1: What existing ChangeSet components are reusable?

**Decision**: Reuse 16 existing components unchanged

**Rationale**: The ChangeSet pattern was designed domain-agnostically. All core components work for both Coach (session_plans) and Athlete (workout_logs) domains.

**Components Verified as Reusable**:

| Component | File | Verification |
|-----------|------|--------------|
| Core Types | `lib/changeset/types.ts` | `WorkoutEntityType` already defined |
| Context Provider | `lib/changeset/ChangeSetContext.tsx` | Domain-agnostic |
| Buffer Hook | `lib/changeset/useChangeSet.ts` | Domain-agnostic |
| Buffer Utils | `lib/changeset/buffer-utils.ts` | Domain-agnostic |
| Error Classification | `lib/changeset/errors.ts` | Domain-agnostic |
| Entity Mappings | `lib/changeset/entity-mappings.ts` | Has workout mappings |
| Workout Execution | `lib/changeset/execute-workout.ts` | Already handles workout_log_set |
| UI Components | `components/features/ai-assistant/*` | Domain-agnostic |
| Coordination Tools | `lib/changeset/tools/coordination-tools.ts` | Domain-agnostic |
| Read Tools | `lib/changeset/tools/read-tools.ts` | `searchExercises` is domain-agnostic |

**Alternatives Considered**:
- Fork and modify: Rejected - would duplicate code and diverge
- New architecture: Rejected - existing pattern is proven

---

### Q2: What workout execution capabilities exist?

**Decision**: Use existing `execute-workout.ts` with minor extensions

**Rationale**: The execution adapter already handles `workout_log_set` operations via `addExercisePerformanceAction` and `updateExercisePerformanceAction`.

**Existing Capabilities** (from `lib/changeset/execute-workout.ts`):
- ✅ Create workout_log_set (set performance logging)
- ✅ Update workout_log_set (correct logged data)
- ⚠️ Exercise changes noted but not implemented ("not implemented in MVP")
- ⚠️ Session changes noted but not implemented ("handled at session level")

**Gaps to Address**:
1. Exercise swap requires `workout_log_exercise` update support
2. Session notes require `workout_log` update support

**Alternatives Considered**:
- New execution adapter: Rejected - extend existing
- Direct server action calls: Rejected - loses atomic guarantees

---

### Q3: What tool schemas are defined for Athlete domain?

**Decision**: Implement tools as specified in `20251221-session-tool-definitions.md`

**Rationale**: The reference document already defines complete schemas for Athlete domain tools.

**Tools to Implement**:

| Tool | Schema Status | Notes |
|------|---------------|-------|
| `getWorkoutContext` | Defined | Read workout with prescribed vs actual |
| `getExerciseHistory` | Defined | P2 priority |
| `createTrainingSetChangeRequest` | Defined | Log set performance |
| `updateTrainingSetChangeRequest` | Defined | Correct logged data |
| `createTrainingExerciseChangeRequest` | Not in spec | Add exercise (optional) |
| `updateTrainingExerciseChangeRequest` | Defined | Swap exercise |
| `updateTrainingSessionChangeRequest` | Defined | Session notes only |

**Alternatives Considered**:
- Reuse coach tool schemas: Rejected - different entity types
- Generic tool wrapper: Rejected - loses type safety

---

### Q4: How should the API route be structured?

**Decision**: Create new route at `/api/ai/workout-assistant/route.ts`

**Rationale**:
- Separation of concerns (athlete vs coach)
- Different tool sets and system prompts
- Different authorization (athlete owns workout vs coach owns session)

**Implementation Pattern** (from existing coach route):
```typescript
// Verify ownership via workout_log, not session_plan
const { data: workout } = await supabase
  .from('workout_logs')
  .select('id, athlete_id, athletes!inner(user_id)')
  .eq('id', workoutLogId)
  .single()

// Check athlete owns this workout
if (workout.athletes.user_id !== dbUserId) {
  return new Response('Forbidden', { status: 403 })
}
```

**Alternatives Considered**:
- Extend existing route with domain parameter: Rejected - too complex
- Unified route with conditional logic: Rejected - violates single responsibility

---

### Q5: How should UI components integrate?

**Decision**: Create `WorkoutAssistantWrapper.tsx` following `SessionAssistantWrapper.tsx` pattern

**Rationale**: The existing pattern provides context providers and chat integration in a clean wrapper component.

**Integration Points**:
1. `ChangeSetProvider` - Wrap workout page
2. `ChatDrawer` - Reuse directly
3. `ApprovalBanner` - Reuse directly
4. `useChat` - Connect to new route

**Existing Patterns** (from `SessionAssistantWrapper.tsx`):
```typescript
<ChangeSetProvider>
  <SessionAssistantContext.Provider value={...}>
    {children}
    <ChatDrawer />
    <ApprovalBanner />
  </SessionAssistantContext.Provider>
</ChangeSetProvider>
```

**Alternatives Considered**:
- Modify existing wrapper: Rejected - breaks coach flow
- Inline in page: Rejected - less maintainable

---

### Q6: What system prompt modifications are needed?

**Decision**: Create new `workout-athlete.ts` prompt file

**Rationale**: Athlete domain has different:
- Entity types (workout_log_* vs session_plan_*)
- Tool restrictions (no delete operations)
- Context focus (prescribed vs actual data)
- User persona (athlete executing workout)

**Prompt Differences from Coach**:

| Aspect | Coach Prompt | Athlete Prompt |
|--------|--------------|----------------|
| Role | "session planning assistant" | "workout assistant" |
| User | "coach" | "athlete" |
| Goal | "design training sessions" | "log and modify your workout" |
| Restrictions | Full CRUD | No delete (swap/skip instead) |
| Context | Session structure | Prescribed vs actual |

**Alternatives Considered**:
- Template with variable substitution: Rejected - too many differences
- Single prompt with domain flag: Rejected - hard to maintain

---

## Technology Decisions

### Vercel AI SDK Usage

**Pattern**: Same as coach implementation
- `streamText` for AI streaming
- `tool` for tool definitions
- `convertToModelMessages` for message format
- Client-side tool execution via `onToolCall`

### Entity Type Strategy

**Pattern**: Separate tool file with explicit entity types

```typescript
// athlete-proposal-tools.ts
export type AthleteEntityType =
  | 'workout_log'
  | 'workout_log_exercise'
  | 'workout_log_set'
```

This keeps athlete and coach domains cleanly separated.

---

## Resolved NEEDS CLARIFICATION Items

None - all technical questions resolved through codebase analysis and reference documents.

---

## Summary

| Category | Decision |
|----------|----------|
| Core Pattern | Reuse ChangeSet unchanged |
| Execution | Extend `execute-workout.ts` |
| Tools | Implement per reference spec |
| API Route | New `/api/ai/workout-assistant/` |
| UI | New `WorkoutAssistantWrapper.tsx` |
| Prompt | New `workout-athlete.ts` |

**Total New Files**: 6
**Total Modified Files**: 3
**Estimated Effort**: Small (reuse-heavy)
