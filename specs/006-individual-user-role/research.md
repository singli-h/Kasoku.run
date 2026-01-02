# Research: Individual User Role

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Resolve technical unknowns and establish best practices for implementation

---

## R1: Role-Based Access Control - visibleTo Array Pattern

### Question
What are the best practices for implementing role-based navigation visibility using an array pattern (visibleTo) vs boolean flags (coachOnly)?

### Decision
**Use `visibleTo` array pattern** for navigation item visibility.

### Rationale

The `visibleTo` array pattern is the industry-standard approach for role-based navigation:

1. **Flexibility**: Supports multiple roles per item without creating exponential boolean flags
2. **Scalability**: Adding new roles (like 'individual') requires no interface changes
3. **Readability**: Self-documenting - `visibleTo: ['coach', 'admin']` is clearer than `coachOnly && !athleteOnly`
4. **Centralized Logic**: Uses `item.visibleTo?.includes(userRole)` check

### Implementation Pattern

```typescript
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[]  // If undefined, visible to all roles
}

const navItems: NavItem[] = [
  { title: "Athletes", url: "/athletes", icon: Users, visibleTo: ['coach', 'admin'] },
  { title: "My Training", url: "/plans", icon: Calendar, visibleTo: ['coach', 'individual', 'admin'] },
  { title: "Workout", url: "/workout", icon: Dumbbell, visibleTo: ['athlete', 'individual'] },
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard }, // Visible to all
]

// Filter logic
const filteredItems = navItems.filter(item => {
  if (!item.visibleTo) return true // Visible to all if not specified
  return item.visibleTo.includes(userRole)
})
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Boolean flags (`coachOnly`, `athleteOnly`, etc.) | Exponential complexity with 4+ roles |
| Role-to-menu mapping object | Over-engineering for simple visibility |
| External configuration file | Adds indirection without benefit |

### Sources
- [Role-Based Sidebar Navigation in React Applications](https://dev.to/dmadridy/role-based-sidebar-navigation-in-react-applications-415o)
- [Implementing Role Based Access Control in React](https://www.permit.io/blog/implementing-react-rbac-authorization)
- [Role-based access in React](https://blog.openreplay.com/role-based-access-in-react/)

---

## R2: Race Conditions - Onboarding User Creation

### Question
How to prevent race conditions during individual user creation in onboarding (double-submit, duplicate athletes)?

### Decision
**Use database UPSERT with unique constraints** combined with **idempotency keys**.

### Rationale

The existing `onboarding-actions.ts` already uses the correct pattern:

```typescript
const { data: users, error: userError } = await supabase
  .from('users')
  .upsert([userFields], { onConflict: 'clerk_id' })  // ← UPSERT on clerk_id
  .select('id')
```

This pattern ensures:
1. **Atomic operation**: Insert-or-update is atomic at database level
2. **Unique constraint**: `clerk_id` unique constraint prevents duplicates
3. **Idempotent**: Multiple calls with same clerk_id result in same outcome

### Additional Safeguards for Individual Role

```typescript
// For athlete record creation (individual silently gets athlete record)
const { data: existingAthlete } = await supabase
  .from('athletes')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle()  // ← Returns null instead of error if not found

