# Feature Specification: AI Memory System for Personalized Training

**Feature Branch**: `011-ai-memory-system`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: "AI memory implementation with memory types, capture points, retrieval for personalized training"

## Overview

Enable AI assistants to remember user context, preferences, injuries, and training history across sessions. The system stores memories in the existing `ai_memories` table and surfaces them to AI during plan generation, session planning, and workout recommendations. This transforms the AI from stateless to context-aware, reducing user repetition and enabling adaptive programming.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Remembers Injury Context (Priority: P1)

As Emma (beginner athlete), when I report knee pain during a workout, I want the AI to automatically avoid single-leg exercises in future sessions without me having to repeat my injury every time I interact with the AI.

**Why this priority**: Safety-critical. Prevents harmful exercise recommendations. Delivers immediate, tangible value that builds user trust. Addresses a major pain point where users currently must re-explain injuries in every AI conversation.

**Independent Test**: Can be fully tested by reporting an injury, completing a workout, then starting a new AI planning session and verifying the AI proactively avoids contraindicated exercises without prompting.

**Acceptance Scenarios**:

1. **Given** I report "left knee pain" during a workout, **When** AI plans my next session, **Then** AI avoids knee-dominant and single-leg exercises without me mentioning the injury again
2. **Given** I have an active injury memory, **When** I view my AI conversation, **Then** I see a subtle indicator that "AI remembers: left knee injury"
3. **Given** I modify an AI suggestion to remove an exercise, **When** the modification is due to pain/discomfort, **Then** system creates an injury memory automatically
4. **Given** my injury has healed, **When** I mark the injury as "resolved", **Then** AI stops filtering exercises based on that contraindication

---

### User Story 2 - AI Learns User Preferences (Priority: P1)

As Marcus (power user), when I consistently reject certain exercises or modify AI suggestions, I want the AI to learn my preferences so future plans align with my training philosophy without lengthy back-and-forth.

**Why this priority**: Reduces friction for all users. Saves time (critical for Sarah - busy professional). Respects user autonomy (critical for Marcus - wants control). Immediate efficiency gain.

**Independent Test**: Can be tested by rejecting the same type of exercise 2-3 times, then requesting a new plan and verifying AI no longer suggests that exercise type.

**Acceptance Scenarios**:

1. **Given** I reject "barbell back squat" 3 times in favor of "safety bar squat", **When** AI plans a squat-focused session, **Then** AI defaults to safety bar squat
2. **Given** I always modify "3 sets of 10" to "5 sets of 5", **When** AI generates strength work, **Then** AI suggests 5x5 schemes by default
3. **Given** AI learns a preference, **When** I hover over an exercise suggestion, **Then** I see "Based on your preference for [X]"
4. **Given** my preferences change over time, **When** I consistently accept a previously-rejected exercise, **Then** system updates the preference memory

---

### User Story 3 - Training History Context (Priority: P2)

As Priya (data-driven athlete), I want the AI to reference my recent workout performance when planning future sessions, so training adapts based on what's actually working rather than generic templates.

**Why this priority**: Enables adaptive programming. Differentiates from static template systems. High value for engaged users but not essential for basic functionality.

**Independent Test**: Can be tested by completing 3-5 workouts with performance data (RPE, completions), then requesting AI plan adjustment and verifying AI references recent trends.

**Acceptance Scenarios**:

1. **Given** my last 3 workouts averaged RPE 9 (high fatigue), **When** AI plans this week, **Then** AI suggests reduced volume or deload
2. **Given** I failed to complete sets on pistol squats twice, **When** AI plans leg day, **Then** AI regresses the movement or suggests alternatives
3. **Given** I've consistently exceeded target reps, **When** AI updates my plan, **Then** AI suggests progressive overload (more weight/reps/sets)
4. **Given** I view my plan, **When** AI made an adjustment based on history, **Then** I see reasoning like "Reduced volume due to recent high RPE trend"

