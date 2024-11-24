'use client'

import { useState } from 'react';

export default function GymSection({ exercises, onExerciseChange }) {
  const [completedExercises, setCompletedExercises] = useState({});

  const toggleExerciseComplete = (exerciseId) => {
    setCompletedExercises(prevCompletedExercises => {
      const exercise = exercises.find(e => e.id === exerciseId);
      const newCompleted = !exercise.completed; // Determine the new "completed" state

      // Create an updated completedExercises object
      const newCompletedExercises = { ...prevCompletedExercises };
      exercise.sets.forEach(set => {
        newCompletedExercises[`${exerciseId}-${set.id}`] = newCompleted;
      });

      // Update the exercises with the new completed state
      onExerciseChange(exercises.map(e => 
        e.id === exerciseId ? { ...e, completed: newCompleted } : e
      ));

      return newCompletedExercises;
    });
  };

  const toggleSetComplete = (exerciseId, setId) => {
    setCompletedExercises(prevCompletedExercises => {
      const newCompletedExercises = { 
        ...prevCompletedExercises, 
        [`${exerciseId}-${setId}`]: !prevCompletedExercises[`${exerciseId}-${setId}`] 
      };

      // Check if all sets are completed for this exercise
      const exercise = exercises.find(e => e.id === exerciseId);
      const allSetsCompleted = exercise.sets.every(set => newCompletedExercises[`${exerciseId}-${set.id}`]);

      onExerciseChange(exercises.map(e => 
        e.id === exerciseId ? { ...e, completed: allSetsCompleted } : e
      ));

      return newCompletedExercises;
    });
  };


  const handleInputChange = (exerciseId, setId, field, value) => {
    onExerciseChange(exercises.map(exercise => 
      exercise.id === exerciseId ? {
        ...exercise,
        sets: exercise.sets.map(set => 
          set.id === setId ? { ...set, [field]: value } : set
        )
      } : exercise
    ));
  };

  return (
    <div className="w-full space-y-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">{exercise.name}</h3>
            <input
              type="checkbox"
              checked={exercise.completed || false}
              onChange={() => toggleExerciseComplete(exercise.id)}
              className="w-5 h-5"
            />
          </div>
          <div className="p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Set</th>
                  <th className="p-2 text-left">Reps</th>
                  <th className="p-2 text-left">Weight (lbs)</th>
                  <th className="p-2 text-left">Rest (s)</th>
                  <th className="p-2 text-left">Done</th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, index) => (
                  <tr key={set.id} className="border-b border-muted">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleInputChange(exercise.id, set.id, 'reps', e.target.value)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleInputChange(exercise.id, set.id, 'weight', e.target.value)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={set.rest}
                        onChange={(e) => handleInputChange(exercise.id, set.id, 'rest', e.target.value)}
                        className="w-16 p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={completedExercises[`${exercise.id}-${set.id}`] || false}
                        onChange={() => toggleSetComplete(exercise.id, set.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exercise.videoUrl && (
            <div className="p-4 bg-gray-50">
              <a href={exercise.videoUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                Watch Video
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

