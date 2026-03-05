# Coach AI Planning Design

**Status**: In progress — brainstorming
**Date**: 2026-03-05
**Feature**: AI-assisted coach planning workflow

---

## Problem Statement

Coach MesoWizard currently has **zero AI**. Planning context (direction, phase objectives, coaching intent) is never fed into AI generation. The individual athlete path has AI via `QuickStartWizard` + init pipeline, but coaches managing groups have no equivalent.

Key gaps:
- No way to record season/phase direction at the macro/meso level
- AI generates microcycles without any coaching context
- No previous microcycle insights flowing into next week's generation
- No subgroup (event specialty) awareness in planning

---

## Goals

- Initial season blueprint creation with AI assistance
- Ongoing weekly microcycle refinement with AI
- Context persists and flows: macro → meso → micro
- Previous microcycle insights feed into next generation
- Group-first planning: one plan for a squad, with subgroup and individual differentiation

---

## What We Know So Far

### Input Method
Hybrid: AI conversation + free-text notes. Coach chats with AI to develop direction; output is saved as structured context. Free-text notes also accepted directly.

### Planning Hierarchy Confirmed

```
Coach
 └── Squad (GHS / PC / SiChuan — different groups/schools)
      └── Subgroup by event specialty (SS / MS / LS)
           └── Individual athlete (with overrides)
```

### Real-World Pattern (from CSV analysis)

A coach manages **multiple groups** (different schools/clubs) that often run **the same underlying program** with different training frequencies and schedules:

- GHS — 3x/week (Mon/Wed/Fri)
- PC — 2x/week (Tue/Thu)
- SiChuan — variable schedule

Within each group, subgroups (SS/MS/LS) are differentiated **inline within sessions** — not separate plans. E.g.: `LS: 15 x 200m M:36" F:39" | SS/MS: CSD @80%`. Gender targets also inline.

**Key insight**: It's ONE shared periodization philosophy adapted for different group schedules. Not N independent plans.

---

## Club/School Structure Patterns

| Pattern | Description | Example | Priority |
|---------|-------------|---------|---------|
| B: Single coach, multiple groups | Same program, different schedules | GHS/PC/SiChuan case | **Primary — most common** |
| D: School team with event subgroups | One team, SS/MS/LS internal differentiation | Single school team | **= Pattern B with N=1 group (free)** |
| A: Single coach, one team, no subgroups | Simplest case | Small club | Subset of B/D |
| E: Individual athletes only | No group concept, fully personalized | Elite individual | Already handled by QuickStartWizard |
| C: Club with multiple coaches | Head coach sets philosophy, assistants manage groups | Large athletics club | V2 — permissions layer on top of B |
| F: Race-week periodization | Plan adapts around competition calendar | Competition season | Cross-cutting concern, not a separate pattern |

**Key insight**: Pattern D is Pattern B with N=1 group. Pattern A is Pattern D with no event subgroups. Designing Pattern B correctly gives all simpler patterns for free. Pattern C is an extension (permissions/roles), not a different data model.

**Design anchor: Pattern B covers 80%+ of real-world cases.**

---

## AI Context Chain (Target State)

When generating a microcycle for a group, the AI receives:

```
1. macrocycle.planning_context.text     ← season direction (freeform coach notes)
2. mesocycle.planning_context.text      ← current phase focus (dedicated column, NOT metadata)
3. last 2-3 microcycle.weekly_insights  ← what actually happened recently
4. athletes in group + event_group tags ← who is in this group (SS/MS/LS)
5. races within microcycle date range   ← competition awareness
```

Schedule constraints are embedded in the freeform `planning_context.text` — AI reads prose intent, not structured fields. No `ai_extracted` sub-object.

Gender targets (M:36" F:39") and SS/MS/LS session prescriptions stay inline in session content — AI-generated, not separate schema fields.

---

## Individual Athlete Overrides

On top of group plan, individual adjustments:
- Must consider athlete's training history, notes, data
- Likely stored on `workout_logs` (already per-athlete) or a thin override table
- AI considers individual athlete data when suggesting overrides

---

## AI Opportunities Across the Workflow

Design principle: **coach inputs intent, AI handles execution**. Coach writes the program once; AI adapts it per group, per week, per athlete.

