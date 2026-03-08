# User Stories & Workflows

## Story 1: Basic Browse (No AI)

```
AS an individual user
I WANT to browse my training plan
SO THAT I can see what workouts are coming up

FLOW:
1. User lands on /plans/24
2. Current week is auto-selected (highlighted)
3. Today's workout is auto-selected
4. User sees exercises for today
5. User can click other days to preview
6. User can click other weeks to navigate

NO AI INVOLVED - just viewing
```

## Story 2: Simple Edit - Change One Session

```
AS an individual user
I WANT to modify Monday's workout
SO THAT I can customize it for my needs

FLOW:
1. User is viewing Week 2, Monday selected
2. User opens AI drawer (click ✨ or swipe)
3. User types: "Replace bench press with dumbbell press"

AI ACTIONS:
4. AI reads current context: Week 2 → Monday → sees Bench Press
5. AI proposes: DELETE bench press, ADD dumbbell bench press

UI RESPONSE:
6. Inline proposal appears ABOVE the exercise list:
   ┌─────────────────────────────────────────────┐
   │ 🤖 1 change | -1, +1         [Change] [Apply]│
   └─────────────────────────────────────────────┘

7. The exercise list shows visual diff:
   ┌─────────────────────────────────────────────┐
   │ 1. ❌ Bench Press        3×10 @ 60kg  (red) │
   │    ✅ DB Bench Press     3×10 @ 60kg  (green)│
   │ 2. Incline DB Press     3×12 @ 20kg         │
   └─────────────────────────────────────────────┘

8. User clicks [Apply] → changes committed
9. Success flash, UI updates
```

## Story 3: Cross-Session - Change Another Session

```
AS an individual user viewing Monday's workout
I WANT to add exercises to Wednesday
SO THAT I don't have to navigate away

FLOW:
1. User is viewing Week 2 → Monday
2. User types: "Add pull-ups to Wednesday"

AI BEHAVIOR:
3. AI recognizes "Wednesday" refers to a different session
4. AI finds Wednesday's session in Week 2
5. AI proposes adding pull-ups to Wednesday

UI RESPONSE:
6. Context indicator + expandable preview:
   ┌─────────────────────────────────────────────┐
   │ 🤖 Wednesday: Pull Day                      │
   │    ▼ +1 exercise              [Change] [Apply]│
   │ ┌─────────────────────────────────────────┐ │
   │ │ Preview:                                 │ │
   │ │ ...existing exercises...                 │ │
   │ │ ✅ Pull-ups  3×10           (new)       │ │
   │ └─────────────────────────────────────────┘ │
   └─────────────────────────────────────────────┘
```

## Story 4: Multi-Session - Week Level Change

```
AS an individual user
I WANT to add core work to every workout this week
SO THAT I improve my core strength consistently

FLOW:
1. User is viewing Week 2 (any day)
2. User types: "Add planks to every workout this week"

AI BEHAVIOR:
3. AI identifies all sessions in Week 2: [Monday, Wednesday, Friday]
4. AI proposes adding "Plank" to each session

UI RESPONSE - GROUPED PROPOSAL:
   ┌─────────────────────────────────────────────────┐
   │ 🤖 3 sessions affected | +3 exercises total     │
   │                                   [Change] [Apply]│
   │ ─────────────────────────────────────────────── │
   │ ▶ Monday: Push Day                    +1        │
   │ ▶ Wednesday: Pull Day                 +1        │
   │ ▶ Friday: Legs                        +1        │
   └─────────────────────────────────────────────────┘

   (Click ▶ to expand and see the specific exercise)
```

## Story 5: Week Level - Schedule/Fatigue Change

```
AS an individual user
I WANT to make Week 4 a deload week
SO THAT I can recover before Week 5

FLOW:
1. User selects Week 4
2. User types: "Make this a deload week - reduce volume by 40%"

AI BEHAVIOR:
3. AI reads all sessions in Week 4
4. AI calculates 40% reduction for each exercise
5. AI proposes updates to sets/reps across all exercises

UI RESPONSE:
   ┌─────────────────────────────────────────────────┐
   │ 🤖 Week 4 → Deload Week                         │
   │    12 updates across 3 sessions  [Change] [Apply]│
   │ ─────────────────────────────────────────────── │
   │ Summary: -40% volume                            │
   │ ─────────────────────────────────────────────── │
   │ ▶ Monday: Push Day (4 updates)                  │
   │   ├─ Bench Press: 3×10 → 2×6                    │
   │   ├─ Incline Press: 3×12 → 2×8                  │
   │   └─ ...                                        │
   │ ▶ Wednesday: Pull Day (4 updates)               │
   │ ▶ Friday: Legs (4 updates)                      │
   └─────────────────────────────────────────────────┘
```

## Story 6: Block-Wide Changes (Chat Summary)

