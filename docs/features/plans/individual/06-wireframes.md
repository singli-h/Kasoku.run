# Wireframes (Lo-Fi)

## AI Chat States (Hybrid Approach)

The AI chat has two states on both desktop and mobile:

| State | Desktop | Mobile | Use Case |
|-------|---------|--------|----------|
| **Sidebar/Drawer** | Right sidebar (360px) | Bottom drawer (70%) | Quick edits, single/week-level |
| **Expanded** | Full width (no week sidebar) | Full screen | Block-wide proposals |

**Triggers:**
- Auto-expand: Block-wide proposal from AI
- Manual: User clicks expand button [⤢]
- Collapse: User clicks [⤡ Back to Plan] or approves/dismisses

---

## Browse State (AI Closed)

Default view when user lands on plan page. No AI interaction yet.

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back    8-Week Strength Program                         [Advanced ○]  [Edit Block]  [✨ AI]        │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  WEEK SIDEBAR  │  │  Week 2: Jan 6 - Jan 12                                                   │   │
│  │  ────────────  │  │                                                                           │   │
│  │  ○ Week 1      │  │  [Mon] [Wed] [Fri] [Sat]                                                   │   │
│  │  ● Week 2 NOW  │  │   ●                                                                       │   │
│  │  ○ Week 3      │  │                                                                           │   │
│  │  ○ Week 4      │  │  ┌─────────────────────────────────────────────────────────────────────┐  │   │
│  │  ...           │  │  │  Monday: Push Day                                                   │  │   │
│  │                │  │  │  1  Bench Press         3×10 @ 60kg                                │  │   │
│  │                │  │  │  2  Incline Press       3×12 @ 20kg                                │  │   │
│  │                │  │  │  3  Cable Flyes         3×15                                       │  │   │
│  │                │  │  │  4  Tricep Pushdowns    3×12                                       │  │   │
│  │                │  │  │  [+ Add Exercise]                                                   │  │   │
│  │                │  │  └─────────────────────────────────────────────────────────────────────┘  │   │
│  └────────────────┘  └───────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────────────────┐
│ ← 8-Week Strength       [⚙] [✨]│
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 📅  Week 2                  ││
│  │     Jan 6 - Jan 12          ││
│  │     ●●○○○○○○  2 of 8       [v]│
│  └─────────────────────────────┘│
│   ↑ Tap to open week selector   │
│                                 │
│  [Mon] [Wed] [Fri] [Sat]        │
│   ●                             │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Monday: Push Day           ││
│  │  4 exercises                ││
│  │  ┌───────────────────────┐  ││
│  │  │ 1  Bench Press        │  ││
│  │  │    3×10 @ 60kg        │  ││
│  │  └───────────────────────┘  ││
│  │  ┌───────────────────────┐  ││
│  │  │ 2  Incline DB Press   │  ││
│  │  │    3×12 @ 20kg        │  ││
│  │  └───────────────────────┘  ││
│  │  ...                        ││
│  └─────────────────────────────┘│
│                                 │
│                          ┌────┐ │
│                          │ ✨ │ │
│                          │ AI │ │
│                          └────┘ │
│                           FAB   │
└─────────────────────────────────┘
```

**Notes:**
- Desktop: 3-column layout (Week Sidebar | Plan Content | AI Sidebar hidden)
- Mobile: Week selector collapsed, FAB or header button to open AI
- Click [✨ AI] or FAB to open AI sidebar/drawer
- [Advanced ○] toggle shows/hides optional fields (RPE, tempo, etc.)
- Mobile: [⚙] opens settings sheet with Advanced toggle

---

## AI Sidebar/Drawer Open (Ready for Input)

User opens AI but hasn't made a request yet.

### Desktop (3-Column with Sidebar)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back    8-Week Strength Program                                            [Edit Block]  [✨ AI]   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌─────────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  WEEK SIDEBAR  │  │  Week 2: Jan 6 - Jan 12                  │  │  AI Assistant       [⤢] [×]  │ │
│  │  ○ Week 1      │  │  [Mon] [Wed] [Fri] [Sat]                  │  │                                │ │
│  │  ● Week 2 NOW  │  │   ●                                       │  │  "What would you like to      │ │
│  │  ○ Week 3      │  │  ┌────────────────────────────────────┐  │  │   change about your plan?"    │ │
│  │  ○ Week 4      │  │  │  Monday: Push Day                   │  │  │                                │ │
│  │  ...           │  │  │  1  Bench Press      3×10 @ 60kg   │  │  │                                │ │
│  │                │  │  │  2  Incline Press    3×12 @ 20kg   │  │  │  ┌────────────────────────┐   │ │
│  │                │  │  │  3  Cable Flyes      3×15          │  │  │  │ Type a message...      │   │ │
│  │                │  │  │  4  Tricep Pushdowns 3×12          │  │  │  └────────────────────────┘   │ │
│  │                │  │  └────────────────────────────────────┘  │  │                                │ │
│  └────────────────┘  └─────────────────────────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (70% Bottom Drawer)
```
┌─────────────────────────────────┐
│ ← 8-Week Strength       [⚙] [✨]│
├─────────────────────────────────┤
│  Week 2 · Monday        [···]   │
│  ░░░░░ (content dimmed) ░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ ─────  (drag handle)       [⤢]  │
│                                 │
│  🤖 What would you like to      │
│     change?                     │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Type a message...        [→]││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Notes:**
- Desktop: [⤢] = Expand to full width, [×] = Close sidebar
- Mobile: [⤢] = Expand to full screen, drag handle to resize
- Week sidebar + plan content still visible (context preserved)

---

## Session-Level Proposal (Inline Diff)

