import React, { useState, useEffect } from 'react';
import ExerciseRow from './ExerciseRow';
import GymRow from './GymRow';

const WorkoutPage = () => {
  const [workoutData, setWorkoutData] = useState({
    warmup: [],
    gym: [],
    circuit: [],
  });
  const [exercises, setExercises] = useState([]);
  const [exercisePresets, setExercisePresets] = useState([]);
  // State to manage section collapse
  const [isWarmupCollapsed, setIsWarmupCollapsed] = useState(false);
  const [isGymCollapsed, setIsGymCollapsed] = useState(false);
  const [isCircuitCollapsed, setIsCircuitCollapsed] = useState(false);


  useEffect(() => {
    const fetchExercises = async () => {
      const response = await fetch('https://localhost:7014/api/Exercises');
      const data = await response.json();
      setExercises(data);
    };

    const fetchExercisePresets = async () => {
      const response = await fetch('https://localhost:7014/api/ExercisePresets');
      const data = await response.json();
      setExercisePresets(data);
    };

    fetchExercises();
    fetchExercisePresets();
  }, []);

  // Structure workout data based on API responses (you'll need to adjust this logic)
  useEffect(() => {
    // ... Logic to structure workoutData using 'exercises' and 'exercisePresets' ...
    // Example (adjust as needed):
    const structuredData = {
      warmup: [
        { id: 1, name: 'Jumping Jacks', reps: 10, videoUrl: '...' }
      ],
      gym: exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercisePresets
          .filter((preset) => preset.exerciseId === exercise.id)
          .map((preset) => ({
            id: preset.id,
            reps: preset.defaultReps,
            rest: preset.defaultSetRestTime, 
            
            exercise, // Include the exercise data for videoUrl etc.
          })),
      })),
      circuit: [
        // ... circuit exercises
      ],
    };
    setWorkoutData(structuredData);
  }, [exercises, exercisePresets]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Workout</h1>

      {/* Warm-up Section */}
      <div>
        <div className="flex justify-between items-center mb-4"> {/* Added flex container for button */}
          <h2 className="text-2xl font-semibold">Warm-up</h2>
          <button
            onClick={() => setIsWarmupCollapsed(!isWarmupCollapsed)}
            className="text-blue-500 hover:underline"
          >
            {isWarmupCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!isWarmupCollapsed && ( // Conditionally render content
          <div>
            {workoutData.warmup.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </div>

      {/* Gym Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Gym</h2>
          <button
            onClick={() => setIsGymCollapsed(!isGymCollapsed)}
            className="text-blue-500 hover:underline"
          >
            {isGymCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!isGymCollapsed && (
          <div>
            {workoutData.gym.map((exercise) => (
              <div key={exercise.id}>
                <h3 className="text-xl font-medium mb-2">{exercise.name}</h3>
                {exercise.sets.map((set) => (
                  <GymRow key={set.id} set={set} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Circuit Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Circuit</h2>
          <button
            onClick={() => setIsCircuitCollapsed(!isCircuitCollapsed)}
            className="text-blue-500 hover:underline"
          >
            {isCircuitCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!isCircuitCollapsed && (
          <div>
            {workoutData.circuit.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;