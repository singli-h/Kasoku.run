'use client'

import { useState, useEffect } from 'react';

export default function GymSection({ exercises, onExerciseChange }) {
  const [completedExercises, setCompletedExercises] = useState({});

  const toggleExerciseComplete = (exerciseId) => {
    onExerciseChange(prevExercises => {
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          const newCompleted = !exercise.completed;
          return {
            ...exercise,
            completed: newCompleted,
            // Correctly update sets with new objects
            sets: exercise.sets.map(set => ({ ...set, completed: newCompleted })) 
          };
        }
        return exercise;
      });
    });
  };

  const toggleSetComplete = (exerciseId, setId) => {
    onExerciseChange(prevExercises => {
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          const newSets = exercise.sets.map(set => 
            set.id === setId ? { ...set, completed: !set.completed } : set
          );
          const allSetsCompleted = newSets.every(set => set.completed);
          return { ...exercise, completed: allSetsCompleted, sets: newSets };
        }
        return exercise;
      });
    });
  };

  const handleInputChange = (exerciseId, setId, field, value) => {
    const numericValue = parseFloat(value); // Parse the input value as a number

    // Check if the value is a number and greater than 0
    if (!isNaN(numericValue) && numericValue > 0) { 
      onExerciseChange(exercises.map(exercise => 
        exercise.id === exerciseId ? {
          ...exercise,
          sets: exercise.sets.map(set => 
            set.id === setId ? { ...set, [field]: numericValue } : set // Update with the numeric value
          )
        } : exercise
      ));
    } 
    // Optionally, you can handle invalid input here (e.g., show an error message)
  };

  // useEffect to update completedExercises when exercises change
  useEffect(() => {
    const newCompletedExercises = {};
    exercises.forEach(exercise => {
      const allSetsCompleted = exercise.sets.every(set => set.completed); // Check if all sets are completed
      exercise.sets.forEach(set => {
        newCompletedExercises[`${exercise.id}-${set.id}`] = set.completed;
      });
      // Update the exercise's completed status
      onExerciseChange(prevExercises => prevExercises.map(e => 
        e.id === exercise.id ? { ...e, completed: allSetsCompleted } : e
      )); 
    });
    setCompletedExercises(newCompletedExercises);
  }, [exercises]); 

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
                  <th className="p-2 text-left">Weight (kg)</th>
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
                        value={set.output}
                        onChange={(e) => handleInputChange(exercise.id, set.id, 'output', e.target.value)}
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

