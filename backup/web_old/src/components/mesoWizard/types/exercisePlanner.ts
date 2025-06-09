export interface Session {
  id: string
  name: string
  weekday: string
  sessionMode: "individual" | "group"
}

export interface ModeSpecificSections {
  individual: SectionActiveInstance[]
  group: SectionActiveInstance[]
}

export interface SectionActiveInstance {
  ui_id: string
  type_id: string
  name: string
  position: number
  is_expanded: boolean
  notes?: string
}

export interface ExerciseDefinitionBase {
  id: string
  name: string
  category: "gym" | "sprint" | "plyometric" | "isometric" | "circuit" | "drill"
  description?: string
  video?: string
}

export interface ExerciseUISetDetail {
  ui_id: string
  set_number: number
  reps?: string | number
  weight?: number // Weight in kg or lbs, use 0 for bodyweight exercises
  rest?: number
  effort?: string
  tempo?: string
  power?: string | number
  velocity?: string | number
  distance?: string | number
  duration?: string | number
  notes?: string
}

export interface ExerciseUIInstance {
  ui_id: string
  exercise_definition_id: string
  exercise_name: string
  category: "gym" | "sprint" | "plyometric" | "isometric" | "circuit" | "drill"
  current_section_id: string
  superset_ui_id?: string | null
  position_in_section: number
  position_in_superset?: number | null
  set_details: ExerciseUISetDetail[]
  notes?: string
}

export interface SupersetUIInstance {
  ui_id: string
  host_section_id: string
  position_in_section: number
  exercises: ExerciseUIInstance[]
  is_expanded: boolean
  display_number: string
}

export interface ReorderPayload {
  operationType:
    | "reorder-sections"
    | "reorder-items-in-section"
    | "reorder-items-in-superset"
    | "move-item-to-section"
    | "move-item-to-superset"
    | "move-item-from-superset"
  sessionId?: string
  sectionId?: string
  supersetId?: string
  itemId?: string
  newPosition?: number
  newSectionOrder?: string[]
  sourceSectionId?: string
  targetSectionId?: string
  targetSupersetId?: string
}
