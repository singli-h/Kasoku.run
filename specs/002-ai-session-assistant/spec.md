# Feature Specification: AI Session Assistant

**Feature Branch**: `002-ai-session-assistant`
**Created**: 2025-12-18
**Status**: Draft
**Input**: AI-Native Training Assistant using OpenAI Responses API + Conversations API with polymorphic tools for session modifications and workout logging

---

## Overview

An AI-powered assistant that enables athletes and coaches to interact with training sessions using natural language. The assistant can modify session content, log workout performance, and search for exercise alternatives through a conversational interface.

**Key Differentiators:**
- **Stateful Conversations**: Server-managed conversation state via OpenAI Conversations API
- **Polymorphic Tools**: Single tool interface that works for both template sessions (coach blueprints) and assigned sessions (athlete execution)
- **Natural Language Processing**: Converts unstructured user input into structured database operations

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Athlete Logs Workout Performance (Priority: P1)

An athlete completes their training session and wants to log their actual performance (weights, reps, RPE) by describing it naturally, without manually entering each set.

**Target Audience**: Athlete only

**Target Database Tables**:
- `exercise_training_details` - INSERT/UPDATE (actual performance data: weight, reps, RPE, time, distance)
- `exercise_personal_bests` - INSERT (when a new PR is achieved)
- `memories` - INSERT (session summary for future AI context)

**Why this priority**: This is the core value proposition - reducing friction in workout logging. Athletes currently abandon logging due to tedious data entry. Natural language input dramatically improves adoption.

**Independent Test**: Can be fully tested by having an athlete describe their workout in natural language and verifying the data is correctly stored in the database.

**Acceptance Scenarios**:

1. **Given** an athlete has an assigned session with 3 exercises, **When** they say "I did squats 100kg for 5 reps, felt like RPE 8, then bench press 80kg for 8 reps, and finished with rows at 60kg for 10", **Then** the system creates performance records for all 3 exercises with correct weights, reps, and RPE values.

2. **Given** an athlete is mid-workout, **When** they say "Just finished my first set of deadlifts, 120kg for 5, felt heavy", **Then** the system logs that set and the assistant acknowledges the effort and RPE interpretation.

3. **Given** an athlete provides incomplete information like "Did my squats today, felt good", **When** the assistant processes this, **Then** it asks clarifying questions about weight, reps, and sets before logging.

4. **Given** an athlete mentions an exercise not in their assigned session, **When** they try to log it, **Then** the assistant warns them and offers to add the exercise first or log it as an extra exercise.

---

### User Story 2 - Coach Modifies Template Session (Priority: P2)

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

### User Story 3 - Coach Modifies Athlete's Assigned Session (Priority: P2)

A coach needs to quickly modify a **specific athlete's assigned session** (already scheduled instance) - adjusting for the individual athlete's needs on that particular day.

**Target Audience**: Coach only

**Target Database Tables**:
- `exercise_training_sessions` - UPDATE (session metadata: status, notes)
- `exercise_training_details` - INSERT/UPDATE/DELETE (exercises and sets for this specific session)

**Why this priority**: Real-world coaching requires last-minute adjustments. Athletes may have constraints the coach didn't anticipate when assigning the template.

**Independent Test**: Can be tested by having a coach request modifications to an athlete's assigned session and verifying changes apply only to that athlete's instance.

**Acceptance Scenarios**:

1. **Given** a coach viewing Sarah's Monday session, **When** they say "Swap squats for leg press because her knee is bothering her", **Then** the system updates Sarah's `exercise_training_details` only (not the template, not other athletes).

2. **Given** a coach sees an athlete struggling, **When** they say "Reduce the weight by 10% for all exercises", **Then** the prescribed weights in `exercise_training_details` are adjusted for this session only.

3. **Given** a coach wants to add extra work, **When** they say "Add 3 sets of band pull-aparts as a warmup", **Then** a new exercise is inserted at the beginning of this athlete's session.

---

### User Story 4 - Athlete Modifies Own Assigned Session (Priority: P3)

An athlete with permission needs to make adjustments to their own assigned session - adapting to equipment availability or how they're feeling that day.

**Target Audience**: Athlete only (requires coach permission setting)

**Target Database Tables**:
- `exercise_training_sessions` - UPDATE (session notes)
- `exercise_training_details` - UPDATE only (can adjust parameters, cannot add/delete exercises without coach approval)

**Why this priority**: Empowers athletes to train independently when coach isn't available, while maintaining guardrails.

