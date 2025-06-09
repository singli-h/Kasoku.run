"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMesoWizardState, MesoWizardStateReturn } from '../../hooks/useMesoWizardState';
// import ExerciseSidebar from './ExerciseSidebar'; // Temporarily commented out
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { ExerciseDefinitionBase, ExerciseUIInstance, SectionActiveInstance, PlannerSessionWithUiId } from '@/types/exercise-planner';

export function ExercisePlannerApp() {
  const wizardState = useMesoWizardState({ 
    onFormSubmitSuccess: () => console.log("ExercisePlannerApp onComplete (dummy)"), 
    availableExercises: [] 
  });

  const { 
    formData,
    activeSessionId, 
    setActiveSessionId, 
    sessionPlannerState,
    currentMode,
    updateSessionDetails,
  } = wizardState;

  const sessions = formData.sessions;
  
  useEffect(() => {
    if (!activeSessionId && sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0]?.ui_id || null);
    }
  }, [activeSessionId, sessions, setActiveSessionId]);

  const activeSession = useMemo(() => sessions?.find(s => s.ui_id === activeSessionId), [sessions, activeSessionId]);

  const {
    activeSections,
    filteredAvailableExercisesForPicker, // Corrected to use filteredAvailableExercisesForPicker
    availableSectionTypes,
    handleAddSection,
    handleDeleteSection,
    handleAddExercise,
    handleDeleteExercise,
    handleCreateSuperset,
    handleDissolveSuperset,
    handleSetDetailChange,
    handleAddSet,
    handleRemoveSet,
    handleExerciseFieldChange,
    handleReplaceExerciseDefinition,
    getOrderedExercises,
    handleReorder, // Added general reorder handler
  } = sessionPlannerState;

  if (wizardState.isLoading) {
    return <div>Loading wizard data...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div>
        <p>No sessions available. Add a session in the main wizard to begin planning.</p>
      </div>
    );
  }

  if (!activeSession && sessions.length > 0) {
    return <div>Loading session details...</div>; 
  }

  if (!activeSession && sessions.length === 0) {
    return <div>Please add a session to start planning.</div>
  }
  
  if (!activeSession) {
      return <div>Error: Active session not found. Please select a session.</div>
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        <div className="w-full md:w-1/4 p-4 border-r overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Sessions</h2>
          {sessions.map((session: PlannerSessionWithUiId) => (
            <Button 
              key={session.ui_id} 
              variant={activeSessionId === session.ui_id ? "default" : "outline"}
              onClick={() => setActiveSessionId(session.ui_id)}
              className="w-full mb-2 justify-start"
            >
              {session.name}
            </Button>
          ))}
          {/* <ExerciseSidebar 
            availableExercises={filteredAvailableExercisesForPicker} // Use corrected prop
            onAddExercise={(exerciseDef, sectionId) => handleAddExercise(exerciseDef, sectionId)} // Corrected arguments
            currentMode={currentMode}
            activeSessionId={activeSessionId}
          /> */}
        </div>

        <div className="w-full md:w-3/4 p-4 overflow-y-auto">
          {activeSessionId && activeSession ? (
            /* <SessionView
              key={activeSessionId}
              session={activeSession}
              sections={activeSections}
              exercises={formData.exercises.filter(ex => 
                activeSections.some(sec => sec.ui_id === ex.current_section_id)
              )}
              availableExercises={filteredAvailableExercisesForPicker} // Use corrected prop
              availableSectionTypes={availableSectionTypes}
              currentMode={currentMode}
              exerciseOrder={formData.exerciseOrder}
              onAddSection={(type) => handleAddSection(type)}
              onDeleteSection={(sectionId) => handleDeleteSection(sectionId)}
              onAddExerciseToSection={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
              onCreateSuperset={handleCreateSuperset}
              onDissolveSuperset={handleDissolveSuperset}
              onSetDetailChange={handleSetDetailChange}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onExerciseFieldChange={handleExerciseFieldChange}
              onReplaceExerciseDefinition={handleReplaceExerciseDefinition}
              // onReorderExercisesInSection={(sectionId: string, newOrder: string[]) => {
              //   // TODO: Construct ReorderPayload for "reorder-items-in-section"
              //   // const payload: ReorderPayload = { 
              //   //   operationType: "reorder-items-in-section",
              //   //   sessionId: activeSessionId || undefined,
              //   //   sectionId: sectionId,
              //   //   // Assuming itemId is derived from newOrder or context not available here
              //   //   // newPosition would also be derived
              //   //   // For now, this part needs to be re-evaluated on how SessionView provides data
              //   // };
              //   // handleReorder(payload);
              // }}
              getOrderedExercisesForSection={getOrderedExercises}
              updateSessionDetails={updateSessionDetails}
            /> */
            <div>Session View Placeholder</div> // Placeholder
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a session to start planning or add a new one.</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
