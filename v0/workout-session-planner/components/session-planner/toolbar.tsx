"use client"

import { Plus, Link2, Unlink, Copy, Trash2, Edit, CheckSquare, MoreHorizontal, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ToolbarProps {
  selectionCount: number
  totalCount: number
  canCreateSuperset: boolean
  canUngroup: boolean
  canUndo?: boolean
  canRedo?: boolean
  onAddExercise: () => void
  onCreateSuperset: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onDelete: () => void
  onBatchEdit: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function Toolbar({
  selectionCount,
  totalCount,
  canCreateSuperset,
  canUngroup,
  canUndo = false,
  canRedo = false,
  onAddExercise,
  onCreateSuperset,
  onUngroup,
  onDuplicate,
  onDelete,
  onBatchEdit,
  onSelectAll,
  onDeselectAll,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const hasSelection = selectionCount > 0

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-3 border rounded-lg bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button onClick={onAddExercise} size="sm" className="flex-1 sm:flex-none sm:w-32">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Exercise</span>
          <span className="sm:hidden">Add</span>
        </Button>

        {!hasSelection ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={totalCount === 0}
            className="flex-1 sm:flex-none sm:w-28 bg-transparent"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Select All</span>
            <span className="sm:hidden">Select</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            className="flex-1 sm:flex-none sm:w-28 bg-transparent"
          >
            <span className="hidden sm:inline">Deselect ({selectionCount})</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}

        {onUndo && (
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} className="w-9 p-0 bg-transparent">
            <Undo className="h-4 w-4" />
          </Button>
        )}
        {onRedo && (
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo} className="w-9 p-0 bg-transparent">
            <Redo className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selection Actions */}
      {hasSelection && (
        <>
          <Separator orientation="vertical" className="hidden sm:block h-6" />

          {/* Desktop: Show all buttons with unified width */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateSuperset}
              disabled={!canCreateSuperset}
              className="w-36 bg-transparent"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Create Superset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onUngroup}
              disabled={!canUngroup}
              className="w-28 bg-transparent"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Ungroup
            </Button>

            <Button variant="outline" size="sm" onClick={onDuplicate} className="w-28 bg-transparent">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>

            <Button variant="outline" size="sm" onClick={onBatchEdit} className="w-28 bg-transparent">
              <Edit className="h-4 w-4 mr-2" />
              Batch Edit
            </Button>

            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive bg-transparent w-24">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Tablet & Mobile: Compact buttons */}
          <div className="flex lg:hidden items-center gap-2 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateSuperset}
              disabled={!canCreateSuperset}
              className="flex-1 bg-transparent px-2"
            >
              <Link2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Superset</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive flex-1 bg-transparent px-2"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-9 p-0 bg-transparent">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onUngroup} disabled={!canUngroup}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Ungroup Superset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBatchEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Batch Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  )
}