User requests a change to the current session. AI proposes changes with inline diff.

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────┐  ┌─────────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  WEEK SIDEBAR  │  │  ┌────────────────────────────────────┐  │  │  AI Assistant       [⤢] [×]  │ │
│  │  ○ Week 1      │  │  │ 🤖 1 change | 1 swap               │  │  │                                │ │
│  │  ● Week 2 NOW  │  │  │                   [Change] [Apply]  │  │  │  👤 Replace bench press with  │ │
│  │  ○ Week 3      │  │  └────────────────────────────────────┘  │  │     dumbbell press            │ │
│  │                │  │         ↑ PROPOSAL BAR                   │  │                                │ │
│  │                │  │                                          │  │  🤖 I'll swap Bench Press     │ │
│  │                │  │  ┌────────────────────────────────────┐  │  │     for DB Bench Press.       │ │
│  │                │  │  │  Monday: Push Day                   │  │  │                                │ │
│  │                │  │  │  ┌─────────────────────────────┐   │  │  │                                │ │
│  │                │  │  │  │ ❌ Bench Press              │   │  │  │                                │ │
│  │                │  │  │  │    3×10 @ 60kg     REMOVING │   │  │  │                                │ │
│  │                │  │  │  ├─────────────────────────────┤   │  │  │                                │ │
│  │                │  │  │  │ ✅ DB Bench Press           │   │  │  │                                │ │
│  │                │  │  │  │    3×10 @ 60kg     ADDING   │   │  │  │                                │ │
│  │                │  │  │  └─────────────────────────────┘   │  │  │                                │ │
│  │                │  │  │  2  Incline DB Press  3×12 @ 20kg  │  │  │                                │ │
│  │                │  │  └────────────────────────────────────┘  │  │                                │ │
│  └────────────────┘  └─────────────────────────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────────────────┐
│ ← 8-Week Strength       [⚙] [✨]│
├─────────────────────────────────┤
│  Week 2 · Monday        [···]   │
│  ░░░░░ (content dimmed) ░░░░░   │
├─────────────────────────────────┤
│ ─────  (drag handle)       [⤢]  │
│  👤 Replace bench press with    │
│     dumbbell press              │
│                                 │
│  🤖 I'll swap Bench Press for   │
│     DB Bench Press.             │
│                                 │
│  ┌─────────────────────────────┐│
│  │ ❌ Bench Press    REMOVING  ││
│  │ ✅ DB Bench       ADDING    ││
│  └─────────────────────────────┘│
│                                 │
│  ┌──────────┐  ┌──────────────┐ │
│  │  Change  │  │    Apply     │ │
│  └──────────┘  └──────────────┘ │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Type a message...        [→]││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Notes:**
- User sees both the chat AND the inline diff
- Desktop: Inline diff visible in plan content area
- Mobile: Preview shown in drawer (plan content dimmed)

---

## Week-Level Proposal (Grouped Summary)

Changes affect multiple sessions in the week. Show grouped summary with expand/collapse.

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────┐  ┌─────────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  WEEK SIDEBAR  │  │  ┌────────────────────────────────────┐  │  │  AI Assistant       [⤢] [×]  │ │
│  │  ○ Week 1      │  │  │ 🤖 4 sessions · +4 exercises       │  │  │                                │ │
│  │  ● Week 2 NOW  │  │  │                   [Change] [Apply]  │  │  │  👤 Add planks to every       │ │
│  │  ○ Week 3      │  │  │ ──────────────────────────────────  │  │  │     workout this week         │ │
│  │                │  │  │  ▶ Monday: Push Day         +1      │  │  │                                │ │
│  │                │  │  │  ▼ Wednesday: Pull Day      +1      │  │  │  🤖 Adding planks to all 4    │ │
│  │                │  │  │    └─ ✅ Plank  3×60s              │  │  │     sessions in Week 2.       │ │
│  │                │  │  │  ▶ Friday: Legs             +1      │  │  │                                │ │
│  │                │  │  │  ▶ Saturday: Arms           +1      │  │  │                                │ │
│  │                │  │  └────────────────────────────────────┘  │  │                                │ │
│  └────────────────┘  └─────────────────────────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────────────────┐
│ ← 8-Week Strength       [⚙] [✨]│
├─────────────────────────────────┤
│  Week 2 · Monday                │
│  ░░░░░ (dimmed) ░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ ─────  (drag handle)       [⤢]  │
│  👤 Add planks to every         │
│     workout this week           │
│                                 │
│  🤖 Adding planks to all 4      │
│     sessions in Week 2.         │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🤖 4 sessions · +4 exercises││
│  │ ───────────────────────────-││
│  │ ▶ Monday: Push Day      +1  ││
│  │ ▶ Wednesday: Pull Day   +1  ││
│  │ ▶ Friday: Legs          +1  ││
│  │ ▶ Saturday: Arms        +1  ││
│  └─────────────────────────────┘│
│                                 │
│  ┌──────────┐  ┌──────────────┐ │
│  │  Change  │  │    Apply     │ │
│  └──────────┘  └──────────────┘ │
└─────────────────────────────────┘
```

**Notes:**
- Grouped by day with expand/collapse (▶/▼)
- Sidebar/drawer view sufficient for week-level changes
- Inline diff only for currently viewed session

---

## Block-Wide Proposal (Expanded View)

Changes span 5+ sessions across multiple weeks. Auto-expands to full width/screen.

### Desktop (Full Width)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back    8-Week Strength Program                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [⤡ Back to Plan]                                                        AI Assistant          │  │
│  │                                                                                                 │  │
│  │  👤  Replace all barbell exercises with dumbbell alternatives                                  │  │
│  │                                                                                                 │  │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                                 │  │
│  │  🤖  I'll replace 12 barbell exercises across your 8-week training block:                      │  │
│  │                                                                                                 │  │
│  │      Summary of changes:                                                                        │  │
│  │      ─────────────────────                                                                      │  │
│  │      • Week 1: 4 swaps (Bench → DB Bench, Row → DB Row, Curl → DB Curl, Squat → Goblet)       │  │
│  │      • Week 2: 4 swaps (same exercises, progressed weight)                                     │  │
│  │      • Week 3: 4 swaps (same pattern)                                                          │  │
│  │      • Week 4 (Deload): No barbell exercises - no changes needed                               │  │
│  │      • Week 5-8: 4 swaps each (same pattern as weeks 1-3)                                      │  │
│  │                                                                                                 │  │
│  │      ▼ Thinking                                                                                 │  │
│  │      ┌─────────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │      │ • You asked to replace barbell with dumbbell exercises                              │   │  │
│  │      │ • Found 12 barbell exercises across weeks 1-3 and 5-8                               │   │  │
│  │      │ • Week 4 is a deload week with no barbell movements                                 │   │  │
│  │      └─────────────────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                                 │  │
│  │      ┌─────────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │      │                    [Make Changes]         [Looks Good ✓]                            │   │  │
│  │      └─────────────────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  Or type to modify: "but keep squats as barbell"                                    [→] │   │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (Full Screen)
```
┌─────────────────────────────────┐
│ [⤡ Back]        AI Assistant    │
├─────────────────────────────────┤
│  👤 Replace all barbell         │
│     exercises with dumbbells    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  🤖 I'll replace 12 barbell     │
│     exercises across your       │
│     8-week program:             │
│                                 │
│     Summary of changes:         │
│     ─────────────────────       │
│     • Week 1: 4 swaps           │
│       - Bench → DB Bench        │
│       - Row → DB Row            │
│       - Curl → DB Curl          │
│       - Squat → Goblet Squat    │
│     • Week 2: 4 swaps           │
│     • Week 3: 4 swaps           │
│     • Week 4 (Deload):          │
│       No changes needed         │
│     • Week 5-8: 4 swaps each    │
│                                 │
│  ▼ Thinking                     │
│  ┌─────────────────────────────┐│
│  │ • Barbell → dumbbell swap  ││
│  │ • 12 exercises found       ││
│  │ • Same movement patterns   ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐ │
│  │  Change  │  │  Looks Good  │ │
│  └──────────┘  └──────────────┘ │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Or type to modify...     [→]││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Notes:**
- Week sidebar HIDDEN - full focus on AI conversation
- Auto-expands when AI proposes block-wide changes
- [⤡ Back to Plan] returns to sidebar view
- TEXT SUMMARY format - no inline diff (too many changes)
- User can type modifications before approving

