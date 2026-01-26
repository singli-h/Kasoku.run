# Tasks: Individual Plan Page - Unified UX

**Input**: Design documents from `docs/features/plans/individual/`
**Prerequisites**: IMPLEMENTATION_PLAN.md, 04-user-stories.md, 05-changeset-display.md, 08-decisions-jan2025.md

**Goal**: Merge three disconnected UX patterns (`/plans/[id]`, `/plans/[id]/edit`, `/plans/[id]/session/[sessionId]`) into ONE unified page at `/plans/[id]` with contextual AI always available.

**Tests**: Not explicitly requested - implementation-focused tasks only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `components/`, `app/`, `lib/`
- **AI/API**: `app/api/ai/`, `lib/changeset/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational context and wrapper components

- [x] T001 Create PlanContext provider with selection state (selectedWeekId, selectedSessionId, selectedExerciseId, aiContextLevel) in `components/features/plans/individual/context/PlanContext.tsx`
- [x] T002 Create PlanContextProvider component that wraps children with context in `components/features/plans/individual/context/PlanContextProvider.tsx`
- [x] T003 [P] Create AI context level detection utility function (getAIContextLevel) in `components/features/plans/individual/context/utils.ts`
- [x] T004 [P] Export all context utilities from `components/features/plans/individual/context/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that MUST be complete before user story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create PlanAssistantWrapper component that integrates SessionAssistant with PlanContext in `components/features/plans/individual/PlanAssistantWrapper.tsx`
- [x] T006 Create IndividualPlanPageWithAI wrapper component that combines PlanContextProvider + SessionExercisesProvider + PlanAssistant in `components/features/plans/individual/IndividualPlanPageWithAI.tsx`
- [x] T007 [P] Create unified AI endpoint with context-aware prompts in `app/api/ai/plan-assistant/route.ts`
- [x] T008 [P] Add week-level context support to session planner prompts in `lib/changeset/prompts/plan-assistant.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Basic Browse (Priority: P0) 🎯 MVP

**Goal**: User can browse their training plan on a single page with week sidebar, day pills, and exercise list - NO AI interaction yet

**Independent Test**: Navigate to `/plans/[id]`, verify week selection changes content, verify day selection shows exercises, no AI drawer visible initially

### Implementation for User Story 1

- [x] T009 [US1] Modify IndividualPlanPage to integrate with PlanContext for selection state in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T010 [US1] Add current week auto-selection on page load in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T011 [US1] Add today's workout auto-selection on page load in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T012 [P] [US1] Update WeekSelectorSheet to use PlanContext selection in `components/features/plans/individual/WeekSelectorSheet.tsx`
- [x] T013 [US1] Remove navigation to `/plans/[id]/session/[sessionId]` from workout click handlers in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T014 [US1] Embed SessionPlannerV2 inline when workout is expanded in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T015 [US1] Add lazy loading for SessionPlannerV2 with skeleton state in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T016 [US1] Update route page to wrap with IndividualPlanPageWithAI for individual users in `app/(protected)/plans/[id]/page.tsx`

**Checkpoint**: User Story 1 complete - basic browsing without AI works

---

## Phase 4: User Story 2 - Simple Edit - Single Session (Priority: P0)

**Goal**: User can modify a single session's workout using AI with inline diff display

**Independent Test**: Open AI drawer, type "Replace bench press with dumbbell press", verify inline proposal appears with swap diff, apply changes

### Implementation for User Story 2

- [x] T017 [US2] Add ChatTrigger (FAB/button) to IndividualPlanPage for opening AI in `components/features/plans/individual/IndividualPlanPage.tsx` (Already integrated via SessionAssistant)
- [x] T018 [US2] Integrate ChatDrawer (mobile) with PlanAssistantWrapper in `components/features/plans/individual/PlanAssistantWrapper.tsx` (Already integrated via SessionAssistant)
- [x] T019 [P] [US2] Integrate ChatSidebar (desktop) with PlanAssistantWrapper in `components/features/plans/individual/PlanAssistantWrapper.tsx` (Already integrated via SessionAssistant)
- [x] T020 [US2] Add InlineProposalSection slot above exercise list in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T021 [US2] Connect SessionExercisesProvider for selected session's exercises in `components/features/plans/individual/IndividualPlanPageWithAI.tsx` (Already integrated via PlanAssistantWrapper)
- [x] T022 [US2] Implement proposal bar UI with change count and [Change]/[Apply] buttons in `components/features/ai-assistant/inline/ProposalBar.tsx` (Already exists as InlineProposalSection)
- [x] T023 [US2] Add visual diff states to exercise list (DELETE: red/strikethrough, ADD: green/dashed, UPDATE: amber) in `components/features/training/components/ExerciseCard.tsx` (Already implemented with aiChangeType support)
- [x] T024 [US2] Add visual diff states to set rows (ghost rows for new sets) in `components/features/training/components/SetRow.tsx` (Already implemented with ghost row rendering and AI styling)
- [x] T025 [US2] Connect apply/dismiss handlers to ChangeSet execution in `components/features/plans/individual/PlanAssistantWrapper.tsx` (Already integrated via SessionAssistant)

**Checkpoint**: User Story 2 complete - single session AI editing with inline diff works

---

## Phase 5: User Story 3 - Cross-Session Edit (Priority: P0)

**Goal**: User viewing one session can make changes to a different session via AI

**Independent Test**: View Monday, type "Add pull-ups to Wednesday", verify proposal shows Wednesday context with preview

### Implementation for User Story 3

- [x] T026 [US3] Add cross-session detection in AI prompts (recognizing day references) in `lib/changeset/prompts/plan-assistant.ts` (session and week levels both support cross-session)
- [x] T027 [US3] Create cross-session proposal display with context indicator in `components/features/ai-assistant/inline/CrossSessionProposal.tsx`
- [x] T028 [US3] Add expandable preview for changes to non-visible sessions in `components/features/ai-assistant/inline/CrossSessionProposal.tsx`
- [x] T029 [US3] Add "Jump to [Session]" navigation link in proposal UI in `components/features/ai-assistant/inline/CrossSessionProposal.tsx`
- [x] T030 [US3] Integrate CrossSessionProposal with PlanAssistantWrapper in `components/features/plans/individual/PlanAssistantWrapper.tsx`

**Checkpoint**: User Story 3 complete - cross-session editing works

---

## Phase 6: User Story 4 - Week-Level Changes (Priority: P0)

**Goal**: User can make changes affecting multiple sessions in a week (e.g., "Add planks to every workout this week")

**Independent Test**: Type "Add planks to every workout this week", verify grouped proposal shows all sessions with expand/collapse

### Implementation for User Story 4

- [x] T031 [US4] Extend AI prompts to understand week-level scope in `lib/changeset/prompts/plan-assistant.ts` (already supports week-level context)
- [x] T032 [US4] Create GroupedProposalSection component for multi-session proposals in `components/features/ai-assistant/inline/GroupedProposalSection.tsx`
- [x] T033 [US4] Add expandable session groups with +N change summary in `components/features/ai-assistant/inline/GroupedProposalSection.tsx`
- [x] T034 [US4] Show inline diff only for currently-viewed session, preview for others in `components/features/ai-assistant/inline/GroupedProposalSection.tsx`
- [x] T035 [US4] Integrate GroupedProposalSection with PlanAssistantWrapper via `ConnectedCrossSessionProposal` in `components/features/ai-assistant/inline/ConnectedCrossSessionProposal.tsx`

**Checkpoint**: User Story 4 complete - week-level AI changes work with grouped display

---

## Phase 7: User Story 5 - Week Fatigue/Deload Changes (Priority: P0)

**Goal**: User can apply volume/intensity changes across a week (e.g., "Make this a deload week - reduce volume by 40%")

**Independent Test**: Select Week 4, type "Make this a deload week - reduce volume by 40%", verify text summary shows all sessions with field-level changes

### Implementation for User Story 5

- [x] T036 [US5] Add deload/volume calculation logic to AI prompts in `lib/changeset/prompts/plan-assistant.ts` (week-level guidance)
- [x] T037 [US5] Create text diff summary for high-density field changes in `components/features/ai-assistant/inline/TextDiffSummary.tsx`
- [x] T038 [US5] Add "Summary: -40% volume" header format in `components/features/ai-assistant/inline/TextDiffSummary.tsx`
- [x] T039 [US5] Integrate text diff summary for deload proposals via `ConnectedCrossSessionProposal` in `components/features/ai-assistant/inline/ConnectedCrossSessionProposal.tsx`

**Checkpoint**: User Story 5 complete - deload/volume changes work with text summary

---

## Phase 8: User Story 6 - Block-Wide Changes (Priority: P1)

**Goal**: User can make changes spanning multiple weeks (e.g., "Replace all barbell exercises with dumbbells") with text summary in chat

**Independent Test**: Type "Replace all barbell exercises with dumbbell alternatives", verify AI auto-expands to full screen, shows text summary with week-by-week breakdown, [Looks Good]/[Make Changes] buttons

### Implementation for User Story 6

- [x] T040 [US6] Add block-level scope detection in AI context in `lib/changeset/prompts/plan-assistant.ts`
- [x] T041 [US6] Create BlockSummarySection component for multi-week text summaries in `components/features/ai-assistant/inline/BlockSummarySection.tsx`
- [x] T042 [US6] Add week-by-week breakdown format in summary in `components/features/ai-assistant/inline/BlockSummarySection.tsx`
- [x] T043 [US6] Implement auto-expand to full width/screen on block-wide proposals in `components/features/plans/individual/PlanAssistantWrapper.tsx`
- [x] T044 [US6] Add [Looks Good]/[Make Changes] approval buttons in `components/features/ai-assistant/inline/BlockSummarySection.tsx`
- [x] T045 [US6] Add "Or type to modify" input below approval buttons in `components/features/ai-assistant/inline/BlockSummarySection.tsx`

**Checkpoint**: User Story 6 complete - block-wide changes work with text summary and auto-expand

---

## Phase 9: User Story 7 - Exercise-Level Set Changes (Priority: P0)

**Goal**: User can modify sets for a specific exercise with fine-grained control

**Independent Test**: Expand Bench Press, type "Add a warm-up set at 50% and increase working sets to 4", verify inline diff shows new sets with correct values

### Implementation for User Story 7

- [x] T046 [US7] Add exercise-level context detection when exercise expanded in `components/features/plans/individual/PlanAssistantWrapper.tsx`
- [x] T047 [US7] Enhance SetRow to show AI change badges (🤖) in `components/features/training/components/SetRow.tsx`
- [x] T048 [US7] Add ghost row rendering for new sets (emerald dashed border) in `components/features/training/components/SetRow.tsx`
- [x] T049 [US7] Add field-level inline diff display (old → new) for low-density changes in `components/features/training/components/SetRow.tsx`

**Checkpoint**: User Story 7 complete - set-level changes with fine-grained inline diff work

---

## Phase 10: User Story 8 - Toggle Advanced Fields (Priority: P1)

**Goal**: User can show/hide advanced training fields (RPE, tempo, velocity) via a toggle

**Independent Test**: Toggle "Show Advanced" in header, verify RPE/tempo fields appear on all exercises, toggle persists on refresh

### Implementation for User Story 8

- [x] T050 [US8] Create AdvancedFieldsToggle component in `components/features/plans/individual/AdvancedFieldsToggle.tsx`
- [x] T051 [US8] Add advanced fields toggle to desktop header in `components/features/plans/individual/IndividualPlanPage.tsx`
- [x] T052 [P] [US8] Add advanced fields toggle to mobile settings sheet in `components/features/plans/individual/MobileSettingsSheet.tsx`
- [x] T053 [US8] Persist toggle state to localStorage with hook in `lib/hooks/useAdvancedFieldsToggle.ts`
- [ ] T054 [US8] Update SetRow to conditionally render advanced fields based on toggle in `components/features/training/components/SetRow.tsx`
- [ ] T055 [US8] Add horizontal scroll on mobile when advanced fields enabled in `components/features/training/components/SetRow.tsx`

**Checkpoint**: User Story 8 complete - advanced fields toggle works with persistence

---

## Phase 11: Hybrid Diff Display - Density-Based (Priority: P0)

**Goal**: Implement density-based display switching (inline diff for low-density, summary+highlight for high-density)

**Independent Test**: Propose 2 field changes to 2 sets - see inline diff; propose 3+ field changes to 3+ sets - see summary card with [View Details]

### Implementation for Hybrid Diff Display

- [x] T056 [US2] Create getDiffDisplayMode utility (inline vs summary threshold) in `components/features/ai-assistant/inline/utils.ts`
- [x] T057 [US2] Create DiffSummaryCard component for high-density changes in `components/features/ai-assistant/inline/DiffSummaryCard.tsx`
- [x] T058 [US2] Add summary text format ("3 sets · weight +5kg, reps +2") in `components/features/ai-assistant/inline/DiffSummaryCard.tsx`
- [x] T059 [US2] Add highlight-only pills (amber bg, new value only) for high-density mode in `components/features/training/components/SetRow.tsx`
- [x] T060 [US2] Add [View Details] expand/collapse for power users in `components/features/ai-assistant/inline/DiffSummaryCard.tsx`
- [x] T061 [US2] Add [Apply All] quick approval button in `components/features/ai-assistant/inline/DiffSummaryCard.tsx`
- [x] T062 [US2] Implement stricter mobile threshold (2+ fields OR 2+ sets) in `components/features/ai-assistant/inline/utils.ts`

**Checkpoint**: Hybrid diff display complete - density-based switching works

---

## Phase 12: Compact AI Reasoning (Priority: P1)

**Goal**: Collapsible "Thinking..." section ChatGPT-style

**Independent Test**: AI proposes change, see collapsed "▶ Thinking..." indicator, tap to expand reasoning, tap again to collapse

### Implementation for Compact AI Reasoning

- [x] T063 [US6] Add collapsible ThinkingSection component in `components/features/ai-assistant/ThinkingSection.tsx`
- [x] T064 [US6] Integrate ThinkingSection into ChatDrawer in `components/features/ai-assistant/ChatDrawer.tsx`
- [x] T065 [P] [US6] Integrate ThinkingSection into ChatSidebar in `components/features/ai-assistant/ChatSidebar.tsx`
- [x] T066 [US6] Add expand/collapse animation and icon toggle (▶/▼) in `components/features/ai-assistant/ThinkingSection.tsx`

**Checkpoint**: Compact AI reasoning complete - collapsible thinking works

---

## Phase 13: Route Deprecation & Redirects

**Purpose**: Deprecate old routes and ensure unified experience

- [x] T067 Add redirect from `/plans/[id]/edit` to `/plans/[id]` in `app/(protected)/plans/[id]/edit/page.tsx`
- [x] T068 [P] Comment out PlanEditClient import and component (preserve, don't delete) in `app/(protected)/plans/[id]/edit/PlanEditClient.tsx`

**Checkpoint**: Edit route deprecated - unified page is the only entry point

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T069 Add AI context indicator showing current scope (block/week/session/exercise) in `components/features/plans/individual/AIContextIndicator.tsx`
- [x] T070 Handle edge case: user switches context mid-proposal (persist proposal with "Pending changes for: [context]") in `components/features/plans/individual/PlanAssistantWrapper.tsx`
- [x] T071 [P] Add skeleton loading states for all lazy-loaded components in `components/features/plans/individual/skeletons/`
- [ ] T072 [P] Add mobile responsive testing for all AI drawer states in `components/features/plans/individual/`
- [x] T073 Performance optimization: memoize expensive context computations in `components/features/plans/individual/context/PlanContext.tsx`
- [x] T074 Add success flash animation after applying changes in `components/features/plans/individual/PlanAssistantWrapper.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1 (Browse): No dependencies on other stories
  - US2 (Single Session): Depends on US1
  - US3 (Cross-Session): Depends on US2
  - US4 (Week-Level): Depends on US2
  - US5 (Deload): Depends on US4
  - US6 (Block-Wide): Depends on US4
  - US7 (Exercise-Level): Depends on US2
  - US8 (Advanced Fields): No dependencies on other stories