---

### User Story 4 - Profile Memory on Onboarding (Priority: P1)

As a new user completing onboarding, I want my goals, equipment, experience level, and target events stored automatically so I never have to re-enter this foundational information.

**Why this priority**: Foundation for all other memory features. Zero additional user effort (automatic capture). Essential for personalization from day one.

**Independent Test**: Can be tested by completing onboarding, then starting a new chat session weeks later and verifying AI still knows user's goals and equipment.

**Acceptance Scenarios**:

1. **Given** I complete onboarding with "sprint performance" goal and "beginner" experience, **When** AI generates my first plan, **Then** AI creates a profile memory capturing this context
2. **Given** I specify "dumbbells and pullup bar" as available equipment, **When** AI plans any session, **Then** AI only suggests exercises compatible with my equipment
3. **Given** I set "100m sprint competition in 12 weeks" during onboarding, **When** AI plans my mesocycle, **Then** AI structures periodization toward that peak date
4. **Given** my profile memory exists, **When** I update my goals in settings, **Then** system updates the profile memory automatically

---

### User Story 5 - Memory Management UI (Priority: P2)

As Marcus or Priya (power users who want transparency), I want to view, edit, and delete AI memories so I maintain control over what the AI remembers about me.

**Why this priority**: Builds trust through transparency. Addresses privacy concerns. Critical for power users but not blocking for basic functionality.

**Independent Test**: Can be tested by navigating to memory management page, editing an injury memory to mark it resolved, and verifying AI behavior changes in next planning session.

**Acceptance Scenarios**:

1. **Given** I navigate to `/individual/[id]/memory`, **When** the page loads, **Then** I see all my memories grouped by type (injury, preference, profile, session_summary)
2. **Given** I view an injury memory, **When** I click "Mark as Resolved", **Then** the memory is archived and AI stops using it for contraindication filtering
3. **Given** I see a preference memory I disagree with, **When** I delete it, **Then** AI reverts to suggesting exercises I previously rejected
4. **Given** I view a session_summary memory, **When** I click to expand it, **Then** I see performance metrics, RPE, completed exercises, and user notes

---

### User Story 6 - AI Proactively Creates Memories (Priority: P3)

As any user, when I make statements about my training philosophy or mention important context, I want the AI to recognize memory-worthy information and ask if it should remember it, rather than requiring me to explicitly create memories.

**Why this priority**: Advanced feature that reduces user effort. Requires sophisticated AI reasoning. High value but complex to implement correctly (avoid spam/false positives).

**Independent Test**: Can be tested by telling AI "I hate cardio" or "I prefer low volume, high intensity" and verifying AI asks "Should I remember this preference?" with approve/reject options.

**Acceptance Scenarios**:

1. **Given** I tell AI "I prefer Olympic lifting over powerlifting", **When** conversation continues, **Then** AI asks "Should I remember: you prefer Olympic lifting movements?"
2. **Given** I mention "I'm traveling next week with no gym access", **When** AI detects temporary context, **Then** AI suggests creating a note memory with timeframe
3. **Given** I describe my training philosophy in detail, **When** AI detects philosophical statements, **Then** AI summarizes key points and asks permission to store as philosophy memory
4. **Given** AI suggests creating a memory, **When** I approve, **Then** memory is created and appears in my memory management UI immediately

---

### User Story 7 - Knowledge Base Integration (Priority: P3)

As a coached athlete, when my coach has created exercise libraries or periodization templates in their knowledge base, I want the AI to reference coach-specific knowledge when planning my training, while also using my personal memories.

**Why this priority**: Enables coach customization. Differentiates coached vs individual users. Complex feature requiring KB infrastructure. High value for coach persona but not essential for individual users.

**Independent Test**: Can be tested by having a coach create a KB article on "Hamstring exercises for sprinters", then generating an athlete's plan and verifying AI cites coach's KB when suggesting hamstring work.

