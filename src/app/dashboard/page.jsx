'use client'

import DashboardControls from "../../components/dashboard/DashboardControls"
import ExerciseSection from "../../components/dashboard/ExerciseSection"
import ErrorAndLoadingOverlay from "../../components/ui/errorAndLoadingOverlay"
import { useExerciseData } from "../../components/dashboard/hooks/useExerciseData"

export default function DashboardPage() {
  const {
    session,
    isLoading,
    error,
    openSections,
    toggleSection,
    startSession,
    saveSession,
    completeSession,
    updateExerciseDetails,
    isOngoing,
    isAssigned,
    isCompleted,
    version
  } = useExerciseData();

  // Group exercises by type
  const exercisesByType = session?.details?.exercise_preset_groups?.exercise_presets.reduce(
    (acc, preset) => {
      const exerciseType = preset.exercises.exercise_type_id;
      // 4: Warm Up, 3: Gym, 5: Circuit
      switch (exerciseType) {
        case 4:
          acc.warmup.push(preset);
          break;
        case 3:
          acc.gym.push(preset);
          break;
        case 5:
          acc.circuit.push(preset);
          break;
        default:
          console.warn(`Unknown exercise type: ${exerciseType}`);
      }
      return acc;
    },
    { warmup: [], gym: [], circuit: [] }
  ) || { warmup: [], gym: [], circuit: [] };

  return (
    <div className="container mx-auto p-4 space-y-4 relative">
      <ErrorAndLoadingOverlay isLoading={isLoading} error={error} />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Session Controls */}
        <DashboardControls
          session={session}
          onStartSession={startSession}
          onSaveSession={saveSession}
          onCompleteSession={completeSession}
          isLoading={isLoading}
        />

        {/* Exercise Sections */}
        {(isOngoing || isCompleted) && (
          <>
            {/* Warm Up Section */}
            <ExerciseSection
              key={`warmup-${version}`}
              section="Warm Up"
              openSections={openSections}
              toggleSection={toggleSection}
              exercisePresets={exercisesByType.warmup}
              onExerciseChange={(updatedPresets) => updateExerciseDetails('warmup', updatedPresets)}
              isReadOnly={isCompleted}
            />

            {/* Gym Section */}
            <ExerciseSection
              key={`gym-${version}`}
              section="Gym"
              openSections={openSections}
              toggleSection={toggleSection}
              exercisePresets={exercisesByType.gym}
              onExerciseChange={(updatedPresets) => updateExerciseDetails('gym', updatedPresets)}
              isReadOnly={isCompleted}
            />

            {/* Circuit Section */}
            <ExerciseSection
              key={`circuit-${version}`}
              section="Circuit"
              openSections={openSections}
              toggleSection={toggleSection}
              exercisePresets={exercisesByType.circuit}
              onExerciseChange={(updatedPresets) => updateExerciseDetails('circuit', updatedPresets)}
              isReadOnly={isCompleted}
            />
          </>
        )}

        {/* Show message for assigned sessions */}
        {isAssigned && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">
              Click &quot;Start Session&quot; to begin your workout
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 