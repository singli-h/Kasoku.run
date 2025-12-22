# Feature Specification: AI Session Assistant

**Feature Branch**: `002-ai-session-assistant`
**Created**: 2025-12-18
**Status**: Draft
**Tech Stack**: Vercel AI SDK, React Context (ChangeSet pattern), Supabase

---

## Overview

An AI-powered assistant that enables coaches to modify training sessions using natural language. The assistant proposes changes through a human-in-the-loop approval workflow before committing to the database.

**Key Differentiators:**
- **ChangeSet Pattern**: AI proposes changes → User reviews → Approve/Reject → Execute
- **Batch Approval**: Multiple changes reviewed and approved together
- **Natural Language Processing**: Converts unstructured user input into structured database operations

---

## V1 Scope

**V1 Focus**: Coach domain (Training Plan templates) only

| In V1 | Deferred to V2 |
|-------|----------------|
| Coach modifies template sessions (US-002) | Athlete logs workout (US-001) |
| Coach searches exercise library (US-006) | Coach modifies assigned sessions (US-003) |
| Basic approval flow | Athlete modifies own session (US-004) |
| In-memory changeset buffer | Athlete searches exercises (US-005) |
| | Conversation persistence (US-007) |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Athlete Logs Workout Performance *(V2)*

> **Deferred to V2**: Natural language workout logging for athletes.

**Summary**: Athletes describe their workout performance naturally, and the system parses and logs weights, reps, RPE to `exercise_training_details`.

---

### User Story 2 - Coach Modifies Template Session *(V1)*

A coach needs to quickly modify a **template session** (reusable blueprint) by swapping exercises, adjusting sets/reps, or adding new exercises - using natural language instead of navigating complex UI.

**Target Audience**: Coach only

**Target Database Tables**:
- `exercise_preset_groups` - UPDATE (session metadata, where `is_template = true`)
- `exercise_presets` - INSERT/UPDATE/DELETE (exercises in template)
- `exercise_preset_details` - INSERT/UPDATE/DELETE (sets/reps prescription in template)

**Why this priority**: Templates are the foundation of training programming. Coaches iterate on templates frequently before assigning to athletes.

**Independent Test**: Can be tested by having a coach request template modifications via chat and verifying the changes are correctly applied to the template tables.

**Acceptance Scenarios**:

1. **Given** a coach has a template session open, **When** they say "Add 2 sets of face pulls at the end", **Then** the system creates a new `exercise_presets` row with 2 `exercise_preset_details` rows.

2. **Given** a coach viewing their template, **When** they say "Swap back squats for safety bar squats", **Then** the system updates the `exercise_presets` row to reference the new exercise while preserving set/rep details.

3. **Given** a coach wants to adjust volume, **When** they say "Reduce all sets by 1", **Then** all `exercise_preset_details` rows for this template have their set count decremented.

4. **Given** a coach requests an exercise that doesn't exist in the library, **When** the assistant cannot find it, **Then** it suggests similar alternatives from the exercise library.

---

### User Story 3 - Coach Modifies Athlete's Assigned Session *(V2)*

> **Deferred to V2**: Coach modifies individual athlete's assigned session instance.

**Summary**: Coach adjusts a specific athlete's session (not the template) for individual needs. Targets `exercise_training_sessions` and `exercise_training_details`.

---

### User Story 4 - Athlete Modifies Own Assigned Session *(V2)*

> **Deferred to V2**: Athlete self-modification with permission controls.

**Summary**: Athletes with coach permission can adjust their own assigned sessions within guardrails.

---

### User Story 5 - Athlete Searches for Exercise Alternatives *(V2)*

> **Deferred to V2**: Athlete-facing exercise search with injury/equipment filters.

**Summary**: Athletes search for alternative exercises based on constraints. Same search tool as US-006 but with athlete context.

---

### User Story 6 - Coach Searches Exercise Library *(V1)*

A coach needs to find exercises for programming purposes - building templates or finding progressions/regressions for athletes.

**Target Audience**: Coach only

**Target Database Tables** (Read-only):
- `exercises` - SELECT with vector search (full library access)
- `exercise_types` - SELECT (for filtering by movement pattern)
- `exercise_tags` / `tags` - SELECT (for filtering by difficulty, equipment, muscle group)

**Why this priority**: Coaches need quick access to their full exercise library when building programs.

**Independent Test**: Can be tested by a coach searching for exercises with various filters.

**Acceptance Scenarios**:

1. **Given** a coach asks "Find me 3 posterior chain exercises for beginners", **When** the assistant searches, **Then** it returns beginner-appropriate exercises targeting the posterior chain with difficulty ratings.

2. **Given** a coach says "What exercises target the VMO?", **When** the assistant searches, **Then** it returns exercises targeting the vastus medialis oblique with descriptions.

