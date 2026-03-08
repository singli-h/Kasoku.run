# Individual Plan Page - Implementation Plan

> Unifying `/plans/[id]`, `/plans/[id]/edit`, and `/plans/[id]/session/[sessionId]` into a single page with AI always available.

## Executive Summary

**Goal:** Merge three disconnected UX patterns into ONE unified page at `/plans/[id]` with contextual AI always available.

**Current State:**
- `/plans/[id]` - View-only, no AI (IndividualPlanPage)
- `/plans/[id]/edit` - Broken AI (PlanEditClient with "coming soon")
- `/plans/[id]/session/[sessionId]` - Working AI (SessionAssistant)

**Target State:**
- `/plans/[id]` - ONE page with browsing + AI drawer + inline exercise editing

---

## Component Audit

### Components to KEEP & REUSE (Core Assets)

| Component | Path | Status | Reuse Plan |
|-----------|------|--------|------------|
| `IndividualPlanPage` | `components/features/plans/individual/IndividualPlanPage.tsx` | Working | **EXTEND** - Add AI drawer integration |
| `WeekSelectorSheet` | `components/features/plans/individual/WeekSelectorSheet.tsx` | Working | **KEEP AS-IS** |
| `SessionAssistant` | `components/features/ai-assistant/SessionAssistant.tsx` | Working | **REUSE** - Core AI engine |
| `SessionAssistantWrapper` | `app/(protected)/plans/[id]/session/[sessionId]/SessionAssistantWrapper.tsx` | Working | **ADAPT** - Create PlanAssistantWrapper |
| `ChatDrawer` | `components/features/ai-assistant/ChatDrawer.tsx` | Working | **KEEP AS-IS** |
| `ChatSidebar` | `components/features/ai-assistant/ChatSidebar.tsx` | Working | **KEEP AS-IS** |
| `ChatTrigger` | `components/features/ai-assistant/ChatDrawer.tsx` | Working | **KEEP AS-IS** |
| `SessionExercisesContext` | `components/features/training/context/SessionExercisesContext.tsx` | Working | **REUSE** - For selected session's exercises |
| `InlineProposalSection` | `components/features/ai-assistant/inline/*.tsx` | Working | **REUSE** - For inline proposals |
| `useChangeSet` | `lib/changeset/useChangeSet.ts` | Working | **KEEP AS-IS** |
| `executeChangeSet` | `lib/changeset/execute.ts` | Working | **KEEP AS-IS** |
| `SessionPlannerV2` | `components/features/training/views/SessionPlannerV2.tsx` | Working | **EMBED** - Inline exercise editing |
| `ExerciseCard` | `components/features/training/components/ExerciseCard.tsx` | Working | **KEEP AS-IS** |
| `ExercisePickerSheet` | `components/features/training/components/ExercisePickerSheet.tsx` | Working | **KEEP AS-IS** |

### Components to COMMENT OUT (Preserve, Don't Delete)

| Component | Path | Reason |
|-----------|------|--------|
| `PlanEditClient` | `app/(protected)/plans/[id]/edit/PlanEditClient.tsx` | Broken AI - replace with unified page |
| `PlanEditPage` | `app/(protected)/plans/[id]/edit/page.tsx` | Route to deprecate |

### Routes to Deprecate

| Route | Action |
|-------|--------|
| `/plans/[id]/edit` | Comment out page, add redirect to `/plans/[id]` |
| `/plans/[id]/session/[sessionId]` | Keep for now, consider deprecation in P2 |

---

## Architecture Design

### New Component Hierarchy

```
/plans/[id] (page.tsx - Server Component)
└── IndividualPlanPageWithAI (New - Client Component)
    ├── PlanContextProvider (NEW)
    │   ├── selectedWeekId, selectedDayId, selectedSessionId
    │   └── AI context level detection
    │
    ├── SessionExercisesProvider (REUSE - for selected session)
    │
    └── PlanAssistant (NEW - wrapper around SessionAssistant)
        ├── Extends SessionAssistant for week-level context
        ├── ChatSidebar (Desktop)
        ├── ChatDrawer (Mobile)
        └── ChatTrigger (FAB)

        └── IndividualPlanPage (EXTENDED)
            ├── Week Sidebar (existing)
            ├── Day Pills (existing)
            ├── Workout Details / SessionPlannerV2 (EMBED)
            │   ├── InlineProposalSection (when session selected)
            │   └── ExerciseCards with AI enhancement
            └── AI context indicator
```

