# Lo-Fi Prototype: Plan Review & Approval (User Story 3)

**Feature**: 010-individual-first-experience
**User Story**: US3 - Plan Review and Approval
**Created**: 2026-01-12
**Updated**: 2026-01-12 (v2 - Week selector + Chat integration)

---

## Overview

This lo-fi prototype defines the UI/UX for when an individual user reviews and approves their AI-generated training plan.

**Key Design Decisions**:
1. **Week selector pattern** - Reuse coach mobile view pattern with week tabs (no infinite scroll)
2. **Chat integration** - "Chat" button opens conversation drawer for discussion before changes
3. **Single-column layout** - Works for both mobile and desktop (no 3-column coach view)
4. **Familiar patterns** - Same UI users will see when editing sessions later

---

## User Flow

```
┌─────────────────────────────────────────┐
│     AI Plan Generation (US1 & US2)      │
│        (Personalization + Streaming)    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     PLAN REVIEW SCREEN (This US3)       │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Approval Bar (sticky top)        │  │
│  │  [Chat 💬]            [Apply ✓]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Block Summary                          │
│  Week Tabs: [Week 1] [Week 2] [...]     │
│  Session Cards (expandable)             │
│                                         │
└─────────────────────────────────────────┘
          │                    │
     [Apply]              [Chat]
          │                    │
          ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│ SUCCESS SCREEN  │   │  Chat Drawer    │
│                 │   │  (Discussion +  │
│ [Start Workout] │   │   Feedback)     │
│ [View Block]    │   │                 │
└─────────────────┘   └─────────────────┘
```

---

## Screen 1: Plan Review (Main Screen)

### Layout: Block Summary + Week Tabs + Sessions

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                    [Skip to Manual]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🤖 Your AI Training Plan                                │   │
│  │  ───────────────────────────────────────────────────     │   │
│  │  4 weeks  •  3 workouts/week  •  12 exercises            │   │
│  │                                                          │   │
│  │  [💬 Chat with AI]                   [Apply Plan ✓]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏋️ STRENGTH FOUNDATION                                 │   │
│  │     4 weeks  •  Build Strength  •  Full Gym              │   │
│  │                                                          │   │
│  │  "A progressive strength program focusing on compound    │   │
│  │   movements to build a solid foundation."                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      WEEK SELECTOR                       │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │   │
│  │  │ Week 1 │ │ Week 2 │ │ Week 3 │ │ Week 4 │            │   │
│  │  │  ████  │ │        │ │        │ │ Deload │            │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘            │   │
│  │   3 workouts  3 workouts  3 workouts  2 workouts         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  WEEK 1 SESSIONS                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌──────┐                                                │   │
│  │  │ Mon  │  UPPER BODY PUSH                        [▼]   │   │
│  │  │      │  4 exercises  •  ~45 min                       │   │
│  │  └──────┘                                                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • Bench Press ........................... 4 × 6        │   │
│  │  • Overhead Press ........................ 3 × 8        │   │
│  │  • Incline Dumbbell Press ................ 3 × 10       │   │
│  │  • Tricep Pushdowns ...................... 3 × 12       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌──────┐                                                │   │
│  │  │ Wed  │  LOWER BODY                             [▶]   │   │
│  │  │      │  4 exercises  •  ~45 min                       │   │
│  │  └──────┘                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌──────┐                                                │   │
│  │  │ Fri  │  UPPER BODY PULL                        [▶]   │   │
│  │  │      │  4 exercises  •  ~45 min                       │   │
│  │  └──────┘                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Elements

| UI Element | Description | Reuses From |
|------------|-------------|-------------|
| Approval Bar | Sticky top, "Chat with AI" + "Apply Plan" buttons | `InlineProposalSection` pattern |
| Block Summary Card | Name, duration, focus, description | `TrainingBlockCard` |
| Week Selector | Horizontal tabs with workout count | Coach mobile view tabs |
| Session Card | Day sidebar + name + exercise count, expandable | `WorkoutCard` from `IndividualWorkspace` |
| Exercise List | Read-only list showing exercise × sets | `SessionPlannerV2` pattern |

---

## Week Selector Detail

The week selector uses the tab pattern from coach mobile view, adapted for simplicity:

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEEK SELECTOR                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Week 1  │  │  Week 2  │  │  Week 3  │  │  Week 4  │        │
│  │  ═══════ │  │          │  │          │  │  Deload  │        │
│  │ selected │  │          │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                 │
│  Jan 13 - 19    Jan 20 - 26   Jan 27 - Feb 2   Feb 3 - 9       │
│  3 workouts     3 workouts    3 workouts       2 workouts       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Tap a week tab to select it
- Selected week shows content below
- Horizontal scroll if > 4 weeks
- Current week (if within plan dates) shows "Now" badge

---

## Screen 2: Chat Drawer (Opened from Approval Bar)

When user clicks "Chat with AI" button:

### Mobile: Bottom Drawer

