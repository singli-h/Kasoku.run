# Changeset Display System

## Display Decision Tree

```
Changes affect...
    │
    ├── Single session?
    │   ├── Low density (1-2 fields × 1-2 sets)?
    │   │   └── INLINE DIFF: Full old→new in pills
    │   │
    │   └── High density (3+ fields OR 3+ sets)?
    │       └── HYBRID: Summary card + highlight-only + [View Details]
    │
    ├── Multiple sessions in same week?
    │   └── GROUPED: Expandable by session, summary per session
    │
    ├── Multiple weeks?
    │   └── TEXT SUMMARY: In chat, batch approve
    │
    └── Block structure (add/remove weeks)?
        └── TEXT SUMMARY: In chat, batch approve
```

**Key Principle:** Use inline diff when cognitive load is low. Switch to summary + highlight when changes would create visual chaos.

## Visual Language

| Change Type | Icon | Color | Example |
|-------------|------|-------|---------|
| Add | + or ✅ | Green (#10b981) | New exercise, new set |
| Remove | - or ❌ | Red (#ef4444) | Deleted exercise |
| Update | ~ or 📝 | Amber (#f59e0b) | Changed reps, weight |
| Swap | ⇄ or 🔄 | Blue (#3b82f6) | Replace exercise |

## Single Session Display (Low Density)

For simple changes (1-2 fields × 1-2 sets), show full inline diff:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Proposal Bar]  🤖 1 change           [Change] [Apply]          │
├─────────────────────────────────────────────────────────────────┤
│ 1. ❌ Bench Press                     3×10 @ 60kg    REMOVING   │
│    ✅ DB Bench Press                  3×10 @ 60kg    ADDING     │
│ 2. Incline Press (unchanged)          3×12 @ 20kg               │
│ 3. ✅ Cable Flyes                     3×15           NEW        │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Session Display (Week Level)

Expandable summary grouped by day:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Proposal Bar]  🤖 3 sessions, +6 changes     [Change] [Apply]  │
├─────────────────────────────────────────────────────────────────┤
│ ▶ Monday (2 changes)              ← Click to expand             │
│ ▼ Wednesday (2 changes)           ← Expanded                    │
│   │ ✅ Pull-ups (new)                                           │
│   │ 📝 Lat Pulldown: 3×12 → 3×10                                │
│ ▶ Friday (2 changes)                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Block-Wide Display (Chat Summary)

Text summary in chat for multi-week changes:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 I'll replace 12 barbell exercises across your block:        │
│                                                                 │
│    • Week 1: 4 swaps (Bench → DB Bench, Row → DB Row, etc.)    │
│    • Week 2: 4 swaps (same exercises, higher weight)            │
│    • Week 3: 4 swaps (same pattern)                             │
│    • Week 4 (Deload): 0 changes                                 │
│                                                                 │
│    This keeps your program structure identical.                 │
│                                                                 │
│    ┌────────────────────────────────────────────────────────┐  │
│    │           [Looks Good]  [Make Changes]                 │  │
│    └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Compact AI Reasoning (Collapsible)

ChatGPT-style "Thinking" indicator:

```
DEFAULT (collapsed):
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 I'll swap Bench Press for DB Bench Press.                   │
│                                                                 │
│ ▶ Thinking... (tap to expand)      ← Subtle, doesn't take space│
│                                                                 │
│ ┌─────────────────────────────────┐                            │
│ │ ❌ Bench Press  →  ✅ DB Bench   │                            │
│ └─────────────────────────────────┘                            │
│                                                                 │
│                            [Change] [Apply]                     │
└─────────────────────────────────────────────────────────────────┘

EXPANDED (user tapped):
┌─────────────────────────────────────────────────────────────────┐
│ ▼ Thinking                                                      │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ • You asked to replace barbell with dumbbell             │  │
│ │ • Bench Press is a barbell chest exercise                │  │
│ │ • DB Bench Press is the direct equivalent                │  │
│ │ • Kept same reps/weight - adjust if needed               │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Inline Diff Density Rules

**Problem:** Too many inline `old → new` diffs create visual chaos.

**Solution:** Threshold-based simplification.

| Change Density | Display Mode | Example |
|----------------|--------------|---------|
| 1-2 fields × 1-2 sets | Full inline diff | `[60 → 65 kg]` in each pill |
| 3+ fields OR 3+ sets | Summary card + highlight-only | Summary above, pills just highlighted |
| Week/Block level | Text summary | Already covered above |

### Low Density Example (Full Inline Diff)

```
┌─────────────────────────────────────────────────────────────────┐
│  Bench Press                                                🤖   │
├─────────────────────────────────────────────────────────────────┤
│  ○ 1   │ [10x] │ [60 → 65 kg] │ [90s rest] │              [✓]  │
│  ○ 2   │ [10x] │ [65 → 70 kg] │ [90s rest] │              [✓]  │
└─────────────────────────────────────────────────────────────────┘

✅ 2 sets × 1 field = 2 changes → Full inline diff OK
```

### High Density Example (Summary + Highlight)

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Adjusting Bench Press                  [Change] [Apply All] │
│     3 sets · weight -5kg, reps +2, rest -30s                   │
│                                             [▼ View Details]   │
├─────────────────────────────────────────────────────────────────┤
│  Bench Press                                                🤖   │
├─────────────────────────────────────────────────────────────────┤
│  ○ 1   │ [12x] │ [55kg] │ [60s] │                        [✓]  │
│        │ amber │ amber  │ amber │  ← highlight only            │
│  ○ 2   │ [12x] │ [60kg] │ [60s] │                        [✓]  │
│  ○ 3   │ [10x] │ [65kg] │ [60s] │                        [✓]  │
└─────────────────────────────────────────────────────────────────┘

⚠️ 3 sets × 3 fields = 9 changes → Summary card + highlight only
✅ [View Details] expands to show full old→new for power users
✅ [Apply All] prominent for quick approval (Sarah persona)
```

### [View Details] Expansion (Power Users)

For Marcus (granular control) and Priya (audit everything), clicking [View Details] reveals:

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Adjusting Bench Press                  [Change] [Apply All] │
│     3 sets · weight -5kg, reps +2, rest -30s                   │
│                                             [▲ Hide Details]   │
├─────────────────────────────────────────────────────────────────┤
│  Set 1:  reps 10→12  ·  weight 60→55kg  ·  rest 90→60s         │
│  Set 2:  reps 10→12  ·  weight 65→60kg  ·  rest 90→60s         │
│  Set 3:  reps 10→10  ·  weight 70→65kg  ·  rest 90→60s         │
└─────────────────────────────────────────────────────────────────┘

✅ Sarah/Emma: See summary, approve quickly (default view)
✅ Marcus/Priya: Can expand to audit every field change
```

### Mobile: Stricter Threshold

On mobile, use summary card for 2+ fields OR 2+ sets (less screen space).

### Persona Satisfaction

| Persona | Need | How Hybrid Satisfies |
|---------|------|---------------------|
| **Sarah** | Fast, not extra work | Summary card + [Apply All] |
| **Marcus** | See exactly what's changing | [View Details] expands full diff |
| **Emma** | Not overwhelming | Highlight-only by default |
| **Robert** | Simple, no clutter | Highlight-only by default |
| **Priya** | Audit every modification | [View Details] shows all changes |

## Type Definitions

```typescript
type ChangeScope = 'exercise' | 'session' | 'week' | 'block'

interface ExtendedChangeSet extends ChangeSet {
  scope: ChangeScope
  changesByWeek: Map<number, WeekChanges>
}

interface WeekChanges {
  weekId: number
  weekName: string
  isStructuralChange: boolean
  sessionChanges: Map<string, SessionChanges>
}

interface SessionChanges {
  sessionId: string
  sessionName: string
  dayOfWeek: number
  changes: ChangeRequest[]
}
```
