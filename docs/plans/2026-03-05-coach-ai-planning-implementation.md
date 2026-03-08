# Coach AI Planning — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-assisted planning workflow for coaches — season blueprint creation, ongoing microcycle generation with context chain, and group/subgroup differentiation.

**Architecture:** Schema moves `athlete_group_id` from `macrocycles` → `microcycles` (macro/meso = shared master plan, micro = group-specific execution). `planning_context JSONB` on both macrocycles AND mesocycles (dedicated column, not reusing `metadata`) carries coaching intent into AI. Group tabs are **track filters** (view/filter over shared sessions), not separate plan objects. `CoachPlanPageWithAI` wraps `TrainingPlanWorkspace` with Season Context panel. Generate Week opens a streaming AI chat sheet via `planning-context-chat` endpoint.

**Tech Stack:** Next.js 14 App Router, Supabase PostgreSQL, Vercel AI SDK, OpenAI gpt-4o, TypeScript strict, Tailwind CSS, Zod validation

**Design doc:** `docs/plans/2026-03-05-coach-ai-planning-design.md`

**Key facts about the codebase:**
- `getMacrocycleByIdAction` uses `select('*', ...)` — after migration, `planning_context` column is automatically included in the result
- `TrainingPlanWorkspace` is coach-only; individual users go through `IndividualPlanPageWithAI`
- `plan-assignment-actions.ts` does NOT write to `macrocycles.athlete_group_id` — group assignment is set at create time only
- `getCoachAthleteGroupsAction` is the correct function name (in `athlete-actions.ts:631`)
- macrocycles table has NO `ENABLE ROW LEVEL SECURITY` in any migration — must add it
- `PlanAssistantWrapper` chat is gated on `selectedSessionId` — coach workspace needs its own chat mechanism

**Constraint:** Phase 1 (migration) and Phase 2 (code updates) must be completed together before any feature work. Run `npm run build:web` to verify zero TypeScript errors before proceeding to Phase 3.

---

## Phase 1: Database Migration

### Task 1: Schema migration — move athlete_group_id to microcycles

**Files:**
- Create: `supabase/migrations/20260305100000_move_athlete_group_id_to_microcycles.sql`

**Step 0: Verify `athlete_in_group` function signature before writing RLS**

The new RLS policies call `athlete_in_group(...)`. Confirm the actual signature before copying it — a wrong cast silently denies all athlete access.

```bash
grep -n "athlete_in_group\|CREATE.*FUNCTION.*athlete_in_group" supabase/migrations/*.sql
```

Expected output shows something like:
```sql
CREATE OR REPLACE FUNCTION athlete_in_group(group_id bigint) RETURNS boolean ...
-- OR
CREATE OR REPLACE FUNCTION athlete_in_group(group_id integer) RETURNS boolean ...
```

**If the parameter type is `integer` (not `bigint`)**, change every `athlete_in_group(athlete_group_id::bigint)` in the migration below to `athlete_in_group(athlete_group_id::integer)`.

**Step 1: Write the migration**

```sql
-- Migration: Move athlete_group_id from macrocycles → microcycles
-- Adds: planning_context (macrocycles + mesocycles), weekly_insights + coach_notes (microcycles), event_group (athletes)
-- Fixes: RLS on macrocycles (was missing), full microcycles RLS policy matrix, replaces 5 broken athlete plan-view policies
-- Adds: data integrity partial unique indexes on microcycles
--
-- SAFETY NOTE: This migration drops macrocycles.athlete_group_id in the same transaction.
-- Safe to apply as a single migration ONLY if there are no live production users on the old schema.
-- If active production traffic exists, split into 2 migrations:
--   Migration A: add new columns + backfill (dual-read period)
--   Migration B: drop old column (after code is deployed and verified)
-- Current status: staging branch, no live users → single-phase acceptable.

-- ============================================================================
-- STEP 1: Add athlete_group_id to microcycles
-- ============================================================================
ALTER TABLE public.microcycles
  ADD COLUMN athlete_group_id INTEGER REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Backfill from existing macrocycle.athlete_group_id chain
-- Individual plans (macrocycle.athlete_group_id = NULL) → microcycle stays NULL
-- Coach group plans (macrocycle.athlete_group_id = X) → microcycle gets X
-- ============================================================================
UPDATE public.microcycles mc
SET athlete_group_id = mac.athlete_group_id
FROM public.mesocycles meso
JOIN public.macrocycles mac ON meso.macrocycle_id = mac.id
WHERE mc.mesocycle_id = meso.id
  AND mac.athlete_group_id IS NOT NULL;

-- ============================================================================
-- STEP 3: New columns
-- ============================================================================
-- Season direction for AI (separate from user-facing notes field)
ALTER TABLE public.macrocycles ADD COLUMN planning_context JSONB;

-- Phase focus for AI — dedicated column, NOT reusing metadata
-- metadata holds UI state (phase color, deload flag); planning_context holds AI coaching intent
ALTER TABLE public.mesocycles ADD COLUMN planning_context JSONB;

-- Post-week actuals: AI drafts from workout_logs, coach confirms
ALTER TABLE public.microcycles ADD COLUMN weekly_insights JSONB;
ALTER TABLE public.microcycles ADD COLUMN coach_notes TEXT;

-- Event specialty: SS (short sprints), MS (mid sprints), LS (long sprints), etc.
ALTER TABLE public.athletes ADD COLUMN event_group TEXT;

-- ============================================================================
-- STEP 4: Drop athlete_group_id from macrocycles
-- ============================================================================
ALTER TABLE public.macrocycles DROP COLUMN athlete_group_id;

-- ============================================================================
-- STEP 5: Enable RLS on macrocycles (was never set — gap in original schema)
-- ============================================================================
ALTER TABLE public.macrocycles ENABLE ROW LEVEL SECURITY;

-- Coach can fully manage their own macrocycles
CREATE POLICY "mac_coach_own" ON public.macrocycles
  FOR ALL
  USING (user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid()));

-- Athletes can view macrocycles that have their group's microcycles (new policy)
CREATE POLICY "mac_athlete_view_assigned" ON public.macrocycles
  FOR SELECT
  USING (
    id IN (
      SELECT meso.macrocycle_id FROM public.mesocycles meso
      WHERE meso.id IN (
        SELECT mesocycle_id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- STEP 6: Replace the 5 broken athlete RLS policies
-- All 5 existing policies in 20260219100000 walked through macrocycles.athlete_group_id
-- New policies walk from microcycles.athlete_group_id upward — simpler and correct
-- ============================================================================

DROP POLICY IF EXISTS "ms_athlete_view_assigned" ON public.mesocycles;
DROP POLICY IF EXISTS "mc_athlete_view_assigned" ON public.microcycles;
DROP POLICY IF EXISTS "sp_athlete_view_assigned" ON public.session_plans;
DROP POLICY IF EXISTS "spe_athlete_view_assigned" ON public.session_plan_exercises;
DROP POLICY IF EXISTS "sps_athlete_view_assigned" ON public.session_plan_sets;

-- microcycles: DIRECT check (no joins needed)
CREATE POLICY "mc_athlete_view_assigned" ON public.microcycles
  FOR SELECT
  USING (
    athlete_group_id IS NOT NULL
    AND athlete_in_group(athlete_group_id::bigint)
  );

-- mesocycles: one join up
CREATE POLICY "ms_athlete_view_assigned" ON public.mesocycles
  FOR SELECT
  USING (
    id IN (
      SELECT mesocycle_id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
  );

-- session_plans: direct microcycle check
CREATE POLICY "sp_athlete_view_assigned" ON public.session_plans
  FOR SELECT
  USING (
    microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
  );

-- session_plan_exercises
CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT
  USING (
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );

-- session_plan_sets
CREATE POLICY "sps_athlete_view_assigned" ON public.session_plan_sets
  FOR SELECT
  USING (
    session_plan_exercise_id IN (
      SELECT spe.id FROM public.session_plan_exercises spe
      JOIN public.session_plans sp ON spe.session_plan_id = sp.id
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- STEP 7: Full microcycles RLS policy matrix (H1 fix)
-- Replaces: athlete-view policies were added in STEP 6 above
-- Adds: owner policies for coach and individual user
-- ============================================================================

-- Coach: full CRUD on their own microcycles
CREATE POLICY "mc_coach_own" ON public.microcycles
  FOR ALL
  USING (user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid()));

-- Individual user: full CRUD on their own solo-plan microcycles (group is NULL)
-- This scopes individual access to non-group rows only to avoid overlap with mc_coach_own
CREATE POLICY "mc_individual_own" ON public.microcycles
  FOR ALL
  USING (
    athlete_group_id IS NULL
    AND user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid())
  )
  WITH CHECK (
    athlete_group_id IS NULL
    AND user_id = (SELECT id FROM public.users WHERE clerk_id = auth.uid())
  );

-- ============================================================================
-- STEP 8: Performance index + data integrity partial unique indexes (H2 fix)
-- ============================================================================

-- Lookup index for group → microcycles queries
CREATE INDEX IF NOT EXISTS idx_microcycles_athlete_group_id
  ON public.microcycles(athlete_group_id)
  WHERE athlete_group_id IS NOT NULL;

-- Prevent duplicate weeks for individual plans within same meso
CREATE UNIQUE INDEX IF NOT EXISTS uq_microcycles_meso_startdate_individual
  ON public.microcycles(mesocycle_id, start_date)
  WHERE athlete_group_id IS NULL;

-- Prevent duplicate weeks for same group within same meso
CREATE UNIQUE INDEX IF NOT EXISTS uq_microcycles_meso_group_startdate
  ON public.microcycles(mesocycle_id, athlete_group_id, start_date)
  WHERE athlete_group_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 1. microcycles.athlete_group_id populated for coach-assigned plans
-- 2. macrocycles no longer has athlete_group_id column
-- 3. macrocycles has RLS enabled + coach own-record policy + athlete view policy
-- 4. microcycles has full policy matrix: coach_own + individual_own + athlete_view_assigned
-- 5. Athlete SELECT policies work via microcycles.athlete_group_id chain
-- 6. Individual user plans (NULL group) unaffected
-- 7. mesocycles now has dedicated planning_context column (separate from metadata)
-- 8. Partial unique indexes prevent duplicate week entries
```