3. **Given** a coach finds an exercise they want, **When** they say "Add that to the current template", **Then** the assistant adds it (triggering US2).

---

### User Story 7 - User Continues Previous Conversation *(V2)*

> **Deferred to V2**: Persistent conversation state across sessions.

**Summary**: Users can return to continue previous conversations. Requires server-side conversation storage.

---

### Edge Cases (V1)

- What happens when the exercise library search returns no results?
- How does the system handle ambiguous exercise names (e.g., "press" could mean bench press, overhead press, leg press)?
- What happens if the AI misinterprets the user's intent and makes an incorrect modification?
  - **V1 Solution**: User clicks "Regenerate" to clear changes and try again

---

## Requirements *(mandatory)*

### Functional Requirements

#### V1: Session Modification (Coach Templates)
- **FR-001**: System MUST support adding exercises to template sessions via natural language
- **FR-002**: System MUST support removing exercises from template sessions via natural language
- **FR-003**: System MUST support updating exercise parameters (sets, reps, weight, rest time) via natural language
- **FR-004**: System MUST support swapping one exercise for another while preserving parameters
- **FR-005**: System MUST validate exercise existence before adding to a session
- **FR-006**: System MUST use batch approval flow (Approve All / Regenerate / Dismiss)

#### V1: Exercise Search (Coach)
- **FR-007**: System MUST search exercises by name, muscle group, or movement pattern
- **FR-008**: System MUST return a limited set of results (maximum 5-10) with relevant metadata
- **FR-009**: Search results MUST include exercise name and description

#### V1: Safety & Validation
- **FR-010**: System MUST validate coach owns the template before allowing modifications
- **FR-011**: System MUST use existing `saveSessionWithExercisesAction` for atomic database mutations
- **FR-012**: System MUST confirm changes via approval banner before execution

#### V1: User Experience
- **FR-013**: System MUST stream AI responses in real-time for perceived performance
- **FR-014**: System MUST provide clear error messages when actions cannot be completed
- **FR-015**: System MUST handle ambiguous requests by asking clarifying questions

#### V2: Conversation Persistence
- **FR-V2-001**: System MUST persist conversation state on the server
- **FR-V2-002**: System MUST allow users to retrieve and continue previous conversations
- **FR-V2-003**: Conversations MUST be deletable by users

#### V2: Athlete Domain
- **FR-V2-004**: System MUST accept natural language workout logging (performance data)
- **FR-V2-005**: System MUST support athlete session modifications (with permission controls)
- **FR-V2-006**: System MUST update personal best records when applicable

### Key Entities (V1)

- **ChangeSet**: A batch of proposed changes awaiting user approval. Contains multiple ChangeRequests.
- **ChangeRequest**: A single proposed operation (create/update/delete) on an entity (session/exercise/set).
- **Session Context**: The template session being modified. Provides grounding for AI operations.
- **Tool Invocation**: A structured action the AI decides to take (modify, search). Contains validated parameters.

### Key Entities (V2)

- **Conversation** *(V2)*: Persistent dialogue state stored server-side for multi-session continuity.
- **Memory** *(V2)*: Summarized workout records for future AI context and recommendations.

---

## UI/UX Design

### Design Principles

1. **Mobile-First, PWA-Ready**: All interfaces designed for touch-first interaction on mobile devices
2. **Inline Changes**: AI-proposed changes displayed directly on exercise cards, not in separate views
3. **Batch Approval**: Lean approval flow - users approve/reject all changes at once, not individually
4. **Progressive Disclosure**: Show essential info first, details on demand
5. **Real-Time Feedback**: Streaming AI responses for perceived performance

### Chat Interface

The AI assistant uses a **bottom drawer** interface (Vaul library) that slides up from the bottom of the screen.

**Structure:**
```
┌─────────────────────────────────┐
│  AI Assistant          [Close] │  ← Drawer header
├─────────────────────────────────┤
│                                 │
│  [Chat messages scroll area]    │  ← Message history
│                                 │
│  User: "Swap squats for..."     │
│  AI: "I'll swap Back Squats..." │
│                                 │
├─────────────────────────────────┤
│  [Text input]          [Send]   │  ← Input area (sticky bottom)
└─────────────────────────────────┘
```

**Behavior:**
- Opens as 85% height drawer on mobile
- Chat history persists within conversation
- Input stays fixed at bottom while messages scroll
- AI responses stream in real-time (token by token)

### Pending Changes Display

When AI proposes session modifications, changes are displayed **inline on the session view** with visual indicators.

#### Change Types & Visual Treatment

| Type | Badge | Background | Icon | Description |
|------|-------|------------|------|-------------|
| **Swap** | Blue | `bg-blue-50 border-blue-200` | `RefreshCw` | Replace one exercise with another |
| **Add** | Green | `bg-green-50 border-green-200` | `Plus` | Insert new exercise |
| **Remove** | Red | `bg-red-50 border-red-200` | `Minus` | Delete exercise (shown with opacity) |
| **Update** | Amber | `bg-amber-50 border-amber-200` | `Edit2` | Modify set parameters |

