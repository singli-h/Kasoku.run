# Ground Truth Audit: Plan Page

**Audit Date**: 2026-01-07
**Auditor**: Code Analysis
**Purpose**: Document actual implementation state for accurate spec creation

---

## 1. Coach Home Page

### Files Analyzed
| File | Lines | Role |
|------|-------|------|
| `PlansHome.tsx` | 142 | Server component, data fetching |
| `PlansHomeClient.tsx` | 270 | Client component, UI rendering |

### Data Fetching (Server Component)

**PlansHome.tsx** fetches:
```typescript
// Line 24-30
const macrocycleResult = await getMacrocyclesAction()

// Line 35-55 (parallel race fetching)
const racesResults = await Promise.all(
  macrocycles.map(m => getRacesByMacrocycleAction(m.id))
)
```

**Data Transformation (Lines 68-123)**:
- Extracts phases from mesocycles
- Calculates volume/intensity from microcycles
- Computes race positions using `exactPosition` ratio
- Returns `TransformedMacrocycle[]`

### Actions Available

| Action | Line | Status | Implementation |
|--------|------|--------|----------------|
| Open Plan | 104-108 | Working | `<Link href="/plans/{id}">` |
| Assign to Groups | 117-120 | Working | Opens `AssignmentView` dialog |
| Duplicate Plan | 121-124 | **Disabled** | `<DropdownMenuItem disabled>` |
| Export | 125-128 | **Disabled** | `<DropdownMenuItem disabled>` |
| Delete | 130-133 | **Disabled** | `<DropdownMenuItem disabled>` |
| New Plan | 177-182 | Working | `<Link href="/plans/new">` |
| Search | 189-194 | Working | Filters by name |
| State Filter | 196-206 | Working | Draft/Active/Archived |
| Group Filter | 207-219 | Working | Dynamic from data |

### Assignment Flow (Line 247-266)
```typescript
<Dialog open={selectedPlanForAssignment !== null}>
  <AssignmentView
    macrocycleId={Number(selectedPlanForAssignment)}
    onAssignmentComplete={() => {
      setSelectedPlanForAssignment(null)
      window.location.reload()  // ← Issue: jarring reload
    }}
  />
</Dialog>
```

---

## 2. Individual Home Page

### Files Analyzed
| File | Lines | Role |
|------|-------|------|
| `IndividualPlansHome.tsx` | 92 | Server component |
| `IndividualPlansHomeClient.tsx` | 191 | Client component |

### Data Fetching (Server Component)

**IndividualPlansHome.tsx** fetches:
```typescript
// Line 18-20
const [allMesosResult, activeBlockResult] = await Promise.all([
  getUserMesocyclesAction(),
  getActiveMesocycleForUserAction()
])
```

**Data Organization (Lines 35-79)**:
- Splits into `completedBlocks`, `upcomingOrActiveBlocks`
- Identifies current week
- Finds today's workout by day of week

### Sections Rendered

| Section | Condition | Lines |
|---------|-----------|-------|
| Active Training | `activeBlock` exists | 52-65 |
| This Week | `activeBlock` exists | 67-76 |
| Upcoming | `upcomingBlocks.length > 0` | 78-88 |
| Completed | `completedBlocks.length > 0` | 90-107 |
| Empty State | No blocks | 35-36 |

### WeekOverview Component (Lines 115-190)

```typescript
function WeekOverview({ block }: { block: MesocycleWithDetails }) {
  // Finds current microcycle (line 120-124)
  const currentMicrocycle = block.microcycles?.find(micro => {
    const startDate = new Date(micro.start_date!)
    const endDate = new Date(micro.end_date!)
    return today >= startDate && today <= endDate
  })

  // Gets workouts for current week
  const workouts = currentMicrocycle?.session_plans || []

  // Renders 7-day grid (lines 143-186)
  // NOT CLICKABLE - static div elements
}
```