**Step 2: Apply migration**

```bash
# IMPORTANT: Do NOT use `db reset` — it wipes all local data.
# Use `db push` to apply the new migration file only:
npx supabase db push
# Verify columns landed correctly:
npx supabase db diff
```

Expected: No errors. Tables updated as specified.

**Step 3: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --local > apps/web/types/database.ts
```

Expected: `macrocycles` Row has `planning_context: Json | null`, no `athlete_group_id`. `microcycles` Row has `athlete_group_id: number | null`, `weekly_insights: Json | null`, `coach_notes: string | null`. `athletes` Row has `event_group: string | null`.

**Step 4: Commit**

```bash
git add supabase/migrations/20260305100000_move_athlete_group_id_to_microcycles.sql apps/web/types/database.ts
git commit -m "feat(db): move athlete_group_id to microcycles, add planning_context + RLS"
```

---

## Phase 2: Update All Code References

> After every task in this phase, run `npx tsc --noEmit` to check progress. Phase ends when zero TypeScript errors.

### Task 2: Fix types/training.ts — update form interfaces

**Files:**
- Modify: `apps/web/types/training.ts`

This is the first file to fix — downstream actions and components depend on the form types.

**Step 1: Find the interfaces**

```bash
grep -n "CreateMacrocycleForm\|CreateMicrocycleForm\|athlete_group_id" apps/web/types/training.ts | head -20
```

**Step 2: Update `CreateMacrocycleForm` — remove `athlete_group_id`**

Old:
```typescript
export interface CreateMacrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  athlete_group_id?: number   // ← REMOVE (now belongs on microcycle)
}
```

New:
```typescript
export interface CreateMacrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
}
```

**Step 3: Update `CreateMicrocycleForm` — add `athlete_group_id`**

Old (line 223):
```typescript
export interface CreateMicrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  mesocycle_id?: number
  sessions?: CreateSessionForm[]
}
```

New:
```typescript
export interface CreateMicrocycleForm {
  name: string
  description?: string
  start_date: string
  end_date: string
  mesocycle_id?: number
  athlete_group_id?: number | null   // ← ADD (group assignment now lives here)
  sessions?: CreateSessionForm[]
}
```

**Step 4: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "training.ts"
```

**Step 5: Commit**

```bash
git add apps/web/types/training.ts
git commit -m "fix(types): move athlete_group_id from CreateMacrocycleForm to CreateMicrocycleForm"
```

---

### Task 3: Fix plan-actions.ts — macrocycle create, microcycle create, athlete plan query

**Files:**
- Modify: `apps/web/actions/plans/plan-actions.ts`

Three separate fixes in this file.

**Step 1: Fix `createMacrocycleAction` — remove athlete_group_id from insert (line ~156-163)**

Old:
```typescript
const macrocycleData: MacrocycleInsert = {
  name: formData.name,
  description: formData.description || null,
  start_date: formData.start_date,
  end_date: formData.end_date,
  athlete_group_id: formData.athlete_group_id || null,
  user_id: dbUserId
}
```

New:
```typescript
const macrocycleData: MacrocycleInsert = {
  name: formData.name,
  description: formData.description || null,
  start_date: formData.start_date,
  end_date: formData.end_date,
  user_id: dbUserId
}
```

**Step 2: Fix `createMicrocycleAction` — add athlete_group_id to insert (line ~976-983)**

Old:
```typescript
const microcycleData: MicrocycleInsert = {
  name: formData.name,
  description: formData.description || null,
  start_date: formData.start_date,
  end_date: formData.end_date,
  mesocycle_id: formData.mesocycle_id || null,
  user_id: dbUserId
}
```

New:
```typescript
const microcycleData: MicrocycleInsert = {
  name: formData.name,
  description: formData.description || null,
  start_date: formData.start_date,
  end_date: formData.end_date,
  mesocycle_id: formData.mesocycle_id || null,
  athlete_group_id: formData.athlete_group_id ?? null,   // ← ADD
  user_id: dbUserId
}
```

**Step 3: Fix `getAthleteAssignedPlanAction` — rewrite to query from microcycles (lines ~2140-2250)**

This is the critical athlete-facing query. Old path: `athletes → athlete_group_id → macrocycles.athlete_group_id`. New path: `athletes → athlete_group_id → microcycles.athlete_group_id`.

Replace the entire query block (from "2. Get the most recent macrocycle" to end of the function body) with:

```typescript
// 2. Find the current or most recent microcycle assigned to this group
const today = new Date().toISOString().split('T')[0]

const { data: microcycles, error: microError } = await supabase
  .from('microcycles')
  .select(`
    id,
    name,
    start_date,
    end_date,
    mesocycles!inner (
      id,
      name,
      macrocycles!inner (
        id,
        name
      )
    ),
    session_plans (
      id,
      name,
      day,
      week
    )
  `)
  .eq('athlete_group_id', athlete.athlete_group_id)
  .order('start_date', { ascending: false })
  .limit(10)   // fetch last 10 to find current week

if (microError) {
  console.error('[getAthleteAssignedPlanAction] Microcycle error:', microError)
  return { isSuccess: false, message: 'Failed to fetch assigned plan' }
}

if (!microcycles || microcycles.length === 0) {
  return { isSuccess: true, message: 'No plan assigned to your group', data: null }
}

// Find current microcycle (today is within start_date..end_date)
const currentMicro = microcycles.find(mc => {
  if (!mc.start_date || !mc.end_date) return false
  return mc.start_date <= today && mc.end_date >= today
}) ?? microcycles[0]  // fallback to most recent

// Extract macrocycle name via the joined chain
const meso = Array.isArray(currentMicro.mesocycles)
  ? currentMicro.mesocycles[0]
  : currentMicro.mesocycles
const macro = meso
  ? (Array.isArray(meso.macrocycles) ? meso.macrocycles[0] : meso.macrocycles)
  : null

const allSessionPlanIds = (currentMicro.session_plans ?? []).map(sp => sp.id)

// 3. Get completion status from workout_logs
let sessionCompletionMap: Record<number, boolean> = {}
if (allSessionPlanIds.length > 0) {
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('session_plan_id, status')
    .in('session_plan_id', allSessionPlanIds)
    .eq('athlete_id', athlete.id)

  sessionCompletionMap = (workoutLogs ?? []).reduce((acc, log) => {
    if (log.session_plan_id) {
      acc[log.session_plan_id] = log.status === 'completed'
    }
    return acc
  }, {} as Record<number, boolean>)
}

return {
  isSuccess: true,
  message: 'Plan loaded',
  data: {
    macrocycleName: macro?.name ?? null,
    microcycle: {
      id: currentMicro.id,
      name: currentMicro.name,
      start_date: currentMicro.start_date,
      end_date: currentMicro.end_date,
    },
    sessions: (currentMicro.session_plans ?? []).map(sp => ({
      ...sp,
      isCompleted: sessionCompletionMap[sp.id] ?? false,
    })),
  },
}
```

> **Note:** If the existing `AthleteAssignedPlan` return type in `types/training.ts` has a different shape, update it to match the new return shape above.

**Step 3b: Audit all callers of `getAthleteAssignedPlanAction` and fix their data access**

This action's return shape changed — every caller that reads from the old shape will silently break at runtime. Find all callers now:

```bash
grep -rn "getAthleteAssignedPlanAction\|AthleteAssignedPlan" apps/web/ --include="*.ts" --include="*.tsx"
```

For each caller, check which fields it reads from `data`:
- Old shape: `data.macrocycle.name`, `data.macrocycle.mesocycles[0].microcycles[0].session_plans`
- New shape: `data.macrocycleName`, `data.microcycle.id`, `data.sessions`

Update each caller's destructuring to match the new shape. The two highest-risk files are:
- The `/program` page component (reads sessions to render week view)
- The `/workout` page component (reads sessions for session selection)

If these files access `data.macrocycle.*` anywhere, they must be updated before Task 8's smoke test.

**Step 4: Find and fix remaining usages (lines 1394, 1489)**

