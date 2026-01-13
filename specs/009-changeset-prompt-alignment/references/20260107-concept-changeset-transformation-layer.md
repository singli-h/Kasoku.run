# ChangeSet Pattern: Transformation Layer

**Purpose**: Document the transformation layer that converts entity-specific tool inputs into standard ChangeRequest format
**Scope**: Domain-agnostic - patterns applicable to any entity types
**Principle**: Tools are entity-specific and operation-specific; transformation is mechanical

---

## Two-Layer Design

The ChangeSet pattern has two distinct layers:

| Layer | Purpose | What It Contains |
|-------|---------|------------------|
| **Tool Schema** | AI-facing interface | Entity-specific parameters, business logic fields |
| **ChangeRequest** | Internal data format | Standard format for buffer/execution |

**Key Points:**

1. **Tool names follow convention** - `{operation}{EntityType}ChangeRequest`
2. **Operations are consistent** - AI reads current data first, then proposes appropriate operation (create/update/delete)
3. **Transformation is mechanical** - Maps tool parameters to ChangeRequest fields, no operation type conversion

**Example:**
```
AI calls: updateOrderChangeRequest({ orderId: "123", status: "shipped" })
                    ↓
Transformation: Extract fields, build standard format
                    ↓
ChangeRequest: {
  operationType: 'update',
  entityType: 'order',
  entityId: '123',
  proposedData: { status: "shipped" }
}
```

The transformation layer is purely mechanical - it reformats tool input into ChangeRequest structure without changing semantics.

---

## Core Principle

> **Tools should be simple and focused. Each tool = one entity type + one operation.**

