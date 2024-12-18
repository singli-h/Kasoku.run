'use client'

import { useState, useEffect } from "react"
import ExerciseTable from "./ExerciseTable"
import ErrorAndLoadingOverlay from "../../components/common/ErrorAndLoadingOverlay"
import Button from "../../components/common/Button"

export default function DashboardComponent() {
  const [useTrainingExercises, setUseTrainingExercises] = useState(false)
  const [exercises, setExercises] = useState([])
  const [exercisePresets, setExercisePresets] = useState([])
  const [exercisePresetGroups, setExercisePresetGroups] = useState([])
  const [trainingSessions, setTrainingSessions] = useState([])
  const [trainingExercises, setTrainingExercises] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [gymExercises, setGymExercises] = useState([])
  const [warmupExercises, setWarmupExercises] = useState([])
  const [circuitExercises, setCircuitExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:54321/functions/v1"

  //Initialize the dashboard data and get all the data needed first
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/exercisesInit`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        setExercises(data.exercises);
        setExercisePresetGroups(data.exercisePresetGroups);
        setTrainingSessions(data.trainingSessions);
        setExercisePresets(data.currentWeekPresets);
        
        let initialSessionExercises;
        let initialSelectedGroup = null;
        if(data.todaysSessionOrPreset != null){
          if (data.todaysSessionOrPreset.type === 'session') {
            initialSessionExercises = data.todaysSessionOrPreset.data.exercises;
            initialSelectedGroup = {
              id: data.todaysSessionOrPreset.data.exercise_preset_group_id,
              name: data.exercisePresetGroups.find(
                (group) => group.id === data.todaysSessionOrPreset.data.exercise_preset_group_id
              )?.name,
              date: new Date(),
            };
          } else if (data.todaysSessionOrPreset.type === 'preset') {
            initialSessionExercises = data.todaysSessionOrPreset.data;
            initialSelectedGroup = {
              id: data.todaysSessionOrPreset.data.id,
              name: data.exercisePresetGroups.find(
                (group) => group.id === data.todaysSessionOrPreset.data.id
              )?.name,
              date: new Date(),
            };
          }
          
          setTrainingExercises(initialSessionExercises);
          setSelectedGroup(initialSelectedGroup);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  //Update the session exercise whenever user changed selection
  useEffect(() => {
    const fetchSessionOrPresetExercises = async () => {
      if (!selectedGroup || !selectedWeek || !selectedDay) {
        closeAllToggles();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const selectedSession = trainingSessions.find((session) => {
          return (
            session.exercise_preset_group_id === selectedGroup.id
          );
        });

        if (selectedSession) {
          const exerciseRes = await fetch(
            `${API_BASE_URL}/api/training_exercises?training_session_id=${selectedSession.id}`);
          if (!exerciseRes.ok) {
            throw new Error('Network response was not ok');
          }
          const exerciseData = await exerciseRes.json();
          setTrainingExercises(exerciseData.training_exercises);
          setUseTrainingExercises(true);
        } else {
          const presetsRes = await fetch(
            `${API_BASE_URL}/api/exercise_presets?exercise_preset_group_id=${selectedGroup.id}`);
          if (!presetsRes.ok) {
            throw new Error('Network response was not ok');
          }
          const presetsData = await presetsRes.json();
          setExercisePresets(presetsData.exercise_presets);
          setUseTrainingExercises(false);
        }
        openAllToggles();
      } catch (err) {
        console.error('Error fetching session or preset exercises:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionOrPresetExercises();
  }, [selectedGroup, selectedWeek, selectedDay]);

  //Prepare the gym/warm up/circuit exercise for the ExerciseTable
  useEffect(() => {
    const sessionExercises = useTrainingExercises ? trainingExercises : exercisePresets;
    console.log(sessionExercises);

    const mergedSessionExercises = sessionExercises.map((sessionExercise) => {
      // Find the matching exercise
      const matchingExercise = exercises.find(
        (exercise) => exercise.id === sessionExercise.exercise_id
      );
    
      // Return a merged object
      return {
        ...sessionExercise,
        ...matchingExercise, // Include exercise data
      };
    });

    if (exercises.length === 0 || mergedSessionExercises.length === 0) return; 

    const gym = exercises
    .filter((exercise) => exercise.exercise_type_id === 2)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: sessionExercises
          .filter((sessionExercise) => sessionExercise.exercise_id === exercise.id)
          .map((sessionExercise) => ({
            id: sessionExercise.id,
            reps: sessionExercise.reps,
            rest: sessionExercise.set_rest_time,
            power: sessionExercise.power,
            velocity: sessionExercise.velocity,
            output: sessionExercise.output,
            completed: sessionExercise.completed || false
          })),
        videoUrl: exercise.videoUrl,
      }));

    const warmup = mergedSessionExercises
      .filter((exercise) => exercise.exercise_type_id === 1)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.set_rest_time,
        videoUrl: exercise.videoUrl,
        completed: exercise.completed || false
      }));

    const circuit = mergedSessionExercises
      .filter((exercise) => exercise.exercise_type_id === 3)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.set_rest_time,
        videoUrl: exercise.videoUrl,
        completed: exercise.completed || false
      }));
    setGymExercises(gym);
    setWarmupExercises(warmup);
    setCircuitExercises(circuit);
  }, [exercises, exercisePresets, trainingExercises, useTrainingExercises]);

  const [openSections, setOpenSections] = useState({
    "Warm Up": true,
    Gym: true,
    Circuit: true,
  })

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const closeAllToggles = () => {
    setOpenSections((prev) =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = false; // Set all toggles to false
        return acc;
      }, {})
    );
  };

  const openAllToggles = () => {
    setOpenSections((prev) =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = true; // Set all toggles to false
        return acc;
      }, {})
    );
  };
  

  const getUniqueWeeks = () => {
    return [...new Set(exercisePresetGroups.map((group) => group.week))].sort(
      (a, b) => a - b
    )
  }

  const getAvailableDays = () => {
    if (!selectedWeek) return []
    return [
      ...new Set(
        exercisePresetGroups
          .filter((group) => group.week === parseInt(selectedWeek))
          .map((group) => group.day)
      ),
    ].sort((a, b) => a - b)
  }

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value)
    setSelectedDay(null)
    setSelectedGroup(null)
  }

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value)
    const group = exercisePresetGroups.find(
      (group) =>
        group.week === parseInt(selectedWeek) &&
        group.day === parseInt(e.target.value)
    )
    setSelectedGroup(group || null)
  }

  const saveTrainingExercise = async () => {
    try {
      const allExercises = [
        ...gymExercises,
        ...warmupExercises,
        ...circuitExercises,
      ];
  
      // Ensure that exercises without sets as arrays are handled correctly
      const exercisesToSave = allExercises.flatMap((exercise) => {
        if (Array.isArray(exercise.sets)) {
          // Handle gym exercises where sets is an array
          return exercise.sets.map((set) => ({
            id: set.id,
            training_session_id: selectedGroup.id,
            exercise_id: exercise.id,
            reps: set.reps,
            output: set.output,
            power: set.power,
            velocity: set.velocity,
            set_rest_time: set.rest,
            completed: set.completed,
          }));
        } else {
          // Handle non-gym exercises where sets is a single number or not an array
          return {
            id: exercise.id,
            training_session_id: selectedGroup.id,
            exercise_id: exercise.id,
            reps: exercise.reps,
            output: null, // No output for non-gym exercises
            set_rest_time: exercise.rest,
            completed: exercise.completed,
          };
        }
      });
  
      const method = useTrainingExercises ? 'PUT' : 'POST';
      const url = `${API_BASE_URL}/api/training_exercises${useTrainingExercises ? `/${selectedGroup.id}` : ''}`;
  
      console.log(url);
      console.log(exercisesToSave);
  
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exercisesToSave),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save exercises');
      }
  
      alert("Exercises saved successfully!");
    } catch (error) {
      console.error("Error saving exercises:", error);
      alert("Failed to save exercises. Please try again.");
    }
  };
  

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-4 relative">
      <ErrorAndLoadingOverlay isLoading={isLoading} error={error} />
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between"> {/* Add justify-between */}
          <h1 className="text-2xl font-bold mb-6">
            {(selectedGroup ? selectedGroup.date + " " + (useTrainingExercises ? "Completed" : "Todo") : "") }
          </h1>
          <Button onClick={saveTrainingExercise}>Save</Button>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Program</h2>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-zinc-900">
              {selectedGroup ? selectedGroup.name : "No group selected"}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Week</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
              value={selectedWeek || ""}
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
            <h2 className="text-xl font-semibold mb-2 text-col">Day</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
              value={selectedDay || ""}
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

        {false && selectedGroup && (
          <p className="mt-2">
            Selected: {selectedGroup.id} - {selectedGroup.name} - Week{" "}
            {selectedWeek}, Day {selectedDay} - SessionID {selectedGroup.id}
          </p>
        )}

      {["Warm Up", "Gym", "Circuit"].map((section) => (
        <div
          key={section}
          className="border text-gray-700 border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            className="flex items-center justify-between w-full p-4 bg-gray-100 text-left"
            onClick={() => toggleSection(section)}
          >
            <h2 className="text-xl font-semibold">{section}</h2>
            <span className="text-2xl">
              {openSections[section] ? "▲" : "▼"}
            </span>
          </button>
          {openSections[section] && (
            <div className="bg-white p-4">
              <ExerciseTable
                sectionTitle={section}
                exercises={
                  section === "Warm Up"
                    ? warmupExercises
                    : section === "Gym"
                    ? gymExercises
                    : circuitExercises
                }
                onExerciseChange={
                  section === "Warm Up"
                    ? setWarmupExercises
                    : section === "Gym"
                    ? setGymExercises
                    : setCircuitExercises
                }
                exerciseType={
                  section === "Warm Up" || section === "Circuit" ? "circuit" : "gym"
                }
              />
            </div>
          )}
        </div>
      ))}

      </div>
    </div>
  )
}