```bash
grep -n "athlete_group_id" apps/web/actions/plans/plan-actions.ts
```

For any remaining `.update({ athlete_group_id: ... })` or `.eq('athlete_group_id', ...)` on `macrocycles` table, redirect to `microcycles` table instead.

**Step 5: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "plan-actions"
git add apps/web/actions/plans/plan-actions.ts
git commit -m "fix(actions): update macrocycle/microcycle actions for new schema, rewrite athlete plan query"
```

---

### Task 4: Fix session-plan-actions.ts and session-planner-actions.ts

**Files:**
- Modify: `apps/web/actions/plans/session-plan-actions.ts`
- Modify: `apps/web/actions/plans/session-planner-actions.ts`

**Step 1: Find usages**

```bash
grep -n "athlete_group_id\|macrocycle\.athlete" \
  apps/web/actions/plans/session-plan-actions.ts \
  apps/web/actions/plans/session-planner-actions.ts
```

**Step 2: Update group lookups**

Any code reading group from macrocycle must now read from microcycle:
```typescript
// Old: supabase.from('macrocycles').select('athlete_group_id').eq('id', macroId)
// New: supabase.from('microcycles').select('athlete_group_id').eq('id', microcycleId)
```

**Step 3: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "session-plan|session-planner"
git add apps/web/actions/plans/session-plan-actions.ts apps/web/actions/plans/session-planner-actions.ts
git commit -m "fix(actions): read athlete_group_id from microcycles in session-plan actions"
```

---

### Task 5: Fix remaining action files

**Files:**
- Modify: `apps/web/actions/athletes/athlete-actions.ts`
- Modify: `apps/web/actions/dashboard/dashboard-actions.ts`
- Modify: `apps/web/actions/profile/profile-actions.ts`
- Modify: `apps/web/actions/workout/workout-session-actions.ts`
- Modify: `apps/web/actions/sessions/training-session-actions.ts`

**Step 1: Find all usages**

```bash
grep -rn "macrocycle.*athlete_group_id\|\.eq.*athlete_group_id.*macrocycle\|from.*macrocycles.*athlete_group_id" \
  apps/web/actions/athletes/ \
  apps/web/actions/dashboard/ \
  apps/web/actions/profile/ \
  apps/web/actions/workout/ \
  apps/web/actions/sessions/
```

**Step 2: Fix each** — same pattern as Task 4. Any filter on `macrocycles.athlete_group_id` becomes a filter on `microcycles.athlete_group_id`.

**Step 3: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
git add apps/web/actions/athletes/ apps/web/actions/dashboard/ apps/web/actions/profile/ \
  apps/web/actions/workout/ apps/web/actions/sessions/
git commit -m "fix(actions): update remaining actions to read group from microcycles"
```

---

### Task 6: Fix component files + export TrainingPlan type

**Files:**
- Modify: `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx`
- Modify: `apps/web/components/features/plans/workspace/components/EditMicrocycleDialog.tsx`
- Modify: `apps/web/components/features/plans/workspace/context/PlanContext.tsx`
- Modify: `apps/web/components/features/plans/workspace/AssignmentView.tsx`
- Modify: `apps/web/lib/validation/training-schemas.ts`
- Modify: `apps/web/lib/changeset/entity-mappings.ts`

**Step 1: Export `TrainingPlan` from workspace and add `planning_context`**

In `TrainingPlanWorkspace.tsx` at the `TrainingPlan` interface (line 84), make two changes:

```typescript
// CHANGE 1: Add export keyword
export interface TrainingPlan {
  macrocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    planning_context?: unknown | null   // CHANGE 2: add this field
  }
  mesocycles: Mesocycle[]
  events: Event[]
  status?: "active" | "draft" | "completed"
}
```

**Step 2: Add `athlete_group_id` to `EditMicrocycleDialog`'s `MicrocycleFormData`**

In `EditMicrocycleDialog.tsx` (line 11), update the interface:
```typescript
export interface MicrocycleFormData {
  id?: number
  mesocycle_id?: number | null
  user_id?: number | null
  athlete_group_id?: number | null     // ← ADD
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  weekNumber?: number
  volume?: number
  intensity?: number
  isDeload?: boolean
}
```

Also wire `athlete_group_id` through to the `updateMicrocycleAction` call inside the dialog's save handler:
```typescript
// In the save handler, add athlete_group_id to the update payload:
await updateMicrocycleAction(formData.id, {
  ...existingPayload,
  athlete_group_id: formData.athlete_group_id ?? null,
})
```

**Step 3: Fix `updateMicrocycleAction` to accept `athlete_group_id`**

In `plan-actions.ts`, find `updateMicrocycleAction` and add `athlete_group_id` to the update payload:
```typescript
// In the update object passed to supabase.update():
athlete_group_id: updateData.athlete_group_id ?? undefined,
```

**Step 4: Fix PlanContext.tsx**

```bash
grep -n "athlete_group_id" apps/web/components/features/plans/workspace/context/PlanContext.tsx
```

If it reads `macrocycle.athlete_group_id`, update to read from the first microcycle instead:
```typescript
// Old: const groupId = plan.macrocycle.athlete_group_id
// New: derive from microcycles if needed, or remove (context is per-microcycle now)
```

**Step 5: Fix validation schema and entity mappings**

```bash
grep -n "athlete_group_id" \
  apps/web/lib/validation/training-schemas.ts \
  apps/web/lib/changeset/entity-mappings.ts
```

Remove `athlete_group_id` from macrocycle schema/mappings. Add to microcycle equivalents where relevant.

**Step 6: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
git add apps/web/components/features/plans/ apps/web/lib/validation/ apps/web/lib/changeset/
git commit -m "fix(types): export TrainingPlan, add planning_context + athlete_group_id to interfaces"
```

---

### Task 7: Fix test fixtures

**Files:**
- Modify: `apps/web/lib/changeset/individual/context/utils.test.ts`
- Modify: `apps/web/actions/workout/__tests__/workout-session-actions.test.ts`

**Step 1: Find and update fixture data**

```bash
grep -n "athlete_group_id" \
  apps/web/lib/changeset/individual/context/utils.test.ts \
  apps/web/actions/workout/__tests__/workout-session-actions.test.ts
```

Move `athlete_group_id` from macrocycle fixture objects to microcycle fixture objects.

**Step 2: Run tests**

```bash
npm run test -- --testPathPattern="utils.test|workout-session-actions.test"
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add apps/web/lib/changeset/individual/context/utils.test.ts \
  apps/web/actions/workout/__tests__/workout-session-actions.test.ts
git commit -m "fix(tests): move athlete_group_id to microcycle in test fixtures"
```

---

### Task 8: Build verification + athlete flow smoke test

**Step 1: Full build**

```bash
npm run build:web 2>&1 | tail -30
```

Expected: `✓ Compiled successfully`. If TypeScript errors remain, fix them before continuing.

**Step 2: Athlete flow smoke test (catch regression early)**

```bash
npm run dev:web &
agent-browser open http://localhost:3000
# Sign in as athlete test user
# Navigate to /program — verify sessions load correctly
# Navigate to /workout — verify session cards appear
# Take screenshot as evidence
agent-browser screenshot /tmp/athlete-regression-check.png
```

Expected: `/program` shows assigned plan. `/workout` shows session cards. No console errors.

**Step 3: If athlete flow broken — debug before proceeding**

The `getAthleteAssignedPlanAction` rewrite in Task 3 is the most likely cause. Check that:
- The microcycle query returns results (add a console.log server-side)
- The downstream `/program` page reads from `data.microcycle` (not old `data.macrocycle.mesocycles...` shape)
- Fix before moving to Phase 3.

---

## Phase 3: New Server Actions

### Task 9: savePlanningContextAction

**Files:**
- Modify: `apps/web/actions/plans/plan-actions.ts` (add at end of file)
- Modify: `apps/web/actions/plans/index.ts`

**Step 1: Add action**

```typescript
/**
 * Save planning context for a macrocycle (AI-facing season direction).
 * planning_context is freeform JSONB — AI reads it whole at inference time.
 * Note: getMacrocycleByIdAction uses select('*') so planning_context is
 * automatically returned without query changes.
 */
export async function saveMacroPlanningContextAction(
  macrocycleId: number,
  context: Record<string, unknown>
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)

    const { error } = await supabase
      .from('macrocycles')
      .update({ planning_context: context })
      .eq('id', macrocycleId)
      .eq('user_id', dbUserId)

    if (error) return { isSuccess: false, message: error.message }
    return { isSuccess: true, message: 'Context saved' }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}

/**
 * Save planning context for a mesocycle phase.
 * Writes to mesocycles.planning_context (dedicated JSONB column, NOT metadata).
 * metadata retains its own purpose: phase color, deload flag, UI state.
 */
export async function saveMesoPlanningContextAction(
  mesocycleId: number,
  planningContext: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)

    const { error } = await supabase
      .from('mesocycles')
      .update({ planning_context: { text: planningContext } })
      .eq('id', mesocycleId)
      .eq('user_id', dbUserId)

    if (error) return { isSuccess: false, message: error.message }
    return { isSuccess: true, message: 'Phase context saved' }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
```

