# Workout UI/UX Design Proposal

> **Feature**: 004 - Feature Pattern Standardization
> **Status**: In Development - Demo at `/demo/workout-ui`
> **Last Updated**: 2025-12-25

---

## Implementation Status

### Demo Available
- **URL**: `/demo/workout-ui`
- **Component**: `components/features/workout/demo/WorkoutUIDemo.tsx`

### Completed UI/UX Improvements (2025-12-25)

Based on world-class 2025 fitness app design patterns (Strong, Hevy, Nike Training Club):

1. **Removed "Complete All" button** - Users tap the set number circle to toggle completion (fewer taps)
2. **Removed VBT/exercise type tags** - Cleaner, distraction-free interface
3. **Horizontal set input layout** - Single row with all metrics in pill notation
4. **Tappable set circles** - Tap to toggle completion (checkmark when done)
5. **Scrollable input row** - Hidden scrollbar for clean horizontal swipe
6. **Unified layout for all states** - No UI shift between pending/active/completed
7. **Inline editable inputs** - Click any value to edit directly
8. **Conditional field display** - Only show fields that plan prescribes (including RPE)
9. **Unified desktop/tablet/phone layout** - Single column for all devices
10. **Coach view uses pill notation** - Same style as athlete, units always visible
11. **Larger SetRow touch targets** - Increased height and font for better touch interaction
12. **Compact exercise header** - Smaller header to dedicate more space to sets
13. **Drag-and-drop reordering** - Sets and exercises are reorderable in coach mode

### Design Principles Applied
- **Fewer taps = better**: Limit workout tracking to 3 steps max
- **One action per screen**: Focus on the current set being logged
- **Distraction-free**: No pop-ups, minimal nav during workout
- **Touch-friendly**: 24-40px tappable areas for gym use
- **No UI shift**: Same layout for all states prevents jarring changes
- **Data-driven fields**: Only show metrics the plan includes
- **Consistent notation**: Coach and athlete use same pill style with units

---

## Current State Analysis

### Three Implementations Identified

| Page | Purpose | Exercise Type | Data Source |
|------|---------|---------------|-------------|
| `/workout` | Athlete execution | `WorkoutExercise` | Real-time training sessions |
| `/plans/[id]/session/[sessionId]` | Coach planning | `SessionExercise` | Session plan templates |
| `/demo/ai-assistant` | AI demo | Mixed demo types | Mock/demo data |

### Key Problems Found