#### Inline Change Display

Changes appear directly on exercise cards with the following patterns:

**Swap Change:**
```
┌─────────────────────────────────────────┐
│ [1] Back Squats → Safety Bar Squats     │  ← Strikethrough old, arrow, new name
│     "Easier on shoulders while..."       │  ← AI reasoning (truncated)
│ ┌─────────────────────────────────────┐ │
│ │ Set │ Reps │ kg  │ %   │ Rest │ RPE │ │  ← Sets table (preserved)
│ │  1  │  8   │ 80  │ 65  │ 2m   │  7  │ │
│ │  2  │  8   │ 85  │ 70  │ 2m   │  8  │ │
│ └─────────────────────────────────────┘ │
│                              [SWAP] 🔄  │  ← Change badge
└─────────────────────────────────────────┘
```

**Update Change (Set-Level):**
```
┌─────────────────────────────────────────┐
│ [1] Bench Press                         │
│     "Increased intensity for sets 2-3"  │
│ ┌─────────────────────────────────────┐ │
│ │ Set │ Reps │  kg   │  %   │  RPE   │ │
│ │  1  │  8   │  80   │ 65   │   7    │ │  ← Unchanged row
│ │  2  │  8   │ 80→85 │ 65→70│  7→8   │ │  ← Changed values: old→new
│ │  3  │  8   │ 80→85 │ 65→70│  7→8   │ │  ← Amber highlight on row
│ └─────────────────────────────────────┘ │
│                            [UPDATE] ✏️  │
└─────────────────────────────────────────┘
```

**Add Change:**
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ [+] Face Pulls                         │  ← Dashed green border
│     "Added for shoulder health"        │
│ ┌─────────────────────────────────────┐│
│ │ Set │ Reps │ Rest │                 ││
│ │  1  │  15  │ 60s  │                 ││
│ │  2  │  15  │ 60s  │                 ││
│ └─────────────────────────────────────┘│
│                               [NEW] ➕ │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Remove Change:**
```
┌─────────────────────────────────────────┐  ← 75% opacity
│ [3] Leg Curls (strikethrough)           │
│     "Removed to reduce session volume"  │
│ ┌─────────────────────────────────────┐ │
│ │ Set │ Reps │ kg  │ Rest │           │ │
│ │  1  │  12  │ 40  │ 90s  │           │ │
│ └─────────────────────────────────────┘ │
│                            [REMOVE] ➖  │
└─────────────────────────────────────────┘
```

### Approval Banner

When pending changes exist, a sticky banner appears at the bottom of the session view:

```
┌─────────────────────────────────────────┐
│ 🤖 3 AI Changes Pending                 │
│                                         │
│ [Approve All]  [Regenerate]  [Dismiss]  │
└─────────────────────────────────────────┘
```

**Actions:**
- **Approve All**: Apply all pending changes to the session (database mutations)
- **Regenerate**: Clear changes and prompt AI to try different suggestions
- **Dismiss**: Discard all pending changes without applying

**Why batch approval:**
- Reduces decision fatigue (no per-change accept/reject)
- Faster workflow for coaches making multiple adjustments
- AI reasoning is visible inline - users can scan before approving

### Exercise Card Data Display

Exercise cards display sets in a **horizontally scrollable table** to accommodate professional training metrics.

**Supported Columns (dynamic based on data):**

| Column | Label | Unit | Description |
|--------|-------|------|-------------|
| Set | Set | - | Set number (always shown, sticky left) |
| Reps | Reps | - | Repetitions (always shown) |
| Weight | kg | kg | Absolute weight |
| Percentage | % | % | Percentage of 1RM |
| Power | W | watts | Power output |
| Velocity | m/s | m/s | Bar speed |
| Duration | TUT | seconds | Time under tension |
| Rest Time | Rest | s/m | Rest period |
| RPE | RPE | 1-10 | Rate of perceived exertion |
| Tempo | Tempo | - | Eccentric-pause-concentric-pause |
| Distance | m | meters | For cardio/plyos |
| Heart Rate | HR | bpm | Heart rate |
| Calories | kcal | kcal | Energy expenditure |

**Table Behavior:**
- Columns shown dynamically based on which fields have data
- Table scrolls horizontally within card boundary (not expanding card)
- Set column is sticky on left for reference while scrolling
- Mobile-optimized: `overflow-x-auto` with `max-w-full` constraint

### Superset Display

Exercises grouped in supersets are visually connected:

