-- Migration: Add ON DELETE CASCADE to user-related foreign keys
-- Purpose: Enable manual deletion of users with automatic cleanup of all related data
--
-- Cascade Chain:
-- users → athletes → (personal_bests, workout_logs, cycles, histories, memories)
-- users → coaches → (groups, knowledge_base, memories)
-- users → macrocycles → mesocycles → microcycles
-- users → session_plans → exercises → sets
-- users → races, exercises

BEGIN;

-- ============================================================================
-- LEVEL 1: Direct references to users table
-- ============================================================================

-- athletes.user_id → users.id
ALTER TABLE public.athletes
  DROP CONSTRAINT IF EXISTS athletes_user_id_fkey;
ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- coaches.user_id → users.id
ALTER TABLE public.coaches
  DROP CONSTRAINT IF EXISTS coaches_user_id_fkey;
ALTER TABLE public.coaches
  ADD CONSTRAINT coaches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- macrocycles.user_id → users.id
ALTER TABLE public.macrocycles
  DROP CONSTRAINT IF EXISTS macrocycles_user_id_fkey;
ALTER TABLE public.macrocycles
  ADD CONSTRAINT macrocycles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- mesocycles.user_id → users.id
ALTER TABLE public.mesocycles
  DROP CONSTRAINT IF EXISTS mesocycles_user_id_fkey;
ALTER TABLE public.mesocycles
  ADD CONSTRAINT mesocycles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- microcycles.user_id → users.id
ALTER TABLE public.microcycles
  DROP CONSTRAINT IF EXISTS microcycles_user_id_fkey;
ALTER TABLE public.microcycles
  ADD CONSTRAINT microcycles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- session_plans.user_id → users.id
ALTER TABLE public.session_plans
  DROP CONSTRAINT IF EXISTS session_plans_user_id_fkey;
ALTER TABLE public.session_plans
  ADD CONSTRAINT session_plans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- races.user_id → users.id
ALTER TABLE public.races
  DROP CONSTRAINT IF EXISTS races_user_id_fkey;
ALTER TABLE public.races
  ADD CONSTRAINT races_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- exercises.owner_user_id → users.id (SET NULL for shared exercises)
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_owner_user_id_fkey;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 2: References to athletes table
-- ============================================================================

-- athlete_personal_bests.athlete_id → athletes.id
ALTER TABLE public.athlete_personal_bests
  DROP CONSTRAINT IF EXISTS athlete_personal_bests_athlete_id_fkey;
ALTER TABLE public.athlete_personal_bests
  ADD CONSTRAINT athlete_personal_bests_athlete_id_fkey
  FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;

-- workout_logs.athlete_id → athletes.id
ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_athlete_id_fkey;
ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_athlete_id_fkey
  FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;

-- athlete_cycles.athlete_id → athletes.id
ALTER TABLE public.athlete_cycles
  DROP CONSTRAINT IF EXISTS athlete_cycles_athlete_id_fkey;
ALTER TABLE public.athlete_cycles
  ADD CONSTRAINT athlete_cycles_athlete_id_fkey
  FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;

-- athlete_group_histories.athlete_id → athletes.id
ALTER TABLE public.athlete_group_histories
  DROP CONSTRAINT IF EXISTS fk_agh_athlete_id;
ALTER TABLE public.athlete_group_histories
  ADD CONSTRAINT fk_agh_athlete_id
  FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;

-- ai_memories.athlete_id → athletes.id
ALTER TABLE public.ai_memories
  DROP CONSTRAINT IF EXISTS fk_memories_athlete;
ALTER TABLE public.ai_memories
  ADD CONSTRAINT fk_memories_athlete
  FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;

-- ============================================================================
-- LEVEL 2: References to coaches table
-- ============================================================================

-- athlete_groups.coach_id → coaches.id
ALTER TABLE public.athlete_groups
  DROP CONSTRAINT IF EXISTS fk_ag_coach_id;
ALTER TABLE public.athlete_groups
  ADD CONSTRAINT fk_ag_coach_id
  FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

-- knowledge_base_categories.coach_id → coaches.id
ALTER TABLE public.knowledge_base_categories
  DROP CONSTRAINT IF EXISTS fk_kb_categories_coach_id;
