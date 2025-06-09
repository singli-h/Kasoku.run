"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableDndItemProps } from '../../types/exercise-planner'; // Corrected import path
import { cn } from '@/lib/utils';

const SortableItem: React.FC<SortableDndItemProps> = ({
  id,
  children,
  itemType,
  itemData,
  sectionId,
  supersetId,
  className, // Allow additional classNames to be passed
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id, // The DND ID
    data: { // Data payload for drag events
      type: itemType,
      item: itemData, // The full data object (ExerciseUIInstance, SupersetUIInstance, SectionActiveInstance)
      sectionId: sectionId, // Context: section this item belongs to or represents
      supersetId: supersetId, // Context: superset this item belongs to or represents
      originalId: itemData?.id || itemData?.ui_id, // Include original ID if available from itemData
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined, // Ensure transition is not null
    opacity: isDragging ? 0.5 : 1,
    // Add a bit of elevation when dragging
    boxShadow: isDragging ? '0 0 15px rgba(0,0,0,0.2)' : 'none',
    // Ensure dragging items are above others
    zIndex: isDragging ? 100 : 'auto',
  };

  // Clone children to pass down dnd-kit props (attributes, listeners) if they are function components
  // or wrap them in a div if they are primitive or multiple elements.
  // For SectionHeader, it will receive these as ...dndProps
  const childWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        ...attributes, // For SortableContext/useSortable to make it draggable
        ...listeners,  // For SortableContext/useSortable to make it draggable
        isDragging: isDragging, // Pass dragging state to child for conditional styling
      })
    : children;

  return (
    <div ref={setNodeRef} style={style} className={cn("sortable-item", className)} {...attributes} {...listeners}>
      {/* The direct child component (e.g. SectionHeader, ExerciseItemFull) should handle the drag handle visuals 
          and spread the listeners to the drag handle element. If not, listeners here make the whole item draggable. 
          For more granular control, listeners should be passed to a specific handle within the child. 
          However, the current SectionHeader is designed to spread dndKitProps to its root, so this should work.
          If children itself is a functional component that can take these props, we can pass them directly.
      */}
      {/* If children is a simple element or you want to ensure props are passed correctly to a custom component child */}
      {/* Forcing the whole item to be draggable via the div for now, pass attributes/listeners to children if more specific handle needed */}
      {childWithProps}
    </div>
  );
};

SortableItem.displayName = 'SortableItem';
export default SortableItem; 