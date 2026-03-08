### Plans PRD (Training Plans: Create, Manage, Assign)

This document defines the user stories, scenarios, and expected results for the Plans feature. It reflects the current implementation and the desired end-state for MVP 1 per `mvp1.md` and `web-app-detailed.md`.

### Personas (Track & Field)
- **Elite coach**: manages multiple groups; needs periodization across macro/meso/micro; bulk operations; reusable templates; clear workload/intensity charts; minimal friction.
- **Club coach**: 1–3 groups; wants quick plan creation from templates; basic progression; simple editing and assignment.; calendar to drag and rearrange sessions; clear guardrails; printable/ shareable views.
- **Amateur coach / self-coached athlete**: guided wizard; example templates; simple adjustments; minimal jargon.

### Goals (What this page is for)
1) Create macro/meso/micro cycles with proper parent linking.
2) Plan detailed sessions within cycles using preset sessions (reusable), supersets, and set-level parameters.
3) Auto-progression within a cycle with minimal manual edits; visualize planned volume and intensity across weeks.
4) Manage sessions: reschedule within weeks, edit exercises/sets/supersets, clone/copy with adaptations.
5) Manage presets and templates (create, edit, reuse); keep global templates and user templates clear.
6) Support multiple athlete groups for a coach with clean filtering and assignment workflows.
7) Keep UI/UX simple, clean, and intuitive—no overload.

### Navigation surface
- `/plans` (page):
  - Tabs: Your Plans, Create New (MesoWizard). Templates live at `/templates`.
  - Future (recommended): add Calendar tab and a dedicated Builder/Editor view for existing sessions.

### Core User Stories with Acceptance Criteria

#### 1) Create Macrocycle
- As a coach, I can create a macrocycle (12–52 weeks) with name, dates, goal, and optional group association.
- Acceptance:
  - A `macrocycles` row is created with `user_id` and optional `athlete_group_id`.
  - If created from a template, metadata copies over.
  - I see a success toast and the cycle appears under “Your Plans” or “Existing” in-wizard list.

  - Status:
    - Table `macrocycles` exists; create action implemented. Cycles surface in the wizard’s “Existing” list; “Your Plans” lists sessions (`exercise_preset_groups`). RLS is not enabled on `macrocycles`.
  - Gaps:
    - RLS on `macrocycles` disabled; no group-scoped policies. No indexing on `user_id`, `athlete_group_id`.
  - Solution:
    - Enable RLS on `macrocycles`; add group-scoped SELECT/ALL policies. Add index `(user_id, athlete_group_id)` and `(start_date)` for filtering. Keep “Your Plans” focused on sessions; keep cycles visible in wizard (or add a separate Cycles tab later).

#### 2) Create Mesocycle under Macrocycle
- As a coach, I can create a mesocycle (2–8 weeks) linked to a selected macrocycle.
- Acceptance:
  - UI requires picking a parent macrocycle.
  - A `mesocycles` row is created with `macrocycle_id` set.
  - I can proceed to session planning or defer to later.

  - Status:
    - Table `mesocycles` exists; create action implemented. Wizard currently passes `macrocycle_id: undefined` on submit.
  - Gaps:
    - Parent macrocycle selection UI missing; `macrocycle_id` not persisted. RLS disabled on `mesocycles`. Missing indexes for `(macrocycle_id, user_id)`.
  - Solution:
    - Add parent macrocycle selector to config step; persist `macrocycle_id`. Enable RLS; add group-scope policies mirroring `macrocycles`. Add indexes `(macrocycle_id)`, `(user_id)`.

#### 3) Create Microcycle under Mesocycle (with sessions)
- As a coach, I can create a microcycle (1–2 weeks) linked to a mesocycle and optionally seed sessions from the wizard.
- Acceptance:
  - UI requires picking a parent mesocycle.
  - A `microcycles` row is created with `mesocycle_id` set.
  - If sessions are provided, `exercise_preset_groups` (+ child presets/details) are created and linked to `microcycle_id`.

  - Status:
    - Table `microcycles` exists; create action implemented and can seed sessions via `saveSessionPlanAction`. Wizard currently passes `mesocycle_id: undefined`.
  - Gaps:
    - Parent mesocycle selection UI missing; RLS disabled on `microcycles`. Missing indexes `(mesocycle_id)`, `(user_id)`.
  - Solution:
    - Add mesocycle selector; persist `mesocycle_id`. Enable RLS with group-scope policies. Add indexes `(mesocycle_id)`, `(user_id)`, and ensure `exercise_preset_groups.microcycle_id` is indexed.

