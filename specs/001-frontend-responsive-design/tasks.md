---

description: "Task list for Frontend Responsive Design Fixes implementation"
---

# Tasks: Frontend Responsive Design Fixes

**Input**: Design documents from `/specs/001-frontend-responsive-design/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (reference), contracts/ (reference), quickstart.md (complete)

**Tests**: This feature includes comprehensive browser testing as specified in User Story 4 and functional requirements FR-007 through FR-013.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js 15 monorepo project:
- Primary app: `apps/web/`
- Components: `apps/web/components/`
- Actions: `apps/web/actions/`
- Config: `apps/web/tailwind.config.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch creation and environment verification

- [ ] T001 Create feature branch `001-frontend-responsive-design` from main
- [ ] T002 Verify development environment (Node.js 18+, npm dependencies installed)
- [ ] T003 Start development server (`npm run dev` in apps/web/)
- [ ] T004 Verify Supabase dev project access (pcteaouusthwbgzczoae, eu-west-2)
- [ ] T005 Verify Cursor browser tool and Supabase MCP integration availability

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Baseline verification before any CSS changes

**⚠️ CRITICAL**: Verify current state before modifications to establish regression testing baseline

- [ ] T006 Document current mobile viewport behavior at 375px width (screenshot Plans, Workout, Session pages)
- [ ] T007 Document current tablet viewport behavior at 768px width (screenshot all 3 pages)
- [ ] T008 Document current desktop viewport behavior at 1920px width (screenshot all 3 pages)
- [ ] T009 Verify existing utilities in apps/web/app/globals.css (.touch-target, .mobile-safe-x)
- [ ] T010 Run type-check baseline (`npm run type-check` - ensure no existing errors)
- [ ] T011 Run lint baseline (`npm run lint` - ensure no existing errors)

**Checkpoint**: Baseline established - CSS fixes can now begin

---

## Phase 3: User Story 1 - Mobile Coach Views Training Charts (Priority: P1) 🎯 MVP

**Goal**: Enable coaches to view volume/intensity charts clearly on mobile devices without horizontal scroll or label overlap

**Independent Test**:
1. Resize browser to 375px width
2. Navigate to /plans
3. Chart should be 192px tall (h-48)
4. X-axis labels should not overlap
5. No horizontal scroll required

**Success Criteria**: SC-001 (mobile users can view charts without horizontal scroll on 320px screens)

### Implementation for User Story 1

- [ ] T012 [US1] Add responsive chart height classes in apps/web/components/features/plans/home/VolumeIntensityChart.tsx (change h-64 to h-48 sm:h-56 md:h-64)
- [ ] T013 [US1] Add 'use client' directive to VolumeIntensityChart.tsx if not present (required for useResponsiveChartMargins hook)
- [ ] T014 [US1] Implement useResponsiveChartMargins hook in VolumeIntensityChart.tsx (10px mobile, 20px tablet, 30px desktop margins)
- [ ] T015 [US1] Apply responsive margins to ComposedChart margin prop in VolumeIntensityChart.tsx
- [ ] T016 [US1] Test chart rendering at 375px width (verify 192px height, no label overlap)
- [ ] T017 [US1] Test chart rendering at 768px width (verify 224px height)
- [ ] T018 [US1] Test chart rendering at 1920px width (verify 256px height, original behavior maintained)

**Checkpoint**: Charts now responsive across all viewports - User Story 1 complete

---

## Phase 4: User Story 2 - Accessible Keyboard Navigation (Priority: P1)

**Goal**: Enable keyboard-only users to navigate with visible focus indicators on all interactive elements

**Independent Test**:
1. Navigate to any page (Plans, Workout, Session)
2. Press Tab key repeatedly
3. All buttons, inputs, and interactive elements should show blue ring indicator
4. Ring should be 2px wide with 2px offset

**Success Criteria**: SC-002 (100% of interactive elements have visible focus indicators), SC-005 (0 instances of outline-none without replacement focus styles)

### Implementation for User Story 2

- [ ] T019 [P] [US2] Remove outline-none and add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 to interactive elements in apps/web/components/ui/sidebar.tsx
- [ ] T020 [P] [US2] Remove outline-none and add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 to DialogContent in apps/web/components/ui/dialog.tsx
- [ ] T021 [P] [US2] Remove outline-none and add focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 to Button variants in apps/web/components/ui/button.tsx
- [ ] T022 [US2] Verify focus indicators in light mode (Tab through Plans page)
- [ ] T023 [US2] Verify focus indicators in dark mode (Tab through Plans page)
- [ ] T024 [US2] Test focus indicators on Workout page (all interactive elements)
- [ ] T025 [US2] Test focus indicators on Session page (all interactive elements)