| Stage | AI Role | Coach Input |
|-------|---------|-------------|
| Season kickoff | Interview coach → generate macro direction + mesocycle structure | Goals, competition calendar, athlete roster |
| Program sharing | Adapt master program per group schedule (2-day vs 3-day) | Group training days config |
| Microcycle generation | Generate week sessions from context chain + previous insights | Review + approve |
| Post-week review | Summarize what happened, flag deviations, suggest adjustments | Confirm actuals |
| Individual overrides | Suggest per-athlete adjustments from training history/data | Accept/reject |
| Competition planning | Identify race weeks, auto-taper | Competition calendar |

---

## Session Anatomy (Key Insight)

Sessions within a microcycle can be tagged as **shared** (same across groups/subgroups) or **variant** (differs by group/subgroup/event).

**What is shared vs variant is entirely coach and situation dependent** — it is NOT always WU=shared, sprint=variant. Some coaches share everything except one key session. Others have completely different sessions per group. The system must support both extremes without prescribing which sessions belong in which bucket.

The concept (**V2 — not in MVP**):
- `session_type: 'shared' | 'variant'` tag on `session_plans` table (new column)
- AI generates sessions and marks them accordingly based on planning context
- Coach can override the classification
- MVP: all sessions are implicitly shared; group variation is coach-managed manually

**Implication for schedule adaptation**: When a group trains fewer days, AI selects the most critical sessions. Shared and variant sessions both collapse based on training load priority, not session type alone.

---

## Template Concept Clarification

Three distinct "template" meanings — must not be conflated:

| Concept | What it is | MVP approach |
|---------|-----------|-------------|
| **Master program reference** | One program, multiple groups live-inherit it | Dropped — no `source_macrocycle_id`. Copy manually or AI re-generates from shared description. |
| **Historical reuse** | Copy last season's plan for a new season | "Duplicate plan" server action — copy operation, not a boolean flag. No schema change needed. |
| **Session building blocks** | Reusable session recipes (WU protocols, tempo sessions) | Separate future scope. Possibly `session_templates` table later. Not MVP. |

**Decision D7 revised**: Drop `is_template` from MVP. Without a live reference mechanism, a "template" macrocycle is just orphaned data. Historical reuse = copy operation.

---

## Schema Restructure (Correct Architecture)

**Key insight**: Macro and meso are the MASTER plan — shared across all groups. Variation starts at the microcycle level. Therefore `athlete_group_id` belongs on microcycles, not macrocycles.

### Current schema (before)

```
macrocycles: id, athlete_group_id ← WRONG LEVEL, user_id, name, notes, start_date, end_date
mesocycles:  id, macrocycle_id, user_id, name, notes, metadata (JSONB), start_date, end_date
microcycles: id, mesocycle_id,  user_id, name, notes, volume, intensity, start_date, end_date
```

### Target schema (after)

```
macrocycles: id, user_id, name, notes, start_date, end_date, planning_context (JSONB NEW)
             ← no athlete_group_id — shared season plan for all groups
mesocycles:  id, macrocycle_id, user_id, name, notes, metadata (JSONB, keep for UI state),
             planning_context (JSONB NEW — dedicated AI context column, separate from metadata)
             ← no group FK — shared phase plan for all groups
microcycles: id, mesocycle_id, user_id, name, notes, volume, intensity, start_date, end_date
             athlete_group_id (FK NEW) ← variation starts HERE
             weekly_insights (JSONB NEW), coach_notes (TEXT NEW)
athletes:    + event_group (TEXT NEW)  ← SS / MS / LS / Hurdles / Jumps / Throws
```

> **Why separate columns on mesocycles:** `metadata` holds UI state (phase color, deload flag, display hints). `planning_context` holds AI-facing coaching intent (what this phase focuses on, constraints, athlete targets). Mixing them into one JSONB makes queries ambiguous and makes the AI context harder to extract cleanly.

### Migration

```sql
-- 1. Add athlete_group_id to microcycles
ALTER TABLE microcycles ADD COLUMN athlete_group_id INTEGER REFERENCES athlete_groups(id);

-- 2. Backfill from existing macrocycle.athlete_group_id chain
UPDATE microcycles mc
SET athlete_group_id = mac.athlete_group_id
FROM mesocycles m
JOIN macrocycles mac ON m.macrocycle_id = mac.id
WHERE mc.mesocycle_id = m.id;

-- 3. New columns
ALTER TABLE macrocycles ADD COLUMN planning_context JSONB;
ALTER TABLE mesocycles  ADD COLUMN planning_context JSONB;  -- dedicated AI context (metadata = UI state only)
ALTER TABLE microcycles ADD COLUMN weekly_insights JSONB;
ALTER TABLE microcycles ADD COLUMN coach_notes TEXT;
ALTER TABLE athletes    ADD COLUMN event_group TEXT;

-- 4. Remove athlete_group_id from macrocycles
ALTER TABLE macrocycles DROP COLUMN athlete_group_id;
```