- **Hybrid Diff (Phase 11)**: Depends on US2 (Single Session)
- **Compact Reasoning (Phase 12)**: Depends on US6 (Block-Wide)
- **Route Deprecation (Phase 13)**: Depends on US1 completion
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### Parallel Opportunities

**Phase 1 (Setup):**
```
Task: T003 [P] Create AI context level detection utility
Task: T004 [P] Export all context utilities
```

**Phase 2 (Foundational):**
```
Task: T007 [P] Create unified AI endpoint
Task: T008 [P] Add week-level context support to prompts
```

**User Story 2 (Single Session):**
```
Task: T018 [P] Integrate ChatDrawer (mobile)
Task: T019 [P] Integrate ChatSidebar (desktop)
```

**User Story 8 (Advanced Fields):**
```
Task: T051 Add toggle to desktop header
Task: T052 [P] Add toggle to mobile settings sheet
```

---

## Implementation Strategy

### MVP First (P0 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Basic Browse)
4. **STOP and VALIDATE**: Test basic browsing independently
5. Complete Phase 4: User Story 2 (Single Session AI)
6. Complete Phase 11: Hybrid Diff Display
7. Complete Phase 9: User Story 7 (Exercise-Level)
8. Complete Phase 5: User Story 3 (Cross-Session)
9. Complete Phase 6: User Story 4 (Week-Level)
10. Complete Phase 7: User Story 5 (Deload)
11. Complete Phase 13: Route Deprecation
12. **MVP COMPLETE**: Unified plan page with all P0 features

