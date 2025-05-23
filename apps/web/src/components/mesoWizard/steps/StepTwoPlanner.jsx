"use client"

import { ChevronRight, ChevronLeft, Info, Loader2, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ExerciseSectionManager from "../components/ExerciseSectionManager"
// import ExerciseTimeline from "../components/ExerciseTimeline"; 
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useAuthenticatedSupabaseClient } from '@/lib/supabase'
import { useSession } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'
import { nanoid } from 'nanoid'

/**
 * Step Two: Session & Exercise Planning (Updated documentation for new AI flow)
 * 
 * This step allows users to:
 * - Configure session details
 * - Select progression models
 * - Manage exercise sections
 * - Add and configure exercises
 * - Auto-fill exercise details using AI via a streaming Edge Function
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Function to update the entire formData object
 * @param {Function} props.handleSessionInputChange - Function to handle session input changes
 * @param {Function} props.handleAddExercise - Function to add an exercise
 * @param {Function} props.handleRemoveExercise - Function to remove an exercise
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Function} props.handleExerciseReorder - Function to handle exercise reordering
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 * @param {Object} props.sessionSections - Session sections data // Will be replaced by currentActiveSections logic
 * @param {Function} props.handleSetActiveSections - Function to set active sections // Will be replaced
 * @param {Array} props.filteredExercises - Filtered exercises
 * @param {boolean} props.loadingExercises - Indicates if exercises are loading
 * @param {number} props.activeSession - Active session ID (index)
 * @param {Function} props.setActiveSession - Function to set active session
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.handleNext - Function to go to the next step
 * @param {Function} props.handleBack - Function to go to the previous step
 * @param {string} props.userRole - User role
 * @param {Object} props.athleteProfile - Athlete profile data
 * @param {boolean} props.profileLoading - Indicates if athlete profile is loading
 * @param {string} props.feedbackText - Feedback text from AI
 * @param {Function} props.setFeedbackText - Function to set feedback text
 */
