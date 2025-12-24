# Parallel Work Guide: Database Schema Optimization

**Created**: 2025-12-24
**Feature**: 003-database-schema-optimization
**Purpose**: Coordinate parallel implementation between two AI agents

---

## Work Assignment

### AGENT A: Supabase MCP (Database Changes)
**Focus**: Phases 2-6 (All database schema changes)
**Tools**: Supabase MCP tools (`mcp__supabase__*`)

### AGENT B: Code Updates (This conversation)
**Focus**: Phases 7-11 (TypeScript types, actions, components, utilities)
**Tools**: Read, Edit, Write, Bash

---

## AGENT A: Supabase MCP Instructions

### Your Tasks (Execute in Order)

#### Phase 2: Table Renames (T001-T011)

Execute these SQL statements via `mcp__supabase__execute_sql`:

```sql
-- T001-T005: Table Renames
ALTER TABLE exercise_preset_groups RENAME TO session_plans;
ALTER TABLE exercise_presets RENAME TO session_plan_exercises;
ALTER TABLE exercise_preset_details RENAME TO session_plan_sets;
ALTER TABLE exercise_training_sessions RENAME TO workout_logs;
ALTER TABLE exercise_training_details RENAME TO workout_log_sets;

-- T006-T008: FK Column Renames
ALTER TABLE session_plan_exercises RENAME COLUMN exercise_preset_group_id TO session_plan_id;
ALTER TABLE session_plan_sets RENAME COLUMN exercise_preset_id TO session_plan_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN exercise_training_session_id TO workout_log_id;
```

Verify with:
```sql
-- T009-T010: Verify renames
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('session_plans', 'session_plan_exercises', 'session_plan_sets', 'workout_logs', 'workout_log_sets');

SELECT column_name FROM information_schema.columns
WHERE table_name = 'session_plan_exercises' AND column_name = 'session_plan_id';
```

#### Phase 3: Schema Clarity - VARCHAR to TEXT (T012-T016)

```sql
-- T012-T016: VARCHAR to TEXT conversion
ALTER TABLE exercises ALTER COLUMN name TYPE text;
ALTER TABLE exercises ALTER COLUMN description TYPE text;
ALTER TABLE workout_logs ALTER COLUMN notes TYPE text;
ALTER TABLE tags ALTER COLUMN name TYPE text;
ALTER TABLE units ALTER COLUMN name TYPE text;
ALTER TABLE units ALTER COLUMN abbreviation TYPE text;

-- Find any remaining VARCHAR columns:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type = 'character varying';
```

#### Phase 3: Timestamps (T017-T030)

```sql
-- T017-T020: Add timestamps to P1 tables
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE session_plan_exercises
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- T021-T024: Add updated_at to P2 tables
ALTER TABLE athlete_groups
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE session_plan_sets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE workout_log_sets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE macrocycles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE mesocycles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE microcycles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- T025: Add DEFAULT now() to nullable created_at columns
ALTER TABLE athlete_cycles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE session_plan_sets ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE workout_log_sets ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE workout_logs ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE macrocycles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE mesocycles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE microcycles ALTER COLUMN created_at SET DEFAULT now();

-- T026: Fix timestamp to timestamptz
ALTER TABLE workout_logs
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- T027: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- T028-T030: Apply triggers
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_plan_exercises_updated_at BEFORE UPDATE ON session_plan_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_groups_updated_at BEFORE UPDATE ON athlete_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_plan_sets_updated_at BEFORE UPDATE ON session_plan_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_log_sets_updated_at BEFORE UPDATE ON workout_log_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_macrocycles_updated_at BEFORE UPDATE ON macrocycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mesocycles_updated_at BEFORE UPDATE ON mesocycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microcycles_updated_at BEFORE UPDATE ON microcycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Phase 4: CASCADE Constraints (T031-T037)

```sql
-- T031: workout_log_sets.workout_log_id CASCADE
ALTER TABLE workout_log_sets
  DROP CONSTRAINT IF EXISTS exercise_training_details_exercise_training_session_id_fkey,
  ADD CONSTRAINT workout_log_sets_workout_log_id_fkey
    FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE;

-- T032: workout_logs.athlete_id CASCADE
ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS exercise_training_sessions_athlete_id_fkey,
  ADD CONSTRAINT workout_logs_athlete_id_fkey
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

-- T033: macrocycles.user_id CASCADE
ALTER TABLE macrocycles
  DROP CONSTRAINT IF EXISTS macrocycles_user_id_fkey,
  ADD CONSTRAINT macrocycles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- T034-T035: athlete_cycles FKs CASCADE
ALTER TABLE athlete_cycles
  DROP CONSTRAINT IF EXISTS athlete_cycles_athlete_id_fkey,
  ADD CONSTRAINT athlete_cycles_athlete_id_fkey
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE athlete_cycles
  DROP CONSTRAINT IF EXISTS athlete_cycles_macrocycle_id_fkey,
  ADD CONSTRAINT athlete_cycles_macrocycle_id_fkey
    FOREIGN KEY (macrocycle_id) REFERENCES macrocycles(id) ON DELETE CASCADE;
