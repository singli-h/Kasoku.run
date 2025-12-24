# Application-Level Validation for RLS-Disabled Tables

> **Last Updated**: 2025-12-24

## Overview

While all tables in Kasoku now have RLS enabled (verified December 2025), this document provides guidance for implementing application-level validation when RLS policies cannot fully enforce access control, or when additional validation is needed beyond RLS.

## Current Status

**All 32 tables have RLS enabled** as of December 2025. However, some tables may have complex access patterns that require additional application-level validation to ensure proper security.

## When to Use Application-Level Validation

### 1. Complex Business Rules

RLS policies handle basic access control, but complex business rules may need application-level validation:

```typescript
// Example: Only coaches can create memories for their athletes
export async function createMemoryAction(
  input: MemoryInsert
): Promise<ActionState<Memory>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Authentication required" }
  }

  const dbUserId = await getDbUserId(userId)
  const user = await getUserAction(dbUserId)

  // Application-level validation: Only coaches can create memories
  if (user.role !== "coach") {
    return { isSuccess: false, message: "Only coaches can create memories" }
  }

  // Additional validation: Coach must own the athlete group
  if (input.group_id) {
    const group = await getAthleteGroupAction(input.group_id)
    if (group.coach_id !== user.coach_id) {
      return { isSuccess: false, message: "Cannot create memory for this group" }
    }
  }

  // RLS will also enforce access, but we validate at application level too
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ai_memories')
    .insert({ ...input, created_by: dbUserId })
    .select()
    .single()

  if (error) throw error
  return { isSuccess: true, message: "Memory created", data }
}
```

### 2. Multi-Step Operations

When operations span multiple tables or require complex validation:

```typescript
export async function assignPlanToAthleteAction(
  planId: number,
  athleteId: number
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Authentication required" }
  }

  const dbUserId = await getDbUserId(userId)
  const user = await getUserAction(dbUserId)

  // Application-level validation: Only coaches can assign plans
  if (user.role !== "coach") {
    return { isSuccess: false, message: "Only coaches can assign plans" }
  }

  // Validate coach owns the plan
  const plan = await getPlanAction(planId)
  if (plan.user_id !== dbUserId) {
    return { isSuccess: false, message: "Plan not found or access denied" }
  }

  // Validate athlete is in coach's group
  const athlete = await getAthleteAction(athleteId)
  if (!athlete.athlete_group_id) {
    return { isSuccess: false, message: "Athlete not in a group" }
  }

  const group = await getAthleteGroupAction(athlete.athlete_group_id)
  if (group.coach_id !== user.coach_id) {
    return { isSuccess: false, message: "Cannot assign plan to this athlete" }
  }

  // All validations passed, proceed with assignment
  // RLS policies will also enforce access
  // ...
}
```

### 3. Data Integrity Checks

Validation beyond access control:

```typescript
export async function createTrainingSessionAction(
  input: TrainingSessionInsert
): Promise<ActionState<TrainingSession>> {
  // ... authentication ...

  // Application-level validation: Check date is not in past
  if (input.date_time && new Date(input.date_time) < new Date()) {
    return { isSuccess: false, message: "Cannot create session in the past" }
  }

  // Application-level validation: Check athlete availability
  const existingSessions = await getAthleteSessionsAction(
    input.athlete_id,
    input.date_time
  )
  if (existingSessions.length > 0) {
    return { isSuccess: false, message: "Athlete already has a session at this time" }
  }

  // ... proceed with creation ...
}
```

## Validation Patterns

### 1. Role-Based Validation

```typescript
// Validate user role
const user = await getUserAction(dbUserId)
if (user.role !== "coach") {
  return { isSuccess: false, message: "Only coaches can perform this action" }
}
```

### 2. Ownership Validation

```typescript
// Validate user owns the resource
const resource = await getResourceAction(resourceId)
if (resource.user_id !== dbUserId) {
  return { isSuccess: false, message: "Resource not found or access denied" }
}
```

### 3. Relationship Validation

```typescript
// Validate relationships (coach-athlete, group membership, etc.)
const athlete = await getAthleteAction(athleteId)
const group = await getAthleteGroupAction(athlete.athlete_group_id)
if (group.coach_id !== user.coach_id) {
  return { isSuccess: false, message: "Cannot access this athlete" }
}
```

### 4. Business Rule Validation

