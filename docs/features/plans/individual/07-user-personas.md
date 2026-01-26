# User Personas

## Persona Spectrum

```
TECH COMFORT          ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
                   Reluctant                    Power User

FITNESS LEVEL         ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
                   Beginner                     Advanced

AI ATTITUDE           ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
                   Skeptical                    Enthusiast

PLANNING STYLE        ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
                   "Just tell me"          "I want control"
```

---

## Sarah - The Busy Professional

**Age 34, Marketing Director**

| Attribute | Rating |
|-----------|--------|
| Tech Comfort | ████████░░ High |
| Fitness Level | █████░░░░░ Intermediate |
| AI Attitude | ███████░░░ Positive, pragmatic |
| Planning Style | ███░░░░░░░ Wants guidance |

**Loves:**
- "Finally, I can see my week at a glance"
- "Love that I can ask AI to adjust without learning menus"
- Quick day pills - tap and see what's next

**Friction:**
- "Do I have to approve every little change?"
- May not discover AI unless prompted

**Critical Success:**
- AI must feel helpful, not extra work
- Changes must be fast (2 min between meetings)
- Mobile experience must be flawless

---

## Marcus - The Fitness Enthusiast

**Age 28, Software Engineer**

| Attribute | Rating |
|-----------|--------|
| Tech Comfort | ██████████ Expert |
| Fitness Level | █████████░ Advanced |
| AI Attitude | ██████████ Loves AI |
| Planning Style | █████████░ Wants granular control |

**Loves:**
- "Block-wide changes! Replace all barbells with dumbbells!"
- "I can see exactly what AI is changing before it happens"
- Desktop 3-column layout is information-dense

**Friction:**
- "I want to partial-approve - accept 3 of 5 changes"
- May feel limited if AI can't handle complex periodization

**Critical Success:**
- Must expose ALL training variables (RPE, tempo)
- AI needs to understand periodization terminology

---

## Emma - The Fitness Beginner

**Age 22, Recent college grad**

| Attribute | Rating |
|-----------|--------|
| Tech Comfort | ████████░░ High (grew up with phones) |
| Fitness Level | ██░░░░░░░░ Beginner |
| AI Attitude | ████████░░ Uses ChatGPT daily |
| Planning Style | ██░░░░░░░░ Just tell me what to do |

**Loves:**
- "OMG I can just ASK it to make my workout easier!"
- Clean mobile interface isn't overwhelming
- Today's workout is auto-selected

**Friction:**
- "What's a 'mesocycle'?" (jargon barrier)
- "Why is there so much in this plan? It's scary"
- Week view might feel overwhelming

**Critical Success:**
- "Beginner mode" that hides complexity
- AI should explain WHY, not just WHAT
- Encouraging, non-judgmental tone

---

## Robert - The Tech-Reluctant Gym Goer

**Age 52, Small business owner**

| Attribute | Rating |
|-----------|--------|
| Tech Comfort | ███░░░░░░░ Low (prefers paper) |
| Fitness Level | █████░░░░░ Intermediate |
| AI Attitude | ██░░░░░░░░ Skeptical |
| Planning Style | ██████░░░░ Likes routine |

**Appreciates:**
- "I can see my whole week, like a calendar"
- Big touch targets on mobile
- Can use it WITHOUT touching the AI button

**Dislikes:**
- "What's this sparkle button? I'm not clicking that"
- AI suggestions feel like upselling

**Critical Success:**
- AI must be INVISIBLE unless explicitly requested
- Core browsing must work perfectly without AI
- Must feel like a simple calendar, not a tech product

---

## Priya - The Data-Driven Optimizer

**Age 31, Data Scientist**

| Attribute | Rating |
|-----------|--------|
| Tech Comfort | ██████████ Expert |
| Fitness Level | ███████░░░ Advanced recreational |
| AI Attitude | ██████████ Excited but critical |
| Planning Style | █████████░ Wants data AND control |

**Loves:**
- Hierarchical change view - can audit every modification
- "View Full Diff" button - wants to see everything
- Context-awareness ("AI knows I'm looking at Week 3")

**Missing/Wants:**
- "Where's my volume progression graph?"
- "Why did AI choose THIS exercise? Show me the reasoning"
- "I want to undo 3 changes ago, not just the last one"

**Critical Success:**
- AI must EXPLAIN reasoning, not just make changes
- Need aggregate metrics visible somewhere

---

## Feature Reaction Matrix

| Feature | Sarah | Marcus | Emma | Robert | Priya |
|---------|-------|--------|------|--------|-------|
| Week Sidebar | 😀 Clear | 😀 Love | 😰 Scary | 😐 Fine | 😀 Great |
| Day Pills | 😀 Quick | 😀 Fast | 😀 Clear | 😀 Simple | 😀 Fast |
| AI FAB Button | 😀 Handy | 😀 Love | 😀 Fun | 😰 Ignore | 😀 Useful |
| Inline Proposals | 😀 Fast | 😀 Clear | 😐 What? | 😐 Why? | 😀 Good |
| Block-Wide (Chat) | 😀 Easy | 😀 Yes! | 😐 Lots | 😰 No | 😀 Audit |
| Approval Flow | 😐 Extra step? | 😀 Good | 😐 Confusing | 😰 Annoying | 😀 Audit |

Legend: 😀 Positive  😐 Neutral  😰 Negative

---

## Risk Mitigations

### Beginner Overwhelm (Emma, Robert)
**Solution:** Default fields only - shows reps, weight, rest. Advanced fields (RPE, tempo) hidden behind toggle.

### Field Complexity (Emma)
**Solution:** [Advanced ○] toggle in header - OFF by default. Power users (Marcus, Priya) can turn ON to see all fields.

### AI Trust Gap (Robert, Priya)
**Solution:** Compact reasoning display - AI explains why, collapsible

### Approval Fatigue (Sarah, Marcus)
**Solution:** Future: Auto-approve settings for power users

### Inline Diff Chaos (All)
**Solution:** Threshold-based display - 3+ changes use summary card instead of inline diff
