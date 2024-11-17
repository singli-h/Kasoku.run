'use client'

import { useState, useEffect } from 'react';
import GymSection from './GymSection';
import ExerciseSection from './ExerciseSection';
import ErrorAndLoadingOverlay from '../common/ErrorAndLoadingOverlay';
import Button from '../common/Button';  
const MAX_RETRIES = 3; // Adjust as needed
const RETRY_DELAY = 100; // 1 second delay between retries

export default function Component() {
  const [exercises, setExercises] = useState([]);
  const [exercisePresets, setExercisePresets] = useState([]);
  const [exercisePresetGroups, setExercisePresetGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [gymExercises, setGymExercises] = useState([]);
  const [warmupExercises, setWarmupExercises] = useState([]);
  const [circuitExercises, setCircuitExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    let retryCount = 0;

    const fetchData = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear any previous errors

      try {
        const [exercisesRes, groupsRes] = await Promise.all([
          fetch('https://localhost:7014/api/Exercises'),
          fetch('https://localhost:7014/api/ExercisePresetGroups')
        ]);

        if (!exercisesRes.ok || !groupsRes.ok) {
          throw new Error('Network response was not ok');
        }

        const exercisesData = await exercisesRes.json();
        const groupsData = await groupsRes.json();

        setExercises(exercisesData);
        setExercisePresetGroups(groupsData);
        setIsLoading(false); // Stop loading on success
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err); 

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying fetch in ${RETRY_DELAY}ms... (Attempt ${retryCount})`);
          setTimeout(fetchData, RETRY_DELAY); 
        } else {
          setIsLoading(false); // Stop loading after max retries
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let retryCount = 0;

    const fetchExercisePresets = async () => {
      if (!selectedGroup) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://localhost:7014/api/ExercisePresets?PresetGroupId=${selectedGroup.id}`);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const presetsData = await response.json();
        console.log(selectedGroup.id + ' : ' + presetsData);
        setExercisePresets(presetsData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching exercise presets:', err);
        setError(err);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying fetch in ${RETRY_DELAY}ms... (Attempt ${retryCount})`);
          setTimeout(fetchExercisePresets, RETRY_DELAY); 
        } else {
          setIsLoading(false);
        }
      }
    };

    fetchExercisePresets();
  }, [selectedGroup]);

  useEffect(() => {
    if (exercises.length > 0 && exercisePresets.length > 0) {
      const gym = exercises
        .filter(exercise => exercisePresets.some(preset => preset.exerciseId === exercise.id))
        .map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercisePresets
            .filter((preset) => preset.exerciseId === exercise.id)
            .map((preset) => ({
              id: preset.id,
              reps: preset.defaultReps,
              rest: preset.defaultSetRestTime,
              exercise,
            })),
        }));

      const warmup = exercises.filter(exercise => exercise.exerciseTypeId == 4);
      const circuit = exercises.filter(exercise => exercise.exerciseTypeId == 5);

      setGymExercises(gym);
      setWarmupExercises(warmup);
      setCircuitExercises(circuit);
    }
  }, [exercises, exercisePresets]);

  const [openSections, setOpenSections] = useState({
    "Warm Up": true,
    "Gym": true,
    "Circuit": true
  });

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getUniqueWeeks = () => {
    return [...new Set(exercisePresetGroups.map(group => group.week))].sort((a, b) => a - b);
  };

  const getAvailableDays = () => {
    if (!selectedWeek) return [];
    return [...new Set(exercisePresetGroups
      .filter(group => group.week === parseInt(selectedWeek))
      .map(group => group.day))]
      .sort((a, b) => a - b);
  };

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
    setSelectedDay(null);
    setSelectedGroup(null);
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    const group = exercisePresetGroups.find(
      group => group.week === parseInt(selectedWeek) && group.day === parseInt(e.target.value)
    );
    setSelectedGroup(group || null);
  };

  const saveTrainingExercise = async () => {
    try {
      const allExercises = [
        ...gymExercises.map(ex => ({ ...ex, type: 'gym' })),
        ...warmupExercises.map(ex => ({ ...ex, type: 'warmup' })),
        ...circuitExercises.map(ex => ({ ...ex, type: 'circuit' }))
      ];
      console.log(allExercises);

      const exercisesToSave = allExercises.map(exercise => ({
        trainingSessionId: 2,
        exerciseId: exercise.id,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          restTime: set.rest
        }))
      }));
      console.log(exercisesToSave);

      /*const response = await fetch('https://localhost:7014/api/TrainingExercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exercisesToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercises');
      }*/

      alert('Exercises saved successfully!');
    } catch (error) {
      console.error('Error saving exercises:', error);
      alert('Failed to save exercises. Please try again.');
    }
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4 relative">
      <ErrorAndLoadingOverlay isLoading={isLoading} error={error} />
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Exercise Input Page</h1>
        <Button onClick={saveTrainingExercise}>Save</Button>
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Program</h2>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
              {selectedGroup ? selectedGroup.name : 'No group selected'}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Week</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedWeek || ''}
              onChange={handleWeekChange}
            >
              <option value="">Select a week</option>
              {getUniqueWeeks().map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Day</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedDay || ''}
              onChange={handleDayChange}
              disabled={!selectedWeek}
            >
              <option value="">Select a day</option>
              {getAvailableDays().map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedGroup && (
          <p className="mt-2">
            Selected: {selectedGroup.id} - {selectedGroup.name} - Week {selectedWeek}, Day {selectedDay}
          </p>
        )}

        {['Warm Up', 'Gym', 'Circuit'].map((section) => (
          <div key={section} className="border text-gray-700 border-gray-200 rounded-lg overflow-hidden">
            <button
              className="flex items-center justify-between w-full p-4 bg-gray-100 text-left"
              onClick={() => toggleSection(section)}
            >
              <h2 className="text-xl font-semibold">{section}</h2>
              <span className="text-2xl">{openSections[section] ? '▲' : '▼'}</span>
            </button>
            {openSections[section] && (
              <div className="bg-white p-4">
                {section === 'Gym' ? (
                  <GymSection 
                    exercises={gymExercises} 
                    exercisePresets={exercisePresets}
                    onExerciseChange={(updatedExercises) => setGymExercises(updatedExercises)}
                  />
                ) : (
                  <ExerciseSection 
                    exercises={section === 'Warm Up' ? warmupExercises : circuitExercises} 
                    exercisePresets={exercisePresets}
                    onExerciseChange={(updatedExercises) => 
                      section === 'Warm Up' ? setWarmupExercises(updatedExercises) : setCircuitExercises(updatedExercises)
                    }
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}