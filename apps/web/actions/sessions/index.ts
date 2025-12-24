/**
 * Training session execution actions
 *
 * Architecture: workout_logs table with coach/athlete views
 * - Coaches assign sessions via session_plans
 * - Athletes execute and complete sessions
 * - Auto-PB detection on completion
 *
 * Note: Old "live session" actions archived on 2025-10-27
 * See ./archived/ for reference implementations
 */

// Training session actions (current architecture)
export {
  startTrainingSessionAction,
  getTrainingSessionsAction,
  getTrainingSessionByIdAction,
  updateTrainingSessionAction,
  completeTrainingSessionAction,
  addExercisePerformanceAction,
  updateExercisePerformanceAction,
  getPerformanceMetricsAction,
  getExerciseProgressAction,
  // Phase 2: Coach group session actions
  getGroupSessionsAction,
  getGroupSessionDataAction,
  updateSessionDetailAction
} from './training-session-actions'
