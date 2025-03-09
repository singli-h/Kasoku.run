
export const exerciseLibrary = [
  // Warm-up exercises
  { id: 1, name: "Dynamic Stretching", category: "Mobility", type: "warmup" },
  { id: 2, name: "Foam Rolling", category: "Recovery", type: "warmup" },
  { id: 3, name: "Activation Drills", category: "Mobility", type: "warmup" },
  { id: 4, name: "Light Jogging", category: "Cardio", type: "warmup" },
  { id: 5, name: "Bodyweight Squats", category: "Lower Body", type: "warmup" },
  { id: 6, name: "Arm Circles", category: "Upper Body", type: "warmup" },

  // Gym exercises
  { id: 7, name: "Barbell Squat", category: "Lower Body", type: "gym" },
  { id: 8, name: "Deadlift", category: "Compound", type: "gym" },
  { id: 9, name: "Bench Press", category: "Upper Body", type: "gym" },
  { id: 10, name: "Overhead Press", category: "Upper Body", type: "gym" },
  { id: 11, name: "Pull-up", category: "Upper Body", type: "gym" },
  { id: 12, name: "Barbell Row", category: "Upper Body", type: "gym" },
  { id: 13, name: "Leg Press", category: "Lower Body", type: "gym" },
  { id: 14, name: "Romanian Deadlift", category: "Lower Body", type: "gym" },
  { id: 15, name: "Dumbbell Lunges", category: "Lower Body", type: "gym" },
  { id: 16, name: "Lat Pulldown", category: "Upper Body", type: "gym" },
  { id: 17, name: "Tricep Extension", category: "Upper Body", type: "gym" },
  { id: 18, name: "Bicep Curl", category: "Upper Body", type: "gym" },

  // Circuit exercises
  { id: 19, name: "Kettlebell Swings", category: "Full Body", type: "circuit" },
  { id: 20, name: "Battle Ropes", category: "Conditioning", type: "circuit" },
  { id: 21, name: "Box Jumps", category: "Plyometric", type: "circuit" },
  { id: 22, name: "Burpees", category: "Full Body", type: "circuit" },
  { id: 23, name: "Mountain Climbers", category: "Core", type: "circuit" },
  { id: 24, name: "Medicine Ball Slams", category: "Full Body", type: "circuit" },

  // Plyometric exercises
  { id: 25, name: "Depth Jumps", category: "Lower Body", type: "plyometric" },
  { id: 26, name: "Broad Jumps", category: "Lower Body", type: "plyometric" },
  { id: 27, name: "Hurdle Jumps", category: "Lower Body", type: "plyometric" },
  { id: 28, name: "Bounding", category: "Lower Body", type: "plyometric" },
  { id: 29, name: "Plyo Push-ups", category: "Upper Body", type: "plyometric" },
  { id: 30, name: "Lateral Jumps", category: "Agility", type: "plyometric" },

  // Powerlifting exercises
  { id: 31, name: "Sumo Deadlift", category: "Powerlifting", type: "gym" },
  { id: 32, name: "Front Squat", category: "Powerlifting", type: "gym" },
  { id: 33, name: "Incline Bench Press", category: "Powerlifting", type: "gym" },
  { id: 34, name: "Power Clean", category: "Olympic", type: "gym" },
  { id: 35, name: "Clean and Jerk", category: "Olympic", type: "gym" },
  { id: 36, name: "Snatch", category: "Olympic", type: "gym" },

  // Isometric exercises
  { id: 37, name: "Wall Sit", category: "Lower Body", type: "isometric" },
  { id: 38, name: "Plank", category: "Core", type: "isometric" },
  { id: 39, name: "Side Plank", category: "Core", type: "isometric" },
  { id: 40, name: "Glute Bridge Hold", category: "Lower Body", type: "isometric" },
  { id: 41, name: "L-Sit", category: "Core", type: "isometric" },
  { id: 42, name: "Handstand Hold", category: "Upper Body", type: "isometric" },

  // Sprint exercises
  { id: 43, name: "100m Sprint", category: "Speed", type: "sprint" },
  { id: 44, name: "Hill Sprints", category: "Power", type: "sprint" },
  { id: 45, name: "Shuttle Runs", category: "Agility", type: "sprint" },
  { id: 46, name: "Interval Sprints", category: "Conditioning", type: "sprint" },
  { id: 47, name: "Resisted Sprints", category: "Power", type: "sprint" },
  { id: 48, name: "Flying Sprints", category: "Speed", type: "sprint" },

  // Drill exercises
  { id: 49, name: "Ladder Drills", category: "Footwork", type: "drill" },
  { id: 50, name: "Cone Drills", category: "Agility", type: "drill" },
  { id: 51, name: "Technique Drills", category: "Skill", type: "drill" },
  { id: 52, name: "Balance Drills", category: "Stability", type: "drill" },
  { id: 53, name: "Coordination Drills", category: "Motor Control", type: "drill" },
  { id: 54, name: "Sport-Specific Drills", category: "Skill", type: "drill" },
]

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