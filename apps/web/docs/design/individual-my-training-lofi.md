# Individual User - "My Training" Lo-Fi Design

> **Status**: Draft - Awaiting Review
> **Created**: 2026-01-04
> **Related**: [Individual User Role Design](../features/individual-user-role-design.md)
> **Purpose**: Lo-Fi wireframes for the individual user's training plan experience

---

## Overview

This document provides **Lo-Fi wireframes** for the simplified "My Training" experience for individual users (self-coached athletes, gym-goers, recreational trainers).

### Design Goals

1. **Reduce cognitive load** - Remove coach-only complexity
2. **Flatten hierarchy** - 2-level vs 3-level (hide Macrocycle)
3. **Focus on execution** - "What's my workout today?" should be instant
4. **Use familiar terminology** - "Training Block" instead of "Mesocycle"
5. **Enable quick start** - Under 60 seconds to first workout

### Terminology Mapping

| Coach Term | Individual Term | Database Table |
|------------|-----------------|----------------|
| Macrocycle | *(hidden)* | macrocycles |
| Mesocycle | **Training Block** | mesocycles |
| Microcycle | **Week** | microcycles |
| Session Plan | **Workout** | session_plans |

---

## 1. My Training - Home Page (List View)

### 1.1 Desktop View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │                      MY TRAINING                                    │
│           │─────────────────────────────────────────────────────────────────────│
│  Dashboard│                                                                     │
│  Workout  │  ┌─────────────────────────────────────────────────────────────────┐│
│ >Training │  │  [+ New Training Block]        [Browse Templates]   [Filter ▼]  ││
│  Library  │  └─────────────────────────────────────────────────────────────────┘│
│  Knowledge│                                                                     │
│  Perform. │  ACTIVE BLOCK                                                       │
│  Settings │  ┌─────────────────────────────────────────────────────────────────┐│
│           │  │  ┌──────────┐                                                   ││
│           │  │  │ ▓▓▓▓▓░░░ │  Strength Foundation                              ││
│           │  │  │  Week 2  │  4-week block • Strength focus                    ││
│           │  │  │  of 4    │                                                   ││
│           │  │  └──────────┘  Progress: ████████████░░░░░░░░░░░░  50%          ││
│           │  │                                                                  ││
│           │  │  This Week:  Mon ✓  Tue ✓  Wed •  Thu   Fri   Sat   Sun         ││
│           │  │              ─────  ─────  Today ─────  ─────  Rest  Rest        ││
│           │  │                                                                  ││
│           │  │  [Continue Training →]                         [Edit Block]      ││
│           │  └─────────────────────────────────────────────────────────────────┘│
│           │                                                                     │
│           │  COMPLETED BLOCKS                                                   │
│           │  ┌─────────────────────────────────────────────────────────────────┐│
│           │  │  Hypertrophy Phase           4 weeks • Dec 2025      [View]     ││
│           │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░  Completed                          ││
│           │  └─────────────────────────────────────────────────────────────────┘│
│           │  ┌─────────────────────────────────────────────────────────────────┐│
│           │  │  Base Building               6 weeks • Nov 2025      [View]     ││
│           │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░  Completed                          ││
│           │  └─────────────────────────────────────────────────────────────────┘│
│           │                                                                     │
└───────────┴─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mobile View