### Data hierarchy (coach — Pattern B)

```
macrocycle (user_id=coach, NO group)         ← season direction, shared for ALL groups
    → mesocycle (metadata = phase direction) ← shared phase, ALL groups
        → microcycle (athlete_group_id=GHS)  ← GHS-specific week
            → session_plans → workout_logs (GHS athletes)
        → microcycle (athlete_group_id=PC)   ← PC-specific week (same meso, different group)
            → session_plans → workout_logs (PC athletes)
```

### Individual user — no breakage

Individual users (role=`individual`) already have `athlete_group_id = NULL` on their macrocycles. After migration their microcycles also get `athlete_group_id = NULL` (backfill produces NULL from NULL). This cleanly means "individual plan, no group."

```
macrocycle (user_id=athlete_user)
    → mesocycle
        → microcycle (athlete_group_id=NULL)  ← individual plan
            → session_plans → workout_logs (just this athlete)
```

Query separation:
- Individual plans: `WHERE microcycles.user_id = X AND athlete_group_id IS NULL`
- Group plans: `WHERE microcycles.athlete_group_id = group_id`

### Extensibility: Non-week microcycles ✓

`start_date`/`end_date` on microcycles — no hardcoded 7-day assumption. 10-day, 14-day, custom duration supported. UI defaults to weekly but schema is not constrained.

---

## UI/UX Direction

The coach needs a **unified weekly planning view** that shows:
- All groups side-by-side (like the CSV spreadsheet columns)
- Shared sessions clearly marked — shown once, not repeated per group
- Variant sprint sessions showing all subgroup prescriptions inline
- Per-group schedule overlay (which days each group trains)
- Easy to spot "what's different" vs "what's the same"

This is a **template + variants** paradigm, not N separate plan editors.

> ⚠️ Detailed UI spec TBD — needs wireframe/mockup stage

---

## Race Week Handling

**Decision**: No new schema flag. `races` table already exists with dates. AI queries it at microcycle generation time.

When generating a microcycle, AI checks if any group athletes have races within `microcycle.start_date`–`end_date`. If yes:
- AI surfaces it in the planning chat: "Athletes [names] race on [date]. Recommend: skip gym, reduce sprint volume to race-prep only for racing athletes. Non-racing athletes continue normal program."
- Coach reviews and approves/adjusts
- This IS the natural subgroup variation — same microcycle base, racing athletes get inline session note/reduction
- Coach makes final call, AI provides the guidance

**Per persona**: Works for all — pragmatic coach gets a heads-up and decides; data-driven coach gets % reduction suggestions; high school coach gets simple clear text.

---

## planning_context Structure

**Decision: No fixed schema — freeform JSONB only.**

No code needs to programmatically query specific JSON fields (no `planning_context->>'competition_dates'` style queries). The context is purely for:
- AI to read as a whole at inference time
- Coach to read, edit, and refine

Enforcing a JSON schema adds complexity with zero benefit. AI extracts what it needs from the text at generation time. No `ai_extracted` structured fields needed.

In practice: `{"text": "Coach's freeform notes..."}` or raw string. No enforced shape.

**Option**: Reuse existing `macrocycles.notes` (TEXT) and `mesocycles.metadata` (already JSONB) instead of adding `planning_context` as a new column. Avoids one migration column. Trade-off: `notes` was originally for other purposes, JSONB gives future extensibility without migration.

Same applies to `mesocycles.metadata` — already JSONB, reuse for phase planning context, no new column needed.

---

## AI Route Changes

### Existing routes — enhance with context injection

| Route | Change |
|-------|--------|
| `POST /api/ai/plan-generator` | Inject `macrocycle.planning_context` + `mesocycle.metadata` + last 2-3 `microcycle.weekly_insights` + athlete `event_group` tags into system prompt |
| `POST /api/ai/plan-assistant` | Same context injection |
| `POST /api/ai/session-assistant` | Minor: add athlete `event_group` awareness |
| `POST /api/ai/plan-generator/init-plan` + `init-generate` | No change — individual path only |
| `POST /api/ai/workout-assistant` | No change |

### New routes/actions needed

