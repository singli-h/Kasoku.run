"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "../TrainingPlanWorkspace"

interface EditSessionDialogProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (session: Session) => void
  onDelete?: (id: number) => void
}

export function EditSessionDialog({ session, open, onOpenChange, onSave, onDelete }: EditSessionDialogProps) {
  const [formData, setFormData] = useState<Partial<Session>>({
    name: "",
    day: 1,
    type: "strength",
    duration: 60,
    volume: 70,
    intensity: 7,
    exercises: [],
  })

  // Update form when session prop changes
  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name || "",
        day: session.day || 1,
        type: session.type || "strength",
        duration: session.duration || 60,
        volume: session.volume || 70,
        intensity: session.intensity || 7,
        exercises: session.exercises || [],
      })
    } else {
      setFormData({
        name: "",
        day: 1,
        type: "strength",
        duration: 60,
        volume: 70,
        intensity: 7,
        exercises: [],
      })
    }
  }, [session, open])

  const handleSave = () => {
    const newSession: Session = {
      id: session?.id || Date.now(),
      name: formData.name || "New Session",
      day: formData.day || 1,
      type: formData.type || "strength",
      duration: formData.duration || 60,
      volume: formData.volume || 70,
      intensity: formData.intensity || 7,
      exercises: formData.exercises || [],
    }
    onSave(newSession)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (session && onDelete) {
      if (confirm("Are you sure you want to delete this session?")) {
        onDelete(session.id)
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Add Session"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Lower Body Strength"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Input
                id="day"
                type="number"
                min="1"
                max="7"
                value={formData.day || 1}
                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="240"
                step="15"
                value={formData.duration || 60}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Session Type</Label>
            <Select
              value={formData.type || "strength"}
              onValueChange={(value) => setFormData({ ...formData, type: value as Session['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speed">Speed</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
                <SelectItem value="power">Power</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {session && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Session
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
