# Individual Plan Page - Comprehensive UX Review

## Executive Summary

This document provides a comprehensive UX review of the Individual Plan Page with user journey analysis, identified issues, and recommended solutions for both mobile and desktop experiences.

**Last Updated**: 2025-01-25 (Verified against codebase)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Training Blocks Display Logic](#2-training-blocks-display-logic)
3. [Navigation Patterns](#3-navigation-patterns)
4. [Button & Action Issues](#4-button--action-issues)
5. [Mobile vs Desktop Experience](#5-mobile-vs-desktop-experience)
6. [Database Schema Analysis](#6-database-schema-analysis)
7. [User Journey Stories](#7-user-journey-stories)
8. [Prioritized Recommendations](#8-prioritized-recommendations)

---

## 1. Current State Analysis

### Data Structure

```
Mesocycle (Training Block)
├── name, description, start_date, end_date
├── metadata (focus, equipment, createdVia)
└── microcycles (Weeks)
    ├── start_date, end_date
    └── session_plans (Workouts)
        ├── day (0-6, day of week)
        └── session_plan_exercises
            └── session_plan_sets

Workout Logs (Execution Records)
├── session_plan_id (links to session_plan)
├── athlete_id (the user)
├── session_status (assigned → ongoing → completed)
└── workout_log_exercises
    └── workout_log_sets (actual logged data)
```

### Key Files

| File | Purpose |
|------|---------|
| `IndividualPlanPage.tsx` | Main plan view (903 lines) |
| `IndividualPlansHome.tsx` | Server component, fetches data |
| `IndividualPlansHomeClient.tsx` | Home page with active block embed |
| `WeekSelectorSheet.tsx` | Week navigation |
| `QuickStartWizard.tsx` | Plan creation wizard |
| `save-generated-plan-action.ts` | Saves AI-generated plans |
| `workout-page-content.tsx` | Workout logger hub |
| `/workout/[id]/page.tsx` | Individual workout logging |

---

## 2. Training Blocks Display Logic

### Current Implementation

#### How "Active" is Determined

**Location:** `plan-actions.ts:1428-1482`

```typescript
// Active block = where today's date is between start_date and end_date
.lte('start_date', today)
.gte('end_date', today)
```

**Finding:** There is NO explicit `status` or `is_active` field in the `mesocycles` table. Active status is calculated based on date ranges.

### Week Status Logic

**Location:** `IndividualPlanPage.tsx:101-110`

```typescript
function isWeekPast(week): boolean {
  return new Date(week.end_date) < new Date()
}

function isWeekCurrent(week): boolean {
  const today = new Date()
  return today >= new Date(week.start_date) && today <= new Date(week.end_date)
}
```

### Visual Indicators

| State | Icon | Styling |
|-------|------|---------|
| Past week | Green checkmark | `bg-green-500` |
| Current week | Primary dot | `bg-primary` with ring |
| Future week | Empty circle | `bg-muted-foreground/30` |
| Selected | Ring highlight | `ring-2 ring-offset-1` |

### Issue: One Active Block at a Time?

**Current Behavior:** The system does NOT enforce one active block at a time. If date ranges overlap, multiple blocks could be "active".

**Evidence:** `hasActiveTrainingBlockAction()` exists at line 1510 but is not used to prevent creation.

### Recommendation

**Option A: Soft Limit (Recommended)**
- Allow multiple blocks
- In home page, show the most recent active block
- Add "Switch Block" functionality

**Option B: Hard Limit**
- Warn user when creating overlapping block
- Require ending current block before starting new one

---

## 3. Navigation Patterns

### Current Navigation Flow

```
/plans (Home)
├── No blocks → EmptyTrainingState → /plans/new (Create)
├── Has active block → IndividualPlanPage (embedded)
│   ├── Week selector → switch weeks in-place
│   ├── Day selector → switch workouts in-place
│   ├── Start button → /plans/[id]/session/[sessionId] (WRONG!)
│   └── Edit button → /plans/[id]/session/[sessionId] (Correct)
└── No active block → CompactBlockRow → /plans/[id]

/workout (Workout Logger Hub - ALREADY EXISTS)
├── Shows ongoing/assigned workout_logs
├── OngoingSessionBanner → /workout/[workoutLogId]
├── NextSessionCard → /workout/[workoutLogId]
└── WorkoutSessionSelector → /workout/[workoutLogId]
```

### Navigation Issues

#### Issue 1: Start Button Goes to Session Planner (WRONG)

**Location:** `IndividualPlanPage.tsx:165-168`

```typescript
const handleStartWorkout = () => {
  if (displayedWorkout) {
    router.push(`/plans/${trainingBlock.id}/session/${displayedWorkout.id}`)
  }
}
```

**Problem:** The "Start" button navigates to the Session Planner (`/plans/[id]/session/[sessionId]`) instead of the Workout Logger (`/workout/[workoutLogId]`).

**The Workout Logger already exists at `/workout/[id]`** and is fully functional for logging workouts.

#### Issue 2: workout_logs Not Pre-Created

**Critical Gap:** When `saveGeneratedPlanAction` saves an AI-generated plan, it creates:
- mesocycle
- microcycles
- session_plans
- session_plan_exercises
- session_plan_sets

**But it does NOT create `workout_logs`!**

This means when users go to `/workout`, they see nothing because there are no workout_logs assigned to them.

### Recommended Fix

1. **Add workout_logs creation** to `saveGeneratedPlanAction` - pre-assign all sessions as `workout_logs` with status `assigned`
2. **Fix Start button** to find the workout_log for the session_plan and navigate to `/workout/{workoutLogId}`

---

## 4. Button & Action Issues

### 4.1 Options Button Placement

**Current Location:**
- Desktop: Bottom of left sidebar
- Mobile: Header, right side (kebab menu)

**Problems:**
1. Desktop: Hidden at bottom of scrollable sidebar
2. Mobile: Cramped in header with other controls
3. Inconsistent position between layouts

**Recommendation:** Move to consistent location:
- Desktop: Top-right of main content header
- Mobile: Keep in header but as icon-only button

### 4.2 Edit Block - Non-Functional

**Location:** `IndividualPlanPage.tsx:367-370` and `584-587`

```typescript
<DropdownMenuItem>
  <Edit className="h-4 w-4 mr-2" />
  Edit Block
</DropdownMenuItem>
// NO onClick handler!
```

**Fix Required:** Add `onClick` handler to open `EditTrainingBlockDialog` which already exists at `apps/web/components/features/plans/workspace/components/EditTrainingBlockDialog.tsx`.

### 4.3 "Regenerate with AI" - Wrong Concept

**Current Behavior:**
```typescript
onClick={() => router.push(`/plans/new?regenerate=${trainingBlock.id}`)}
```

**Problem:** The `regenerate` param is NOT USED in `QuickStartWizard.tsx`. It just creates a new block from scratch.

**Correct Approach:**
- This should NOT be "regenerate" (creating a new block)
- It should be **"Edit with AI"** - opens the AI assistant in edit/refinement mode
- For minor changes: Use AI assistant to refine exercises, sets, etc. within the existing block
- For major changes: User creates a NEW training block via `/plans/new`

### 4.4 Add Block Button - Location Unclear

The "Add Block" functionality is in `/plans/new`, accessed via:
- Empty state "Create Training Block" button
- "Create Training Block" in no-active-block state

**Not Found In:** IndividualPlanPage itself (no way to add second block while viewing one)

**Recommendation:** Add to block switcher dropdown:
```
Block Switcher Dropdown
├── [Current Block Name] ✓
├── [Other Block 1]
├── [Other Block 2]
├── ─────────────────
└── + Add New Block → /plans/new
```

---

## 5. Mobile vs Desktop Experience

### Current Layout Differences

| Aspect | Mobile (<1024px) | Desktop (≥1024px) |
|--------|------------------|-------------------|
| **Layout** | Single column | 2-column (sidebar + content) |
| **Week Selector** | Bottom sheet (Vaul drawer) | Left sidebar + Popover |
| **Day Selector** | Horizontal scroll (64px buttons) | Horizontal scroll (80px buttons) |
| **Options Menu** | Header kebab | Sidebar bottom |
| **Block Switcher** | Header with dropdown | Sidebar with dropdown |

### Mobile-Specific Issues

1. **Day Selector Horizontal Scroll**
   - No visual indication of overflow
   - Easy to miss workouts on edge

2. **Week Progress Dots**
   - Small touch targets
   - Progress dots are 2px, hard to tap

3. **Sticky Header Height**
   - Multiple rows take up significant viewport
   - Less content visible

### Desktop-Specific Issues

1. **Sidebar Width Fixed at 256px**
   - Wasted space on large screens
   - Week names can truncate

2. **Options Button Hidden**
   - At bottom of scrollable sidebar
   - Not discoverable

---

## 6. Database Schema Analysis

### Mesocycles Table (from database.ts:683-738)

```typescript
mesocycles: {
  Row: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    macrocycle_id: number | null  // NULL for individual users
    user_id: number | null
    metadata: Json | null         // Contains focus, equipment, createdVia
    notes: string | null
    created_at: string | null
    updated_at: string | null
  }
}
```

**Note:** No `status` or `is_active` field exists.

### Workout Logs Table

```typescript
workout_logs: {
  Row: {
    id: number
    session_plan_id: number       // Links to session_plan
    athlete_id: number
    date_time: string
    session_status: 'assigned' | 'ongoing' | 'completed'
    notes: string | null
    // ... more fields
  }
}
```

---

## 7. User Journey Stories

### Story 1: First-Time User Creates Plan

```
1. Complete onboarding → Redirected to /plans
2. See EmptyTrainingState
3. Click "Create Training Block" → /plans/new
4. QuickStartWizard:
   - Step 1: Block settings (name, duration, focus)
   - Step 2: Week setup (days, equipment)
   - Step 3: AI review → Generate
5. saveGeneratedPlanAction creates mesocycle, microcycles, session_plans
6. Redirect to /plans/[id]
7. See IndividualPlanPage with generated workouts

ISSUE:
- workout_logs are NOT created
- "Start" button goes to Session Planner, not Workout Logger
- User cannot log their workouts properly
```

### Story 2: User Starts Today's Workout (CURRENT - BROKEN)

```
1. Open /plans → See active block with today's workout
2. Click "Start" button
3. Goes to /plans/[id]/session/[sessionId] (Session Planner)
4. User is in EDIT mode, not WORKOUT LOGGING mode
5. Confusion: "I wanted to log my workout, not edit the plan"
```

### Story 3: User Starts Today's Workout (EXPECTED - FIXED)

```
1. Open /plans → See active block with today's workout
2. Click "Start" button
3. System finds workout_log for this session_plan (pre-created)
4. If status is 'assigned', starts it (sets to 'ongoing')
5. Navigates to /workout/[workoutLogId]
6. User is in WORKOUT LOGGER mode
7. Log sets as completed, timer, rest tracking
```

---

## 8. Prioritized Recommendations

### P0: Critical Fixes

| Issue | Fix | File |
|-------|-----|------|
| **workout_logs not created** | Add workout_logs creation to `saveGeneratedPlanAction` | `save-generated-plan-action.ts` |
| **Start button wrong destination** | Navigate to `/workout/{workoutLogId}` after finding the workout_log | `IndividualPlanPage.tsx:165-168` |
| **Edit Block non-functional** | Add onClick to open `EditTrainingBlockDialog` | `IndividualPlanPage.tsx:367-370, 584-587` |
| **"Regenerate with AI" misleading** | Rename to "Edit with AI", open AI assistant in edit mode | `IndividualPlanPage.tsx:371, 588` |

### P1: Important UX Improvements

| Issue | Fix |
|-------|-----|
| No "Add Block" in plan view | Add "+ New Block" to block switcher dropdown |
| Options button placement | Move to header on both layouts |
| Past workouts show "Start" | Show "View Log" for completed, "Start" only for current/future |

### P2: Enhanced Features

| Feature | Description |
|---------|-------------|
| Block status field | Add status enum to database for explicit state tracking |
| Completion tracking | Mark workouts/weeks as done with visual indicators |

---

## Implementation Plan

### Phase 1: Fix Critical Navigation (This PR)

#### 1. Add workout_logs to saveGeneratedPlanAction

In `apps/web/actions/plans/save-generated-plan-action.ts`, after creating session_plans, add:

```typescript
// Get athlete ID for the user
const { data: athlete } = await supabase
  .from('athletes')
  .select('id')
  .eq('user_id', dbUserId)
  .single()

if (athlete) {
  // Create workout_logs for all sessions
  const workoutLogInserts = []
  for (const microcycle of input.plan.microcycles) {
    for (const session of microcycle.session_plans) {
      // Calculate scheduled date based on week and day
      const scheduledDate = calculateSessionDate(startDate, microcycle.week_number, session.day_of_week)
      workoutLogInserts.push({
        session_plan_id: sessionPlanId,  // The ID from insert
        athlete_id: athlete.id,
        date_time: scheduledDate.toISOString(),
        session_status: 'assigned'
      })
    }
  }
  await supabase.from('workout_logs').insert(workoutLogInserts)
}
```

#### 2. Fix Start Button in IndividualPlanPage

```typescript
const handleStartWorkout = async () => {
  if (!displayedWorkout) return

  // Find the workout_log for this session_plan
  const result = await findWorkoutLogForSessionPlan(displayedWorkout.id)

  if (result.isSuccess && result.data) {
    router.push(`/workout/${result.data.id}`)
  } else {
    // Fallback or error handling
    toast({ title: "Error", description: "Workout not found", variant: "destructive" })
  }
}
```

#### 3. Wire Up Edit Block Button

```typescript
<DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
  <Edit className="h-4 w-4 mr-2" />
  Edit Block
</DropdownMenuItem>

// Add dialog
<EditTrainingBlockDialog
  block={trainingBlock}
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
  onSave={handleSaveBlock}
/>
```

#### 4. Rename "Regenerate with AI" to "Edit with AI"

```typescript
<DropdownMenuItem onClick={() => openAIAssistantInEditMode()}>
  <Sparkles className="h-4 w-4 mr-2" />
  Edit with AI
</DropdownMenuItem>
```

This should open the AI assistant panel/overlay in edit mode for the current training block, allowing users to request refinements like:
- "Add more leg exercises to Week 2"
- "Replace bench press with dumbbell variations"
- "Reduce volume in Week 4 for deload"

---

## Appendix: File References

| Component | Location |
|-----------|----------|
| IndividualPlanPage | `apps/web/components/features/plans/individual/IndividualPlanPage.tsx` |
| saveGeneratedPlanAction | `apps/web/actions/plans/save-generated-plan-action.ts` |
| EditTrainingBlockDialog | `apps/web/components/features/plans/workspace/components/EditTrainingBlockDialog.tsx` |
| Workout Logger Hub | `apps/web/components/features/workout/components/pages/workout-page-content.tsx` |
| Workout Session Page | `apps/web/app/(protected)/workout/[id]/page.tsx` |
| workout-session-actions | `apps/web/actions/workout/workout-session-actions.ts` |
