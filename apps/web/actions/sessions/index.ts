/**
 * Training session execution actions
 */

// Sprint session actions
export {
  getCoachAthleteGroupsWithAthletesAction,
  getPredefinedSprintDistancesAction,
  createLiveSprintSessionAction,
  addSprintRoundAction,
  removeSprintRoundAction,
  logSprintPerformanceAction,
  completeSprintSessionAction,
  toggleAthletePresenceAction,
  getSprintPerformanceDataAction
} from './sprint-session-actions'

// Group session actions
export {
  getCoachAthleteGroupsForSessionAction,
  getGroupAthletesForSessionAction,
  createLiveSessionAction,
  logGroupPerformanceAction,
  finalizeGroupSessionAction,
  getExistingSessionDataAction
} from './group-session-actions'

// Training session actions
export {
  startTrainingSessionAction,
  getTrainingSessionsAction,
  getTrainingSessionByIdAction,
  updateTrainingSessionAction,
  completeTrainingSessionAction,
  addExercisePerformanceAction,
  updateExercisePerformanceAction,
  getPerformanceMetricsAction,
  getExerciseProgressAction
} from './training-session-actions'
