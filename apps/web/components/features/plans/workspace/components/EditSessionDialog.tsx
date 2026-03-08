"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { Session } from "../TrainingPlanWorkspace"

interface EditSessionDialogProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (session: Session) => void
  onDelete?: (id: string) => void
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
      id: session?.id || `temp_${Date.now()}`,
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
      setDeleteConfirmOpen(true)
    }
  }

  const confirmDelete = () => {
    if (session && onDelete) {
      onDelete(session.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Add Session"}</DialogTitle>
          <DialogDescription>
            {session
              ? "Update the training session details and configuration."
              : "Create a new training session with exercises and parameters."
            }
          </DialogDescription>
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
              <Label htmlFor="day">Weekday</Label>
              <Select
                value={String(formData.day || 1)}
                onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) as number })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="7">Sunday</SelectItem>
                </SelectContent>
              </Select>
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
