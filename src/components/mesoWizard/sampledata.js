// Available exercise section types
export const exerciseSectionTypes = [
  { id: "warmup", name: "Warm-up", icon: "Flame" },
  { id: "gym", name: "Gym Exercises", icon: "Dumbbell" },
  { id: "circuit", name: "Circuits", icon: "RotateCcw" },
  { id: "plyometric", name: "Plyometrics", icon: "ArrowUpCircle" },
  { id: "isometric", name: "Isometrics", icon: "Pause" },
  { id: "sprint", name: "Sprints", icon: "Timer" },
  { id: "drill", name: "Drills", icon: "Target" },
]

// API base URL
export const API_BASE_URL = "http://localhost:54321/functions/v1/api"

// Function to fetch exercises from API
export const fetchExercises = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/planner/exercises`);
    const { data } = await response.json();
    
    // Transform API response to match the expected format
    return data.exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.exercise_types?.type || "Unknown",
      type: mapExerciseTypeToSection(exercise.exercise_types?.type, exercise.exercise_type_id),
      description: exercise.description,
      video_url: exercise.video_url,
      unit: exercise.units?.name || "kg",
      type_id: exercise.exercise_type_id
    }));
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
}

// Helper function to map API exercise types to section IDs
function mapExerciseTypeToSection(type, typeId) {
  // If we have a type_id of 4, it's a warm-up exercise
  if (typeId === 4) {
    return "warmup";
  }
  
  if (!type) return "gym";
  
  // Handle exact matching by type name
  const typeMap = {
    "Gym": "gym",
    "Warm Up": "warmup",
    "Circuit": "circuit",
    "Plyometric": "plyometric",
    "Isometric": "isometric",
    "Sprint": "sprint",
    "Drill": "drill"
  };
  
  // First try exact match
  if (typeMap[type.trim()]) {
    return typeMap[type.trim()];
  }
  
  // Use case-insensitive partial matching for other types
  const lowerType = type.toLowerCase().trim();
  if (lowerType.includes("gym")) {
    return "gym";
  } else if (lowerType.includes("circuit")) {
    return "circuit";
  } else if (lowerType.includes("plyo")) {
    return "plyometric";
  } else if (lowerType.includes("iso")) {
    return "isometric";
  } else if (lowerType.includes("sprint")) {
    return "sprint";
  } else if (lowerType.includes("drill")) {
    return "drill";
  }
  
  // Default to gym if no match
  return "gym";
}

// Sample data for progression models
export const progressionModels = [
  {
    id: "linear",
    name: "Linear Progression",
    description: "Gradually increase weight or reps each session",
    placeholder: "e.g., Add 2.5kg each week",
  },
  {
    id: "undulating",
    name: "Undulating Periodization",
    description: "Vary intensity and volume within the week",
    placeholder: "e.g., Heavy/Medium/Light rotation",
  },
  {
    id: "block",
    name: "Block Periodization",
    description: "Focus on specific adaptations in blocks",
    placeholder: "e.g., Hypertrophy block followed by strength",
  },
  {
    id: "wave",
    name: "Wave Loading",
    description: "Increase and decrease load in a wave pattern",
    placeholder: "e.g., 3 weeks up, 1 week deload",
  },
  {
    id: "rpe",
    name: "RPE-Based",
    description: "Progress based on Rate of Perceived Exertion",
    placeholder: "e.g., Maintain RPE 7-8 and increase weight when RPE drops",
  },
]

// Sample data for exercise preset details
export const exercisePresetDetails = [
  {
    id: 1,
    exercise_preset_id: 1,
    set_index: 1,
    reps: 8,
    weight: 100,
    power: null,
    velocity: null,
    distance: null,
    height: null,
    effort: 0.75,
    performing_time: null,
    rest_time: 90,
    resistance_value: 100,
    resistance_unit_id: 1,
    metadata: {},
  },
  {
    id: 2,
    exercise_preset_id: 1,
    set_index: 2,
    reps: 8,
    weight: 100,
    power: null,
    velocity: null,
    distance: null,
    height: null,
    effort: 0.75,
    performing_time: null,
    rest_time: 90,
    resistance_value: 100,
    resistance_unit_id: 1,
    metadata: {},
  },
  {
    id: 3,
    exercise_preset_id: 2,
    set_index: 1,
    reps: 5,
    weight: 120,
    power: 500,
    velocity: 0.8,
    distance: null,
    height: null,
    effort: 0.85,
    performing_time: null,
    rest_time: 180,
    resistance_value: 120,
    resistance_unit_id: 1,
    metadata: {},
  },
]

// Sample data for exercise presets
export const exercisePresets = [
  {
    id: 1,
    exercise_preset_group_id: 1,
    exercise_id: 9, // Bench Press
    superset_id: null,
    preset_order: 1,
    notes: "Focus on controlled eccentric",
  },
  {
    id: 2,
    exercise_preset_group_id: 1,
    exercise_id: 8, // Deadlift
    superset_id: null,
    preset_order: 2,
    notes: "Use lifting straps if grip fails",
  },
]

// Sample data for exercise preset groups
export const exercisePresetGroups = [
  {
    id: 1,
    coach_id: 1,
    athlete_group_id: 1,
    week: 1,
    day: 1,
    date: "2025-03-15",
    name: "Upper Body Strength",
    updated_at: "2025-03-09T13:00:00Z",
    created_at: "2025-03-09T13:00:00Z",
  },
  {
    id: 2,
    coach_id: 1,
    athlete_group_id: 1,
    week: 1,
    day: 3,
    date: "2025-03-17",
    name: "Lower Body Power",
    updated_at: "2025-03-09T13:00:00Z",
    created_at: "2025-03-09T13:00:00Z",
  },
]