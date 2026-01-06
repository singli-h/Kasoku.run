# Individual User "My Training" Implementation Plan

> **Status**: Planning
> **Created**: 2026-01-04
> **Target**: MVP Individual User Experience
> **Related Docs**:
> - [Individual User Role Design](./individual-user-role-design.md)
> - [Lo-Fi Wireframes](../design/individual-my-training-lofi.md)

---

## Executive Summary

This plan implements a simplified "My Training" experience for individual users (self-coached athletes, gym-goers) while reusing existing infrastructure. The approach uses **role-based UI adaptation** rather than building a separate system.

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Simplified "My Training" page | AI-powered plan generation |
| 2-step Quick Start wizard | Auto-progression engine |
| 2-column workspace layout | Social/sharing features |
| Terminology mapping | Coach upgrade flow |
| Template integration | Payment integration |

### Success Criteria

- [ ] Individual can create a Training Block in < 60 seconds
- [ ] 2-step wizard completion rate > 80%
- [ ] No coach-specific UI visible to individuals
- [ ] Existing coach experience unchanged

---

## Architecture Overview

### Approach: Role-Based UI Adaptation

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHARED BACKEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Server      │  │ Database    │  │ Types       │              │
│  │ Actions     │  │ (Supabase)  │  │ (Shared)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   COACH UI              │   │   INDIVIDUAL UI         │
│   /plans/*              │   │   /plans/* (adapted)    │
│                         │   │                         │
│   - 3-column workspace  │   │   - 2-column workspace  │
│   - 4-step wizard       │   │   - 2-step wizard       │
│   - Full terminology    │   │   - Friendly terms      │
│   - Group management    │   │   - Personal only       │
└─────────────────────────┘   └─────────────────────────┘
```

### Key Principle: Minimal New Code

- Reuse existing server actions (they already support `user_id` without groups)
- Reuse existing components where possible
- Create wrapper/adapter components for role-specific UIs
- Single route structure with conditional rendering

---

## Implementation Phases

### Phase 0: Foundation (Prerequisites)

**Goal**: Ensure individual role infrastructure is complete

| Task | File(s) | Status | Effort |
|------|---------|--------|--------|
| 0.1 Verify `individual` role in user context | `contexts/user-role-context.tsx` | Check | S |
| 0.2 Verify onboarding creates athlete record | `actions/onboarding/` | Check | S |
| 0.3 Verify sidebar nav visibility | `components/layout/sidebar/` | Check | S |
| 0.4 Create terminology utility | `lib/terminology.ts` | **NEW** | S |

**Terminology Utility**:
```typescript
// lib/terminology.ts
export type UserRole = 'athlete' | 'coach' | 'admin' | 'individual'

export interface Terminology {
  macrocycle: string | null  // null = hidden
  mesocycle: string
  microcycle: string
  sessionPlan: string
  plans: string  // nav item name
}

export function getTerminology(role: UserRole): Terminology {
  if (role === 'individual') {
    return {
      macrocycle: null,  // Hidden for individuals
      mesocycle: 'Training Block',
      microcycle: 'Week',
      sessionPlan: 'Workout',
      plans: 'My Training',
    }
  }
  return {
    macrocycle: 'Macrocycle',
    mesocycle: 'Mesocycle',
    microcycle: 'Microcycle',
    sessionPlan: 'Session Plan',
    plans: 'Training Plans',
  }
}

// Hook for components
export function useTerminology() {
  const { role } = useUserRole()
  return getTerminology(role)
}
```

**Deliverable**: Foundation ready for UI adaptation

---

### Phase 1: Plans Home Page Adaptation

**Goal**: Individual sees simplified "My Training" home page

#### 1.1 Create Individual-Specific Home View

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 1.1.1 | Create `TrainingBlockCard` component | `components/features/plans/home/TrainingBlockCard.tsx` | M |
| 1.1.2 | Create `IndividualPlansHome` wrapper | `components/features/plans/home/IndividualPlansHome.tsx` | M |
| 1.1.3 | Add role detection to plans page | `app/(protected)/plans/page.tsx` | S |
| 1.1.4 | Create empty state with templates | `components/features/plans/home/EmptyTrainingState.tsx` | S |

**TrainingBlockCard Component**:
```tsx
// Simplified card showing:
// - Block name
// - Current week (Week 2 of 4)
// - Progress bar
// - Today's workout preview
// - [Continue Training] CTA
```

**IndividualPlansHome Component**:
```tsx
interface IndividualPlansHomeProps {
  activeBlock: Mesocycle | null  // mesocycle = Training Block
  completedBlocks: Mesocycle[]
}

// Layout:
// - Hero section with active block (prominent)
// - This week's calendar strip
// - Completed blocks list (collapsed)
// - No group filters, no macrocycle cards
```

**Page Routing Logic**:
```tsx
// app/(protected)/plans/page.tsx
export default async function PlansPage() {
  const { role } = await getUserRole()

  if (role === 'individual') {
    return <IndividualPlansHome />
  }

  return <PlansHome />  // Existing coach view
}
```

#### 1.2 Hide Coach-Only Elements

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 1.2.1 | Hide group filter for individuals | `PlansHomeClient.tsx` | S |
| 1.2.2 | Hide "Assign" buttons | Various card components | S |
| 1.2.3 | Update page header terminology | `PlanPageHeader.tsx` | S |

**Deliverable**: Individual sees "My Training" page with single active block focus

---

### Phase 2: Quick Start Wizard (2-Step)

**Goal**: Individual can create a Training Block in 2 steps

#### 2.1 Create Quick Start Wizard

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 2.1.1 | Create `QuickStartWizard` container | `components/features/plans/components/quickstart/QuickStartWizard.tsx` | M |
| 2.1.2 | Create Step 1: Block Setup | `components/features/plans/components/quickstart/BlockSetupStep.tsx` | M |
| 2.1.3 | Create Step 2: Week Template | `components/features/plans/components/quickstart/WeekTemplateStep.tsx` | L |
| 2.1.4 | Create template quick-select | `components/features/plans/components/quickstart/TemplateQuickSelect.tsx` | M |
| 2.1.5 | Route individual to QuickStart | `app/(protected)/plans/new/page.tsx` | S |

**Step 1: Block Setup**:
```tsx
interface BlockSetupData {
  focus: 'strength' | 'muscle' | 'fat_loss' | 'cardio' | 'general' | 'sport'
  name?: string  // Auto-generated if empty
  durationWeeks: 3 | 4 | 6 | 8
  startDate: Date
}
```

**Step 2: Week Template**:
```tsx
interface WeekTemplateData {
  days: {
    dayOfWeek: number  // 0-6
    workout: {
      name: string
      exercises: Exercise[]
    } | null  // null = rest day
  }[]
}

// Quick presets:
// - Upper/Lower Split (4 days)
// - Push/Pull/Legs (6 days)
// - Full Body 3x (3 days)
// - Custom
```

**Wizard Flow**:
```
[Step 1: Block Setup] → [Step 2: Week Template] → Create & Redirect to Workspace
                                                          │
                                                          ▼
                                                  /plans/[blockId]
```

#### 2.2 Template Integration

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 2.2.1 | Query individual-friendly templates | `actions/plans/template-actions.ts` | S |
| 2.2.2 | Create template preview cards | `TemplatePreviewCard.tsx` | S |
| 2.2.3 | Apply template to week setup | `WeekTemplateStep.tsx` | M |

**Deliverable**: 2-step wizard creating mesocycle + microcycles + session templates

---

### Phase 3: Simplified Workspace (2-Column)

**Goal**: Individual sees 2-column workspace (Weeks | Week Detail)

#### 3.1 Create Individual Workspace Layout

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 3.1.1 | Create `IndividualWorkspace` container | `components/features/plans/workspace/IndividualWorkspace.tsx` | L |
| 3.1.2 | Create `WeeksList` panel | `components/features/plans/workspace/components/WeeksList.tsx` | M |
| 3.1.3 | Create `WeekDetailPanel` | `components/features/plans/workspace/components/WeekDetailPanel.tsx` | M |
| 3.1.4 | Create `WorkoutCard` (simplified session) | `components/features/plans/workspace/components/WorkoutCard.tsx` | M |
| 3.1.5 | Add role detection to workspace page | `app/(protected)/plans/[id]/page.tsx` | S |

**IndividualWorkspace Layout**:
```tsx
// Desktop: 2-column grid
// Mobile: Slide navigation (weeks → week detail)

<div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
  <WeeksList
    weeks={microcycles}
    selectedWeek={selectedWeek}
    onSelectWeek={setSelectedWeek}
  />
  <WeekDetailPanel
    week={selectedWeek}
    workouts={sessionPlans}
  />
</div>
```

**Key Differences from Coach Workspace**:

| Coach Workspace | Individual Workspace |
|-----------------|---------------------|
| 3 columns (Meso/Micro/Session) | 2 columns (Weeks/Detail) |
| Mesocycle timeline visible | No mesocycle panel |
| Race/event anchoring | No race management |
| Athlete assignment dialogs | No assignment UI |
| Volume/Intensity charts | Simple progress bars |

#### 3.2 Reuse Existing Components

| Component | Reuse Strategy |
|-----------|---------------|
| `EditSessionDialog` | Reuse as-is (rename to "Edit Workout" via terminology) |
| `ExercisePlanningPanel` | Reuse as-is |
| `CopySessionDialog` | Reuse with simplified options |
| `VolumeIntensityChart` | Optionally include (collapsible) |

#### 3.3 Mobile Slide Navigation

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 3.3.1 | Implement slide container | `IndividualWorkspace.tsx` | M |
| 3.3.2 | Add swipe gesture support | Use existing pattern from `TrainingPlanWorkspace` | S |
| 3.3.3 | Add breadcrumb navigation | `WorkspaceBreadcrumb.tsx` | S |

**Deliverable**: Simplified 2-column workspace with mobile slide support

---

### Phase 4: Workout Editor Simplification

**Goal**: Streamlined workout editing experience

#### 4.1 Simplify Session Editor

| Task | Description | File(s) | Effort |
|------|-------------|---------|--------|
| 4.1.1 | Create `IndividualWorkoutEditor` | `components/features/plans/session-planner/IndividualWorkoutEditor.tsx` | M |
| 4.1.2 | Simplify exercise add flow | Reuse existing with fewer options | S |
| 4.1.3 | Add "Save as Template" shortcut | Button in editor footer | S |
| 4.1.4 | Route to individual editor | `app/(protected)/plans/[id]/session/[sessionId]/page.tsx` | S |

**Simplifications**:
- Remove superset management (keep for coach only)
- Remove batch operations
- Focus on single-exercise-at-a-time editing
- Keep set configuration (reps, weight, RPE)

**Deliverable**: Focused workout editor for individual use

---

### Phase 5: Polish & Edge Cases

**Goal**: Handle edge cases and improve UX

#### 5.1 Edge Cases

| Task | Description | Effort |
|------|-------------|--------|
| 5.1.1 | Handle "no active block" state | S |
| 5.1.2 | Handle completing a Training Block | M |
| 5.1.3 | Handle starting next block | S |
| 5.1.4 | Deep link to today's workout | S |

#### 5.2 UX Polish

| Task | Description | Effort |
|------|-------------|--------|
| 5.2.1 | Add "Today" badge to current workout | S |
| 5.2.2 | Add week completion celebration | S |
| 5.2.3 | Add block completion summary | M |
| 5.2.4 | Improve loading states | S |

#### 5.3 Testing

| Task | Description | Effort |
|------|-------------|--------|
| 5.3.1 | Unit tests for terminology hook | S |
| 5.3.2 | Integration tests for wizard flow | M |
| 5.3.3 | E2E test: create block → complete workout | L |

**Deliverable**: Production-ready individual experience

---

## File Structure

### New Files

```
components/features/plans/
├── home/
│   ├── IndividualPlansHome.tsx        # NEW - Individual home page
│   ├── TrainingBlockCard.tsx          # NEW - Simplified block card
│   └── EmptyTrainingState.tsx         # NEW - Empty state with templates
├── workspace/
│   ├── IndividualWorkspace.tsx        # NEW - 2-column workspace
│   └── components/
│       ├── WeeksList.tsx              # NEW - Left panel
│       ├── WeekDetailPanel.tsx        # NEW - Right panel
│       └── WorkoutCard.tsx            # NEW - Simplified session card
├── components/
│   └── quickstart/
│       ├── QuickStartWizard.tsx       # NEW - 2-step wizard
│       ├── BlockSetupStep.tsx         # NEW - Step 1
│       ├── WeekTemplateStep.tsx       # NEW - Step 2
│       └── TemplateQuickSelect.tsx    # NEW - Template selector
└── session-planner/
    └── IndividualWorkoutEditor.tsx    # NEW - Simplified editor

lib/
└── terminology.ts                      # NEW - Role-based terminology
```

### Modified Files

```
app/(protected)/plans/
├── page.tsx                           # MODIFY - Add role detection
├── new/page.tsx                       # MODIFY - Route to QuickStart
└── [id]/
    ├── page.tsx                       # MODIFY - Route to IndividualWorkspace
    └── session/[sessionId]/page.tsx   # MODIFY - Route to individual editor

components/features/plans/
├── home/
│   └── PlansHomeClient.tsx            # MODIFY - Hide coach-only elements
└── components/
    └── PlanPageHeader.tsx             # MODIFY - Use terminology
```

---

## Data Flow

### Creating a Training Block (Individual)

```
QuickStartWizard
       │
       ▼
[Step 1: Block Setup]
       │
       ├─► createMesocycleAction()     # Creates "Training Block"
       │   └─► mesocycles table
       │       └─► user_id set, athlete_group_id = NULL
       │
       ▼
[Step 2: Week Template]
       │
       ├─► createMicrocycleAction() x N  # Creates weeks
       │   └─► microcycles table
       │
       ├─► saveSessionPlanAction() x N   # Creates workouts per week
       │   └─► session_plans table
       │       └─► exercise_preset_groups
       │           └─► exercise_presets
       │               └─► exercise_preset_details
       │
       ▼
Redirect to /plans/[mesocycleId]
```

### Server Actions Reuse

| Action | Coach Use | Individual Use | Changes Needed |
|--------|-----------|----------------|----------------|
| `createMesocycleAction` | With macrocycle_id | Without macrocycle_id | None (nullable) |
| `createMicrocycleAction` | With mesocycle_id | Same | None |
| `saveSessionPlanAction` | With group assignment | Without group | None (nullable) |
| `getMesocyclesByMacrocycleAction` | By macrocycle | By user_id | **Add filter option** |
| `getSessionPlansByMicrocycleAction` | Same | Same | None |

**One Action Change Needed**:
```typescript
// actions/plans/plan-actions.ts - ADD new action
export async function getActiveMesocycleForUserAction(): Promise<ActionState<Mesocycle | null>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: 'Not authenticated' }

  const dbUserId = await getDbUserId(userId)

  const { data, error } = await supabase
    .from('mesocycles')
    .select('*')
    .eq('user_id', dbUserId)
    .is('athlete_group_id', null)  // Individual's personal blocks
    .gte('end_date', new Date().toISOString())  // Not ended
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
    console.error('[getActiveMesocycleForUserAction]', error)
    return { isSuccess: false, message: 'Failed to fetch active block' }
  }

  return { isSuccess: true, message: 'Success', data: data || null }
}
```

---

## Timeline Estimate

| Phase | Tasks | Effort | Dependency |
|-------|-------|--------|------------|
| **Phase 0**: Foundation | 4 tasks | 1 day | None |
| **Phase 1**: Home Page | 7 tasks | 2-3 days | Phase 0 |
| **Phase 2**: Quick Start Wizard | 8 tasks | 3-4 days | Phase 0 |
| **Phase 3**: Workspace | 9 tasks | 4-5 days | Phase 1, 2 |
| **Phase 4**: Workout Editor | 4 tasks | 2 days | Phase 3 |
| **Phase 5**: Polish | 10 tasks | 2-3 days | Phase 4 |

**Total Estimate**: 14-18 days of development

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Coach experience regression | High | Comprehensive testing before/after |
| Server action incompatibility | Medium | Review all actions for nullable group_id |
| Mobile performance | Medium | Lazy load workspace components |
| Template data quality | Low | Curate starter templates carefully |

---

## Dependencies

### External Dependencies
- None (uses existing libraries)

### Internal Dependencies
- `individual` role fully implemented in onboarding
- Sidebar navigation updated for individuals
- User context provides `isIndividual` flag

### Database Dependencies
- No schema changes required
- Existing nullable fields support individual use case

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] Individual sees "My Training" heading (not "Training Plans")
- [ ] No group filter visible to individuals
- [ ] Active Training Block prominently displayed
- [ ] Completed blocks in secondary list

### Phase 2 Complete When:
- [ ] Individual can create block in 2 steps
- [ ] Template selection works
- [ ] Week template copies to all weeks
- [ ] Block created with correct data structure

### Phase 3 Complete When:
- [ ] 2-column layout renders (desktop)
- [ ] Slide navigation works (mobile)
- [ ] Can select week and see workouts
- [ ] Can navigate to workout editor

### Phase 4 Complete When:
- [ ] Can edit workout exercises
- [ ] Can edit sets (reps, weight, RPE)
- [ ] Can save workout
- [ ] Can save workout as template

### Phase 5 Complete When:
- [ ] All edge cases handled
- [ ] Loading states polished
- [ ] Tests passing
- [ ] No TypeScript errors

---

## Open Questions

1. **Macrocycle for individuals**: Should we silently create a "Personal" macrocycle to contain their mesocycles, or leave macrocycle_id null?
   - **Recommendation**: Leave null (simpler, already supported)

2. **Block limit**: Should individuals be limited to one active block?
   - **Recommendation**: Yes for MVP (simpler UX)

3. **Template ownership**: Can individuals create templates? Can they see coach templates?
   - **Recommendation**: Yes to both (templates are just saved workouts)

4. **Analytics**: Should individuals see volume/intensity charts?
   - **Recommendation**: Yes, but simplified and collapsible

---

## Appendix: Component Props

### IndividualPlansHome
```typescript
interface IndividualPlansHomeProps {
  // Server-fetched data passed from page
  activeBlock: MesocycleWithMicrocycles | null
  completedBlocks: Mesocycle[]
  todayWorkout: SessionPlan | null
}
```

### QuickStartWizard
```typescript
interface QuickStartWizardProps {
  templates: SessionTemplate[]
  onComplete: (blockId: string) => void
}
```

### IndividualWorkspace
```typescript
interface IndividualWorkspaceProps {
  block: MesocycleWithMicrocycles
  initialWeekId?: string
}

interface MesocycleWithMicrocycles extends Mesocycle {
  microcycles: (Microcycle & {
    sessionPlans: SessionPlan[]
  })[]
}
```

---

*Plan created: 2026-01-04*
*Ready for review and task generation*
