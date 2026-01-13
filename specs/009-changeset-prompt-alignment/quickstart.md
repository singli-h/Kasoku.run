# Quickstart: ChangeSet Prompt Alignment

**Feature**: 009-changeset-prompt-alignment
**Date**: 2026-01-07

## Overview

This guide provides step-by-step implementation instructions for aligning AI assistant tool naming with database schema and applying goal-oriented prompting patterns.

---

## Prerequisites

- Access to `apps/web/lib/changeset/` directory
- Understanding of existing changeset architecture
- Reference: `specs/005-ai-athlete-workout/references/20260107-concept-changeset-prompting.md`

---

## Step 1: Rename Coach Domain Tools

**File**: `apps/web/lib/changeset/prompts/session-planner.ts`

Search and replace in the `AVAILABLE_TOOLS` constant:

| Find | Replace With |
|------|--------------|
| `createExerciseChangeRequest` | `createSessionPlanExerciseChangeRequest` |
| `updateExerciseChangeRequest` | `updateSessionPlanExerciseChangeRequest` |
| `deleteExerciseChangeRequest` | `deleteSessionPlanExerciseChangeRequest` |
| `createSetChangeRequest` | `createSessionPlanSetChangeRequest` |
| `updateSetChangeRequest` | `updateSessionPlanSetChangeRequest` |
| `deleteSetChangeRequest` | `deleteSessionPlanSetChangeRequest` |
| `updateSessionChangeRequest` | `updateSessionPlanChangeRequest` |

Also update any references in `WORKFLOW_INSTRUCTIONS` and examples.

---

## Step 2: Rename Athlete Domain Tools

**File**: `apps/web/lib/changeset/prompts/workout-athlete.ts`

Search and replace in the `AVAILABLE_TOOLS` constant:

| Find | Replace With |
|------|--------------|
| `createTrainingExerciseChangeRequest` | `createWorkoutLogExerciseChangeRequest` |
| `updateTrainingExerciseChangeRequest` | `updateWorkoutLogExerciseChangeRequest` |
| `createTrainingSetChangeRequest` | `createWorkoutLogSetChangeRequest` |
| `updateTrainingSetChangeRequest` | `updateWorkoutLogSetChangeRequest` |
| `updateTrainingSessionChangeRequest` | `updateWorkoutLogChangeRequest` |

Also update any references throughout the file.

---

## Step 3: Add Delete Tools to Athlete Domain

**File**: `apps/web/lib/changeset/prompts/workout-athlete.ts`

Add to `AVAILABLE_TOOLS`:

```typescript
**Removing Proposals:**
- **deleteWorkoutLogExerciseChangeRequest**: Remove a proposed exercise from the changeset
- **deleteWorkoutLogSetChangeRequest**: Remove a proposed set from the changeset
```

**File**: Transformation layer (tool-implementations or similar)

Add validation logic:

```typescript
function handleDeleteWorkoutLogEntity(entityId: string): Result {
  if (entityId.startsWith('temp-')) {
    // Remove from buffer - allowed
    buffer.delete(entityId)
    return { success: true, message: 'Proposal removed from changeset.' }
  } else {
    // Real ID - not allowed
    return {
      success: false,
      error: 'Deleting logged workout data is not allowed. To mark as incomplete, use updateWorkoutLogSetChangeRequest with completed: false instead.'
    }
  }
}
```

---

## Step 4: Rename Function

**File**: `apps/web/lib/changeset/prompts/session-planner.ts`

```typescript
// Before
export function buildSystemPrompt(sessionContext?: SessionContext): string {

// After
export function buildCoachSystemPrompt(sessionContext?: SessionContext): string {
```

Update all imports/usages of this function throughout the codebase.

---

## Step 5: Refactor to Goal-Oriented Prompting

**For both prompt files**, restructure to:

### 5.1 Simplify PERSONA (goal-focused)

```typescript
const PERSONA = `You are an expert [domain] assistant.

Your goal is to help [users] efficiently [primary task].

You help by:
- [Capability 1]
- [Capability 2]
- [Capability 3]

Be [tone]. Propose changes directly using available tools.`
```

### 5.2 Replace WORKFLOW with CONSTRAINTS

```typescript
const CONSTRAINTS = `## Constraints

- Call confirmChangeSet() when you have changes ready for review
- Use resetChangeSet() to clear all pending changes and start fresh`
```

### 5.3 Add SOFT_GUIDANCE

```typescript
const SOFT_GUIDANCE = `## Guidance

- Gather context when helpful (use read tools)
- Make reasonable assumptions for incomplete information
- Ask for clarification only when truly ambiguous
- Tool results will guide your next steps`
```

### 5.4 Keep DOMAIN_KNOWLEDGE (business rules)

Keep existing domain-specific sections like `EXERCISE_GROUPING`, `SUPERSET_INSTRUCTIONS` (coach) or `WORKOUT_UNDERSTANDING`, `MODIFYING_WORKOUT` (athlete).

### 5.5 Remove Helper Functions

Delete these functions:
- `buildRejectionFollowUpPrompt()`
- `buildExecutionFailurePrompt()`

Tool results contain sufficient context for agent adaptation.

---

## Step 6: Update Tool Definitions

Search for tool definition files in `apps/web/lib/changeset/`:

```bash
grep -r "createExerciseChangeRequest\|createTrainingExerciseChangeRequest" apps/web/lib/changeset/
```

Update tool names and descriptions in all definition files found.

---

## Verification Checklist

- [ ] All coach tools use `SessionPlan` prefix
- [ ] All athlete tools use `WorkoutLog` prefix
- [ ] Delete tools added to athlete domain
- [ ] Transformation layer validates temp-ID vs real-ID
- [ ] `buildSystemPrompt` renamed to `buildCoachSystemPrompt`
- [ ] All imports updated
- [ ] Prompts restructured to goal-oriented format
- [ ] Helper functions removed
- [ ] No step-by-step procedural instructions remain

---

## Testing

1. **Coach Domain**: Use session planner AI to add/update/delete exercises and sets
2. **Athlete Domain**: Use workout logging AI to:
   - Log sets
   - Propose then remove a set before confirmation
   - Attempt to delete saved data (should be rejected)
3. **Both Domains**: Verify AI responses are goal-oriented, not procedural