| New | Purpose |
|-----|---------|
| `POST /api/ai/planning-context-chat` | AI interviews coach to build `planning_context`. Saves freeform text back to macro/mesocycle. No structured field extraction — AI reads prose at generation time. |
| `generateMicrocycleForGroupAction` | Server action: triggers AI to generate microcycle sessions for a specific `athlete_group_id`, reading full context chain (macro context → meso context → previous weekly_insights → athlete event_groups → race calendar) |
| `summarizeWeeklyInsightsAction` | Server action: AI reads completed `workout_logs` for a finished microcycle, auto-drafts `weekly_insights` JSONB for coach to review and confirm |

---

## RLS Policy Impact

**Critical**: All 5 existing athlete RLS policies in `20260219100000_add_athlete_rls_for_assigned_plans.sql` walk the chain through `macrocycles.athlete_group_id`. After schema change, all 5 break — that column no longer exists.

**New migration required** to replace all 5 policies. Good news: new policies are **simpler** because `athlete_group_id` is now at the right level (microcycles).

```sql
-- microcycles: DIRECT check — much simpler than before
DROP POLICY "mc_athlete_view_assigned" ON microcycles;
CREATE POLICY "mc_athlete_view_assigned" ON microcycles FOR SELECT USING (
  athlete_group_id IS NOT NULL AND athlete_in_group(athlete_group_id::bigint)
);

-- mesocycles: one level from microcycles
DROP POLICY "ms_athlete_view_assigned" ON mesocycles;
CREATE POLICY "ms_athlete_view_assigned" ON mesocycles FOR SELECT USING (
  id IN (SELECT mesocycle_id FROM microcycles
         WHERE athlete_group_id IS NOT NULL AND athlete_in_group(athlete_group_id::bigint))
);

-- macrocycles: athletes see shared macrocycles that have their group's microcycles
CREATE POLICY "mac_athlete_view_assigned" ON macrocycles FOR SELECT USING (
  id IN (SELECT ms.macrocycle_id FROM mesocycles ms
         WHERE ms.id IN (SELECT mesocycle_id FROM microcycles
                         WHERE athlete_group_id IS NOT NULL AND athlete_in_group(athlete_group_id::bigint)))
);

-- session_plans: direct microcycle check (one join shorter than before)
DROP POLICY "sp_athlete_view_assigned" ON session_plans;
CREATE POLICY "sp_athlete_view_assigned" ON session_plans FOR SELECT USING (
  microcycle_id IN (SELECT id FROM microcycles
                    WHERE athlete_group_id IS NOT NULL AND athlete_in_group(athlete_group_id::bigint))
);
-- session_plan_exercises and session_plan_sets: similar, one join shorter than current
```

Also check `20260113120000_fix_rls_coach_workout_and_ai_memories.sql` — coach policies use `coaches_group()` helper which checks `athlete_group_id` on `workout_logs`, not macrocycles. These are unaffected.

---

## Code Impact Inventory

**24 files need updates** after `macrocycles.athlete_group_id` is removed:

### Actions (critical path)
| File | Usages | Impact |
|------|--------|--------|
| `actions/plans/plan-actions.ts` | 8 usages (lines 161, 1394, 1489, 1752, 2155, 2163, 2192) | Critical — macrocycle creation, athlete plan query, assignment count |
| `actions/plans/plan-assignment-actions.ts` | Assignment logic reads macrocycle group | High |
| `actions/plans/session-plan-actions.ts` | Session plan creation | High |
| `actions/plans/session-planner-actions.ts` | Session planner reads group from macrocycle | High |
| `actions/athletes/athlete-actions.ts` | Athlete group assignment | Medium |
| `actions/dashboard/dashboard-actions.ts` | Coach dashboard group filter | Medium |
| `actions/profile/profile-actions.ts` | Profile stats via macrocycle group | Medium |
| `actions/workout/workout-session-actions.ts` | Workout session group lookup | Medium |
| `actions/sessions/training-session-actions.ts` | Training session group lookup | Medium |
| `actions/library/exercise-actions.ts` | Exercise access by group | Low |

### Components
| File | Impact |
|------|--------|
| `components/plans/workspace/context/PlanContext.tsx` | Holds athlete_group_id from macrocycle |
| `components/plans/workspace/AssignmentView.tsx` | Reads group from macrocycle |
| `components/plans/components/mesowizard/PlanReview.tsx` | Already buggy — needs fix anyway |
| `components/athletes/lean-athlete-management-page.tsx` | Group reads |
| `components/athletes/athlete-roster-section.tsx` | Roster by group |

