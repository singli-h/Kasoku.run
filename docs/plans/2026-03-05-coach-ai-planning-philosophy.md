# Coach AI Planning — Philosophy & Decision Guide

> Reference this document when making any implementation decision. If you face ambiguity not covered here, re-read this document before asking. Most answers are here.

---

## Product Vision

Kasoku.run's coach planning workflow makes a coach's tacit knowledge explicit and reusable. The coach writes a program once; the system helps them apply it per group, per week, per athlete — without losing the coach's judgment. **AI accelerates execution, not the other way around.**

---

## The Three Loops (Must All Close)

```
Loop A — Setup:    Coach describes season intent → stored as planning_context
Loop B — Generate: AI reads context chain → suggests microcycle → coach approves
Loop C — Reflect:  AI reads workout logs → drafts weekly insights → coach confirms
```

**The flywheel only works if all three loops close.** Do not ship partial loops. If Loop B ships but Loop C never records anything, context degrades and the system dies.

---

## Decision Table

When you face ambiguity, apply this table:

| Situation | Choose |
|-----------|--------|
| Structured schema vs freeform text | **Freeform.** AI reads prose at generation time. No `ai_extracted` fields. |
| New table vs extend existing | **Extend existing** unless there is a clear ownership reason not to. |
| Coach flexibility vs system consistency | **Coach flexibility** wins at the data layer. Enforce consistency at the UI layer (dropdown suggestions, not DB constraints). |
| More UI polish vs working data flow | **Working data flow first.** A plain textarea that saves and appears in AI context is worth more than polished UI that doesn't work. |
| Group variation complexity | **Groups are filters.** Variation lives at microcycle level only. No plan explosion (no duplicate macro/meso per group). |
| Scope creep | **If it is not in the 22-task plan, it is V2.** Do not add features. |
| Type narrowing on JSONB fields | **Always narrow explicitly.** No `as any` casts on `planning_context`, `weekly_insights`, or `metadata`. |

---

## What Coach Controls vs What AI Controls

```
Coach owns:
  - Season intent (writes planning_context)
  - Phase structure (names phases, sets dates)
  - Group composition (assigns athletes to groups)
  - Final approval of every AI output

AI owns:
  - Drafting microcycle sessions (suggests, does not commit)
  - Summarising weekly actuals (drafts weekly_insights for coach confirmation)
  - Surfacing race-week flags (alerts coach, does not auto-adjust)

Rule: AI never commits anything without coach confirmation.
```

---

## Schema Ground Truth

```
macrocycles.planning_context  JSONB  ← season direction (freeform coach text, { text: string })
mesocycles.planning_context   JSONB  ← phase focus (dedicated column, NOT mesocycles.metadata)
mesocycles.metadata           JSONB  ← UI state only: phase color, deload flag. NEVER put AI context here.
microcycles.athlete_group_id  FK     ← group variation lives HERE (not on macro, not on meso)
microcycles.weekly_insights   JSONB  ← post-week actuals (AI-drafted, coach-confirmed)
athletes.event_group          TEXT   ← event specialty (SS/MS/LS etc, freeform, coach-defined)
```

**planning_context contract:** `{ text: string }` only. No sub-fields. Max 10,000 chars.

---

## AI Context Chain (read order for generation)

```
1. macrocycle.planning_context.text    ← season direction
2. mesocycle.planning_context.text     ← current phase focus
3. last 3 microcycle.weekly_insights   ← what actually happened
4. athletes.event_group tags           ← who is in this group
5. upcoming races in date range        ← competition awareness
```

Schedule constraints are embedded in the freeform `planning_context.text`. AI reads prose intent, not parsed fields.

---

## Group Tabs Are Filters, Not Objects

Group tabs (GHS / PC / SiChuan) are **view filters over a shared session set**. They are not separate plan objects. There is one macro, one meso, one set of sessions per week. The `athlete_group_id` on the microcycle tells you which group executes that week. The coach sees all sessions; the filter highlights what is relevant for a selected group.

**Never create separate macro/meso records per group.** That is plan explosion and explicitly out of scope.

---

## MVP Scope Guard

**In scope:**
- Loops A, B, C
- Group tabs as filters
- SeasonContextPanel (macro context)
- GenerateMicrocycleSheet (AI generation via streaming)
- CoachSeasonWizard (3-step: describe → phases → groups)
- event_group on athletes
- Full RLS (coach own, individual own, athlete view)
- `planning_context` on macrocycles and mesocycles (dedicated columns)
- `weekly_insights` + `coach_notes` on microcycles

**Out of scope until explicitly requested (do not add):**
- `session_type: shared | variant` schema column
- Schedule-aware session greying (parse training days from context)
- Template linking / "Derived from Program X"
- Multi-coach hierarchy / assistant coach permissions
- Variant matrix (sex × event × race-week × age × injury)
- Cross-season AI memory (`ai_memories` table)
- Individual athlete overrides on group sessions
- Mobile evaluate mode

---

## Quality Bar

- Athlete `/program` and `/workout` flows must not regress. Test after every schema-touching task.
- Zero TypeScript errors before moving to the next phase.
- No `any` casts on JSONB field reads — always narrow explicitly.
- `npx supabase db push` not `db reset` — never wipe local data.
- `athlete_in_group()` function cast must match actual DB signature (verify before writing RLS).
- `getAthleteAssignedPlanAction` callers must be updated — the return shape changed.

---

## Key Facts About the Codebase

- `getMacrocycleByIdAction` uses `select('*')` — after migration, new columns auto-included
- `TrainingPlanWorkspace` is coach-only; individual users go through `IndividualPlanPageWithAI`
- `getCoachAthleteGroupsAction` is the correct function name (in `athlete-actions.ts`)
- `PlanAssistantWrapper` chat is gated on `selectedSessionId` — coach workspace needs its own `GenerateMicrocycleSheet`
- `mesocycles.metadata` already exists as JSONB for UI state — do NOT reuse it for AI context
- The 5 existing athlete RLS policies in `20260219100000_add_athlete_rls_for_assigned_plans.sql` all break after migration (they walk through `macrocycles.athlete_group_id` which no longer exists). The new migration replaces all 5.
