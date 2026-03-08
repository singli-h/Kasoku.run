"use client"

import { Plus, Unlink } from "lucide-react"

export interface SectionDividerProps {
  label: string
  /** Show [+ Add] button (desktop only, coach mode) */
  showAddButton?: boolean
  /** Callback when add button is clicked */
  onAddClick?: () => void
  /** Superset ID (if this is a superset section) */
  supersetId?: string
  /** Callback to unlink the superset */
  onUnlinkSuperset?: (supersetId: string) => void
}

/**
 * SectionDivider - Visual separator between exercise sections
 *
 * Displays a section label with a horizontal line.
 * Optionally shows an [+ Add] button for coach mode on desktop.
 * For supersets, shows an [Unlink] button to dissolve the superset.
 */
export function SectionDivider({ label, showAddButton, onAddClick, supersetId, onUnlinkSuperset }: SectionDividerProps) {
  const isSuperset = label === "Superset" && supersetId

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
        {isSuperset ? `Superset ${supersetId}` : label}
      </span>
      <div className="flex-1 h-px bg-border" />
      {/* Unlink button for supersets */}
      {isSuperset && onUnlinkSuperset && (
        <button
          onClick={() => onUnlinkSuperset(supersetId)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          title="Unlink superset"
        >
          <Unlink className="h-3 w-3" />
          <span className="hidden sm:inline">Unlink</span>
        </button>
      )}
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
