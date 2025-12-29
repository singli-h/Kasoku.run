"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export interface MicrocycleFormData {
  id?: number
  mesocycle_id?: number | null
  user_id?: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  // Additional UI-only fields for display
  weekNumber?: number
  volume?: number
  intensity?: number
  isDeload?: boolean
}

interface EditMicrocycleDialogProps {
  microcycle: MicrocycleFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (microcycle: MicrocycleFormData) => void
  onDelete?: (id: number) => void
}

export function EditMicrocycleDialog({ microcycle, open, onOpenChange, onSave, onDelete }: EditMicrocycleDialogProps) {
  const [formData, setFormData] = useState<MicrocycleFormData>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    weekNumber: 1,
    volume: 5,
    intensity: 6,
    isDeload: false
  })

  useEffect(() => {
    if (microcycle) {
      setFormData(microcycle)
    } else {
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        weekNumber: 1,
        volume: 5,
        intensity: 6,
        isDeload: false
      })
    }
  }, [microcycle, open])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (microcycle?.id && onDelete) {
      onDelete(microcycle.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{microcycle ? "Edit Microcycle" : "Add Microcycle"}</DialogTitle>
          <DialogDescription>
            {microcycle
              ? "Update the microcycle details for this training week."
              : "Create a new microcycle to organize your training weeks."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Name and Week Number - stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Week Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Week 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <Input
                id="weekNumber"
                type="number"
                value={formData.weekNumber || 1}
                onChange={(e) => setFormData({ ...formData, weekNumber: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Focus / Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Base Building, Speed Development"
              rows={2}
            />
          </div>

          {/* Dates - side by side on all sizes */}
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

          {/* Volume and Intensity - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (0-10)</Label>
              <Input
                id="volume"
                type="number"
                min="0"
                max="10"
                value={formData.volume ?? 5}
                onChange={(e) => setFormData({ ...formData, volume: Number.parseInt(e.target.value) || 0 })}
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Training volume scale</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intensity">Intensity (1-10)</Label>
              <Input
                id="intensity"
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={formData.intensity || 6}
                onChange={(e) => setFormData({ ...formData, intensity: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* Deload toggle */}
          <div className="flex items-center space-x-2 py-2">
            <Switch
              id="isDeload"
              checked={formData.isDeload || false}
              onCheckedChange={(checked) => setFormData({ ...formData, isDeload: checked })}
            />
            <Label htmlFor="isDeload">Deload Week</Label>
          </div>
        </div>

        {/* Footer - mobile-friendly button layout */}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {microcycle?.id && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full sm:w-auto order-last sm:order-first"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
