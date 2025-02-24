'use client'

import ExerciseDashboard from "../../components/dashboard/New_DashboardMain"
import ErrorAndLoadingOverlay from "../../components/ui/errorAndLoadingOverlay"
import { useExerciseData } from "../../components/dashboard/hooks/useExerciseData"

export default function DashboardPage() {
  const {
    session,
    isLoading,
    error,
    startSession,
    saveSession,
    completeSession,
    isOngoing,
    isAssigned,
    isCompleted
  } = useExerciseData();

  return (
    <div className="relative">
      <ErrorAndLoadingOverlay isLoading={isLoading} error={error} />
      
      {isAssigned && (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              {session?.details?.exercise_preset_groups?.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Week {session?.details?.exercise_preset_groups?.week}, 
              Day {session?.details?.exercise_preset_groups?.day}
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