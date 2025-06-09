"use client"

import React, { useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExerciseSectionManager, type ExerciseSectionManagerProps } from "../components/exerciseSectionManager/exercise-section-manager"
import type { 
  PlannerSessionWithUiId, 
  ExerciseUIInstance, 
  ExerciseDefinitionBase, 
  ModeSpecificSections,
  ReorderPayload 
} from "@/types/exercise-planner"

// Define the comprehensive interface that matches what MesoWizard is passing
export interface StepTwoPlannerProps {
  // Core wizard props
  onCompleteStep: () => void;
  onGoBack: () => void;
  
  // Form data and state
  initialFormData: {
    name: string;
    description: string;
    weeks: number;
    startDate: string;
    goal: "strength" | "hypertrophy" | "endurance" | "power" | "sport_specific" | "general_fitness";
    experienceLevel: "beginner" | "intermediate" | "advanced";
    sessions: PlannerSessionWithUiId[];
    sessionDays: Record<string, string | null>;
    sessionSections: Record<string, ModeSpecificSections>;
    exercises: ExerciseUIInstance[];
    exerciseOrder: Record<string, string[]>;
    progressionModel?: string | undefined;
    progressionValue?: number | string | undefined;
    planType?: "mesocycle" | "microcycle" | "macrocycle";
  };
  
  // Active session and filtering
  initialActiveSession: PlannerSessionWithUiId | null;
  initialFilteredExercises: ExerciseUIInstance[];
  initialSessionSections: Record<string, ModeSpecificSections>;
  initialExerciseOrder: Record<string, string[]>;
  _initialExerciseOrder: Record<string, string[]>;
  
  // Error handling
  initialErrors: Record<string, string>;
  
  // User context
  initialUserRole?: string | undefined;
  _initialUserRole?: string | undefined;
  initialAthleteProfile?: any;
  _initialAthleteProfile?: any;
  initialFeedbackText: string;
  _initialFeedbackText: string;
  
  // Loading states
  initialLoadingExercises: boolean;
  _initialLoadingExercises: boolean;
  initialProfileLoading: boolean;
  _initialProfileLoading: boolean;
  
  // Session management handlers
  setActiveSessionId: (_sessionId: string | null) => void;
  handleSessionInputChange: (_sessionId: string, _updates: Partial<PlannerSessionWithUiId>) => void;
  _handleSessionInputChange: (_sessionId: string, _updates: Partial<PlannerSessionWithUiId>) => void;
  handleAddSession: (_sessionType: "individual" | "group", _day?: string) => void;
  
  // Exercise handlers from sessionPlannerState
  onRemoveExercise: (_exerciseUiId: string) => void;
  onExerciseDetailChange: (_exerciseUiId: string, _setUiId: string, _changes: any) => void;
  handleAddSet: (_exerciseUiId: string) => void;
  handleRemoveSet: (_exerciseUiId: string, _setUiId: string) => void;
  handleExerciseFieldChange: (_exerciseUiId: string, _field: string, _value: any) => void;
  handleReplaceExerciseDefinition: (_exerciseUiId: string, _newExerciseDefinitionId: string) => void;
  
  // Section handlers from sessionPlannerState
  handleAddSection: (_sectionType: string) => void;
  handleDeleteSection: (_sectionUiId: string) => void;
  
  // Superset handlers from sessionPlannerState
  handleCreateSuperset: (_sectionUiId: string, _exerciseUiIds: string[]) => void;
  handleDissolveSuperset: (_supersetUiId: string) => void;
  
  // Progression handlers
  onProgressionModelChange: (_value: string) => void;
  _onProgressionModelChange: (_value: string) => void;
  onProgressionValueChange: (_value: number | string) => void;
  _onProgressionValueChange: (_value: number | string) => void;
  
  // Session mode change handler
  handleSessionModeChange: (_sessionId: string, _newMode: "individual" | "group") => void;
  
  // Placeholder/incomplete handlers that need implementation
  getOrderedExercises: (_sectionId: string) => ExerciseUIInstance[];
  _getOrderedExercises: (_sectionId: string) => ExerciseUIInstance[];
  onAddExercise: (_exerciseDef: ExerciseDefinitionBase, _sectionId: string, _supersetId?: string) => void;
  onExerciseReorder: (_sessionId: string, _sectionId: string, _newOrder: string[]) => void;
  _onExerciseReorder: (_sessionId: string, _sectionId: string, _newOrder: string[]) => void;
}

/**
 * Step Two: Session & Exercise Planning
 *
 * This step handles the complex exercise and section management for training sessions.
 * It provides an interface for users to configure their workout sessions by:
 * - Managing training sessions (individual vs group)
 * - Adding and organizing exercise sections
 * - Adding exercises to sections
 * - Configuring exercise details (sets, reps, weights, etc.)
 * - Creating and managing supersets
 * - Drag-and-drop reordering of sections and exercises
 */