**Checkpoint**: All interactive elements now have WCAG 2.1 AA compliant focus indicators - User Story 2 complete

---

## Phase 5: User Story 3 - Mobile Exercise Session Planning (Priority: P1)

**Goal**: Enable coaches to plan sessions on mobile with full-width exercise cards and comfortable touch targets

**Independent Test**:
1. Navigate to Session Planner on mobile (375px width)
2. Exercise cards should fill nearly entire screen width (minus padding)
3. No forced horizontal scroll
4. Icon buttons should be minimum 44x44px (verify with devtools)

**Success Criteria**: SC-003 (100% of touch targets meet 44x44px minimum on mobile), SC-004 (0 inline style attributes remain for width/height)

### Implementation for User Story 3

- [ ] T026 [P] [US3] Change exercise card width from w-[85vw] to w-[calc(100vw-2rem)] in apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx
- [ ] T027 [P] [US3] Update max-width from max-w-[320px] to max-w-[360px] in ExerciseRow.tsx mobile card
- [ ] T028 [P] [US3] Add touch-target utility class to sm button variant in apps/web/components/ui/button.tsx
- [ ] T029 [US3] Add centralized z-index scale to apps/web/tailwind.config.ts theme.extend.zIndex (sidebar: 10, header: 20, dropdown: 30, tooltip: 40, modal: 50, toast: 60)
- [ ] T030 [US3] Update sidebar.tsx to use z-sidebar instead of z-10
- [ ] T031 [US3] Update dialog.tsx DialogContent to use z-modal instead of z-50
- [ ] T032 [US3] Add overflow-y-auto to dialog.tsx DialogContent className (enable scrolling for long content)
- [ ] T033 [US3] Test exercise card width on mobile (375px - should fill screen minus padding)
- [ ] T034 [US3] Test touch targets with Chrome DevTools (verify 44x44px minimum for all icon buttons)
- [ ] T035 [US3] Test dialog overflow with 10+ items (should scroll without cutting off content)
- [ ] T036 [US3] Test z-index stacking (open dialog with sidebar visible - dialog should appear above)

**Checkpoint**: Mobile session planning now optimized - User Story 3 complete

---

## Phase 6: User Story 4 - Comprehensive E2E Testing with Database Verification (Priority: P1)

**Goal**: Execute comprehensive browser tests with Supabase verification to ensure all 3 pages are fully functional with no bugs remaining

**Independent Test**: AI agent executes ~50-70 test scenarios across all pages using Cursor browser tool + Supabase MCP, reports pass/fail status

**Success Criteria**: SC-006 through SC-012 (all CRUD operations verified), SC-013 through SC-020 (definition of done)

### Browser Testing for User Story 4

