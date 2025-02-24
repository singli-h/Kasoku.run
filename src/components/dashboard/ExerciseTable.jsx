/**
 * ExerciseTable Component
 * 
 * A responsive grid layout component that displays and manages exercises from a session.
 * Supports different exercise types, supersets, and provides functionality for updating exercise details.
 * 
 * Features:
 * - Responsive grid layout
 * - Exercise detail management
 * - Exercise completion tracking
 * - Superset grouping
 * 
 * @component
 */

'use client';

import PropTypes from 'prop-types';
import ExerciseCard from './ExerciseCard';

export default function ExerciseTable({
  sectionTitle,
  exercisePresets,
  onExerciseChange,
  isReadOnly
}) {
  // Ensure exercisePresets is always an array
  const safeExercises = Array.isArray(exercisePresets) ? exercisePresets : [];

  // Group exercises by superset_id
  const groupedExercises = safeExercises.reduce((acc, preset) => {
    if (preset.superset_id === null) {
      // Regular exercises
      acc.regular.push(preset);
    } else {
      // Superset exercises
      if (!acc.supersets[preset.superset_id]) {
        acc.supersets[preset.superset_id] = [];
      }
      acc.supersets[preset.superset_id].push(preset);
    }
    return acc;
  }, { regular: [], supersets: {} });

  // Check if all exercises in the section are completed
  const allCompleted = safeExercises.every(preset => 
    preset.exercise_training_details.every(detail => detail.completed)
  );

  // Toggle completion for all exercises
  const handleToggleAll = () => {
    if (isReadOnly) return;
    
    const newState = !allCompleted;
    const updatedPresets = safeExercises.map(preset => ({
      ...preset,
      exercise_training_details: preset.exercise_training_details.map(detail => ({
        ...detail,
        completed: newState
      }))
    }));
    
    onExerciseChange(updatedPresets);
  };

  // Toggle completion for a single exercise
  const handleToggleComplete = (exerciseId) => {
    if (isReadOnly) return;

    const updatedPresets = safeExercises.map(preset => {
      if (preset.id === exerciseId) {
        const allDetailsCompleted = preset.exercise_training_details.every(d => d.completed);
        return {
          ...preset,
          exercise_training_details: preset.exercise_training_details.map(detail => ({
            ...detail,
            completed: !allDetailsCompleted
          }))
        };
      }
      return preset;
    });
    
    onExerciseChange(updatedPresets);
  };

  // Update exercise detail fields
  const handleInputChange = (exerciseId, field, value) => {
    if (isReadOnly) return;

    const updatedPresets = safeExercises.map(preset => {
      if (preset.id === exerciseId) {
        if (field.startsWith('details.')) {
          const [, index, key] = field.split('.');
          return {
            ...preset,
            exercise_training_details: preset.exercise_training_details.map(
              (detail, i) => i === parseInt(index) ? { ...detail, [key]: Number(value) } : detail
            )
          };
        }
        return { ...preset, [field]: Number(value) };
      }
      return preset;
    });
    
    onExerciseChange(updatedPresets);
  };

  // Render a superset group
  const renderSupersetGroup = (supersetId, exercises) => (
    <div 
      key={`superset-${supersetId}`} 
      className="border-2 border-blue-200 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Superset
        </div>
        <div className="text-sm text-gray-600">
          Complete these exercises in sequence
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((preset) => (
          <ExerciseCard
            key={preset.id}
            exercise={{
              ...preset.exercises,
              details: preset.exercise_training_details,
              completed: preset.exercise_training_details.every(d => d.completed)
            }}
            onInputChange={(field, value) => handleInputChange(preset.id, field, value)}
            onToggleComplete={() => handleToggleComplete(preset.id)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Section header */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
        {!isReadOnly && (
          <button
            onClick={handleToggleAll}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
          >
            {allCompleted ? 'Unmark All' : 'Mark All'}
          </button>
        )}
      </div>

      {/* Exercise grid */}
      {safeExercises.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          No exercises available for this section
        </div>
      ) : (
        <div className="space-y-8">
          {/* Regular Exercises */}
          {groupedExercises.regular.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedExercises.regular.map((preset) => (
                <ExerciseCard
                  key={preset.id}
                  exercise={{
                    ...preset.exercises,
                    details: preset.exercise_training_details,
                    completed: preset.exercise_training_details.every(d => d.completed)
                  }}
                  onInputChange={(field, value) => handleInputChange(preset.id, field, value)}
                  onToggleComplete={() => handleToggleComplete(preset.id)}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          )}

          {/* Superset Groups */}
          {Object.entries(groupedExercises.supersets).map(([supersetId, exercises]) => 
            renderSupersetGroup(supersetId, exercises)
          )}
        </div>
      )}
    </div>
  );
}

// PropTypes validation
ExerciseTable.propTypes = {
  sectionTitle: PropTypes.string.isRequired,
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
      // Other detail fields are optional
    })).isRequired
  })),
  onExerciseChange: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool
};
