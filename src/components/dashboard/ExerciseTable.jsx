/**
 * ExerciseTable Component
 * 
 * A responsive grid layout component that displays and manages a collection of exercises.
 * Supports different exercise types (gym, warmup, circuit) and provides functionality
 * for marking exercises as complete and updating exercise parameters.
 * 
 * Features:
 * - Responsive grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
 * - Bulk completion toggling
 * - Individual exercise management
 * - Type-safe exercise handling
 * - Empty state handling
 * 
 * @component
 */

'use client';

import PropTypes from 'prop-types';
import ExerciseCard from './ExerciseCard';
import { isGymExercise } from '../../types/exercise';

/**
 * @typedef {import('../../types/exercise').GymExercise | import('../../types/exercise').WarmupCircuitExercise} Exercise
 */

/**
 * @typedef {Object} ExerciseTableProps
 * @property {string} sectionTitle - Title of the exercise section
 * @property {Array<Exercise>} exercises - Array of exercises to display
 * @property {(exercises: Array<Exercise>) => void} onExerciseChange - Callback for exercise updates
 * @property {'gym' | 'warmup' | 'circuit'} exerciseType - Type of exercises in this table
 */

export default function ExerciseTable({
  sectionTitle,
  exercises,
  onExerciseChange,
  exerciseType,
}) {
  // Ensure exercises is always an array, even if null/undefined is passed
  const safeExercises = Array.isArray(exercises) ? exercises : [];

  // Debug logging for component state
  console.log('Rendering ExerciseTable with:', {
    sectionTitle,
    exercises,
    exerciseType
  });

  /**
   * Checks if all exercises in the section are completed
   * For gym exercises, checks all sets; for others, checks the exercise completion flag
   * @returns {boolean} True if all exercises are completed
   */
  const allCompleted = safeExercises.every(ex => {
    if (isGymExercise(ex)) {
      return ex.sets.every(set => set.completed);
    }
    return ex.completed;
  });

  /**
   * Updates a gym exercise's completion state
   * Sets both the exercise and all its sets to the new state
   * 
   * @param {Exercise} exercise - The exercise to update
   * @param {boolean} newState - The new completion state
   * @returns {Exercise} Updated exercise object
   */
  const toggleGymExercise = (exercise, newState) => ({
    ...exercise,
    completed: newState,
    sets: exercise.sets.map(set => ({ ...set, completed: newState }))
  });

  /**
   * Updates a non-gym exercise's completion state
   * 
   * @param {Exercise} exercise - The exercise to update
   * @param {boolean} newState - The new completion state
   * @returns {Exercise} Updated exercise object
   */
  const toggleNonGymExercise = (exercise, newState) => ({
    ...exercise,
    completed: newState
  });

  /**
   * Toggles completion state for all exercises in the section
   * Uses the opposite of the current allCompleted state
   */
  const handleToggleAll = () => {
    const newState = !allCompleted;
    onExerciseChange(safeExercises.map(ex => 
      isGymExercise(ex) ? 
      toggleGymExercise(ex, newState) : 
      toggleNonGymExercise(ex, newState)
    ));
  };

  /**
   * Toggles completion state for a single exercise
   * 
   * @param {string} exerciseId - ID of the exercise to toggle
   */
  const handleToggleComplete = (exerciseId) => {
    const updatedExercises = safeExercises.map(ex => {
      if (ex.id === exerciseId) {
        return isGymExercise(ex) ?
          toggleGymExercise(ex, !ex.completed) :
          toggleNonGymExercise(ex, !ex.completed);
      }
      return ex;
    });
    onExerciseChange(updatedExercises);
  };

  /**
   * Updates a specific field of an exercise
   * Handles both direct fields and nested set fields
   * 
   * @param {string} exerciseId - ID of the exercise to update
   * @param {string} field - Field to update (can be nested like 'sets.0.reps')
   * @param {number} value - New value for the field
   */
  const handleInputChange = (exerciseId, field, value) => {
    onExerciseChange(prev => {
      const currentExercises = Array.isArray(prev) ? [...prev] : [];
      return currentExercises.map(ex => {
        if (ex.id === exerciseId) {
          if (field.startsWith('sets.')) {
            // Handle nested set updates (e.g., 'sets.0.reps')
            const [, index, key] = field.split('.');
            const updatedSets = ex.sets?.map((set, i) => 
              i === parseInt(index) ? { ...set, [key]: Number(value) } : set
            ) || [];
            return { ...ex, sets: updatedSets };
          }
          // Handle direct field updates
          return { ...ex, [field]: Number(value) };
        }
        return ex;
      });
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Section header with title and bulk action button */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
        <button
          onClick={handleToggleAll}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
        >
          {allCompleted ? 'Unmark All' : 'Mark All'}
        </button>
      </div>

      {/* Exercise grid with empty state handling */}
      {safeExercises.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          No exercises available for this section
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseType={exerciseType}
              onInputChange={(field, value) => 
                handleInputChange(exercise.id, field, value)
              }
              onToggleComplete={() => 
                handleToggleComplete(exercise.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// PropTypes validation
ExerciseTable.propTypes = {
  sectionTitle: PropTypes.string.isRequired,
  exercises: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    // Note: Additional shape validation omitted for brevity
  })),
  onExerciseChange: PropTypes.func.isRequired,
  exerciseType: PropTypes.oneOf(['gym', 'warmup', 'circuit']).isRequired,
};
