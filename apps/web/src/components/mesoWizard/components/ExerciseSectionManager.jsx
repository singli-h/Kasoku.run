"use client"

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Flame,
  Dumbbell,
  RotateCcw,
  ArrowUpCircle,
  Pause,
  Timer,
  Target,
  PlusCircle,
  GripVertical,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExerciseType } from "@/types/exercise"
import SupersetContainer from "./SupersetContainer"
import ExerciseContextMenu from "./ExerciseContextMenu"
import ExerciseSelector from "./ExerciseSelector"
import ExerciseItemFull from "./ExerciseItemFull"
import { cn } from "@/lib/utils"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"

/**
 * Exercise Section Manager Component
 * 
 * Manages exercise sections within a training session, including:
 * - Adding/removing sections
 * - Reordering sections via drag and drop
 * - Adding/removing exercises to sections
 * - Configuring exercise details
 * 
 * @param {Object} props - Component props
 * @param {number} props.sessionId - Current session ID
 * @param {Array} props.exercisesInSection - Exercises specifically for the currently active sections in this session instance.
 * @param {Array} props.allExercisesInSession - All exercises for the entire current session (across all sections).
 * @param {Array} props.availableExercises - Full list of exercise definitions that can be added (globally filtered).
 * @param {boolean} props.loadingAvailableExercises - Loading state for availableExercises.
 * @param {Function} props.onAddExercise - (exerciseData, sectionId) => void
 * @param {Function} props.onRemoveExercise - (exerciseUiId) => void
 * @param {Function} props.onExerciseFieldChange - (exerciseUiId, field, value) => void
 * @param {Function} props.onSetDetailChange - (exerciseUiId, setUiId, field, value) => void
 * @param {Function} props.onAddSet - (exerciseUiId) => void
 * @param {Function} props.onRemoveSet - (exerciseUiId, setUiId) => void
 * @param {Function} props.onCreateSuperset - (sectionId, selectedExerciseUiIds) => void
 * @param {Function} props.onRemoveExerciseFromSuperset - (exerciseUiId) => void // Exercise knows its superset, just remove it
 * @param {Function} props.onDeleteSuperset - (supersetUiId, sectionId) => void
 * @param {Function} props.onReorderExercises - (sectionId, draggedItem, targetItem, position) => void
 * @param {Function} props.onSupersetStructureChange - Callback when superset structures change (e.g., for timeline) (supersets) => void.
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.setActiveSections - Function to set active sections
 * @param {string} props.mode - Mode of operation ('individual' or 'group')
 * @param {Object} props.errors - Validation errors from parent.
 * @param {Function} props.getSectionName - Function to get a displayable name for a sectionId.
 */
