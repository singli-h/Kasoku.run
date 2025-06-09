"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { arrayMove } from "@dnd-kit/sortable"
import { useSession } from "@clerk/nextjs"
import useSWRImmutable from 'swr/immutable';
import useSWR from 'swr';
import { toast } from "@/components/ui/use-toast";
// import { klient } from "@/lib/server/klient"; // Temporarily commented out
import { useMesoSessionPlannerState, type MesoSessionPlannerStateReturn } from "./useMesoSessionPlannerState";
import { loadWizardProgress, saveWizardProgress } from '@/lib/localStorageManager'; // Added saveWizardProgress import
import { z } from "zod"; // Added Zod import
import { useRouter, useSearchParams } from "next/navigation";

import type {
  BaseSession,
  SectionActiveInstance,
  ExerciseUIInstance,
  ExerciseDefinitionBase,
  ExerciseUISetDetail,
  ReorderPayload,
  ModeSpecificSections,
  // FormData, // This is the global FormData, not ours - already commented
  WeeklyProgressionData, // Added this import
  // Assuming types for SWR fetched data might be needed here or defined inline
  // AthleteGroup, UserRole, AthleteProfile, AISuggestion
  // MesoCycle as PrismaMesoCycle, // Removed, not exported from exercise-planner.ts
} from "@/types/exercise-planner"

// Extended Session type for UI purposes, including ui_id and ensuring type matches sessionMode
interface PlannerSessionWithUiId extends BaseSession {
  ui_id: string;
  type: "individual" | "group"; // Consistent with sessionMode, but more explicit for UI logic
  position: number; // Added for UI ordering
}

// Custom Error for API failures
class ApiError extends Error {
  status: number;
  info?: any;
  constructor(message: string, status: number, info?: any) {
    super(message);
    this.name = 'ApiError'; // Optional: for better identification
    this.status = status;
    this.info = info;
  }
}

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

const fetcherWithToken = async (url: string, token: string | null | undefined, options?: RequestInit) => {
  if (!token) throw new ApiError('No token provided for authenticated fetch', 401);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    ...options,
  });
  if (!res.ok) {
    let errorInfo;
    try {
      errorInfo = await res.json(); 
    } catch (e) {
      // Ignore if res.json() fails, info will be undefined
    }
    throw new ApiError('An API error occurred while fetching the data.', res.status, errorInfo);
  }
  return res.json();
};

// Renamed FormData to avoid conflict with global FormData
export interface MesoWizardFormData {
  name: string;
  description: string;
  weeks: number;
  startDate: string;
  goal: "strength" | "hypertrophy" | "endurance" | "power" | "sport_specific" | "general_fitness";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  sessions: PlannerSessionWithUiId[]; // Use the extended session type
  sessionDays: Record<string, string | null>;
  sessionSections: Record<string, ModeSpecificSections>;
  exercises: ExerciseUIInstance[];
  exerciseOrder: Record<string, string[]>;
  progressionModel?: string | undefined;
  progressionValue?: number | string | undefined;
  planType?: "mesocycle" | "microcycle" | "macrocycle";
  sessionsPerWeek?: string | number; // Added for microcycle
  duration?: string | number; // Added for microcycle (typically fixed to 1)
  intensity?: string | number; // Added
  volume?: string | number; // Added
  weeklyProgression?: WeeklyProgressionData[]; // Added
  athleteGroupId?: string | number | undefined; // Made optional
}

// Define Props interface for useMesoWizardState
interface UseMesoWizardStateProps {
  mesoCycleId?: string;
  planId?: string;
  initialMesoCycleData?: MesoCycleWithSessionsDetails | null;
  onFormSubmitSuccess?: (id: string) => void;
  initialExercises?: ExerciseDefinitionBase[]; 
  allAvailableExercises: ExerciseDefinitionBase[]; 
  groups?: any[]; 
  groupLoading?: boolean; 
  userRole?: string;
  roleLoading?: boolean;
  athleteProfile?: any; 
  profileLoading?: boolean;
}

// Define MesoWizardStateReturn interface
export interface MesoWizardStateReturn {
  currentStep: number;
  setCurrentStep: (step: number | ((prevStep: number) => number)) => void;
  formData: MesoWizardFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isFetchingInitialData: boolean;
  isSubmitting: boolean;
  isClerkSessionLoaded: boolean;
  isClerkSignedIn: boolean;
  clerkToken: string | null;
  activeSessionId: string | null;
  currentMode: "individual" | "group";
  sessionNavigation: SessionNavItem[];
  stepTwoTitle: string;