**Step 2: Export from index**

```typescript
export { saveMacroPlanningContextAction, saveMesoPlanningContextAction } from './plan-actions'
```

**Step 3: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "saveMacro|saveMeso"
git add apps/web/actions/plans/plan-actions.ts apps/web/actions/plans/index.ts
git commit -m "feat(actions): add savePlanningContext actions for macrocycle and mesocycle"
```

---

### Task 10: getMicrocycleGenerationContextAction

Fetches all context needed for AI to generate a microcycle for a group.

**Files:**
- Create: `apps/web/actions/plans/generate-microcycle-action.ts`
- Modify: `apps/web/actions/plans/index.ts`

**Step 1: Write the action**

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import supabase from '@/lib/supabase-server'
import type { ActionState } from '@/types/actions'

export interface MicrocycleGenerationContext {
  macroContext: string | null          // macrocycle.planning_context (dedicated JSONB column)
  mesoContext: string | null           // mesocycle.planning_context (dedicated JSONB column, NOT metadata)
  recentInsights: string[]             // last 3 weekly_insights summaries
  athleteEventGroups: string[]         // unique event_group values in this group (SS/MS/LS)
  upcomingRaces: string[]              // races within microcycle date range
  scheduleNotes: string | null         // training days/schedule from planning_context
  microcycleName: string | null
  groupName: string | null
}

/**
 * Fetch the full AI context chain for generating a microcycle.
 * Call this before opening the Generate Week AI chat.
 */
export async function getMicrocycleGenerationContextAction(
  microcycleId: number,
  athleteGroupId: number
): Promise<ActionState<MicrocycleGenerationContext>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    await getDbUserId(userId)

    // 1. Get microcycle + meso + macro chain in one query
    // Note: mesocycles has both metadata (UI state) AND planning_context (AI intent) — read both
    const { data: micro, error: microError } = await supabase
      .from('microcycles')
      .select(`
        id, name, start_date, end_date,
        mesocycles!inner (
          id, metadata, planning_context,
          macrocycles!inner (
            id, planning_context
          )
        )
      `)
      .eq('id', microcycleId)
      .single()

    if (microError || !micro) return { isSuccess: false, message: 'Microcycle not found' }

    const meso = Array.isArray(micro.mesocycles) ? micro.mesocycles[0] : micro.mesocycles
    const macro = Array.isArray(meso?.macrocycles) ? meso.macrocycles[0] : meso?.macrocycles

    // 2. Last 3 weekly_insights for this group (completed microcycles before this one)
    const { data: pastMicros } = await supabase
      .from('microcycles')
      .select('weekly_insights, start_date, name')
      .eq('athlete_group_id', athleteGroupId)
      .not('weekly_insights', 'is', null)
      .lt('start_date', micro.start_date ?? new Date().toISOString())
      .order('start_date', { ascending: false })
      .limit(3)

    // 3. Distinct event_groups for athletes in this group
    const { data: athletes } = await supabase
      .from('athletes')
      .select('event_group')
      .eq('athlete_group_id', athleteGroupId)
      .not('event_group', 'is', null)

    // 4. Upcoming races within microcycle date range
    const { data: races } = await supabase
      .from('races')
      .select('name, date, category')
      .gte('date', micro.start_date ?? '')
      .lte('date', micro.end_date ?? '')
      .order('date')

    // 5. Group name
    const { data: group } = await supabase
      .from('athlete_groups')
      .select('name')
      .eq('id', athleteGroupId)
      .single()

    // Extract planning_context text from macrocycle
    const macroCtx = macro?.planning_context
    const macroContext = macroCtx
      ? (typeof macroCtx === 'string' ? macroCtx : (macroCtx as Record<string, unknown>)?.text as string ?? JSON.stringify(macroCtx))
      : null

    // Extract planning_context from mesocycle's dedicated column (not metadata)
    // metadata is UI state (phase color, deload flag) — planning_context is AI coaching intent
    const mesoCtx = meso?.planning_context as Record<string, unknown> | null
    const mesoContext = mesoCtx?.text ? String(mesoCtx.text) : null
    // Schedule notes live in the freeform planning_context text — AI reads them inline
    const scheduleNotes: string | null = null  // extracted by AI from mesoContext/macroContext

    const recentInsights = (pastMicros ?? []).map(m => {
      const ins = m.weekly_insights as Record<string, unknown> | null
      return ins?.summary ? `Week ${m.name ?? m.start_date}: ${String(ins.summary)}` : ''
    }).filter(Boolean)

    const athleteEventGroups = [...new Set(
      (athletes ?? []).map(a => a.event_group).filter(Boolean) as string[]
    )]

    const upcomingRaces = (races ?? []).map(r => `${r.name} — ${r.date}`)

    return {
      isSuccess: true,
      message: 'Context loaded',
      data: {
        macroContext,
        mesoContext,
        recentInsights,
        athleteEventGroups,
        upcomingRaces,
        scheduleNotes,
        microcycleName: micro.name,
        groupName: group?.name ?? null,
      },
    }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
```

**Step 2: Export + TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "generate-microcycle"
git add apps/web/actions/plans/generate-microcycle-action.ts apps/web/actions/plans/index.ts
git commit -m "feat(actions): add getMicrocycleGenerationContextAction for AI context chain"
```

---

### Task 11: summarizeWeeklyInsightsAction

**Files:**
- Create: `apps/web/actions/plans/weekly-insights-action.ts`
- Modify: `apps/web/actions/plans/index.ts`

**Step 1: Write the action**

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import supabase from '@/lib/supabase-server'
import type { ActionState } from '@/types/actions'

interface WorkoutSummary {
  microcycleName: string | null
  workoutSummaryText: string    // formatted text ready for AI prompt
}

export interface WeeklyInsightsDraft {
  summary: string
  completionRate: number         // 0–1
  keyObservations: string[]
  suggestedAdjustments: string[]
  generatedAt: string
}

/**
 * Read completed workout_logs for a microcycle and format a summary
 * for use in the AI prompt. Client then calls planning-context-chat,
 * then calls saveWeeklyInsightsAction with the confirmed draft.
 */
export async function getMicrocycleWorkoutSummaryAction(
  microcycleId: number
): Promise<ActionState<WorkoutSummary>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    await getDbUserId(userId)

    const { data: micro } = await supabase
      .from('microcycles')
      .select('name, start_date, end_date')
      .eq('id', microcycleId)
      .single()

    const { data: logs } = await supabase
      .from('workout_logs')
      .select(`
        status, effort_percentage, athlete_notes,
        session_plans!inner ( name, microcycle_id )
      `)
      .eq('session_plans.microcycle_id', microcycleId)

    if (!logs?.length) {
      return { isSuccess: false, message: 'No workout data for this microcycle' }
    }

    const completed = logs.filter(l => l.status === 'completed').length
    const effortLogs = logs.filter(l => l.effort_percentage != null)
    const avgEffort = effortLogs.length
      ? Math.round(effortLogs.reduce((s, l) => s + (l.effort_percentage ?? 0), 0) / effortLogs.length)
      : null

    const athleteNotes = logs.filter(l => l.athlete_notes).map(l => `- ${l.athlete_notes}`).join('\n')

    const lines = [
      `Week: ${micro?.name ?? microcycleId}`,
      `Dates: ${micro?.start_date} to ${micro?.end_date}`,
      `Completion: ${completed}/${logs.length} sessions`,
      avgEffort != null ? `Average effort: ${avgEffort}%` : null,
      athleteNotes ? `Athlete notes:\n${athleteNotes}` : null,
    ].filter(Boolean) as string[]

    return {
      isSuccess: true,
      message: 'Summary ready',
      data: { microcycleName: micro?.name ?? null, workoutSummaryText: lines.join('\n') },
    }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}

/**
 * Save confirmed weekly_insights to a microcycle.
 */
export async function saveWeeklyInsightsAction(
  microcycleId: number,
  insights: WeeklyInsightsDraft
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    const dbUserId = await getDbUserId(userId)

    const { error } = await supabase
      .from('microcycles')
      .update({ weekly_insights: insights })
      .eq('id', microcycleId)
      .eq('user_id', dbUserId)

    if (error) return { isSuccess: false, message: error.message }
    return { isSuccess: true, message: 'Weekly insights saved' }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
```

**Step 2: Export + TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "weekly-insights"
git add apps/web/actions/plans/weekly-insights-action.ts apps/web/actions/plans/index.ts
git commit -m "feat(actions): add getMicrocycleWorkoutSummary + saveWeeklyInsights actions"
```

---

## Phase 4: New AI Route

### Task 12: POST /api/ai/planning-context-chat

**Files:**
- Create: `apps/web/app/api/ai/planning-context-chat/route.ts`

**Step 1: Write the route**

```typescript
/**
 * Planning Context Chat API Route
 *
 * Streaming AI chat for:
 * 1. Initial season setup — AI interviews coach to build planning_context
 * 2. Generate Week — AI receives full context chain and suggests microcycle sessions
 * 3. Weekly insights review — AI summarizes workout data
 *
 * Request body:
 *   messages:          conversation history (UIMessage[])
 *   macroContext?:     macrocycle.planning_context.text (dedicated JSONB column)
 *   mesoContext?:      mesocycle.planning_context.text (dedicated JSONB column, NOT metadata)
 *   recentInsights?:   last 3 weekly_insights summaries
 *   athleteEventGroups?: event_group tags (SS/MS/LS)
 *   upcomingRaces?:    races in date range
 *   scheduleNotes?:    training days config
 *   importText?:       CSV or free text from wizard import step
 *   mode?:             'setup' | 'generate' | 'insights' (defaults to 'setup')
 */

