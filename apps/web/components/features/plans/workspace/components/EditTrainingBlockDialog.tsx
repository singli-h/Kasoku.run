"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export interface TrainingBlockFormData {
  id: number
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
}

interface EditTrainingBlockDialogProps {
  block: TrainingBlockFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (block: TrainingBlockFormData) => Promise<void>
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
  onSave
}: EditTrainingBlockDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
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

  const handleSave = async () => {
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = formData.name.trim().length > 0

  return (
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
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
  )
}
