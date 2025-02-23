/**
 * ExerciseSection Component
 * 
 * A collapsible section component that displays different types of exercises
 * (Warm Up, Gym, or Circuit) in a table format. Manages the expansion/collapse
 * state and renders the appropriate exercise data based on the section type.
 * 
 * @component
 */

'use client'

import PropTypes from 'prop-types'
import ExerciseTable from "./ExerciseTable"

/**
 * @typedef {Object} ExerciseSectionProps
 * @property {string} section - The title of the section ("Warm Up", "Gym", or "Circuit")
 * @property {Object} openSections - Object tracking which sections are expanded
 * @property {Function} toggleSection - Function to toggle section expansion
 * @property {Array} warmupExercises - List of warm-up exercises
 * @property {Array} gymExercises - List of gym exercises
 * @property {Array} circuitExercises - List of circuit exercises
 * @property {Function} setWarmupExercises - State setter for warm-up exercises
 * @property {Function} setGymExercises - State setter for gym exercises
 * @property {Function} setCircuitExercises - State setter for circuit exercises
 * @property {number} version - Version number for key prop (forces re-render when changed)
 */

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
      {/* Section Header/Toggle Button */}
      <button
        className="flex items-center justify-between w-full p-4 bg-gray-100 text-left"
        onClick={() => toggleSection(section)}
        aria-expanded={openSections[section]}
        aria-controls={`${section}-content`}
      >
        <h2 className="text-xl font-semibold">{section}</h2>
        {/* Expansion indicator arrow */}
        <span className="text-2xl" aria-hidden="true">
          {openSections[section] ? "▲" : "▼"}
        </span>
      </button>

      {/* Collapsible Content Section */}
      {openSections[section] && (
        <div 
          className="bg-white p-4"
          id={`${section}-content`}
        >
          <ExerciseTable
            sectionTitle={section}
            exercises={
              // Select appropriate exercise list based on section type
              section === "Warm Up"
                ? warmupExercises
                : section === "Gym"
                ? gymExercises
                : circuitExercises
            }
            onExerciseChange={
              // Select appropriate state setter based on section type
              section === "Warm Up"
                ? setWarmupExercises
                : section === "Gym"
                ? setGymExercises
                : setCircuitExercises
            }
            exerciseType={
              // Determine exercise type for the table
              section === "Warm Up" || section === "Circuit" ? "circuit" : "gym"
            }
            key={`${section}-${version}`} // Force re-render when version changes
          />
        </div>
      )}
    </div>
  )
}

// PropTypes validation
ExerciseSection.propTypes = {
  section: PropTypes.oneOf(['Warm Up', 'Gym', 'Circuit']).isRequired,
  openSections: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
  warmupExercises: PropTypes.array.isRequired,
  gymExercises: PropTypes.array.isRequired,
  circuitExercises: PropTypes.array.isRequired,
  setWarmupExercises: PropTypes.func.isRequired,
  setGymExercises: PropTypes.func.isRequired,
  setCircuitExercises: PropTypes.func.isRequired,
  version: PropTypes.number.isRequired,
} 