import { streamText, smoothStream, type UIMessage, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'

export const maxDuration = 60

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(10000),
    })
  ).min(1).max(50),
  macroContext: z.string().max(10000).optional(),
  mesoContext: z.string().max(10000).optional(),
  recentInsights: z.array(z.string().max(1000)).max(3).optional(),
  athleteEventGroups: z.array(z.string().max(50)).max(10).optional(),
  upcomingRaces: z.array(z.string().max(200)).max(10).optional(),
  scheduleNotes: z.string().max(1000).optional(),
  importText: z.string().max(20000).optional(),
  mode: z.enum(['setup', 'generate', 'insights']).default('setup'),
})

const SYSTEM_PROMPTS = {
  setup: `You are an expert sports science consultant helping a coach structure their training plan.
Have a natural conversation to understand:
- Season goals and competition targets
- Training philosophy (volume-first, intensity-first, event-specific)
- Athlete group composition (event specialties, experience levels)
- Training schedule per group (days per week, facilities)
- Constraints (injuries, competitions, season dates)
Ask one focused question at a time. End with a "Planning Summary:" when you have enough context.
If the coach provides a CSV or document, extract the periodization philosophy from it.`,

  generate: `You are an expert athletics coach assistant helping generate a training microcycle.
Based on the planning context provided, suggest a specific week of training sessions.
Format each session clearly:
  Day | Session Name | Content
  - List exercises/drills with sets/reps/distances
  - Note SS/MS/LS variants inline (e.g. "LS: 15×200m M:36" | SS/MS: CSD @80%")
  - Flag race-week adjustments if races are upcoming
Be specific and actionable. The coach will review and create the sessions manually.`,

  insights: `You are a training analysis assistant reviewing a completed week of training.
Summarize what happened, identify patterns, flag deviations from the plan, and suggest adjustments.
Return a structured summary with: completion rate, key observations (max 3), and suggested adjustments (max 2).`,
}

export async function POST(req: Request) {
  try {
    const [authResult, body] = await Promise.all([auth(), req.json()])
    const userId = authResult.userId
    if (!userId) return new Response('Unauthorized', { status: 401 })

    if (process.env.AI_ENABLED === 'false') {
      return new Response('AI features temporarily unavailable', { status: 503 })
    }

    const { allowed } = checkServerRateLimit(userId, 20, 60_000)
    if (!allowed) return new Response('Too many requests', { status: 429 })

    try { await getDbUserId(userId) }
    catch { return new Response('User not found', { status: 404 }) }

    let validated: z.infer<typeof RequestSchema>
    try { validated = RequestSchema.parse(body) }
    catch {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemParts: string[] = [SYSTEM_PROMPTS[validated.mode]]

    if (validated.macroContext) {
      systemParts.push(`\n## Season Planning Context\n${validated.macroContext}`)
    }
    if (validated.mesoContext) {
      systemParts.push(`\n## Current Phase Focus\n${validated.mesoContext}`)
    }
    if (validated.recentInsights?.length) {
      systemParts.push(`\n## Recent Weeks (what actually happened)\n${validated.recentInsights.join('\n')}`)
    }
    if (validated.athleteEventGroups?.length) {
      systemParts.push(`\n## Athletes in Group\n${validated.athleteEventGroups.join(', ')} specialists`)
    }
    if (validated.upcomingRaces?.length) {
      systemParts.push(`\n## Upcoming Races\n${validated.upcomingRaces.join('\n')}`)
    }
    if (validated.scheduleNotes) {
      systemParts.push(`\n## Training Schedule\n${validated.scheduleNotes}`)
    }
    if (validated.importText) {
      systemParts.push(`\n## Imported Training Document\n${validated.importText}`)
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemParts.join('\n\n'),
      messages: convertToModelMessages(validated.messages as UIMessage[]),
      experimental_transform: smoothStream(),
      maxSteps: 3,
    })

    return result.toDataStreamResponse()
  } catch (e) {
    console.error('[planning-context-chat] Error:', e)
    return new Response('Internal server error', { status: 500 })
  }
}
```

**Step 2: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "planning-context-chat"
git add apps/web/app/api/ai/planning-context-chat/route.ts
git commit -m "feat(api): add planning-context-chat AI route with setup/generate/insights modes"
```

---

## Phase 5: Enhance Existing AI Routes with Context Injection

### Task 13: Inject planning context into plan-generator + plan-assistant

**Files:**
- Modify: `apps/web/app/api/ai/plan-generator/route.ts`
- Modify: `apps/web/lib/changeset/plan-generator/system-prompt.ts`
- Modify: `apps/web/app/api/ai/plan-assistant/route.ts`
- Modify: `apps/web/lib/changeset/prompts/plan-assistant.ts`

**Step 1: Check current system prompt signatures**

```bash
head -60 apps/web/lib/changeset/plan-generator/system-prompt.ts
head -60 apps/web/lib/changeset/prompts/plan-assistant.ts
```

**Step 2: Add optional context params to request schema in both routes**

In each route's Zod schema, add:
```typescript
planningContext: z.string().max(5000).optional(),
phaseContext: z.string().max(10000).optional(),
recentInsights: z.array(z.string().max(1000)).max(3).optional(),
athleteEventGroups: z.array(z.string().max(50)).max(10).optional(),
```

**Step 3: Inject into system prompt builder in both files**

```typescript
// In getPlanGeneratorSystemPrompt / buildPlanAssistantSystemPrompt:
if (options.planningContext) {
  prompt += `\n\n## Season Planning Context\n${options.planningContext}`
}
if (options.phaseContext) {
  prompt += `\n\n## Current Phase Focus\n${options.phaseContext}`
}
if (options.recentInsights?.length) {
  prompt += `\n\n## Recent Weeks\n` + options.recentInsights.join('\n')
}
if (options.athleteEventGroups?.length) {
  prompt += `\n\n## Athletes: ${options.athleteEventGroups.join(', ')} specialists`
}
```

All params are optional — existing callers (individual user path) pass nothing and get the same behavior as before.

**Step 4: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "plan-generator|plan-assistant"
git add apps/web/app/api/ai/plan-generator/route.ts apps/web/app/api/ai/plan-assistant/route.ts \
  apps/web/lib/changeset/plan-generator/ apps/web/lib/changeset/prompts/
git commit -m "feat(api): inject planning context chain into plan-generator and plan-assistant routes"
```

---

## Phase 6: Coach Creation Wizard

### Task 14: CoachSeasonWizard — 3-step setup

**Files:**
- Create: `apps/web/components/features/plans/coach-wizard/CoachSeasonWizard.tsx`
- Create: `apps/web/components/features/plans/coach-wizard/steps/Step1Import.tsx`
- Create: `apps/web/components/features/plans/coach-wizard/steps/Step2PhaseReview.tsx`
- Create: `apps/web/components/features/plans/coach-wizard/steps/Step3Groups.tsx`

**Step 1: Write CoachSeasonWizard.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Step1Import } from './steps/Step1Import'
import { Step2PhaseReview } from './steps/Step2PhaseReview'
import { Step3Groups } from './steps/Step3Groups'
import { createMacrocycleAction } from '@/actions/plans/plan-actions'
import { saveMacroPlanningContextAction } from '@/actions/plans/plan-actions'

type WizardStep = 'import' | 'phase-review' | 'groups'

interface PhaseConfig {
  name: string
  phase: 'GPP' | 'SPP' | 'Taper' | 'Competition'
  weeks: number
}

interface WizardState {
  macrocycleName: string
  startDate: string
  endDate: string
  planningContext: string
  phases: PhaseConfig[]
  selectedGroupIds: number[]
}

interface CoachSeasonWizardProps {
  coachGroups: Array<{ id: number; name: string }>
}

