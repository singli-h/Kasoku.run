"use client"

import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Layers, Plus, MoveDown, MoveUp, Copy, Trash2 } from "lucide-react"

/**
 * Simple Exercise Context Menu using HeadlessUI
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
  console.log("ExerciseContextMenu rendering with HeadlessUI", exercise.id);
  
  // Filter out supersets that already contain this exercise
  const availableSupersets = supersets.filter(
    superset => !superset.exercises.some(ex => ex.id === exercise.id)
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button as={Fragment}>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full bg-gray-50 hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000]">
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
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-blue-50 text-blue-700' : 'text-blue-600'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
                      onClick={() => onCreateSuperset(exercise.id, sessionId, sectionId)}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Add Superset
                    </button>
                  )}
                </Menu.Item>

                {availableSupersets.length > 0 && (
                  <div className="relative">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Existing Superset
                        </button>
                      )}
                    </Menu.Item>
                    
                    {/* Submenu for supersets */}
                    <div className="absolute left-full top-0 w-56 -ml-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {availableSupersets.map(superset => (
                        <button
                          key={superset.id}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-blue-50"
                          onClick={() => onAddToSuperset(exercise.id, superset.id, sessionId, sectionId)}
                        >
                          <span>Superset {superset.label || superset.id}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {superset.exercises.length} exercises
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Move Options */}
          <div className="px-1 py-1">
            <Menu.Item disabled={disableMoveUp}>
              {({ active }) => (
                <button
                  className={`${
                    disableMoveUp 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : active ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => !disableMoveUp && onMoveExercise(exercise.id, 'up', sessionId, sectionId)}
                >
                  <MoveUp className="mr-2 h-4 w-4" />
                  Move Up
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item disabled={disableMoveDown}>
              {({ active }) => (
                <button
                  className={`${
                    disableMoveDown 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : active ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => !disableMoveDown && onMoveExercise(exercise.id, 'down', sessionId, sectionId)}
                >
                  <MoveDown className="mr-2 h-4 w-4" />
                  Move Down
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Other Actions */}
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => onDuplicateExercise(exercise.id, sessionId, sectionId)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Remove Action */}
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-red-50 text-red-700' : 'text-red-600'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  onClick={() => onRemoveExercise(exercise.id, sessionId, sectionId)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Exercise
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ExerciseContextMenu; 