# AI UI Implementation Plan

**Feature**: 002-ai-session-assistant + 004-feature-pattern-standard
**Created**: 2025-12-25
**Status**: Implementation Ready
**Prerequisite**: [ai-ui-proposal.md](./ai-ui-proposal.md)

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Architecture Overview](#architecture-overview)
3. [New Components](#new-components)
4. [Integration Strategy](#integration-strategy)
5. [File Structure](#file-structure)
6. [Implementation Phases](#implementation-phases)
7. [Testing Strategy](#testing-strategy)

---

## Design Principles

### 1. Separation of Concerns
- **AI logic** stays in `lib/changeset/` and `components/features/ai-assistant/`
- **UI components** receive AI state via props, not direct context access
- **Domain components** (workout, session-planner) remain unchanged internally

### 2. Composition Over Modification
- Create **wrapper components** that add AI capabilities
- Use **render props** or **children patterns** for flexibility
- Existing components gain AI features via composition, not modification

### 3. Opt-in AI Integration
- Components work without AI by default
- AI features enabled via props: `aiEnabled`, `pendingChanges`, etc.
- No breaking changes to existing component APIs

### 4. Follow Existing Patterns
- Barrel exports at each level
- Context + Hook pattern for state
- Adapter pattern for type conversions
- Feature folder organization

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Page Component                                 │
│  (e.g., WorkoutPage, SessionPlannerPage)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    AISessionProvider                             │   │
│  │  (Wraps content, provides AI context)                           │   │
│  │                                                                   │   │
│  │  ┌─────────────────────┐  ┌────────────────────────────────┐    │   │
│  │  │   ChangeSetProvider │  │  Domain Provider               │    │   │
│  │  │   (AI buffer)       │  │  (ExerciseProvider, etc.)      │    │   │
│  │  └─────────────────────┘  └────────────────────────────────┘    │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              Domain View (unchanged)                     │    │   │
│  │  │  ┌─────────────────────────────────────────────────┐    │    │   │
│  │  │  │  ExerciseCard                                    │    │    │   │
│  │  │  │  ┌─────────────────────────────────────────┐    │    │    │   │
│  │  │  │  │  SetRow (unchanged internally)           │    │    │    │   │
│  │  │  │  │  + AIChangeOverlay (optional layer)      │    │    │    │   │
│  │  │  │  └─────────────────────────────────────────┘    │    │    │   │
│  │  │  └─────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐     │   │
│  │  │ ChatDrawer   │  │ ApprovalBanner (with pending list)   │     │   │
│  │  └──────────────┘  └──────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## New Components

### 1. AI Change Indicators (`components/features/ai-assistant/indicators/`)

These are **pure presentation components** - they receive data via props.

```
ai-assistant/
├── indicators/
│   ├── index.ts                    # Barrel export
│   ├── InlineValueDiff.tsx         # Shows "80→85" with styling
│   ├── AIBadge.tsx                 # Small 🤖 icon with tooltip
│   ├── ChangeTypeBadge.tsx         # [SWAP], [NEW], [UPDATE], [REMOVE]
│   ├── PendingRowHighlight.tsx     # Amber tint wrapper for rows
│   └── ExerciseChangeCard.tsx      # Card-level change treatment
```

#### InlineValueDiff
```typescript
// Pure presentation - no context access
interface InlineValueDiffProps {
  original: string | number | null
  pending: string | number
  className?: string
}

export function InlineValueDiff({ original, pending, className }: InlineValueDiffProps) {
  // If no original (new set), just show pending
  if (original === null || original === undefined) {
    return <span className={cn("font-medium text-green-700", className)}>{pending}</span>
  }

  // If same, no diff needed
  if (original === pending) {
    return <span className={className}>{original}</span>
  }

  // Show diff: "old→new"
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="line-through text-gray-400">{original}</span>
      <span className="text-gray-400">→</span>
      <span className="font-medium text-amber-700">{pending}</span>
    </span>
  )
}
```

#### AIBadge
```typescript
interface AIBadgeProps {
  size?: 'sm' | 'md'
  tooltip?: string
}

export function AIBadge({ size = 'sm', tooltip = 'AI proposed' }: AIBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Bot className={cn(
            "text-blue-600",
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

#### ChangeTypeBadge
```typescript
type ChangeType = 'swap' | 'add' | 'update' | 'remove'

interface ChangeTypeBadgeProps {
  type: ChangeType
  className?: string
}

const BADGE_STYLES: Record<ChangeType, { bg: string; text: string; label: string }> = {
  swap: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SWAP' },
  add: { bg: 'bg-green-100', text: 'text-green-700', label: 'NEW' },
  update: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'UPDATE' },
  remove: { bg: 'bg-red-100', text: 'text-red-700', label: 'REMOVE' },
}

export function ChangeTypeBadge({ type, className }: ChangeTypeBadgeProps) {
  const style = BADGE_STYLES[type]
  return (
    <span className={cn(
      "px-2 py-0.5 text-xs font-medium rounded",
      style.bg, style.text, className
    )}>
      {style.label}
    </span>
  )
}
```

#### PendingRowHighlight
```typescript
interface PendingRowHighlightProps {
  isPending: boolean
  changeType?: ChangeType
  children: React.ReactNode
}

export function PendingRowHighlight({ isPending, changeType = 'update', children }: PendingRowHighlightProps) {
  if (!isPending) return <>{children}</>

  const bgColors: Record<ChangeType, string> = {
    swap: 'bg-blue-50/50 border-l-2 border-l-blue-400',
    add: 'bg-green-50/50 border-l-2 border-l-green-400',
    update: 'bg-amber-50/50 border-l-2 border-l-amber-400',
    remove: 'bg-red-50/30 border-l-2 border-l-red-400 opacity-60',
  }

  return (
    <div className={cn("transition-colors duration-200", bgColors[changeType])}>
      {children}
    </div>
  )
}
```

---

### 2. AI Integration Hooks (`components/features/ai-assistant/hooks/`)

These hooks bridge ChangeSet context with domain components.

```
ai-assistant/
├── hooks/
│   ├── index.ts
│   ├── useAIChangeForEntity.ts     # Get pending change for specific entity
│   ├── useAIChangesForSession.ts   # Get all pending changes for a session
│   └── useAISetChanges.ts          # Get pending changes for sets in an exercise
```

#### useAIChangeForEntity
```typescript
import { useChangeSet } from '@/lib/changeset/useChangeSet'
import { generateChangeKey } from '@/lib/changeset/buffer-utils'

interface UseAIChangeForEntityOptions {
  entityType: 'preset_exercise' | 'preset_set' | 'training_exercise' | 'training_set'
  entityId: number | string
}

export function useAIChangeForEntity({ entityType, entityId }: UseAIChangeForEntityOptions) {
  const { changeset, hasPendingChanges } = useChangeSet()

  if (!hasPendingChanges() || !changeset) {
    return { hasPendingChange: false, pendingChange: null }
  }

  const key = generateChangeKey(entityType, entityId)
  const pendingChange = changeset.changeRequests.find(
    req => generateChangeKey(req.entityType, req.entityId) === key
  )

  return {
    hasPendingChange: !!pendingChange,
    pendingChange,
    changeType: pendingChange?.operationType,
    proposedData: pendingChange?.proposedData,
    currentData: pendingChange?.currentData,
  }
}
```

#### useAISetChanges
```typescript
// Get all set changes for an exercise
export function useAISetChanges(exerciseId: number) {
  const { changeset } = useChangeSet()

  if (!changeset) {
    return { setChanges: new Map(), hasChanges: false }
  }

  const setChanges = new Map<number, ChangeRequest>()

  changeset.changeRequests
    .filter(req =>
      (req.entityType === 'preset_set' || req.entityType === 'training_set') &&
      req.currentData?.exercise_id === exerciseId
    )
    .forEach(req => {
      setChanges.set(req.entityId, req)
    })

  return {
    setChanges,
    hasChanges: setChanges.size > 0,
    pendingCount: setChanges.size,
  }
}
```

---

### 3. Enhanced SetRow Wrapper (`components/features/ai-assistant/wrappers/`)

Instead of modifying existing SetRow components, create wrappers.

```
ai-assistant/
├── wrappers/
│   ├── index.ts
│   ├── AIEnhancedSetRow.tsx        # Wraps any SetRow with AI indicators
│   └── AIEnhancedExerciseCard.tsx  # Wraps ExerciseCard with AI header badge
```

#### AIEnhancedSetRow
```typescript
interface AIEnhancedSetRowProps {
  /** The set data */
  set: TrainingSet
  /** The original SetRow component to render */
  children: React.ReactNode
  /** Optional: override pending detection */
  pendingChange?: ChangeRequest | null
}

export function AIEnhancedSetRow({ set, children, pendingChange }: AIEnhancedSetRowProps) {
  // Use hook if no override provided
  const hookResult = useAIChangeForEntity({
    entityType: 'preset_set', // or detect from context
    entityId: set.id,
  })

  const change = pendingChange ?? hookResult.pendingChange
  const hasPending = !!change

  if (!hasPending) {
    return <>{children}</>
  }

  const changeType = deriveUIChangeType(change)

  return (
    <PendingRowHighlight isPending={true} changeType={changeType}>
      <div className="relative">
        {/* Overlay the original children with change indicators */}
        {children}

        {/* AI badge in corner */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <AIBadge size="sm" />
        </div>
      </div>
    </PendingRowHighlight>
  )
}
```

---

### 4. Voice Input Component (`components/features/ai-assistant/voice/`)

```
ai-assistant/
├── voice/
│   ├── index.ts
│   ├── VoiceButton.tsx             # Microphone button with states
│   ├── VoiceRecordingOverlay.tsx   # Full-screen recording UI
│   └── useVoiceInput.ts            # OpenAI Whisper integration hook
```

#### VoiceButton
```typescript
interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

export function VoiceButton({ onTranscript, disabled, className }: VoiceButtonProps) {
  const { isRecording, startRecording, stopRecording, transcript, error } = useVoiceInput()

  // When transcript is ready, call callback
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript)
    }
  }, [transcript, onTranscript])

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      disabled={disabled}
      onClick={isRecording ? stopRecording : startRecording}
      className={className}
    >
      {isRecording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}
```

---

### 5. Desktop Side Panel (`components/features/ai-assistant/layout/`)

```
ai-assistant/
├── layout/
│   ├── index.ts
│   ├── AISidePanel.tsx             # Desktop right panel
│   ├── AIDrawerMobile.tsx          # Mobile drawer (existing ChatDrawer)
│   └── useAILayoutMode.ts          # Responsive layout detection
```

#### AISidePanel
```typescript
interface AISidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode  // The main content
}

export function AISidePanel({ open, onOpenChange, children }: AISidePanelProps) {
  const layoutMode = useAILayoutMode()  // 'mobile' | 'tablet' | 'desktop'

  // Mobile/Tablet: Use drawer
  if (layoutMode !== 'desktop') {
    return (
      <>
        {children}
        <ChatDrawer open={open} onOpenChange={onOpenChange} {...chatProps} />
      </>
    )
  }

  // Desktop: Side-by-side layout
  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* AI Panel */}
      {open && (
        <div className="w-[380px] border-l flex flex-col">
          <AIPanelContent onClose={() => onOpenChange(false)} />
        </div>
      )}
    </div>
  )
}
```

---

## Integration Strategy

### Strategy 1: Props-Based Integration (Recommended for SetRow)

**Existing SetRow stays unchanged internally**. Parent components pass AI state as props.

```typescript
// In ExerciseCard or parent component
function ExerciseCard({ exercise }: Props) {
  const { setChanges } = useAISetChanges(exercise.id)

  return (
    <div>
      {exercise.sets.map(set => {
        const pendingChange = setChanges.get(set.id)

        return (
          <AIEnhancedSetRow key={set.id} set={set} pendingChange={pendingChange}>
            <SetRow set={set} onUpdate={...} />  {/* Original SetRow, unchanged */}
          </AIEnhancedSetRow>
        )
      })}
    </div>
  )
}
```

### Strategy 2: Render Props Integration (For Complex Cases)

```typescript
// AISetRowRenderer - provides AI state to render function
function AISetRowRenderer({ set, children }: {
  set: TrainingSet
  children: (aiState: AIState) => React.ReactNode
}) {
  const aiState = useAIChangeForEntity({ entityType: 'preset_set', entityId: set.id })
  return <>{children(aiState)}</>
}