**Acceptance Scenarios**:

1. **Given** my coach has KB articles, **When** AI plans my session, **Then** AI retrieves relevant coach knowledge and cites it in reasoning (e.g., "Using your coach's hamstring protocol")
2. **Given** coach KB conflicts with my personal preference, **When** AI makes a suggestion, **Then** personal memories take priority but AI notes the alternative approach
3. **Given** I'm an individual user (no coach), **When** AI plans my training, **Then** AI relies solely on personal memories and general training principles
4. **Given** my coach updates a KB article, **When** I request a plan update, **Then** AI uses the latest coach knowledge without cache staleness

---

### User Story 8 - Memory Evolution Tracking (Priority: P3)

As Priya (data-driven user), when my preferences or training responses change over time, I want to see how my memories have evolved so I can understand my training journey and validate AI adaptations.

**Why this priority**: Supports user reflection and progress tracking. Builds trust through transparency. Advanced feature for engaged users. Not essential for core functionality.

**Independent Test**: Can be tested by changing a preference over time (first hate cardio, later embrace it) and viewing memory history to see the evolution timeline.

**Acceptance Scenarios**:

1. **Given** I initially set "avoid cardio" preference, later complete cardio regularly, **When** I view that memory, **Then** I see evolution timeline: "Jan 2026: Avoid cardio → Mar 2026: Completing cardio 2x/week"
2. **Given** my injury memory shows recovery progress, **When** I view injury history, **Then** I see: "Reported Jan 15 → Moderate restrictions Jan 30 → Resolved Feb 20"
3. **Given** my session summaries show performance trends, **When** I view session_summary memories, **Then** I see RPE trend graph and completion rate over time
4. **Given** I want to understand why AI changed recommendations, **When** I ask AI, **Then** AI cites specific memory changes (e.g., "Your RPE decreased from 9 to 7, suggesting recovery")

---

### Edge Cases

- What happens when a user has conflicting memories (e.g., "avoid squats" preference but "squat-focused" goal)?
- How does system handle memory storage limits (max memories per user)?
- What occurs when AI retrieves outdated memories (e.g., injury from 2 years ago)?
- How are memories scoped in coach/athlete relationships (who can see what)?
- What happens to memories when a user deletes their account?
- How does system handle memory creation failures (e.g., database errors)?
- What occurs when a user is offline and creates context that should become a memory?
- How does AI prioritize when multiple memory types conflict (philosophy vs preference vs history)?

## Requirements *(mandatory)*

### Functional Requirements - Phase 1 (Foundation)

- **FR-001**: System MUST create profile memory automatically on onboarding completion containing: experience, goals, equipment, target events
- **FR-002**: System MUST create session_summary memory on workout completion containing: exercise count, average RPE, completion rate, user notes, performance metrics
- **FR-003**: System MUST create preference memory when user rejects or modifies AI exercise suggestions
- **FR-004**: System MUST create injury memory when user reports pain or modifies exercises due to discomfort
- **FR-005**: AI assistants MUST retrieve relevant memories before generating plans (plan-assistant, session-assistant, plan-generator)
- **FR-006**: System MUST inject top 10 most recent memories into AI system prompts, grouped by type (profile, injury, preference)
- **FR-007**: System MUST limit memory context injection to 500 tokens to preserve AI context budget
- **FR-008**: Injury memories MUST integrate with existing contraindication logic in session-planner
- **FR-009**: System MUST display "AI remembered your preference" toast notification when memories are created
- **FR-010**: System MUST scope memories by athlete_id, coach_id, or group_id based on user role

### Functional Requirements - Phase 2 (User Control & Semantic Search)

