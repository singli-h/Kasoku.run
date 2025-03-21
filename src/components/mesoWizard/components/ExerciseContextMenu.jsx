"use client"

import React, { useState, useRef, useEffect, memo } from 'react'
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Layers, MoveDown, MoveUp, Minus, X } from "lucide-react"

/**
 * Custom Exercise Context Menu without headlessui
 * Uses absolute positioning like the Add Section dropdown
 */
const ExerciseContextMenu = memo(({
  exercise,
  onCreateSuperset,
  onRemoveExercise,
  onMoveExercise,
  sessionId,
  sectionId,
  disableMoveUp = false,
  disableMoveDown = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateSupersetFeedback, setShowCreateSupersetFeedback] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  
  // Filter out supersets that already contain this exercise
  // Also filter to only show supersets in the same section
  // const availableSupersets = supersets.filter(
  //   superset => 
  //     !superset.exercises.some(ex => ex.id === exercise.id) && 
  //     superset.section === sectionId // Only show supersets in the same section
  // );

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target) && 
          !buttonRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Ensure only one menu is open at a time
  useEffect(() => {
    if (isOpen) {
      // Create a custom event to close other menus
      const closeEvent = new CustomEvent('closeAllMenus', { detail: { currentMenuId: exercise.id } });
      document.dispatchEvent(closeEvent);
    }
    
    // Listen for close events from other menus
    const handleCloseAllMenus = (event) => {
      if (event.detail.currentMenuId !== exercise.id) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('closeAllMenus', handleCloseAllMenus);
    
    return () => {
      document.removeEventListener('closeAllMenus', handleCloseAllMenus);
    };
  }, [isOpen, exercise.id]);

  // Close menu when drag starts
  useEffect(() => {
    const handleDragStart = () => {
      setIsOpen(false);
      setShowCreateSupersetFeedback(false);
    };
    
    // Listen for drag start on body
    document.body.addEventListener('dragstart', handleDragStart);
    
    // Also listen for our custom class added on drag
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (document.body.classList.contains('dragging')) {
            setIsOpen(false);
            setShowCreateSupersetFeedback(false);
          }
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      document.body.removeEventListener('dragstart', handleDragStart);
      observer.disconnect();
    };
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (callback) => {
    return (e) => {
      e.stopPropagation();
      callback();
      setIsOpen(false);
    };
  };

  // Function to handle the create superset click with better feedback
  const handleCreateSupersetClick = (e) => {
    e.stopPropagation();
    
    // Call the create superset function with a single exercise ID
    onCreateSuperset([exercise.id], sectionId);
    
    // Show creation feedback dialog, which explains what to do next
    setShowCreateSupersetFeedback(true);
    
    // Hide the feedback after 3 seconds
    setTimeout(() => {
      setShowCreateSupersetFeedback(false);
    }, 5000);
    
    // Close the menu
    setIsOpen(false);
  };

  // Update the JSX for the Create Superset button including feedback
  const createSupersetButton = (
    <div className="relative">
      <button
        className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        onClick={handleCreateSupersetClick}
      >
        <Layers className="mr-2 h-4 w-4" />
        Create Superset
      </button>
      
      {showCreateSupersetFeedback && (
        <div 
          className="fixed top-1/4 inset-x-0 mx-auto p-4 bg-blue-100 text-blue-800 max-w-md rounded-lg shadow-lg z-[5000] border border-blue-300 animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ maxWidth: "350px" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Layers className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">Superset Created!</span>
            </div>
            <button 
              onClick={() => setShowCreateSupersetFeedback(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm">
            A superset has been started with &ldquo;{exercise.name}&rdquo;. To complete the superset, add another exercise using the &ldquo;Add&rdquo; button in the superset container.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative inline-block text-left">
      <Button 
        ref={buttonRef}
        variant="outline" 
        size="sm" 
        className="h-7 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 border-gray-200 text-xs"
        onClick={toggleMenu}
      >
        <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
        Options
      </Button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 mt-1 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000] animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Exercise Options Header */}
          <div className="px-4 py-2 text-sm font-semibold">
            Exercise Options
          </div>

          {/* Superset Options */}
          <div className="px-1 py-1">
            {exercise.supersetId ? (
              <div className="flex items-center px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed">
                <Layers className="mr-2 h-4 w-4" />
                <span>Already in a superset</span>
              </div>
            ) : (
              <>
                {createSupersetButton}
              </>
            )}
          </div>

          {/* Move Options */}
          <div className="px-1 py-1">
            <button
              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                disableMoveUp 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
              onClick={disableMoveUp ? undefined : handleMenuItemClick(() => onMoveExercise(exercise.id, 'up', sessionId, sectionId))}
            >
              <MoveUp className="mr-2 h-4 w-4" />
              Move Up
            </button>
            
            <button
              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                disableMoveDown 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
              }`}
              onClick={disableMoveDown ? undefined : handleMenuItemClick(() => onMoveExercise(exercise.id, 'down', sessionId, sectionId))}
            >
              <MoveDown className="mr-2 h-4 w-4" />
              Move Down
            </button>
          </div>

          {/* Remove Action */}
          <div className="px-1 py-1">
            <button
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-red-50 hover:text-red-700"
              onClick={handleMenuItemClick(() => onRemoveExercise(exercise.id, sessionId, sectionId))}
            >
              <Minus className="mr-2 h-4 w-4" />
              <span>Remove Exercise</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ExerciseContextMenu.displayName = "ExerciseContextMenu";

export default ExerciseContextMenu; 