---

## Success State (After Approval)

User approved changes. Show confirmation and next actions.

```
Desktop/Mobile (same pattern):

┌─────────────────────────────────┐
│ [⤡ Back]        AI Assistant    │
├─────────────────────────────────┤
│  ...previous conversation...    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ✅ Done! 12 exercises updated  │
│     across weeks 1-8.           │
│                                 │
│     Your plan now uses          │
│     dumbbells throughout.       │
│                                 │
│  ┌─────────────────────────────┐│
│  │    [View Plan]  [New Chat]  ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Type a message...        [→]││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Notes:**
- [View Plan] = collapse & return to plan
- User can continue chatting for more changes

---

## Component Sizes

### Desktop

| Component | Size | Notes |
|-----------|------|-------|
| Week Sidebar | 240-280px | Fixed width |
| AI Sidebar | 360-400px | When in sidebar mode |
| AI Expanded | Full width | Week sidebar hidden |
| Main Content | Flexible | min 480px |
| Exercise Card | Full width | 64-80px height |

### Mobile

| Component | Size | Notes |
|-----------|------|-------|
| Header | 56px | Fixed |
| Week Selector | Full width | 72px height |
| Day Pills | 44px height | Horizontally scrollable |
| Exercise Card | Full width | 56-64px height |
| AI Drawer | 70% screen | Expandable to full |
| AI Full Screen | 100% screen | Block-wide proposals |
| FAB | 56px × 56px | Bottom right |
| Touch targets | Min 44px × 44px | iOS/Android guidelines |

---

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI CHAT STATE MACHINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DESKTOP:                                                        │
│                                                                  │
│  [Closed] ──click ✨──▶ [Sidebar] ──click ⤢──▶ [Expanded]       │
│     ▲                      │  ▲                    │             │
│     │                      │  │                    │             │
│     └──────click ×─────────┘  └────click ⤡─────────┘             │
│                               or approve/dismiss                 │
│                                                                  │
│  Auto-expand trigger: Block-wide proposal                        │
│                                                                  │
│  MOBILE:                                                         │
│                                                                  │
│  [Closed] ──tap FAB──▶ [Drawer 70%] ──tap ⤢──▶ [Full Screen]    │
│     ▲                      │  ▲                      │           │
│     │                      │  │                      │           │
│     └────swipe down────────┘  └──────tap ⤡───────────┘           │
│                               or approve/dismiss                 │
│                                                                  │
│  Auto-expand trigger: Block-wide proposal                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Proposal Display Rules

**Core Principle:** Inline diff only makes sense when user can SEE the thing being changed.

### Decision Matrix

| Change Scope | Sessions Affected | User's View | Display Mode | Inline Diff? |
|--------------|-------------------|-------------|--------------|--------------|
| **Exercise/Set** | 1 (current) | Same session | Direct inline | ✅ Yes |
| **Session (same)** | 1 (current) | Same session | Direct inline | ✅ Yes |
| **Session (cross)** | 1 (other) | Different session | Summary + collapsed preview | ⚠️ On expand only |
| **Week (2-4 sessions)** | 2-4 | One session | Grouped summary | ⚠️ Current session only |
| **Week (field changes)** | 2-4 (many fields) | One session | Summary + text diff | ❌ No |
| **Block** | 5+ | Any | Text summary only | ❌ No |

---

### Rule 1: Same-Context → Inline Diff

User is viewing the thing being changed. Show inline diff directly.

**Example:** User viewing Monday, asks "Add warm-up set"

```
┌─────────────────────────────────────────────────────────────────┐
│  AI SIDEBAR/DRAWER                                              │
│  ───────────────────────────────────────────────────────────── │
│  🤖 Adding 1 warm-up set                        [Apply ✓]      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  EXERCISE LIST (user is viewing this)                           │
│  ───────────────────────────────────────────────────────────── │
│  ▼ Bench Press                                            🤖   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │ ➕ 1  │ 10x │ 30kg │               NEW (warm-up)       │   │  ← User SEES this
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│    ○ 2  │ 10x │ 60kg │                                        │
│    ○ 3  │  8x │ 70kg │                                        │
└─────────────────────────────────────────────────────────────────┘