### Post-MVP (P1 Stories)

13. Complete Phase 8: User Story 6 (Block-Wide)
14. Complete Phase 10: User Story 8 (Advanced Fields)
15. Complete Phase 12: Compact AI Reasoning
16. Complete Phase 14: Polish

### Incremental Delivery

| Milestone | Features | User Value |
|-----------|----------|------------|
| **M1** | Browse (US1) | Users can navigate plans on single page |
| **M2** | Single Session AI (US2) + Hybrid Diff | Users can edit workouts with AI |
| **M3** | Cross-Session + Week-Level (US3, US4, US5) | Users can make broader changes |
| **M4** | Block-Wide (US6) | Users can modify entire programs |
| **M5** | Advanced Fields (US8) + Polish | Power users get full control |

---

## Summary

| Category | Count |
|----------|-------|
| **Total Tasks** | 74 |
| **Phase 1: Setup** | 4 |
| **Phase 2: Foundational** | 4 |
| **User Story 1 (Browse)** | 8 |
| **User Story 2 (Single Session)** | 9 |
| **User Story 3 (Cross-Session)** | 5 |
| **User Story 4 (Week-Level)** | 5 |
| **User Story 5 (Deload)** | 4 |
| **User Story 6 (Block-Wide)** | 6 |
| **User Story 7 (Exercise-Level)** | 4 |
| **User Story 8 (Advanced Fields)** | 6 |
| **Hybrid Diff Display** | 7 |
| **Compact Reasoning** | 4 |
| **Route Deprecation** | 2 |
| **Polish** | 6 |

**Parallel Opportunities Identified**: 12 tasks marked [P]

**Suggested MVP Scope**: User Stories 1-5, 7 + Hybrid Diff + Route Deprecation (Phases 1-7, 9, 11, 13)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Key existing components to REUSE: SessionAssistant, ChatDrawer, ChatSidebar, SessionExercisesContext, useChangeSet, executeChangeSet
