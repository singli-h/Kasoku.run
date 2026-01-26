# AI Context & Scope

## Context Detection

The AI determines context from user's current selection:

```typescript
type AIContext = {
  level: 'block' | 'week' | 'session' | 'exercise'

  // IDs for the current focus
  blockId: number
  weekId?: number        // Set when week is selected
  sessionId?: string     // Set when day/session is selected
  exerciseId?: string    // Set when exercise is expanded

  // For UI display: what's currently visible
  visibleWeeks: number[]
  visibleSessions: string[]
}
```

## Scope Matrix

| User Request | Context | AI Scope | Example |
|--------------|---------|----------|---------|
| "Add squats" | Session selected | That session only | Adds squats to Monday |
| "Add squats to all leg days" | Any | Cross-session | Finds all leg sessions, adds to each |
| "Make this a deload week" | Week selected | That week | Reduces volume/intensity for Week 3 |
| "Add a deload week" | Block | Block structure | Creates new Week 5 as deload |
| "Replace all barbells with dumbbells" | Block | All sessions | Swaps exercises across entire block |

## Context Escalation

When user's request exceeds current context, AI should:

1. **Clarify scope if ambiguous**
2. **Show affected scope in proposal**
3. **Never assume broader scope without confirmation**

```
User (viewing Week 2): "Add more leg work"

AI Response Options:
├── Narrow: "I'll add leg exercises to Week 2. Want me to add to other weeks too?"
├── Clarify: "Should I add leg work to just Week 2, or across the whole block?"
└── Assume (BAD): *silently modifies all weeks*
```

## Scope Levels for Proposals

| Scope | Display Method | Example |
|-------|----------------|---------|
| Single exercise | Inline diff in exercise card | Change sets/reps |
| Single session | Inline diff in exercise list | Add/remove exercises |
| Single week | Grouped by day, inline | Schedule changes, fatigue adjustment |
| Multi-week/Block | **Text summary in chat** | Replace all barbells with dumbbells |

### Why Chat for Block-Wide?

Block-wide changes are displayed as text summary in chat (not visual diff) because:
- Users struggle to review changes spread across 8 weeks visually
- Cognitive load is too high for hierarchical visual diffs
- Chat is the natural context for AI interaction
- Simpler to approve/reject as a batch with text explanation
