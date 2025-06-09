export interface BaseSession {
  id: string;
  name: string;
  weekday: string;
  sessionMode: "individual" | "group";
  description?: string;
  date?: string;
}

// New interface extending BaseSession
export interface PlannerSessionWithUiId extends BaseSession {
  ui_id: string;
  position: number;
  type: "individual" | "group"; // Added for consistency with useMesoWizardState
}

export interface SectionActiveInstance {
  ui_id: string;
  type_id: string;
  name: string;
  position: number;
  is_expanded: boolean;
  // Optional: Add db_id if sections can be saved/loaded
  db_id?: string;
}

export interface ExerciseUISetDetail {
  ui_id: string;
  set_number: number;
  reps?: number | string; // Can be number or text like "AMRAP"
  weight?: number; // Weight in kg or lbs, use 0 for bodyweight exercises
  distance?: number | string; // Changed to allow string for consistency with overlay
  duration?: number | string; // e.g., seconds or "Hold for 30s"
  effort?: string; // e.g., "RPE 8", "75%", "Max Effort"
  tempo?: string; // e.g., "3-1-2-0"
  power?: string | number; // e.g., Watts, store as string for flexibility
  velocity?: string | number; // e.g., m/s, store as string for flexibility
  rest?: number; // in seconds
  notes?: string;
  // Group mode specific
  group_exercise_type?: "main" | "accessory";
  participant_count?: number;
  resistance_unit_id?: number;
  height?: number | string;
  metadata?: Record<string, any>;
  db_id?: string; // Added for consistency
}

export interface ExerciseUIInstance {
  ui_id: string;
  exercise_definition_id: string;
  exercise_name: string;
  category: "gym" | "sprint" | "plyometric" | "isometric" | "circuit" | "drill";
  current_section_id: string;
  position_in_section: number;
  set_details: ExerciseUISetDetail[];
  // Optional: Add db_id if exercises can be saved/loaded
  db_id?: string;
  // Superset linking
  superset_ui_id?: string | null;
  position_in_superset?: number | null;
  session_db_id?: string; // Added for StepTwoPlanner annd useMesoWizardState
  // Group mode specific
  target_participants?: "all" | "specific_group";
  participant_group_id?: string;
  notes?: string;
}

export interface ExerciseDefinitionBase {
  id: string;
  name: string;
  category: "gym" | "sprint" | "plyometric" | "isometric" | "circuit" | "drill";
  description?: string;
  videoUrl?: string;
  config?: Record<string, any>;
  equipment?: string[];
  muscleGroups?: string[];
  forceType?: string;
  tags?: string[];
}

export interface ReorderPayload {
  operationType:
    | "reorder-sections"
    | "reorder-items-in-section"
    | "reorder-items-in-superset"
    | "move-item-to-section"
    | "move-item-to-superset"
    | "move-item-from-superset-to-section";
  sessionId?: string; // For reorder-sections
  newSectionOrder?: string[]; // For reorder-sections
  sectionId?: string; // For reorder-items-in-section, move-item-to-section (source for move)
  supersetId?: string; // For reorder-items-in-superset
  itemId?: string; // For reorder-items-in-section, reorder-items-in-superset, move-item-to-section
  newPosition?: number; // For reorder-items-in-section, reorder-items-in-superset, move-item-to-section
  sourceSectionId?: string; // For move-item-to-section
  targetSectionId?: string; // For move-item-to-section
  // Keep original fields for compatibility if they are still used elsewhere, or remove if fully replaced
  activeId?: string; // Consider if this is active.id (itemId)
  targetId?: string | null;
  sourceContainerId?: string;
  targetContainerId?: string;
}

export interface ModeSpecificSections {
  individual: SectionActiveInstance[];
  group: SectionActiveInstance[];
}

// Stub for FormData - define properly based on wizard needs
export interface FormData {
  [key: string]: any; 
}

// Stub for ErrorObjectType - define properly based on error handling needs
export interface ErrorObjectType {
  [key: string]: string | null;
}

export type SessionSections = Record<string, ModeSpecificSections>;

export interface SortableDndItemProps {
  id: string; // The unique ID for the draggable item (can be section.ui_id, exercise.ui_id, etc.)
  children: React.ReactNode;
  itemType: "section" | "exercise" | "superset"; // Type of the draggable item
  itemData: SectionActiveInstance | ExerciseUIInstance | any; // Adjust 'any' to SupersetUIInstance if defined
  sectionId?: string; // ID of the section this item belongs to or represents
  supersetId?: string; // ID of the superset this item belongs to (if it's an exercise in a superset)
  className?: string; // Optional additional class names
}

export interface WeeklyProgressionData {
  week: number;
  intensity: number;
  volume: number;
} 