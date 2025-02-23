import { useState, useEffect } from "react"

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL =  "http://localhost:54321/functions/v1/api"
export const useExerciseData = () => {
  const [state, setState] = useState({
    useTrainingExercises: false,
    exercises: [],
    exercisePresets: [],
    exercisePresetGroups: [],
    trainingSessions: [],
    trainingExercises: [],
    selectedGroup: null,
    selectedWeek: null,
    selectedDay: null,
    gymExercises: [],
    warmupExercises: [],
    circuitExercises: [],
    isLoading: true,
    error: null,
    openSections: {
      "Warm Up": true,
      Gym: true,
      Circuit: true,
    },
    _version: 0
  })

  // Destructure state for easier access
  const {
    trainingSessions,
    selectedGroup,
    selectedWeek,
    selectedDay,
    gymExercises,
    warmupExercises,
    circuitExercises
  } = state;

  // Initialize dashboard data
  useEffect(() => {
    const fetchInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        console.log('Fetching initial data from:', `${API_BASE_URL}/dashboard/exercisesInit`);
        const response = await fetch(`${API_BASE_URL}/dashboard/exercisesInit`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Initial data response:', data);

        setState(prev => ({
          ...prev,
          exercises: data.exercises,
          exercisePresetGroups: data.exercisePresetGroups,
          trainingSessions: data.trainingSessions,
          exercisePresets: data.currentWeekPresets
        }));

        console.log('Set initial state with:', {
          exercises: data.exercises?.length,
          groups: data.exercisePresetGroups?.length,
          sessions: data.trainingSessions?.length,
          presets: data.currentWeekPresets?.length
        });

        if (data.todaysSessionOrPreset) {
          console.log('Found today\'s session/preset:', data.todaysSessionOrPreset);
          const initialSessionExercises = data.todaysSessionOrPreset.type === 'session' 
            ? data.todaysSessionOrPreset.data.exercises
            : data.todaysSessionOrPreset.data;

          const initialSelectedGroup = {
            id: data.todaysSessionOrPreset.data.id,
            name: data.exercisePresetGroups.find(
              group => group.id === data.todaysSessionOrPreset.data.id
            )?.name,
            date: new Date()
          };

          console.log('Setting initial group:', initialSelectedGroup);
          console.log('Initial exercises:', initialSessionExercises);

          setState(prev => ({
            ...prev,
            trainingExercises: initialSessionExercises.map(ex => ({
              ...ex,
              sets: ex.exercise_type === 'GYM' ? ex.sets || [] : undefined
            })),
            selectedGroup: initialSelectedGroup
          }));
        }
      } catch (err) {
        console.error('Initial data fetch error:', err);
        setState(prev => ({ ...prev, error: err }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchInitialData();
  }, []);

  // Update exercises when selection changes
  useEffect(() => {
    const fetchSessionOrPresetExercises = async () => {
      if (!selectedGroup || !selectedWeek || !selectedDay) {
        console.log('Missing selection - group, week or day not set');
        return;
      }

      console.log('Fetching session/preset exercises for:', {
        group: selectedGroup.id,
        week: selectedWeek,
        day: selectedDay
      });

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const selectedSession = trainingSessions.find(
          session => session.exercise_preset_group_id === selectedGroup.id
        );

        console.log('Selected session:', selectedSession);

        if (selectedSession) {
          console.log('Fetching training exercises for session:', selectedSession.id);
          const exerciseRes = await fetch(
            `${API_BASE_URL}/training_exercises?training_session_id=${selectedSession.id}`
          );
          if (!exerciseRes.ok) throw new Error('Network response was not ok');
          const exerciseData = await exerciseRes.json();
          console.log('Training exercises response:', exerciseData);
          
          // Group sets by exercise
          const groupedExercises = exerciseData.training_exercises.reduce((acc, set) => {
            const exId = set.exercise_id;
            if (!acc[exId]) {
              acc[exId] = {
                ...set,
                sets: [],
                exercise_id: exId,
                id: exId // Use exercise_id as temporary ID
              };
            }
            acc[exId].sets.push(set);
            return acc;
          }, {});

          setState(prev => ({
            ...prev,
            trainingExercises: Object.values(groupedExercises),
            useTrainingExercises: true
          }));
        } else {
          console.log('Fetching exercise presets for group:', selectedGroup.id);
          const presetsRes = await fetch(
            `${API_BASE_URL}/exercise_presets?exercise_preset_group_id=${selectedGroup.id}`
          );
          if (!presetsRes.ok) throw new Error('Network response was not ok');
          const presetsData = await presetsRes.json();
          console.log('Exercise presets response:', presetsData);
          
          setState(prev => ({
            ...prev,
            exercisePresets: presetsData.exercise_presets,
            useTrainingExercises: false
          }));
        }
      } catch (err) {
        console.error('Session/preset fetch error:', err);
        setState(prev => ({ ...prev, error: err }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchSessionOrPresetExercises();
  }, [selectedGroup, selectedWeek, selectedDay, trainingSessions]);

  // Add this useEffect to categorize exercises
  useEffect(() => {
    const categorizeExercises = (exercises) => {
      const grouped = exercises.reduce((acc, ex) => {
        const fullExercise = state.exercises.find(e => e.id === ex.exercise_id);
        if (!fullExercise) return acc;
        
        const key = ex.exercise_id;
        if (!acc[key]) {
          acc[key] = {
            ...ex,
            ...fullExercise,
            sets: [],
          };
        }
        
        if (fullExercise.exercise_type_id === 2 && ex.sets) {
          acc[key].sets.push(...ex.sets);
        }
        
        return acc;
      }, {});

      return {
        gym: Object.values(grouped).filter(ex => 
          state.exercises.find(e => e.id === ex.exercise_id)?.exercise_type_id === 2
        ),
        warmup: exercises.map(ex => ({
          ...ex,
          ...state.exercises.find(e => e.id === ex.exercise_id)
        })).filter(ex => 
          ex.exercise_type_id === 1
        ),
        circuit: exercises.map(ex => ({
          ...ex,
          ...state.exercises.find(e => e.id === ex.exercise_id)
        })).filter(ex => 
          ex.exercise_type_id === 3
        )
      };
    };

    if (state.useTrainingExercises && state.trainingExercises.length) {
      const categorized = categorizeExercises(state.trainingExercises);
      console.log('Categorized training exercises:', categorized);
      setState(prev => ({
        ...prev,
        gymExercises: categorized.gym,
        warmupExercises: categorized.warmup,
        circuitExercises: categorized.circuit,
        _version: prev._version + 1
      }));
    } else if (state.exercisePresets.length) {
      const categorized = categorizeExercises(state.exercisePresets);
      console.log('Categorized presets:', categorized);
      setState(prev => ({
        ...prev,
        gymExercises: categorized.gym,
        warmupExercises: categorized.warmup,
        circuitExercises: categorized.circuit,
        _version: prev._version + 1
      }));
    }
  }, [state.useTrainingExercises, state.trainingExercises, state.exercisePresets]);

  const saveTrainingExercise = async () => {
    try {
      const allExercises = [...gymExercises, ...warmupExercises, ...circuitExercises];
      
      const exercisesToSave = allExercises.flatMap(exercise => {
        if ('sets' in exercise && Array.isArray(exercise.sets)) {
          return exercise.sets.map(set => ({
            id: set.id,
            training_session_id: selectedGroup.id,
            exercise_id: exercise.exercise_id,
            reps: set.reps,
            weight: set.weight,
            power: set.power,
            velocity: set.velocity,
            set_rest_time: set.rest,
            completed: set.completed
          }));
        }
        return {
          id: exercise.id,
          training_session_id: selectedGroup.id,
          exercise_id: exercise.exercise_id,
          reps: exercise.reps,
          weight: exercise.weight,
          set_rest_time: exercise.rest,
          completed: exercise.completed
        };
      });

      const method = state.useTrainingExercises ? 'PUT' : 'POST';
      const url = `${API_BASE_URL}/training_exercises${
        state.useTrainingExercises ? `/${selectedGroup.id}` : ''
      }`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercisesToSave)
      });

      if (!response.ok) throw new Error('Failed to save exercises');
      alert("Exercises saved successfully!");
    } catch (error) {
      console.error("Error saving exercises:", error);
      alert("Failed to save exercises. Please try again.");
    }
  };

  return {
    ...state,
    version: state._version,
    setSelectedGroup: group => setState(prev => ({ ...prev, selectedGroup: group })),
    setSelectedWeek: week => setState(prev => ({ ...prev, selectedWeek: week })),
    setSelectedDay: day => setState(prev => ({ ...prev, selectedDay: day })),
    setGymExercises: exercises => setState(prev => ({ ...prev, gymExercises: exercises })),
    setWarmupExercises: exercises => setState(prev => ({ ...prev, warmupExercises: exercises })),
    setCircuitExercises: exercises => setState(prev => ({ ...prev, circuitExercises: exercises })),
    toggleSection: title => setState(prev => ({
      ...prev,
      openSections: { ...prev.openSections, [title]: !prev.openSections[title] }
    })),
    saveTrainingExercise
  }
} 