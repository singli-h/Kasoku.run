# Feature Specification: Migrate Database Primary Keys to UUID

**Feature Branch**: `007-migrate-database-primary`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Migrate database primary keys from auto-increment integers to UUID - This enables client-side ID generation for AI tools, eliminating the need for temp ID resolution when creating dependent entities (e.g., exercise + sets). UUIDs are globally unique and have native PostgreSQL/Supabase support. Migration includes all session_plan and workout_log tables."

## Clarifications

### Session 2026-01-02

- Q: Which tables should be migrated to UUID? → A: Session/Workout only - the 6 tables listed (session_plans, session_plan_exercises, session_plan_sets, workout_logs, workout_log_exercises, workout_log_sets)
- Q: Which library for client-side UUID generation? → A: Native `crypto.randomUUID()` (no package needed)
- Q: What migration strategy for downtime tolerance? → A: Simple maintenance window - pilot project with no active users, no zero-downtime requirement
- Q: How to handle orphaned records during migration? → A: Log and skip - skip orphaned records, log them for manual review
- Q: What ID format and PostgreSQL column type? → A: UUID with native `uuid` type (not ULID) - better Supabase support, native `gen_random_uuid()`, client-side `crypto.randomUUID()`, 16-byte storage

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Creates Exercise with Sets in Single Flow (Priority: P1)

When an athlete or coach uses the AI assistant to add a new exercise with sets, the AI tool generates real UUIDs upfront using `crypto.randomUUID()`. The AI can immediately use the exercise's UUID when creating dependent sets, without needing temp ID resolution.

**Why this priority**: This is the core problem being solved. Currently, sets for newly created exercises are skipped because temp IDs aren't resolved to real IDs during execution.

**Independent Test**: Can be fully tested by asking AI to "add bench press with 3 sets of 10 reps" and verifying both the exercise AND all 3 sets are created in the database with correct parent-child relationships.

**Acceptance Scenarios**:

1. **Given** an athlete is in a workout session with the AI assistant open, **When** they ask "add squats with 4 sets of 8 reps", **Then** the AI creates 1 exercise and 4 sets, all with UUID primary keys, and sets correctly reference the exercise's UUID as foreign key.
2. **Given** a coach is in session planner with AI assistant, **When** they ask "add a superset of bench press and rows, 3 sets each", **Then** 2 exercises and 6 sets are created with correct UUID relationships.

---

### User Story 2 - Existing Data Migration (Priority: P1)

All existing records with integer IDs are migrated to UUIDs while preserving relationships and data integrity.

**Why this priority**: Equal priority with Story 1 - migration must work correctly or existing data is corrupted.

**Independent Test**: Can be tested by running migration on a backup database and verifying all row counts match and foreign key relationships are intact.

**Acceptance Scenarios**:

1. **Given** existing session_plan_exercises with integer IDs, **When** migration runs, **Then** all records have new UUID primary keys and all referencing session_plan_sets have updated foreign keys.
2. **Given** existing workout_log_exercises with integer IDs, **When** migration runs, **Then** all records have new UUID primary keys and workout_log_sets foreign keys are updated accordingly.
3. **Given** a rollback is needed, **When** rollback migration runs, **Then** original integer IDs are restored from backup columns.

---

### User Story 3 - Application Code Compatibility (Priority: P2)

All TypeScript types, server actions, and UI components work correctly with string UUIDs instead of integer IDs.

**Why this priority**: Required for the feature to work, but follows naturally from the database changes.

**Independent Test**: Can be tested by running the full test suite and manually testing CRUD operations on all affected entities.

**Acceptance Scenarios**:

1. **Given** updated TypeScript types using `string` for IDs, **When** the application builds, **Then** no type errors occur.
2. **Given** a user views a session plan, **When** the page loads, **Then** exercises and sets display correctly with UUID-based data.
3. **Given** a user manually adds an exercise via UI (not AI), **When** they save, **Then** the exercise is created with a server-generated UUID via `gen_random_uuid()`.

---

### User Story 4 - AI Tool UUID Generation (Priority: P2)

AI proposal tools generate UUIDs client-side using `crypto.randomUUID()` and return them immediately to the AI, enabling it to reference entities in subsequent tool calls.

**Why this priority**: This is the key architectural change that eliminates temp ID complexity.

**Independent Test**: Can be tested by calling createExerciseChangeRequest tool and verifying it returns a valid UUID that can be used in subsequent createSetChangeRequest calls.

**Acceptance Scenarios**:

1. **Given** AI calls createExerciseChangeRequest, **When** the tool executes, **Then** it returns a valid UUID (36 characters, format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) as entityId.
2. **Given** AI received UUID "550e8400-e29b-41d4-a716-446655440000" from exercise creation, **When** AI calls createSetChangeRequest with that UUID as parent, **Then** the set is correctly associated with the exercise.

---

### Edge Cases

- **Orphaned records**: Migration logs and skips orphaned records (e.g., sets without parent exercise) for manual review
- **Concurrent ID generation**: UUID collision probability is negligible (1 in 2^122) - no special handling needed
- **Generation failure**: `crypto.randomUUID()` is built into modern browsers; server fallback uses PostgreSQL `gen_random_uuid()`
- **Legacy integer IDs in URLs**: Not applicable for pilot (no active users with bookmarks)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use native PostgreSQL `uuid` type as primary key for exactly 6 tables: session_plans, session_plan_exercises, session_plan_sets, workout_logs, workout_log_exercises, workout_log_sets (other tables remain unchanged)
- **FR-002**: System MUST generate UUIDs client-side using native `crypto.randomUUID()` in AI proposal tools before database insertion
- **FR-003**: System MUST migrate all existing integer IDs to UUIDs while preserving relationships
- **FR-004**: System MUST maintain referential integrity during and after migration
- **FR-005**: System MUST provide rollback capability for migration
- **FR-006**: AI tools MUST return generated UUID immediately so AI can reference it for dependent entities
- **FR-007**: System MUST update all TypeScript types from `number` to `string` for affected ID fields
- **FR-008**: System MUST update all Supabase queries to work with UUID string IDs
- **FR-009**: System MUST remove temp ID generation and resolution logic after migration
- **FR-010**: Server-side ID generation (non-AI paths) MUST use PostgreSQL `gen_random_uuid()` as default

### Key Entities *(include if feature involves data)*

- **session_plans**: Parent entity for session planning - PK migrates from `integer` to `uuid`
- **session_plan_exercises**: Exercise within a session - PK and FK (session_plan_id) migrate to `uuid`
- **session_plan_sets**: Set within an exercise - PK and FK (session_plan_exercise_id) migrate to `uuid`
- **workout_logs**: Parent entity for workout logging - PK migrates from `integer` to `uuid`
- **workout_log_exercises**: Exercise in a workout - PK and FKs migrate to `uuid`
- **workout_log_sets**: Set in a workout exercise - PK and FK migrate to `uuid`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI can create exercise + sets in single conversation with 100% success rate (currently failing)
- **SC-002**: All existing data migrated with zero data loss (row counts match pre/post migration)
- **SC-003**: All foreign key relationships preserved (referential integrity check passes)
- **SC-004**: Application builds with zero type errors after ID type changes
- **SC-005**: All existing automated tests pass after migration
- **SC-006**: No temp ID resolution code remains in codebase (code cleanup complete)
