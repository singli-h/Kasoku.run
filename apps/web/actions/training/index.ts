/*
<ai_context>
Central export file for all training-related server actions.
Organizes exports by functional area for clean imports throughout the app.
</ai_context>
*/

// Training Plan Actions (Macrocycles, Mesocycles, Microcycles)
export * from './training-plan-actions'

// Exercise Library and Preset Actions
export * from './exercise-actions'

// Athlete and Group Management Actions
export * from './athlete-actions'

// Training Session and Performance Tracking Actions
export * from './training-session-actions'

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

export {
  // Exercise library actions
  getExercisesAction,
  getExercisesByTagsAction,
  getExerciseByIdAction,
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
  
  // Exercise type actions
  getExerciseTypesAction,
  createExerciseTypeAction,
  
  // Tag management actions
  getTagsAction,
  createTagAction,
  addTagsToExerciseAction,
  removeTagsFromExerciseAction,
  
  // Unit management actions
  getUnitsAction,
  createUnitAction,
  
  // Import/export actions
  exportExercisesAction,
  importExercisesAction,
  
  // Exercise preset group actions
  createExercisePresetGroupAction,
  getExercisePresetGroupsByMicrocycleAction,
  getExercisePresetGroupByIdAction,
  addExerciseToPresetGroupAction,
  updateExercisePresetGroupAction,
  deleteExercisePresetGroupAction,
  
  // Exercise preset detail actions
  addExercisePresetDetailsAction,
  updateExercisePresetDetailsAction,
  removeExercisePresetDetailsAction,
  
  // Session progression and adaptation actions
  applyProgressionToPresetAction,
  copySessionWithAdaptationsAction,
  
  // Session analytics actions
  getSessionCountAnalyticsAction
} from './exercise-actions'

export {
  // Athlete profile actions
  getCurrentAthleteProfileAction,
  createOrUpdateAthleteProfileAction,
  getAthletesByGroupAction,
  getAthleteByIdAction,
  
  // Athlete group actions
  getCoachAthleteGroupsAction,
  createAthleteGroupAction,
  updateAthleteGroupAction,
  assignAthleteToGroupAction,
  removeAthleteFromGroupAction,
  deleteAthleteGroupAction
} from './athlete-actions'

export {
  // Training session actions
  startTrainingSessionAction,
  getTrainingSessionsAction,
  getTrainingSessionByIdAction,
  updateTrainingSessionAction,
  completeTrainingSessionAction,
  
  // Exercise performance actions
  addExercisePerformanceAction,
  updateExercisePerformanceAction,
  
  // Analytics actions
  getPerformanceMetricsAction,
  getExerciseProgressAction
} from './training-session-actions' 