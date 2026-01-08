# Feature Specification: ChangeSet Prompt Alignment

**Feature Branch**: `009-changeset-prompt-alignment`
**Created**: 2026-01-07
**Status**: Draft
**Input**: User description: "Align AI assistant tool naming with database schema and apply goal-oriented prompting patterns for coach and athlete domains"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent AI Assistant Experience Across Domains (Priority: P1)

Coaches and athletes interact with AI assistants that use consistent, predictable tool naming aligned with the underlying data structures. This ensures the AI provides clear, unambiguous feedback when proposing changes to training sessions or workout logs.

**Why this priority**: Inconsistent naming creates confusion in AI responses and makes debugging difficult. Alignment ensures both assistants behave predictably and maintainably.

**Independent Test**: Can be verified by having the AI propose changes in both coach and athlete domains and confirming tool names match their respective data entities.

**Acceptance Scenarios**:

1. **Given** a coach using the session planner AI, **When** the AI proposes adding an exercise, **Then** the tool name references "SessionPlanExercise" matching the database entity
2. **Given** an athlete using the workout logging AI, **When** the AI proposes logging a set, **Then** the tool name references "WorkoutLogSet" matching the database entity
3. **Given** either user domain, **When** the AI describes available tools, **Then** tool names clearly indicate which data entity they operate on

---

### User Story 2 - Athletes Can Remove Proposed Changes Before Confirmation (Priority: P2)

Athletes using the workout logging AI can ask to remove a proposed change from the pending changeset before confirming. This gives athletes control over what gets submitted for approval.

**Why this priority**: Currently athletes cannot remove proposals from the buffer, forcing them to reset the entire changeset. This wastes time when only one proposal needs removal.

**Independent Test**: Can be tested by having an athlete propose multiple changes, request removal of one, and confirm only the remaining changes are submitted.

**Acceptance Scenarios**:

1. **Given** an athlete has proposed multiple set logs in a changeset, **When** they ask the AI to remove one of the proposals, **Then** only that proposal is removed and others remain
2. **Given** an athlete asks to delete an already-saved workout log entry, **When** the AI attempts to delete it, **Then** the AI receives guidance that deletion of saved data is not allowed and suggests marking as incomplete instead
3. **Given** an athlete proposes a new exercise then decides to remove it, **When** they ask to remove it before confirming, **Then** the proposal is removed from the buffer successfully

---

### User Story 3 - Goal-Oriented AI Responses (Priority: P3)

AI assistants respond with goal-focused guidance rather than procedural instructions. The AI adapts its approach based on context rather than following rigid step-by-step workflows.

**Why this priority**: Goal-oriented prompting produces more natural, effective AI interactions. Users get better assistance when the AI focuses on outcomes rather than prescribed procedures.

**Independent Test**: Can be verified by reviewing AI responses to ensure they focus on what to achieve rather than how to achieve it step-by-step.

**Acceptance Scenarios**:

1. **Given** a coach requests a complex session modification, **When** the AI responds, **Then** the response focuses on the goal (e.g., "I'll add these exercises to your session") rather than listing procedural steps
2. **Given** an athlete provides ambiguous input, **When** the AI needs to make assumptions, **Then** it makes reasonable defaults and proceeds rather than requiring explicit step-by-step confirmation
3. **Given** a user's request is rejected with feedback, **When** the AI revises, **Then** it naturally adapts based on feedback without requiring explicit procedural instructions

---

### Edge Cases

- What happens when an athlete tries to delete a workout log entry that was already saved to the database?
  - System rejects deletion with helpful guidance suggesting to mark as incomplete instead
- What happens when tool names are referenced in existing code or documentation?
  - Renaming must be comprehensive across all usages
- How does the AI handle requests that span multiple entity types in a single changeset?
  - Tool naming remains consistent per entity type regardless of combination

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Coach AI assistant tools MUST use "SessionPlan" prefix matching database entities (SessionPlan, SessionPlanExercise, SessionPlanSet)
- **FR-002**: Athlete AI assistant tools MUST use "WorkoutLog" prefix matching database entities (WorkoutLog, WorkoutLogExercise, WorkoutLogSet)
- **FR-003**: Athlete AI assistant MUST support delete operations for removing proposals from the changeset buffer
- **FR-004**: Delete operations on already-saved workout data MUST be rejected with guidance to use update operations instead
- **FR-005**: AI system prompts MUST be goal-oriented, separating constraints from soft guidance
- **FR-006**: AI prompts MUST NOT include step-by-step procedural instructions
- **FR-007**: Tool results MUST guide the AI naturally without requiring explicit workflow documentation in prompts
- **FR-008**: System prompt builder functions MUST use consistent domain prefixes (buildCoachSystemPrompt, buildAthleteSystemPrompt)

### Key Entities

- **SessionPlan**: Coach-created training session template containing exercises and sets
- **SessionPlanExercise**: An exercise within a session plan
- **SessionPlanSet**: A set prescription within a session plan exercise
- **WorkoutLog**: Athlete's actual workout record with performance data
- **WorkoutLogExercise**: An exercise performed in a workout log
- **WorkoutLogSet**: Actual set performance data within a workout log exercise

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of AI assistant tool names match their corresponding database entity names
- **SC-002**: Athletes can remove individual proposals from changesets without resetting the entire buffer
- **SC-003**: AI prompts contain zero step-by-step procedural instructions
- **SC-004**: All prompt builder functions follow consistent naming convention with domain prefix
- **SC-005**: Delete operations on temporary (unsaved) proposals succeed; delete operations on saved data are rejected with helpful guidance

## Assumptions

- The existing ChangeSet pattern architecture remains unchanged; only tool naming and prompting are updated
- Database entity names (session_plans, workout_logs, etc.) are stable and will not change
- The transformation layer handles the distinction between temporary IDs and real database IDs
- Goal-oriented prompting principles from the documented prompting concepts guide are the standard to follow