```
┌─────────────────────────────────────────────────────────────────┐
│  (Plan Review screen dimmed behind)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═════════════════════════════════════════════════════════════╗
│  ║  ───  (drag handle)                                         ║
│  ║                                                              ║
│  ║  🤖 Training Plan Assistant                    [×]          ║
│  ╠══════════════════════════════════════════════════════════════╣
│  ║                                                              ║
│  ║  ┌────────────────────────────────────────────────────────┐ ║
│  ║  │ 🤖 I've created a 4-week Strength Foundation plan     │ ║
│  ║  │    for you with 3 workouts per week. Each workout     │ ║
│  ║  │    focuses on compound movements to build strength.   │ ║
│  ║  │                                                        │ ║
│  ║  │    Would you like me to explain the exercise          │ ║
│  ║  │    choices, or make any adjustments?                  │ ║
│  ║  └────────────────────────────────────────────────────────┘ ║
│  ║                                                              ║
│  ║  ┌────────────────────────────────────────────────────────┐ ║
│  ║  │ 👤 Can you add more arm exercises? I want to focus    │ ║
│  ║  │    on biceps too.                                      │ ║
│  ║  └────────────────────────────────────────────────────────┘ ║
│  ║                                                              ║
│  ║  ┌────────────────────────────────────────────────────────┐ ║
│  ║  │ 🤖 Great idea! I'll add some bicep work to balance   │ ║
│  ║  │    out the tricep exercises. I'm updating the plan... │ ║
│  ║  └────────────────────────────────────────────────────────┘ ║
│  ║                                                              ║
│  ╠══════════════════════════════════════════════════════════════╣
│  ║  ┌────────────────────────────────────────────────────────┐ ║
│  ║  │ Ask me anything about your plan...           [Send →] │ ║
│  ║  └────────────────────────────────────────────────────────┘ ║
│  ╚══════════════════════════════════════════════════════════════╝
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Desktop: Right Sidebar

```
┌───────────────────────────────────────┬─────────────────────────┐
│                                       │                         │
│  (Plan Review content)                │  🤖 Training Plan       │
│                                       │     Assistant     [×]   │
│  ┌─────────────────────────────────┐  │                         │
│  │  Block Summary                  │  │  ─────────────────────  │
│  │  Week Tabs                      │  │                         │
│  │  Session Cards                  │  │  [Chat messages...]     │
│  └─────────────────────────────────┘  │                         │
│                                       │                         │
│                                       │                         │
│                                       │                         │
│                                       │  ─────────────────────  │
│                                       │  [Input box] [Send]     │
│                                       │                         │
└───────────────────────────────────────┴─────────────────────────┘
```

**Chat Use Cases**:
1. "Why did you choose these exercises?"
2. "Can you add more arm work?"
3. "I don't have access to cables, can you swap those exercises?"
4. "Make week 4 a deload week with lighter volume"

When AI updates the plan, it calls `createTrainingBlockProposal` again, and the plan view updates behind the chat.

---

## Screen 3: Success / First Workout CTA

After user clicks "Apply Plan":

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                           ✓                                     │
│                                                                 │
│                  Your Training Plan is Ready!                   │
│                                                                 │
│              "Strength Foundation" has been created             │
│                with 3 workouts ready for this week.             │
│                                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │                                                  │    │   │
│  │  │         🏋️  Start Your First Workout            │    │   │
│  │  │                                                  │    │   │
│  │  │             Monday - Upper Body Push            │    │   │
│  │  │             4 exercises  •  ~45 min             │    │   │
│  │  │                                                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │                         or                               │   │
│  │                                                          │   │
│  │                 [View Training Block →]                  │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### New Components to Create

```
components/features/first-experience/
├── PlanReviewScreen.tsx          # Main review screen container
├── PlanApprovalBar.tsx           # Sticky approval bar (Chat + Apply)
├── ProposedBlockSummary.tsx      # Block info card
├── WeekTabSelector.tsx           # Horizontal week tabs
├── ProposedSessionCard.tsx       # Expandable session card
├── ProposedExerciseList.tsx      # Read-only exercise list
├── FirstWorkoutSuccess.tsx       # Success screen with CTA
└── index.ts
```

### Reused Components

| Component | From | Purpose |
|-----------|------|---------|
| `Card`, `CardHeader`, `CardContent` | `ui/card` | Container styling |
| `Button` | `ui/button` | CTAs |
| `Badge` | `ui/badge` | Status indicators |
| `Tabs`, `TabsList`, `TabsTrigger` | `ui/tabs` | Week selector |
| `Collapsible` | `ui/collapsible` | Expandable sessions |
| `ChatDrawer` | `ai-assistant/ChatDrawer` | Mobile chat interface |
| `ChatSidebar` | `ai-assistant/ChatSidebar` | Desktop chat interface |

---

## Approval Bar States

### State 1: Initial (Reviewing)

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Your AI Training Plan                                       │
│  4 weeks  •  3 workouts/week  •  12 exercises                   │
│                                                                 │
│  [💬 Chat with AI]                           [Apply Plan ✓]     │
└─────────────────────────────────────────────────────────────────┘
```