### Lib / Types
| File | Impact |
|------|--------|
| `lib/auth-utils.ts` | Auth helper group membership check |
| `lib/changeset/entity-mappings.ts` | Entity mappings include athlete_group_id |
| `lib/validation/training-schemas.ts` | Validation schema has field on macrocycle |
| `types/training.ts` | TypeScript type definitions |
| `types/database.ts` | Auto-regenerates after Supabase migration |

### Pages + Tests
| File | Impact |
|------|--------|
| `app/(protected)/athletes/[id]/page.tsx` | Reads group via macrocycle |
| `lib/changeset/individual/context/utils.test.ts` | Test fixtures |
| `actions/workout/__tests__/workout-session-actions.test.ts` | Test fixtures |

---

## Weekly Insights Capture

**Decision**: AI auto-drafts from `workout_logs`, coach confirms.

After a microcycle ends, `summarizeWeeklyInsightsAction` reads completed/cancelled `workout_logs` for that microcycle, generates a draft `weekly_insights` summary, and presents it to the coach for review. Coach edits and confirms. Draft saves to `microcycles.weekly_insights`.

---

## AI Generation Trigger

**Decision (MVP)**: Explicit "Generate week" button + contextual suggestion banner.

Banner appears when: current date is within 3 days of next microcycle start AND no sessions generated yet for it. All personas retain control; banner covers the "I forgot" case for high school coaches.

**Future**: Push/email notifications, optional auto-schedule opt-in for busy club coaches.

---

## UI/UX Architecture

### Workspace: Enhance, Not Redesign

`TrainingPlanWorkspace.tsx` is the right foundation. Do NOT rebuild it. Wrap it the same way `IndividualPlanPageWithAI` wraps `IndividualPlanPage`:

```
CoachPlanPageWithAI
  └── ErrorBoundary
        └── CoachPlanContextProvider
              └── CoachPlanAssistantWrapper    ← new, mirrors PlanAssistantWrapper
                    ├── SeasonContextPanel     ← new: planning_context editor + AI chat
                    └── TrainingPlanWorkspace  ← existing, enhanced with group tabs + event badges
```

Additions to `TrainingPlanWorkspace` (additive changes only):
- Group tabs strip (GHS | PC | SiChuan) above week view — switches display filter
- `[shared]` / `[PC only]` session badges
- Event group (SS/MS/LS) inline chips within session content
- AI suggestion banner (within 3 days of next microcycle, no sessions generated)
- `[Generate Week ✨]` button in microcycle header
- `weekly_insights` display on past microcycles

### Coach Creation Wizard (First-Time Setup)

New stepped wizard, NOT the existing workspace. Reuse `QuickStartWizard` step structure:

1. **Import/Describe** — paste CSV, text, or free-form description of training philosophy
2. **AI Phase Detection** — "I found: GPP (8wk) → SPP (6wk) → Competition (4wk). Correct?" (reuse `PlanReview.tsx` card pattern for confirm/edit UI)
3. **Confirm Groups** — which training groups share this macro plan
4. **Land in Workspace** — `TrainingPlanWorkspace` pre-populated with mesocycles + `planning_context`

Import quality: MVP placeholder — AI does best-effort extraction, coach confirms/edits. No high-accuracy expectation in V1.

### AI Chat: Reuse `PlanAssistantWrapper` Pattern

Build `CoachPlanAssistantWrapper` mirroring `PlanAssistantWrapper`:
- Reads `macrocycle.planning_context` + `mesocycle.metadata` as system context
- Calls `planning-context-chat` AI route (new)
- Inline proposals applied to current microcycle

For initial wizard: AI chat is embedded in Step 1 (free conversation to extract philosophy). After setup, ongoing refinement = the collapsible right panel in workspace.

### AI Extraction Review: Reuse `PlanReview.tsx`

`PlanReview.tsx` (mesowizard) already shows a structured confirm/edit/regenerate card. Adapt it for:
- Planning context confirmation (after import/chat)
- Weekly insights confirmation (after microcycle ends)

### Subgroup Variation UI

**Pattern: Group Tabs + Event Badge Inline** (leanest, no separate plans)

```
Week 3 — GPP Phase
Groups: [GHS] [PC] [SiChuan]    ← tab switches display group

┌─────────────────────────────────────┐
│ Mon  Speed Endurance       [shared] │
│      LS: 15×200m M:36" F:39"        │
│      SS/MS: CSD @80%                │  ← event_group differentiation inline
│                                     │
│ Wed  Strength Circuit      [shared] │
│                                     │
│ Fri  Race Prep          [PC only ▲] │  ← group override badge
│      PC: 3×300m competitive         │
└─────────────────────────────────────┘
```