```typescript
// Validate business rules
if (input.start_date > input.end_date) {
  return { isSuccess: false, message: "Start date must be before end date" }
}

if (input.max_participants && participants.length >= input.max_participants) {
  return { isSuccess: false, message: "Maximum participants reached" }
}
```

## Defense in Depth

### Layered Security Approach

1. **RLS Policies** (Database Level)
   - First line of defense
   - Enforces basic access control
   - Prevents unauthorized data access

2. **Application-Level Validation** (Application Level)
   - Second line of defense
   - Enforces complex business rules
   - Validates relationships and constraints

3. **Client-Side Validation** (UI Level)
   - User experience
   - Immediate feedback
   - Not security (can be bypassed)

### Example: Multi-Layer Validation

```typescript
export async function updateAthleteAction(
  athleteId: number,
  input: AthleteUpdate
): Promise<ActionState<Athlete>> {
  // Layer 1: Authentication (always first)
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Authentication required" }
  }

  const dbUserId = await getDbUserId(userId)
  const user = await getUserAction(dbUserId)

  // Layer 2: Application-level role validation
  if (user.role !== "coach" && user.role !== "admin") {
    return { isSuccess: false, message: "Insufficient permissions" }
  }

  // Layer 3: Application-level ownership/relationship validation
  const athlete = await getAthleteAction(athleteId)
  if (user.role === "coach") {
    const group = await getAthleteGroupAction(athlete.athlete_group_id)
    if (group.coach_id !== user.coach_id) {
      return { isSuccess: false, message: "Cannot update this athlete" }
    }
  }

  // Layer 4: Business rule validation
  if (input.weight && input.weight < 0) {
    return { isSuccess: false, message: "Weight must be positive" }
  }

  // Layer 5: Database operation (RLS will also enforce access)
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('athletes')
    .update(input)
    .eq('id', athleteId)
    .select()
    .single()

  if (error) throw error

  return { isSuccess: true, message: "Athlete updated", data }
}
```

## Best Practices

### 1. Always Validate at Application Level

Even if RLS policies exist, validate at application level for:
- Complex business rules
- Multi-step operations
- Data integrity

### 2. Return Clear Error Messages

```typescript
// ✅ GOOD: Clear, actionable error message
if (user.role !== "coach") {
  return { isSuccess: false, message: "Only coaches can create training plans" }
}

// ❌ BAD: Generic error message
if (user.role !== "coach") {
  return { isSuccess: false, message: "Access denied" }
}
```

### 3. Validate Early

```typescript
// ✅ GOOD: Validate before expensive operations
if (!userId) {
  return { isSuccess: false, message: "Authentication required" }
}

// Then do database queries
const user = await getUserAction(dbUserId)

// ❌ BAD: Do expensive operations first
const user = await getUserAction(dbUserId) // Expensive if not authenticated
if (!userId) {
  return { isSuccess: false, message: "Authentication required" }
}
```

### 4. Use Helper Functions

```typescript
// helpers/auth-helpers.ts
export async function requireCoachRole(): Promise<ActionState<CoachUser>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Authentication required" }
  }

  const dbUserId = await getDbUserId(userId)
  const user = await getUserAction(dbUserId)

  if (user.role !== "coach") {
    return { isSuccess: false, message: "Only coaches can perform this action" }
  }

  return { isSuccess: true, message: "Authorized", data: user }
}

// Usage in actions
export async function createPlanAction(input: PlanInsert) {
  const authResult = await requireCoachRole()
  if (!authResult.isSuccess) {
    return authResult
  }

  const coach = authResult.data
  // Proceed with plan creation
}
```

## Testing Application-Level Validation

### Unit Tests

```typescript
describe("createMemoryAction", () => {
  it("should reject non-coach users", async () => {
    // Mock user as athlete
    const result = await createMemoryAction({ content: "Test" })
    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("Only coaches")
  })

  it("should reject coaches creating memories for other groups", async () => {
    // Mock coach and different group
    const result = await createMemoryAction({
      content: "Test",
      group_id: otherGroupId
    })
    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("Cannot create memory")
  })
})
```

## Related Documentation

- [Row Level Security Analysis](./row-level-security-analysis.md)
- [ActionState Pattern](../patterns/actionstate-pattern.md)
- [Feature Pattern](../patterns/feature-pattern.md)