**Independent Test**: Can be tested by having an athlete request self-modifications and verifying permission checks and limited scope.

**Acceptance Scenarios**:

1. **Given** an athlete's coach has enabled self-modification, **When** the athlete says "I only have dumbbells today, swap barbell bench for dumbbell bench", **Then** the system allows the swap within their own session.

2. **Given** an athlete without modification permission, **When** they try to modify their session, **Then** the assistant explains they need coach approval and offers to send a request.

3. **Given** an athlete wants to add a new exercise, **When** they say "Add bicep curls", **Then** the assistant warns this requires coach approval and offers to log it as an "extra exercise" instead.

---

### User Story 5 - Athlete Searches for Exercise Alternatives (Priority: P2)

An athlete needs to find alternative exercises due to injury, equipment limitations, or preference - to continue training safely.

**Target Audience**: Athlete only

**Target Database Tables** (Read-only):
- `exercises` - SELECT with vector search (semantic similarity on `embedding` column)
- `exercise_types` - SELECT (for filtering by movement pattern)
- `exercise_tags` / `tags` - SELECT (for filtering by equipment, injury-safe options)

**Why this priority**: Athletes shouldn't be blocked from training due to constraints. Quick alternatives keep them progressing.

**Independent Test**: Can be tested by an athlete requesting exercise alternatives with injury/equipment constraints.

**Acceptance Scenarios**:

1. **Given** an athlete says "My knee hurts during squats, what can I do instead?", **When** the assistant searches, **Then** it returns knee-friendly leg exercises with brief explanations of why they're suitable.

2. **Given** an athlete says "I don't have a barbell, give me alternatives for bench press", **When** the assistant searches, **Then** it returns chest exercises that don't require a barbell.

3. **Given** an athlete finds an alternative they like, **When** they say "Use that one instead", **Then** the assistant offers to swap it in their session (triggering US4 permission check).

---

### User Story 6 - Coach Searches Exercise Library (Priority: P2)

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

### User Story 7 - User Continues Previous Conversation (Priority: P3)

A user (coach or athlete) returns to continue a previous conversation with the assistant, picking up where they left off.

**Target Audience**: Both (Athlete and Coach, in their own context)

**Target Database Tables**:
- OpenAI Conversations API - External (retrieves server-managed conversation state)
- `ai_conversations` - SELECT/UPDATE (local metadata lookup by user_id + session_id)

**Why this priority**: Enables complex workflows that span multiple exchanges or sessions. Less critical for MVP but important for power users.

**Independent Test**: Can be tested by starting a conversation, leaving, and returning to verify context is preserved.

**Acceptance Scenarios**:

1. **Given** a coach previously said "Add Romanian deadlifts" and closed the app, **When** they return and say "Actually, make that 4 sets instead of 3", **Then** the assistant understands "that" refers to the Romanian deadlifts from the previous session.

2. **Given** a user has an ongoing conversation, **When** they ask "What changes have we made so far?", **Then** the assistant summarizes all modifications in the current conversation.

3. **Given** a user has multiple past conversations, **When** they open the assistant on a specific session, **Then** it loads the relevant conversation for that session context.

---

### Edge Cases

- What happens when the athlete's session has already been marked as completed when they try to log more performance?
- How does the system handle conflicting modifications (e.g., "remove squats" immediately followed by "add 2 sets to squats")?
- What happens when the exercise library search returns no results?
- How does the system handle ambiguous exercise names (e.g., "press" could mean bench press, overhead press, leg press)?
- What happens if the AI misinterprets the user's intent and makes an incorrect modification?
- How are concurrent modifications handled (coach and athlete both modifying same session)?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Conversation Management
- **FR-001**: System MUST create a new conversation when a user starts interacting with a session for the first time
- **FR-002**: System MUST persist conversation state on the server, not requiring clients to maintain message history
- **FR-003**: System MUST allow users to retrieve and continue previous conversations
- **FR-004**: System MUST associate conversations with specific training sessions and users
- **FR-005**: Conversations MUST be deletable by users when they no longer need them

#### Session Modification Tool
- **FR-006**: System MUST support adding exercises to sessions via natural language
- **FR-007**: System MUST support removing exercises from sessions via natural language
- **FR-008**: System MUST support updating exercise parameters (sets, reps, weight, rest time) via natural language
- **FR-009**: System MUST support swapping one exercise for another while preserving parameters
- **FR-010**: Modification tool MUST work for both template sessions (coach blueprints) AND assigned sessions (athlete instances)
- **FR-011**: System MUST validate exercise existence before adding to a session
- **FR-012**: System MUST provide undo capability for modifications within the same conversation

