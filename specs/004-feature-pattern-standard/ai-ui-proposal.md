# AI Session Assistant: UI/UX Design Specification

**Feature**: 002-ai-session-assistant + 004-feature-pattern-standard
**Created**: 2025-12-25
**Status**: Draft - Awaiting Review
**Author**: AI Analysis with User Input

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Industry Best Practices](#industry-best-practices)
4. [User Stories](#user-stories)
5. [Design Decisions](#design-decisions)
6. [Pending Changes Display](#pending-changes-display)
7. [Responsive Design](#responsive-design)
8. [Lo-Fi Mockups](#lo-fi-mockups)
9. [Implementation Priority](#implementation-priority)
10. [Technical Requirements](#technical-requirements)

---

## Executive Summary

This document defines the UI/UX approach for the AI Session Assistant across both **Athlete Workout** and **Coach Session Planning** contexts. The design prioritizes:

- **Lean & Minimal**: Clean interface that doesn't overwhelm
- **Mobile-First**: Touch-optimized with responsive scaling to tablet/desktop
- **Explicit Approval**: All AI changes require user confirmation (no auto-confirm)
- **Voice-Enabled**: OpenAI dictation support for hands-free logging
- **Inline Changes**: Pending modifications shown directly on exercise cards

### Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auto-confirm | **NO** - All changes require approval | User control, prevent errors |
| Chat Style | **Drawer** (mobile/tablet), **Side Panel** (desktop) | Screen-appropriate layouts |
| Voice Input | **Required** (OpenAI dictation) | Hands-free workout logging |
| Change Preview | **Inline on cards** with `old→new` values | Minimal UI, no extra rows |
| Approval Level | **Batch only** via banner/panel | No inline row buttons - cleaner UI |
| Card Layout | **Single column** across all breakpoints | Consistent, simple layout |

---

## Current State Analysis

### Implemented Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| SessionAssistant | `components/features/ai-assistant/SessionAssistant.tsx` | ✅ Complete | Main orchestration with ChangeSet |
| ChatDrawer | `components/features/ai-assistant/ChatDrawer.tsx` | ✅ Complete | 85% height bottom sheet (Vaul) |
| ApprovalBanner | `components/features/ai-assistant/ApprovalBanner.tsx` | ✅ Complete | Expand/collapse, batch approval |
| ChangePreview | `components/features/ai-assistant/ChangePreview.tsx` | ✅ Complete | Individual change display |
| Athlete Integration | `components/features/training/` | ❌ Missing | AI not connected to workout |

### ChangeSet Library

Located at `lib/changeset/`:
- `types.ts` - ChangeSet, ChangeRequest definitions
- `ChangeSetContext.tsx` - React context for buffer
- `tool-handler.ts` - Routes AI tool calls
- `execute.ts` - Atomic database mutations
- `tools/` - AI tool definitions (proposal, read, coordination)

---

## Industry Best Practices

### Research Sources

- [IntuitionLabs AI UI Comparison 2025](https://intuitionlabs.ai/articles/conversational-ai-ui-comparison-2025)
- [Sendbird Chatbot UI Examples](https://sendbird.com/blog/chatbot-ui)
- [Chatbot Best Practices 2025](https://springsapps.com/knowledge/top-10-chatbot-best-practices-in-2024)
- [Mobile UX Design Trends 2025](https://www.chopdawg.com/ui-ux-design-trends-in-mobile-apps-for-2025/)

### Key Principles

1. **Simplicity First**: "Keep it simple: Minimal layouts, clear spacing, and limited color palettes."
2. **Context Preservation**: Changes shown in context (inline) rather than separate views
3. **Batch Operations**: Group related changes for single approval
4. **Progressive Disclosure**: Show essential info first, details on demand
5. **Real-Time Feedback**: Streaming responses for perceived performance

### Platform Comparison

| Feature | ChatGPT | Claude | Kasoku Approach |
|---------|---------|--------|-----------------|
| Chat Layout | Simple + sidebar | Minimalist + Artifacts | Drawer (mobile) / Side panel (desktop) |
| Change Preview | Canvas side panel | Artifacts workspace | Inline on cards with `old→new` values |
| Approval | Accept/reject in canvas | Edit in artifacts | Batch banner only (Approve All) |
| Empty State | Suggestions grid | Example prompts | Context-aware suggestions |

---

## User Stories

### Athlete User Stories (Workout Logging)

| ID | User Story | AI Tool | Approval Required |
|----|------------|---------|-------------------|
| **A1** | "I did 100kg x 8 for bench" | `createTrainingSetChangeRequest` | Yes - tap to confirm |
| **A2** | "All sets felt easy, RPE 6" | `updateTrainingSetChangeRequest` (batch) | Yes - approve all |
| **A3** | "Skip the last set, I'm tired" | `createTrainingSetChangeRequest` (reps: 0) | Yes - confirm skip |
| **A4** | "What's my PR for squats?" | `getExerciseHistory` | No - read-only |
| **A5** | "Add notes: felt strong today" | `updateTrainingSessionChangeRequest` | Yes - confirm |

**Athlete Mental Model**:
- Quick logging during rest periods
- Voice/text input between sets
- **All changes require explicit approval** (tap confirm)
- Clear visual feedback of what was recorded vs pending

### Coach User Stories (Session Planning)

| ID | User Story | AI Tool | Approval Required |
|----|------------|---------|-------------------|
| **C1** | "Add 3 sets of face pulls" | `createExerciseChangeRequest` + `createSetChangeRequest` | Yes - batch |
| **C2** | "Swap squats for safety bar" | `updateExerciseChangeRequest` | Yes - batch |
| **C3** | "Reduce all sets by 1 rep" | `updateSetChangeRequest` (batch) | Yes - batch |
| **C4** | "Remove tricep pushdowns" | `deleteExerciseChangeRequest` | Yes - batch |
| **C5** | "Find posterior chain exercises" | `searchExercises` | No - read-only |

**Coach Mental Model**:
- Batch planning (multiple changes at once)
- Review all changes before committing
- Clear reasoning visibility (why this change?)
- Iterate quickly (regenerate with feedback)

---

## Design Decisions

### Decision 1: Pending Change Display (Minimal Inline)

**Question**: When AI proposes a set change, how do we show the diff?

**Answer**: Use **inline value highlighting** on the same row - no separate pending row to avoid UI bloat.

```
SINGLE ROW with inline diff:
┌────────────────────────────────────────────────────┐
│ Set 2 │ 8→10   │ 80→85 │ RPE 8 │  🤖              │  ← amber tint, changed values highlighted
└────────────────────────────────────────────────────┘
```

For new sets (athlete logging actual performance):
```
┌────────────────────────────────────────────────────┐
│ Set 2 │  10    │  85   │ RPE 8 │  🤖 pending      │  ← amber tint, "pending" badge
└────────────────────────────────────────────────────┘
```

**Rationale**:
- **Minimal UI bloat** - no extra rows
- Changed values show `old→new` inline
- Small 🤖 icon indicates AI-proposed
- Batch approval only (no row-level buttons)

### Decision 2: Responsive Layout Strategy

**Question**: How do iPad/desktop differ from mobile?

**Answer**: Same components, different layout based on screen width.

| Breakpoint | Chat Interface | Session View | Change Preview |
|------------|----------------|--------------|----------------|
| **Mobile** (<640px) | Bottom drawer 85% | Full width | Inline pending rows |
| **Tablet** (640-1024px) | Bottom drawer 70% | Full width | Inline pending rows |
| **Desktop** (>1024px) | Right side panel 400px | Remaining width | Inline + summary panel |

### Decision 3: Voice Input Integration

**Requirement**: OpenAI dictation support for athletes.

**Implementation**:
```tsx
// Voice button in input area
<div className="flex gap-2">
  <Input placeholder="Log your set..." />
  <VoiceButton
    onTranscript={(text) => sendMessage(text)}
    provider="openai-whisper"
  />
  <Button type="submit"><Send /></Button>
</div>
```

**Voice Flow**:
1. Tap microphone button
2. Speak: "I did 80 kilos for 8 reps, felt hard"
3. OpenAI transcribes → AI parses → Shows pending change
4. User taps confirm on pending row

### Decision 4: Approval Flow (Batch Only)

**Requirement**: No auto-confirm. All changes require explicit approval via banner.

**All Changes (Single or Multiple)**:
- Pending changes shown inline with visual indicators (amber tint, 🤖 icon)
- **No row-level approve/reject buttons** - keeps UI clean
- Sticky banner shows: "X Changes Pending"
- "Approve All" applies all changes atomically
- "Dismiss" clears all pending changes
- "Regenerate" asks AI to try different approach

**Why batch-only**:
- Simpler, less cluttered UI
- Faster workflow (one tap to approve all)
- Atomic transactions (all-or-nothing is safer)
- Users can always dismiss and re-ask if they want partial changes

---

## Pending Changes Display

### Approach: Minimal Inline Indicators

Changes display **inline on existing rows** with subtle visual treatment. No extra rows, no inline buttons.

### Set Update (Athlete Logging)

```
EXERCISE CARD: Bench Press                         🤖 1 pending
├─────────────────────────────────────────────────────┤
│ Set │ Reps │ Weight │ RPE │ Status                  │
├─────────────────────────────────────────────────────┤
│  1  │  8   │  80kg  │  7  │ ✓ Completed             │
├─────────────────────────────────────────────────────┤
│  2  │  8   │  85kg  │  8  │ 🤖 pending              │  ← amber tint, AI badge
├─────────────────────────────────────────────────────┤
│  3  │  8   │  80kg  │  -  │ ○ Planned               │
└─────────────────────────────────────────────────────┘

Approve via banner only - no inline buttons
```

### Exercise Swap (Coach Planning)

```
EXERCISE CARD: [SWAP] Back Squats → Safety Bar Squats
┌─────────────────────────────────────────────────────┐
│ ↻ Back Squats → Safety Bar Squats          [SWAP]  │  ← blue header
│   "Easier on shoulders while maintaining..."        │
├─────────────────────────────────────────────────────┤
│ Set │ Reps │ Weight │ RPE │ Rest │                  │
│  1  │  8   │  80kg  │  7  │ 2min │  (preserved)     │
│  2  │  8   │  85kg  │  8  │ 2min │                  │
└─────────────────────────────────────────────────────┘
Border: blue-200, subtle animation on entry
```

### Exercise Add (Coach Planning)

```
NEW EXERCISE CARD (dashed green border):
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ [+] Face Pulls                              [NEW]  │  ← green header
│     "Added for shoulder health and posture"        │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ Set │ Reps │ Weight │ Rest │                       │
│  1  │  15  │  20kg  │ 60s  │                       │
│  2  │  15  │  20kg  │ 60s  │                       │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
Border: dashed green-200, bg: green-50/30
```

### Exercise Remove (Coach Planning)

```
REMOVED EXERCISE CARD (faded, red accent):
┌─────────────────────────────────────────────────────┐
│ [−] Tricep Pushdowns                     [REMOVE]  │  ← red header, opacity 60%
│     "Removed to reduce session volume"             │
├─────────────────────────────────────────────────────┤
│ Set │ Reps │ Weight │ Rest │                       │
│  1  │  12  │  40kg  │ 90s  │ ̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶̶          │  ← strikethrough
│  2  │  12  │  40kg  │ 90s  │                       │
└─────────────────────────────────────────────────────┘
Border: red-200, opacity: 60%, strikethrough on content
```

---

## Responsive Design

### Mobile Layout (< 640px)

```
┌─────────────────────────────────────────┐
│  ← Back    Upper Body A       Today    │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [1] Bench Press            ✓3/3 │    │  ← Exercise cards
│  │     Set 1: 80kg × 8  ✓          │    │     (scrollable)
│  │     Set 2: 85kg × 8  ✓          │    │
│  │     Set 3: 85kg × 8  ✓          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [2] Squats              🤖 1/3  │    │  ← AI badge on card
│  │     Set 1: 105kg × 5  🤖        │    │     amber tint on row
│  │     Set 2: 100kg × 5  ○         │    │
│  │     Set 3: 100kg × 5  ○         │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  🤖 1 Change Pending                    │  ← Approval banner
│  [Approve All]  [Regenerate]  [Dismiss] │     (sticky bottom)
├─────────────────────────────────────────┤
│  ┌───────────────────────────┐  🎤  ➤  │  ← Input bar
│  │ Log your set...           │         │     (above banner)
│  └───────────────────────────┘         │
└─────────────────────────────────────────┘

[AI Chat Drawer - slides up 85% when opened]
```

### Tablet Layout (640-1024px)

```
┌────────────────────────────────────────────────────────────┐
│  ← Back       Upper Body A                         Today   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [1] Bench Press                               ✓3/3   │ │  ← Single column
│  │     Set 1: 80kg × 8  ✓                               │ │     (wider cards)
│  │     Set 2: 85kg × 8  ✓                               │ │
│  │     Set 3: 85kg × 8  ✓                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [2] Squats                                  🤖 1/3   │ │  ← AI badge
│  │     Set 1: 105kg × 5  🤖                             │ │     amber tint
│  │     Set 2: 100kg × 5  ○                              │ │
│  │     Set 3: 100kg × 5  ○                              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │ [+] Face Pulls                                [NEW]  │ │  ← New exercise
│  │     Set 1: 20kg × 15  |  Set 2: 20kg × 15            │ │     (dashed border)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  🤖 2 Changes Pending    [Approve All] [Regenerate]        │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  🎤  ➤      │
│  │ Log your set...                          │              │
│  └──────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────┘

[AI Chat Drawer - slides up 70% when opened]
```

### Desktop Layout (> 1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ← Back       Upper Body A                                              Today   │
├─────────────────────────────────────────────────────────────┬───────────────────┤
│                                                             │                   │
│  ┌────────────────────────────────────────────────────────┐ │   AI ASSISTANT    │
│  │ [1] Bench Press                                  ✓3/3  │ │                   │
│  │     Set 1: 80kg × 8  ✓                                 │ │  ┌─────────────┐  │
│  │     Set 2: 85kg × 8  ✓                                 │ │  │ You:        │  │
│  │     Set 3: 85kg × 8  ✓                                 │ │  │ "Log 105    │  │
│  └────────────────────────────────────────────────────────┘ │  │  for 5"     │  │
│                                                             │  └─────────────┘  │
│  ┌────────────────────────────────────────────────────────┐ │                   │
│  │ [2] Squats                                    🤖 1/3   │ │  ┌─────────────┐  │
│  │     Set 1: 105kg × 5  🤖                               │ │  │ AI:         │  │
│  │     Set 2: 100kg × 5  ○                                │ │  │ "I'll log   │  │
│  │     Set 3: 100kg × 5  ○                                │ │  │  105kg×5    │  │
│  └────────────────────────────────────────────────────────┘ │  │  for set 1" │  │
│                                                             │  └─────────────┘  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │                   │
│  │ [+] Face Pulls                                  [NEW]  │ │  ─────────────────│
│  │     Set 1: 20kg × 15                                   │ │  🤖 2 Pending     │
│  │     Set 2: 20kg × 15                                   │ │  • Squat set 1    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │  • +Face Pulls    │
│                                                             │                   │
│                                                             │  [Approve All]    │
│                                                             │  [Regenerate]     │
│                                                             │  [Dismiss]        │
│                                                             ├───────────────────┤
│                                                             │ ┌─────────────┐   │
│                                                             │ │ Ask AI...   │🎤➤│
│                                                             │ └─────────────┘   │
└─────────────────────────────────────────────────────────────┴───────────────────┘

Desktop: Side panel always visible (380px width)
Session cards: Single column, full width (scrollable)
Input box in side panel only - no duplicate in main area
```

---

## Lo-Fi Mockups

### Athlete Workout - Mobile

#### State 1: Active Workout (No Pending Changes)

```
┌─────────────────────────────────────────┐
│  ←  Upper Body A              📍 Today  │
├─────────────────────────────────────────┤
│  ⏱ 12:45    ████████░░ 67%     💾 Saved │
├─────────────────────────────────────────┤
│                                         │
│  ━━━━━━━━━━━━ STRENGTH ━━━━━━━━━━━━━━  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ① Bench Press              ✓3/3 │   │
│  ├─────────────────────────────────┤   │
│  │ Set │ Reps │ kg  │ RPE │       │   │
│  │  1  │   8  │  80 │  7  │  ✓    │   │
│  │  2  │   8  │  85 │  8  │  ✓    │   │
│  │  3  │   8  │  85 │  8  │  ✓    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ② Back Squats              ○0/3 │   │
│  ├─────────────────────────────────┤   │
│  │ Set │ Reps │ kg  │ RPE │       │   │
│  │  1  │   5  │ 100 │  -  │  ○    │   │
│  │  2  │   5  │ 100 │  -  │  ○    │   │
│  │  3  │   5  │ 100 │  -  │  ○    │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────┐ 🎤  ➤ │
│ │ "I did 105 for 5..."        │        │
│ └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

#### State 2: Pending Set Change

```
┌─────────────────────────────────────────┐
│  ←  Upper Body A              📍 Today  │
├─────────────────────────────────────────┤
│  ⏱ 13:22    ████████░░ 67%     💾 Saved │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ② Back Squats            🤖 1/3 │   │  ← AI badge on header
│  ├─────────────────────────────────┤   │
│  │ Set │ Reps │ kg  │ RPE │       │   │
│  │  1  │   5  │ 105 │  8  │  🤖   │   │  ← amber tint, AI icon
│  │  2  │   5  │ 100 │  -  │  ○    │   │
│  │  3  │   5  │ 100 │  -  │  ○    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  (No inline buttons - approve via       │
│   banner only)                          │
│                                         │
├─────────────────────────────────────────┤
│  🤖 1 Change Pending                    │
│  ┌──────────────────────────────────┐  │
│  │         Approve All              │  │
│  └──────────────────────────────────┘  │
│  ┌────────────┐  ┌──────────────────┐  │
│  │ Regenerate │  │     Dismiss      │  │
│  └────────────┘  └──────────────────┘  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────┐ 🎤  ➤ │
│ │ Log another set...          │        │
│ └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

#### State 3: Voice Recording Active

```
┌─────────────────────────────────────────┐
│  ←  Upper Body A              📍 Today  │
├─────────────────────────────────────────┤
│                                         │
│        🎤 Recording...                  │
│                                         │
│   ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●     │
│                                         │
│   "I did one oh five for five reps,    │
│    RPE eight..."                        │
│                                         │
│                                         │
│         ┌───────────────────┐           │
│         │    ⏹ Stop        │           │
│         └───────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

### Coach Session Planner - Mobile

#### State 1: Multiple Pending Changes

```
┌─────────────────────────────────────────┐
│  ←  Edit: Lower Body A          💾 Save │
├─────────────────────────────────────────┤
│                                         │
│  ━━━━━━━━━━━ MAIN LIFTS ━━━━━━━━━━━━━  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ↻ SWAP                     [🔄] │   │  ← Blue header
│  │ Back Squats → Safety Bar Squats │   │
│  │ "Easier on shoulders..."        │   │
│  ├─────────────────────────────────┤   │
│  │ Set │ Reps │ kg  │ RPE │ Rest  │   │
│  │  1  │   8  │  80 │  7  │ 2min  │   │  ← Sets preserved
│  │  2  │   8  │  85 │  8  │ 2min  │   │
│  │  3  │   8  │  85 │  8  │ 2min  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [2] Romanian Deadlifts   🤖 UPD │   │  ← Amber tint on header
│  ├─────────────────────────────────┤   │
│  │ Set │ Reps │ kg  │ RPE │ Rest  │   │
│  │  1  │ 10→12│  60 │  7  │ 90s   │   │  ← Inline diff: 10→12
│  │  2  │ 10→12│  60 │  7  │ 90s   │   │     (amber tint on changed)
│  │  3  │ 10→12│  60 │  7  │ 90s   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ━━━━━━━━━ ACCESSORIES ━━━━━━━━━━━━━━  │
│                                         │
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │
│  │ + NEW                      [➕] │   │  ← Green dashed border
│  │ Face Pulls                      │   │
│  │ "Added for shoulder health"     │   │
│  ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤   │
│  │ Set │ Reps │ kg  │ Rest        │   │
│  │  1  │  15  │  20 │ 60s         │   │
│  │  2  │  15  │  20 │ 60s         │   │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │
│                                         │
├─────────────────────────────────────────┤
│  🤖 3 AI Changes Pending                │
│  • Swap: Squats → Safety Bar            │
│  • Update: RDL +2 reps all sets         │
│  • Add: Face Pulls (2 sets)             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │        ✓ Approve All             │  │  ← Primary button
│  └──────────────────────────────────┘  │
│  ┌────────────┐  ┌──────────────────┐  │
│  │ Regenerate │  │     Dismiss      │  │  ← Secondary
│  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘

No inline approve/reject - banner only
```

### Desktop - Side Panel Chat

```
┌─────────────────────────────────────────────────────────────┬───────────────────────┐
│  ← Plans / Lower Body A                             💾 Save │   AI Assistant   [×]  │
├─────────────────────────────────────────────────────────────┼───────────────────────┤
│                                                             │                       │
│  ━━━━━━━━━━━━━━━━━━ MAIN LIFTS ━━━━━━━━━━━━━━━━━━━━━━━━━  │  ┌───────────────────┐│
│                                                             │  │ You:              ││
│  ┌───────────────────────────────────────────────────────┐ │  │ "Swap back squats ││
│  │ ↻ SWAP                                          [🔄]  │ │  │  for something    ││
│  │ Back Squats → Safety Bar Squats                       │ │  │  easier on knees" ││
│  │ "Easier on shoulders..."                              │ │  └───────────────────┘│
│  ├───────────────────────────────────────────────────────┤ │                       │
│  │ Set │ Reps │  kg  │ RPE │ Rest                        │ │  ┌───────────────────┐│
│  │  1  │   8  │  80  │  7  │ 2min                        │ │  │ AI:               ││
│  │  2  │   8  │  85  │  8  │ 2min                        │ │  │ I'll swap Back    ││
│  │  3  │   8  │  85  │  8  │ 2min                        │ │  │ Squats for Safety ││
│  └───────────────────────────────────────────────────────┘ │  │ Bar Squats...     ││
│                                                             │  └───────────────────┘│
│  ┌───────────────────────────────────────────────────────┐ │                       │
│  │ [2] Romanian Deadlifts                       🤖 UPD   │ │  ─────────────────────│
│  ├───────────────────────────────────────────────────────┤ │  🤖 3 Pending         │
│  │ Set │ Reps │  kg  │ RPE │ Rest                        │ │  • Swap Squats        │
│  │  1  │10→12 │  60  │  7  │ 90s                         │ │  • Update RDL reps    │
│  │  2  │10→12 │  60  │  7  │ 90s                         │ │  • Add Face Pulls     │
│  │  3  │10→12 │  60  │  7  │ 90s                         │ │                       │
│  └───────────────────────────────────────────────────────┘ │  ┌───────────────────┐│
│                                                             │  │  ✓ Approve All   ││
│  ━━━━━━━━━━━━━━━━━ ACCESSORIES ━━━━━━━━━━━━━━━━━━━━━━━━━  │  └───────────────────┘│
│                                                             │  ┌────────┐ ┌───────┐│
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │  │Regen.  │ │Dismiss││
│  │ + NEW                                          [➕]   │ │  └────────┘ └───────┘│
│  │ Face Pulls  "Added for shoulder health"               │ │                       │
│  ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤ │                       │
│  │ Set │ Reps │  kg  │ Rest                              │ │                       │
│  │  1  │  15  │  20  │ 60s                               │ │                       │
│  │  2  │  15  │  20  │ 60s                               │ │                       │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │                       │
│                                                             │                       │
├─────────────────────────────────────────────────────────────┼───────────────────────┤
│  ┌────────────────────────────────────────────┐  🎤   ➤   │ ┌────────────┐ 🎤  ➤ │
│  │ Describe changes...                        │            │ │ Ask AI...  │       │
│  └────────────────────────────────────────────┘            │ └────────────┘       │
└─────────────────────────────────────────────────────────────┴───────────────────────┘

Desktop: Side panel (380px) contains ALL approval controls
Main area: Single column exercise cards (scrollable)
NO duplicate approval banner in main area
```

---

## Implementation Priority

| Phase | Task | Effort | Impact | Dependencies |
|-------|------|--------|--------|--------------|
| **1** | Inline change indicators for set changes | Medium | High | None |
| **2** | Voice input with OpenAI dictation | Medium | High | None |
| **3** | Responsive side panel (desktop) | Medium | Medium | Phase 1 |
| **4** | Athlete workout AI integration | High | High | Phase 1, 2 |
| **5** | Context-aware suggestions | Low | Medium | Phase 4 |
| **6** | Collapsed banner by default | Low | Medium | None |

### Phase 1 Deliverables

1. **Inline Change Indicators**
   - Amber tint on rows with pending changes
   - `old→new` value display for changed fields
   - 🤖 icon indicates AI-proposed change
   - Animates in/out smoothly
   - **No inline buttons** - batch approval via banner only

2. **Change Type Indicators**
   - SWAP: Blue header, arrow icon
   - ADD: Green dashed border, plus icon
   - UPDATE: Amber background, edit icon
   - REMOVE: Red faded, strikethrough

3. **Banner Improvements**
   - Collapsed by default: "3 Changes Pending"
   - Tap to expand change list
   - Tap change to scroll to exercise

---

## Technical Requirements

### Voice Input Integration

```typescript
// components/features/ai-assistant/VoiceInput.tsx
interface VoiceInputProps {
  onTranscript: (text: string) => void
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
}

// Using OpenAI Whisper via API
const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')

  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    body: formData,
  })

  return response.json().then(r => r.text)
}
```

### Inline Change Indicator Component

```typescript
// components/features/training/components/InlineChangeIndicator.tsx
interface InlineChangeIndicatorProps {
  originalValue: string | number
  pendingValue: string | number
  fieldName: 'reps' | 'weight' | 'rpe' | 'rest'
}

// Renders inline diff: "8→10" with amber highlight
const InlineChangeIndicator = ({ originalValue, pendingValue }: InlineChangeIndicatorProps) => {
  if (originalValue === pendingValue) return <span>{originalValue}</span>

  return (
    <span className="bg-amber-100 px-1 rounded">
      <span className="line-through text-gray-400">{originalValue}</span>
      <span className="mx-1">→</span>
      <span className="font-medium text-amber-700">{pendingValue}</span>
    </span>
  )
}

// Utility to detect changed fields
const getChangedFields = (original: TrainingSet, pending: TrainingSet) => {
  const changes: string[] = []
  if (original.reps !== pending.reps) changes.push('reps')
  if (original.weight !== pending.weight) changes.push('weight')
  if (original.rpe !== pending.rpe) changes.push('rpe')
  return changes
}
```

### Responsive Layout Hook

```typescript
// hooks/useResponsiveLayout.ts
type LayoutMode = 'mobile' | 'tablet' | 'desktop'

const useResponsiveLayout = (): LayoutMode => {
  const [mode, setMode] = useState<LayoutMode>('mobile')

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth
      if (width >= 1024) setMode('desktop')
      else if (width >= 640) setMode('tablet')
      else setMode('mobile')
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return mode
}
```

---

## Next Steps

1. **Review this document** - Confirm approach for inline change indicators
2. **Create InlineChangeIndicator component** - Core building block for `old→new` display
3. **Add voice input** - OpenAI Whisper integration
4. **Build responsive side panel** - Desktop layout with chat + approval controls
5. **Integrate with athlete workout** - Connect AI to workout logging

---

## References

- [Spec: 002-ai-session-assistant](../002-ai-session-assistant/spec.md)
- [Plan: 002-ai-session-assistant](../002-ai-session-assistant/plan.md)
- [UI Integration Reference](../002-ai-session-assistant/reference/20251221-session-ui-integration.md)
- [Tool Definitions](../002-ai-session-assistant/reference/20251221-session-tool-definitions.md)
- [IntuitionLabs AI UI Comparison 2025](https://intuitionlabs.ai/articles/conversational-ai-ui-comparison-2025)
- [Sendbird Chatbot UI Examples](https://sendbird.com/blog/chatbot-ui)
