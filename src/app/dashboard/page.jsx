'use client'

import DashboardControls from "../../components/dashboard/DashboardControls"
import ExerciseSection from "../../components/dashboard/ExerciseSection"
import ErrorAndLoadingOverlay from "../../components/ui/errorAndLoadingOverlay"
import Button from "../../components/ui/button"
import { getUniqueWeeks, getAvailableDays } from "../../components/dashboard/utils"
import { useExerciseData } from "../../components/dashboard/hooks/useExerciseData"

export default function DashboardPage() {
  const {
    // State values
    useTrainingExercises,
    exercises,
    exercisePresets,
    exercisePresetGroups,
    trainingSessions,
    trainingExercises,
    selectedGroup,
    selectedWeek,
    selectedDay,
    gymExercises,
    warmupExercises,
    circuitExercises,
    isLoading,
    error,
    openSections,
    // Methods
    setSelectedGroup,
    setSelectedWeek,
    setSelectedDay,
    setGymExercises,
    setWarmupExercises,
    setCircuitExercises,
    toggleSection,
    saveTrainingExercise
  } = useExerciseData()

  console.log('Dashboard state:', {
    useTrainingExercises,
    exerciseCount: exercises.length,
    presetCount: exercisePresets.length,
    groupCount: exercisePresetGroups.length,
    sessionCount: trainingSessions.length,
    trainingExerciseCount: trainingExercises.length,
    selectedGroup,
    selectedWeek,
    selectedDay,
    gymCount: gymExercises.length,
    warmupCount: warmupExercises.length,
    circuitCount: circuitExercises.length,
    openSections
  });

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value)
    setSelectedDay(null)
    setSelectedGroup(null)
  }

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value)
    const group = exercisePresetGroups.find(
      (group) =>
        group.week === parseInt(selectedWeek) &&
        group.day === parseInt(e.target.value)
    )
    setSelectedGroup(group || null)
  }

  return (
    <div className="container mx-auto p-4 space-y-4 relative">
      <ErrorAndLoadingOverlay isLoading={isLoading} error={error} />
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-6">
            {selectedGroup ? `${selectedGroup.date} ${useTrainingExercises ? "Completed" : "Todo"}` : ""}
          </h1>
          <Button onClick={saveTrainingExercise}>Save</Button>
        </div>
        
        <DashboardControls
          selectedWeek={selectedWeek}
          selectedDay={selectedDay}
          selectedGroup={selectedGroup}
          exercisePresetGroups={exercisePresetGroups}
          handleWeekChange={handleWeekChange}
          handleDayChange={handleDayChange}
          getUniqueWeeks={() => getUniqueWeeks(exercisePresetGroups)}
          getAvailableDays={() => getAvailableDays(exercisePresetGroups, selectedWeek)}
        />

        {["Warm Up", "Gym", "Circuit"].map((section) => (
          <ExerciseSection
            key={section}
            section={section}
            openSections={openSections}
            toggleSection={toggleSection}
            warmupExercises={warmupExercises}
            gymExercises={gymExercises}
            circuitExercises={circuitExercises}
            setWarmupExercises={setWarmupExercises}
            setGymExercises={setGymExercises}
            setCircuitExercises={setCircuitExercises}
          />
        ))}
      </div>
    </div>
  )
} 