#### 4) Session Planning with Presets and Supersets
- As a coach, I can design sessions: search/select exercises, order them, create supersets, and configure sets (reps/weight/RPE/rest/etc.).
- Acceptance:
  - Adding an exercise shows default 2–4 sets; editing opens a detailed configuration modal.
  - Supersets group displays with labels (A, B, C). Removing a superset reverts exercises to standalone.
  - Saving persists sessions to `exercise_preset_groups` with `exercise_presets` and `exercise_preset_details`.

  - Status:
    - Implemented (exercise library, sets modal, supersets, bulk ops). Persists correctly; `exercise_preset_groups` has RLS enabled with owner/template policies.
  - Gaps:
    - No dedicated editor route for existing sessions; edits from “Your Plans” not wired. Some policy advisories (multiple permissive policies, initplan).
  - Solution:
    - Add editor route `/plans/sessions/[id]/edit` reusing SessionPlanning for load-and-edit. Consolidate RLS policies to reduce duplicates; apply `select auth.<fn>()` pattern to avoid initplan re-evaluation.

#### 5) Auto-Progression within a Cycle
- As a coach, I can set simple progression rules (e.g., +1 set weekly, +5% load weekly, taper in last week) and preview their effect.
- Acceptance:
  - I can toggle an “Auto progression” option per cycle or per exercise stream.
  - Preview shows week-by-week planned volume/intensity change.
  - Applying generates updated presets for future weeks; edits remain overrideable.
  - Note: initial MVP can limit to sets/reps or % change; advanced rules are future scope.

  - Status:
    - Not implemented (only per-exercise set templates and simple progressive overload in the modal).
  - Gaps:
    - No cross-week auto-progression; no preview.
  - Solution:
    - MVP: per-exercise rules (e.g., +1 rep/week, +2.5kg/week, -10s rest) applied to selected target weeks; preview diff before apply. Persist by cloning session presets to target weeks and adapting details. Keep UI minimal (checkbox + small rule picker).

#### 6) Visual Overview of Volume and Intensity
- As a coach, I can see a simple chart per cycle showing weekly total volume (sets×reps×load or better scientific/well-reconised model equivalent) and average intensity (e.g., average RPE or % or how track and field elite coach determine intensity).
- Acceptance:
  - A small chart (sparkline or bar+line) shows Weeks on X; Volume and Intensity on Y.
  - Updating sessions updates the preview.

  - Status:
    - Not implemented.
  - Gaps:
    - No chart; no derived volume/intensity metrics.
  - Solution:
    - Compute derived totals from `exercise_preset_details` (sets×reps×load or event-appropriate proxy; average RPE). Render a small bar/line combo per week in wizard review and editor.

#### 7) Manage Sessions (Reschedule, Edit, Copy)
- As a coach, I can drag a session from Week X Day Y to another day; I can clone a session and adapt sets by rule (+1 rep, -10s rest, +2.5kg).
- Acceptance:
  - Calendar/Week list drag-and-drop updates `week`/`day` numbers and reorders within the microcycle.
  - Copy-with-adaptations duplicates presets and details to a target day/week with rule-based changes.

  - Status:
    - Copy-with-adaptations action exists. Drag-and-drop reschedule across week/day not present; editor route missing.
  - Gaps:
    - Cannot reschedule within a cycle view; “Edit” buttons inert.
  - Solution:
    - Add a Week/Calendar view with DnD to update `week`/`day` via `updateSessionPlanAction`. Wire “Edit” buttons to the new editor route. Keep UI compact (week list + sessions per day).