✅ Inline diff shown - user has direct visual context
```

---

### Rule 2: Cross-Context (Different Session) → Summary + Preview

User viewing different session than what's being changed. Cannot see inline diff anyway.

**Example:** User viewing Monday, asks "Add pull-ups to Wednesday"

```
┌─────────────────────────────────────────────────────────────────┐
│  AI SIDEBAR/DRAWER                                              │
│  ───────────────────────────────────────────────────────────── │
│  👤 Add pull-ups to Wednesday                                   │
│                                                                 │
│  🤖 I'll add Pull-ups to Wednesday's workout.                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🤖 Wednesday: Pull Day                                     │ │
│  │    +1 exercise                          [Change] [Apply]  │ │
│  │ ─────────────────────────────────────────────────────────-│ │
│  │ ▶ Preview changes                                         │ │  ← Collapsed by default
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

User taps "▶ Preview changes":

│  │ ▼ Preview changes                                         │ │
│  │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ │
│  │ │  Wednesday: Pull Day                                  │ │ │
│  │ │  ─────────────────────                                │ │ │
│  │ │  1. Lat Pulldown      3×12                            │ │ │
│  │ │  2. Seated Row        3×12                            │ │ │
│  │ │  ➕ Pull-ups          3×10              NEW           │ │ │  ← Preview in drawer
│  │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │ │
│  │ [Jump to Wednesday]                                       │ │
│  └───────────────────────────────────────────────────────────┘ │

⚠️ Inline diff shown in PREVIEW only (not in main exercise list)
⚠️ User can approve from here OR jump to see in context
```

---

### Rule 3: Multi-Session Week Changes → Grouped Summary

Changes span multiple sessions. Show grouped list, expand one at a time.

**Example:** User asks "Add planks to every workout this week"

```
┌─────────────────────────────────────────────────────────────────┐
│  AI SIDEBAR/DRAWER                                              │
│  ───────────────────────────────────────────────────────────── │
│  👤 Add planks to every workout this week                       │
│                                                                 │
│  🤖 Adding planks to all 4 sessions in Week 2.                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🤖 4 sessions · +4 exercises            [Change] [Apply]  │ │
│  │ ─────────────────────────────────────────────────────────-│ │
│  │ ▶ Monday: Push Day                                   +1   │ │  ← Collapsed
│  │ ▶ Wednesday: Pull Day                                +1   │ │  ← Collapsed
│  │ ▶ Friday: Legs                                       +1   │ │  ← Collapsed
│  │ ▶ Saturday: Arms                                     +1   │ │  ← Collapsed
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

User expands Monday (currently viewing Monday):

│  │ ▼ Monday: Push Day                                   +1   │ │
│  │   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ │
│  │   │ ➕ Plank  3×60s                             NEW   │ │ │  ← Shows preview
│  │   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │ │
│  │ ▶ Wednesday: Pull Day                                +1   │ │  ← Others stay collapsed
│  │ ▶ Friday: Legs                                       +1   │ │
│  │ ▶ Saturday: Arms                                     +1   │ │

⚠️ Current session can show inline diff in main list
⚠️ Other sessions show preview in drawer only
⚠️ Prevents overwhelming user with 4 inline diffs
```

**What user sees in main exercise list (Monday):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Monday: Push Day                                          🤖   │
│  ─────────────────────────────────────────────────────────────  │
│  1. Bench Press       3×10 @ 60kg                               │
│  2. Incline Press     3×12 @ 50kg                               │
│  3. Cable Flyes       3×15                                      │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │ ➕ Plank            3×60s                          NEW   │  │  ← Inline for CURRENT only
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Rule 4: Week-Level Field Changes → Text Diff Summary

Many field-level changes across sessions. Too many for inline diff.

**Example:** User asks "Make this week a deload - reduce volume by 40%"

```
┌─────────────────────────────────────────────────────────────────┐
│  AI SIDEBAR/DRAWER                                              │
│  ───────────────────────────────────────────────────────────── │
│  👤 Make this week a deload - reduce volume by 40%              │
│                                                                 │
│  🤖 I'll reduce volume by 40% across all Week 2 sessions.       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🤖 Week 2 Deload                        [Change] [Apply]  │ │
│  │    12 updates · 3 sessions                                │ │
│  │ ─────────────────────────────────────────────────────────-│ │
│  │ Summary: -40% volume                                      │ │
│  │ ─────────────────────────────────────────────────────────-│ │
│  │ ▶ Monday (4 updates)                                      │ │
│  │ ▶ Wednesday (4 updates)                                   │ │
│  │ ▶ Friday (4 updates)                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

User expands Monday:

│  │ ▼ Monday (4 updates)                                      │ │
│  │   • Bench Press: 3×10 → 2×6                               │ │  ← TEXT diff, not inline
│  │   • Incline Press: 3×12 → 2×8                             │ │
│  │   • Cable Flyes: 3×15 → 2×10                              │ │
│  │   • Tricep Pushdowns: 3×12 → 2×8                          │ │
│  │ ▶ Wednesday (4 updates)                                   │ │
│  │ ▶ Friday (4 updates)                                      │ │

