"use client"

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Layers, Plus, MoveDown, MoveUp, Copy, Minus } from "lucide-react"

/**
 * Custom Exercise Context Menu without headlessui
 * Uses React Portal to render the menu outside of its parent container
 * to avoid being cropped by parent overflow settings
 */
const ExerciseContextMenu = ({
  exercise,
  supersets = [],
  onCreateSuperset,
  onAddToSuperset,
  onRemoveExercise,
  onDuplicateExercise,
  onMoveExercise,
  sessionId,
  sectionId,
  disableMoveUp = false,
  disableMoveDown = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSupersetSubmenu, setShowSupersetSubmenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filter out supersets that already contain this exercise
  const availableSupersets = supersets.filter(
    superset => !superset.exercises.some(ex => ex.id === exercise.id)
  );

  // Calculate menu position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Calculate left position - ensure menu doesn't go off-screen
      let leftPos = buttonRect.left;
      if (leftPos + 250 > viewportWidth) {
        leftPos = Math.max(10, viewportWidth - 260);
      }
      
      setMenuPosition({
        top: buttonRect.bottom + window.scrollY + 5, // Add a small gap
        left: leftPos + window.scrollX,
      });
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSupersetSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowSupersetSubmenu(false);
    }
  };

  const handleMenuItemClick = (callback) => {
    return (e) => {
      e.stopPropagation();
      callback();
      setIsOpen(false);
      setShowSupersetSubmenu(false);
    };
  };

  const handleSupersetHover = () => {
    if (availableSupersets.length > 0) {
      setShowSupersetSubmenu(true);
    }
  };

  // Create the menu content
  const menuContent = (
    <div 
      ref={menuRef}
      className="fixed divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] animate-in fade-in-50 zoom-in-95 duration-100 w-56"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
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
            <button
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={handleMenuItemClick(() => onCreateSuperset(exercise.id, sessionId, sectionId))}
            >
              <Layers className="mr-2 h-4 w-4" />
              Add Superset
            </button>

            {availableSupersets.length > 0 && (
              <div className="relative" onMouseEnter={handleSupersetHover} onMouseLeave={() => setShowSupersetSubmenu(false)}>
                <button
                  className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Existing Superset
                </button>
                
                {/* Submenu for supersets */}
                {showSupersetSubmenu && (
                  <div className="absolute left-full top-0 w-56 -ml-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100">
                    {availableSupersets.map(superset => (
                      <button
                        key={superset.id}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                        onClick={handleMenuItemClick(() => onAddToSuperset(exercise.id, superset.id, sessionId, sectionId))}
                      >
                        <span>Superset {superset.label || superset.id}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {superset.exercises.length} exercises
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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

      {/* Other Actions */}
      <div className="px-1 py-1">
        <button
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700"
          onClick={handleMenuItemClick(() => onDuplicateExercise(exercise.id, sessionId, sectionId))}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
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

      {isOpen && mounted && createPortal(
        menuContent,
        document.body
      )}
    </div>
  );
};

export default ExerciseContextMenu; 