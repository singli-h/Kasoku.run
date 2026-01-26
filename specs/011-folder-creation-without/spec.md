# Feature Specification: Training Plan Folder Organization

**Feature Branch**: `011-folder-creation-without`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: " new fdolder first dont creat new branch"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Organizational Folders for Plan Templates (Priority: P1)

As a coach or individual user, I want to organize my training plan templates into logical folders (e.g., "Strength Programs", "Endurance Plans", "Sprint Training") so that I can find and reuse plans more easily without cluttering my active training schedule.

**Why this priority**: Core organizational feature that provides immediate value. Users with multiple templates need basic folder structure to maintain a clean workspace.

**Independent Test**: Can be fully tested by creating a folder, adding a plan template to it, and verifying the template is accessible from the folder view but does not appear in active training schedules.

**Acceptance Scenarios**:

1. **Given** I am viewing my plan library, **When** I click "Create Folder", **Then** I can name the folder and it appears in my library without creating any active training instances
2. **Given** I have an existing plan template, **When** I move it into a folder, **Then** the template is accessible from the folder but does not generate a new mesocycle or training progression
3. **Given** I have multiple folders, **When** I view my active training schedule, **Then** I see only my active plans, not the folder organization structure

---

### User Story 2 - Move Plans Between Folders (Priority: P2)

As a user with an organized plan library, I want to move templates between folders and reorganize my structure as my training philosophy evolves, without affecting any active training schedules.

**Why this priority**: Supports long-term organization flexibility. Users need to refine their organizational structure over time without disrupting active training.

**Independent Test**: Can be tested by moving a template from one folder to another and verifying it remains unchanged and doesn't trigger any plan regeneration or progression updates.

**Acceptance Scenarios**:

1. **Given** I have a plan template in "Folder A", **When** I drag it to "Folder B", **Then** the plan moves without modifying its content or creating duplicates
2. **Given** I have an active mesocycle based on a template in a folder, **When** I reorganize folders, **Then** my active training remains unaffected
3. **Given** I rename a folder, **When** the rename completes, **Then** all templates inside remain accessible with updated breadcrumb navigation

---

### User Story 3 - Nested Folder Structure (Priority: P3)

As a power user with extensive template libraries, I want to create nested folders (e.g., "Sprint Training" > "Acceleration" > "Block Periodization") to maintain a hierarchical organization system.

**Why this priority**: Advanced organizational feature for users with large template collections. Not essential for MVP but valuable for coaches managing dozens of programs.

**Independent Test**: Can be tested by creating folders within folders and verifying templates can be stored at any level without triggering automatic plan variations.

**Acceptance Scenarios**:

1. **Given** I am viewing a folder, **When** I create a subfolder, **Then** I can nest templates up to [NEEDS CLARIFICATION: maximum nesting depth - suggest 5 levels] deep
2. **Given** I have nested folders, **When** I view a template, **Then** I see the full breadcrumb path showing its location
3. **Given** I delete a parent folder, **When** deletion is confirmed, **Then** [NEEDS CLARIFICATION: behavior - should subfolders be deleted, moved to root, or require empty parent? Suggest require empty parent for safety]

---

### Edge Cases

- What happens when a folder name conflicts with an existing folder name?
- How does the system handle moving a template that is currently being used as the basis for an active mesocycle?
- What occurs if a user attempts to create a folder while offline (PWA mode)?
- How are folders shared between coach and athletes in group training scenarios?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create named folders for organizing plan templates
- **FR-002**: System MUST prevent folder creation from triggering automatic mesocycle generation or training progression
- **FR-003**: Users MUST be able to move plan templates between folders without modifying template content
- **FR-004**: System MUST display folder organization in the plan library view separately from active training schedules
- **FR-005**: System MUST support [NEEDS CLARIFICATION: suggest 100 templates per folder] templates per folder without performance degradation
- **FR-006**: Users MUST be able to rename folders without breaking references to templates inside
- **FR-007**: System MUST prevent deletion of folders that contain templates unless explicitly confirmed by user
- **FR-008**: System MUST preserve folder structure across user sessions and devices (sync)
- **FR-009**: System MUST distinguish between "template storage" (folders) and "active training instances" (mesocycles)
- **FR-010**: Users MUST be able to create folders without requiring a template to be added immediately (empty folders allowed)

### Key Entities

- **Folder**: A named container for organizing plan templates. Attributes include: name, parent folder (if nested), owner (user or coach), creation date, color/icon (optional).
- **Plan Template**: A reusable training plan structure stored in folders. Not an active mesocycle until explicitly instantiated by the user.
- **Active Mesocycle**: A training plan instance currently in use by an athlete. Not stored in folders - exists in the active training schedule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and organize folders in under 30 seconds without viewing documentation
- **SC-002**: System supports at least 50 folders per user without UI performance degradation
- **SC-003**: 95% of users successfully distinguish between template storage (folders) and active training plans on first use
- **SC-004**: Zero instances of folder operations accidentally creating unwanted mesocycle variations or training progressions
- **SC-005**: Folder reorganization operations (move, rename, delete) complete in under 2 seconds for folders containing up to 100 templates

## Assumptions

- Users understand the concept of folders from file system experience
- The system already has a concept of "plan templates" distinct from active mesocycles
- Users will primarily organize templates, not active training plans
- Folder structure is per-user (coaches and individual users each have their own folder organization)
- Maximum nesting depth of 5 levels is sufficient for most organizational needs (prevents infinite nesting complexity)
- 100 templates per folder is a reasonable upper bound (coaches with more can use subfolders)
- Folder operations should be non-destructive by default (require confirmation for destructive actions)
