"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface EventFormData {
  id?: number
  name: string | null
  category: string | null
  type: string | null
  date?: string // UI-only field for date
}

interface EditEventDialogProps {
  event: EventFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: EventFormData) => void
  onDelete?: (id: number) => void
}

export function EditEventDialog({ event, open, onOpenChange, onSave, onDelete }: EditEventDialogProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    category: "",
    type: "race",
    date: ""
  })

  useEffect(() => {
    if (event) {
      setFormData(event)
    } else {
      setFormData({
        name: "",
        category: "",
        type: "race",
        date: ""
      })
    }
  }, [event, open])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
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
              <Label htmlFor="type">Priority</Label>
              <Select
                value={formData.type || "race"}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="race">Race</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Event Category</Label>
            <Input
              id="category"
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., 100m, 200m, Sprint"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {event?.id && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Event
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
