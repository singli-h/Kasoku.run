"use client"

import React, { useState } from "react"
import { ExerciseProvider } from "./ExerciseContext"
import ExerciseDashboard from "./components/ExerciseDashboard"
import { useExerciseData } from "./hooks/useExerciseData"

/**
 * Workout Wrapper Component
 * Integrates the ExerciseProvider, NotificationProvider, and ExerciseDashboard for workout
 */
const Workout = ({ session: initialSession, isReadOnly = false }) => {
  // Add local state to track session status updates
  const [sessionStatus, setSessionStatus] = useState(initialSession?.details?.status || 'unknown');
  
  // Centralize all useExerciseData logic in the parent component
  const { 
    session, 
    startSession,
    saveSession, 
    completeSession, 
    updateExerciseDetails, 
    updateTrainingDetail,
    updateExerciseTrainingDetails,
    isLoading
  } = useExerciseData();

  // Use the session from the hook if available, otherwise use initialSession
  const currentSession = session || initialSession;
  
  // Update the current session with local state if needed
  if (currentSession && currentSession.details) {
    currentSession.details.status = sessionStatus;
  }

  const handleSave = async () => {
    try {
      const result = await saveSession();
      if (result && result.success) {
        // Update session status from API result if available
        if (result.status) {
          setSessionStatus(result.status);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to save session:', error);
      return { success: false, error };
    }
  }

  const handleComplete = async () => {
    try {
      const result = await completeSession();
      
      if (result && result.success) {
        // Set the session status to completed immediately in UI
        setSessionStatus('completed');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to complete session:', error);
      return { success: false, error };
    }
  }

  // If there's no session yet or it's still loading, don't render the workout UI
  if (!currentSession || isLoading) {
    return <div className="p-8 text-center">Loading session data...</div>;
  }

  // Normalize and flatten preset groups for initial data
  const presetGroupsRaw = currentSession?.details?.exercise_preset_groups;
  const presetGroupsArr = Array.isArray(presetGroupsRaw)
    ? presetGroupsRaw
    : presetGroupsRaw
      ? [presetGroupsRaw]
      : [];
  const initialData = presetGroupsArr.flatMap(group => group.exercise_presets ?? []);

  return (
    <ExerciseProvider initialData={initialData}>
      <ExerciseDashboard 
        session={currentSession}
        startSession={startSession}
        onSave={handleSave}
        onComplete={handleComplete}
        isReadOnly={isReadOnly || sessionStatus === 'completed'}
        // Pass down the exercise data functions
        updateExerciseDetails={updateExerciseDetails}
        updateTrainingDetail={updateTrainingDetail}
        updateExerciseTrainingDetails={updateExerciseTrainingDetails}
      />
    </ExerciseProvider>
  )
}

export default Workout

// For backward compatibility with previous imports
export { default as WorkoutMain } from './components/ExerciseDashboard' 