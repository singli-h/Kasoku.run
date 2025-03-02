"use client"

import React from "react"
import { ExerciseProvider } from "./ExerciseContext"
import { NotificationProvider } from "../ui/Notification"
import ExerciseDashboard from "./components/ExerciseDashboard"
import { useExerciseData } from "./hooks/useExerciseData"

/**
 * Dashboard Wrapper Component
 * Integrates the ExerciseProvider, NotificationProvider, and ExerciseDashboard
 */
const Dashboard = ({ session: initialSession, isReadOnly = false }) => {
  // Centralize all useExerciseData logic in the parent component
  const { 
    session, 
    saveSession, 
    completeSession, 
    updateExerciseDetails, 
    updateTrainingDetail,
    updateExerciseTrainingDetails,
    isLoading
  } = useExerciseData();

  // Use the session from the hook if available, otherwise use initialSession
  const currentSession = session || initialSession;

  const handleSave = async () => {
    try {
      // Use a small timeout to ensure all state updates have been processed
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await saveSession();
          resolve(result);
        }, 50); // Small delay to ensure state updates are processed
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      return { success: false, error };
    }
  }

  const handleComplete = async () => {
    try {
      // Use a small timeout to ensure all state updates have been processed
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await completeSession();
          
          // Add a brief delay to ensure the state is updated before resolving
          if (result.success) {
            // Instead of immediately resolving, wait a moment to ensure UI updates
            setTimeout(() => {
              resolve(result);
            }, 100);
          } else {
            resolve(result);
          }
        }, 50); // Small delay to ensure state updates are processed
      });
    } catch (error) {
      console.error('Failed to complete session:', error);
      return { success: false, error };
    }
  }

  // If there's no session yet or it's still loading, don't render the dashboard
  if (!currentSession || isLoading) {
    return <div className="p-8 text-center">Loading session data...</div>;
  }

  return (
    <NotificationProvider>
      <ExerciseProvider initialData={currentSession?.details?.exercise_preset_groups?.exercise_presets}>
        <ExerciseDashboard 
          session={currentSession}
          onSave={handleSave}
          onComplete={handleComplete}
          isReadOnly={isReadOnly}
          // Pass down the exercise data functions
          updateExerciseDetails={updateExerciseDetails}
          updateTrainingDetail={updateTrainingDetail}
          updateExerciseTrainingDetails={updateExerciseTrainingDetails}
        />
      </ExerciseProvider>
    </NotificationProvider>
  )
}

export default Dashboard 

// For backward compatibility with previous imports
export { default as DashboardMain } from './components/ExerciseDashboard' 