- **FR-011**: System MUST provide memory management UI at `/individual/[id]/memory` for viewing all memories
- **FR-012**: Users MUST be able to filter memories by type (preference, injury, profile, session_summary, philosophy, note)
- **FR-013**: Users MUST be able to edit memory content and mark injuries as "resolved"
- **FR-014**: Users MUST be able to delete memories with confirmation prompt
- **FR-015**: System MUST generate embeddings for all new memories using text-embedding-3-small model
- **FR-016**: System MUST use vector similarity search to retrieve semantically relevant memories (match_threshold: 0.7)
- **FR-017**: System MUST surface last 5 workout summaries to AI during plan generation
- **FR-018**: System MUST display "Why did AI suggest this?" explanations citing specific memories
- **FR-019**: System MUST show when each memory was created and last used by AI
- **FR-020**: Power users MUST be able to enable "auto-approve" mode to skip changeset approval for trusted AI suggestions

### Functional Requirements - Phase 3 (Agentic Memory & Knowledge Base)

- **FR-021**: AI MUST have createMemory tool to proactively suggest storing important context
- **FR-022**: System MUST prompt user for approval before AI-created memories are saved (except for auto-approve users)
- **FR-023**: AI MUST provide reasoning for why context is memory-worthy when suggesting memory creation
- **FR-024**: System MUST integrate knowledge_base_articles table using Hybrid RAG (metadata filtering + semantic search)
- **FR-025**: AI MUST retrieve relevant KB articles via metadata filters (coach_id, expertise_level, sport_focus) followed by vector similarity search
- **FR-026**: System MUST auto-generate tags for KB articles using cheap AI (GPT-4o-mini) when coaches create/update content
- **FR-027**: System MUST generate embeddings for KB articles using text-embedding-3-small model
- **FR-028**: Personal memories MUST take priority over coach KB when conflicts exist
- **FR-029**: System MUST track memory evolution by appending change history to metadata.evolution array
- **FR-030**: System MUST update existing memories rather than creating duplicates when context changes (e.g., injury recovery)
- **FR-031**: System MUST support User Context Overview page showing aggregated view of profile + memories + KB + history
- **FR-032**: System MUST display memory evolution timeline in memory management UI for memories with change history

### Key Entities

- **AI Memory** (`ai_memories` table): Stores context about users/athletes. Attributes: id, memory_type (enum), title, content, metadata (JSON), embedding (vector), created_by, coach_id, athlete_id, group_id, created_at, updated_at
- **Memory Types**:
  - `profile`: Biometrics, goals, experience, equipment (captured on onboarding)
  - `preference`: UI choices, exercise preferences, set/rep schemes (captured on AI rejection)
  - `injury`: Pain reports, contraindications, affected regions (captured on pain report)
  - `philosophy`: Training principles, periodization beliefs (captured from user statements)
  - `session_summary`: Workout completion data, RPE, performance (captured on workout completion)
  - `note`: Free-form context like travel, stress, fatigue (user-created or AI-suggested)
- **Workout Log** (`workout_logs`): Source data for session_summary memories
- **Knowledge Base Article** (`knowledge_base_articles`): Coach-created training content using Hybrid RAG architecture. Attributes: id, coach_id, title, content (markdown), category_id, embedding (vector), created_at, updated_at. Metadata structure (JSONB): expertise_level, sport_focus, tags (simple array auto-generated via GPT-4o-mini). Retrieved via metadata filtering (coach, expertise, sport) + vector similarity search (semantic matching). Simpler than skill-based triggers, more flexible than pure semantic search.

## Knowledge Base Architecture (Hybrid RAG)

The Knowledge Base uses **Hybrid RAG** - combining metadata filtering with semantic search - following 2026 industry best practices for production RAG systems.

### Why Not Folder-Based Skills?

**Memories** cannot use folder-based skills because they are:
- **Dynamic**: Auto-generated from user actions (not static markdown)
- **User-specific**: Scoped to `athlete_id` (not universal)
- **Relational**: Foreign keys to users, coaches, groups (SQL queries required)
- **High-volume**: Hundreds per user (not 5-20 global skills)
- **Evolving**: Content changes with user behavior (not manually edited)