- [ ] T037 [US4] Verify dev server is running (http://localhost:3000) and accessible
- [ ] T038 [US4] Verify Supabase MCP connection to dev project (pcteaouusthwbgzczoae)
- [ ] T039 [US4] Launch Cursor AI agent with browser tool access

#### Plans Page Tests (~20 scenarios)

- [ ] T040 [P] [US4] Test create macrocycle on Plans page - verify row in Supabase macrocycles table with correct user_id
- [ ] T041 [P] [US4] Test read/display macrocycle list on Plans page - verify data matches Supabase
- [ ] T042 [P] [US4] Test update macrocycle name on Plans page - verify Supabase row updated
- [ ] T043 [P] [US4] Test create mesocycle within macrocycle - verify Supabase mesocycles table with correct macrocycle_id
- [ ] T044 [P] [US4] Test update mesocycle volume/intensity - verify Supabase row updated
- [ ] T045 [P] [US4] Test create microcycle within mesocycle - verify Supabase microcycles table with correct mesocycle_id
- [ ] T046 [US4] Test delete macrocycle - verify cascade delete to mesocycles and microcycles in Supabase
- [ ] T047 [US4] Test assign plan to athlete - verify assignment in Supabase
- [ ] T048 [P] [US4] Test Plans page responsive layout at 375px width (chart height, focus indicators)
- [ ] T049 [P] [US4] Test Plans page responsive layout at 768px width
- [ ] T050 [P] [US4] Test Plans page responsive layout at 1920px width
- [ ] T051 [US4] Test Plans page empty state (no macrocycles) - verify UI displays correctly without errors
- [ ] T052 [US4] Test dialog z-index stacking on Plans page (open assignment dialog with sidebar visible)

#### Workout Page Tests (~15 scenarios)

- [ ] T053 [P] [US4] Test start training session on Workout page - verify status changes from 'assigned' to 'ongoing' in exercise_training_sessions table
- [ ] T054 [P] [US4] Test add performance data (reps, weight) to exercise - verify row created in exercise_training_details table
- [ ] T055 [P] [US4] Test add time-based performance data - verify time_seconds in exercise_training_details
- [ ] T056 [US4] Test complete training session - verify status='completed' and completed_at timestamp set in exercise_training_sessions
- [ ] T057 [P] [US4] Test Workout page responsive layout at 375px width (touch targets 44x44px)
- [ ] T058 [P] [US4] Test Workout page responsive layout at 768px width
- [ ] T059 [P] [US4] Test Workout page responsive layout at 1920px width
- [ ] T060 [US4] Test Workout page empty state (no assigned sessions) - verify UI without errors
- [ ] T061 [US4] Test incomplete session handling (athlete exits mid-workout) - verify status remains 'ongoing'
- [ ] T062 [US4] Test performance data with zero values - verify edge case handling

#### Session Page Tests (~20 scenarios)

- [ ] T063 [P] [US4] Test create new session in Session Planner - verify row in exercise_preset_groups table
- [ ] T064 [P] [US4] Test add exercise to session - verify row in exercise_presets table with correct order
- [ ] T065 [P] [US4] Test add multiple exercises - verify all rows in exercise_presets with sequential order values
- [ ] T066 [US4] Test update set parameters (reps, weight) for exercise - verify rows in exercise_preset_details table
- [ ] T067 [US4] Test delete exercise from session - verify row removed from exercise_presets and cascade to exercise_preset_details
- [ ] T068 [US4] Test superset grouping - verify superset_group field in exercise_presets table
- [ ] T069 [US4] Test save session with all exercises - verify all data persisted in Supabase (exercise_preset_groups, exercise_presets, exercise_preset_details)
- [ ] T070 [P] [US4] Test Session page responsive layout at 375px width (exercise cards fill screen width)
- [ ] T071 [P] [US4] Test Session page responsive layout at 768px width
- [ ] T072 [P] [US4] Test Session page responsive layout at 1920px width
- [ ] T073 [US4] Test Session page empty state (no exercises added) - verify UI without errors
- [ ] T074 [US4] Test unsaved changes warning (navigate away without saving)
- [ ] T075 [US4] Test exercise card mobile width (should be w-[calc(100vw-2rem)])

#### Cross-Page Tests (~10 scenarios)

- [ ] T076 [P] [US4] Test focus trap navigation across all pages (Tab key should cycle through interactive elements)
- [ ] T077 [P] [US4] Test keyboard navigation (Enter/Space to activate buttons) on all pages
- [ ] T078 [US4] Test dialog overflow on all pages (10+ items should scroll)
- [ ] T079 [US4] Test z-index hierarchy across pages (open dialogs/tooltips/toasts simultaneously)
- [ ] T080 [US4] Test concurrent edits (two users editing same macrocycle) - verify data integrity
- [ ] T081 [US4] Test RLS policies (verify users can only access their own data via Supabase queries)
- [ ] T082 [US4] Test deletion with dependencies (delete mesocycle with microcycles) - verify cascade
- [ ] T083 [US4] Test empty states across all pages (no data scenarios)
- [ ] T084 [US4] Verify zero console errors during all test scenarios
- [ ] T085 [US4] Run axe-core accessibility audit on all 3 pages - verify zero WCAG 2.1 Level AA violations

#### Test Report Generation

- [ ] T086 [US4] Generate comprehensive test report with pass/fail status for each scenario (65+ tests)
- [ ] T087 [US4] Document any failed tests with screenshots and Supabase query results
- [ ] T088 [US4] Verify all 20 success criteria (SC-001 through SC-020) are met
- [ ] T089 [US4] Confirm zero bugs remaining in production-critical workflows

**Checkpoint**: All CSS fixes verified, all CRUD operations tested, database integrity confirmed - User Story 4 complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and deployment preparation

- [ ] T090 [P] Run TypeScript type-check (`npm run type-check` in apps/web/) - ensure zero errors
- [ ] T091 [P] Run ESLint (`npm run lint` in apps/web/) - ensure zero errors
- [ ] T092 [P] Run production build (`npm run build` in apps/web/) - ensure successful compilation
- [ ] T093 Verify all files modified match plan.md list (7 files total)
- [ ] T094 Review git diff to ensure no unintended changes
- [ ] T095 Run quickstart.md testing checklist (10 verification items)
- [ ] T096 Update CLAUDE.md with completed feature status (mark responsive design as complete)
- [ ] T097 Commit changes with conventional commit message: "fix: responsive design and accessibility improvements for Plans, Workout, and Session pages"
- [ ] T098 Push feature branch to origin (git push origin 001-frontend-responsive-design)
- [ ] T099 Create pull request with comprehensive test report attached
- [ ] T100 Request code review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Mobile Charts): Can start after Foundational
  - User Story 2 (Focus Indicators): Can start after Foundational (independent of US1)
  - User Story 3 (Session Planning): Can start after Foundational (independent of US1, US2)
  - User Story 4 (Browser Testing): MUST wait for US1, US2, US3 completion (validates all CSS fixes)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, US2