// Usage
<AISetRowRenderer set={set}>
  {(aiState) => (
    <SetRow
      set={set}
      // SetRow can optionally use aiState if it accepts it
      pendingValue={aiState.proposedData}
      isPending={aiState.hasPendingChange}
    />
  )}
</AISetRowRenderer>
```

### Strategy 3: Context Injection (For Page-Level Integration)

```typescript
// AISessionWrapper - provides AI capabilities to entire session
function AISessionWrapper({
  sessionId,
  children
}: {
  sessionId: number
  children: React.ReactNode
}) {
  return (
    <ChangeSetProvider>
      <AISessionContext.Provider value={{ sessionId }}>
        {children}
        <ChatTrigger />
        <ApprovalBanner />
      </AISessionContext.Provider>
    </ChangeSetProvider>
  )
}

// Usage in page
function SessionPlannerPage() {
  return (
    <AISessionWrapper sessionId={123}>
      <SessionPlannerClient />  {/* Unchanged existing component */}
    </AISessionWrapper>
  )
}
```

---

## File Structure

### Final Directory Structure

```
components/features/ai-assistant/
├── index.ts                        # Root barrel export
│
├── indicators/                     # Pure presentation components
│   ├── index.ts
│   ├── InlineValueDiff.tsx
│   ├── AIBadge.tsx
│   ├── ChangeTypeBadge.tsx
│   ├── PendingRowHighlight.tsx
│   └── ExerciseChangeCard.tsx
│
├── wrappers/                       # AI enhancement wrappers
│   ├── index.ts
│   ├── AIEnhancedSetRow.tsx
│   └── AIEnhancedExerciseCard.tsx
│
├── hooks/                          # AI-specific hooks
│   ├── index.ts
│   ├── useAIChangeForEntity.ts
│   ├── useAIChangesForSession.ts
│   ├── useAISetChanges.ts
│   └── useAILayoutMode.ts
│
├── voice/                          # Voice input
│   ├── index.ts
│   ├── VoiceButton.tsx
│   ├── VoiceRecordingOverlay.tsx
│   └── useVoiceInput.ts
│
├── layout/                         # Responsive layouts
│   ├── index.ts
│   ├── AISidePanel.tsx
│   └── AIDrawerMobile.tsx
│
├── context/                        # AI session context
│   ├── index.ts
│   ├── AISessionContext.tsx
│   └── AISessionWrapper.tsx
│
├── ApprovalBanner.tsx              # (existing, enhance)
├── ChatDrawer.tsx                  # (existing, keep)
├── ChangePreview.tsx               # (existing, enhance)
├── SessionAssistant.tsx            # (existing, keep)
│
└── demo/                           # (existing demo components)
```

### Barrel Exports

```typescript
// components/features/ai-assistant/index.ts
export * from './indicators'
export * from './wrappers'
export * from './hooks'
export * from './voice'
export * from './layout'
export * from './context'