**Knowledge Base** also cannot use folder-based skills because:
- **Permissions**: Needs RLS policies for coach/athlete access control
- **Search**: Requires SQL + vector similarity queries at scale
- **Updates**: Coaches edit via UI, not file system
- **Relationships**: Links to categories, coaches, athlete groups
- **Scalability**: Thousands of articles across all coaches

### Hybrid RAG Structure (Industry Standard 2026)

Knowledge Base articles use **simple metadata filters + semantic search**:

```typescript
// Stored in knowledge_base_articles table
type KnowledgeBaseArticle = {
  // Database fields
  id: number;
  coach_id: number;
  title: string;
  content: string; // Markdown content
  category_id: number; // Links to categories table
  created_at: timestamp;
  updated_at: timestamp;

  // Simple metadata (existing JSONB column)
  metadata: {
    expertise_level: "beginner" | "intermediate" | "advanced";
    sport_focus: string; // "track and field", "general fitness", etc.
    tags: string[]; // Simple tags: ["hamstring", "speed", "plyometric"]
  };

  // Vector for semantic search (Phase 3)
  embedding: vector(1536); // text-embedding-3-small
}
```

**Why this is simpler than complex trigger patterns:**
- ✅ No complex `triggers` or `when_to_apply` arrays to maintain
- ✅ Coaches just write markdown articles
- ✅ Tags auto-generated via cheap AI (GPT-4o-mini: $0.15/1M tokens)
- ✅ Semantic search handles variations ("hammy" = "hamstring")
- ✅ Metadata filters ensure scoping (expertise, sport, coach)

### Auto-Tagging with Cheap AI

When a coach creates/updates a KB article:

```typescript
// Auto-generate tags using cheap AI (~$0.0001 per article)
const tags = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // $0.15/1M input tokens, $0.60/1M output
  messages: [{
    role: 'system',
    content: 'Extract 3-5 training-related tags from this article. Return only a JSON array of tags.'
  }, {
    role: 'user',
    content: article.content
  }],
  response_format: { type: "json_object" }
});

// Auto-generate embedding
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small', // $0.02/1M tokens
  input: article.content
});

// Total cost: ~$0.0001 per article
```

Coaches can review/edit tags but don't have to manually create them.

### Retrieval Logic (Phase 3 - Hybrid RAG)

**Step 1: Metadata Filter** (fast, precise)
```sql
WHERE coach_id = $athlete_coach_id
  AND metadata->>'expertise_level' <= $athlete_level
  AND (metadata->>'sport_focus' = $athlete_sport OR metadata->>'sport_focus' = 'general')
```

**Step 2: Semantic Search** (flexible, handles variations)
```sql
ORDER BY embedding <=> $query_embedding
LIMIT 3
```

**Example:**
- Query: "What should I do for sore hamstrings after sprinting?"
- Metadata filter: Coach's articles only, athlete's expertise level, track focus
- Semantic search: Matches "Eccentric Hamstring Protocol" even if it doesn't say "sore"

**Benefits:**
- Automatic scoping (coach, expertise, sport)
- Handles synonyms ("hammy", "posterior chain", "hamstring")
- No manual trigger maintenance
- Scales to thousands of articles
- Industry standard architecture (AWS Bedrock, Pinecone, 2026 best practices)

### Hybrid Context System

AI receives three knowledge sources in Phase 3:

| Source | Type | Storage | Retrieval | Scope |
|--------|------|---------|-----------|-------|
| **Memories** | Dynamic, personal | Database | Recency + vector search | User-specific |
| **Knowledge Base** | Semi-static, expert | Database | Metadata filter + semantic search | Coach-specific |
| **Global Skills** | Static, universal | Filesystem | Pattern matching | Project-wide |

