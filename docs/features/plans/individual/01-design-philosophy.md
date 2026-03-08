# Design Philosophy

> Core Principle: "AI is Always Available, Context is Implicit"

## Current vs Proposed State

```
CURRENT STATE (Broken)
┌───────────┐    navigate    ┌───────────┐    navigate    ┌──────────────┐
│  /plans/24 │ ─────────────▶│ /plans/24 │ ─────────────▶│ /plans/24/   │
│   (view)   │               │   /edit   │               │ session/xxx  │
│   No AI    │               │ Broken AI │               │ Working AI   │
└───────────┘               └───────────┘               └──────────────┘

PROPOSED STATE (Unified)
┌──────────────────────────────────────────────────────────────────┐
│                          /plans/24                                │
│  ┌────────────────────────────────────────┬────────────────────┐ │
│  │                                        │                    │ │
│  │         Main Content                   │       AI           │ │
│  │   (weeks, days, workouts, exercises)   │     Drawer         │ │
│  │                                        │                    │ │
│  │   User navigates WITHIN the page       │     Always         │ │
│  │   AI knows the current context         │     Available      │ │
│  │                                        │                    │ │
│  └────────────────────────────────────────┴────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single URL | One mental model, no context loss on navigation |
| AI drawer always accessible | No hunting for features |
| Context from selection | AI reads what user is looking at |
| Progressive detail | Show more when user focuses deeper |
| Inline changesets | Show changes where they apply, not in a modal |

## Design Principles

### 1. "Invisible AI" Principle
The app must work perfectly for users who never touch AI. AI enhances; it's not required.

### 2. "Progressive Complexity" Principle
Default to simple. Let users unlock complexity on demand.
- Default: Show only essential fields (reps, weight, rest)
- Toggle: "Show Advanced Fields" reveals RPE, tempo, velocity, etc.
- All users see the same layout; complexity is in field visibility

### 3. "Explain, Don't Just Do" Principle
AI shows reasoning, not just results. Users understand and trust changes.

### 4. "Speed for the Busy" Principle
Common actions in < 3 taps. Users can modify workouts in 10 seconds at the gym.

### 5. "Control for the Expert" Principle
Power users can see and modify everything. Full audit capability before approving.

### 6. "Sensible Defaults" Principle
Show exercise-appropriate fields by default. A bench press shows reps/weight/rest; a plank shows duration/rest.
- Field visibility determined by exercise type, not user preference
- Advanced toggle adds optional fields (RPE, tempo) to ALL exercises
- Toggle is discoverable on the plan page (not buried in settings)

### 7. "Gentle for the Nervous" Principle
Beginners can't "break" anything. Undo is always available.
