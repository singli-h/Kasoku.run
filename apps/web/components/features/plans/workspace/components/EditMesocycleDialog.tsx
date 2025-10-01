"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface MesocycleFormData {
  id?: number
  macrocycle_id?: number | null
  user_id?: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  metadata: {
    phase?: "GPP" | "SPP" | "Taper" | "Competition"
    color?: string
    deload?: boolean
  } | null
}

interface EditMesocycleDialogProps {
  mesocycle: MesocycleFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (mesocycle: MesocycleFormData) => void
  onDelete?: (id: number) => void
}

export function EditMesocycleDialog({ mesocycle, open, onOpenChange, onSave, onDelete }: EditMesocycleDialogProps) {
  const [formData, setFormData] = useState<MesocycleFormData>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    metadata: {
      phase: "GPP",
      color: "#10b981",
      deload: false
    }
  })

  useEffect(() => {
    if (mesocycle) {
      setFormData(mesocycle)
    } else {
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        metadata: {
          phase: "GPP",
          color: "#10b981",
          deload: false
        }
      })
    }
  }, [mesocycle, open])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (mesocycle?.id && onDelete) {
      onDelete(mesocycle.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mesocycle ? "Edit Mesocycle" : "Add Mesocycle"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Mesocycle Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Preparation Phase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Phase Type</Label>
              <Select
                value={formData.metadata?.phase || "GPP"}
                onValueChange={(value) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, phase: value as "GPP" | "SPP" | "Taper" | "Competition" }
                })}
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
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the focus and goals of this mesocycle"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.metadata?.color || "#10b981"}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, color: e.target.value }
                })}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {mesocycle?.id && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Mesocycle
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
