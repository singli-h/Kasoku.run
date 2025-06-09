'use client'

import ExerciseDashboard from "../../components/workout/index"
import { Loading as ErrorAndLoadingOverlay } from "@/components/ui/Loading"
import { useExerciseData } from "../../components/workout/hooks/useExerciseData"
// import { WeeklyOverview } from "@/components/workout/weeklyOverview";
// import { WorkoutExercisesInit } from "@/components/workout/workoutExercisesInit";
// import { TrainingSessionManager } from "@/components/workout/TrainingSessionManager";
// import { Loading } from "@/components/ui/Loading";

export default function WorkoutPage() {
  const {
    session,
    isLoading,
    error,
    startSession,
    saveSession,
    completeSession,
    isOngoing,
    isAssigned,
    isCompleted,
    isPending
  } = useExerciseData();
  // Access the single preset group directly
  const group = session?.details?.exercise_preset_groups;

  // DEBUG: log session and state flags to console
  console.log('WorkoutPage debug:', {
    sessionType: session?.type,
    sessionDetails: session?.details,
    group,
    isLoading,
    error,
    isAssigned,
    isOngoing,
    isCompleted
  });

  return (
    <div className="relative">
      <ErrorAndLoadingOverlay 
        isLoading={isLoading} 
        error={error} 
        blocking={false} 
        position="top-right"
        loadingMessage="Loading workout data..."
      />
      
      {(isPending) && (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              {group?.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {group?.date}
            </p>
            <p className="text-xl text-gray-600 mb-8">
              Week {group?.week}, Day {group?.day}
            </p>
            <p className="text-xl text-gray-600 mb-8">
              {group?.description}
            </p>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-xl
                       hover:bg-blue-700 transition-colors duration-300 shadow-lg
                       disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </div>
      )}

      {(isOngoing || isCompleted) && (
        <ExerciseDashboard
          session={session}
          onSave={saveSession}
          onComplete={completeSession}
          isReadOnly={isCompleted}
        />
      )}
    </div>
  );
} 