### Issue: Completed Blocks Link (Lines 98-103)
```typescript
{completedBlocks.length > 3 && (
  <Link href="/plans?filter=completed">
    View all {completedBlocks.length} completed blocks
  </Link>
)}
// ← Issue: filter=completed not implemented
```

---

## 3. Coach Workspace

### File Analyzed
| File | Lines | Role |
|------|-------|------|
| `TrainingPlanWorkspace.tsx` | 1185 | Client component |

### Layout Structure

**Desktop (3-Column)**: Lines 495-825
```
Col 1: Mesocycles + Events/Races
Col 2: Microcycles (weeks)
Col 3: Sessions for selected week
```

**Mobile (Swipe)**: Lines 828-1138
```
3-panel sliding interface with touch gestures
```

### State Management (Lines 163-177)

```typescript
const [plan, setPlan] = useState(initialPlan)
const [history, setHistory] = useState<MacrocycleWithDetails[]>([initialPlan])
const [historyIndex, setHistoryIndex] = useState(0)
```

**Critical Finding**: All edits update local state only, NOT persisted to database.

### Dialog Components Used

| Dialog | Purpose | Lines |
|--------|---------|-------|
| EditMesocycleDialog | Edit phase | 1142-1148 |
| EditMicrocycleDialog | Edit week | 1150-1156 |
| EditRaceDialog | Edit race/event | 1158-1164 |
| EditSessionDialog | Edit session | 1166-1172 |
| CopySessionDialog | Copy session | 1174-1181 |

### Copy Session - Only Persisted Action (Lines 350-369)
```typescript
const handleCopySession = async (targetMicrocycleId: number, targetDay: number) => {
  const result = await copySessionAction(
    copySourceSession.id,
    targetMicrocycleId,
    targetDay
  )
  if (result.isSuccess) {
    toast({ title: "Session copied successfully" })
    router.refresh()  // ← Actually refreshes data
  }
}
```

---

## 4. Individual Workspace

### File Analyzed
| File | Lines | Role |
|------|-------|------|
| `IndividualWorkspace.tsx` | 283 | Client component |

### Disabled Features

| Feature | Lines | Status |
|---------|-------|--------|
| Edit Block | 72-75 | `disabled title="Coming soon"` |
| Add Workout | 110-114 | `disabled title="Coming soon"` |
| Add First Workout | 239-242 | `disabled title="Coming soon"` |

**Code Evidence**:
```typescript
// Line 72-75
<Button disabled title="Coming soon">
  Edit Block
</Button>

// Line 110-114
<Button disabled title="Coming soon" size="sm">
  <Plus className="h-4 w-4" />
  Add Workout
</Button>
```

### Navigation (Line 207)
```typescript
<Link href={`/plans/${blockId}/session/${workout.id}`}>
  <WorkoutCard ... />
</Link>
```

---

## 5. Creation Wizards

### MesoWizard (Coach)

**File**: `MesoWizard.tsx` (120 lines)

**Steps**:
```typescript
type WizardStep = 'type' | 'config' | 'sessions' | 'review'
const steps: WizardStep[] = ['type', 'config', 'sessions', 'review']
```

**Components per step**:
- `type` → `PlanTypeSelection`
- `config` → `PlanConfiguration`
- `sessions` → `SessionPlanning`
- `review` → `PlanReview`

### QuickStartWizard (Individual)

**File**: `QuickStartWizard.tsx` (449 lines)

**Steps**:
```typescript
type WizardStep = "settings" | "week"
```

**Step 1 - Settings (Lines 207-333)**:
- Name input (Zod: min 3 chars)
- Duration presets: 4, 6, 8 weeks
- Focus options: strength, endurance, general

**Step 2 - Week Setup (Lines 338-448)**:
- 7-day toggle buttons
- Training days counter

**Server Action Call (Lines 108-114)**:
```typescript
const result = await createQuickTrainingBlockAction({
  name: blockSettings.name,
  startDate: formatDateOnly(startDate),
  endDate: formatDateOnly(endDate),
  focus: blockSettings.focus,
  trainingDays: data.trainingDays,
})
```

