# API Contract: Terminology Mapping

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Define role-based terminology mapping for individual-friendly UI

---

## Overview

Provide a utility function that maps technical periodization terms to user-friendly terms based on the user's role.

---

## Type Definitions

**File**: `lib/terminology.ts`

```typescript
import { UserRole } from '@/contexts/user-role-context'

/**
 * Terminology configuration for periodization concepts
 */
export interface Terminology {
  /** Mesocycle display name (e.g., "Training Block" or "Mesocycle") */
  mesocycle: string

  /** Microcycle display name (e.g., "Week" or "Microcycle") */
  microcycle: string

  /** Session plan display name (e.g., "Workout" or "Session Plan") */
  sessionPlan: string

  /** Macrocycle display name (null = hidden from UI) */
  macrocycle: string | null
}

/**
 * Plural forms for list contexts
 */
export interface TerminologyPlural {
  mesocycles: string
  microcycles: string
  sessionPlans: string
  macrocycles: string | null
}
```

---

## Function: getTerminology

```typescript
/**
 * Get terminology mapping based on user role
 *
 * @param role - The user's role (or null if not authenticated)
 * @returns Terminology object with role-appropriate display names
 *
 * @example
 * const { role } = useUserRole()
 * const terms = getTerminology(role)
 * return <h2>Create {terms.mesocycle}</h2>
 * // Individual: "Create Training Block"
 * // Coach: "Create Mesocycle"
 */
export function getTerminology(role: UserRole | null): Terminology {
  if (role === 'individual') {
    return {
      mesocycle: 'Training Block',
      microcycle: 'Week',
      sessionPlan: 'Workout',
      macrocycle: null,  // Hidden for individuals
    }
  }

  // Default for coach, admin, athlete
  return {
    mesocycle: 'Mesocycle',
    microcycle: 'Microcycle',
    sessionPlan: 'Session Plan',
    macrocycle: 'Macrocycle',
  }
}
```

---

## Function: getTerminologyPlural

```typescript
/**
 * Get plural terminology for list contexts
 *
 * @param role - The user's role
 * @returns Plural terminology object
 *
 * @example
 * const terms = getTerminologyPlural(role)
 * return <h2>Your {terms.mesocycles}</h2>
 * // Individual: "Your Training Blocks"
 */
export function getTerminologyPlural(role: UserRole | null): TerminologyPlural {
  if (role === 'individual') {
    return {
      mesocycles: 'Training Blocks',
      microcycles: 'Weeks',
      sessionPlans: 'Workouts',
      macrocycles: null,
    }
  }

  return {
    mesocycles: 'Mesocycles',
    microcycles: 'Microcycles',
    sessionPlans: 'Session Plans',
    macrocycles: 'Macrocycles',
  }
}
```

---

## Hook: useTerminology

```typescript
/**
 * React hook for accessing terminology in components
 *
 * @returns Memoized terminology object
 *
 * @example
 * function CreateBlockButton() {
 *   const terms = useTerminology()
 *   return <Button>Create {terms.mesocycle}</Button>
 * }
 */
export function useTerminology(): Terminology {
  const { role } = useUserRole()
  return useMemo(() => getTerminology(role), [role])
}

/**
 * React hook for plural terminology
 */
export function useTerminologyPlural(): TerminologyPlural {
  const { role } = useUserRole()
  return useMemo(() => getTerminologyPlural(role), [role])
}
```

---

## Terminology Matrix

| Technical Term | Coach/Admin | Athlete | Individual |
|----------------|-------------|---------|------------|
| Macrocycle | Macrocycle | Macrocycle | (hidden) |
| Mesocycle | Mesocycle | Mesocycle | Training Block |
| Microcycle | Microcycle | Microcycle | Week |
| Session Plan | Session Plan | Session Plan | Workout |

---

## Usage Examples

### In Page Titles

```typescript
// pages/plans/create/page.tsx
export default function CreatePlanPage() {
  const terms = useTerminology()

  return (
    <div>
      <h1>Create {terms.mesocycle}</h1>
      {/* Individual: "Create Training Block" */}
      {/* Coach: "Create Mesocycle" */}
    </div>
  )
}
```

### In List Headers

```typescript
// components/features/plans/PlansList.tsx
function PlansList({ plans }) {
  const terms = useTerminologyPlural()

  return (
    <div>
      <h2>Your {terms.mesocycles}</h2>
      {/* Individual: "Your Training Blocks" */}
    </div>
  )
}
```

### Conditional Macrocycle Visibility

```typescript
// components/features/plans/workspace/PlanWorkspace.tsx
function PlanWorkspace() {
  const terms = useTerminology()

  return (
    <div>
      {/* Only show macrocycle section if not hidden */}
      {terms.macrocycle && (
        <section>
          <h3>{terms.macrocycle}</h3>
          {/* ... macrocycle content */}
        </section>
      )}

      <section>
        <h3>{terms.mesocycle}</h3>
        {/* ... mesocycle content */}
      </section>
    </div>
  )
}
```

### In Form Labels

```typescript
// components/features/plans/CreateMesocycleForm.tsx
function CreateMesocycleForm() {
  const terms = useTerminology()

  return (
    <form>
      <Label>{terms.mesocycle} Name</Label>
      {/* Individual: "Training Block Name" */}
      <Input placeholder={`Enter ${terms.mesocycle.toLowerCase()} name`} />

      <Label>Number of {terms.microcycle}s</Label>
      {/* Individual: "Number of Weeks" */}
      <Input type="number" min={1} max={12} />
    </form>
  )
}
```

---

## Testing

```typescript
describe('getTerminology', () => {
  it('returns individual terminology for individual role', () => {
    const terms = getTerminology('individual')
    expect(terms.mesocycle).toBe('Training Block')
    expect(terms.microcycle).toBe('Week')
    expect(terms.sessionPlan).toBe('Workout')
    expect(terms.macrocycle).toBeNull()
  })

  it('returns coach terminology for coach role', () => {
    const terms = getTerminology('coach')
    expect(terms.mesocycle).toBe('Mesocycle')
    expect(terms.macrocycle).toBe('Macrocycle')
  })

  it('returns default terminology for null role', () => {
    const terms = getTerminology(null)
    expect(terms.mesocycle).toBe('Mesocycle')
  })
})
```

---

*Contract defined: 2026-01-02*
