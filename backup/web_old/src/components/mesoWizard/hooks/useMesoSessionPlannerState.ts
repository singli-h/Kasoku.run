"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";

import type {
  SectionActiveInstance,
  ExerciseUIInstance,
  ExerciseDefinitionBase,
  ExerciseUISetDetail,
  ReorderPayload,
  ModeSpecificSections,
} from "../types/exercisePlanner";
import type { PlannerSessionWithUiId } from "@/types/exercise-planner";

// Props for the new hook
interface UseMesoSessionPlannerStateProps {
  activeSessionId: string | null;
  currentMode: "individual" | "group";
  initialExercises: ExerciseUIInstance[];
  initialSessionSections: Record<string, ModeSpecificSections>;
  initialExerciseOrder: Record<string, string[]>;
  availableExercises: ExerciseDefinitionBase[]; // Full list from API
  onExercisesChange: (exercises: ExerciseUIInstance[]) => void;
  onSessionSectionsChange: (sections: Record<string, ModeSpecificSections>) => void;
  onExerciseOrderChange: (order: Record<string, string[]>) => void;
}

export function useMesoSessionPlannerState({
  activeSessionId,
  currentMode,
  initialExercises,
  initialSessionSections,
  initialExerciseOrder,
  availableExercises: allAvailableExercises, // Renamed to avoid conflict with filtered state
  onExercisesChange,
  onSessionSectionsChange,
  onExerciseOrderChange,
}: UseMesoSessionPlannerStateProps) {
  const [sessionSections, setSessionSectionsState] = useState<Record<string, ModeSpecificSections>>(initialSessionSections);
  const [exercises, setExercisesState] = useState<ExerciseUIInstance[]>(initialExercises);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [exerciseOrder, setExerciseOrderState] = useState<Record<string, string[]>>(initialExerciseOrder);
  
  // Propagate changes upwards
  useEffect(() => {
    onExercisesChange(exercises);
  }, [exercises, onExercisesChange]);

  useEffect(() => {
    onSessionSectionsChange(sessionSections);
  }, [sessionSections, onSessionSectionsChange]);

  useEffect(() => {
    onExerciseOrderChange(exerciseOrder);
  }, [exerciseOrder, onExerciseOrderChange]);


  // --- Derived State ---
  const activeSections = activeSessionId ? sessionSections[activeSessionId]?.[currentMode] || [] : [];

  const filteredAvailableExercisesFromSearch = allAvailableExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.category && ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredExercisesForDisplay = exercises.filter((exercise) => {
    if (!activeSessionId) return false;
    const currentSessionSectionsForFilter = sessionSections[activeSessionId]?.[currentMode] || [];
    const isInActiveSection = currentSessionSectionsForFilter.some((section) => section.ui_id === exercise.current_section_id);
    if (!isInActiveSection) return false;
    // if (currentMode === "group") return exercise.category === "sprint"; // This filtering might be too restrictive here, consider if Step2Planner needs all
    return true;
  });

  const filteredAvailableExercisesForPicker = // This one is for the exercise picker based on mode
    currentMode === "group"
      ? allAvailableExercises.filter((ex) => ex.category === "sprint") // Keep this for picker
      : allAvailableExercises;

  const availableSectionTypes =
    currentMode === "group" ? ["sprint"] : ["warmup", "gym", "plyometric", "isometric", "circuit", "sprint", "drill"];

  // Helper to create a default set structure
  const createDefaultSet = useCallback((): ExerciseUISetDetail => {
    const baseSet: ExerciseUISetDetail = {
      ui_id: uuidv4(),
      set_number: 0, // Will be updated when added
      rest: 60, // Default 60 seconds rest
    };
    
    // Add mode-specific defaults
    if (currentMode === "group") {
      baseSet.reps = 1;
      baseSet.distance = 100; // Default 100m for group/sprint exercises
      baseSet.effort = "85%"; // Default effort level
    } else {
      baseSet.reps = 8; // Default 8 reps for individual exercises
      baseSet.weight = 0; // Default weight (0 = bodyweight)
    }
    
    return baseSet;
  }, [currentMode]);

  const handleAddSection = useCallback((sectionType: string) => {
    if (!activeSessionId) return;

    const newSection: SectionActiveInstance = {
      ui_id: uuidv4(),
      type_id: sectionType,
      name: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      position: (sessionSections[activeSessionId]?.[currentMode]?.length || 0) + 1,
      is_expanded: true,
    };

    setSessionSectionsState(prev => ({
      ...prev,
      [activeSessionId]: {
        individual: prev[activeSessionId]?.individual || [],
        group: prev[activeSessionId]?.group || [],
        [currentMode]: [...(prev[activeSessionId]?.[currentMode] || []), newSection],
      },
    }));
  }, [activeSessionId, currentMode, sessionSections]);

  const handleDeleteSection = useCallback((sectionUiId: string) => {
    if (!activeSessionId) return;

    setExercisesState(prev => prev.filter(ex => ex.current_section_id !== sectionUiId));
    setExerciseOrderState(prev => {
      const newOrder = { ...prev };
      Object.keys(newOrder).forEach(key => {
        if (key.endsWith(`-${sectionUiId}`)) {
          delete newOrder[key];
        }
      });
      return newOrder;
    });

    setSessionSectionsState(prev => ({
      ...prev,
      [activeSessionId]: {
        individual: prev[activeSessionId]?.individual || [],
        group: prev[activeSessionId]?.group || [],
        [currentMode]: (prev[activeSessionId]?.[currentMode] || []).filter(s => s.ui_id !== sectionUiId),
      },
    }));
  }, [activeSessionId, currentMode]);

  const handleAddExercise = useCallback((exerciseDefinition: ExerciseDefinitionBase, targetSectionUiId: string) => {
    if (!activeSessionId) return;
    
    const sectionExercises = exercises.filter(ex => ex.current_section_id === targetSectionUiId);
    const maxPosition = sectionExercises.length > 0 
      ? Math.max(...sectionExercises.map(ex => ex.position_in_section || 0)) 
      : -1;

    const newExerciseInstance: ExerciseUIInstance = {
      ui_id: uuidv4(),
      exercise_definition_id: exerciseDefinition.id,
      exercise_name: exerciseDefinition.name,
      category: exerciseDefinition.category || "gym",
      current_section_id: targetSectionUiId,
      position_in_section: maxPosition + 1,
      set_details: [createDefaultSet()],
      notes: "",
      superset_ui_id: null,
      position_in_superset: null,
    };

    setExercisesState(prev => [...prev, newExerciseInstance]);

    const orderKey = `${activeSessionId}-${targetSectionUiId}`;
    setExerciseOrderState(prev => ({
      ...prev,
      [orderKey]: [...(prev[orderKey] || []), newExerciseInstance.ui_id],
    }));

  }, [activeSessionId, exercises, createDefaultSet]);

  const handleDeleteExercise = useCallback((exerciseUiId: string) => {
    const exerciseToRemove = exercises.find(ex => ex.ui_id === exerciseUiId);
    if (!exerciseToRemove) return;

    const sectionId = exerciseToRemove.current_section_id;
    
    setExercisesState(prev => prev.filter(ex => ex.ui_id !== exerciseUiId));

    if (activeSessionId && sectionId) {
      const orderKey = `${activeSessionId}-${sectionId}`;
      setExerciseOrderState(prev => {
        const currentOrder = prev[orderKey] || [];
        return {
          ...prev,
          [orderKey]: currentOrder.filter(id => id !== exerciseUiId),
        };
      });
    }
  }, [exercises, activeSessionId]);

  const handleCreateSuperset = useCallback((sectionUiId: string, exerciseUiIds: string[]) => {
    if (!activeSessionId || exerciseUiIds.length < 2) return;

    const supersetUiId = uuidv4();
    let positionCounter = 0;

    setExercisesState(prevExercises => 
      prevExercises.map(ex => {
        if (exerciseUiIds.includes(ex.ui_id) && ex.current_section_id === sectionUiId) {
          return {
            ...ex,
            superset_ui_id: supersetUiId,
            position_in_superset: positionCounter++,
          };
        }
        return ex;
      })
    );
  }, [activeSessionId]);

  const handleDissolveSuperset = useCallback((supersetUiId: string) => {
    setExercisesState(prevExercises =>
      prevExercises.map(ex => {
        if (ex.superset_ui_id === supersetUiId) {
          return {
            ...ex,
            superset_ui_id: null,
            position_in_superset: null,
          };
        }
        return ex;
      })
    );
  }, []);
  
  const handleSetDetailChange = useCallback((exerciseUiId: string, setUiId: string, changes: Partial<ExerciseUISetDetail>) => {
    setExercisesState(prevExercises => 
      prevExercises.map(ex => {
        if (ex.ui_id === exerciseUiId) {
          return {
            ...ex,
            set_details: ex.set_details.map(set => 
              set.ui_id === setUiId ? { ...set, ...changes } : set
            ),
          };
        }
        return ex;
      })
    );
  }, []);

  const handleAddSet = useCallback((exerciseUiId: string) => {
    setExercisesState(prevExercises => 
      prevExercises.map(ex => {
        if (ex.ui_id === exerciseUiId) {
          const newSet = createDefaultSet();
          newSet.set_number = ex.set_details.length; // Correctly set based on current length
          return {
            ...ex,
            set_details: [...ex.set_details, newSet],
          };
        }
        return ex;
      })
    );
  }, [createDefaultSet]);

  const handleRemoveSet = useCallback((exerciseUiId: string, setUiId: string) => {
    setExercisesState(prevExercises =>
      prevExercises.map(ex => {
        if (ex.ui_id === exerciseUiId) {
          const updatedSets = ex.set_details.filter(set => set.ui_id !== setUiId)
            .map((set, index) => ({ ...set, set_number: index })); // Ensure set_number is updated
          return { ...ex, set_details: updatedSets };
        }
        return ex;
      })
    );
  }, []);

  const handleExerciseFieldChange = useCallback((exerciseUiId: string, field: keyof ExerciseUIInstance | string, value: any) => {
    setExercisesState(prev => prev.map(ex => 
      ex.ui_id === exerciseUiId ? { ...ex, [field as keyof ExerciseUIInstance]: value } : ex
    ));
  }, []);

  const handleReplaceExerciseDefinition = useCallback((exerciseUiId: string, newExerciseDefinitionId: string) => {
    const newDef = allAvailableExercises.find(def => def.id === newExerciseDefinitionId);
    if (!newDef) return;

    setExercisesState(prev => prev.map(ex => {
      if (ex.ui_id === exerciseUiId) {
        return {
          ...ex,
          exercise_definition_id: newDef.id,
          exercise_name: newDef.name,
          category: newDef.category || "gym",
        };
      }
      return ex;
    }));
  }, [allAvailableExercises]);

  const handleReorder = useCallback((payload: ReorderPayload) => {
    if (!activeSessionId) return;

    if (payload.operationType === "reorder-sections") {
      const newOrderIds = payload.newSectionOrder;
      if (!newOrderIds) {
        console.warn("reorder-sections called without newSectionOrder");
        return;
      }
      setSessionSectionsState(prev => {
        const currentSessionSects = prev[activeSessionId]?.[currentMode] || [];
        const sectionMap = new Map(currentSessionSects.map(s => [s.ui_id, s]));
        const newlyOrderedSections = newOrderIds.map((id, index) => {
            const section = sectionMap.get(id);
            if (!section) {
                console.warn(`Section with id ${id} not found during reorder.`);
                return null; 
            }
            return { ...section, position: index };
        }).filter(s => s !== null) as SectionActiveInstance[];

        return {
          ...prev,
          [activeSessionId]: { 
            individual: prev[activeSessionId]?.individual || [],
            group: prev[activeSessionId]?.group || [],
            [currentMode]: newlyOrderedSections 
          }
        };
      });
    } else if (payload.operationType === "reorder-items-in-section") {
        const { sectionId, itemId, newPosition } = payload;
        if (!sectionId || !itemId || newPosition === undefined) return;
        
        setExercisesState(prevEx => {
            const sectionExercises = prevEx.filter(ex => ex.current_section_id === sectionId && !ex.superset_ui_id);
            const otherExercises = prevEx.filter(ex => !(ex.current_section_id === sectionId && !ex.superset_ui_id));
            
            const oldIndex = sectionExercises.findIndex(ex => ex.ui_id === itemId);
            if (oldIndex === -1) return prevEx; 
            
            const movedItem = sectionExercises[oldIndex];
            if (!movedItem) return prevEx; // Safety check for undefined item
            
            const remainingItems = sectionExercises.filter((_, idx) => idx !== oldIndex);
            remainingItems.splice(newPosition, 0, movedItem);
            
            const updatedSectionExercises = remainingItems.map((ex, index) => ({ ...ex, position_in_section: index }));
            
            return [...otherExercises, ...updatedSectionExercises];
        });

        const orderKey = `${activeSessionId}-${sectionId}`;
        setExerciseOrderState(prevOrder => {
            const currentOrder = prevOrder[orderKey] || [];
            const oldOrderIndex = currentOrder.indexOf(itemId);
            if (oldOrderIndex === -1) return prevOrder;
            const newOrderArray = arrayMove(currentOrder, oldOrderIndex, newPosition);
            return { ...prevOrder, [orderKey]: newOrderArray };
        });

    } else if (payload.operationType === "reorder-items-in-superset") {
        const { supersetId, itemId, newPosition } = payload;
        if (!supersetId || !itemId || newPosition === undefined) return;
        setExercisesState(prevEx => {
            const supersetExercises = prevEx.filter(ex => ex.superset_ui_id === supersetId);
            const otherExercises = prevEx.filter(ex => ex.superset_ui_id !== supersetId);

            const oldIndex = supersetExercises.findIndex(ex => ex.ui_id === itemId);
            if (oldIndex === -1) return prevEx;

            const movedItem = supersetExercises[oldIndex];
            if (!movedItem) return prevEx; // Safety check for undefined item
            
            const remainingItems = supersetExercises.filter((_, idx) => idx !== oldIndex);
            remainingItems.splice(newPosition, 0, movedItem);
            
            const updatedSupersetExercises = remainingItems.map((ex, index) => ({ ...ex, position_in_superset: index }));
            
            return [...otherExercises, ...updatedSupersetExercises];
        });
    } else if (payload.operationType === "move-item-to-section") {
        const { itemId, sourceSectionId, targetSectionId, newPosition } = payload;
        if (!itemId || !sourceSectionId || !targetSectionId || newPosition === undefined) return;
        
        setExercisesState(prevEx => {
            const itemToMove = prevEx.find(ex => ex.ui_id === itemId);
            if (!itemToMove) return prevEx;

            const exercisesWithoutMoved = prevEx.filter(ex => ex.ui_id !== itemId);
            
            const updatedItem = { 
                ...itemToMove, 
                current_section_id: targetSectionId, 
                superset_ui_id: null, 
                position_in_superset: null,
            };

            const targetSectionExercises = exercisesWithoutMoved.filter(ex => ex.current_section_id === targetSectionId && !ex.superset_ui_id);
            targetSectionExercises.splice(newPosition, 0, updatedItem);
            const updatedTargetSectionExercises = targetSectionExercises.map((ex, index) => ({...ex, position_in_section: index }));

            const otherExercises = exercisesWithoutMoved.filter(ex => ex.current_section_id !== targetSectionId || !!ex.superset_ui_id);
            
            return [...otherExercises, ...updatedTargetSectionExercises];
        });

        const sourceOrderKey = `${activeSessionId}-${sourceSectionId}`;
        const targetOrderKey = `${activeSessionId}-${targetSectionId}`;
        setExerciseOrderState(prevOrder => {
            const newOrder = { ...prevOrder };
            if (newOrder[sourceOrderKey]) {
                newOrder[sourceOrderKey] = newOrder[sourceOrderKey].filter(id => id !== itemId);
            }
            const targetList = newOrder[targetOrderKey] || [];
            targetList.splice(newPosition, 0, itemId);
            newOrder[targetOrderKey] = targetList;
            return newOrder;
        });
    }
  }, [activeSessionId, currentMode, sessionSections, exercises]);


  const getOrderedExercises = useCallback((sectionUiId: string): ExerciseUIInstance[] => {
    if (!activeSessionId) return [];
    const sectionExercises = exercises.filter(ex => ex.current_section_id === sectionUiId);
    
    return sectionExercises.sort((a, b) => {
        if (a.superset_ui_id && b.superset_ui_id && a.superset_ui_id === b.superset_ui_id) {
            return (a.position_in_superset || 0) - (b.position_in_superset || 0);
        }
        return (a.position_in_section || 0) - (b.position_in_section || 0);
    });
  }, [activeSessionId, exercises]);

  // Placeholder - actual save logic will be in the main hook or an API call triggered by it.
  const saveSessionConfiguration = useCallback(async () => {
    console.log("Attempting to save session configuration (from useMesoSessionPlannerState)");
    // This function in the sub-hook might just prepare the data for the main hook to submit
    // Or, if it were to directly call an API (less likely for this sub-hook):
    // setIsLoading(true);
    // try {
    //   const payload = { activeSessionId, currentMode, sections: activeSections, exercises: filteredExercisesForDisplay };
    //   // const response = await fetch('/api/session/save', { method: 'POST', body: JSON.stringify(payload) });
    //   // if (!response.ok) throw new Error("Failed to save session");
    //   // const result = await response.json();
    //   console.log("Session data prepared:", payload);
    // } catch (error) {
    //   console.error("Error saving session configuration:", error);
    // } finally {
    //   // setIsLoading(false);
    // }
  }, [activeSessionId, currentMode, activeSections, filteredExercisesForDisplay]);

  const validateSessionDetails = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!activeSessionId) return newErrors; // Should not happen if this is called in Step 3

    const currentSessionExercises = exercises.filter(ex => {
        const section = activeSections.find(sec => sec.ui_id === ex.current_section_id);
        return !!section;
    });

    if (currentSessionExercises.length === 0 && activeSections.length > 0) {
        newErrors.exercisesGlobal = "Please add at least one exercise to the current session.";
    }

    currentSessionExercises.forEach(ex => {
        if(ex.set_details.length === 0) {
            newErrors[`exercise-${ex.ui_id}-sets`] = `Exercise "${ex.exercise_name}" must have at least one set.`;
        }
        ex.set_details.forEach(set => {
            if(ex.category === 'sprint') {
                const repNum = typeof set.reps === 'string' ? parseInt(set.reps, 10) : set.reps;
                const distNum = typeof set.distance === 'string' ? parseInt(set.distance, 10) : set.distance;
                if(!repNum || repNum <= 0) newErrors[`set-${set.ui_id}-reps`] = "Sprint reps must be positive.";
                if(!distNum || distNum <= 0) newErrors[`set-${set.ui_id}-distance`] = "Sprint distance must be positive.";
                if(!set.effort?.trim()) newErrors[`set-${set.ui_id}-effort`] = "Sprint effort is required.";
            } else { // Gym, Plyo, Iso etc.
                const repNum = typeof set.reps === 'string' ? parseInt(set.reps, 10) : set.reps;
                if(repNum === null || repNum === undefined || repNum <= 0) newErrors[`set-${set.ui_id}-reps`] = "Reps must be positive.";
                if(set.weight !== undefined && set.weight !== null && (typeof set.weight !== 'number' || set.weight < 0)) {
                     newErrors[`set-${set.ui_id}-weight`] = "Weight must be a non-negative number (use 0 for bodyweight exercises).";
                }
            }
            const restValue = typeof set.rest === 'string' ? parseInt(set.rest, 10) : set.rest;
            if(restValue === null || restValue === undefined || isNaN(restValue) || restValue < 0) newErrors[`set-${set.ui_id}-rest`] = "Rest must be zero or positive.";
        });
    });
    return newErrors;
  }, [exercises, activeSessionId, activeSections]);


  return {
    sessionSections,
    setSessionSections: setSessionSectionsState,
    exercises,
    setExercises: setExercisesState,
    searchTerm,
    setSearchTerm,
    exerciseOrder,
    setExerciseOrder: setExerciseOrderState,

    // Derived
    activeSections,
    filteredAvailableExercisesFromSearch,
    filteredExercisesForDisplay,
    filteredAvailableExercisesForPicker,
    availableSectionTypes,

    // Handlers
    handleAddSection,
    handleDeleteSection,
    handleAddExercise,
    handleDeleteExercise,
    handleCreateSuperset,
    handleDissolveSuperset,
    handleSetDetailChange,
    handleAddSet,
    handleRemoveSet,
    handleExerciseFieldChange,
    handleReplaceExerciseDefinition,
    handleReorder,
    getOrderedExercises,

    saveSessionConfiguration,
    validateSessionDetails,
  };
}

export type MesoSessionPlannerStateReturn = ReturnType<typeof useMesoSessionPlannerState>; 