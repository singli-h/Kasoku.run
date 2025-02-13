'use client';

import { useState } from 'react';
import ExerciseCard from '../../components/exercise/ExerciseCard';

/**
 * @typedef {import('../../types/exercise').GymExercise | import('../../types/exercise').WarmupCircuitExercise} Exercise
 */

/**
 * @param {{
 *   sectionTitle: string
 *   exercises: Exercise[]
 *   onExerciseChange: (exercises: Exercise[]) => void
 *   exerciseType: 'gym' | 'warmup' | 'circuit'
 * }} props
 */
export default function ExerciseTable({
  sectionTitle,
  exercises,
  onExerciseChange,
  exerciseType, // 'gym', 'warmup', 'circuit'
}) {
  const handleToggleComplete = (exerciseId) => {
    onExerciseChange(prev => prev.map(ex => {
      if (ex.exercise_id === exerciseId) {
        const newCompletedStatus = !ex.completed;
        return {
          ...ex,
          completed: newCompletedStatus,
          sets: Array.isArray(ex.sets) ? ex.sets.map(set => ({ ...set, completed: newCompletedStatus })) : ex.sets
        };
      }
      return ex;
    }));
  };

  const handleInputChange = (exerciseId, field, value) => {
    onExerciseChange(prev => prev.map(ex => {
      if (ex.exercise_id === exerciseId) {
        // Handle nested fields for gym exercises
        if (field.startsWith('sets.')) {
          const [_, index, key] = field.split('.');
          const updatedSets = ex.sets.map((set, i) => 
            i === parseInt(index) ? { ...set, [key]: Number(value) } : set
          );
          return { ...ex, sets: updatedSets };
        }
        // Handle top-level fields for non-gym exercises
        return { ...ex, [field]: Number(value) };
      }
      return ex;
    }));
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
        <button
          onClick={() => {
            const allCompleted = exercises.every(ex => ex.completed);
            onExerciseChange(prev => prev.map(ex => ({
              ...ex,
              completed: !allCompleted,
              sets: Array.isArray(ex.sets) ? ex.sets.map(set => ({ ...set, completed: !allCompleted })) : ex.sets
            })));
          }}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
        >
          {exercises.every(ex => ex.completed) ? 'Unmark All' : 'Mark All'}
        </button>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          No exercises available for this section
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.exercise_id}
              exercise={exercise}
              exerciseType={exerciseType}
              onInputChange={(field, value) => 
                handleInputChange(exercise.exercise_id, field, value)
              }
              onToggleComplete={() => 
                handleToggleComplete(exercise.exercise_id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