❌ NO inline diff in exercise list
✅ Text summary shows what's changing
⚠️ Why? 12 inline changes = overwhelming
```

---

### Rule 5: Block-Wide Changes → Text Summary Only

Too many changes across too many weeks. Impossible to show inline.

**Example:** User asks "Replace all barbell exercises with dumbbells"

```
┌─────────────────────────────────────────────────────────────────┐
│  AI EXPANDED (FULL SCREEN/WIDTH)                                │
│  ───────────────────────────────────────────────────────────── │
│  👤 Replace all barbell exercises with dumbbells                │
│                                                                 │
│  🤖 I'll replace 12 barbell exercises across your 8-week        │
│     training block:                                             │
│                                                                 │
│     Summary of changes:                                         │
│     ─────────────────────                                       │
│     • Week 1: 4 swaps                                           │
│       - Bench Press → DB Bench Press                            │
│       - Barbell Row → DB Row                                    │
│       - Barbell Curl → DB Curl                                  │
│       - Back Squat → Goblet Squat                               │
│     • Week 2: 4 swaps (same exercises)                          │
│     • Week 3: 4 swaps                                           │
│     • Week 4 (Deload): No barbell exercises - no changes        │
│     • Week 5-8: 4 swaps each                                    │
│                                                                 │
│     This keeps your program structure identical.                │
│                                                                 │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │         [Make Changes]       [Looks Good ✓]             │ │
│     └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

❌ NO inline diff anywhere
✅ Text summary only
✅ Auto-expands to full screen (more room for summary)
⚠️ Why? 12+ exercises across 8 weeks = impossible to show inline
```

---

### Mobile-Specific Rules

Mobile has less screen space. Additional constraints:

| Change Scope | Mobile Display | Notes |
|--------------|----------------|-------|
| Same-session (1-3 changes) | Drawer (70%) + inline in list | User can see both |
| Same-session (4+ changes) | Drawer (70%) with summary, tap "View All" → full screen | Prevents cramped UI |
| Cross-session (1 session) | Drawer (70%) with summary + collapsed preview | No inline in list |
| Week-level (2-4 sessions) | Drawer (70%) with grouped summary | Expand one at a time |
| Block-wide | Auto full screen | Text summary only |

**Mobile Example: 4+ changes in same session**

```
┌─────────────────────────────────┐
│ Week 2 · Monday         [···]   │
│ ░░░░░ (dimmed) ░░░░░░░░░░░░░░░ │
├─────────────────────────────────┤
│ ─────                      [⤢]  │
│                                 │
│ 🤖 Adjusting Bench Press        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🤖 5 changes                │ │
│ │    Bench Press              │ │
│ │ ───────────────────────────-│ │
│ │ • Set 1: 60 → 55kg          │ │  ← Text summary (not inline)
│ │ • Set 2: 70 → 65kg          │ │
│ │ • Set 3: 75 → 70kg          │ │
│ │ • +2 new sets               │ │
│ │                             │ │
│ │ [View in Plan]              │ │  ← Opens full screen with inline
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────────┐  ┌──────────────┐ │
│ │  Change  │  │    Apply     │ │
│ └──────────┘  └──────────────┘ │
└─────────────────────────────────┘

⚠️ 5 changes = too many for inline in cramped drawer
✅ Show text summary, offer "View in Plan" to see inline
```

---

### Summary: When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISPLAY MODE DECISION TREE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Is change in session user is currently viewing?                 │
│  ├── YES: How many changes?                                      │
│  │   ├── 1-3 changes → ✅ INLINE DIFF in exercise list          │
│  │   └── 4+ changes  → ⚠️ Summary in drawer, inline optional    │
│  │                                                               │
│  └── NO: How many sessions affected?                             │
│      ├── 1 session (cross-context)                               │
│      │   └── Summary + collapsible preview in drawer             │
│      │                                                           │
│      ├── 2-4 sessions (week-level)                               │
│      │   ├── Simple additions → Grouped summary, expand each    │
│      │   └── Field changes    → Text diff summary               │
│      │                                                           │
│      └── 5+ sessions (block-wide)                                │
│          └── ❌ TEXT SUMMARY ONLY (auto-expand full screen)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Plan Creation → Post-Creation Flow

After AI generates a new plan, user goes directly to the unified plan page with AI sidebar open.

**Decision:** Skip separate "overview" page. User lands on the actual plan with AI ready to help refine.

### Post-Creation State (Desktop & Mobile)

```
DESKTOP:
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back    8-Week Strength Program                                                          [✨ AI]   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌─────────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  WEEK SIDEBAR  │  │  Week 1: Jan 6 - Jan 12                  │  │  AI Assistant       [⤢] [×]  │ │
│  │  ────────────  │  │                                          │  │                                │ │
│  │                │  │  [Mon] [Wed] [Fri] [Sat]                  │  │  🎉 Your 8-week strength       │ │
│  │  ● Week 1 NOW  │  │   ●                                       │  │     program is ready!          │ │
│  │  ○ Week 2      │  │                                          │  │                                │ │
│  │  ○ Week 3      │  │  ┌────────────────────────────────────┐  │  │  📊 4 days/week · 32 sessions  │ │
│  │  ○ Week 4 ▽    │  │  │  Monday: Push Day                   │  │  │                                │ │
│  │  ○ Week 5      │  │  │                                     │  │  │  Want to make any changes?     │ │
│  │  ○ Week 6      │  │  │  1  Bench Press      3×8 @ 60kg    │  │  │                                │ │
│  │  ○ Week 7      │  │  │  2  Incline Press    3×10 @ 50kg   │  │  │  Try:                          │ │
│  │  ○ Week 8      │  │  │  3  Cable Flyes      3×12          │  │  │  • "I only have dumbbells"    │ │
│  │                │  │  │  4  Tricep Pushdowns 3×12          │  │  │  • "Add more leg exercises"   │ │
│  │                │  │  └────────────────────────────────────┘  │  │  • "Make Week 4 easier"       │ │
│  │                │  │                                          │  │                                │ │
│  │                │  │                                          │  │  ┌────────────────────────┐   │ │
│  │                │  │                                          │  │  │ Type a message...      │   │ │
│  │                │  │                                          │  │  └────────────────────────┘   │ │
│  └────────────────┘  └─────────────────────────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

