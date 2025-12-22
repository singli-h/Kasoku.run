# AI Session Assistant: UI Integration

**Purpose**: Map ChangeSet data to UI components and define visual patterns
**Feature**: 002-ai-session-assistant
**Spec Reference**: [spec.md](../spec.md)

---

## Component Overview

The UI renders pending changes **inline on exercise cards**, with a batch approval flow.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Session View                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Exercise Card 1 (with change indicator)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Exercise Card 2 (unchanged)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  NEW: Exercise Card 3 (pending add)                       │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🤖 3 Changes Pending    [Approve] [Regenerate] [Dismiss] │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Existing Demo Components

Located at `components/features/ai-assistant/demo/`:

| Component | Purpose | ChangeSet Data Source |
|-----------|---------|----------------------|
| `AISessionAssistantDemo.tsx` | Main container, state management | `ChangeSet` |
| `ChatDrawer.tsx` | AI conversation interface | Messages, tool calls |
| `ExerciseCardInline.tsx` | Exercise with inline change | `ChangeRequest` where entity is exercise |
| `NewExerciseCard.tsx` | Pending add exercise | `ChangeRequest` where operation is create |
| `ApprovalBanner.tsx` | Batch approve/reject | `ChangeSet.status`, count |
| `SupersetContainer.tsx` | Superset grouping | Exercise grouping |
| `types.ts` | Type definitions | — |
| `mock-data.ts` | Demo data | — |

---

## Change Type Visualization

### Visual Indicators

| Change Type | Badge | Icon | Border | Background |
|-------------|-------|------|--------|------------|
| **Create** | `[NEW]` | `Plus` | `border-green-200` dashed | `bg-green-50` |
| **Update** | `[UPDATE]` | `Edit2` | `border-amber-200` | `bg-amber-50` |
| **Delete** | `[REMOVE]` | `Minus` | `border-red-200` | `bg-red-50` opacity-75 |

### Tailwind Classes

```typescript
const changeStyles = {
  create: {
    badge: 'bg-green-100 text-green-700',
    card: 'border-green-200 border-dashed bg-green-50/50',
    icon: Plus
  },
  update: {
    badge: 'bg-amber-100 text-amber-700',
    card: 'border-amber-200 bg-amber-50/50',
    icon: Edit2
  },
  delete: {
    badge: 'bg-red-100 text-red-700',
    card: 'border-red-200 bg-red-50/50 opacity-75',
    icon: Minus
  }
}
```

---

## Mapping ChangeRequest to UI

### Derive Change Type

```typescript
type UIChangeType = 'create' | 'update' | 'delete'

function deriveChangeType(request: ChangeRequest): UIChangeType {
  return request.operationType  // Direct mapping
}
```

### Transform for UI

```typescript
interface UIChange {
  id: string
  type: UIChangeType
  targetEntityId: string
  entityName: string
  description: string
  aiReasoning: string

  // For create
  newEntity?: UIEntity
  insertAfterEntityId?: string | null

  // For update
  fieldChanges?: UIFieldChange[]
}

interface UIFieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

function transformForUI(request: ChangeRequest): UIChange {
  return {
    id: request.id,
    type: deriveChangeType(request),
    targetExerciseId: request.entityId ?? 'new',
    exerciseName: request.currentData?.exerciseName ??
                  request.proposedData?.exerciseName ?? 'Unknown',
    description: generateDescription(request),
    aiReasoning: request.aiReasoning ?? '',
    // ... derive other fields
  }
}
```

---

## Exercise Card Inline Changes

### Swap Exercise

```
┌─────────────────────────────────────────────────────────────┐
│ [1] Back Squats → Leg Press                          [SWAP] │
│     ─────────────   ─────────                         🔄    │
│     (strikethrough)  (new name)                             │
│                                                             │
│     "Easier on knees while maintaining quad stimulus"       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Set │ Reps │ Weight │ Rest │ RPE │                      │ │
│ │  1  │   8  │   80   │ 2min │  7  │  (preserved)         │ │
│ │  2  │   8  │   85   │ 2min │  8  │                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Update Sets

```
┌─────────────────────────────────────────────────────────────┐
│ [2] Bench Press                                    [UPDATE] │
│                                                        ✏️   │
│     "Increased weight on sets 2-3 for progression"          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Set │ Reps │   Weight   │ Rest │   RPE   │              │ │
│ │  1  │   8  │     80     │ 2min │    7    │              │ │
│ │  2  │   8  │  80 → 85   │ 2min │  7 → 8  │  ← changed   │ │
│ │  3  │   8  │  80 → 85   │ 2min │  7 → 8  │  ← changed   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Changed rows highlighted with amber background              │
└─────────────────────────────────────────────────────────────┘
```

### Add Exercise (New Card)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ [+] Face Pulls                                       [NEW]  │
│                                                        ➕   │
│     "Added for shoulder health and posture"                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Set │ Reps │ Weight │ Rest │                            │ │
│ │  1  │  15  │   20   │ 60s  │                            │ │
│ │  2  │  15  │   20   │ 60s  │                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

(Dashed green border indicates pending addition)
```

### Remove Exercise

