# Feature Specification: Frontend Responsive Design Fixes

**Feature Branch**: `001-frontend-responsive-design`
**Created**: 2025-12-03
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Mobile Coach Views Training Charts (Priority: P1)

As a coach using a mobile device, I want to view volume and intensity charts clearly so that I can monitor athlete training load on-the-go.

**Acceptance Scenarios**:
1. **Given** coach is on iPhone SE (320px), **When** viewing chart, **Then** chart height is 192px (h-48) and labels dont overlap
2. **Given** coach is on iPad (768px), **When** viewing chart, **Then** chart height is 224px (h-56)
3. **Given** coach is on desktop (1024px+), **When** viewing chart, **Then** chart height is 256px (h-64)

### User Story 2 - Accessible Keyboard Navigation (Priority: P1)

As a user navigating with keyboard only, I want to see clear focus indicators on all interactive elements.

**Acceptance Scenarios**:
1. **Given** user navigates with Tab key, **When** focusing any button, **Then** visible focus ring appears
2. **Given** user focuses input field, **When** typing, **Then** focus ring remains visible

### User Story 3 - Mobile Exercise Session Planning (Priority: P1)

As a coach planning sessions on mobile, I want exercise rows to fill screen width and have comfortable touch targets.

**Acceptance Scenarios**:
1. **Given** coach on session planner mobile, **When** viewing exercise rows, **Then** cards span nearly full width
2. **Given** coach taps icon button, **When** button has 44x44px target, **Then** tap registers reliably

---

### User Story 4 - Comprehensive E2E Testing with Database Verification (Priority: P1)

As a developer, I want comprehensive browser tests with Supabase verification so that all 3 pages are fully functional with no bugs remaining.

**Acceptance Scenarios**:
1. **Given** Plans page loaded, **When** creating new macrocycle, **Then** verify in Supabase macrocycles table and UI renders correctly on mobile/tablet/desktop
2. **Given** Session planner loaded, **When** adding/editing/deleting exercises, **Then** verify exercise_preset_groups table updates and layout is responsive
3. **Given** Workout page loaded, **When** athlete completes session, **Then** verify exercise_training_sessions table shows completed status
4. **Given** any page with dialogs, **When** opening modal, **Then** verify z-index stacking and focus trap works
5. **Given** empty state scenarios, **When** no data exists, **Then** verify empty state UI displays correctly without errors

## Requirements

### Functional Requirements

#### CSS/Layout Fixes
- **FR-001**: Charts MUST use responsive height: h-48 mobile, h-56 tablet, h-64 desktop
- **FR-002**: Chart margins MUST scale: 10px mobile, 20px tablet, 30px desktop
- **FR-003**: All interactive elements MUST show visible focus indicators
- **FR-004**: Icon buttons MUST have minimum 44x44px touch targets on mobile
- **FR-005**: Exercise cards on mobile MUST use w-[calc(100vw-2rem)]
- **FR-006**: System MUST implement centralized z-index hierarchy in Tailwind config

#### Browser Testing & Verification
- **FR-007**: AI-driven browser tests using Cursor browser tool MUST verify all 3 pages (Plans, Workout, Session) render correctly on mobile (375px), tablet (768px), and desktop (1920px) viewports
- **FR-008**: Tests MUST verify Supabase backend connectivity for CRUD operations using Supabase MCP server integration
- **FR-009**: Tests MUST run against development Supabase project (pcteaouusthwbgzczoae) and validate database state after each operation
- **FR-010**: Tests MUST verify end-to-end workflows: create plan → add session → assign to athlete → verify in database
- **FR-011**: Browser tests MUST validate responsive layout fixes (chart heights, focus indicators, touch targets) across all viewports
- **FR-012**: Tests MUST be executed on-demand by AI agent (not automated CI/CD) to allow interactive debugging and real-time Supabase verification
- **FR-013**: AI agent MUST use browser tool to navigate UI, perform actions, and verify both visual rendering and database state after each operation

### Non-Functional Requirements
- **NFR-001**: All fixes MUST comply with WCAG 2.1 Level AA
- **NFR-002**: Chart render time MUST remain under 100ms on mobile

## Success Criteria

### CSS/Layout Fixes
- **SC-001**: Mobile users can view charts without horizontal scroll on 320px screens
- **SC-002**: 100% of interactive elements have visible focus indicators
- **SC-003**: 100% of touch targets meet 44x44px minimum on mobile
- **SC-004**: 0 inline style attributes remain for width/height
- **SC-005**: 0 instances of outline-none without replacement focus styles

### Comprehensive Testing Coverage
- **SC-006**: All CRUD operations on Plans page verified via browser + Supabase (create, read, update, delete macrocycles/mesocycles/microcycles)
- **SC-007**: All CRUD operations on Workout page verified (start session, add performance data, complete session)
- **SC-008**: All CRUD operations on Session page verified (create exercises, update sets, delete exercises, assign to athletes)
- **SC-009**: Edge cases validated: empty states, deletion with dependencies, concurrent edits, invalid inputs
- **SC-010**: Responsive layout fixes verified on all 3 viewports (375px mobile, 768px tablet, 1920px desktop)
- **SC-011**: Database integrity verified after each operation (correct data in correct tables, no orphaned records)
- **SC-012**: Zero bugs remaining in production-critical workflows

### Definition of Done
- **SC-013**: All 6 CSS/layout fixes (FR-001 through FR-006) implemented and verified visually on mobile/tablet/desktop
- **SC-014**: All 7 browser testing requirements (FR-007 through FR-013) executed with AI agent confirming pass status
- **SC-015**: Zero console errors during browser test execution across all 3 pages
- **SC-016**: Zero failed Supabase database verifications (all CRUD operations persist correctly)
- **SC-017**: All edge cases from SC-009 handled gracefully without UI breaks or data corruption
- **SC-018**: Accessibility audit (axe-core) reports zero WCAG 2.1 Level AA violations
- **SC-019**: AI agent provides comprehensive test report with pass/fail status for each acceptance scenario
- **SC-020**: Feature ready for production deployment with documented test results

## Clarifications

### Session 2025-12-03

- Q: Should this feature remain CSS-only, or include backend bug fixes and automated testing? → A: CSS fixes + automated browser testing setup with Supabase verification
- Q: Which testing framework should we use for automated browser testing with Supabase verification? → A: Cursor browser tool with Supabase MCP integration
- Q: Which specific user journeys should the browser tests prioritize to ensure "no bugs left"? → A: Comprehensive workflows (all CRUD operations + edge cases like deletion, reassignment, empty states - 100% coverage)
- Q: Should the browser tests run automatically (CI/CD) or be executed manually on-demand by the AI agent? → A: AI agent on-demand (run tests manually via Cursor browser tool, allows interactive debugging and Supabase verification)
- Q: What is the acceptance criteria for completing this feature to ensure "no bugs left"? → A: All CSS fixes applied + comprehensive browser tests pass + zero failed database verifications + all edge cases handled (thorough, measurable)