ALTER TABLE public.knowledge_base_categories
  ADD CONSTRAINT fk_kb_categories_coach_id
  FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

-- knowledge_base_articles.coach_id → coaches.id
ALTER TABLE public.knowledge_base_articles
  DROP CONSTRAINT IF EXISTS fk_kb_articles_coach_id;
ALTER TABLE public.knowledge_base_articles
  ADD CONSTRAINT fk_kb_articles_coach_id
  FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

-- ai_memories.coach_id → coaches.id
ALTER TABLE public.ai_memories
  DROP CONSTRAINT IF EXISTS fk_memories_coach;
ALTER TABLE public.ai_memories
  ADD CONSTRAINT fk_memories_coach
  FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

-- ============================================================================
-- LEVEL 2: References to athlete_groups table
-- ============================================================================

-- athlete_group_histories.group_id → athlete_groups.id
ALTER TABLE public.athlete_group_histories
  DROP CONSTRAINT IF EXISTS fk_agh_group_id;
ALTER TABLE public.athlete_group_histories
  ADD CONSTRAINT fk_agh_group_id
  FOREIGN KEY (group_id) REFERENCES public.athlete_groups(id) ON DELETE CASCADE;

-- ai_memories.group_id → athlete_groups.id
ALTER TABLE public.ai_memories
  DROP CONSTRAINT IF EXISTS fk_memories_group;
ALTER TABLE public.ai_memories
  ADD CONSTRAINT fk_memories_group
  FOREIGN KEY (group_id) REFERENCES public.athlete_groups(id) ON DELETE CASCADE;