```
┌─────────────────────────────────┐
│ ☰  MY TRAINING              [+] │
├─────────────────────────────────┤
│                                 │
│  ACTIVE BLOCK                   │
│  ┌───────────────────────────┐  │
│  │  Strength Foundation      │  │
│  │  Week 2 of 4              │  │
│  │                           │  │
│  │  ████████████░░░░░  50%   │  │
│  │                           │  │
│  │  Today: Upper Body        │  │
│  │  6 exercises • ~45 min    │  │
│  │                           │  │
│  │  [Start Workout]          │  │
│  └───────────────────────────┘  │
│                                 │
│  THIS WEEK                      │
│  ┌───┬───┬───┬───┬───┬───┬───┐  │
│  │ M │ T │ W │ T │ F │ S │ S │  │
│  │ ✓ │ ✓ │ • │   │   │ - │ - │  │
│  └───┴───┴───┴───┴───┴───┴───┘  │
│                                 │
│  PAST BLOCKS                    │
│  ┌───────────────────────────┐  │
│  │  Hypertrophy Phase    [>] │  │
│  │  4 weeks • Dec 2025       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 1.3 Empty State (No Training Block)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MY TRAINING                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                        ┌─────────────────────┐                                  │
│                        │                     │                                  │
│                        │     🎯              │                                  │
│                        │                     │                                  │
│                        │   No Training       │                                  │
│                        │   Block Yet         │                                  │
│                        │                     │                                  │
│                        └─────────────────────┘                                  │
│                                                                                 │
│                 Start your fitness journey with a training block.               │
│                 Choose a template or create your own from scratch.              │
│                                                                                 │
│                        ┌─────────────────────┐                                  │
│                        │  [+ Create Block]   │                                  │
│                        └─────────────────────┘                                  │
│                                                                                 │
│                        ┌─────────────────────┐                                  │
│                        │  [Browse Templates] │                                  │
│                        └─────────────────────┘                                  │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  POPULAR TEMPLATES                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │
│  │ 🏋️ 5x5        │  │ 💪 PPL Split   │  │ 🏃 Couch to 5K │                     │
│  │ Strength      │  │ Hypertrophy    │  │ Running        │                     │
│  │ 4 weeks       │  │ 6 weeks        │  │ 8 weeks        │                     │
│  │               │  │                │  │                │                     │
│  │ [Use This]    │  │ [Use This]     │  │ [Use This]     │                     │
│  └────────────────┘  └────────────────┘  └────────────────┘                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start Wizard (Simplified)

### Comparison: Coach vs Individual Wizard

| Coach (Current) | Individual (Proposed) |
|-----------------|----------------------|
| 4 steps | **2 steps** |
| Type Selection (Macro/Meso/Micro) | *(Skip - always Training Block)* |
| Configuration + Parent Selection | **Step 1: Block Setup** |
| Session Planning (complex) | **Step 2: Week Template** |
| Review | *(Skip - show block immediately)* |

### 2.1 Step 1: Block Setup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│     CREATE TRAINING BLOCK                                    Step 1 of 2       │
│     ════════════════════════════════════════════════════════════════════       │
│                                                                                 │
│     What's your focus?                                                          │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │  ○ 🏋️  Build Strength        ○ 💪  Build Muscle                    │    │
│     │  ○ 🔥  Lose Fat              ○ 🏃  Improve Cardio                   │    │
│     │  ○ ⚡  General Fitness        ○ 🎯  Sport-Specific                  │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│     Block Name (optional)                                                       │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │  Strength Phase 1                                                   │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│     Auto-generated: "Strength Block - Jan 2026"                                 │
│                                                                                 │
│     Duration                                                                    │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│     │ 3 weeks │  │ 4 weeks │  │ 6 weeks │  │ 8 weeks │                         │
│     │         │  │    ✓    │  │         │  │         │                         │
│     └─────────┘  └─────────┘  └─────────┘  └─────────┘                         │
│                                                                                 │
│     Start Date                                                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │  📅  Monday, January 6, 2026  (This Monday)                    [▼] │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│                              [Cancel]    [Next: Set Up Week →]                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Step 2: Week Template

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│     CREATE TRAINING BLOCK                                    Step 2 of 2       │
│     ════════════════════════════════════════════════════════════════════       │
│                                                                                 │
│     Plan your typical week                                                      │
│     This template will repeat for all 4 weeks (you can customize later)         │
│                                                                                 │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │  MONDAY        [+ Add Workout]                                      │    │
│     │  ┌───────────────────────────────────────────────────────────────┐ │    │
│     │  │  Upper Body                                        [Edit] [X] │ │    │
│     │  │  Bench Press, Rows, OHP, Curls, Triceps • ~45 min             │ │    │
│     │  └───────────────────────────────────────────────────────────────┘ │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  TUESDAY       [+ Add Workout]                                      │    │
│     │  ┌───────────────────────────────────────────────────────────────┐ │    │
│     │  │  Lower Body                                        [Edit] [X] │ │    │
│     │  │  Squats, RDL, Leg Press, Leg Curl • ~50 min                   │ │    │
│     │  └───────────────────────────────────────────────────────────────┘ │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  WEDNESDAY     REST DAY                                [+ Add]     │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  THURSDAY      [+ Add Workout]                                      │    │
│     │  ┌───────────────────────────────────────────────────────────────┐ │    │
│     │  │  Upper Body                                        [Edit] [X] │ │    │
│     │  │  Bench Press, Rows, OHP, Curls, Triceps • ~45 min             │ │    │
│     │  └───────────────────────────────────────────────────────────────┘ │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  FRIDAY        [+ Add Workout]                                      │    │
│     │  ┌───────────────────────────────────────────────────────────────┐ │    │
│     │  │  Lower Body                                        [Edit] [X] │ │    │
│     │  │  Squats, RDL, Leg Press, Leg Curl • ~50 min                   │ │    │
│     │  └───────────────────────────────────────────────────────────────┘ │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  SATURDAY      REST DAY                                [+ Add]     │    │
│     ├─────────────────────────────────────────────────────────────────────┤    │
│     │  SUNDAY        REST DAY                                [+ Add]     │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │  💡 Quick Setup: [Upper/Lower Split] [PPL] [Full Body 3x] [Custom] │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                         [← Back]    [Create Training Block]                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Quick Add Workout Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│     ┌───────────────────────────────────────────────────────────────────────┐  │
│     │                        ADD WORKOUT                               [X] │  │
│     │ ──────────────────────────────────────────────────────────────────── │  │
│     │                                                                       │  │
│     │  Workout Name                                                         │  │
│     │  ┌───────────────────────────────────────────────────────────────┐   │  │
│     │  │  Upper Body                                                   │   │  │
│     │  └───────────────────────────────────────────────────────────────┘   │  │
│     │                                                                       │  │
│     │  Start from:                                                          │  │
│     │                                                                       │  │
│     │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│     │  │ 📋 Template  │  │ ⏱️ Previous  │  │ ✏️ Blank    │                │  │
│     │  │    Library   │  │    Workout   │  │   Start     │                │  │
│     │  │      ✓       │  │              │  │             │                │  │
│     │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│     │                                                                       │  │
│     │  SUGGESTED TEMPLATES                                                  │  │
│     │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│     │  │  ○ Upper Body - Push Focus                                     │ │  │
│     │  │    Bench, OHP, Incline, Triceps • 6 exercises                  │ │  │
│     │  ├─────────────────────────────────────────────────────────────────┤ │  │
│     │  │  ● Upper Body - Balanced                                       │ │  │
│     │  │    Bench, Rows, OHP, Curls, Triceps • 5 exercises              │ │  │
│     │  ├─────────────────────────────────────────────────────────────────┤ │  │
│     │  │  ○ Upper Body - Pull Focus                                     │ │  │
│     │  │    Rows, Pull-ups, Face Pulls, Curls • 6 exercises             │ │  │
│     │  └─────────────────────────────────────────────────────────────────┘ │  │
│     │                                                                       │  │
│     │                           [Cancel]    [Add Workout]                   │  │
│     │                                                                       │  │
│     └───────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Training Block Workspace (Simplified)

### 3.1 Desktop - Two-Panel Layout (vs Coach's Three-Panel)

**Key Difference**: No Mesocycle timeline panel (left panel removed)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Training    STRENGTH FOUNDATION              Week 2 of 4   [···]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────────────┐│
│  │  WEEKS                          │  │  WEEK 2 • Jan 13-19                   ││
│  │                                 │  │                                       ││
│  │  ┌───────────────────────────┐  │  │  ┌─────────────────────────────────┐ ││
│  │  │  Week 1 • Jan 6-12        │  │  │  │  MONDAY                         │ ││
│  │  │  ✓ 4/4 workouts           │  │  │  │  ┌───────────────────────────┐ │ ││
│  │  │  ██████████████████████   │  │  │  │  │ Upper Body          [→]  │ │ ││
│  │  └───────────────────────────┘  │  │  │  │ 6 exercises • 45 min     │ │ ││
│  │                                 │  │  │  │ Status: ✓ Completed      │ │ ││
│  │  ┌───────────────────────────┐  │  │  │  └───────────────────────────┘ │ ││
│  │  │  Week 2 • Jan 13-19  ●    │  │  │  └─────────────────────────────────┘ ││
│  │  │  ◐ 2/4 workouts           │  │  │                                       ││
│  │  │  █████████░░░░░░░░░░░░░   │  │  │  ┌─────────────────────────────────┐ ││
│  │  └───────────────────────────┘  │  │  │  TUESDAY                        │ ││
│  │                                 │  │  │  ┌───────────────────────────┐ │ ││
│  │  ┌───────────────────────────┐  │  │  │  │ Lower Body          [→]  │ │ ││
│  │  │  Week 3 • Jan 20-26       │  │  │  │  │ 5 exercises • 50 min     │ │ ││
│  │  │  ○ Not started            │  │  │  │  │ Status: ✓ Completed      │ │ ││
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░   │  │  │  │  └───────────────────────────┘ │ ││
│  │  └───────────────────────────┘  │  │  │  └─────────────────────────────────┘ ││
│  │                                 │  │  │                                       ││
│  │  ┌───────────────────────────┐  │  │  │  ┌─────────────────────────────────┐ ││
│  │  │  Week 4 • Jan 27-Feb 2    │  │  │  │  │  WEDNESDAY                      │ ││
│  │  │  ○ Not started            │  │  │  │  │  ┌───────────────────────────┐ │ ││
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░   │  │  │  │  │  │ Upper Body          [→]  │ │ ││
│  │  └───────────────────────────┘  │  │  │  │  │ 6 exercises • 45 min     │ │ ││
│  │                                 │  │  │  │  │ Status: • Today          │ │ ││
│  │  ───────────────────────────    │  │  │  │  └───────────────────────────┘ │ ││
│  │                                 │  │  │  └─────────────────────────────────┘ ││
│  │  Progress This Block            │  │  │                                       ││
│  │  ████████████░░░░░░░░  50%      │  │  │  THURSDAY - SUNDAY (scroll)           ││
│  │                                 │  │  │  ...                                  ││
│  │  [Edit Block Settings]          │  │  │                                       ││
│  │                                 │  │  │  [+ Add Workout to Week]              ││
│  └─────────────────────────────────┘  └───────────────────────────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile - Slide Navigation

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ ←  STRENGTH FOUNDATION    [···] │       │ ← Back   WEEK 2           [···] │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│                                 │       │                                 │
│  Week 2 of 4                    │       │  Jan 13-19 • 2/4 Complete       │
│  ████████████░░░░░░░░  50%      │       │                                 │
│                                 │       │  MONDAY                         │
│  ┌───────────────────────────┐  │  ───► │  ┌───────────────────────────┐  │
│  │  Week 1               ✓   │  │       │  │  Upper Body          ✓   │  │
│  │  Jan 6-12 • Completed     │  │       │  │  6 exercises • 45 min    │  │
│  └───────────────────────────┘  │       │  └───────────────────────────┘  │
│                                 │       │                                 │
│  ┌───────────────────────────┐  │       │  TUESDAY                        │
│  │  Week 2               ●   │  │       │  ┌───────────────────────────┐  │
│  │  Jan 13-19 • In Progress  │  │       │  │  Lower Body          ✓   │  │
│  │  2/4 workouts done        │  │       │  │  5 exercises • 50 min    │  │
│  └───────────────────────────┘  │       │  └───────────────────────────┘  │
│                                 │       │                                 │
│  ┌───────────────────────────┐  │       │  WEDNESDAY                      │
│  │  Week 3                   │  │       │  ┌───────────────────────────┐  │
│  │  Jan 20-26 • Upcoming     │  │       │  │  Upper Body          •   │  │
│  └───────────────────────────┘  │       │  │  Today's Workout          │  │
│                                 │       │  │  [Start Workout →]        │  │
│  ┌───────────────────────────┐  │       │  └───────────────────────────┘  │
│  │  Week 4                   │  │       │                                 │
│  │  Jan 27-Feb 2 • Upcoming  │  │       │  THURSDAY                       │
│  └───────────────────────────┘  │       │  ┌───────────────────────────┐  │
│                                 │       │  │  Lower Body              │  │
│                                 │       │  │  5 exercises • 50 min    │  │
│  [Edit Block]                   │       │  └───────────────────────────┘  │
│                                 │       │                                 │
└─────────────────────────────────┘       └─────────────────────────────────┘
       SLIDE 1: Weeks                            SLIDE 2: Week Detail
```