if (!existingAthlete) {
  // Only create if not exists
  await supabase.from('athletes').insert({ user_id: userId })
}
```

### Frontend Double-Submit Prevention

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

const handleComplete = async () => {
  if (isSubmitting) return  // ← Guard against double-submit
  setIsSubmitting(true)
  try {
    // ... onboarding logic
  } finally {
    setIsSubmitting(false)
  }
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Optimistic locking (version field) | Overkill for create-only flow |
| Distributed lock (Redis) | Added infrastructure complexity |
| Frontend-only debounce | Insufficient - server must enforce |

### Sources
- [Understanding and Avoiding Race Conditions in Node.js](https://medium.com/@ak.akki907/understanding-and-avoiding-race-conditions-in-node-js-applications-fb80ba79d793)
- [Idempotency in System Design](https://algomaster.io/learn/system-design/idempotency)
- [The Idempotent Consumer Pattern](https://www.milanjovanovic.tech/blog/the-idempotent-consumer-pattern-in-dotnet-and-why-you-need-it)

---

## R3: React Context Performance Optimization

### Question
How to optimize UserRoleContext for role-based rendering without causing unnecessary re-renders?

### Decision
**Split context + memoization** with current simple context being sufficient for this scope.

### Rationale

The current `UserRoleContext` is already well-designed:

```typescript
// Current implementation (already good)
const value: UserRoleContextValue = {
  role,
  isLoading,
  isCoach: role === 'coach',
  isAthlete: role === 'athlete',
  isAdmin: role === 'admin',
  hasRole: (requiredRole) => { ... }
}
```

**Why it's performant enough:**
1. **Stable values**: `isCoach`, `isAthlete`, etc. are derived booleans that only change when role changes
2. **Single role change**: Role only changes at onboarding/login - not during normal usage
3. **Shallow context**: No complex objects that could trigger false re-renders

### Recommended Enhancement for Individual Role

```typescript
// Add isIndividual to context value
const value: UserRoleContextValue = {
  role,
  isLoading,
  isCoach: role === 'coach',
  isAthlete: role === 'athlete',
  isAdmin: role === 'admin',
  isIndividual: role === 'individual',  // ← New
  hasRole: (requiredRole) => { ... }
}
```

### When to Optimize Further

If performance issues arise (unlikely), these patterns are available:
1. **useMemo for context value**: Wrap the value object
2. **Split static/dynamic**: Separate loading state from role data
3. **Context selector library**: `use-context-selector` for selective subscriptions

### Performance Statistics

According to research:
- React 19 Compiler provides 30-60% reduction in unnecessary re-renders
- useMemo can reduce render time from 916ms to 0.7ms in complex scenarios
- Our use case is simple (boolean flags) - no optimization needed

### Sources
- [How to optimize your context value](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
- [React context, performance?](https://dev.to/romaintrotard/react-context-performance-5832)
- [React Performance Optimization: Best Practices for 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)

---

## R4: Role-Based Terminology Mapping

### Question
What's the best pattern for role-based terminology (mesocycle→Training Block) in React?

### Decision
**Simple utility function** with React context consumption.

### Rationale

A pure function with the terminology mapping provides:
1. **Tree-shakeable**: Only imported where needed
2. **Testable**: Pure function with no side effects
3. **Type-safe**: Full TypeScript inference

### Implementation Pattern

```typescript
// lib/terminology.ts
import { UserRole } from '@/contexts/user-role-context'

export type Terminology = {
  mesocycle: string
  microcycle: string
  sessionPlan: string
  macrocycle: string | null  // null = hidden
}

export function getTerminology(role: UserRole | null): Terminology {
  if (role === 'individual') {
    return {
      mesocycle: 'Training Block',
      microcycle: 'Week',
      sessionPlan: 'Workout',
      macrocycle: null, // Hidden for individuals
    }
  }

  // Default (coach, admin, athlete)
  return {
    mesocycle: 'Mesocycle',
    microcycle: 'Microcycle',
    sessionPlan: 'Session Plan',
    macrocycle: 'Macrocycle',
  }
}

// Usage in component
import { useUserRole } from '@/contexts/user-role-context'
import { getTerminology } from '@/lib/terminology'

function PlanCard() {
  const { role } = useUserRole()
  const terms = getTerminology(role)

  return <h2>Create {terms.mesocycle}</h2>  // "Create Training Block" for individuals
}
```

### Custom Hook Option

For components that use terminology frequently:

```typescript
// hooks/use-terminology.ts
export function useTerminology() {
  const { role } = useUserRole()
  return useMemo(() => getTerminology(role), [role])
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| i18n library (react-intl, i18next) | Over-engineering for role-based terms only |
| Separate context for terminology | Added complexity without benefit |
| Component-level hardcoding | Maintenance nightmare, not DRY |

---

## Summary of Research Findings

| Topic | Decision | Confidence |
|-------|----------|------------|
| Navigation visibility | `visibleTo` array pattern | HIGH |
| Race condition prevention | UPSERT + unique constraints (existing pattern) | HIGH |
| Context performance | Current design is sufficient, add memoization if needed | HIGH |
| Terminology mapping | Pure utility function + optional hook | HIGH |

All NEEDS CLARIFICATION items from the plan are now resolved. Ready for Phase 1 design artifacts.

---

*Research completed: 2026-01-02*