  // Functions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  handleInputChange: <K extends keyof Omit<MesoWizardFormData, 'sessions' | 'sessionDays' | 'sessionSections' | 'exercises' | 'exerciseOrder'>>(field: K, value: MesoWizardFormData[K]) => void;
  handleSessionDayChange: (day: string, sessionId: string | null) => void;
  addSession: (type: "individual" | "group", day?: string) => void;
  removeSession: (sessionId: string) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  updateSessionDetails: (sessionId: string, updates: Partial<PlannerSessionWithUiId>) => void;
  handleSubmit: () => Promise<void>;
  resetToInitialMesoCycleState: () => void;
  
  progressionModel?: string | undefined;
  progressionValue?: number | string | undefined;
  handleProgressionModelChange: (value: string) => void;
  handleProgressionValueChange: (value: number | string) => void;

  // Exercise Management Functions (delegated from sessionPlannerState)
  addExercise: (exerciseDefinition: ExerciseDefinitionBase, targetSectionUiId: string) => void;
  deleteExercise: (exerciseUiId: string) => void;
  updateExercise: (exerciseUiId: string, field: keyof ExerciseUIInstance | string, value: any) => void;
  reorderExercises: (payload: ReorderPayload) => void;
  availableExercises: ExerciseDefinitionBase[];

  sessionPlannerState: MesoSessionPlannerStateReturn;
  // Add missing SWR data fields for clarity, even if not fully populated by this hook yet
  // This helps with type consistency if MesoWizard expects them.
  // These would ideally be populated if useMesoWizardState was responsible for fetching them.
  // These would ideally be populated if useMesoWizardState was responsible for fetching them.
  aiSuggestions?: unknown | null; // TODO: Define a specific type
  feedbackText?: string; // from original MesoWizard state
}

// Define other supporting interfaces that might have been inline before
interface SessionNavItem {
  id: string;
  name: string;
  type: "individual" | "group";
  day: string;
}

// Local MesoCycle interface, ensure it covers all fields needed for wizard state and submission
interface MesoCycle { 
  id: string;
  name: string;
  description?: string | null;
  weeks: number;
  start_date: string | Date; // Input is string, but can be Date from DB
  goal: string;
  experience_level: string;
  user_id?: string; // Optional if creating new and not yet assigned
  created_at?: Date;
  updated_at?: Date;
  sessions: PlannerSessionWithUiId[]; // Use the UI-aware session type
  progression_model?: string | null;
  progression_value?: string | number | null; 
  planType?: "mesocycle" | "microcycle" | "macrocycle"; // Added planType here
  sessionsPerWeek?: string | number; // Added for microcycle data
  duration?: string | number; // Added for microcycle data
  intensity?: string | number; // Added
  volume?: string | number; // Added
  weeklyProgression?: WeeklyProgressionData[]; // Added
  athleteGroupId?: string | number | undefined; // Made optional
}

// This interface is for the initialMesoCycleData prop, which might include more details
interface MesoCycleWithSessionsDetails extends Omit<MesoCycle, 'sessions'> {
  sessions: PlannerSessionWithUiId[]; // Ensure this uses the UI-aware session type
  session_sections?: Record<string, ModeSpecificSections>;
  exercises?: ExerciseUIInstance[];
  exercise_order?: Record<string, string[]>;
  // progression_model and progression_value are already in MesoCycle, inherited via Omit
  // sessionsPerWeek and duration are also inherited from MesoCycle
}

// Type for session data expected from API
interface ApiSession {
  id: string; 
  name?: string; // from BaseSession
  weekday?: string; // from BaseSession
  description?: string; // from BaseSession
  date?: string; // from BaseSession
  sessionMode?: "individual" | "group"; // Optional, as loading logic has a fallback
  position?: number;
  // Add any other fields specifically from the API not in BaseSession
}

// Zod Schemas for Validation
const StepPlanSelectionSchema = z.object({
  planType: z.enum(["mesocycle", "microcycle", "macrocycle"], {
    required_error: "Please select a plan type.",
  }),
});

const StepOneOverviewSchema = z.object({
  name: z.string().min(1, "Plan name is required."),
  goal: z.enum(["strength", "hypertrophy", "endurance", "power", "sport_specific", "general_fitness"], {
    required_error: "Goal is required.",
  }),
  startDate: z.string().min(1, "Start date is required."),
  weeks: z.number().min(1, "Duration must be at least 1 week.").max(52, "Duration cannot exceed 52 weeks."),
  sessionsPerWeek: z.number().optional(),
  duration: z.number().optional(),
  planType: z.enum(["mesocycle", "microcycle", "macrocycle"]).optional(),
}).refine(data => {
  if (data.planType === 'microcycle') {
    return data.sessionsPerWeek !== undefined && data.sessionsPerWeek >= 1 && data.sessionsPerWeek <= 7 &&
           data.duration !== undefined && data.duration >= 1 && data.duration <= 8;
  }
  return true;
}, {
  message: "For microcycles, sessions per week (1-7) and duration (1-8 weeks) are required.",
  // path: ['sessionsPerWeek', 'duration'], // This refine message applies generally if it fails.
                                        // Individual field errors will come from base schema if types are wrong.
});

