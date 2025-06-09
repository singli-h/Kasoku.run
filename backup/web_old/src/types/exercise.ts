/**
 * Core type definitions for the exercise training system
 * This file contains all TypeScript interfaces and types used throughout the application
 */

// Base API response wrapper interface
export interface ApiResponse<T> {
  status: string;
  data: T;
  metadata: {
    timestamp: string;
    timezone: string;
  };
}

/**
 * Exercise Type Enumeration
 * Maps numeric IDs to exercise categories for type-safe exercise classification
 */
export enum ExerciseType {
  Isometric = 1,    // Static strength exercises
  Plyometric = 2,   // Explosive movement exercises
  Gym = 3,          // Traditional gym exercises
  WarmUp = 4,       // Pre-workout warm-up exercises
  Circuit = 5,      // Circuit training exercises
  Sprint = 6,       // Sprint and running exercises
  Drill = 7         // Technique and skill drills
}

/**
 * Core Exercise Interface
 * Represents the fundamental properties of an exercise
 */
export interface Exercise {
  id: number;
  name: string;
  unit_id: number;
  video_url: string;
  description: string;
  exercise_type_id: ExerciseType;
}

/**
 * Exercise Training Detail Interface
 * Represents a single set within an exercise, including all measurable metrics
 */
export interface ExerciseTrainingDetail {
  id: number;
  set_index: number;
  exercise_preset_id: number;
  exercise_training_session_id: number;
  
  // Performance metrics
  reps: number;
  weight: number | null;
  power: number | null;
  velocity: number | null;
  effort: number | null;
  distance: number | null;
  performing_time: number | null;
  rest_time: number | null;
  
  // Equipment settings
  resistance_value: number | null;
  resistance_unit_id: number | null;
  
  completed: boolean;
  metadata: object | null;
}

/**
 * Exercise Preset Interface
 * Configures how an exercise should be performed within a training session
 */
export interface ExercisePreset {
  id: number;
  exercise_id: number;
  exercise_preset_group_id: number;
  preset_order: number;
  superset_id: number | null;
  notes: string | null;
  exercises: Exercise;
  exercise_training_details: ExerciseTrainingDetail[];
  completed: boolean;
}

/**
 * Exercise Preset Group Interface
 * Groups related exercises into a cohesive training unit
 */
export interface ExercisePresetGroup {
  id: number;
  name: string;
  week: number;
  day: number;
  date: string;
  coach_id: number;
  athlete_group_id: number;
  created_at: string;
  updated_at: string;
  exercise_presets: ExercisePreset[];
}

/**
 * Training Session Interface
 * Represents an active or completed training session
 */
export interface TrainingSession {
  id: number;
  athlete_id: number;
  athlete_group_id: number;
  exercise_preset_group_id: number;
  date_time: string;
  notes: string | null;
  status: 'ongoing' | 'assigned' | 'completed';
  created_at: string;
  updated_at: string;
  exercise_preset_groups: ExercisePresetGroup;
}

export interface DashboardSessionResponse {
  session: {
    type: string;
    details: TrainingSession;
  };
}

// API Request Interfaces
export interface ExerciseDetailBase {
  id: number;
  reps: number;
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

/**
 * Type Guard Functions
 * Provide type-safe checks for session status
 */
export function isOngoingSession(session: TrainingSession): boolean {
  return session.status === 'ongoing';
}

export function isAssignedSession(session: TrainingSession): boolean {
  return session.status === 'assigned';
}

export function isCompletedSession(session: TrainingSession): boolean {
  return session.status === 'completed';
}