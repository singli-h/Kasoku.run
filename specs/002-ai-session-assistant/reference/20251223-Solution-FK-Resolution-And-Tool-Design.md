# Solution: Foreign Key Resolution in ChangeSet Pattern

**Date**: 2025-12-23
**Feature**: 002-ai-session-assistant
**Status**: Implemented

---

## Problem Statement

When the AI creates related entities in sequence (e.g., an exercise followed by its sets), child entities need to reference the parent's ID. However:

1. **Parent doesn't exist yet**: The parent entity has only a temporary ID (`temp_001`) until database insertion
2. **AI uses wrong ID**: Without clear guidance, the AI used `exerciseId` (library ID) instead of `entityId` (temp ID)
3. **FK field mapping confusion**: `presetExerciseId` mapped to `id` (primary key) instead of `exercise_preset_id` (foreign key)

---

## Solution Architecture

### 1. Distinct Field Names for PKs vs FKs

| Field Name | Purpose | Maps To |
|------------|---------|---------|
| `presetExerciseId` | Entity's own ID (for update/delete) | `id` |
| `exercisePresetId` | Foreign key to parent exercise | `exercise_preset_id` |

**Key Insight**: The naming convention matters. Using `exercisePresetId` (noun-first) for FKs avoids collision with entity ID fields.

### 2. Entity Reference Registry

Declarative mapping of which fields contain entity references:

```
ENTITY_REFERENCE_FIELDS:
  preset_session  → [microcycle_id]
  preset_exercise → [exercise_preset_group_id]
  preset_set      → [exercise_preset_id]
```

### 3. Tool Response Returns entityId

When a proposal tool succeeds, it returns:
- `entityId`: The temporary ID for the created entity (e.g., `temp_001`)
- `changeId`: The change request ID

This allows the AI to reference newly created entities in subsequent tool calls.

### 4. ID Resolution During Execution

During changeset execution:
1. Process entities in `executionOrder` (parents first)
2. Track mapping: `temp_001 → temp_001` (in-memory) or `temp_001 → 789` (after DB insert)
3. Resolve FK references before applying each child entity's changes

### 5. Clear Tool Descriptions

Tool descriptions explicitly guide the AI:

> "For NEW exercises created in this changeset, use the entityId returned from createExerciseChangeRequest (e.g., 'temp_001'). For EXISTING exercises, use their id from the session data."

---

## Files Modified

| File | Change |
|------|--------|
| `entity-mappings.ts` | Added `ENTITY_REFERENCE_FIELDS`, `PARENT_FK_FROM_TOOL_INPUT` |
| `proposal-tools.ts` | Renamed `presetExerciseId` → `exercisePresetId` for set tools |
| `tool-handler.ts` | Returns `entityId` in response |
| `transformations.ts` | Stores parent FK from tool input |
| `execute.ts` | Resolves temp IDs during execution |
| `types.ts` | Added `entityId` to `ToolHandlerResult` |

---

## Design Recommendation: Bulk Operations

### Current Approach (setCount parameter)

The `createSetChangeRequest` tool has a `setCount` parameter to add multiple identical sets at once.

### Recommendation

**Avoid embedding bulk logic in core tools.** Instead:

1. Keep `createSetChangeRequest` as a single-set operation
2. If bulk operations become common, create a dedicated tool:
   - `createBulkSetsChangeRequest` with explicit multi-set semantics
   - Clear parameter: `sets: [{ reps, weight, ... }, ...]`

**Rationale**:
- Single-responsibility: Each tool does one thing well
- Clarity: AI understands intent without ambiguity
- Flexibility: Bulk tool can have different validation/behavior
- Rarity: Bulk identical sets are uncommon in real training plans (sets typically vary in reps/weight)

### When to Add Bulk Tools

Add dedicated bulk tools when:
- Usage pattern is frequent (data-driven decision)
- Business logic requires atomic multi-entity creation
- The alternative (multiple tool calls) creates UX friction

---

## References

- Architecture: `20251221-changeset-architecture.md`
- Entity Model: `20251221-session-entity-model.md`
- Tool Definitions: `20251221-session-tool-definitions.md`
