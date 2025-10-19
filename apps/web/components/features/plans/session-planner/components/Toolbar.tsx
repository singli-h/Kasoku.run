"use client"

import { Button } from "@/components/ui/button"
import {
  Plus,
  Link2,
  Unlink,
  Copy,
  Trash2,
  Edit,
  CheckSquare,
  Square,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ToolbarProps {
  selectionCount: number
  totalCount: number
  canCreateSuperset: boolean
  canUngroup: boolean
  onAddExercise: () => void
  onCreateSuperset: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onDelete: () => void
  onBatchEdit: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function Toolbar({
  selectionCount,
  totalCount,
  canCreateSuperset,
  canUngroup,
  onAddExercise,
  onCreateSuperset,
  onUngroup,
  onDuplicate,
  onDelete,
  onBatchEdit,
  onSelectAll,
  onDeselectAll,
}: ToolbarProps) {
  const hasSelection = selectionCount > 0

  return (
    <div className="border rounded-lg p-3 bg-background sticky top-[140px] sm:top-[120px] z-[9]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Left Section - Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={onAddExercise} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {/* Right Section - Selection Actions */}
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          {/* Selection Info */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              {selectionCount > 0 ? (
                <>
                  <Badge variant="secondary">
                    {selectionCount} of {totalCount} selected
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={onDeselectAll}>
                    <Square className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={onSelectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
              )}
            </div>
          )}

          {/* Selection Actions */}
          {hasSelection && (
            <>
              <div className="h-6 w-px bg-border hidden sm:block" />

              <div className="flex items-center gap-1">
                {/* Superset Actions */}
                {canCreateSuperset && (
                  <Button variant="outline" size="sm" onClick={onCreateSuperset}>
                    <Link2 className="h-4 w-4 mr-1" />
                    Superset
                  </Button>
                )}
                {canUngroup && (
                  <Button variant="outline" size="sm" onClick={onUngroup}>
                    <Unlink className="h-4 w-4 mr-1" />
                    Ungroup
                  </Button>
                )}

                {/* Duplicate */}
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Duplicate</span>
                </Button>

                {/* Batch Edit */}
                <Button variant="outline" size="sm" onClick={onBatchEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Batch Edit</span>
                </Button>

                {/* Delete */}
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