---

## 4. Workout Editor (Simplified Session Editor)

### 4.1 Desktop View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Week 2       UPPER BODY                          [Save]  [···]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Wednesday, January 15 • Estimated: 45 min                                      │
│                                                                                 │
│  EXERCISES                                                      [+ Add Exercise]│
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  1. BENCH PRESS                                               [≡] [Edit] [X]   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Set 1    Set 2    Set 3    Set 4    [+ Set]                            │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                                     │   │
│  │  │ 8   │  │ 8   │  │ 8   │  │ 8   │   Reps                              │   │
│  │  │ 80kg│  │ 80kg│  │ 85kg│  │ 85kg│   Weight                            │   │
│  │  │ @7  │  │ @7  │  │ @8  │  │ @8  │   RPE                               │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘                                     │   │
│  │  Rest: 2:30 between sets                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  2. BARBELL ROW                                               [≡] [Edit] [X]   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Set 1    Set 2    Set 3    [+ Set]                                     │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐                                              │   │
│  │  │ 10  │  │ 10  │  │ 10  │   Reps                                       │   │
│  │  │ 70kg│  │ 70kg│  │ 75kg│   Weight                                     │   │
│  │  └─────┘  └─────┘  └─────┘                                              │   │
│  │  Rest: 2:00 between sets                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  3. OVERHEAD PRESS                                            [≡] [Edit] [X]   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Set 1    Set 2    Set 3    [+ Set]                                     │   │
│  │  ...                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  4. DUMBBELL CURLS                                            [≡] [Edit] [X]   │
│  5. TRICEP PUSHDOWNS                                          [≡] [Edit] [X]   │
│  6. LATERAL RAISES                                            [≡] [Edit] [X]   │
│                                                                                 │
│  ───────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  Notes (optional)                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Focus on controlled negatives for bench press                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                             [Save as Template]    [Discard Changes]   [Save]   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Exercise Quick Add

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                     ADD EXERCISE                                     [X] │ │
│  │ ───────────────────────────────────────────────────────────────────────── │ │
│  │                                                                           │ │
│  │  Search                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🔍  bench press                                                    │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                           │ │
│  │  Filter: [All] [Chest] [Back] [Shoulders] [Arms] [Legs] [Core]           │ │
│  │                                                                           │ │
│  │  RESULTS                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ● Barbell Bench Press                                    [+ Add]  │ │ │
│  │  │    Chest • Compound • Barbell                                      │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  ○ Incline Bench Press                                    [+ Add]  │ │ │
│  │  │    Chest • Compound • Barbell                                      │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  ○ Dumbbell Bench Press                                   [+ Add]  │ │ │
│  │  │    Chest • Compound • Dumbbell                                     │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  ○ Close-Grip Bench Press                                 [+ Add]  │ │ │
│  │  │    Triceps • Compound • Barbell                                    │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                           │ │
│  │  RECENTLY USED                                                            │ │
│  │  [Bench Press] [Squat] [Deadlift] [OHP] [Rows]                           │ │
│  │                                                                           │ │
│  │                                                    [Done Adding]         │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Side-by-Side Comparison: Coach vs Individual