```
┌─────────────────────────────────────────────────────────────┐
│ [3] Tricep Pushdowns                               [REMOVE] │  ← opacity-75
│     ──────────────────                                  ➖  │  ← strikethrough
│                                                             │
│     "Removed to reduce session volume"                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Set │ Reps │ Weight │ Rest │                            │ │  ← faded
│ │  1  │  12  │   40   │ 90s  │                            │ │
│ │  2  │  12  │   40   │ 90s  │                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Approval Banner

### States

| State | Content | Background |
|-------|---------|------------|
| **Pending** | "🤖 3 Changes Pending" + [Approve] [Regenerate] [Dismiss] | Default |
| **Executing** | "⏳ Applying changes..." + spinner | Default |
| **Applied** | "✅ Changes Applied" | Green tint |
| **Failed** | "❌ Failed: [error message]" + [Try Again] [Dismiss] | Red tint |
| **Empty** | Hidden | — |

### Component Structure

```typescript
type BannerStatus = 'pending' | 'executing' | 'applied' | 'failed' | 'empty'

interface ApprovalBannerProps {
  status: BannerStatus
  changeCount: number
  errorMessage?: string           // For failed state
  onApproveAll: () => void
  onRegenerate: () => void
  onDismiss: () => void
}
```

### Visual Design

**Pending State:**
```
┌─────────────────────────────────────────────────────────────┐
│  🤖  3 AI Changes Pending                                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Approve All │  │  Regenerate  │  │   Dismiss    │       │
│  │   (primary)  │  │  (secondary) │  │   (ghost)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Failed State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ❌  Execution Failed                               bg-red   │
│                                                              │
│  "The session was modified. AI is reviewing changes..."     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Try Again   │  │   Dismiss    │                         │
│  │  (secondary) │  │   (ghost)    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

**Button Actions**:
- **Approve All**: Trigger execution, apply changes to database
- **Regenerate**: Clear changes, prompt AI to try different approach
- **Dismiss**: Clear changes without feedback
- **Try Again**: After failure, let AI re-propose (auto-triggered typically)

---

## Chat Drawer

### Structure

```
┌─────────────────────────────────────────┐
│  AI Assistant                   [Close] │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  [Message history scrollable area]      │
│                                         │
│  User: "Swap squats for..."             │
│  AI: "I'll swap Back Squats..."         │
│                                         │
│  [AI typing indicator when streaming]   │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌────┐ │
│  │  Type a message...        │  │ ➤  │ │  ← Input fixed at bottom
│  └───────────────────────────┘  └────┘ │
└─────────────────────────────────────────┘
```

### Mobile Behavior

- Opens as **85% height drawer** (bottom sheet)
- Uses Vaul library for smooth gestures
- Input stays fixed while messages scroll

---

## Data Flow

### From ChangeSet to UI

```
ChangeSet
    │
    ├── changeRequests[]
    │       │
    │       ▼
    │   transformForUI()
    │       │
    │       ▼
    │   UIChange[]
    │       │
    │       ├─────────────────────────────────────┐
    │       │                                     │
    │       ▼                                     ▼
    │   Existing exercises:                  New exercises:
    │   ExerciseCardInline                   NewExerciseCard
    │   (with change prop)                   (from add changes)
    │
    └── status, count
            │
            ▼
        ApprovalBanner
```

### Component Props

```typescript
// ExerciseCardInline
interface ExerciseCardInlineProps {
  exercise: SessionExercise      // Original exercise data
  change?: UIChange              // Pending change (if any)
}

// NewExerciseCard
interface NewExerciseCardProps {
  exercise: SessionExercise      // New exercise to add
  change: UIChange               // The "add" change
}

// ApprovalBanner
interface ApprovalBannerProps {
  changeCount: number
  onApproveAll: () => void
  onRegenerate: () => void
  onDismiss: () => void
  isApplied: boolean
  onUndo?: () => void
}
```

---

## Superset Handling

Exercises in supersets are grouped visually:

```
┌─────────────────────────────────────────────────────────────┐
│  SUPERSET                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [A] Bench Press                                       │  │
│  │     3 sets × 8 reps @ 80kg                            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [B] Bent Over Rows                            [SWAP]  │  │
│  │     Bent Over Rows → Seated Rows               🔄     │  │
│  │     "Changed to seated rows for back support"         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Styling**:
- Container: `border-l-4 border-blue-400 bg-blue-50/30`
- Exercises labeled A, B, C within group
- Changes on superset exercises maintain grouping

---

## Responsive Behavior

| Breakpoint | Chat Drawer | Cards | Banner |
|------------|-------------|-------|--------|
| Mobile (<640px) | 85% height bottom sheet | Full width, scroll table | Sticky bottom |
| Tablet (640-1024px) | 70% height | 2 columns | Sticky bottom |
| Desktop (>1024px) | Side panel option | 2-3 columns | Inline or floating |

---

## Component Hierarchy

```
components/features/ai-assistant/
├── demo/                           # ✅ Existing prototype
│   ├── AISessionAssistantDemo.tsx
│   ├── ChatDrawer.tsx
│   ├── ExerciseCardInline.tsx
│   ├── NewExerciseCard.tsx
│   ├── ApprovalBanner.tsx
│   ├── SupersetContainer.tsx
│   └── types.ts
│
├── components/                     # 🔜 Production (to build)
│   ├── SessionAssistant.tsx        # Main container
│   ├── ChatInterface.tsx           # Real AI integration
│   ├── ChangePreview.tsx           # Inline change display
│   └── ApprovalFlow.tsx            # Approval UI
│
├── hooks/                          # 🔜 To build
│   ├── useChangeSet.ts             # Buffer management
│   ├── useAIStream.ts              # OpenAI integration
│   └── useSessionContext.ts        # Domain detection
│
└── lib/                            # 🔜 To build
    ├── transform.ts                # ChangeRequest → UIChange
    └── execute.ts                  # Apply to database
```

---

## References

- Architecture: `20251221-changeset-architecture.md`
- Entity Model: `20251221-session-entity-model.md`
- Tool Definitions: `20251221-session-tool-definitions.md`
- Feature Spec: `../spec.md`
