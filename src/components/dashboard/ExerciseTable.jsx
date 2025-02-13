'use client';

import ExerciseCard from './ExerciseCard';
import { isGymExercise } from '../../types/exercise';

/**
 * @typedef {import('../../types/exercise').GymExercise | import('../../types/exercise').WarmupCircuitExercise} Exercise
 */

/**
 * @param {{
 *   sectionTitle: string
 *   exercises: Array<GymExercise | WarmupCircuitExercise>
 *   onExerciseChange: (exercises: Array<GymExercise | WarmupCircuitExercise>) => void
 *   exerciseType: 'gym' | 'warmup' | 'circuit'
 * }} props
 */
export default function ExerciseTable({
  sectionTitle,
  exercises,
  onExerciseChange,
  exerciseType, // 'gym', 'warmup', 'circuit'
}) {
  // Guarantee exercises is always an array
  const safeExercises = Array.isArray(exercises) ? exercises : [];

  console.log('Rendering ExerciseTable with:', {
    sectionTitle,
    exercises,
    exerciseType
  });

  // Simplified completion check
  const allCompleted = safeExercises.every(ex => {
    if (isGymExercise(ex)) {
      return ex.sets.every(set => set.completed);
    }
    return ex.completed;
  });

  // Separate toggle handlers
  const toggleGymExercise = (exercise, newState) => ({
    ...exercise,
    completed: newState,
    sets: exercise.sets.map(set => ({ ...set, completed: newState }))
  });

  const toggleNonGymExercise = (exercise, newState) => ({
    ...exercise,
    completed: newState
  });

  const handleToggleAll = () => {
    const newState = !allCompleted;
    onExerciseChange(safeExercises.map(ex => 
      isGymExercise(ex) ? 
      toggleGymExercise(ex, newState) : 
      toggleNonGymExercise(ex, newState)
    ));
  };

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

  const handleInputChange = (exerciseId, field, value) => {
    onExerciseChange(prev => {
      const currentExercises = Array.isArray(prev) ? [...prev] : [];
      return currentExercises.map(ex => {
        if (ex.id === exerciseId) {
          if (field.startsWith('sets.')) {
            const [, index, key] = field.split('.');
            const updatedSets = ex.sets?.map((set, i) => 
              i === parseInt(index) ? { ...set, [key]: Number(value) } : set
            ) || [];
            return { ...ex, sets: updatedSets };
          }
          return { ...ex, [field]: Number(value) };
        }
        return ex;
      });
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
        <button
          onClick={handleToggleAll}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
        >
          {allCompleted ? 'Unmark All' : 'Mark All'}
        </button>
      </div>

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