Example context injection:
```typescript
const context = {
  // User-specific, evolving
  personal_memories: [
    { type: "injury", content: "Left knee pain, avoid single-leg" },
    { type: "preference", content: "Prefers safety bar over back squat" }
  ],

  // Coach-specific, hybrid RAG
  coach_knowledge: [
    {
      title: "Eccentric Hamstring Protocol",
      tags: ["hamstring", "eccentric", "injury-prevention"],
      similarity: 0.89,
      content: "# Eccentric Hamstring Protocol\n\nFor athletes returning from hamstring strains..."
    }
  ],

  // Universal, static
  global_skills: [
    { name: "vercel-react-best-practices" } // For code review tasks
  ]
};
```

## Success Criteria *(mandatory)*

### Measurable Outcomes - Phase 1

- **SC-001**: AI cites at least one memory in 80% of plan generation requests (measurable via tool logs)
- **SC-002**: Users report injuries once and AI remembers them for all future sessions (zero repeated injury reports in subsequent conversations)
- **SC-003**: Average conversation turns to complete a plan decreases by 30% (from baseline of ~5 turns to ~3.5 turns)
- **SC-004**: Memory creation completes in under 500ms for 95% of requests
- **SC-005**: Memory retrieval adds no more than 200ms latency to AI request processing

### Measurable Outcomes - Phase 2

- **SC-006**: Power users (Marcus, Priya personas) use memory management UI at least once per week
- **SC-007**: Users successfully edit or delete memories without errors in 98% of attempts
- **SC-008**: Semantic memory search returns relevant memories with precision ≥0.8 (measured via user feedback: "Was this memory helpful?")
- **SC-009**: "Why did AI suggest this?" explanations are viewed by users in 40% of plan generation sessions
- **SC-010**: Workout history integration improves plan adaptiveness (measured by user satisfaction survey: "Does AI adapt to your progress?")

### Measurable Outcomes - Phase 3

- **SC-011**: AI proactively suggests creating memories in 20% of conversations with 70% user acceptance rate
- **SC-012**: Coach KB integration increases plan personalization for coached athletes (measured via coach feedback: "Does AI use your training methods?")
- **SC-013**: Memory evolution tracking reduces user confusion about AI behavior changes (measured via support tickets related to "Why did AI change?")
- **SC-014**: User Context Overview page is viewed by 30% of engaged users monthly
- **SC-015**: Zero instances of duplicate memories for the same concept (e.g., same injury stored twice)

## Phased Implementation Strategy

### Phase 1: Foundation (2 weeks - Ship to Beta)

**Scope**: Activate memory infrastructure with minimal UI changes.

**Deliverables**:
1. Memory creation API (`POST /api/ai/memories`)
2. Memory retrieval function (`getRelevantMemories`)
3. Inject memories into 3 AI assistants (plan-assistant, session-assistant, plan-generator)
4. Capture points: onboarding → profile, workout completion → session_summary, exercise rejection → preference
5. Injury memory integration with contraindication system
6. Toast notification UI ("AI remembered your preference")
7. E2E test using agent-browser

**Validation**: User completes onboarding, generates plan, completes workout, requests new plan. Verify AI references previous workout and equipment preferences without prompting.

---

### Phase 2: User Control & Semantic Search (4 weeks)

**Scope**: Give power users control + enable semantic retrieval.

**Deliverables**:
1. Memory management UI (`/individual/[id]/memory`)
2. Filter by type, edit/delete capabilities
3. Embedding generation on memory creation
4. Vector similarity search (`match_memories` stored procedure)
5. Workout history context (last 5 sessions)
6. "Why did AI suggest this?" explanations
7. Auto-approve settings for power users

**Validation**: User views all memories, edits injury to mark resolved, requests plan. Verify AI no longer avoids previously contraindicated exercises.

---

### Phase 3: Agentic Memory & Knowledge Base (8 weeks)

**Scope**: AI learns what to remember + integrates knowledge base.

