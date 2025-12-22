# AI Session Assistant: Tool Definitions

**Purpose**: Entity-specific, operation-specific AI tool schemas
**Principle**: One tool = one entity type + one operation
**Feature**: 002-ai-session-assistant

---

## Tool Naming Convention

```
{operation}{EntityType}ChangeRequest
```

**Operations**: `create`, `update`, `delete`
**Entity Types**: `Session`, `Exercise`, `Set` (Coach) | `TrainingSession`, `TrainingSet` (Athlete)

All proposal tools follow this pattern. The transformation layer converts tool input to standard ChangeRequest format.

---

## Tool Categories

| Category | Purpose | Modifies Buffer? |
|----------|---------|------------------|
| **Proposal Tools** | Add ChangeRequests to buffer | Yes |
| **Read Tools** | Get current state (read-only) | No |
| **Search Tools** | Find exercises (read-only) | No |
| **Coordination Tools** | Control changeset workflow | Yes (confirm/reset) |

---

## Backend Operations (Not AI Tools)

These operations are handled by the backend, NOT exposed as AI tools:

### initializeTrainingSession

When an athlete opens a workout, the backend automatically creates `training_session` and `training_details` by copying from the assigned plan.

```typescript
// Backend function, NOT an AI tool
async function initializeTrainingSession(
  presetGroupId: string,
  athleteId: string,
  scheduledDate: Date
): Promise<TrainingSession> {
  // 1. Create training_session from preset_group
  const session = await createTrainingSession({
    exercise_preset_group_id: presetGroupId,
    athlete_id: athleteId,
    date_time: scheduledDate,
    session_status: 'assigned'
  })

  // 2. Copy preset_details → training_details (with null actuals)
  const presetDetails = await getPresetDetails(presetGroupId)
  for (const preset of presetDetails) {
    await createTrainingDetail({
      exercise_training_session_id: session.id,
      exercise_preset_id: preset.id,
      set_index: preset.set_index,
      // Actuals start as null - AI will help athlete fill these
      reps: null,
      weight: null,
      completed: false
    })
  }

  return session
}
```

**Why not an AI tool?**
- Initialization is deterministic (no AI decision-making)
- Happens before AI conversation starts
- No user approval needed
- AI operates on already-initialized sessions

---

## Read Tools (Both Domains)

Read tools provide context to the AI. They do NOT modify the changeset buffer.

### getSessionContext

Get the current session structure for AI understanding.

```typescript
{
  name: "getSessionContext",
  description: "Get the current session with all exercises and sets. Use before proposing changes.",
  parameters: {
    type: "object",
    required: ["sessionId"],
    properties: {
      sessionId: {
        type: "string",
        description: "ID of the session (preset_group or training_session)"
      },
      includeHistory: {
        type: "boolean",
        default: false,
        description: "Include previous performance data (athlete only)"
      }
    }
  }
}
```

**Returns for Coach (Training Plans):**
```typescript
{
  session: {
    id: string,
    name: string,
    description: string
  },
  exercises: [{
    id: string,
    exerciseId: string,
    exerciseName: string,
    presetOrder: number,
    supersetId: string | null,
    notes: string | null,
    sets: [{
      setIndex: number,
      reps: number,
      weight: number | null,
      rpe: number | null,
      restTime: number | null,
      tempo: string | null
    }]
  }]
}
```

**Returns for Athlete (Workout):**
```typescript
{
  session: {
    id: string,
    name: string,
    sessionStatus: 'assigned' | 'ongoing' | 'completed',
    dateTime: string
  },
  exercises: [{
    id: string,
    exercisePresetId: string,
    exerciseName: string,
    presetOrder: number,
    prescribed: {
      reps: number,
      weight: number | null,
      rpe: number | null
    },
    sets: [{
      setIndex: number,
      prescribed: { reps, weight, rpe },
      actual: { reps, weight, rpe, completed } | null  // null = not logged yet
    }]
  }],
  progress: {
    totalSets: number,
    completedSets: number,
    skippedSets: number
  }
}
```

### getExerciseHistory

Get athlete's recent performance for an exercise (useful for recommendations).

