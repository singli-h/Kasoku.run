"use client"

import { Plus } from "lucide-react"

export interface SectionDividerProps {
  label: string
  /** Show [+ Add] button (desktop only, coach mode) */
  showAddButton?: boolean
  /** Callback when add button is clicked */
  onAddClick?: () => void
}

/**
 * SectionDivider - Visual separator between exercise sections
 *
 * Displays a section label with a horizontal line.
 * Optionally shows an [+ Add] button for coach mode on desktop.
 */
export function SectionDivider({ label, showAddButton, onAddClick }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title={`Add exercise to ${label}`}
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      )}
    </div>
  )
}
