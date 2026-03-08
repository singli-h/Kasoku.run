# ChangeSet Pattern: Tool Design

**Purpose**: Define how to design and structure AI tools for the ChangeSet pattern
**Scope**: Tool naming conventions, categories, schema patterns, parsing
**Audience**: Engineers defining tools for AI agents

---

## 1. Tool Categories

| Category | Purpose | Runs On | Returns Tool Result? |
|----------|---------|---------|---------------------|
| **Proposal Tools** | Build changeset | Client | Yes (immediate) |
| **Coordination Tools** | Control workflow | Client | Delayed (after user decision) |
| **Read Tools** | Fetch current data | Server | Yes (immediate) |

---

## 2. Tool Naming Convention

```
{operation}{EntityType}ChangeRequest
```

| Operation | Entity | Tool Name |
|-----------|--------|-----------|
| create | Order | `createOrderChangeRequest` |
| update | Order | `updateOrderChangeRequest` |
| delete | Order | `deleteOrderChangeRequest` |
| create | Item | `createItemChangeRequest` |
| update | Item | `updateItemChangeRequest` |
| delete | Item | `deleteItemChangeRequest` |

**Supported Operations:**
- `create` - Add new entity
- `update` - Modify existing entity
- `delete` - Remove entity

---

## 3. Anti-Pattern: Combined Tools

```typescript
// WRONG: One tool with action parameter
{
  name: "modifyEntity",
  parameters: {
    action: "create" | "update" | "delete",  // Complex conditional logic
    entityId: string,      // Required for some actions
    // ... many conditional fields
  }
}
```

**Problems:**
- Complex schema with conditional fields
- AI must understand which fields apply to which action
- Harder to validate
- Doesn't align with ChangeRequest structure

---

## 4. Correct Pattern: Separate Tools Per Operation

```typescript
// CORRECT: Separate tools per operation
{
  name: "createOrderChangeRequest",
  parameters: {
    customerId: string,
    items: ItemData[],
    reasoning: string
  }
}

{
  name: "updateOrderChangeRequest",
  parameters: {
    orderId: string,        // Which order to update
    status: string,
    reasoning: string
  }
}

{
  name: "deleteOrderChangeRequest",
  parameters: {
    orderId: string,        // Which order to remove
    reasoning: string
  }
}
```

**Benefits:**
- Simple, focused schemas
- Clear required fields for each operation
- Easy for AI to use correctly
- Direct mapping to ChangeRequest

---

## 5. Proposal Tool Schema Pattern

### 5.1 Create Tool

```typescript
{
  name: "create[EntityType]ChangeRequest",
  description: "Add a new [entity] to the changeset",
  parameters: {
    // Entity-specific fields for creation (NO entityId)
    field1: type,
    field2: type,
    reasoning: string         // AI explains why
  }
}
```

**Note**: `entityId` is NOT in the input schema for creates. It is generated and returned in the tool result.

### 5.2 Update Tool

```typescript
{
  name: "update[EntityType]ChangeRequest",
  description: "Update an existing [entity] in the changeset",
  parameters: {
    entityId: string,         // Required - which entity to update
    // Fields to change (partial update)
    field1?: type,
    field2?: type,
    reasoning: string
  }
}
```

### 5.3 Delete Tool

```typescript
{
  name: "delete[EntityType]ChangeRequest",
  description: "Remove an [entity] from the changeset",
  parameters: {
    entityId: string,         // Required - which entity to delete
    reasoning: string
  }
}
```

---

## 6. Coordination Tools

```typescript
// Submit for approval
{
  name: "confirmChangeSet",
  parameters: {
    title: string,
    description: string
  }
}

// Clear and start over (rare)
{
  name: "resetChangeSet",
  parameters: {}
}
```

---

## 7. Tool Name Parsing

Extract entity type and operation from standardized tool names.

```typescript
/**
 * Parse tool name to extract entity and operation
 * Example: "createTransactionChangeRequest" -> { entity: "transaction", operation: "create" }
 */
function parseChangeRequestToolName(toolName: string): {
  entity: EntityType
  operation: OperationType
} {
  // Tool name pattern: {operation}{Entity}ChangeRequest
  const match = toolName.match(
    /^(create|update|delete)([A-Z][a-zA-Z]+)ChangeRequest$/
  )

  if (!match) {
    throw new Error(`Invalid changeset tool name: ${toolName}`)
  }

  const [, operation, entityPascal] = match
  const entity = entityPascal.toLowerCase() as EntityType

  return {
    entity,
    operation: operation as OperationType,
  }
}
```

### 7.1 Why This Pattern?

| Benefit | Explanation |
|---------|-------------|
| **Single Source of Truth** | Tool name encodes the operation, no separate mapping needed |
| **Type Safety** | Pattern matching validates the tool name format |
| **Extensibility** | Add new entities without changing parser logic |
| **Consistency** | Enforces naming convention across all tools |

---

## 8. Tool Result Pattern

### 8.1 Create Tool Result

```typescript
// Tool result for createOrderChangeRequest
{
  success: true,
  entityId: "temp-550e8400-e29b-41d4-a716-446655440000",  // Generated, returned to AI
  message: "Change request added: create order"
}
```

**Key**: The generated `entityId` is returned so AI can reference it for:
- Child entity creation (foreign key)
- Subsequent corrections/updates
- Buffer removal (delete with temp ID)

### 8.2 Update/Delete Tool Result

```typescript
{
  success: true,
  message: "Change request added: update order"
}
```

### 8.3 Error Result

```typescript
{
  success: false,
  error: "Missing required field: orderId"
}
```

---

## Summary

| Aspect | Pattern |
|--------|---------|
| **Naming** | `{operation}{EntityType}ChangeRequest` |
| **Tools per entity** | 3 (create, update, delete) |
| **Create input** | No entityId (generated internally) |
| **Create output** | Returns generated entityId |
| **Update/Delete input** | Requires entityId |
| **Coordination** | `confirmChangeSet`, `resetChangeSet` |