```
AS an individual user
I WANT to replace all barbell exercises with dumbbell versions
SO THAT I can train at home without a barbell

FLOW:
1. User is viewing any context
2. User types: "Replace all barbell exercises with dumbbell alternatives"

AI BEHAVIOR:
3. AI scans entire block for barbell exercises
4. AI finds matches across multiple weeks
5. AI provides TEXT SUMMARY in chat (not visual diff)

CHAT RESPONSE:
   ┌─────────────────────────────────────────────────┐
   │ 🤖 I'll replace 12 barbell exercises across     │
   │    your training block with dumbbell alternatives│
   │                                                  │
   │    Summary of changes:                          │
   │    • Week 1: 4 swaps (Bench → DB Bench, etc.)   │
   │    • Week 2: 4 swaps (same exercises)           │
   │    • Week 3: 4 swaps                            │
   │    • Week 4 (Deload): 0 changes                 │
   │                                                  │
   │    This keeps your program structure identical.  │
   │                                                  │
   │    ┌────────────────────────────────────────┐   │
   │    │      [Looks Good]  [Make Changes]      │   │
   │    └────────────────────────────────────────┘   │
   │                                                  │
   │    💬 Or type to modify before approving        │
   └─────────────────────────────────────────────────┘
```

## Story 7: Exercise-Level - Set Changes

```
AS an individual user
I WANT to modify sets for a specific exercise
SO THAT I can fine-tune my training

FLOW:
1. User expands "Bench Press" in the exercise list
2. User types: "Add a warm-up set at 50% and increase working sets to 4"

AI BEHAVIOR:
3. AI reads current sets: [Set 1: 10×60kg, Set 2: 8×70kg]
4. AI proposes: Add warm-up (10×30kg), add working sets

UI RESPONSE:
   Sets view with inline diff:
   ┌─────────────────────────────────────────────────┐
   │ ✅ S1 (warm-up): 10 × 30kg            (new)    │
   │ 📝 S2: 10 × 60kg                    (unchanged)│
   │ 📝 S3: 8 × 70kg                     (unchanged)│
   │ ✅ S4: 8 × 70kg                        (new)   │
   │ ✅ S5: 6 × 75kg                        (new)   │
   └─────────────────────────────────────────────────┘
```

## Story 8: Toggle Advanced Fields

```
AS an individual user
I WANT to show/hide advanced training fields
SO THAT I can see more detail when needed without clutter

FLOW (Marcus - Power User):
1. User sees default view: reps, weight, rest for each set
2. User clicks "Show Advanced" toggle in plan header
3. All exercises now show additional fields: RPE, tempo, velocity (where applicable)

┌─────────────────────────────────────────────────────────────────────────┐
│  8-Week Strength Program                    [Show Advanced ○] [AI ✨]   │
├─────────────────────────────────────────────────────────────────────────┤
│  Bench Press                                                            │
│  ○ 1  │ [10x] │ [60kg] │ [90s rest] │                             [✓]  │
│  ○ 2  │ [8x]  │ [70kg] │ [90s rest] │                             [✓]  │
└─────────────────────────────────────────────────────────────────────────┘

4. User toggles "Show Advanced" ON:

┌─────────────────────────────────────────────────────────────────────────┐
│  8-Week Strength Program                    [Show Advanced ●] [AI ✨]   │
├─────────────────────────────────────────────────────────────────────────┤
│  Bench Press                                                            │
│  ○ 1  │ [10x] │ [60kg] │ [RPE 7] │ [3-1-2-0] │ [90s rest] │       [✓]  │
│  ○ 2  │ [8x]  │ [70kg] │ [RPE 8] │ [3-1-2-0] │ [90s rest] │       [✓]  │
└─────────────────────────────────────────────────────────────────────────┘

NOTES:
- Toggle persists across sessions (localStorage)
- Advanced fields: RPE, tempo, velocity, power (exercise-type dependent)
- Default fields always visible: reps, weight/duration, rest
- Mobile: horizontal scroll when advanced fields enabled
```

---

## Edge Cases

### User Switches Context Mid-Proposal

```
SCENARIO:
1. User viewing Week 1, asks "Add squats"
2. AI proposes adding squats to Week 1
3. User clicks Week 2 BEFORE approving

SOLUTION: Proposal persists, shows context indicator
┌─────────────────────────────────────────────────────────────────┐
│ You're viewing: Week 2                                          │
│ ─────────────────────────────────────────────────────────────── │
│ 🤖 Pending changes for: Week 1                                  │
│    +1 exercise                            [Change] [Apply]      │
│    [Jump to Week 1]                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Conflicting Changes

```
SCENARIO:
1. User asks "Add bench press to Monday"
2. AI proposes it
3. User (without approving) asks "Replace all chest with back exercises"

SOLUTION: AI recognizes overlap, asks for clarification
"You have a pending proposal to add bench press. Should I:
 A) Apply that first, then replace chest exercises
 B) Cancel the pending proposal and just do the replacement
 C) Let me clarify what you want"
```
