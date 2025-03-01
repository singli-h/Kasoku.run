// Base interfaces for API responses
export interface ApiResponse<T> {
  status: string;
  data: T;
  metadata: {
    timestamp: string;
    timezone: string;
  };
}

export enum ExerciseType {
  Isometric = 1,
  Plyometric = 2,
  Gym = 3,
  WarmUp = 4,
  Circuit = 5,
  Sprint = 6,
  Drill = 7
}

export interface Exercise {
  id: number;
  name: string;
  unit_id: number;
  video_url: string;
  description: string;
  exercise_type_id: ExerciseType;
}

export interface ExerciseTrainingDetail {
  id: number;
  reps: number;
  power: number | null;
  effort: number | null;
  weight: number | null;
  distance: number | null;
  metadata: object | null;
  velocity: number | null;
  completed: boolean;
  rest_time: number | null;
  set_index: number;
  performing_time: number | null;
  resistance_value: number | null;
  exercise_preset_id: number;
  resistance_unit_id: number | null;
  exercise_training_session_id: number;
}

export interface ExercisePreset {
  id: number;
  notes: string | null;
  exercises: Exercise;
  exercise_id: number;
  superset_id: number | null;
  preset_order: number;
  exercise_preset_group_id: number;
  exercise_training_details: ExerciseTrainingDetail[];
  completed: boolean;
}

export interface ExercisePresetGroup {
  id: number;
  day: number;
  date: string;
  name: string;
  week: number;
  coach_id: number;
  created_at: string;
  updated_at: string;
  athlete_group_id: number;
  exercise_presets: ExercisePreset[];
}

export interface TrainingSession {
  id: number;
  athlete_id: number;
  date_time: string;
  exercise_preset_group_id: number;
  updated_at: string;
  notes: string | null;
  created_at: string;
  status: 'ongoing' | 'assigned' | 'completed';
  athlete_group_id: number;
  exercise_preset_groups: ExercisePresetGroup;
}

export interface DashboardSessionResponse {
  session: {
    type: string;
    details: TrainingSession;
  };
}

// Request interfaces for POST/PUT endpoints
export interface ExerciseDetailBase {
  id: number;
  reps: number;
  // Add additional fields as needed
}

export interface PostExerciseDetailRequest {
  exercise_training_session_id: number;
  exercisesDetail: ExerciseDetailBase[];
}

export interface PutExerciseDetail extends ExerciseDetailBase {
  id: number;
  set_index: number;
}

export interface PutExerciseDetailRequest {
  exercise_training_session_id: number;
  exercisesDetail: PutExerciseDetail[];
}

// Type guard functions
export function isOngoingSession(session: TrainingSession): boolean {
  return session.status === 'ongoing';
}

export function isAssignedSession(session: TrainingSession): boolean {
  return session.status === 'assigned';
}

export function isCompletedSession(session: TrainingSession): boolean {
  return session.status === 'completed';
}