- **User Story 4 (P1)**: Depends on US1, US2, US3 completion - Tests all CSS fixes

### Within Each User Story

- **User Story 1**: Chart height → Chart margins → Testing (sequential within story)
- **User Story 2**: All focus indicator changes are parallel [P], then testing
- **User Story 3**: Card width/touch targets parallel [P] → Z-index/overflow changes → Testing
- **User Story 4**: Server/MCP setup → All test scenarios can run in parallel [P] → Report generation

### Parallel Opportunities

- **Phase 2 (Foundational)**: T006, T007, T008 can run in parallel (screenshot different viewports)
- **User Story 2**: T019, T020, T021 can run in parallel (different files)
- **User Story 3**: T026, T027, T028 can run in parallel (different files)
- **User Story 4 Plans Tests**: T040-T052 (13 tests) can run in parallel after T039
- **User Story 4 Workout Tests**: T053-T062 (10 tests) can run in parallel
- **User Story 4 Session Tests**: T063-T075 (13 tests) can run in parallel
- **User Story 4 Cross-Page Tests**: T076-T085 (10 tests) can run in parallel
- **Phase 7 (Polish)**: T090, T091, T092 can run in parallel

---

## Parallel Example: User Story 2 (Focus Indicators)

```bash
# Launch all focus indicator fixes together (different files):
Task T019: "Remove outline-none in apps/web/components/ui/sidebar.tsx"
Task T020: "Remove outline-none in apps/web/components/ui/dialog.tsx"
Task T021: "Remove outline-none in apps/web/components/ui/button.tsx"

# Then test sequentially:
Task T022: "Verify focus indicators in light mode"
Task T023: "Verify focus indicators in dark mode"
```

---

## Parallel Example: User Story 4 (Browser Testing)

```bash
# After T037-T039 setup, launch all Plans page tests simultaneously:
Task T040: "Create macrocycle test + Supabase verification"
Task T041: "Read macrocycle list test + Supabase verification"
Task T042: "Update macrocycle test + Supabase verification"
# ... (all 13 Plans tests can run in parallel)

# Similarly for Workout and Session page tests (23 tests total in parallel)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - baseline verification)
3. Complete Phase 3: User Story 1 (Mobile Charts)
4. Complete Phase 4: User Story 2 (Focus Indicators)
5. Complete Phase 5: User Story 3 (Session Planning)
6. **STOP and VALIDATE**: Manual testing of all 3 user stories
7. If validated, proceed to Phase 6 (Comprehensive Testing)

### Incremental Delivery

1. Complete Setup + Foundational → Baseline established
2. Add User Story 1 → Test independently → Charts now responsive
3. Add User Story 2 → Test independently → Keyboard navigation works
4. Add User Story 3 → Test independently → Mobile session planning optimized
5. Add User Story 4 → Test comprehensively → Zero bugs confirmed
6. Polish → Deploy → Feature complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T011)
2. Once Foundational is done:
   - Developer A: User Story 1 (T012-T018)
   - Developer B: User Story 2 (T019-T025)
   - Developer C: User Story 3 (T026-T036)
3. Merge CSS fixes, then:
   - AI Agent: User Story 4 (T037-T089 - automated browser testing)
4. Team completes Polish together (T090-T100)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story (US1, US2, US3, US4) for traceability
- Each user story should be independently completable and testable (US1, US2, US3 are independent; US4 validates all)
- User Story 4 is unique: it's a testing/validation story that depends on US1-US3 completion
- Total task count: 100 tasks
  - Setup: 5 tasks
  - Foundational: 6 tasks
  - User Story 1: 7 tasks
  - User Story 2: 7 tasks
  - User Story 3: 11 tasks
  - User Story 4: 53 tasks (comprehensive browser testing)
  - Polish: 11 tasks
- Parallel opportunities: ~46 tasks marked [P] can run simultaneously
- Commit after each user story phase or logical group
- Stop at any checkpoint to validate story independently
- Estimated total effort: ~6 hours (2 hours CSS fixes + 4 hours comprehensive testing)
- All file paths are absolute from repository root
- Follow checklist format strictly for task tracking
