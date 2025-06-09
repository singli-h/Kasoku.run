"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ExerciseUISetDetail } from "@/types/exercise-planner"

interface ExerciseDetailFieldsOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setDetail?: ExerciseUISetDetail
  onSave: (changes: Partial<ExerciseUISetDetail>) => void
}

export function ExerciseDetailFieldsOverlay({
  open,
  onOpenChange,
  setDetail,
  onSave,
}: ExerciseDetailFieldsOverlayProps) {
  const [formData, setFormData] = useState<Partial<ExerciseUISetDetail>>({})

  useEffect(() => {
    if (setDetail) {
      setFormData({
        effort: setDetail.effort || "",
        tempo: setDetail.tempo || "",
        power: setDetail.power || "",
        velocity: setDetail.velocity || "",
        distance: setDetail.distance || "",
        duration: setDetail.duration || "",
        notes: setDetail.notes || "",
      })
    }
  }, [setDetail])

  const handleSave = () => {
    onSave(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exercise Set Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effort">Effort (RPE/%1RM)</Label>
              <Input
                id="effort"
                value={formData.effort || ""}
                onChange={(e) => handleChange("effort", e.target.value)}
                placeholder="e.g., 8 RPE, 85%"
              />
            </div>

            <div>
              <Label htmlFor="tempo">Tempo</Label>
              <Input
                id="tempo"
                value={formData.tempo || ""}
                onChange={(e) => handleChange("tempo", e.target.value)}
                placeholder="e.g., 3-1-2-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="power">Power (W)</Label>
              <Input
                id="power"
                type="number"
                value={formData.power || ""}
                onChange={(e) => handleChange("power", e.target.value)}
                placeholder="600"
              />
            </div>

            <div>
              <Label htmlFor="velocity">Velocity (m/s)</Label>
              <Input
                id="velocity"
                type="number"
                step="0.1"
                value={formData.velocity || ""}
                onChange={(e) => handleChange("velocity", e.target.value)}
                placeholder="1.2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="distance">Distance (m)</Label>
              <Input
                id="distance"
                type="number"
                value={formData.distance || ""}
                onChange={(e) => handleChange("distance", e.target.value)}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (s)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ""}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes for this set..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
