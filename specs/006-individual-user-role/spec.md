# Feature Specification: Individual User Role

**Feature Branch**: `006-individual-user-role`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Individual User Role: Add support for individual users who want to self-coach with AI assistance. This role sits between athlete and coach - individuals can create their own training plans ('Training Blocks'), log workouts, and benefit from AI-assisted planning."
**Related Design Doc**: [Individual User Role Design](../../../apps/web/docs/features/individual-user-role-design.md)

---

## Clarifications

### Session 2026-01-02

- Q: How does Individual relate to other roles? → A: Individual = Athlete + self-planning (shares athlete navigation, plus "My Training" for creating own plans)
- Q: Should individuals have Knowledge Base access? → A: Yes, individuals should have Knowledge Base access (same as athletes)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role Selection During Onboarding (Priority: P1)

A new user arrives at Kasoku.run and wants to train themselves without a coach. During onboarding, they should be able to select "Train Myself" as their role, which creates an Individual account with simplified onboarding questions focused on personal training goals.

**Why this priority**: This is the entry point for all individual users. Without this, no other individual features can be accessed. It enables the entire individual user segment.

**Independent Test**: Can be fully tested by completing the onboarding flow with "Train Myself" selected. Delivers value by allowing users to create accounts tailored to self-coaching.

**Acceptance Scenarios**:

1. **Given** a new user on the role selection screen, **When** they view the available roles, **Then** they see three options: "Train with a Coach" (Athlete), "Train Myself" (Individual), and "Coach Athletes" (Coach)
2. **Given** a user selects "Train Myself", **When** they proceed to the next step, **Then** they see a simplified onboarding form with training goals, experience level, and available equipment fields
3. **Given** a user completes individual onboarding, **When** the account is created, **Then** their user role is set to 'individual' and an athlete record is silently created for future upgrade path support
4. **Given** an individual user completes onboarding, **When** they are redirected to the dashboard, **Then** they see a personalized welcome with individual-specific navigation

---

### User Story 2 - Individual Navigation and Access Control (Priority: P1)

An individual user navigates the application and sees only the features relevant to their role. Since Individual = Athlete + self-planning, they should see all athlete navigation items plus "My Training" (plans). This includes: "Workout", "Exercise Library", "Knowledge Base", "Performance", "My Training", and "Settings" - but NOT "Athletes" or "Sessions" (coach-only features).

**Why this priority**: Navigation defines the user's entire experience. Without proper role-based navigation, individuals would be confused by coach features or blocked from accessing their training features.

**Independent Test**: Can be fully tested by logging in as an individual user and verifying sidebar navigation items. Delivers value by providing a focused, clutter-free interface.

**Acceptance Scenarios**:

1. **Given** an individual user is logged in, **When** they view the sidebar, **Then** they see: Overview, Workout, My Training, Exercise Library, Knowledge Base, Performance, and Settings
2. **Given** an individual user is logged in, **When** they view the sidebar, **Then** they do NOT see: Athletes, Sessions (coach-only)
3. **Given** an individual user tries to access /athletes directly, **When** the page loads, **Then** they are redirected to their dashboard with an appropriate message

---

### User Story 3 - Simplified Training Block Creation (Priority: P2)

An individual user wants to create a training plan. They should see simplified periodization using friendly terminology: "Training Block" instead of "Mesocycle", "Week" instead of "Microcycle", and "Workout" instead of "Session Plan". The Macrocycle level should be hidden entirely.

**Why this priority**: This is the core planning functionality for individuals. Using friendly terminology reduces confusion and makes the app accessible to casual fitness enthusiasts, not just serious athletes.

**Independent Test**: Can be fully tested by creating a Training Block as an individual user and verifying terminology throughout the flow. Delivers value by enabling personal training plan creation.

**Acceptance Scenarios**:

1. **Given** an individual user is on the training page, **When** they create a new plan, **Then** they see "Create Training Block" (not "Create Mesocycle")
2. **Given** an individual user views their Training Block, **When** they see the structure, **Then** they see "Week 1", "Week 2", etc. (not "Microcycle 1")
3. **Given** an individual user views their Week, **When** they see sessions, **Then** they are labeled as "Workouts" (not "Session Plans")
4. **Given** an individual user is creating a Training Block, **When** they look for Macrocycle options, **Then** no Macrocycle creation or selection is visible
5. **Given** an individual user creates a Training Block, **When** they try to create another, **Then** they are informed they can only have one active Training Block at a time

---

### User Story 4 - Workout Logging for Individuals (Priority: P2)

An individual user wants to log their workout after completing a training session. They should be able to access the workout page, start a workout from their Training Block, and log exercises with sets, reps, and weights.

**Why this priority**: Workout logging is essential for tracking progress and enables AI to provide contextual suggestions. Without it, individuals cannot benefit from the periodization context.

**Independent Test**: Can be fully tested by logging a complete workout as an individual user. Delivers value by recording training data for progress tracking.

**Acceptance Scenarios**:

