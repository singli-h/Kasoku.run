# AI Session Assistant: Tools Overview

**Purpose**: Concise summary of available AI tools
**Feature**: 002-ai-session-assistant
**Full Schemas**: See `20251221-session-tool-definitions.md`

---

## Tool Naming Convention

```
{operation}{EntityType}ChangeRequest
```

- **Operations**: `create`, `update`, `delete`
- **Entity Types**: `Session`, `Exercise`, `Set` | `TrainingSession`, `TrainingSet`

---

## Coach Tools (Training Plans)

### Read Tools

| Tool | Purpose |
|------|---------|
| `getSessionContext` | Get current session with exercises and sets |
| `searchExercises` | Search exercise library |

### Proposal Tools

| Tool | Entity | Operation | Notes |
|------|--------|-----------|-------|
| `createSessionChangeRequest` | Session | Create | New session template |
| `updateSessionChangeRequest` | Session | Update | Name, description |
| `createExerciseChangeRequest` | Exercise | Create | Add to session |
| `updateExerciseChangeRequest` | Exercise | Update | Settings, swap (via new exerciseId) |
| `deleteExerciseChangeRequest` | Exercise | Delete | Remove from session |
| `createSetChangeRequest` | Set | Create | Add sets with prescription |
| `updateSetChangeRequest` | Set | Update | Modify prescription |
| `deleteSetChangeRequest` | Set | Delete | Remove sets |

### Coordination Tools

| Tool | Purpose |
|------|---------|
| `confirmChangeSet` | Submit for user approval (pauses AI stream) |
| `resetChangeSet` | Clear all pending changes |

**Total**: 12 tools

---

## Athlete Tools (Workout)

### Read Tools

| Tool | Purpose |
|------|---------|
| `getSessionContext` | Get workout with prescribed vs actual |
| `getExerciseHistory` | Get recent performance for exercise |
| `searchExercises` | Search exercise library |

### Proposal Tools

| Tool | Entity | Operation | Notes |
|------|--------|-----------|-------|
| `createTrainingSetChangeRequest` | TrainingSet | Create | Log set performance |
| `updateTrainingSetChangeRequest` | TrainingSet | Update | Correct logged data |
| `updateTrainingSessionChangeRequest` | TrainingSession | Update | Session notes only |

### Coordination Tools

| Tool | Purpose |
|------|---------|
| `confirmChangeSet` | Submit for user approval |
| `resetChangeSet` | Clear all pending changes |

**Total**: 8 tools

---

## Tool Execution Location

| Category | Runs On | Returns Tool Result |
|----------|---------|---------------------|
| **Read Tools** | Server | Immediately |
| **Search Tools** | Server | Immediately |
| **Proposal Tools** | Client | Immediately (adds to buffer) |
| **Coordination Tools** | Client | `confirmChangeSet` pauses until user decides |

See `20251221-changeset-client-tools.md` for implementation patterns.

---

## Backend Operations (Not AI Tools)

| Operation | When | Purpose |
|-----------|------|---------|
| `initializeTrainingSession` | Athlete opens workout | Copy preset → training session |

These run automatically before AI conversation starts.

---

## Quick Reference

### Coach Workflow
```
1. getSessionContext()     → Read current state
2. searchExercises()       → Find exercises
3. create/update/delete*() → Build changeset
4. confirmChangeSet()      → Submit for approval
```

### Athlete Workflow
```
1. getSessionContext()             → See prescribed workout
2. getExerciseHistory()            → Check past performance
3. createTrainingSetChangeRequest() → Log each set
4. confirmChangeSet()              → Submit for approval
```

---

## References

- Full Schemas: `20251221-session-tool-definitions.md`
- Client Patterns: `20251221-changeset-client-tools.md`
- Entity Model: `20251221-session-entity-model.md`
