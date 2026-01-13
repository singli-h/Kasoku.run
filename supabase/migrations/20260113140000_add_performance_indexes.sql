-- Add performance indexes for workout and plan queries
-- These indexes optimize common query patterns identified in performance analysis

-- ============================================================================
-- WORKOUT LOGS INDEXES
-- ============================================================================

-- Index for athlete session queries (getTodayAndOngoingSessionsAction, getPastSessionsAction)
-- Covers: .eq('athlete_id', ...).or('session_status.eq.ongoing,session_status.eq.assigned')
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_status
ON workout_logs(athlete_id, session_status);

-- Index for date-based sorting (getPastSessionsAction with date filtering)
-- Covers: .eq('athlete_id', ...).order('date_time', ...)
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_datetime
ON workout_logs(athlete_id, date_time DESC);

-- ============================================================================
-- WORKOUT LOG EXERCISES INDEXES
-- ============================================================================

-- Index for fetching exercises by workout log (nested query optimization)
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_workout_log_id
ON workout_log_exercises(workout_log_id);

-- ============================================================================
-- WORKOUT LOG SETS INDEXES
-- ============================================================================

-- Index for fetching sets by exercise (nested query optimization)
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_exercise_id
ON workout_log_sets(workout_log_exercise_id);

-- ============================================================================
-- SESSION PLANS INDEXES
-- ============================================================================

-- Index for microcycle session queries (getSessionPlansByMicrocycleAction)
-- Covers: .eq('microcycle_id', ...).eq('deleted', false)
CREATE INDEX IF NOT EXISTS idx_session_plans_microcycle_deleted
ON session_plans(microcycle_id, deleted) WHERE deleted = false;

-- Index for user session queries with week/day sorting
CREATE INDEX IF NOT EXISTS idx_session_plans_user_week_day
ON session_plans(user_id, deleted, week, day) WHERE deleted = false;

-- ============================================================================
-- SESSION PLAN EXERCISES INDEXES
-- ============================================================================

-- Index for fetching exercises by session plan with ordering
CREATE INDEX IF NOT EXISTS idx_session_plan_exercises_plan_order
ON session_plan_exercises(session_plan_id, exercise_order);

-- ============================================================================
-- SESSION PLAN SETS INDEXES
-- ============================================================================

-- Index for fetching sets by session plan exercise with ordering
CREATE INDEX IF NOT EXISTS idx_session_plan_sets_exercise_index
ON session_plan_sets(session_plan_exercise_id, set_index);

-- ============================================================================
-- MACROCYCLES INDEXES
-- ============================================================================

-- Index for user macrocycle queries with date sorting (getMacrocyclesAction)
CREATE INDEX IF NOT EXISTS idx_macrocycles_user_date
ON macrocycles(user_id, start_date DESC);

-- ============================================================================
-- MESOCYCLES INDEXES
-- ============================================================================

-- Index for macrocycle mesocycle queries
CREATE INDEX IF NOT EXISTS idx_mesocycles_macrocycle
ON mesocycles(macrocycle_id, user_id);

-- ============================================================================
-- MICROCYCLES INDEXES
-- ============================================================================

-- Index for mesocycle microcycle queries
CREATE INDEX IF NOT EXISTS idx_microcycles_mesocycle
ON microcycles(mesocycle_id, user_id);

-- ============================================================================
-- RACES INDEXES
-- ============================================================================

-- Index for macrocycle race queries (getRacesByMacrocycleAction)
CREATE INDEX IF NOT EXISTS idx_races_macrocycle_user_date
ON races(macrocycle_id, user_id, date);