// Existing exports
export { ApprovalBanner } from './ApprovalBanner'
export { ChatDrawer, ChatTrigger } from './ChatDrawer'
export { ChangePreview, ChangeList } from './ChangePreview'
export { SessionAssistant } from './SessionAssistant'
```

---

## Implementation Phases

### Phase 1: Indicator Components (Day 1)
**Goal**: Create all pure presentation components

- [ ] Create `indicators/` folder with barrel export
- [ ] Implement `InlineValueDiff.tsx`
- [ ] Implement `AIBadge.tsx`
- [ ] Implement `ChangeTypeBadge.tsx`
- [ ] Implement `PendingRowHighlight.tsx`
- [ ] Add to barrel exports

**Tests**: Unit tests for each component with various props

### Phase 2: Integration Hooks (Day 1-2)
**Goal**: Create hooks that bridge ChangeSet to components

- [ ] Create `hooks/` folder with barrel export
- [ ] Implement `useAIChangeForEntity.ts`
- [ ] Implement `useAISetChanges.ts`
- [ ] Implement `useAIChangesForSession.ts`
- [ ] Implement `useAILayoutMode.ts`

**Tests**: Hook tests with mock ChangeSet context

### Phase 3: Wrapper Components (Day 2)
**Goal**: Create wrappers that enhance existing components

- [ ] Create `wrappers/` folder with barrel export
- [ ] Implement `AIEnhancedSetRow.tsx`
- [ ] Implement `AIEnhancedExerciseCard.tsx`

**Tests**: Integration tests with real SetRow/ExerciseCard

### Phase 4: Session Planner Integration (Day 2-3)
**Goal**: Integrate AI indicators into coach session planner

- [ ] Update `SessionPlannerClient.tsx` to use AI wrapper
- [ ] Add AI hooks for detecting pending changes
- [ ] Update ExerciseRow to show inline diffs
- [ ] Test full flow: AI proposes → indicators show → approve

### Phase 5: Voice Input (Day 3)
**Goal**: Add OpenAI Whisper voice input

- [ ] Create `voice/` folder
- [ ] Implement `useVoiceInput.ts` with Whisper API
- [ ] Implement `VoiceButton.tsx`
- [ ] Implement `VoiceRecordingOverlay.tsx`
- [ ] Add voice button to ChatDrawer input

### Phase 6: Desktop Side Panel (Day 4)
**Goal**: Responsive layout with side panel for desktop

- [ ] Create `layout/` folder
- [ ] Implement `AISidePanel.tsx`
- [ ] Implement `AIDrawerMobile.tsx` (refactor from ChatDrawer)
- [ ] Update pages to use responsive layout

### Phase 7: Athlete Workout Integration (Day 4-5)
**Goal**: Connect AI to workout logging (athlete domain)

- [ ] Create workout-specific AI tools (training_set)
- [ ] Update WorkoutView to use AISessionWrapper
- [ ] Test athlete logging flow with AI

---

## Testing Strategy

### Unit Tests

```typescript
// indicators/InlineValueDiff.test.tsx
describe('InlineValueDiff', () => {
  it('renders original value when no change', () => {
    render(<InlineValueDiff original={80} pending={80} />)
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.queryByText('→')).not.toBeInTheDocument()
  })

  it('renders diff when values differ', () => {
    render(<InlineValueDiff original={80} pending={85} />)
    expect(screen.getByText('80')).toHaveClass('line-through')
    expect(screen.getByText('→')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('handles null original (new value)', () => {
    render(<InlineValueDiff original={null} pending={100} />)
    expect(screen.getByText('100')).toHaveClass('text-green-700')
  })
})
```

### Integration Tests

```typescript
// wrappers/AIEnhancedSetRow.test.tsx
describe('AIEnhancedSetRow', () => {
  it('shows no highlight when no pending change', () => {
    render(
      <ChangeSetProvider>
        <AIEnhancedSetRow set={mockSet}>
          <SetRow set={mockSet} />
        </AIEnhancedSetRow>
      </ChangeSetProvider>
    )
    expect(screen.queryByTestId('ai-badge')).not.toBeInTheDocument()
  })

  it('shows highlight and badge when pending change exists', () => {
    // Setup mock changeset with pending change
    const wrapper = ({ children }) => (
      <MockChangeSetProvider pendingChanges={[mockSetChange]}>
        {children}
      </MockChangeSetProvider>
    )

    render(
      <AIEnhancedSetRow set={mockSet}>
        <SetRow set={mockSet} />
      </AIEnhancedSetRow>,
      { wrapper }
    )

    expect(screen.getByTestId('ai-badge')).toBeInTheDocument()
    expect(screen.getByTestId('pending-highlight')).toHaveClass('bg-amber-50')
  })
})
```

### E2E Tests

```typescript
// e2e/ai-session-assistant.spec.ts
test('coach can approve AI-proposed exercise change', async ({ page }) => {
  // Navigate to session planner
  await page.goto('/plans/123/session-planner')

  // Open AI chat
  await page.click('[data-testid="ai-chat-trigger"]')

  // Send message
  await page.fill('[data-testid="ai-input"]', 'Add 3 sets of face pulls')
  await page.click('[data-testid="ai-send"]')

  // Wait for AI response and pending changes
  await expect(page.locator('[data-testid="approval-banner"]')).toBeVisible()
  await expect(page.locator('[data-testid="pending-count"]')).toHaveText('4')  // 1 exercise + 3 sets

  // Verify inline indicators
  await expect(page.locator('[data-testid="change-type-badge"]').first()).toHaveText('NEW')

  // Approve changes
  await page.click('[data-testid="approve-all"]')

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

---

## Key Integration Points (Minimal Changes to Existing Code)

### 1. SessionPlannerClient.tsx

**Current**: No AI integration
**Change**: Wrap with AISessionWrapper

```typescript
// BEFORE
export function SessionPlannerClient({ session, exercises }: Props) {
  return (
    <div>
      <SessionHeader />
      <ExerciseList exercises={exercises} />
    </div>
  )
}

// AFTER (minimal change)
import { AISessionWrapper } from '@/components/features/ai-assistant'

export function SessionPlannerClient({ session, exercises }: Props) {
  return (
    <AISessionWrapper sessionId={session.id}>
      <div>
        <SessionHeader />
        <ExerciseList exercises={exercises} />
      </div>
    </AISessionWrapper>
  )
}
```

### 2. ExerciseRow.tsx (Session Planner)

**Current**: Displays exercise with sets
**Change**: Use AIEnhancedSetRow wrapper for set rows

```typescript
// Find the SetRow mapping and wrap with AI enhancement
{exercise.sets.map(set => (
  <AIEnhancedSetRow key={set.id} set={set}>
    <SetRow set={set} onUpdate={handleSetUpdate} />
  </AIEnhancedSetRow>
))}
```

### 3. WorkoutView.tsx

**Current**: No AI integration
**Change**: Wrap with AISessionWrapper (same pattern)

---

## Summary

This implementation plan ensures:

1. **No breaking changes** - Existing components work exactly as before
2. **Modular design** - AI components are self-contained in `ai-assistant/`
3. **Easy to modify** - Change AI behavior without touching domain components
4. **Consistent patterns** - Follows existing barrel exports, hooks, context patterns
5. **Testable** - Pure presentation components, hooks with clear contracts
6. **Incremental** - Can be implemented in phases without blocking other work

---

## References

- [AI UI Proposal](./ai-ui-proposal.md)
- [ChangeSet Architecture](../002-ai-session-assistant/reference/20251221-changeset-architecture.md)
- [Training Feature Types](../../apps/web/components/features/training/types.ts)
- [Workout Feature Context](../../apps/web/components/features/workout/context/exercise-context.tsx)
