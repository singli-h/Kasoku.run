"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Link2,
  Unlink,
  Copy,
  Trash2,
  Edit,
  MoreHorizontal,
} from "lucide-react"

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
    <div className="py-5 px-0">
      {/* Header Row - Primary Action + Selection Count */}
      <div className="flex items-center justify-between mb-6">
        {/* Primary Action - Accent Color with Subtle Shadow */}
        <Button
          onClick={onAddExercise}
          size="default"
          className="font-semibold shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Exercise
        </Button>

        {/* Selection Counter - More Subtle */}
        <p className="text-xs text-muted-foreground font-normal">
          {selectionCount} selected · {totalCount} total
        </p>
      </div>

      {/* Desktop: Clean Button Groups - NO BORDERS */}
      <div className="hidden md:flex items-center gap-10">
        {/* Organize Section - Only show when selected - INLINE */}
        {hasSelection && (
          <>
            <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={!canCreateSuperset}
              onClick={onCreateSuperset}
                className="font-medium"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Superset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canUngroup}
              onClick={onUngroup}
                className="font-medium"
            >
              <Unlink className="mr-2 h-4 w-4" />
              Ungroup
            </Button>
          </div>

            {/* Edit Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="font-medium"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="font-medium text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchEdit}
              className="font-medium"
            >
              <Edit className="mr-2 h-4 w-4" />
              Batch Edit
            </Button>
          </div>
          </>
        )}

        {/* Selection Toggle - Single button, right-aligned */}
        <div className="ml-auto">
          <Button
            variant="link"
            size="sm"
            onClick={hasSelection ? onDeselectAll : onSelectAll}
            className="text-muted-foreground"
          >
            {hasSelection ? "Clear Selection" : "Select All"}
          </Button>
        </div>
      </div>

      {/* Mobile: iOS-Style Action Sheet */}
      <div className="md:hidden flex items-center justify-between">
        {/* Selection Count on Mobile */}
        <p className="text-xs text-muted-foreground font-normal">
          {selectionCount} selected
        </p>

        {/* Action Sheet Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
              <span className="sr-only">More actions</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <div className="flex flex-col gap-0 py-4">
              <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={onCreateSuperset}
                disabled={!canCreateSuperset}
                className="justify-start h-14 text-base"
              >
                <Link2 className="mr-2 h-5 w-5" />
                Superset
              </Button>
              </SheetClose>
              <Separator />

              <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={onUngroup}
                disabled={!canUngroup}
                className="justify-start h-14 text-base"
              >
                <Unlink className="mr-2 h-5 w-5" />
                Ungroup
              </Button>
              </SheetClose>
              <Separator />

              <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={onDuplicate}
                className="justify-start h-14 text-base"
              >
                <Copy className="mr-2 h-5 w-5" />
                Duplicate
              </Button>
              </SheetClose>
              <Separator />

              <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={onDelete}
                className="justify-start h-14 text-base text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete
              </Button>
              </SheetClose>
              <Separator />

              <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={onBatchEdit}
                className="justify-start h-14 text-base"
              >
                <Edit className="mr-2 h-5 w-5" />
                Batch Edit
              </Button>
              </SheetClose>
              <Separator />

              <SheetClose asChild>
              <Button
                variant="ghost"
                  onClick={hasSelection ? onDeselectAll : onSelectAll}
                className="justify-start h-14 text-base"
              >
                  {hasSelection ? "Clear Selection" : "Select All"}
              </Button>
              </SheetClose>

              <Separator className="my-2" />

              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="h-14 text-base font-semibold"
                >
                  Cancel
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