**Deliverables**:
1. AI `createMemory` tool with approval flow
2. Knowledge base integration using Hybrid RAG (metadata filtering + semantic search)
3. Auto-tagging system for KB articles (GPT-4o-mini generates tags from content)
4. KB article embedding generation (text-embedding-3-small)
5. Hybrid KB retrieval function (metadata filter by coach/expertise/sport, then vector similarity search)
6. User Context Overview page (personal memories + coach KB + workout history)
7. Memory evolution tracking (metadata.evolution array)
8. Memory update logic (prevent duplicates)
9. Multi-modal memories (images, videos, race results)
10. Persona-specific approval flows (auto for Sarah, review for Marcus)

**Validation**: User mentions "I prefer high volume training" in chat. AI asks "Should I remember this philosophy?". User approves. Next plan reflects high volume approach without re-stating preference.

## Assumptions

- The `ai_memories` table already exists with proper schema and RLS policies (confirmed via database inspection)
- Users understand that memories improve AI personalization (no extensive onboarding required)
- Memory context budget of 500 tokens is sufficient for top 10 memories (avg ~50 tokens per memory)
- Recency-based retrieval is acceptable for Phase 1 (semantic search deferred to Phase 2)
- Injury memories are safety-critical and take precedence over preference memories
- Session summary memories can be auto-generated without user review (low risk)
- Preference memories require 2-3 instances of rejection to establish pattern (prevents false positives)
- Profile memories are updated, not duplicated, when user changes settings
- Coach KB articles use Hybrid RAG (simple metadata + semantic search) instead of complex skill-like trigger patterns
- Knowledge Base is database-backed (not folder-based) because it requires RLS, SQL queries, and coach-specific scoping
- Memories cannot use folder-based skills because they are dynamic, user-specific, relational, and high-volume
- KB article tags are auto-generated via cheap AI (GPT-4o-mini: ~$0.0001 per article) to minimize coach tagging burden
- Hybrid RAG retrieval (metadata filter → semantic search) is simpler and more maintainable than manual trigger arrays
- Metadata filtering (coach_id, expertise_level, sport_focus) provides precise scoping before semantic search
- Memory deletion is soft delete (mark inactive) rather than hard delete (preserves audit trail)
- Individual users (no coach) rely solely on personal memories + general training principles
- Coached athletes see combination of personal memories + coach KB (with personal taking priority)
- Maximum 1000 active memories per user is sufficient (archive old session_summary memories after 6 months)
- Embedding model (text-embedding-3-small) provides adequate semantic similarity for fitness domain
- Memory evolution is append-only (track changes in metadata, don't overwrite history)

## Dependencies

- Existing `ai_memories` table schema (already deployed)
- AI SDK 6.0 custom memory layer support
- OpenAI text-embedding-3-small API for Phase 2 memory embeddings and Phase 3 KB embeddings
- OpenAI GPT-4o-mini API for Phase 3 KB auto-tagging ($0.15/1M input tokens)
- PostgreSQL pgvector extension for Phase 2 vector search (memories and KB articles)
- Existing contraindication logic in `session-planner.ts` for injury integration
- Existing changeset approval flow for AI-generated memories
- `knowledge_base_articles` table for Phase 3 (already exists but unused)

## Out of Scope

- Memory sharing between users (each user's memories are private)
- Bulk memory import/export (manual entry or AI-generated only)
- Memory encryption beyond database-level encryption (RLS provides access control)
- Memory expiration/retention policies (all memories kept indefinitely in Phase 1-3)
- Cross-device memory sync conflicts (handled by database as source of truth)
- Memory versioning/rollback (use metadata.evolution for history, no undo functionality)
- Natural language memory queries (e.g., "Show me all squat-related memories") - defer to future phase
- Memory recommendations (e.g., "You should create a memory about X") - covered partially in Phase 3 AI-driven creation
