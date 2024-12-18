'use client';

import { useState, useEffect } from 'react';

export default function ExerciseTable({
  sectionTitle,
  exercises,
  onExerciseChange,
  exerciseType, // 'gym', 'warmup', 'circuit'
}) {
  const [completedExercises, setCompletedExercises] = useState({});

  useEffect(() => {
    const newCompletedExercises = {};
    exercises.forEach((exercise) => {
      if (exerciseType === 'gym' && exercise.sets) {
        exercise.sets.forEach((set) => {
          newCompletedExercises[`${exercise.id}-${set.id}`] = set.completed;
        });
      } else {
        newCompletedExercises[exercise.id] = exercise.completed;
      }
    });
    setCompletedExercises(newCompletedExercises);
  }, [exercises, exerciseType]);

  const toggleTableComplete = () => {
    const allCompleted = exercises.every((exercise) => exercise.completed);
    onExerciseChange((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exerciseType === 'gym' && exercise.sets) {
          return {
            ...exercise,
            completed: !allCompleted,
            sets: exercise.sets.map((set) => ({
              ...set,
              completed: !allCompleted,
            })),
          };
        }
        return { ...exercise, completed: !allCompleted };
      })
    );
  };

  const toggleSetComplete = (exerciseId, setId) => {
    onExerciseChange((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          const newSets = exercise.sets.map((set) =>
            set.id === setId ? { ...set, completed: !set.completed } : set
          );
          const allSetsCompleted = newSets.every((set) => set.completed);
          return { ...exercise, completed: allSetsCompleted, sets: newSets };
        }
        return exercise;
      })
    );
  };

  const handleInputChange = (exerciseId, setId, field, value) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      onExerciseChange((prevExercises) =>
        prevExercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((set) =>
                  set.id === setId ? { ...set, [field]: numericValue } : set
                ),
              }
            : exercise
        )
      );
    }
  };

  return (
    <div className="w-full space-y-4">
      {exercises.length === 0 ? (
        <div className="text-center text-gray-500">No exercises available</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">{sectionTitle}</h3>
            <input
              type="checkbox"
              onChange={toggleTableComplete}
              className="w-5 h-5"
              checked={exercises.every((exercise) => exercise.completed)}
            />
          </div>
          <div className="p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Exercise</th>
                  <th className="p-2 text-left">Set</th>
                  <th className="p-2 text-left">Reps</th>
                  {exerciseType === 'gym' && <th className="p-2 text-left">Weight</th>}
                  {exerciseType === 'gym' && <th className="p-2 text-left">Power</th>}
                  {exerciseType === 'gym' && <th className="p-2 text-left">Velocity</th>}
                  <th className="p-2 text-left">Rest (s)</th>
                  <th className="p-2 text-left">Done</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise) =>
                  exerciseType === 'gym' && exercise.sets ? (
                    exercise.sets.map((set, index) => (
                      <tr key={`${exercise.id}-${set.id}`} className="border-b border-muted">
                        {index === 0 && (
                          <td
                            className="p-2 font-semibold"
                            rowSpan={exercise.sets.length}
                          >
                            {exercise.name}
                          </td>
                        )}
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleInputChange(exercise.id, set.id, 'reps', e.target.value)
                            }
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={set.output}
                            onChange={(e) =>
                              handleInputChange(exercise.id, set.id, 'output', e.target.value)
                            }
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={set.power}
                            onChange={(e) =>
                              handleInputChange(exercise.id, set.id, 'power', e.target.value)
                            }
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={set.velocity}
                            onChange={(e) =>
                              handleInputChange(exercise.id, set.id, 'velocity', e.target.value)
                            }
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={set.rest}
                            onChange={(e) =>
                              handleInputChange(exercise.id, set.id, 'rest', e.target.value)
                            }
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={set.completed || false}
                            onChange={() => toggleSetComplete(exercise.id, set.id)}
                            className="w-4 h-4"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={exercise.id} className="border-b border-muted">
                      <td className="p-2 font-semibold">{exercise.name}</td>
                      <td className="p-2">{exercise.sets}</td>
                      <td className="p-2">{exercise.reps}</td>
                      <td className="p-2">{exercise.rest || '-'}</td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={exercise.completed || false}
                          onChange={() => toggleSetComplete(exercise.id, exercise.id)}
                          className="w-4 h-4"
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