MOBILE:
┌─────────────────────────────────┐
│ ← 8-Week Strength       [⚙] [✨]│
├─────────────────────────────────┤
│  Week 1 · Jan 6-12         [v]  │
│  [Mon] [Wed] [Fri] [Sat]        │
│   ●                             │
│  ┌─────────────────────────────┐│
│  │  Monday: Push Day           ││
│  │  1  Bench Press   3×8@60kg  ││
│  │  2  Incline Press 3×10@50kg ││
│  │  ...                        ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│ ─────                      [⤢]  │  ← AI drawer auto-opens
│ 🎉 Your plan is ready!          │
│                                 │
│ 📊 4 days/week · 32 sessions    │
│                                 │
│ Want to change anything?        │
│ • "I only have dumbbells"       │
│ • "Add more leg exercises"      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Type a message...        [→]│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Notes:
- AI sidebar/drawer auto-opens after plan creation
- User sees actual plan immediately (not a summary page)
- AI provides suggestions for common adjustments
- User can close AI and browse, or refine immediately
- Week 4 shows ▽ indicator (deload week)
```

---

## SetRow Field System

### Field Categories

Fields are organized into **Default** (always shown) and **Advanced** (toggle-controlled):

| Category | Fields | When Visible |
|----------|--------|--------------|
| **Default** | reps, weight, duration, restTime | Always (exercise-type dependent) |
| **Advanced** | RPE, tempo, velocity, power, effort | When [Advanced ●] toggle is ON |

### Default View (Most Users)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ○ 1   │ [10x] │ [60kg] │ [90s rest] │                        [✓]  │
│  ○ 2   │ [8x]  │ [70kg] │ [90s rest] │                        [✓]  │
└─────────────────────────────────────────────────────────────────────┘

✅ Clean, simple - perfect for Sarah, Emma, Robert
✅ Shows only exercise-appropriate fields
```

### Advanced View (Power Users: Marcus, Priya)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  ○ 1   │ [10x] │ [60kg] │ [RPE 7] │ [3-1-2-0] │ [90s rest] │                    [✓] │
│  ○ 2   │ [8x]  │ [70kg] │ [RPE 8] │ [3-1-2-0] │ [90s rest] │                    [✓] │
└───────────────────────────────────────────────────────────────────────────────────────┘
                           └───────── Advanced fields ─────────┘

✅ Marcus: "Block-wide changes! I can see exactly what AI is changing"
✅ Priya: "I want to see ALL training variables"
⚠️ Horizontal scroll on mobile when many fields
```

### Advanced Toggle Location

```
DESKTOP HEADER:
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back    8-Week Strength Program              [Advanced ○]  [Edit Block]  [✨ AI]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                      ↑
                                            Toggle in main header
                                            ○ = OFF (default)
                                            ● = ON (shows RPE, tempo, etc.)

MOBILE (via settings sheet):
┌─────────────────────────────────────┐
│ ← 8-Week Strength           [⚙] [✨]│  ← Tap ⚙ to open settings
├─────────────────────────────────────┤
│  Settings                           │
│  ───────────────────────────────── │
│  Show Advanced Fields        [○ ●] │  ← Toggle here
│  (RPE, tempo, velocity...)          │
└─────────────────────────────────────┘
```

**Notes:**
- Toggle persists across sessions (localStorage)
- Default is OFF for new users
- Does NOT affect AI proposals - AI always knows all fields

### AI Change Display for Fields

When AI proposes field changes, individual pills get highlighted:

```
Unchanged field:     [10x]           (gray bg)
Changed field:       [60 → 65 kg]    (amber bg, shows old→new)
New field:           [RPE 8]         (emerald bg, dashed border)
Removed field:       [9̶0̶s̶ ̶r̶e̶s̶t̶]      (red bg, strikethrough)
```

### Inline Diff Density Rules

**Problem:** Too many inline `old → new` diffs create visual chaos.

**Solution:** Threshold-based simplification based on change density.

| Scenario | Display Mode | Example |
|----------|--------------|---------|
| **1-2 fields × 1-2 sets** | Full inline diff | `[60 → 65 kg]` in each pill |
| **3+ fields OR 3+ sets** | Summary card + highlight-only | Summary above, pills just highlighted |
| **Deload/volume changes** | Text summary only | Already covered in Display Rules |

#### Low Density (Full Inline Diff)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ▼ Bench Press                                                 🤖   │
├─────────────────────────────────────────────────────────────────────┤
│  ○ 1   │ [10x] │ [60 → 65 kg] │ [90s rest] │                  [✓]  │
│  ○ 2   │ [10x] │ [65 → 70 kg] │ [90s rest] │                  [✓]  │
└─────────────────────────────────────────────────────────────────────┘

✅ 2 sets × 1 field = 2 changes → Full inline diff OK
```

#### High Density (Summary Card + Highlight Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Adjusting Bench Press                      [Change] [Apply]     │
│     3 sets · weight -5kg, reps +2, rest -30s                       │
├─────────────────────────────────────────────────────────────────────┤
│  ▼ Bench Press                                                 🤖   │
├─────────────────────────────────────────────────────────────────────┤
│  ○ 1   │ [12x] │ [55kg] │ [60s] │                              [✓]  │
│        │ amber │ amber  │ amber │  ← highlight only, no old→new    │
│  ○ 2   │ [12x] │ [60kg] │ [60s] │                              [✓]  │
│  ○ 3   │ [10x] │ [65kg] │ [60s] │                              [✓]  │
└─────────────────────────────────────────────────────────────────────┘

