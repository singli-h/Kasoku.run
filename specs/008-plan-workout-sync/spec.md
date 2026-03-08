# Feature Specification: Plan Page Improvements

**Feature Branch**: `008-plan-workout-sync`
**Created**: 2026-01-04
**Updated**: 2026-01-08
**Status**: Draft
**Priority**: Medium-High
**Estimated Complexity**: High

---

## Overview

Comprehensive improvements to the **Plan page** for Coach, Athlete, and Individual users, covering:

**Part A - Plan-Workout Sync**: Enable automatic synchronization of coach session plan changes to athlete workouts, plus manual re-sync option.

**Part B - UX Improvements**: Enable individual user editing capabilities, reduce friction, and improve usability based on code audit and industry best practices.

**Part C - Role-Based Experience**: Tailored terminology and page layouts for each user role (Coach, Athlete, Individual).

---

## Table of Contents

1. [Role-Based Design Philosophy](#role-based-design-philosophy)
2. [Terminology Strategy](#terminology-strategy)
3. [Page Designs by Role](#page-designs-by-role)
4. [Part A: Plan-Workout Sync](#part-a-plan-workout-sync)
5. [Part B: UX Improvements](#part-b-ux-improvements)
6. [Ground Truth Summary](#ground-truth-summary)
7. [Combined Scope](#combined-scope)
8. [Implementation Phases](#implementation-phases)
9. [Files to Modify](#files-to-modify)

---

# Role-Based Design Philosophy

## Core Insight

**Athletes think in sessions. Coaches think in blocks. The system should support both.**

| User Type | Mental Model | Primary Need |
|-----------|--------------|--------------|
| **Coach** | Periodization hierarchy (Season → Phase → Week → Session) | Plan creation, assignment, tracking |
| **Athlete** | Today's workout, this week's schedule | Execution, logging, progress |
| **Individual** | My training block, my workouts | Self-management, simplicity |

## Design Principles

1. **Progressive Disclosure**: Show complexity only to those who need it
2. **Action-Oriented**: Prominent CTAs for primary tasks
3. **Context-Aware**: Show relevant information based on role
4. **Terminology Adaptation**: Use familiar terms for each audience

---

# Terminology Strategy

## Industry Standard (Sports Science)

Based on [TrainingPeaks](https://www.trainingpeaks.com/blog/macrocycles-mesocycles-and-microcycles-understanding-the-3-cycles-of-periodization/), [TrainerRoad](https://www.trainerroad.com/blog/training-periodization-macro-meso-microcycles-of-training/), and [CoachRx](https://www.coachrx.app/articles/planning-amp-periodization-tools-to-design-better-programs):

| Cycle | Duration | Purpose |
|-------|----------|---------|
| **Macrocycle** | 6-12 months (season/year) | Bird's-eye view, all phases |
| **Mesocycle** | 3-12 weeks (usually 4-6) | Training block with specific goal (Base, Build, Peak) |
| **Microcycle** | 1 week (7 days) | Weekly training structure |

## Role-Based Terminology Mapping

| Database Term | Coach UI | Athlete UI | Individual UI |
|---------------|----------|------------|---------------|
| `macrocycles` | "Season" or "Annual Plan" | *(hidden)* | "My Plan" |
| `mesocycles` | "Phase" or "Block" | "Current Phase" | "Training Block" |
| `microcycles` | "Week" | "This Week" | "Week" |
| `session_plans` | "Session" | "Workout" | "Workout" |
| `workout_logs` | "Athlete Workout" | "My Workout" | "Workout" |

## Phase Naming Convention

Encourage goal-based phase names instead of generic numbering:

| Phase Type | Description | Typical Duration |
|------------|-------------|------------------|
| **Base** | Foundation building, volume focus | 4-8 weeks |
| **Build** | Intensity increases, specificity | 4-6 weeks |
| **Peak** | Competition prep, sharpening | 2-4 weeks |
| **Recovery/Deload** | Active rest, adaptation | 1-2 weeks |

---

# Page Designs by Role

## 1. Plans Home Page

### Coach View (`/plans`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Training Plans                                            [+ New Season]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Active Seasons ─────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  📅 2025 Competition Season                              ⋮ Menu      │  │
│  │     Base Phase → Build Phase → Peak Phase                             │  │
│  │     12 weeks • 36 sessions • Assigned to: Team Alpha                 │  │
│  │     [View] [Edit] [Assign]                                           │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Athlete Groups ─────────────────────────────────────────────────────┐  │
│  │  👥 Team Alpha (8 athletes)     Current: 2025 Competition Season     │  │
│  │  👥 Team Beta (5 athletes)      No active plan                       │  │
│  │  [Manage Groups]                                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Quick Actions ──────────────────────────────────────────────────────┐  │
│  │  [+ Create Season]  [+ Quick Session]  [📋 Templates]                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Athlete View (`/plans` → redirects to `/workout`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  My Training                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ TODAY ──────────────────────────────────────────────────────────────┐  │
│  │  🔥 Upper Body Strength                                              │  │
│  │     Part of: Build Phase (Week 2 of 4)                               │  │
│  │     5 exercises • Est. 45 min                                        │  │
│  │     ┌────────────────────────────────────────────┐                   │  │
│  │     │         [ START WORKOUT ]                  │                   │  │
│  │     └────────────────────────────────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ THIS WEEK ──────────────────────────────────────────────────────────┐  │
│  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun                             │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  ← Clickable             │  │
│  │  │ ✓ │ │   │ │ ● │ │   │ │ ○ │ │   │ │ ○ │                          │  │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                          │  │
│  │  ✓ Completed  ● Today  ○ Upcoming                                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ MY PROGRESS ────────────────────────────────────────────────────────┐  │
│  │  Build Phase: ████████░░ 50% complete (2 of 4 weeks)                │  │
│  │  Streak: 🔥 12 days                                                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Individual View (`/plans`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  My Training                                               [+ New Block]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ TODAY ──────────────────────────────────────────────────────────────┐  │
│  │  🔥 Push Day                                                         │  │
│  │     Week 2 of Strength Block                                         │  │
│  │     6 exercises • Est. 50 min                                        │  │
│  │     ┌────────────────────────────────────────────┐                   │  │
│  │     │         [ START WORKOUT ]                  │                   │  │
│  │     └────────────────────────────────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ THIS WEEK ──────────────────────────────────────────────────────────┐  │
│  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun                             │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  ← Clickable             │  │
│  │  │ ✓ │ │   │ │ ● │ │   │ │ ○ │ │   │ │   │                          │  │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  [+ Add Workout]         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ACTIVE BLOCK ───────────────────────────────────────────────────────┐  │
│  │  💪 Strength Block                                    [Edit Block]   │  │
│  │     Started: Jan 6 • 4 weeks total                                   │  │
│  │     Progress: ████████░░░░ 50%                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PAST BLOCKS ────────────────────────────────────────────────────────┐  │
│  │  ✓ Base Building (Dec 2024) - Completed                              │  │
│  │  [View all →]                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Plan Detail Page (Workspace)

### Analysis: Minimal Changes Needed

**Good News**: After code audit, the current `TrainingPlanWorkspace.tsx` (Coach) and `IndividualWorkspace.tsx` (Individual) are **well-architected**. The 3-panel and 2-panel structures already match periodization hierarchy.

| Current Component | Current Structure | Change Needed |
|-------------------|-------------------|---------------|
| `TrainingPlanWorkspace` | 3-panel: Mesocycles → Microcycles → Sessions | ✅ Keep as-is |
| `IndividualWorkspace` | 2-panel: Weeks → Workouts | ✅ Keep as-is |
| Mobile carousel | Swipe between panels | ✅ Keep as-is |

### Coach View - Add "Assigned To" Section

The only addition for coach is visibility into assignments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Existing 3-panel workspace - NO CHANGES]                                  │
│  ┌──────────────────────┬──────────────────┬──────────────────────┐         │
│  │ Phases (Mesocycles)  │ Weeks            │ Sessions             │         │
│  │ ...                  │ ...              │ ...                  │         │
│  └──────────────────────┴──────────────────┴──────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─ ASSIGNED TO (NEW) ──────────────────────────────────────────────────┐  │
│  │  👥 Team Alpha (8 athletes)                                          │  │
│  │     Started: Jan 6 • Currently: Week 3 of Base Phase                 │  │
│  │     Completion: 67% average                                          │  │
│  │     [View Progress] [Manage Assignment]                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Individual View - Enable Disabled Buttons

Only change: Enable the currently disabled buttons (Phase 1 tasks).

```
Current:  [Edit Block - DISABLED]  [Add Workout - DISABLED]
Proposed: [Edit Block]             [Add Workout]
```

## 3. Assignment Dialog (Coach Only)

Enhanced with granular assignment options:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Assign: 2025 Competition Season                                    [X]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ WHAT TO ASSIGN ─────────────────────────────────────────────────────┐  │
│  │  ● Entire Season (12 weeks, 36 sessions)                             │  │
│  │  ○ Single Phase:  [Base Phase ▼]                                     │  │
│  │  ○ Single Week:   [Week 3 ▼]                                         │  │
│  │  ○ Single Session: [Upper Strength - Week 3 Mon ▼]                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ WHO TO ASSIGN ──────────────────────────────────────────────────────┐  │
│  │  Groups:                                                              │  │
│  │  ☑ Team Alpha (8 athletes)                                           │  │
│  │  ☐ Team Beta (5 athletes)                                            │  │
│  │                                                                       │  │
│  │  Or select individuals: [Expand]                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ START DATE ─────────────────────────────────────────────────────────┐  │
│  │  ● Next Monday (Jan 13, 2025)           ← Recommended                │  │
│  │  ○ Anchor to competition date                                        │  │
│  │  ○ Custom date: [__________]                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Summary: Assigning 36 sessions to 8 athletes (288 workout assignments)    │
│                                                                             │
│                                          [Cancel]  [Assign]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Session/Workout Execution Page

**No changes needed** - Current WorkoutView.tsx is well-designed.

Only addition (Phase 5): "Updates Available" badge and sync menu option.

## 5. Summary: Pages That Need Changes

| Page | Role | Changes Needed | Priority | Effort |
|------|------|----------------|----------|--------|
| **Plans Home** | Coach | Minor: Groups section visibility, quick actions | P2 | Low |
| **Plans Home** | Athlete | New design (or redirect to /workout) | P1 | Medium |
| **Plans Home** | Individual | Add Today CTA, make days clickable | **P1** | Low |
| **Plan Detail** | Coach | Add "Assigned To" section below workspace | P2 | Low |
| **Plan Detail** | Individual | Enable Edit Block + Add Workout buttons | **P0** | Medium |
| **Assignment Dialog** | Coach | Add granular assignment options (phase/week/session) | P2 | Medium |
| **Session/Workout** | All | **No changes** (except Phase 5 sync badge) | - | - |

---

# Part A: Plan-Workout Sync

## Problem Statement

When a coach modifies a session plan after athletes are assigned, the changes do NOT propagate - athletes see the original plan.

### Current Architecture

```
Coach creates session_plan
        ↓
Coach assigns to athletes → Creates workout_logs (linked via session_plan_id)
        ↓
Coach modifies session_plan → ❌ workout_logs NOT updated
        ↓
Athlete sees ORIGINAL plan
```

### Proposed Architecture

```
Coach modifies session_plan
        ↓
Auto-sync to workout_logs WHERE session_status = 'assigned'
        ↓
Athletes in 'ongoing' sessions can manually re-sync (opt-in)
```

---

## Database Relationship Reference

```sql
-- Current FK relationship
workout_logs.session_plan_id → session_plans.id (nullable)

-- Session status enum
session_status: 'assigned' | 'ongoing' | 'completed' | 'cancelled'

-- Relevant tables for sync
session_plans → session_plan_exercises → session_plan_sets
workout_logs → workout_log_exercises → workout_log_sets
```

---

## User Scenarios - Sync

### US-A01: Coach Auto-Push Changes (Priority: P1)

When a coach saves changes to a session plan, automatically update all linked workouts that athletes haven't started yet.

**Target Audience**: Coach (trigger), Athletes (recipients)

**Trigger**: `saveSessionWithExercisesAction()` in session-planner-actions.ts

**Target Workouts**:
- `workout_logs` WHERE `session_plan_id = {plan_id}` AND `session_status = 'assigned'`

**Sync Operations**:
| Plan Change | Sync Action |
|-------------|-------------|
| Exercise added | Create new `workout_log_exercise` + sets |
| Exercise removed | Delete `workout_log_exercise` + sets |
| Exercise reordered | Update `exercise_order` |
| Set added | Create new `workout_log_set` |
| Set removed | Delete `workout_log_set` |
| Set parameters changed | Update `workout_log_set` values |
| Session name/description | Update `workout_logs` metadata |

**Acceptance Criteria**:

1. **Given** 5 athletes have workout_logs linked to session plan X with status='assigned', **When** coach saves changes to session plan X, **Then** all 5 workout_logs are updated with new exercises/sets.

2. **Given** 1 athlete has started (status='ongoing') and 4 have not, **When** coach saves changes, **Then** only the 4 'assigned' workouts are updated; the 'ongoing' workout is unchanged.

3. **Given** coach adds a new exercise to session plan, **When** sync runs, **Then** new `workout_log_exercise` is created for each 'assigned' workout with corresponding sets.

4. **Given** coach removes an exercise, **When** sync runs, **Then** corresponding `workout_log_exercise` is deleted (only if no actual data logged).

---

### US-A02: Athlete Manual Re-Sync (Priority: P2)

Athletes with 'ongoing' sessions can optionally pull coach updates via a manual sync button.

**Target Audience**: Athlete

**UI Location**:
- Hidden in overflow menu (three-dot menu) next to Save button in WorkoutView header
- Shows only when: `session_status = 'ongoing'` AND `session_plan_id IS NOT NULL`

**User Flow**:
```
Athlete opens ongoing workout
        ↓
Clicks three-dot menu (⋮)
        ↓
Sees "Sync from Coach Plan" option
        ↓
Confirmation dialog: "Pull latest changes from coach? Your logged performance data will be preserved."
        ↓
Click "Sync" → Merges changes
```

**Merge Strategy** (for ongoing sessions):
| Scenario | Behavior |
|----------|----------|
| Coach added new exercise | Add to athlete's workout (at end) |
| Coach removed exercise (athlete hasn't logged) | Remove from workout |
| Coach removed exercise (athlete HAS logged) | **Keep** - preserve athlete data |
| Coach changed set parameters | Update only sets athlete hasn't completed |
| Coach added sets | Add new sets |
| Coach removed sets (not completed) | Remove sets |
| Coach removed sets (completed) | **Keep** - preserve athlete data |

**Acceptance Criteria**:

1. **Given** athlete is mid-workout (status='ongoing'), **When** they click "Sync from Coach Plan", **Then** new exercises from coach appear in their workout.

2. **Given** athlete has completed 3 of 5 sets, **When** coach changes set 4 parameters and athlete syncs, **Then** sets 1-3 unchanged, set 4 updated, set 5 updated.

3. **Given** athlete has logged performance on an exercise, **When** coach deletes that exercise and athlete syncs, **Then** exercise is preserved (athlete data protected).

4. **Given** coach hasn't made any changes since assignment, **When** athlete clicks sync, **Then** toast: "Already up to date with coach plan."

---

### US-A03: Sync Indicator (Priority: P3)

Show athletes when their workout differs from the current coach plan.

**UI**: Small badge/indicator near session title showing "Updates available" if plan has changed.

**Check Logic**:
- Compare `session_plans.updated_at` with `workout_logs.synced_at` (new column)
- If plan updated after last sync → show indicator

**Acceptance Criteria**:

1. **Given** coach updates session plan after athlete started, **When** athlete views ongoing workout, **Then** "Updates available" badge appears.

2. **Given** athlete syncs successfully, **When** they view workout, **Then** badge disappears.

---

## UI Design - Sync

### Three-Dot Menu Location (WorkoutView.tsx)

```
Current:  [Save] [Finish]

Proposed: [Save] [⋮] [Finish]
                  └─> "Sync from Coach Plan" (if ongoing + has plan)
                      "View Original Plan" (future)
```

### Confirmation Dialog

```
┌─────────────────────────────────────┐
│  Sync from Coach Plan?              │
│                                     │
│  Your coach has updated the session │
│  plan. Pull the latest changes?     │
│                                     │
│  • Your logged performance will be  │
│    preserved                        │
│  • New exercises may be added       │
│  • Uncompleted sets may change      │
│                                     │
│        [Cancel]    [Sync Now]       │
└─────────────────────────────────────┘
```

### "Updates Available" Badge

```
┌─────────────────────────────────────┐
│ Upper Body Strength     🔵 Updates  │
│ Session 3 of Week 2        available│
└─────────────────────────────────────┘
```

---

# Part B: UX Improvements

## Problem Statement

Based on code audit (2026-01-07), the Plan page has usability gaps:

**Individual Users**:
- Cannot edit training blocks after creation (button disabled)
- Cannot add workouts to weeks (button disabled)
- No quick action to start today's workout
- Week days not clickable

**Coach Users**:
- Disabled menu items visible (Duplicate, Export, Delete)
- No periodization terminology help
- Jarring page reload after assignment

---

## Ground Truth Summary

### Files Analyzed

| File | Lines | Status |
|------|-------|--------|
| `PlansHome.tsx` | 142 | Server component, working |
| `PlansHomeClient.tsx` | 270 | 3 disabled menu items |
| `IndividualPlansHome.tsx` | 92 | Server component, working |
| `IndividualPlansHomeClient.tsx` | 191 | Week not clickable |
| `TrainingPlanWorkspace.tsx` | 1185 | Client edits only |
| `IndividualWorkspace.tsx` | 283 | 3 disabled buttons |
| `MesoWizard.tsx` | 120 | 4-step, working |
| `QuickStartWizard.tsx` | 449 | 2-step, working |

### Disabled Features (Ground Truth)

**IndividualWorkspace.tsx**:
```typescript
// Line 72-75
<Button disabled title="Coming soon">Edit Block</Button>

// Line 110-114, 239-242
<Button disabled title="Coming soon">Add Workout</Button>
```

**PlansHomeClient.tsx**:
```typescript
// Lines 121-133
<DropdownMenuItem disabled>Duplicate Plan</DropdownMenuItem>
<DropdownMenuItem disabled>Export</DropdownMenuItem>
<DropdownMenuItem disabled>Delete</DropdownMenuItem>
```

---

## User Scenarios - UX

### Classification

| Priority | Description | Criteria |
|----------|-------------|----------|
| **P0-NEEDED** | Blocks core workflow | Users cannot complete essential tasks |
| **P1-NEEDED** | Major friction | Significantly impacts user satisfaction |
| **P2-GOOD** | Improvement | Enhances experience, not blocking |
| **P3-GOOD** | Polish | Nice-to-have refinements |

---

### US-B01: Individual Edit Block (P0-NEEDED)

**Problem**: Individual users cannot modify training blocks after creation.

**Current State** (`IndividualWorkspace.tsx:72-75`):
```typescript
<Button disabled title="Coming soon">Edit Block</Button>
```

**Proposed Solution**:
Enable editing with dialog:
- Edit block name
- Adjust dates (with validation for active blocks)
- Change focus type

**Acceptance Criteria**:
1. **Given** individual user views their training block, **When** they click "Edit Block", **Then** a dialog opens with editable name, dates, and focus.
2. **Given** block has active/ongoing workouts, **When** dates change, **Then** system warns about affected workouts.
3. **Given** user saves changes, **Then** mesocycle is updated via `updateMesocycleAction()`.

---

### US-B02: Individual Add Workout (P0-NEEDED)

**Problem**: Individual users cannot add workouts to their training block.

**Current State** (`IndividualWorkspace.tsx:110-114`, `239-242`):
```typescript
<Button disabled title="Coming soon">Add Workout</Button>
```

**Proposed Solution**:
Enable adding sessions to any week:
- Select day of week
- Set workout name and type
- Optionally copy from existing workout

**Acceptance Criteria**:
1. **Given** user selects a week, **When** they click "Add Workout", **Then** a dialog opens to create a new session.
2. **Given** user fills form and saves, **Then** new `session_plan` created linked to microcycle.
3. **Given** day already has workout, **Then** allow multiple or show conflict warning.

---

### US-B03: Remove Disabled Menu Items (P1-NEEDED)

**Problem**: Coach dropdown shows Duplicate/Export/Delete as disabled, creating frustration.

**Current State** (`PlansHomeClient.tsx:121-133`):
```typescript
<DropdownMenuItem disabled>Duplicate Plan</DropdownMenuItem>
<DropdownMenuItem disabled>Export</DropdownMenuItem>
<DropdownMenuItem disabled>Delete</DropdownMenuItem>
```

**Proposed Solution**: Remove disabled items entirely until implemented.

**Acceptance Criteria**:
1. **Given** feature is not implemented, **Then** menu item is not rendered.

---

### US-B04: Quick Start Workout CTA (P1-NEEDED)

**Problem**: Individual home page lacks prominent action to start today's workout.

**Current State**: Shows "Active Training" card but no direct "Start Workout" button.

**Proposed Solution**:
Add prominent button when `todayWorkout` exists:
```
┌─────────────────────────────────────┐
│ [Start Today's Workout →]           │
│ Upper Body Strength • 6 exercises   │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
1. **Given** today has a scheduled workout, **When** user views home, **Then** prominent CTA appears.
2. **Given** user clicks CTA, **Then** navigates directly to session page.
3. **Given** no workout today, **Then** CTA not shown or shows "Rest Day".

---

### US-B05: Clickable Week Overview Days (P1-NEEDED)

**Problem**: Week overview dots indicate workouts but are not clickable.

**Current State** (`IndividualPlansHomeClient.tsx:139-190`):
- Days render as static `<div>` elements
- No `onClick` handlers

**Proposed Solution**:
Make workout days clickable to navigate to that session.

**Acceptance Criteria**:
1. **Given** day has workout, **When** user clicks day, **Then** navigates to session.
2. **Given** day has workout, **Then** cursor shows pointer, hover state visible.

---

### US-B06: Coach Periodization Tooltips (P2-GOOD)

**Problem**: Coach UI uses periodization jargon without explanation.

**Proposed Solution**:
Add info icons with tooltips:
- Macrocycle: "Your annual or seasonal training plan"
- Mesocycle: "A training phase (4-8 weeks) with specific goals"
- Microcycle: "A single training week"

---

### US-B07: Replace Page Reload (P2-GOOD)

**Problem**: After assignment, page uses `window.location.reload()` which is jarring.

**Current State** (`PlansHomeClient.tsx:261`):
```typescript
window.location.reload()
```

**Proposed Solution**:
```typescript
router.refresh()
```

---

### US-B08: Fix Completed Blocks Link (P2-GOOD)

**Problem**: "View all N completed blocks" links to `/plans?filter=completed` but filter doesn't work.

**Current State** (`IndividualPlansHomeClient.tsx:100-103`):
```typescript
<Link href="/plans?filter=completed">View all...</Link>
```

**Proposed Solution**: Implement expand/collapse instead of navigation.

---

### US-B09: Consolidate Redundant Sections (P3-GOOD)

**Problem**: "Active Training" and "This Week" sections show overlapping information.

**Proposed Solution**: Combine into single "My Training" section with block info, week grid, and CTA.

---

### US-B10: Mobile Swipe Indicator (P3-GOOD)

**Problem**: Coach workspace has swipe navigation on mobile but no visual indicator.

**Proposed Solution**: Add pagination dots showing current panel (1 of 3).

---

## UI Design - UX

### Edit Block Dialog

```
┌─────────────────────────────────────┐
│  Edit Training Block                 │
│                                     │
│  Name                               │
│  ┌─────────────────────────────┐    │
│  │ 8-Week Strength Program     │    │
│  └─────────────────────────────┘    │
│                                     │
│  Start Date              End Date   │
│  ┌────────────┐     ┌────────────┐  │
│  │ 2026-01-06 │     │ 2026-03-02 │  │
│  └────────────┘     └────────────┘  │
│                                     │
│  Focus                              │
│  ○ Strength  ● Endurance  ○ General │
│                                     │
│        [Cancel]    [Save Changes]   │
└─────────────────────────────────────┘
```

### Add Workout Dialog

```
┌─────────────────────────────────────┐
│  Add Workout                         │
│                                     │
│  Day                                │
│  [Monday ▼]                         │
│                                     │
│  Name                               │
│  ┌─────────────────────────────┐    │
│  │ Upper Body Strength         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Type                               │
│  ○ Strength  ○ Cardio  ○ Recovery   │
│                                     │
│        [Cancel]    [Add Workout]    │
└─────────────────────────────────────┘
```

### Quick Start CTA

```
Individual Home - When Today Has Workout:
┌─────────────────────────────────────┐
│ 🏋️ Ready to train?                  │
│                                     │
│ Upper Body Strength                 │
│ 6 exercises • ~45 min               │
│                                     │
│ [Start Workout →]                   │
└─────────────────────────────────────┘
```

---

# Combined Scope

| In Scope | Out of Scope |
|----------|--------------|
| Auto-push coach changes on save | Real-time live sync (WebSocket) |
| Manual re-sync button for athletes | Conflict resolution UI for complex merges |
| Sync to 'assigned' workouts | Sync to 'completed' workouts |
| Enable individual edit/add | Coach workspace DB persistence |
| Remove disabled menu items | Implement Duplicate/Export/Delete |
| Quick action CTAs | Calendar view paradigm |
| Clickable week days | Drag-and-drop reordering |
| Periodization tooltips | Template library |

---

# Implementation Phases

## Phase 1: Individual Functionality (P0) - 6-8 hours

| ID | Task | Effort |
|----|------|--------|
| US-B01 | Enable Edit Block | 3-4h |
| US-B02 | Enable Add Workout | 3-4h |

**Goal**: Individual users can fully manage their training.

## Phase 2: Friction Reduction (P1) - 4-6 hours

| ID | Task | Effort |
|----|------|--------|
| US-B03 | Remove disabled menu items | 30min |
| US-B04 | Add Quick Start CTA | 1-2h |
| US-B05 | Make week days clickable | 1h |

**Goal**: Reduce clicks, improve discoverability.

## Phase 3: Sync MVP (P1) - 5-7 hours

| ID | Task | Effort |
|----|------|--------|
| US-A01 | Auto-push for 'assigned' workouts | 4-6h |
| DB | Add `synced_at` column | 1h |

**Goal**: Coach changes propagate to unstarted workouts.

## Phase 4: Polish (P2-P3) - 5-8 hours

| ID | Task | Effort |
|----|------|--------|
| US-B06 | Periodization tooltips | 1-2h |
| US-B07 | Replace window.reload | 15min |
| US-B08 | Fix completed blocks link | 1h |
| US-B09 | Consolidate sections | 2-3h |
| US-B10 | Swipe indicator | 1h |

## Phase 5: Advanced Sync (P2) - 8-10 hours

| ID | Task | Effort |
|----|------|--------|
| US-A02 | Manual re-sync for athletes | 6-8h |
| US-A03 | Sync indicator | 2h |

**Goal**: Athletes can pull updates mid-workout.

---

# Technical Analysis

## Complexity Assessment

| Factor | Complexity | Reason |
|--------|------------|--------|
| Individual edit/add | Low | Reuse existing patterns |
| Remove disabled items | Trivial | Delete code |
| Quick CTA + clickable days | Low | UI components, simple nav |
| Auto-push sync | Medium | Straightforward for 'assigned' |
| Merge for 'ongoing' | **High** | Must preserve athlete-logged data |
| Race conditions | **High** | Athlete saving while coach pushes |

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss (athlete work) | **Critical** | Never delete completed sets/exercises |
| Race condition on save | High | Use optimistic locking or queue |
| Edit date conflicts | Medium | Warn if dates affect workouts |
| Performance (many athletes) | Medium | Batch operations |

---

# Files to Modify

## Part A - Sync

| File | Changes |
|------|---------|
| `actions/plans/session-planner-actions.ts` | Add sync trigger after save |
| `actions/workout/workout-sync-actions.ts` | **NEW** - Sync server actions |
| `components/features/training/views/WorkoutView.tsx` | Add three-dot menu |
| `types/database.ts` | Add `synced_at` column type |
| Supabase migration | Add `synced_at` to `workout_logs` |

## Part B - UX

| File | Changes |
|------|---------|
| `IndividualWorkspace.tsx` | Enable buttons, add dialogs |
| `PlansHomeClient.tsx` | Remove disabled items, router refresh |
| `IndividualPlansHomeClient.tsx` | CTA, clickable days, filter |
| `TrainingPlanWorkspace.tsx` | Tooltips, swipe indicator |
| **NEW** `EditBlockDialog.tsx` | Edit form component |
| **NEW** `AddWorkoutDialog.tsx` | Add form component |
| **NEW** `TodayWorkoutCTA.tsx` | Quick action component |

---

# Decision Points for Product Owner

## Sync Decisions

1. **Auto-push behavior**: Should coach get notification/confirmation when changes will push to N athletes?

2. **Athlete notification**: Should athletes get notified when coach updates their assigned (not started) workout?

3. **Completed workout sync**: Should we allow re-sync for completed workouts? (Currently: No)

4. **Granular sync**: Should athletes be able to choose which changes to accept? (Currently: All or nothing)

## UX Decisions

5. **Edit Block scope**: Should editing dates affect existing workouts? Warn only or prevent?

6. **Add Workout location**: Should "Add Workout" be in week card only or also FAB?

7. **Disabled features**: Hide completely vs show with "Coming Soon" label?

8. **Section consolidation**: Merge "Active Training" + "This Week" or keep separate?

---

# Estimates Summary

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Individual Functionality | 6-8h | P0 |
| Phase 2: Friction Reduction | 4-6h | P1 |
| Phase 3: Sync MVP | 5-7h | P1 |
| Phase 4: Polish | 5-8h | P2-P3 |
| Phase 5: Advanced Sync | 8-10h | P2 |
| **Total** | **28-39 hours** | |

---

# Conclusion

This combined spec addresses both **functional gaps** (sync, individual editing) and **UX friction** (disabled features, missing CTAs).

**Recommendation**:
1. **Start with Phase 1** - unblocks individual users immediately
2. **Phase 2 + 3 in parallel** - quick UX wins + sync MVP
3. **Phase 4 + 5 as time permits** - polish and advanced sync

**Total Effort**: 28-39 hours across all phases.
