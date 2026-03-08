# Information Architecture

## Hierarchy Model

```
Training Block (Mesocycle)
    │
    ├── Week 1 (Microcycle)
    │   ├── Monday: Push Day (Session)
    │   │   ├── Bench Press (Exercise)
    │   │   │   ├── Set 1: 10 reps @ 60kg
    │   │   │   └── Set 2: 8 reps @ 70kg
    │   │   └── Shoulder Press (Exercise)
    │   │       └── ...
    │   └── Wednesday: Pull Day (Session)
    │       └── ...
    │
    ├── Week 2
    │   └── ...
    │
    └── Week 3 (Deload)
        └── ...
```

## Navigation States (Context Levels)

| Level | User Selection | What's Visible | AI Context |
|-------|---------------|----------------|------------|
| L0: Block | Nothing selected | All weeks in sidebar | Entire training block |
| L1: Week | Week 2 selected | Week 2's sessions | Selected week |
| L2: Day/Session | Monday selected | Monday's exercises | Selected session |
| L3: Exercise | Bench Press expanded | Sets detail | Selected exercise |

## Single Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: "8-Week Strength Block"           [Edit Block] [AI ✨]  │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Week List   │  │  Week 2: Jan 6 - Jan 12                   │  │
│  │             │  │  ┌─────────────────────────────────────┐  │  │
│  │ ○ Week 1    │  │  │ Day Selector: [Mon] [Wed] [Fri]     │  │  │
│  │ ● Week 2 ◄──│  │  └─────────────────────────────────────┘  │  │
│  │ ○ Week 3    │  │                                           │  │
│  │ ○ Week 4    │  │  ┌─────────────────────────────────────┐  │  │
│  │   ...       │  │  │ Monday: Push Day                     │  │  │
│  │             │  │  │                                       │  │  │
│  │             │  │  │ 1. Bench Press         3×10 @ 60kg  │  │  │
│  │             │  │  │ 2. Incline DB Press    3×12 @ 20kg  │  │  │
│  │             │  │  │ 3. Cable Flyes         3×15         │  │  │
│  │             │  │  │                                       │  │  │
│  │             │  │  │ [+ Add Exercise]                      │  │  │
│  │             │  │  └─────────────────────────────────────┘  │  │
│  └─────────────┘  └───────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 💬 AI: "What would you like to change?"          [Send] ▶│ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## URL Structure

**Single URL for everything:**
```
/plans/[id]
```

Context is implicit from UI state, not URL:
- Week selection → UI state
- Day selection → UI state
- AI drawer open/closed → UI state

No more:
- ❌ `/plans/[id]/edit`
- ❌ `/plans/[id]/session/[sessionId]`

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Single column, week selector as bottom sheet, AI as bottom drawer |
| Tablet (768px - 1024px) | Optional collapsed week sidebar, AI as bottom drawer or side panel |
| Desktop (> 1024px) | Two or three-column depending on AI state |

## AI Chat States (Hybrid Approach)

The AI chat component has two states:

| State | Desktop | Mobile | When to Use |
|-------|---------|--------|-------------|
| **Sidebar/Drawer** | Right sidebar (360px) | Bottom drawer (60%) | Quick edits, single/week-level changes |
| **Expanded** | Full width, week sidebar hidden | Full screen | Block-wide proposals |

### Desktop Layout States

```
CLOSED (2-column):
┌──────────┬─────────────────────────────────────┐
│  WEEKS   │          PLAN CONTENT               │
│          │                                     │
└──────────┴─────────────────────────────────────┘

SIDEBAR OPEN (3-column):
┌──────────┬─────────────────────┬───────────────┐
│  WEEKS   │    PLAN CONTENT     │   AI CHAT     │
│          │                     │   (360px)     │
└──────────┴─────────────────────┴───────────────┘

EXPANDED (1-column, AI focused):
┌─────────────────────────────────────────────────┐
│              AI CHAT (full width)               │
│         Week sidebar & plan hidden              │
└─────────────────────────────────────────────────┘
```

### Mobile Layout States

```
CLOSED:                    DRAWER (60%):           FULL SCREEN:
┌─────────────┐           ┌─────────────┐         ┌─────────────┐
│   HEADER    │           │   HEADER    │         │ [← Back] AI │
├─────────────┤           ├─────────────┤         ├─────────────┤
│             │           │  (dimmed)   │         │             │
│    PLAN     │           ├─────────────┤         │   AI CHAT   │
│   CONTENT   │           │             │         │             │
│             │           │   AI CHAT   │         │   (full)    │
│      [FAB]  │           │             │         │             │
└─────────────┘           └─────────────┘         └─────────────┘
```

### Triggers

- **Auto-expand**: When AI proposes block-wide changes (multi-week)
- **Manual expand**: User clicks [⤢] button
- **Collapse**: User clicks [⤡ Back to Plan] or approves/dismisses proposal
