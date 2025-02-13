'use client'

import ExerciseTable from "./ExerciseTable"

export default function ExerciseSection({
  section,
  openSections,
  toggleSection,
  warmupExercises,
  gymExercises,
  circuitExercises,
  setWarmupExercises,
  setGymExercises,
  setCircuitExercises,
  version
}) {
  return (
    <div className="border text-gray-700 border-gray-200 rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 bg-gray-100 text-left"
        onClick={() => toggleSection(section)}
      >
        <h2 className="text-xl font-semibold">{section}</h2>
        <span className="text-2xl">
          {openSections[section] ? "▲" : "▼"}
        </span>
      </button>
      {openSections[section] && (
        <div className="bg-white p-4">
          <ExerciseTable
            sectionTitle={section}
            exercises={
              section === "Warm Up"
                ? warmupExercises
                : section === "Gym"
                ? gymExercises
                : circuitExercises
            }
            onExerciseChange={
              section === "Warm Up"
                ? setWarmupExercises
                : section === "Gym"
                ? setGymExercises
                : setCircuitExercises
            }
            exerciseType={
              section === "Warm Up" || section === "Circuit" ? "circuit" : "gym"
            }
            key={`${section}-${version}`}
          />
        </div>
      )}
    </div>
  )
} 