const StepTwoPlannerSchema = z.object({
  sessions: z.array(z.object({
    ui_id: z.string(),
    name: z.string().min(1, "Session name is required."),
    type: z.enum(["individual", "group"]),
    weekday: z.string().min(1, "Session must be assigned to a weekday."),
    description: z.string().optional(),
  })).min(1, "At least one session is required."),
  sessionSections: z.record(z.string(), z.any()).optional(), // Complex nested structure, validate at component level
  exercises: z.array(z.any()).optional(), // Complex structure, validate at component level
  progressionModel: z.string().optional(),
  progressionValue: z.union([z.string(), z.number()]).optional(),
}).refine(data => {
  // If progression model is set, value should also be set
  if (data.progressionModel && !data.progressionValue) {
    return false;
  }
  return true;
}, {
  message: "Progression value is required when progression model is selected.",
  path: ["progressionValue"],
});

const StepThreeConfirmationSchema = z.object({
  // All fields from previous steps should be valid
  name: z.string().min(1, "Plan name is required."),
  goal: z.enum(["strength", "hypertrophy", "endurance", "power", "sport_specific", "general_fitness"]),
  startDate: z.string().min(1, "Start date is required."),
  weeks: z.number().min(1).max(52),
  sessions: z.array(z.object({
    ui_id: z.string(),
    name: z.string().min(1),
    type: z.enum(["individual", "group"]),
    weekday: z.string().min(1),
  })).min(1, "At least one session is required."),
  // Final validation - ensure all sessions have assigned days
}).refine(data => {
  return data.sessions.every(session => session.weekday && session.weekday !== "Unassigned");
}, {
  message: "All sessions must be assigned to specific weekdays.",
  path: ["sessions"],
});

const INITIAL_FORM_DATA: MesoWizardFormData = {
  name: "",
  description: "",
  weeks: 4,
  startDate: (() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  })() as string,
  goal: "strength",
  experienceLevel: "beginner",
  sessions: [],
  sessionDays: {},
  // Fields managed by useMesoSessionPlannerState, initialized here but primarily controlled by it
  sessionSections: {},
  exercises: [], 
  exerciseOrder: {},
  // For Step 2 Overview - MesoCycle level progression settings
  progressionModel: undefined,
  progressionValue: undefined,
  planType: "mesocycle", // Set default planType
  sessionsPerWeek: "3", 
  duration: "4", 
  intensity: "5", 
  volume: "5", 
  weeklyProgression: [], 
  athleteGroupId: undefined, 
};