⚠️ 3 sets × 3 fields = 9 changes → Summary card + highlight only
✅ User sees WHAT changed (summary) without visual overload
✅ Tapping a set could expand to show full diff (progressive disclosure)
```

#### Mobile: Even Stricter Threshold

On mobile, use summary card for 2+ fields OR 2+ sets:

```
┌─────────────────────────────────┐
│ 🤖 Bench Press: 3 sets adjusted │
│    -5kg, +2 reps   [Apply]      │
├─────────────────────────────────┤
│ ○ 1 │ [12x] [55kg] [60s] │ [✓] │
│       amber  amber  amber       │
│ ○ 2 │ [12x] [60kg] [60s] │ [✓] │
│ ○ 3 │ [10x] [65kg] [60s] │ [✓] │
└─────────────────────────────────┘
```

#### Progressive Disclosure: [View Details]

**Key Decision:** Summary + highlight is the DEFAULT. Power users can expand.

For Marcus (granular control) and Priya (audit everything), add expand option:

```
DEFAULT (collapsed) - for Sarah, Emma, Robert:
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Adjusting Bench Press                  [Change] [Apply All]     │
│     3 sets · weight -5kg, reps +2, rest -30s                       │
│                                             [▼ View Details]       │
├─────────────────────────────────────────────────────────────────────┤
│  ○ 1   │ [12x] │ [55kg] │ [60s] │                            [✓]  │
│        │ amber │ amber  │ amber │  ← shows NEW values only        │
│  ○ 2   │ [12x] │ [60kg] │ [60s] │                            [✓]  │
│  ○ 3   │ [10x] │ [65kg] │ [60s] │                            [✓]  │
└─────────────────────────────────────────────────────────────────────┘

✅ Clean, scannable - busy users tap [Apply All] and move on
```

```
EXPANDED (user clicked [View Details]) - for Marcus, Priya:
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Adjusting Bench Press                  [Change] [Apply All]     │
│     3 sets · weight -5kg, reps +2, rest -30s                       │
│                                             [▲ Hide Details]       │
├─────────────────────────────────────────────────────────────────────┤
│  Set 1:  reps 10→12  ·  weight 60→55kg  ·  rest 90→60s            │
│  Set 2:  reps 10→12  ·  weight 65→60kg  ·  rest 90→60s            │
│  Set 3:  reps 10→10  ·  weight 70→65kg  ·  rest 90→60s            │
└─────────────────────────────────────────────────────────────────────┘

✅ Full audit trail - power users see exactly what's changing
```

**Persona Satisfaction:**
| Persona | Experience |
|---------|------------|
| Sarah | Summary + [Apply All] → Fast approval |
| Marcus | [View Details] → Full diff audit |
| Emma | Highlight-only → Not scary |
| Robert | Clean summary → Simple |
| Priya | [View Details] → Can verify everything |

#### Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│              SET-LEVEL INLINE DIFF DECISION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  How many fields changed per set?                                │
│  ├── 1-2 fields: How many sets affected?                         │
│  │   ├── 1-2 sets → ✅ Full inline diff `[old → new]`           │
│  │   └── 3+ sets  → ⚠️ Summary card + highlight-only pills      │
│  │                                                               │
│  └── 3+ fields: Always use summary card                          │
│      └── ⚠️ Summary card + highlight-only pills                 │
│                                                                  │
│  MOBILE: Stricter - use summary for 2+ fields OR 2+ sets        │
│                                                                  │
│  ALL SUMMARY CARDS: Include [View Details] for power users       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Persona Satisfaction Check

| Persona | Key Need | How We Satisfy |
|---------|----------|----------------|
| **Sarah** | Fast, not extra work | Summary card = quick scan, one-tap approve |
| **Marcus** | See exactly what's changing | [View Details] expands full diff |
| **Emma** | Not overwhelming | Summary by default, clean highlight-only |
| **Priya** | Audit every modification | [View Details] shows all field changes |

**Not targeted:** Robert (won't use AI features anyway)

---

## SetRow AI Display States

The SetRow component shows inline diffs for AI proposals. Here are all visual states:

### Normal State (No AI Changes)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ○ 1   │ 10x │ 60kg │ 90s rest │                              [✓]  │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Circle = set number (not completed)
- Fields shown based on exercise type
- [✓] = completion toggle
```

### Completed State

```
┌─────────────────────────────────────────────────────────────────────┐
│  ● 1   │ 10x │ 60kg │ 90s rest │                     ░░░░░░░  [✓]  │
└─────────────────────────────────────────────────────────────────────┘
  green    ─────green background─────                   progress bar

Notes:
- Filled circle = completed
- Green tint on row and fields
- Progress bar fills in exercise card
```

### AI UPDATE Proposal (Field-Level Diff)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ◉ 1   │ 10x │ ┌──────────────┐ │ 90s rest │              🤖  [✓]  │
│  🤖    │     │ │ 60 → 65 kg   │ │          │                       │
│        │     │ └──────────────┘ │          │                       │
│        │     │   amber bg        │          │                       │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- 🤖 badge on set number
- Changed field has amber/yellow background
- Shows "old → new" inline
- Rest of row unchanged
```

### AI UPDATE Proposal (Multiple Fields)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ◉ 1   │ ┌──────────┐ │ ┌──────────────┐ │ 90s rest │     🤖  [✓]  │
│  🤖    │ │ 10 → 12x │ │ │ 60 → 55 kg   │ │          │              │
│        │ └──────────┘ │ └──────────────┘ │          │              │
│        │  amber bg     │   amber bg       │          │              │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Multiple fields can be highlighted
- Each changed field shows inline diff
- Unchanged fields appear normal
```

