# API Contract: Navigation Visibility

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Define navigation item visibility pattern for role-based access

---

## Overview

Replace the boolean `coachOnly` pattern with a more flexible `visibleTo` array pattern for navigation items.

---

## Type Definitions

### NavItem Interface (Updated)

**File**: `components/layout/sidebar/app-sidebar.tsx`

```typescript
// Before
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  coachOnly?: boolean  // ← Remove
}

// After
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[]  // ← New: array of roles that can see this item
  // If undefined, visible to ALL roles
}
```

### TrainingItem Interface (Updated)

```typescript
// Before
interface TrainingItem {
  name: string
  url: string
  icon: LucideIcon
  coachOnly?: boolean  // ← Remove
}

// After
interface TrainingItem {
  name: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[]  // ← New
}
```

---

## Navigation Configuration

### Main Navigation Items

**Note**: Individual = Athlete + self-planning. Knowledge Base is available to all roles.

```typescript
const navItems: NavItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Workout",
    url: "/workout",
    icon: Dumbbell,
    // visibleTo: undefined → visible to all (coaches also have athlete record)
  },
  {
    title: "Exercise Library",
    url: "/library",
    icon: BookOpen,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: FileText,
    // visibleTo: undefined → visible to all (updated per clarification)
  },
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Athletes",
    url: "/athletes",
    icon: Users,
    visibleTo: ['coach'],  // Coach-only - managing athletes
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    // visibleTo: undefined → visible to all
  },
]
```

### Training Navigation Items

```typescript
const trainingItems: TrainingItem[] = [
  {
    name: "My Training",  // Renamed from "Plans" for individuals
    url: "/plans",
    icon: Calendar,
    visibleTo: ['coach', 'individual'],  // Coaches + individuals can create plans
  },
  {
    name: "Sessions",
    url: "/sessions",
    icon: PlayCircle,
    visibleTo: ['coach'],  // Coach-only session management
  },
]
```

---

## Filtering Logic

### Filter Function

```typescript
function filterNavItems(items: NavItem[], userRole: UserRole | null): NavItem[] {
  if (!userRole) return []  // No role = no items (loading state)

  return items.filter(item => {
    // If visibleTo is undefined, item is visible to all roles
    if (!item.visibleTo) return true

    // Otherwise, check if user's role is in the allowed list
    return item.visibleTo.includes(userRole)
  })
}
```

### Usage in Component

```typescript
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { role, isLoading } = useUserRole()

  const filteredNavItems = useMemo(() => {
    if (isLoading || !role) return []
    return filterNavItems(navItems, role)
  }, [role, isLoading])

  const filteredTrainingItems = useMemo(() => {
    if (isLoading || !role) return []
    return filterNavItems(trainingItems, role)
  }, [role, isLoading])

  // ... render
}
```

---

## Access Matrix

**Note**: Individual = Athlete + self-planning. Coaches also have athlete capabilities.

| Path | Athlete | Individual | Coach | Notes |
|------|---------|------------|-------|-------|
| `/dashboard` | ✅ | ✅ | ✅ | All roles |
| `/workout` | ✅ | ✅ | ✅ | All roles (coaches have athlete record) |
| `/library` | ✅ | ✅ | ✅ | All roles |
| `/knowledge-base` | ✅ | ✅ | ✅ | All roles (clarification update) |
| `/performance` | ✅ | ✅ | ✅ | All roles |
| `/athletes` | ❌ | ❌ | ✅ | Coach-only |
| `/plans` | ❌ | ✅ | ✅ | Individual + Coach can create plans |
| `/sessions` | ❌ | ❌ | ✅ | Coach-only |
| `/settings` | ✅ | ✅ | ✅ | All roles |

---

## Route Protection

Navigation visibility is UI-only. Routes must also be protected server-side.

### Layout-Based Protection

```typescript
// app/(protected)/athletes/layout.tsx
export default async function AthletesLayout({ children }) {
  const { userId } = await auth()
  const role = await getUserRole(userId)

  if (!['coach', 'admin'].includes(role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
```

### Action-Based Protection

```typescript
// actions/athletes/athlete-actions.ts
export async function getAthletesAction(): Promise<ActionState<Athlete[]>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: 'Not authenticated' }

  const role = await getUserRole(userId)
  if (!['coach', 'admin'].includes(role)) {
    return { isSuccess: false, message: 'Unauthorized' }
  }

  // ... fetch athletes
}
```

---

*Contract defined: 2026-01-02*
