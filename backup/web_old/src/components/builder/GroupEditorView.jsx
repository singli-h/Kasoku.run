"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ExerciseSectionManager } from '@/components/mesoWizard/components/exerciseSectionManager/exercise-section-manager'
import { ArrowLeft, Trash2, Flame, Dumbbell, RotateCcw, Timer, Target, ArrowUpCircle, Pause } from 'lucide-react'
import { useSession } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid' // For unique client-side IDs
import { useToast } from '@/components/ui/use-toast' // Import useToast
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select" // Assuming Select exists and is Shadcn/ui compliant
import { Textarea } from "@/components/ui/textarea"

export default function GroupEditorView({ group, presets, filteredExercises, loadingExercises, onBack, onSave }) {
  const sessionId = group.id // This is the preset_group_id, might rename for clarity if it's confusing
  const router = useRouter()
  const { session } = useSession()
  const { toast } = useToast() // Initialize useToast

  // Define the section types to be passed to ExerciseSectionManager
  const sectionTypesForESM = useMemo(() => [
    { id: 'warm-up', name: 'Warm-up', icon: <Flame /> },
    { id: 'main', name: 'Main Workout', icon: <Dumbbell /> },
    { id: 'gym', name: 'Gym Strength', icon: <Dumbbell /> },
    { id: 'cool-down', name: 'Cool-down', icon: <RotateCcw /> },
    { id: 'sprint', name: 'Sprint Drills', icon: <Timer /> },
    { id: 'technique', name: 'Technique Work', icon: <Target /> },
    { id: 'recovery', name: 'Recovery & Mobility', icon: <ArrowUpCircle /> },
    { id: 'isometric', name: 'Isometric', icon: <Pause /> },
    { id: 'plyometric', name: 'Plyometric', icon: <ArrowUpCircle /> },
    { id: 'circuit', name: 'Circuit', icon: <RotateCcw /> },
    { id: 'drill', name: 'Drill', icon: <Target /> }
  ], []);

  const cacheKey = `presetGroupEdits:${group.id}`;

  const mapPresetToExercise = (p) => {
    const exType = p.exercises?.exercise_types?.type?.toLowerCase() || '';
    const apiSetDetails = p.exercise_preset_details || [];
    const firstDetail = apiSetDetails[0] || {};
    const setsCount = apiSetDetails.length;

    return {
      ui_id: nanoid(), // Unique client-side ID for this instance
      db_id: p.id, // Database ID of the exercise_preset record
      exercise_definition_id: p.exercise_id, // ID of the base exercise definition
      name: p.exercises?.name || '',
      category: p.exercises?.exercise_types?.type || '', // e.g., "Strength", "Cardio"
      part: exType, // Original type, e.g., "warmup", "gym"
      current_section_id: exType, // Section it initially belongs to
      superset_db_id: p.superset_id, // DB ID of the superset this preset belongs to
      superset_ui_id: p.superset_id ? `ss-${p.superset_id}` : null, // Client-side superset ID
      position_in_section: p.preset_order,
      notes: p.notes || '',
      set_details: apiSetDetails.map((d, index) => ({
        ui_id: nanoid(), // Unique client-side ID for this set instance
        db_id: d.id, // DB ID of the exercise_preset_detail record
        set_number: d.set_index ?? index, // Keep API's set_index if available
        reps: d.reps,
        weight: d.weight,
        resistance: d.resistance,
        resistance_unit_id: d.resistance_unit_id,
        distance: d.distance,
        height: d.height,
        tempo: d.tempo,
        rest_time: d.rest_time,
        power: d.power,
        velocity: d.velocity,
        effort: d.effort,
        performing_time: d.performing_time,
        rpe: d.rpe, // Added rpe mapping if present on detail
        metadata: d.metadata
      })),
      // Flattened summary/detail fields for timeline (consider if still needed or if ExerciseItemFull handles this)
      // These might be derived dynamically or removed if ExerciseItemFull directly uses set_details[0]
      sets: setsCount, // This can be derived from set_details.length
      reps: firstDetail.reps ?? '',
      weight: firstDetail.weight ?? '',
      distance: firstDetail.distance ?? '',
      height: firstDetail.height ?? '',
      tempo: firstDetail.tempo ?? '',
      rest: firstDetail.rest_time ?? '',
      effort: firstDetail.effort ?? '',
      power: firstDetail.power ?? '',
      velocity: firstDetail.velocity ?? '',
      performing_time: firstDetail.performing_time ?? '',
      rpe: firstDetail.rpe ?? '',
      resistance: firstDetail.resistance ?? '',
      resistance_unit_id: firstDetail.resistance_unit_id ?? ''
    };
  };

  const mapExerciseToApiPayload = (ex) => {
    return {
      id: ex.db_id || null, // Keep null if it's a new preset not yet in DB
      exercise_id: ex.exercise_definition_id,
      // For superset_id, prioritize db_id if it exists (meaning it's a saved superset).
      // If not, and superset_ui_id exists, pass that. The backend might need logic
      // to handle ui_id references for new supersets or to link existing ones.
      // If neither, it's not in a superset.
      superset_id: ex.superset_db_id || (ex.superset_ui_id ? ex.superset_ui_id : null),
      preset_order: ex.position_in_section,
      notes: ex.notes || '',
      exercise_preset_details: ex.set_details.map(sd => ({
        id: sd.db_id || null, // Keep null if it's a new set detail
        set_index: sd.set_number,
        reps: sd.reps,
        weight: sd.weight,
        resistance: sd.resistance,
        resistance_unit_id: sd.resistance_unit_id,
        distance: sd.distance,
        height: sd.height,
        tempo: sd.tempo,
        rest_time: sd.rest_time, // Ensure your API uses this field name
        power: sd.power,
        velocity: sd.velocity,
        effort: sd.effort,
        performing_time: sd.performing_time, // Ensure your API uses this field name
        rpe: sd.rpe,
        metadata: sd.metadata // Assuming metadata is a JSON or string field
      }))
    };
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setName(parsedCache.name || group.name || '');
        setDate(parsedCache.date || (group.date ? new Date(group.date).toISOString().split('T')[0] : ''));
        setSessionMode(parsedCache.sessionMode || group.session_mode || 'individual');
        setDescription(parsedCache.description || group.description || '');
        // Ensure cached exercises also get ui_ids if they are from an older cache structure
        const rawCachedExercises = parsedCache.exercises || []; // Ensure it's an array
        const cachedExercises = rawCachedExercises.map(ex => ({
          ...mapPresetToExercise({ // Simulate a preset to map it correctly
            id: ex.db_id,
            exercise_id: ex.exercise_definition_id,
            exercises: { name: ex.name, exercise_types: { type: ex.category } },
            superset_id: ex.superset_db_id,
            preset_order: ex.position_in_section,
            notes: ex.notes,
            exercise_preset_details: ex.set_details?.map(sd => ({ ...sd, set_index: sd.set_number, id: sd.db_id })) || []
          }),
          ...ex, // Overlay existing fields like ui_id if already present
          ui_id: ex.ui_id || nanoid(), // Ensure ui_id
          set_details: (ex.set_details || []).map(sd => ({...sd, ui_id: sd.ui_id || nanoid() }))
        }));
        setExercises(cachedExercises);
        setActiveSections(parsedCache.activeSections || []); 
        // Supersets will be re-derived from exercises, so no need to load supersets directly from cache
      } else {
        // Initial load from props
        const initialExercises = presets.map(mapPresetToExercise);
        setExercises(initialExercises);
        const currentSections = Array.from(new Set(initialExercises.map((e) => e.current_section_id).filter(s => s)));
        setActiveSections(currentSections.length > 0 ? currentSections : []); // Ensure at least one section if exercises exist, or empty
      }
    }
  }, []); // group, presets only on initial determination, cacheKey for re-cache listen

  const [name, setName] = useState(group.name || '')
  const [date, setDate] = useState(group.date ? new Date(group.date).toISOString().split('T')[0] : '')
  const [sessionMode, setSessionMode] = useState(group.session_mode || 'individual')
  const [description, setDescription] = useState(group.description || '')

  const [exercises, setExercises] = useState(() => (Array.isArray(presets) ? presets : []).map(mapPresetToExercise));
  const [activeSections, setActiveSections] = useState([]);

  // Effect to initialize activeSections from exercises, if not loaded from cache
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.localStorage.getItem(cacheKey)) {
        const initialPresets = Array.isArray(presets) ? presets : []; // Ensure presets is an array
        const initialExercises = initialPresets.map(mapPresetToExercise);
        // setExercises(initialExercises); // This is already done by useState initializer
        const currentSectionIds = Array.from(new Set(initialExercises.map((e) => e.current_section_id).filter(s => s)));
        setActiveSections(currentSectionIds.length > 0 ? currentSectionIds : []);
        }
  }, [presets]); // Only depends on presets for initial setup when no cache


  // DERIVED STATE for supersets (passed to ExerciseTimeline and used for logic)
  // This will be updated by onSupersetChange from ExerciseSectionManager
  const [timelineSupersets, setTimelineSupersets] = useState([]);

  // Cache edits to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dataToCache = { name, date, sessionMode, description, exercises, activeSections }; // Not caching timelineSupersets as it's derived
      window.localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    }
  }, [name, date, sessionMode, description, exercises, activeSections, cacheKey]);

  // Handlers for ExerciseSectionManager
  const handleAddExerciseCallback = useCallback((exerciseDefinition, sectionId, targetSupersetUiId = null) => {
    setExercises((prevExercises) => {
      const exercisesInSessionAndSection = prevExercises.filter(e => e.current_section_id === sectionId); // GroupEditorView is for one session (group.id)
      
    const newExercise = {
        ui_id: nanoid(),
        db_id: null, 
        exercise_definition_id: exerciseDefinition.id,
        name: exerciseDefinition.name,
        category: exerciseDefinition.type, 
        part: exerciseDefinition.type.toLowerCase(),
        current_section_id: sectionId,
        superset_db_id: null, // DB superset ID - not known for new client-side supersets
        superset_ui_id: targetSupersetUiId, // Client-side superset ID
        position_in_section: 0, // Will be set below or by normalization
        position_in_superset: null, // Will be set if targetSupersetUiId is present
      notes: '',
        set_details: [
          { ui_id: nanoid(), db_id: null, set_number: 1, reps: '', weight: '', rest_time: '', effort: '' }
        ],
        sets: 1,
        reps: '',
        weight: '',
        rest: '',
        effort: '',
      };

      if (targetSupersetUiId) {
        const exercisesInTargetSuperset = exercisesInSessionAndSection
          .filter(ex => ex.superset_ui_id === targetSupersetUiId)
          .sort((a, b) => (a.position_in_superset || 0) - (b.position_in_superset || 0));
        
        newExercise.position_in_superset = exercisesInTargetSuperset.length > 0
          ? Math.max(...exercisesInTargetSuperset.map(ex => ex.position_in_superset || 0)) + 1
          : 1;
        
        const existingExerciseInSuperset = exercisesInSessionAndSection.find(ex => ex.superset_ui_id === targetSupersetUiId);
        if (existingExerciseInSuperset) {
          newExercise.position_in_section = existingExerciseInSuperset.position_in_section;
        } else {
          const positions = exercisesInSessionAndSection.map(ex => ex.position_in_section);
          newExercise.position_in_section = positions.length > 0 ? Math.max(...positions) + 1 : 1;
        }
      } else {
        const positions = exercisesInSessionAndSection.map(ex => ex.position_in_section);
        newExercise.position_in_section = positions.length > 0 ? Math.max(...positions) + 1 : 1;
      }
      
      // It's crucial to normalize positions after adding, especially with supersets.
      // A simplified normalization for GroupEditorView, assuming normalizeExercisePositions handles a flat list based on sectionId.
      // We need a normalize function similar to StepTwoPlanner or adapt it.
      // For now, just add the exercise. Full normalization will be complex here without the helper from StepTwoPlanner.
      // Let's assume ExerciseSectionManager's onReorder callback handles the final list structure if needed,
      // or that the parent calls a normalization utility after this callback.
      // **Temporary**: Positions set above might need adjustment by a more global normalization.
      return [...prevExercises, newExercise].sort((a,b) => {
        if (a.current_section_id === b.current_section_id) {
            if (a.superset_ui_id && b.superset_ui_id && a.superset_ui_id === b.superset_ui_id) {
                return (a.position_in_superset || 0) - (b.position_in_superset || 0);
            }
            return (a.position_in_section || 0) - (b.position_in_section || 0);
        }
        return 0; // Should not happen if sections are consistent
      });
    });
  }, []);

  const handleRemoveExerciseCallback = useCallback((exerciseUiIdToRemove) => {
    setExercises((prev) => prev.filter((e) => e.ui_id !== exerciseUiIdToRemove));
    // Also need to handle removing from supersets if it was part of one - this might be complex
    // For now, ExerciseSectionManager is expected to handle this dissociation before calling remove.
  }, []);

  // This handler is for ExerciseSectionManager to update the entire exercise list after DnD or other complex ops
  const handleExercisesReordered = useCallback((updatedExercises) => {
    setExercises(updatedExercises);
  }, []);

  const getOrderedExercises = useCallback((passedSessionId, sectionId) => {
    // sessionId from props is group.id, passedSessionId in this context seems redundant if always group.id
    return exercises
      .filter((e) => e.current_section_id === sectionId) // No longer filtering by session (group.id)
      .sort((a, b) => (a.position_in_section || 0) - (b.position_in_section || 0))
  }, [exercises])

  // const handleSupersetChange = useCallback((sid, newSups) => {
  //   setSupersets(newSups)
  // }, [])

  // New handler for ExerciseSectionManager to inform about superset structure changes
  const handleSupersetStructureChange = useCallback((newSupersetStructures) => {
    // newSupersetStructures is expected to be an array of objects like:
    // { id: superset_ui_id, displayNumber: number, exercises: [exercise_ui_id, ...], section: string, originalPosition: number }
    // The first argument `sessionId` from onSupersetStructureChange(sessionId, supersets) in ExerciseSectionManager
    // is not used here because GroupEditorView manages a single group/session.
    // If newSupersetStructures is the actual array of superset objects:
    setTimelineSupersets(newSupersetStructures); 
  }, []);


  const handleSave = () => {
    // Basic validation example: Check if group name is provided
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name cannot be empty.",
        variant: "destructive",
      });
      return; // Prevent saving if validation fails
    }

    if (typeof window !== 'undefined') window.localStorage.removeItem(cacheKey);
    const updateData = {
      name,
      description,
      date,
      session_mode: sessionMode,
      presets: exercises.map((e) => ({
        id: e.db_id, // Use db_id for existing, undefined for new
        exercise_id: e.exercise_definition_id,
        // superset_id: e.superset_db_id, // This needs logic: if superset_ui_id is new, API needs to create superset group
        // For now, let's assume superset_ui_id that are strings (e.g., `ss-timestamp`) are new
        // and those that are numbers (if we adopt that from DB later) are existing.
        // This is complex: API needs to handle superset creation/linking based on this.
        // Simplification: For now, pass superset_ui_id if it's what ExerciseSectionManager uses internally.
        // Backend will need to resolve this.
        superset_id: e.superset_ui_id, // Or map back to superset_db_id if possible and manage new ones
        preset_order: e.position_in_section,
        notes: e.notes,
        exercise_preset_details: e.set_details.map((d, index) => ({
          id: d.db_id, // Use db_id for existing, undefined for new sets
          set_index: d.set_number ?? index, // Ensure set_index is sequential
          reps: d.reps,
          weight: d.weight,
          resistance: d.resistance,
          resistance_unit_id: d.resistance_unit_id,
          distance: d.distance,
          height: d.height,
          tempo: d.tempo,
          rest_time: d.rest_time,
          power: d.power,
          velocity: d.velocity,
          effort: d.effort,
          performing_time: d.performing_time,
          rpe: d.rpe,
          metadata: d.metadata
        }))
      }))
    }
    onSave(updateData)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this preset group? This action cannot be undone.')) {
      return;
    }
    try {
      const token = await session?.getToken();
      if (!token) {
        alert('Authentication error. Please try again.');
        return;
      }
      const res = await fetch(`/api/plans/preset-groups/${group.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to delete preset group');
      }
      alert('Preset group deleted successfully.');
      if (typeof window !== 'undefined') window.localStorage.removeItem(cacheKey);
      router.push('/plans?tab=builder');
    } catch (error) {
      console.error("Failed to delete preset group:", error);
      alert(`Error deleting: ${error.message}`);
    }
  };

  // Function to get section name - can be passed to ESM
  const getSectionName = (sectionId) => {
    // Attempt to find in our defined list first for consistent naming with icons
    const definedSection = sectionTypesForESM.find(st => st.id === sectionId);
    if (definedSection) return definedSection.name;

    // Fallback for dynamic/custom section IDs not in the predefined list
    if (!sectionId) return "Unnamed Section";
    return sectionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Granular Handlers to be passed to ExerciseSectionManager
  const handleExerciseFieldChange = useCallback((exerciseUiId, field, value) => {
    setExercises(prev => prev.map(ex => 
      ex.ui_id === exerciseUiId ? { ...ex, [field]: value } : ex
    ));
  }, []);

  const handleSetDetailChange = useCallback((exerciseUiId, setIndex, field, value) => {
    setExercises(prev => prev.map(ex => {
      if (ex.ui_id === exerciseUiId) {
        const newSetDetails = [...ex.set_details];
        if (newSetDetails[setIndex]) {
          newSetDetails[setIndex] = { ...newSetDetails[setIndex], [field]: value };
        }
        return { ...ex, set_details: newSetDetails, sets: newSetDetails.length }; // also update summary 'sets'
      }
      return ex;
    }));
  }, []);

  const handleAddSet = useCallback((exerciseUiId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.ui_id === exerciseUiId) {
        const newSetNumber = ex.set_details.length;
        const newSet = { 
          ui_id: nanoid(), 
          db_id: null, 
          set_number: newSetNumber, 
          reps: ex.set_details[0]?.reps || '', // Default to first set's value or empty
          weight: ex.set_details[0]?.weight || '',
          rest_time: ex.set_details[0]?.rest_time || '',
          effort: ex.set_details[0]?.effort || '',
          // ... copy other relevant fields from first set or provide defaults
        };
        const newSetDetails = [...ex.set_details, newSet];
        return { ...ex, set_details: newSetDetails, sets: newSetDetails.length };
      }
      return ex;
    }));
  }, []);

  const handleRemoveSet = useCallback((exerciseUiId, setIndex) => {
    setExercises(prev => prev.map(ex => {
      if (ex.ui_id === exerciseUiId) {
        const newSetDetails = ex.set_details.filter((_, idx) => idx !== setIndex)
                                      .map((set, newIdx) => ({ ...set, set_number: newIdx })); // Re-index set_number
        return { ...ex, set_details: newSetDetails, sets: newSetDetails.length };
      }
      return ex;
    }));
  }, []);

  // Superset management handlers - these will modify the exercises state
  // (superset_ui_id, position_in_section, current_section_id)
  const handleCreateSuperset = useCallback((selectedExerciseUiIds, sectionIdToHostSuperset) => {
    const newSupersetUiId = `ss-${nanoid(8)}`;
    setExercises(prevExercises => {
      let minPositionInNewSuperset = Infinity;
      selectedExerciseUiIds.forEach(id => {
        const ex = prevExercises.find(e => e.ui_id === id);
        if (ex) minPositionInNewSuperset = Math.min(minPositionInNewSuperset, ex.position_in_section);
      });

      return prevExercises.map(ex => {
        if (selectedExerciseUiIds.includes(ex.ui_id)) {
          return {
            ...ex,
            superset_ui_id: newSupersetUiId,
            current_section_id: sectionIdToHostSuperset,
            // Adjust position relative to the start of the superset block
            // This part is tricky and needs coordination with ExerciseSectionManager's reordering
            // For now, let's assume their original positions are maintained relative to each other,
            // and the superset block takes the position of the first item.
            position_in_section: ex.position_in_section // This might need to be re-calculated based on overall order
          };
        }
        return ex;
      });
      // After this, a re-sort/re-position pass might be needed for the entire section or all exercises.
      // ExerciseSectionManager's handleExercisesReordered would be called.
    });
  }, []);

  const handleAddExerciseToSuperset = useCallback((exerciseDefinition, supersetUiId, targetSectionId) => {
    setExercises(prevExercises => {
      const supersetExercises = prevExercises.filter(e => e.superset_ui_id === supersetUiId);
      const newPosition = supersetExercises.length > 0 
        ? Math.max(...supersetExercises.map(e => e.position_in_section)) + 1 
        : 0; // Or find position of superset block and add within it

      const newExercise = {
        ui_id: nanoid(),
        db_id: null,
        exercise_definition_id: exerciseDefinition.id,
        name: exerciseDefinition.name,
        category: exerciseDefinition.type,
        part: exerciseDefinition.type.toLowerCase(),
        current_section_id: targetSectionId, 
        superset_db_id: null, // Superset already exists client-side
        superset_ui_id: supersetUiId,
        position_in_section: newPosition,
        notes: '',
        set_details: [{ ui_id: nanoid(), db_id: null, set_number: 0, reps: '', weight: '', rest_time: '', effort: '' }],
        sets: 1,
      };
      return [...prevExercises, newExercise];
      // Again, a re-sort/re-position pass might be needed.
    });
  }, []);

  const handleRemoveFromSuperset = useCallback((supersetUiId, exerciseUiIdToRemove) => {
    setExercises(prevExercises => {
      const updatedExercises = prevExercises.map(ex => {
        if (ex.ui_id === exerciseUiIdToRemove && ex.superset_ui_id === supersetUiId) {
          return { 
            ...ex, 
            superset_ui_id: null, 
            // Exercise becomes individual, its section might need to revert to its original type (part)
            // current_section_id: ex.part, // Or stay in the superset's section? Needs UX decision.
            // Position needs recalculation.
          };
        }
        return ex;
      });
      
      // Check if the superset is now empty or has only one exercise - dissolve if so.
      const remainingInSuperset = updatedExercises.filter(ex => ex.superset_ui_id === supersetUiId);
      if (remainingInSuperset.length < 2) {
        return updatedExercises.map(ex => 
          ex.superset_ui_id === supersetUiId ? { ...ex, superset_ui_id: null } : ex
        );
      }
      return updatedExercises;
      // Re-positioning needed.
    });
  }, []);

  const handleExitSuperset = useCallback((supersetUiIdToExit) => {
    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.superset_ui_id === supersetUiIdToExit 
          ? { ...ex, superset_ui_id: null /* , current_section_id: ex.part - UX decision */ } 
          : ex
      )
      // Re-positioning needed.
    );
  }, []);

  // Add missing handlers required by ExerciseSectionManagerProps
  const handleAddSection = useCallback((sectionType) => {
    const instanceId = `${sectionType}-${Date.now()}`;
    setActiveSections(prev => [...prev, instanceId]);
  }, []);

  const handleDeleteSection = useCallback((sectionUiId) => {
    // Remove exercises in this section first
    setExercises(prev => prev.filter(ex => ex.current_section_id !== sectionUiId));
    // Remove section from active sections
    setActiveSections(prev => prev.filter(id => id !== sectionUiId));
  }, []);

  const handleUpdateSectionDetails = useCallback((sectionUiId, updates) => {
    // For now, this is a no-op since we don't store section details
    console.log('Update section details:', { sectionUiId, updates });
  }, []);

  const handleReorderSections = useCallback((orderedSectionUiIds) => {
    setActiveSections(orderedSectionUiIds);
  }, []);

  const handleCreateExercise = useCallback((exerciseDefinitionId, sectionId, supersetUiId = null, position = null) => {
    const exerciseDefinition = filteredExercises.find(ex => ex.id === exerciseDefinitionId);
    if (!exerciseDefinition) {
      console.error('Exercise definition not found for ID:', exerciseDefinitionId);
      return;
    }
    handleAddExerciseCallback(exerciseDefinition, sectionId, supersetUiId);
  }, [filteredExercises, handleAddExerciseCallback]);

  const handleDeleteExercise = useCallback((exerciseUiId) => {
    handleRemoveExerciseCallback(exerciseUiId);
  }, [handleRemoveExerciseCallback]);

  const handleDeleteSuperset = useCallback((supersetUiId, hostSectionId) => {
    handleExitSuperset(supersetUiId);
  }, [handleExitSuperset]);

  const getExerciseDefinitionById = useCallback((id) => {
    return filteredExercises.find(ex => ex.id === id);
  }, [filteredExercises]);

  // Derive supersets from exercises
  const allSupersetsInSessionContext = useMemo(() => {
    const supersetMap = new Map();
    
    exercises.forEach(exercise => {
      if (exercise.superset_ui_id) {
        if (!supersetMap.has(exercise.superset_ui_id)) {
          supersetMap.set(exercise.superset_ui_id, {
            ui_id: exercise.superset_ui_id,
            db_id: exercise.superset_db_id || null,
            host_section_id: exercise.current_section_id,
            position_in_section: exercise.position_in_section,
            exercises: [],
            display_name: null,
            notes: null,
            internal_rest: null,
            external_rest: null,
            cycles: 1,
            display_number: 1
          });
        }
        supersetMap.get(exercise.superset_ui_id).exercises.push(exercise);
      }
    });
    
    return Array.from(supersetMap.values());
  }, [exercises]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>{group.id ? 'Edit Preset Group' : 'Create Preset Group'}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {group.id && (
            <Button variant="destructive" size="icon" onClick={handleDelete} aria-label="Delete Group">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button onClick={handleSave}>Save Group</Button>
        </div>
        </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monday - Upper Body Push" />
          </div>
          <div>
            <Label htmlFor="group-date">Date (Optional)</Label>
            <Input id="group-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="group-description">Description (Optional)</Label>
          <Input id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview of the group's focus" />
          </div>
        <div>
          <Label htmlFor="session-mode">Session Mode</Label>
          {/* This could be a Select component later */}
          <Input id="session-mode" value={sessionMode} onChange={(e) => setSessionMode(e.target.value)} placeholder="e.g., individual, group" />
          </div>

        {/* ExerciseSectionManager integration */}
              <ExerciseSectionManager
          key={`esm-group-${group.id}`}
          allExercisesInSessionContext={exercises}
          allSupersetsInSessionContext={allSupersetsInSessionContext}
          activeSections={activeSections}
          sectionTypes={sectionTypesForESM}
          availableExercises={filteredExercises}
          loadingAvailableExercises={loadingExercises}
          mode={sessionMode}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onUpdateSectionDetails={handleUpdateSectionDetails}
          onReorderSections={handleReorderSections}
          onCreateExercise={handleCreateExercise}
          onCreateSuperset={handleCreateSuperset}
          onDeleteExercise={handleDeleteExercise}
          onDeleteSuperset={handleDeleteSuperset}
          onExerciseFieldChange={handleExerciseFieldChange} 
          onSetDetailChange={handleSetDetailChange}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onReplaceExerciseDefinition={(exerciseUiId, newExerciseDefinitionId) => {
            console.log('Replace exercise definition:', { exerciseUiId, newExerciseDefinitionId });
          }}
          onRemoveExerciseFromSuperset={handleRemoveFromSuperset}
          onReorder={handleExercisesReordered}
          getSectionName={getSectionName}
          getExerciseDefinitionById={getExerciseDefinitionById}
        />

        {/* REMOVED TABS - ExerciseSectionManager will be placed here in a subsequent step */}
        {/* <Tabs defaultValue="manager" className="w-full"> */}
        {/*   <TabsList className="grid w-full grid-cols-2"> */}
        {/*     <TabsTrigger value="manager">Exercise Manager</TabsTrigger> */}
        {/*     <TabsTrigger value="timeline">Session Timeline</TabsTrigger> */}
        {/*   </TabsList> */}
        {/*   <TabsContent value="manager"> */}
        {/*     <ExerciseSectionManager */}
        {/*       key={`esm-group-${group.id}-${activeSections.join('-')}`} */}
        {/*       sessionId={sessionId} // group.id */}
        {/*       exercises={exercises} */}
        {/*       activeSections={activeSections} */}
        {/*       setActiveSections={setActiveSections} */}
        {/*       mode={sessionMode} */}
        {/*       onAddExercise={handleAddExerciseCallback} */}
        {/*       onRemoveExercise={handleRemoveExerciseCallback} */}
        {/*       onReorderExercises={handleExercisesReordered} // This needs to accept the full reordered list from ESM */}
        {/*       onExerciseFieldChange={handleExerciseDetailChangeCallback} // Ensure this exists */}
        {/*       onSetDetailChange={handleSetDetailChangeCallback} // Ensure this exists */}
        {/*       onAddSet={handleAddSetCallback} // Ensure this exists */}
        {/*       onRemoveSet={handleRemoveSetCallback} // Ensure this exists */}
        {/*       onCreateSuperset={handleCreateSupersetCallback} // Ensure this exists */}
        {/*       onAddExerciseToSuperset={handleAddExerciseToSupersetCallback} // Ensure this exists */}
        {/*       onRemoveFromSuperset={handleRemoveFromSupersetCallback} // Ensure this exists */}
        {/*       onExitSuperset={handleExitSupersetCallback} // Ensure this exists */}
        {/*       onSupersetStructureChange={handleSupersetStructureChange} */}
        {/*       availableExercises={filteredExercises} */}
        {/*       loadingAvailableExercises={loadingExercises} */}
        {/*       getSectionName={getSectionName} */}
        {/*       // Removed onAutoFillRequest as it's more for dynamic session planning */}
        {/*     /> */}
        {/*   </TabsContent> */}
        {/*   <TabsContent value="timeline"> */}
        {/*     <ExerciseTimeline */}
        {/*       exercises={exercises} */}
        {/*       sessionMode={sessionMode} */}
        {/*       sessionSections={activeSections} */}
        {/*       getSectionName={getSectionName} */}
        {/*       supersets={timelineSupersets} */}
        {/*     /> */}
        {/*   </TabsContent> */}
        {/* </Tabs> */}
        </CardContent>
      {/* <CardFooter>Footer if needed</CardFooter> */}
      </Card>
  )
} 