### State Management

```typescript
// NEW: PlanContext for plan-level state
interface PlanContextValue {
  // Selection state
  selectedWeekId: number | null
  selectedSessionId: string | null
  selectedExerciseId: string | null

  // AI context level (computed from selection)
  aiContextLevel: 'block' | 'week' | 'session' | 'exercise'

  // Actions
  selectWeek: (weekId: number) => void
  selectSession: (sessionId: string) => void
  selectExercise: (exerciseId: string) => void

  // Data
  trainingBlock: MesocycleWithDetails
  selectedWeek: MicrocycleWithDetails | null
  selectedSession: SessionPlanWithDetails | null
}
```

### AI Context Detection

```typescript
// Computed from selection state
function getAIContextLevel(state: PlanContextValue): AIContextLevel {
  if (state.selectedExerciseId) return 'exercise'
  if (state.selectedSessionId) return 'session'
  if (state.selectedWeekId) return 'week'
  return 'block'
}

// This tells the AI what scope it's working with
// AI prompts will be adjusted based on context level
```

---

## Implementation Phases

### Phase 1: Foundation (P0 - MVP)

**Goal:** Basic browse + single-session AI proposals

#### Step 1.1: Create PlanContext
```
NEW: components/features/plans/individual/context/PlanContext.tsx
```
- Plan-level state management
- Week/session selection
- AI context level computation

#### Step 1.2: Create PlanAssistantWrapper
```
NEW: components/features/plans/individual/PlanAssistantWrapper.tsx
```
- Wraps IndividualPlanPage with AI context
- Provides SessionExercisesProvider for selected session
- Integrates SessionAssistant

#### Step 1.3: Extend IndividualPlanPage
```
MODIFY: components/features/plans/individual/IndividualPlanPage.tsx
```
Changes:
- Remove navigation to `/plans/[id]/session/[sessionId]`
- Embed SessionPlannerV2 inline for selected workout
- Add InlineProposalSection slot
- Integrate with PlanContext

#### Step 1.4: Update Route Page
```
MODIFY: app/(protected)/plans/[id]/page.tsx
```
- Import PlanAssistantWrapper
- Wrap IndividualPlanPage with AI context for individual users

#### Step 1.5: Deprecate Edit Route
```
MODIFY: app/(protected)/plans/[id]/edit/page.tsx
```
- Add redirect to `/plans/[id]`
- Comment out PlanEditClient import

### Phase 2: Week-Level AI (P0 cont.)

**Goal:** AI proposals for week-level changes

#### Step 2.1: Extend AI Prompts
```
MODIFY: lib/changeset/prompts/session-planner.ts
```
- Add week-level context to system prompt
- Add support for multi-session proposals

#### Step 2.2: Create Grouped Proposal Display
```
NEW: components/features/ai-assistant/inline/GroupedProposalSection.tsx
```
- Display proposals grouped by day/session
- Expandable sections for week-level changes

### Phase 3: Enhanced AI (P1)

**Goal:** Compact reasoning + block-wide changes + beginner mode

#### Step 3.1: Collapsible Thinking Section
```
MODIFY: components/features/ai-assistant/ChatDrawer.tsx
MODIFY: components/features/ai-assistant/ChatSidebar.tsx
```
- Add collapsible "Thinking..." indicator
- ChatGPT-style expandable reasoning

#### Step 3.2: Block-Wide Text Summary
```
NEW: components/features/ai-assistant/inline/BlockSummarySection.tsx
```
- Text summary format for multi-week changes
- Batch approve/reject UI