export function CoachSeasonWizard({ coachGroups }: CoachSeasonWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('import')
  const [state, setState] = useState<WizardState>({
    macrocycleName: '', startDate: '', endDate: '',
    planningContext: '', phases: [], selectedGroupIds: [],
  })
  const [isCreating, setIsCreating] = useState(false)

  async function handleComplete(groupIds: number[]) {
    setIsCreating(true)
    try {
      const result = await createMacrocycleAction({
        name: state.macrocycleName,
        start_date: state.startDate,
        end_date: state.endDate,
      })
      if (!result.isSuccess || !result.data) throw new Error(result.message)
      const macrocycleId = result.data.id

      // Store planning context + selected groups in planning_context JSONB
      // Groups are stored here so the workspace knows which group tabs to show
      await saveMacroPlanningContextAction(macrocycleId, {
        text: state.planningContext,
        groups: groupIds,                // ← group IDs for workspace tabs
        phases: state.phases,            // ← proposed phase structure
      })

      router.push(`/plans/${macrocycleId}`)
    } catch (e) {
      console.error('[CoachSeasonWizard] Failed:', e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(['import', 'phase-review', 'groups'] as WizardStep[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">→</span>}
            <span className={step === s ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {i + 1}. {s === 'import' ? 'Describe' : s === 'phase-review' ? 'Structure' : 'Groups'}
            </span>
          </span>
        ))}
      </div>

      {step === 'import' && (
        <Step1Import
          onComplete={(planningContext, name, startDate, endDate) => {
            setState(s => ({ ...s, planningContext, macrocycleName: name, startDate, endDate }))
            setStep('phase-review')
          }}
        />
      )}
      {step === 'phase-review' && (
        <Step2PhaseReview
          planningContext={state.planningContext}
          onComplete={(phases) => {
            setState(s => ({ ...s, phases }))
            setStep('groups')
          }}
          onBack={() => setStep('import')}
        />
      )}
      {step === 'groups' && (
        <Step3Groups
          coachGroups={coachGroups}
          onComplete={handleComplete}
          onBack={() => setStep('phase-review')}
          isCreating={isCreating}
        />
      )}
    </div>
  )
}
```

**Step 2: Write Step1Import.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Step1ImportProps {
  onComplete: (planningContext: string, name: string, startDate: string, endDate: string) => void
}

export function Step1Import({ onComplete }: Step1ImportProps) {
  const [context, setContext] = useState('')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Describe your season</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your existing training plan or describe your coaching philosophy.
          AI will help structure it into phases.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Season name</Label>
        <Input placeholder="e.g. 2026 Track Season" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Training plan / philosophy</Label>
        <Textarea
          placeholder="Paste CSV, spreadsheet data, or describe:&#10;- Season goals and key competitions&#10;- Training philosophy (e.g. GPP Jan–Mar, high volume...)&#10;- Event focus (sprints, distance, jumps...)&#10;- Group schedules (GHS: 3x/wk Mon/Wed/Fri)"
          className="min-h-[200px] font-mono text-sm"
          value={context}
          onChange={e => setContext(e.target.value)}
          maxLength={10000}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            MVP: AI extracts best-effort context. You can edit and refine after creation.
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {context.length.toLocaleString()} / 10,000
          </p>
        </div>
      </div>

      <Button
        onClick={() => onComplete(context, name, startDate, endDate)}
        disabled={!context.trim() || !name.trim() || !startDate || !endDate}
        className="w-full"
      >
        Continue →
      </Button>
    </div>
  )
}
```

**Step 3: Write Step2PhaseReview.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Phase {
  name: string
  phase: 'GPP' | 'SPP' | 'Taper' | 'Competition'
  weeks: number
}

const DEFAULT_PHASES: Phase[] = [
  { name: 'General Preparation', phase: 'GPP', weeks: 8 },
  { name: 'Specific Preparation', phase: 'SPP', weeks: 6 },
  { name: 'Competition', phase: 'Competition', weeks: 6 },
  { name: 'Taper', phase: 'Taper', weeks: 2 },
]

interface Step2PhaseReviewProps {
  planningContext: string
  onComplete: (phases: Phase[]) => void
  onBack: () => void
}

export function Step2PhaseReview({ planningContext, onComplete, onBack }: Step2PhaseReviewProps) {
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES)

  function updatePhase(i: number, field: keyof Phase, value: string | number) {
    setPhases(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Season structure</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edit these phases to match your plan. You can also adjust later in the workspace.
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <Input
                value={phase.name}
                onChange={e => updatePhase(i, 'name', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Input
                type="number"
                value={phase.weeks}
                onChange={e => updatePhase(i, 'weeks', parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-sm text-center"
                min={1} max={20}
              />
              <span className="whitespace-nowrap">wk</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Total: {totalWeeks} weeks</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">← Back</Button>
        <Button onClick={() => onComplete(phases)} className="flex-1">Continue →</Button>
      </div>
    </div>
  )
}
```

**Step 4: Write Step3Groups.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Step3GroupsProps {
  coachGroups: Array<{ id: number; name: string }>
  onComplete: (groupIds: number[]) => void
  onBack: () => void
  isCreating: boolean
}

export function Step3Groups({ coachGroups, onComplete, onBack, isCreating }: Step3GroupsProps) {
  const [selected, setSelected] = useState<number[]>(coachGroups.map(g => g.id))

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Which groups follow this plan?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selected groups will appear as tabs in the workspace.
          You can change this later via the Season Context panel.
        </p>
      </div>

      {coachGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 border rounded-lg">
          No groups found. You can create groups in the Athletes section, then return here.
        </p>
      ) : (
        <div className="space-y-3">
          {coachGroups.map(group => (
            <div key={group.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                id={`group-${group.id}`}
                checked={selected.includes(group.id)}
                onCheckedChange={() => toggle(group.id)}
              />
              <Label htmlFor={`group-${group.id}`} className="cursor-pointer flex-1">{group.name}</Label>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isCreating} className="flex-1">← Back</Button>
        <Button
          onClick={() => onComplete(selected)}
          disabled={isCreating}
          className="flex-1"
        >
          {isCreating ? 'Creating season...' : 'Create Season Plan'}
        </Button>
      </div>
    </div>
  )
}
```

**Step 5: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "coach-wizard"
git add apps/web/components/features/plans/coach-wizard/
git commit -m "feat(ui): add CoachSeasonWizard with 3-step setup — stores groups in planning_context"
```

---

## Phase 7: Coach Workspace

### Task 15: SeasonContextPanel

**Files:**
- Create: `apps/web/components/features/plans/coach-workspace/SeasonContextPanel.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { saveMacroPlanningContextAction } from '@/actions/plans/plan-actions'
import { useToast } from '@/hooks/use-toast'

interface SeasonContextPanelProps {
  macrocycleId: number
  planningContext: string | null
  onContextUpdate?: (context: string) => void
}

export function SeasonContextPanel({ macrocycleId, planningContext, onContextUpdate }: SeasonContextPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(planningContext ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const result = await saveMacroPlanningContextAction(macrocycleId, { text: value })
    setSaving(false)
    if (result.isSuccess) {
      setEditing(false)
      onContextUpdate?.(value)
      toast({ title: 'Season context saved' })
    } else {
      toast({ title: 'Save failed', description: result.message, variant: 'destructive' })
    }
  }

  const preview = value
    ? value.slice(0, 120) + (value.length > 120 ? '...' : '')
    : 'Add your season goals and coaching philosophy — helps AI generate better plans'

  return (
    <div className="border rounded-lg bg-muted/30 mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium shrink-0">Season Context</span>
          {!expanded && (
            <span className="text-muted-foreground text-xs truncate">{preview}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {editing ? (
            <>
              <Textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                className="min-h-[120px] text-sm font-mono"
                placeholder="Season goals, training philosophy, competition calendar, group schedules..."
                maxLength={10000}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setValue(planningContext ?? ''); setEditing(false) }}>
                    Cancel
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {value.length.toLocaleString()} / 10,000
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {value || 'No planning context yet.'}
              </p>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

**Commit:**
```bash
git add apps/web/components/features/plans/coach-workspace/SeasonContextPanel.tsx
git commit -m "feat(ui): add SeasonContextPanel component"
```

---

### Task 16: GroupTabsBar

**Files:**
- Create: `apps/web/components/features/plans/coach-workspace/GroupTabsBar.tsx`

```tsx
'use client'

interface AthleteGroup { id: number; name: string }

interface GroupTabsBarProps {
  groups: AthleteGroup[]
  selectedGroupId: number | null
  onSelect: (groupId: number | null) => void
}

export function GroupTabsBar({ groups, selectedGroupId, onSelect }: GroupTabsBarProps) {
  if (groups.length === 0) return null
  return (
    <div className="flex items-center gap-1 border-b pb-2 mb-3 overflow-x-auto shrink-0">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
          selectedGroupId === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        All
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            selectedGroupId === g.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
```

**Commit:**
```bash
git add apps/web/components/features/plans/coach-workspace/GroupTabsBar.tsx
git commit -m "feat(ui): add GroupTabsBar component"
```

---

### Task 17: GenerateMicrocycleSheet — wired AI generation

This is the core AI feature. Clicking "Generate Week" opens a sheet that:
1. Loads context via `getMicrocycleGenerationContextAction`
2. Shows context summary to coach
3. Has a "Generate with AI" button that calls `planning-context-chat` in `generate` mode
4. Streams AI response showing suggested sessions
5. Coach reviews and creates sessions manually in the workspace

**Files:**
- Create: `apps/web/components/features/plans/coach-workspace/GenerateMicrocycleSheet.tsx`

```tsx
'use client'

import { useState, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { getMicrocycleGenerationContextAction, type MicrocycleGenerationContext } from '@/actions/plans/generate-microcycle-action'
import { useToast } from '@/hooks/use-toast'

interface GenerateMicrocycleSheetProps {
  microcycleId: number
  athleteGroupId: number | null
  microcycleName?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateMicrocycleSheet({
  microcycleId,
  athleteGroupId,
  microcycleName,
  open,
  onOpenChange,
}: GenerateMicrocycleSheetProps) {
  const [context, setContext] = useState<MicrocycleGenerationContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [contextExpanded, setContextExpanded] = useState(false)
  const { toast } = useToast()

  const loadContext = useCallback(async () => {
    if (!athleteGroupId) return
    setLoadingContext(true)
    const result = await getMicrocycleGenerationContextAction(microcycleId, athleteGroupId)
    setLoadingContext(false)
    if (result.isSuccess && result.data) {
      setContext(result.data)
    } else {
      toast({ title: 'Could not load context', description: result.message, variant: 'destructive' })
    }
  }, [microcycleId, athleteGroupId, toast])

  // Load context when sheet opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen && !context) {
      loadContext()
    }
  }, [onOpenChange, context, loadContext])

  async function handleGenerate() {
    if (!context) return
    setGenerating(true)
    setAiResponse('')

    const messages = [{
      role: 'user' as const,
      content: `Generate a training week for ${context.groupName ?? 'this group'} — ${microcycleName ?? 'upcoming week'}.`,
    }]

    const body = {
      messages,
      mode: 'generate',
      macroContext: context.macroContext ?? undefined,
      mesoContext: context.mesoContext ?? undefined,
      recentInsights: context.recentInsights.length ? context.recentInsights : undefined,
      athleteEventGroups: context.athleteEventGroups.length ? context.athleteEventGroups : undefined,
      upcomingRaces: context.upcomingRaces.length ? context.upcomingRaces : undefined,
      scheduleNotes: context.scheduleNotes ?? undefined,
    }

    try {
      const res = await fetch('/api/ai/planning-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        // Parse Vercel AI SDK data stream format (0:"text" lines)
        const lines = chunk.split('\n').filter(l => l.startsWith('0:'))
        for (const line of lines) {
          try {
            const text = JSON.parse(line.slice(2))
            accumulated += text
            setAiResponse(accumulated)
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (e) {
      toast({ title: 'Generation failed', description: String(e), variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Week — {microcycleName ?? 'Week'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!athleteGroupId && (
            <p className="text-sm text-muted-foreground p-3 border rounded-lg">
              Select a group from the tabs above to generate sessions for that group.
            </p>
          )}

          {athleteGroupId && loadingContext && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading context...
            </div>
          )}

          {context && (
            <>
              {/* Context summary — collapsible */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setContextExpanded(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left"
                >
                  <span className="font-medium text-muted-foreground">AI knows:</span>
                  {contextExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {contextExpanded && (
                  <div className="px-3 pb-3 space-y-1 text-xs text-muted-foreground">
                    {context.macroContext && <p>• Season: {context.macroContext.slice(0, 100)}...</p>}
                    {context.mesoContext && <p>• Phase: {context.mesoContext.slice(0, 80)}</p>}
                    {context.athleteEventGroups.length > 0 && <p>• Groups: {context.athleteEventGroups.join(', ')}</p>}
                    {context.upcomingRaces.length > 0 && <p>• Races: {context.upcomingRaces.join(', ')}</p>}
                    {context.recentInsights.length > 0 && <p>• Last {context.recentInsights.length} weeks loaded</p>}
                    {!context.macroContext && !context.mesoContext && (
                      <p className="text-amber-600">No planning context yet — add it in Season Context panel for better results.</p>
                    )}
                  </div>
                )}
              </div>

              {!aiResponse && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full gap-2"
                >
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    : <><Sparkles className="h-4 w-4" />Generate week sessions</>
                  }
                </Button>
              )}

              {aiResponse && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">AI Suggestion</p>
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{aiResponse}</pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Review the suggestion above, then add sessions manually using the + button in the workspace.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Commit:**
```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "GenerateMicrocycle"
git add apps/web/components/features/plans/coach-workspace/GenerateMicrocycleSheet.tsx
git commit -m "feat(ui): add GenerateMicrocycleSheet with real AI generation via planning-context-chat"
```

---

### Task 18: CoachPlanPageWithAI wrapper

**Files:**
- Create: `apps/web/components/features/plans/coach-workspace/CoachPlanPageWithAI.tsx`

```tsx
'use client'

import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
// TrainingPlan is now exported — see Task 6
import { TrainingPlanWorkspace, type TrainingPlan } from '../workspace/TrainingPlanWorkspace'
import { SeasonContextPanel } from './SeasonContextPanel'
import { GroupTabsBar } from './GroupTabsBar'
import { GenerateMicrocycleSheet } from './GenerateMicrocycleSheet'

interface CoachPlanPageWithAIProps {
  initialPlan: TrainingPlan   // TrainingPlan.macrocycle now has planning_context field
  /** Real group objects from DB — passed by the page server component so tabs show correct names */
  coachGroups?: Array<{ id: number; name: string }>
}

function CoachPlanFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">AI features unavailable</p>
        <p className="text-xs text-muted-foreground">You can still edit your plan manually.</p>
      </div>
      <button onClick={resetErrorBoundary} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs">
        Retry
      </button>
    </div>
  )
}

export function CoachPlanPageWithAI({ initialPlan, coachGroups: propGroups }: CoachPlanPageWithAIProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false)
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<number | null>(null)

  // Extract planning_context text from the JSONB field
  const planningContextText = (() => {
    const ctx = initialPlan.macrocycle.planning_context
    if (!ctx) return null
    if (typeof ctx === 'string') return ctx
    return (ctx as Record<string, unknown>)?.text as string ?? null
  })()

  // Extract group IDs stored in planning_context by wizard (for ordering/filtering)
  const storedGroupIds = (() => {
    const ctx = initialPlan.macrocycle.planning_context as Record<string, unknown> | null
    const groups = ctx?.groups
    return Array.isArray(groups) ? groups as number[] : []
  })()

  // Prefer real group objects passed from the page server component.
  // Fall back to ID-only stubs only if the page didn't pass them — this should not happen in practice.
  const coachGroups = propGroups && propGroups.length > 0
    ? propGroups.filter(g => storedGroupIds.length === 0 || storedGroupIds.includes(g.id))
    : storedGroupIds.map(id => ({ id, name: `Group ${id}` }))  // stub fallback (log a warning)

  // Track: group tabs are FILTERS over the shared session set, not separate plan objects.
  // When a group is selected, sessions whose day doesn't align with that group's schedule
  // are "greyed out" — still visible (shared program is visible), but de-emphasised.
  // Schedule is stored in planning_context.text as freeform — we don't parse it programmatically.
  // Instead, we pass selectedGroupId down and let the session card apply opacity when
  // the coach has explicitly marked a session as group-specific ([PC only] badge).
  // Full schedule-aware greying (based on parsed days) is a V2 enhancement.

  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <CoachPlanFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}>
      <div className="flex flex-col">
        <div className="px-4 pt-4">
          <SeasonContextPanel
            macrocycleId={initialPlan.macrocycle.id}
            planningContext={planningContextText}
          />
          <GroupTabsBar
            groups={coachGroups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
          />
        </div>

        <TrainingPlanWorkspace
          initialPlan={initialPlan}
          onGenerateWeek={(microcycleId) => {
            if (selectedGroupId === null) {
              // Guard: require group selection before generating — otherwise AI context is ambiguous
              alert('Select a group tab before generating a week.')
              return
            }
            setSelectedMicrocycleId(microcycleId)
            setGenerateSheetOpen(true)
          }}
        />

        {/* Only render sheet when both IDs are known — avoids passing 0/null to the action */}
        {selectedMicrocycleId !== null && selectedGroupId !== null && (
          <GenerateMicrocycleSheet
            microcycleId={selectedMicrocycleId}
            athleteGroupId={selectedGroupId}
            open={generateSheetOpen}
            onOpenChange={setGenerateSheetOpen}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
```

> **Note:** `TrainingPlanWorkspace` needs an `onGenerateWeek` prop added (callback with microcycleId). Wire it to the "Generate Week" button inside the microcycle editor. See existing `onPlanUpdate` prop pattern.

**Commit:**
```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "CoachPlan"
git add apps/web/components/features/plans/coach-workspace/CoachPlanPageWithAI.tsx
git commit -m "feat(ui): add CoachPlanPageWithAI wrapper with context panel, group tabs, generate sheet"
```

---

### Task 19: Wire `onGenerateWeek` into TrainingPlanWorkspace

`TrainingPlanWorkspace` needs to surface the "Generate Week" trigger from within its microcycle view.

**Files:**
- Modify: `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx`

**Step 1: Add prop**

```typescript
interface TrainingPlanWorkspaceProps {
  initialPlan: TrainingPlan
  onPlanUpdate?: (plan: TrainingPlan) => void
  onGenerateWeek?: (microcycleId: number) => void   // ← ADD
}
```

**Step 2: Pass `onGenerateWeek` down and add button in microcycle header**

Find where the microcycle editor/header is rendered (search for `MicrocycleEditor` or `selectedMicro` in the JSX). Add a "Generate Week" button that calls `onGenerateWeek(selectedMicro.id)`:

```tsx
{onGenerateWeek && selectedMicro && (
  <Button
    variant="outline"
    size="sm"
    className="gap-1.5"
    onClick={() => onGenerateWeek(selectedMicro.id)}
  >
    <Sparkles className="h-3.5 w-3.5" />
    Generate Week
  </Button>
)}
```

**Step 3: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "TrainingPlanWorkspace"
git add apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx
git commit -m "feat(ui): add onGenerateWeek prop to TrainingPlanWorkspace"
```

---

## Phase 8: Athlete event_group UI

### Task 20: event_group field in athlete profile + roster

**Files:**
- Modify: `apps/web/actions/athletes/athlete-actions.ts` (include event_group in athlete upsert)
- Find athlete profile form:

```bash
grep -rn "athlete.*form\|AthleteForm\|athleteForm" apps/web/components/features/athletes/ | head -10
```

**Step 1: Add event_group to athlete update action**

In the athlete upsert/update, include `event_group` in the update payload:
```typescript
event_group: formData.event_group ?? null,
```

**Step 2: Add event_group select to athlete profile form**

```tsx
<div className="space-y-2">
  <Label>Event group</Label>
  <select
    name="event_group"
    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
    defaultValue={athlete.event_group ?? ''}
  >
    <option value="">Not specified</option>
    <option value="SS">Short Sprints (SS) — 60/100/200m</option>
    <option value="MS">Mid Sprints (MS) — 400m</option>
    <option value="LS">Long Sprints (LS) — 400mH/800m</option>
    <option value="MD">Middle Distance (MD) — 1500/3000m</option>
    <option value="LD">Long Distance (LD) — 5000m+</option>
    <option value="HJ">Jumps</option>
    <option value="TH">Throws</option>
    <option value="HU">Hurdles</option>
    <option value="MB">Multi-Events</option>
  </select>
</div>
```

**Step 3: Show event_group badge in athlete roster**

```tsx
{athlete.event_group && (
  <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{athlete.event_group}</span>
)}
```

**Step 4: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -i athlete
git add apps/web/actions/athletes/ apps/web/components/features/athletes/
git commit -m "feat(athletes): add event_group field to athlete profile and roster"
```

---

## Phase 9: Wire Routes

### Task 21: Coach plan routes

**Files:**
- Find existing plan detail page that renders `TrainingPlanWorkspace`
- Create: `apps/web/app/(protected)/plans/new/page.tsx`

**Step 1: Find existing plan detail page**

```bash
find apps/web/app -name "page.tsx" | xargs grep -l "TrainingPlanWorkspace" 2>/dev/null
```

**Step 2: Update plan detail page to use `CoachPlanPageWithAI`**

Replace `<TrainingPlanWorkspace initialPlan={planData} />` with `<CoachPlanPageWithAI initialPlan={planData} />` for coach users. Fetch coach groups server-side so tab names are real, not "Group 1" stubs:

```tsx
// In the page server component, fetch coach groups alongside the plan:
const [planResult, groupsResult] = await Promise.all([
  getMacrocycleByIdAction(params.id),
  getCoachAthleteGroupsAction(),
])
const coachGroups = (groupsResult.isSuccess ? groupsResult.data ?? [] : [])
  .map(g => ({ id: g.id, name: g.name ?? `Group ${g.id}` }))

// Render:
{isCoach ? (
  <CoachPlanPageWithAI initialPlan={planData} coachGroups={coachGroups} />
) : (
  <IndividualPlanPageWithAI trainingBlock={trainingBlock} />
)}
```

**Step 3: Create `/plans/new` wizard page**

First, find how the codebase checks coach role (it's in Clerk session claims or a DB `users.role` field):

```bash
grep -rn "isCoach\|role.*coach\|coach.*role\|userRole" apps/web/app --include="*.tsx" | head -10
```

Then apply the role guard pattern that matches the existing approach:

```tsx
// apps/web/app/(protected)/plans/new/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { CoachSeasonWizard } from '@/components/features/plans/coach-wizard/CoachSeasonWizard'
import { getCoachAthleteGroupsAction } from '@/actions/athletes/athlete-actions'  // ← correct name

export default async function NewCoachPlanPage() {
  // Role guard — athletes must not reach this page
  // Adapt to whichever role-check pattern the codebase uses (Clerk metadata or DB users.role)
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as Record<string, unknown> | null)?.role
  if (role !== 'coach') {
    redirect('/dashboard')   // or wherever non-coaches should land
  }

  const groupsResult = await getCoachAthleteGroupsAction()
  const groups = (groupsResult.isSuccess ? groupsResult.data ?? [] : [])
    .map(g => ({ id: g.id, name: g.name ?? `Group ${g.id}` }))

  return (
    <main className="min-h-screen">
      <CoachSeasonWizard coachGroups={groups} />
    </main>
  )
}
```

> **Note:** Replace `sessionClaims?.metadata?.role` with the actual role-check pattern used in the rest of the app. Search for `role === 'coach'` or `isCoach` in existing protected pages to find the exact pattern before writing this.


**Step 4: TypeScript check + commit**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
git add apps/web/app/\(protected\)/plans/
git commit -m "feat(routes): wire CoachPlanPageWithAI and CoachSeasonWizard into plan routes"
```

---

## Phase 10: Final Verification

### Task 22: Full build + end-to-end smoke test

**Step 1: Full TypeScript + build**

```bash
npm run build:web 2>&1 | tail -30
```

Expected: Zero TypeScript errors, clean build.

**Step 2: Run test suite**

```bash
npm run test 2>&1 | tail -20
```

Expected: All tests pass.

**Step 3: Coach flow smoke test**

```bash
npm run dev:web &
agent-browser open http://localhost:3000
# Sign in as coach user

# Test: New season wizard
agent-browser open http://localhost:3000/plans/new
# Verify 3-step wizard renders
# Fill step 1 (any text + dates)
# Verify step 2 shows phase structure
# Verify step 3 shows groups (or empty state)
agent-browser screenshot /tmp/wizard-check.png

# Test: Coach plan workspace
# Navigate to an existing coach plan
# Verify SeasonContextPanel shows (collapsed)
# Verify GroupTabsBar shows if groups are configured
# Verify "Generate Week" button exists in microcycle view
# Click Generate Week → verify GenerateMicrocycleSheet opens
# Verify context loads (even if empty)
# Click Generate → verify AI streams a response
agent-browser screenshot /tmp/generate-week-check.png
```

**Step 4: Athlete regression smoke test**

```bash
# Sign in as athlete user
agent-browser open http://localhost:3000/program
# Verify assigned plan still shows
agent-browser open http://localhost:3000/workout
# Verify session cards appear
agent-browser screenshot /tmp/athlete-regression-final.png
```

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: coach AI planning MVP — schema, wizard, workspace, Generate Week AI"
```

---

## Appendix: File Reference

| Task | Key Files |
|------|-----------|
| T1 | `supabase/migrations/20260305100000_move_athlete_group_id_to_microcycles.sql` |
| T1 | `apps/web/types/database.ts` (auto-generated) |
| T2 | `apps/web/types/training.ts` |
| T3 | `apps/web/actions/plans/plan-actions.ts` |
| T4 | `apps/web/actions/plans/session-plan-actions.ts`, `session-planner-actions.ts` |
| T5 | `apps/web/actions/athletes/`, `dashboard/`, `profile/`, `workout/`, `sessions/` |
| T6 | `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` |
| T6 | `apps/web/components/features/plans/workspace/components/EditMicrocycleDialog.tsx` |
| T9 | `apps/web/actions/plans/plan-actions.ts` (savePlanningContext additions) |
| T10 | `apps/web/actions/plans/generate-microcycle-action.ts` |
| T11 | `apps/web/actions/plans/weekly-insights-action.ts` |
| T12 | `apps/web/app/api/ai/planning-context-chat/route.ts` |
| T13 | `apps/web/app/api/ai/plan-generator/route.ts`, `plan-assistant/route.ts` |
| T14 | `apps/web/components/features/plans/coach-wizard/` |
| T15 | `apps/web/components/features/plans/coach-workspace/SeasonContextPanel.tsx` |
| T16 | `apps/web/components/features/plans/coach-workspace/GroupTabsBar.tsx` |
| T17 | `apps/web/components/features/plans/coach-workspace/GenerateMicrocycleSheet.tsx` |
| T18 | `apps/web/components/features/plans/coach-workspace/CoachPlanPageWithAI.tsx` |
| T19 | `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` |
| T20 | `apps/web/actions/athletes/athlete-actions.ts`, athlete form components |
| T21 | `apps/web/app/(protected)/plans/[id]/page.tsx`, `plans/new/page.tsx` |

## Out of Scope (V2)

- Auto-apply AI sessions to microcycle (GenerateMicrocycleSheet currently review-only)
- Event group (SS/MS/LS) filter UI within sessions (schema ready, UI deferred)
- Full group names in CoachPlanPageWithAI (currently shows "Group {id}" — needs DB fetch)
- Multi-coach clubs (Pattern C) — permissions layer
- Push notifications for "Generate Week" reminder
- Non-week microcycle UI