### State 2: Applying (Loading)

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Your AI Training Plan                                       │
│  4 weeks  •  3 workouts/week  •  12 exercises                   │
│                                                                 │
│  [💬 Chat with AI]                         [⟳ Creating...]      │
└─────────────────────────────────────────────────────────────────┘
```

### State 3: Error

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Failed to create plan. Please try again.                   │
│                                                                 │
│  [💬 Chat with AI]                            [Retry ↻]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Week Tab Selection

- Tap/click a week tab to view its sessions
- Content area updates instantly (client-side state)
- No page navigation needed
- Horizontal scroll for weeks > 4

### 2. Session Card Expand/Collapse

- Default: First session expanded, others collapsed
- Tap anywhere on card header to toggle
- Chevron icon indicates state (▼ expanded, ▶ collapsed)
- Smooth animation with `Collapsible` component

### 3. Chat Flow

```
User clicks [💬 Chat with AI]
    ↓
Chat drawer/sidebar opens
    ↓
User types message or question
    ↓
AI responds (may update plan in background)
    ↓
If AI updates plan:
  - Plan view updates behind chat
  - User can see changes when they dismiss chat
    ↓
User dismisses chat → returns to Plan Review
    ↓
User clicks [Apply Plan ✓] when satisfied
```

### 4. Apply Flow

```
User clicks [Apply Plan ✓]
    ↓
Button shows loading state
    ↓
Atomic transaction:
  - Create mesocycle
  - Create microcycle(s)
  - Create session_plans
  - Create session_plan_exercises
  - Create session_plan_sets
    ↓
On success: Navigate to Success Screen
On error: Show error state, offer retry
```

---

## Mobile Considerations

### Touch Targets
- All buttons: minimum 44px height
- Week tabs: 48px height, full-width tap area
- Session cards: full-width tap area for expand/collapse

### Layout Adjustments
- Single column layout throughout
- Week tabs scroll horizontally if needed
- Chat drawer is bottom sheet (same as session page)
- Sticky approval bar at top (visible during scroll)

### Gestures
- Swipe left/right on week tabs to scroll
- Swipe down to dismiss chat drawer
- Tap outside to collapse expanded session

---

## Design Tokens

Following existing shadcn/ui patterns:

```css
/* Week Tab States */
--tab-default: hsl(var(--muted))
--tab-selected: hsl(var(--primary))
--tab-hover: hsl(var(--accent))

/* Session Card */
--session-border: hsl(var(--border))
--session-day-bg: hsl(var(--primary) / 0.1)
--session-day-text: hsl(var(--primary))

/* Approval Bar */
--approval-bg: hsl(var(--muted))
--approval-border: hsl(var(--border))
--chat-button: hsl(var(--secondary))
--apply-button: hsl(var(--primary))
```

---

## Why This Design?

1. **No infinite scroll** - Week tabs prevent endless scrolling through sessions
2. **Conversation-first** - Chat button encourages discussion before changes
3. **Familiar patterns** - Same week/session UI users will see in the actual workspace
4. **Mobile-first** - Single column works on all devices
5. **Progressive disclosure** - Collapsed sessions keep the view manageable
6. **Reuses existing components** - ChatDrawer, ChatSidebar, card patterns

---

## Comparison: Before vs After

| Aspect | Previous Design | Improved Design |
|--------|----------------|-----------------|
| Week Navigation | Infinite scroll | Week tabs (no scroll) |
| Feedback | "Change" → Regenerate | "Chat" → Discussion → Regenerate if needed |
| User Control | Binary (approve/regenerate) | Conversational (ask questions, refine, then approve) |
| Desktop Layout | Single column | Content + sidebar (when chat open) |

---

## Implementation Notes

### Changes from Original Spec

1. **Week selector added** - Addresses infinite scroll concern
2. **Chat replaces Change** - Enables conversation before regeneration
3. **Inline regeneration** - AI updates plan in background during chat

### Integration Points

- **PlanGeneratorAssistant** (new) - Extends SessionAssistant pattern for block creation
- **ChangeSet** - Used for plan proposal (new tools: `createTrainingBlockProposal`, `confirmPlanGeneration`)
- **ChatDrawer/ChatSidebar** - Reused directly from ai-assistant components

---

## Next Steps

1. [ ] Review this improved prototype with stakeholders
2. [ ] Create PlanReviewScreen component stub
3. [ ] Implement WeekTabSelector component
4. [ ] Adapt PlanApprovalBar from InlineProposalSection
5. [ ] Create PlanGeneratorAssistant (extends SessionAssistant)
6. [ ] Connect to AI generation output from US1/US2
7. [ ] Implement atomic plan creation action
8. [ ] Polish animations and mobile UX