- `[shared]` = session applies identically to all groups
- `[PC only]` = session added/overridden for this group only
- SS/MS/LS inline within session content (athlete.event_group tags filter view)
- Switching group tabs highlights/dims relevant sessions — no page reload

### Responsive Layout

**Mobile (< 768px)**
```
[≡] Season Plan        [AI]
Group: [GHS ▼]          ← dropdown not tabs
─────────────────────
GPP > Week 3
┌────────────────────┐
│ Mon Speed End.     │  ← card per session
│ [shared] LS SS/MS  │
└────────────────────┘
[+ Add] [✨ Generate Week]
```

**iPad (768–1024px)** — 2-column (existing workspace transition, minimal change):
```
┌──────────┬────────────────────┐
│ Meso Nav │ Week 3             │
│ GPP  ●   │ GHS|PC|SiChuan     │  ← tabs above sessions
│ SPP      │ Mon: Speed End..   │
│ Taper    │ Wed: Strength      │
│          │ [Generate Week ✨] │
└──────────┴────────────────────┘
```

**Desktop (> 1024px)** — 3-column with collapsible AI context panel:
```
┌────────┬─────────────────────┬──────────────┐
│ Season │ Week 3  GHS|PC|SCH  │ AI Context   │
│ GPP    │                     │ planning_    │
│  Wk1   │ Mon Speed Endurance │ context:     │
│  Wk2   │  LS: 15×200m        │ "GPP focus   │
│ ▶Wk3   │  SS/MS: CSD @80%    │ speed end.   │
│  Wk4   │                     │ before       │
│ SPP    │ Wed Strength        │ Champs"      │
│  Wk5   │  [shared]           │              │
│        │                     │ [Edit] [✨]  │
│        │ [✨ Generate Week]  │              │
└────────┴─────────────────────┴──────────────┘
```

AI context panel collapses to icon on iPad. Hidden behind [AI] button on mobile.

---

## Open Questions (Remaining)

1. ~~**planning_context storage**~~ **RESOLVED**: Add dedicated `planning_context JSONB` on both `macrocycles` and `mesocycles`. `mesocycles.metadata` retains UI state (phase color, deload flag). Mixing them is ambiguous and hard to query cleanly. Group schedule constraints stay as freeform text inside `planning_context.text` — not a rigid structured field (AI reads intent from prose, not array parsing).

2. **Multi-coach clubs** (Pattern C, V2): Head coach context cascade to assistants — deferred.

---

## Decisions Log

| # | Question | Answer | Date |
|---|----------|--------|------|
| D1 | Initial blueprint only, or ongoing refinement too? | Both | 2026-03-05 |
| D2 | Input method? | Hybrid: AI conversation + free-text notes | 2026-03-05 |
| D3 | Group-first or individual-first? | Group-first with individual overrides | 2026-03-05 |
| D4 | Subgroup differentiation model? | Inline in sessions (SS/MS/LS as athlete tags, not separate plans) | 2026-03-05 |
| D5 | Expand macro/meso/micro tables vs new context tables? | Expand existing tables | 2026-03-05 |
| D6 | Redesign or enhance TrainingPlanWorkspace? | Enhance — wrap same as IndividualPlanPageWithAI pattern | 2026-03-05 |
| D7 | Chat UI approach? | Reuse PlanAssistantWrapper pattern via new CoachPlanAssistantWrapper | 2026-03-05 |
| D8 | Subgroup variation UI? | Group tabs + event badge inline (not separate plans/views) | 2026-03-05 |
| D9 | Import quality expectation? | MVP placeholder — best-effort AI extraction, coach confirms/edits | 2026-03-05 |
| D10 | planning_context column naming? | Dedicated `planning_context JSONB` on both macrocycles AND mesocycles. mesocycles.metadata kept for UI state only. | 2026-03-05 |
| D11 | Schedule constraints format? | Freeform text in planning_context — not a structured `scheduleByGroup` array. AI reads prose intent, not array values. | 2026-03-05 |
| D12 | Group tabs mental model? | "Track filters" — view/filter over shared sessions, not separate plan objects. No plan explosion. | 2026-03-05 |
| D13 | ai_memories usage? | Not used in this feature. Existing table remains unused for now. | 2026-03-05 |