const StepTwoPlanner: React.FC<StepTwoPlannerProps> = React.memo(({
  onCompleteStep,
  onGoBack,
  initialFormData,
  initialActiveSession,
  initialFilteredExercises,
  initialSessionSections,
  _initialExerciseOrder,
  initialErrors,
  _initialUserRole,
  _initialAthleteProfile,
  _initialFeedbackText,
  _initialLoadingExercises,
  _initialProfileLoading,
  setActiveSessionId,
  _handleSessionInputChange,
  handleAddSession,
  onRemoveExercise,
  onExerciseDetailChange,
  handleAddSet,
  handleRemoveSet,
  handleExerciseFieldChange,
  handleReplaceExerciseDefinition,
  handleAddSection,
  handleDeleteSection,
  handleCreateSuperset,
  handleDissolveSuperset,
  _onProgressionModelChange,
  _onProgressionValueChange,
  handleSessionModeChange,
  _getOrderedExercises,
  onAddExercise,
  _onExerciseReorder,
}) => {
  // Compute derived state
  const activeSession = initialActiveSession;
  const currentMode = activeSession?.type || "individual";
  const activeSections = activeSession 
    ? initialSessionSections[activeSession.ui_id]?.[currentMode] || []
    : [];

  // Available exercises (this should come from a prop or context in a real implementation)
  const availableExercises: ExerciseDefinitionBase[] = []; // TODO: Get this from props or context

  // Available section types based on current mode
  const availableSectionTypes = currentMode === "group" 
    ? ["sprint"] 
    : ["warmup", "gym", "plyometric", "isometric", "circuit", "sprint", "drill"];

  // Session navigation
  const sessionNavigation = useMemo(() => {
    return initialFormData.sessions.map(session => ({
      id: session.ui_id,
      name: session.name,
      type: session.type,
      day: Object.keys(initialFormData.sessionDays).find(day => 
        initialFormData.sessionDays[day] === session.ui_id
      ) || "Unassigned",
    }));
  }, [initialFormData.sessions, initialFormData.sessionDays]);

  // Handle session selection from navigation
  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, [setActiveSessionId]);

  // Handle reorder operations - this will need to be connected to the proper handler
  const handleReorder = useCallback((payload: ReorderPayload) => {
    console.warn('handleReorder not fully implemented:', payload);
    // This should call the appropriate handler from sessionPlannerState
  }, []);

  // Handle exercise addition with section targeting
  const handleAddExerciseToSection = useCallback((exerciseDefinition: ExerciseDefinitionBase, targetSectionUiId: string) => {
    onAddExercise(exerciseDefinition, targetSectionUiId);
  }, [onAddExercise]);

  // Session header component
  const SessionHeader = () => {
    if (!activeSession) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Session Selected</h3>
            <p className="text-gray-600 mb-4">
              Select a session from the navigation or create a new one to start planning exercises.
            </p>
            <Button 
              onClick={() => handleAddSession("individual")}
              className="mr-2"
            >
              Add Individual Session
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleAddSession("group")}
            >
              Add Group Session
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{activeSession.name}</span>
              <Badge variant={currentMode === "group" ? "default" : "secondary"}>
                {currentMode}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSessionModeChange(activeSession.ui_id, 
                  currentMode === "individual" ? "group" : "individual"
                )}
              >
                Switch to {currentMode === "individual" ? "Group" : "Individual"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {activeSession.description || `${currentMode === "group" ? "Group" : "Individual"} training session`}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {activeSections.length} section{activeSections.length !== 1 ? 's' : ''}, {initialFilteredExercises.length} exercise{initialFilteredExercises.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Session navigation component
  const SessionNavigation = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Training Sessions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Mobile: Stack sessions vertically, Desktop: Horizontal scroll */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {sessionNavigation.map((session) => (
              <Button
                key={session.id}
                variant={session.id === activeSession?.ui_id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSessionSelect(session.id)}
                className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] sm:min-h-[36px] justify-start sm:justify-center"
              >
                <span className="truncate">{session.name}</span>
                <Badge variant="secondary" className="ml-auto sm:ml-1 text-xs flex-shrink-0">
                  {session.day}
                </Badge>
              </Button>
            ))}
          </div>
          
          {/* Add Session Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddSession("individual")}
            className="w-full sm:w-auto text-xs sm:text-sm border-dashed border min-h-[44px] sm:min-h-[36px]"
          >
            + Add Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Props for ExerciseSectionManager
  const exerciseSectionManagerProps: ExerciseSectionManagerProps = {
    session: activeSession!,
    sections: activeSections,
    exercises: initialFilteredExercises,
    availableExercises,
    availableSectionTypes,
    onAddSection: handleAddSection,
    onDeleteSection: handleDeleteSection,
    onAddExercise: handleAddExerciseToSection,
    onDeleteExercise: onRemoveExercise,
    onCreateSuperset: handleCreateSuperset,
    onDissolveSuperset: handleDissolveSuperset,
    onReorder: handleReorder,
    onSetDetailChange: onExerciseDetailChange,
    onAddSet: handleAddSet,
    onRemoveSet: handleRemoveSet,
    onDeleteSuperset: (sectionId: string, supersetId: string) => {
      console.warn('onDeleteSuperset not implemented:', sectionId, supersetId);
    },
    onExerciseFieldChange: handleExerciseFieldChange,
    onReplaceExerciseDefinition: handleReplaceExerciseDefinition,
    onReorderExercises: (payload: ReorderPayload) => {
      console.warn('onReorderExercises not implemented:', payload);
    },
  };
  
  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Plan Your Sessions</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Configure your training sessions by adding sections and exercises
        </p>
      </div>

      {/* Session Navigation */}
      <SessionNavigation />

      {/* Session Header */}
      <SessionHeader />

      {/* Main Exercise Section Manager */}
      {activeSession ? (
        <div className="min-h-[400px]">
          <ExerciseSectionManager {...exerciseSectionManagerProps} />
        </div>
      ) : null}

      {/* Error Display */}
      {Object.keys(initialErrors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-red-800 mb-2">Please fix the following issues:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(initialErrors).map(([key, error]) => (
                <li key={key}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={onGoBack}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
        >
          Back
        </Button>
        <Button 
          onClick={onCompleteStep}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
        >
          Next: Review & Confirm
        </Button>
      </div>
    </div>
  );
});

// Add display name
StepTwoPlanner.displayName = 'StepTwoPlanner';

export default StepTwoPlanner
