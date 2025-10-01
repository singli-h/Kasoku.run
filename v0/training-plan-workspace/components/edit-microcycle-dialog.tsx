"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Microcycle } from "@/lib/sample-data"

interface EditMicrocycleDialogProps {
  microcycle: Microcycle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (microcycle: Microcycle) => void
  onDelete?: (id: string) => void
}

export function EditMicrocycleDialog({ microcycle, open, onOpenChange, onSave, onDelete }: EditMicrocycleDialogProps) {
  const [formData, setFormData] = useState<Partial<Microcycle>>(
    microcycle || {
      name: "",
      weekNumber: 1,
      startDate: "",
      endDate: "",
      focus: "",
      volume: 70,
      intensity: 6,
      isDeload: false,
    },
  )

  const handleSave = () => {
    if (microcycle) {
      onSave({ ...microcycle, ...formData } as Microcycle)
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (microcycle && onDelete) {
      onDelete(microcycle.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{microcycle ? "Edit Week" : "Add Week"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Week Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Week 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number</Label>
              <Input
                id="weekNumber"
                type="number"
                value={formData.weekNumber}
                onChange={(e) => setFormData({ ...formData, weekNumber: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">Focus</Label>
            <Input
              id="focus"
              value={formData.focus}
              onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
              placeholder="e.g., Base Building, Speed Development"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (%)</Label>
              <Input
                id="volume"
                type="number"
                min="0"
                max="100"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intensity">Intensity (1-10)</Label>
              <Input
                id="intensity"
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isDeload"
              checked={formData.isDeload}
              onCheckedChange={(checked) => setFormData({ ...formData, isDeload: checked })}
            />
            <Label htmlFor="isDeload">Deload Week</Label>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {microcycle && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Week
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