#### 8) Manage Presets and Templates
- As a coach, I can save any session as a reusable template (global or user), edit template details, and use a template to seed a plan.
- Acceptance:
  - Toggling “Save as template” stores `is_template=true`, `user_id=null` for global templates, or `user_id` for user templates depending on policy.
  - “Use Template” clones presets+details into the target plan context.

  - Status:
    - `/templates` implemented (list/use/delete). Save-as-template works. The `/plans` Quick Templates card is placeholder; `?template=` param unused.
  - Gaps:
    - Redundant template entry points; param not honored.
  - Solution:
    - Either remove the Quick Templates card or make it link to `/templates`. Honor `?template=` by preloading the wizard with the chosen template and jumping to Session Planning.

#### 9) Assign to Athletes or Groups
- As a coach, I can assign a plan to individual athletes (creates `exercise_training_sessions` per athlete) or associate a plan to a group for later live sessions.
- Acceptance:
  - Individual: `exercise_training_sessions` created per athlete × per session (status planned).
  - Group: `exercise_preset_groups.athlete_group_id` set; optional per-athlete session creation can be toggled (future option).

  - Status:
    - Individual assignment creates `exercise_training_sessions`. Group assignment sets `athlete_group_id` only (no per-athlete expansion). RLS is enabled on sessions.
  - Gaps:
    - Optional per-athlete expansion for groups is missing.
  - Solution:
    - Add a toggle “Create per-athlete sessions for this group now” that bulk-inserts `exercise_training_sessions` for each athlete × session. Default off to avoid volume spikes.

#### 10) Multi-Group Support
- As a coach, I can filter plans, templates, and sessions by athlete group and switch groups quickly.
- Acceptance:
  - Group filter is visible on Your Plans and in the wizard assignment step.
  - Creating under a group defaults future session saves to that group.

  - Status:
    - Assignment step shows groups; “Your Plans” has no group filter.
  - Gaps:
    - Cannot filter sessions by group in the list view.
  - Solution:
    - Add a simple group filter on “Your Plans” and pass `groupId` to `getTrainingPlansAction` to filter at the query level (index on `(user_id, athlete_group_id)` already present for preset groups).

#### 11) Simplicity & Clarity (UX)
- As any user, I can complete common tasks in ≤ 3 clicks per step and the interface remains uncluttered.
- Acceptance:
  - Clear primary/secondary actions; minimal inline helper text; progressive disclosure for advanced options.

  - Status:
    - Wizard is clear; duplication exists (wizard “Existing” tab vs page “Your Plans”). Quick Templates placeholder adds noise.
  - Gaps:
    - Confusing duplication; dead “Edit” buttons; unused URL param.
  - Solution:
    - Remove wizard’s internal “Existing Plans”. Keep `/templates` as the single template hub. Wire edits to the new editor route. Use concise helper text and progressive disclosure for advanced options.

### Detailed Scenarios and Expected Results

- **S1: Create Macrocycle → Plan Sessions later**
  - Input: name, start/end dates, goal; no sessions.
  - Result: Row in `macrocycles`; listed under Existing. No session groups yet.

- **S2: Create Mesocycle linked to Macro**
  - Input: select macro, name/dates, metadata.
  - Result: `mesocycles.macrocycle_id` set; appears under Existing. No sessions yet unless seeded.

- **S3: Create Microcycle (1 week) with 3 sessions**
  - Input: pick meso; build 3 sessions with 4–6 exercises each; 3 sets default; some supersets.
  - Result: `microcycles` row + 3 `exercise_preset_groups` with child rows; week/day set.

- **S4: Save as Template**
  - Input: same session content; toggle “Save as template”.
  - Result: `exercise_preset_groups.is_template=true`, `user_id=null` (global); visible at `/templates`.

- **S5: Use Template to Seed Plan**
  - Input: choose template; provide new plan name/group.
  - Result: New `exercise_preset_groups` with details copied; appears in Your Plans for the user/group.

- **S6: Assign to Individuals**
  - Input: select athletes in Assignment step.
  - Result: For each selected athlete and each session, create `exercise_training_sessions` with status `planned`.

- **S7: Assign to Group**
  - Input: pick a group in Assignment step.
  - Result: `exercise_preset_groups.athlete_group_id` set; optional per-athlete session creation (future toggle). Group consumes sessions in live dashboards.

