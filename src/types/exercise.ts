export interface ExerciseBase {
  id: number;
  name: string;
  video_url?: string;
  completed: boolean;
  // ... other common fields
}

export interface ExerciseSet {
  id: number;
  reps: number;
  weight: number;
  rest: number;
  completed: boolean;
  // Add other set-related fields as needed
}

export interface GymExercise extends ExerciseBase {
  id: number;
  sets: ExerciseSet[];
  exercise_type: 'GYM';
  // Gym-specific fields
}

export interface WarmupCircuitExercise extends ExerciseBase {
  id: number;
  sets?: never;
  exercise_type: 'WARMUP' | 'CIRCUIT';
  reps: number;
  weight: number;
  rest: number;
  // Warmup/Circuit specific fields
}

export type Exercise = GymExercise | WarmupCircuitExercise;

export type ExercisePresetGroup = {
  id: number;
  name: string;
  week: number;
  day: number;
  date: Date;
};

// Type guard functions
export function isGymExercise(exercise: Exercise): exercise is GymExercise {
  return exercise.exercise_type === 'GYM';
}

export function isWarmupExercise(exercise: Exercise): exercise is WarmupCircuitExercise {
  return exercise.exercise_type === 'WARMUP';
}

export function isCircuitExercise(exercise: Exercise): exercise is WarmupCircuitExercise {
  return exercise.exercise_type === 'CIRCUIT';
}