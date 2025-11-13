// Core types for session planning

export type ExerciseType = "strength" | "power" | "sprint" | "endurance" | "plyometric" | "accessory"

export interface SetData {
  setIndex: number
  reps?: number | null
  weight?: number | null
  rest_time?: number | null
  duration?: number | null
  distance?: number | null
  rpe?: number | null
  rir?: number | null
  effort?: string | null
  power?: number | null
  velocity?: number | null
  tempo?: string | null
  resistance?: number | null
  height?: number | null
  performing_time?: number | null
  pace?: string | null
  heart_rate?: number | null
  notes?: string | null
}

export interface ExerciseInSession {
  id: string // client temp id
  exerciseId: number
  name: string
  type: ExerciseType
  order: number
  supersetId?: string | null
  sets: SetData[]
  notes?: string | null
}

export interface SupersetGroup {
  id: string
  exercises: ExerciseInSession[]
}

export interface Session {
  id?: string
  name: string
  date?: string | null
  estimatedDuration?: number | null
  notes?: string | null
}

export interface SessionState {
  session: Session
  exercises: ExerciseInSession[]
  selection: Set<string>
  pageMode: "simple" | "detail"
  expandedRows: Set<string>
  libraryOpen: boolean
  batchEditOpen: boolean
}

// Exercise library types
export interface Exercise {
  id: number
  name: string
  type: ExerciseType
  category?: string
  tags?: string[]
  description?: string
  videoUrl?: string
  isFavorite?: boolean
}

// Field configuration for different exercise types
export interface FieldConfig {
  key: keyof SetData
  label: string
  unit?: string
  type: "number" | "text"
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export const EXERCISE_TYPE_DEFAULTS: Record<ExerciseType, FieldConfig[]> = {
  strength: [
    { key: "reps", label: "Reps", type: "number", placeholder: "8" },
    { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "100", step: 2.5 },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "120" },
    { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
  ],
  power: [
    { key: "reps", label: "Reps", type: "number", placeholder: "5" },
    { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "80", step: 2.5 },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "180" },
    { key: "velocity", label: "Velocity", unit: "m/s", type: "number", placeholder: "1.2", step: 0.1 },
    { key: "power", label: "Power", unit: "W", type: "number", placeholder: "500" },
  ],
  sprint: [
    { key: "reps", label: "Reps", type: "number", placeholder: "6" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "100" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "180" },
    { key: "effort", label: "Effort", type: "text", placeholder: "95%" },
    { key: "duration", label: "Time", unit: "s", type: "number", placeholder: "12" },
  ],
  endurance: [
    { key: "duration", label: "Duration", unit: "s", type: "number", placeholder: "600" },
    { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "2000" },
    { key: "pace", label: "Pace", type: "text", placeholder: "5:00/km" },
    { key: "heart_rate", label: "HR", unit: "bpm", type: "number", placeholder: "150" },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
  ],
  plyometric: [
    { key: "reps", label: "Reps", type: "number", placeholder: "5" },
    { key: "height", label: "Height", unit: "in", type: "number", placeholder: "24" },
    { key: "resistance", label: "Resistance", unit: "kg", type: "number", placeholder: "0", step: 2.5 },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "90" },
  ],
  accessory: [
    { key: "reps", label: "Reps", type: "number", placeholder: "12" },
    { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "20", step: 2.5 },
    { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "60" },
    { key: "tempo", label: "Tempo", type: "text", placeholder: "3-1-2" },
  ],
}

export const ALL_FIELDS: FieldConfig[] = [
  { key: "reps", label: "Reps", type: "number", placeholder: "8" },
  { key: "weight", label: "Weight", unit: "kg", type: "number", placeholder: "100", step: 2.5 },
  { key: "rest_time", label: "Rest", unit: "s", type: "number", placeholder: "120" },
  { key: "duration", label: "Duration", unit: "s", type: "number", placeholder: "600" },
  { key: "distance", label: "Distance", unit: "m", type: "number", placeholder: "100" },
  { key: "rpe", label: "RPE", type: "number", placeholder: "7", min: 1, max: 10 },
  { key: "rir", label: "RIR", type: "number", placeholder: "2", min: 0, max: 10 },
  { key: "effort", label: "Effort", type: "text", placeholder: "95%" },
  { key: "power", label: "Power", unit: "W", type: "number", placeholder: "500" },
  { key: "velocity", label: "Velocity", unit: "m/s", type: "number", placeholder: "1.2", step: 0.1 },
  { key: "tempo", label: "Tempo", type: "text", placeholder: "3-1-2" },
  { key: "resistance", label: "Resistance", unit: "kg", type: "number", placeholder: "0", step: 2.5 },
  { key: "height", label: "Height", unit: "in", type: "number", placeholder: "24" },
  { key: "performing_time", label: "Perf. Time", unit: "s", type: "number", placeholder: "30" },
  { key: "pace", label: "Pace", type: "text", placeholder: "5:00/km" },
  { key: "heart_rate", label: "HR", unit: "bpm", type: "number", placeholder: "150" },
]