- **S8: Reschedule Session**
  - Input: drag Week1-Day2 to Week1-Day3.
  - Result: Updates `exercise_preset_groups.day`; reorder preserved; charts update.

- **S9: Copy-with-Adaptations**
  - Input: copy session from Week1-Day1 to Week2-Day1 with +1 rep and -10s rest.
  - Result: New session preset group with modified details.

- **S10: Edit Sets in Modal**
  - Input: open “Configure Sets”; change reps, weight, RPE; apply template (hypertrophy); save.
  - Result: Updated `exercise_preset_details` rows, correct mapping for `performing_time` vs `duration`, `effort` vs `RPE`.

- **S11: Multi-Group Filtering**
  - Input: switch group filter to “Varsity Sprint Group”.
  - Result: “Your Plans” lists only plans with `athlete_group_id`=selected or created by coach for that group.

### UX/Interaction Principles
- Keep “Create” flow focused (Wizard). Manage/edit flows live in a dedicated “Editor/Calendar” view.
- Progressive disclosure: advanced controls hidden until toggled.
- Clear validation and error messaging; toasts for successes; lightweight skeletons while loading.
- Drag-and-drop for rescheduling; keyboard accessible actions.

### Data and Integration Notes
- Sessions persist to `exercise_preset_groups` (+ `exercise_presets`, `exercise_preset_details`).
- Individual assignment creates rows in `exercise_training_sessions`.
- Parent linking: `mesocycles.macrocycle_id`, `microcycles.mesocycle_id` must be set via selection.
- Templates: `is_template=true`; global templates use `user_id=null`; user templates can use `user_id`.
- Group-scope: set `athlete_group_id` when appropriate; RLS should enforce group membership on reads/writes.

### What’s missing to complete this page (relative to current code)
- **Parent selection UIs** in wizard for meso→macro and micro→meso; ensure IDs set on create.
- **Dedicated Editor route** for existing sessions, e.g., `/plans/sessions/[id]/edit` or `/preset-groups/[id]/edit`,
  - Wire “Edit” buttons in “Your Plans” to this editor.
  - Load existing session presets+details and allow full editing (same components as wizard step 3).
- **Calendar/Week view** to reschedule sessions by drag-and-drop within a cycle.
- **Auto-progression engine** (MVP): per-exercise simple rules (+reps, +load %, -rest) applied across selected weeks with preview/undo.
- **Volume/Intensity charts** per cycle (small chart; stacked volume by exercise type optional later).
- **Group assignment semantics**: add optional toggle to create per-athlete `exercise_training_sessions` for groups, or document live-session path.
- **Templates in `/plans`**: either remove Quick Templates placeholder or wire it; ensure `?template=` param is honored.
- **Remove duplication**: drop the wizard’s internal “Existing Plans” tab to avoid confusing overlap with page-level tabs.
- **Redirects** after create (optional): coach → `/sessions`, athlete → `/workout`, or stay with success CTA.
- **RLS group context**: confirm actions set group context before queries and avoid manual filters per RLS guidelines.
- **Tests**: unit tests for actions (create/copy/save/assign), and component tests for session planning and set modal mapping.

### Non-Functional Requirements
- Performance: paginate lists; cache exercise library; debounce searches.
- Accessibility: keyboard DnD alternatives; labeled controls; color contrast.
- Mobile: two-column collapses; large hit targets; defer heavy charts.

### Rollout/Success Criteria
- Create a microcycle with 2–3 sessions and edit sets/supersets without errors.
- Assign to two athletes and verify planned sessions were created.
- Use a template to seed a session and edit it.
- Reschedule at least one session and see charts update.
- All flows complete in < 2s perceived latency for common operations.

### References (implementation anchors)
- Wizard components: `apps/web/components/features/plans/components/mesowizard/*`
- Plans page: `apps/web/components/features/plans/components/training-plans-page.tsx`
- Actions: `apps/web/actions/training/{training-plan-actions.ts, session-plan-actions.ts, exercise-actions.ts, athlete-actions.ts}`


