# AI Session Assistant: Future Scope & Out-of-Scope Items

**Purpose**: Track items explicitly out of scope for initial implementation
**Feature**: 002-ai-session-assistant

---

## 1. Explicitly Out of Scope (V1)

### 1.1 Athlete Exercise Swapping

**Status**: Out of scope for V1

**Description**: Allowing athletes to swap exercises in their assigned workout.

**Why deferred**:
- Adds complexity to athlete workflow
- Coach/athlete permission model undefined
- Core logging functionality is priority

**Future consideration**:
- Could be added as `swapTrainingExerciseChangeRequest` tool
- AI would need equipment/injury context from athlete profile
- May need coach notification or pre-approval list

---

### 1.2 Coach Pre-Approval for Athlete Changes

**Status**: Out of scope

**Description**: Coaches pre-approving certain types of changes athletes can make.

**Why deferred**:
- Adds complexity without clear user demand
- Coach and athlete domains are clearly separated
- V1 keeps domains independent

**Future consideration**:
- Pre-approved exercise alternatives list
- Real-time coach notifications
- Async approval workflow

---

### 1.3 Undo After Approval

**Status**: Out of scope

**Description**: Reverting changes after they've been executed and approved.

**Why deferred**:
- Requires complex state tracking
- Database rollback implications
- Edge cases around time-sensitive data

**Future consideration**:
- Time-limited undo window (e.g., 5 minutes)
- Create "reverse" changeset
- Audit trail preservation

---

### 1.4 Changeset History / Audit UI

**Status**: Out of scope

**Description**: UI for viewing past changesets and their details.

**Why deferred**:
- Audit data is persisted (infrastructure ready)
- UI is not critical for V1 functionality
- Focus on core approval flow first

**Future consideration**:
- Coach dashboard showing AI-proposed changes
- Filter by athlete, date, approval status
- AI reasoning visibility

---

### 1.5 Retry on Execution Failure

**Status**: Out of scope (partial)

**Description**: Automatic retry button when changeset execution fails.

**Current state**:
- Execution failures trigger error state
- AI auto-recovery via new proposal
- No manual "retry same changeset" button

**Why deferred**:
- AI correction flow handles most cases
- Retry logic is complex (idempotency concerns)

**Future consideration**:
- "Retry" button for transient errors
- Distinguish transient vs logic errors in UI

---

### 1.6 Offline / PWA Support

**Status**: Out of scope

**Description**: Working offline and syncing when back online.

**Why deferred**:
- Requires significant architecture changes
- Conflict resolution complexity
- Core functionality needs stable first

**Future consideration**:
- Queue changesets locally
- Sync on reconnection
- Handle conflicts gracefully

---

### 1.7 Real-Time Collaboration

**Status**: Out of scope

**Description**: Multiple users editing same session simultaneously.

**Why deferred**:
- Complex conflict resolution
- WebSocket infrastructure needed
- Not a V1 requirement

**Future consideration**:
- Supabase Realtime subscriptions
- Live cursor/presence indicators
- Merge conflict UI

---

## 2. Included in V1 (Confirmed Scope)

### 2.1 Coach Domain

| Feature | Status |
|---------|--------|
| Create session templates | ✅ In scope |
| Add/update/delete exercises | ✅ In scope |
| Add/update/delete sets (prescriptions) | ✅ In scope |
| AI-assisted plan building | ✅ In scope |
| Batch approval flow | ✅ In scope |

### 2.2 Athlete Domain

| Feature | Status |
|---------|--------|
| Log set performance | ✅ In scope |
| Update logged performance | ✅ In scope |
| Add session notes | ✅ In scope |
| AI-assisted logging | ✅ In scope |
| Batch approval flow | ✅ In scope |

### 2.3 Shared

| Feature | Status |
|---------|--------|
| Exercise search | ✅ In scope |
| Session context reading | ✅ In scope |
| Exercise history (athlete) | ✅ In scope |
| Iterative correction (reject with feedback) | ✅ In scope |
| Execution failure recovery | ✅ In scope (AI-driven) |

---

## 3. Technical Decisions Deferred

### 3.1 Changeset Persistence Strategy

**Current**: Optional for `building` state

**Deferred decision**:
- localStorage only?
- Server-side WIP persistence?
- Hybrid approach?

**Decide when**: User testing reveals need for browser refresh recovery

---

### 3.2 AI Model Selection

**Current**: Unspecified

**Options**:
- GPT-4 for complex reasoning
- Claude for structured output
- Local models for privacy

**Decide when**: Performance and cost analysis

---

### 3.3 Rate Limiting Strategy

**Current**: Not implemented

**Needed when**:
- Users report runaway AI loops
- Cost becomes concern

---

## 4. Tracking Future Work

When implementing V2 features, reference this document and move items to active spec/plan files.

### Priority Suggestions for V2

| Priority | Feature | Reason |
|----------|---------|--------|
| High | Undo after approval | User expectation, safety net |
| High | Changeset history UI | Coach visibility into AI actions |
| Medium | Athlete exercise swapping | Flexibility for athletes |
| Medium | Retry on failure | Better UX for transient errors |
| Low | Real-time collaboration | Niche use case |
| Low | Offline support | Significant effort |

---

## References

- Main Spec: `../spec.md`
- Tool Definitions: `20251221-session-tool-definitions.md`
- Architecture: `20251221-changeset-architecture.md`