```

Verify CASCADE with:
```sql
-- T036-T037: Verify CASCADE behavior
-- Create test data and delete parent to verify children deleted
```

#### Phase 5: RLS Security (T038-T045)

```sql
-- T038-T039: exercises policy
DROP POLICY IF EXISTS "Public read access" ON exercises;
CREATE POLICY "Global or owned exercises" ON exercises
  FOR SELECT USING (
    visibility = 'global'
    OR owner_user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- T040-T041: macrocycles policy with coach access
DROP POLICY IF EXISTS "Users can manage own macrocycles" ON macrocycles;
CREATE POLICY "Users and coaches view macrocycles" ON macrocycles
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
    OR
    athlete_group_id IN (
      SELECT ag.id FROM athlete_groups ag
      JOIN coaches c ON ag.coach_id = c.id
      WHERE c.user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
    )
  );

-- T042: Verify ai_memories RLS is disabled (should already be disabled per CLAUDE.md)
-- Check in Supabase Dashboard > Authentication > Policies > ai_memories

-- T042.1: Verify workout_logs policy for coach access
-- Check existing policies - should allow coaches to view their athletes' logs
```

#### Phase 6: Analytics Verification (T046-T048)

```sql
-- T046-T048: Verify analytics columns exist and work
SELECT column_name FROM information_schema.columns
WHERE table_name = 'session_plan_sets'
AND column_name IN ('height', 'effort', 'tempo', 'resistance', 'velocity', 'power');

SELECT column_name FROM information_schema.columns
WHERE table_name = 'workout_log_sets'
AND column_name IN ('height', 'effort', 'tempo', 'resistance', 'velocity', 'power');

-- Test aggregation (should work without JSONB extraction)
SELECT AVG(height) FROM workout_log_sets WHERE height IS NOT NULL;
```

### Verification Checklist

After completing all SQL, verify:
- [ ] 5 tables renamed correctly
- [ ] 3 FK columns renamed correctly
- [ ] All VARCHAR columns converted to TEXT
- [ ] Timestamps added to all specified tables
- [ ] Triggers created for updated_at
- [ ] CASCADE constraints added to 5 FKs
- [ ] RLS policies updated for exercises and macrocycles
- [ ] ai_memories RLS is disabled

### Signal Completion

When done, report back with:
1. List of all SQL executed successfully
2. Any errors encountered
3. Verification query results

---

## AGENT B: Code Updates Instructions

**Wait until Agent A signals database migration complete before starting.**

### Your Tasks (Phases 7-11)

#### Phase 7: TypeScript Types (T049-T057)

1. Regenerate types:
```bash
cd apps/web && npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > types/database.ts
```

2. Add type aliases to end of `types/database.ts`
3. Update `types/training.ts` extended types
4. Update `types/index.ts` re-exports
5. Run `npm run type-check`

#### Phase 8: Server Actions (T058-T066)

Update these files (use search & replace from quickstart.md):
- `actions/plans/plan-actions.ts`
- `actions/plans/session-plan-actions.ts`
- `actions/plans/session-planner-actions.ts`
- `actions/plans/plan-assignment-actions.ts`
- `actions/sessions/training-session-actions.ts`
- `actions/workout/workout-session-actions.ts`
- `actions/library/exercise-actions.ts`
- `actions/dashboard/dashboard-actions.ts`

Run `npm run type-check` after each file.

#### Phase 9: Components (T067-T079)

Update all component files listed in tasks.md Phase 9.

#### Phase 10: Utilities (T080-T083)

Update:
- `lib/changeset/entity-mappings.ts`
- `lib/changeset/tool-implementations/read-impl.ts`
- `lib/validation/training-schemas.ts`

#### Phase 11: Polish (T084-T099)

- Full verification: `npm run type-check && npm run lint && npm run build`
- Manual CRUD testing
- Documentation updates

---

## Coordination Protocol

1. **Agent A starts first** - Database changes must complete before code updates
2. **Agent A signals completion** - Report success/failure of all Phase 2-6 tasks
3. **Agent B waits for signal** - Only start Phase 7 after database confirmed ready
4. **Both update tasks.md** - Mark tasks as complete with `[x]`

---

## Reference Documents

- [spec.md](./spec.md) - Full specification
- [plan.md](./plan.md) - Implementation phases
- [tasks.md](./tasks.md) - Task checklist
- [quickstart.md](./quickstart.md) - SQL and search/replace patterns
- [data-model.md](./data-model.md) - Entity definitions
- [research.md](./research.md) - Decision rationale

---

## Supabase Project Details

- **Project ID**: `pcteaouusthwbgzczoae`
- **Region**: eu-west-2
- **PostgreSQL**: 15.8.1
