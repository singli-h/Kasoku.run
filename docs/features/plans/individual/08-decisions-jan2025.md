# Key Decisions (January 2025)

Latest design decisions from stakeholder review.

---

## Decision 1: ONE Page (Not Two)

**Question:** Should block/week/session views be in one page or split?

**Decision:** ONE PAGE with contextual depth

```
/plans/[id]
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────────────────────────────────────────┐   │
│  │ WEEKS   │  │  SELECTED WEEK'S CONTENT                    │   │
│  │ (nav)   │  │                                             │   │
│  │         │  │  Days → Sessions → Exercises → Sets         │   │
│  │ W1      │  │                                             │   │
│  │ W2 ●    │  │  User drills down WITHIN this panel         │   │
│  │ W3      │  │  (no page navigation)                       │   │
│  └─────────┘  └─────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AI Chat Drawer (expandable)                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Rationale:**
- Single mental model - users don't context-switch
- AI always knows what user is looking at
- Mobile-friendly - single scroll context
- Removes broken `/edit` route

---

## Decision 2: Block Changes = Chat Text Summary

**Question:** How to handle proposals that span multiple weeks?

**Decision:** TEXT SUMMARY IN CHAT (not visual diff spread)

**Why:**
- Users struggle to review changes spread across 8 weeks visually
- Cognitive load too high for hierarchical visual diffs
- Chat is natural context for AI interaction
- Simpler batch approve/reject

**When to use each:**

| Scope | Display Method |
|-------|----------------|
| Single session | Visual inline diff in exercise list |
| Single week | Visual grouped diff by day |
| Multi-week/Block | **Text summary in chat** |

**Example Chat Flow:**

```
👤 "Replace all barbell exercises with dumbbells"

🤖 "I'll replace 12 barbell exercises across your block:

    • Week 1-3: 4 swaps each (Bench → DB Bench, etc.)
    • Week 4 (Deload): No changes
    • Week 5-8: 4 swaps each

    This keeps your program structure identical.

    [Looks Good]  [Make Changes]"
```

---

## Decision 3: Compact AI Reasoning (ChatGPT-Style)

**Question:** How to show AI reasoning without taking space?

**Decision:** COLLAPSIBLE "THINKING" section

```
DEFAULT (collapsed):
┌─────────────────────────────────────────────┐
│ 🤖 I'll swap Bench Press for DB Bench.     │
│                                             │
│ ▶ Thinking...        ← Tap to expand        │
│                                             │
│ [Change] [Apply]                            │
└─────────────────────────────────────────────┘

EXPANDED (user tapped):
┌─────────────────────────────────────────────┐
│ ▼ Thinking                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ • You asked for barbell → dumbbell     │ │
│ │ • Bench Press is a barbell exercise    │ │
│ │ • DB Bench Press is the equivalent     │ │
│ │ • Kept same reps/weight                │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Decision 4: AI Architecture (Unified Entry, Context Prompts)

**Question:** Should Plan Generator (creation) and SessionAssistant (editing) be merged into one AI?

**Decision:** UNIFIED ENTRY POINT with CONTEXT-AWARE PROMPTS (not full merge)

```
                    ┌─────────────────────────────────────┐
                    │     Unified API Endpoint            │
                    │     /api/ai/plan-assistant          │
                    └─────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              ┌─────▼─────┐                   ┌─────▼─────┐
              │  CREATION │                   │  EDITING  │
              │   MODE    │                   │   MODE    │
              │ (empty    │                   │ (existing │
              │  plan)    │                   │  plan)    │
              └───────────┘                   └───────────┘
                    │                               │
              ┌─────▼─────┐                   ┌─────▼─────┐
              │ Creation  │                   │ Editing   │
              │ Prompt +  │                   │ Prompt +  │
              │ 17 tools  │                   │ 8 tools   │
              └───────────┘                   └───────────┘
```

