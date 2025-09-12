/*
<ai_context>
Central export file for all training-related server actions.
Organizes exports by functional area for clean imports throughout the app.
</ai_context>
*/

// Re-export all training actions for convenient imports
export {
  // Session plan actions
  saveSessionPlanAction,
  getSessionPlansByMicrocycleAction,
  updateSessionPlanAction,
  deleteSessionPlanAction,
  copySessionPlanAction,
  getTrainingPlansAction,
  
  // Template actions
  saveAsTemplateAction,
  getTemplatesAction,
  createPlanFromTemplateAction,
  deleteTemplateAction
} from './session-plan-actions'

// Re-export specific action groups for convenience
export {
  // Macrocycle actions
  createMacrocycleAction,
  getMacrocyclesAction,
  getMacrocycleByIdAction,
  updateMacrocycleAction,
  deleteMacrocycleAction,
  
  // Mesocycle actions
  createMesocycleAction,
  getMesocyclesByMacrocycleAction,
  getMesocycleByIdAction,
  updateMesocycleAction,
  deleteMesocycleAction,
  
  // Microcycle actions
  createMicrocycleAction,
  getMicrocyclesByMesocycleAction,
  getMicrocycleByIdAction,
  updateMicrocycleAction,
  deleteMicrocycleAction,
  
  // Periodization templates
  copyMacrocycleAsTemplateAction
} from './training-plan-actions'

// Re-export exercise actions
export {
  // Exercise library actions
  getExercisesAction,
  getExerciseByIdAction,
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
  
  // Exercise type actions
  getExerciseTypesAction,
  
  // Tag actions
  getTagsAction,
  
  // Unit actions
  getUnitsAction,
  
  // Preset group actions
  createExercisePresetGroupAction,
  getExercisePresetGroupsByMicrocycleAction,
  updateExercisePresetGroupAction,
  deleteExercisePresetGroupAction,
  
  // Session copying with adaptations
  copySessionWithAdaptationsAction
} from './exercise-actions'

// Re-export training session actions
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

// Re-export athlete actions
export {
  getCurrentAthleteProfileAction,
  createOrUpdateAthleteProfileAction,
  getAthletesByGroupAction,
  getAthleteByIdAction,
  updateAthleteProfileAction,
  getAthleteProfileAction,
  getCoachAthleteGroupsAction,
  createAthleteGroupAction,
  updateAthleteGroupAction,
  assignAthleteToGroupAction,
  removeAthleteFromGroupAction,
  deleteAthleteGroupAction
} from './athlete-actions'

// Re-export coach actions
export {
  getCurrentCoachProfileAction
} from './coach-actions'

// Re-export group session actions
export {
  createLiveSessionAction,
  logGroupPerformanceAction
} from './group-session-actions' 