### 5.1 Home Page Comparison

```
COACH VIEW (Current)                      INDIVIDUAL VIEW (Proposed)
═══════════════════════════════          ══════════════════════════════════════

┌─────────────────────────────┐          ┌─────────────────────────────────────┐
│  TRAINING PLANS             │          │  MY TRAINING                        │
│                             │          │                                     │
│  Filter: [All Groups ▼]     │          │  (No group filter needed)           │
│  State: [All ▼]             │          │  (Only own plans)                   │
│                             │          │                                     │
│  [+ New Plan]               │          │  [+ New Training Block]             │
│                             │          │                                     │
│  ┌─────────────────────┐    │          │  ACTIVE BLOCK                       │
│  │ Macrocycle Card     │    │          │  ┌─────────────────────────────────┐│
│  │ Sprint Squad - GPP  │    │          │  │ Training Block Card (simpler)   ││
│  │ 16 weeks            │    │          │  │ Strength Foundation             ││
│  │ Athletes: 12        │    │          │  │ Week 2 of 4                     ││
│  │ [Assign] [Edit]     │    │          │  │ Today: Upper Body               ││
│  └─────────────────────┘    │          │  │ [Continue Training →]           ││
│                             │          │  └─────────────────────────────────┘│
│  ┌─────────────────────┐    │          │                                     │
│  │ Macrocycle Card     │    │          │  COMPLETED BLOCKS                   │
│  │ Youth Group - Base  │    │          │  (Collapsed list)                   │
│  └─────────────────────┘    │          │                                     │
│                             │          │                                     │
│  Complex timeline charts    │          │  Simple progress bars               │
│  Multiple group management  │          │  Single user focus                  │
│                             │          │                                     │
└─────────────────────────────┘          └─────────────────────────────────────┘
```

