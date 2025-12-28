# Plans Page Design Analysis & Improvement Plan

> **Last Updated**: 2025-12-27
> **Status**: ✅ Analysis Complete, All Decisions Made, Ready for Implementation
> **Related Pages**: `/plans/[id]`, `/plans/[id]/session/[sessionId]`

## Decisions Summary
| Decision | Choice |
|----------|--------|
| Date change behavior | Restrict to microcycle dates only |
| Exercise picker format | Half-sheet (70% height) |
| Superset ID storage | Sequential integers (1, 2, 3) |
| Add exercise to section | Section [+ Add] buttons (desktop) + FAB (mobile) |
| Superset creation | Checkbox selection + "Link" button |
| Superset removal | Unlink button on header + drag-out to unlink single |

---

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Identified Issues](#identified-issues)
3. [UI/UX Improvement Proposals](#uiux-improvement-proposals)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Technical Decisions Required](#technical-decisions-required)

---

## Current State Analysis

### Plans/[id] Page Overview

**Purpose**: Training plan workspace for coaches to view and manage the full training plan structure (Macrocycle → Mesocycles → Microcycles → Sessions).

**Current Architecture**:
- **Component**: [TrainingPlanWorkspace.tsx](apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx)
- **Page**: [page.tsx](apps/web/app/(protected)/plans/[id]/page.tsx)
- **Layout**: 3-panel design (Desktop: grid, Mobile: sliding panels)
  - Left Panel: Mesocycles (Training Phases) + Events
  - Middle Panel: Microcycles (Weeks) for selected mesocycle
  - Right Panel: Sessions for selected microcycle

**Current Features**:
- Mesocycle CRUD with color-coded phases
- Microcycle management with volume/intensity bars
- Session overview with navigation to session planner
- Events/Races management
- Undo/Redo history (50 states)
- Mobile swipe navigation

### Session Planner Page Overview

**Purpose**: Detailed session planning with exercise management, sets configuration, and AI assistance.

**Current Architecture**:
- **Component**: [SessionPlannerV2.tsx](apps/web/components/features/training/views/SessionPlannerV2.tsx)
- **Page**: [page.tsx](apps/web/app/(protected)/plans/[id]/session/[sessionId]/page.tsx)
- **Sub-components**:
  - [WorkoutView.tsx](apps/web/components/features/training/views/WorkoutView.tsx) - Main workout view
  - [ExerciseCard.tsx](apps/web/components/features/training/components/ExerciseCard.tsx) - Exercise display
  - [ExercisePickerSheet.tsx](apps/web/components/features/training/components/ExercisePickerSheet.tsx) - Exercise selection

**Current Features**:
- Exercise list with sets/reps
- Add exercise via full-screen picker sheet
- Undo/Redo for exercise changes
- AI Assistant integration (inline proposals)
- Drag-and-drop exercise reordering
- Save session to database

---

## Identified Issues

### 1. Plans/[id] Page Issues

#### 1.1 Mobile Overflow (HIGH PRIORITY)
**Location**: [TrainingPlanWorkspace.tsx:705-976](apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx#L705-L976)

**Problem**:
- Text content overflows on mobile (mesocycle names, descriptions)
- Volume/Intensity bars overflow their containers on small screens
- No truncation or responsive text sizing

**Evidence**:
```tsx
// Line 843-855: Volume/Intensity bars don't have responsive sizing
<div className="flex items-center gap-1">
  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
    <div className="h-full bg-blue-500" style={{ width: `${((micro.volume || 0) / 10) * 100}%` }} />
  </div>
  <span className="text-xs text-muted-foreground">{micro.volume || 0}/10</span>
</div>
```

**Solution**:
- Add `truncate` class to text elements
- Make volume/intensity bars responsive (`w-12 sm:w-16`)
- Use `flex-wrap` for badge containers
- Reduce text size on mobile (`text-xs sm:text-sm`)

#### 1.2 No Slide Indicator on Mobile (MEDIUM PRIORITY)
**Problem**: Users on mobile have no visual indicator that they can swipe to navigate between panels.

**Solution**:
- Add pagination dots below panels
- Show swipe hint on first visit
- Add subtle left/right arrow hints at panel edges

#### 1.3 Header Design Issues (HIGH PRIORITY)
**Location**: [PlanPageHeader.tsx](apps/web/components/features/plans/components/PlanPageHeader.tsx)

**Problems**:
- Header too cramped on mobile
- Undo/Redo buttons take up valuable space
- Date range display truncated

**Solution**:
- Move Undo/Redo to a dropdown menu on mobile
- Use compact date format on mobile (e.g., "Jan 1 - Mar 31" instead of full date)
- Stack elements vertically on mobile

#### 1.4 Undo/Redo Not Needed on Plans/[id] (USER REQUEST)
**Current State**: Undo/Redo buttons shown in header.

**User Feedback**: Undo/Redo not needed on main plan view, only on session planner page.

**Solution**:
- Remove `showUndoRedo` prop from `PlanPageHeader` in `TrainingPlanWorkspace.tsx`
- Keep undo/redo logic in code for potential future use

#### 1.5 Default Selection Should Be Current Week (MEDIUM PRIORITY)
**Problem**: When opening a plan, it defaults to the first mesocycle/microcycle, not the current week.

**Solution**:
- Calculate current date and find matching microcycle
- Auto-expand to current week on initial load
- Highlight current week with a "This Week" badge

---

### 2. Session Planner Page Issues

#### 2.1 Unable to Edit Title/Description/Date (HIGH PRIORITY)
**Location**: [SessionPlannerV2.tsx:395-397](apps/web/components/features/training/views/SessionPlannerV2.tsx#L395-L397)

**Problem**:
```tsx
// Session metadata passed as read-only
<WorkoutView
  title={initialSession.name}  // Static, not editable
  description={initialSession.description || undefined}  // Static
  // No date prop passed
```

**Solution Options**:

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A (Recommended)** | Inline editing in WorkoutView header | Familiar pattern, immediate feedback | Requires WorkoutView changes |
| B | Separate "Edit Session Details" dialog | Keeps layout clean | Extra click required |
| C | Editable header component | Full control | More complex implementation |

**Technical Decision Required**:
When coach changes session date to outside the microcycle:
1. **Option A**: Restrict date selection to within microcycle boundaries
2. **Option B**: Allow any date, auto-reassign to correct microcycle
3. **Option C**: Warning dialog asking user to confirm microcycle change

**Recommendation**: Option B - Auto-reassign with toast notification. Most intuitive for coaches.

#### 2.2 Add Exercise UI Issues (HIGH PRIORITY)
**Location**: [ExercisePickerSheet.tsx](apps/web/components/features/training/components/ExercisePickerSheet.tsx)

**Current Problems**:
1. Full-screen sheet is disruptive (loses context of current session)
2. "Add to: [Section]" dropdown overlaps with exercise type buttons
3. Category filter tabs and section selector are confusing (similar concepts)

**Current UX Flow**:
```
Click "+" FAB → Full screen picker opens → Select category tab → Select section → Click exercise → Returns to session
```

**Recommended New UX (Based on Industry Research)**:

**Reference Sources**:
- [Fitness App UI Design: Key Principles](https://stormotion.io/blog/fitness-app-ux/) - Clean, focused interfaces
- [Best UX/UI Design Practices For Fitness Apps In 2025](https://dataconomy.com/2025/11/11/best-ux-ui-practices-for-fitness-apps-retaining-and-re-engaging-users/) - One action per screen

**Proposed Solutions**:

| Component | Current | Proposed |
|-----------|---------|----------|
| Picker Type | Full-screen sheet | Half-screen sheet or slide-out panel |
| Section Assignment | Dropdown in header | Drag exercise to target section after adding |
| Categories | Tabs | Pills with clear visual distinction |
| Search | Basic text | With filters chip row |

**Recommended Implementation**:
1. **Overlay/Half-sheet approach**: Exercise picker slides up covering 70% of screen, maintaining context
2. **Contextual add**: Click "+" within a section to add directly to that section
3. **Drag-to-section**: After adding, user can drag exercise to desired section
4. **Recent exercises**: Show last 5 used exercises at top for quick access

#### 2.3 Superset Feature Incomplete (HIGH PRIORITY)
**Location**: Multiple files, primarily [session-planning.tsx](apps/web/components/features/plans/components/mesowizard/session-planning.tsx)

**Current Problems**:

1. **No way to create superset in SessionPlannerV2**:
   - `session-planning.tsx` (MesoWizard) has superset creation
   - `SessionPlannerV2.tsx` has no superset UI

2. **Cannot drag exercises into superset**:
   - Current: Select multiple exercises → Click "Create Superset"
   - Missing: Drag single exercise into existing superset

3. **Superset ID Display Bug**:
   - Shows "1000001" instead of "1", "2", "3"
   - Root cause: `superset_id` in database is a `number` type
   - Logic generates IDs like `superset-${Date.now()}` which creates large numbers

**Solution for Superset ID**:
```typescript
// Current (problematic):
const supersetId = `superset-${Date.now()}`  // Results in "superset-1735123456789"

// When converted to number for DB storage:
// The timestamp portion causes large numbers

// Solution A: Use sequential IDs per session
const getNextSupersetId = (exercises: Exercise[]) => {
  const existingIds = exercises
    .map(e => e.superset_id)
    .filter((id): id is number => id !== null)
  return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
}

// Solution B: Keep string IDs, display with labels (A, B, C)
// superset_id remains as timestamp, but UI shows "Superset A", "Superset B"
```

**Recommended Superset UX**:
1. **Create superset**: Select 2+ exercises → "Link as Superset" button appears
2. **Add to superset**: Drag exercise onto superset group
3. **Remove from superset**: Drag exercise out of superset group
4. **Display**: Show as "Superset A", "Superset B" (calculated from order, not ID)

---

### 3. Add Exercise Section Assignment UX

**Current Problem**:
- User must pre-select section before adding exercise
- Confusing: Category tabs ≠ Section assignment

**Industry Best Practices** (from research):
- One action per screen
- Smart defaults based on exercise type
- Minimal cognitive load

**Proposed New Flow**:

```
1. User clicks "+" in specific section (Warmup, Gym, etc.)
   → Exercise picker opens with that section pre-selected

2. User clicks floating "+" FAB
   → Exercise picker opens, exercise added to "Uncategorized"
   → User can then drag to correct section

3. Smart auto-assignment:
   → Exercise with exercise_type="warmup" → Warmup section
   → Exercise with exercise_type="strength" → Gym section
   → etc.
```

---

## UI/UX Improvement Proposals

### Proposal 1: Mobile-First Responsive Fixes

**Priority**: HIGH
**Effort**: 2-3 hours

**Changes**:
1. Add responsive text truncation
2. Make volume/intensity bars responsive
3. Add mobile swipe indicator dots
4. Optimize header for mobile

### Proposal 2: Session Metadata Editing

**Priority**: HIGH
**Effort**: 4-6 hours

**Changes**:
1. Add inline title editing (click to edit)
2. Add description expansion with edit mode
3. Add date picker with microcycle boundary logic
4. Backend: Add `updateSessionPlanAction` for metadata updates

**Date Change Behavior** (Recommended):
- Show date picker bounded to parent microcycle dates
- If user needs different date, show info message: "To change the session week, move it from the plan view"

### Proposal 3: Exercise Picker Redesign

**Priority**: HIGH
**Effort**: 6-8 hours

**New Design**:
```
┌────────────────────────────────────────┐
│ ← Add Exercise                    [X]  │ ← Header with close
├────────────────────────────────────────┤
│ 🔍 Search exercises...            [⚙]  │ ← Search with filter toggle
├────────────────────────────────────────┤
│ [All] [Warmup] [Gym] [Plyo] [Sprint]   │ ← Category filter pills
├────────────────────────────────────────┤
│ RECENT                                 │
│ ┌──────────────────────────────────┐   │
│ │ 🕐 Squat              [+]        │   │
│ │ 🕐 Bench Press        [+]        │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ALL EXERCISES                          │
│ ┌──────────────────────────────────┐   │
│ │ 💪 A-Skip             [+] Warmup │   │ ← Shows exercise type
│ │ 💪 B-Skip             [+] Warmup │   │
│ │ 🏋️ Back Squat         [+] Gym    │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

**Key Changes**:
- 70% height sheet instead of full screen
- Category shown per exercise (auto-assigns to section)
- Remove separate "Add to:" section selector
- Add "Recent" section at top

### Proposal 4: Superset Feature Completion

**Priority**: MEDIUM
**Effort**: 8-12 hours

**Features to Implement**:
1. **Selection Mode**: Long-press or checkbox to select multiple exercises
2. **Create Superset Button**: Appears when 2+ exercises selected
3. **Drag-to-Join**: Drag exercise onto superset to add it
4. **Visual Grouping**: Superset shown with connecting line/bracket
5. **Display Labels**: "Superset A", "Superset B" (not raw ID)

**Database Consideration**:
- Current `superset_id` is `number | null`
- Keep storing as number, but:
  - Use sequential IDs (1, 2, 3) per session
  - Display as letters (A, B, C) in UI

### Proposal 5: Remove Undo/Redo from Plans/[id]

**Priority**: LOW
**Effort**: 30 minutes

**Change**:
```tsx
// In TrainingPlanWorkspace.tsx, line ~358
<PlanPageHeader
  // Remove these props:
  showUndoRedo={false}  // Changed from true
  // canUndo, canRedo, onUndo, onRedo can be removed
/>
```

---

## Detailed Interaction Flows

### Flow 1: Adding Exercise to Specific Section

#### Desktop Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  Session: Monday Strength                                       │
├─────────────────────────────────────────────────────────────────┤
│  ▼ WARMUP                                              [+ Add]  │ ← Click here
│    ├── A-Skip                                                   │
│    └── B-Skip                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ▼ GYM                                                 [+ Add]  │
│    ├── Squat                                                    │
│    └── Bench Press                                              │
├─────────────────────────────────────────────────────────────────┤
│  ▼ PLYOMETRIC                                          [+ Add]  │
│    └── Box Jumps                                                │
└─────────────────────────────────────────────────────────────────┘
                    ↓ Click [+ Add] in Warmup section
┌─────────────────────────────────────────────────────────────────┐
│  ← Add to Warmup                                           [X]  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search exercises...                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  [All] [Warmup] [Gym] [Plyo] [Sprint]                          │
│                                                                 │
│  RECENT                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ High Knees                                          [+] │   │
│  │ Arm Circles                                         [+] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                    ↑ 70% height half-sheet      │
└─────────────────────────────────────────────────────────────────┘
```

#### Mobile Flow
```
┌───────────────────────────┐
│  ▼ WARMUP                 │
│    ├── A-Skip             │
│    └── B-Skip             │
│  ▼ GYM                    │
│    └── Squat              │
│                           │
│                     [+]   │ ← Floating Action Button
└───────────────────────────┘
        ↓ Tap FAB
┌───────────────────────────┐
│  Add Exercise        [X]  │
│  ───────────────────────  │
│  🔍 Search...             │
│  [All] [Warmup] [Gym]...  │
│                           │
│  High Knees          [+]  │
│  Arm Circles         [+]  │ ← Select exercise
└───────────────────────────┘
        ↓ Exercise added to bottom
┌───────────────────────────┐
│  ▼ WARMUP                 │
│    ├── A-Skip             │
│    └── B-Skip             │
│  ▼ GYM                    │
│    └── Squat              │
│  ▼ UNCATEGORIZED          │
│    └── High Knees   [≡]   │ ← Drag handle, drag to Warmup
└───────────────────────────┘
```

---

### Flow 2: Creating a Superset

#### Desktop Flow
```
Step 1: Enter Selection Mode (click checkbox)
┌─────────────────────────────────────────────────────────────────┐
│  ▼ GYM                                                          │
│    ☐ Squat                                               [⋮]   │ ← Click checkbox
│    ☐ Bench Press                                         [⋮]   │
│    ☐ Deadlift                                            [⋮]   │
└─────────────────────────────────────────────────────────────────┘
        ↓ Select 2+ exercises
┌─────────────────────────────────────────────────────────────────┐
│  ▼ GYM                                                          │
│    ☑ Squat                                               [⋮]   │
│    ☑ Bench Press                                         [⋮]   │
│    ☐ Deadlift                                            [⋮]   │
│  ─────────────────────────────────────────────────────────────  │
│  2 selected    [Cancel]                      [🔗 Link Superset] │
└─────────────────────────────────────────────────────────────────┘
        ↓ Click "Link Superset"
┌─────────────────────────────────────────────────────────────────┐
│  ▼ GYM                                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Superset 1                              [🔓 Unlink All]  │  │
│  │  ├── A) Squat                                       [⋮]  │  │
│  │  └── B) Bench Press                                 [⋮]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│    ☐ Deadlift                                            [⋮]   │
└─────────────────────────────────────────────────────────────────┘
```

#### Mobile Flow
```
Step 1: Long-press to enter selection mode
┌───────────────────────────┐
│  ▼ GYM                    │
│    Squat              [⋮] │ ← Long press (500ms)
│    Bench Press        [⋮] │
│    Deadlift           [⋮] │
└───────────────────────────┘
        ↓ Vibration feedback, selection mode
┌───────────────────────────┐
│  ▼ GYM                    │
│    ☑ Squat            [⋮] │ ← Selected (highlighted)
│    ☐ Bench Press      [⋮] │ ← Tap to add to selection
│    ☐ Deadlift         [⋮] │
│  ─────────────────────────│
│  [Cancel]   [🔗 Link (1)] │ ← Bottom bar
└───────────────────────────┘
        ↓ Tap Bench Press to add
┌───────────────────────────┐
│  ▼ GYM                    │
│    ☑ Squat            [⋮] │
│    ☑ Bench Press      [⋮] │
│    ☐ Deadlift         [⋮] │
│  ─────────────────────────│
│  [Cancel]   [🔗 Link (2)] │ ← Now enabled
└───────────────────────────┘
```

---

### Flow 3: Removing from Superset

#### Option A: Unlink All (Superset Header Button)
```
┌───────────────────────────────────────────────────────────────┐
│  Superset 1                                  [🔓 Unlink All]  │ ← Click
│  ├── A) Squat                                          [⋮]   │
│  └── B) Bench Press                                    [⋮]   │
└───────────────────────────────────────────────────────────────┘
        ↓ Both exercises become standalone
┌─────────────────────┐
│  Squat          [⋮] │
├─────────────────────┤
│  Bench Press    [⋮] │
└─────────────────────┘
```

#### Option B: Unlink Single Exercise (Drag Out)
```
┌───────────────────────────────────────────────────────────────┐
│  Superset 1                                                   │
│  ├── A) Squat                                          [⋮]   │ ← Drag this out
│  └── B) Bench Press                                    [⋮]   │
└───────────────────────────────────────────────────────────────┘
        ↓ Drag Squat outside superset boundary
┌─────────────────────┐
│  Squat          [⋮] │  ← Now standalone (dropped position)
└─────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│  Superset 1                          [Dissolve - only 1 left] │
│  └── A) Bench Press                                    [⋮]   │
└───────────────────────────────────────────────────────────────┘
```

#### Option C: Unlink Single via Menu
```
┌───────────────────────────────────────────────────────────────┐
│  Superset 1                                                   │
│  ├── A) Squat                                          [⋮]   │ ← Click menu
│  └── B) Bench Press                                    [⋮]   │
└───────────────────────────────────────────────────────────────┘
                                                    ┌───────────┐
                                                    │ Edit      │
                                                    │ Duplicate │
                                                    │ 🔓 Unlink │ ← Click
                                                    │ Delete    │
                                                    └───────────┘
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| 1.1 Fix mobile overflow issues | HIGH | 2h | - |
| 1.2 Remove undo/redo from plans/[id] | LOW | 30m | - |
| 1.3 Add mobile swipe indicator | MEDIUM | 2h | - |

### Phase 2: Session Editing (Week 2)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| 2.1 Implement session title/desc editing | HIGH | 4h | - |
| 2.2 Add date picker with validation | HIGH | 4h | - |
| 2.3 Backend: updateSessionPlanAction | HIGH | 2h | - |

### Phase 3: Exercise Picker (Week 3)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| 3.1 Redesign picker as half-sheet | HIGH | 4h | - |
| 3.2 Auto-assign section by exercise type | MEDIUM | 2h | - |
| 3.3 Add contextual "+" per section | MEDIUM | 2h | - |

### Phase 4: Superset Completion (Week 4)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| 4.1 Add selection mode for exercises | MEDIUM | 3h | - |
| 4.2 Implement drag-to-superset | MEDIUM | 4h | - |
| 4.3 Fix superset ID display | HIGH | 2h | - |
| 4.4 Add superset visual grouping | MEDIUM | 3h | - |

---

## Technical Decisions Required

### Decision 1: Date Change Behavior ✅ DECIDED
**Question**: When coach changes session date to outside the microcycle, what happens?

| Option | Behavior | Recommendation |
|--------|----------|----------------|
| **A** | **Restrict to microcycle dates only** | ✅ **SELECTED** - Simplest, prevents data inconsistency |
| B | Allow any date, auto-move to correct microcycle | More flexible but complex |
| C | Warning dialog asking user to confirm | Good UX but adds friction |

**Decision**: Option A - Date picker will only show dates within the parent microcycle boundaries.

### Decision 2: Exercise Picker Format ✅ DECIDED
**Question**: Should exercise picker be full-screen or half-sheet?

| Option | Pros | Cons |
|--------|------|------|
| Full-screen | More space for search/results | Loses session context |
| **Half-sheet (70%)** | **Maintains context** | Less space for results |
| Slide-out panel (Desktop only) | Side-by-side view | Not mobile-friendly |

**Decision**: Half-sheet (70% height) with ability to expand to full-screen via drag. Maintains session context while providing adequate space for exercise search.

### Decision 3: Superset ID Storage ✅ DECIDED
**Question**: How to handle superset_id storage and display?

| Option | Storage | Display | Pros | Cons |
|--------|---------|---------|------|------|
| **A** | **Sequential int (1,2,3)** | **"Superset 1"** | **Clean IDs** | Need to manage sequence |
| B | Timestamp int | "Superset A" (calculated) | No collision | Large numbers in DB |
| C | String UUID | "Superset A" | No collision | Schema change needed |

**Decision**: Option A - Sequential integers (1, 2, 3) with proper ID management per session. Display as "Superset 1", "Superset 2" in UI. Implementation will need a helper function to get next available superset ID within a session.

### Decision 4: Add Exercise to Section ✅ DECIDED
**Question**: How should coaches add exercises to a specific section?

| Option | Desktop | Mobile |
|--------|---------|--------|
| **A** | **Section [+ Add] buttons** | **FAB + drag to position** |
| B | FAB only | FAB only |
| C | Smart auto-assign | Smart auto-assign |

**Decision**: Section-specific [+ Add] buttons on desktop (click opens picker with section pre-selected). Mobile uses floating FAB, exercise added to "Uncategorized" section, then user drags to desired position.

### Decision 5: Superset Creation ✅ DECIDED
**Question**: How should superset creation work?

| Option | Interaction |
|--------|-------------|
| **A** | **Checkbox selection + "Link Superset" button** |
| B | Drag one exercise onto another |
| C | Both methods |

**Decision**: Checkbox-based selection. Desktop: checkboxes visible, click to select. Mobile: long-press to enter selection mode. When 2+ selected, "Link Superset" button appears.

### Decision 6: Superset Removal ✅ DECIDED
**Question**: How should removing exercises from superset work?

| Option | Interaction |
|--------|-------------|
| **A** | **"Unlink All" button on superset header + drag-out for single** |
| B | Menu option only |
| C | Drag out only |

**Decision**:
- Superset header has "Unlink All" button to dissolve entire superset
- Individual exercises can be dragged out of superset boundary to unlink
- Menu option also available as alternative

---

## Appendix: Research Sources

### UI/UX Best Practices for Fitness Apps
- [Zfort: How to Design a Fitness App](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)
- [Stormotion: Fitness App UI Design](https://stormotion.io/blog/fitness-app-ux/)
- [Dataconomy: Best UX/UI Design Practices 2025](https://dataconomy.com/2025/11/11/best-ux-ui-practices-for-fitness-apps-retaining-and-re-engaging-users/)
- [Eastern Peak: Fitness App Design Best Practices](https://easternpeak.com/blog/fitness-app-design-best-practices/)

### Key Takeaways from Research:
1. **One action per screen** - Reduce cognitive load
2. **Touch-friendly buttons** - Large tappable areas for in-motion use
3. **Distraction-free workout screens** - No pop-ups, no nav bar clutter
4. **Smart defaults** - Auto-suggest based on exercise type/history
5. **Instant feedback** - Show success states immediately
6. **Personalization** - Adapt to user behavior patterns
