export type ExerciseBase = {
  id: number;
  name: string;
  exercise_type_id: number;
  video_url?: string;
  description?: string;
  completed?: boolean;
};

export type GymExercise = ExerciseBase & {
  sets: ExerciseSet[];
};

export type CircuitExercise = ExerciseBase & {
  sets: number;
  reps: number;
  weight: number;
  rest: number;
};

export type ExerciseSet = {
  id: number;
  exercise_id: number;
  reps: number;
  weight: number;
  rest: number;
  power?: number;
  velocity?: number;
  completed: boolean;
  set_order: number;
};

export type WarmupCircuitExercise = ExerciseBase & {
  sets: number;
  reps: number;
  rest: number;
  weight: number;
};

export type ExercisePresetGroup = {
  id: number;
  name: string;
  week: number;
  day: number;
  date: Date;
};