export function useMesoWizardState({
  mesoCycleId,
  planId,
  initialMesoCycleData,
  onFormSubmitSuccess,
  initialExercises,
  allAvailableExercises,
  groups: propsGroups,
  groupLoading,
  userRole,
  roleLoading,
  athleteProfile,
  profileLoading,
}: UseMesoWizardStateProps): MesoWizardStateReturn {
  const { session: clerkSession, isLoaded: isClerkSessionLoaded, isSignedIn: isClerkSignedIn } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clerkToken, setClerkToken] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MesoWizardFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false); // General loading state
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSessionIdState, setActiveSessionIdState] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<unknown | null>(null); // TODO: Define specific type
  const [feedbackText, setFeedbackText] = useState<string>("");

  // const { data: groupsData, error: groupsError, isLoading: groupLoading } = useSWR(
  //   clerkToken ? ['/api/athlete-groups', clerkToken] : null,
  //   ([url, token]) => fetcherWithToken(url, token)
  // );
  // const { data: presetGroupsData, error: presetGroupsError, isLoading: presetGroupsLoading } = useSWR(
  //   clerkToken ? ['/api/plans/preset-groups', clerkToken] : null, 
  //   ([url, token]) => fetcherWithToken(url, token)
  // );
  // Removed re-declarations of groupLoading etc.

  useEffect(() => {
    if (isClerkSessionLoaded && isClerkSignedIn && clerkSession) {
      clerkSession.getToken().then(setClerkToken);
    }
  }, [isClerkSessionLoaded, isClerkSignedIn, clerkSession]);

  const currentMode = useMemo(() => {
    if (!activeSessionIdState) return "individual";
    const activeSess: PlannerSessionWithUiId | undefined = formData.sessions.find(s => s.ui_id === activeSessionIdState); 
    return activeSess?.type === "group" ? "group" : "individual"; 
  }, [activeSessionIdState, formData.sessions]);

  // Memoize callbacks for sessionPlannerState
  const onExercisesChange = useCallback((newExercises: ExerciseUIInstance[]) => {
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  }, [setFormData]); // setFormData is stable from useState

  const onSessionSectionsChange = useCallback((newSections: Record<string, ModeSpecificSections>) => {
    setFormData(prev => ({ ...prev, sessionSections: newSections }));
  }, [setFormData]); // setFormData is stable

  const onExerciseOrderChange = useCallback((newOrder: Record<string, string[]>) => {
    setFormData(prev => ({ ...prev, exerciseOrder: newOrder }));
  }, [setFormData]); // setFormData is stable

  // Initialize and manage session planning state using the new hook
  const sessionPlannerState = useMesoSessionPlannerState({
    activeSessionId: activeSessionIdState,
    currentMode,
    initialExercises: (initialExercises || formData.exercises) as ExerciseUIInstance[],
    initialSessionSections: formData.sessionSections,
    initialExerciseOrder: formData.exerciseOrder,
    availableExercises: allAvailableExercises, // Pass the full list from props
    onExercisesChange: onExercisesChange, // Use memoized callback
    onSessionSectionsChange: onSessionSectionsChange, // Use memoized callback
    onExerciseOrderChange: onExerciseOrderChange, // Use memoized callback
  });

  // --- Data Fetching and Initialization ---
  useEffect(() => {
    const loadInitialData = async () => {
      if (!clerkToken) return;
      setIsFetchingInitialData(true);
      try {
        let dataToLoad: MesoCycleWithSessionsDetails | null = initialMesoCycleData || null;

        if (!dataToLoad && mesoCycleId) {
          const res = await fetcherWithToken(`/api/mesocycles/${mesoCycleId}`, clerkToken);
          dataToLoad = res.data;
        } else if (!dataToLoad && planId) {
          const res = await fetcherWithToken(`/api/plans/${planId}`, clerkToken);
          dataToLoad = res.data;
        }

        if (dataToLoad) {
          setFormData(prev => ({
            ...prev,
            name: dataToLoad.name || prev.name,
            description: dataToLoad.description || prev.description,
            weeks: dataToLoad.weeks || prev.weeks,
            startDate: (dataToLoad.start_date ? new Date(dataToLoad.start_date).toISOString().split('T')[0] : prev.startDate) || INITIAL_FORM_DATA.startDate,
            goal: dataToLoad.goal as MesoWizardFormData['goal'] || prev.goal,
            experienceLevel: dataToLoad.experience_level as MesoWizardFormData['experienceLevel'] || prev.experienceLevel,
            sessions: dataToLoad.sessions?.map(s => ({
                ...s,
              ui_id: s.ui_id || uuidv4(),
              name: s.name || `Session ${s.position + 1}`,
              description: s.description || "",
              weekday: s.weekday || "Unassigned",
              type: s.type || "individual",
              sessionMode: s.sessionMode || (s.type === "group" ? "group" : "individual"),
            })) || prev.sessions,
            sessionDays: dataToLoad.sessions?.reduce((acc, s, index) => {
              if (s.weekday) acc[s.ui_id || String(index)] = s.weekday;
              return acc;
            }, {} as Record<string, string | null>) || prev.sessionDays,
            progressionModel: dataToLoad.progression_model || prev.progressionModel,
            progressionValue: dataToLoad.progression_value || prev.progressionValue,
            planType: dataToLoad.planType || prev.planType || "mesocycle",
            sessionsPerWeek: String(dataToLoad.sessionsPerWeek || dataToLoad.sessions?.length || prev.sessionsPerWeek || 3),
            duration: String(dataToLoad.duration || prev.duration || 4),
            intensity: String(dataToLoad.intensity || prev.intensity || 5),
            volume: String(dataToLoad.volume || prev.volume || 5),
            weeklyProgression: dataToLoad.weeklyProgression || prev.weeklyProgression || [],
            athleteGroupId: dataToLoad.athleteGroupId || prev.athleteGroupId,
          }));
          if (dataToLoad.sessions && dataToLoad.sessions.length > 0) {
            setActiveSessionIdState((dataToLoad.sessions[0]?.ui_id || dataToLoad.sessions[0]?.id) ?? null);
          }
        }
      } catch (error) {
        console.error("Failed to load initial mesocycle data:", error);
        toast({ title: "Error", description: "Failed to load initial plan data.", variant: "destructive" });
      }
      setIsFetchingInitialData(false);
    };

    if (clerkToken && (mesoCycleId || planId || initialMesoCycleData)) {
      loadInitialData();
    }
  }, [clerkToken, mesoCycleId, planId, initialMesoCycleData]);
  
  // --- UI & Interaction State ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Note: sessions, sessionSections, exercises, exerciseOrder are now managed in formData only

  // --- SWR Fetched State ---
  const { data: exerciseApiResult, error: exerciseError, isLoading: loadingExercisesSWR } = useSWRImmutable<any, any>(
    clerkToken ? '/api/plans/exercises' : null,
    (url: string) => fetcherWithToken(url, clerkToken)
  );
  useEffect(() => {
    const apiData = (exerciseApiResult as any)?.data;
    if (apiData?.exercises) {
      const exercisesFromAPI: ExerciseDefinitionBase[] = apiData.exercises.map((ex: any) => ({
        id: ex.id.toString(), // Ensure ID is string
        name: ex.name,
        category: ex.type, 
        description: ex.description,
        videoUrl: ex.videoUrl,
        // Ensure all fields from ExerciseDefinitionBase are mapped or optional
        config: ex.config || {}, 
        equipment: ex.equipment || [],
        muscleGroups: ex.muscle_groups || [],
        forceType: ex.force_type,
        tags: ex.tags || [],
      }));
      // setAvailableExercises(exercisesFromAPI);
    }
  }, [exerciseApiResult]);

  // Provide fallback empty arrays for data that would come from SWR
  const groupsData = null; // Fallback
  const groupsError = null; // Fallback
  const presetGroupsData = null; // Fallback
  const presetGroupsError = null; // Fallback
  const presetGroupLoading = false; // Fallback
  const allExercisesData = { data: allAvailableExercises || [] }; // Use prop or empty array
  const allExercisesError = null; // Fallback
  const allExercisesLoading = false; // Fallback

  // Use props values or fallbacks
  const groups = propsGroups || []; // Use prop or fallback
  const presetGroups: any[] = []; // Fallback

  // --- Derived State ---
  const activeSession = formData.sessions.find((s) => s.ui_id === activeSessionIdState)
  const activeSections = activeSessionIdState ? formData.sessionSections[activeSessionIdState]?.[currentMode] || [] : []
  const progressPercentage = ((currentStep - 1) / 3) * 100; // Assuming 4 steps total, 3 transitions

  const filteredExercisesFromSearch = allAvailableExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.category && ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredExercisesForDisplay = formData.exercises.filter((exercise) => {
    if (!activeSessionIdState) return false;
    const currentSessionSections = formData.sessionSections[activeSessionIdState]?.[currentMode] || [];
    const isInActiveSection = currentSessionSections.some((section) => section.ui_id === exercise.current_section_id)
    if (!isInActiveSection) return false
    if (currentMode === "group") return exercise.category === "sprint"
    return true
  })

  const filteredAvailableExercisesFromState = // This one is for the exercise picker based on mode
    currentMode === "group"
      ? allAvailableExercises.filter((ex) => ex.category === "sprint")
      : allAvailableExercises;

  const availableSectionTypes =
    currentMode === "group" ? ["sprint"] : ["warmup", "gym", "plyometric", "isometric", "circuit", "sprint", "drill"];

  // --- LocalStorage Caching ---
  const cachedData = loadWizardProgress();
  useEffect(() => {
    if (cachedData) {
        // Fix: Check for valid currentStep values (1-4), not just truthy
      if(cachedData.currentStep && cachedData.currentStep >= 1 && cachedData.currentStep <= 4) {
        setCurrentStep(cachedData.currentStep);
      }
      if(cachedData.formData) setFormData(cachedData.formData);
      if(cachedData.activeSessionId) setActiveSessionIdState(cachedData.activeSessionId);
      if(cachedData.feedbackText) setFeedbackText(cachedData.feedbackText);
    } else {
      // If no cached data (or version mismatch/corruption), ensure state is reset to initial/default.
      // This might involve calling a reset function if formData can be complex, or simply setting INITIAL_FORM_DATA.
      // For now, assuming initial state is handled by useState defaults and initial data fetching logic.
      // If `initialMesoCycleData` is present, that will take precedence over cache/defaults anyway.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    // Save state to localStorage whenever these dependencies change
    saveWizardProgress({
      currentStep,
      formData,
      activeSessionId: activeSessionIdState,
      feedbackText,
    });
  }, [currentStep, formData, activeSessionIdState, feedbackText]);

  // --- Event Handlers (will be refactored chunk by chunk) ---
  const handleInputChange = useCallback(<K extends keyof Omit<MesoWizardFormData, 'sessions' | 'sessionDays' | 'sessionSections' | 'exercises' | 'exerciseOrder'>>(field: K, value: MesoWizardFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handleProgressionModelChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, progressionModel: value, progressionValue: undefined }));
    if (errors.progressionModel) setErrors(prev => ({ ...prev, progressionModel: ""}));
    if (errors.progressionValue) setErrors(prev => ({ ...prev, progressionValue: ""}));
  }, [errors]);

  const handleProgressionValueChange = useCallback((value: number | string) => {
    setFormData(prev => ({ ...prev, progressionValue: value }));
    if (errors.progressionValue) setErrors(prev => ({ ...prev, progressionValue: ""}));
  }, [errors]);

  const handleSessionDayChange = useCallback((day: string, sessionId: string | null) => {
    setFormData(prev => {
      const newSessionDays = { ...prev.sessionDays };
      // Clear existing assignment for this session if it's being moved
      Object.keys(newSessionDays).forEach(key => {
        if (newSessionDays[key] === sessionId && sessionId !== null) {
          newSessionDays[key] = null;
        }
      });
      // Assign or unassign the session to the new day
      newSessionDays[day] = sessionId;
      // Also update the session's weekday property if assigned
      const updatedSessions = prev.sessions.map(s => {
        if (s.ui_id === sessionId) {
          return { ...s, weekday: sessionId ? day : "" }; // Empty string or null for unassigned
        }
        return s;
      });
      return { ...prev, sessionDays: newSessionDays, sessions: updatedSessions };
    });
  }, []);

  const addSession = useCallback((sessionType: "individual" | "group", day?: string) => {
    const newSessionUiId = uuidv4();
    const newSession: PlannerSessionWithUiId = {
      ui_id: newSessionUiId,
      id: "", // DB id will be set on save
      name: sessionType === "group" ? "New Group Session" : "New Individual Session",
      type: sessionType,
      sessionMode: sessionType, // Sync with type
      weekday: day || "", 
      position: formData.sessions.length, // position is 0-indexed length
      description: "",
    };
    setFormData(prev => {
      const updatedSessions = [...prev.sessions, newSession];
      const updatedSessionDays = { ...prev.sessionDays };
      if (day) {
        updatedSessionDays[day] = newSessionUiId;
      }
      // Initialize empty structures for the new session in sessionSections and exerciseOrder
      // The sub-hook (sessionPlannerState) will manage the actual content of these for the active session
      const updatedSessionSections = {
        ...prev.sessionSections,
        [newSessionUiId]: { individual: [], group: [] } 
      };
      // ExerciseOrder might not need explicit init here if sub-hook handles it based on active session
      return { 
        ...prev, 
        sessions: updatedSessions, 
        sessionDays: updatedSessionDays,
        sessionSections: updatedSessionSections,
        // exerciseOrder remains as is, sub-hook will manage for active session sections
      };
    });
    setActiveSessionIdState(newSessionUiId); // Auto-activate new session
  }, [formData.sessions]);

  const removeSession = useCallback((sessionIdToRemove: string) => {
    setFormData(prev => {
      const newSessions = prev.sessions.filter(s => s.ui_id !== sessionIdToRemove);
      const newSessionDays = { ...prev.sessionDays };
      Object.keys(newSessionDays).forEach(key => {
        if (newSessionDays[key] === sessionIdToRemove) {
          newSessionDays[key] = null;
        }
      });
      // Remove associated sessionSections and exerciseOrder entries
      const { [sessionIdToRemove]: _removedSectionData, ...remainingSessionSections } = prev.sessionSections;
      const newExerciseOrder = { ...prev.exerciseOrder };
      Object.keys(newExerciseOrder).forEach(key => {
          if (key.startsWith(`${sessionIdToRemove}-`)) {
              delete newExerciseOrder[key];
          }
      });
      // Exercises are managed by the sub-hook based on current sections; 
      // when sections are removed (implicitly by removing from sessionSections),
      // the sub-hook should handle filtering out orphaned exercises from its own state (formData.exercises).
      // So, no direct manipulation of prev.exercises here is strictly needed IF the sub-hook is robust.
      // However, to be safe, explicitly filter exercises whose sections are gone.
      const remainingExercises = prev.exercises.filter(ex => {
          const sectionStillExists = Object.values(remainingSessionSections).some(modeSections => 
              (modeSections.individual.some(s => s.ui_id === ex.current_section_id) || 
               modeSections.group.some(s => s.ui_id === ex.current_section_id))
          );
          return sectionStillExists;
      });

      return { 
          ...prev, 
          sessions: newSessions, 
          sessionDays: newSessionDays, 
          sessionSections: remainingSessionSections, 
          exercises: remainingExercises, // Pruned exercises
          exerciseOrder: newExerciseOrder 
        };
    });
    if (activeSessionIdState === sessionIdToRemove) {
      setActiveSessionIdState(null);
    }
  }, [activeSessionIdState]);

  const updateSessionDetails = useCallback((sessionId: string, updates: Partial<PlannerSessionWithUiId>) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.ui_id === sessionId ? { ...s, ...updates } : s),
    }));
  }, []);

  const setActiveSessionId = useCallback((sessionId: string | null) => {
    setActiveSessionIdState(sessionId);
  }, []);

  // --- Navigation & Validation (Refactored) ---
  const validateStep = useCallback((
    stepToValidate: number, 
    currentFormData: MesoWizardFormData, 
    sessionDetailsValidator: () => Record<string, string>
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    switch (stepToValidate) {
      case 1: // Plan Selection Step
        try {
          StepPlanSelectionSchema.parse({
            planType: currentFormData.planType,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              const path = err.path.join('.');
              newErrors[path] = err.message;
            });
          }
        }
        break;
        
      case 2: // Overview/Setup Step
        try {
          const dataToValidate = {
            name: currentFormData.name,
            goal: currentFormData.goal,
            startDate: currentFormData.startDate,
            weeks: currentFormData.weeks,
            sessionsPerWeek: typeof currentFormData.sessionsPerWeek === 'string' 
              ? parseInt(currentFormData.sessionsPerWeek, 10) 
              : currentFormData.sessionsPerWeek,
            duration: typeof currentFormData.duration === 'string' 
              ? parseInt(currentFormData.duration, 10) 
              : currentFormData.duration,
            planType: currentFormData.planType,
          };
          StepOneOverviewSchema.parse(dataToValidate);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              const path = err.path.join('.');
              newErrors[path] = err.message;
            });
          }
        }
        break;
        
      case 3: // Planning Step
        try {
          const dataToValidate = {
            sessions: currentFormData.sessions.map(s => ({
              ui_id: s.ui_id,
              name: s.name,
              type: s.type,
              weekday: s.weekday || "Unassigned",
              description: s.description,
            })),
            sessionSections: currentFormData.sessionSections,
            exercises: currentFormData.exercises,
            progressionModel: currentFormData.progressionModel,
            progressionValue: currentFormData.progressionValue,
          };
          StepTwoPlannerSchema.parse(dataToValidate);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              const path = err.path.join('.');
              newErrors[path] = err.message;
            });
          }
        }
        
        // Additional session-specific validation from sessionPlannerState
        if (!activeSessionIdState) {
          newErrors.activeSession = "No active session selected to plan.";
        } else {
          const sessionValidationErrors = sessionDetailsValidator();
          Object.assign(newErrors, sessionValidationErrors);
        }
        break;
        
      case 4: // Confirmation Step
        try {
          const dataToValidate = {
            name: currentFormData.name,
            goal: currentFormData.goal,
            startDate: currentFormData.startDate,
            weeks: currentFormData.weeks,
            sessions: currentFormData.sessions.map(s => ({
              ui_id: s.ui_id,
              name: s.name,
              type: s.type,
              weekday: s.weekday || "Unassigned",
            })),
          };
          StepThreeConfirmationSchema.parse(dataToValidate);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              const path = err.path.join('.');
              newErrors[path] = err.message;
            });
          }
        }
        break;
        
      default:
        break;
    }
    
    return newErrors;
  }, [activeSessionIdState]);

  const nextStep = useCallback(() => {
    const currentStepErrors = validateStep(currentStep, formData, sessionPlannerState.validateSessionDetails);
    if (Object.keys(currentStepErrors).length === 0) {
      setErrors({});
      if (currentStep < 4) setCurrentStep(s => s + 1);
    } else {
      setErrors(currentStepErrors);
      toast({ title: "Validation Error", description: "Please correct the errors before proceeding.", variant: "destructive" });
    }
  }, [currentStep, formData, sessionPlannerState.validateSessionDetails, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
        if (step > currentStep) {
            let allValid = true;
            for (let i = currentStep; i < step; i++) {
                const stepErrors = validateStep(i, formData, sessionPlannerState.validateSessionDetails);
                if (Object.keys(stepErrors).length > 0) {
                    setErrors(stepErrors);
                    toast({ title: "Validation Error", description: `Please correct errors in step ${i} before proceeding.` });
                    allValid = false;
                    break;
                }
            }
            if (allValid) {
        setCurrentStep(step);
    }
          } else {
            setCurrentStep(step); // Allow going back without validation
        }
    }
  }, [currentStep, formData, sessionPlannerState.validateSessionDetails, validateStep]);

  const handleSubmit = async () => {
    if (!clerkToken) {
      toast({ title: "Error", description: "Authentication token not available. Please sign in.", variant: "destructive" });
      return;
    }
    const submissionErrors = validateStep(currentStep, formData, sessionPlannerState.validateSessionDetails); // Validate final step or all
    if (Object.keys(submissionErrors).length > 0) {
      setErrors(submissionErrors);
      toast({ title: "Submission Error", description: "Please correct the highlighted errors.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const apiEndpoint = mesoCycleId ? '/api/mesocycles/updateMesoCycle' : '/api/mesocycles/createMesoCycle';
      const method = mesoCycleId ? 'PUT' : 'POST';
      
      // Prepare the payload, ensuring sessions are structured correctly
      // The API expects `sessions` to be an array of session objects directly under the mesocycle.
      // It also expects section and exercise details to be part of these session objects if they are being created/updated.
      // For simplicity, this example assumes the API handles linking/updating based on provided IDs.
      
      // Construct payload based on MesoCycle interface but ensure all wizard fields are considered
      const payload: Omit<MesoCycle, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { id?: string } = {
        name: formData.name,
        description: formData.description,
        weeks: formData.weeks,
      start_date: formData.startDate, 
        goal: formData.goal,
      experience_level: formData.experienceLevel,
        sessions: formData.sessions.map(s => ({ 
            id: s.id, 
            ui_id: s.ui_id, 
            name: s.name,
            description: s.description || "",
            weekday: s.weekday,
            type: s.type, 
            sessionMode: s.sessionMode || (s.type === "group" ? "group" : "individual"), 
            position: s.position,
            session_sections: formData.sessionSections[s.ui_id], 
            exercises: formData.exercises.filter(ex => {
                const sectionContainer = formData.sessionSections[s.ui_id];
                if (!sectionContainer) return false;
                const sectionsForMode = sectionContainer[s.sessionMode || (s.type === "group" ? "group" : "individual")];
                return sectionsForMode && sectionsForMode.some(sec => sec.ui_id === ex.current_section_id);
            }),
            exercise_order: formData.exerciseOrder, 
        })),
      progression_model: formData.progressionModel,
      progression_value: formData.progressionValue,
        intensity: formData.intensity,
        volume: formData.volume,
        weeklyProgression: formData.weeklyProgression,
        athleteGroupId: formData.athleteGroupId,
      };

      if (formData.planType) {
        payload.planType = formData.planType;
      }
      if (formData.sessionsPerWeek) {
        payload.sessionsPerWeek = typeof formData.sessionsPerWeek === 'string' ? parseInt(formData.sessionsPerWeek, 10) : formData.sessionsPerWeek;
      }
      if (formData.duration) {
        payload.duration = typeof formData.duration === 'string' ? parseInt(formData.duration, 10) : formData.duration;
      }

      if (mesoCycleId) {
        payload.id = mesoCycleId;
      }
      
      const response = await fetcherWithToken(apiEndpoint, clerkToken as string, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response && response.data && response.data.id) {
        toast({ title: "Success", description: `MesoCycle ${mesoCycleId ? 'updated' : 'created'} successfully!` });
        if (onFormSubmitSuccess) {
          onFormSubmitSuccess(response.data.id);
        }
        // Optionally reset form or navigate
      } else {
        // This case might indicate a successful request (2xx) but no ID in response, which could be an issue
        throw new ApiError(response.message || "Failed to save MesoCycle. No ID returned.", response.status || 500, response.data);
      }
    } catch (error) {
      console.error("Error submitting MesoCycle:", error);
      const apiError = error as ApiError;
      toast({ 
        title: "Error", 
        description: apiError.message || "An unexpected error occurred.", 
        variant: "destructive" 
      });
      if (apiError.info && apiError.info.errors) {
        setErrors(apiError.info.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToInitialMesoCycleState = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setActiveSessionIdState(null);
    // Potentially reset sessionPlannerState too if it holds independent state
    // sessionPlannerState.resetState(); // Assuming such a method exists
  }, []);

  const sessionNavigation = useMemo(() => 
    formData.sessions.map(s => ({
        id: s.ui_id,
        name: s.name || `Session ${s.position + 1}`,
        type: s.type,
        day: s.weekday || "Unassigned"
    })).sort((a,b) => {
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'Unassigned'];
        return dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase());
    }), [formData.sessions]);

  const stepTwoTitle = useMemo(() => {
    if (formData.planType === "microcycle") return "Plan Your Week";
    return "MesoCycle Overview & Progression";
  }, [formData.planType]);


  // The actual return statement for useMesoWizardState
  return {
    currentStep,
    setCurrentStep,
    formData,
    errors,
    isLoading: isLoading || isFetchingInitialData || isSubmitting || (groupLoading ?? false),
    isFetchingInitialData,
    isSubmitting,
    isClerkSessionLoaded: isClerkSessionLoaded ?? false,
    isClerkSignedIn: isClerkSignedIn ?? false,
    clerkToken,
    activeSessionId: activeSessionIdState,
    currentMode,
    sessionNavigation,
    stepTwoTitle,

    // Functions
    nextStep,
    prevStep,
    goToStep,
    handleInputChange,
    handleSessionDayChange,
    addSession,
    removeSession,
    setActiveSessionId,
    updateSessionDetails,
    handleSubmit,
    resetToInitialMesoCycleState,

    progressionModel: formData.progressionModel,
    progressionValue: formData.progressionValue,
    handleProgressionModelChange,
    handleProgressionValueChange,

    // Exercise Management Functions (delegated from sessionPlannerState)
    addExercise: sessionPlannerState.handleAddExercise,
    deleteExercise: sessionPlannerState.handleDeleteExercise,
    updateExercise: sessionPlannerState.handleExerciseFieldChange,
    reorderExercises: sessionPlannerState.handleReorder,
    availableExercises: sessionPlannerState.filteredAvailableExercisesForPicker,

    sessionPlannerState,
    aiSuggestions: aiSuggestions,
    feedbackText: feedbackText,
  };
}