#### Performance Logging Tool
- **FR-013**: System MUST accept natural language descriptions of workout performance
- **FR-014**: System MUST parse weight, reps, sets, and RPE from unstructured text
- **FR-015**: System MUST handle multiple exercises in a single logging statement
- **FR-016**: System MUST prompt for missing required fields before logging
- **FR-017**: System MUST update personal best records when applicable
- **FR-018**: System MUST create a session summary in the memories system for future AI context

#### Exercise Search Tool
- **FR-019**: System MUST search exercises by name, muscle group, or movement pattern
- **FR-020**: System MUST filter exercises by equipment constraints
- **FR-021**: System MUST filter exercises by injury/safety considerations
- **FR-022**: System MUST return a limited set of results (maximum 5-10) with relevant metadata
- **FR-023**: Search results MUST include exercise name, description, and video URL when available

#### Safety & Validation
- **FR-024**: System MUST validate user authorization before modifying sessions (coaches own templates, athletes own assigned sessions)
- **FR-025**: System MUST use database transactions for modifications to ensure data integrity
- **FR-026**: System MUST log all AI-initiated modifications for audit purposes
- **FR-027**: System MUST confirm destructive actions (deletes, bulk changes) before execution
- **FR-028**: System MUST rate-limit AI requests to prevent abuse

#### User Experience
- **FR-029**: System MUST stream AI responses in real-time for perceived performance
- **FR-030**: System MUST provide clear error messages when actions cannot be completed
- **FR-031**: System MUST handle ambiguous requests by asking clarifying questions
- **FR-032**: System MUST support cancellation of in-progress AI operations

### Key Entities

- **Conversation**: A stateful dialogue between a user and the AI assistant, associated with a session context. Contains ordered message items and metadata. Stored in OpenAI Conversations API with local metadata in `ai_conversations` table.
- **AI Conversation Metadata** (`ai_conversations` - NEW TABLE): Local reference linking OpenAI conversation IDs to our users and sessions. Fields: `id`, `openai_conversation_id`, `user_id`, `session_id`, `session_type` (template/assigned), `created_at`, `last_accessed_at`.
- **Session Context**: The training session being discussed - either a template (coach blueprint) or assigned session (athlete instance). Provides grounding for AI operations.
- **Tool Invocation**: A structured action the AI decides to take (modify, log, search). Contains validated parameters and execution results.
- **Memory**: A summarized record of past session performance stored for future AI context. Enables personalized recommendations.

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

### Measurable Outcomes

- **SC-001**: Users can log a complete workout session (5+ exercises) in under 2 minutes using natural language, compared to 5+ minutes with manual entry
- **SC-002**: 90% of modification requests are correctly interpreted on the first attempt without requiring clarification
- **SC-003**: AI response time for simple queries is under 2 seconds (time to first token)
- **SC-004**: Exercise search returns relevant results for 95% of common exercise queries
- **SC-005**: Workout logging adoption increases by 50% compared to manual-only entry (measured over 30-day period)
- **SC-006**: Coach session modification time reduces by 60% compared to form-based UI
- **SC-007**: System maintains conversation context accuracy across 10+ message exchanges
- **SC-008**: Zero data corruption incidents from AI modifications (all changes atomic and reversible)

---

## Assumptions

1. **OpenAI API Availability**: OpenAI Responses API and Conversations API are stable and available for production use
2. **Exercise Library Coverage**: The existing exercise library has sufficient coverage (~500+ exercises) for meaningful search results
3. **Vector Embeddings**: Exercise embeddings exist or will be generated for semantic search capability
4. **User Authentication**: Existing Clerk authentication provides user identity for authorization checks
5. **Database Schema**: Current `exercise_training_sessions`, `exercise_training_details`, `exercise_preset_groups`, and `exercise_presets` tables support required operations
6. **Memories Table**: The `memories` table (RLS disabled) is appropriate for storing session summaries with application-level access control

---

## Dependencies

- OpenAI API account with access to Responses and Conversations endpoints
- Existing exercise library with populated data
- Current session management infrastructure (training-session-actions, session-plan-actions)
- Vector search capability (pgvector extension already enabled)

---

## Out of Scope (for this feature)

- Full training plan generation from scratch (architect_plan tool)
- Voice input/output
- Offline functionality
- Multi-language support (English only for MVP)
- Integration with external fitness tracking devices
- AI-generated training recommendations beyond exercise substitutions