#### Step 3.3: Advanced Fields Toggle
```
NEW: components/features/plans/individual/AdvancedFieldsToggle.tsx
```
- Toggle to show/hide advanced fields (RPE, tempo, velocity, etc.)
- Header button on desktop, settings sheet on mobile
- Persists to localStorage

---

## Files to Create

| File | Description |
|------|-------------|
| `components/features/plans/individual/context/PlanContext.tsx` | Plan-level state management |
| `components/features/plans/individual/PlanAssistantWrapper.tsx` | AI wrapper for plan page |
| `components/features/plans/individual/IndividualPlanPageWithAI.tsx` | Extended page with AI |
| `components/features/ai-assistant/inline/GroupedProposalSection.tsx` | Week-level proposals |
| `components/features/ai-assistant/inline/BlockSummarySection.tsx` | Block-wide text summaries |
| `components/features/ai-assistant/inline/DiffSummaryCard.tsx` | Summary card for high-density changes (with [View Details]) |
| `components/features/plans/individual/AdvancedFieldsToggle.tsx` | Advanced fields toggle |
| `app/api/ai/plan-assistant/route.ts` | Unified AI endpoint with context-aware prompts |

## Files to Modify

| File | Changes |
|------|---------|
| `components/features/plans/individual/IndividualPlanPage.tsx` | Embed SessionPlannerV2, add proposal slots |
| `app/(protected)/plans/[id]/page.tsx` | Wrap with PlanAssistantWrapper |
| `app/(protected)/plans/[id]/edit/page.tsx` | Add redirect to `/plans/[id]` |
| `lib/changeset/prompts/session-planner.ts` | Add week-level context support |
| `components/features/ai-assistant/SessionAssistant.tsx` | Optional: add week-level context prop |

## Files to Comment Out (Preserve)

| File | Reason |
|------|--------|
| `app/(protected)/plans/[id]/edit/PlanEditClient.tsx` | Broken, replaced by unified page |

---

## Technical Considerations

### 1. Session Embedding vs Navigation

**Current:** Click workout → navigate to `/plans/[id]/session/[sessionId]`
**New:** Click workout → expand inline → show SessionPlannerV2

Benefits:
- No context loss
- AI knows user's view
- Single mental model

### 2. Lazy Loading Strategy

```tsx
// Load SessionPlannerV2 only when a workout is expanded
const SessionPlannerV2 = dynamic(
  () => import('@/components/features/training/views/SessionPlannerV2'),
  { loading: () => <WorkoutDetailsSkeleton /> }
)
```

### 3. AI Architecture: Unified Entry with Context Prompts

**Decision:** Unified API endpoint with context-aware prompts (NOT full merge of all tools).

```typescript
// Single API endpoint with mode detection
// app/api/ai/plan-assistant/route.ts

export async function POST(req: Request) {
  const { planId, sessionId, messages } = await req.json()

  const context = await detectContext(planId, sessionId)

  // Different prompts for different contexts
  const systemPrompt = context.isEmpty
    ? PLAN_CREATION_PROMPT   // "Help user create a new plan..."
    : PLAN_EDITING_PROMPT    // "Help user modify their existing plan..."

  // Tool availability is contextual
  const tools = context.isEmpty
    ? CREATION_TOOLS         // createMesocycle, createMicrocycle, etc. (17 tools)
    : EDITING_TOOLS          // addExercise, updateSet, etc. (8 tools)

  return streamText({
    model,
    system: systemPrompt,
    messages,
    tools,
  })
}
```

**Why NOT full merge:**
- 25 tools in one AI is confusing for the model
- Creation and editing are different mental models
- Smaller, focused tool sets perform better
- User sees ONE AI button - doesn't need to know the difference

**Shared infrastructure:**
- ChangeSet pattern (already shared)
- Same UI components (ChatDrawer, ChatSidebar)
- Same approval flow

### 4. AI Context Injection

The AI needs to know:
1. Current context level (block/week/session/exercise)
2. Selected entities (weekId, sessionId, exerciseId)
3. Visible data (what user can see)

