/**
 * ExerciseSection Component
 * 
 * A collapsible section component that displays exercises of a specific type
 * (Warm Up, Gym, or Circuit). Manages the expansion/collapse state and renders
 * the appropriate exercise data.
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
 * @property {Array} exercisePresets - List of exercise presets
 * @property {boolean} isReadOnly - Indicates if the section is read-only
 */

export default function ExerciseSection({
  section,
  openSections,
  toggleSection,
  exercisePresets,
  isReadOnly
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
            exercisePresets={exercisePresets}
            onExerciseChange={(updatedPresets) => {
              // Handle exercise changes if needed
              console.log('Exercise changes:', updatedPresets);
            }}
            isReadOnly={isReadOnly}
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
  exercisePresets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    exercises: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      video_url: PropTypes.string.isRequired,
    }).isRequired,
    exercise_training_details: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      reps: PropTypes.number.isRequired,
      completed: PropTypes.bool.isRequired,
    })).isRequired
  })).isRequired,
  isReadOnly: PropTypes.bool
}; 