### AI DELETE Proposal (Set Removal)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         red background / strikethrough              │
│  ✕ 3̶   │ 1̶0̶x̶ │ 6̶0̶k̶g̶ │ 9̶0̶s̶ ̶r̶e̶s̶t̶ │                         🤖  [✓]  │
│  🤖    │     │      │          │              REMOVING              │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Red/pink background
- Strikethrough on all content
- "REMOVING" label
- 🤖 badge indicates AI proposal
```

### AI CREATE Proposal (Ghost Row - New Set)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                         emerald dashed border                       │
│  ➕ 4   │ 8x │ 70kg │ 90s rest │                              NEW   │
│        │    │      │          │                            emerald  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Notes:
- Dashed border (not solid)
- Emerald/green tint
- ➕ instead of number
- "NEW" badge
- Read-only (can't edit until approved)
```

### Multiple AI Changes in ExerciseCard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🤖 3 changes                            [Change] [Apply]   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                         ↑ Proposal bar at top                       │
│                                                                     │
│  ▼ Bench Press                                             🤖 [●]  │
│  ───────────────────────────────────────────────────────────────   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ○ 1   │ 10x │ ┌──────────┐ │ 90s │                   [✓]  │   │
│  │        │     │ │60 → 65kg │ │     │                        │   │
│  │        │     │ └──────────┘ │     │                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ○ 2   │ ┌────────┐ │ 60kg │ 90s │                    [✓]  │   │
│  │        │ │10 → 12x│ │      │     │                         │   │
│  │        │ └────────┘ │      │     │                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  ➕ 3   │ 8x │ 70kg │ 60s │                          NEW   │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                                     │
│  [+ Add Set]                                                        │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Proposal bar shows total change count
- 🤖 badge on exercise header shows pending changes
- Individual sets show their specific change type
- Ghost row for new set at bottom
- [Change] = request modifications
- [Apply] = approve all changes
```

### Exercise SWAP Proposal

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🤖 1 swap                               [Change] [Apply]   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    blue background                           │   │
│  │  ❌ Bench Press  →  ✅ DB Bench Press               🤖 SWAP │   │
│  │     ───────────      ─────────────────                       │   │
│  │     strikethrough    blue highlight                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ○ 1   │ 10x │ 60kg │ 90s │                                  [✓]  │
│  ○ 2   │ 10x │ 60kg │ 90s │                                  [✓]  │
│  ○ 3   │ 10x │ 60kg │ 90s │                                  [✓]  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Exercise header shows "Old → New" with arrow
- Blue background for swap indicator
- Sets unchanged (just the exercise swap)
- SWAP badge
```

### Exercise ADD Proposal (Ghost Exercise)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                     emerald dashed border                           │
│                                                                     │
│  ➕ Plank                                             🤖 NEW  [●]  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  ➕ 1   │ 60s │      │      │                              │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  ➕ 2   │ 60s │      │      │                              │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  ➕ 3   │ 60s │      │      │                              │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                                     │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Notes:
- Entire card has dashed border
- Emerald/green tint throughout
- ➕ on exercise and all sets
- "NEW" badge on exercise header
- Read-only until approved
```

### Exercise DELETE Proposal

```
┌─────────────────────────────────────────────────────────────────────┐
│                         red background                              │
│                                                                     │
│  ✕ L̶a̶t̶ ̶P̶u̶l̶l̶d̶o̶w̶n̶                                      🤖 REMOVING  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ✕ 1̶   │ 1̶0̶x̶ │ 4̶0̶k̶g̶ │ 6̶0̶s̶ │                                       │
│  ✕ 2̶   │ 1̶0̶x̶ │ 4̶0̶k̶g̶ │ 6̶0̶s̶ │                                       │
│  ✕ 3̶   │ 1̶0̶x̶ │ 4̶0̶k̶g̶ │ 6̶0̶s̶ │                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Red/pink background
- Strikethrough on exercise name
- Strikethrough on all sets
- "REMOVING" badge
- ✕ replaces numbers
```

---

## AI Color Legend

| State | Background | Text | Border | Badge |
|-------|------------|------|--------|-------|
| **UPDATE** | `amber-50` / `amber-900/10` | `amber-700` / `amber-400` | - | 🤖 amber |
| **ADD/CREATE** | `emerald-50` / `emerald-900/10` | `emerald-700` / `emerald-400` | dashed emerald | ➕ NEW |
| **REMOVE/DELETE** | `red-50` / `red-900/10` | `red-700` / `red-400` | - | ✕ REMOVING |
| **SWAP** | `blue-50` / `blue-900/10` | `blue-700` / `blue-400` | - | 🤖 SWAP |

---

## Flow: Plan Creation → Overview → Refinement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLAN CREATION → REFINEMENT FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   Wizard     │────▶│   Overview   │────▶│   Unified Plan Page          │ │
│  │   /new       │     │   Summary    │     │   /plans/[id]                │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────────┘ │
│                              │                         │                     │
│                              │                         ▼                     │
│                              │              ┌──────────────────────────────┐ │
│                              │              │  AI Sidebar Open             │ │
│                              └─────────────▶│  "What would you like to     │ │
│                                click        │   change about your plan?"   │ │
│                              [Refine AI]    └──────────────────────────────┘ │
│                                                         │                    │
│                                                         ▼                    │
│                                             ┌──────────────────────────────┐ │
│                                             │  User: "I only have          │ │
│                                             │         dumbbells"           │ │
│                                             │                              │ │
│                                             │  AI: Proposes block-wide     │ │
│                                             │      equipment swap          │ │
│                                             └──────────────────────────────┘ │
│                                                         │                    │
│                                                         ▼                    │
│                                             ┌──────────────────────────────┐ │
│                                             │  [Expanded View]             │ │
│                                             │  Text summary of 24 swaps    │ │
│                                             │  across 8 weeks              │ │
│                                             │                              │ │
│                                             │  [Make Changes] [Looks Good] │ │
│                                             └──────────────────────────────┘ │
│                                                         │                    │
│                                            approve      │                    │
│                                                         ▼                    │
│                                             ┌──────────────────────────────┐ │
│                                             │  ✅ Plan updated!            │ │
│                                             │  [View Plan] [New Chat]      │ │
│                                             └──────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