**Rationale:**
- User sees ONE AI button - doesn't need to know the difference
- Different prompts for different contexts (cleaner, more accurate)
- Tool availability is contextual (AI can't "create mesocycle" on existing plan)
- Shared ChangeSet pattern already exists
- Easier to tune each mode independently

**NOT doing full merge because:**
- 25 tools in one AI is confusing for the model
- Creation and editing are different mental models
- Smaller, focused tool sets perform better

---

## Decision 5: Hybrid Diff Display (Density-Based)

**Question:** Should we use inline diff (`60 → 65 kg`) or highlight-only (`65 kg` with amber bg)?

**Decision:** HYBRID - density-based with [View Details] for power users

| Change Density | Display Mode | Example |
|----------------|--------------|---------|
| Low (1-2 fields × 1-2 sets) | **Full inline diff** | `[60 → 65 kg]` in each pill |
| High (3+ fields OR 3+ sets) | **Summary + highlight-only** | Summary card above, pills highlighted (no old→new) |
| Week/Block level | **Text summary** | In chat, batch approve |

**Persona Analysis:**

| Persona | Inline Diff | Highlight Only | Solution |
|---------|-------------|----------------|----------|
| Sarah | 😐 Slow | 😀 Quick scan | Summary + [Apply All] |
| Marcus | 😀 Audit | 😐 Missing info | [View Details] expands |
| Emma | 😰 Confusing | 😀 Simple | Highlight default |
| Robert | 😰 Noisy | 😀 Clean | Highlight default |
| Priya | 😀 Audit | 😐 Can't audit | [View Details] expands |

**Key UI Elements:**
- **Summary card**: Shows what changed at a glance ("3 sets · weight +5kg, reps +2")
- **Highlight-only pills**: Amber background on changed fields, shows new value only
- **[View Details]**: Expands to show full `old → new` for power users (Marcus, Priya)
- **[Apply All]**: Quick approval for busy users (Sarah)

**Mobile: Stricter threshold** - use summary card for 2+ fields OR 2+ sets

---

## Decision 6: Revised Priority List

### P0 - Must Have (MVP)

| Feature | Details |
|---------|---------|
| Basic browse (no AI) | Single page, week sidebar, day pills, exercise list |
| Single-session proposals | Hybrid diff (density-based: inline for low, summary+highlight for high) |
| Week-level proposals | Schedule changes, fatigue adjustments, grouped by day |
| Mobile-first layout | Bottom sheet for weeks, bottom drawer for AI |
| Unified AI entry point | Context-aware prompts, shared ChangeSet pattern |

### P1 - Should Have (Post-MVP)

| Feature | Details |
|---------|---------|
| Compact AI reasoning | Collapsible "Thinking" section |
| Block-wide changes | Text summary in chat |
| Advanced Fields toggle | Show/hide RPE, tempo, velocity (header button) |

### Deferred to P2

- Exercise videos/images
- Auto-approve settings
- Partial approval (accept some, reject others)
- Accessibility (ARIA labels, screen reader support)
- Aggregate metrics in proposals
- Keyboard shortcuts
- Full AI merge (all tools in one)

---

## Summary Table

| Question | Decision |
|----------|----------|
| 1 or 2 pages? | **1 page** |
| Block-wide visual diff? | **No** → Text summary in chat |
| AI reasoning display? | **Compact/collapsible** |
| Merge Plan Generator + SessionAssistant? | **No full merge** → Unified entry point with context-aware prompts |
| Inline diff or highlight? | **Hybrid** → Density-based with [View Details] for power users |
| Accessibility (James persona)? | **Defer to P2** |
| Exercise videos? | **Defer to P2** |
| Advanced Fields toggle? | **Yes (P1)** - header button, OFF by default |
| Focus/Beginner mode? | **No** - replaced by Advanced Fields toggle |

---

## Implementation Sequence

### Phase 1: Foundation (P0)
1. Single page architecture with week sidebar
2. Day pills and exercise list (no AI)
3. Mobile responsive layout
4. AI drawer integration (existing SessionAssistant)
5. Single-session proposal flow
6. Week-level proposal flow

**Key files:**
- `IndividualPlanPage.tsx` → Add AI drawer
- `SessionAssistant.tsx` → Extend to week-level context
- **DELETE:** `/plans/[id]/edit` route

### Phase 2: Enhanced AI (P1)
1. Compact reasoning display
2. Block-wide text summary in chat
3. Advanced Fields toggle (header button)

### Phase 3: Polish (P2)
- Exercise videos
- Advanced settings
- Accessibility improvements
