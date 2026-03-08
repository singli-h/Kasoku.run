"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Info, Trash2 } from "lucide-react"

export interface TrainingBlockFormData {
  id: number
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
}

export interface ExistingBlockDateRange {
  id: number
  start_date: string | null
  end_date: string | null
}

interface EditTrainingBlockDialogProps {
  block: TrainingBlockFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (block: TrainingBlockFormData) => Promise<void>
  /** Other existing blocks to check for date overlap (excluding current block) */
  existingBlocks?: ExistingBlockDateRange[]
  /** Optional delete handler. When provided, shows a delete button in the dialog. */
  onDelete?: () => Promise<void>
}

/**
 * Calculate the allowed date range for a training block based on adjacent blocks.
 * Prevents overlapping by finding the nearest block before and after.
 */
function calculateDateConstraints(
  currentBlockId: number,
  existingBlocks: ExistingBlockDateRange[]
): { minStartDate?: string; maxEndDate?: string } {
  // Filter out the current block being edited
  const otherBlocks = existingBlocks.filter(b => b.id !== currentBlockId && b.start_date && b.end_date)

  if (otherBlocks.length === 0) {
    return {}
  }

  // Sort blocks by start date
  const sortedBlocks = [...otherBlocks].sort((a, b) => {
    const dateA = new Date(a.start_date!).getTime()
    const dateB = new Date(b.start_date!).getTime()
    return dateA - dateB
  })

  // For now, we just prevent selecting dates that fall within any existing block
  // The min/max approach would be too restrictive if blocks aren't contiguous
  // Instead, we'll validate on change and show clear feedback

  return {}
}

/**
 * Check if a date range overlaps with any existing blocks
 */
function checkDateOverlap(
  startDate: string | null,
  endDate: string | null,
  currentBlockId: number,
  existingBlocks: ExistingBlockDateRange[]
): { hasOverlap: boolean; overlappingBlock?: ExistingBlockDateRange } {
  if (!startDate || !endDate) return { hasOverlap: false }

  const newStart = new Date(startDate).getTime()
  const newEnd = new Date(endDate).getTime()

  for (const block of existingBlocks) {
    if (block.id === currentBlockId) continue
    if (!block.start_date || !block.end_date) continue

    const blockStart = new Date(block.start_date).getTime()
    const blockEnd = new Date(block.end_date).getTime()

    // Check for overlap: two ranges overlap if one starts before the other ends
    const overlaps = newStart <= blockEnd && newEnd >= blockStart

    if (overlaps) {
      return { hasOverlap: true, overlappingBlock: block }
    }
  }

  return { hasOverlap: false }
}

/**
 * Simplified edit dialog for Individual users
 * Shows: Name, Description, Start/End dates
 * No periodization terminology (GPP, SPP, etc.)
 */
export function EditTrainingBlockDialog({
  block,
  open,
  onOpenChange,
  onSave,
  existingBlocks = [],
  onDelete,
}: EditTrainingBlockDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<TrainingBlockFormData>({
    id: 0,
    name: "",
    description: "",
    start_date: "",
    end_date: ""
  })

  useEffect(() => {
    if (block) {
      setFormData({
        id: block.id,
        name: block.name || "",
        description: block.description || "",
        start_date: block.start_date || "",
        end_date: block.end_date || ""
      })
    }
  }, [block, open])

  // Check for date overlap
  const overlapCheck = useMemo(() => {
    return checkDateOverlap(
      formData.start_date,
      formData.end_date,
      formData.id,
      existingBlocks
    )
  }, [formData.start_date, formData.end_date, formData.id, existingBlocks])

  // Validate dates
  const dateValidation = useMemo(() => {
    if (!formData.start_date || !formData.end_date) {
      return { isValid: true, message: "" }
    }

    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)

    if (end < start) {
      return { isValid: false, message: "End date must be after start date" }
    }

    if (overlapCheck.hasOverlap) {
      return {
        isValid: false,
        message: "These dates overlap with another training block. Please choose different dates."
      }
    }

    return { isValid: true, message: "" }
  }, [formData.start_date, formData.end_date, overlapCheck])

  const handleSave = async () => {
    if (!formData.name.trim()) return
    if (!dateValidation.isValid) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete?.()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const canSave = formData.name.trim().length > 0 && dateValidation.isValid

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Training Block</DialogTitle>
          <DialogDescription>
            Update your training block details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Block Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Block Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Spring Strength Block"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's the focus of this training block?"
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* Date validation error */}
            {!dateValidation.isValid && (
              <p className="text-sm text-destructive">{dateValidation.message}</p>
            )}

            {/* Helper text */}
            {existingBlocks.length > 0 && dateValidation.isValid && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  You can only have one active training block at a time.
                  Choose dates that don&apos;t overlap with your other blocks.
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {onDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Block
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving || isDeleting}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Training Block?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this training block and all its weeks, workouts, and exercises. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
