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

### User Story 1 - Athlete Logs Workout Results (Priority: P1)

An athlete completes their training session and wants to log their actual performance (weights, reps, RPE) by describing it naturally, without manually entering each set.

**Why this priority**: This is the core value proposition - reducing friction in workout logging. Athletes currently abandon logging due to tedious data entry. Natural language input dramatically improves adoption.

**Independent Test**: Can be fully tested by having an athlete describe their workout in natural language and verifying the data is correctly stored in the database.

**Acceptance Scenarios**:

1. **Given** an athlete has an assigned session with 3 exercises, **When** they say "I did squats 100kg for 5 reps, felt like RPE 8, then bench press 80kg for 8 reps, and finished with rows at 60kg for 10", **Then** the system creates performance records for all 3 exercises with correct weights, reps, and RPE values.

2. **Given** an athlete is mid-workout, **When** they say "Just finished my first set of deadlifts, 120kg for 5, felt heavy", **Then** the system logs that set and the assistant acknowledges the effort and RPE interpretation.

3. **Given** an athlete provides incomplete information like "Did my squats today, felt good", **When** the assistant processes this, **Then** it asks clarifying questions about weight, reps, and sets before logging.

4. **Given** an athlete mentions an exercise not in their assigned session, **When** they try to log it, **Then** the assistant warns them and offers to add the exercise first or log it as an extra exercise.

---

### User Story 2 - Coach Modifies Session Content (Priority: P2)

A coach needs to quickly modify a training session by swapping exercises, adjusting sets/reps, or adding new exercises - using natural language instead of navigating complex UI.

**Why this priority**: Coaches manage multiple athletes and need rapid iteration. Natural language modifications save significant time compared to form-based editing.

**Independent Test**: Can be tested by having a coach request session modifications via chat and verifying the changes are correctly applied to the database.

**Acceptance Scenarios**:

1. **Given** a coach viewing an athlete's assigned session, **When** they say "Swap back squats for safety bar squats", **Then** the system replaces the exercise while preserving sets, reps, and other parameters.

2. **Given** a coach has a template session, **When** they say "Add 2 sets of face pulls at the end", **Then** the system adds the exercise with 2 sets to the template.

3. **Given** a coach wants to adjust volume, **When** they say "Reduce all sets by 1 for the recovery week", **Then** all exercises in the session have their set count decremented.

4. **Given** a coach requests an exercise that doesn't exist in the library, **When** the assistant cannot find it, **Then** it suggests similar alternatives from the exercise library.

---

### User Story 3 - User Searches for Exercise Alternatives (Priority: P2)

An athlete or coach needs to find alternative exercises based on constraints like equipment availability, injury considerations, or muscle group targeting.

**Why this priority**: Critical for accessibility - users shouldn't be blocked by equipment or injury constraints. Enables continued training progress.

**Independent Test**: Can be tested by requesting exercise alternatives with various constraints and verifying appropriate exercises are returned.

**Acceptance Scenarios**:

1. **Given** an athlete says "My knee hurts during squats, what can I do instead?", **When** the assistant searches, **Then** it returns knee-friendly leg exercises with brief explanations of why they're suitable.

2. **Given** a user says "I don't have a barbell, give me alternatives for bench press", **When** the assistant searches, **Then** it returns chest exercises that don't require a barbell.

3. **Given** a coach asks "Find me 3 posterior chain exercises for beginners", **When** the assistant searches, **Then** it returns beginner-appropriate exercises targeting the posterior chain with difficulty ratings.

---

### User Story 4 - Multi-Turn Coaching Conversation (Priority: P3)

A coach engages in a multi-turn conversation to iteratively refine a session, with the assistant remembering previous context.

**Why this priority**: Enables complex workflows that span multiple exchanges. Less critical for MVP but important for power users.

**Independent Test**: Can be tested by having a multi-turn conversation where later messages reference earlier context.

**Acceptance Scenarios**:

1. **Given** a coach says "Add Romanian deadlifts" then later says "Actually, make that 4 sets instead of 3", **When** processed, **Then** the assistant understands "that" refers to the Romanian deadlifts just added.

2. **Given** a conversation about modifying an athlete's session, **When** the coach asks "What changes have we made so far?", **Then** the assistant summarizes all modifications in the current conversation.

3. **Given** a coach leaves and returns later with the same conversation, **When** they say "Continue where we left off", **Then** the assistant recalls the conversation context and pending actions.

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

- **Conversation**: A stateful dialogue between a user and the AI assistant, associated with a session context. Contains ordered message items and metadata.
- **Session Context**: The training session being discussed - either a template (coach blueprint) or assigned session (athlete instance). Provides grounding for AI operations.
- **Tool Invocation**: A structured action the AI decides to take (modify, log, search). Contains validated parameters and execution results.
- **Memory**: A summarized record of past session performance stored for future AI context. Enables personalized recommendations.

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