```typescript
{
  name: "getExerciseHistory",
  description: "Get athlete's recent performance history for an exercise.",
  parameters: {
    type: "object",
    required: ["exerciseId"],
    properties: {
      exerciseId: {
        type: "string",
        description: "Exercise library ID"
      },
      limit: {
        type: "integer",
        default: 5,
        description: "Number of recent sessions to include"
      }
    }
  }
}
```

**Returns:**
```typescript
{
  exerciseId: string,
  exerciseName: string,
  recentSessions: [{
    date: string,
    sets: [{
      reps: number,
      weight: number,
      rpe: number
    }],
    estimatedMax: number | null  // Calculated 1RM
  }],
  personalRecords: {
    maxWeight: { value: number, date: string },
    maxReps: { value: number, weight: number, date: string },
    maxVolume: { value: number, date: string }
  }
}
```

---

## Domain 1: Training Plans Tools (Coach)

### Session Tools

#### createSessionChangeRequest

Create a new session template.

```typescript
{
  name: "createSessionChangeRequest",
  description: "Create a new session template for a training plan.",
  parameters: {
    type: "object",
    required: ["name", "reasoning"],
    properties: {
      name: {
        type: "string",
        description: "Name for the session (e.g., 'Upper Body A')"
      },
      description: {
        type: "string",
        description: "Description or notes"
      },
      microcycleId: {
        type: "string",
        description: "Parent microcycle (week) ID"
      },
      reasoning: {
        type: "string",
        description: "Why this session is being created"
      }
    }
  }
}
```

#### updateSessionChangeRequest

Update session-level properties.