const StepTwoPlanner = ({
  formData,
  setFormData,
  handleSessionInputChange,
  // sessionSections, // Prop to be removed or re-evaluated
  // handleSetActiveSections, // Prop to be removed or re-evaluated
  filteredExercises,
  loadingExercises,
  activeSession, 
  setActiveSession,
  errors,
  handleNext,
  handleBack,
  userRole,
  athleteProfile,
  profileLoading,
  feedbackText,
  setFeedbackText
}) => {
  // State to track active sections for the CURRENT session
  const [currentActiveSections, setCurrentActiveSections] = useState([]);

  // State to track supersets for each session (for timeline display) - REMOVED
  // const [sessionSupersets, setSessionSupersets] = useState({});

  // Global AI-Fill state
  const [aiLoadingAll, setAiLoadingAll] = useState(false);
  const [cooldownAll, setCooldownAll] = useState(0);
  const [historyAll, setHistoryAll] = useState([]);
  // const [activeTab, setActiveTab] = useState("exercises"); // REMOVED

  // Get the authenticated Supabase client using the new hook
  const supabase = useAuthenticatedSupabaseClient(); 
  const { session: clerkSession } = useSession(); // Still useful for checking if session exists before calling
  const { toast } = useToast()

  // Initialize currentActiveSections when activeSession or formData.sessions changes
  useEffect(() => {
    if (formData.sessions && formData.sessions[activeSession]) {
      const currentSessionData = formData.sessions[activeSession];
      const mode = currentSessionData?.session_mode || 'individual';
      // Use a simplified way to get default sections, or define `sessionSectionsData` if needed
      const defaultSections = mode === 'group'
        ? (sessionSectionsData[mode]?.defaultSections || ['sprint']) 
        : (sessionSectionsData[mode]?.defaultSections || ['warm-up', 'main', 'cool-down']);
      setCurrentActiveSections(defaultSections);
    }
  }, [activeSession, formData.sessions]);


  // Helper function to create a new exercise object with the detailed structure
  const createNewExerciseObject = (exerciseData, sessionId, sectionId) => {
    const exerciseUiId = nanoid();
    const numberOfSets = parseInt(exerciseData.sets, 10) || 1;
    const setDetails = Array.from({ length: numberOfSets }, (_, index) => ({
      ui_id: nanoid(),
      db_id: null, 
      set_number: index + 1,
      reps: exerciseData.reps || null,
      weight: exerciseData.weight || null,
      rest: exerciseData.rest || null,
      effort: exerciseData.effort || null,
      rpe: exerciseData.rpe || null,
      tempo: exerciseData.tempo || null,
      power: exerciseData.power || null,
      velocity: exerciseData.velocity || null,
    }));

    return {
      ui_id: exerciseUiId,
      db_id: exerciseData.db_id || null, 
      exercise_definition_id: exerciseData.id, 
      name: exerciseData.name,
      current_section_id: sectionId,
      session_id: sessionId, 
      position_in_section: 0, 
      superset_ui_id: null,
      position_in_superset: null,
      sets: numberOfSets, 
      reps: exerciseData.reps || null,
      rest: exerciseData.rest || null,
      effort: exerciseData.effort || null,
      rpe: exerciseData.rpe || null,
      tempo: exerciseData.tempo || null,
      power: exerciseData.power || null,
      velocity: exerciseData.velocity || null,
      notes: exerciseData.notes || '',
      set_details: setDetails,
      type: exerciseData.type,
      equipment: exerciseData.equipment,
      originalId: exerciseData.originalId || exerciseData.id, 
      part: sectionId, 
    };
  };

  const getExercisesForCurrentSession = useCallback(() => {
    if (!formData.exercises || !formData.sessions[activeSession]) return [];
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return []; // Should be caught by loading check later
    const currentSessionId = currentSessionObject.id; // Assuming session object has an `id` property
    return formData.exercises.filter(ex => ex.session_id === currentSessionId);
  }, [formData.exercises, formData.sessions, activeSession]);
  

  // INTERNAL HANDLERS TO MODIFY formData.exercises for the CURRENT ACTIVE SESSION
  // These will be passed to ExerciseSectionManager, adapted to operate on the current activeSession's ID.

  const handleInternalAddExercise = useCallback((exerciseData, sectionId, targetSupersetUiId = null) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const newExercise = createNewExerciseObject(exerciseData, currentSessionId, sectionId);
      
      let exercisesInSessionAndSection = prevFormData.exercises
        .filter(ex => ex.session_id === currentSessionId && ex.current_section_id === sectionId);

      if (targetSupersetUiId) {
        newExercise.superset_ui_id = targetSupersetUiId;
        const exercisesInTargetSuperset = exercisesInSessionAndSection
          .filter(ex => ex.superset_ui_id === targetSupersetUiId)
          .sort((a, b) => a.position_in_superset - b.position_in_superset);
        
        newExercise.position_in_superset = exercisesInTargetSuperset.length > 0
          ? Math.max(...exercisesInTargetSuperset.map(ex => ex.position_in_superset)) + 1
          : 1;
        
        const existingExerciseInSuperset = exercisesInSessionAndSection.find(ex => ex.superset_ui_id === targetSupersetUiId);
        if (existingExerciseInSuperset) {
          newExercise.position_in_section = existingExerciseInSuperset.position_in_section;
        } else {
          const nonSupersetExercises = exercisesInSessionAndSection.filter(ex => !ex.superset_ui_id);
          newExercise.position_in_section = nonSupersetExercises.length > 0 
            ? Math.max(...nonSupersetExercises.map(ex => ex.position_in_section)) + 1 
            : (exercisesInSessionAndSection.length > 0 ? Math.max(...exercisesInSessionAndSection.map(ex => ex.position_in_section)) + 1 : 1);
        }

      } else {
        const positions = exercisesInSessionAndSection.map(ex => ex.position_in_section);
        newExercise.position_in_section = positions.length > 0 ? Math.max(...positions) + 1 : 1;
      }

      let updatedExercises = normalizeExercisePositions([...prevFormData.exercises, newExercise]);
      
      toast({ title: "Exercise Added", description: `${newExercise.name} added.` });
      return {
        ...prevFormData,
        exercises: updatedExercises,
      };
    });
  }, [activeSession, formData.sessions, setFormData, toast]);

  const handleInternalRemoveExercise = useCallback((exerciseUiId) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const exerciseToRemove = prevFormData.exercises.find(ex => ex.ui_id === exerciseUiId && ex.session_id === currentSessionId);
      if (!exerciseToRemove) return prevFormData;

      const updatedExercises = prevFormData.exercises.filter(ex => ex.ui_id !== exerciseUiId);
      
      const remainingInSuperset = updatedExercises.filter(ex => ex.superset_ui_id === exerciseToRemove.superset_ui_id && ex.superset_ui_id);
      if (exerciseToRemove.superset_ui_id && remainingInSuperset.length < 2) {
        remainingInSuperset.forEach(ex => {
          ex.superset_ui_id = null;
          ex.position_in_superset = null;
        });
      } else if (exerciseToRemove.superset_ui_id) {
        remainingInSuperset
          .sort((a, b) => a.position_in_superset - b.position_in_superset)
          .forEach((ex, index) => ex.position_in_superset = index + 1);
      }
      
      toast({ title: "Exercise Removed", description: `${exerciseToRemove.name} removed.` });
      return {
        ...prevFormData,
        exercises: normalizeExercisePositions(updatedExercises), 
      };
    });
  }, [activeSession, formData.sessions, setFormData, toast]);

  const handleInternalReorderExercises = useCallback((reorderPayload) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    console.log("Reordering with payload:", reorderPayload);
    const { source, target, operationType } = reorderPayload;

    if (source.session_id !== currentSessionId || (target.session_id && target.session_id !== currentSessionId && operationType !== 'create-cross-section-superset' && operationType !== 'add-to-cross-section-superset')) {
      console.error("Reorder attempt across different sessions or invalid payload for current session context.", { currentSessionId, source, target });
      // Allow cross-section superset if target section is different but items are part of current session context before operation
      if(!(operationType === 'create-cross-section-superset' || operationType === 'add-to-cross-section-superset')){
        return; 
      }
    }
    
    setFormData(prevFormData => {
      let exercises = [...prevFormData.exercises];
      const draggedItem = exercises.find(ex => ex.ui_id === source.item.ui_id);
      if (!draggedItem) return prevFormData;

      if (operationType === 'create-cross-section-superset') {
        const targetItem = exercises.find(ex => ex.ui_id === target.item.ui_id);
        if (!targetItem) return prevFormData;
        
        const newSupersetUiId = `ss-${nanoid()}`;
        draggedItem.superset_ui_id = newSupersetUiId;
        draggedItem.position_in_superset = 1;
        targetItem.superset_ui_id = newSupersetUiId;
        targetItem.position_in_superset = 2;
        toast({ title: "Superset Created", description: `Across sections: ${draggedItem.name} & ${targetItem.name}` });

      } else if (operationType === 'add-to-cross-section-superset' || operationType === 'move-exercise-into-superset') {
        draggedItem.superset_ui_id = target.supersetId || target.item.superset_ui_id || target.item.ui_id; 
        draggedItem.current_section_id = target.sectionId; 
        
        const exercisesInTargetSuperset = exercises
          .filter(ex => ex.superset_ui_id === draggedItem.superset_ui_id && ex.ui_id !== draggedItem.ui_id)
          .sort((a,b) => a.position_in_superset - b.position_in_superset);
        
        let insertAtIndex = exercisesInTargetSuperset.length; 
        if (target.item?.ui_id !== draggedItem.superset_ui_id && target.position !== 'inside-empty') { 
            const overItemIndex = exercisesInTargetSuperset.findIndex(ex => ex.ui_id === target.item.ui_id);
            if (overItemIndex !== -1) {
                insertAtIndex = target.position === 'before' ? overItemIndex : overItemIndex + 1;
            }
        }
        
        // Create a temporary list, insert the dragged item, then re-assign positions
        let tempSupersetList = [...exercisesInTargetSuperset];
        tempSupersetList.splice(insertAtIndex, 0, draggedItem);
        tempSupersetList.forEach((ex, idx) => ex.position_in_superset = idx + 1);
        
        // Update the main exercises list
        // Remove the dragged item from its original place (if it was already in formData.exercises)
        exercises = exercises.filter(ex => ex.ui_id !== draggedItem.ui_id);
        // Remove all items that were part of the target superset (to avoid duplicates before adding updated list)
        exercises = exercises.filter(ex => ex.superset_ui_id !== draggedItem.superset_ui_id);
        // Add back the correctly ordered items of the target superset
        exercises = [...exercises, ...tempSupersetList];
        
        toast({ title: "Added to Superset", description: `${draggedItem.name} added.` });

      } else if (operationType === 'reorder-within-superset') {
        // Filter out the dragged item first to get the list of other items in the superset
        const supersetExercises = exercises
            .filter(ex => ex.superset_ui_id === source.supersetId && ex.ui_id !== draggedItem.ui_id)
            .sort((a,b) => a.position_in_superset - b.position_in_superset);

        const targetIndex = supersetExercises.findIndex(ex => ex.ui_id === target.item.ui_id);
        if (targetIndex !== -1) { // Dropped onto an existing item
            const insertAtIndex = target.position === 'before' ? targetIndex : targetIndex + 1;
            supersetExercises.splice(insertAtIndex, 0, draggedItem); // Insert dragged item
        } else { // Dropped into empty space or invalid target, append to end
            supersetExercises.push(draggedItem);
        }
        // Re-assign sequential positions
        supersetExercises.forEach((ex, idx) => ex.position_in_superset = idx + 1);
        
        // Update main exercises list: remove old versions of these superset items, then add updated ones
        exercises = exercises.filter(ex => ex.superset_ui_id !== source.supersetId);
        exercises = [...exercises, ...supersetExercises];

      } else if (operationType === 'move-to-section-end') {
        draggedItem.current_section_id = target.sectionId;
        if (draggedItem.superset_ui_id) { // Clean up old superset if item is removed
          const oldSupersetId = draggedItem.superset_ui_id;
          const remainingInOldSuperset = exercises.filter(ex => ex.superset_ui_id === oldSupersetId && ex.ui_id !== draggedItem.ui_id);
          if (remainingInOldSuperset.length < 2) {
              remainingInOldSuperset.forEach(ex => { ex.superset_ui_id = null; ex.position_in_superset = null; });
          } else {
              remainingInOldSuperset.sort((a,b) => a.position_in_superset - b.position_in_superset).forEach((ex, idx) => ex.position_in_superset = idx + 1);
          }
        }
        draggedItem.superset_ui_id = null;
        draggedItem.position_in_superset = null;
      } else if (operationType === 'reorder-items') { // Standard reorder of exercises/supersets within/between sections
        draggedItem.current_section_id = target.sectionId;
        // If dragged item was in a superset and target is not (or diff superset), it exits its original superset
        if (draggedItem.superset_ui_id && draggedItem.superset_ui_id !== (target.supersetId || target.item?.superset_ui_id)) {
            const oldSupersetId = draggedItem.superset_ui_id;
            draggedItem.superset_ui_id = null;
            draggedItem.position_in_superset = null;

            const remainingInOldSuperset = exercises.filter(ex => ex.superset_ui_id === oldSupersetId && ex.ui_id !== draggedItem.ui_id);
            if (remainingInOldSuperset.length < 2) {
                remainingInOldSuperset.forEach(ex => { ex.superset_ui_id = null; ex.position_in_superset = null; });
            } else {
                remainingInOldSuperset
                    .sort((a,b) => a.position_in_superset - b.position_in_superset)
                    .forEach((ex, idx) => ex.position_in_superset = idx + 1);
            }
        }
        // position_in_section will be handled by normalize
      }
      // Ensure exercises list is clean of duplicates before normalizing (belt and suspenders)
      const uniqueExercises = Array.from(new Set(exercises.map(e => e.ui_id))).map(id => exercises.find(e => e.ui_id === id));
      return { ...prevFormData, exercises: normalizeExercisePositions(uniqueExercises) };
    });
  }, [activeSession, formData.sessions, setFormData, toast]);

  const handleInternalExerciseFieldChange = useCallback((exerciseUiId, field, value) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const updatedExercises = prevFormData.exercises.map(ex => {
        if (ex.ui_id === exerciseUiId && ex.session_id === currentSessionId) {
          const updatedEx = { ...ex, [field]: value };
          if (field === 'sets') {
            const newSetCount = parseInt(value, 10) || 1;
            const currentSetCount = updatedEx.set_details.length;
            if (newSetCount > currentSetCount) {
              for (let i = currentSetCount; i < newSetCount; i++) {
                updatedEx.set_details.push({
                  ui_id: nanoid(), db_id: null, set_number: i + 1,
                  reps: updatedEx.set_details[currentSetCount-1]?.reps || null,
                  weight: updatedEx.set_details[currentSetCount-1]?.weight || null,
                  // TODO: copy other fields from last set or provide defaults
                });}
            } else if (newSetCount < currentSetCount) {
              updatedEx.set_details = updatedEx.set_details.slice(0, newSetCount);
            }}
          return updatedEx; }
        return ex; });
      return { ...prevFormData, exercises: updatedExercises }; });
  }, [activeSession, formData.sessions, setFormData]);

  const handleInternalSetDetailChange = useCallback((exerciseUiId, setUiId, field, value) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const updatedExercises = prevFormData.exercises.map(ex => {
        if (ex.ui_id === exerciseUiId && ex.session_id === currentSessionId) {
          const updatedSetDetails = ex.set_details.map(set => {
            if (set.ui_id === setUiId) { return { ...set, [field]: value }; }
            return set; });
          return { ...ex, set_details: updatedSetDetails }; }
        return ex; });
      return { ...prevFormData, exercises: updatedExercises }; });
  }, [activeSession, formData.sessions, setFormData]);

  const handleInternalAddSet = useCallback((exerciseUiId) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const updatedExercises = prevFormData.exercises.map(ex => {
        if (ex.ui_id === exerciseUiId && ex.session_id === currentSessionId) {
          const newSetNumber = ex.set_details.length + 1;
          const lastSet = ex.set_details[ex.set_details.length - 1] || {};
          const newSet = {
            ui_id: nanoid(), db_id: null, set_number: newSetNumber,
            reps: lastSet.reps || null, weight: lastSet.weight || null,
            rest: lastSet.rest || null, effort: lastSet.effort || null,
            rpe: lastSet.rpe || null, tempo: lastSet.tempo || null,
            power: lastSet.power || null, velocity: lastSet.velocity || null,
          };
          return { ...ex, set_details: [...ex.set_details, newSet], sets: newSetNumber };}
        return ex; });
      return { ...prevFormData, exercises: updatedExercises }; });
  }, [activeSession, formData.sessions, setFormData]);

  const handleInternalRemoveSet = useCallback((exerciseUiId, setUiId) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const updatedExercises = prevFormData.exercises.map(ex => {
        if (ex.ui_id === exerciseUiId && ex.session_id === currentSessionId) {
          if (ex.set_details.length <= 1) {
            toast({ title: "Cannot Remove Set", description: "Each exercise must have at least one set.", variant: "destructive" });
            return ex;
          }
          const updatedSetDetails = ex.set_details
            .filter(set => set.ui_id !== setUiId)
            .map((set, index) => ({ ...set, set_number: index + 1 }));
          return { ...ex, set_details: updatedSetDetails, sets: updatedSetDetails.length };}
        return ex; });
      return { ...prevFormData, exercises: updatedExercises }; });
  }, [activeSession, formData.sessions, setFormData, toast]);

  // Superset specific handlers - these will also need to operate on currentSessionId
  const handleInternalCreateSuperset = useCallback((sectionId, exerciseUiIds) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject || !exerciseUiIds || exerciseUiIds.length < 2) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const newSupersetUiId = `ss-${nanoid()}`;
      let exercises = [...prevFormData.exercises];
      let exercisesInNewSuperset = [];
      let firstExerciseInSuperset = null;

      exerciseUiIds.forEach((exId, index) => {
        const exercise = exercises.find(e => e.ui_id === exId && e.session_id === currentSessionId);
        if (exercise) {
          exercise.superset_ui_id = newSupersetUiId;
          exercise.position_in_superset = index + 1;
          if (index === 0) firstExerciseInSuperset = exercise;
          exercisesInNewSuperset.push(exercise); }
      });
      
      if (firstExerciseInSuperset) {
        const commonPositionInSection = firstExerciseInSuperset.position_in_section;
        exercisesInNewSuperset.forEach(ex => { ex.position_in_section = commonPositionInSection; }); }
      
      toast({ title: "Superset Created" });
      return { ...prevFormData, exercises: normalizeExercisePositions(exercises) }; });
  }, [activeSession, formData.sessions, setFormData, toast]);

  const handleInternalAddExerciseToSuperset = useCallback((exerciseData, sectionId, targetSupersetUiId) => {
    handleInternalAddExercise(exerciseData, sectionId, targetSupersetUiId);
  }, [handleInternalAddExercise]);


  const handleInternalRemoveFromSuperset = useCallback((exerciseUiId) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      let exercises = [...prevFormData.exercises];
      const exercise = exercises.find(ex => ex.ui_id === exerciseUiId && ex.session_id === currentSessionId);
      if (!exercise || !exercise.superset_ui_id) return prevFormData;

      const oldSupersetId = exercise.superset_ui_id;
      exercise.superset_ui_id = null;
      exercise.position_in_superset = null;
      
      const remainingInOldSuperset = exercises.filter(ex => ex.superset_ui_id === oldSupersetId && ex.ui_id !== exerciseUiId);
      if (remainingInOldSuperset.length < 2) { 
        remainingInOldSuperset.forEach(ex => { ex.superset_ui_id = null; ex.position_in_superset = null; });
        toast({ title: "Superset Dissolved", description: "Removed from superset, which now has less than 2 items." });
      } else {
        remainingInOldSuperset.sort((a,b) => a.position_in_superset - b.position_in_superset).forEach((ex, idx) => ex.position_in_superset = idx + 1);
        toast({ title: "Removed from Superset" }); }
      return { ...prevFormData, exercises: normalizeExercisePositions(exercises) }; });
  }, [activeSession, formData.sessions, setFormData, toast]);

  const handleInternalExitSuperset = useCallback((supersetUiId) => { 
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    setFormData(prevFormData => {
      const updatedExercises = prevFormData.exercises.map(ex => {
        if (ex.superset_ui_id === supersetUiId && ex.session_id === currentSessionId) {
          return { ...ex, superset_ui_id: null, position_in_superset: null }; }
        return ex; });
      toast({ title: "Superset Dissolved" });
      return { ...prevFormData, exercises: normalizeExercisePositions(updatedExercises) }; });
  }, [activeSession, formData.sessions, setFormData, toast]);
  
  const handleInternalSupersetStructureChange = useCallback((supersetsForCurrentSession) => {
    // This handler might be used if ExerciseSectionManager directly manipulates a supersets array
    // and StepTwoPlanner needs to sync that into its state (e.g., for a separate timeline component).
    // For now, supersets are derived from formData.exercises. If ESM needs to pass back a
    // complete superset structure, this is where it would be handled.
    console.log("Superset structure changed for active session:", supersetsForCurrentSession);
    // Example: setFormData(prev => ({...prev, sessionSupersets: {...prev.sessionSupersets, [currentSessionObject?.id]: supersetsForCurrentSession }}));
  }, [activeSession, formData.sessions, setFormData]); // formData.sessions dependency for currentSessionObject?.id


  // AI Autofill for a single exercise (if needed by ExerciseSectionManager)
  const handleAutoFillRequest = async (exerciseUiId, exerciseName, sectionType) => {
    const currentSessionObject = formData.sessions[activeSession];
    if (!currentSessionObject) return;
    const currentSessionId = currentSessionObject.id;

    if (!clerkSession) {
      toast({ title: "Authentication Error", description: "User session not found.", variant: "destructive" });
      return; }
    console.log(`Requesting AI fill for ${exerciseName} (ID: ${exerciseUiId}) in section ${sectionType} of session ${currentSessionId}`);
    // Placeholder: actual API call and state update would go here
    toast({ title: "AI Fill Requested", description: `Filling details for ${exerciseName}...` });
  };
  
  // Data fetching and mapping for existing plan
  useEffect(() => {
    const loadPlanData = async () => {
      const planId = formData.id; 
      if (planId && formData.isEditing && !formData.planLoaded) {
        try {
          // Placeholder: Simulate loading
          console.log("Simulating loading existing plan data for plan ID:", planId);
          // Example: const mappedExercises = rawPresetData.map(p => mapPresetToExercise(p, allExerciseDefinitions));
          // setFormData(prev => ({...prev, exercises: mappedExercises, planLoaded: true}));

        } catch (err) {
          console.error("Error loading plan data:", err);
          toast({ title: "Error Loading Plan", description: err.message, variant: "destructive"}); } }
    };
    loadPlanData();
  }, [formData.id, formData.isEditing, formData.planLoaded, setFormData, supabase, toast]); // Removed mapPresetToExercise dependency as it's defined in scope

  const mapPresetToExercise = (preset, exerciseDefinitions) => {
    const definition = exerciseDefinitions.find(def => def.id === preset.exercise_id);
    if (!definition) return null;

    const exerciseUiId = nanoid();
    const setDetails = (preset.exercise_preset_details || []).map(detail => ({
      ui_id: nanoid(), db_id: detail.id, set_number: detail.set_number || detail.set_index, 
      reps: detail.reps, weight: detail.weight, // ... map other set detail fields
      rpe: detail.rpe, tempo: detail.tempo, notes: detail.notes, 
    }));

    return {
      ui_id: exerciseUiId,
      db_id: preset.id, 
      exercise_definition_id: preset.exercise_id,
      name: definition.name,
      current_section_id: preset.section_id || definition.type?.toLowerCase() || 'main', 
      session_id: preset.session_id, 
      position_in_section: preset.preset_order || 0,
      superset_ui_id: preset.superset_id ? `ss-${preset.superset_id}` : null, 
      position_in_superset: preset.position_in_superset || null,
      sets: setDetails.length || 1,
      reps: preset.reps || setDetails[0]?.reps || null,
      notes: preset.notes || '',
      set_details: setDetails.length > 0 ? setDetails : [{ui_id: nanoid(), db_id: null, set_number: 1, reps: null, weight: null}], // Ensure at least one default set
      type: definition.type,
      equipment: definition.equipment,
      part: preset.section_id || definition.type?.toLowerCase() || 'main',
    };
  };
  
  // Memoized values for ExerciseSectionManager
  const exercisesForCurrentManager = useMemo(() => {
    return getExercisesForCurrentSession();
  }, [getExercisesForCurrentSession]);

  const currentSessionIdForManager = useMemo(() => {
    const currentSessionObject = formData.sessions[activeSession];
    return currentSessionObject?.id;
  }, [formData.sessions, activeSession]);
  
  const sessionModeForManager = useMemo(() => {
    const currentSessionObject = formData.sessions[activeSession];
    return currentSessionObject?.session_mode || 'individual';
  }, [formData.sessions, activeSession]);


  // Function to get section name - can be passed to ESM
  const getSectionName = (sectionId) => {
    if (!sectionId) return "Unnamed Section";
    // Example: 'warm-up' -> 'Warm-up', 'main-strength' -> 'Main Strength'
    return sectionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!formData.sessions || formData.sessions.length === 0 || !formData.sessions[activeSession]) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-600">Loading session data...</p>
      </div>
    );
  }
  
  const currentSessionData = formData.sessions[activeSession];
  // const sessionMode = currentSessionData?.session_mode || 'individual'; // Already available as sessionModeForManager

  return (
    <div className="space-y-6">
      {userRole === 'coach' && athleteProfile && !profileLoading && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {/* Placeholder for athlete image */}
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800">{athleteProfile.firstName} {athleteProfile.lastName}</h3>
                <p className="text-sm text-blue-600">Planning for {athleteProfile.sport}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {profileLoading && <Loader2 className="h-6 w-6 animate-spin" />}

      {/* Main Content Area for the Current Active Session */}
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Plan Your Session: {currentSessionData?.name || `Session ${activeSession + 1}`}</h2>
            <p className="text-sm text-gray-500">
              Configure exercises for day {activeSession + 1} of your mesocycle. Current mode: <span className="font-semibold">{sessionModeForManager}</span>.
            </p>
          </div>
          {/* AI Fill All button can be re-added here if desired for the whole session */}
        </div>

        {/* Session details inputs and Day Navigation */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor={`session-name-${activeSession}`}>Session Name</Label>
                <Input
                  id={`session-name-${activeSession}`}
                  value={currentSessionData?.name || ""}
                  onChange={(e) => handleSessionInputChange(activeSession, "name", e.target.value)}
                  placeholder="e.g., Monday - Full Body"
                />
              </div>
              <div>
                <Label htmlFor={`session-date-${activeSession}`}>Session Date (Optional)</Label>
                <Input
                  type="date"
                  id={`session-date-${activeSession}`}
                  value={currentSessionData?.date || ""}
                  onChange={(e) => handleSessionInputChange(activeSession, "date", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSession(prev => Math.max(0, prev - 1))}
                  disabled={activeSession === 0}
                  aria-label="Previous session"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev Day
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSession(prev => Math.min(formData.sessions.length - 1, prev + 1))}
                  disabled={activeSession === formData.sessions.length - 1}
                  aria-label="Next session"
                >
                  Next Day
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 
          REMOVED TABS AND CONTENT THAT WAS INSIDE THEM 
          The main ExerciseSectionManager will be rendered here in subtask 7.2
          It will operate on the `activeSession`
        */}
        <ExerciseSectionManager 
          key={`esm-${activeSession}-${currentActiveSections.join('-')}-${currentSessionIdForManager}`} // Ensure re-render on session or active sections change
          sessionId={currentSessionIdForManager} 
          exercises={exercisesForCurrentManager} 
          activeSections={currentActiveSections} 
          setActiveSections={setCurrentActiveSections} 
          mode={sessionModeForManager} 
          onAddExercise={handleInternalAddExercise} 
          onRemoveExercise={handleInternalRemoveExercise} 
          onReorderExercises={handleInternalReorderExercises} 
          onExerciseFieldChange={handleInternalExerciseFieldChange} 
          onSetDetailChange={handleInternalSetDetailChange} 
          onAddSet={handleInternalAddSet} 
          onRemoveSet={handleInternalRemoveSet} 
          onCreateSuperset={handleInternalCreateSuperset}
          onAddExerciseToSuperset={handleInternalAddExerciseToSuperset}
          onRemoveFromSuperset={handleInternalRemoveFromSuperset}
          onExitSuperset={handleInternalExitSuperset}
          onSupersetStructureChange={handleInternalSupersetStructureChange} // This might be optional if ESM doesn't directly return supersets
          availableExercises={filteredExercises} 
          loadingAvailableExercises={loadingExercises} 
          onAutoFillRequest={handleAutoFillRequest} // For individual exercise AI fill
          getSectionName={getSectionName}
          // errors={errors} // Passing top-level errors. Individual exercise errors are managed in ExerciseItemFull
          // Note: aiLoading, setAiLoading, etc., for individual exercises are now managed within ExerciseItemFull or its children.
          // Global AI fill for the whole session (if re-added) would be managed in StepTwoPlanner.
        />
        {/* 
        // <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        //   <TabsList className="grid w-full grid-cols-2 mb-4">
        //     <TabsTrigger value="exercises">Exercise Planner</TabsTrigger>
        //     <TabsTrigger value="timeline">Session Timeline</TabsTrigger>
        //   </TabsList>
        // 
        //   <TabsContent value="exercises">
        //     <ExerciseSectionManager 
        //       key={`esm-${activeSession}-${currentActiveSections.join('-')}`} // Ensure re-render on session or active sections change
        //       sessionId={currentSessionIdForManager} 
        //       exercises={exercisesForCurrentManager} 
        //       activeSections={currentActiveSections} 
        //       setActiveSections={setCurrentActiveSections} 
        //       mode={sessionModeForManager} 
        //       onAddExercise={handleInternalAddExercise} 
        //       onRemoveExercise={handleInternalRemoveExercise} 
        //       onReorderExercises={handleInternalReorderExercises} 
        //       onExerciseFieldChange={handleInternalExerciseFieldChange} 
        //       onSetDetailChange={handleInternalSetDetailChange} 
        //       onAddSet={handleInternalAddSet} 
        //       onRemoveSet={handleInternalRemoveSet} 
        //       onCreateSuperset={handleInternalCreateSuperset}
        //       onAddExerciseToSuperset={handleInternalAddExerciseToSuperset}
        //       onRemoveFromSuperset={handleInternalRemoveFromSuperset}
        //       onExitSuperset={handleInternalExitSuperset}
        //       onSupersetStructureChange={handleInternalSupersetStructureChange}
        //       availableExercises={filteredExercises} 
        //       loadingAvailableExercises={loadingExercises} 
        //       onAutoFillRequest={handleAutoFillRequest} 
        //       // aiLoading, setAiLoading, aiCooldown, setAiCooldown, aiHistory, setAiHistory will be managed internally or via context by ESM
        //       getSectionName={getSectionName}
        //       errors={errors} // Pass down errors if ESM needs to display them
        //     />
        //   </TabsContent>
        // 
        //   <TabsContent value="timeline">
        //     <ExerciseTimeline // This component is removed
        //       exercises={getExercisesForCurrentSession()} // Example of how it might get data
        //       sessionMode={sessionModeForManager}
        //       sessionSections={currentActiveSections} // Example
        //       getSectionName={getSectionName}
        //       // supersets={sessionSupersets[currentSessionIdForManager] || []} // This state is removed
        //     />
        //   </TabsContent>
        // </Tabs>
        */}

      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button onClick={handleBack} variant="outline" className="px-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="px-6 bg-blue-600 hover:bg-blue-700">
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepTwoPlanner;

// Helper: Defines structure for different session modes and their sections
// This is just an example, adapt to your actual section logic
const sessionSectionsData = {
  individual: {
    id: 'individual',
    name: 'Individual Session',
    sections: [ // Example structure if ESM needs this
      { id: 'warm-up', name: 'Warm-up', exercises: [] },
      { id: 'main', name: 'Main Workout', exercises: [] },
      { id: 'cool-down', name: 'Cool-down', exercises: [] },
    ],
    defaultSections: ['warm-up', 'main', 'cool-down'] 
  },
  group: {
    id: 'group',
    name: 'Group Session',
    sections: [ // Example structure
      { id: 'sprint', name: 'Sprint Drills', exercises: [] },
      { id: 'technique', name: 'Technique Work', exercises: [] },
      { id: 'recovery', name: 'Recovery & Mobility', exercises: [] },
    ],
    defaultSections: ['sprint']
  }
};

// Helper: Normalize exercise positions 
// This function needs to be robust to handle supersets as blocks.
function normalizeExercisePositions(exercises) {
  // Group exercises by session and then by section
  const groupedBySessionAndSection = exercises.reduce((acc, ex) => {
    const key = `${ex.session_id || 'no-session'}-${ex.current_section_id || 'no-section'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(ex);
    return acc;
  }, {});

  let finalNormalizedExercises = [];

  for (const groupKey in groupedBySessionAndSection) {
    const sectionExercises = groupedBySessionAndSection[groupKey];
    
    // Segregate exercises into supersets (as blocks) and individual items
    const supersetMap = new Map(); // Stores superset items, key is superset_ui_id
    const individualExercises = [];

    sectionExercises.forEach(ex => {
      if (ex.superset_ui_id) {
        if (!supersetMap.has(ex.superset_ui_id)) {
          supersetMap.set(ex.superset_ui_id, {
            // Store the first encountered position_in_section for the superset block
            // This helps in sorting superset blocks relative to individual exercises
            block_position_in_section: ex.position_in_section, 
            items: []
          });
        }
        supersetMap.get(ex.superset_ui_id).items.push(ex);
      } else {
        individualExercises.push(ex);
      }
    });

    // Sort exercises within each superset block by their position_in_superset
    supersetMap.forEach(supersetData => {
      supersetData.items.sort((a, b) => (a.position_in_superset || 0) - (b.position_in_superset || 0));
      // Update block_position_in_section to be the min of its items, if not already accurate
      if (supersetData.items.length > 0) {
        supersetData.block_position_in_section = Math.min(...supersetData.items.map(i => i.position_in_section));
      }
    });

    // Create a list of all items (individual exercises and entire superset blocks) to sort for section order
    const sectionOrderableItems = [
      ...individualExercises,
      ...Array.from(supersetMap.values()).map(supersetData => ({ 
        isSupersetBlock: true,
        items: supersetData.items,
        // Use the determined block_position_in_section for sorting
        position_in_section: supersetData.block_position_in_section, 
        superset_ui_id: supersetData.items[0]?.superset_ui_id // For reference
      }))
    ];
    
    // Sort these items by their effective position_in_section
    // Fallback to 0 if position_in_section is undefined to avoid NaN issues in sort
    sectionOrderableItems.sort((a, b) => (a.position_in_section || 0) - (b.position_in_section || 0));

    // Flatten and re-assign position_in_section sequentially
    let currentPositionInSection = 1;
    sectionOrderableItems.forEach(item => {
      if (item.isSupersetBlock) {
        item.items.forEach(exInSuperset => {
          exInSuperset.position_in_section = currentPositionInSection;
          finalNormalizedExercises.push(exInSuperset);
        });
      } else { // Individual exercise
        item.position_in_section = currentPositionInSection;
        finalNormalizedExercises.push(item);
      }
      currentPositionInSection++; // Increment for the next block/item
    });
  }
  return finalNormalizedExercises;
}