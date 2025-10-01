"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Mesocycle } from "@/lib/sample-data"

interface EditMesocycleDialogProps {
  mesocycle: Mesocycle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (mesocycle: Mesocycle) => void
  onDelete?: (id: string) => void
}

export function EditMesocycleDialog({ mesocycle, open, onOpenChange, onSave, onDelete }: EditMesocycleDialogProps) {
  const [formData, setFormData] = useState<Partial<Mesocycle>>(
    mesocycle || {
      name: "",
      phase: "GPP",
      description: "",
      color: "#10b981",
      startDate: "",
      endDate: "",
    },
  )

  const handleSave = () => {
    if (mesocycle) {
      onSave({ ...mesocycle, ...formData } as Mesocycle)
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (mesocycle && onDelete) {
      onDelete(mesocycle.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mesocycle ? "Edit Phase" : "Add Phase"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Phase Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Preparation Phase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Phase Type</Label>
              <Select
                value={formData.phase}
                onValueChange={(value) => setFormData({ ...formData, phase: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GPP">GPP - General Preparation</SelectItem>
                  <SelectItem value="SPP">SPP - Specific Preparation</SelectItem>
                  <SelectItem value="Taper">Taper</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the focus and goals of this phase"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {mesocycle && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Phase
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