This is passed via the system prompt builder:
```typescript
function buildPlannerSystemPrompt(context: PlanContext): string {
  return `You are helping with a training plan.

  Current context:
  - Level: ${context.aiContextLevel}
  - Week: ${context.selectedWeek?.name ?? 'All weeks'}
  - Session: ${context.selectedSession?.name ?? 'None'}

  ${getContextSpecificInstructions(context.aiContextLevel)}
  `
}
```

### 5. Hybrid Diff Display (Density-Based)

**Decision:** Use inline diff for low-density changes, summary + highlight for high-density.

```typescript
// Compute diff display mode based on change density
function getDiffDisplayMode(changes: ChangeRequest[]): 'inline' | 'summary' {
  const fieldCount = countUniqueFields(changes)
  const setCount = countUniqueSets(changes)

  // Desktop: 3+ fields OR 3+ sets → summary
  // Mobile: 2+ fields OR 2+ sets → summary (stricter)
  const threshold = isMobile ? 2 : 3

  if (fieldCount >= threshold || setCount >= threshold) {
    return 'summary'
  }
  return 'inline'
}
```

**Summary mode includes:**
- Summary card above exercise ("3 sets · weight +5kg, reps +2")
- Highlight-only pills (amber bg, shows NEW value only)
- [View Details] button for power users (expands to full old→new)
- [Apply All] button for quick approval

### 6. Backward Compatibility

- Keep `/plans/[id]/session/[sessionId]` working (P1 deprecation candidate)
- Session page still useful for focused editing
- Eventually redirect session route to plan page with query params

---

## Migration Path

### Week 1: Foundation
1. Create PlanContext
2. Create PlanAssistantWrapper
3. Modify IndividualPlanPage to accept AI context
4. Test basic session-level AI

### Week 2: Integration
1. Embed SessionPlannerV2 inline
2. Add InlineProposalSection
3. Update route page
4. Deprecate edit route

### Week 3: Week-Level AI
1. Extend prompts for week context
2. Create GroupedProposalSection
3. Test week-level changes

### Week 4: Polish
1. Add collapsible thinking
2. Add block-wide summaries
3. Add beginner mode toggle
4. E2E testing

---

## Success Criteria

### P0 (MVP)
- [ ] Single page at `/plans/[id]` handles view + edit
- [ ] AI drawer available (sidebar desktop, sheet mobile)
- [ ] Single-session proposals work with inline diff
- [ ] Week-level proposals work with grouped display
- [ ] `/plans/[id]/edit` redirects to `/plans/[id]`

### P1
- [ ] Collapsible AI reasoning (ChatGPT-style)
- [ ] Block-wide text summaries in chat
- [ ] Advanced Fields toggle (header button)

### P2
- [ ] Deprecate session route (redirect with params)
- [ ] Exercise videos
- [ ] Partial approval (select which changes to accept)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing session editing | Keep session route working, only deprecate in P2 |
| Complex state management | Use established context patterns from SessionExercisesContext |
| AI context confusion | Clear context indicators in UI + system prompts |
| Performance (loading full planner) | Lazy load SessionPlannerV2, skeleton states |
| Mobile UX regression | Test on actual devices, use existing mobile-first patterns |

---

## Appendix: Key Existing Components Reference

### SessionAssistant Props
```typescript
interface SessionAssistantProps {
  sessionId: string
  planId?: string
  domain?: 'session' | 'workout'
  dbUserId?: string
  useInlineMode?: boolean
  autoCollapseChat?: boolean
  onWorkoutUpdated?: () => void | Promise<void>
  children?: React.ReactNode
}
```

### IndividualPlanPage Props
```typescript
interface IndividualPlanPageProps {
  trainingBlock: MesocycleWithDetails
  otherBlocks?: {
    upcoming: MesocycleWithDetails[]
    completed: MesocycleWithDetails[]
  }
}
```

### SessionPlannerV2 Integration Point
The SessionPlannerV2 is currently used in the session page. To embed it:
1. Provide exercises via SessionExercisesContext
2. Wrap with SessionAssistantWrapper pattern
3. Add save callback for persistence