```
┌─────────────────────────────────────────┐
│ SUPERSET                                │  ← Blue left border
│ ┌─────────────────────────────────────┐ │
│ │ [A] Bench Press                     │ │  ← Superset label A
│ │     3 sets × 8 reps @ 80kg          │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [B] Bent Over Rows                  │ │  ← Superset label B
│ │     3 sets × 8 reps @ 60kg          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Superset styling:**
- Container with `border-l-4 border-blue-400` left border
- Light blue background `bg-blue-50/30`
- Exercises labeled A, B, C within group
- Changes to superset exercises maintain grouping

### Component Architecture

```
components/features/ai-assistant/
├── demo/                        # Prototype/demo components
│   ├── types.ts                 # Type definitions
│   ├── mock-data.ts             # Demo data
│   ├── ChatDrawer.tsx           # Main chat interface
│   ├── ExerciseCardInline.tsx   # Exercise card with inline changes
│   ├── NewExerciseCard.tsx      # Card for added exercises
│   ├── ApprovalBanner.tsx       # Batch approval UI
│   ├── SupersetContainer.tsx    # Superset grouping wrapper
│   ├── ReviewChangesSheet.tsx   # Legacy: detailed changes list
│   └── ChangeDetailSheet.tsx    # Legacy: single change detail
├── components/                  # Production components (future)
├── hooks/                       # Custom hooks (future)
└── actions/                     # Server actions (future)
```

### Key Type Definitions

```typescript
// Change types
type ChangeType = 'swap' | 'add' | 'remove' | 'update'

// Set-level change detail (for update type)
interface SetChange {
  setIndex: number
  field: keyof ExerciseSet  // 'reps' | 'weight' | 'percentage' | etc.
  oldValue: number | string | null
  newValue: number | string | null
}

// Session change proposed by AI
interface SessionChange {
  id: string
  type: ChangeType
  targetExerciseId: string
  exerciseName: string
  description: string
  aiReasoning: string
  // For swap
  newExerciseName?: string
  preserveSets?: boolean
  // For add
  newExercise?: SessionExercise
  insertAfterExerciseId?: string | null
  addToSupersetId?: string
  // For update
  updatedSets?: ExerciseSet[]
  setChanges?: SetChange[]
}

// Exercise set with all professional metrics
interface ExerciseSet {
  setIndex: number
  reps: number | null
  weight: number | null       // kg
  percentage: number | null   // % of 1RM
  power: number | null        // watts
  restTime: number | null     // seconds
  rpe: number | null          // 1-10
  tempo: string | null        // "3-0-2-0"
  velocity: number | null     // m/s
  distance: number | null     // meters
  duration: number | null     // seconds TUT
  heartRate: number | null    // bpm
  calories: number | null     // kcal
  completed?: boolean
  isChanged?: boolean
}
```

### Responsive Behavior

| Breakpoint | Chat Drawer | Exercise Cards | Approval Banner |
|------------|-------------|----------------|-----------------|
| Mobile (<640px) | 85% height drawer | Full width, scroll table | Sticky bottom |
| Tablet (640-1024px) | 70% height drawer | 2 columns grid | Sticky bottom |
| Desktop (>1024px) | Side panel option | 2-3 columns grid | Inline or floating |

---

## Success Criteria *(mandatory)*

### V1 Measurable Outcomes

- **SC-001**: Coach can add/update/delete exercises via natural language and approve changes
- **SC-002**: AI response time for simple queries is under 2 seconds (time to first token)
- **SC-003**: Exercise search returns relevant results for common exercise queries
- **SC-004**: Zero data corruption incidents from AI modifications (all changes atomic via existing server action)
- **SC-005**: Approval flow works end-to-end: propose → review → approve/regenerate/dismiss

### V2 Success Criteria

- **SC-V2-001**: Workout logging adoption increases by 50% compared to manual-only entry
- **SC-V2-002**: System maintains conversation context across sessions

---

## Assumptions

1. **Vercel AI SDK**: The Vercel AI SDK provides stable `useChat`, `streamText`, and tool calling capabilities
2. **Exercise Library Coverage**: The existing exercise library has sufficient coverage for meaningful search results
3. **User Authentication**: Existing Clerk authentication provides user identity for authorization checks
4. **Database Schema**: Current `exercise_preset_groups`, `exercise_presets`, and `exercise_preset_details` tables support required operations
5. **Existing Server Action**: `saveSessionWithExercisesAction` handles atomic session saves correctly

---

## Dependencies

- Vercel AI SDK (`ai` package)
- Existing exercise library with populated data
- Existing `saveSessionWithExercisesAction` in `apps/web/actions/plans/session-planner-actions.ts`
- Supabase client for exercise search

---

## Out of Scope (for this feature)

- Full training plan generation from scratch
- Voice input/output
- Offline functionality
- Multi-language support (English only)
- Integration with external fitness tracking devices
- AI-generated training recommendations beyond exercise substitutions
