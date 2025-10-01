"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  id: number
  name: string | null
  category: string | null
  type: string | null
  date?: string
}

interface EditRaceDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: Event) => void
  onDelete?: (id: number) => void
}

export function EditRaceDialog({ event, open, onOpenChange, onSave, onDelete }: EditRaceDialogProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    name: "",
    date: "",
    type: "secondary",
    category: "race",
  })

  // Update form when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        date: event.date || "",
        type: event.type || "secondary",
        category: event.category || "race",
      })
    } else {
      setFormData({
        name: "",
        date: "",
        type: "secondary",
        category: "race",
      })
    }
  }, [event, open])

  const handleSave = () => {
    const newEvent: Event = {
      id: event?.id || Date.now(),
      name: formData.name || "",
      date: formData.date || "",
      type: formData.type || "secondary",
      category: formData.category || "race",
    }
    onSave(newEvent)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (event && onDelete) {
      if (confirm("Are you sure you want to delete this race?")) {
        onDelete(event.id)
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Race" : "Add Race"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Race Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., State Championships"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type || "secondary"}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., 100m, 200m, Marathon"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {event && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Race
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