1. **Given** an individual user is on the Workout page, **When** they view today's planned workout, **Then** they see the workout from their current Training Block/Week
2. **Given** an individual user starts a workout, **When** they log exercises, **Then** their progress is saved to their athlete record
3. **Given** an individual user completes a workout, **When** they finish logging, **Then** the workout appears in their training history

---

### User Story 5 - Individual to Coach/Athlete Upgrade Path (Priority: P3)

An individual user decides they want to either become a coach or join a coach's team. Their existing Training Blocks and workout history should be preserved during the role transition.

**Why this priority**: Supports user growth and prevents data loss. Less critical for MVP but important for long-term retention and user satisfaction.

**Independent Test**: Can be fully tested by changing an individual's role and verifying data persistence. Delivers value by enabling seamless account evolution.

**Acceptance Scenarios**:

1. **Given** an individual user upgrades to Coach role, **When** the transition completes, **Then** their existing athlete record is preserved and they can still access personal Training Blocks
2. **Given** an individual user joins a coach (becomes Athlete), **When** the transition completes, **Then** their existing athlete record is linked to the coach's group and previous Training Blocks become read-only history
3. **Given** an individual user transitions to any role, **When** they view their workout history, **Then** all previously logged workouts remain accessible

---

### Edge Cases

- What happens when an individual tries to create a second active Training Block?
  - System displays message that only one active Training Block is allowed and offers to complete or archive the current one
- What happens when an individual's Training Block duration ends?
  - System prompts user to create a new Training Block or extend the current one
- How does the system handle an individual user who was previously a coach?
  - Individual role creation should work independently of previous role history; athlete record is created if not exists
- What happens when an individual user accesses the app with no active Training Block?
  - Dashboard shows empty state with prominent "Create Your First Training Block" call-to-action

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to select "Individual" (displayed as "Train Myself") as a role option during onboarding
- **FR-002**: System MUST create an athlete record silently when an individual user completes onboarding (to support workout_logs foreign key and future upgrade path)
- **FR-003**: System MUST display role-based navigation where individuals see: Overview, Workout, My Training, Exercise Library, Knowledge Base, Performance, Settings (athlete navigation + My Training)
- **FR-004**: System MUST hide coach-only navigation items (Athletes, Sessions) from individual users
- **FR-005**: System MUST use role-based terminology for individuals: "Training Block" (mesocycle), "Week" (microcycle), "Workout" (session plan)
- **FR-006**: System MUST hide Macrocycle-level planning from individual users entirely
- **FR-007**: System MUST restrict individual users to one active Training Block at a time
- **FR-008**: System MUST link individual's Training Blocks directly to user_id (not through athlete_group)
- **FR-009**: System MUST support role transitions from Individual to Coach while preserving athlete record and training history
- **FR-010**: System MUST support role transitions from Individual to Athlete (with coach) while preserving workout history
- **FR-011**: System MUST provide individual-specific onboarding fields: training goals, experience level, available equipment
- **FR-012**: System MUST expose `isIndividual` computed property in the user role context for component-level access control

### Key Entities

- **User Role**: Extended to include 'individual' alongside 'athlete', 'coach', 'admin'. Determines navigation visibility and feature access.
- **Training Block**: User-friendly name for Mesocycle when viewed by individuals. Represents a 3-6 week focused training period.
- **Week**: User-friendly name for Microcycle when viewed by individuals. Represents a single training week within a Block.
- **Workout**: User-friendly name for Session Plan when viewed by individuals. Represents a single training session.
- **Athlete Record (for Individual)**: Created silently during onboarding to satisfy workout_logs foreign key and enable smooth upgrade path.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete individual role onboarding in under 90 seconds (simplified flow with fewer fields than coach)
- **SC-002**: Individual users see only role-appropriate navigation items (5-6 items vs 8+ for coaches) on first login
- **SC-003**: 100% of individual users can create a Training Block without encountering "Macrocycle" or "Mesocycle" terminology
- **SC-004**: Individual users can log workouts and view them in training history within the same session
- **SC-005**: Role transitions (Individual → Coach or Individual → Athlete) preserve 100% of existing workout history
- **SC-006**: Individual users report the interface as "easy to understand" in usability testing (target: 4/5 or higher on simplicity rating)

---

## Assumptions

The following assumptions were made based on the design document and industry standards:

1. **Database schema already supports individual users**: The existing nullable `athlete_group_id` fields and `session_mode: 'individual'` value confirm infrastructure readiness.
2. **One active Training Block is sufficient**: Based on industry research (Hevy, Alpha Progression), consumer fitness apps typically limit concurrent training programs.
3. **AI Assistant branding preferred over AI Coach**: Per product owner decision, the AI should be positioned as a helpful assistant rather than an authoritative coach figure.
4. **Beta phase means no pricing differentiation**: Individual role is free for now; monetization decisions deferred to future.
5. **Terminology mapping is role-based, not preference-based**: Individuals always see "Training Block", coaches always see "Mesocycle" - no user toggle.

---

*Specification ready for validation and planning phase.*