### 5.2 Workspace Comparison

```
COACH WORKSPACE (3 Columns)              INDIVIDUAL WORKSPACE (2 Columns)
═══════════════════════════════          ══════════════════════════════════════

┌─────┬─────────┬─────────────┐          ┌─────────────┬───────────────────────┐
│Meso │ Micro   │ Sessions    │          │  Weeks      │  Week Detail          │
│List │ Grid    │             │          │             │                       │
│     │         │             │          │             │                       │
│Phase│ Week 1  │ Mon: Sprint │          │  Week 1 ✓   │  Mon: Upper Body ✓    │
│GPP  │ Week 2  │ Tue: Tempo  │          │  Week 2 ●   │  Tue: Lower Body ✓    │
│     │ Week 3  │ Wed: Weights│          │  Week 3     │  Wed: Upper Body •    │
│Phase│ Week 4  │ Thu: Recovery│         │  Week 4     │  Thu: Lower Body      │
│SPP  │         │ Fri: Speed  │          │             │  Fri: Rest            │
│     │         │             │          │             │                       │
│Phase│ Volume/ │ [Edit]      │          │  Progress   │  [Start Workout]      │
│Taper│ Charts  │ [Copy]      │          │  ████ 50%   │                       │
│     │         │ [Assign]    │          │             │                       │
└─────┴─────────┴─────────────┘          └─────────────┴───────────────────────┘

• 3-level hierarchy visible             • 2-level hierarchy (Week → Workout)
• Athlete assignment options            • No assignment (it's YOUR plan)
• Complex phase management              • Simple week list
• Multiple mesocycles                   • One active block at a time
```