---

## 6. Server Actions

### plan-actions.ts (1576 lines)

**Macrocycle Actions**:
1. `createMacrocycleAction` - Lines 32-83
2. `getMacrocyclesAction` - Lines 88-138
3. `getMacrocycleByIdAction` - Lines 143-200
4. `updateMacrocycleAction` - Lines 213-260
5. `deleteMacrocycleAction` - Lines 263-310

**Mesocycle Actions**:
6. `createMesocycleAction` - Lines 312-366
7. `getMesocyclesByMacrocycleAction` - Lines 369-427
8. `getMesocycleByIdAction` - Lines 429-492
9. `updateMesocycleAction` - Lines 495-542
10. `deleteMesocycleAction` - Lines 545-614

**Microcycle Actions**:
11. `createMicrocycleAction` - Lines 617-740
12. `getMicrocyclesByMesocycleAction` - Lines 743-799
13. `getMicrocycleByIdAction` - Lines 801-860
14. `updateMicrocycleAction` - Lines 863-910
15. `deleteMicrocycleAction` - Lines 913-981

**Individual User Actions**:
16. `getUserMesocyclesAction` - Lines 1229-1290
17. `getActiveMesocycleForUserAction` - Lines 1292-1362
18. `hasActiveTrainingBlockAction` - Lines 1365-1407
19. `createQuickTrainingBlockAction` - Lines 1422-1575

**All actions follow pattern**:
```typescript
export async function someAction(): Promise<ActionState<T>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)
    // ... operation
    revalidatePath('/path')
    return { isSuccess: true, message: 'Success', data }
  } catch (error) {
    console.error('[actionName]:', error)
    return { isSuccess: false, message: 'Error message' }
  }
}
```

---

## 7. Summary of Issues Found

### Critical (P0)
| Issue | Location | Impact |
|-------|----------|--------|
| Edit Block disabled | `IndividualWorkspace.tsx:72-75` | Users can't modify blocks |
| Add Workout disabled | `IndividualWorkspace.tsx:110-114,239-242` | Users can't add workouts |

### High (P1)
| Issue | Location | Impact |
|-------|----------|--------|
| Disabled menu items visible | `PlansHomeClient.tsx:121-133` | User confusion |
| No quick workout CTA | `IndividualPlansHomeClient.tsx` | Extra clicks to start |
| Week days not clickable | `IndividualPlansHomeClient.tsx:143-186` | Missed interaction |

### Medium (P2)
| Issue | Location | Impact |
|-------|----------|--------|
| window.location.reload | `PlansHomeClient.tsx:261` | Jarring UX |
| Broken filter link | `IndividualPlansHomeClient.tsx:100` | Dead end |
| No periodization tooltips | Multiple | Coach confusion |

### Low (P3)
| Issue | Location | Impact |
|-------|----------|--------|
| Redundant sections | `IndividualPlansHomeClient.tsx` | Visual clutter |
| No swipe indicator | `TrainingPlanWorkspace.tsx` | Hidden feature |

---

## 8. What Works Well

- Role-based routing (coach vs individual)
- Data fetching with parallel promises
- Timeline + chart visualizations
- Mobile swipe navigation (when discovered)
- Copy session persists correctly
- Quick start wizard flow
- Empty states handled
- Type safety throughout
- Proper auth checks in all actions

---

## 9. Corrections to Initial Analysis

| Initial Claim | Ground Truth |
|---------------|--------------|
| "Coach workspace edits don't persist" | **Correct** - intentional design, editing happens on dedicated pages |
| "WeekOverview days are clickable" | **Incorrect** - they are NOT clickable, just visual indicators |
| "router.refresh used for reload" | **Incorrect** - uses window.location.reload() |
| "4-step wizard for coach" | **Correct** - type, config, sessions, review |
| "2-step wizard for individual" | **Correct** - settings, week |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