const ExerciseSectionManager = memo(({
  sessionId,
  exercisesInSection, // Use this for rendering items within sections
  allExercisesInSession, // Use this for context, like initializing supersets if they span sections (though current model is per-section)
  availableExercises, // Renamed from filteredExercises
  loadingAvailableExercises, // New prop
  onAddExercise,
  onRemoveExercise,
  onExerciseFieldChange,
  onSetDetailChange,
  onAddSet,
  onRemoveSet,
  onCreateSuperset,
  onRemoveExerciseFromSuperset,
  onDeleteSuperset,
  onReorderExercises,
  onSupersetStructureChange, // Renamed from onSupersetChange
  activeSections = [],
  setActiveSections,
  mode = 'individual',
  errors,
  getSectionName: getSectionNameFromParent, // Renamed to avoid conflict with internal getSectionName
  // Old props (to be removed or their usage replaced):
  // exercises, (replaced by exercisesInSection and allExercisesInSession)
  // filteredExercises, (replaced by availableExercises)
  // handleAddExercise, (replaced by onAddExercise)
  // handleRemoveExercise, (replaced by onRemoveExercise)
  // handleExerciseReorder, (replaced by onReorderExercises)
  // handleExerciseFieldChange, (replaced by onExerciseFieldChange)
  // handleSetDetailChange, (replaced by onSetDetailChange)
  // handleAddSet, (replaced by onAddSet)
  // handleRemoveSet, (replaced by onRemoveSet)
  // onSupersetChange, (replaced by onSupersetStructureChange)
  // handleCreateSuperset, (replaced by onCreateSuperset)
  // handleAddExerciseToSuperset, // More complex, might be part of onReorder or a new specific handler if needed
  // handleRemoveFromSuperset, (replaced by onRemoveExerciseFromSuperset or onDeleteSuperset)
  // handleExitSuperset, (replaced by onDeleteSuperset)
  // handleMoveExercise, // Covered by onReorderExercises
  // handleMoveSuperset // Covered by onReorderExercises
}) => {
  // Available section types based on ExerciseType enum
  const sectionTypes = useMemo(() => [
    { id: "warmup", name: "Warm-up", icon: <Flame className="h-4 w-4" />, typeId: ExerciseType.WarmUp },
    { id: "gym", name: "Gym Exercises", icon: <Dumbbell className="h-4 w-4" />, typeId: ExerciseType.Gym },
    { id: "circuit", name: "Circuits", icon: <RotateCcw className="h-4 w-4" />, typeId: ExerciseType.Circuit },
    { id: "plyometric", name: "Plyometrics", icon: <ArrowUpCircle className="h-4 w-4" />, typeId: ExerciseType.Plyometric },
    { id: "isometric", name: "Isometrics", icon: <Pause className="h-4 w-4" />, typeId: ExerciseType.Isometric },
    { id: "sprint", name: "Sprints", icon: <Timer className="h-4 w-4" />, typeId: ExerciseType.Sprint },
    { id: "drill", name: "Drills", icon: <Target className="h-4 w-4" />, typeId: ExerciseType.Drill },
  ], [])
  
  // Helper to extract the original section type from an instance ID
  const getSectionType = useCallback((instanceId) => {
    // instanceId may be like 'gym-1623456789'; type is prefix before the first '-'
    return instanceId.includes('-') ? instanceId.split('-')[0] : instanceId
  }, [])
  
  // Limit section types when in group mode to only Sprint
  const availableSectionTypes = useMemo(() =>
    mode === 'group'
      ? sectionTypes.filter(s => s.id === 'sprint')
      : sectionTypes
  , [mode, sectionTypes])

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  
  // State for managing supersets
  const [supersets, setSupersets] = useState([])
  
  // Reference to store previous supersets state to prevent unnecessary updates
  const prevSupersetsRef = useRef('');
  
  // Initialize expanded sections
  useEffect(() => {
    if (activeSections.length > 0 && expandedSections.length === 0) {
      // Expand all sections on first load; preserve across tab switches
      setExpandedSections(activeSections);
    }
  }, [activeSections, expandedSections]);
  
  // Initialize supersets based on exercises in the current session
  useEffect(() => {
    if (!allExercisesInSession || !allExercisesInSession.length) {
      // If no exercises in the session, or prop not ready, ensure supersets are cleared if they exist
      if (supersets.length > 0) setSupersets([]);
      return;
    }
    
    const supersetMap = new Map();
    allExercisesInSession.forEach(exercise => {
      if (exercise.superset_ui_id && activeSections.includes(exercise.current_section_id)) { // Process only for active sections
        if (!supersetMap.has(exercise.superset_ui_id)) {
          supersetMap.set(exercise.superset_ui_id, {
            ui_id: exercise.superset_ui_id,
            exercises: [],
            host_section_id: exercise.current_section_id,
            position_in_section: Infinity,
            display_number: 0 
          });
        }
        const supGroup = supersetMap.get(exercise.superset_ui_id);
        supGroup.exercises.push({ ...exercise }); // Store a copy
        supGroup.position_in_section = Math.min(supGroup.position_in_section, exercise.position_in_section);
      }
    });
    
    const newSupersetsFromExercises = Array.from(supersetMap.values()).map((sup, index) => ({
      ...sup,
      exercises: sup.exercises.sort((a,b) => a.position_in_superset - b.position_in_superset),
      display_number: index + 1 // This display_number might need to be based on overall section order
    }));

    // Debounced or careful update to avoid rapid state changes if allExercisesInSession updates frequently
    // For now, direct update. Compare to prevent loops.
    if (JSON.stringify(newSupersetsFromExercises) !== JSON.stringify(supersets)) {
      setSupersets(newSupersetsFromExercises);
      if (onSupersetStructureChange) {
        onSupersetStructureChange(newSupersetsFromExercises); // Notify parent
      }
    }

  // Dependency array: include allExercisesInSession and activeSections. 
  // Stringifying complex objects in dependency arrays can be tricky. 
  // Consider a more robust way if this causes issues, e.g. useMemo for derived values.
  }, [allExercisesInSession, activeSections, supersets, onSupersetStructureChange]); // Added supersets to dep array to allow internal changes to also trigger parent update
  
  // Get section icon
  const getSectionIcon = useCallback((sectionId) => {
    const typeId = getSectionType(sectionId)
    const section = sectionTypes.find((s) => s.id === typeId)
    return section ? section.icon : <Dumbbell className="h-4 w-4" />
  }, [sectionTypes, getSectionType])
  
  // Get section name (internal, if different from parent's, or use parent's)
  const getSectionNameLocal = useCallback((sectionId) => {
    const typeId = getSectionType(sectionId)
    const section = sectionTypes.find((s) => s.id === typeId)
    return section ? section.name : sectionId
  }, [sectionTypes, getSectionType])
  
  // Use the one from parent if provided, otherwise local one
  const currentGetSectionName = getSectionNameFromParent || getSectionNameLocal;
  
  // Get exercises for a section - now uses exercisesInSection
  const getSectionExercisesRaw = useCallback((sectionId) => {
    return exercisesInSection.filter(ex => ex.current_section_id === sectionId);
  }, [exercisesInSection]);
  
  // Helper function to get exercises sorted by superset and position - uses exercisesInSection
  const getOrderedItemsForSection = useCallback((sectionId) => {
    const items = [];
    const exercisesToProcess = exercisesInSection.filter(ex => ex.current_section_id === sectionId);
    const processedSupersetUiIds = new Set();

    // Ensure exercises are sorted by position_in_section before processing
    exercisesToProcess.sort((a, b) => a.position_in_section - b.position_in_section);

    exercisesToProcess.forEach(ex => {
      if (ex.superset_ui_id) {
        if (!processedSupersetUiIds.has(ex.superset_ui_id)) {
          // Find the full superset object from our internal supersets state
          const supersetObject = supersets.find(s => s.ui_id === ex.superset_ui_id && s.host_section_id === sectionId);
          if (supersetObject) {
            // Make sure exercises within this supersetObject are also sorted by position_in_superset
            const sortedExercisesInSuperset = [...supersetObject.exercises].sort((a,b) => a.position_in_superset - b.position_in_superset);
            items.push({ 
              ...supersetObject, 
              exercises: sortedExercisesInSuperset, // Use the sorted list
              itemType: 'superset' 
            });
            processedSupersetUiIds.add(ex.superset_ui_id);
          }
        }
      } else {
        items.push({ ...ex, itemType: 'exercise' });
      }
    });
    // The items should already be in correct order due to pre-sorting exercisesToProcess 
    // and processing them in that order.
    // If supersets themselves need re-ordering relative to individual exercises based on their shared 'position_in_section',
    // an additional sort might be needed here on `items` based on `item.position_in_section`.
    return items.sort((a,b) => a.position_in_section - b.position_in_section);
  }, [exercisesInSection, supersets]); // Added supersets dependency
  
  // Replace cleanup section of useEffect with dnd-kit compatible version
  useEffect(() => {
    // Event handlers for global interactions
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDragging) {
        setIsDragging(false);
        document.body.classList.remove('dragging');
      }
    };
    
    const handleMouseUp = () => {
      // This is a safety measure to ensure dragging state is reset if a drag operation ends unexpectedly
      if (isDragging) {
        // Use a timeout to avoid conflicts with the normal drag end handler
        const timer = setTimeout(() => {
            setIsDragging(false);
            document.body.classList.remove('dragging');
        }, 100);
        
        return () => clearTimeout(timer);
      }
    };
    
    // Add global event listeners
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    
    // When component unmounts, ensure we clean up any lingering drag states
    return () => {
      document.body.classList.remove('dragging');
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Add sensors and handling for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Activation delay to ensure click events still work with drag handles
      activationConstraint: {
        delay: 150,
        tolerance: 5
      }
    }),
    useSensor(TouchSensor, {
      // Similar constraints for touch
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure activeSections is always an array before use
  const currentActiveSections = Array.isArray(activeSections) ? activeSections : [];

  // Replace drag handlers with dnd-kit versions
  const handleDragStart = (event) => {
    const { active } = event;
    // Check if the item being dragged is a section header or other type
    // The `type` is now directly available in active.data.current.type
    if (active.data.current?.type !== 'section') { // Changed from 'section-header' to 'section'
         document.body.style.cursor = "grabbing";
    }
      setIsDragging(true);
  };

  const handleDragEnd = useCallback((event) => {
    document.body.style.cursor = "";
    setIsDragging(false);

    const { active, over } = event;

    if (!active || !over) return;

    const activeId = active.id;
    const overId = over.id;

    // Extract data from active.data.current and over.data.current
    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) {
      console.error("DragEnd: Missing active.data.current");
      return;
    }

    // Avoid processing if item is dropped on itself without a meaningful action change
    if (activeId === overId) {
        const isExerciseToDifferentSuperset = 
            activeData.type === 'exercise' && 
            overData?.type === 'superset' &&
            activeData.item?.superset_ui_id !== overData.item?.ui_id;

        if (!isExerciseToDifferentSuperset) {
            return; 
        }
    }

    if (activeData.type === 'section' && overData?.type === 'section') {
      // Reordering sections themselves
      // activeId and overId are sectionSortableIds like `section-warmup-timestamp`
      // We need the original section IDs (e.g., 'warmup-timestamp') from itemData
      const sourceOriginalSectionId = activeData.itemData?.id; // e.g. { id: sectionId, name: ... }
      const targetOriginalSectionId = overData.itemData?.id;

      if (sourceOriginalSectionId && targetOriginalSectionId && sourceOriginalSectionId !== targetOriginalSectionId) {
        setActiveSections((sections) => {
          const oldIndex = sections.indexOf(sourceOriginalSectionId);
          const newIndex = sections.indexOf(targetOriginalSectionId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(sections, oldIndex, newIndex);
          }
          return sections;
        });
      }
    } else if ((activeData.type === 'exercise' || activeData.type === 'superset')) {
        // Dragging an exercise or a superset block
        const draggedItemData = activeData.item; // This is the full exercise or superset object
        const sourceSectionId = activeData.sectionId;
        const sourceSupersetId = activeData.supersetId; // This is activeData.item.ui_id if activeData.type is 'superset'
        
        // Determine target context
        let targetSectionId = overData?.sectionId;
        let targetSupersetId = overData?.supersetId; // This is overData.item.ui_id if overData.type is 'superset'
        let targetItemData = overData?.item;     // This is the full exercise or superset object under cursor
        let position = 'after'; 
        let operationType = 'reorder-items';

        if (!draggedItemData || !sourceSectionId) {
            console.error("DragEnd: Missing dragged item data or source section ID.", { activeData });
            return;
        }

        // If `over` is a section header itself, or a droppable area representing the section (not an item within it)
        if (overData?.type === 'section') {
            targetSectionId = overData.itemData?.id; // The original section ID
            position = 'at-end'; 
            operationType = 'move-to-section-end';
            targetItemData = null; // No specific item, just the section
            targetSupersetId = null; 
        } 
        // If `over` is an exercise or a superset
        else if (overData?.type === 'exercise' || overData?.type === 'superset') {
            targetSectionId = overData.sectionId;
            targetSupersetId = overData.supersetId; 
            targetItemData = overData.item;

            const activeRect = active.rect.current.translated;
            const overRect = over.rect.current.translated;
            if (activeRect && overRect) {
                const overMidY = overRect.top + overRect.height / 2;
                position = activeRect.top < overMidY ? 'before' : 'after';
            }

            // <<<< START NEW LOGIC FOR CROSS-SECTION SUPERSET CREATION >>>>
            if (activeData.type === 'exercise' && overData.type === 'exercise' && sourceSectionId !== targetSectionId) {
                // Dragging exercise A from S1 onto exercise B in S2
                operationType = 'create-cross-section-superset';
                // Target for superset creation is effectively the two exercises involved.
                // The `targetItemData` (exercise B) is relevant. `draggedItemData` is exercise A.
                // `position` is not directly relevant for creation, more for insertion into an existing list.
            } else if (activeData.type === 'exercise' && overData.type === 'superset' && sourceSectionId !== targetSectionId && draggedItemData.superset_ui_id !== overData.item.ui_id) {
                // Dragging exercise A from S1 onto Superset X in S2 (A is not in X)
                operationType = 'add-to-cross-section-superset';
                position = 'inside'; // Adding inside the target superset
                targetSupersetId = overData.item.ui_id; // Target is the superset itself
            }
            // <<<< END NEW LOGIC FOR CROSS-SECTION SUPERSET CREATION >>>>
            else if (activeData.type === 'exercise' && overData.type === 'superset' && draggedItemData.superset_ui_id !== overData.item.ui_id) {
                // Dragging an exercise onto/into a different superset block (within the same section or cross-section handled above)
                operationType = 'move-exercise-into-superset';
                position = 'inside'; // Default to inside, parent can refine position
            }
        }
        // Add case for dropping on placeholder for empty section (if such a droppable exists)
        // else if (overData?.type === 'droppable-empty-section') { ... }

        if (!targetSectionId) {
          console.warn("DragEnd: Could not determine target section ID. Defaulting to source section.", { overData });
          targetSectionId = sourceSectionId;
        }

        const reorderPayload = {
            source: {
                sectionId: sourceSectionId,
                supersetId: sourceSupersetId,
                item: { ui_id: draggedItemData.ui_id, type: draggedItemData.itemType || activeData.type } // Ensure type is passed
            },
            target: {
                sectionId: targetSectionId,
                supersetId: targetSupersetId,
                item: targetItemData ? { ui_id: targetItemData.ui_id, type: targetItemData.itemType || overData.type, superset_ui_id: targetItemData.superset_ui_id } : null,
                position: position 
            },
            operationType 
        };
        
        if (operationType === 'reorder-within-superset' && draggedItemData.ui_id === targetItemData?.ui_id) return;

        onReorderExercises(reorderPayload);

    } else {
      console.warn("DragEnd: Unhandled drag scenario or missing/unexpected data types.", { activeData, overData });
    }
  }, [setActiveSections, onReorderExercises]);
  
  // Handle adding a section
  const handleAddSection = useCallback((sectionType) => {
    // Always allow adding multiple sections of the same type by creating a unique instance ID
    const instanceId = `${sectionType}-${Date.now()}`
    setActiveSections(prev => [...prev, instanceId])
    setExpandedSections(prev => [...prev, instanceId])
  }, [setActiveSections])
  
  // Handle removing a section
  const handleRemoveSectionCallback = useCallback((sectionId) => {
    // Remove section from active sections
    setActiveSections(prev => prev.filter((id) => id !== sectionId))
    
    // Remove section from expanded sections
    setExpandedSections(prev => prev.filter((id) => id !== sectionId))
  }, [setActiveSections])
  
  // Update toggleSection to remove longPressTimer
  const toggleSection = useCallback((sectionId) => {
    if (isDragging) return
    
    setExpandedSections((prev) => {
      if (prev.includes(sectionId)) {
        // Allow all sections to be collapsed, even if this is the last one
        return prev.filter((id) => id !== sectionId)
      } else {
        return [...prev, sectionId]
      }
    })
  }, [isDragging])
  
  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    // Fully collapse all sections with no restrictions
    setExpandedSections([])
  }, [])
  
  // Expand all sections
  const expandAllSections = useCallback(() => {
    setExpandedSections([...activeSections])
  }, [activeSections])

  // Replace the Menu component with custom dropdown
  const [addSectionMenuOpen, setAddSectionMenuOpen] = useState(false)

  // Replace MemoizedDraggableItem with a dnd-kit compatible version
  // SortableDndItem: Component to make items sortable via dnd-kit
  // It now receives the full item object and its context (sectionId, supersetId)
  // to provide rich data for drag operations.
  const SortableItem = memo(({ id, children, itemType, itemData, sectionId, supersetId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging: itemIsDragging } = useSortable({ 
      id,
      data: {
        type: itemType, // 'section', 'exercise', or 'superset'
        item: itemData,      // The actual exercise or superset object
        sectionId,     // The ID of the section this item belongs to
        supersetId,    // The ID of the superset this item belongs to (if applicable)
      } 
    });
    const style = { 
      transform: CSS.Transform.toString(transform), 
      transition,
      zIndex: itemIsDragging ? 100 : 'auto', 
      opacity: itemIsDragging ? 0.8 : 1 
    };
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
  });
  SortableItem.displayName = "SortableItem";

  // Function to move a superset up or down
  const handleMoveSuperset = useCallback((supersetId, direction) => {
    const superset = supersets.find(s => s.ui_id === supersetId);
    if (!superset) return;
    
    const sectionId = superset.host_section_id;
    if (!sectionId) return;
    
    // Find all items in the section
    const { unifiedItems } = getOrderedItemsForSection(sectionId);
    
    // Find the index of the superset
    const supersetIndex = unifiedItems.findIndex(item => 
      item.itemType === 'superset' && item.ui_id === supersetId
    );
    
    if (supersetIndex === -1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' 
      ? Math.max(0, supersetIndex - 1)
      : Math.min(unifiedItems.length - 1, supersetIndex + 1);
      
    if (newIndex === supersetIndex) return;
    
    // Reorder items
    const updatedItems = [...unifiedItems];
    const [removed] = updatedItems.splice(supersetIndex, 1);
    updatedItems.splice(newIndex, 0, removed);
    
    // Convert back to a flat list of exercises with updated positions
    const reorderedExercises = [];
    let position = 0;
    
    updatedItems.forEach(item => {
      if (item.itemType === 'exercise') {
        // For normal exercises, just add with updated position
        reorderedExercises.push({
          ...item,
          position_in_section: position++
        });
      } else if (item.itemType === 'superset') {
        // For supersets, preserve the internal order of exercises
        // while updating the superset's overall position
        const positionStart = position; // Remember start position for superset
        
        // Assign sequential positions to all exercises in the superset
        item.exercises.forEach(exercise => {
          reorderedExercises.push({
            ...exercise,
            position_in_section: position++
          });
        });
        
        // Update the superset in the UI
        setSupersets(prev => 
          prev.map(s => 
            s.ui_id === item.ui_id 
              ? { ...s, position_in_section: positionStart } // Update position reference
              : s
          )
        );
      }
    });
    
    // Update exercise order if we have exercises to reorder
    if (reorderedExercises.length > 0) {
      onReorderExercises(sectionId, reorderedExercises);
    }
  }, [supersets, getOrderedItemsForSection, onReorderExercises, setSupersets]);

  // Main function to render the list of exercises or superset blocks for a given section
  const renderExerciseOrSupersetList = useCallback((sectionId) => {
    const orderedItems = getOrderedItemsForSection(sectionId);

    if (!orderedItems.length) {
      return <p className="text-sm text-gray-500 py-4 text-center">No exercises in this section. Add some below!</p>;
    }

    // This function now returns an array of SortableItem components
    // These will be included in the main SortableContext's items list
    return orderedItems.map((item, index) => {
      const itemUiId = item.ui_id; // Exercise ui_id or Superset ui_id
      const itemType = item.itemType; // 'exercise' or 'superset'
      
      if (itemType === 'superset') {
        const supersetExercisesWithErrors = item.exercises.map(ex => ({
          ...ex,
          errors: getExerciseSpecificErrors(ex.ui_id, errors), 
        }));
        return (
          <SortableItem 
            key={itemUiId} 
            id={itemUiId} 
            itemType="superset"
            itemData={item} // Pass the full superset object
            sectionId={sectionId}
            supersetId={itemUiId} // Superset's own ID is its supersetId for context
          >
            <SupersetContainer
              supersetId={itemUiId}
              sectionId={sectionId}
              exercises={supersetExercisesWithErrors}
              displayNumber={item.display_number || index + 1}
              onRemoveFromSuperset={(exerciseUiId) => onRemoveExerciseFromSuperset(exerciseUiId)}
              onExitSuperset={() => onDeleteSuperset(itemUiId, sectionId)}
              onAddExerciseToSuperset={(exerciseDefinition, targetSupersetUiId) => {
                onAddExercise(exerciseDefinition, sectionId, targetSupersetUiId);
              }}
              availableExercises={availableExercises}
              loadingAvailableExercises={loadingAvailableExercises}
            />
          </SortableItem>
        );
      } else { // Individual exercise
        const exerciseErrors = getExerciseSpecificErrors(itemUiId, errors);
        return (
          <SortableItem
            key={itemUiId} 
            id={itemUiId} 
            itemType="exercise"
            itemData={item} // Pass the full exercise object
            sectionId={sectionId}
            supersetId={item.superset_ui_id} // Could be null if not in a superset
          >
            <div className="relative group">
              <ExerciseItemFull
                exercise={item}
                mode={mode}
                onChangeExerciseField={(field, value) => onExerciseFieldChange(itemUiId, field, value)}
                onChangeSetDetail={(setIdx, field, value) => {
                  onSetDetailChange(itemUiId, setIdx, field, value);
                }}
                onAddSet={() => onAddSet(itemUiId)}
                onRemoveSet={(setIdx) => {
                  onRemoveSet(itemUiId, setIdx);
                }}
              />
              <ExerciseContextMenu
                item={item}
                sectionId={sectionId}
                allExercisesInSection={getOrderedItemsForSection(sectionId).filter(i => i.itemType === 'exercise' && !i.superset_ui_id)}
                supersetsInCurrentSection={supersets.filter(s => s.host_section_id === sectionId)}
                allExercisesInSession={allExercisesInSession}
                onCreateSuperset={onCreateSuperset}
                onRemoveExercise={onRemoveExercise}
                onDeleteSuperset={onDeleteSuperset}
                onRemoveExerciseFromSuperset={(exerciseUiId) => onRemoveExerciseFromSuperset(item.superset_ui_id, exerciseUiId)}
              />
            </div>
          </SortableItem>
        );
      }
    });
  }, [errors, mode, getOrderedItemsForSection, onRemoveExerciseFromSuperset, onDeleteSuperset, availableExercises, loadingAvailableExercises, onExerciseFieldChange, onSetDetailChange, onAddSet, onRemoveSet, onCreateSuperset, onRemoveExercise, selectedExercises, clearSelection, onAddExercise]);

  // Helper function to extract errors specific to an exercise
  // Assuming parent error keys are like `exerciseUiId-fieldName` or `exerciseUiId-set_INDEX-fieldName` or `exerciseUiId-set_SETUID-fieldName`
  const getExerciseSpecificErrors = useCallback((exerciseUiId, allErrors) => {
    if (!allErrors) return {};
    const exerciseErrors = {};
    for (const key in allErrors) {
      if (key.startsWith(`${exerciseUiId}-`)) {
        const errorKeyRaw = key.substring(exerciseUiId.length + 1);
        // Examples: "notes", "set_0-reps", "set_setUID123-reps"
        // We need to transform "set_0-reps" to "set_0_reps" for ExerciseItemFull
        const fieldPath = errorKeyRaw.replace(/^(set_\w+)-(\w+)$/, "$1_$2"); 
        exerciseErrors[fieldPath] = allErrors[key];
      }
    }
    return exerciseErrors;
  }, []);

  // Effect to notify parent of supersets changes
  useEffect(() => {
    if (onSupersetStructureChange && supersets.length > 0) {
      // Create a simplified representation of the superset state to compare
      // The parent (StepTwoPlanner) expects a list of superset objects,
      // each potentially with its exercises if needed for timeline rendering.
      // The `supersets` state in ExerciseSectionManager already holds this structure.
      const currentSupersetsState = supersets.map(s => ({ 
        id: s.ui_id, 
        displayNumber: s.display_number, 
        exercises: s.exercises.map(ex => ({ ui_id: ex.ui_id, name: ex.name /* other relevant fields */ })),
        sectionId: s.host_section_id, // Pass sectionId for context
        position_in_section: s.position_in_section // Pass position for ordering
      }));
      
      const stateKey = JSON.stringify(currentSupersetsState.map(s => ({id: s.id, count: s.exercises.length, pos: s.position_in_section, disp: s.displayNumber }))); // More stable key
      
      if (prevSupersetsRef.current !== stateKey) {
        onSupersetStructureChange(sessionId, currentSupersetsState); // Pass sessionId if parent needs it, or just supersets
        prevSupersetsRef.current = stateKey;
      }
    } else if (onSupersetStructureChange && supersets.length === 0 && prevSupersetsRef.current !== '') { // Ensure it was previously populated
      onSupersetStructureChange(sessionId, []); // Pass sessionId if parent needs it
      prevSupersetsRef.current = '';
    }
  }, [supersets, onSupersetStructureChange, sessionId, prevSupersetsRef]); // Added sessionId and prevSupersetsRef

  // Add CSS style for dragging state
  useEffect(() => {
    // Add global CSS for drag operations
    const style = document.createElement('style');
    style.innerHTML = `
      body.dragging * {
        cursor: grabbing !important;
      }
      body.dragging .section-draggable { /* If you have a specific class for section headers */
        opacity: 0.9;
        z-index: 1000; /* Ensure dragged section header is on top */
      }
      /* Style for the dragged item clone by dnd-kit (usually a direct child of body) */
      body > [style*="transform: translate3d"] {
        z-index: 9999 !important;
        pointer-events: none; /* The clone shouldn't intercept mouse events */
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15) !important;
      }
      /* Style for the original item while it's being dragged (isDragging=true from useSortable) */
      /* SortableItem already handles opacity and zIndex via its style prop */

      /* Placeholder/highlight for drop targets could be done via over.rect and custom rendering or ::before/::after */
      
      /* Ensure smooth transitions for items managed by SortableContext */
      [data-sortable-id] { /* dnd-kit sortable items usually get this attribute */
        transition: transform 250ms ease; /* Smooth re-ordering effect */
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // useEffect to build the flat list of all draggable items for SortableContext
  const allSortableItems = useMemo(() => {
    const items = [];
    // Add sections first
    (Array.isArray(activeSections) ? activeSections : []).forEach(sectionId => {
      items.push({
        id: `section-${sectionId}`, // Unique ID for the section draggable item
        type: 'section', // Differentiates from exercises/supersets for SortableItem
        originalSectionId: sectionId // Keep track of the actual section ID
      });

      // If section is expanded, add its exercises and supersets
      if (expandedSections.includes(sectionId)) {
        const orderedItemsInSection = getOrderedItemsForSection(sectionId);
        orderedItemsInSection.forEach(item => {
          items.push({
            id: item.ui_id, // Exercise ui_id or Superset ui_id
            type: item.itemType, // 'exercise' or 'superset'
            // Store full item data and context for SortableItem and handleDragEnd
            itemData: item,
            sectionId: sectionId,
            supersetId: item.itemType === 'superset' ? item.ui_id : item.superset_ui_id,
          });
        });
      }
    });
    return items;
  }, [activeSections, expandedSections, getOrderedItemsForSection]);

  return (
    <Card>
      {/* Test dropdown for debugging - positioned at top right corner */}
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Exercise Sections</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={expandedSections.length === activeSections.length ? collapseAllSections : expandAllSections}
            >
              {expandedSections.length === activeSections.length ? "Collapse All" : "Expand All"}
            </Button>
            
            {/* Add Section dropdown using custom implementation */}
            <div className="relative inline-block text-left">
              {mode !== 'group' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddSectionMenuOpen(!addSectionMenuOpen);
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Section</span>
                  </Button>

                  {addSectionMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000] animate-in fade-in-50 zoom-in-95 duration-100"
                    >
                      {/* Section options */}
                      <div className="px-1 py-1">
                        {availableSectionTypes.map((type) => (
                          <button
                            key={type.id}
                            className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => {
                              handleAddSection(type.id);
                              setAddSectionMenuOpen(false);
                            }}
                          >
                            <div className="text-blue-500 mr-2">
                              {type.icon}
                            </div>
                            <span className="font-medium">{type.name}</span>
                          </button>
                        ))}
                        
                        {/* Show message when all sections are added */}
                        {availableSectionTypes.filter((type) => !activeSections.map(sId => getSectionType(sId)).includes(type.id)).length === 0 && (
                          <div className="px-2 py-2 text-sm text-gray-400">
                            All section types added
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={allSortableItems.map(item => item.id)} // Use the flat list of all draggable item IDs
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {(Array.isArray(activeSections) ? activeSections : []).map((sectionId, index) => {
                const sectionSortableId = `section-${sectionId}`;
                // Find the section item data from allSortableItems for SortableItem
                const sectionItemData = allSortableItems.find(item => item.id === sectionSortableId);

                return (
                  <SortableItem
                    key={sectionSortableId}
                    id={sectionSortableId}
                    // index={index} // Index might not be needed if SortableContext handles order by ID list
                    itemType="section" // Explicitly 'section'
                    itemData={{ id: sectionId, name: currentGetSectionName(sectionId) }} // Pass basic section data
                    sectionId={sectionId} // Section's own ID
                  >
                    <div className="p-3 rounded-md border bg-slate-50/50 space-y-3">
                      <div
                        className={cn(
                          "flex items-center justify-between cursor-pointer",
                          isDragging && "cursor-grabbing"
                        )}
                        onClick={() => toggleSection(sectionId)}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                          <h4 className="font-semibold text-gray-700">{currentGetSectionName(sectionId)}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{getOrderedItemsForSection(sectionId).length} items</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSectionCallback(sectionId);
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedSections.includes(sectionId) && (
                        <div className="pl-4 space-y-3 border-l-2 border-slate-200 ml-2 pt-2">
                          {getOrderedItemsForSection(sectionId).map((item, itemIndex) => (
                            <SortableItem 
                              key={item.ui_id} 
                              id={item.ui_id} 
                              itemType={item.itemType} 
                              itemData={item} 
                              sectionId={sectionId} 
                              supersetId={item.itemType === 'superset' ? item.ui_id : item.superset_ui_id}
                            >
                              <div className="relative group">
                                {item.itemType === 'exercise' ? (
                                  <ExerciseItemFull
                                    exercise={item} // item is the exercise object
                                    mode={mode}
                                    onChangeExerciseField={(field, value) => onExerciseFieldChange(item.ui_id, field, value)}
                                    onChangeSetDetail={(setIdx, field, value) => {
                                      onSetDetailChange(item.ui_id, setIdx, field, value);
                                    }}
                                    onAddSet={() => onAddSet(item.ui_id)}
                                    onRemoveSet={(setIdx) => {
                                      onRemoveSet(item.ui_id, setIdx);
                                    }}
                                    // errors prop is managed internally by ExerciseItemFull now
                                  />
                                ) : item.itemType === 'superset' ? (
                                  <SupersetContainer
                                    superset={item} // item is the superset object
                                    sectionId={sectionId}
                                    mode={mode}
                                    onExerciseFieldChange={onExerciseFieldChange}
                                    onSetDetailChange={onSetDetailChange} // SupersetContainer will pass (exerciseUiId, setIndex, field, value)
                                    onAddSet={onAddSet}
                                    onRemoveSet={onRemoveSet}
                                    onRemoveExerciseFromSuperset={(exerciseUiId) => onRemoveExerciseFromSuperset(item.ui_id, exerciseUiId)} // Pass supersetUiId and exerciseUiId
                                    onDeleteSuperset={() => onDeleteSuperset(item.ui_id, sectionId)}
                                    availableExercises={availableExercises} // For adding to superset
                                    loadingAvailableExercises={loadingAvailableExercises}
                                    onAddExerciseToSuperset={(exerciseDefinition) => {
                                      onAddExercise(exerciseDefinition, sectionId, item.ui_id);
                                    }}
                                    // errors={{}} // Errors are per-exercise, SupersetContainer will pass them to its ExerciseItemFull instances
                                  />
                                ) : null}
                                <ExerciseContextMenu
                                  item={item}
                                  sectionId={sectionId}
                                  allExercisesInSection={getOrderedItemsForSection(sectionId).filter(i => i.itemType === 'exercise' && !i.superset_ui_id)}
                                  supersetsInCurrentSection={supersets.filter(s => s.host_section_id === sectionId)}
                                  allExercisesInSession={allExercisesInSession} // Pass all for broader context if needed
                                  onCreateSuperset={onCreateSuperset} // (sectionId, selectedExerciseUiIds)
                                  onRemoveExercise={onRemoveExercise} // (exerciseUiId)
                                  onDeleteSuperset={onDeleteSuperset} // (supersetUiId, sectionId)
                                  onRemoveExerciseFromSuperset={(exerciseUiId) => onRemoveExerciseFromSuperset(item.superset_ui_id, exerciseUiId)} // For exercises within supersets
                                />
                              </div>
                            </SortableItem>
                          ))}
                          {mode !== 'group' && (
                            <ExerciseSelector
                              sectionId={sectionId}
                              sectionType={getSectionType(sectionId)}
                              availableExercises={availableExercises}
                              loadingExercises={loadingAvailableExercises}                              
                              onSelect={(exerciseData) => onAddExercise(exerciseData, sectionId)}
                              mode={mode}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
});

ExerciseSectionManager.displayName = "ExerciseSectionManager";

export default ExerciseSectionManager; 