1. **3 different exercise types** with overlapping but incompatible fields
2. **Superset grouping logic duplicated** in 3+ files
3. **Inconsistent field displays** (some show power, some don't)
4. **Visual overwhelm** - too many indicators, cards, and nested components

---

## Unified Component Architecture

### Database Schema Alignment

Based on `docs/database-schema.md`, we have two domains:

**Coach Planning Domain:**
- `session_plans` → Session templates
- `session_plan_exercises` → Exercises in a plan (with `exercise_order`, `superset_id`)
- `session_plan_sets` → Per-set prescriptions

**Athlete Recording Domain:**
- `workout_logs` → Actual workout sessions
- `workout_log_exercises` → Exercises performed
- `workout_log_sets` → Per-set actual performance

### Per-Set Parameter Fields (from schema)

Each set can have DIFFERENT values - this is critical for pro-level training:

```typescript
// From session_plan_sets / workout_log_sets
interface SetParameters {
  set_index: number           // Set number (1, 2, 3...)

  // Core metrics
  reps?: number               // Repetitions
  weight?: number             // Weight (kg)
  distance?: number           // Distance (meters)
  performing_time?: number    // Duration (seconds)
  rest_time?: number          // Rest between sets (seconds)

  // VBT (Velocity-Based Training) metrics
  power?: number              // Power output (Watts)
  velocity?: number           // Movement velocity (m/s)

  // Advanced metrics
  tempo?: string              // Movement tempo "3-1-2-0"
  effort?: number             // Effort level
  height?: number             // Jump/throw height (cm)
  resistance?: number         // Band/machine resistance
  rpe?: number                // Rate of Perceived Exertion (1-10)

  // Flexibility
  resistance_unit_id?: number // FK to units table
  metadata?: Record<string, unknown> // Additional parameters

  // For athlete recording
  completed?: boolean         // Whether set is done
}
```

### Example: Pro-Level Variable Sets

```
Half Squat - Power Development
├── Set 1: 3 reps @ 80kg → 1000W, 1.8m/s
├── Set 2: 2 reps @ 85kg → 1200W, 1.6m/s
└── Set 3: 1 rep @ 90kg → 1500W, 1.4m/s

Flying 10m Sprint
├── Set 1: 10m @ 95% → 1.02s
├── Set 2: 10m @ 97% → 0.98s
└── Set 3: 10m @ 100% → 0.95s
```

### Single Source of Truth: `TrainingExercise`

```typescript
/**
 * Unified type for all workout contexts
 * Maps to both session_plan_exercises and workout_log_exercises
 */
interface TrainingExercise {
  id: number
  name: string
  exercise_type_id: number
  exercise_type?: 'sprint' | 'strength' | 'plyometric' | 'conditioning' | 'technical'

  // Grouping (from schema)
  superset_id?: number
  exercise_order: number
  notes?: string

  // Per-set data (NOT aggregated - each set is different!)
  sets: TrainingSet[]

  // Metadata
  video_url?: string
  created_at: string
  updated_at: string
}

interface TrainingSet {
  id: number
  set_index: number

  // Prescription (from session_plan_sets)
  prescribed?: SetParameters

  // Actual (from workout_log_sets)
  actual?: SetParameters & { completed: boolean }

  // Computed
  variance?: {
    weight_diff?: number
    power_diff?: number
    velocity_diff?: number
  }
}
```

---

## Shorthand Notation System (Revised)

### Challenge: Variable Sets

Simple notation `3×10 @ 80%` doesn't work when each set is different.

### Solution: Multi-Line Compact Format

**Uniform Sets (simple case):**
```
3×3 Half Squat @ 80% (65kg) 1800W
```

**Variable Sets (pro-level):**
```
Half Squat - Power Progression
  1. 3 @ 80kg → 1000W 1.8m/s
  2. 2 @ 85kg → 1200W 1.6m/s
  3. 1 @ 90kg → 1500W 1.4m/s
```

**Ultra-Compact (list view):**
```
Half Squat: 3+2+1 @ 80-85-90kg
Flying 10m: 3× @ 0.98-1.02s
```

### Notation Key (Extended)

| Symbol | Meaning | Example |
|--------|---------|---------|
| `×` | Uniform sets × reps | `3×10` |
| `+` | Variable reps per set | `3+2+1` (descending) |
| `-` | Range across sets | `80-90kg` (progressive) |
| `→` | Achieved metric | `→ 1500W` |
| `@` | Target/prescription | `@ 80%` |
| `()` | Actual weight/time | `(65kg)` |
| `W` | Power (Watts) | `1500W` |
| `m/s` | Velocity | `1.8m/s` |
| `s` | Time (seconds) | `0.98s` |
| `m` | Distance | `10m` |
| `cm` | Height | `45cm` |
| `A1:` | Superset label | `A1: Pull-ups` |
| `T:` | Tempo | `T:3-1-2-0` |
| `R:` | Rest time | `R:90s` |
| `RPE` | Perceived exertion | `RPE 8` |

### Dynamic Field Display

Based on exercise type, show relevant fields:

| Exercise Type | Primary Fields | Optional Fields |
|---------------|----------------|-----------------|
| Strength | reps, weight | power, velocity, tempo, RPE |
| Sprint | distance, time | velocity |
| Plyometric | reps, height | power |
| Conditioning | time, distance | heart rate, RPE |
| Technical | reps | notes |

---

## Component Hierarchy (Apple-Minimalist)

```
<WorkoutSession>                    // Container with context
  ├── <SessionHeader />             // Title, timer, progress bar
  ├── <ExerciseList>                // Virtualized for performance
  │   ├── <SupersetGroup>           // Optional grouping (A1, A2...)
  │   │   └── <ExerciseRow>         // The core component
  │   │       ├── <CompactView />   // Shorthand notation
  │   │       └── <ExpandedView />  // Full set-by-set cards
  │   └── <ExerciseRow />           // Standalone exercises
  └── <SessionActions />            // Complete, pause, etc.
```

### Display Modes

| Mode | Use Case | Shows |
|------|----------|-------|
| **Compact** | Quick overview, coach review | One-line notation per exercise |
| **Expanded** | Active logging | Set-by-set cards with inputs |
| **Planning** | Coach creating session | Editable sets, drag-drop |

---

## Responsive Design Strategy

### Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `< 640px` | Phone (portrait) | Single column, inline set rows |
| `640-768px` | Phone (landscape) / Small tablet | Single column, wider inputs |
| `768-1024px` | Tablet / iPad | Single column, same as phone |
| `> 1024px` | Desktop | Single column, same as tablet |

**Design Decision**: All devices use the same single-column layout for consistency. Desktop/tablet simply have more horizontal space for the inline inputs, but the exercise card structure remains identical.

### Mobile-First Component States

**Phone Compact:**
```
┌─────────────────────────┐
│ A1: Half Squat          │
│ 3+2+1 @ 80-90kg        │
│ [===========--] 2/3     │
└─────────────────────────┘
```

**Phone Expanded:**
```
┌─────────────────────────┐
│ A1: Half Squat      ⌄   │
├─────────────────────────┤
│ Set 1: 3 @ 80kg    [✓]  │
│ → 1000W  1.8m/s         │
├─────────────────────────┤
│ Set 2: 2 @ 85kg    [○]  │
│ Target: 1200W           │
├─────────────────────────┤
│ Set 3: 1 @ 90kg    [○]  │
│ Target: 1500W           │
└─────────────────────────┘
```

**Tablet Side-by-Side:**
```
┌─────────────────────────────────────────┐
│ A1: Half Squat                      ⌄   │
├───────────────────┬─────────────────────┤
│ Prescribed        │ Actual              │
├───────────────────┼─────────────────────┤
│ 3 @ 80kg 1000W   │ 3 @ 80kg 1050W [✓] │
│ 2 @ 85kg 1200W   │ ______________ [○] │
│ 1 @ 90kg 1500W   │ ______________ [○] │
└───────────────────┴─────────────────────┘
```

---

## CSS Architecture Analysis

### Current globals.css Assessment

**Strengths (Already in place):**
- CUBE CSS composition layer (stack, cluster, auto-grid)
- Container queries support (`@container`)
- Mobile-first utilities (`touch-target`, `mobile-safe-*`)
- PWA safe-area support (`env(safe-area-inset-*)`)
- Dark theme with WCAG AA compliance
- Scrollbar utilities for mobile

**Potential Issues to Watch:**

1. **Overflow Control**: Need explicit `overflow-x: hidden` on parent containers to prevent horizontal scroll on workout cards

2. **Touch Target Size**: Current minimum is 44px but some set completion buttons may need 48px for reliability

3. **Container Query Isolation**: Workout components should use `.container-query` class to enable responsive internal layouts

4. **Z-Index Conflicts**: Current z-index scale may conflict with expanded exercise cards that need to overlay

5. **Safe Area Handling**: Bottom action bar needs `padding-bottom: max(1rem, env(safe-area-inset-bottom))`

### Recommended CSS Additions

```css
/* Workout-specific utilities */
.workout-card {
  container-type: inline-size;
  overflow: hidden;
}

.workout-set-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  min-height: 48px; /* Enhanced touch target */
}

.workout-metric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

/* Bottom action bar safe area */
.workout-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background: hsl(var(--background));
  border-top: 1px solid hsl(var(--border));
  z-index: var(--z-header);
}
```

---

## Component Variants

```typescript
interface ExerciseDisplayProps {
  exercise: TrainingExercise
  mode: 'compact' | 'expanded' | 'planning'
  variant: 'athlete' | 'coach'

  // Athlete mode
  onCompleteSet?: (setIndex: number, actual: SetParameters) => void
  onSkipSet?: (setIndex: number) => void

  // Coach mode
  onEditSet?: (setIndex: number, prescribed: SetParameters) => void
  onAddSet?: () => void
  onRemoveSet?: (setIndex: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
}
```

| Variant | Features | Context |
|---------|----------|---------|
| `athlete` + `compact` | Quick view, tap to expand | Workout overview |
| `athlete` + `expanded` | Full logging, actual inputs | Active training |
| `coach` + `compact` | Read-only prescription | Session review |
| `coach` + `planning` | Editable, drag-drop order | Session planner |

---

## Recommended File Structure

```
components/features/training/
├── components/
│   ├── exercise-row.tsx           // Core unified component
│   ├── exercise-compact.tsx       // Shorthand notation view
│   ├── exercise-expanded.tsx      // Full set tracking
│   ├── set-card.tsx               // Individual set display/input
│   ├── superset-group.tsx         // Superset container
│   ├── session-header.tsx         // Timer, progress
│   └── session-actions.tsx        // Complete, pause
├── hooks/
│   ├── use-training-session.ts    // Unified session state
│   └── use-exercise-mutations.ts  // Shared mutations
├── utils/
│   ├── notation-formatter.ts      // Shorthand display
│   ├── superset-grouping.ts       // Shared grouping logic
│   ├── exercise-transforms.ts     // Type conversions
│   └── field-visibility.ts        // Dynamic field display
├── types.ts                       // TrainingExercise, TrainingSet, etc.
└── index.ts                       // Public exports
```

---

## Implementation Priority

1. **Create unified types** (`TrainingExercise`, `TrainingSet`, `SetParameters`)
2. **Build notation formatter** (handles both uniform and variable sets)
3. **Create SetCard** component (single set with prescribed vs actual)
4. **Create ExerciseRow** with compact/expanded toggle
5. **Add SupersetGroup** wrapper with A/B/C labels
6. **Add responsive CSS utilities** to globals.css
7. **Migrate `/workout` page** first (highest usage)
8. **Migrate session planner** second
9. **Update AI demo** last

---

## Lofi Wireframes

*See next section for visual wireframes across device sizes*

---

## Competitor Research (2025)

### Strong App
- Log sets with just a few taps
- Auto-fills previous weight and reps as starting point
- Rest timer starts automatically after logging a set
- Clean design prioritizing function over flash
- Minimal social features (personal progress focus)

### Hevy App
- Single row for weight and reps with inline columns
- Time column with inline stopwatch for timed exercises
- Shows last rep/weight from previous session
- Labels for drop sets, failure sets, supersets

### Nike Training Club
- Clean, high-contrast interface
- No distractions during workouts
- Audio-only mode option

### Key Takeaways for Kasoku.run
1. **Horizontal table-row layout** for set inputs (not vertical stacking)
2. **Tap set number to complete** (not separate button)
3. **Auto-fill previous values** for faster logging
4. **Rest timer integration** with automatic start

### Sources
- [Hevy Workout Tracker](https://www.hevyapp.com/)
- [Fitness App UI Design - Stormotion](https://stormotion.io/blog/fitness-app-ux/)
- [UX/UI Best Practices for Fitness Apps - Zfort](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)
- [Fitness App Design Best Practices - Dataconomy](https://dataconomy.com/2025/11/11/best-ux-ui-practices-for-fitness-apps-retaining-and-re-engaging-users/)

---

## Remaining Work

### Phase 1: Demo Refinement
- [x] Unified layout for all set states (no UI shift)
- [x] Inline editable inputs (click to edit)
- [x] Conditional field display (data-driven)
- [x] Single-column layout for all devices
- [x] Coach uses same pill notation as athlete
- [ ] Add auto-fill with previous session values
- [ ] Add rest timer between sets
- [ ] Test on actual mobile devices
- [ ] Gather user feedback

### Phase 2: Production Integration
- [ ] Create unified `TrainingExercise` type
- [ ] Build reusable components in `components/features/training/`
- [ ] Migrate `/workout` page to use new components
- [ ] Migrate session planner

### Phase 3: Polish
- [ ] Haptic feedback on set completion (mobile)
- [ ] Swipe gestures for quick actions
- [ ] Dark mode optimization for gym use

---

## Requirements Log

### 2025-12-25 Feedback Session

1. **RPE conditional display** - Only show RPE field if the plan exercise has RPE value (same as other fields)
2. **Unified device layouts** - Desktop should match tablet/phone layout (no 2-column exercise grid)
3. **Coach notation consistency** - Coach view should show units after values (same pill notation as athlete)
4. **No UI shift** - Same layout for pending/active/completed states
5. **Minimal scrollbar** - Hidden scrollbar for horizontal scroll areas
6. **Larger SetRow touch targets** - Both athlete and coach SetRow use larger height (py-2, h-8 inputs) and larger font (text-sm)
7. **Compact exercise header** - Smaller padding (px-3 py-2.5), smaller fonts (text-sm for name, text-xs for details)
8. **Drag-and-drop reordering** - Sets can be reordered within an exercise, exercises can be reordered within a section (coach mode only)
9. **Drag handle integration** - Grip icon integrated into header (not separate column) to preserve card width