The AI calls entity-specific tools with natural parameters. A **transformation layer** converts these into the standard `ChangeRequest` format for the keyed buffer.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI TOOL CALLS                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ create[Entity]  │  │ update[Entity]  │  │ delete[Entity]  │     │
│  │ ChangeRequest   │  │ ChangeRequest   │  │ ChangeRequest   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSFORMATION LAYER                             │
│                                                                      │
│  • Parse tool name to extract entity type and operation              │
│  • Extract entity ID from tool-specific field                        │
│  • Build proposedData from tool parameters                           │
│  • Fetch currentData for updates/deletes                             │
│  • Map to standard ChangeRequest format                              │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STANDARD ChangeRequest                           │
│  {                                                                   │
│    id: string,                                                       │
│    operationType: "create" | "update" | "delete",                    │
│    entityType: string,                                               │
│    entityId: string | null,                                          │
│    currentData: object | null,                                       │
│    proposedData: object | null,                                      │
│    executionOrder: number                                            │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Transformation Functions

### Generic Transformer

```typescript
interface ToolInput {
  [key: string]: unknown
  reasoning?: string
}

interface TransformResult {
  changeRequest: ChangeRequest
  entityId: string  // Returned to AI for subsequent operations
}

function transformToolInput(
  entityType: string,
  operationType: OperationType,
  toolInput: ToolInput
): TransformResult {

  // 1. Get entity ID (generated for creates, extracted for update/delete)
  const entityId = getEntityId(entityType, operationType, toolInput)

  // 2. Fetch current data for updates/deletes
  const currentData = operationType !== 'create'
    ? await fetchCurrentData(entityType, entityId)
    : null

  // 3. Build proposed data (exclude ID fields)
  const proposedData = operationType !== 'delete'
    ? buildProposedData(entityType, toolInput)
    : null

  // 4. Return ChangeRequest and entityId
  const changeRequest: ChangeRequest = {
    id: generateId(),
    operationType,
    entityType,
    entityId,
    currentData,
    proposedData,
    executionOrder: getNextOrder(),
    aiReasoning: toolInput.reasoning,
    createdAt: new Date()
  }

  return { changeRequest, entityId }
}
```

### Entity ID Handling

```typescript
// Domain implementations define their own ID field mappings
// Example configuration:
const ENTITY_ID_FIELDS: Record<string, string> = {
  'order': 'orderId',
  'item': 'itemId',
  'customer': 'customerId',
  // ... domain-specific mappings
}

function getEntityId(
  entityType: string,
  operationType: OperationType,
  toolInput: ToolInput
): string {

  if (operationType === 'create') {
    // Generate ID for creates (not in tool input)
    return `temp-${crypto.randomUUID()}`
  }

  // For update/delete, extract from tool input
  const idField = ENTITY_ID_FIELDS[entityType]
  const entityId = toolInput[idField]

  if (!entityId) {
    throw new Error(`Missing ${idField} for ${operationType} operation`)
  }

  return String(entityId)
}
```

### Build Proposed Data

```typescript
function buildProposedData(
  entityType: string,
  toolInput: ToolInput
): Record<string, unknown> | null {

  // Clone and remove metadata fields
  const { reasoning, ...data } = toolInput

  // Remove entity-specific ID fields
  const idField = ENTITY_ID_FIELDS[entityType]
  delete data[idField]

  return data
}
```

---

## Entity ID Generation for Creates

For `create` operations, the entity ID is **generated by the transformation layer** (not provided by AI in the tool input).

### The Pattern

```typescript
function generateEntityId(): string {
  // Generate UUID with temp- prefix
  return `temp-${crypto.randomUUID()}`
}
```

### Why This Approach?

1. **AI doesn't need to provide ID** — The create tool schema has no `entityId` field
2. **ID is returned to AI** — AI receives the generated ID in the tool result for subsequent operations
3. **Temp prefix marks uncommitted** — `temp-` indicates the entity hasn't been persisted yet
4. **Execution strips prefix** — When executing, just remove the prefix to get the real ID

### Create Flow

```
1. AI calls createOrderChangeRequest({ customerId: "123", ... })
       │
2. Transformation layer generates: entityId = "temp-550e8400-..."
       │
3. ChangeRequest created with entityId = "temp-550e8400-..."
       │
4. Tool result returned to AI: { success: true, entityId: "temp-550e8400-..." }
       │
5. AI can now reference this ID for child entities or corrections
```

### Execution: Stripping the Prefix

```typescript
async function executeCreate(request: ChangeRequest): Promise<void> {
  // Strip temp- prefix to get real ID
  const realId = request.entityId.replace(/^temp-/, '')

  await db.insert(request.entityType, {
    id: realId,
    ...request.proposedData
  })
}
```

### Fallback for Auto-Increment IDs

If the database uses auto-increment IDs (not UUID/ULID), use an ID mapping approach:

```typescript
const idMap = new Map<string, string>()  // temp-id → real-id

async function executeCreate(request: ChangeRequest): Promise<void> {
  const { data } = await db
    .insert(request.entityType, request.proposedData)
    .select('id')
    .single()

  // Store mapping for child entities
  idMap.set(request.entityId, data.id)
}

// When executing child entities, resolve foreign keys:
function resolveForeignKeys(data: object): object {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' && idMap.has(value)
        ? idMap.get(value)
        : value
    ])
  )
}
```

---

## Domain Implementation

Each domain defines:

1. **Entity types** - What entities can be modified
2. **ID field mappings** - How to extract entity IDs from tool input
3. **Tool schemas** - Entity-specific parameter definitions

These are documented in domain-specific files (e.g., `session-tool-definitions.md`).

---

## Summary

| Layer | Responsibility |
|-------|----------------|
| **AI Tools** | Simple, focused schemas per entity + operation |
| **Transformation Layer** | Convert tool input → standard ChangeRequest |
| **Keyed Buffer** | Store ChangeRequests with upsert semantics |
| **Execution Layer** | Apply ChangeRequests to database |

**Key Principles:**
1. One tool = one entity + one operation
2. Tool schemas are simple and focused
3. Transformation is mechanical (no business logic conversion)
4. ChangeRequest format is universal

---

## References

- Architecture: `20251221-concept-changeset-architecture.md`
- Tool Design: `20251221-concept-changeset-tool-design.md`
- Client Tools: `20251221-concept-changeset-client-tools.md`
- Execution Flow: `20251221-concept-changeset-execution flow.md`