```typescript
{
  name: "updateSessionChangeRequest",
  description: "Update a session template's name, description, or notes.",
  parameters: {
    type: "object",
    required: ["presetGroupId", "reasoning"],
    properties: {
      presetGroupId: {
        type: "string",
        description: "ID of the session to update"
      },
      name: {
        type: "string"
      },
      description: {
        type: "string"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

---

### Exercise Tools

#### createExerciseChangeRequest

Add an exercise to the session.

```typescript
{
  name: "createExerciseChangeRequest",
  description: "Add a new exercise to the session template.",
  parameters: {
    type: "object",
    required: ["exerciseId", "exerciseName", "reasoning"],
    properties: {
      exerciseId: {
        type: "string",
        description: "ID from exercise library"
      },
      exerciseName: {
        type: "string",
        description: "Name for display"
      },
      presetOrder: {
        type: "integer",
        description: "Position in session (0-based)"
      },
      insertAfterExerciseId: {
        type: "string",
        description: "Insert after this exercise. Omit for end."
      },
      supersetId: {
        type: "string",
        description: "Superset group ID if joining a superset"
      },
      notes: {
        type: "string"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

#### updateExerciseChangeRequest

Update exercise settings. **Also used for swapping exercises** by providing a new `exerciseId`.

```typescript
{
  name: "updateExerciseChangeRequest",
  description: "Update an exercise's settings in the session template. To swap exercises, provide a new exerciseId.",
  parameters: {
    type: "object",
    required: ["presetExerciseId", "reasoning"],
    properties: {
      presetExerciseId: {
        type: "string",
        description: "ID of the exercise preset to update"
      },
      exerciseId: {
        type: "string",
        description: "New exercise ID from library (for swapping)"
      },
      exerciseName: {
        type: "string",
        description: "New exercise name (required when swapping)"
      },
      presetOrder: {
        type: "integer"
      },
      supersetId: {
        type: "string"
      },
      notes: {
        type: "string"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

#### deleteExerciseChangeRequest

Remove an exercise from the session.

```typescript
{
  name: "deleteExerciseChangeRequest",
  description: "Remove an exercise from the session template.",
  parameters: {
    type: "object",
    required: ["presetExerciseId", "reasoning"],
    properties: {
      presetExerciseId: {
        type: "string",
        description: "ID of the exercise to remove"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

---

### Set Tools (Prescription)

#### createSetChangeRequest

Add sets to an exercise.

```typescript
{
  name: "createSetChangeRequest",
  description: "Add one or more sets to an exercise in the template.",
  parameters: {
    type: "object",
    required: ["presetExerciseId", "reasoning"],
    properties: {
      presetExerciseId: {
        type: "string",
        description: "Parent exercise ID"
      },
      setCount: {
        type: "integer",
        default: 1,
        description: "Number of sets to add"
      },
      reps: {
        type: "integer"
      },
      weight: {
        type: "number",
        description: "Weight in kg"
      },
      distance: {
        type: "number",
        description: "Distance in meters"
      },
      performingTime: {
        type: "integer",
        description: "Duration in seconds"
      },
      restTime: {
        type: "integer",
        description: "Rest in seconds"
      },
      rpe: {
        type: "integer",
        minimum: 1,
        maximum: 10
      },
      tempo: {
        type: "string",
        description: "Tempo string (e.g., '3-0-2-0')"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

#### updateSetChangeRequest

Update set parameters.

```typescript
{
  name: "updateSetChangeRequest",
  description: "Update parameters for a specific set or all sets of an exercise.",
  parameters: {
    type: "object",
    required: ["presetExerciseId", "reasoning"],
    properties: {
      presetExerciseId: {
        type: "string",
        description: "Parent exercise ID"
      },
      setIndex: {
        type: "integer",
        description: "Which set (1-based). Omit for all sets."
      },
      applyToAllSets: {
        type: "boolean",
        description: "Apply to all sets of this exercise"
      },
      reps: { type: "integer" },
      weight: { type: "number" },
      distance: { type: "number" },
      performingTime: { type: "integer" },
      restTime: { type: "integer" },
      rpe: { type: "integer" },
      tempo: { type: "string" },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

#### deleteSetChangeRequest

Remove sets from an exercise.

```typescript
{
  name: "deleteSetChangeRequest",
  description: "Remove sets from an exercise in the template.",
  parameters: {
    type: "object",
    required: ["presetExerciseId", "reasoning"],
    properties: {
      presetExerciseId: {
        type: "string"
      },
      setIndex: {
        type: "integer",
        description: "Which set to remove (1-based). Omit to remove last set."
      },
      removeCount: {
        type: "integer",
        default: 1,
        description: "Number of sets to remove from end"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

---

## Domain 2: Workout Tools (Athlete)

### Training Set Tools

#### createTrainingSetChangeRequest

Log actual performance for a set. Creates a training detail record.

```typescript
{
  name: "createTrainingSetChangeRequest",
  description: "Log the athlete's actual performance for a set.",
  parameters: {
    type: "object",
    required: ["exercisePresetId", "setIndex", "reasoning"],
    properties: {
      exercisePresetId: {
        type: "string",
        description: "Exercise preset ID in this workout"
      },
      setIndex: {
        type: "integer",
        minimum: 1,
        description: "Which set (1-based)"
      },
      reps: {
        type: "integer",
        minimum: 0,
        description: "Actual reps (0 = skipped)"
      },
      weight: {
        type: "number",
        description: "Actual weight used (kg)"
      },
      rpe: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "How hard it felt"
      },
      completed: {
        type: "boolean",
        default: true
      },
      distance: { type: "number" },
      performingTime: { type: "integer" },
      power: { type: "number" },
      velocity: { type: "number" },
      effort: { type: "number" },
      height: { type: "number" },
      resistance: { type: "number" },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

**Skip Semantics**: Log with `reps: 0, completed: false` to record that a set was skipped.

#### updateTrainingSetChangeRequest

Update already-logged performance.

```typescript
{
  name: "updateTrainingSetChangeRequest",
  description: "Update performance data that was already logged.",
  parameters: {
    type: "object",
    required: ["trainingDetailId", "reasoning"],
    properties: {
      trainingDetailId: {
        type: "string",
        description: "ID of the training detail to update"
      },
      reps: { type: "integer" },
      weight: { type: "number" },
      rpe: { type: "integer" },
      completed: { type: "boolean" },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

### Training Session Tools

#### updateTrainingSessionChangeRequest

Update session-level properties (notes only).

```typescript
{
  name: "updateTrainingSessionChangeRequest",
  description: "Update the athlete's workout session notes.",
  parameters: {
    type: "object",
    required: ["trainingSessionId", "reasoning"],
    properties: {
      trainingSessionId: {
        type: "string",
        description: "ID of the training session"
      },
      notes: {
        type: "string",
        description: "Session notes"
      },
      reasoning: {
        type: "string"
      }
    }
  }
}
```

---

## Shared Tools

### searchExercises (Read-Only)

Find exercises from the library. **Does not create ChangeRequests.**

```typescript
{
  name: "searchExercises",
  description: "Search the exercise library. Returns matches but does not add to changeset.",
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "Natural language search"
      },
      muscleGroups: {
        type: "array",
        items: { type: "string" }
      },
      equipment: {
        type: "array",
        items: { type: "string" }
      },
      excludeEquipment: {
        type: "array",
        items: { type: "string" }
      },
      injuryConsiderations: {
        type: "array",
        items: { type: "string" }
      },
      limit: {
        type: "integer",
        default: 5,
        maximum: 10
      }
    }
  }
}
```

---

## Coordination Tools

### confirmChangeSet

Submit pending changes for approval.

```typescript
{
  name: "confirmChangeSet",
  description: "Submit all pending changes for user review. Pauses AI stream until user decides.",
  parameters: {
    type: "object",
    required: ["title", "description"],
    properties: {
      title: {
        type: "string",
        maxLength: 100
      },
      description: {
        type: "string"
      }
    }
  }
}
```

### resetChangeSet

Clear all pending changes.

```typescript
{
  name: "resetChangeSet",
  description: "Clear all pending changes and start fresh.",
  parameters: {
    type: "object",
    properties: {}
  }
}
```

---

## Tool Availability by Context

### Training Plans (Coach)

| Category | Tool | Available |
|----------|------|-----------|
| **Read** | `getSessionContext` | ✅ |
| **Read** | `getExerciseHistory` | ❌ (athlete only) |
| **Search** | `searchExercises` | ✅ |
| **Proposal** | `createSessionChangeRequest` | ✅ |
| **Proposal** | `updateSessionChangeRequest` | ✅ |
| **Proposal** | `createExerciseChangeRequest` | ✅ |
| **Proposal** | `updateExerciseChangeRequest` | ✅ (includes swap) |
| **Proposal** | `deleteExerciseChangeRequest` | ✅ |
| **Proposal** | `createSetChangeRequest` | ✅ |
| **Proposal** | `updateSetChangeRequest` | ✅ |
| **Proposal** | `deleteSetChangeRequest` | ✅ |
| **Coordination** | `confirmChangeSet` | ✅ |
| **Coordination** | `resetChangeSet` | ✅ |

### Workout (Athlete)

| Category | Tool | Available |
|----------|------|-----------|
| **Read** | `getSessionContext` | ✅ (includes prescribed vs actual) |
| **Read** | `getExerciseHistory` | ✅ |
| **Search** | `searchExercises` | ✅ |
| **Proposal** | `createTrainingSetChangeRequest` | ✅ |
| **Proposal** | `updateTrainingSetChangeRequest` | ✅ |
| **Proposal** | `updateTrainingSessionChangeRequest` | ✅ (notes only) |
| **Coordination** | `confirmChangeSet` | ✅ |
| **Coordination** | `resetChangeSet` | ✅ |

---

## Tool Count Summary

| Domain | Read | Search | Proposal | Coordination | Total |
|--------|------|--------|----------|--------------|-------|
| Coach (Training Plans) | 1 | 1 | 8 | 2 | **12** |
| Athlete (Workout) | 2 | 1 | 3 | 2 | **8** |

---

## Transformation Layer

Each tool input is transformed to standard `ChangeRequest` format by the transformation layer. See `20251221-changeset-transformation-layer.md` for details.

```typescript
// Example: createExerciseChangeRequest tool input
{
  exerciseId: "ex-123",
  exerciseName: "Romanian Deadlifts",
  presetOrder: 3,
  reasoning: "Added for posterior chain"
}

// Transformed to ChangeRequest
{
  id: "cr-uuid",
  operationType: "create",
  entityType: "preset_exercise",
  entityId: null,
  currentData: null,
  proposedData: {
    exerciseId: "ex-123",
    exerciseName: "Romanian Deadlifts",
    presetOrder: 3
  },
  executionOrder: 0,
  aiReasoning: "Added for posterior chain"
}
```

---

## References

- Transformation Layer: `20251221-changeset-transformation-layer.md`
- Entity Model: `20251221-session-entity-model.md`
- Architecture: `20251221-changeset-architecture.md`