---

## 6. Component Reuse Strategy

### 6.1 Reusable Components (No Changes)

| Component | Coach | Individual | Notes |
|-----------|-------|------------|-------|
| Exercise Library Modal | ✓ | ✓ | Same exercise database |
| Set Configuration | ✓ | ✓ | Same set editor |
| Exercise Card | ✓ | ✓ | Same display |
| Workout Notes | ✓ | ✓ | Same notes field |
| Volume/Intensity Charts | ✓ | ✓ | Same calculations |

### 6.2 Modified Components

| Component | Modification for Individual |
|-----------|----------------------------|
| PlansHome | Different card layout, no group filter |
| MesoWizard | Simplified 2-step version |
| TrainingPlanWorkspace | 2-column layout, no mesocycle list |
| PlanCard | Simpler "Training Block" card |

### 6.3 New Components (Individual Only)

| Component | Purpose |
|-----------|---------|
| `TrainingBlockCard.tsx` | Simplified block card |
| `IndividualWorkspace.tsx` | 2-panel workspace |
| `QuickStartWizard.tsx` | 2-step block creation |
| `WeekView.tsx` | Week-focused layout |

---

## 7. Implementation Phases

### Phase 1: Core (MVP)
- [ ] Role detection in plans page
- [ ] Terminology mapping (`lib/terminology.ts`)
- [ ] Hide group selector for individuals
- [ ] Simplified plan card

### Phase 2: Simplified Workspace
- [ ] 2-column layout for individuals
- [ ] Hide macrocycle level
- [ ] Simplified week navigation

### Phase 3: Quick Start Wizard
- [ ] 2-step wizard for individuals
- [ ] Template selection integration
- [ ] Quick workout setup

### Phase 4: Polish
- [ ] Empty state with templates
- [ ] Mobile optimizations
- [ ] Progress tracking improvements

---

## 8. Open Questions

1. **Template Library**: Should individuals have access to coach-created templates? Or separate "Individual Templates"?

2. **Progressive Overload**: Should the system auto-suggest weight increases week-to-week?

3. **AI Integration**: "Ask AI to modify my plan" - how prominent should this be?

4. **Block History**: How long to keep completed Training Blocks visible?

5. **Sharing**: Can individuals share their Training Blocks as templates?

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first workout | < 60 seconds (with template) |
| Wizard completion rate | > 80% |
| Weekly active usage | Retention > 60% |
| Support tickets about complexity | < 5% of users |

---

*Document created: 2026-01-04*
*Status: Awaiting Review*
