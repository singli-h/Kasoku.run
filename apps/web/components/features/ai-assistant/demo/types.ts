// Types for AI Session Assistant Demo - Matching real Kasoku data structure

export type ChangeType = 'swap' | 'add' | 'remove' | 'update'

// Individual set data - matches exercise_training_details / exercise_preset_details
export interface ExerciseSet {
  setIndex: number
  reps: number | null
  weight: number | null      // kg
  percentage: number | null  // % of 1RM
  power: number | null       // watts
  restTime: number | null    // seconds
  rpe: number | null         // 1-10
  tempo: string | null       // "3-0-2-0"
  // Additional metrics for advanced tracking
  velocity: number | null    // m/s bar speed
  distance: number | null    // meters (for cardio/plyos)
  duration: number | null    // seconds time under tension
  heartRate: number | null   // bpm
  calories: number | null    // kcal
  completed?: boolean
  // For showing changes
  isChanged?: boolean
  originalValue?: Partial<ExerciseSet>
}

// Set-level change detail
export interface SetChange {
  setIndex: number
  field: keyof ExerciseSet
  oldValue: number | string | null
  newValue: number | string | null
}

// Exercise with all sets
export interface SessionExercise {
  id: string
  name: string
  exerciseOrder: number
  supersetId: string | null   // Groups exercises in superset
  supersetLabel?: string      // "A", "B", "C" within superset
  sets: ExerciseSet[]
  notes?: string
  videoUrl?: string
  // Change state for inline display
  changeType?: ChangeType
  changeReason?: string
  newName?: string            // For swap - what it becomes
}

// Session change - what AI proposes
export interface SessionChange {
  id: string
  type: ChangeType
  targetExerciseId: string
  exerciseName: string
  description: string
  aiReasoning: string
  // For swap
  newExerciseName?: string
  preserveSets?: boolean
  // For add
  newExercise?: SessionExercise
  insertAfterExerciseId?: string | null
  // For add to superset
  addToSupersetId?: string
  // For update (set-level changes)
  updatedSets?: ExerciseSet[]
  setChanges?: SetChange[]
}

// Chat message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Full session
export interface MockSession {
  id: string
  name: string
  date: string
  status: 'upcoming' | 'in-progress' | 'completed'
  exercises: SessionExercise[]
}
