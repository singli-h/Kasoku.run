'use client'

import { useState } from 'react';

export default function GymSection({ exercises,exercisePresets }) {
  const [completedExercises, setCompletedExercises] = useState({});

  const toggleExerciseComplete = (exerciseId) => {
    setCompletedExercises(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left w-1/4">Exercise</th>
            <th className="p-2 text-left w-1/12">Sets</th>
            <th className="p-2 text-left w-1/12">Reps</th>
            <th className="p-2 text-left w-1/12">Weight (lbs)</th>
            <th className="p-2 text-left w-1/12">Rest (s)</th>
            <th className="p-2 text-left w-1/12">Video</th>
            <th className="p-2 text-left w-1/12">Done</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise.id} className="border-b border-muted">
              <td className="p-2">{exercise.name}</td>
              <td className="p-2">
                <input
                  type="number"
                  value={exercise.defualtSets}
                  className="w-16"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  value={exercise.defualtReps}
                  className="w-16"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  defaultValue={0}
                  className="w-16"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  defaultValue={exercise.sets[0]?.rest}
                  className="w-16"
                />
              </td>
              <td className="p-2">
                {exercise.sets[0]?.exercise.videoUrl && (
                  <a href={exercise.sets[0].exercise.videoUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    Watch
                  </a>
                )}
              </td>
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={completedExercises[exercise.id] || false}
                  onChange={() => toggleExerciseComplete(exercise.id)}
                  className="w-4 h-4"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}