-- athletes.athlete_group_id → athlete_groups.id (SET NULL - don't delete athlete)
ALTER TABLE public.athletes
  DROP CONSTRAINT IF EXISTS fk_athletes_group;
ALTER TABLE public.athletes
  ADD CONSTRAINT fk_athletes_group
  FOREIGN KEY (athlete_group_id) REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- macrocycles.athlete_group_id → athlete_groups.id (SET NULL)
ALTER TABLE public.macrocycles
  DROP CONSTRAINT IF EXISTS fk_macrocycles_group;
ALTER TABLE public.macrocycles
  ADD CONSTRAINT fk_macrocycles_group
  FOREIGN KEY (athlete_group_id) REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- session_plans.athlete_group_id → athlete_groups.id (SET NULL)
ALTER TABLE public.session_plans
  DROP CONSTRAINT IF EXISTS fk_session_plans_athlete_group;
ALTER TABLE public.session_plans
  ADD CONSTRAINT fk_session_plans_athlete_group
  FOREIGN KEY (athlete_group_id) REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- workout_logs.athlete_group_id → athlete_groups.id (SET NULL)
ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS fk_ets_group;
ALTER TABLE public.workout_logs
  ADD CONSTRAINT fk_ets_group
  FOREIGN KEY (athlete_group_id) REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 2: References to macrocycles table
-- ============================================================================

-- mesocycles.macrocycle_id → macrocycles.id
ALTER TABLE public.mesocycles
  DROP CONSTRAINT IF EXISTS fk_mesocycles_macrocycle;
ALTER TABLE public.mesocycles
  ADD CONSTRAINT fk_mesocycles_macrocycle
  FOREIGN KEY (macrocycle_id) REFERENCES public.macrocycles(id) ON DELETE CASCADE;

-- athlete_cycles.macrocycle_id → macrocycles.id
ALTER TABLE public.athlete_cycles
  DROP CONSTRAINT IF EXISTS athlete_cycles_macrocycle_id_fkey;
ALTER TABLE public.athlete_cycles
  ADD CONSTRAINT athlete_cycles_macrocycle_id_fkey
  FOREIGN KEY (macrocycle_id) REFERENCES public.macrocycles(id) ON DELETE CASCADE;

-- races.macrocycle_id → macrocycles.id (SET NULL - race can exist without macrocycle)
ALTER TABLE public.races
  DROP CONSTRAINT IF EXISTS races_macrocycle_id_fkey;
ALTER TABLE public.races
  ADD CONSTRAINT races_macrocycle_id_fkey
  FOREIGN KEY (macrocycle_id) REFERENCES public.macrocycles(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 3: References to mesocycles table
-- ============================================================================

-- microcycles.mesocycle_id → mesocycles.id
ALTER TABLE public.microcycles
  DROP CONSTRAINT IF EXISTS fk_microcycles_mesocycle;
ALTER TABLE public.microcycles
  ADD CONSTRAINT fk_microcycles_mesocycle
  FOREIGN KEY (mesocycle_id) REFERENCES public.mesocycles(id) ON DELETE CASCADE;

-- athlete_cycles.mesocycle_id → mesocycles.id
ALTER TABLE public.athlete_cycles
  DROP CONSTRAINT IF EXISTS fk_athlete_cycles_mesocycle_id;
ALTER TABLE public.athlete_cycles
  ADD CONSTRAINT fk_athlete_cycles_mesocycle_id
  FOREIGN KEY (mesocycle_id) REFERENCES public.mesocycles(id) ON DELETE CASCADE;

-- ============================================================================
-- LEVEL 3: References to microcycles table
-- ============================================================================

-- session_plans.microcycle_id → microcycles.id (SET NULL)
ALTER TABLE public.session_plans
  DROP CONSTRAINT IF EXISTS fk_session_plans_microcycle;
ALTER TABLE public.session_plans
  ADD CONSTRAINT fk_session_plans_microcycle
  FOREIGN KEY (microcycle_id) REFERENCES public.microcycles(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 2: References to session_plans table
-- ============================================================================

-- session_plan_exercises.session_plan_id → session_plans.id
ALTER TABLE public.session_plan_exercises
  DROP CONSTRAINT IF EXISTS fk_session_plan_exercises_session_plan;
ALTER TABLE public.session_plan_exercises
  ADD CONSTRAINT fk_session_plan_exercises_session_plan
  FOREIGN KEY (session_plan_id) REFERENCES public.session_plans(id) ON DELETE CASCADE;

-- workout_logs.session_plan_id → session_plans.id (SET NULL - log can exist without plan)
ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS fk_workout_logs_session_plan;
ALTER TABLE public.workout_logs
  ADD CONSTRAINT fk_workout_logs_session_plan
  FOREIGN KEY (session_plan_id) REFERENCES public.session_plans(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 3: References to session_plan_exercises table
-- ============================================================================

-- session_plan_sets.session_plan_exercise_id → session_plan_exercises.id
ALTER TABLE public.session_plan_sets
  DROP CONSTRAINT IF EXISTS fk_session_plan_sets_session_plan_exercise;
ALTER TABLE public.session_plan_sets
  ADD CONSTRAINT fk_session_plan_sets_session_plan_exercise
  FOREIGN KEY (session_plan_exercise_id) REFERENCES public.session_plan_exercises(id) ON DELETE CASCADE;

-- workout_log_exercises.session_plan_exercise_id → session_plan_exercises.id (SET NULL)
ALTER TABLE public.workout_log_exercises
  DROP CONSTRAINT IF EXISTS workout_log_exercises_session_plan_exercise_id_fkey;
ALTER TABLE public.workout_log_exercises
  ADD CONSTRAINT workout_log_exercises_session_plan_exercise_id_fkey
  FOREIGN KEY (session_plan_exercise_id) REFERENCES public.session_plan_exercises(id) ON DELETE SET NULL;

-- workout_log_sets.session_plan_exercise_id → session_plan_exercises.id (SET NULL)
ALTER TABLE public.workout_log_sets
  DROP CONSTRAINT IF EXISTS fk_workout_log_sets_session_plan_exercise;
ALTER TABLE public.workout_log_sets
  ADD CONSTRAINT fk_workout_log_sets_session_plan_exercise
  FOREIGN KEY (session_plan_exercise_id) REFERENCES public.session_plan_exercises(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 2: References to workout_logs table
-- ============================================================================

-- workout_log_exercises.workout_log_id → workout_logs.id
ALTER TABLE public.workout_log_exercises
  DROP CONSTRAINT IF EXISTS workout_log_exercises_workout_log_id_fkey;
ALTER TABLE public.workout_log_exercises
  ADD CONSTRAINT workout_log_exercises_workout_log_id_fkey
  FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;

-- workout_log_sets.workout_log_id → workout_logs.id
ALTER TABLE public.workout_log_sets
  DROP CONSTRAINT IF EXISTS workout_log_sets_workout_log_id_fkey;
ALTER TABLE public.workout_log_sets
  ADD CONSTRAINT workout_log_sets_workout_log_id_fkey
  FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;

-- athlete_personal_bests.session_id → workout_logs.id (SET NULL)
ALTER TABLE public.athlete_personal_bests
  DROP CONSTRAINT IF EXISTS athlete_personal_bests_session_id_fkey;
ALTER TABLE public.athlete_personal_bests
  ADD CONSTRAINT athlete_personal_bests_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.workout_logs(id) ON DELETE SET NULL;

-- ============================================================================
-- LEVEL 3: References to workout_log_exercises table
-- ============================================================================

-- workout_log_sets.workout_log_exercise_id → workout_log_exercises.id
ALTER TABLE public.workout_log_sets
  DROP CONSTRAINT IF EXISTS workout_log_sets_workout_log_exercise_id_fkey;
ALTER TABLE public.workout_log_sets
  ADD CONSTRAINT workout_log_sets_workout_log_exercise_id_fkey
  FOREIGN KEY (workout_log_exercise_id) REFERENCES public.workout_log_exercises(id) ON DELETE CASCADE;

-- ============================================================================
-- LEVEL 2: References to knowledge_base_categories table
-- ============================================================================

-- knowledge_base_articles.category_id → knowledge_base_categories.id (SET NULL)
ALTER TABLE public.knowledge_base_articles
  DROP CONSTRAINT IF EXISTS fk_kb_articles_category_id;
ALTER TABLE public.knowledge_base_articles
  ADD CONSTRAINT fk_kb_articles_category_id
  FOREIGN KEY (category_id) REFERENCES public.knowledge_base_categories(id) ON DELETE SET NULL;

COMMIT;

-- ============================================================================
-- SUMMARY OF CASCADE BEHAVIOR
-- ============================================================================
--
-- When DELETE FROM users WHERE id = X:
--   ├── athletes (CASCADE) → deletes athlete record
--   │   ├── athlete_personal_bests (CASCADE) → deletes all PBs
--   │   ├── workout_logs (CASCADE) → deletes all logs
--   │   │   ├── workout_log_exercises (CASCADE)
--   │   │   └── workout_log_sets (CASCADE)
--   │   ├── athlete_cycles (CASCADE)
--   │   ├── athlete_group_histories (CASCADE)
--   │   └── ai_memories (CASCADE)
--   │
--   ├── coaches (CASCADE) → deletes coach record
--   │   ├── athlete_groups (CASCADE) → deletes groups
--   │   │   ├── athlete_group_histories (CASCADE)
--   │   │   ├── ai_memories (CASCADE)
--   │   │   └── athletes.athlete_group_id (SET NULL)
--   │   ├── knowledge_base_categories (CASCADE)
--   │   │   └── knowledge_base_articles.category_id (SET NULL)
--   │   ├── knowledge_base_articles (CASCADE)
--   │   └── ai_memories (CASCADE)
--   │
--   ├── macrocycles (CASCADE)
--   │   ├── mesocycles (CASCADE)
--   │   │   ├── microcycles (CASCADE)
--   │   │   └── athlete_cycles (CASCADE)
--   │   ├── athlete_cycles (CASCADE)
--   │   └── races.macrocycle_id (SET NULL)
--   │
--   ├── mesocycles (CASCADE) - direct user ownership
--   ├── microcycles (CASCADE) - direct user ownership
--   │
--   ├── session_plans (CASCADE)
--   │   ├── session_plan_exercises (CASCADE)
--   │   │   └── session_plan_sets (CASCADE)
--   │   └── workout_logs.session_plan_id (SET NULL)
--   │
--   ├── races (CASCADE)
--   │
--   └── exercises.owner_user_id (SET NULL) - keeps shared exercises
--
